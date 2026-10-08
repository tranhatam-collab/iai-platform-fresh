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
import {
  DEFAULT_QUOTA_LIMIT,
  RequestValidationError,
  parseQuotaAmount,
  parseQuotaIdentifier,
  parseQuotaLimit,
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
  limit: number | undefined;
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
    limit: parseQuotaLimit(body.limit),
  };
}

export async function handleQuotaRequest(
  storage: QuotaStorage,
  request: Request
): Promise<Response> {
  let req: QuotaRequest;
  try {
    req = await parseQuotaRequest(request);
  } catch (err) {
    if (err instanceof RequestValidationError) return err.toResponse();
    throw err;
  }

  const state = await loadOrCreateState(storage, req);

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
 * Load the workspace quota, creating it on first use.
 *
 * Trust boundary: there is no server-side plan/entitlement source yet, so the
 * limit of a new quota comes from the first request that touches the
 * workspace (`req.limit`, falling back to DEFAULT_QUOTA_LIMIT) and is then
 * fixed for the lifetime of this Durable Object; later `limit` values are
 * ignored. The value is validated (positive safe integer <= MAX_QUOTA_LIMIT)
 * but not authenticated: any caller that can reach /quota/* can choose it.
 * Until the limit is resolved server-side, only trusted callers may reach
 * these routes.
 *
 * `windowStart` is recorded for a future usage window but is not read: used
 * never resets, so a quota is currently a lifetime allowance.
 */
async function loadOrCreateState(storage: QuotaStorage, req: QuotaRequest): Promise<QuotaState> {
  const stored = await storage.get<QuotaState>(QUOTA_STATE_KEY);
  if (stored) return stored;

  const fresh: QuotaState = {
    tenant: req.tenant,
    workspaceId: req.workspaceId,
    unit: "run_count",
    used: 0,
    limit: req.limit ?? DEFAULT_QUOTA_LIMIT,
    windowStart: Date.now(),
  };
  await storage.put<QuotaState>(QUOTA_STATE_KEY, fresh);
  return fresh;
}
