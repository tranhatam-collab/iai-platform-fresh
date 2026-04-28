import { randomUUID } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse
} from "node:http";

import {
  buildFlowSourceSummary,
  createMailDomainDnsHealthSource,
  createMailMessageSource,
  createMailProviderRouteSource,
  createMailSuppressionSource,
  createFlowSourceOfTruth,
  type AlertScope,
  type AlertSeverity,
  type AlertStatus,
  type ApprovalStatus,
  type BillingStatus,
  type FlowActionOutcome,
  type FlowAuditAction,
  type FlowExecutionStatus,
  type FlowSourceOfTruth,
  type FlowStatus,
  type MailDomainDnsHealthSource,
  type MailMessageListFilter,
  type MailMessageReadSource,
  type MailProviderRouteHealthStatus,
  type MailProviderRouteSource,
  type MailProviderRouteStatus,
  type MailProviderType,
  type MailSuppressionOrigin,
  type MailSuppressionReadSource,
  type MailSuppressionReason,
  type MailSuppressionScope,
  type MailTimelineEventType,
  type ProofKind,
  type ProofStatus
} from "@iai/mail-core";
import {
  createSmtpInternalBackend,
  type SmtpInternalBackend
} from "./smtp-internal.js";
import {
  createInboundWebhookHandler,
  type InboundWebhookHandlerOptions
} from "./inbound-webhook.js";

const APPROVAL_STATUSES: ApprovalStatus[] = ["pending", "approved", "rejected", "expired"];
const BILLING_STATUSES: BillingStatus[] = ["pending", "paid", "overdue", "failed", "refunded"];
const PROOF_STATUSES: ProofStatus[] = ["pending", "verified", "failed"];
const PROOF_KINDS: ProofKind[] = ["approval", "execution", "relay", "audit"];
const FLOW_STATUSES: FlowStatus[] = ["healthy", "attention", "blocked"];
const FLOW_EXECUTION_STATUSES: FlowExecutionStatus[] = ["queued", "running", "succeeded", "failed"];
const FLOW_AUDIT_ACTIONS: FlowAuditAction[] = [
  "builder.save",
  "builder.validate",
  "publish.preview",
  "publish.confirm"
];
const FLOW_ACTION_OUTCOMES: FlowActionOutcome[] = ["succeeded", "failed"];
const ALERT_STATUSES: AlertStatus[] = ["open", "acked", "resolved"];
const ALERT_SCOPES: AlertScope[] = ["approvals", "billing", "proofs", "runtime", "security"];
const ALERT_SEVERITIES: AlertSeverity[] = ["info", "warning", "critical"];
const PROVIDER_ROUTE_STATUSES: MailProviderRouteStatus[] = ["active", "degraded", "disabled"];
const PROVIDER_ROUTE_HEALTH_STATUSES: MailProviderRouteHealthStatus[] = [
  "healthy",
  "degraded",
  "down"
];
const PROVIDER_TYPES: MailProviderType[] = ["selfhosted", "smtp", "ses", "sendgrid"];
const SUPPRESSION_REASONS: MailSuppressionReason[] = [
  "hard_bounce",
  "complaint",
  "unsubscribe",
  "manual"
];
const SUPPRESSION_SCOPES: MailSuppressionScope[] = ["recipient", "workspace", "stream"];
const SUPPRESSION_SOURCES: MailSuppressionOrigin[] = [
  "provider_webhook",
  "operator",
  "recipient_action",
  "policy_engine"
];
const MESSAGE_STATUSES: MailTimelineEventType[] = [
  "queued",
  "processing",
  "provider_accepted",
  "delivered",
  "deferred",
  "bounced",
  "complained",
  "failed"
];

class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface FlowApiServerOptions {
  domainDnsHealthSource?: MailDomainDnsHealthSource;
  messageSource?: MailMessageReadSource;
  providerRouteSource?: MailProviderRouteSource;
  smtpInternalBackend?: SmtpInternalBackend;
  suppressionSource?: MailSuppressionReadSource;
  source?: FlowSourceOfTruth;
  webContractConfig?: Partial<WebOnboardingContractConfig>;
  webContractWording?: Partial<WebOnboardingWordingContract>;
  inboundWebhook?: InboundWebhookHandlerOptions;
}

type WebRouteSurface = "app" | "flow" | "dash";
type WebLocale = "en" | "vi";

