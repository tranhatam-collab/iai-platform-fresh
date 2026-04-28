/**
 * Outbound payment-completion webhook sender.
 *
 * Pay.iai.one signs and POSTs a small JSON envelope to each consumer
 * tenant's destination URL when a payment reaches a terminal state.
 *
 * Contract is locked in
 *   docs/reports/team1/TRANHATAM_COM_PAY_TEAM_WEBHOOK_AND_SECRET_ASK_2026-04-25.md
 * sections 3.2 / 3.2.1 / 3.2.2 / 3.2.3.
 *
 * Body — exactly 5 fields (do not add more — receiver does not read them):
 *   {
 *     "provider_event_id": "<idempotency key>",
 *     "order_id":          "<echo of internal_order_id from checkout>",
 *     "amount":            <integer minor units>,
 *     "currency":          "<ISO 4217>",
 *     "status":            "succeeded"
 *   }
 *
 * Headers (per tenant; for tranhatam they are x-tranhatam-*):
 *   <timestamp_header>: <unix_seconds>
 *   <signature_header>: <lowercase hex HMAC-SHA256(secret,
 *                          `${timestamp}.${rawBody}`)>
 *
 * Replay window: receiver enforces ±300s. Pay should use a fresh timestamp
 * per attempt. Idempotency key (`provider_event_id`) MUST be reused across
 * retries of the same logical event so the receiver dedupes correctly.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  getPaymentWebhookTenantConfig,
  type PaymentWebhookTenantConfig
} from "./payment-webhook-tenant-registry.js";

export type PaymentWebhookOutboundErrorCode =
  | "PAYMENT_WEBHOOK_DESTINATION_REJECTED"
  | "PAYMENT_WEBHOOK_NETWORK_ERROR"
  | "PAYMENT_WEBHOOK_PAYLOAD_INVALID"
  | "PAYMENT_WEBHOOK_SECRET_MISSING"
  | "PAYMENT_WEBHOOK_TENANT_UNKNOWN"
  | "PAYMENT_WEBHOOK_UNSUPPORTED_SCHEME";

export class PaymentWebhookOutboundError extends Error {
  constructor(
    public readonly code: PaymentWebhookOutboundErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "PaymentWebhookOutboundError";
  }
}

export type PaymentWebhookStatus = "succeeded";

/** What the caller (e.g. dispatch route) supplies for one logical event. */
export interface PaymentWebhookOutboundInput {
  /** Tenant slug, e.g. "tranhatam". */
  tenantCode: string;
  /** Pay-side UUID; reuse across retries of the same logical event. */
  providerEventId: string;
  /** Echo of the `internal_order_id` from the original checkout request. */
  orderId: string;
  /** Integer minor units. VND has no minor unit (integer VND is OK). */
  amount: number;
  /** ISO 4217. Receiver uppercases on read; we send uppercase to be explicit. */
  currency: string;
  /** Terminal status. Receiver default = "succeeded" if absent; send explicitly. */
  status?: PaymentWebhookStatus;
}

export interface PaymentWebhookOutboundConfig {
  fetchImpl?: typeof globalThis.fetch;
  /** Override env `PAYMENT_WEBHOOK_SECRET` (test injection). */
  secret?: string;
  /** Override the wall clock used for the timestamp header (test injection). */
  nowSeconds?: () => number;
  /** Override retry policy for tests. */
  retryPolicy?: PaymentWebhookRetryPolicy;
  /** Override sleep for tests (default uses real timers). */
  sleep?: (ms: number) => Promise<void>;
}

export interface PaymentWebhookRetryPolicy {
  /** Total attempts including the first send. Default 5. */
  maxAttempts: number;
  /** Initial backoff in ms; doubles each retry. Default 500. */
  initialBackoffMs: number;
  /** Cap per-retry backoff. Default 30_000. */
  maxBackoffMs: number;
}

export const DEFAULT_PAYMENT_WEBHOOK_RETRY_POLICY: PaymentWebhookRetryPolicy = {
  initialBackoffMs: 500,
  maxAttempts: 5,
  maxBackoffMs: 30_000
};

