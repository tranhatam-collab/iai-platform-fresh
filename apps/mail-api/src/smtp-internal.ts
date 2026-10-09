import { Buffer } from "node:buffer";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { type IncomingMessage, type ServerResponse } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { URL } from "node:url";

import {
  buildMailMessageDetail,
  buildMailMessageListItem,
  isSuppressionActive,
  matchesMessageListFilter,
  type MailDeliveryAttemptRecord,
  type MailMessageDetail,
  type MailMessageEventRecord,
  type MailMessageListFilter,
  type MailMessageProjection,
  type MailMessageReadSource,
  type MailMessageSourceSnapshot,
  type MailQueueSubmitPayload,
  type MailSuppressionFilter,
  type MailSuppressionReadSource,
  type MailSuppressionReason,
  type MailSuppressionRecord,
  type MailSuppressionSourceSnapshot
} from "@iai/mail-core";
import { applyMigrations } from "./migrations.js";

const SUPPORTED_STREAMS = new Set(["transactional", "system", "marketing", "alerts"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
// RFC 5321 caps a forward-path at 254 characters. EMAIL_PATTERN backtracks
// quadratically on long dotted input (~4 s for an 80 KB value), so the length
// is checked before the regex ever runs.
const MAX_EMAIL_LENGTH = 254;

/**
 * Default request-body cap for /v1/send and /v1/internal/smtp/*: 64 MiB.
 *
 * Sized for base64 payloads: the SMTP gateway accepts up to 20 MiB of raw MIME
 * by default (MAIL_SMTP_MAX_MESSAGE_SIZE_BYTES), which is ~26.7 MiB as base64,
 * and the queue call can additionally carry the decoded html/text parts.
 * Override with MAIL_API_MAX_BODY_BYTES (or the `maxBodyBytes` option) when
 * the gateway limit is raised.
 */
export const DEFAULT_SMTP_INTERNAL_MAX_BODY_BYTES = 64 * 1024 * 1024;

const ALLOW_UNAUTHENTICATED_INTERNAL_ENV = "MAIL_SMTP_ALLOW_UNAUTHENTICATED_INTERNAL";

// Well-known dev credential. Seeded only outside production (or by an
// explicit seed); never a production default.
const DEFAULT_DEV_USERNAME = "smtp-dev";
const DEFAULT_DEV_PASSWORD = "dev-secret";

type SmtpOperation = "auth" | "mail-from" | "recipient" | "normalize" | "queue" | "audit";
type QueueJobStatus = "queued" | "processing" | "completed" | "failed";
type DeliveryOutcome = "provider_accepted" | "deferred" | "failed";

interface SmtpAuthResult {
  allowedStreams: string[];
  credentialId: string;
  defaultStream: string;
  principal: string;
  senderIdentityId?: string;
  workspaceId: string;
}

interface SmtpAuthRequest {
  password?: string;
  username?: string;
}

interface SmtpMailFromRequest {
  address?: string;
  auth?: SmtpAuthResult;
}

interface SmtpRecipientRequest {
  auth?: SmtpAuthResult;
  recipient?: string;
  stream?: string;
}

interface SmtpNormalizeRequest {
  auth?: SmtpAuthResult;
  envelopeFrom?: string;
  rawMimeBase64?: string;
  recipients?: string[];
  smtpSessionId?: string;
  stream?: string;
  submittedAt?: string;
  traceId?: string;
}

interface SmtpQueueRequest extends MailQueueSubmitPayload {
  rawMimeBase64?: string;
}

interface SmtpAuditRequest {
  action?: string;
  actorIdentifier?: string;
  actorType?: string;
  metadata?: Record<string, unknown>;
  targetId?: string;
  targetType?: string;
  workspaceId?: string;
}

interface MailApiSendAddress {
  email?: string;
  name?: string;
}

interface MailApiSendAttachment {
  content_base64?: string;
  content_disposition?: string;
  content_id?: string;
  content_transfer_encoding?: string;
  content_type?: string;
  filename?: string;
  inline?: boolean;
  part_id?: string;
  size_bytes?: number;
}

interface MailApiSendRequest {
  attachments?: MailApiSendAttachment[];
  bcc?: MailApiSendAddress[];
  cc?: MailApiSendAddress[];
  from?: MailApiSendAddress;
  headers?: Record<string, unknown>;
  html?: string;
  message_idempotency_key?: string;
  metadata?: Record<string, unknown>;
  reply_to?: MailApiSendAddress;
  stream?: string;
  subject?: string;
  tags?: string[];
  text?: string;
  to?: MailApiSendAddress[];
}

interface MessageDeliveryState {
  deliveryStatus: DeliveryOutcome | "queued";
  failureCode?: string;
  messageId: string;
  providerRouteId?: string;
}

interface ProviderRouteSelection {
  providerType: string;
  routeId: string;
}

interface SenderIdentityRecord {
  id: string;
  workspaceId: string;
}

interface QueueJobRecord {
  /** Number of times the job has been claimed, this claim included. */
  attempts: number;
  id: string;
  /** Attempts the job may use in all (stored on the job when it was queued). */
  maxAttempts: number;
  payloadJson: string;
}

export interface QueueSettingsInput {
  /** How many times a job may be claimed before it is failed (1..10; default MAIL_QUEUE_MAX_ATTEMPTS, then 5). */
  maxAttempts?: number;
  /** Seconds after which a claimed job that was never finished returns to the queue (10..3600; default MAIL_QUEUE_LEASE_SECONDS, then 300). */
  leaseSeconds?: number;
  /** Seconds before the first retry (1..3600, clamped; default MAIL_QUEUE_BACKOFF_BASE_SECONDS, then 30). */
  backoffBaseSeconds?: number;
  /** Longest wait between attempts before jitter (10..86400, clamped; default MAIL_QUEUE_BACKOFF_CAP_SECONDS, then 3600). */
  backoffCapSeconds?: number;
  /** Produces the result of one delivery attempt. Overrides `providerAdapter` when given (tests). */
  deliver?: QueueDeliveryHook;
  /**
   * Which delivery stands behind the queue (default MAIL_PROVIDER_ADAPTER, then `none`). `none` has no
   * provider: a delivery is deferred and finally failed with `no_provider_configured`, and the
   * queue never reports `provider_accepted`. `fake` accepts every routed message without sending
   * anything; it is for local runs and tests and is refused when NODE_ENV is production.
   */
  providerAdapter?: QueueProviderAdapterName;
  /** Clock used for claims and leases (tests). */
  now?: () => Date;
  /**
   * Whether the send path delivers a job itself right after queueing it (default MAIL_QUEUE_INLINE, then
   * true). With false a separate worker process takes the jobs and a send answers `queued`.
   */
  inline?: boolean;
  /** Source of the retry jitter, a number in [0, 1) (tests pass a fixed one). */
  random?: () => number;
}

export type QueueProviderAdapterName = "fake" | "none";

interface QueueSettings {
  backoffBaseSeconds: number;
  backoffCapSeconds: number;
  deliver: QueueDeliveryHook;
  inline: boolean;
  leaseSeconds: number;
  maxAttempts: number;
  now: () => Date;
  random: () => number;
}

export const DEFAULT_QUEUE_BACKOFF_BASE_SECONDS = 30;
export const DEFAULT_QUEUE_BACKOFF_CAP_SECONDS = 3600;
/** Share of the wait that may be added as jitter. */
export const QUEUE_BACKOFF_JITTER_RATIO = 0.2;

/**
 * Milliseconds to wait after the given (1-based) attempt failed retryably:
 * min(base * 2^(attempt - 1), cap), plus up to 20 percent jitter drawn from `random()` in [0, 1).
 */
export function computeBackoffDelayMs(
  attempt: number,
  baseSeconds: number,
  capSeconds: number,
  random: () => number
): number {
  const exponent = Math.min(Math.max(attempt - 1, 0), 30);
  const seconds = Math.min(baseSeconds * 2 ** exponent, capSeconds);
  const jitter = Math.min(Math.max(random(), 0), 0.999999999);
  return Math.round(seconds * 1000 * (1 + QUEUE_BACKOFF_JITTER_RATIO * jitter));
}

/** What one delivery attempt needs to know about the job. */
export interface QueueDeliveryInput {
  /** 1-based number of this attempt. */
  attempt: number;
  messageId: string;
  routeMatched: boolean;
  stream: string;
  workspaceId: string;
}

/**
 * Outcome of one delivery attempt. `deferred` is a retryable failure (the job is tried again later,
 * until it runs out of attempts); `failed` is final. `errorClass` is a short class for either.
 */
export interface QueueDeliveryResult {
  errorClass?: string;
  eventType: "provider_accepted" | "deferred" | "failed";
  providerMessageId?: string;
  providerResponseCode: string;
  providerResponseMessage: string;
}

export type QueueDeliveryHook = (input: QueueDeliveryInput) => QueueDeliveryResult | Promise<QueueDeliveryResult>;

export const DEFAULT_QUEUE_MAX_ATTEMPTS = 5;
export const DEFAULT_QUEUE_LEASE_SECONDS = 300;

/** A claim on a queued job, as handed to whoever processes it. */
export interface ClaimedQueueJob {
  attempts: number;
  id: string;
}

interface QueueProcessingResult extends QueueDeliveryResult {
  /** The job ran out of attempts while the result was still retryable. */
  maxAttemptsExceeded?: boolean;
  /** When a deferred delivery may be tried again (recorded on the attempt). */
  nextRetryAt?: string;
}

interface ResolvedSeedConfig {
  allowedStreams: string[];
  blockedRecipient: string;
  credentialId: string;
  defaultSender: string;
  defaultStream: string;
  password: string;
  primaryDomain: string;
  providerRouteId: string;
  seededSenderIdentityId: string;
  username: string;
  workspaceId: string;
}

interface AuditLogInput {
  action: string;
  actorIdentifier?: string;
  actorType: string;
  metadata?: Record<string, unknown>;
  targetId?: string;
  targetType?: string;
  workspaceId: string;
}

export interface SmtpInternalBackendOptions {
  /**
   * Explicit dev/test opt-in: serve /v1/internal/smtp/* without a service
   * token when none is configured. Off by default (the routes then answer 503).
   * The same opt-in is available as MAIL_SMTP_ALLOW_UNAUTHENTICATED_INTERNAL=1,
   * but that env flag is ignored when NODE_ENV=production.
   */
  allowUnauthenticatedInternal?: boolean;
  apiKey?: string;
  databaseUrl?: string;
  /** Request-body cap in bytes (default: MAIL_API_MAX_BODY_BYTES, then 64 MiB). */
  maxBodyBytes?: number;
  /** Queue retry limits and clock (see QueueSettingsInput). */
  queue?: QueueSettingsInput;
  remoteToken?: string;
  /**
   * Provisions the first workspace/credential. Outside production a missing
   * seed falls back to the dev defaults (ws_dev / smtp-dev); in production
   * nothing is seeded unless this is passed, and it must carry
   * username and password.
   */
  seed?: {
    allowedStreams?: string[];
    blockedRecipient?: string;
    credentialId?: string;
    defaultSender?: string;
    defaultStream?: string;
    password?: string;
    primaryDomain?: string;
    providerRouteId?: string;
    username?: string;
    workspaceId?: string;
  };
}

/** Why a read of persisted data was refused (maps to an error envelope). */
export interface PersistedReadRefusal {
  errorCode: string;
  message: string;
  statusCode: number;
}

export interface SmtpInternalBackend {
  close(): void;
  /**
   * The delivery queue behind /v1/internal/smtp/queue. `claimNextJob` takes the oldest job that is
   * due (queued and past any next_attempt_at); the claim is atomic, so when several callers race for
   * one job exactly one gets it. A job that stays claimed past the lease returns to the queue first.
   */
  queue?: {
    claimNextJob(): ClaimedQueueJob | undefined;
    processNext(): void;
    /** Like processNext, but the delivery may be asynchronous. Resolves to whether a job was claimed. */
    processNextAsync(): Promise<boolean>;
  };
  /**
   * Read-only views over the SQLite data that /v1/send writes and that send-time
   * suppression checks read. Callers must check `checkPersistedReadAuthorization`
   * first: the workspace comes from the client, so these reads need the same API
   * key as POST /v1/send.
   */
  persistedSources?: {
    messages: MailMessageReadSource;
    suppressions: MailSuppressionReadSource;
  };
  checkPersistedReadAuthorization?(request: IncomingMessage): PersistedReadRefusal | undefined;
  handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
    requestId: string,
    url: URL,
    method: string
  ): Promise<boolean>;
}

/** Largest page the persisted message list serves (callers asking for more are refused earlier). */
export const MAX_PERSISTED_PAGE_SIZE = 100;
/** Most candidate rows a detail-derived filter may scan before the request is refused. */
export const MAX_PERSISTED_SCAN_ROWS = 1000;

/** A list filter that needs stored payloads would have to scan more rows than the ceiling allows. */
export class PersistedListScanLimitError extends Error {
  constructor(public readonly limit: number) {
    super(`The filter would scan more than ${limit} messages.`);
    this.name = "PersistedListScanLimitError";
  }
}

class SmtpBackendError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly smtpCode?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "SmtpBackendError";
  }
}

