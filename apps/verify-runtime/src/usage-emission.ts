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

import { isKnownTenant } from "./tenant-resolver.js";

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

const ISO_TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](\d{2}):(\d{2}))$/;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Strict ISO 8601 date-time with an explicit timezone (`Z` or `+hh:mm`).
 *
 * Date.parse alone is not enough: V8 accepts "1" and rolls "2026-02-31"
 * over to March, so the calendar fields are checked explicitly.
 */
export function isIsoTimestamp(value: string): boolean {
  const m = ISO_TIMESTAMP.exec(value);
  if (!m) return false;

  const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number) as [
    number, number, number, number, number, number
  ];
  const leapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = month === 2 && leapYear ? 29 : (DAYS_IN_MONTH[month - 1] ?? 0);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;
  if (m[7] !== undefined && (Number(m[7]) > 23 || Number(m[8]) > 59)) return false;

  return Number.isFinite(Date.parse(value));
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

  // tenant: must be one of the locked tenants (never echo the caller's value).
  if (!isKnownTenant(e.tenant as string)) {
    throw new UsageEventValidationError("unknown tenant");
  }

  // usage_amount: finite, non-negative number (JSON `1e999` parses to Infinity).
  if (typeof e.usage_amount !== "number" || !Number.isFinite(e.usage_amount) || e.usage_amount < 0) {
    throw new UsageEventValidationError("usage_amount must be a finite non-negative number");
  }

  // occurred_at: real ISO 8601 timestamp, not just a non-empty string.
  if (!isIsoTimestamp(e.occurred_at as string)) {
    throw new UsageEventValidationError(
      "occurred_at must be an ISO 8601 timestamp with timezone (e.g. 2026-01-31T09:30:00Z)"
    );
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
 * Ledger row id for an event. Producer-assigned event ids are only unique per
 * tenant, so the tenant is part of the id: two tenants reusing an event_id
 * never collide or suppress each other's rows.
 */
export function usageEventRowId(event: Pick<UsageEvent, "tenant" | "event_id">): string {
  return `${event.tenant}:${event.event_id}`;
}

/**
 * Insert a validated usage event directly into D1.
 * Used when USAGE_LEDGER_DB binding is available.
 *
 * Idempotent: the row `id` is the tenant-scoped `event_id`, so a queue
 * redelivery or client retry of the same event hits the primary key and is
 * ignored instead of throwing (which would retry the whole queue batch).
 * Only the `id` conflict is swallowed; other constraint failures still throw.
 * Idempotency therefore relies on producers reusing `event_id` when they
 * resend an event.
 *
 * Resolves to true when a row was inserted, false when it was a duplicate.
 */
export async function emitUsageEventToD1(
  event: UsageEvent,
  db: D1Database
): Promise<boolean> {
  validateUsageEvent(event);
  const result = await db
    .prepare(
      `INSERT INTO usage_events
       (id, tenant, workspace_id, actor_id, domain_surface, event_type,
        usage_amount, usage_unit, source_object_id, metadata, environment,
        occurred_at, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`
    )
    .bind(
      usageEventRowId(event),
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
  const changes = result?.meta?.changes;
  return changes === undefined ? true : changes > 0;
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
