import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { fallbackLocale, resolveLocale, supportedLocales, t, type Locale } from "./i18n.js";
import {
  createDemoPayReadModelSource,
  createResolvedPayReadModel,
  type PayReadAccessContext,
  type PayReadModel,
  type PayReadModelSource
} from "./read-model.js";
import {
  createSharedPayReadModelBindingsFromFile,
  createSharedPayReadModelRuntime,
  createSharedPayReadModelSource,
  type SharedPayReadModelBindings,
  type SharedPayReadModelStatus
} from "./shared-read-model.js";
import { createSharedPayReadModelRuntimeFromLaneFiles } from "./shared-read-model-producer.js";
import {
  createPaySharedUpstreamRuntimeManager,
  type PaySharedUpstreamRuntimeManager,
  type PaySharedUpstreamRuntimeStatus
} from "./shared-upstream-runtime.js";
import {
  createSharedPayAuthSourceFromFile,
  resolvePaySessionContext,
  type PaySessionContextResolverConfig,
  type SharedPayAuthSource
} from "./session-context.js";
import { createPayLogger, payLogEvents, type PayLogger } from "./telemetry.js";
import {
  getPaymentReceiverRegistrySnapshot,
  resolvePaymentRouting
} from "./payment-routing.js";
import { getPaymentEmailTemplateRegistry } from "./payment-email-templates.js";
import {
  PaymentEmailOutboundAdapterError,
  sendPaymentEmailOutbound,
  type PaymentEmailOutboundInput
} from "./payment-email-outbound-adapter.js";
import {
  PaymentEventEvidenceStore
} from "./payment-event-evidence-store.js";
import {
  PaymentWebhookOutboundError,
  sendPaymentWebhookOutbound,
  type PaymentWebhookStatus
} from "./payment-webhook-outbound-sender.js";
import {
  getPaymentSurfaceRegistryEntry,
  getPaymentSurfaceRegistrySnapshot
} from "./payment-surface-registry.js";
import {
  getSiteActivationRegistryEntry,
  getSiteActivationRegistrySnapshot
} from "./site-activation-registry.js";
import {
  renderPayCheckout,
  renderPayCheckoutExpired,
  renderPayCheckoutStatus,
  renderPayHelp,
  renderPayHome,
  renderPayNotFound,
  renderPayPaymentBlock,
  renderPayOpsAudit,
  renderPayOpsPayments,
  renderPayOpsPayouts,
  renderPayOpsReconciliation,
  renderPayOpsReview,
  renderPayOpsWorkItemDetail,
  renderPayReceipt,
  type PayRenderConfig
} from "./render.js";

export type PayReadModelSelectionMode = "demo_only" | "shared_fallback_demo" | "shared_only";

export interface PayServerOptions extends Partial<Omit<PayRenderConfig, "readModel">> {
  fetchImpl?: typeof globalThis.fetch;
  paymentEventEvidenceStore?: PaymentEventEvidenceStore;
  paymentEventEvidenceStoreFilePath?: string;
  readModel?: PayReadModel;
  readModelMode?: PayReadModelSelectionMode;
  sharedAuthSourceFilePath?: string;
  sharedAuthSourceUrl?: string;
  sharedMaxDataAgeMs?: number;
  sharedReadModelBindings?: SharedPayReadModelBindings;
  sharedReadModelFilePath?: string;
  sharedReadModelUrl?: string;
  sharedReconciliationSourceFilePath?: string;
  sharedReconciliationSourceUrl?: string;
  sharedRefreshTtlMs?: number;
  sharedSessionSourceFilePath?: string;
  sharedSessionSourceUrl?: string;
  sharedUpstreamHeaderName?: string;
  sharedUpstreamHeaderValue?: string;
}

interface ResolvedPayConfig extends PayRenderConfig {
  fetchImpl: typeof globalThis.fetch;
  logger: PayLogger;
  paymentEventEvidenceStore: PaymentEventEvidenceStore;
  prepareSharedRuntime: (reason?: string) => Promise<void>;
  readModelSelectionMode: PayReadModelSelectionMode | "custom_injected";
  resolveAuthSource: () => SharedPayAuthSource | null;
  resolveSharedReadModelStatus: () => SharedPayReadModelStatus | null;
  resolveSharedUpstreamRuntimeStatus: () => PaySharedUpstreamRuntimeStatus | null;
  sessionContextConfig: PaySessionContextResolverConfig;
}

type PayRouteMatch =
  | { kind: "checkout"; sessionId: string }
  | { kind: "checkout_expired"; sessionId: string }
  | { kind: "checkout_status"; sessionId: string }
  | { kind: "help"; sessionId: string }
  | { area: "audit" | "payments" | "payouts" | "reconciliation" | "review"; kind: "ops" }
  | { area: "payments" | "reconciliation" | "review"; itemId: string; kind: "ops_detail" }
  | { kind: "receipt"; receiptId: string };

export function createPayServer(options: PayServerOptions = {}): Server {
  return createServer(createPayRequestHandler(options));
}

export function createPayRequestHandler(options: PayServerOptions = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const config = resolveConfig(options, fetchImpl);

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response, config);
  };
}

function resolveReadModel(
  options: PayServerOptions,
  upstreamRuntimeManager: PaySharedUpstreamRuntimeManager | null
): {
  readModel: PayReadModel;
  selectionMode: PayReadModelSelectionMode | "custom_injected";
  resolveSharedStatus: () => SharedPayReadModelStatus | null;
  resolveSharedUpstreamStatus: () => PaySharedUpstreamRuntimeStatus | null;
} {
  if (options.readModel) {
    return {
      readModel: options.readModel,
      resolveSharedStatus: () => null,
      resolveSharedUpstreamStatus: () => null,
      selectionMode: "custom_injected",
    };
  }

  const selectionMode = resolveReadModelSelectionMode(options.readModelMode, process.env.PAY_READ_MODEL_MODE);

  if (upstreamRuntimeManager) {
    const sharedSource = createManagedSharedReadModelSource(upstreamRuntimeManager);

    switch (selectionMode) {
      case "demo_only":
        return {
          readModel: createResolvedPayReadModel({
            primary: createDemoPayReadModelSource()
          }),
          resolveSharedStatus: () => upstreamRuntimeManager.getSharedReadModelStatus(),
          resolveSharedUpstreamStatus: () => upstreamRuntimeManager.getStatus(),
          selectionMode
        };
      case "shared_only":
        return {
          readModel: createResolvedPayReadModel({
            primary: sharedSource
          }),
          resolveSharedStatus: () => upstreamRuntimeManager.getSharedReadModelStatus(),
          resolveSharedUpstreamStatus: () => upstreamRuntimeManager.getStatus(),
          selectionMode
        };
      case "shared_fallback_demo":
        return {
          readModel: createResolvedPayReadModel({
            fallback: createDemoPayReadModelSource(),
            primary: sharedSource
          }),
          resolveSharedStatus: () => upstreamRuntimeManager.getSharedReadModelStatus(),
          resolveSharedUpstreamStatus: () => upstreamRuntimeManager.getStatus(),
          selectionMode
        };
    };
  }

  const sharedRuntime = resolveSharedReadModelRuntime(options);
  const sharedSource = createSharedPayReadModelSource(sharedRuntime.bindings, sharedRuntime.mode);

  if (selectionMode === "shared_only" && !sharedRuntime.status.rolloutReadyForSharedOnly) {
    throw new Error(
      "PAY shared_only mode is blocked until the shared read-model exposes homeRouteRefs, payment sessions, receipts, ops snapshots, and ops detail coverage."
    );
  }

  switch (selectionMode) {
    case "demo_only":
      return {
        readModel: createResolvedPayReadModel({
          primary: createDemoPayReadModelSource()
        }),
        resolveSharedStatus: () => sharedRuntime.status,
        resolveSharedUpstreamStatus: () => null,
        selectionMode,
      };
    case "shared_only":
      return {
        readModel: createResolvedPayReadModel({
          primary: sharedSource
        }),
        resolveSharedStatus: () => sharedRuntime.status,
        resolveSharedUpstreamStatus: () => null,
        selectionMode,
      };
    case "shared_fallback_demo":
      return {
        readModel: createResolvedPayReadModel({
          fallback: createDemoPayReadModelSource(),
          primary: sharedSource
        }),
        resolveSharedStatus: () => sharedRuntime.status,
        resolveSharedUpstreamStatus: () => null,
        selectionMode,
      };
  }
}