interface WebOnboardingRouteTarget {
  nextUrl: string;
  productSurface: WebRouteSurface;
}

interface WebOnboardingContractConfig {
  defaultLocale: WebLocale;
  fallbackLocale: WebLocale;
  supportedLocales: WebLocale[];
  sharedAppUrl: string;
  sharedAuthUrl: string;
  sharedBillingUrl: string;
  sharedDashUrl: string;
  sharedFlowUrl: string;
}

interface WebOnboardingWordingContract {
  auth: {
    bodyKey: string;
    ctaKey: string;
    modeKey: string;
    titleKey: string;
  };
  billing: {
    bodyKey: string;
    ctaKey: string;
    titleKey: string;
  };
}

interface WebOnboardingContractPayload {
  authMode: "shared_redirect";
  billingMode: "shared_reference";
  defaultLocale: WebLocale;
  fallbackLocale: WebLocale;
  contractStatus: {
    alertsCriticalOpen: number;
    approvalsPending: number;
    billingOverdueCount: number;
    generatedAt: string;
    healthStatus: "ok";
    service: "api.flow";
  };
  readiness: {
    blockers: string[];
    sharedContractState: "ready" | "blocked";
  };
  routeTargets: {
    commerce: WebOnboardingRouteTarget;
    information: WebOnboardingRouteTarget;
    leads: WebOnboardingRouteTarget;
  };
  supportedLocales: WebLocale[];
  wording: WebOnboardingWordingContract;
  sharedAppUrl: string;
  sharedAuthUrl: string;
  sharedBillingUrl: string;
  sharedDashUrl: string;
  sharedFlowUrl: string;
}

const DEFAULT_WEB_ONBOARDING_WORDING: WebOnboardingWordingContract = {
  auth: {
    bodyKey: "web.onboarding.contracts.auth.body",
    ctaKey: "web.action.continue_auth",
    modeKey: "web.summary.auth_mode.shared",
    titleKey: "web.onboarding.contracts.auth.title"
  },
  billing: {
    bodyKey: "web.onboarding.contracts.billing.body",
    ctaKey: "web.action.open_shared_billing",
    titleKey: "web.onboarding.contracts.billing.title"
  }
};

export function createFlowApiServer(options: FlowApiServerOptions = {}): Server {
  return createServer(createFlowApiRequestHandler(options));
}

