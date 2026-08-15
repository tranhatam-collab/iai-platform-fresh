import {
  createPaymentAttemptRecord,
  createPaymentIntentRecord,
  ensureMerchantSite,
  ensureTenant,
  findPaymentIntentByProviderOrderId,
  getProviderEventByEventId,
  getIdempotencyRecord,
  createRefundRecord,
  getRefundById,
  listAuditLogsByPaymentIntentId,
  listAuditLogsByTarget,
  listEmailReceiptsByPaymentIntentId,
  listLedgerTransfersByPaymentIntentId,
  listProviderEventDeadLetters,
  listRefundsByPaymentIntentId,
  searchRefunds,
  totalProcessedRefundAmountByPaymentIntentId,
  getPaymentById,
  getPaymentByInternalOrderId,
  listPaymentAttempts,
  listProviderEventsByInternalOrderId,
  putIdempotencyRecord,
  recordAuditLog,
  recordProviderEvent,
  requireDb,
  searchPayments,
  updatePaymentAttemptStatus,
  updatePaymentIntentStatus
} from "./lib/db";
import { handleOptions, json, notFound } from "./lib/http";
import {
  buildInternalCheckoutResponse,
  buildInternalExistingCheckoutResponse,
  buildInternalOpenApiSpec,
  INTERNAL_CHECKOUT_ROUTE,
  INTERNAL_ORDER_STATUS_ROUTE,
  renderInternalDocsHtml,
  toProviderCheckoutPayload,
  validateInternalCheckoutRequest
} from "./lib/internal-contract";
import { cancelPayOSPaymentRequest, confirmPayOSWebhook, createPayOSCheckoutSession, getPayOSPaymentRequest, handlePayOSWebhook, validatePayOSCheckoutPayload } from "./lib/payos";
import { resolveTenantPayOSEnvironment } from "./lib/provider-account";
import { PROVIDERS, missingProviderEnvKeys, providerByCode } from "./lib/providers";
import {
  authorizeInternalCheckoutSiteKey,
  authorizeInternalReconciliationSiteKey,
  authorizeInternalRefundSiteKey
} from "./lib/site-auth";
import {
  buildVetuongLaiCheckoutResponse,
  buildVetuongLaiInternalCheckoutPayload,
  buildVetuongLaiOpenApiPath,
  parseVetuongLaiCatalog,
  resolveVetuongLaiProduct,
  validateVetuongLaiCheckoutRequest,
  VETUONGLAI_CHECKOUT_ROUTE,
  VETUONGLAI_SITE_CODE,
  VETUONGLAI_TENANT_CODE
} from "./lib/vetuonglai-contract";
import {
  dispatchVetuongLaiMemberWebhook,
  isVetuongLaiMemberDispatchTarget,
  prepareVetuongLaiMemberWebhookDispatch,
  type VetuongLaiMemberWebhookDispatchSummary
} from "./lib/vetuonglai-member-webhook";
import { buildHealthCheck } from "./lib/health";
import { postPaymentCapture, postPaymentRefund } from "./lib/ledger";
import {
  getReconciliationCaseById,
  listReconciliationCasesForInvestigation,
  openReconciliationCase,
  resolveReconciliationCase,
  escalateReconciliationCase
} from "./lib/reconciliation";
import { sendPaymentEmailWithEvidence } from "./lib/email-evidence";
import { dispatchTenantPaymentCallback, type TenantPaymentCallbackResult } from "./lib/tenant-payment-callback";
import { readJsonBody, scalarValue, sha256Hex, stringValue, integerValue } from "./lib/utils";

export interface Env {
  [key: string]: unknown;
  PAYMENTS_DB?: D1Database;
  PAY_ENV?: string;
  PAY_API_BASE_URL?: string;
  ALLOWED_ORIGINS?: string;
  PAYOS_CLIENT_ID?: string;
  PAYOS_API_KEY?: string;
  PAYOS_CHECKSUM_KEY?: string;
  PAYOS_PARTNER_CODE?: string;
  PAY_IAI_ONE_WEBHOOK_SECRET?: string;
  VETUONGLAI_PRODUCT_CATALOG_JSON?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE_TRANSPORT?: string;
  SMTP_AUTH_MODE?: string;
  SMTP_USERNAME?: string;
  SMTP_PASSWORD?: string;
  SMTP_HELO_DOMAIN?: string;
  EMAIL_FROM_PAY?: string;
  EMAIL_FROM_BILLING?: string;
}

const securityBaseline = [
  "No raw PAN or CVV storage on pay.iai.one",
  "Hosted checkout or provider tokenization only",
  "Webhook signature verification before fulfillment",
  "Idempotency required on write routes",
  "Per-site API keys stored as hashes only",
  "Provider secrets kept in runtime secrets, never D1",
  "Tenant and site isolation in every payment record",
  "Queue-backed retries for webhooks and receipts",
  "Mandatory audit log for sensitive actions",
  "Default refund mode is manual review until each provider is proven stable"
];

function baseResponse(env: Env) {
  return {
    ok: true,
    service: "pay.iai.one",
    environment: env.PAY_ENV || "development",
    api_base_url: env.PAY_API_BASE_URL || null,
    db_bound: Boolean(env.PAYMENTS_DB),
    providers_total: PROVIDERS.length
  };
}

async function createPlannedCheckoutSession(request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => null);
  const payload = readJsonBody(body);
  const result = await executeCheckoutSessionPayload(payload, env);
  return json(result.body, result.status);
}