class MailPersistenceStore {
  private readonly db: DatabaseSync;

  constructor(
    databaseUrl: string,
    seed: ResolvedSeedConfig | undefined,
    private readonly queueSettings: QueueSettings = resolveQueueSettings()
  ) {
    this.db = new DatabaseSync(resolveSqliteDatabasePath(databaseUrl));
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA busy_timeout = 2000;");
    applyMigrations(this.db);
    if (seed) {
      this.ensureSeed(seed);
    }
  }

  close() {
    this.db.close();
  }

  /** True when the well-known dev credential (smtp-dev / dev-secret) is stored and active. */
  hasDefaultDevCredential() {
    const row = this.db
      .prepare(
        `
          SELECT credential_id AS credentialId
          FROM smtp_credentials
          WHERE username = ?
            AND password = ?
            AND status = 'active'
          LIMIT 1;
        `
      )
      .get(DEFAULT_DEV_USERNAME, DEFAULT_DEV_PASSWORD) as { credentialId?: string } | undefined;

    return Boolean(row?.credentialId);
  }

  checkConnectivity() {
    const row = this.db.prepare("SELECT 1 AS ok;").get() as { ok?: number } | undefined;
    return row?.ok === 1;
  }

  countQueuedJobs() {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM smtp_queue_jobs WHERE status = 'queued';")
      .get() as { count?: number } | undefined;
    return Number(row?.count ?? 0);
  }

  hasPersistedMessage(messageId: string, workspaceId?: string) {
    const row = workspaceId
      ? (this.db
          .prepare(
            `
              SELECT id
              FROM messages
              WHERE id = ?
                AND workspace_id = ?
              LIMIT 1;
            `
          )
          .get(messageId, workspaceId) as { id?: string } | undefined)
      : (this.db
          .prepare(
            `
              SELECT id
              FROM messages
              WHERE id = ?
              LIMIT 1;
            `
          )
          .get(messageId) as { id?: string } | undefined);

    return Boolean(row?.id);
  }

  getPersistedMessageDetail(messageId: string, workspaceId?: string): MailMessageDetail | undefined {
    const projection = this.getPersistedMessageProjection(messageId, workspaceId);
    if (!projection) {
      return undefined;
    }

    return buildMailMessageDetail(
      projection,
      this.listPersistedMessageEvents(messageId, workspaceId),
      this.listPersistedDeliveryAttempts(messageId, workspaceId)
    );
  }

  listPersistedMessageEvents(messageId: string, workspaceId?: string): MailMessageEventRecord[] {
    const rows = (workspaceId
      ? this.db
          .prepare(
            `
              SELECT
                id AS eventId,
                event_type AS eventType,
                message_id AS messageId,
                occurred_at AS occurredAt,
                payload_json AS payloadJson,
                provider_message_id AS providerMessageId,
                provider_type AS providerType,
                source,
                trace_id AS traceId,
                workspace_id AS workspaceId
              FROM message_events
              WHERE message_id = ?
                AND workspace_id = ?
              ORDER BY occurred_at ASC, created_at ASC;
            `
          )
          .all(messageId, workspaceId)
      : this.db
          .prepare(
            `
              SELECT
                id AS eventId,
                event_type AS eventType,
                message_id AS messageId,
                occurred_at AS occurredAt,
                payload_json AS payloadJson,
                provider_message_id AS providerMessageId,
                provider_type AS providerType,
                source,
                trace_id AS traceId,
                workspace_id AS workspaceId
              FROM message_events
              WHERE message_id = ?
              ORDER BY occurred_at ASC, created_at ASC;
            `
          )
          .all(messageId)) as Array<{
      eventId?: string;
      eventType?: string;
      messageId?: string;
      occurredAt?: string;
      payloadJson?: string;
      providerMessageId?: string | null;
      providerType?: string | null;
      source?: string;
      traceId?: string;
      workspaceId?: string;
    }>;

    return rows
      .filter(
        (row): row is Required<Pick<typeof row, "eventId" | "eventType" | "messageId" | "occurredAt" | "source" | "traceId" | "workspaceId">> &
          typeof row =>
          Boolean(
            row.eventId &&
              row.eventType &&
              row.messageId &&
              row.occurredAt &&
              row.source &&
              row.traceId &&
              row.workspaceId
          )
      )
      .map((row) => ({
        eventId: row.eventId,
        eventType: row.eventType as MailMessageEventRecord["eventType"],
        messageId: row.messageId,
        occurredAt: row.occurredAt,
        payload: parseJsonRecord(row.payloadJson) ?? {},
        providerMessageId: row.providerMessageId ?? undefined,
        providerType: (row.providerType ?? undefined) as MailMessageEventRecord["providerType"],
        source: row.source as MailMessageEventRecord["source"],
        traceId: row.traceId,
        workspaceId: row.workspaceId
      }));
  }

  private listPersistedDeliveryAttempts(
    messageId: string,
    workspaceId?: string
  ): MailDeliveryAttemptRecord[] {
    const rows = (workspaceId
      ? this.db
          .prepare(
            `
              SELECT
                id AS attemptId,
                attempt_number AS attemptNumber,
                status,
                provider_route_id AS providerRouteId,
                provider_type AS providerType,
                provider_message_id AS providerMessageId,
                provider_response_code AS providerResponseCode,
                provider_response_message AS providerResponseMessage,
                error_class AS errorClass,
                raw_response_json AS rawResponseJson,
                started_at AS startedAt,
                finished_at AS finishedAt,
                next_retry_at AS nextRetryAt,
                trace_id AS traceId,
                workspace_id AS workspaceId
              FROM delivery_attempts
              WHERE message_id = ?
                AND workspace_id = ?
              ORDER BY started_at ASC, created_at ASC;
            `
          )
          .all(messageId, workspaceId)
      : this.db
          .prepare(
            `
              SELECT
                id AS attemptId,
                attempt_number AS attemptNumber,
                status,
                provider_route_id AS providerRouteId,
                provider_type AS providerType,
                provider_message_id AS providerMessageId,
                provider_response_code AS providerResponseCode,
                provider_response_message AS providerResponseMessage,
                error_class AS errorClass,
                raw_response_json AS rawResponseJson,
                started_at AS startedAt,
                finished_at AS finishedAt,
                next_retry_at AS nextRetryAt,
                trace_id AS traceId,
                workspace_id AS workspaceId
              FROM delivery_attempts
              WHERE message_id = ?
              ORDER BY started_at ASC, created_at ASC;
            `
          )
          .all(messageId)) as Array<{
      attemptId?: string;
      attemptNumber?: number;
      status?: string;
      providerRouteId?: string;
      providerType?: string;
      providerMessageId?: string | null;
      providerResponseCode?: string | null;
      providerResponseMessage?: string | null;
      errorClass?: string | null;
      rawResponseJson?: string | null;
      startedAt?: string;
      finishedAt?: string;
      nextRetryAt?: string | null;
      traceId?: string;
      workspaceId?: string;
    }>;

    return rows
      .filter(
        (row): row is Required<
          Pick<
            typeof row,
            "attemptId" | "attemptNumber" | "status" | "providerRouteId" | "providerType" | "startedAt" | "finishedAt" | "traceId" | "workspaceId"
          >
        > &
          typeof row =>
          Boolean(
            row.attemptId &&
              typeof row.attemptNumber === "number" &&
              row.status &&
              row.providerRouteId &&
              row.providerType &&
              row.startedAt &&
              row.finishedAt &&
              row.traceId &&
              row.workspaceId
          )
      )
      .map((row) => ({
        attemptId: row.attemptId,
        attemptNumber: row.attemptNumber,
        errorClass: row.errorClass ?? undefined,
        finishedAt: row.finishedAt,
        messageId,
        nextRetryAt: row.nextRetryAt ?? undefined,
        providerMessageId: row.providerMessageId ?? undefined,
        providerResponseCode: row.providerResponseCode ?? undefined,
        providerResponseMessage: row.providerResponseMessage ?? undefined,
        providerRouteId: row.providerRouteId,
        providerType: row.providerType as MailDeliveryAttemptRecord["providerType"],
        rawResponseJson: parseJsonRecord(row.rawResponseJson),
        startedAt: row.startedAt,
        status: row.status as MailDeliveryAttemptRecord["status"],
        traceId: row.traceId,
        workspaceId: row.workspaceId
      }));
  }

  /**
   * Messages of a workspace as list/detail read models, newest first, with the
   * same filter semantics as the in-memory source.
   *
   * Without a detail-derived filter (`status`, `to`, `from`, created window), the
   * total is a SQL COUNT, the page is a SQL LIMIT/OFFSET ordered by creation time,
   * and detail is loaded only for the ids on the page. Those filters depend on the
   * stored payload and events, so they are applied by the shared filter over the
   * candidates of the workspace/stream; that scan is capped at
   * MAX_PERSISTED_SCAN_ROWS and a larger candidate set is refused with
   * PersistedListScanLimitError instead of being loaded.
   */
  listPersistedMessages(filter: MailMessageListFilter = {}) {
    const page = positiveInteger(filter.page, 1);
    const pageSize = Math.min(positiveInteger(filter.pageSize, 20), MAX_PERSISTED_PAGE_SIZE);
    const offset = (page - 1) * pageSize;
    const candidates = this.countPersistedMessages(filter.workspaceId, filter.stream);

    const needsDetailFilter = Boolean(
      (filter.statuses && filter.statuses.length > 0) ||
        filter.to ||
        filter.from ||
        filter.createdFrom ||
        filter.createdTo
    );

    if (!needsDetailFilter) {
      if (!Number.isSafeInteger(offset) || offset >= candidates) {
        return { items: [], page, pageSize, total: candidates };
      }

      const items = this.listPersistedMessageIds(filter.workspaceId, filter.stream, { limit: pageSize, offset })
        .map((id) => this.getPersistedMessageDetail(id, filter.workspaceId))
        .filter((detail): detail is MailMessageDetail => Boolean(detail))
        .sort((left, right) => Date.parse(right.message.submittedAt) - Date.parse(left.message.submittedAt))
        .map((detail) => buildMailMessageListItem(detail));

      return { items, page, pageSize, total: candidates };
    }

    if (candidates > MAX_PERSISTED_SCAN_ROWS) {
      throw new PersistedListScanLimitError(MAX_PERSISTED_SCAN_ROWS);
    }

    const matching = this.listPersistedMessageIds(filter.workspaceId, filter.stream)
      .map((id) => this.getPersistedMessageDetail(id, filter.workspaceId))
      .filter((detail): detail is MailMessageDetail => Boolean(detail))
      .filter((detail) => matchesMessageListFilter(detail, filter))
      .sort((left, right) => Date.parse(right.message.submittedAt) - Date.parse(left.message.submittedAt))
      .map((detail) => buildMailMessageListItem(detail));

    return {
      items: Number.isSafeInteger(offset) ? matching.slice(offset, offset + pageSize) : [],
      page,
      pageSize,
      total: matching.length
    };
  }

  snapshotPersistedMessages(workspaceId?: string): MailMessageSourceSnapshot {
    const projections: MailMessageProjection[] = [];
    const events: MailMessageEventRecord[] = [];
    const deliveryAttempts: MailDeliveryAttemptRecord[] = [];

    for (const id of this.listPersistedMessageIds(workspaceId)) {
      const projection = this.getPersistedMessageProjection(id, workspaceId);
      if (!projection) {
        continue;
      }
      projections.push(projection);
      events.push(...this.listPersistedMessageEvents(id, workspaceId));
      deliveryAttempts.push(...this.listPersistedDeliveryAttempts(id, workspaceId));
    }

    return {
      deliveryAttempts,
      events,
      generatedAt: new Date().toISOString(),
      projections,
      version: "mail_message_sot_v1"
    };
  }

  /** WHERE clause shared by the count and the id queries: only messages whose queue payload exists can be projected. */
  private persistedMessageWhere(workspaceId?: string, stream?: string) {
    const clauses = ["EXISTS (SELECT 1 FROM smtp_queue_jobs j WHERE j.message_id = messages.id)"];
    const params: string[] = [];
    if (workspaceId) {
      clauses.push("workspace_id = ?");
      params.push(workspaceId);
    }
    if (stream) {
      clauses.push("stream = ?");
      params.push(stream);
    }
    return { params, where: `WHERE ${clauses.join(" AND ")}` };
  }