export function createFlowApiRequestHandler(options: FlowApiServerOptions = {}) {
  const domainDnsHealthSource = options.domainDnsHealthSource ?? createMailDomainDnsHealthSource();
  const messageSource = options.messageSource ?? createMailMessageSource();
  const providerRouteSource = options.providerRouteSource ?? createMailProviderRouteSource();
  const smtpInternalBackend = options.smtpInternalBackend ?? createSmtpInternalBackend();
  const suppressionSource = options.suppressionSource ?? createMailSuppressionSource();
  const source = options.source ?? createFlowSourceOfTruth();
  const webContractConfig = resolveWebOnboardingContractConfig(options.webContractConfig);
  const webContractWording = resolveWebOnboardingWordingContract(options.webContractWording);
  const inboundWebhookHandler = createInboundWebhookHandler(options.inboundWebhook);

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(
      request,
      response,
      source,
      domainDnsHealthSource,
      messageSource,
      providerRouteSource,
      smtpInternalBackend,
      suppressionSource,
      webContractConfig,
      webContractWording,
      inboundWebhookHandler
    );
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  source: FlowSourceOfTruth,
  domainDnsHealthSource: MailDomainDnsHealthSource,
  messageSource: MailMessageReadSource,
  providerRouteSource: MailProviderRouteSource,
  smtpInternalBackend: SmtpInternalBackend,
  suppressionSource: MailSuppressionReadSource,
  webContractConfig: WebOnboardingContractConfig,
  webContractWording: WebOnboardingWordingContract,
  inboundWebhookHandler: ReturnType<typeof createInboundWebhookHandler>
) {
  const requestId = getHeader(request, "x-request-id") ?? `req_${randomUUID()}`;
  const now = new Date().toISOString();

  try {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", "http://localhost");

    const inboundResult = await inboundWebhookHandler(request, response, requestId);
    if (inboundResult.handled) {
      return;
    }

    if (
      await smtpInternalBackend.handleRequest(
        request,
        response,
        requestId,
        url,
        method
      )
    ) {
      return;
    }

    if (method !== "GET" && method !== "POST") {
      throw new HttpError(405, "VALIDATION_ERROR", "Only GET and POST methods are supported by this service.");
    }

    if (url.pathname === "/health") {
      respondSuccess(response, 200, requestId, {
        service: "api.flow",
        status: "ok",
        timestamp: now
      });
      return;
    }

    const workspaceId = resolveWorkspaceId(request, url);
    const domainDnsHealthRoute = matchDomainDnsHealthRoute(url.pathname);
    const flowCommandRoute = matchFlowCommandRoute(url.pathname);
    const flowChildRoute = matchFlowChildRoute(url.pathname);
    const flowRoute = matchFlowRoute(url.pathname);
    const messageRoute = matchMessageRoute(url.pathname);
    const runtimeExecutionRoute = matchRuntimeExecutionRoute(url.pathname);

    if (method === "POST" && flowCommandRoute) {
      const actor = getHeader(request, "x-actor-id") ?? "dash.operator";
      const result =
        flowCommandRoute.action === "builder.save"
          ? source.saveFlowDraft(flowCommandRoute.flowId, workspaceId, actor)
          : flowCommandRoute.action === "builder.validate"
            ? source.validateFlowDraft(flowCommandRoute.flowId, workspaceId, actor)
            : flowCommandRoute.action === "publish.preview"
              ? source.previewFlowPublish(flowCommandRoute.flowId, workspaceId, actor)
              : source.publishFlow(flowCommandRoute.flowId, workspaceId, actor);

      if (!result) {
        throw new HttpError(404, "FLOW_NOT_FOUND", "Flow not found.", {
          flowId: flowCommandRoute.flowId
        });
      }

      respondSuccess(response, 200, requestId, {
        result
      });
      return;
    }

    if (method !== "GET") {
      throw new HttpError(405, "VALIDATION_ERROR", "Only GET methods are supported by this route.");
    }

    if (url.pathname === "/v1/messages") {
      const filter = parseMessageListFilter(url, workspaceId);
      const page = messageSource.listMessages(filter);

      respondSuccess(response, 200, requestId, {
        items: page.items,
        page: page.page,
        page_size: page.pageSize,
        total: page.total
      });
      return;
    }

    if (url.pathname === "/v1/provider-routes") {
      const items = providerRouteSource.listRoutes({
        healthStatuses: parseEnumList(
          url.searchParams.get("health"),
          PROVIDER_ROUTE_HEALTH_STATUSES,
          "health"
        ),
        provider: parseEnumValue(url.searchParams.get("provider"), PROVIDER_TYPES, "provider"),
        statuses: parseEnumList(url.searchParams.get("status"), PROVIDER_ROUTE_STATUSES, "status"),
        stream: normalizeString(url.searchParams.get("stream")),
        workspaceId
      });

      respondSuccess(response, 200, requestId, {
        items,
        total: items.length
      });
      return;
    }

    if (url.pathname === "/v1/suppressions") {
      const items = suppressionSource.listSuppressions({
        activeOnly: parseBoolean(url.searchParams.get("active_only"), "active_only"),
        email: normalizeString(url.searchParams.get("email")),
        now,
        reasons: parseEnumList(url.searchParams.get("reason"), SUPPRESSION_REASONS, "reason"),
        scopes: parseEnumList(url.searchParams.get("scope"), SUPPRESSION_SCOPES, "scope"),
        sources: parseEnumList(url.searchParams.get("source"), SUPPRESSION_SOURCES, "source"),
        stream: normalizeString(url.searchParams.get("stream")),
        workspaceId
      });

      respondSuccess(response, 200, requestId, {
        items,
        total: items.length
      });
      return;
    }

    if (domainDnsHealthRoute) {
      const item = domainDnsHealthSource.getDomainDnsHealth(domainDnsHealthRoute.domainId, workspaceId);
      if (!item) {
        throw new HttpError(404, "DOMAIN_NOT_FOUND", "Domain not found.", {
          domainId: domainDnsHealthRoute.domainId
        });
      }

      respondSuccess(response, 200, requestId, item);
      return;
    }

    if (messageRoute?.resource === "detail") {
      const detail = messageSource.getMessageDetail(messageRoute.messageId, workspaceId);
      if (!detail) {
        throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message not found.", {
          messageId: messageRoute.messageId
        });
      }

      respondSuccess(response, 200, requestId, detail);
      return;
    }

    if (messageRoute?.resource === "events") {
      const detail = messageSource.getMessageDetail(messageRoute.messageId, workspaceId);
      if (!detail) {
        throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message not found.", {
          messageId: messageRoute.messageId
        });
      }

      const items = messageSource.listMessageEvents(messageRoute.messageId, workspaceId);
      respondSuccess(response, 200, requestId, {
        items,
        total: items.length
      });
      return;
    }

    if (!url.pathname.startsWith("/v1/flow")) {
      throw new HttpError(404, "INTERNAL_ERROR", "Route not found.");
    }

    if (url.pathname === "/v1/flow/source-of-truth") {
      const snapshot = source.snapshot(workspaceId);
      // Keep summary calculations anchored to the snapshot generation timestamp
      // so tests and operator reads are deterministic across wall-clock drift.
      const summaryNow = snapshot.generatedAt ?? now;
      const summary = buildFlowSourceSummary(snapshot, summaryNow);

      respondSuccess(response, 200, requestId, {
        snapshot,
        summary
      });
      return;
    }

    if (url.pathname === "/v1/flow/web-onboarding-contract") {
      respondSuccess(
        response,
        200,
        requestId,
        buildWebOnboardingContractPayload(source, workspaceId, webContractConfig, webContractWording)
      );
      return;
    }

    if (url.pathname === "/v1/flow/flows") {
      const items = source.listFlows({
        requireAttention: parseBoolean(url.searchParams.get("require_attention"), "require_attention"),
        statuses: parseEnumList(url.searchParams.get("status"), FLOW_STATUSES, "status"),
        workspaceId
      });

      respondSuccess(response, 200, requestId, {
        items,
        total: items.length
      });
      return;
    }

    if (flowChildRoute?.resource === "versions") {
      const items = source.listFlowVersions(flowChildRoute.flowId, workspaceId);
      if (!items) {
        throw new HttpError(404, "FLOW_NOT_FOUND", "Flow not found.", {
          flowId: flowChildRoute.flowId
        });
      }

      respondSuccess(response, 200, requestId, {
        flowId: flowChildRoute.flowId,
        items,
        total: items.length
      });
      return;
    }

    if (flowChildRoute?.resource === "drafts") {
      const items = source.listFlowDrafts(flowChildRoute.flowId, workspaceId);
      if (!items) {
        throw new HttpError(404, "FLOW_NOT_FOUND", "Flow not found.", {
          flowId: flowChildRoute.flowId
        });
      }

      respondSuccess(response, 200, requestId, {
        flowId: flowChildRoute.flowId,
        items,
        total: items.length
      });
      return;
    }

    if (flowChildRoute?.resource === "publish") {
      const readiness = source.getFlowPublishReadiness(flowChildRoute.flowId, workspaceId);
      if (!readiness) {
        throw new HttpError(404, "FLOW_NOT_FOUND", "Flow not found.", {
          flowId: flowChildRoute.flowId
        });
      }

      respondSuccess(response, 200, requestId, {
        flowId: flowChildRoute.flowId,
        readiness
      });
      return;
    }

    if (flowRoute) {
      const flow = source.getFlowDetail(flowRoute.flowId, workspaceId);
      if (!flow) {
        throw new HttpError(404, "FLOW_NOT_FOUND", "Flow not found.", {
          flowId: flowRoute.flowId
        });
      }

      const recentExecutions = source.listRuntimeExecutions({
        flowId: flow.flowId,
        workspaceId
      });

      respondSuccess(response, 200, requestId, {
        flow,
        recentExecutions
      });
      return;
    }

    if (url.pathname === "/v1/flow/approvals") {
      const statuses = parseEnumList(url.searchParams.get("status"), APPROVAL_STATUSES, "status");
      const overdueOnly = parseBoolean(url.searchParams.get("overdue_only"), "overdue_only");
      const requireHuman = parseBoolean(url.searchParams.get("require_human"), "require_human");
      const items = source.listApprovals({
        now,
        overdueOnly,
        requireHuman,
        statuses,
        workspaceId
      });

      respondSuccess(response, 200, requestId, {
        items,
        total: items.length
      });
      return;
    }

    if (url.pathname === "/v1/flow/billing") {
      const statuses = parseEnumList(url.searchParams.get("status"), BILLING_STATUSES, "status");
      const overdueOnly = parseBoolean(url.searchParams.get("overdue_only"), "overdue_only");
      const items = source.listBilling({
        now,
        overdueOnly,
        statuses,
        workspaceId
      });

      respondSuccess(response, 200, requestId, {
        items,
        total: items.length
      });
      return;
    }

    if (url.pathname === "/v1/flow/proofs") {
      const statuses = parseEnumList(url.searchParams.get("status"), PROOF_STATUSES, "status");
      const kinds = parseEnumList(url.searchParams.get("kind"), PROOF_KINDS, "kind");
      const minConfidence = parseNumber(url.searchParams.get("min_confidence"), "min_confidence");
      const items = source.listProofs({
        kinds,
        minConfidence,
        statuses,
        workspaceId
      });

      respondSuccess(response, 200, requestId, {
        items,
        total: items.length
      });
      return;
    }

    if (url.pathname === "/v1/flow/audit") {
      const items = source.listAuditEvents({
        actions: parseEnumList(url.searchParams.get("action"), FLOW_AUDIT_ACTIONS, "action"),
        flowId: normalizeString(url.searchParams.get("flow_id")),
        limit: parsePositiveInteger(url.searchParams.get("limit"), "limit"),
        outcomes: parseEnumList(url.searchParams.get("outcome"), FLOW_ACTION_OUTCOMES, "outcome"),
        workspaceId
      });

      respondSuccess(response, 200, requestId, {
        items,
        total: items.length
      });
      return;
    }

    if (url.pathname === "/v1/flow/alerts") {
      const statuses = parseEnumList(url.searchParams.get("status"), ALERT_STATUSES, "status");
      const scopes = parseEnumList(url.searchParams.get("scope"), ALERT_SCOPES, "scope");
      const severities = parseEnumList(url.searchParams.get("severity"), ALERT_SEVERITIES, "severity");
      const requireHuman = parseBoolean(url.searchParams.get("require_human"), "require_human");
      const items = source.listAlerts({
        requireHuman,
        scopes,
        severities,
        statuses,
        workspaceId
      });

      respondSuccess(response, 200, requestId, {
        items,
        total: items.length
      });
      return;
    }

    if (url.pathname === "/v1/flow/runtime/executions") {
      const items = source.listRuntimeExecutions({
        flowId: normalizeString(url.searchParams.get("flow_id")),
        requireAttention: parseBoolean(url.searchParams.get("require_attention"), "require_attention"),
        statuses: parseEnumList(url.searchParams.get("status"), FLOW_EXECUTION_STATUSES, "status"),
        workspaceId
      });

      respondSuccess(response, 200, requestId, {
        items,
        total: items.length
      });
      return;
    }

    if (runtimeExecutionRoute) {
      const execution = source.getRuntimeExecutionDetail(runtimeExecutionRoute.executionId, workspaceId);
      if (!execution) {
        throw new HttpError(404, "EXECUTION_NOT_FOUND", "Execution not found.", {
          executionId: runtimeExecutionRoute.executionId
        });
      }

      respondSuccess(response, 200, requestId, {
        execution
      });
      return;
    }

    throw new HttpError(404, "INTERNAL_ERROR", "Route not found.");
  } catch (error) {
    if (error instanceof HttpError) {
      respondError(response, requestId, error.statusCode, error.errorCode, error.message, error.details);
      return;
    }

    // Log unhandled errors so production failures aren't silent.
    // The 2026-04-28 Path B deploy lost ~10 minutes diagnosing an
    // EACCES from a volume-permission bug because this catch previously
    // swallowed the original error. Keep response shape unchanged for
    // callers, but emit a structured log line so ops can grep root cause.
    const cause = error instanceof Error ? error : new Error(String(error));
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: "error",
        msg: "unhandled_runtime_error",
        request_id: requestId,
        method: request.method ?? null,
        url: request.url ?? null,
        error_name: cause.name,
        error_message: cause.message,
        error_stack: cause.stack ?? null,
        ts: new Date().toISOString()
      })
    );

    respondError(response, requestId, 500, "INTERNAL_ERROR", "Unhandled runtime error.");
  }
}

