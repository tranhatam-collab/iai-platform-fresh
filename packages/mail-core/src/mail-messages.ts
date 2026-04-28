import type {
  MailQueueSubmitPayload,
  MailQueuedMessageRecord,
  MailTimelineEventType
} from "./mail-queue.js";

export type MailProviderType = "selfhosted" | "smtp" | "ses" | "sendgrid";
export type MailDeliveryAttemptStatus = "accepted" | "deferred" | "failed";

export interface MailDeliveryAttemptRecord {
  attemptId: string;
  attemptNumber: number;
  errorClass?: string;
  finishedAt: string;
  messageId: string;
  nextRetryAt?: string;
  providerMessageId?: string;
  providerResponseCode?: string;
  providerResponseMessage?: string;
  providerRouteId: string;
  providerType: MailProviderType;
  rawResponseJson?: Record<string, unknown>;
  startedAt: string;
  status: MailDeliveryAttemptStatus;
  traceId: string;
  workspaceId: string;
}

export interface MailMessageEventRecord {
  eventId: string;
  eventType: MailTimelineEventType;
  messageId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
  providerMessageId?: string;
  providerType?: MailProviderType;
  source: MailQueueSubmitPayload["source"];
  traceId: string;
  workspaceId: string;
}

export interface MailMessageProjection {
  message: MailQueuedMessageRecord;
  normalizedPayload: MailQueueSubmitPayload;
}

export interface MailMessageDetail {
  deliveryAttempts: MailDeliveryAttemptRecord[];
  eventCount: number;
  lastEvent?: MailMessageEventRecord;
  message: MailQueuedMessageRecord;
  normalizedPayload: MailQueueSubmitPayload;
  status: MailTimelineEventType;
}

export interface MailMessageListItem {
  from?: string;
  lastEventAt?: string;
  lastEventType?: MailTimelineEventType;
  messageId: string;
  primaryRecipient?: string;
  providerRoute?: string;
  providerType?: MailProviderType;
  recipientCount: number;
  source: MailQueuedMessageRecord["source"];
  status: MailTimelineEventType;
  stream: string;
  subject?: string;
  submittedAt: string;
  traceId: string;
  workspaceId: string;
}

export interface MailMessageListFilter {
  createdFrom?: string;
  createdTo?: string;
  from?: string;
  page?: number;
  pageSize?: number;
  statuses?: MailTimelineEventType[];
  stream?: string;
  to?: string;
  workspaceId?: string;
}

