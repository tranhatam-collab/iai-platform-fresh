import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { createDashApiClient } from "./api-client.js";
import { expireCookie, resolveDashSessionContext, type DashAuthConfig } from "./auth.js";
import { defaultLocale, resolveLocale, t, type Locale } from "./i18n.js";
import {
  renderActionCenterPage,
  renderAuditPage,
  renderDashboardPage,
  renderFlowBuilderPage,
  renderFlowDetailPage,
  renderFlowDraftsPage,
  renderFlowPublishPage,
  renderFlowVersionsPage,
  renderFlowsPage,
  renderLoginPage,
  renderNotFoundPage,
  renderRuntimeExecutionDetailPage,
  renderRuntimeExecutionsPage,
  type DashRenderConfig
} from "./render.js";

export interface DashServerOptions extends Partial<DashAuthConfig>, Partial<DashRenderConfig> {
  fetchImpl?: typeof globalThis.fetch;
}

interface ResolvedDashConfig extends DashAuthConfig, DashRenderConfig {}

export function createDashServer(options: DashServerOptions = {}): Server {
  return createServer(createDashRequestHandler(options));
}

export function createDashRequestHandler(options: DashServerOptions = {}) {
  const config = resolveConfig(options);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response, config, fetchImpl);
  };
}

function resolveConfig(options: DashServerOptions): ResolvedDashConfig {
  return {
    defaultWorkspaceId:
      options.defaultWorkspaceId ?? process.env.DASH_DEFAULT_WORKSPACE_ID ?? "ws_flow_main",
    flowApiBase: options.flowApiBase ?? process.env.DASH_FLOW_API_BASE ?? "http://127.0.0.1:8787",
    sessionCookieName:
      options.sessionCookieName ?? process.env.DASH_SESSION_COOKIE_NAME ?? "iai_session",
    sharedAuthUrl:
      options.sharedAuthUrl ?? process.env.DASH_SHARED_AUTH_URL ?? "https://app.iai.one/auth/start",
    workspaceCookieName:
      options.workspaceCookieName ?? process.env.DASH_WORKSPACE_COOKIE_NAME ?? "iai_workspace"
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedDashConfig,
  fetchImpl: typeof globalThis.fetch
) {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const locale = resolveLocale(url, normalizeHeaderValue(request.headers["accept-language"]));
  const actionFeedback = resolveActionFeedback(url);
  const flowActionRoute = matchFlowActionRoute(url.pathname);
  const flowRoute = matchFlowRoute(url.pathname);
  const requestId = `req_${randomUUID()}`;
  const runtimeExecutionRoute = matchRuntimeExecutionRoute(url.pathname);

  try {
    if (method !== "GET" && method !== "POST") {
      respondJson(response, 405, {
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: t(locale, "dash.error.method")
        },
        ok: false
      }, locale);
      return;
    }

    if (url.pathname === "/health") {
      respondJson(response, 200, {
        data: {
          default_workspace_id: config.defaultWorkspaceId,
          flow_api_base: config.flowApiBase,
          service: "iai-dash",
          shared_auth_url: config.sharedAuthUrl,
          status: "ok",
          timestamp: new Date().toISOString()
        },
        ok: true
      }, locale);
      return;
    }

    if (url.pathname === "/login") {
      const nextPath = normalizeNextPath(url.searchParams.get("next"));
      respondHtml(response, 200, renderLoginPage(nextPath, config, locale), locale);
      return;
    }

    if (url.pathname === "/logout") {
      response.setHeader("set-cookie", [
        expireCookie(config.sessionCookieName),
        expireCookie(config.workspaceCookieName)
      ]);
      redirect(response, localizePath("/login", locale));
      return;
    }

    if (
      url.pathname !== "/" &&
      url.pathname !== "/dashboard" &&
      url.pathname !== "/actions" &&
      url.pathname !== "/audit" &&
      url.pathname !== "/flows" &&
      url.pathname !== "/runtime" &&
      url.pathname !== "/runtime/executions" &&
      !flowActionRoute &&
      !flowRoute &&
      !runtimeExecutionRoute
    ) {
      respondHtml(response, 404, renderNotFoundPage(locale, url.pathname), locale);
      return;
    }

    const session = resolveDashSessionContext(request, url, config);

    if (!session.authenticated) {
      redirect(response, localizePath(session.loginPath, locale));
      return;
    }

    const apiClient = createDashApiClient({
      fetchImpl,
      flowApiBase: config.flowApiBase,
      workspaceId: session.workspaceId
    });

    if (method === "POST") {
      if (!flowActionRoute) {
        respondJson(response, 405, {
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: t(locale, "dash.error.method")
          },
          ok: false
        }, locale);
        return;
      }

      const actor = session.sessionToken ?? "dash.operator";
      const result =
        flowActionRoute.action === "builder.save"
          ? await apiClient.saveFlowDraft(flowActionRoute.flowId, requestId, actor)
          : flowActionRoute.action === "builder.validate"
            ? await apiClient.validateFlowDraft(flowActionRoute.flowId, requestId, actor)
            : flowActionRoute.action === "publish.preview"
              ? await apiClient.previewFlowPublish(flowActionRoute.flowId, requestId, actor)
              : await apiClient.publishFlow(flowActionRoute.flowId, requestId, actor);
      const redirectUrl = new URL(flowActionRoute.targetPath, "https://dash.iai.one");
      if (result.ok && result.result) {
        redirectUrl.searchParams.set("action", result.result.action);
        redirectUrl.searchParams.set("message", result.result.message);
        redirectUrl.searchParams.set("outcome", result.result.outcome);
      } else {
        redirectUrl.searchParams.set("action", flowActionRoute.action);
        redirectUrl.searchParams.set("message", result.error?.message ?? t(locale, "dash.error.server"));
        redirectUrl.searchParams.set("outcome", "failed");
      }
      redirect(response, localizePath(`${redirectUrl.pathname}${redirectUrl.search}`, locale));
      return;
    }

    const runtime = await apiClient.loadRuntimeSummary(requestId);

    if (url.pathname === "/actions") {
      respondHtml(response, 200, renderActionCenterPage(session, runtime, locale), locale);
      return;
    }

    if (url.pathname === "/audit") {
      const audit = await apiClient.loadFlowAudit(requestId);
      respondHtml(response, 200, renderAuditPage(session, audit, locale), locale);
      return;
    }

    if (url.pathname === "/flows") {
      const flows = await apiClient.loadFlowList(requestId);
      respondHtml(response, 200, renderFlowsPage(session, flows, locale), locale);
      return;
    }

    if (flowRoute?.resource === "detail") {
      const flowDetail = await apiClient.loadFlowDetail(flowRoute.flowId, requestId);
      respondHtml(response, 200, renderFlowDetailPage(session, flowDetail, locale), locale);
      return;
    }

    if (flowRoute?.resource === "builder") {
      const flowDetail = await apiClient.loadFlowDetail(flowRoute.flowId, requestId);
      respondHtml(response, 200, renderFlowBuilderPage(session, flowDetail, locale, actionFeedback), locale);
      return;
    }

    if (flowRoute?.resource === "versions") {
      const versions = await apiClient.loadFlowVersions(flowRoute.flowId, requestId);
      respondHtml(response, 200, renderFlowVersionsPage(session, versions, locale), locale);
      return;
    }

    if (flowRoute?.resource === "drafts") {
      const drafts = await apiClient.loadFlowDrafts(flowRoute.flowId, requestId);
      respondHtml(response, 200, renderFlowDraftsPage(session, drafts, locale), locale);
      return;
    }

    if (flowRoute?.resource === "publish") {
      const readiness = await apiClient.loadFlowPublishReadiness(flowRoute.flowId, requestId);
      respondHtml(response, 200, renderFlowPublishPage(session, readiness, locale, actionFeedback), locale);
      return;
    }

    if (url.pathname === "/runtime" || url.pathname === "/runtime/executions") {
      const executions = await apiClient.loadRuntimeExecutions(requestId);
      respondHtml(response, 200, renderRuntimeExecutionsPage(session, executions, locale), locale);
      return;
    }

    if (runtimeExecutionRoute) {
      const execution = await apiClient.loadRuntimeExecutionDetail(runtimeExecutionRoute.executionId, requestId);
      respondHtml(response, 200, renderRuntimeExecutionDetailPage(session, execution, locale), locale);
      return;
    }

    respondHtml(response, 200, renderDashboardPage(session, runtime, config, locale), locale);
  } catch (error) {
    respondJson(response, 500, {
      error: {
        code: "DASH_SERVER_ERROR",
        message: error instanceof Error ? error.message : t(locale, "dash.error.server")
      },
      ok: false
    }, locale);
  }
}

function normalizeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/")) {
    return "/dashboard";
  }

  return value;
}

function redirect(response: ServerResponse, location: string): void {
  response.statusCode = 303;
  response.setHeader("location", location);
  response.end();
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
  response.end(JSON.stringify(payload));
}

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value.join(",") : value;
}

function localizePath(path: string, locale: Locale): string {
  const url = new URL(path, "https://dash.iai.one");

  if (locale === defaultLocale) {
    url.searchParams.delete("lang");
  } else {
    url.searchParams.set("lang", locale);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function matchFlowRoute(
  pathname: string
): { flowId: string; resource: "builder" | "detail" | "drafts" | "publish" | "versions" } | undefined {
  const builderMatch = pathname.match(/^\/flows\/([^/]+)\/builder$/);
  if (builderMatch?.[1]) {
    return {
      flowId: decodeURIComponent(builderMatch[1]),
      resource: "builder"
    };
  }

  const versionsMatch = pathname.match(/^\/flows\/([^/]+)\/versions$/);
  if (versionsMatch?.[1]) {
    return {
      flowId: decodeURIComponent(versionsMatch[1]),
      resource: "versions"
    };
  }

  const draftsMatch = pathname.match(/^\/flows\/([^/]+)\/drafts$/);
  if (draftsMatch?.[1]) {
    return {
      flowId: decodeURIComponent(draftsMatch[1]),
      resource: "drafts"
    };
  }

  const publishMatch = pathname.match(/^\/flows\/([^/]+)\/publish$/);
  if (publishMatch?.[1]) {
    return {
      flowId: decodeURIComponent(publishMatch[1]),
      resource: "publish"
    };
  }

  const detailMatch = pathname.match(/^\/flows\/([^/]+)$/);
  if (detailMatch?.[1]) {
    return {
      flowId: decodeURIComponent(detailMatch[1]),
      resource: "detail"
    };
  }

  return undefined;
}

function matchFlowActionRoute(
  pathname: string
):
  | {
      action: "builder.save" | "builder.validate" | "publish.confirm" | "publish.preview";
      flowId: string;
      targetPath: string;
    }
  | undefined {
  const match = pathname.match(
    /^\/flows\/([^/]+)\/(builder\/save|builder\/validate|publish\/preview|publish\/confirm)$/
  );
  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  const flowId = decodeURIComponent(match[1]);
  const mapping: Record<
    string,
    { action: "builder.save" | "builder.validate" | "publish.confirm" | "publish.preview"; targetPath: string }
  > = {
    "builder/save": { action: "builder.save", targetPath: `/flows/${encodeURIComponent(flowId)}/builder` },
    "builder/validate": { action: "builder.validate", targetPath: `/flows/${encodeURIComponent(flowId)}/builder` },
    "publish/confirm": { action: "publish.confirm", targetPath: `/flows/${encodeURIComponent(flowId)}/publish` },
    "publish/preview": { action: "publish.preview", targetPath: `/flows/${encodeURIComponent(flowId)}/publish` }
  };
  const resolved = mapping[match[2]];
  if (!resolved) {
    return undefined;
  }

  return {
    action: resolved.action,
    flowId,
    targetPath: resolved.targetPath
  };
}

function resolveActionFeedback(url: URL): { action: string; message: string; outcome: "failed" | "succeeded" } | undefined {
  const action = url.searchParams.get("action");
  const message = url.searchParams.get("message");
  const outcome = url.searchParams.get("outcome");

  if (!action || !message || (outcome !== "succeeded" && outcome !== "failed")) {
    return undefined;
  }

  return {
    action,
    message,
    outcome
  };
}

function matchRuntimeExecutionRoute(pathname: string): { executionId: string } | undefined {
  const match = pathname.match(/^\/runtime\/executions\/([^/]+)$/);
  if (!match?.[1]) {
    return undefined;
  }

  return {
    executionId: decodeURIComponent(match[1])
  };
}