  private countPersistedMessages(workspaceId?: string, stream?: string): number {
    const { params, where } = this.persistedMessageWhere(workspaceId, stream);
    const row = this.db.prepare(`SELECT COUNT(*) AS count FROM messages ${where};`).get(...params) as
      | { count?: number }
      | undefined;
    return Number(row?.count ?? 0);
  }

  private listPersistedMessageIds(
    workspaceId?: string,
    stream?: string,
    paging?: { limit: number; offset: number }
  ): string[] {
    const { params, where } = this.persistedMessageWhere(workspaceId, stream);
    const sql = `SELECT id FROM messages ${where} ORDER BY created_at DESC, id ASC${paging ? " LIMIT ? OFFSET ?" : ""};`;
    const rows = this.db
      .prepare(sql)
      .all(...params, ...(paging ? [paging.limit, paging.offset] : [])) as Array<{ id?: string }>;

    return rows.map((row) => row.id).filter((id): id is string => Boolean(id));
  }

  /**
   * Suppressions as stored in the table that send-time checks read
   * (isRecipientSuppressed): a row with a stream applies to that stream, a row
   * without one applies to the whole workspace. The table does not record the
   * origin, an expiry or when a row was deactivated, so those are reported as
   * "operator", none, and the creation time respectively.
   */
  listPersistedSuppressions(filter: MailSuppressionFilter = {}): MailSuppressionRecord[] {
    const clauses: string[] = [];
    const params: string[] = [];
    if (filter.workspaceId) {
      clauses.push("workspace_id = ?");
      params.push(filter.workspaceId);
    }
    if (filter.email) {
      clauses.push("lower(email) = ?");
      params.push(filter.email.toLowerCase());
    }
    if (filter.stream) {
      clauses.push("stream = ?");
      params.push(filter.stream);
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.db
      .prepare(
        `
          SELECT
            id AS suppressionId,
            workspace_id AS workspaceId,
            email,
            stream,
            reason,
            active,
            created_at AS createdAt
          FROM suppressions
          ${where}
          ORDER BY created_at DESC, id ASC;
        `
      )
      .all(...params) as Array<{
      active?: number;
      createdAt?: string;
      email?: string;
      reason?: string | null;
      stream?: string | null;
      suppressionId?: string;
      workspaceId?: string;
    }>;

    const now = filter.now ?? new Date().toISOString();

    return rows
      .filter((row) => row.suppressionId && row.workspaceId && row.email && row.createdAt)
      .map((row): MailSuppressionRecord => {
        const active = row.active === 1;
        return {
          createdAt: row.createdAt as string,
          email: row.email as string,
          ...(active ? {} : { notes: "Deactivated; removal time is not recorded.", removedAt: row.createdAt as string }),
          reason: toSuppressionReason(row.reason),
          scope: row.stream ? "stream" : "workspace",
          source: "operator",
          ...(row.stream ? { stream: row.stream } : {}),
          suppressionId: row.suppressionId as string,
          workspaceId: row.workspaceId as string
        };
      })
      .filter((item) => {
        if (filter.reasons && filter.reasons.length > 0 && !filter.reasons.includes(item.reason)) {
          return false;
        }
        if (filter.scopes && filter.scopes.length > 0 && !filter.scopes.includes(item.scope)) {
          return false;
        }
        if (filter.sources && filter.sources.length > 0 && !filter.sources.includes(item.source)) {
          return false;
        }
        if (filter.activeOnly && !isSuppressionActive(item, now)) {
          return false;
        }
        return true;
      });
  }

  findMessageByIdempotencyKey(workspaceId: string, messageIdempotencyKey: string) {
    const row = this.db
      .prepare(
        `
          SELECT
            id AS messageId,
            status AS deliveryStatus,
            provider_route_id AS providerRouteId
          FROM messages
          WHERE workspace_id = ?
            AND message_idempotency_key = ?
          LIMIT 1;
        `
      )
      .get(workspaceId, messageIdempotencyKey) as
      | {
          deliveryStatus?: string;
          messageId?: string;
          providerRouteId?: string | null;
        }
      | undefined;

    return this.buildMessageDeliveryState(row);
  }

  getMessageDeliveryState(messageId: string) {
    const row = this.db
      .prepare(
        `
          SELECT
            id AS messageId,
            status AS deliveryStatus,
            provider_route_id AS providerRouteId
          FROM messages
          WHERE id = ?
          LIMIT 1;
        `
      )
      .get(messageId) as
      | {
          deliveryStatus?: string;
          messageId?: string;
          providerRouteId?: string | null;
        }
      | undefined;

    return this.buildMessageDeliveryState(row);
  }

  authenticate(username: string, password: string): SmtpAuthResult | undefined {
    const row = this.db
      .prepare(
        `
          SELECT
            credential_id AS credentialId,
            workspace_id AS workspaceId,
            principal,
            default_stream AS defaultStream,
            allowed_streams_json AS allowedStreamsJson,
            sender_identity_id AS senderIdentityId
          FROM smtp_credentials
          WHERE status = 'active'
            AND username = ?
            AND password = ?
          LIMIT 1;
        `
      )
      .get(username.trim(), password) as
      | {
          allowedStreamsJson?: string;
          credentialId?: string;
          defaultStream?: string;
          principal?: string;
          senderIdentityId?: string;
          workspaceId?: string;
        }
      | undefined;

    if (!row?.credentialId || !row.workspaceId || !row.principal || !row.defaultStream) {
      return undefined;
    }

    const allowedStreams = parseJsonStringArray(row.allowedStreamsJson, [row.defaultStream]);

    return {
      allowedStreams,
      credentialId: row.credentialId,
      defaultStream: row.defaultStream,
      principal: row.principal,
      senderIdentityId: row.senderIdentityId,
      workspaceId: row.workspaceId
    };
  }

  findSenderIdentity(workspaceId: string, senderEmail: string): SenderIdentityRecord | undefined {
    const normalized = senderEmail.trim().toLowerCase();
    const row = this.db
      .prepare(
        `
          SELECT id, workspace_id AS workspaceId
          FROM sender_identities
          WHERE workspace_id = ?
            AND status = 'active'
            AND lower(email) = ?
          LIMIT 1;
        `
      )
      .get(workspaceId, normalized) as SenderIdentityRecord | undefined;

    if (!row?.id || !row.workspaceId) {
      return undefined;
    }

    return row;
  }

  isDomainVerified(workspaceId: string, senderEmail: string) {
    const domain = senderEmail.split("@")[1]?.toLowerCase();
    if (!domain) {
      return false;
    }

    const row = this.db
      .prepare(
        `
          SELECT verification_status AS verificationStatus
          FROM domains
          WHERE workspace_id = ?
            AND lower(domain) = ?
          LIMIT 1;
        `
      )
      .get(workspaceId, domain) as { verificationStatus?: string } | undefined;

    return row?.verificationStatus === "verified";
  }

  isRecipientSuppressed(workspaceId: string, recipient: string, stream: string) {
    const normalized = recipient.toLowerCase();
    const row = this.db
      .prepare(
        `
          SELECT id
          FROM suppressions
          WHERE workspace_id = ?
            AND active = 1
            AND lower(email) = ?
            AND (stream IS NULL OR stream = ?)
          LIMIT 1;
        `
      )
      .get(workspaceId, normalized, stream) as { id?: string } | undefined;

    return Boolean(row?.id);
  }

  selectProviderRoute(workspaceId: string, stream: string): ProviderRouteSelection | undefined {
    const row = this.db
      .prepare(
        `
          SELECT route_id AS routeId, provider_type AS providerType
          FROM provider_routes
          WHERE active = 1
            AND stream = ?
            AND (workspace_id IS NULL OR workspace_id = ?)
          ORDER BY
            CASE WHEN workspace_id = ? THEN 0 ELSE 1 END,
            priority ASC,
            route_id ASC
          LIMIT 1;
        `
      )
      .get(stream, workspaceId, workspaceId) as ProviderRouteSelection | undefined;

    if (!row?.routeId || !row.providerType) {
      return undefined;
    }

    return row;
  }

  persistQueueSubmission(
    payload: SmtpQueueRequest,
    input: {
      messageEventId: string;
      providerRouteId?: string;
      queuedAt: string;
    }
  ) {
    const now = new Date().toISOString();
    const normalizedFrom = payload.from?.email ?? payload.headerFrom ?? payload.envelopeFrom;
    const normalizedFromName = payload.from?.name;
    const replyToEmail = payload.replyTo?.email;
    const replyToName = payload.replyTo?.name;
    const headersJson = JSON.stringify(payload.headers ?? {});
    const metadataJson = JSON.stringify({
      ...(payload.metadata ?? {}),
      attachmentCount: payload.attachments.length,
      queueSource: payload.source === "api" ? "mail.api.send" : "smtp.remote",
      traceId: payload.traceId
    });
    const tagsJson = JSON.stringify(payload.tags ?? [payload.stream, payload.source]);
    const queueJobId = `job_${randomUUID()}`;
    const queuePayloadJson = JSON.stringify(payload);

    this.db.exec("BEGIN;");

    try {
      this.db
        .prepare(
          `
            INSERT INTO messages (
              id,
              workspace_id,
              message_idempotency_key,
              stream,
              sender_identity_id,
              from_email,
              from_name,
              reply_to_email,
              reply_to_name,
              subject,
              html_body,
              text_body,
              status,
              provider_route_id,
              metadata_json,
              tags_json,
              headers_json,
              queued_at,
              last_event_at,
              created_at,
              updated_at
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            ON CONFLICT(id) DO UPDATE SET
              status = excluded.status,
              provider_route_id = excluded.provider_route_id,
              queued_at = excluded.queued_at,
              last_event_at = excluded.last_event_at,
              updated_at = excluded.updated_at;
          `
        )
        .run(
          payload.messageId,
          payload.workspaceId,
          payload.messageIdempotencyKey,
          payload.stream,
          payload.senderIdentityId ?? null,
          normalizedFrom,
          normalizedFromName ?? null,
          replyToEmail ?? null,
          replyToName ?? null,
          payload.subject ?? null,
          payload.html ?? null,
          payload.text ?? null,
          "queued",
          input.providerRouteId ?? null,
          metadataJson,
          tagsJson,
          headersJson,
          input.queuedAt,
          input.queuedAt,
          now,
          now
        );

      this.db
        .prepare(
          `
            INSERT INTO message_events (
              id,
              message_id,
              workspace_id,
              event_type,
              occurred_at,
              payload_json,
              provider_message_id,
              provider_type,
              source,
              trace_id,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING;
          `
        )
        .run(
          input.messageEventId,
          payload.messageId,
          payload.workspaceId,
          "queued",
          input.queuedAt,
          JSON.stringify({
            messageIdempotencyKey: payload.messageIdempotencyKey,
            providerRoute: input.providerRouteId,
            recipientCount: payload.recipients.length,
            smtpSessionId: payload.smtpSessionId,
            submittedAt: payload.submittedAt
          }),
          null,
          null,
          payload.source,
          payload.traceId,
          now
        );

      this.db
        .prepare(
          `
            INSERT INTO smtp_queue_jobs (
              id,
              message_id,
              workspace_id,
              payload_json,
              status,
              attempts,
              max_attempts,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, 'queued', 0, ?, ?, ?);
          `
        )
        .run(
          queueJobId,
          payload.messageId,
          payload.workspaceId,
          queuePayloadJson,
          this.queueSettings.maxAttempts,
          now,
          now
        );

      this.db.exec("COMMIT;");
    } catch (error) {
      this.db.exec("ROLLBACK;");
      throw error;
    }
  }

  /** Runs the send path's own delivery when the queue is processed inline (MAIL_QUEUE_INLINE, default on). */
  processInline() {
    if (this.queueSettings.inline) {
      this.processNextQueuedJob();
    }
  }

  /** Claims and delivers one job with a synchronous delivery hook. Returns whether a job was claimed. */
  processNextQueuedJob(): boolean {
    const started = this.beginQueuedJob();
    if (started === undefined) {
      return false;
    }

    if (started === "unreadable") {
      return true;
    }

    let result: QueueDeliveryResult | Promise<QueueDeliveryResult>;
    try {
      result = this.queueSettings.deliver(started.input);
    } catch (error) {
      result = deliveryExceptionResult(error);
    }

    if (result instanceof Promise) {
      // Only reachable with a custom hook; the job stays claimed and returns to the queue when its lease runs out.
      void result.catch(() => undefined);
      throw new Error("processNext needs a synchronous delivery hook; use processNextAsync.");
    }

    this.recordDelivery(started, result);
    return true;
  }

  /** Claims and delivers one job; the delivery may be asynchronous. Returns whether a job was claimed. */
  async processNextQueuedJobAsync(): Promise<boolean> {
    const started = this.beginQueuedJob();
    if (started === undefined) {
      return false;
    }

    if (started === "unreadable") {
      return true;
    }

    let result: QueueDeliveryResult;
    try {
      result = await this.queueSettings.deliver(started.input);
    } catch (error) {
      result = deliveryExceptionResult(error);
    }

    this.recordDelivery(started, result);
    return true;
  }

  /**
   * Claims the next due job and works out what the delivery needs to know about it. Returns undefined when
   * no job was claimed, and "unreadable" when one was claimed but its payload could not be parsed: that job is
   * already failed, and counts as a claim so a worker moves straight on to the next one.
   */
  private beginQueuedJob() {
    const claimedJob = this.claimNextJob();
    if (!claimedJob) {
      return undefined;
    }

    let payload: SmtpQueueRequest;
    try {
      payload = JSON.parse(claimedJob.payloadJson) as SmtpQueueRequest;
    } catch (error) {
      this.markJobFailed(claimedJob.id, `Unable to parse queued payload: ${String(error)}`);
      return "unreadable" as const;
    }

    const route = this.selectProviderRoute(payload.workspaceId, payload.stream);
    const startedAt = this.queueSettings.now().toISOString();
    const input: QueueDeliveryInput = {
      attempt: claimedJob.attempts,
      messageId: payload.messageId,
      routeMatched: Boolean(route),
      stream: payload.stream,
      workspaceId: payload.workspaceId
    };
    return { claimedJob, input, payload, route, startedAt };
  }

  /** Writes the attempt, event, message and job rows for one finished delivery (all or nothing). */
  private recordDelivery(
    started: Exclude<ReturnType<MailPersistenceStore["beginQueuedJob"]>, "unreadable" | undefined>,
    result: QueueDeliveryResult
  ) {
    const { claimedJob, payload, route, startedAt } = started;
    const attemptId = `att_${randomUUID()}`;
    const outcome = this.finalizeOutcome(result, claimedJob.attempts, claimedJob.maxAttempts);
    const finishedAt = this.queueSettings.now().toISOString();
    const providerRouteId = route?.routeId ?? "unrouted";
    const providerType = route?.providerType ?? "selfhosted";

    this.db.exec("BEGIN;");

    try {
      this.db
        .prepare(
          `
            INSERT INTO delivery_attempts (
              id,
              message_id,
              attempt_number,
              status,
              provider_route_id,
              provider_type,
              provider_message_id,
              provider_response_code,
              provider_response_message,
              error_class,
              raw_response_json,
              started_at,
              finished_at,
              next_retry_at,
              trace_id,
              workspace_id,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING;
          `
        )
        .run(
          attemptId,
          payload.messageId,
          claimedJob.attempts,
          outcome.eventType === "provider_accepted" ? "accepted" : outcome.eventType,
          providerRouteId,
          providerType,
          outcome.providerMessageId ?? null,
          outcome.providerResponseCode,
          outcome.providerResponseMessage,
          outcome.eventType === "provider_accepted" ? null : outcome.errorClass ?? "delivery_failed",
          JSON.stringify({
            routeMatched: Boolean(route)
          }),
          startedAt,
          finishedAt,
          outcome.nextRetryAt ?? null,
          payload.traceId,
          payload.workspaceId,
          finishedAt
        );

      const providerEventId = `evt_${payload.messageId}_${outcome.eventType}_${attemptId}`;
      this.db
        .prepare(
          `
            INSERT INTO message_events (
              id,
              message_id,
              workspace_id,
              event_type,
              occurred_at,
              payload_json,
              provider_message_id,
              provider_type,
              source,
              trace_id,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING;
          `
        )
        .run(
          providerEventId,
          payload.messageId,
          payload.workspaceId,
          outcome.eventType,
          finishedAt,
          JSON.stringify({
            attemptId,
            providerResponseCode: outcome.providerResponseCode,
            providerResponseMessage: outcome.providerResponseMessage,
            providerRouteId,
            ...(outcome.errorClass ? { errorClass: outcome.errorClass } : {}),
            ...(outcome.maxAttemptsExceeded ? { reason: "max_attempts_exceeded" } : {}),
            ...(outcome.nextRetryAt ? { nextAttemptAt: outcome.nextRetryAt } : {}),
            retryable: outcome.eventType === "deferred"
          }),
          outcome.providerMessageId ?? null,
          providerType,
          payload.source,
          payload.traceId,
          finishedAt
        );

      this.db
        .prepare(
          `
            UPDATE messages
            SET
              status = ?,
              provider_route_id = ?,
              last_event_at = ?,
              sent_at = CASE WHEN ? = 'provider_accepted' THEN ? ELSE sent_at END,
              updated_at = ?
            WHERE id = ?;
          `
        )
        .run(
          outcome.eventType,
          providerRouteId,
          finishedAt,
          outcome.eventType,
          finishedAt,
          finishedAt,
          payload.messageId
        );

      // Every branch is guarded by the job still being claimed (processing): a worker that finishes
      // after its lease expired and the job was claimed again must not overwrite the newer claim.
      let jobUpdate: { changes: number | bigint };
      if (outcome.eventType === "deferred") {
        // Back to the queue, not claimable before the retry time.
        jobUpdate = this.db
          .prepare(
            `
              UPDATE smtp_queue_jobs
              SET
                status = 'queued',
                next_attempt_at = ?,
                last_error = ?,
                last_error_class = ?,
                updated_at = ?
              WHERE id = ?
                AND status = 'processing'
                AND attempts = ?;
            `
          )
          .run(
            outcome.nextRetryAt ?? null,
            outcome.providerResponseMessage.slice(0, 500),
            outcome.errorClass ?? "deferred",
            finishedAt,
            claimedJob.id,
            claimedJob.attempts
          );
      } else if (outcome.eventType === "failed" && outcome.errorClass !== "routing_failed") {
        jobUpdate = this.db
          .prepare(
            `
              UPDATE smtp_queue_jobs
              SET
                status = 'failed',
                last_error = ?,
                last_error_class = ?,
                updated_at = ?
              WHERE id = ?
                AND status = 'processing'
                AND attempts = ?;
            `
          )
          .run(
            (outcome.maxAttemptsExceeded ? "max_attempts_exceeded" : outcome.providerResponseMessage).slice(0, 500),
            outcome.errorClass ?? "delivery_failed",
            finishedAt,
            claimedJob.id,
            claimedJob.attempts
          );
      } else {
        jobUpdate = this.db
          .prepare(
            `
              UPDATE smtp_queue_jobs
              SET
                status = 'completed',
                updated_at = ?
              WHERE id = ?
                AND status = 'processing'
                AND attempts = ?;
            `
          )
          .run(finishedAt, claimedJob.id, claimedJob.attempts);
      }

      if (Number(jobUpdate.changes) !== 1) {
        // The claim was lost (lease expired and the job went to someone else): record nothing.
        this.db.exec("ROLLBACK;");
        return;
      }

      this.db.exec("COMMIT;");
    } catch (error) {
      this.db.exec("ROLLBACK;");
      this.markJobFailed(claimedJob.id, String(error));
    }
  }

  /**
   * A deferred result gets its retry time, or becomes final once the job has used up its attempts
   * (reason max_attempts_exceeded, the provider's error class kept).
   */
  private finalizeOutcome(result: QueueDeliveryResult, attempt: number, maxAttempts: number): QueueProcessingResult {
    if (result.eventType !== "deferred") {
      return result;
    }

    if (attempt >= maxAttempts) {
      return { ...result, eventType: "failed", maxAttemptsExceeded: true };
    }

    const settings = this.queueSettings;
    const delayMs = computeBackoffDelayMs(attempt, settings.backoffBaseSeconds, settings.backoffCapSeconds, settings.random);
    return { ...result, nextRetryAt: new Date(settings.now().getTime() + delayMs).toISOString() };
  }

  insertAuditLog(input: AuditLogInput) {
    const now = new Date().toISOString();

    this.db
      .prepare(
        `
          INSERT INTO audit_logs (
            id,
            workspace_id,
            action,
            actor_type,
            actor_identifier,
            target_type,
            target_id,
            metadata_json,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `
      )
      .run(
        `audit_${randomUUID()}`,
        input.workspaceId,
        input.action,
        input.actorType,
        input.actorIdentifier ?? null,
        input.targetType ?? null,
        input.targetId ?? null,
        JSON.stringify(input.metadata ?? {}),
        now
      );
  }

  /**
   * Takes the oldest job that is due. First, jobs claimed longer ago than the lease go back to the
   * queue (or are failed when they have used up their attempts), so a worker that died mid-job does
   * not strand it. The claim itself is one UPDATE guarded by the job still being queued and due, so
   * of several callers racing for a job exactly one changes a row.
   */
  claimNextJob(): QueueJobRecord | undefined {
    const nowDate = this.queueSettings.now();
    const now = nowDate.toISOString();
    this.releaseExpiredLeases(nowDate);

    const next = this.db
      .prepare(
        `
          SELECT id
          FROM smtp_queue_jobs
          WHERE status = 'queued'
            AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
          ORDER BY created_at ASC, id ASC
          LIMIT 1;
        `
      )
      .get(now) as { id: string } | undefined;

    if (!next?.id) {
      return undefined;
    }

    return this.db
      .prepare(
        `
          UPDATE smtp_queue_jobs
          SET
            status = 'processing',
            attempts = attempts + 1,
            updated_at = ?
          WHERE id = ?
            AND status = 'queued'
            AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
          RETURNING id, payload_json AS payloadJson, attempts, max_attempts AS maxAttempts;
        `
      )
      .get(now, next.id, now) as QueueJobRecord | undefined;
  }

  private releaseExpiredLeases(nowDate: Date) {
    const now = nowDate.toISOString();
    const expiredBefore = new Date(nowDate.getTime() - this.queueSettings.leaseSeconds * 1000).toISOString();

    // A job whose claim ran out with no attempts left is failed, and so is its message. The UPDATE ...
    // RETURNING hands each such job to exactly one caller, which also records the failure event.
    this.db.exec("BEGIN;");
    try {
      const failedJobs = this.db
        .prepare(
          `
            UPDATE smtp_queue_jobs
            SET
              status = 'failed',
              last_error = 'max_attempts_exceeded',
              last_error_class = 'lease_expired',
              updated_at = ?
            WHERE status = 'processing'
              AND updated_at <= ?
              AND attempts >= max_attempts
            RETURNING id, message_id AS messageId, workspace_id AS workspaceId, payload_json AS payloadJson;
          `
        )
        .all(now, expiredBefore) as Array<{ id: string; messageId: string; payloadJson: string; workspaceId: string }>;

      for (const job of failedJobs) {
        this.recordLeaseFailure(job, now);
      }
      this.db.exec("COMMIT;");
    } catch (error) {
      this.db.exec("ROLLBACK;");
      throw error;
    }

    this.db
      .prepare(
        `
          UPDATE smtp_queue_jobs
          SET
            status = 'queued',
            last_error_class = 'lease_expired',
            updated_at = ?
          WHERE status = 'processing'
            AND updated_at <= ?;
        `
      )
      .run(now, expiredBefore);
  }

  /** Fails the message of a job that ran out of attempts through its lease, and records the event. */
  private recordLeaseFailure(job: { id: string; messageId: string; payloadJson: string; workspaceId: string }, now: string) {
    let traceId = `lease_${job.id}`;
    let source = "mail-queue";
    try {
      const payload = JSON.parse(job.payloadJson) as Partial<SmtpQueueRequest>;
      traceId = payload.traceId ?? traceId;
      source = payload.source ?? source;
    } catch {
      // the event is still recorded, with generic trace details
    }

    this.db
      .prepare("UPDATE messages SET status = 'failed', last_event_at = ?, updated_at = ? WHERE id = ?;")
      .run(now, now, job.messageId);
    this.db
      .prepare(
        `
          INSERT INTO message_events (
            id, message_id, workspace_id, event_type, occurred_at, payload_json,
            provider_message_id, provider_type, source, trace_id, created_at
          ) VALUES (?, ?, ?, 'failed', ?, ?, NULL, 'selfhosted', ?, ?, ?)
          ON CONFLICT(id) DO NOTHING;
        `
      )
      .run(
        `evt_${job.messageId}_failed_lease_${job.id}`,
        job.messageId,
        job.workspaceId,
        now,
        JSON.stringify({ errorClass: "lease_expired", reason: "max_attempts_exceeded", retryable: false }),
        source,
        traceId,
        now
      );
  }

  private markJobFailed(jobId: string, message: string) {
    this.db
      .prepare(
        `
          UPDATE smtp_queue_jobs
          SET
            status = 'failed',
            last_error = ?,
            updated_at = ?
          WHERE id = ?;
        `
      )
      .run(message.slice(0, 500), new Date().toISOString(), jobId);
  }

  private ensureSeed(seed: ResolvedSeedConfig) {
    const now = new Date().toISOString();
    const primaryDomain = seed.primaryDomain.toLowerCase();
    const defaultSender = seed.defaultSender.toLowerCase();

    this.db
      .prepare(
        `
          INSERT OR IGNORE INTO domains (id, workspace_id, domain, verification_status, created_at)
          VALUES (?, ?, ?, 'verified', ?);
        `
      )
      .run(`dom_${seed.workspaceId}_primary`, seed.workspaceId, primaryDomain, now);

    this.db
      .prepare(
        `
          INSERT OR IGNORE INTO sender_identities (
            id,
            workspace_id,
            domain_id,
            email,
            allowed_streams_json,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, 'active', ?);
        `
      )
      .run(
        seed.seededSenderIdentityId,
        seed.workspaceId,
        `dom_${seed.workspaceId}_primary`,
        defaultSender,
        JSON.stringify(seed.allowedStreams),
        now
      );

    this.db
      .prepare(
        `
          INSERT OR IGNORE INTO smtp_credentials (
            credential_id,
            workspace_id,
            username,
            password,
            principal,
            default_stream,
            allowed_streams_json,
            sender_identity_id,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?);
        `
      )
      .run(
        seed.credentialId,
        seed.workspaceId,
        seed.username,
        seed.password,
        seed.username,
        seed.defaultStream,
        JSON.stringify(seed.allowedStreams),
        seed.seededSenderIdentityId,
        now
      );

    this.db
      .prepare(
        `
          INSERT OR IGNORE INTO provider_routes (
            route_id,
            workspace_id,
            stream,
            provider_type,
            priority,
            active,
            created_at
          ) VALUES (?, ?, ?, 'selfhosted', 10, 1, ?);
        `
      )
      .run(seed.providerRouteId, seed.workspaceId, seed.defaultStream, now);

    this.db
      .prepare(
        `
          INSERT OR IGNORE INTO suppressions (
            id,
            workspace_id,
            email,
            stream,
            reason,
            active,
            created_at
          ) VALUES (?, ?, ?, NULL, 'manual', 1, ?);
        `
      )
      .run(`sup_${seed.workspaceId}_blocked`, seed.workspaceId, seed.blockedRecipient, now);
  }

  private buildMessageDeliveryState(
    row:
      | {
          deliveryStatus?: string;
          messageId?: string;
          providerRouteId?: string | null;
        }
      | undefined
  ) {
    if (!row?.messageId || !row.deliveryStatus) {
      return undefined;
    }

    const attempt = this.db
      .prepare(
        `
          SELECT
            error_class AS errorClass,
            provider_response_code AS providerResponseCode
          FROM delivery_attempts
          WHERE message_id = ?
          ORDER BY finished_at DESC, created_at DESC
          LIMIT 1;
        `
      )
      .get(row.messageId) as
      | {
          errorClass?: string | null;
          providerResponseCode?: string | null;
        }
      | undefined;

    return {
      deliveryStatus: row.deliveryStatus as MessageDeliveryState["deliveryStatus"],
      failureCode:
        row.deliveryStatus === "failed"
          ? attempt?.errorClass ?? attempt?.providerResponseCode ?? "delivery_failed"
          : undefined,
      messageId: row.messageId,
      providerRouteId: row.providerRouteId ?? undefined
    } satisfies MessageDeliveryState;
  }

  private getPersistedMessageProjection(
    messageId: string,
    workspaceId?: string
  ): MailMessageProjection | undefined {
    const row = (workspaceId
      ? this.db
          .prepare(
            `
              SELECT
                id AS messageId,
                workspace_id AS workspaceId,
                message_idempotency_key AS messageIdempotencyKey,
                stream,
                subject,
                status,
                provider_route_id AS providerRouteId,
                queued_at AS queuedAt,
                created_at AS createdAt
              FROM messages
              WHERE id = ?
                AND workspace_id = ?
              LIMIT 1;
            `
          )
          .get(messageId, workspaceId)
      : this.db
          .prepare(
            `
              SELECT
                id AS messageId,
                workspace_id AS workspaceId,
                message_idempotency_key AS messageIdempotencyKey,
                stream,
                subject,
                status,
                provider_route_id AS providerRouteId,
                queued_at AS queuedAt,
                created_at AS createdAt
              FROM messages
              WHERE id = ?
              LIMIT 1;
            `
          )
          .get(messageId)) as
      | {
          createdAt?: string;
          messageId?: string;
          messageIdempotencyKey?: string;
          providerRouteId?: string | null;
          queuedAt?: string | null;
          status?: string;
          stream?: string;
          subject?: string | null;
          workspaceId?: string;
        }
      | undefined;

    if (
      !row?.messageId ||
      !row.workspaceId ||
      !row.messageIdempotencyKey ||
      !row.stream
    ) {
      return undefined;
    }

    const payloadRow = this.db
      .prepare(
        `
          SELECT payload_json AS payloadJson
          FROM smtp_queue_jobs
          WHERE message_id = ?
          ORDER BY created_at DESC
          LIMIT 1;
        `
      )
      .get(row.messageId) as { payloadJson?: string } | undefined;
    const normalizedPayload = parseQueuePayload(payloadRow?.payloadJson);
    if (!normalizedPayload) {
      return undefined;
    }

    return {
      message: {
        envelopeFrom: normalizedPayload.envelopeFrom,
        headerFrom: normalizedPayload.headerFrom,
        messageId: row.messageId,
        messageIdempotencyKey: row.messageIdempotencyKey,
        providerRoute: row.providerRouteId ?? undefined,
        recipientCount: normalizedPayload.recipients.length,
        smtpSessionId: normalizedPayload.smtpSessionId,
        source: normalizedPayload.source,
        status: "queued",
        stream: row.stream,
        subject: row.subject ?? normalizedPayload.subject,
        submittedAt: normalizedPayload.submittedAt ?? row.queuedAt ?? row.createdAt ?? new Date().toISOString(),
        traceId: normalizedPayload.traceId,
        workspaceId: row.workspaceId
      },
      normalizedPayload
    };
  }
}

export type SmtpInternalAuthMode = "token" | "unauthenticated_opt_in" | "unconfigured";

export interface SmtpInternalAuth {
  /** `unconfigured` means /v1/internal/smtp/* answers 503 to every request. */
  mode: SmtpInternalAuthMode;
  token?: string;
}

/**
 * Decide how /v1/internal/smtp/* is protected. Fails closed: without a service
 * token the routes are only open when the dev/test opt-in is explicitly set.
 * The env form of the opt-in is ignored in production; the `allowUnauthenticatedInternal`
 * option is an explicit code-level decision and is honored everywhere.
 */
export function resolveSmtpInternalAuth(
  options: Pick<SmtpInternalBackendOptions, "allowUnauthenticatedInternal" | "remoteToken"> = {},
  env: NodeJS.ProcessEnv = process.env
): SmtpInternalAuth {
  const token = normalizeSecret(options.remoteToken ?? env.MAIL_SMTP_REMOTE_TOKEN);
  if (token) {
    return { mode: "token", token };
  }

  const optedIn =
    options.allowUnauthenticatedInternal ??
    (env.NODE_ENV !== "production" && isTruthyFlag(env[ALLOW_UNAUTHENTICATED_INTERNAL_ENV]));

  return { mode: optedIn ? "unauthenticated_opt_in" : "unconfigured" };
}

let reportedInternalAuthMode: SmtpInternalAuthMode | undefined;

type QueueApi = NonNullable<SmtpInternalBackend["queue"]>;

function buildQueueApi(store: MailPersistenceStore): QueueApi {
  return {
    claimNextJob: () => {
      const job = store.claimNextJob();
      return job ? { attempts: job.attempts, id: job.id } : undefined;
    },
    processNext: () => {
      store.processNextQueuedJob();
    },
    processNextAsync: () => store.processNextQueuedJobAsync()
  };
}

export interface MailQueueHandle {
  close(): void;
  queue: QueueApi;
}

/**
 * Opens only the delivery queue on the mail database, for a worker process that runs next to
 * mail-api. It applies pending migrations but seeds nothing and serves no routes.
 */
export function openMailQueue(options: { databaseUrl?: string; queue?: QueueSettingsInput } = {}): MailQueueHandle {
  const databaseUrl = options.databaseUrl ?? process.env.MAIL_DB_URL ?? "sqlite:/tmp/iai-mail.db";
  const store = new MailPersistenceStore(databaseUrl, undefined, resolveQueueSettings(options.queue));
  return { close: () => store.close(), queue: buildQueueApi(store) };
}

export function createSmtpInternalBackend(
  options: SmtpInternalBackendOptions = {}
): SmtpInternalBackend {
  const expectedApiKey = normalizeSecret(options.apiKey ?? process.env.MAIL_API_KEY);
  const internalAuth = resolveSmtpInternalAuth(options);
  const maxBodyBytes = resolveMaxBodyBytes(options.maxBodyBytes);
  const seed = resolveSeed(options.seed, process.env.NODE_ENV);
  const databaseUrl = options.databaseUrl ?? process.env.MAIL_DB_URL ?? "sqlite:/tmp/iai-mail.db";
  const store = new MailPersistenceStore(databaseUrl, seed, resolveQueueSettings(options.queue));

  reportInternalAuthPosture(internalAuth);
  if (process.env.NODE_ENV === "production" && store.hasDefaultDevCredential()) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: "error",
        msg: "mail_api_default_smtp_credential_present",
        detail: `smtp_credentials still holds the well-known dev login ${DEFAULT_DEV_USERNAME}/${DEFAULT_DEV_PASSWORD} (seeded by an earlier release). Delete or rotate that row; it is no longer created automatically in production.`,
        ts: new Date().toISOString()
      })
    );
  }

  const persistedSources: NonNullable<SmtpInternalBackend["persistedSources"]> = {
    messages: {
      getMessageDetail: (messageId, workspaceId) => store.getPersistedMessageDetail(messageId, workspaceId),
      listMessageEvents: (messageId, workspaceId) => store.listPersistedMessageEvents(messageId, workspaceId),
      listMessages: (filter) => store.listPersistedMessages(filter),
      snapshot: (workspaceId) => store.snapshotPersistedMessages(workspaceId)
    },
    suppressions: {
      listSuppressions: (filter) => store.listPersistedSuppressions(filter),
      snapshot: (workspaceId): MailSuppressionSourceSnapshot => ({
        generatedAt: new Date().toISOString(),
        items: store.listPersistedSuppressions({ workspaceId }),
        version: "mail_suppressions_sot_v1"
      })
    }
  };

  return {
    close() {
      store.close();
    },
    queue: buildQueueApi(store),
    persistedSources,
    checkPersistedReadAuthorization(request) {
      try {
        assertApiAuthorization(request, expectedApiKey);
        return undefined;
      } catch (error) {
        if (error instanceof SmtpBackendError) {
          return { errorCode: error.errorCode, message: error.message, statusCode: error.statusCode };
        }
        throw error;
      }
    },
    async handleRequest(request, response, requestId, url, method) {
      if (method === "GET" && url.pathname === "/v1/health/dependencies") {
        const queuedJobs = store.countQueuedJobs();
        const databaseOk = store.checkConnectivity();
        const checks = [
          {
            detail: databaseOk ? "sqlite connected" : "sqlite unreachable",
            name: "database",
            ok: databaseOk
          },
          {
            detail: `queued_jobs=${queuedJobs}`,
            name: "queue_transport",
            ok: true
          },
          {
            detail: "worker consumes smtp_queue_jobs and writes message timeline artifacts",
            name: "worker_backend",
            ok: true
          }
        ];

        writeRawJson(response, checks.every((item) => item.ok) ? 200 : 503, {
          checks,
          mode: "remote",
          ok: checks.every((item) => item.ok)
        });
        return true;
      }

      if (url.pathname === "/v1/send") {
        if (method !== "POST") {
          writeErrorEnvelope(
            response,
            requestId,
            405,
            "METHOD_NOT_ALLOWED",
            "Only POST is supported for this route."
          );
          return true;
        }

        try {
          assertApiAuthorization(request, expectedApiKey);
          const workspaceId = requireWorkspaceId(request, url);
          const body = await readRequestBody(request, maxBodyBytes);
          const payload = asRecord(body) as MailApiSendRequest;
          const result = handleSendOperation(store, payload, {
            requestId,
            workspaceId
          });

          writeSuccessEnvelope(response, 202, requestId, result);
          return true;
        } catch (error) {
          if (error instanceof SmtpBackendError) {
            writeErrorEnvelope(
              response,
              requestId,
              error.statusCode,
              error.errorCode,
              error.message,
              error.details
            );
            return true;
          }

          writeErrorEnvelope(response, requestId, 500, "INTERNAL_ERROR", "Unhandled SMTP backend error.");
          return true;
        }
      }

      if (method === "GET") {
        const workspaceId = tryGetWorkspaceId(request, url);
        const messageRoute = matchMessageReadRoute(url.pathname);

        if (workspaceId && messageRoute && store.hasPersistedMessage(messageRoute.messageId, workspaceId)) {
          // The workspace comes from the client, so reads need the same API key
          // as POST /v1/send; otherwise knowing a message id is enough to read it.
          try {
            assertApiAuthorization(request, expectedApiKey);
          } catch (error) {
            if (error instanceof SmtpBackendError) {
              writeErrorEnvelope(
                response,
                requestId,
                error.statusCode,
                error.errorCode,
                error.message,
                error.details
              );
              return true;
            }

            throw error;
          }

          if (messageRoute.resource === "detail") {
            const detail = store.getPersistedMessageDetail(messageRoute.messageId, workspaceId);
            if (detail) {
              writeSuccessEnvelope(response, 200, requestId, detail);
              return true;
            }
          }

          if (messageRoute.resource === "events") {
            const items = store.listPersistedMessageEvents(messageRoute.messageId, workspaceId);
            writeSuccessEnvelope(response, 200, requestId, {
              items,
              total: items.length
            });
            return true;
          }
        }
      }

      if (!url.pathname.startsWith("/v1/internal/smtp/")) {
        return false;
      }

      if (method !== "POST") {
        writeErrorEnvelope(
          response,
          requestId,
          405,
          "METHOD_NOT_ALLOWED",
          "Only POST is supported for this route."
        );
        return true;
      }

      try {
        assertAuthorization(request, internalAuth);
        const operation = getOperationFromPath(url.pathname);
        const body = await readRequestBody(request, maxBodyBytes);

        switch (operation) {
          case "auth": {
            const payload = asRecord(body) as SmtpAuthRequest;
            const result = handleAuthOperation(store, payload);
            writeRawJson(response, 200, result);
            return true;
          }
          case "mail-from": {
            const payload = asRecord(body) as SmtpMailFromRequest;
            const result = handleMailFromOperation(store, payload);
            writeRawJson(response, 200, result);
            return true;
          }
          case "recipient": {
            const payload = asRecord(body) as SmtpRecipientRequest;
            const result = handleRecipientOperation(store, payload);
            writeRawJson(response, 200, result);
            return true;
          }
          case "normalize": {
            const payload = asRecord(body) as SmtpNormalizeRequest;
            const result = handleNormalizeOperation(store, payload);
            writeRawJson(response, 200, result);
            return true;
          }
          case "queue": {
            const payload = asRecord(body) as unknown as SmtpQueueRequest;
            const result = handleQueueOperation(store, payload);
            writeRawJson(response, 200, result);
            return true;
          }
          case "audit": {
            const payload = asRecord(body) as SmtpAuditRequest;
            const result = handleAuditOperation(store, payload);
            writeRawJson(response, 200, result);
            return true;
          }
        }
      } catch (error) {
        if (error instanceof SmtpBackendError) {
          writeErrorEnvelope(
            response,
            requestId,
            error.statusCode,
            error.errorCode,
            error.message,
            {
              ...error.details,
              ...(typeof error.smtpCode === "number" ? { smtpCode: error.smtpCode } : {})
            }
          );
          return true;
        }

        // Not an error the caller caused: tell the SMTP gateway to retry later (451)
        // instead of reporting a permanent failure.
        writeErrorEnvelope(response, requestId, 503, "INTERNAL_ERROR", "Unhandled SMTP backend error.", {
          smtpCode: 451
        });
        return true;
      }
    }
  };
}

