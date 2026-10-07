/**
 * Request validation shared by the Worker route layer and the quota Durable
 * Object, so both enforce one definition of a valid quota request.
 *
 * Keep this module free of `cloudflare:*` imports so Node tests can load it.
 */

/** Limit applied when the first request for a workspace does not supply one. */
export const DEFAULT_QUOTA_LIMIT = 100;
/** Largest amount a single check/increment call may request. */
export const MAX_QUOTA_AMOUNT = 1_000_000;
/** Largest limit a workspace quota may be created with. */
export const MAX_QUOTA_LIMIT = 1_000_000_000;
/** Longest accepted tenant / workspace identifier (Durable Object names are capped at 2048 bytes). */
export const MAX_IDENTIFIER_LENGTH = 128;

export type RequestValidationErrorCode =
  | "invalid_json"
  | "invalid_body"
  | "invalid_tenant"
  | "invalid_workspace_id"
  | "invalid_amount"
  | "invalid_limit"
  | "unknown_action";

/** A request the caller must fix. Always maps to HTTP 400. */
export class RequestValidationError extends Error {
  constructor(
    public readonly code: RequestValidationErrorCode,
    message: string
  ) {
    super(message);
    this.name = "RequestValidationError";
  }

  toResponse(): Response {
    return Response.json({ error: this.code, message: this.message }, { status: 400 });
  }
}

/** Read the request body as a JSON object, or throw RequestValidationError. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new RequestValidationError("invalid_json", "Request body must be valid JSON.");
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new RequestValidationError("invalid_body", "Request body must be a JSON object.");
  }
  return raw as Record<string, unknown>;
}

/**
 * Tenant / workspace identifiers must be real, bounded strings. Without this a
 * missing workspaceId would be stringified into a shared `iai:undefined` bucket.
 */
export function parseQuotaIdentifier(value: unknown, field: "tenant" | "workspaceId"): string {
  const code = field === "tenant" ? "invalid_tenant" : "invalid_workspace_id";
  if (typeof value !== "string" || value.trim() === "") {
    throw new RequestValidationError(code, `${field} must be a non-empty string.`);
  }
  if (value.length > MAX_IDENTIFIER_LENGTH) {
    throw new RequestValidationError(
      code,
      `${field} must be at most ${MAX_IDENTIFIER_LENGTH} characters.`
    );
  }
  return value;
}

function isBoundedPositiveInteger(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= max;
}

/**
 * Amount to check/increment. Absent means 1. Anything else must be a positive
 * safe integer <= MAX_QUOTA_AMOUNT: negatives would grant quota, strings and
 * NaN/Infinity would corrupt `used` and permanently disable enforcement.
 */
export function parseQuotaAmount(value: unknown): number {
  if (value === undefined) return 1;
  if (!isBoundedPositiveInteger(value, MAX_QUOTA_AMOUNT)) {
    throw new RequestValidationError(
      "invalid_amount",
      `amount must be a positive integer no greater than ${MAX_QUOTA_AMOUNT}.`
    );
  }
  return value;
}

/** Optional limit for a new quota. Absent stays undefined (the DO applies its default). */
export function parseQuotaLimit(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (!isBoundedPositiveInteger(value, MAX_QUOTA_LIMIT)) {
    throw new RequestValidationError(
      "invalid_limit",
      `limit must be a positive integer no greater than ${MAX_QUOTA_LIMIT}.`
    );
  }
  return value;
}