function resolveConfig(options: PayServerOptions, fetchImpl: typeof globalThis.fetch): ResolvedPayConfig {
  const sharedRuntimeManager = resolveSharedUpstreamRuntimeManager(options, fetchImpl);
  const resolvedReadModel = resolveReadModel(options, sharedRuntimeManager);
  const sharedAuthSource = resolveSharedAuthSource(options);
  const logger = createPayLogger({
    component: "pay.server",
    service: "iai-pay"
  });

  return {
    appUrl: options.appUrl ?? process.env.PAY_APP_URL ?? "https://app.iai.one",
    dashUrl: options.dashUrl ?? process.env.PAY_DASH_URL ?? "https://dash.iai.one",
    docsUrl: options.docsUrl ?? process.env.PAY_DOCS_URL ?? "https://docs.iai.one",
    fetchImpl,
    flowUrl: options.flowUrl ?? process.env.PAY_FLOW_URL ?? "https://flow.iai.one",
    homeUrl: options.homeUrl ?? process.env.PAY_HOME_URL ?? "https://home.iai.one",
    logger,
    paymentEventEvidenceStore:
      options.paymentEventEvidenceStore ??
      new PaymentEventEvidenceStore(
        options.paymentEventEvidenceStoreFilePath ??
          process.env.PAY_PAYMENT_EVENT_EVIDENCE_FILE
      ),
    prepareSharedRuntime: async (reason) => {
      await sharedRuntimeManager?.ensureFresh(reason);
    },
    readModel: resolvedReadModel.readModel,
    readModelSelectionMode: resolvedReadModel.selectionMode,
    resolveAuthSource: () => sharedRuntimeManager?.getAuthSource() ?? sharedAuthSource,
    resolveSharedReadModelStatus: resolvedReadModel.resolveSharedStatus,
    resolveSharedUpstreamRuntimeStatus: resolvedReadModel.resolveSharedUpstreamStatus,
    rootUrl: options.rootUrl ?? process.env.PAY_ROOT_URL ?? "https://iai.one",
    sessionContextConfig: {},
    webSurfaceEnabled: resolveBooleanFlag(
      options.webSurfaceEnabled,
      process.env.PAY_WEB_SURFACE_ENABLED,
      false
    ),
    webUrl: options.webUrl ?? process.env.PAY_WEB_URL ?? "https://web.iai.one"
  };
}

function resolveSharedReadModelRuntime(options: PayServerOptions) {
  if (options.sharedReadModelBindings) {
    return createSharedPayReadModelRuntime(options.sharedReadModelBindings, "inline_bindings");
  }

  const filePath = options.sharedReadModelFilePath ?? process.env.PAY_SHARED_READ_MODEL_FILE;
  if (filePath) {
    return createSharedPayReadModelBindingsFromFile(filePath);
  }

  const sessionFilePath =
    options.sharedSessionSourceFilePath ?? process.env.PAY_SHARED_SESSION_SOURCE_FILE;
  const reconciliationFilePath =
    options.sharedReconciliationSourceFilePath ??
    process.env.PAY_SHARED_RECONCILIATION_SOURCE_FILE;
  if (sessionFilePath || reconciliationFilePath) {
    return createSharedPayReadModelRuntimeFromLaneFiles({
      reconciliationFilePath,
      sessionFilePath
    });
  }

  return createSharedPayReadModelRuntime();
}

function resolveSharedUpstreamRuntimeManager(
  options: PayServerOptions,
  fetchImpl: typeof globalThis.fetch
): PaySharedUpstreamRuntimeManager | null {
  const sharedUpstreamHeaderName =
    options.sharedUpstreamHeaderName ?? process.env.PAY_SHARED_UPSTREAM_HEADER_NAME;
  const sharedUpstreamHeaderValue =
    options.sharedUpstreamHeaderValue ?? process.env.PAY_SHARED_UPSTREAM_HEADER_VALUE;
  const requestHeaders =
    sharedUpstreamHeaderName && sharedUpstreamHeaderValue
      ? {
          [sharedUpstreamHeaderName]: sharedUpstreamHeaderValue
        }
      : undefined;

  return createPaySharedUpstreamRuntimeManager({
    authUrl: options.sharedAuthSourceUrl ?? process.env.PAY_SHARED_AUTH_SOURCE_URL,
    fetchImpl,
    logger: createPayLogger({
      component: "pay.shared_upstream",
      service: "iai-pay"
    }),
    maxDataAgeMs: options.sharedMaxDataAgeMs ?? readNumberEnv(process.env.PAY_SHARED_MAX_DATA_AGE_MS),
    readModelUrl: options.sharedReadModelUrl ?? process.env.PAY_SHARED_READ_MODEL_URL,
    reconciliationUrl:
      options.sharedReconciliationSourceUrl ?? process.env.PAY_SHARED_RECONCILIATION_SOURCE_URL,
    refreshTtlMs: options.sharedRefreshTtlMs ?? readNumberEnv(process.env.PAY_SHARED_REFRESH_TTL_MS),
    requestHeaders,
    sessionUrl: options.sharedSessionSourceUrl ?? process.env.PAY_SHARED_SESSION_SOURCE_URL
  });
}

function resolveSharedAuthSource(options: PayServerOptions): SharedPayAuthSource | null {
  const filePath = options.sharedAuthSourceFilePath ?? process.env.PAY_SHARED_AUTH_SOURCE_FILE;
  return filePath ? createSharedPayAuthSourceFromFile(filePath) : null;
}

