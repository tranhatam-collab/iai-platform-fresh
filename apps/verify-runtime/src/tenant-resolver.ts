/**
 * Tenant Resolver
 *
 * Resolve tenant from incoming request using locked tenant matrix:
 *   iai, dsts, nhachung, muonnoi, aal
 *
 * Source of truth: VERIFY_IAI_ONE_TENANT_AND_FLOW_MATRIX_2026.md
 *
 * Rules:
 *  1. Only known tenants are accepted.
 *  2. Unknown tenant = 403 semantic (TenantResolutionError).
 *  3. No fallback to a default tenant.
 */

export const KNOWN_TENANTS = ["iai", "dsts", "nhachung", "muonnoi", "aal"] as const;
export type KnownTenant = (typeof KNOWN_TENANTS)[number];

export interface TenantResolutionResult {
  tenant: KnownTenant;
  resolvedBy: "host" | "header" | "path" | "token";
}

export class TenantResolutionError extends Error {
  constructor(public readonly reason: string) {
    super(`Tenant resolution failed: ${reason}`);
    this.name = "TenantResolutionError";
  }
}

/**
 * Resolve tenant from a Request object.
 *
 * Priority:
 *  1. x-iai-tenant header
 *  2. Host subdomain (e.g. iai.example.com)
 *  3. Path prefix /t/{tenant}
 *  4. Throw TenantResolutionError if none match.
 */
export function resolveTenant(request: Request): TenantResolutionResult {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  // 1. Header
  const headerTenant = request.headers.get("x-iai-tenant")?.trim().toLowerCase();
  if (headerTenant && isKnownTenant(headerTenant)) {
    return { tenant: headerTenant, resolvedBy: "header" };
  }

  // 2. Host subdomain
  const hostParts = host.split(".");
  if (hostParts.length >= 3) {
    const subdomain = hostParts[0]!;
    if (isKnownTenant(subdomain)) {
      return { tenant: subdomain, resolvedBy: "host" };
    }
  }

  // 3. Path prefix /t/{tenant}
  const pathMatch = url.pathname.match(/^\/t\/([a-z0-9_-]+)/i);
  if (pathMatch) {
    const pathTenant = pathMatch[1]!.toLowerCase();
    if (isKnownTenant(pathTenant)) {
      return { tenant: pathTenant, resolvedBy: "path" };
    }
  }

  // 4. Token (stub — requires signed JWT validation in Phase 2)
  // const authHeader = request.headers.get("authorization");
  // if (authHeader?.startsWith("Bearer ")) { ... }

  throw new TenantResolutionError(
    `Unknown tenant. Known tenants: ${KNOWN_TENANTS.join(", ")}`
  );
}

function isKnownTenant(code: string): code is KnownTenant {
  return (KNOWN_TENANTS as readonly string[]).includes(code);
}