function respondSuccess(
  response: ServerResponse,
  statusCode: number,
  requestId: string,
  data: unknown
) {
  writeJson(response, statusCode, {
    data,
    meta: {
      request_id: requestId,
      timestamp: new Date().toISOString()
    },
    ok: true
  });
}

function respondError(
  response: ServerResponse,
  requestId: string,
  statusCode: number,
  errorCode: string,
  message: string,
  details?: Record<string, unknown>
) {
  writeJson(response, statusCode, {
    error: {
      code: errorCode,
      details,
      message
    },
    meta: {
      request_id: requestId,
      timestamp: new Date().toISOString()
    },
    ok: false
  });
}

function writeJson(response: ServerResponse, statusCode: number, payload: Record<string, unknown>) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function resolveWorkspaceId(request: IncomingMessage, url: URL): string {
  const fromHeader = getHeader(request, "x-workspace-id");
  const fromQuery = url.searchParams.get("workspace_id");
  const value = fromHeader ?? fromQuery;

  if (!value) {
    throw new HttpError(
      400,
      "WORKSPACE_NOT_FOUND",
      "Missing X-Workspace-Id header or workspace_id query parameter."
    );
  }

  return value;
}

function getHeader(request: IncomingMessage, headerName: string): string | undefined {
  const value = request.headers[headerName];
  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  return undefined;
}