function handleAuthOperation(store: MailPersistenceStore, payload: SmtpAuthRequest) {
  if (!payload.username || !payload.password) {
    throw new SmtpBackendError(
      400,
      "VALIDATION_ERROR",
      "Missing username or password.",
      535
    );
  }

  const auth = store.authenticate(payload.username, payload.password);
  if (!auth) {
    throw new SmtpBackendError(401, "AUTH_REJECTED", "Invalid SMTP credentials.", 535);
  }

  return auth;
}

function handleMailFromOperation(store: MailPersistenceStore, payload: SmtpMailFromRequest) {
  const auth = requireAuthContext(payload.auth);
  const envelopeFrom = requireEmail(payload.address, "address");

  const senderIdentity = store.findSenderIdentity(auth.workspaceId, envelopeFrom);
  if (!senderIdentity) {
    return {
      ok: false,
      reason: `Sender identity ${envelopeFrom} is not allowed`,
      smtpCode: 550
    };
  }

  if (!store.isDomainVerified(auth.workspaceId, envelopeFrom)) {
    return {
      ok: false,
      reason: `Domain for ${envelopeFrom} is not verified`,
      smtpCode: 550
    };
  }

  if (!auth.allowedStreams.includes(auth.defaultStream)) {
    return {
      ok: false,
      reason: `Stream ${auth.defaultStream} is not allowed for this credential`,
      smtpCode: 550
    };
  }

  return {
    ok: true,
    senderIdentityId: senderIdentity.id,
    stream: auth.defaultStream
  };
}