export interface PaymentWebhookAttempt {
  attempt: number;
  timestamp: number;
  signature: string;
  responseStatus: number;
  durationMs: number;
  retryable: boolean;
}

export interface PaymentWebhookOutboundResult {
  tenantCode: string;
  tenantId: string;
  destinationUrl: string;
  providerEventId: string;
  orderId: string;
  rawBody: string;
  attempts: PaymentWebhookAttempt[];
  finalStatus: number;
  delivered: boolean;
  acceptedAt: string;
}

export async function sendPaymentWebhookOutbound(
  input: PaymentWebhookOutboundInput,
  config: PaymentWebhookOutboundConfig = {}
): Promise<PaymentWebhookOutboundResult> {
  const tenant = resolveTenant(input.tenantCode);
  const body = buildPaymentWebhookBody(input);
  const rawBody = JSON.stringify(body);

  const secret = (config.secret ?? process.env.PAYMENT_WEBHOOK_SECRET ?? "").trim();
  if (!secret) {
    throw new PaymentWebhookOutboundError(
      "PAYMENT_WEBHOOK_SECRET_MISSING",
      "PAYMENT_WEBHOOK_SECRET is required before pay can sign outbound payment webhooks."
    );
  }

  if (tenant.signature_scheme !== "tranhatam_hmac_sha256_v1") {
    throw new PaymentWebhookOutboundError(
      "PAYMENT_WEBHOOK_UNSUPPORTED_SCHEME",
      `Unsupported signature scheme for tenant ${tenant.tenant_code}.`,
      { scheme: tenant.signature_scheme }
    );
  }

  const fetchImpl = config.fetchImpl ?? globalThis.fetch;
  const nowSeconds = config.nowSeconds ?? defaultNowSeconds;
  const sleep = config.sleep ?? defaultSleep;
  const policy = config.retryPolicy ?? DEFAULT_PAYMENT_WEBHOOK_RETRY_POLICY;

  const attempts: PaymentWebhookAttempt[] = [];
  let finalStatus = 0;
  let delivered = false;

  for (let attemptIndex = 0; attemptIndex < policy.maxAttempts; attemptIndex += 1) {
    const timestamp = nowSeconds();
    const signature = computePaymentWebhookSignature(secret, timestamp, rawBody);
    const startedAt = Date.now();

    let responseStatus = 0;
    let retryable = false;

    try {
      const response = await fetchImpl(tenant.destination_url, {
        body: rawBody,
        headers: {
          "Content-Type": "application/json",
          [tenant.signature_header]: signature,
          [tenant.timestamp_header]: String(timestamp)
        },
        method: "POST"
      });
      responseStatus = response.status;
      // Drain body so the connection can be reused; we do not parse it.
      try {
        await response.text();
      } catch {
        // ignore body read errors — the status code is what we trust.
      }
      retryable = isRetryableStatus(responseStatus);
    } catch (networkError) {
      retryable = true;
      attempts.push({
        attempt: attemptIndex + 1,
        durationMs: Date.now() - startedAt,
        responseStatus: 0,
        retryable,
        signature,
        timestamp
      });

      if (attemptIndex === policy.maxAttempts - 1) {
        throw new PaymentWebhookOutboundError(
          "PAYMENT_WEBHOOK_NETWORK_ERROR",
          "Network error sending payment webhook after exhausting retries.",
          {
            attempts,
            cause: networkError instanceof Error ? networkError.message : String(networkError)
          }
        );
      }
      await sleep(computeBackoffMs(attemptIndex, policy));
      continue;
    }

    attempts.push({
      attempt: attemptIndex + 1,
      durationMs: Date.now() - startedAt,
      responseStatus,
      retryable,
      signature,
      timestamp
    });
    finalStatus = responseStatus;

    if (responseStatus >= 200 && responseStatus < 300) {
      delivered = true;
      break;
    }

    if (!retryable) {
      throw new PaymentWebhookOutboundError(
        "PAYMENT_WEBHOOK_DESTINATION_REJECTED",
        `Receiver rejected payment webhook with non-retryable status ${responseStatus}.`,
        { attempts, finalStatus: responseStatus }
      );
    }

    if (attemptIndex === policy.maxAttempts - 1) {
      throw new PaymentWebhookOutboundError(
        "PAYMENT_WEBHOOK_DESTINATION_REJECTED",
        `Receiver returned retryable status ${responseStatus} after ${policy.maxAttempts} attempts.`,
        { attempts, finalStatus: responseStatus }
      );
    }

    await sleep(computeBackoffMs(attemptIndex, policy));
  }

  return {
    acceptedAt: new Date().toISOString(),
    attempts,
    delivered,
    destinationUrl: tenant.destination_url,
    finalStatus,
    orderId: input.orderId,
    providerEventId: input.providerEventId,
    rawBody,
    tenantCode: tenant.tenant_code,
    tenantId: tenant.tenant_id
  };
}