function matchMessageRoute(
  pathname: string
): { messageId: string; resource: "detail" | "events" } | undefined {
  const eventsMatch = pathname.match(/^\/v1\/messages\/([^/]+)\/events$/);
  if (eventsMatch?.[1]) {
    return {
      messageId: decodeURIComponent(eventsMatch[1]),
      resource: "events"
    };
  }

  const detailMatch = pathname.match(/^\/v1\/messages\/([^/]+)$/);
  if (detailMatch?.[1]) {
    return {
      messageId: decodeURIComponent(detailMatch[1]),
      resource: "detail"
    };
  }

  return undefined;
}

function matchDomainDnsHealthRoute(pathname: string): { domainId: string } | undefined {
  const match = pathname.match(/^\/v1\/domains\/([^/]+)\/dns-health$/);
  if (!match?.[1]) {
    return undefined;
  }

  return {
    domainId: decodeURIComponent(match[1])
  };
}

function matchFlowRoute(pathname: string): { flowId: string } | undefined {
  const match = pathname.match(/^\/v1\/flow\/flows\/([^/]+)$/);
  if (!match?.[1]) {
    return undefined;
  }

  return {
    flowId: decodeURIComponent(match[1])
  };
}

function matchFlowChildRoute(
  pathname: string
): { flowId: string; resource: "drafts" | "publish" | "versions" } | undefined {
  const match = pathname.match(/^\/v1\/flow\/flows\/([^/]+)\/(versions|drafts|publish)$/);
  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  return {
    flowId: decodeURIComponent(match[1]),
    resource: match[2] as "drafts" | "publish" | "versions"
  };
}

