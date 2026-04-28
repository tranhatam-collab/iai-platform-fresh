import { json } from "./http";
import { hmacSha256Hex, integerValue, isObject, normalizeUrl, queryStringFromObject, readJsonBody, scalarValue, stringValue, timingSafeEqual } from "./utils";

const PAYOS_API_BASE = "https://api-merchant.payos.vn";

export interface PayOSEnv {
  PAYOS_CLIENT_ID?: string;
  PAYOS_API_KEY?: string;
  PAYOS_CHECKSUM_KEY?: string;
  PAYOS_PARTNER_CODE?: string;
}

export interface CreatePayOSCheckoutPayload {
  tenant_code: string;
  site_code: string;
  order_id: string;
  order_code: number;
  amount: number;
  description: string;
  return_url: string;
  cancel_url: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_address?: string;
  items?: Array<Record<string, unknown>>;
  expired_at?: number;
  metadata?: Record<string, unknown>;
}

export interface PayOSHttpResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

function payosHeaders(env: PayOSEnv): HeadersInit {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-client-id": String(env.PAYOS_CLIENT_ID || ""),
    "x-api-key": String(env.PAYOS_API_KEY || "")
  };

  if (env.PAYOS_PARTNER_CODE) headers["x-partner-code"] = env.PAYOS_PARTNER_CODE;
  return headers;
}

export function missingPayOSEnv(env: PayOSEnv): string[] {
  return ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY"].filter(
    (key) => !env[key as keyof PayOSEnv]
  );
}

export function createPaymentRequestSignatureInput(payload: {
  amount: number;
  cancelUrl: string;
  description: string;
  orderCode: number;
  returnUrl: string;
}): string {
  return `amount=${payload.amount}&cancelUrl=${payload.cancelUrl}&description=${payload.description}&orderCode=${payload.orderCode}&returnUrl=${payload.returnUrl}`;
}

export async function createPaymentRequestSignature(
  checksumKey: string,
  payload: {
    amount: number;
    cancelUrl: string;
    description: string;
    orderCode: number;
    returnUrl: string;
  }
): Promise<string> {
  return hmacSha256Hex(checksumKey, createPaymentRequestSignatureInput(payload));
}

export async function verifyPayOSWebhookSignature(
  checksumKey: string,
  data: Record<string, unknown>,
  signature: string
): Promise<boolean> {
  const query = queryStringFromObject(data);
  const expected = await hmacSha256Hex(checksumKey, query);
  return timingSafeEqual(expected.toLowerCase(), String(signature || "").toLowerCase());
}

export function validatePayOSCheckoutPayload(input: unknown):
  | { ok: true; value: CreatePayOSCheckoutPayload }
  | { ok: false; response: Response } {
  const body = readJsonBody(input);
  const tenantCode = stringValue(body.tenant_code);
  const siteCode = stringValue(body.site_code);
  const orderId = stringValue(body.order_id);
  const orderCode = integerValue(body.order_code);
  const amount = integerValue(body.amount);
  const returnUrl = normalizeUrl(body.return_url);
  const cancelUrl = normalizeUrl(body.cancel_url);
  const description = stringValue(body.description || body.order_id).slice(0, 25);

  if (!tenantCode || !siteCode || !orderId || !orderCode || !amount || !returnUrl || !cancelUrl || !description) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          code: "PAYOS_PAYLOAD_INVALID",
          message: "tenant_code, site_code, order_id, order_code, amount, description, return_url, cancel_url are required."
        },
        422
      )
    };
  }

  if (amount <= 0) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          code: "PAYOS_AMOUNT_INVALID",
          message: "amount must be a positive integer in VND."
        },
        422
      )
    };
  }

  return {
    ok: true,
    value: {
      tenant_code: tenantCode,
      site_code: siteCode,
      order_id: orderId,
      order_code: orderCode,
      amount,
      description,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      buyer_name: stringValue(body.buyer_name) || undefined,
      buyer_email: stringValue(body.buyer_email) || undefined,
      buyer_phone: stringValue(body.buyer_phone) || undefined,
      buyer_address: stringValue(body.buyer_address) || undefined,
      items: Array.isArray(body.items) ? (body.items.filter(isObject) as Array<Record<string, unknown>>) : undefined,
      expired_at: integerValue(body.expired_at) || undefined,
      metadata: isObject(body.metadata) ? body.metadata : undefined
    }
  };
}

