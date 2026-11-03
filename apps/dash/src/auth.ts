import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export interface DashAuthConfig {
  defaultWorkspaceId: string;
  sessionSigningSecret?: string;
  sessionCookieName: string;
  workspaceCookieName: string;
}

export interface DashSessionContext {
  authenticated: boolean;
  loginPath: string;
  sessionSource: "cookie" | "header" | "missing";
  sessionToken?: string;
  subject?: string;
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
  const requestedWorkspaceId =
    workspaceFromHeader ?? workspaceFromQuery ?? workspaceFromCookie ?? config.defaultWorkspaceId;
  const workspaceSource: DashSessionContext["workspaceSource"] = workspaceFromHeader
    ? "header"
    : workspaceFromQuery
      ? "query"
      : workspaceFromCookie
        ? "cookie"
        : "default";

  const claims = verifyDashSessionToken(sessionToken, config.sessionSigningSecret);
  const workspaceId = claims?.workspaceIds.includes(requestedWorkspaceId)
    ? requestedWorkspaceId
    : claims?.workspaceIds[0] ?? config.defaultWorkspaceId;

  return {
    authenticated: Boolean(claims),
    loginPath: buildLoginPath(url.pathname),
    sessionSource,
    sessionToken,
    subject: claims?.subject,
    workspaceId,
    workspaceSource
  };
}

interface DashSessionClaims {
  expiresAt: number;
  subject: string;
  workspaceIds: string[];
}

export function createDashSessionToken(
  claims: DashSessionClaims,
  signingSecret: string
): string {
  if (signingSecret.length < 32) {
    throw new Error("Dash session signing secret must be at least 32 characters.");
  }

  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const signature = signPayload(payload, signingSecret);
  return `${payload}.${signature}`;
}

function verifyDashSessionToken(
  token: string | undefined,
  signingSecret: string | undefined
): DashSessionClaims | undefined {
  if (!token || !signingSecret || signingSecret.length < 32) {
    return undefined;
  }

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) {
    return undefined;
  }

  const expected = Buffer.from(signPayload(payload, signingSecret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<DashSessionClaims>;
    const workspaceIds = Array.isArray(parsed.workspaceIds)
      ? parsed.workspaceIds.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];

    if (
      typeof parsed.subject !== "string" ||
      !parsed.subject.trim() ||
      typeof parsed.expiresAt !== "number" ||
      !Number.isSafeInteger(parsed.expiresAt) ||
      parsed.expiresAt <= Math.floor(Date.now() / 1000) ||
      workspaceIds.length === 0
    ) {
      return undefined;
    }

    return {
      expiresAt: parsed.expiresAt,
      subject: parsed.subject.trim(),
      workspaceIds
    };
  } catch {
    return undefined;
  }
}

function signPayload(payload: string, signingSecret: string): string {
  return createHmac("sha256", signingSecret).update(payload).digest("base64url");
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
