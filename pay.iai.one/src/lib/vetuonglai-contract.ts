import type { InternalCheckoutSessionContractResponse } from "./internal-contract";
import { normalizeUrl, readJsonBody, scalarValue, stringValue } from "./utils";

export const VETUONGLAI_CHECKOUT_ROUTE = "/api/v1/checkout/session";
export const VETUONGLAI_TENANT_CODE = "vetuonglai";
export const VETUONGLAI_SITE_CODE = "vetuonglai-member";
export const VETUONGLAI_MEMBER_WEBHOOK_URL = "https://member.vetuonglai.com/api/access/webhooks/pay/iai-one";
export const VETUONGLAI_WEBHOOK_EVENT_TYPES = [
  "subscription.activated",
  "subscription.renewed",
  "subscription.past_due",
  "subscription.cancelled",
  "order.captured",
  "order.refunded"
] as const;
export const VETUONGLAI_TEAM1_ENV_KEYS = [
  "PAY_IAI_ONE_BASE_URL",
  "PAY_IAI_ONE_API_KEY",
  "PAY_IAI_ONE_WEBHOOK_SECRET",
  "PAY_IAI_ONE_ANNUAL_PLAN_CODE",
  "PAY_IAI_ONE_PACK_CODE_MAP_JSON",
  "PAY_IAI_ONE_TIMEOUT_MS"
] as const;
export const VETUONGLAI_ALLOWED_PACKS = ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9"] as const;

type VetuongLaiIntent = "annual-access" | "specialist-pack";
type VetuongLaiPack = (typeof VETUONGLAI_ALLOWED_PACKS)[number];

export interface VetuongLaiCheckoutRequest {
  intent: VetuongLaiIntent;
  pack?: VetuongLaiPack;
  candidate_email: string;
  entry?: string;
  source?: string;
  lang?: string;
  return_url: string;
  cancel_url: string;
  metadata: Record<string, unknown>;
}

interface CatalogEntry {
  code: string;
  amount: number;
  currency: string;
  description: string;
}

interface VetuongLaiCatalog {
  annual: CatalogEntry;
  packs: Partial<Record<VetuongLaiPack, CatalogEntry>>;
}

export interface VetuongLaiResolvedProduct extends CatalogEntry {
  intent: VetuongLaiIntent;
  pack?: VetuongLaiPack;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function catalogEntryFromUnknown(input: unknown): CatalogEntry | null {
  const body = readJsonBody(input);
  const code = stringValue(body.code || body.plan_code || body.pack_code);
  const currency = stringValue(body.currency).toUpperCase();
  const amount = Number(body.amount);
  const description = stringValue(body.description || code);

  if (!code || !currency || !Number.isFinite(amount) || amount <= 0 || !description) return null;
  return {
    code,
    amount: Math.trunc(amount),
    currency,
    description: description.slice(0, 25)
  };
}

export function parseVetuongLaiCatalog(raw: string | undefined):
  | { ok: true; value: VetuongLaiCatalog }
  | { ok: false; code: string; message: string } {
  if (!raw) {
    return {
      ok: false,
      code: "CATALOG_NOT_READY",
      message: "VETUONGLAI_PRODUCT_CATALOG_JSON is missing on pay.iai.one."
    };
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch (_error) {
    return {
      ok: false,
      code: "CATALOG_INVALID",
      message: "VETUONGLAI_PRODUCT_CATALOG_JSON must be valid JSON."
    };
  }

  const body = readJsonBody(parsed);
  const annual = catalogEntryFromUnknown(body["annual-access"]);
  const specialist = readJsonBody(body["specialist-pack"]);
  const packs = Object.fromEntries(
    VETUONGLAI_ALLOWED_PACKS.map((pack) => [pack, catalogEntryFromUnknown(specialist[pack]) || undefined])
  ) as Partial<Record<VetuongLaiPack, CatalogEntry>>;

  if (!annual) {
    return {
      ok: false,
      code: "CATALOG_INVALID",
      message: "Catalog entry annual-access is missing or invalid."
    };
  }

  return {
    ok: true,
    value: {
      annual,
      packs
    }
  };
}

export function validateVetuongLaiCheckoutRequest(input: unknown):
  | { ok: true; value: VetuongLaiCheckoutRequest }
  | { ok: false; status: number; body: Record<string, unknown> } {
  const body = readJsonBody(input);
  const intent = stringValue(body.intent) as VetuongLaiIntent;
  const pack = stringValue(body.pack).toLowerCase() as VetuongLaiPack;
  const candidateEmail = stringValue(body.candidate_email).toLowerCase();
  const returnUrl = normalizeUrl(body.return_url);
  const cancelUrl = normalizeUrl(body.cancel_url);
  const metadata = readJsonBody(body.metadata);

  if (!intent || !candidateEmail || !returnUrl || !cancelUrl) {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        code: "CHECKOUT_REQUEST_INVALID",
        message: "intent, candidate_email, return_url, cancel_url are required."
      }
    };
  }