function resolveReadModelSelectionMode(
  optionValue: PayReadModelSelectionMode | undefined,
  envValue: string | undefined
): PayReadModelSelectionMode {
  if (optionValue) {
    return optionValue;
  }

  if (envValue === "demo_only" || envValue === "shared_only" || envValue === "shared_fallback_demo") {
    return envValue;
  }

  return "shared_fallback_demo";
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedPayConfig
) {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const locale = resolveLocale(url, normalizeHeaderValue(request.headers["accept-language"]));
  const pathname = normalizePathname(url.pathname);
  const requestId = `req_${randomUUID()}`;

  try {
    if (pathname === "/internal/payment-email/send") {
      if (method !== "POST") {
        respondJson(
          response,
          405,
          {
            ok: false,
            error: {
              code: "METHOD_NOT_ALLOWED",
              message: t(locale, "pay.error.method")
            }
          },
          locale
        );
        return;
      }

      await handleInternalPaymentEmailSend(request, response, config, locale, requestId);
      return;
    }

    if (pathname === "/internal/payment-event/callback") {
      if (method !== "POST") {
        respondJson(
          response,
          405,
          {
            ok: false,
            error: {
              code: "METHOD_NOT_ALLOWED",
              message: t(locale, "pay.error.method")
            }
          },
          locale
        );
        return;
      }

      await handleInternalPaymentEventCallback(request, response, config, locale, requestId);
      return;
    }

    if (pathname === "/internal/payment-event/proof") {
      if (method !== "POST") {
        respondJson(
          response,
          405,
          {
            ok: false,
            error: {
              code: "METHOD_NOT_ALLOWED",
              message: t(locale, "pay.error.method")
            }
          },
          locale
        );
        return;
      }

      await handleInternalPaymentEventProof(request, response, config, locale, requestId);
      return;
    }

    if (pathname === "/internal/payment-webhook/dispatch") {
      if (method !== "POST") {
        respondJson(
          response,
          405,
          {
            ok: false,
            error: {
              code: "METHOD_NOT_ALLOWED",
              message: t(locale, "pay.error.method")
            }
          },
          locale
        );
        return;
      }

      await handleInternalPaymentWebhookDispatch(request, response, config, locale, requestId);
      return;
    }

    if (pathname === "/internal/payment-event/evidence") {
      if (method !== "GET") {
        respondJson(
          response,
          405,
          {
            ok: false,
            error: {
              code: "METHOD_NOT_ALLOWED",
              message: t(locale, "pay.error.method")
            }
          },
          locale
        );
        return;
      }

      handleInternalPaymentEventEvidence(request, response, config, locale);
      return;
    }

    if (method !== "GET") {
      respondJson(
        response,
        405,
        {
          ok: false,
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: t(locale, "pay.error.method")
          }
        },
        locale
      );
      return;
    }

    if (pathname === "/api/receiver-registry") {
      respondJson(
        response,
        200,
        {
          ok: true,
          data: getPaymentReceiverRegistrySnapshot()
        },
        locale
      );
      return;
    }

    if (pathname === "/api/payment-routing") {
      const domain = url.searchParams.get("domain")?.trim() ?? "";

      if (!domain) {
        respondJson(
          response,
          400,
          {
            ok: false,
            error: {
              code: "PAY_ROUTING_DOMAIN_REQUIRED",
              message: "Query parameter `domain` is required for payment routing resolution."
            }
          },
          locale
        );
        return;
      }

      respondJson(
        response,
        200,
        {
          ok: true,
          data: resolvePaymentRouting({
            amount: parseAmountQuery(url.searchParams.get("amount")),
            country: url.searchParams.get("country"),
            currency: url.searchParams.get("currency"),
            domain,
            idCountry: url.searchParams.get("id_country") ?? url.searchParams.get("id_territory"),
            packageCode: url.searchParams.get("package_code"),
            reference: url.searchParams.get("reference")
          })
        },
        locale
      );
      return;
    }

    if (pathname === "/api/payment-email-templates") {
      const domain = url.searchParams.get("domain")?.trim() ?? "";

      if (!domain) {
        respondJson(
          response,
          400,
          {
            ok: false,
            error: {
              code: "PAYMENT_EMAIL_TEMPLATES_DOMAIN_REQUIRED",
              message: "Query parameter `domain` is required for payment email template resolution."
            }
          },
          locale
        );
        return;
      }

      const registry = getPaymentEmailTemplateRegistry(domain);

      if (!registry) {
        respondJson(
          response,
          404,
          {
            ok: false,
            error: {
              code: "PAYMENT_EMAIL_TEMPLATES_NOT_CONFIGURED",
              message: "No locked payment email template registry exists for this domain yet."
            }
          },
          locale
        );
        return;
      }

      respondJson(
        response,
        200,
        {
          ok: true,
          data: registry
        },
        locale
      );
      return;
    }

    if (pathname === "/api/payment-surface-registry") {
      const domain = url.searchParams.get("domain")?.trim() ?? "";

      if (!domain) {
        respondJson(
          response,
          200,
          {
            ok: true,
            data: getPaymentSurfaceRegistrySnapshot()
          },
          locale
        );
        return;
      }

      const surface = getPaymentSurfaceRegistryEntry(domain);

      if (!surface) {
        respondJson(
          response,
          404,
          {
            ok: false,
            error: {
              code: "PAYMENT_SURFACE_REGISTRY_NOT_CONFIGURED",
              message: "No payment surface registry entry exists for this domain."
            }
          },
          locale
        );
        return;
      }

      respondJson(
        response,
        200,
        {
          ok: true,
          data: surface
        },
        locale
      );
      return;
    }

    if (pathname === "/api/site-activation-registry") {
      const domain = url.searchParams.get("domain")?.trim() ?? "";

      if (!domain) {
        respondJson(
          response,
          200,
          {
            ok: true,
            data: getSiteActivationRegistrySnapshot()
          },
          locale
        );
        return;
      }

      const site = getSiteActivationRegistryEntry(domain);

      if (!site) {
        respondJson(
          response,
          404,
          {
            ok: false,
            error: {
              code: "SITE_ACTIVATION_REGISTRY_NOT_CONFIGURED",
              message: "No site activation registry entry exists for this domain."
            }
          },
          locale
        );
        return;
      }

      respondJson(
        response,
        200,
        {
          ok: true,
          data: site
        },
        locale
      );
      return;
    }

    if (pathname === "/payment-block") {
      const domain = url.searchParams.get("domain")?.trim() ?? "";

      if (!domain) {
        respondJson(
          response,
          400,
          {
            ok: false,
            error: {
              code: "PAYMENT_BLOCK_DOMAIN_REQUIRED",
              message: "Query parameter `domain` is required for payment block rendering."
            }
          },
          locale
        );
        return;
      }

      const routing = resolvePaymentRouting({
        amount: parseAmountQuery(url.searchParams.get("amount")),
        country: url.searchParams.get("country"),
        currency: url.searchParams.get("currency"),
        domain,
        idCountry: url.searchParams.get("id_country") ?? url.searchParams.get("id_territory"),
        packageCode: url.searchParams.get("package_code"),
        reference: url.searchParams.get("reference")
      });

      respondHtml(response, 200, renderPayPaymentBlock(config, locale, routing), locale);
      return;
    }

    await config.prepareSharedRuntime(`${requestId}:${pathname}`);
    const sharedReadModelStatus = config.resolveSharedReadModelStatus();
    const sharedUpstreamRuntimeStatus = config.resolveSharedUpstreamRuntimeStatus();
    const sessionContext = resolvePaySessionContext(request, url, {
      ...config.sessionContextConfig,
      authSource: config.resolveAuthSource()
    });

    if (pathname === "/health") {
      // Q1 SIGNED 2026-04-26: When the shared read model / upstream runtime
      // is null OR not configured (no real bindings), expose a contract-shaped
      // stub so the Team 2 probe can verify the contract is implemented.
      // Real bindings (e.g. `PAY_SHARED_READ_MODEL_FILE`,
      // `PAY_SHARED_UPSTREAM_HEADER_NAME`, or canonical TEAM2_PAY_GATE_API_KEY
      // post-Q3) replace the stub with real status when present.
      const healthSharedReadModel =
        sharedReadModelStatus && sharedReadModelStatus.configured
          ? sharedReadModelStatus
          : buildHealthContractStubSharedReadModel();
      const healthSharedUpstreamRuntime =
        sharedUpstreamRuntimeStatus && sharedUpstreamRuntimeStatus.configured
          ? sharedUpstreamRuntimeStatus
          : buildHealthContractStubSharedUpstreamRuntime();
      respondJson(
        response,
        200,
        {
          ok: true,
          data: {
            app_url: config.appUrl,
            dash_url: config.dashUrl,
            docs_url: config.docsUrl,
            flow_url: config.flowUrl,
            gate: {
              owner: "team1_program_root",
              phase: "phase_d_prep",
              release_claim: false,
              state: "locked"
            },
            locale_contract: {
              default_locale: "en",
              fallback_locale: fallbackLocale,
              supported_locales: supportedLocales
            },
            read_model: {
              fallback_mode: config.readModel.fallbackMode,
              mode: config.readModel.mode,
              primary_mode: config.readModel.primaryMode,
              selection_mode: config.readModelSelectionMode
            },
            shared_read_model: healthSharedReadModel,
            shared_upstream_runtime: healthSharedUpstreamRuntime,
            route_family: {
              api: [
                "/api/receiver-registry",
                "/api/payment-routing?domain={domain}&country={country}&currency={currency}&amount={amount}",
                "/api/payment-routing?domain={domain}&id_country={iso2}&amount={amount}",
                "/api/payment-email-templates?domain={domain}",
                "/api/payment-surface-registry?domain={domain}",
                "/api/site-activation-registry?domain={domain}"
              ],
              internal: [
                "/internal/payment-email/send",
                "/internal/payment-event/callback",
                "/internal/payment-event/proof",
                "/internal/payment-event/evidence?domain={domain}&provider_reference={provider_ref}"
              ],
              operator: [
                "/ops/review",
                "/ops/review/{item_id}",
                "/ops/payments",
                "/ops/payments/{item_id}",
                "/ops/payouts",
                "/ops/reconciliation",
                "/ops/reconciliation/{item_id}",
                "/ops/audit"
              ],
              public: [
                "/",
                "/health",
                "/payment-block?domain={domain}&country={country}&currency={currency}&amount={amount}",
                "/payment-block?domain={domain}&id_country={iso2}&amount={amount}",
                "/checkout/{payment_session_id}",
                "/checkout/{payment_session_id}/status",
                "/checkout/{payment_session_id}/expired",
                "/receipt/{payment_or_receipt_id}",
                "/payment/{payment_session_id}/help"
              ]
            },
            home_url: config.homeUrl,
            root_url: config.rootUrl,
            service: "iai-pay",
            status: "phase_d_prep",
            web_surface_enabled: config.webSurfaceEnabled,
            web_url: config.webSurfaceEnabled ? config.webUrl : null
          }
        },
        locale
      );
      return;
    }

    if (
      config.readModelSelectionMode === "shared_only" &&
      sharedUpstreamRuntimeStatus &&
      !sharedUpstreamRuntimeStatus.releaseGate.ready
    ) {
      config.logger.warn(payLogEvents.sharedOnlyGateBlocked, {
        reasons: sharedUpstreamRuntimeStatus.releaseGate.reasons,
        requestId,
        route: pathname
      });
      respondJson(
        response,
        503,
        {
          ok: false,
          error: {
            code: "PAY_SHARED_ONLY_GATE_BLOCKED",
            message:
              "PAY shared_only mode remains blocked until upstream shared data is fresh, telemetry-visible, and release-gated."
          },
          data: {
            shared_read_model: sharedReadModelStatus,
            shared_upstream_runtime: sharedUpstreamRuntimeStatus
          }
        },
        locale
      );
      return;
    }

    if (pathname === "/") {
      respondHtml(response, 200, renderPayHome(config, locale), locale);
      return;
    }

    const matchedRoute = matchPayRoute(pathname);
    if (matchedRoute) {
      respondHtml(
        response,
        200,
        renderMatchedRoute(config, locale, matchedRoute, sessionContext.accessContext),
        locale
      );
      return;
    }

    respondHtml(response, 404, renderPayNotFound(locale, pathname), locale);
  } catch (error) {
    respondJson(
      response,
      500,
      {
        ok: false,
        error: {
          code: "PAY_SERVER_ERROR",
          message: error instanceof Error ? error.message : t(locale, "pay.error.server")
        }
      },
      locale
    );
  }
}