export function buildPaymentWebhookBody(input: PaymentWebhookOutboundInput): {
  amount: number;
  currency: string;
  order_id: string;
  provider_event_id: string;
  status: PaymentWebhookStatus;
} {
  const providerEventId = nonEmptyString(input.providerEventId, "providerEventId");
  const orderId = nonEmptyString(input.orderId, "orderId");
  const currency = nonEmptyString(input.currency, "currency").toUpperCase();
  const amount = input.amount;

  if (!Number.isInteger(amount) || amount < 0) {
    throw new PaymentWebhookOutboundError(
      "PAYMENT_WEBHOOK_PAYLOAD_INVALID",
      "amount must be a non-negative integer (minor units where applicable).",
      { amount }
    );
  }

  return {
    amount,
    currency,
    order_id: orderId,
    provider_event_id: providerEventId,
    status: input.status ?? "succeeded"
  };
}

/**
 * `signing_input = `${timestamp}.${rawBody}`` then hex(HMAC_SHA256(secret, signing_input)).
 * Hex output is lowercase to match the Node / Go default and avoid case-mismatch debugging
 * (the receiver lowercases on read at commerce.ts:93, so any case works on the wire).
 */
export function computePaymentWebhookSignature(
  secret: string,
  timestamp: number,
  rawBody: string
): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

/**
 * Constant-time signature compare. Exported for the test suite + any future
 * internal verification helper.
 */
export function paymentWebhookSignaturesEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a.trim().toLowerCase(), "utf8");
  const bBuf = Buffer.from(b.trim().toLowerCase(), "utf8");
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

function resolveTenant(tenantCode: string): PaymentWebhookTenantConfig {
  const normalized = tenantCode.trim().toLowerCase();
  if (!normalized) {
    throw new PaymentWebhookOutboundError(
      "PAYMENT_WEBHOOK_PAYLOAD_INVALID",
      "tenantCode is required."
    );
  }
  const tenant = getPaymentWebhookTenantConfig(normalized);
  if (!tenant) {
    throw new PaymentWebhookOutboundError(
      "PAYMENT_WEBHOOK_TENANT_UNKNOWN",
      `No outbound webhook destination registered for tenant_code ${normalized}.`,
      { tenant_code: normalized }
    );
  }
  return tenant;
}

function nonEmptyString(value: string | undefined, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new PaymentWebhookOutboundError(
      "PAYMENT_WEBHOOK_PAYLOAD_INVALID",
      `${field} is required.`,
      { field }
    );
  }
  return value.trim();
}

function isRetryableStatus(status: number): boolean {
  // Retry on 408, 429, and any 5xx. All other 4xx are caller errors.
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}

function computeBackoffMs(attemptIndex: number, policy: PaymentWebhookRetryPolicy): number {
  const exponent = Math.pow(2, attemptIndex);
  return Math.min(policy.initialBackoffMs * exponent, policy.maxBackoffMs);
}

function defaultNowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
