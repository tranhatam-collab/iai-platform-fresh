/**
 * Server-side quota plans.
 *
 * The limit and window of a quota come from here, never from the request: a
 * caller can only say which workspace and how much to count. Plans are read
 * from the `QUOTA_PLANS` Worker variable (JSON, per tenant with a `default`
 * entry) and fall back to the built-in default plan, so a missing or malformed
 * variable can never leave a workspace without a limit.
 *
 * Keep this module free of `cloudflare:*` imports so Node tests can load it.
 */

import { DEFAULT_QUOTA_LIMIT, MAX_QUOTA_LIMIT } from "./request-validation.js";

export interface QuotaPlan {
  /** Units allowed per window. */
  limit: number;
  /** Window length in ms; `used` resets once a window has elapsed. */
  windowMs: number;
}

/** Longest accepted window (one year). */
export const MAX_QUOTA_WINDOW_MS = 366 * 24 * 60 * 60 * 1000;

export const DEFAULT_QUOTA_PLAN: Readonly<QuotaPlan> = {
  limit: DEFAULT_QUOTA_LIMIT,
  windowMs: 30 * 24 * 60 * 60 * 1000,
};

function isBounded(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= max;
}

function parsePlans(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function applyOverrides(base: QuotaPlan, override: unknown): QuotaPlan {
  if (typeof override !== "object" || override === null) return base;
  const o = override as Record<string, unknown>;
  return {
    limit: isBounded(o.limit, MAX_QUOTA_LIMIT) ? o.limit : base.limit,
    windowMs: isBounded(o.windowMs, MAX_QUOTA_WINDOW_MS) ? o.windowMs : base.windowMs,
  };
}

/** Resolve the plan for a tenant: built-in default < `default` entry < tenant entry. */
export function resolveQuotaPlan(tenant: string, rawPlans?: string): QuotaPlan {
  const plans = parsePlans(rawPlans);
  const withDefault = applyOverrides({ ...DEFAULT_QUOTA_PLAN }, plans["default"]);
  return Object.prototype.hasOwnProperty.call(plans, tenant)
    ? applyOverrides(withDefault, plans[tenant])
    : withDefault;
}