  if (intent !== "annual-access" && intent !== "specialist-pack") {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        code: "INTENT_INVALID",
        message: "intent must be annual-access or specialist-pack."
      }
    };
  }

  if (!isEmail(candidateEmail)) {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        code: "EMAIL_INVALID",
        message: "candidate_email must be a valid email address."
      }
    };
  }

  if (intent === "specialist-pack" && !VETUONGLAI_ALLOWED_PACKS.includes(pack)) {
    return {
      ok: false,
      status: 422,
      body: {
        ok: false,
        code: "PACK_REQUIRED",
        message: "pack must be one of g1..g9 when intent is specialist-pack."
      }
    };
  }

  return {
    ok: true,
    value: {
      intent,
      pack: intent === "specialist-pack" ? pack : undefined,
      candidate_email: candidateEmail,
      entry: stringValue(body.entry) || undefined,
      source: stringValue(body.source) || undefined,
      lang: stringValue(body.lang) || undefined,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      metadata
    }
  };
}

export function resolveVetuongLaiProduct(
  catalog: VetuongLaiCatalog,
  request: VetuongLaiCheckoutRequest
):
  | { ok: true; value: VetuongLaiResolvedProduct }
  | { ok: false; status: number; body: Record<string, unknown> } {
  if (request.intent === "annual-access") {
    return {
      ok: true,
      value: {
        ...catalog.annual,
        intent: request.intent
      }
    };
  }

  const pack = request.pack as VetuongLaiPack;
  const entry = catalog.packs[pack];
  if (!entry) {
    return {
      ok: false,
      status: 503,
      body: {
        ok: false,
        code: "PACK_NOT_READY",
        message: `Catalog entry for ${pack} is not configured on pay.iai.one.`
      }
    };
  }

  return {
    ok: true,
    value: {
      ...entry,
      intent: request.intent,
      pack
    }
  };
}

export async function buildVetuongLaiInternalCheckoutPayload(
  request: VetuongLaiCheckoutRequest,
  product: VetuongLaiResolvedProduct
) {
  const traceSeed = `${request.candidate_email}:${product.intent}:${product.pack || "annual"}:${crypto.randomUUID()}`;
  const traceHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(traceSeed));
  const trace = Array.from(new Uint8Array(traceHash), (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 12);
  const internalOrderId = `vtl_${Date.now()}_${trace}`;

  return {
    tenant_code: VETUONGLAI_TENANT_CODE,
    site_code: VETUONGLAI_SITE_CODE,
    internal_order_id: internalOrderId,
    provider: "payos",
    plan_code: product.code,
    amount: product.amount,
    currency: product.currency,
    billing_cycle: "one_time",
    success_url: request.return_url,
    cancel_url: request.cancel_url,
    callback_url: VETUONGLAI_MEMBER_WEBHOOK_URL,
    email: request.candidate_email,
    locale: request.lang || "vi",
    description: product.description,
    metadata: {
      intent: request.intent,
      pack: request.pack || null,
      entry: request.entry || null,
      source: request.source || null,
      slug: stringValue(request.metadata.slug) || null,
      ref: stringValue(request.metadata.ref) || null,
      candidate_email: request.candidate_email,
      member_webhook_url: VETUONGLAI_MEMBER_WEBHOOK_URL,
      ...request.metadata
    }
  };
}

export function buildVetuongLaiCheckoutResponse(status: number, body: InternalCheckoutSessionContractResponse | Record<string, unknown>) {
  const payload = readJsonBody(body);
  const ok = Boolean(payload.ok);
  return {
    ok,
    code: scalarValue(payload.code) || null,
    message: stringValue(payload.message) || null,
    checkout_url: stringValue(payload.checkout_url) || null,
    session_id: stringValue(payload.payment_session_id) || null,
    provider_ref: scalarValue(payload.provider_payment_id) || scalarValue(payload.provider_order_id) || null,
    expires_at: stringValue(payload.expires_at) || null,
    status: ok && status < 400 ? "ready" : scalarValue(payload.status) || "error",
    missing_env_keys: Array.isArray(payload.missing_env_keys) ? payload.missing_env_keys : undefined
  };
}

export function buildVetuongLaiOpenApiPath() {
  return {
    [VETUONGLAI_CHECKOUT_ROUTE]: {
      post: {
        summary: "Create checkout session for Về Tương Lai",
        description: "VN-first checkout contract. PayPal is deferred and not a gate in this phase.",
        parameters: [
          {
            in: "header",
            name: "x-api-key",
            required: true,
            schema: { type: "string" }
          },
          {
            in: "header",
            name: "x-idempotency-key",
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
                required: ["intent", "candidate_email", "return_url", "cancel_url"],
                properties: {
                  intent: { type: "string", enum: ["annual-access", "specialist-pack"] },
                  pack: { type: "string", enum: [...VETUONGLAI_ALLOWED_PACKS] },
                  candidate_email: { type: "string", format: "email" },
                  entry: { type: "string" },
                  source: { type: "string" },
                  lang: { type: "string" },
                  return_url: { type: "string", format: "uri" },
                  cancel_url: { type: "string", format: "uri" },
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
          "422": {
            description: "Validation error"
          },
          "503": {
            description: "Catalog or provider runtime not ready"
          }
        }
      }
    }
  };
}
