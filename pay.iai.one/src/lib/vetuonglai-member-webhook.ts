import { hmacSha256Hex, normalizeUrl, nowIso, readJsonBody, stringValue } from "./utils";
import { VETUONGLAI_MEMBER_WEBHOOK_URL, VETUONGLAI_SITE_CODE, VETUONGLAI_TENANT_CODE } from "./vetuonglai-contract";

export interface VetuongLaiMemberWebhookEnv {
  PAY_IAI_ONE_WEBHOOK_SECRET?: string;
}

export interface VetuongLaiMemberDispatchContext {
  payment_intent_id: string;
  internal_order_id: string;
  tenant_code: string;
  site_code: string;
  amount: number;
  currency: string;
  callback_url: string | null;
  metadata_json: Record<string, unknown>;
}

export interface VetuongLaiMemberWebhookDispatchSummary {
  ok: boolean;
  status: number;
  code: string | null;
  message: string | null;
  retryable: boolean;
  event_id?: string;
  event_type?: string;
  target_url?: string;
}

interface PreparedMemberWebhookDispatch {
  targetUrl: string;
  payload: Record<string, unknown>;
}

function normalizeOccurredAt(value: unknown): string {
  const raw = stringValue(value);
  if (!raw) return nowIso();
  const date = new Date(raw);
  return Number.isNaN(date.valueOf()) ? nowIso() : date.toISOString();
}

function buildEventId(providerEventId: string, eventType: string): string {
  const normalizedType = eventType.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
  return `evt_${providerEventId.slice(0, 24)}_${normalizedType}`;
}

export function isVetuongLaiMemberDispatchTarget(context: VetuongLaiMemberDispatchContext): boolean {
  return context.tenant_code === VETUONGLAI_TENANT_CODE && context.site_code === VETUONGLAI_SITE_CODE;
}

export function prepareVetuongLaiMemberWebhookDispatch(
  context: VetuongLaiMemberDispatchContext,
  input: {
    providerEventId: string;
    occurredAt?: unknown;
  }
): { ok: true; value: PreparedMemberWebhookDispatch } | { ok: false; code: string; message: string } {
  const metadata = readJsonBody(context.metadata_json);
  const intent = stringValue(metadata.intent);
  const pack = stringValue(metadata.pack).toLowerCase() || null;
  const candidateEmail =
    stringValue(metadata.candidate_email).toLowerCase() ||
    stringValue(metadata.email).toLowerCase() ||
    stringValue(metadata.buyer_email).toLowerCase();

  if (!candidateEmail) {
    return {
      ok: false,
      code: "CANDIDATE_EMAIL_MISSING",
      message: "candidate_email is missing from the stored checkout metadata."
    };
  }

  let eventType = "";
  let subscriptionId: string | null = null;
  let orderId: string | null = null;
  let status = "";

  if (intent === "annual-access") {
    eventType = "subscription.activated";
    subscriptionId = `sub_${context.payment_intent_id}`;
    status = "active";
  } else if (intent === "specialist-pack") {
    eventType = "order.captured";
    orderId = context.internal_order_id;
    status = "captured";
  } else {
    return {
      ok: false,
      code: "INTENT_NOT_SUPPORTED_FOR_MEMBER_WEBHOOK",
      message: "Only annual-access and specialist-pack can dispatch the current member webhook contract."
    };
  }

  const targetUrl =
    normalizeUrl(context.callback_url) ||
    normalizeUrl(metadata.member_webhook_url) ||
    VETUONGLAI_MEMBER_WEBHOOK_URL;

  if (!targetUrl) {
    return {
      ok: false,
      code: "MEMBER_WEBHOOK_URL_INVALID",
      message: "No valid member webhook URL is configured for this checkout."
    };
  }

  return {
    ok: true,
    value: {
      targetUrl,
      payload: {
        event_id: buildEventId(input.providerEventId, eventType),
        event_type: eventType,
        occurred_at: normalizeOccurredAt(input.occurredAt),
        candidate_email: candidateEmail,
        subscription_id: subscriptionId,
        order_id: orderId,
        amount: context.amount,
        currency: context.currency,
        status,
        intent,
        pack: intent === "specialist-pack" ? pack : null,
        metadata: {
          entry: stringValue(metadata.entry) || null,
          source: stringValue(metadata.source) || null,
          slug: stringValue(metadata.slug) || null,
          ref: stringValue(metadata.ref) || null
        }
      }
    }
  };
}

export async function dispatchVetuongLaiMemberWebhook(
  env: VetuongLaiMemberWebhookEnv,
  prepared: PreparedMemberWebhookDispatch
): Promise<VetuongLaiMemberWebhookDispatchSummary> {
  const secret = stringValue(env.PAY_IAI_ONE_WEBHOOK_SECRET);
  if (!secret) {
    return {
      ok: false,
      status: 503,
      code: "PAY_IAI_ONE_WEBHOOK_SECRET_MISSING",
      message: "PAY_IAI_ONE_WEBHOOK_SECRET is missing.",
      retryable: false,
      target_url: prepared.targetUrl
    };
  }

  const rawBody = JSON.stringify(prepared.payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);

  try {
    const response = await fetch(prepared.targetUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-pay-timestamp": timestamp,
        "x-pay-signature": signature
      },
      body: rawBody
    });
    const responseText = await response.text().catch(() => "");
    let responseBody: Record<string, unknown> = {};
    if (responseText) {
      try {
        responseBody = readJsonBody(JSON.parse(responseText));
      } catch (_error) {
        responseBody = {};
      }
    }
    const code = stringValue(responseBody.code) || null;
    const message = stringValue(responseBody.message) || (response.ok ? null : `Member webhook returned HTTP ${response.status}.`);

    return {
      ok: response.ok,
      status: response.status || (response.ok ? 200 : 502),
      code,
      message,
      retryable: response.status === 429 || response.status >= 500,
      event_id: stringValue(prepared.payload.event_id) || undefined,
      event_type: stringValue(prepared.payload.event_type) || undefined,
      target_url: prepared.targetUrl
    };
  } catch (error) {
    const typed = error as Error;
    return {
      ok: false,
      status: 502,
      code: "MEMBER_WEBHOOK_NETWORK_ERROR",
      message: typed.message || "Network error while delivering the member webhook.",
      retryable: true,
      event_id: stringValue(prepared.payload.event_id) || undefined,
      event_type: stringValue(prepared.payload.event_type) || undefined,
      target_url: prepared.targetUrl
    };
  }
}