function handleRecipientOperation(store: MailPersistenceStore, payload: SmtpRecipientRequest) {
  const auth = requireAuthContext(payload.auth);
  const stream = normalizeStreamOrThrow(payload.stream ?? auth.defaultStream, "stream");
  const recipient = requireEmail(payload.recipient, "recipient");

  if (store.isRecipientSuppressed(auth.workspaceId, recipient, stream)) {
    return {
      ok: false,
      reason: `Recipient ${recipient} is suppressed`,
      smtpCode: 550
    };
  }

  return {
    ok: true
  };
}

function handleNormalizeOperation(store: MailPersistenceStore, payload: SmtpNormalizeRequest) {
  const auth = requireAuthContext(payload.auth);
  const envelopeFrom = requireEmail(payload.envelopeFrom, "envelopeFrom");
  const recipients = normalizeRecipientList(payload.recipients);
  const stream = normalizeStreamOrThrow(payload.stream ?? auth.defaultStream, "stream");

  if (!auth.allowedStreams.includes(stream)) {
    throw new SmtpBackendError(
      422,
      "STREAM_NOT_ALLOWED",
      `Stream ${stream} is not allowed for this credential`,
      550
    );
  }

  if (!payload.rawMimeBase64 || !looksLikeBase64(payload.rawMimeBase64)) {
    throw new SmtpBackendError(
      422,
      "VALIDATION_ERROR",
      "rawMimeBase64 is required.",
      550
    );
  }

  const senderIdentity = store.findSenderIdentity(auth.workspaceId, envelopeFrom);
  if (!senderIdentity) {
    throw new SmtpBackendError(
      422,
      "SENDER_NOT_ALLOWED",
      `Sender identity ${envelopeFrom} is not allowed`,
      550
    );
  }

  if (!store.isDomainVerified(auth.workspaceId, envelopeFrom)) {
    throw new SmtpBackendError(
      422,
      "DOMAIN_NOT_VERIFIED",
      `Domain for ${envelopeFrom} is not verified`,
      550
    );
  }

  const submittedAt = parseTimestamp(payload.submittedAt) ?? new Date().toISOString();
  const traceId = payload.traceId?.trim() || `trace_${randomUUID()}`;
  const smtpSessionId = payload.smtpSessionId?.trim() || `smtp_${randomUUID()}`;
  const messageId = `msg_${randomUUID()}`;

  return {
    bcc: [],
    cc: [],
    credentialId: auth.credentialId,
    envelopeFrom,
    from: {
      email: envelopeFrom
    },
    headers: {},
    messageId,
    messageIdempotencyKey: traceId,
    rawMimeBase64: payload.rawMimeBase64,
    recipients,
    senderIdentityId: senderIdentity.id,
    smtpSessionId,
    source: "smtp",
    stream,
    submittedAt,
    to: recipients.map((email) => ({ email })),
    traceId,
    workspaceId: auth.workspaceId
  };
}