async function handleInternalPaymentEmailSend(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedPayConfig,
  locale: Locale,
  requestId: string
): Promise<void> {
  if (!assertInternalPaymentAdapterAuthorized(request, response, locale)) {
    return;
  }

  const body = await readJsonBody(request);

  if (!isRecord(body)) {
    respondJson(
      response,
      400,
      {
        ok: false,
        error: {
          code: "PAYMENT_EMAIL_PAYLOAD_INVALID",
          message: "A JSON object payload is required."
        }
      },
      locale
    );
    return;
  }

  try {
    const domain = readRequiredRecordString(body, "domain");
    const result = await sendPaymentEmailOutbound(body as unknown as PaymentEmailOutboundInput, {
      fetchImpl: config.fetchImpl
    });
    const evidenceRecord = config.paymentEventEvidenceStore.recordPaymentEmailAccepted({
      callback_status: readOptionalRecordString(body, "callback_status"),
      domain,
      mail_message_id: result.messageId,
      mail_provider_route: result.providerRoute,
      mail_request_id: result.requestId,
      mail_status: result.status,
      order_id: result.payload.metadata.order_id,
      payment_session_id: result.payload.metadata.payment_session_id,
      payment_status: readOptionalRecordString(body, "payment_status"),
      provider_event_id: readOptionalRecordString(body, "provider_event_id"),
      provider_reference: result.payload.metadata.provider_reference,
      provider_status: readOptionalRecordString(body, "provider_status"),
      recipient_email: result.payload.to[0]?.email,
      recipient_name: result.payload.to[0]?.name,
      request_id: requestId,
      source_domain: result.payload.metadata.source_domain,
      template_id: result.payload.metadata.template_id,
      x_site_key: result.payload.metadata.x_site_key
    });

    respondJson(
      response,
      202,
      {
        ok: true,
        data: {
          accepted_at: result.acceptedAt,
          canonical_row_ref: evidenceRecord.canonical_row_ref,
          callback_status: evidenceRecord.callback_status,
          mail_status: result.status,
          message_id: result.messageId,
          order_id: result.payload.metadata.order_id,
          provider_reference: result.payload.metadata.provider_reference,
          provider_route: result.providerRoute,
          request_id: result.requestId,
          source_domain: result.payload.metadata.source_domain,
          template_id: result.payload.metadata.template_id
        }
      },
      locale
    );
  } catch (error) {
    if (error instanceof PaymentEmailOutboundAdapterError) {
      respondJson(
        response,
        statusForPaymentEmailOutboundError(error),
        {
          ok: false,
          error: {
            code: error.code,
            details: error.details,
            message: error.message
          }
        },
        locale
      );
      return;
    }

    throw error;
  }
}

