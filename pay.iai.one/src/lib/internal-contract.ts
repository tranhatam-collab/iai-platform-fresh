import type { PersistedPaymentIntent } from "./db";
import { validatePaymentAmount } from "./error-codes";
import { readJsonBody, normalizeUrl, scalarValue, stringValue, integerValue, sha256Hex } from "./utils";

export const INTERNAL_CONTRACT_VERSION = "2026-04-15";
export const INTERNAL_CHECKOUT_ROUTE = "/internal/checkout-session";
export const INTERNAL_ORDER_STATUS_ROUTE = "/internal/order-status";
export const INTERNAL_LIVE_PROVIDER = "payos";
export const INTERNAL_LIVE_CURRENCY = "VND";
export const INTERNAL_PLANNED_EVENT_TYPES = [
  "payment.succeeded",
  "payment.failed",
  "subscription.activated",
  "subscription.cancelled",
  "subscription.expired",
  "refund.created"
] as const;

export interface InternalCheckoutSessionRequest {
  tenant_code: string;
  site_code: string;
  internal_order_id: string;
  provider: string;
  plan_code?: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  success_url: string;
  cancel_url: string;
  callback_url?: string;
  user_id?: string;
  email?: string;
  full_name?: string;
  locale?: string;
  ref_code?: string;
  description: string;
  metadata: Record<string, unknown>;
}

export interface InternalCheckoutSessionContractResponse {
  ok: boolean;
  success: boolean;
  contract_version: string;
  provider: string;
  payment_session_id: string | null;
  internal_order_id: string;
  checkout_url: string | null;
  qr_code?: string | null;
  bank_bin?: string | null;
  account_no?: string | null;
  account_name?: string | null;
  transfer_note?: string | null;
  expires_at: string | null;
  amount: number;
  currency: string;
  status: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  persistence: Record<string, unknown> | null;
  reused?: boolean;
  code?: string | null;
  message?: string | null;
  missing_env_keys?: string[];
}

export interface InternalCheckoutAttemptSummary {
  provider_order_id: string | null;
  provider_transaction_id: string | null;
  provider_payment_url: string | null;
  response_json?: Record<string, unknown>;
}

/**
 * Live internal checkout currently targets payOS-first VND rails.
 * Keep the generated description short enough for the strictest documented payOS rail.
 */
function truncateDescription(value: string): string {
  return value.slice(0, 9);
}

export function validateInternalCheckoutRequest(input: unknown):
  | { ok: true; value: InternalCheckoutSessionRequest }
  | { ok: false; status: number; body: Record<string, unknown> } {
  const body = readJsonBody(input);
  const tenantCode = stringValue(body.tenant_code);
  const siteCode = stringValue(body.site_code);
  const internalOrderId = stringValue(body.internal_order_id || body.payment_session_id);
  const provider = stringValue(body.provider).toLowerCase() || INTERNAL_LIVE_PROVIDER;
  const amount = integerValue(body.amount);
  const currency = stringValue(body.currency).toUpperCase() || INTERNAL_LIVE_CURRENCY;
  const billingCycle = stringValue(body.billing_cycle).toLowerCase() || "one_time";
  const successUrl = normalizeUrl(body.success_url);
  const cancelUrl = normalizeUrl(body.cancel_url);
  const callbackUrl = normalizeUrl(body.callback_url);
  const descriptionSeed =
    stringValue(body.description) ||
    stringValue(body.plan_code) ||
    internalOrderId ||
    `${siteCode}-checkout`;
  const description = truncateDescription(descriptionSeed);

  if (!tenantCode || !siteCode || !internalOrderId || !amount || !successUrl || !cancelUrl) {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        success: false,
        contract_version: INTERNAL_CONTRACT_VERSION,
        code: "INTERNAL_CONTRACT_INVALID",
        message: "tenant_code, site_code, internal_order_id, amount, success_url, cancel_url are required."
      }
    };
  }

  if (provider !== INTERNAL_LIVE_PROVIDER) {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        success: false,
        contract_version: INTERNAL_CONTRACT_VERSION,
        code: "PROVIDER_NOT_READY",
        message: "Only payOS is live on the internal contract today.",
        live_provider: INTERNAL_LIVE_PROVIDER
      }
    };
  }

  if (currency !== INTERNAL_LIVE_CURRENCY) {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        success: false,
        contract_version: INTERNAL_CONTRACT_VERSION,
        code: "UNSUPPORTED_CURRENCY",
        message: "The live internal contract only supports VND today.",
        live_currency: INTERNAL_LIVE_CURRENCY
      }
    };
  }

  if (billingCycle !== "one_time") {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        success: false,
        contract_version: INTERNAL_CONTRACT_VERSION,
        code: "UNSUPPORTED_BILLING_CYCLE",
        message: "The live internal contract only supports one_time checkout today.",
        live_billing_cycle: "one_time"
      }
    };
  }

  const amountError = validatePaymentAmount(amount, currency);
  if (amountError) {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        success: false,
        contract_version: INTERNAL_CONTRACT_VERSION,
        code: amountError.code,
        message: amountError.message
      }
    };
  }

  return {
    ok: true,
    value: {
      tenant_code: tenantCode,
      site_code: siteCode,
      internal_order_id: internalOrderId,
      provider,
      plan_code: stringValue(body.plan_code) || undefined,
      amount,
      currency,
      billing_cycle: billingCycle,
      success_url: successUrl,
      cancel_url: cancelUrl,
      callback_url: callbackUrl || undefined,
      user_id: stringValue(body.user_id) || undefined,
      email: stringValue(body.email) || undefined,
      full_name: stringValue(body.full_name) || undefined,
      locale: stringValue(body.locale) || undefined,
      ref_code: stringValue(body.ref_code) || undefined,
      description,
      metadata: readJsonBody(body.metadata)
    }
  };
}