function handleQueueOperation(store: MailPersistenceStore, payload: SmtpQueueRequest) {
  const queuePayload = validateQueuePayload(payload);
  const selectedRoute = store.selectProviderRoute(queuePayload.workspaceId, queuePayload.stream);
  const providerRoute = selectedRoute?.routeId;
  const queuedAt = new Date().toISOString();
  const messageEventId = `evt_${queuePayload.messageId}_queued_${randomUUID().slice(0, 8)}`;

  store.persistQueueSubmission(queuePayload, {
    messageEventId,
    providerRouteId: providerRoute,
    queuedAt
  });
  store.processInline();

  return {
    messageEventId,
    messageId: queuePayload.messageId,
    providerRoute,
    queuedAt,
    smtpSessionId: queuePayload.smtpSessionId,
    traceId: queuePayload.traceId
  };
}

function handleAuditOperation(store: MailPersistenceStore, payload: SmtpAuditRequest) {
  if (!payload.action || !payload.actorType || !payload.workspaceId) {
    throw new SmtpBackendError(
      422,
      "VALIDATION_ERROR",
      "audit payload requires action, actorType, and workspaceId."
    );
  }

  store.insertAuditLog({
    action: payload.action,
    actorIdentifier: payload.actorIdentifier,
    actorType: payload.actorType,
    metadata: payload.metadata,
    targetId: payload.targetId,
    targetType: payload.targetType,
    workspaceId: payload.workspaceId
  });

  return {
    accepted: true
  };
}

function handleSendOperation(
  store: MailPersistenceStore,
  payload: MailApiSendRequest,
  input: {
    requestId: string;
    workspaceId: string;
  }
) {
  const queuePayload = validateSendPayload(payload, input);
  const senderIdentity = store.findSenderIdentity(input.workspaceId, queuePayload.envelopeFrom);
  if (!senderIdentity) {
    throw new SmtpBackendError(
      422,
      "SENDER_NOT_ALLOWED",
      `Sender identity ${queuePayload.envelopeFrom} is not allowed.`
    );
  }

  if (!store.isDomainVerified(input.workspaceId, queuePayload.envelopeFrom)) {
    throw new SmtpBackendError(
      422,
      "DOMAIN_NOT_VERIFIED",
      `Domain for ${queuePayload.envelopeFrom} is not verified.`
    );
  }

  for (const recipient of queuePayload.recipients) {
    if (store.isRecipientSuppressed(input.workspaceId, recipient, queuePayload.stream)) {
      throw new SmtpBackendError(
        422,
        "SUPPRESSED_RECIPIENT",
        `Recipient ${recipient} is suppressed.`,
        undefined,
        {
          recipient
        }
      );
    }
  }

  const existing = store.findMessageByIdempotencyKey(
    input.workspaceId,
    queuePayload.messageIdempotencyKey
  );
  if (existing) {
    return buildSendResponse(existing, queuePayload.recipients.length, queuePayload.stream);
  }

  const selectedRoute = store.selectProviderRoute(queuePayload.workspaceId, queuePayload.stream);
  const queuedAt = new Date().toISOString();
  const messageEventId = `evt_${queuePayload.messageId}_queued_${randomUUID().slice(0, 8)}`;

  store.persistQueueSubmission(
    {
      ...queuePayload,
      senderIdentityId: senderIdentity.id
    },
    {
      messageEventId,
      providerRouteId: selectedRoute?.routeId,
      queuedAt
    }
  );
  store.processInline();

  const deliveryState = store.getMessageDeliveryState(queuePayload.messageId) ?? {
    deliveryStatus: "queued",
    messageId: queuePayload.messageId,
    providerRouteId: selectedRoute?.routeId
  };

  return buildSendResponse(deliveryState, queuePayload.recipients.length, queuePayload.stream);
}

function resolveInlineFlag(option: boolean | undefined, env: NodeJS.ProcessEnv): boolean {
  if (option !== undefined) {
    return option;
  }

  const raw = env.MAIL_QUEUE_INLINE?.trim().toLowerCase();
  if (raw === undefined || raw === "") {
    return true;
  }

  if (raw === "1" || raw === "true") {
    return true;
  }

  if (raw === "0" || raw === "false") {
    return false;
  }

  throw new Error(`MAIL_QUEUE_INLINE must be 1, 0, true or false, got: ${JSON.stringify(raw)}`);
}

function resolveProviderAdapterName(option: QueueProviderAdapterName | undefined, env: NodeJS.ProcessEnv): QueueProviderAdapterName {
  const raw = (option ?? env.MAIL_PROVIDER_ADAPTER?.trim().toLowerCase()) || "none";
  if (raw !== "none" && raw !== "fake") {
    throw new Error(`${option !== undefined ? "queue option providerAdapter" : "MAIL_PROVIDER_ADAPTER"} must be "none" or "fake", got: ${JSON.stringify(raw)}`);
  }

  if (raw === "fake" && env.NODE_ENV === "production") {
    throw new Error('MAIL_PROVIDER_ADAPTER=fake is not allowed when NODE_ENV is "production"; configure a real provider adapter.');
  }

  return raw;
}

