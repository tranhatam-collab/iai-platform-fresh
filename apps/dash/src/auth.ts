import type { IncomingMessage } from "node:http";

export interface DashAuthConfig {
  defaultWorkspaceId: string;
  sessionCookieName: string;
  workspaceCookieName: string;
}

export interface DashSessionContext {
  authenticated: boolean;
  loginPath: string;
  sessionSource: "cookie" | "header" | "missing";
  sessionToken?: string;
  workspaceId: string;
  workspaceSource: "cookie" | "default" | "header" | "query";
}

export function resolveDashSessionContext(
  request: IncomingMessage,
  url: URL,
  config: DashAuthConfig
): DashSessionContext {
  const cookies = parseCookies(request.headers.cookie);
  const sessionFromCookie = cookies[config.sessionCookieName];
  const sessionFromHeader = getHeader(request, "x-dash-session");
  const sessionToken = sessionFromHeader ?? sessionFromCookie;
  const sessionSource: DashSessionContext["sessionSource"] = sessionFromHeader
    ? "header"
    : sessionFromCookie
      ? "cookie"
      : "missing";

  const workspaceFromHeader = getHeader(request, "x-workspace-id");
  const workspaceFromQuery = normalizeString(url.searchParams.get("workspace_id"));
  const workspaceFromCookie = cookies[config.workspaceCookieName];
  const workspaceId =
    workspaceFromHeader ??
    workspaceFromQuery ??
    workspaceFromCookie ??
    config.defaultWorkspaceId;
  const workspaceSource: DashSessionContext["workspaceSource"] = workspaceFromHeader
    ? "header"
    : workspaceFromQuery
      ? "query"
      : workspaceFromCookie
        ? "cookie"
        : "default";

  return {
    authenticated: Boolean(sessionToken),
    loginPath: buildLoginPath(url.pathname),
    sessionSource,
    sessionToken,
    workspaceId,
    workspaceSource
  };
}

export function expireCookie(name: string): string {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function buildLoginPath(nextPath: string): string {
  return `/login?next=${encodeURIComponent(nextPath || "/dashboard")}`;
}

function getHeader(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name];

  if (Array.isArray(value)) {
    return normalizeString(value[0]);
  }

  return normalizeString(value);
}

function normalizeString(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) {
    return {};
  }

  const entries = header.split(";");
  const cookies: Record<string, string> = {};

  for (const entry of entries) {
    const separatorIndex = entry.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();

    if (!key || !value) {
      continue;
    }

    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}