function matchFlowCommandRoute(
  pathname: string
): { action: FlowAuditAction; flowId: string } | undefined {
  const match = pathname.match(
    /^\/v1\/flow\/flows\/([^/]+)\/(builder\/save|builder\/validate|publish\/preview|publish\/confirm)$/
  );
  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  const actionMap: Record<string, FlowAuditAction> = {
    "builder/save": "builder.save",
    "builder/validate": "builder.validate",
    "publish/confirm": "publish.confirm",
    "publish/preview": "publish.preview"
  };
  const action = actionMap[match[2]];
  if (!action) {
    return undefined;
  }

  return {
    action,
    flowId: decodeURIComponent(match[1])
  };
}

function matchRuntimeExecutionRoute(pathname: string): { executionId: string } | undefined {
  const match = pathname.match(/^\/v1\/flow\/runtime\/executions\/([^/]+)$/);
  if (!match?.[1]) {
    return undefined;
  }

  return {
    executionId: decodeURIComponent(match[1])
  };
}

function parseMessageListFilter(url: URL, workspaceId: string): MailMessageListFilter {
  return {
    createdFrom: parseDateTime(url.searchParams.get("created_from"), "created_from"),
    createdTo: parseDateTime(url.searchParams.get("created_to"), "created_to"),
    from: normalizeString(url.searchParams.get("from")),
    page: parsePositiveInteger(url.searchParams.get("page"), "page"),
    pageSize: parsePositiveInteger(url.searchParams.get("page_size"), "page_size"),
    statuses: parseEnumList(url.searchParams.get("status"), MESSAGE_STATUSES, "status"),
    stream: normalizeString(url.searchParams.get("stream")),
    to: normalizeString(url.searchParams.get("to")),
    workspaceId
  };
}

