import { hmacSha256Hex, normalizeUrl, readJsonBody, stringValue } from "./utils";

export interface TenantPaymentCallbackInput {
  callbackUrl: string;
  callbackHmac: string;
  providerEventId: string;
  providerOrderId: string;
  internalOrderId: string;
  amount: number;
  currency: string;
  metadata: Record<string, unknown> | null;
}

export interface TenantPaymentCallbackResult {
  ok: boolean;
  status: number;
  code: string;
  message: string;
  retryable: boolean;
  target_url: string;
}

export async function dispatchTenantPaymentCallback(
  input: TenantPaymentCallbackInput
): Promise<TenantPaymentCallbackResult> {
  const targetUrl = normalizeUrl(input.callbackUrl);
  if (!targetUrl || !targetUrl.startsWith("https://")) {
    return {
      ok: false,
      status: 0,
      code: "TENANT_CALLBACK_URL_INVALID",
      message: "Tenant callback URL must be a registered HTTPS URL.",
      retryable: false,
      target_url: input.callbackUrl
    };
  }
  if (!input.callbackHmac) {
    return {
      ok: false,
      status: 0,
      code: "TENANT_CALLBACK_SECRET_MISSING",
      message: "Tenant callback HMAC binding is missing.",
      retryable: true,
      target_url: targetUrl
    };
  }

  const payload = {
    event_id: input.providerEventId,
    event_type: "payment.completed",
    order_id: input.providerOrderId,
    provider_order_id: input.providerOrderId,
    internal_order_id: input.internalOrderId,
    amount: input.amount,
    currency: input.currency,
    metadata: readJsonBody(input.metadata)
  };
  const rawBody = JSON.stringify(payload);
  const signature = await hmacSha256Hex(input.callbackHmac, rawBody);

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-iai-signature": signature,
        "x-idempotency-key": `pay:${input.providerEventId}`,
        "x-pay-provider": "payos"
      },
      body: rawBody
    });
    const responseText = (await response.text().catch(() => "")).slice(0, 500);
    return {
      ok: response.ok,
      status: response.status,
      code: response.ok ? "TENANT_CALLBACK_DELIVERED" : "TENANT_CALLBACK_REJECTED",
      message: response.ok ? "Tenant payment callback delivered." : stringValue(responseText) || `HTTP ${response.status}`,
      retryable: response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500,
      target_url: targetUrl
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      code: "TENANT_CALLBACK_NETWORK_ERROR",
      message: String((error as Error).message || error),
      retryable: true,
      target_url: targetUrl
    };
  }
}