/**
 * A delivery hook or adapter that throws or rejects failed this attempt without saying whether it is final.
 * Treat it as a temporary failure: deferred with a class, so the job is retried with backoff until its
 * attempts run out. Only the class is kept, never the error text (it can carry addresses or hostnames).
 */
function deliveryExceptionResult(error: unknown): QueueDeliveryResult {
  const code = typeof (error as { code?: unknown } | null)?.code === "string" ? (error as { code: string }).code : "";
  const name = typeof (error as { name?: unknown } | null)?.name === "string" ? (error as { name: string }).name : "";
  const message = error instanceof Error ? error.message : "";
  let errorClass = "unknown_error";
  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT" || name === "AbortError" || name === "TimeoutError" || /timed? ?out/iu.test(message)) {
    errorClass = "timeout";
  } else if (
    ["ECONNRESET", "ECONNREFUSED", "ECONNABORTED", "EPIPE", "ENOTFOUND", "EAI_AGAIN", "EHOSTUNREACH", "ENETUNREACH"].includes(code) ||
    /socket hang up|network/iu.test(message)
  ) {
    errorClass = "network_error";
  }

  return {
    errorClass,
    eventType: "deferred",
    providerResponseCode: "0",
    providerResponseMessage: `delivery_exception:${errorClass}`
  };
}

/** No provider configured: a routed message can only be deferred and, in the end, failed. */
function noProviderQueueDelivery(input: QueueDeliveryInput): QueueDeliveryResult {
  if (!input.routeMatched) {
    return fakeQueueDelivery(input);
  }

  return {
    errorClass: "no_provider_configured",
    eventType: "deferred",
    providerResponseCode: "503",
    providerResponseMessage: "no_provider_configured"
  };
}

/** Stand-in delivery that accepts whatever matches an active route (MAIL_PROVIDER_ADAPTER=fake). */
function fakeQueueDelivery(input: QueueDeliveryInput): QueueDeliveryResult {
  if (!input.routeMatched) {
    return {
      errorClass: "routing_failed",
      eventType: "failed",
      providerResponseCode: "500",
      providerResponseMessage: "No active provider route matched."
    };
  }

  return {
    eventType: "provider_accepted",
    providerMessageId: `provider_${input.messageId}`,
    providerResponseCode: "202",
    providerResponseMessage: "accepted by internal worker"
  };
}

function validateQueuePayload(payload: SmtpQueueRequest) {
  const workspaceId = normalizeRequiredString(payload.workspaceId, "workspaceId");
  const messageId = normalizeRequiredString(payload.messageId, "messageId");
  const messageIdempotencyKey = normalizeRequiredString(
    payload.messageIdempotencyKey,
    "messageIdempotencyKey"
  );
  const traceId = normalizeRequiredString(payload.traceId, "traceId");
  const stream = normalizeStreamOrThrow(payload.stream, "stream");
  const envelopeFrom = requireEmail(payload.envelopeFrom, "envelopeFrom");

  if (!Array.isArray(payload.recipients) || payload.recipients.length === 0) {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", "queue payload requires recipients.");
  }

  for (const recipient of payload.recipients) {
    requireEmail(recipient, "recipients[]");
  }

  return {
    ...payload,
    envelopeFrom,
    messageId,
    messageIdempotencyKey,
    stream,
    traceId,
    workspaceId
  };
}

function validateSendPayload(
  payload: MailApiSendRequest,
  input: {
    requestId: string;
    workspaceId: string;
  }
): MailQueueSubmitPayload {
  const stream = normalizeStreamOrThrow(payload.stream, "stream");
  const from = normalizeSendAddress(payload.from, "from");
  const to = normalizeSendAddressList(payload.to, "to", true);
  const cc = normalizeSendAddressList(payload.cc, "cc");
  const bcc = normalizeSendAddressList(payload.bcc, "bcc");
  const replyTo = payload.reply_to
    ? normalizeSendAddress(payload.reply_to, "reply_to")
    : undefined;
  const html = normalizeOptionalStringValue(payload.html);
  const text = normalizeOptionalStringValue(payload.text);

  if (!html && !text) {
    throw new SmtpBackendError(
      422,
      "VALIDATION_ERROR",
      "send payload requires `html` or `text`."
    );
  }

  return {
    attachments: normalizeSendAttachments(payload.attachments),
    bcc,
    cc,
    credentialId: `mailapi_${input.workspaceId}`,
    envelopeFrom: from.email,
    from,
    headerFrom: formatAddressHeader(from),
    headers: normalizeSendHeaders(payload.headers),
    html,
    metadata: normalizeMetadata(payload.metadata, {
      request_id: input.requestId
    }),
    messageId: `msg_${randomUUID()}`,
    messageIdempotencyKey: normalizeRequiredString(
      payload.message_idempotency_key,
      "message_idempotency_key"
    ),
    recipients: [...new Set([...to, ...cc, ...bcc].map((item) => item.email))],
    replyTo,
    source: "api",
    stream,
    submittedAt: new Date().toISOString(),
    subject: normalizeOptionalStringValue(payload.subject),
    tags: normalizeStringList(payload.tags, "tags"),
    text,
    to,
    traceId:
      input.requestId.startsWith("trace_") || input.requestId.startsWith("req_")
        ? input.requestId
        : `trace_${input.requestId}`,
    workspaceId: input.workspaceId
  };
}

function requireAuthContext(input: SmtpAuthResult | undefined): SmtpAuthResult {
  if (!input) {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", "auth payload is required.");
  }

  const credentialId = normalizeRequiredString(input.credentialId, "auth.credentialId");
  const workspaceId = normalizeRequiredString(input.workspaceId, "auth.workspaceId");
  const principal = normalizeRequiredString(input.principal, "auth.principal");
  const defaultStream = normalizeStreamOrThrow(input.defaultStream, "auth.defaultStream");
  const allowedStreams = normalizeStreams(input.allowedStreams, "auth.allowedStreams");

  return {
    allowedStreams,
    credentialId,
    defaultStream,
    principal,
    senderIdentityId: input.senderIdentityId?.trim() || undefined,
    workspaceId
  };
}

function normalizeStreams(streams: string[] | undefined, field: string) {
  if (!Array.isArray(streams) || streams.length === 0) {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", `${field} must be a non-empty array.`);
  }

  return streams.map((item) => normalizeStreamOrThrow(item, field));
}

function normalizeRecipientList(recipients: string[] | undefined) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", "recipients must be a non-empty array.");
  }

  return recipients.map((item) => requireEmail(item, "recipients[]"));
}

function normalizeSendAddress(
  value: MailApiSendAddress | undefined,
  field: string
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", `${field} must be an object.`);
  }

  const email = requireEmail(value.email, `${field}.email`);
  const name = normalizeOptionalStringValue(value.name);

  return name ? { email, name } : { email };
}

function normalizeSendAddressList(
  values: MailApiSendAddress[] | undefined,
  field: string,
  required = false
) {
  if (!values) {
    if (required) {
      throw new SmtpBackendError(
        422,
        "VALIDATION_ERROR",
        `${field} must be a non-empty array.`
      );
    }

    return [];
  }

  if (!Array.isArray(values) || (required && values.length === 0)) {
    throw new SmtpBackendError(
      422,
      "VALIDATION_ERROR",
      `${field} must be a non-empty array.`
    );
  }

  return values.map((value, index) => normalizeSendAddress(value, `${field}[${index}]`));
}

function normalizeSendHeaders(headers: Record<string, unknown> | undefined) {
  if (!headers) {
    return {};
  }

  if (typeof headers !== "object" || Array.isArray(headers)) {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", "headers must be an object.");
  }

  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const headerName = key.trim();
    if (!headerName) {
      continue;
    }

    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      throw new SmtpBackendError(
        422,
        "VALIDATION_ERROR",
        `headers.${headerName} must be a string, number, or boolean.`
      );
    }

    normalized[headerName] = String(value);
  }

  return normalized;
}

function normalizeMetadata(
  metadata: Record<string, unknown> | undefined,
  additions: Record<string, unknown>
) {
  if (!metadata) {
    return additions;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", "metadata must be an object.");
  }

  return {
    ...metadata,
    ...additions
  };
}

function normalizeStringList(values: string[] | undefined, field: string) {
  if (!values) {
    return undefined;
  }

  if (!Array.isArray(values)) {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", `${field} must be an array.`);
  }

  const normalized = values
    .map((value) => normalizeOptionalStringValue(value))
    .filter((value): value is string => Boolean(value));

  return normalized.length > 0 ? [...new Set(normalized)] : undefined;
}

function normalizeSendAttachments(attachments: MailApiSendAttachment[] | undefined) {
  if (!attachments) {
    return [];
  }

  if (!Array.isArray(attachments)) {
    throw new SmtpBackendError(422, "INVALID_ATTACHMENT", "attachments must be an array.");
  }

  return attachments.map((attachment, index) => {
    if (!attachment || typeof attachment !== "object" || Array.isArray(attachment)) {
      throw new SmtpBackendError(
        422,
        "INVALID_ATTACHMENT",
        `attachments[${index}] must be an object.`
      );
    }

    const contentType = normalizeRequiredString(
      attachment.content_type,
      `attachments[${index}].content_type`
    );
    const contentBase64 = normalizeRequiredString(
      attachment.content_base64,
      `attachments[${index}].content_base64`
    );

    if (!looksLikeBase64(contentBase64)) {
      throw new SmtpBackendError(
        422,
        "INVALID_ATTACHMENT",
        `attachments[${index}].content_base64 must be valid base64.`
      );
    }

    const decodedSize = Buffer.from(contentBase64, "base64").length;
    const sizeBytes =
      typeof attachment.size_bytes === "number" &&
      Number.isFinite(attachment.size_bytes) &&
      attachment.size_bytes >= 0
        ? attachment.size_bytes
        : decodedSize;

    return {
      contentDisposition: normalizeOptionalStringValue(attachment.content_disposition),
      contentId: normalizeOptionalStringValue(attachment.content_id),
      contentTransferEncoding: normalizeOptionalStringValue(
        attachment.content_transfer_encoding
      ),
      contentType,
      filename: normalizeOptionalStringValue(attachment.filename),
      inline: attachment.inline === true ? true : undefined,
      partId: normalizeOptionalStringValue(attachment.part_id),
      sizeBytes
    };
  });
}

function buildSendResponse(
  state: MessageDeliveryState,
  acceptedRecipients: number,
  stream: string
) {
  return {
    accepted_recipients: acceptedRecipients,
    delivery_status: state.deliveryStatus,
    failure_code: state.failureCode,
    message_id: state.messageId,
    provider_route: state.providerRouteId,
    status: "queued",
    stream,
    suppressed_recipients: 0
  };
}

function requireEmail(value: string | undefined, field: string) {
  const normalized = normalizeRequiredString(value, field).toLowerCase();
  if (normalized.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(normalized)) {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", `${field} must be a valid email address.`, 550);
  }

  return normalized;
}

function normalizeRequiredString(value: string | undefined, field: string) {
  if (typeof value !== "string") {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", `${field} is required.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new SmtpBackendError(422, "VALIDATION_ERROR", `${field} is required.`);
  }

  return normalized;
}

function normalizeOptionalStringValue(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeStreamOrThrow(value: string | undefined, field: string) {
  const normalized = normalizeRequiredString(value, field).toLowerCase();
  if (!SUPPORTED_STREAMS.has(normalized)) {
    throw new SmtpBackendError(
      422,
      "VALIDATION_ERROR",
      `${field} contains an unsupported stream value: ${value}.`
    );
  }

  return normalized;
}

function parseJsonStringArray(value: string | undefined, fallback: string[]) {
  if (!value) {
    return [...fallback];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...fallback];
    }

    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0 && SUPPORTED_STREAMS.has(item));
  } catch {
    return [...fallback];
  }
}

function resolveSeed(
  seed: SmtpInternalBackendOptions["seed"],
  nodeEnv: string | undefined
): ResolvedSeedConfig | undefined {
  if (nodeEnv === "production") {
    // The dev defaults (ws_dev / smtp-dev / dev-secret) must never be created
    // implicitly in production: only an explicit, complete seed provisions anything.
    if (!seed) {
      return undefined;
    }

    if (!seed.username?.trim() || !seed.password?.trim()) {
      throw new Error(
        "createSmtpInternalBackend: seed.username and seed.password are required when NODE_ENV=production (the dev default credential is not used in production)."
      );
    }
  }

  const workspaceId = seed?.workspaceId?.trim() || "ws_dev";
  const defaultStream = normalizeSeedStream(seed?.defaultStream) ?? "transactional";
  const allowedStreams = normalizeSeedAllowedStreams(seed?.allowedStreams, defaultStream);

  return {
    allowedStreams,
    blockedRecipient: seed?.blockedRecipient?.trim().toLowerCase() || "blocked@example.com",
    credentialId: seed?.credentialId?.trim() || "smtpcred_dev",
    defaultSender: seed?.defaultSender?.trim().toLowerCase() || "no-reply@tx.iai.one",
    defaultStream,
    password: seed?.password?.trim() || DEFAULT_DEV_PASSWORD,
    primaryDomain: seed?.primaryDomain?.trim().toLowerCase() || "tx.iai.one",
    providerRouteId: seed?.providerRouteId?.trim() || "transactional_primary",
    seededSenderIdentityId: "sender_dev_default",
    username: seed?.username?.trim() || DEFAULT_DEV_USERNAME,
    workspaceId
  };
}