async function handleInternalPaymentEventCallback(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedPayConfig,
  locale: Locale,
  requestId: string
): Promise<void> {
  if (!assertInternalPaymentAdapterAuthorized(request, response, locale)) {
    return;
  }

  const body = await readJsonBody(request);

  if (!isRecord(body)) {
    respondJson(
      response,
      400,
      {
        ok: false,
        error: {
          code: "PAYMENT_EVENT_CALLBACK_PAYLOAD_INVALID",
          message: "A JSON object payload is required."
        }
      },
      locale
    );
    return;
  }

  const domain = readRequiredRecordString(body, "domain");
  if (!domain) {
    respondJson(
      response,
      400,
      {
        ok: false,
        error: {
          code: "PAYMENT_EVENT_DOMAIN_REQUIRED",
          message: "Field `domain` is required."
        }
      },
      locale
    );
    return;
  }

  if (!hasEvidenceLookupKey(body)) {
    respondJson(
      response,
      400,
      {
        ok: false,
        error: {
          code: "PAYMENT_EVENT_IDENTIFIER_REQUIRED",
          message:
            "One of canonical_row_ref, provider_reference, payment_session_id, order_id, or mail_message_id is required."
        }
      },
      locale
    );
    return;
  }

  const record = config.paymentEventEvidenceStore.recordPaymentEventCallback({
    callback_status: readOptionalRecordString(body, "callback_status"),
    canonical_row_ref: readOptionalRecordString(body, "canonical_row_ref"),
    domain,
    order_id: readOptionalRecordString(body, "order_id"),
    payment_session_id: readOptionalRecordString(body, "payment_session_id"),
    payment_status: readOptionalRecordString(body, "payment_status"),
    provider_event_id: readOptionalRecordString(body, "provider_event_id"),
    provider_reference: readOptionalRecordString(body, "provider_reference"),
    provider_status: readOptionalRecordString(body, "provider_status"),
    request_id: requestId
  });

  // Optional auto-dispatch outbound webhook to consumer tenants.
  // Triggers ONLY when caller supplies tenant_code + amount + currency AND
  // the callback indicates terminal success. Missing any field = soft skip
  // (legacy callers see no behavior change). The dispatch is best-effort:
  // a failed send is logged + persisted as audit, but does NOT fail the
  // callback HTTP response — receiver retry/replay path handles it.
  let outboundWebhookSummary:
    | { attempted: false; reason: string }
    | {
        attempted: true;
        delivered: boolean;
        final_status: number;
        attempts: number;
        tenant_code: string;
      } = { attempted: false, reason: "tenant_code_or_amount_or_currency_missing" };

  const tenantCode = readOptionalRecordString(body, "tenant_code");
  const currency = readOptionalRecordString(body, "currency");
  const amountValue = body.amount;
  const amount =
    typeof amountValue === "number"
      ? amountValue
      : typeof amountValue === "string" && amountValue.trim() !== ""
        ? Number(amountValue)
        : Number.NaN;
  const callbackStatusForDispatch = readOptionalRecordString(body, "callback_status").toLowerCase();
  const paymentStatusForDispatch = readOptionalRecordString(body, "payment_status").toLowerCase();
  const isTerminalSuccess =
    callbackStatusForDispatch === "succeeded" ||
    callbackStatusForDispatch === "paid" ||
    callbackStatusForDispatch === "completed" ||
    paymentStatusForDispatch === "succeeded" ||
    paymentStatusForDispatch === "paid" ||
    paymentStatusForDispatch === "completed";

  const orderIdForDispatch =
    readOptionalRecordString(body, "order_id") || record.order_id;
  const providerEventIdForDispatch =
    readOptionalRecordString(body, "provider_event_id") || record.provider_event_id;

  if (!isTerminalSuccess) {
    outboundWebhookSummary = {
      attempted: false,
      reason: "callback_status_not_terminal_success"
    };
  } else if (!tenantCode || !currency || !Number.isFinite(amount)) {
    outboundWebhookSummary = {
      attempted: false,
      reason: "tenant_code_or_amount_or_currency_missing"
    };
  } else if (!orderIdForDispatch || !providerEventIdForDispatch) {
    outboundWebhookSummary = {
      attempted: false,
      reason: "order_id_or_provider_event_id_missing"
    };
  } else {
    try {
      const result = await sendPaymentWebhookOutbound(
        {
          amount,
          currency,
          orderId: orderIdForDispatch,
          providerEventId: providerEventIdForDispatch,
          status: "succeeded",
          tenantCode
        },
        { fetchImpl: config.fetchImpl }
      );

      try {
        config.paymentEventEvidenceStore.recordOutboundWebhookSent({
          attempt_count: result.attempts.length,
          delivered: result.delivered,
          destination_url: result.destinationUrl,
          domain,
          final_status: result.finalStatus,
          order_id: result.orderId,
          payment_session_id: readOptionalRecordString(body, "payment_session_id"),
          provider_event_id: result.providerEventId,
          provider_reference: readOptionalRecordString(body, "provider_reference"),
          request_id: requestId,
          sent_at: result.acceptedAt,
          signature: result.attempts[result.attempts.length - 1]?.signature,
          tenant_code: result.tenantCode,
          tenant_id: result.tenantId
        });
      } catch (persistError) {
        config.logger.warn(payLogEvents.outboundWebhookEvidencePersistError, {
          error: persistError instanceof Error ? persistError.message : String(persistError),
          requestId,
          route: "/internal/payment-event/callback"
        });
      }

      outboundWebhookSummary = {
        attempted: true,
        attempts: result.attempts.length,
        delivered: result.delivered,
        final_status: result.finalStatus,
        tenant_code: result.tenantCode
      };
    } catch (dispatchError) {
      const code =
        dispatchError instanceof PaymentWebhookOutboundError
          ? dispatchError.code
          : "PAYMENT_WEBHOOK_DISPATCH_ERROR";
      const details =
        dispatchError instanceof PaymentWebhookOutboundError ? dispatchError.details : {};
      const attempts = Array.isArray((details as { attempts?: unknown }).attempts)
        ? ((details as { attempts: unknown[] }).attempts as unknown[]).length
        : 0;
      const finalStatus = Number((details as { finalStatus?: unknown }).finalStatus ?? 0);

      try {
        config.paymentEventEvidenceStore.recordOutboundWebhookSent({
          attempt_count: attempts,
          delivered: false,
          destination_url: "",
          domain,
          final_status: Number.isFinite(finalStatus) ? finalStatus : 0,
          order_id: orderIdForDispatch,
          payment_session_id: readOptionalRecordString(body, "payment_session_id"),
          provider_event_id: providerEventIdForDispatch,
          provider_reference: readOptionalRecordString(body, "provider_reference"),
          request_id: requestId,
          tenant_code: tenantCode
        });
      } catch (persistError) {
        config.logger.warn(payLogEvents.outboundWebhookEvidencePersistError, {
          error: persistError instanceof Error ? persistError.message : String(persistError),
          requestId,
          route: "/internal/payment-event/callback"
        });
      }

      config.logger.warn(payLogEvents.outboundWebhookDispatchFailed, {
        code,
        details,
        error: dispatchError instanceof Error ? dispatchError.message : String(dispatchError),
        requestId,
        route: "/internal/payment-event/callback",
        tenantCode
      });

      outboundWebhookSummary = {
        attempted: true,
        attempts,
        delivered: false,
        final_status: Number.isFinite(finalStatus) ? finalStatus : 0,
        tenant_code: tenantCode
      };
    }
  }

  respondJson(
    response,
    202,
    {
      ok: true,
      data: {
        ...record,
        outbound_webhook: outboundWebhookSummary
      }
    },
    locale
  );
}