async function executeCheckoutSessionPayload(payload: Record<string, unknown>, env: Env): Promise<{ status: number; body: Record<string, unknown> }> {
  const providerCode = String(payload.provider || "").trim().toLowerCase();
  const provider = providerByCode(providerCode);

  if (!provider) {
    return {
      status: 422,
      body: {
        ok: false,
        code: "PROVIDER_UNSUPPORTED",
        message: "Unknown provider for this gateway.",
        supported_providers: PROVIDERS.map((item) => item.code)
      }
    };
  }

  const missingEnvKeys = missingProviderEnvKeys(provider, env as Record<string, unknown>);

  if (provider.code === "payos") {
    const validation = validatePayOSCheckoutPayload(payload);
    if (!validation.ok) {
      const response = validation.response;
      return {
        status: response.status,
        body: readJsonBody(await response.json().catch(() => ({})))
      };
    }
    const db = requireDb(env);
    const tenant = await ensureTenant(db, validation.value.tenant_code);
    const site = await ensureMerchantSite(db, tenant.id, validation.value.site_code, validation.value.return_url);
    const metadata = validation.value.metadata || {};
    const requestedCallbackUrl =
      stringValue(metadata.callback_url) ||
      stringValue(metadata.member_webhook_url) ||
      null;
    const configuredCallbackUrl = stringValue(site.callback_url) || null;
    if (requestedCallbackUrl && requestedCallbackUrl !== configuredCallbackUrl) {
      return {
        status: 503,
        body: {
          ok: false,
          code: "TENANT_CALLBACK_NOT_READY",
          message: "The requested callback URL is not registered for this merchant site.",
          tenant_code: validation.value.tenant_code,
          site_code: validation.value.site_code,
          callback_configured: Boolean(configuredCallbackUrl)
        }
      };
    }
    const tenantProvider = await resolveTenantPayOSEnvironment(db, env, {
      tenantId: tenant.id,
      tenantCode: validation.value.tenant_code
    });
    if (!tenantProvider.ok) {
      return { status: tenantProvider.status, body: tenantProvider.body };
    }
    const callbackUrl = configuredCallbackUrl;
    if (callbackUrl && !tenantProvider.callbackHmac) {
      return {
        status: 503,
        body: {
          ok: false,
          code: "TENANT_CALLBACK_SECRET_MISSING",
          message: "The tenant callback HMAC binding is not configured.",
          tenant_code: validation.value.tenant_code,
          site_code: validation.value.site_code
        }
      };
    }
    const paymentIntent = await createPaymentIntentRecord(db, {
      tenantId: tenant.id,
      siteId: site.id,
      internalOrderId: validation.value.order_id,
      amount: validation.value.amount,
      currency: "VND",
      providerCode: "payos",
      paymentType: "hosted_checkout",
      successUrl: validation.value.return_url,
      cancelUrl: validation.value.cancel_url,
      callbackUrl,
      metadata: {
        provider: "payos",
        merchant_reference: tenantProvider.account.merchant_reference,
        provider_live_mode: true,
        tenant_code: validation.value.tenant_code,
        site_code: validation.value.site_code,
        order_code: validation.value.order_code,
        buyer_email: validation.value.buyer_email || null,
        callback_url: callbackUrl,
        ...validation.value.metadata
      }
    });
    const providerResponse = await createPayOSCheckoutSession(tenantProvider.env, validation.value);
    const providerRaw = readJsonBody(providerResponse.body.raw);
    const providerNormalized = readJsonBody(providerResponse.body.normalized);

    await createPaymentAttemptRecord(db, {
      paymentIntentId: paymentIntent.id,
      providerCode: "payos",
      providerOrderId: String(validation.value.order_code),
      providerTransactionId: stringValue(providerNormalized.payment_link_id) || null,
      providerPaymentUrl: stringValue(providerNormalized.checkout_url) || null,
      providerRawStatus: stringValue(providerNormalized.status) || stringValue(providerResponse.body.code) || null,
      captureReference: stringValue(providerRaw.code) || null,
      responseJson: readJsonBody(providerResponse.body)
    });

    if (!providerResponse.ok) {
      await updatePaymentIntentStatus(db, paymentIntent.id, {
        paymentStatus: "provider_error"
      });
    }

    return {
      status: providerResponse.status,
      body: {
        ...providerResponse.body,
        provider_account: {
          tenant_scoped: true,
          merchant_reference: tenantProvider.account.merchant_reference,
          live_mode: true
        },
        persistence: {
          payment_intent_id: paymentIntent.id,
          internal_order_id: validation.value.order_id,
          tenant_code: validation.value.tenant_code,
          site_code: validation.value.site_code
        }
      }
    };
  }

  return {
    status: 501,
    body: {
      ok: false,
      code: "NOT_IMPLEMENTED_YET",
      message: "Checkout session creation is scaffolded but not wired to a provider yet.",
      next_target: provider.priority === 1 ? "payOS adapter" : `${provider.label} adapter`,
      provider: {
        code: provider.code,
        label: provider.label,
        market: provider.market,
        missing_env_keys: missingEnvKeys,
        env_ready: missingEnvKeys.length === 0
      },
      expected_payload: {
        tenant_code: "required",
        site_code: "required",
        provider: "required",
        amount: "required_in_minor_units",
        currency: "required",
        order_id: "required",
        return_url: "required",
        cancel_url: "required",
        customer: {
          email: "optional",
          phone: "optional",
          full_name: "optional"
        },
        metadata: "optional"
      },
      received_preview: payload
    }
  };
}

async function createInternalCheckoutSession(request: Request, env: Env): Promise<Response> {
  const db = requireDb(env);
  const idempotencyKey = stringValue(request.headers.get("x-idempotency-key"));
  if (!idempotencyKey) {
    return json(
      {
        ok: false,
        success: false,
        contract_version: "2026-04-15",
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "x-idempotency-key is required on the internal checkout contract."
      },
      422
    );
  }

  const rawBody = await request.text();
  let parsedBody: unknown = null;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch (_error) {
    return json(
      {
        ok: false,
        success: false,
        contract_version: "2026-04-15",
        code: "INVALID_JSON",
        message: "Request body must be valid JSON."
      },
      400
    );
  }

  const validation = validateInternalCheckoutRequest(parsedBody);
  if (!validation.ok) return json(validation.body, validation.status);

  const siteAuthorization = await authorizeInternalCheckoutSiteKey(db, request, {
    tenantCode: validation.value.tenant_code,
    siteCode: validation.value.site_code
  });
  if (!siteAuthorization.ok) return siteAuthorization.response;

  const requestHash = await sha256Hex(rawBody);
  const existingIdempotency = await getIdempotencyRecord(db, INTERNAL_CHECKOUT_ROUTE, idempotencyKey);

  if (existingIdempotency) {
    if (existingIdempotency.request_hash !== requestHash) {
      return json(
        {
          ok: false,
          success: false,
          contract_version: "2026-04-15",
          code: "IDEMPOTENCY_CONFLICT",
          message: "This x-idempotency-key was already used with a different payload."
        },
        409
      );
    }

    return json(existingIdempotency.response_json, existingIdempotency.status_code);
  }

  try {
    const providerPayload = await toProviderCheckoutPayload(validation.value);
    const execution = await executeCheckoutSessionPayload(providerPayload, env);
    const responseBody = buildInternalCheckoutResponse(validation.value, execution.status, execution.body);

    await putIdempotencyRecord(db, {
      route: INTERNAL_CHECKOUT_ROUTE,
      idempotencyKey,
      requestHash,
      statusCode: execution.status,
      responseJson: responseBody as unknown as Record<string, unknown>
    });

    return json(responseBody, execution.status);
  } catch (error) {
    const typed = error as Error & { code?: string; status?: number };
    if (typed.code === "ORDER_ALREADY_EXISTS") {
      const payment = await getPaymentByInternalOrderId(db, validation.value.internal_order_id);
      if (payment) {
        const attempts = await listPaymentAttempts(db, payment.id);
        const responseBody = buildInternalExistingCheckoutResponse(payment, attempts);
        await putIdempotencyRecord(db, {
          route: INTERNAL_CHECKOUT_ROUTE,
          idempotencyKey,
          requestHash,
          statusCode: 200,
          responseJson: responseBody as unknown as Record<string, unknown>
        });
        return json(responseBody, 200);
      }
    }

    throw error;
  }
}