export async function generateProviderOrderCode(input: {
  tenantCode: string;
  siteCode: string;
  internalOrderId: string;
}): Promise<number> {
  const digest = await sha256Hex(`${input.tenantCode}:${input.siteCode}:${input.internalOrderId}`);
  const value = BigInt(`0x${digest.slice(0, 13)}`);
  const min = 1_000_000_000_000n;
  const span = 8_000_000_000_000n;
  return Number((value % span) + min);
}

export async function toProviderCheckoutPayload(input: InternalCheckoutSessionRequest) {
  return {
    provider: input.provider,
    tenant_code: input.tenant_code,
    site_code: input.site_code,
    order_id: input.internal_order_id,
    order_code: await generateProviderOrderCode({
      tenantCode: input.tenant_code,
      siteCode: input.site_code,
      internalOrderId: input.internal_order_id
    }),
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    return_url: input.success_url,
    cancel_url: input.cancel_url,
    buyer_name: input.full_name,
    buyer_email: input.email,
    metadata: {
      plan_code: input.plan_code || null,
      billing_cycle: input.billing_cycle,
      callback_url: input.callback_url || null,
      user_id: input.user_id || null,
      email: input.email || null,
      full_name: input.full_name || null,
      locale: input.locale || null,
      ref_code: input.ref_code || null,
      ...input.metadata
    }
  };
}

export function buildInternalCheckoutResponse(
  input: InternalCheckoutSessionRequest,
  status: number,
  body: Record<string, unknown>
): InternalCheckoutSessionContractResponse {
  const persistence = readJsonBody(body.persistence);
  const normalized = readJsonBody(body.normalized);
  const rawData = readJsonBody(readJsonBody(body.raw).data);
  const missingEnvKeys = Array.isArray(body.missing_env_keys)
    ? body.missing_env_keys.filter((item): item is string => typeof item === "string")
    : undefined;
  const provider = stringValue(body.provider) || input.provider;
  const checkoutUrl = stringValue(normalized.checkout_url) || null;
  const ok = Boolean(body.ok);

  return {
    ok,
    success: ok,
    contract_version: INTERNAL_CONTRACT_VERSION,
    provider,
    payment_session_id: stringValue(persistence.payment_intent_id) || null,
    internal_order_id: input.internal_order_id,
    checkout_url: checkoutUrl,
    qr_code: stringValue(normalized.qr_code) || null,
    bank_bin: stringValue(normalized.bank_bin) || stringValue(rawData.bin) || null,
    account_no: stringValue(normalized.account_no) || stringValue(rawData.accountNumber) || null,
    account_name: stringValue(normalized.account_name) || stringValue(rawData.accountName) || null,
    transfer_note: stringValue(normalized.transfer_note) || stringValue(rawData.description) || null,
    expires_at: stringValue(normalized.expired_at) || null,
    amount: input.amount,
    currency: input.currency,
    status: stringValue(normalized.status) || (ok ? "created" : stringValue(body.code) || "error"),
    provider_order_id: scalarValue(normalized.order_code) || null,
    provider_payment_id: scalarValue(normalized.payment_link_id) || null,
    persistence: Object.keys(persistence).length ? persistence : null,
    code: scalarValue(body.code) || null,
    message: stringValue(body.message || body.desc) || null,
    missing_env_keys: missingEnvKeys
  };
}