function parseEnumList<T extends string>(
  rawValue: string | null,
  allowedValues: readonly T[],
  field: string
): T[] | undefined {
  if (!rawValue) {
    return undefined;
  }

  const values = rawValue
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const invalid = values.filter((entry) => !allowedValues.includes(entry as T));

  if (invalid.length > 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `Invalid ${field} filter value.`, {
      allowed: allowedValues,
      invalid
    });
  }

  return values as T[];
}

function parseEnumValue<T extends string>(
  rawValue: string | null,
  allowedValues: readonly T[],
  field: string
): T | undefined {
  if (!rawValue) {
    return undefined;
  }

  const normalized = rawValue.trim();
  if (!normalized) {
    return undefined;
  }

  if (!allowedValues.includes(normalized as T)) {
    throw new HttpError(400, "VALIDATION_ERROR", `Invalid ${field} filter value.`, {
      allowed: allowedValues,
      invalid: [normalized]
    });
  }

  return normalized as T;
}

function parseBoolean(rawValue: string | null, field: string): boolean | undefined {
  if (!rawValue) {
    return undefined;
  }

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  throw new HttpError(400, "VALIDATION_ERROR", `Invalid ${field} filter value.`, {
    expected: ["true", "false"],
    received: rawValue
  });
}

function parseNumber(rawValue: string | null, field: string): number | undefined {
  if (!rawValue) {
    return undefined;
  }

  const parsed = Number(rawValue);
  if (Number.isNaN(parsed)) {
    throw new HttpError(400, "VALIDATION_ERROR", `Invalid ${field} filter value.`, {
      received: rawValue
    });
  }

  return parsed;
}

function parsePositiveInteger(rawValue: string | null, field: string): number | undefined {
  const parsed = parseNumber(rawValue, field);
  if (parsed === undefined) {
    return undefined;
  }

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(400, "VALIDATION_ERROR", `Invalid ${field} filter value.`, {
      minimum: 1,
      received: rawValue
    });
  }

  return parsed;
}

function parseDateTime(rawValue: string | null, field: string): string | undefined {
  if (!rawValue) {
    return undefined;
  }

  const timestamp = Date.parse(rawValue);
  if (Number.isNaN(timestamp)) {
    throw new HttpError(400, "VALIDATION_ERROR", `Invalid ${field} filter value.`, {
      received: rawValue
    });
  }

  return new Date(timestamp).toISOString();
}