async function getInternalOrderStatus(request: Request, env: Env): Promise<Response> {
  const db = requireDb(env);
  const url = new URL(request.url);
  const tenantCode = stringValue(url.searchParams.get("tenant_code"));
  const siteCode = stringValue(url.searchParams.get("site_code"));
  const internalOrderId = stringValue(url.searchParams.get("internal_order_id"));
  const requestedProviderOrderId = stringValue(url.searchParams.get("provider_order_id"));

  if (!tenantCode || !siteCode || !internalOrderId) {
    return json(
      {
        ok: false,
        success: false,
        contract_version: "2026-04-15",
        code: "ORDER_STATUS_INPUT_REQUIRED",
        message: "tenant_code, site_code, and internal_order_id are required."
      },
      422
    );
  }

  const siteAuthorization = await authorizeInternalCheckoutSiteKey(db, request, { tenantCode, siteCode });
  if (!siteAuthorization.ok) return siteAuthorization.response;

  const payment = await getPaymentByInternalOrderId(db, internalOrderId);
  if (!payment || payment.tenant_code !== tenantCode || payment.site_code !== siteCode) {
    return json(
      {
        ok: false,
        success: false,
        contract_version: "2026-04-15",
        code: "PAYMENT_NOT_FOUND",
        message: "Payment intent not found for this tenant/site contract."
      },
      404
    );
  }

  const attempts = await listPaymentAttempts(db, payment.id);
  const metadataProviderOrderId = stringValue(payment.metadata_json?.order_code);
  const matchingAttempt = requestedProviderOrderId
    ? attempts.find((attempt) => stringValue(attempt.provider_order_id) === requestedProviderOrderId)
    : attempts[0] || null;

  if (requestedProviderOrderId && requestedProviderOrderId !== metadataProviderOrderId && !matchingAttempt) {
    return json(
      {
        ok: false,
        success: false,
        contract_version: "2026-04-15",
        code: "PROVIDER_ORDER_MISMATCH",
        message: "provider_order_id does not belong to this payment intent."
      },
      409
    );
  }

  const normalizedStatus = stringValue(payment.payment_status).toLowerCase();
  const paid = ["paid", "captured", "completed", "confirmed", "fulfilled"].includes(normalizedStatus);
  const providerOrderId =
    requestedProviderOrderId || metadataProviderOrderId || stringValue(matchingAttempt?.provider_order_id) || null;
  const providerRef =
    stringValue(matchingAttempt?.capture_reference) || stringValue(matchingAttempt?.provider_transaction_id) || null;

  return json({
    ok: true,
    success: true,
    contract_version: "2026-04-15",
    internal_order_id: payment.internal_order_id,
    provider_order_id: providerOrderId,
    status: normalizedStatus || "unknown",
    payment_status: normalizedStatus || "unknown",
    paid,
    verified: paid,
    provider_ref: providerRef,
    paid_at: payment.paid_at || null,
    fulfillment_status: payment.fulfillment_status || "pending"
  });
}

