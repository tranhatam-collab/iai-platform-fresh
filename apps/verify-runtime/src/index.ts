/**
 * Verify Runtime — Quota + Tenant + Usage Emission Contracts
 *
 * This module provides the foundational authority layer for:
 *  - Tenant resolution (host / header / path / token)
 *  - Quota enforcement via atomic counter (Durable Object scaffold)
 *  - Usage event emission shape (billing spec compliant)
 *
 * Do not deploy without Founder gate approval.
 * See wrangler.toml for required Cloudflare bindings.
 */

export {
  resolveTenant,
  KNOWN_TENANTS,
  type KnownTenant,
  type TenantResolutionResult,
  TenantResolutionError,
} from "./tenant-resolver.js";

export {
  QuotaDO,
  type QuotaState,
  QuotaExceededError,
} from "./quota-do.js";

export {
  type UsageEvent,
  validateUsageEvent,
  emitUsageEvent,
} from "./usage-emission.js";
