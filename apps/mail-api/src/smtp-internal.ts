import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { type IncomingMessage, type ServerResponse } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { URL } from "node:url";

import {
  buildMailMessageDetail,
  type MailDeliveryAttemptRecord,
  type MailMessageDetail,
  type MailMessageEventRecord,
  type MailMessageProjection,
  type MailQueueSubmitPayload
} from "@iai/mail-core";

const SUPPORTED_STREAMS = new Set(["transactional", "system", "marketing", "alerts"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

type SmtpOperation = "auth" | "mail-from" | "recipient" | "normalize" | "queue" | "audit";
type QueueJobStatus = "queued" | "processing" | "completed" | "failed";
type DeliveryOutcome = "provider_accepted" | "failed";

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
  id: string;
  payloadJson: string;
}

interface QueueProcessingResult {
  eventType: DeliveryOutcome;
  providerMessageId?: string;
  providerResponseCode: string;
  providerResponseMessage: string;
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
  apiKey?: string;
  databaseUrl?: string;
  remoteToken?: string;
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

export interface SmtpInternalBackend {
  close(): void;
  handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
    requestId: string,
    url: URL,
    method: string
  ): Promise<boolean>;
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
    seed: ResolvedSeedConfig
  ) {
    this.db = new DatabaseSync(resolveSqliteDatabasePath(databaseUrl));
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA busy_timeout = 2000;");
    this.ensureSchema();
    this.ensureSeed(seed);
  }

  close() {
    this.db.close();
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
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, 'queued', 0, ?, ?);
          `
        )
        .run(
          queueJobId,
          payload.messageId,
          payload.workspaceId,
          queuePayloadJson,
          now,
          now
        );

      this.db.exec("COMMIT;");
    } catch (error) {
      this.db.exec("ROLLBACK;");
      throw error;
    }
  }

  processNextQueuedJob() {
    const claimedJob = this.claimNextJob();
    if (!claimedJob) {
      return;
    }

    let payload: SmtpQueueRequest;
    try {
      payload = JSON.parse(claimedJob.payloadJson) as SmtpQueueRequest;
    } catch (error) {
      this.markJobFailed(claimedJob.id, `Unable to parse queued payload: ${String(error)}`);
      return;
    }

    const route = this.selectProviderRoute(payload.workspaceId, payload.stream);
    const attemptId = `att_${randomUUID()}`;
    const startedAt = new Date().toISOString();
    const finishedAt = new Date().toISOString();
    const outcome = buildQueueProcessingResult(payload, route);
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
            ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING;
          `
        )
        .run(
          attemptId,
          payload.messageId,
          outcome.eventType === "provider_accepted" ? "accepted" : "failed",
          providerRouteId,
          providerType,
          outcome.providerMessageId ?? null,
          outcome.providerResponseCode,
          outcome.providerResponseMessage,
          outcome.eventType === "provider_accepted" ? null : "routing_failed",
          JSON.stringify({
            routeMatched: Boolean(route)
          }),
          startedAt,
          finishedAt,
          null,
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
            retryable: false
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

      this.db
        .prepare(
          `
            UPDATE smtp_queue_jobs
            SET
              status = 'completed',
              updated_at = ?
            WHERE id = ?;
          `
        )
        .run(finishedAt, claimedJob.id);

      this.db.exec("COMMIT;");
    } catch (error) {
      this.db.exec("ROLLBACK;");
      this.markJobFailed(claimedJob.id, String(error));
    }
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

  private claimNextJob(): QueueJobRecord | undefined {
    const now = new Date().toISOString();
    const next = this.db
      .prepare(
        `
          SELECT id, payload_json AS payloadJson
          FROM smtp_queue_jobs
          WHERE status = 'queued'
          ORDER BY created_at ASC
          LIMIT 1;
        `
      )
      .get() as QueueJobRecord | undefined;

    if (!next?.id) {
      return undefined;
    }

    const claim = this.db
      .prepare(
        `
          UPDATE smtp_queue_jobs
          SET
            status = 'processing',
            attempts = attempts + 1,
            updated_at = ?
          WHERE id = ?
            AND status = 'queued';
        `
      )
      .run(now, next.id);

    if (claim.changes !== 1) {
      return undefined;
    }

    return next;
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

  private ensureSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS smtp_credentials (
        credential_id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        principal TEXT NOT NULL,
        default_stream TEXT NOT NULL,
        allowed_streams_json TEXT NOT NULL,
        sender_identity_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS domains (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        domain TEXT NOT NULL,
        verification_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(workspace_id, domain)
      );

      CREATE TABLE IF NOT EXISTS sender_identities (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        domain_id TEXT,
        email TEXT NOT NULL,
        allowed_streams_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        UNIQUE(workspace_id, email)
      );

      CREATE TABLE IF NOT EXISTS suppressions (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        email TEXT NOT NULL,
        stream TEXT,
        reason TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS provider_routes (
        route_id TEXT PRIMARY KEY,
        workspace_id TEXT,
        stream TEXT NOT NULL,
        provider_type TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 100,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        message_idempotency_key TEXT NOT NULL,
        stream TEXT NOT NULL,
        sender_identity_id TEXT,
        from_email TEXT NOT NULL,
        from_name TEXT,
        reply_to_email TEXT,
        reply_to_name TEXT,
        subject TEXT,
        html_body TEXT,
        text_body TEXT,
        status TEXT NOT NULL,
        provider_route_id TEXT,
        metadata_json TEXT,
        tags_json TEXT,
        headers_json TEXT,
        queued_at TEXT,
        sent_at TEXT,
        last_event_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS message_events (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        provider_message_id TEXT,
        provider_type TEXT,
        source TEXT NOT NULL,
        trace_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS delivery_attempts (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        attempt_number INTEGER NOT NULL,
        status TEXT NOT NULL,
        provider_route_id TEXT NOT NULL,
        provider_type TEXT NOT NULL,
        provider_message_id TEXT,
        provider_response_code TEXT,
        provider_response_message TEXT,
        error_class TEXT,
        raw_response_json TEXT,
        started_at TEXT NOT NULL,
        finished_at TEXT NOT NULL,
        next_retry_at TEXT,
        trace_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS smtp_queue_jobs (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        action TEXT NOT NULL,
        actor_type TEXT NOT NULL,
        actor_identifier TEXT,
        target_type TEXT,
        target_id TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_workspace_idempotency
      ON messages (workspace_id, message_idempotency_key);
    `);
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

export function createSmtpInternalBackend(
  options: SmtpInternalBackendOptions = {}
): SmtpInternalBackend {
  const expectedApiKey = options.apiKey ?? process.env.MAIL_API_KEY;
  const seed = resolveSeed(options.seed);
  const expectedToken = options.remoteToken ?? process.env.MAIL_SMTP_REMOTE_TOKEN;
  const databaseUrl = options.databaseUrl ?? process.env.MAIL_DB_URL ?? "sqlite:/tmp/iai-mail.db";
  const store = new MailPersistenceStore(databaseUrl, seed);

  return {
    close() {
      store.close();
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
          const body = await readRequestBody(request);
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
        assertAuthorization(request, expectedToken);
        const operation = getOperationFromPath(url.pathname);
        const body = await readRequestBody(request);

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

        writeErrorEnvelope(response, requestId, 500, "INTERNAL_ERROR", "Unhandled SMTP backend error.");
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
  store.processNextQueuedJob();

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
  store.processNextQueuedJob();

  const deliveryState = store.getMessageDeliveryState(queuePayload.messageId) ?? {
    deliveryStatus: "queued",
    messageId: queuePayload.messageId,
    providerRouteId: selectedRoute?.routeId
  };

  return buildSendResponse(deliveryState, queuePayload.recipients.length, queuePayload.stream);
}

function buildQueueProcessingResult(
  payload: SmtpQueueRequest,
  route: ProviderRouteSelection | undefined
): QueueProcessingResult {
  if (!route) {
    return {
      eventType: "failed",
      providerResponseCode: "500",
      providerResponseMessage: "No active provider route matched."
    };
  }

  return {
    eventType: "provider_accepted",
    providerMessageId: `provider_${payload.messageId}`,
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
  if (!EMAIL_PATTERN.test(normalized)) {
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

function resolveSeed(seed: SmtpInternalBackendOptions["seed"]) {
  const workspaceId = seed?.workspaceId?.trim() || "ws_dev";
  const defaultStream = normalizeSeedStream(seed?.defaultStream) ?? "transactional";
  const allowedStreams = normalizeSeedAllowedStreams(seed?.allowedStreams, defaultStream);

  return {
    allowedStreams,
    blockedRecipient: seed?.blockedRecipient?.trim().toLowerCase() || "blocked@example.com",
    credentialId: seed?.credentialId?.trim() || "smtpcred_dev",
    defaultSender: seed?.defaultSender?.trim().toLowerCase() || "no-reply@tx.iai.one",
    defaultStream,
    password: seed?.password?.trim() || "dev-secret",
    primaryDomain: seed?.primaryDomain?.trim().toLowerCase() || "tx.iai.one",
    providerRouteId: seed?.providerRouteId?.trim() || "transactional_primary",
    seededSenderIdentityId: "sender_dev_default",
    username: seed?.username?.trim() || "smtp-dev",
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

async function readRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
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

function assertAuthorization(request: IncomingMessage, expectedToken?: string) {
  if (!expectedToken) {
    return;
  }

  const authorization = getHeaderValue(request, "authorization");
  if (authorization !== `Bearer ${expectedToken}`) {
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

  const authorization = getHeaderValue(request, "authorization");
  if (authorization !== `Bearer ${expectedToken}`) {
    throw new SmtpBackendError(401, "UNAUTHORIZED", "Invalid API key.");
  }
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
