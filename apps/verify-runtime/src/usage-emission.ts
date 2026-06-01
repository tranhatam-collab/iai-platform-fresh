/**
 * Usage Emission Contract
 *
 * Shape khóa theo BILLING_AND_USAGE_SYSTEM_SPEC.md Section 6.2.
 *
 * Mỗi usage event phải có tối thiểu:
 *   event_id, workspace_id, subject_id, domain_surface,
 *   usage_unit, usage_amount, source_object_id, occurred_at, environment
 *
 * Hard rule: không tính billing trực tiếp từ dashboard query.
 * Billing phải đi từ usage ledger / aggregate table / billing events.
 */

export type Environment = "development" | "staging" | "production" | "sandbox";

export interface UsageEvent {
  event_id: string;
  /** Tenant that owns this event */
  tenant: string;
  workspace_id: string;
  /** subject_id hoặc "system" nếu là system actor */
  subject_id: string | "system";
  domain_surface: string;
  /** Event type e.g. "chat_run", "api_call", "agent_run" */
  event_type: string;
  usage_unit: string;
  usage_amount: number;
  source_object_id: string;
  occurred_at: string; // ISO 8601
  environment: Environment;
}

export class UsageEventValidationError extends Error {
  constructor(message: string) {
    super(`UsageEvent validation failed: ${message}`);
    this.name = "UsageEventValidationError";
  }
}

/**
 * Validate that an unknown value conforms to UsageEvent.
 */
export function validateUsageEvent(event: unknown): asserts event is UsageEvent {
  if (typeof event !== "object" || event === null) {
    throw new UsageEventValidationError("must be an object");
  }

  const e = event as Record<string, unknown>;

  const requiredStringFields: (keyof UsageEvent)[] = [
    "event_id",
    "tenant",
    "workspace_id",
    "domain_surface",
    "event_type",
    "usage_unit",
    "source_object_id",
    "occurred_at",
    "environment",
  ];

  for (const key of requiredStringFields) {
    if (typeof e[key] !== "string" || e[key] === "") {
      throw new UsageEventValidationError(`missing or invalid string field: ${key}`);
    }
  }

  // subject_id: string (including "system")
  if (typeof e.subject_id !== "string" || e.subject_id === "") {
    throw new UsageEventValidationError("missing or invalid field: subject_id");
  }

  // usage_amount: non-negative number
  if (typeof e.usage_amount !== "number" || Number.isNaN(e.usage_amount) || e.usage_amount < 0) {
    throw new UsageEventValidationError("usage_amount must be a non-negative number");
  }

  // environment: known value
  const env = e.environment as string;
  const validEnvs: Environment[] = ["development", "staging", "production", "sandbox"];
  if (!validEnvs.includes(env as Environment)) {
    throw new UsageEventValidationError(`invalid environment: ${env}`);
  }
}

/**
 * Emit a usage event.
 *
 * Phase 1: validate and return (no network emission).
 * Phase 2: wire to queue, D1, or external API.
 */
export function emitUsageEvent(event: UsageEvent): UsageEvent {
  validateUsageEvent(event);
  return event;
}

/**
 * Insert a validated usage event directly into D1.
 * Used when USAGE_LEDGER_DB binding is available.
 */
export async function emitUsageEventToD1(
  event: UsageEvent,
  db: D1Database
): Promise<void> {
  validateUsageEvent(event);
  await db
    .prepare(
      `INSERT INTO usage_events
       (id, tenant, workspace_id, actor_id, domain_surface, event_type,
        usage_amount, usage_unit, source_object_id, metadata, environment,
        occurred_at, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      event.event_id,
      event.tenant,
      event.workspace_id,
      event.subject_id,
      event.domain_surface,
      event.event_type,
      event.usage_amount,
      event.usage_unit,
      event.source_object_id,
      "{}", // metadata JSON
      event.environment,
      event.occurred_at,
      Date.now()
    )
    .run();
}

/**
 * Send a validated usage event to a Queue for async processing.
 * Used when USAGE_EVENTS_QUEUE binding is available.
 */
export async function emitUsageEventToQueue(
  event: UsageEvent,
  queue: Queue
): Promise<void> {
  validateUsageEvent(event);
  await queue.send(event);
}
