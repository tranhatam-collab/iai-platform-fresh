import { readFileSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import { isAbsolute, resolve as resolvePath } from "node:path";
import type { PayReadAccessContext, PayViewerRole } from "./read-model.js";

const viewerRolePriority: PayViewerRole[] = [
  "super_admin",
  "security_admin",
  "finance_admin",
  "treasury_admin",
  "payments_ops",
  "read_only_auditor",
  "support_admin",
  "site_admin",
  "public"
];

export interface PaySessionContext {
  accessContext: PayReadAccessContext;
  authenticated: boolean;
  roleSource: "auth_middleware" | "auth_source" | "missing" | "shared_session";
  sessionToken: string | null;
  subjectId: string | null;
  workspaceId: string;
}

export interface PaySessionContextResolverConfig {
  authSource?: SharedPayAuthSource | null;
  authClaimsCookieNames?: string[];
  authClaimsHeaderNames?: string[];
  defaultWorkspaceId?: string;
  roleClaimsCookieNames?: string[];
  roleClaimsHeaderNames?: string[];
  roleClaimsCookieName?: string;
  sessionClaimsCookieNames?: string[];
  sessionClaimsHeaderNames?: string[];
  sessionClaimsCookieName?: string;
  sessionCookieNames?: string[];
  sessionCookieName?: string;
  sessionHeaderNames?: string[];
  subjectCookieNames?: string[];
  subjectCookieName?: string;
  subjectHeaderNames?: string[];
  workspaceCookieNames?: string[];
  workspaceCookieName?: string;
  workspaceHeaderNames?: string[];
}

export interface SharedPayAuthSource {
  getViewerRoles(subjectId: string, workspaceId: string): PayViewerRole[];
}

export interface SharedPayAuthSourceFile {
  emitted_at?: string;
  schema_version: "iai.auth.shared-session.v1";
  subjects?: Record<string, SharedPayAuthSubjectRecord>;
}

interface SharedPayAuthSubjectRecord {
  default_roles?: PayViewerRole[];
  workspaces?: Record<string, SharedPayAuthWorkspaceRecord>;
}

interface SharedPayAuthWorkspaceRecord {
  roles?: PayViewerRole[];
}

interface RawSessionClaims {
  claims?: unknown;
  pay_roles?: unknown;
  roles?: unknown;
  session?: unknown;
  session_id?: unknown;
  session_token?: unknown;
  sessionToken?: unknown;
  sub?: unknown;
  subject?: unknown;
  subject_id?: unknown;
  subjectId?: unknown;
  user_id?: unknown;
  viewer_roles?: unknown;
  viewerRoles?: unknown;
  workspace?: unknown;
  workspace_id?: unknown;
  workspaceId?: unknown;
}

export function createSharedPayAuthSourceFromFile(filePath: string): SharedPayAuthSource {
  const resolvedPath = isAbsolute(filePath) ? filePath : resolvePath(process.cwd(), filePath);
  const source = readFileSync(resolvedPath, "utf8");
  return createSharedPayAuthSourceFromData(JSON.parse(source) as SharedPayAuthSourceFile);
}

export function createSharedPayAuthSourceFromData(parsed: SharedPayAuthSourceFile): SharedPayAuthSource {
  if (parsed.schema_version !== "iai.auth.shared-session.v1") {
    throw new Error(`Unsupported shared pay auth schema: ${parsed.schema_version}`);
  }

  const subjects = parsed.subjects ?? {};

  return {
    getViewerRoles(subjectId, workspaceId) {
      const subjectRecord = subjects[subjectId];
      if (!subjectRecord) {
        return [];
      }

      const workspaceRoles = subjectRecord.workspaces?.[workspaceId]?.roles ?? [];
      if (workspaceRoles.length > 0) {
        return normalizeViewerRoles(workspaceRoles);
      }

      return normalizeViewerRoles(subjectRecord.default_roles ?? []);
    }
  };
}

export function resolvePaySessionContext(
  request: IncomingMessage,
  url: URL,
  config: PaySessionContextResolverConfig = {}
): PaySessionContext {
  const cookies = parseCookies(request.headers.cookie);
  const authClaimsHeaderNames = dedupeNames([
    ...(config.authClaimsHeaderNames ?? []),
    "x-iai-auth-claims",
    "x-auth-request-claims"
  ]);
  const sessionClaimsHeaderNames = dedupeNames([
    ...(config.sessionClaimsHeaderNames ?? []),
    "x-iai-shared-session",
    "x-iai-session-claims"
  ]);
  const authClaimsCookieNames = dedupeNames([
    ...(config.authClaimsCookieNames ?? []),
    "iai_auth_claims"
  ]);
  const sessionClaimsCookieNames = dedupeNames([
    ...(config.sessionClaimsCookieNames ?? []),
    config.sessionClaimsCookieName ?? "iai_session_claims",
    "iai_shared_session"
  ]);
  const roleClaimsHeaderNames = dedupeNames([
    ...(config.roleClaimsHeaderNames ?? []),
    "x-iai-role-claims"
  ]);
  const roleClaimsCookieNames = dedupeNames([
    ...(config.roleClaimsCookieNames ?? []),
    config.roleClaimsCookieName ?? "iai_role_claims"
  ]);
  const sessionHeaderNames = dedupeNames([
    ...(config.sessionHeaderNames ?? []),
    "x-iai-session",
    "x-iai-session-id"
  ]);
  const sessionCookieNames = dedupeNames([
    ...(config.sessionCookieNames ?? []),
    config.sessionCookieName ?? "iai_session"
  ]);
  const subjectHeaderNames = dedupeNames([
    ...(config.subjectHeaderNames ?? []),
    "x-subject-id",
    "x-iai-subject-id"
  ]);
  const subjectCookieNames = dedupeNames([
    ...(config.subjectCookieNames ?? []),
    config.subjectCookieName ?? "iai_subject_id"
  ]);
  const workspaceHeaderNames = dedupeNames([
    ...(config.workspaceHeaderNames ?? []),
    "x-workspace-id",
    "x-iai-workspace-id"
  ]);
  const workspaceCookieNames = dedupeNames([
    ...(config.workspaceCookieNames ?? []),
    config.workspaceCookieName ?? "iai_workspace"
  ]);
  const authClaims = parseClaimsFromSources(request, cookies, authClaimsHeaderNames, authClaimsCookieNames);
  const sharedSessionClaims = parseClaimsFromSources(
    request,
    cookies,
    sessionClaimsHeaderNames,
    sessionClaimsCookieNames
  );
  const sharedClaims = authClaims.claims ?? sharedSessionClaims.claims;
  const subjectId =
    sharedClaims?.subjectId ??
    getFirstHeader(request, subjectHeaderNames) ??
    getFirstCookie(cookies, subjectCookieNames) ??
    null;
  const workspaceId =
    sharedClaims?.workspaceId ??
    getFirstHeader(request, workspaceHeaderNames) ??
    normalizeString(url.searchParams.get("workspace_id")) ??
    getFirstCookie(cookies, workspaceCookieNames) ??
    config.defaultWorkspaceId ??
    "ws_pay_main";
  const sessionToken =
    sharedClaims?.sessionToken ??
    getFirstHeader(request, sessionHeaderNames) ??
    getFirstCookie(cookies, sessionCookieNames) ??
    null;
  const claimedRoles = normalizeViewerRoles([
    ...(sharedClaims?.viewerRoles ?? []),
    ...parseViewerRoleClaimSet(getFirstHeader(request, roleClaimsHeaderNames)),
    ...parseViewerRoleClaimSet(getFirstCookie(cookies, roleClaimsCookieNames))
  ]);
  const authenticated = Boolean(sharedClaims ?? sessionToken ?? subjectId);
  const authSourceRoles =
    authenticated && subjectId && config.authSource
      ? config.authSource.getViewerRoles(subjectId, workspaceId)
      : [];
  const viewerRoles = normalizeViewerRoles(
    claimedRoles.length > 0 ? claimedRoles : authSourceRoles
  );
  const effectiveViewerRole = selectEffectiveViewerRole(viewerRoles);

  return {
    accessContext: {
      authenticated,
      subjectId,
      viewerRole: effectiveViewerRole,
      viewerRoles,
      workspaceId
    },
    authenticated,
    roleSource: authClaims.claims
      ? "auth_middleware"
      : sharedSessionClaims.claims
        ? "shared_session"
        : authSourceRoles.length > 0
          ? "auth_source"
          : "missing",
    sessionToken,
    subjectId,
    workspaceId
  };
}

function parseSessionClaims(rawValue: string | undefined): {
  sessionToken: string | null;
  subjectId: string | null;
  viewerRoles: PayViewerRole[];
  workspaceId: string | null;
} | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as RawSessionClaims;
    return {
      sessionToken: findFirstStringByKeys(parsed, [
        "session_token",
        "sessionToken",
        "session_id",
        "sessionId",
        "sid"
      ]),
      subjectId: findFirstStringByKeys(parsed, [
        "subject_id",
        "subjectId",
        "sub",
        "user_id",
        "userId"
      ]),
      viewerRoles: normalizeViewerRoles([
        ...findRoleArrayByKeys(parsed, ["pay_roles", "viewer_roles", "viewerRoles", "roles"])
      ]),
      workspaceId: findFirstStringByKeys(parsed, [
        "workspace_id",
        "workspaceId",
        "workspace",
        "tenant_id",
        "tenantId"
      ])
    };
  } catch {
    return null;
  }
}