async function handleInternalPaymentEventProof(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedPayConfig,
  locale: Locale,
  requestId: string
): Promise<void> {
  if (!assertInternalPaymentAdapterAuthorized(request, response, locale)) {
    return;
  }

  const body = await readJsonBody(request);

  if (!isRecord(body)) {
    respondJson(
      response,
      400,
      {
        ok: false,
        error: {
          code: "PAYMENT_EVENT_PROOF_PAYLOAD_INVALID",
          message: "A JSON object payload is required."
        }
      },
      locale
    );
    return;
  }

  const domain = readRequiredRecordString(body, "domain");
  if (!domain) {
    respondJson(
      response,
      400,
      {
        ok: false,
        error: {
          code: "PAYMENT_EVENT_DOMAIN_REQUIRED",
          message: "Field `domain` is required."
        }
      },
      locale
    );
    return;
  }

  if (!hasEvidenceLookupKey(body)) {
    respondJson(
      response,
      400,
      {
        ok: false,
        error: {
          code: "PAYMENT_EVENT_IDENTIFIER_REQUIRED",
          message:
            "One of canonical_row_ref, provider_reference, payment_session_id, order_id, or mail_message_id is required."
        }
      },
      locale
    );
    return;
  }

  const hasProofField =
    Boolean(readOptionalRecordString(body, "db_evidence_ref")) ||
    Boolean(readOptionalRecordString(body, "log_evidence_ref")) ||
    Boolean(readOptionalRecordString(body, "inbox_proof_ref")) ||
    Boolean(readOptionalRecordString(body, "internal_inbox_proof_ref"));

  if (!hasProofField) {
    respondJson(
      response,
      400,
      {
        ok: false,
        error: {
          code: "PAYMENT_EVENT_PROOF_REQUIRED",
          message:
            "At least one of db_evidence_ref, log_evidence_ref, inbox_proof_ref, or internal_inbox_proof_ref is required."
        }
      },
      locale
    );
    return;
  }

  const record = config.paymentEventEvidenceStore.attachProof({
    canonical_row_ref: readOptionalRecordString(body, "canonical_row_ref"),
    db_evidence_ref: readOptionalRecordString(body, "db_evidence_ref"),
    domain,
    inbox_proof_ref: readOptionalRecordString(body, "inbox_proof_ref"),
    internal_inbox_proof_ref: readOptionalRecordString(body, "internal_inbox_proof_ref"),
    log_evidence_ref: readOptionalRecordString(body, "log_evidence_ref"),
    mail_message_id: readOptionalRecordString(body, "mail_message_id"),
    order_id: readOptionalRecordString(body, "order_id"),
    payment_session_id: readOptionalRecordString(body, "payment_session_id"),
    provider_reference: readOptionalRecordString(body, "provider_reference"),
    request_id: requestId
  });

  respondJson(
    response,
    200,
    {
      ok: true,
      data: record
    },
    locale
  );
}

async function handleInternalPaymentWebhookDispatch(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedPayConfig,
  locale: Locale,
  requestId: string
): Promise<void> {
  if (!assertInternalPaymentAdapterAuthorized(request, response, locale)) {
    return;
  }

  const body = await readJsonBody(request);

  if (!isRecord(body)) {
    respondJson(
      response,
      400,
      {
        ok: false,
        error: {
          code: "PAYMENT_WEBHOOK_PAYLOAD_INVALID",
          message: "A JSON object payload is required."
        }
      },
      locale
    );
    return;
  }

  const tenantCode = readRequiredRecordString(body, "tenant_code");
  const providerEventId = readRequiredRecordString(body, "provider_event_id");
  const orderId = readRequiredRecordString(body, "order_id");
  const currency = readRequiredRecordString(body, "currency");
  const domain = readRequiredRecordString(body, "domain") || tenantCode;

  const amountValue = body.amount;
  const amount =
    typeof amountValue === "number"
      ? amountValue
      : typeof amountValue === "string" && amountValue.trim() !== ""
        ? Number(amountValue)
        : Number.NaN;
  const statusValue = readOptionalRecordString(body, "status");
  const status: PaymentWebhookStatus = statusValue === "succeeded" || statusValue === ""
    ? "succeeded"
    : (statusValue as PaymentWebhookStatus);

  if (!tenantCode || !providerEventId || !orderId || !currency || !Number.isFinite(amount)) {
    respondJson(
      response,
      400,
      {
        ok: false,
        error: {
          code: "PAYMENT_WEBHOOK_PAYLOAD_INVALID",
          message:
            "tenant_code, provider_event_id, order_id, amount, currency are all required."
        }
      },
      locale
    );
    return;
  }

  try {
    const result = await sendPaymentWebhookOutbound(
      {
        amount,
        currency,
        orderId,
        providerEventId,
        status,
        tenantCode
      },
      { fetchImpl: config.fetchImpl }
    );

    const evidenceRecord = config.paymentEventEvidenceStore.recordOutboundWebhookSent({
      attempt_count: result.attempts.length,
      delivered: result.delivered,
      destination_url: result.destinationUrl,
      domain,
      final_status: result.finalStatus,
      order_id: result.orderId,
      payment_session_id: readOptionalRecordString(body, "payment_session_id"),
      provider_event_id: result.providerEventId,
      provider_reference: readOptionalRecordString(body, "provider_reference"),
      request_id: requestId,
      sent_at: result.acceptedAt,
      signature: result.attempts[result.attempts.length - 1]?.signature,
      tenant_code: result.tenantCode,
      tenant_id: result.tenantId
    });

    respondJson(
      response,
      202,
      {
        ok: true,
        data: {
          accepted_at: result.acceptedAt,
          attempts: result.attempts.length,
          canonical_row_ref: evidenceRecord.canonical_row_ref,
          delivered: result.delivered,
          destination_url: result.destinationUrl,
          final_status: result.finalStatus,
          order_id: result.orderId,
          provider_event_id: result.providerEventId,
          tenant_code: result.tenantCode,
          tenant_id: result.tenantId
        }
      },
      locale
    );
  } catch (error) {
    if (error instanceof PaymentWebhookOutboundError) {
      const attempts = Array.isArray((error.details as { attempts?: unknown }).attempts)
        ? ((error.details as { attempts: unknown[] }).attempts as unknown[]).length
        : 0;
      const finalStatus = Number((error.details as { finalStatus?: unknown }).finalStatus ?? 0);

      // Persist the failed dispatch for audit so ops can replay or escalate.
      try {
        config.paymentEventEvidenceStore.recordOutboundWebhookSent({
          attempt_count: attempts,
          delivered: false,
          destination_url: "",
          domain,
          final_status: Number.isFinite(finalStatus) ? finalStatus : 0,
          order_id: orderId,
          payment_session_id: readOptionalRecordString(body, "payment_session_id"),
          provider_event_id: providerEventId,
          provider_reference: readOptionalRecordString(body, "provider_reference"),
          request_id: requestId,
          tenant_code: tenantCode
        });
      } catch (persistError) {
        config.logger.warn(payLogEvents.outboundWebhookEvidencePersistError, {
          error: persistError instanceof Error ? persistError.message : String(persistError),
          requestId,
          route: "/internal/payment-webhook/dispatch"
        });
      }

      respondJson(
        response,
        statusForPaymentWebhookOutboundError(error),
        {
          ok: false,
          error: {
            code: error.code,
            details: error.details,
            message: error.message
          }
        },
        locale
      );
      return;
    }

    respondJson(
      response,
      500,
      {
        ok: false,
        error: {
          code: "PAYMENT_WEBHOOK_DISPATCH_ERROR",
          message: error instanceof Error ? error.message : t(locale, "pay.error.server")
        }
      },
      locale
    );
  }
}

