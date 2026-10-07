/**
 * Quota request handler — the logic behind QuotaDurableObject.
 *
 * Kept separate from durable-object.ts (which imports `cloudflare:workers`) so
 * Node tests run the exact code the Durable Object runs, against any storage
 * that implements QuotaStorage. The Durable Object serialises its fetch
 * handler around storage reads/writes, so the get -> check -> put sequence in
 * the increment path is atomic as long as no non-storage `await` is added
 * between them.
 */

import type { QuotaState } from "./quota-do.js";
import { resolveQuotaPlan } from "./quota-plan.js";
import {
  RequestValidationError,
  parseQuotaAmount,
  parseQuotaIdentifier,
  readJsonObject,
} from "./request-validation.js";

export const QUOTA_STATE_KEY = "quota_state";

/** The subset of DurableObjectStorage the handler needs. */
export interface QuotaStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
}

const ACTIONS = ["check", "increment", "getState"] as const;
type QuotaAction = (typeof ACTIONS)[number];

interface QuotaRequest {
  action: QuotaAction;
  tenant: string;
  workspaceId: string;
  amount: number;
}

export interface QuotaHandlerOptions {
  /** Raw `QUOTA_PLANS` variable (JSON); see quota-plan.ts. */
  plans?: string;
  /** Clock, injectable so window changes can be tested. */
  now?: () => number;
}

async function parseQuotaRequest(request: Request): Promise<QuotaRequest> {
  const body = await readJsonObject(request);
  const action = body.action;
  if (typeof action !== "string" || !(ACTIONS as readonly string[]).includes(action)) {
    throw new RequestValidationError("unknown_action", "Unknown action.");
  }
  return {
    action: action as QuotaAction,
    tenant: parseQuotaIdentifier(body.tenant, "tenant"),
    workspaceId: parseQuotaIdentifier(body.workspaceId, "workspaceId"),
    amount: parseQuotaAmount(body.amount),
  };
}

export async function handleQuotaRequest(
  storage: QuotaStorage,
  request: Request,
  options: QuotaHandlerOptions = {}
): Promise<Response> {
  let req: QuotaRequest;
  try {
    req = await parseQuotaRequest(request);
  } catch (err) {
    if (err instanceof RequestValidationError) return err.toResponse();
    throw err;
  }

  const state = await loadOrCreateState(storage, req, options);

  if (req.action === "check") {
    const remaining = state.limit - state.used;
    return Response.json({ allowed: req.amount <= remaining, remaining });
  }

  if (req.action === "increment") {
    if (state.used + req.amount > state.limit) {
      return Response.json(
        { error: "quota_exceeded", used: state.used, limit: state.limit },
        { status: 429 }
      );
    }
    const next: QuotaState = { ...state, used: state.used + req.amount };
    await storage.put<QuotaState>(QUOTA_STATE_KEY, next);
    return Response.json(next);
  }

  return Response.json(state);
}

/**
 * Load the workspace quota for the current window, creating it on first use.
 *
 * The limit and window come from the server-side plan (quota-plan.ts), never
 * from the request, and are re-applied on every load so a plan change takes
 * effect. Once `windowMs` has elapsed since `windowStart`, the counter resets
 * and a new window starts.
 */
async function loadOrCreateState(
  storage: QuotaStorage,
  req: QuotaRequest,
  options: QuotaHandlerOptions
): Promise<QuotaState> {
  const now = (options.now ?? Date.now)();
  const plan = resolveQuotaPlan(req.tenant, options.plans);
  const stored = await storage.get<QuotaState>(QUOTA_STATE_KEY);

  if (stored) {
    const expired = now - stored.windowStart >= plan.windowMs;
    if (!expired && stored.limit === plan.limit) return stored;
    const refreshed: QuotaState = expired
      ? { ...stored, used: 0, limit: plan.limit, windowStart: now }
      : { ...stored, limit: plan.limit };
    await storage.put<QuotaState>(QUOTA_STATE_KEY, refreshed);
    return refreshed;
  }

  const fresh: QuotaState = {
    tenant: req.tenant,
    workspaceId: req.workspaceId,
    unit: "run_count",
    used: 0,
    limit: plan.limit,
    windowStart: now,
  };
  await storage.put<QuotaState>(QUOTA_STATE_KEY, fresh);
  return fresh;
}