function parseViewerRoleClaimSet(rawValue: string | null | undefined): PayViewerRole[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (Array.isArray(parsed)) {
      return normalizeViewerRoles(parsed);
    }
    if (parsed && typeof parsed === "object") {
      return normalizeViewerRoles(findRoleArrayByKeys(parsed, [
        "pay_roles",
        "viewer_roles",
        "viewerRoles",
        "roles"
      ]));
    }
  } catch {
    // Fall back to comma-separated parsing.
  }

  return normalizeViewerRoles(rawValue.split(","));
}

function normalizeViewerRoles(rawValues: unknown[]): PayViewerRole[] {
  const roles = rawValues
    .map((value) => normalizeViewerRole(value))
    .filter((value): value is PayViewerRole => value !== null);

  return [...new Set(roles)];
}

function normalizeViewerRole(rawValue: unknown): PayViewerRole | null {
  const normalized =
    typeof rawValue === "string"
      ? rawValue.trim().toLowerCase()
      : typeof rawValue === "number"
        ? String(rawValue)
        : null;

  switch (normalized) {
    case "public":
    case "super_admin":
    case "finance_admin":
    case "treasury_admin":
    case "payments_ops":
    case "support_admin":
    case "site_admin":
    case "security_admin":
    case "read_only_auditor":
      return normalized;
    default:
      return null;
  }
}