export interface MailMessageListPage {
  items: MailMessageListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface MailMessageSourceSnapshot {
  deliveryAttempts: MailDeliveryAttemptRecord[];
  events: MailMessageEventRecord[];
  generatedAt: string;
  projections: MailMessageProjection[];
  version: "mail_message_sot_v1";
}

export interface MailMessageReadSource {
  getMessageDetail(messageId: string, workspaceId?: string): MailMessageDetail | undefined;
  listMessages(filter?: MailMessageListFilter): MailMessageListPage;
  listMessageEvents(messageId: string, workspaceId?: string): MailMessageEventRecord[];
  snapshot(workspaceId?: string): MailMessageSourceSnapshot;
}

export function buildMailMessageDetail(
  projection: MailMessageProjection,
  events: MailMessageEventRecord[],
  deliveryAttempts: MailDeliveryAttemptRecord[]
): MailMessageDetail {
  const sortedEvents = sortEventsByOccurredAt(events);
  const sortedAttempts = sortAttemptsByStartedAt(deliveryAttempts);
  const lastEvent = sortedEvents[sortedEvents.length - 1];

  return {
    deliveryAttempts: sortedAttempts,
    eventCount: sortedEvents.length,
    lastEvent,
    message: projection.message,
    normalizedPayload: projection.normalizedPayload,
    status: lastEvent?.eventType ?? projection.message.status
  };
}

export function createMailMessageSource(
  seed?: Partial<MailMessageSourceSnapshot>
): MailMessageReadSource {
  const baseline = createMergedSnapshot(seed);

  return {
    getMessageDetail(messageId, workspaceId) {
      const projection = baseline.projections.find((item) => {
        if (item.message.messageId !== messageId) {
          return false;
        }

        if (workspaceId && item.message.workspaceId !== workspaceId) {
          return false;
        }

        return true;
      });

      if (!projection) {
        return undefined;
      }

      return buildMailMessageDetail(
        projection,
        filterByWorkspaceAndMessage(baseline.events, messageId, workspaceId),
        filterByWorkspaceAndMessage(baseline.deliveryAttempts, messageId, workspaceId)
      );
    },
    listMessages(filter = {}) {
      const page = normalizePositiveInteger(filter.page, 1);
      const pageSize = normalizePositiveInteger(filter.pageSize, 20);

      const items = baseline.projections
        .filter((item) => {
          if (filter.workspaceId && item.message.workspaceId !== filter.workspaceId) {
            return false;
          }

          return true;
        })
        .map((item) =>
          buildMailMessageDetail(
            item,
            filterByWorkspaceAndMessage(baseline.events, item.message.messageId, filter.workspaceId),
            filterByWorkspaceAndMessage(
              baseline.deliveryAttempts,
              item.message.messageId,
              filter.workspaceId
            )
          )
        )
        .filter((detail) => matchesMessageListFilter(detail, filter))
        .sort((left, right) => Date.parse(right.message.submittedAt) - Date.parse(left.message.submittedAt))
        .map((detail) => buildMailMessageListItem(detail));

      const offset = (page - 1) * pageSize;

      return {
        items: items.slice(offset, offset + pageSize),
        page,
        pageSize,
        total: items.length
      };
    },
    listMessageEvents(messageId, workspaceId) {
      return sortEventsByOccurredAt(filterByWorkspaceAndMessage(baseline.events, messageId, workspaceId));
    },
    snapshot(workspaceId) {
      if (!workspaceId) {
        return baseline;
      }

      return {
        deliveryAttempts: baseline.deliveryAttempts.filter((item) => item.workspaceId === workspaceId),
        events: baseline.events.filter((item) => item.workspaceId === workspaceId),
        generatedAt: baseline.generatedAt,
        projections: baseline.projections.filter((item) => item.message.workspaceId === workspaceId),
        version: baseline.version
      };
    }
  };
}

export function buildMailMessageListItem(detail: MailMessageDetail): MailMessageListItem {
  return {
    from:
      detail.normalizedPayload.from?.email ??
      detail.message.headerFrom ??
      detail.normalizedPayload.envelopeFrom,
    lastEventAt: detail.lastEvent?.occurredAt,
    lastEventType: detail.lastEvent?.eventType,
    messageId: detail.message.messageId,
    primaryRecipient:
      detail.normalizedPayload.to[0]?.email ?? detail.normalizedPayload.recipients[0],
    providerRoute: detail.message.providerRoute,
    providerType: detail.lastEvent?.providerType,
    recipientCount: detail.message.recipientCount,
    source: detail.message.source,
    status: detail.status,
    stream: detail.message.stream,
    subject: detail.message.subject,
    submittedAt: detail.message.submittedAt,
    traceId: detail.message.traceId,
    workspaceId: detail.message.workspaceId
  };
}

function createMergedSnapshot(
  seed?: Partial<MailMessageSourceSnapshot>
): MailMessageSourceSnapshot {
  const defaults = createDefaultSnapshot();

  return {
    deliveryAttempts: seed?.deliveryAttempts ?? defaults.deliveryAttempts,
    events: seed?.events ?? defaults.events,
    generatedAt: seed?.generatedAt ?? defaults.generatedAt,
    projections: seed?.projections ?? defaults.projections,
    version: "mail_message_sot_v1"
  };
}

function createDefaultSnapshot(): MailMessageSourceSnapshot {
  const normalizedPayload: MailQueueSubmitPayload = {
    attachments: [
      {
        contentType: "application/pdf",
        filename: "welcome-guide.pdf",
        sizeBytes: 2048
      }
    ],
    bcc: [],
    cc: [
      {
        email: "audit@iai.one",
        name: "Audit"
      }
    ],
    credentialId: "smtpcred_demo_main",
    envelopeFrom: "no-reply@tx.iai.one",
    from: {
      email: "no-reply@tx.iai.one",
      name: "IAI Mail"
    },
    headerFrom: "IAI Mail <no-reply@tx.iai.one>",
    headerMessageId: "<msg_smtp_demo_001@tx.iai.one>",
    headers: {
      subject: "Welcome to IAI"
    },
    html: "<p>Welcome to IAI</p>",
    messageId: "msg_smtp_demo_001",
    messageIdempotencyKey: "trace_smtp_demo_001",
    recipients: ["user@example.com"],
    replyTo: {
      email: "support@iai.one",
      name: "IAI Support"
    },
    smtpSessionId: "smtp_demo_001",
    source: "smtp",
    stream: "transactional",
    submittedAt: "2026-04-14T10:00:00.000Z",
    subject: "Welcome to IAI",
    text: "Welcome to IAI",
    to: [
      {
        email: "user@example.com",
        name: "Demo User"
      }
    ],
    traceId: "trace_smtp_demo_001",
    workspaceId: "ws_mail_main"
  };

  const projection: MailMessageProjection = {
    message: {
      envelopeFrom: normalizedPayload.envelopeFrom,
      headerFrom: normalizedPayload.headerFrom,
      messageId: normalizedPayload.messageId,
      messageIdempotencyKey: normalizedPayload.messageIdempotencyKey,
      providerRoute: "transactional_primary",
      recipientCount: normalizedPayload.recipients.length,
      smtpSessionId: normalizedPayload.smtpSessionId,
      source: normalizedPayload.source,
      status: "queued",
      stream: normalizedPayload.stream,
      subject: normalizedPayload.subject,
      submittedAt: normalizedPayload.submittedAt,
      traceId: normalizedPayload.traceId,
      workspaceId: normalizedPayload.workspaceId
    },
    normalizedPayload
  };

  return {
    deliveryAttempts: [
      {
        attemptId: "att_demo_001",
        attemptNumber: 1,
        finishedAt: "2026-04-14T10:00:06.000Z",
        messageId: normalizedPayload.messageId,
        providerMessageId: "sg_msg_smtp_demo_001",
        providerResponseCode: "202",
        providerResponseMessage: "accepted",
        providerRouteId: "transactional_primary",
        providerType: "sendgrid",
        rawResponseJson: {
          accepted: true,
          provider: "sendgrid"
        },
        startedAt: "2026-04-14T10:00:05.000Z",
        status: "accepted",
        traceId: normalizedPayload.traceId,
        workspaceId: normalizedPayload.workspaceId
      }
    ],
    events: [
      {
        eventId: "evt_msg_smtp_demo_001_queued",
        eventType: "queued",
        messageId: normalizedPayload.messageId,
        occurredAt: normalizedPayload.submittedAt,
        payload: {
          messageIdempotencyKey: normalizedPayload.messageIdempotencyKey,
          providerRoute: "transactional_primary",
          recipientCount: normalizedPayload.recipients.length,
          smtpSessionId: normalizedPayload.smtpSessionId,
          submittedAt: normalizedPayload.submittedAt
        },
        source: normalizedPayload.source,
        traceId: normalizedPayload.traceId,
        workspaceId: normalizedPayload.workspaceId
      },
      {
        eventId: "evt_msg_smtp_demo_001_provider_accepted_att_demo_001",
        eventType: "provider_accepted",
        messageId: normalizedPayload.messageId,
        occurredAt: "2026-04-14T10:00:06.000Z",
        payload: {
          attemptId: "att_demo_001",
          providerResponseCode: "202",
          providerResponseMessage: "accepted",
          providerRouteId: "transactional_primary",
          retryable: false
        },
        providerMessageId: "sg_msg_smtp_demo_001",
        providerType: "sendgrid",
        source: normalizedPayload.source,
        traceId: normalizedPayload.traceId,
        workspaceId: normalizedPayload.workspaceId
      }
    ],
    generatedAt: "2026-04-14T10:05:00.000Z",
    projections: [projection],
    version: "mail_message_sot_v1"
  };
}

function filterByWorkspaceAndMessage<
  T extends {
    messageId: string;
    workspaceId: string;
  }
>(items: T[], messageId: string, workspaceId?: string): T[] {
  return items.filter((item) => {
    if (item.messageId !== messageId) {
      return false;
    }

    if (workspaceId && item.workspaceId !== workspaceId) {
      return false;
    }

    return true;
  });
}

function matchesMessageListFilter(detail: MailMessageDetail, filter: MailMessageListFilter) {
  if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(detail.status)) {
    return false;
  }