async function createVetuongLaiCheckoutSession(request: Request, env: Env): Promise<Response> {
  const db = requireDb(env);
  const siteAuthorization = await authorizeInternalCheckoutSiteKey(db, request, {
    tenantCode: VETUONGLAI_TENANT_CODE,
    siteCode: VETUONGLAI_SITE_CODE
  });
  if (!siteAuthorization.ok) return siteAuthorization.response;

  const body = await request.json().catch(() => null);
  const validation = validateVetuongLaiCheckoutRequest(body);
  if (!validation.ok) return json(validation.body, validation.status);

  const catalog = parseVetuongLaiCatalog(env.VETUONGLAI_PRODUCT_CATALOG_JSON);
  if (!catalog.ok) {
    return json(
      {
        ok: false,
        code: catalog.code,
        message: catalog.message
      },
      503
    );
  }

  const product = resolveVetuongLaiProduct(catalog.value, validation.value);
  if (!product.ok) return json(product.body, product.status);

  if (product.value.currency !== "VND") {
    return json(
      {
        ok: false,
        code: "CURRENCY_NOT_READY",
        message: "pay.iai.one phase này chỉ live payOS nội địa VND. USD chưa là lane live."
      },
      422
    );
  }

  const internalPayload = await buildVetuongLaiInternalCheckoutPayload(validation.value, product.value);
  const headers = new Headers({
    "content-type": "application/json"
  });
  const idempotencyKey = stringValue(request.headers.get("x-idempotency-key"));
  const apiKey = stringValue(request.headers.get("x-api-key")) || stringValue(request.headers.get("x-site-key"));

  if (idempotencyKey) headers.set("x-idempotency-key", idempotencyKey);
  if (apiKey) headers.set("x-api-key", apiKey);

  const internalResponse = await createInternalCheckoutSession(
    new Request(new URL(INTERNAL_CHECKOUT_ROUTE, request.url).toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(internalPayload)
    }),
    env
  );

  const internalBody = readJsonBody(await internalResponse.json().catch(() => ({})));
  return json(buildVetuongLaiCheckoutResponse(internalResponse.status, internalBody), internalResponse.status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const preflight = handleOptions(request, env.ALLOWED_ORIGINS || "*");
      if (preflight) return preflight;

      const url = new URL(request.url);
      const path = url.pathname;

      if (path === "/" || path === "/health") {
        const health = await buildHealthCheck(env as Parameters<typeof buildHealthCheck>[0]);
        return json(health);
      }

      if (path === "/docs" && request.method === "GET") {
        return new Response(renderInternalDocsHtml(env.PAY_API_BASE_URL || url.origin), {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store"
          }
        });
      }

      if (path === "/openapi.json" && request.method === "GET") {
        const spec = buildInternalOpenApiSpec(env.PAY_API_BASE_URL || url.origin) as Record<string, unknown>;
        const paths = readJsonBody(spec.paths);
        spec.paths = {
          ...paths,
          ...buildVetuongLaiOpenApiPath()
        };
        return json(spec);
      }

      if (path === "/v1/providers" && request.method === "GET") {
        const providerStatus = PROVIDERS.map((provider) => {
          const missing = missingProviderEnvKeys(provider, env as Record<string, unknown>);
          return {
            ...provider,
            env_ready: missing.length === 0,
            missing_env_keys: missing,
            runtime_status: missing.length === 0 ? "credentials_present" : "credentials_missing"
          };
        });
        return json({
          ...baseResponse(env),
          providers: providerStatus
        });
      }

      if (path === "/v1/security/baseline" && request.method === "GET") {
        return json({
          ...baseResponse(env),
          baseline: securityBaseline
        });
      }

      if (path === "/v1/roadmap" && request.method === "GET") {
        return json({
          ...baseResponse(env),
          roadmap: [
            "Foundation and schema",
            "payOS adapter",
            "MoMo adapter",
            "ZaloPay adapter",
            "VNPay adapter",
            "Unified refunds and receipts",
            "International providers"
          ]
        });
      }

      if (path === INTERNAL_CHECKOUT_ROUTE && request.method === "POST") {
        return await createInternalCheckoutSession(request, env);
      }

      if (path === INTERNAL_ORDER_STATUS_ROUTE && request.method === "GET") {
        return await getInternalOrderStatus(request, env);
      }

      if (path === VETUONGLAI_CHECKOUT_ROUTE && request.method === "POST") {
        return await createVetuongLaiCheckoutSession(request, env);
      }

      if (path === "/v1/checkout/sessions" && request.method === "POST") {
        return await createPlannedCheckoutSession(request, env);
      }

      if (path === "/v1/payments/search" && request.method === "GET") {
        const db = requireDb(env);
        const url = new URL(request.url);
        const internalOrderId = stringValue(url.searchParams.get("internal_order_id"));
        const recipientEmail = stringValue(url.searchParams.get("recipient_email"));
        const providerOrderId = stringValue(url.searchParams.get("provider_order_id"));
        const messageId = stringValue(url.searchParams.get("message_id"));
        const siteCode = stringValue(url.searchParams.get("site_code"));

        if (!internalOrderId && !recipientEmail && !providerOrderId && !messageId && !siteCode) {
          return json(
            {
              ok: false,
              code: "SEARCH_FILTER_REQUIRED",
              message: "Provide at least one search filter."
            },
            422
          );
        }

        const payments = await searchPayments(db, {
          internalOrderId: internalOrderId || undefined,
          recipientEmail: recipientEmail || undefined,
          providerOrderId: providerOrderId || undefined,
          messageId: messageId || undefined,
          siteCode: siteCode || undefined
        });

        return json({
          ok: true,
          filters: {
            internal_order_id: internalOrderId || null,
            recipient_email: recipientEmail || null,
            provider_order_id: providerOrderId || null,
            message_id: messageId || null,
            site_code: siteCode || null
          },
          count: payments.length,
          payments
        });
      }

      if (path === "/v1/refunds" && request.method === "POST") {
        const db = requireDb(env);
        const idempotencyKey = stringValue(request.headers.get("x-idempotency-key"));
        if (!idempotencyKey) {
          return json(
            {
              ok: false,
              code: "IDEMPOTENCY_KEY_REQUIRED",
              message: "x-idempotency-key is required on the internal refund contract."
            },
            422
          );
        }

        const rawBody = await request.text();
        let parsedBody: unknown = null;
        try {
          parsedBody = rawBody ? JSON.parse(rawBody) : null;
        } catch (_error) {
          return json(
            {
              ok: false,
              code: "INVALID_JSON",
              message: "Request body must be valid JSON."
            },
            400
          );
        }

        const payload = readJsonBody(parsedBody);
        const tenantCode = stringValue(payload.tenant_code);
        const siteCode = stringValue(payload.site_code);
        const internalOrderId = stringValue(payload.internal_order_id);
        const providerRefundId = stringValue(payload.provider_refund_id) || `manual_${Date.now()}`;
        const amount = integerValue(payload.amount);
        const reason = stringValue(payload.reason) || null;

        if (!tenantCode || !siteCode || !internalOrderId || !amount || amount <= 0) {
          return json(
            {
              ok: false,
              code: "REFUND_PAYLOAD_INVALID",
              message: "tenant_code, site_code, internal_order_id, and positive integer amount are required."
            },
            422
          );
        }

        const siteAuthorization = await authorizeInternalRefundSiteKey(db, request, {
          tenantCode,
          siteCode
        });
        if (!siteAuthorization.ok) return siteAuthorization.response;

        const requestHash = await sha256Hex(rawBody);
        const existingIdempotency = await getIdempotencyRecord(db, "/v1/refunds", idempotencyKey);
        if (existingIdempotency) {
          if (existingIdempotency.request_hash !== requestHash) {
            return json(
              {
                ok: false,
                code: "IDEMPOTENCY_CONFLICT",
                message: "This x-idempotency-key was already used with a different payload."
              },
              409
            );
          }

          return json(existingIdempotency.response_json, existingIdempotency.status_code);
        }

        const payment = await getPaymentByInternalOrderId(db, internalOrderId);
        if (!payment) {
          return json(
            {
              ok: false,
              code: "PAYMENT_NOT_FOUND",
              message: "Payment intent not found for refund."
            },
            404
          );
        }

        if (payment.tenant_code !== tenantCode || payment.site_code !== siteCode) {
          return json(
            {
              ok: false,
              code: "REFUND_SCOPE_MISMATCH",
              message: "Refund request tenant/site does not match the payment intent."
            },
            403
          );
        }

        if (amount > payment.amount) {
          return json(
            {
              ok: false,
              code: "REFUND_AMOUNT_INVALID",
              message: "Refund amount cannot exceed the original payment amount."
            },
            422
          );
        }

        const existingRefundTotal = await totalProcessedRefundAmountByPaymentIntentId(db, payment.id);
        if (existingRefundTotal + amount > payment.amount) {
          return json(
            {
              ok: false,
              code: "REFUND_TOTAL_EXCEEDED",
              message: "Total processed refunds would exceed the original payment amount.",
              payment_amount: payment.amount,
              existing_refund_total: existingRefundTotal,
              requested_refund_amount: amount
            },
            422
          );
        }

        const refund = await createRefundRecord(db, {
          paymentIntentId: payment.id,
          providerCode: payment.provider_code || "payos",
          providerRefundId,
          amount,
          currency: payment.currency,
          status: "processed",
          reason
        });

        const ledgerResult = await postPaymentRefund(db, {
          tenantId: payment.tenant_id,
          siteCode: payment.site_code,
          paymentIntentId: payment.id,
          refundId: refund.id,
          providerCode: payment.provider_code || "payos",
          providerRefundId,
          amount,
          currency: payment.currency,
          reason: reason || undefined
        }).catch((error) => ({ ok: false, transferId: "", entryCount: 0, error: (error as Error).message }));

        let reconciliationCase: { id: string; caseCode: string } | null = null;
        if (!ledgerResult.ok) {
          reconciliationCase = await openReconciliationCase(db, {
            tenantId: payment.tenant_id,
            caseType: "refund_mismatch",
            severity: "high",
            paymentIntentId: payment.id,
            providerCode: payment.provider_code || "payos",
            expectedAmount: amount,
            actualAmount: 0,
            currency: payment.currency,
            description: `Refund ledger posting failed for ${payment.internal_order_id}`,
            evidence: {
              refund_id: refund.id,
              provider_refund_id: providerRefundId,
              error: ledgerResult.error || null
            },
            openedByType: "system",
            openedById: "pay.iai.one"
          });
        }

        await recordAuditLog(db, {
          tenantId: null,
          actorType: "service_api_key",
          actorId: siteAuthorization.record.id,
          action: ledgerResult.ok ? "refund.created" : "refund.failed",
          targetType: "payment_intent",
          targetId: payment.id,
          detail: {
            payment_intent_id: payment.id,
            internal_order_id: payment.internal_order_id,
            refund_id: refund.id,
            provider_refund_id: providerRefundId,
            amount,
            currency: payment.currency,
            ledger_transfer_id: ledgerResult.transferId || null,
            error: ledgerResult.error || null,
            reconciliation_case: reconciliationCase
          }
        });

        await recordAuditLog(db, {
          tenantId: payment.tenant_id,
          actorType: "service_api_key",
          actorId: siteAuthorization.record.id,
          action: ledgerResult.ok ? "refund.recorded" : "refund.record_failed",
          targetType: "refund",
          targetId: refund.id,
          detail: {
            payment_intent_id: payment.id,
            internal_order_id: payment.internal_order_id,
            provider_refund_id: providerRefundId,
            amount,
            currency: payment.currency,
            status: ledgerResult.ok ? "processed" : "ledger_failed",
            reconciliation_case: reconciliationCase
          }
        });

        const responseBody = {
          ok: Boolean(ledgerResult.ok),
          refund: {
            id: refund.id,
            provider_refund_id: providerRefundId,
            payment_intent_id: payment.id,
            internal_order_id: payment.internal_order_id,
            amount,
            currency: payment.currency,
            reason,
            status: ledgerResult.ok ? "processed" : "ledger_failed"
          },
          ledger: ledgerResult,
          reconciliation_case: reconciliationCase
        };

        await putIdempotencyRecord(db, {
          route: "/v1/refunds",
          idempotencyKey,
          requestHash,
          statusCode: ledgerResult.ok ? 200 : 500,
          responseJson: responseBody as Record<string, unknown>
        });

        return json(responseBody, ledgerResult.ok ? 200 : 500);
      }

      if (path === "/v1/refunds/search" && request.method === "GET") {
        const db = requireDb(env);
        const url = new URL(request.url);
        const refundId = stringValue(url.searchParams.get("refund_id"));
        const internalOrderId = stringValue(url.searchParams.get("internal_order_id"));
        const providerRefundId = stringValue(url.searchParams.get("provider_refund_id"));
        const status = stringValue(url.searchParams.get("status"));
        const siteCode = stringValue(url.searchParams.get("site_code"));
        const limit = Number.parseInt(stringValue(url.searchParams.get("limit")) || "50", 10);

        if (!refundId && !internalOrderId && !providerRefundId && !status && !siteCode) {
          return json(
            {
              ok: false,
              code: "SEARCH_FILTER_REQUIRED",
              message: "Provide at least one refund search filter."
            },
            422
          );
        }

        const refunds = await searchRefunds(db, {
          refundId: refundId || undefined,
          internalOrderId: internalOrderId || undefined,
          providerRefundId: providerRefundId || undefined,
          status: status || undefined,
          siteCode: siteCode || undefined,
          limit: Number.isFinite(limit) ? limit : 50
        });

        return json({
          ok: true,
          filters: {
            refund_id: refundId || null,
            internal_order_id: internalOrderId || null,
            provider_refund_id: providerRefundId || null,
            status: status || null,
            site_code: siteCode || null
          },
          count: refunds.length,
          refunds
        });
      }

      if (path.startsWith("/v1/refunds/") && request.method === "GET") {
        const db = requireDb(env);
        const refundId = decodeURIComponent(path.replace("/v1/refunds/", ""));
        const refund = await getRefundById(db, refundId);

        if (!refund) {
          return json(
            {
              ok: false,
              code: "REFUND_NOT_FOUND",
              message: "Refund not found."
            },
            404
          );
        }

        const payment = await getPaymentByInternalOrderId(db, refund.internal_order_id);
        const ledgerTransfers = await listLedgerTransfersByPaymentIntentId(db, refund.payment_intent_id);
        const refundTransfer = ledgerTransfers.find((transfer) => transfer.source_type === "refund" && transfer.source_ref_id === refund.id) || null;
        const auditLogs = await listAuditLogsByPaymentIntentId(db, refund.payment_intent_id, 100);
        const refundAuditLogs = await listAuditLogsByTarget(db, "refund", refund.id, 100);
        const reconciliationCases = await listReconciliationCasesForInvestigation(db, {
          paymentIntentId: refund.payment_intent_id,
          refundId: refund.id,
          limit: 100
        });

        return json({
          ok: true,
          refund,
          payment,
          ledger_transfer: refundTransfer,
          audit_logs: auditLogs,
          refund_audit_logs: refundAuditLogs,
          reconciliation_cases: reconciliationCases
        });
      }

      if (path.startsWith("/v1/payments/") && request.method === "GET") {
        const internalOrderId = decodeURIComponent(path.replace("/v1/payments/", ""));
        const db = requireDb(env);
        const payment = await getPaymentByInternalOrderId(db, internalOrderId);

        if (!payment) {
          return json(
            {
              ok: false,
              code: "PAYMENT_NOT_FOUND",
              message: "Payment intent not found."
            },
            404
          );
        }

        const attempts = await listPaymentAttempts(db, payment.id);
        const primaryProviderOrderId = stringValue(payment.metadata_json.order_code);
        const fallbackProviderOrderId = attempts[0]?.provider_order_id || null;
        const providerOrderId = primaryProviderOrderId || fallbackProviderOrderId || null;
        const providerEvents = payment.provider_code && providerOrderId ? await listProviderEventsByInternalOrderId(db, payment.provider_code, providerOrderId) : [];
        const ledgerTransfers = await listLedgerTransfersByPaymentIntentId(db, payment.id);
        const emailReceipts = await listEmailReceiptsByPaymentIntentId(db, payment.id);
        const refunds = await listRefundsByPaymentIntentId(db, payment.id);
        const auditLogs = await listAuditLogsByPaymentIntentId(db, payment.id, 100);

        return json({
          ok: true,
          payment,
          attempts,
          provider_events: providerEvents,
          ledger_transfers: ledgerTransfers,
          email_receipts: emailReceipts,
          refunds,
          audit_logs: auditLogs
        });
      }

      if (path === "/v1/provider-events/payos/dead-letters" && request.method === "GET") {
        const db = requireDb(env);
        const url = new URL(request.url);
        const limit = Number.parseInt(stringValue(url.searchParams.get("limit")) || "50", 10);
        const events = await listProviderEventDeadLetters(db, "payos", Number.isFinite(limit) ? limit : 50);

        return json({
          ok: true,
          provider: "payos",
          count: events.length,
          events
        });
      }

      if (path === "/v1/reconciliation/cases" && request.method === "GET") {
        const db = requireDb(env);
        const url = new URL(request.url);
        const paymentIntentId = stringValue(url.searchParams.get("payment_intent_id"));
        const refundId = stringValue(url.searchParams.get("refund_id"));
        const status = stringValue(url.searchParams.get("status"));
        const limit = Number.parseInt(stringValue(url.searchParams.get("limit")) || "50", 10);

        if (!paymentIntentId && !refundId) {
          return json(
            {
              ok: false,
              code: "RECON_FILTER_REQUIRED",
              message: "Provide payment_intent_id or refund_id to inspect reconciliation cases."
            },
            422
          );
        }

        const cases = await listReconciliationCasesForInvestigation(db, {
          paymentIntentId: paymentIntentId || undefined,
          refundId: refundId || undefined,
          status: (status || undefined) as "open" | "investigating" | "resolved" | "escalated" | "closed" | undefined,
          limit: Number.isFinite(limit) ? limit : 50
        });

        return json({
          ok: true,
          filters: {
            payment_intent_id: paymentIntentId || null,
            refund_id: refundId || null,
            status: status || null
          },
          count: cases.length,
          cases
        });
      }

      if (path === "/v1/finance/drilldown" && request.method === "GET") {
        const db = requireDb(env);
        const url = new URL(request.url);
        const internalOrderId = stringValue(url.searchParams.get("internal_order_id"));
        const paymentIntentId = stringValue(url.searchParams.get("payment_intent_id"));

        if (!internalOrderId && !paymentIntentId) {
          return json(
            {
              ok: false,
              code: "DRILLDOWN_FILTER_REQUIRED",
              message: "Provide internal_order_id or payment_intent_id."
            },
            422
          );
        }

        const payment = internalOrderId
          ? await getPaymentByInternalOrderId(db, internalOrderId)
          : await getPaymentById(db, paymentIntentId);

        if (!payment) {
          return json(
            {
              ok: false,
              code: "PAYMENT_NOT_FOUND",
              message: "Payment intent not found for drilldown."
            },
            404
          );
        }

        const attempts = await listPaymentAttempts(db, payment.id);
        const primaryProviderOrderId = stringValue(payment.metadata_json.order_code);
        const fallbackProviderOrderId = attempts[0]?.provider_order_id || null;
        const providerOrderId = primaryProviderOrderId || fallbackProviderOrderId || null;
        const providerEvents = payment.provider_code && providerOrderId ? await listProviderEventsByInternalOrderId(db, payment.provider_code, providerOrderId) : [];
        const ledgerTransfers = await listLedgerTransfersByPaymentIntentId(db, payment.id);
        const emailReceipts = await listEmailReceiptsByPaymentIntentId(db, payment.id);
        const refunds = await listRefundsByPaymentIntentId(db, payment.id);
        const auditLogs = await listAuditLogsByPaymentIntentId(db, payment.id, 200);
        const reconciliationCases = await listReconciliationCasesForInvestigation(db, {
          paymentIntentId: payment.id,
          limit: 200
        });

        return json({
          ok: true,
          payment,
          attempts,
          provider_events: providerEvents,
          ledger_transfers: ledgerTransfers,
          refunds,
          email_receipts: emailReceipts,
          reconciliation_cases: reconciliationCases,
          audit_logs: auditLogs,
          completeness: {
            has_provider_events: providerEvents.length > 0,
            has_ledger_entries: ledgerTransfers.length > 0,
            has_email_evidence: emailReceipts.length > 0,
            has_reconciliation_cases: reconciliationCases.length > 0
          }
        });
      }

      if (path.startsWith("/v1/reconciliation/cases/") && request.method === "GET") {
        const db = requireDb(env);
        const caseId = decodeURIComponent(path.replace("/v1/reconciliation/cases/", ""));
        const caseDetail = await getReconciliationCaseById(db, caseId);

        if (!caseDetail) {
          return json(
            {
              ok: false,
              code: "RECONCILIATION_CASE_NOT_FOUND",
              message: "Reconciliation case not found."
            },
            404
          );
        }

        const payment = caseDetail.payment_intent_id
          ? await getPaymentByInternalOrderId(db, caseDetail.evidence_json.internal_order_id ? String(caseDetail.evidence_json.internal_order_id) : "")
          : null;
        const auditLogs = await listAuditLogsByTarget(db, "reconciliation_case", caseId, 100);

        return json({
          ok: true,
          case: caseDetail,
          payment,
          audit_logs: auditLogs
        });
      }

      if (path.startsWith("/v1/reconciliation/cases/") && request.method === "POST" && path.endsWith("/resolve")) {
        const db = requireDb(env);
        const caseId = decodeURIComponent(path.replace("/v1/reconciliation/cases/", "").replace("/resolve", ""));
        const body = await request.json().catch(() => null);
        const payload = readJsonBody(body);
        const resolutionNotes = stringValue(payload.resolution_notes) || "Resolved by operator";
        const actorId = stringValue(payload.actor_id) || "manual_operator";

        const existing = await getReconciliationCaseById(db, caseId);
        if (!existing) {
          return json(
            {
              ok: false,
              code: "RECONCILIATION_CASE_NOT_FOUND",
              message: "Reconciliation case not found."
            },
            404
          );
        }

        if (!existing.payment_intent_id) {
          return json(
            {
              ok: false,
              code: "RECONCILIATION_PAYMENT_CONTEXT_MISSING",
              message: "Cannot authorize reconciliation action without payment context."
            },
            422
          );
        }

        const paymentForAuth = await getPaymentById(db, existing.payment_intent_id);
        if (!paymentForAuth) {
          return json(
            {
              ok: false,
              code: "RECONCILIATION_PAYMENT_CONTEXT_MISSING",
              message: "Cannot authorize reconciliation action without payment context."
            },
            422
          );
        }

        const reconAuthorization = await authorizeInternalReconciliationSiteKey(db, request, {
          tenantCode: paymentForAuth.tenant_code,
          siteCode: paymentForAuth.site_code
        });
        if (!reconAuthorization.ok) return reconAuthorization.response;

        await resolveReconciliationCase(db, caseId, {
          resolutionNotes,
          resolvedByType: "operator",
          resolvedById: actorId
        });

        await recordAuditLog(db, {
          tenantId: paymentForAuth.tenant_id,
          actorType: "operator",
          actorId,
          action: "reconciliation_case.resolved",
          targetType: "reconciliation_case",
          targetId: caseId,
          detail: {
            resolution_notes: resolutionNotes,
            previous_status: existing.case_status
          }
        });

        return json({
          ok: true,
          case_id: caseId,
          status: "resolved",
          resolution_notes: resolutionNotes
        });
      }

      if (path.startsWith("/v1/reconciliation/cases/") && request.method === "POST" && path.endsWith("/escalate")) {
        const db = requireDb(env);
        const caseId = decodeURIComponent(path.replace("/v1/reconciliation/cases/", "").replace("/escalate", ""));
        const body = await request.json().catch(() => null);
        const payload = readJsonBody(body);
        const reason = stringValue(payload.reason) || "Escalated by operator";
        const actorId = stringValue(payload.actor_id) || "manual_operator";

        const existing = await getReconciliationCaseById(db, caseId);
        if (!existing) {
          return json(
            {
              ok: false,
              code: "RECONCILIATION_CASE_NOT_FOUND",
              message: "Reconciliation case not found."
            },
            404
          );
        }

        if (!existing.payment_intent_id) {
          return json(
            {
              ok: false,
              code: "RECONCILIATION_PAYMENT_CONTEXT_MISSING",
              message: "Cannot authorize reconciliation action without payment context."
            },
            422
          );
        }

        const paymentForAuth = await getPaymentById(db, existing.payment_intent_id);
        if (!paymentForAuth) {
          return json(
            {
              ok: false,
              code: "RECONCILIATION_PAYMENT_CONTEXT_MISSING",
              message: "Cannot authorize reconciliation action without payment context."
            },
            422
          );
        }

        const reconAuthorization = await authorizeInternalReconciliationSiteKey(db, request, {
          tenantCode: paymentForAuth.tenant_code,
          siteCode: paymentForAuth.site_code
        });
        if (!reconAuthorization.ok) return reconAuthorization.response;

        await escalateReconciliationCase(db, caseId, reason);

        await recordAuditLog(db, {
          tenantId: paymentForAuth.tenant_id,
          actorType: "operator",
          actorId,
          action: "reconciliation_case.escalated",
          targetType: "reconciliation_case",
          targetId: caseId,
          detail: {
            reason,
            previous_status: existing.case_status
          }
        });

        return json({
          ok: true,
          case_id: caseId,
          status: "escalated",
          reason
        });
      }

      if (path === "/v1/providers/payos/confirm-webhook" && request.method === "POST") {
        const body = await request.json().catch(() => null);
        const payload = readJsonBody(body);
        const result = await confirmPayOSWebhook(env, stringValue(payload.webhookUrl));
        return json(result.body, result.status);
      }

      if (path.startsWith("/v1/providers/payos/payment-requests/") && request.method === "GET") {
        const id = decodeURIComponent(path.replace("/v1/providers/payos/payment-requests/", ""));
        const result = await getPayOSPaymentRequest(env, id);
        return json(result.body, result.status);
      }

      if (path.startsWith("/v1/providers/payos/payment-requests/") && request.method === "POST" && path.endsWith("/cancel")) {
        const id = decodeURIComponent(path.replace("/v1/providers/payos/payment-requests/", "").replace("/cancel", ""));
        const body = await request.json().catch(() => null);
        const payload = readJsonBody(body);
        const result = await cancelPayOSPaymentRequest(env, id, stringValue(payload.cancellationReason));
        return json(result.body, result.status);
      }

      if (path.startsWith("/v1/provider-events/payos/") && request.method === "GET") {
        const providerEventId = decodeURIComponent(path.replace("/v1/provider-events/payos/", ""));
        const db = requireDb(env);
        const providerEvent = await getProviderEventByEventId(db, "payos", providerEventId);

        if (!providerEvent) {
          return json(
            {
              ok: false,
              code: "PROVIDER_EVENT_NOT_FOUND",
              message: "Provider event not found."
            },
            404
          );
        }

        const auditLogs = await listAuditLogsByTarget(db, "provider_event", providerEventId, 100);

        return json({
          ok: true,
          provider_event: providerEvent,
          audit_logs: auditLogs,
          replay_pack: {
            advisory_only: true,
            method: "POST",
            path: `/v1/webhooks/payos/${encodeURIComponent(stringValue(providerEvent.payload_json.tenant_code) || "{tenant_code}")}`,
            content_type: "application/json",
            body: providerEvent.payload_json,
            notes: [
              "Replay pack is advisory-only. Do not replay into production blindly.",
              "If this event already processed successfully, replay should be used only for investigation.",
              "Current webhook route is duplicate-safe and will skip already-processed side effects."
            ]
          }
        });
      }

      if (path.startsWith("/v1/webhooks/payos/") && request.method === "POST") {
        const tenantCode = decodeURIComponent(path.replace("/v1/webhooks/payos/", ""));
        const db = requireDb(env);
        const rawBody = await request.text();
        const tenantProvider = await resolveTenantPayOSEnvironment(db, env, { tenantCode });
        if (!tenantProvider.ok) return json(tenantProvider.body, tenantProvider.status);
        const result = await handlePayOSWebhook(
          tenantProvider.env,
          new Request(request.url, { method: "POST", headers: request.headers, body: rawBody }),
          tenantCode
        );
        const payload = readJsonBody(result.body.raw);
        const webhookData = readJsonBody(payload.data);
        const providerOrderId = scalarValue(webhookData.orderCode);
        const providerEventId = await sha256Hex(rawBody);
        const existingProviderEvent = await getProviderEventByEventId(db, "payos", providerEventId);
        const attempt = providerOrderId ? await findPaymentIntentByProviderOrderId(db, "payos", providerOrderId) : null;
        const payosSuccess = Boolean(result.body.signature_valid && payload.success === true && stringValue(webhookData.code) === "00");
        let providerEventProcessed = Boolean(result.body.signature_valid);
        let providerEventErrorDetail = result.body.signature_valid ? null : "Webhook signature invalid";
        let memberWebhookSummary: VetuongLaiMemberWebhookDispatchSummary | null = null;
        let tenantCallbackSummary: TenantPaymentCallbackResult | null = null;
        let ledgerPostingResult: { ok: boolean; transferId?: string; error?: string } | null = null;
        let emailEvidenceResult: { ok: boolean; emailReceiptId?: string; error?: string } | null = null;

        if (existingProviderEvent?.processed) {
          await recordAuditLog(db, {
            tenantId: existingProviderEvent.tenant_id,
            actorType: "system",
            actorId: "pay.iai.one",
            action: "provider_event.duplicate_skipped",
            targetType: "provider_event",
            targetId: existingProviderEvent.provider_event_id,
            detail: {
              provider_code: "payos",
              received_at: existingProviderEvent.received_at,
              processed_at: existingProviderEvent.processed_at
            }
          });

          return json(
            {
              ...result.body,
              ok: true,
              duplicate: true,
              provider_event: {
                provider_event_id: existingProviderEvent.provider_event_id,
                received_at: existingProviderEvent.received_at,
                processed_at: existingProviderEvent.processed_at,
                error_detail: existingProviderEvent.error_detail
              }
            },
            200
          );
        }

        if (attempt) {
          await updatePaymentAttemptStatus(db, attempt.attempt_id, {
            providerTransactionId: stringValue(webhookData.reference) || stringValue(webhookData.paymentLinkId) || null,
            providerRawStatus: stringValue(webhookData.desc) || stringValue(payload.desc) || null,
            captureReference: stringValue(webhookData.reference) || null,
            responseJson: payload,
            completed: payosSuccess,
            failed: Boolean(result.body.signature_valid && stringValue(webhookData.code) !== "00")
          });

          await updatePaymentIntentStatus(db, attempt.payment_intent_id, {
            paymentStatus: payosSuccess ? "paid" : result.body.signature_valid ? "provider_response" : "webhook_rejected",
            paid: payosSuccess
          });

          // ── Ledger: post capture entry on successful payment ──────────────
          if (payosSuccess) {
            try {
              ledgerPostingResult = await postPaymentCapture(db, {
                tenantId: attempt.tenant_id,
                siteCode: attempt.site_code,
                paymentIntentId: attempt.payment_intent_id,
                providerCode: "payos",
                providerOrderId: providerOrderId || attempt.internal_order_id,
                amount: attempt.amount,
                currency: attempt.currency
              });
            } catch (ledgerErr) {
              ledgerPostingResult = { ok: false, error: String((ledgerErr as Error).message || ledgerErr) };
            }
          }

          // ── Email: send payment receipt with D1 evidence chain ─────────────
          if (payosSuccess) {
            try {
              const metadata = attempt.metadata_json as Record<string, unknown> | null;
              const recipientEmail = stringValue(metadata?.customer_email) || stringValue(metadata?.email);
              if (recipientEmail) {
                emailEvidenceResult = await sendPaymentEmailWithEvidence(db, env, {
                  flowCode: "payment_receipt",
                  tenantId: attempt.tenant_id,
                  paymentIntentId: attempt.payment_intent_id,
                  recipientEmail,
                  subject: `Payment receipt – ${attempt.internal_order_id}`,
                  textBody: [
                    `Payment confirmed for order ${attempt.internal_order_id}.`,
                    `Amount: ${attempt.amount} ${attempt.currency}`,
                    `Provider: payOS`,
                    `Thank you for your payment.`
                  ].join("\n"),
                  templateCode: "payment_receipt_v1",
                  dedupeKey: `receipt:${attempt.payment_intent_id}`
                });
              }
            } catch (emailErr) {
              emailEvidenceResult = { ok: false, error: String((emailErr as Error).message || emailErr) };
            }
          }

          if (payosSuccess && isVetuongLaiMemberDispatchTarget(attempt)) {
            const preparedDispatch = prepareVetuongLaiMemberWebhookDispatch(attempt, {
              providerEventId,
              occurredAt: webhookData.transactionDateTime
            });

            if (!preparedDispatch.ok) {
              providerEventProcessed = false;
              providerEventErrorDetail = `${preparedDispatch.code}: ${preparedDispatch.message}`;
              memberWebhookSummary = {
                ok: false,
                status: 500,
                code: preparedDispatch.code,
                message: preparedDispatch.message,
                retryable: false
              };
              await updatePaymentIntentStatus(db, attempt.payment_intent_id, {
                paymentStatus: "paid",
                fulfillmentStatus: "dispatch_failed",
                paid: true
              });
            } else {
              const dispatchResult = await dispatchVetuongLaiMemberWebhook(env, preparedDispatch.value);
              memberWebhookSummary = {
                ok: dispatchResult.ok,
                status: dispatchResult.status,
                code: dispatchResult.code,
                message: dispatchResult.message,
                retryable: dispatchResult.retryable,
                event_id: dispatchResult.event_id,
                event_type: dispatchResult.event_type,
                target_url: dispatchResult.target_url
              };
              providerEventProcessed = dispatchResult.ok;
              providerEventErrorDetail = dispatchResult.ok
                ? null
                : `${dispatchResult.code || "MEMBER_WEBHOOK_DELIVERY_FAILED"}: ${dispatchResult.message || "Unknown member webhook failure."}`;
              await updatePaymentIntentStatus(db, attempt.payment_intent_id, {
                paymentStatus: "paid",
                fulfillmentStatus: dispatchResult.ok ? "member_webhook_dispatched" : "dispatch_failed",
                paid: true
              });
            }
          } else if (payosSuccess && attempt.callback_url) {
            tenantCallbackSummary = await dispatchTenantPaymentCallback({
              callbackUrl: attempt.callback_url,
              callbackHmac: tenantProvider.callbackHmac,
              providerEventId,
              providerOrderId: providerOrderId || attempt.internal_order_id,
              internalOrderId: attempt.internal_order_id,
              amount: attempt.amount,
              currency: attempt.currency,
              metadata: attempt.metadata_json
            });
            providerEventProcessed = tenantCallbackSummary.ok;
            providerEventErrorDetail = tenantCallbackSummary.ok
              ? null
              : `${tenantCallbackSummary.code}: ${tenantCallbackSummary.message}`;
            await updatePaymentIntentStatus(db, attempt.payment_intent_id, {
              paymentStatus: "paid",
              fulfillmentStatus: tenantCallbackSummary.ok ? "tenant_callback_dispatched" : "dispatch_failed",
              paid: true
            });
          }
        }

        await recordProviderEvent(db, {
          providerCode: "payos",
          tenantId: attempt?.tenant_id || null,
          providerEventId,
          eventType: `payos:${stringValue(webhookData.code || payload.code || "unknown")}`,
          signatureValid: Boolean(result.body.signature_valid),
          payload,
          processed: providerEventProcessed,
          errorDetail: providerEventErrorDetail
        });

        await recordAuditLog(db, {
          tenantId: attempt?.tenant_id || null,
          actorType: "system",
          actorId: "pay.iai.one",
          action: "provider_event.received",
          targetType: "provider_event",
          targetId: providerEventId,
          detail: {
            provider_code: "payos",
            event_type: `payos:${stringValue(webhookData.code || payload.code || "unknown")}`,
            signature_valid: Boolean(result.body.signature_valid),
            processed: providerEventProcessed,
            internal_order_id: attempt?.internal_order_id || null,
            payment_intent_id: attempt?.payment_intent_id || null
          }
        });

        if (ledgerPostingResult) {
          await recordAuditLog(db, {
            tenantId: attempt?.tenant_id || null,
            actorType: "system",
            actorId: "pay.iai.one",
            action: ledgerPostingResult.ok ? "ledger.payment_capture_posted" : "ledger.payment_capture_failed",
            targetType: "payment_intent",
            targetId: attempt?.payment_intent_id || null,
            detail: {
              provider_event_id: providerEventId,
              transfer_id: ledgerPostingResult.transferId || null,
              error: ledgerPostingResult.error || null
            }
          });
        }

        if (emailEvidenceResult) {
          await recordAuditLog(db, {
            tenantId: attempt?.tenant_id || null,
            actorType: "system",
            actorId: "pay.iai.one",
            action: emailEvidenceResult.ok ? "email.payment_receipt_sent" : "email.payment_receipt_failed",
            targetType: "payment_intent",
            targetId: attempt?.payment_intent_id || null,
            detail: {
              provider_event_id: providerEventId,
              email_receipt_id: emailEvidenceResult.emailReceiptId || null,
              error: emailEvidenceResult.error || null
            }
          });
        }

        if (memberWebhookSummary) {
          await recordAuditLog(db, {
            tenantId: attempt?.tenant_id || null,
            actorType: "system",
            actorId: "pay.iai.one",
            action: memberWebhookSummary.ok ? "member_webhook.dispatched" : "member_webhook.failed",
            targetType: "payment_intent",
            targetId: attempt?.payment_intent_id || null,
            detail: {
              provider_event_id: providerEventId,
              status: memberWebhookSummary.status,
              code: memberWebhookSummary.code || null,
              retryable: memberWebhookSummary.retryable,
              target_url: memberWebhookSummary.target_url || null
            }
          });
        }

        if (tenantCallbackSummary) {
          await recordAuditLog(db, {
            tenantId: attempt?.tenant_id || null,
            actorType: "system",
            actorId: "pay.iai.one",
            action: tenantCallbackSummary.ok ? "tenant_webhook.dispatched" : "tenant_webhook.failed",
            targetType: "payment_intent",
            targetId: attempt?.payment_intent_id || null,
            detail: {
              provider_event_id: providerEventId,
              status: tenantCallbackSummary.status,
              code: tenantCallbackSummary.code,
              retryable: tenantCallbackSummary.retryable,
              target_url: tenantCallbackSummary.target_url
            }
          });
        }

        const responseBody = memberWebhookSummary
          ? {
              ...result.body,
              member_webhook: memberWebhookSummary,
              ...(ledgerPostingResult ? { ledger: ledgerPostingResult } : {}),
              ...(emailEvidenceResult ? { email_evidence: emailEvidenceResult } : {})
            }
          : {
              ...result.body,
              ...(tenantCallbackSummary ? { tenant_webhook: tenantCallbackSummary } : {}),
              ...(ledgerPostingResult ? { ledger: ledgerPostingResult } : {}),
              ...(emailEvidenceResult ? { email_evidence: emailEvidenceResult } : {})
            };

        if (memberWebhookSummary && memberWebhookSummary.ok === false) {
          return json(
            {
              ...responseBody,
              ok: false,
              code: "MEMBER_WEBHOOK_DELIVERY_FAILED",
              message: "payOS webhook was verified, but member.vetuonglai.com delivery failed."
            },
            502
          );
        }

        if (tenantCallbackSummary && tenantCallbackSummary.ok === false) {
          return json(
            {
              ...responseBody,
              ok: false,
              code: "TENANT_CALLBACK_DELIVERY_FAILED",
              message: "payOS webhook was verified, but the tenant callback delivery failed."
            },
            502
          );
        }

        return json(responseBody, result.status);
      }

      return notFound(path);
    } catch (error) {
      const typed = error as Error & { code?: string; status?: number };
      return json(
        {
          ok: false,
          code: typed.code || "UNHANDLED_ERROR",
          message: typed.message || "Unexpected error."
        },
        typed.status || 500
      );
    }
  }
};