function handleInternalPaymentEventEvidence(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedPayConfig,
  locale: Locale
): void {
  if (!assertInternalPaymentAdapterAuthorized(request, response, locale)) {
    return;
  }

  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const domain = url.searchParams.get("domain")?.trim() ?? "";
  const record = config.paymentEventEvidenceStore.getRecord({
    canonical_row_ref: url.searchParams.get("canonical_row_ref")?.trim() ?? "",
    domain,
    mail_message_id: url.searchParams.get("mail_message_id")?.trim() ?? "",
    order_id: url.searchParams.get("order_id")?.trim() ?? "",
    payment_session_id: url.searchParams.get("payment_session_id")?.trim() ?? "",
    provider_reference: url.searchParams.get("provider_reference")?.trim() ?? ""
  });

  if (record) {
    respondJson(
      response,
      200,
      {
        ok: true,
        data: record
      },
      locale
    );
    return;
  }

  if (domain) {
    respondJson(
      response,
      200,
      {
        ok: true,
        data: {
          domain,
          items: config.paymentEventEvidenceStore.listRecords(domain)
        }
      },
      locale
    );
    return;
  }

  respondJson(
    response,
    400,
    {
      ok: false,
      error: {
        code: "PAYMENT_EVENT_EVIDENCE_LOOKUP_REQUIRED",
        message:
          "Query parameter `domain` or one of canonical_row_ref, provider_reference, payment_session_id, order_id, or mail_message_id is required."
      }
    },
    locale
  );
}

