/**
 * Verify Runtime — Quota + Tenant + Usage Emission Worker
 *
 * Deploy as a Cloudflare Worker with:
 *  - Durable Object atomic quota counter
 *  - D1 usage ledger
 *  - Queue async emission
 *
 * Routes:
 *   GET  /health          → health + tenant resolution
 *   POST /quota/check     → check quota without increment
 *   POST /quota/increment → atomically increment, 429 if exceeded
 *   POST /usage/emit      → emit usage event (queue → D1 fallback → validate-only)
 */

import { QuotaDurableObject } from "./durable-object.js";
import worker from "./worker.js";

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
  emitUsageEventToD1,
  emitUsageEventToQueue,
} from "./usage-emission.js";

export { worker, type Env } from "./worker.js";
export { QuotaDurableObject } from "./durable-object.js";

export default worker;