export function buildInternalExistingCheckoutResponse(
  payment: PersistedPaymentIntent,
  attempts: InternalCheckoutAttemptSummary[]
): InternalCheckoutSessionContractResponse {
  const latestAttempt = attempts[0];
  const latestResponse = readJsonBody(latestAttempt?.response_json);
  const normalized = readJsonBody(latestResponse.normalized);
  const rawData = readJsonBody(readJsonBody(latestResponse.raw).data);
  return {
    ok: true,
    success: true,
    contract_version: INTERNAL_CONTRACT_VERSION,
    provider: payment.provider_code || INTERNAL_LIVE_PROVIDER,
    payment_session_id: payment.id,
    internal_order_id: payment.internal_order_id,
    checkout_url: latestAttempt?.provider_payment_url || null,
    qr_code: stringValue(normalized.qr_code) || null,
    bank_bin: stringValue(normalized.bank_bin) || stringValue(rawData.bin) || null,
    account_no: stringValue(normalized.account_no) || stringValue(rawData.accountNumber) || null,
    account_name: stringValue(normalized.account_name) || stringValue(rawData.accountName) || null,
    transfer_note: stringValue(normalized.transfer_note) || stringValue(rawData.description) || null,
    expires_at: null,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.payment_status,
    provider_order_id: latestAttempt?.provider_order_id || null,
    provider_payment_id: latestAttempt?.provider_transaction_id || null,
    persistence: {
      payment_intent_id: payment.id,
      internal_order_id: payment.internal_order_id,
      tenant_code: payment.tenant_code,
      site_code: payment.site_code
    },
    reused: true,
    code: null,
    message: "Existing checkout session returned for this internal_order_id."
  };
}

export function buildInternalOpenApiSpec(baseUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "pay.iai.one Internal Contract",
      version: INTERNAL_CONTRACT_VERSION,
      description: "Live internal contract for trusted ecosystem consumers. Current live mode is payOS-first, VND, one_time checkout."
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "Worker health response"
            }
          }
        }
      },
      "/v1/providers": {
        get: {
          summary: "List provider registry",
          responses: {
            "200": {
              description: "Registered providers"
            }
          }
        }
      },
      "/internal/checkout-session": {
        post: {
          summary: "Create one internal checkout session",
          description: "Live today for payOS, VND, one_time only.",
          parameters: [
            {
              in: "header",
              name: "x-idempotency-key",
              required: true,
              schema: { type: "string" }
            },
            {
              in: "header",
              name: "x-site-key",
              required: true,
              schema: { type: "string" }
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "tenant_code",
                    "site_code",
                    "internal_order_id",
                    "amount",
                    "currency",
                    "billing_cycle",
                    "success_url",
                    "cancel_url"
                  ],
                  properties: {
                    tenant_code: { type: "string" },
                    site_code: { type: "string" },
                    internal_order_id: { type: "string" },
                    provider: { type: "string", default: INTERNAL_LIVE_PROVIDER },
                    plan_code: { type: "string" },
                    amount: { type: "integer" },
                    currency: { type: "string", enum: [INTERNAL_LIVE_CURRENCY] },
                    billing_cycle: { type: "string", enum: ["one_time"] },
                    success_url: { type: "string", format: "uri" },
                    cancel_url: { type: "string", format: "uri" },
                    callback_url: { type: "string", format: "uri" },
                    user_id: { type: "string" },
                    email: { type: "string", format: "email" },
                    full_name: { type: "string" },
                    locale: { type: "string" },
                    ref_code: { type: "string" },
                    description: { type: "string" },
                    metadata: { type: "object", additionalProperties: true }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Checkout session created"
            },
            "200": {
              description: "Existing checkout session reused"
            },
            "409": {
              description: "Idempotency mismatch or order conflict"
            },
            "422": {
              description: "Contract validation error"
            },
            "503": {
              description: "Provider credentials missing"
            }
          }
        }
      },
      "/v1/payments/{internal_order_id}": {
        get: {
          summary: "Read payment record by internal order id",
          parameters: [
            {
              in: "path",
              name: "internal_order_id",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "Payment intent with attempts and provider events"
            },
            "404": {
              description: "Payment not found"
            }
          }
        }
      }
    }
  };
}

