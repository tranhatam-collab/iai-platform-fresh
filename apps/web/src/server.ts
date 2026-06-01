import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { createAiAgentClient, type AiAgentClient, type AiAgentMode } from "./aiagent-client.js";
import { createWebEventRecorder, type WebEventRecorder } from "./event-log.js";
import { buildFlowContractUrl } from "./flow-contract.js";
import { resolveLocale } from "./i18n.js";
import {
  renderBuilderForm,
  renderBuilderResult,
  renderFeedbackForm,
  renderFeedbackSubmitted,
  renderLanding,
  renderOnboardingForm,
  renderOnboardingSummary,
  type ContractStatus,
  type FeedbackCategory,
  type OnboardingIntent,
  type OnboardingRole,
  type RoutePlan,
  type SharedContractConfig
} from "./render.js";

export interface WebServerOptions extends Partial<SharedContractConfig> {
  contractWorkspaceId?: string;
  fetchImpl?: typeof globalThis.fetch;
  aiBuilderEnabled?: boolean;
  aiAgentApiBase?: string;
  aiAgentMode?: AiAgentMode;
  aiAgentClient?: AiAgentClient;
  publicationHold?: boolean;
}

interface WebRuntimeConfig extends SharedContractConfig {
  contractWorkspaceId: string;
  aiBuilderEnabled: boolean;
  aiAgentApiBase: string;
  aiAgentMode: AiAgentMode;
  publicationHold: boolean;
}

interface SharedRouteTarget {
  nextUrl: string;
  productSurface: RoutePlan["productSurface"];
}

interface SharedOnboardingContractPayload extends SharedContractConfig {
  authMode: "shared_redirect";
  billingMode: "shared_reference";
  contractStatus: ContractStatus;
  readiness: {
    blockers: string[];
    sharedContractState: "ready" | "blocked";
  };
  routeTargets: {
    commerce: SharedRouteTarget;
    information: SharedRouteTarget;
    leads: SharedRouteTarget;
  };
}

const validRoles: OnboardingRole[] = ["starter", "builder", "operator"];
const validIntents: OnboardingIntent[] = ["information", "leads", "commerce"];

export function createWebServer(options: WebServerOptions = {}): Server {
  return createServer(createWebRequestHandler(options));
}

export function createWebRequestHandler(options: WebServerOptions = {}) {
  const config = resolveConfig(options);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const eventRecorder = createWebEventRecorder();
  const aiAgentClient =
    options.aiAgentClient ??
    createAiAgentClient({
      apiBase: config.aiAgentApiBase,
      mode: config.aiAgentMode,
      apiKey: process.env.WEB_AIAGENT_API_KEY,
      fetchImpl
    });

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response, config, fetchImpl, eventRecorder, aiAgentClient);
  };
}

function resolveConfig(options: WebServerOptions): WebRuntimeConfig {
  return {
    contractWorkspaceId:
      options.contractWorkspaceId ?? process.env.WEB_CONTRACT_WORKSPACE_ID ?? "ws_flow_main",
    flowApiBase: options.flowApiBase ?? process.env.WEB_SHARED_FLOW_API_BASE ?? "http://127.0.0.1:8787",
    sharedAuthUrl:
      options.sharedAuthUrl ?? process.env.WEB_SHARED_AUTH_URL ?? "https://app.iai.one/auth/start",
    sharedBillingUrl:
      options.sharedBillingUrl ?? process.env.WEB_SHARED_BILLING_URL ?? "https://dash.iai.one/billing",
    sharedAppUrl: options.sharedAppUrl ?? process.env.WEB_SHARED_APP_URL ?? "https://app.iai.one",
    sharedFlowUrl: options.sharedFlowUrl ?? process.env.WEB_SHARED_FLOW_URL ?? "https://flow.iai.one",
    sharedDashUrl: options.sharedDashUrl ?? process.env.WEB_SHARED_DASH_URL ?? "https://dash.iai.one",
    aiBuilderEnabled:
      options.aiBuilderEnabled ?? process.env.WEB_AI_BUILDER_ENABLED === "true",
    aiAgentApiBase:
      options.aiAgentApiBase ?? process.env.WEB_AIAGENT_API_BASE ?? "https://api.aiagent.iai.one",
    aiAgentMode: options.aiAgentMode ?? parseAiAgentMode(process.env.WEB_AIAGENT_MODE),
    publicationHold: options.publicationHold ?? process.env.WEB_PUBLICATION_HOLD !== "false"
  };
}