function selectEffectiveViewerRole(viewerRoles: PayViewerRole[]): PayViewerRole {
  for (const role of viewerRolePriority) {
    if (viewerRoles.includes(role)) {
      return role;
    }
  }

  return "public";
}

function getHeader(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name];

  if (Array.isArray(value)) {
    return normalizeString(value[0]) ?? undefined;
  }

  return normalizeString(value) ?? undefined;
}

function getFirstHeader(request: IncomingMessage, names: string[]): string | null {
  for (const name of names) {
    const value = getHeader(request, name);
    if (value) {
      return value;
    }
  }

  return null;
}

function getFirstCookie(cookies: Record<string, string>, names: string[]): string | null {
  for (const name of names) {
    const value = normalizeString(cookies[name]);
    if (value) {
      return value;
    }
  }

  return null;
}

function parseClaimsFromSources(
  request: IncomingMessage,
  cookies: Record<string, string>,
  headerNames: string[],
  cookieNames: string[]
): {
  claims: {
    sessionToken: string | null;
    subjectId: string | null;
    viewerRoles: PayViewerRole[];
    workspaceId: string | null;
  } | null;
} {
  const headerValue = getFirstHeader(request, headerNames);
  if (headerValue) {
    return {
      claims: parseSessionClaims(headerValue)
    };
  }

  const cookieValue = getFirstCookie(cookies, cookieNames);
  if (cookieValue) {
    return {
      claims: parseSessionClaims(cookieValue)
    };
  }

  return {
    claims: null
  };
}

function dedupeNames(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => normalizeString(value)).filter((value): value is string => Boolean(value)))];
}

function findFirstStringByKeys(input: unknown, keys: string[]): string | null {
  const match = findFirstValueByKeys(input, new Set(keys));
  return normalizeString(typeof match === "string" ? match : typeof match === "number" ? String(match) : null);
}

function findRoleArrayByKeys(input: unknown, keys: string[]): unknown[] {
  const match = findFirstValueByKeys(input, new Set(keys));
  return Array.isArray(match) ? match : [];
}

function findFirstValueByKeys(input: unknown, keys: Set<string>): unknown {
  if (!input || typeof input !== "object") {
    return null;
  }

  const queue: unknown[] = [input];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") {
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      if (keys.has(key) && value !== undefined && value !== null) {
        return value;
      }
      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
}

function normalizeString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) {
    return {};
  }

  const cookies: Record<string, string> = {};

  for (const entry of header.split(";")) {
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