function normalizeSeedAllowedStreams(value: string[] | undefined, fallback: string) {
  if (!Array.isArray(value) || value.length === 0) {
    return [fallback];
  }

  const normalized = value
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0 && SUPPORTED_STREAMS.has(item));

  return normalized.length > 0 ? normalized : [fallback];
}

function normalizeSeedStream(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return SUPPORTED_STREAMS.has(normalized) ? normalized : undefined;
}

function resolveSqliteDatabasePath(databaseUrl: string) {
  if (databaseUrl.startsWith("sqlite::memory:")) {
    return ":memory:";
  }

  if (databaseUrl.startsWith("sqlite:")) {
    const path = databaseUrl.slice("sqlite:".length);
    return path.startsWith("//") ? path.slice(2) : path;
  }

  if (databaseUrl.startsWith("file:")) {
    return new URL(databaseUrl).pathname;
  }

  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    return process.env.MAIL_SQLITE_FALLBACK_PATH ?? "/tmp/iai-mail.db";
  }

  return databaseUrl;
}

function parseTimestamp(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
}

async function readRequestBody(request: IncomingMessage, maxBytes: number) {
  const declaredLength = Number.parseInt(getHeaderValue(request, "content-length") ?? "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw payloadTooLarge(maxBytes);
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  // Walk the iterator by hand: leaving a `for await` early calls return(),
  // which destroys the request and its socket before the 413 can be written.
  const iterator = request[Symbol.asyncIterator]();

  for (;;) {
    const next = await iterator.next();
    if (next.done) {
      break;
    }

    const chunk = Buffer.isBuffer(next.value) ? next.value : Buffer.from(next.value);
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      // Keep reading (and discarding) the rest of the upload so the response still reaches the client.
      void drainRequest(iterator);
      throw payloadTooLarge(maxBytes);
    }

    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new SmtpBackendError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

function payloadTooLarge(maxBytes: number) {
  return new SmtpBackendError(
    413,
    "PAYLOAD_TOO_LARGE",
    `Request body exceeds the ${maxBytes} byte limit.`
  );
}

async function drainRequest(iterator: AsyncIterator<unknown>) {
  try {
    while (!(await iterator.next()).done) {
      // discard
    }
  } catch {
    // The client went away mid-upload; nothing left to drain.
  }
}

function getOperationFromPath(pathname: string): SmtpOperation {
  const suffix = pathname.replace(/^\/v1\/internal\/smtp\//u, "");
  if (suffix === "auth") {
    return "auth";
  }
  if (suffix === "mail-from") {
    return "mail-from";
  }
  if (suffix === "recipient") {
    return "recipient";
  }
  if (suffix === "normalize") {
    return "normalize";
  }
  if (suffix === "queue") {
    return "queue";
  }
  if (suffix === "audit") {
    return "audit";
  }

  throw new SmtpBackendError(404, "NOT_FOUND", `Route ${pathname} was not found.`);
}

function assertAuthorization(request: IncomingMessage, internalAuth: SmtpInternalAuth) {
  if (!internalAuth.token) {
    if (internalAuth.mode === "unauthenticated_opt_in") {
      return;
    }

    // Fail closed: an unset token must never leave the internal routes open.
    // 451 (temporary failure) tells the SMTP gateway this is a server-side
    // misconfiguration, not a rejected login.
    throw new SmtpBackendError(
      503,
      "INTERNAL_ERROR",
      "MAIL_SMTP_REMOTE_TOKEN is not configured for /v1/internal/smtp/*.",
      451
    );
  }

  if (!matchesBearerToken(getHeaderValue(request, "authorization"), internalAuth.token)) {
    throw new SmtpBackendError(401, "UNAUTHORIZED", "Invalid service token.", 535);
  }
}

function assertApiAuthorization(request: IncomingMessage, expectedToken?: string) {
  if (!expectedToken) {
    throw new SmtpBackendError(
      503,
      "INTERNAL_ERROR",
      "MAIL_API_KEY is not configured for /v1/send."
    );
  }

  if (!matchesBearerToken(getHeaderValue(request, "authorization"), expectedToken)) {
    throw new SmtpBackendError(401, "UNAUTHORIZED", "Invalid API key.");
  }
}

function matchesBearerToken(authorization: string | undefined, expectedToken: string) {
  return constantTimeEqual(authorization ?? "", `Bearer ${expectedToken}`);
}

/**
 * Compare secrets without leaking where they differ or how long they are:
 * both sides are hashed to a fixed length first, because timingSafeEqual
 * throws on unequal lengths and a length pre-check would leak the secret's.
 */
function constantTimeEqual(provided: string, expected: string) {
  const providedDigest = createHash("sha256").update(provided).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}

function normalizeSecret(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isTruthyFlag(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function resolveMaxBodyBytes(option: number | undefined) {
  if (option !== undefined) {
    if (!Number.isInteger(option) || option <= 0) {
      throw new Error(`createSmtpInternalBackend: maxBodyBytes must be a positive integer, got: ${option}`);
    }

    return option;
  }

  const raw = process.env.MAIL_API_MAX_BODY_BYTES?.trim();
  if (!raw) {
    return DEFAULT_SMTP_INTERNAL_MAX_BODY_BYTES;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `MAIL_API_MAX_BODY_BYTES must be a positive integer if set, got: ${JSON.stringify(raw)}`
    );
  }

  return parsed;
}

/** Reads an integer setting from the option or the environment and refuses values outside its range. */
function resolveBoundedInteger(
  option: number | undefined,
  envName: string,
  fallback: number,
  min: number,
  max: number,
  env: NodeJS.ProcessEnv
): number {
  const raw = option !== undefined ? String(option) : env[envName]?.trim();
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const parsed = Number(raw);
  if (!/^\d+$/u.test(raw) || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${option !== undefined ? "queue option" : envName} must be an integer from ${min} to ${max}, got: ${JSON.stringify(raw)}`);
  }

  return parsed;
}

/** Like resolveBoundedInteger, but a whole number outside the range is moved to the nearest limit. */
function resolveClampedInteger(
  option: number | undefined,
  envName: string,
  fallback: number,
  min: number,
  max: number,
  env: NodeJS.ProcessEnv
): number {
  const raw = option !== undefined ? String(option) : env[envName]?.trim();
  if (raw === undefined || raw === "") {
    return fallback;
  }

  if (!/^\d+$/u.test(raw)) {
    throw new Error(`${option !== undefined ? "queue option" : envName} must be a whole number, got: ${JSON.stringify(raw)}`);
  }

  return Math.min(Math.max(Number(raw), min), max);
}

export function resolveQueueSettings(
  input: QueueSettingsInput = {},
  env: NodeJS.ProcessEnv = process.env
): QueueSettings {
  const backoffBaseSeconds = resolveClampedInteger(
    input.backoffBaseSeconds,
    "MAIL_QUEUE_BACKOFF_BASE_SECONDS",
    DEFAULT_QUEUE_BACKOFF_BASE_SECONDS,
    1,
    3600,
    env
  );
  const backoffCapSeconds = resolveClampedInteger(
    input.backoffCapSeconds,
    "MAIL_QUEUE_BACKOFF_CAP_SECONDS",
    DEFAULT_QUEUE_BACKOFF_CAP_SECONDS,
    10,
    86400,
    env
  );
  const providerAdapter = resolveProviderAdapterName(input.providerAdapter, env);
  return {
    backoffBaseSeconds,
    backoffCapSeconds: Math.max(backoffCapSeconds, backoffBaseSeconds),
    deliver: input.deliver ?? (providerAdapter === "fake" ? fakeQueueDelivery : noProviderQueueDelivery),
    inline: resolveInlineFlag(input.inline, env),
    leaseSeconds: resolveBoundedInteger(input.leaseSeconds, "MAIL_QUEUE_LEASE_SECONDS", DEFAULT_QUEUE_LEASE_SECONDS, 10, 3600, env),
    maxAttempts: resolveBoundedInteger(input.maxAttempts, "MAIL_QUEUE_MAX_ATTEMPTS", DEFAULT_QUEUE_MAX_ATTEMPTS, 1, 10, env),
    now: input.now ?? (() => new Date()),
    random: input.random ?? Math.random
  };
}

function reportInternalAuthPosture(internalAuth: SmtpInternalAuth) {
  if (internalAuth.mode === "token" || internalAuth.mode === reportedInternalAuthMode) {
    return;
  }

  reportedInternalAuthMode = internalAuth.mode;
  const unconfigured = internalAuth.mode === "unconfigured";
  // eslint-disable-next-line no-console
  (unconfigured ? console.error : console.warn)(
    JSON.stringify({
      level: unconfigured ? "error" : "warn",
      msg: unconfigured
        ? "mail_api_smtp_internal_auth_not_configured"
        : "mail_api_smtp_internal_auth_disabled_by_opt_in",
      detail: unconfigured
        ? "MAIL_SMTP_REMOTE_TOKEN is not set: every /v1/internal/smtp/* request is rejected with 503 until it is. Set it (e.g. openssl rand -hex 32), or for local dev/tests only set MAIL_SMTP_ALLOW_UNAUTHENTICATED_INTERNAL=1."
        : "/v1/internal/smtp/* is served WITHOUT authentication (explicit dev/test opt-in). Never use this outside local development.",
      ts: new Date().toISOString()
    })
  );
}

function requireWorkspaceId(request: IncomingMessage, url: URL) {
  const workspaceId =
    getHeaderValue(request, "x-workspace-id") ?? url.searchParams.get("workspace_id");
  if (!workspaceId) {
    throw new SmtpBackendError(
      400,
      "WORKSPACE_NOT_FOUND",
      "Missing X-Workspace-Id header or workspace_id query parameter."
    );
  }

  return workspaceId;
}

function tryGetWorkspaceId(request: IncomingMessage, url: URL) {
  return getHeaderValue(request, "x-workspace-id") ?? url.searchParams.get("workspace_id") ?? undefined;
}

function matchMessageReadRoute(
  pathname: string
): { messageId: string; resource: "detail" | "events" } | undefined {
  const eventsMatch = pathname.match(/^\/v1\/messages\/([^/]+)\/events$/u);
  if (eventsMatch?.[1]) {
    return {
      messageId: decodeURIComponent(eventsMatch[1]),
      resource: "events"
    };
  }

  const detailMatch = pathname.match(/^\/v1\/messages\/([^/]+)$/u);
  if (detailMatch?.[1]) {
    return {
      messageId: decodeURIComponent(detailMatch[1]),
      resource: "detail"
    };
  }

  return undefined;
}

function getHeaderValue(request: IncomingMessage, name: string) {
  const value = request.headers[name];
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value[0]?.trim();
  }

  return undefined;
}

function asRecord(value: unknown) {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  throw new SmtpBackendError(400, "VALIDATION_ERROR", "Request body must be a JSON object.");
}

function looksLikeBase64(value: string) {
  if (!value.trim()) {
    return false;
  }

  try {
    const decoded = Buffer.from(value, "base64");
    return decoded.length > 0 || value === "";
  } catch {
    return false;
  }
}

function parseQueuePayload(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }

    return parsed as MailQueueSubmitPayload;
  } catch {
    return undefined;
  }
}

const SUPPRESSION_REASONS: readonly MailSuppressionReason[] = ["hard_bounce", "complaint", "unsubscribe", "manual"];

function toSuppressionReason(value: string | null | undefined): MailSuppressionReason {
  return (SUPPRESSION_REASONS as readonly string[]).includes(value ?? "")
    ? (value as MailSuppressionReason)
    : "manual";
}

function positiveInteger(value: number | undefined, fallback: number) {
  if (value === undefined || Number.isNaN(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

function parseJsonRecord(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function writeRawJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function writeSuccessEnvelope(
  response: ServerResponse,
  statusCode: number,
  requestId: string,
  data: unknown
) {
  writeRawJson(response, statusCode, {
    data,
    meta: {
      request_id: requestId,
      timestamp: new Date().toISOString()
    },
    ok: true
  });
}

function writeErrorEnvelope(
  response: ServerResponse,
  requestId: string,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  writeRawJson(response, statusCode, {
    error: {
      code,
      details,
      message
    },
    meta: {
      request_id: requestId,
      timestamp: new Date().toISOString()
    },
    ok: false
  });
}

function formatAddressHeader(address: { email: string; name?: string }) {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}