  if (filter.stream && detail.message.stream !== filter.stream) {
    return false;
  }

  if (filter.to) {
    const needle = filter.to.toLowerCase();
    const recipients = [...detail.normalizedPayload.recipients, ...detail.normalizedPayload.to.map((item) => item.email)];
    if (!recipients.some((item) => item.toLowerCase().includes(needle))) {
      return false;
    }
  }

  if (filter.from) {
    const needle = filter.from.toLowerCase();
    const sender = (
      detail.normalizedPayload.from?.email ??
      detail.message.headerFrom ??
      detail.normalizedPayload.envelopeFrom
    ).toLowerCase();
    if (!sender.includes(needle)) {
      return false;
    }
  }

  if (filter.createdFrom && Date.parse(detail.message.submittedAt) < Date.parse(filter.createdFrom)) {
    return false;
  }

  if (filter.createdTo && Date.parse(detail.message.submittedAt) > Date.parse(filter.createdTo)) {
    return false;
  }

  return true;
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (value === undefined || Number.isNaN(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

function sortEventsByOccurredAt(events: MailMessageEventRecord[]): MailMessageEventRecord[] {
  return [...events].sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt));
}

function sortAttemptsByStartedAt(
  deliveryAttempts: MailDeliveryAttemptRecord[]
): MailDeliveryAttemptRecord[] {
  return [...deliveryAttempts].sort(
    (left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt)
  );
}