export function renderInternalDocsHtml(baseUrl: string): string {
  const sampleRequest = {
    tenant_code: "lamviecmuonnoi",
    site_code: "lamviecmuonnoi",
    internal_order_id: "ord_20260415_001",
    provider: "payos",
    plan_code: "starter",
    amount: 3000,
    currency: "VND",
    billing_cycle: "one_time",
    success_url: "https://lamviecmuonnoi.com/checkout/success",
    cancel_url: "https://lamviecmuonnoi.com/pricing",
    callback_url: "https://api.lamviecmuonnoi.com/payments/webhook/iai-pay",
    user_id: "user_123",
    email: "user@example.com",
    full_name: "Nguyen Lan Anh",
    locale: "vi",
    ref_code: "abc123"
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>pay.iai.one internal contract</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; background: #0b1020; color: #f5f7fb; }
      main { max-width: 960px; margin: 0 auto; padding: 32px 20px 64px; }
      h1, h2 { margin: 0 0 12px; }
      p, li { line-height: 1.6; color: #d9dfeb; }
      code, pre { font-family: ui-monospace, SFMono-Regular, monospace; }
      pre { background: #111831; padding: 16px; border-radius: 8px; overflow: auto; }
      a { color: #8fc6ff; }
      .band { padding: 18px 0; border-top: 1px solid rgba(255,255,255,0.08); }
      .tag { display: inline-block; padding: 3px 8px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; margin-right: 8px; margin-bottom: 8px; }
    </style>
  </head>
  <body>
    <main>
      <h1>pay.iai.one internal contract</h1>
      <p>Version ${INTERNAL_CONTRACT_VERSION}. Live today for <strong>payOS</strong>, <strong>VND</strong>, <strong>one_time</strong> checkout. Subscription lifecycle and downstream webhook events are still planned, not live.</p>
      <div class="band">
        <h2>Live endpoints</h2>
        <ul>
          <li><code>GET ${baseUrl}/health</code></li>
          <li><code>GET ${baseUrl}/v1/providers</code></li>
          <li><code>POST ${baseUrl}${INTERNAL_CHECKOUT_ROUTE}</code></li>
          <li><code>POST ${baseUrl}/api/v1/checkout/session</code> for Về Tương Lai</li>
          <li><code>GET ${baseUrl}/v1/payments/:internal_order_id</code></li>
        </ul>
        <p><a href="${baseUrl}/openapi.json">OpenAPI JSON</a></p>
      </div>
      <div class="band">
        <h2>Contract truth</h2>
        <span class="tag">provider=payos only</span>
        <span class="tag">currency=VND only</span>
        <span class="tag">billing_cycle=one_time only</span>
        <span class="tag">x-idempotency-key required</span>
        <span class="tag">x-site-key required</span>
      </div>
      <div class="band">
        <h2>Sample request</h2>
        <pre>${JSON.stringify(sampleRequest, null, 2)}</pre>
      </div>
      <div class="band">
        <h2>Planned, not live yet</h2>
        <ul>
          ${INTERNAL_PLANNED_EVENT_TYPES.map((item) => `<li><code>${item}</code></li>`).join("")}
        </ul>
      </div>
    </main>
  </body>
</html>`;
}