export async function createPayOSCheckoutSession(env: PayOSEnv, payload: CreatePayOSCheckoutPayload): Promise<PayOSHttpResult> {
  const missing = missingPayOSEnv(env);
  if (missing.length > 0) {
    return {
      ok: false,
      status: 503,
      body: {
        ok: false,
        code: "PAYOS_ENV_MISSING",
        message: "payOS credentials are missing.",
        missing_env_keys: missing
      }
    };
  }

  const signature = await createPaymentRequestSignature(String(env.PAYOS_CHECKSUM_KEY), {
    amount: payload.amount,
    cancelUrl: payload.cancel_url,
    description: payload.description,
    orderCode: payload.order_code,
    returnUrl: payload.return_url
  });

  const requestBody = {
    orderCode: payload.order_code,
    amount: payload.amount,
    description: payload.description,
    cancelUrl: payload.cancel_url,
    returnUrl: payload.return_url,
    buyerName: payload.buyer_name,
    buyerEmail: payload.buyer_email,
    buyerPhone: payload.buyer_phone,
    buyerAddress: payload.buyer_address,
    items: payload.items,
    expiredAt: payload.expired_at,
    signature
  };

  const response = await fetch(`${PAYOS_API_BASE}/v2/payment-requests`, {
    method: "POST",
    headers: payosHeaders(env),
    body: JSON.stringify(requestBody)
  });

  const body = await response.json().catch(() => ({}));
  const bodyObject = isObject(body) ? body : {};
  const data = isObject(bodyObject.data) ? bodyObject.data : {};
  const providerCode = scalarValue(bodyObject.code);
  const providerSuccess = response.ok && providerCode === "00";

  return {
    ok: providerSuccess,
    status: providerSuccess ? 201 : response.status >= 400 ? response.status : 502,
    body: {
      ok: providerSuccess,
      provider: "payos",
      code: providerCode || null,
      desc: stringValue(bodyObject.desc) || null,
      normalized: {
        payment_link_id: scalarValue(data.paymentLinkId) || scalarValue(data.id) || null,
        order_code: scalarValue(data.orderCode) || String(payload.order_code),
        amount: integerValue(data.amount) || payload.amount,
        status: scalarValue(data.status) || null,
        checkout_url: stringValue(data.checkoutUrl) || null,
        qr_code: stringValue(data.qrCode) || null
      },
      raw: bodyObject
    }
  };
}

export async function getPayOSPaymentRequest(env: PayOSEnv, id: string): Promise<PayOSHttpResult> {
  const missing = missingPayOSEnv(env);
  if (missing.length > 0) {
    return {
      ok: false,
      status: 503,
      body: {
        ok: false,
        code: "PAYOS_ENV_MISSING",
        message: "payOS credentials are missing.",
        missing_env_keys: missing
      }
    };
  }

  const response = await fetch(`${PAYOS_API_BASE}/v2/payment-requests/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: payosHeaders(env)
  });

  const body = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.ok ? 200 : response.status || 502,
    body: {
      ok: response.ok,
      provider: "payos",
      raw: body
    }
  };
}

export async function cancelPayOSPaymentRequest(env: PayOSEnv, id: string, cancellationReason?: string): Promise<PayOSHttpResult> {
  const missing = missingPayOSEnv(env);
  if (missing.length > 0) {
    return {
      ok: false,
      status: 503,
      body: {
        ok: false,
        code: "PAYOS_ENV_MISSING",
        message: "payOS credentials are missing.",
        missing_env_keys: missing
      }
    };
  }

  const response = await fetch(`${PAYOS_API_BASE}/v2/payment-requests/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    headers: payosHeaders(env),
    body: JSON.stringify({
      cancellationReason: stringValue(cancellationReason) || "Cancelled by merchant"
    })
  });

  const body = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.ok ? 200 : response.status || 502,
    body: {
      ok: response.ok,
      provider: "payos",
      raw: body
    }
  };
}

export async function confirmPayOSWebhook(env: PayOSEnv, webhookUrl: string): Promise<PayOSHttpResult> {
  const missing = missingPayOSEnv(env);
  if (missing.length > 0) {
    return {
      ok: false,
      status: 503,
      body: {
        ok: false,
        code: "PAYOS_ENV_MISSING",
        message: "payOS credentials are missing.",
        missing_env_keys: missing
      }
    };
  }

  const normalizedWebhookUrl = normalizeUrl(webhookUrl);
  if (!normalizedWebhookUrl) {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        code: "WEBHOOK_URL_INVALID",
        message: "A valid webhookUrl is required."
      }
    };
  }

  const response = await fetch(`${PAYOS_API_BASE}/confirm-webhook`, {
    method: "POST",
    headers: payosHeaders(env),
    body: JSON.stringify({ webhookUrl: normalizedWebhookUrl })
  });

  const body = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.ok ? 200 : response.status || 502,
    body: {
      ok: response.ok,
      provider: "payos",
      raw: body
    }
  };
}

export async function handlePayOSWebhook(env: PayOSEnv, request: Request, tenantCode: string): Promise<PayOSHttpResult> {
  const body = await request.json().catch(() => null);
  const payload = readJsonBody(body);
  const data = readJsonBody(payload.data);
  const signature = stringValue(payload.signature);

  if (!tenantCode) {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        code: "TENANT_REQUIRED",
        message: "tenant_code is required in the webhook path."
      }
    };
  }

  if (!signature || Object.keys(data).length === 0) {
    return {
      ok: false,
      status: 400,
      body: {
        ok: false,
        code: "PAYOS_WEBHOOK_INVALID",
        message: "Webhook payload must include data and signature."
      }
    };
  }

  const missing = missingPayOSEnv(env);
  if (missing.length > 0) {
    return {
      ok: false,
      status: 503,
      body: {
        ok: false,
        code: "PAYOS_ENV_MISSING",
        message: "payOS credentials are missing.",
        missing_env_keys: missing
      }
    };
  }

  const signatureValid = await verifyPayOSWebhookSignature(String(env.PAYOS_CHECKSUM_KEY), data, signature);
  return {
    ok: signatureValid,
    status: signatureValid ? 202 : 401,
    body: {
      ok: signatureValid,
      provider: "payos",
      tenant_code: tenantCode,
      signature_valid: signatureValid,
      webhook: {
        order_code: data.orderCode || null,
        payment_link_id: data.paymentLinkId || null,
        amount: data.amount || null,
        status_code: data.code || payload.code || null,
        status_desc: data.desc || payload.desc || null,
        transaction_time: data.transactionDateTime || null
      },
      raw: payload
    }
  };
}