function normalizeString(rawValue: string | null): string | undefined {
  if (!rawValue) {
    return undefined;
  }

  const trimmed = rawValue.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveWebOnboardingContractConfig(
  overrides?: Partial<WebOnboardingContractConfig>
): WebOnboardingContractConfig {
  const supportedLocales =
    overrides?.supportedLocales ??
    normalizeLocaleList(process.env.API_FLOW_SUPPORTED_LOCALES, ["en", "vi"]);

  return {
    defaultLocale:
      overrides?.defaultLocale ??
      normalizeLocale(process.env.API_FLOW_DEFAULT_LOCALE) ??
      "en",
    fallbackLocale:
      overrides?.fallbackLocale ??
      normalizeLocale(process.env.API_FLOW_FALLBACK_LOCALE) ??
      "en",
    supportedLocales,
    sharedAppUrl: overrides?.sharedAppUrl ?? process.env.API_FLOW_SHARED_APP_URL ?? "https://app.iai.one",
    sharedAuthUrl:
      overrides?.sharedAuthUrl ?? process.env.API_FLOW_SHARED_AUTH_URL ?? "https://app.iai.one/auth/start",
    sharedBillingUrl:
      overrides?.sharedBillingUrl ??
      process.env.API_FLOW_SHARED_BILLING_URL ??
      "https://dash.iai.one/billing",
    sharedDashUrl:
      overrides?.sharedDashUrl ?? process.env.API_FLOW_SHARED_DASH_URL ?? "https://dash.iai.one",
    sharedFlowUrl:
      overrides?.sharedFlowUrl ?? process.env.API_FLOW_SHARED_FLOW_URL ?? "https://flow.iai.one"
  };
}

function buildWebOnboardingContractPayload(
  source: FlowSourceOfTruth,
  workspaceId: string,
  config: WebOnboardingContractConfig,
  wording: WebOnboardingWordingContract
): WebOnboardingContractPayload {
  const snapshot = source.snapshot(workspaceId);
  const summaryNow = snapshot.generatedAt ?? new Date().toISOString();
  const summary = buildFlowSourceSummary(snapshot, summaryNow);

  const blockers: string[] = [];
  if (summary.alerts.criticalOpen > 0) {
    blockers.push(`critical-alerts-open:${summary.alerts.criticalOpen}`);
  }
  if (summary.billing.overdueCount > 0) {
    blockers.push(`billing-overdue:${summary.billing.overdueCount}`);
  }

  return {
    authMode: "shared_redirect",
    billingMode: "shared_reference",
    defaultLocale: config.defaultLocale,
    fallbackLocale: config.fallbackLocale,
    contractStatus: {
      alertsCriticalOpen: summary.alerts.criticalOpen,
      approvalsPending: summary.approvals.pending,
      billingOverdueCount: summary.billing.overdueCount,
      generatedAt: snapshot.generatedAt,
      healthStatus: "ok",
      service: "api.flow"
    },
    readiness: {
      blockers,
      sharedContractState: blockers.length === 0 ? "ready" : "blocked"
    },
    routeTargets: {
      commerce: {
        nextUrl: `${config.sharedDashUrl}/commerce/setup?surface=web`,
        productSurface: "dash"
      },
      information: {
        nextUrl: `${config.sharedAppUrl}/welcome?surface=web&intent=information`,
        productSurface: "app"
      },
      leads: {
        nextUrl: `${config.sharedFlowUrl}/templates/lead-intake?surface=web`,
        productSurface: "flow"
      }
    },
    supportedLocales: config.supportedLocales,
    wording,
    sharedAppUrl: config.sharedAppUrl,
    sharedAuthUrl: config.sharedAuthUrl,
    sharedBillingUrl: config.sharedBillingUrl,
    sharedDashUrl: config.sharedDashUrl,
    sharedFlowUrl: config.sharedFlowUrl
  };
}

function normalizeLocale(value: string | undefined): WebLocale | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "en" || normalized === "vi") {
    return normalized;
  }

  return undefined;
}

function normalizeLocaleList(
  rawValue: string | undefined,
  fallback: WebLocale[]
): WebLocale[] {
  if (!rawValue) {
    return fallback;
  }

  const parsed = rawValue
    .split(",")
    .map((entry) => normalizeLocale(entry))
    .filter((entry): entry is WebLocale => Boolean(entry));

  return parsed.length > 0 ? parsed : fallback;
}

function normalizeCopyKey(value: string | undefined, fallback: string): string {
  return normalizeString(value ?? null) ?? fallback;
}

function resolveWebOnboardingWordingContract(
  overrides?: Partial<WebOnboardingWordingContract>
): WebOnboardingWordingContract {
  return {
    auth: {
      bodyKey: normalizeCopyKey(
        overrides?.auth?.bodyKey,
        DEFAULT_WEB_ONBOARDING_WORDING.auth.bodyKey
      ),
      ctaKey: normalizeCopyKey(
        overrides?.auth?.ctaKey,
        DEFAULT_WEB_ONBOARDING_WORDING.auth.ctaKey
      ),
      modeKey: normalizeCopyKey(
        overrides?.auth?.modeKey,
        DEFAULT_WEB_ONBOARDING_WORDING.auth.modeKey
      ),
      titleKey: normalizeCopyKey(
        overrides?.auth?.titleKey,
        DEFAULT_WEB_ONBOARDING_WORDING.auth.titleKey
      )
    },
    billing: {
      bodyKey: normalizeCopyKey(
        overrides?.billing?.bodyKey,
        DEFAULT_WEB_ONBOARDING_WORDING.billing.bodyKey
      ),
      ctaKey: normalizeCopyKey(
        overrides?.billing?.ctaKey,
        DEFAULT_WEB_ONBOARDING_WORDING.billing.ctaKey
      ),
      titleKey: normalizeCopyKey(
        overrides?.billing?.titleKey,
        DEFAULT_WEB_ONBOARDING_WORDING.billing.titleKey
      )
    }
  };
}