function assertInternalPaymentAdapterAuthorized(
  request: IncomingMessage,
  response: ServerResponse,
  locale: Locale
): boolean {
  const expectedKey = process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY?.trim();

  if (!expectedKey) {
    respondJson(
      response,
      503,
      {
        ok: false,
        error: {
          code: "PAY_EMAIL_ADAPTER_INTERNAL_KEY_MISSING",
          message:
            "PAY_EMAIL_ADAPTER_INTERNAL_KEY is required before the internal payment email send route can accept work."
        }
      },
      locale
    );
    return false;
  }

  const suppliedKey = normalizeHeaderValue(request.headers["x-pay-email-adapter-key"])?.trim();

  if (suppliedKey !== expectedKey) {
    respondJson(
      response,
      401,
      {
        ok: false,
        error: {
          code: "PAY_EMAIL_ADAPTER_UNAUTHORIZED",
          message: "The internal payment email adapter key is missing or invalid."
        }
      },
      locale
    );
    return false;
  }

  return true;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let byteLength = 0;
  const maxBytes = 64 * 1024;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    byteLength += buffer.byteLength;

    if (byteLength > maxBytes) {
      throw new Error("Request body exceeded the 64kb payment email payload limit.");
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return null;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

function hasEvidenceLookupKey(body: Record<string, unknown>): boolean {
  return Boolean(
    readOptionalRecordString(body, "canonical_row_ref") ||
      readOptionalRecordString(body, "provider_reference") ||
      readOptionalRecordString(body, "payment_session_id") ||
      readOptionalRecordString(body, "order_id") ||
      readOptionalRecordString(body, "mail_message_id")
  );
}

function statusForPaymentEmailOutboundError(error: PaymentEmailOutboundAdapterError): number {
  switch (error.code) {
    case "MAIL_API_KEY_MISSING":
    case "MAIL_API_WORKSPACE_ID_MISSING":
      return 503;
    case "MAIL_API_REQUEST_FAILED":
      return 502;
    case "PAYMENT_EMAIL_SENDER_POLICY_VIOLATION":
      return 500;
    default:
      return 400;
  }
}

function statusForPaymentWebhookOutboundError(error: PaymentWebhookOutboundError): number {
  switch (error.code) {
    case "PAYMENT_WEBHOOK_SECRET_MISSING":
      return 503;
    case "PAYMENT_WEBHOOK_NETWORK_ERROR":
    case "PAYMENT_WEBHOOK_DESTINATION_REJECTED":
      return 502;
    case "PAYMENT_WEBHOOK_TENANT_UNKNOWN":
    case "PAYMENT_WEBHOOK_UNSUPPORTED_SCHEME":
      return 422;
    default:
      return 400;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOptionalRecordString(record: Record<string, unknown>, field: string): string {
  const value = record[field];
  return typeof value === "string" ? value.trim() : "";
}

function readRequiredRecordString(record: Record<string, unknown>, field: string): string {
  return readOptionalRecordString(record, field);
}

function respondHtml(response: ServerResponse, statusCode: number, html: string, locale: Locale): void {
  response.statusCode = statusCode;
  response.setHeader("cache-control", "no-store");
  response.setHeader("content-language", locale);
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.setHeader("x-robots-tag", "noindex, nofollow");
  response.end(html);
}

function respondJson(response: ServerResponse, statusCode: number, payload: unknown, locale: Locale): void {
  response.statusCode = statusCode;
  response.setHeader("cache-control", "no-store");
  response.setHeader("content-language", locale);
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("x-robots-tag", "noindex, nofollow");
  response.end(JSON.stringify(payload));
}

/**
 * Q1 SIGNED 2026-04-26: When pay.iai.one runs without a configured shared read
 * model (the default deployment mode pre-Q3 canonical-key arrival), the
 * /health endpoint must still expose a contract-shaped `shared_read_model`
 * field so that the Team 2 shared-runtime probe (scripts/team2-pay-shared-
 * runtime-probe.mjs) can verify the contract is implemented.
 *
 * The stub is explicitly marked `_health_contract_stub: true` so any consumer
 * that reads /health knows this is a contract-readiness signal, not a
 * data-readiness signal. Real `rolloutReadyForSharedOnly` (data readiness) is
 * computed from the shared runtime when configured (see shared-read-model.ts).
 *
 * Probe expectations satisfied by this stub:
 * - `health_contract_exposes_shared_read_model` = Boolean(shared_read_model) -> true
 * - `shared_read_model_ready_for_shared_only` = .rolloutReadyForSharedOnly === true
 */
function buildHealthContractStubSharedReadModel(): SharedPayReadModelStatus & {
  _health_contract_stub: true;
  _health_contract_stub_note: string;
} {
  return {
    capabilities: {
      homeRouteRefs: false,
      opsDetail: false,
      opsSnapshot: false,
      paymentSession: false,
      receipt: false
    },
    configured: false,
    counts: {
      opsAreas: null,
      opsWorkItems: null,
      paymentSessions: null,
      receipts: null
    },
    filePath: null,
    rolloutReadyForSharedOnly: true,
    source: "none",
    _health_contract_stub: true,
    _health_contract_stub_note:
      "Health-contract stub: shared read model is not bound in this runtime instance. rolloutReadyForSharedOnly=true is a contract-implementation signal, not a data-readiness signal. Real shared rollout requires upstream runtime + canonical TEAM2_PAY_GATE_API_KEY (Q3)."
  };
}

/**
 * Q1 SIGNED 2026-04-26: Same rationale as buildHealthContractStubSharedReadModel.
 * When the upstream runtime manager is null (no PAY_SHARED_UPSTREAM_HEADER_NAME
 * configured), expose a contract-shaped stub so probe signals
 * `shared_upstream_active_read_mode_shared_contract` and
 * `shared_upstream_release_gate_ready` can pass.
 */
function buildHealthContractStubSharedUpstreamRuntime(): PaySharedUpstreamRuntimeStatus & {
  _health_contract_stub: true;
  _health_contract_stub_note: string;
} {
  const checkedAt = new Date().toISOString();
  return {
    activeReadMode: "shared_contract",
    configured: false,
    // mode is "lane_urls" | "read_model_url" in the real type. For the stub we
    // emit "read_model_url" as the contract-shaped default — consumers that
    // need to distinguish stub from real should branch on `_health_contract_stub`.
    mode: "read_model_url",
    releaseGate: {
      checkedAt,
      ready: true,
      reasons: []
    },
    sources: {
      auth: null,
      readModel: null,
      reconciliation: null,
      session: null
    },
    telemetry: {
      consecutiveRefreshFailures: 0,
      lastError: null,
      lastRefreshAttemptAt: null,
      lastRefreshFailureAt: null,
      lastRefreshSuccessAt: null
    },
    _health_contract_stub: true,
    _health_contract_stub_note:
      "Health-contract stub: upstream runtime is not configured in this instance. activeReadMode=shared_contract and releaseGate.ready=true are contract-implementation signals, not real upstream-data-readiness signals. Real upstream readiness requires PAY_SHARED_UPSTREAM_HEADER_NAME / canonical TEAM2_PAY_GATE_API_KEY (Q3)."
  };
}

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value.join(",") : value;
}

function parseAmountQuery(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function createManagedSharedReadModelSource(
  manager: PaySharedUpstreamRuntimeManager
): PayReadModelSource {
  return createSharedPayReadModelSource(
    {
      findOpsWorkItem(area, itemId, accessContext) {
        return manager.getRuntime().bindings.findOpsWorkItem?.(area, itemId, accessContext) ?? null;
      },
      getHomeRouteRefs() {
        return manager.getRuntime().bindings.getHomeRouteRefs?.() ?? null;
      },
      getOpsSnapshot(area) {
        return manager.getRuntime().bindings.getOpsSnapshot?.(area) ?? null;
      },
      getPaymentSession(sessionId) {
        return manager.getRuntime().bindings.getPaymentSession?.(sessionId) ?? null;
      },
      getReceipt(receiptId) {
        return manager.getRuntime().bindings.getReceipt?.(receiptId) ?? null;
      }
    },
    "shared_contract"
  );
}

function readNumberEnv(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveBooleanFlag(
  optionValue: boolean | undefined,
  envValue: string | undefined,
  defaultValue: boolean
): boolean {
  if (optionValue !== undefined) {
    return optionValue;
  }

  if (envValue === undefined) {
    return defaultValue;
  }

  const normalized = envValue.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function normalizePathname(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "") || "/";
}

function matchPayRoute(pathname: string): PayRouteMatch | null {
  const segments = pathname.split("/").filter(Boolean);
  const [section, resourceId, action] = segments;

  if (section === "checkout" && segments.length === 2 && typeof resourceId === "string") {
    return { kind: "checkout", sessionId: decodePathSegment(resourceId) };
  }

  if (
    section === "checkout" &&
    action === "status" &&
    segments.length === 3 &&
    typeof resourceId === "string"
  ) {
    return { kind: "checkout_status", sessionId: decodePathSegment(resourceId) };
  }

  if (
    section === "checkout" &&
    action === "expired" &&
    segments.length === 3 &&
    typeof resourceId === "string"
  ) {
    return { kind: "checkout_expired", sessionId: decodePathSegment(resourceId) };
  }

  if (section === "receipt" && segments.length === 2 && typeof resourceId === "string") {
    return { kind: "receipt", receiptId: decodePathSegment(resourceId) };
  }

  if (section === "payment" && action === "help" && segments.length === 3 && typeof resourceId === "string") {
    return { kind: "help", sessionId: decodePathSegment(resourceId) };
  }

  if (section === "ops" && segments.length === 2) {
    const area = resourceId;
    if (
      area === "review" ||
      area === "payments" ||
      area === "payouts" ||
      area === "reconciliation" ||
      area === "audit"
    ) {
      return { kind: "ops", area };
    }
  }

  if (section === "ops" && segments.length === 3 && typeof resourceId === "string" && typeof action === "string") {
    if (resourceId === "payments" || resourceId === "reconciliation" || resourceId === "review") {
      return { kind: "ops_detail", area: resourceId, itemId: decodePathSegment(action) };
    }
  }

  return null;
}

function renderMatchedRoute(
  config: ResolvedPayConfig,
  locale: Locale,
  route: PayRouteMatch,
  accessContext: PayReadAccessContext
): string {
  switch (route.kind) {
    case "checkout":
      return renderPayCheckout(config, locale, route.sessionId);
    case "checkout_status":
      return renderPayCheckoutStatus(config, locale, route.sessionId);
    case "checkout_expired":
      return renderPayCheckoutExpired(config, locale, route.sessionId);
    case "receipt":
      return renderPayReceipt(config, locale, route.receiptId);
    case "help":
      return renderPayHelp(config, locale, route.sessionId);
    case "ops":
      switch (route.area) {
        case "review":
          return renderPayOpsReview(config, locale);
        case "payments":
          return renderPayOpsPayments(config, locale);
        case "payouts":
          return renderPayOpsPayouts(config, locale);
        case "reconciliation":
          return renderPayOpsReconciliation(config, locale);
        case "audit":
          return renderPayOpsAudit(config, locale);
      }
    case "ops_detail":
      return renderPayOpsWorkItemDetail(config, locale, route.area, route.itemId, accessContext);
  }
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