function parseAiAgentMode(value: string | undefined): AiAgentMode {
  return value === "byok" ? "byok" : "free-demo";
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: WebRuntimeConfig,
  fetchImpl: typeof globalThis.fetch,
  eventRecorder: WebEventRecorder,
  aiAgentClient: AiAgentClient
) {
  const requestId = `req_${randomUUID()}`;

  if (config.publicationHold) {
    response.setHeader("X-Robots-Tag", "noindex, nofollow");
  }

  try {
    if (!request.url || !request.method) {
      respondJson(response, 400, {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Missing request metadata." }
      });
      return;
    }

    const url = new URL(request.url, "http://127.0.0.1");

    if (request.method === "GET" && url.pathname === "/health") {
      const onboardingContract = await loadSharedOnboardingContract(config, requestId, fetchImpl);
      respondJson(response, 200, {
        ok: true,
        data: {
          auth_mode: onboardingContract.authMode,
          billing_mode: onboardingContract.billingMode,
          flow_api_base: config.flowApiBase,
          service: "iai-web",
          shared_auth_url: onboardingContract.sharedAuthUrl,
          shared_billing_url: onboardingContract.sharedBillingUrl,
          status: "ok"
        }
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/events") {
      respondJson(response, 200, {
        ok: true,
        data: {
          items: eventRecorder.list(),
          total: eventRecorder.list(10_000).length
        }
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/contract-status") {
      const onboardingContract = await loadSharedOnboardingContract(config, requestId, fetchImpl);
      respondJson(response, 200, {
        ok: true,
        data: {
          auth_mode: onboardingContract.authMode,
          billing_mode: onboardingContract.billingMode,
          contract: onboardingContract.contractStatus,
          readiness: onboardingContract.readiness,
          recommended_shared_auth: onboardingContract.sharedAuthUrl,
          route_targets: onboardingContract.routeTargets
        }
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/") {
      const onboardingContract = await loadSharedOnboardingContract(config, requestId, fetchImpl);
      eventRecorder.record({
        eventName: "web_landing_view",
        route: url.pathname,
        sourceCampaign: normalizeString(url.searchParams.get("campaign")) ?? "direct",
        variantId: normalizeString(url.searchParams.get("variant")) ?? "control"
      });
      respondHtml(response, 200, renderLanding(toSharedContractConfig(config, onboardingContract)));
      return;
    }

    if (request.method === "GET" && url.pathname === "/onboarding") {
      const onboardingContract = await loadSharedOnboardingContract(config, requestId, fetchImpl);
      const role = parseRole(url.searchParams.get("role")) ?? "starter";
      const intent = parseIntent(url.searchParams.get("intent")) ?? "information";
      eventRecorder.record({
        eventName: "web_onboarding_started",
        intent,
        role,
        route: url.pathname,
        sourceCampaign: normalizeString(url.searchParams.get("campaign")) ?? "direct",
        variantId: normalizeString(url.searchParams.get("variant")) ?? "control"
      });
      respondHtml(
        response,
        200,
        renderOnboardingForm(toSharedContractConfig(config, onboardingContract), { role, intent })
      );
      return;
    }

    if (request.method === "POST" && url.pathname === "/onboarding") {
      const form = await readFormBody(request);
      const role = parseRole(form.get("role"));
      const intent = parseIntent(form.get("intent"));

      if (!role || !intent) {
        respondJson(response, 400, {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Expected role and intent from the onboarding form."
          }
        });
        return;
      }

      const onboardingContract = await loadSharedOnboardingContract(config, requestId, fetchImpl);
      const sharedConfig = toSharedContractConfig(config, onboardingContract);
      const plan = resolveRoutePlan(role, intent, onboardingContract.routeTargets);
      const sharedAuthHref = buildSharedAuthHref(onboardingContract.sharedAuthUrl, role, intent, plan);
      eventRecorder.record({
        eventName: "web_role_selected",
        intent,
        role,
        route: url.pathname,
        sourceCampaign: "direct",
        variantId: "control"
      });
      if (intent === "commerce") {
        eventRecorder.record({
          eventName: "web_paid_intent_started",
          intent,
          role,
          route: url.pathname,
          sourceCampaign: "direct",
          variantId: "control"
        });
      }

      respondHtml(
        response,
        200,
        renderOnboardingSummary({
          config: sharedConfig,
          contract: {
            ...onboardingContract.contractStatus,
            blockers: onboardingContract.readiness.blockers,
            sharedContractState: onboardingContract.readiness.sharedContractState
          },
          intent,
          plan,
          role,
          sharedAuthHref
        })
      );
      return;
    }

    if (request.method === "GET" && url.pathname === "/shared-auth") {
      const role = parseRole(url.searchParams.get("role"));
      const intent = parseIntent(url.searchParams.get("intent"));

      if (!role || !intent) {
        respondJson(response, 400, {
          ok: false,
          error: { code: "VALIDATION_ERROR", message: "Missing shared auth handoff parameters." }
        });
        return;
      }

      const onboardingContract = await loadSharedOnboardingContract(config, requestId, fetchImpl);
      const plan = resolveRoutePlan(role, intent, onboardingContract.routeTargets);
      eventRecorder.record({
        eventName: "web_auth_handoff_started",
        intent,
        role,
        route: url.pathname,
        sourceCampaign: "direct",
        variantId: "control"
      });
      response.statusCode = 303;
      response.setHeader(
        "location",
        buildSharedAuthHref(onboardingContract.sharedAuthUrl, role, intent, plan)
      );
      response.end();
      return;
    }

    if (request.method === "GET" && url.pathname === "/feedback") {
      const locale = resolveLocale(url, request.headers["accept-language"]);
      const category = parseFeedbackCategory(url.searchParams.get("category")) ?? "idea";
      respondHtml(response, 200, renderFeedbackForm(toSharedConfig(config), { category }, locale));
      return;
    }

    if (request.method === "POST" && url.pathname === "/feedback") {
      const locale = resolveLocale(url, request.headers["accept-language"]);
      const form = await readFormBody(request);
      const category = parseFeedbackCategory(form.get("category")) ?? "idea";
      const message = normalizeString(form.get("message"));
      const email = normalizeString(form.get("email"));
      const rating = parseRating(form.get("rating"));

      if (!message) {
        respondHtml(
          response,
          400,
          renderFeedbackForm(toSharedConfig(config), { category }, locale, "web.feedback.error.message_required")
        );
        return;
      }

      if (email && !isValidEmail(email)) {
        respondHtml(
          response,
          400,
          renderFeedbackForm(toSharedConfig(config), { category }, locale, "web.feedback.error.email_invalid")
        );
        return;
      }

      const record = eventRecorder.record({
        eventName: "web_feedback_submitted",
        route: url.pathname,
        sourceCampaign: "direct",
        variantId: "control",
        feedbackCategory: category,
        feedbackRating: rating ?? undefined,
        messageLength: message.length
      });
      respondHtml(
        response,
        200,
        renderFeedbackSubmitted({ category, ackId: record.eventId }, locale)
      );
      return;
    }

    if (url.pathname === "/build") {
      if (!config.aiBuilderEnabled) {
        respondJson(response, 404, {
          ok: false,
          error: { code: "NOT_FOUND", message: "Route not found." }
        });
        return;
      }

      const locale = resolveLocale(url, request.headers["accept-language"]);

      if (request.method === "GET") {
        respondHtml(response, 200, renderBuilderForm(toSharedConfig(config), undefined, locale));
        return;
      }

      if (request.method === "POST") {
        const form = await readFormBody(request);
        const businessName = normalizeString(form.get("businessName"));
        const goal = normalizeString(form.get("goal"));
        const intent = parseIntent(form.get("intent")) ?? "information";
        const role = parseRole(form.get("role")) ?? "starter";

        if (!businessName || !goal) {
          respondHtml(
            response,
            400,
            renderBuilderForm(toSharedConfig(config), { intent, role }, locale, "web.build.error.required")
          );
          return;
        }

        eventRecorder.record({
          eventName: "web_ai_build_started",
          intent,
          role,
          route: url.pathname,
          sourceCampaign: "direct",
          variantId: "control"
        });

        const result = await aiAgentClient.generateSite({
          businessName,
          goal,
          intent,
          role,
          locale: "en"
        });

        if (!result.ok || !result.sections) {
          eventRecorder.record({
            eventName: "web_ai_build_failed",
            intent,
            role,
            route: url.pathname,
            sourceCampaign: "direct",
            variantId: "control",
            buildOutcome: result.error ?? "AI_UNAVAILABLE"
          });
          respondHtml(
            response,
            502,
            renderBuilderForm(
              toSharedConfig(config),
              { intent, role },
              locale,
              builderErrorKey(result.error)
            )
          );
          return;
        }

        eventRecorder.record({
          eventName: "web_ai_build_completed",
          intent,
          role,
          route: url.pathname,
          sourceCampaign: "direct",
          variantId: "control",
          buildOutcome: result.siteId ?? "ok"
        });

        const sharedAuthHref = buildSharedAuthHref(
          config.sharedAuthUrl,
          role,
          intent,
          resolveRoutePlan(role, intent, defaultRouteTargets(config))
        );
        respondHtml(
          response,
          200,
          renderBuilderResult({
            businessName,
            sections: result.sections,
            previewHtml: result.previewHtml,
            sharedAuthHref
          }, locale)
        );
        return;
      }
    }

    // ─── AI Site Generation API (v1 contract) ───
    if (request.method === "POST" && url.pathname === "/v1/site/generate") {
      const body = await readJsonBody(request);

      const businessName = normalizeString(String(body.businessName ?? ""));
      const goal = normalizeString(String(body.goal ?? ""));
      const intent = parseIntent(String(body.intent ?? "")) ?? "information";
      const role = parseRole(String(body.role ?? "")) ?? "starter";

      if (!businessName || !goal) {
        respondJson(response, 400, {
          ok: false,
          error: { code: "INVALID_REQUEST", message: "businessName and goal are required." }
        });
        return;
      }

      const result = await aiAgentClient.generateSite({
        businessName,
        goal,
        intent,
        role,
        locale: "en"
      });

      if (!result.ok) {
        const statusMap: Record<string, number> = {
          AI_QUOTA_EXCEEDED: 429,
          AI_UNAUTHORIZED: 401,
          AI_BAD_RESPONSE: 502,
          AI_UNAVAILABLE: 503
        };
        eventRecorder.record({
          eventName: "web_api_site_generate",
          intent,
          role,
          route: url.pathname,
          sourceCampaign: "direct",
          variantId: "control",
          buildOutcome: result.error ?? "AI_UNAVAILABLE"
        });
        respondJson(response, statusMap[result.error ?? "AI_UNAVAILABLE"] ?? 503, {
          ok: false,
          error: { code: result.error ?? "AI_UNAVAILABLE", message: "Site generation failed." }
        });
        return;
      }

      const siteId = result.siteId ?? `site_${randomUUID().replace(/-/g, "")}`;

      eventRecorder.record({
        eventName: "web_api_site_generate",
        intent,
        role,
        route: url.pathname,
        sourceCampaign: "direct",
        variantId: "control",
        buildOutcome: siteId
      });

      respondJson(response, 200, {
        ok: true,
        data: {
          site_id: siteId,
          status: "completed",
          preview_url: `/v1/site/${siteId}/preview`,
          business_name: businessName,
          goal,
          intent,
          role,
          sections: result.sections ?? [],
          preview_html: result.previewHtml ?? ""
        }
      });
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/v1/site/") && url.pathname.endsWith("/preview")) {
      const siteId = url.pathname.slice("/v1/site/".length, -"/preview".length);
      respondJson(response, 200, {
        ok: true,
        data: {
          site_id: siteId,
          status: "draft",
          html: "<!-- Placeholder: AI-generated preview will be injected here -->"
        }
      });
      return;
    }

    respondJson(response, 404, {
      ok: false,
      error: { code: "NOT_FOUND", message: "Route not found." }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown runtime error.";
    respondJson(response, 502, {
      ok: false,
      error: {
        code: "SHARED_CONTRACT_ERROR",
        message
      }
    });
  }
}

function respondHtml(response: ServerResponse, statusCode: number, body: string) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.end(body);
}

function respondJson(response: ServerResponse, statusCode: number, payload: Record<string, unknown>) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readFormBody(request: AsyncIterable<Buffer | string>): Promise<URLSearchParams> {
  let body = "";
  for await (const chunk of request) {
    body += chunk.toString();
  }
  return new URLSearchParams(body);
}

async function readJsonBody(request: AsyncIterable<Buffer | string>): Promise<Record<string, unknown>> {
  let body = "";
  for await (const chunk of request) {
    body += chunk.toString();
  }
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseRole(value: string | null): OnboardingRole | null {
  return value && validRoles.includes(value as OnboardingRole) ? (value as OnboardingRole) : null;
}

function parseIntent(value: string | null): OnboardingIntent | null {
  return value && validIntents.includes(value as OnboardingIntent)
    ? (value as OnboardingIntent)
    : null;
}

function normalizeString(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const validFeedbackCategories: FeedbackCategory[] = ["bug", "idea", "praise", "question"];

function parseFeedbackCategory(value: string | null): FeedbackCategory | null {
  return value && validFeedbackCategories.includes(value as FeedbackCategory)
    ? (value as FeedbackCategory)
    : null;
}

function parseRating(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toSharedConfig(config: WebRuntimeConfig): SharedContractConfig {
  return {
    flowApiBase: config.flowApiBase,
    sharedAppUrl: config.sharedAppUrl,
    sharedAuthUrl: config.sharedAuthUrl,
    sharedBillingUrl: config.sharedBillingUrl,
    sharedDashUrl: config.sharedDashUrl,
    sharedFlowUrl: config.sharedFlowUrl
  };
}

function builderErrorKey(error: string | undefined): string {
  switch (error) {
    case "AI_QUOTA_EXCEEDED":
      return "web.build.error.quota";
    case "AI_UNAUTHORIZED":
      return "web.build.error.unauthorized";
    case "AI_BAD_RESPONSE":
      return "web.build.error.bad_response";
    default:
      return "web.build.error.unavailable";
  }
}

function defaultRouteTargets(
  config: WebRuntimeConfig
): SharedOnboardingContractPayload["routeTargets"] {
  return {
    commerce: { nextUrl: `${config.sharedDashUrl}/billing`, productSurface: "dash" },
    information: { nextUrl: config.sharedAppUrl, productSurface: "app" },
    leads: {
      nextUrl: `${config.sharedFlowUrl}/templates/lead-intake?surface=web`,
      productSurface: "flow"
    }
  };
}

function resolveRoutePlan(
  role: OnboardingRole,
  intent: OnboardingIntent,
  routeTargets: SharedOnboardingContractPayload["routeTargets"]
): RoutePlan {
  if (intent === "information") {
    return {
      description:
        role === "starter"
          ? "Start a simple site draft and keep the next step inside the human-facing product surface."
          : "Start with a site draft, then carry the user into app for content and site refinement.",
      label: "Informational site draft",
      nextUrl: routeTargets.information.nextUrl,
      productSurface: routeTargets.information.productSurface
    };
  }

  if (intent === "leads") {
    return {
      description:
        role === "operator"
          ? "Use a Flow template first so intake, approvals, and automation are ready before launch."
          : "Start with a Flow-powered capture template so the first site can move leads immediately.",
      label: "Flow-powered lead capture",
      nextUrl: routeTargets.leads.nextUrl,
      productSurface: routeTargets.leads.productSurface
    };
  }

  return {
    description:
      role === "starter"
        ? "Commerce setup stays operator-light here, but billing and control still move through the shared dash surface."
        : "Send the user toward shared billing, approvals, and launch controls without building a second ops stack.",
    label: "Commerce launch setup",
    nextUrl: routeTargets.commerce.nextUrl,
    productSurface: routeTargets.commerce.productSurface
  };
}

function buildSharedAuthHref(
  sharedAuthUrl: string,
  role: OnboardingRole,
  intent: OnboardingIntent,
  plan: RoutePlan
): string {
  const url = new URL(sharedAuthUrl);
  url.searchParams.set("origin", "web.iai.one");
  url.searchParams.set("role", role);
  url.searchParams.set("intent", intent);
  url.searchParams.set("next", plan.nextUrl);
  return url.toString();
}

async function loadSharedOnboardingContract(
  config: SharedContractConfig & { contractWorkspaceId: string },
  requestId: string,
  fetchImpl: typeof globalThis.fetch
): Promise<SharedOnboardingContractPayload> {
  const headers = {
    "x-request-id": requestId,
    "x-workspace-id": config.contractWorkspaceId
  };
  const response = await fetchImpl(
    buildFlowContractUrl(config.flowApiBase, "/v1/flow/web-onboarding-contract", {
      workspaceId: config.contractWorkspaceId
    }),
    { headers }
  );

  if (!response.ok) {
    throw new Error("Could not read the shared Team 2 onboarding contract.");
  }

  const payload = (await response.json()) as { data: SharedOnboardingContractPayload };
  return payload.data;
}

function toSharedContractConfig(
  fallback: SharedContractConfig,
  contract: SharedOnboardingContractPayload
): SharedContractConfig {
  return {
    flowApiBase: fallback.flowApiBase,
    sharedAppUrl: contract.sharedAppUrl,
    sharedAuthUrl: contract.sharedAuthUrl,
    sharedBillingUrl: contract.sharedBillingUrl,
    sharedDashUrl: contract.sharedDashUrl,
    sharedFlowUrl: contract.sharedFlowUrl
  };
}
