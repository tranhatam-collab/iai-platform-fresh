import type {
  MailDeliveryAttemptRecord,
  MailMessageDetail,
  MailMessageEventRecord,
  MailMessageReadSource,
  MailQueueAddress
} from "@iai/mail-core";

export interface MessageAddressModel {
  display: string;
  email: string;
  name?: string;
}

export interface MessageAttachmentModel {
  contentDisposition?: string;
  contentId?: string;
  contentTransferEncoding?: string;
  contentType: string;
  filename?: string;
  inline: boolean;
  partId?: string;
  sizeBytes?: number;
}

export interface MessageTracePayloadEntry {
  key: string;
  value: string;
}

export interface MessageTimelineEventModel {
  eventId: string;
  eventType: MailMessageEventRecord["eventType"];
  isLatest: boolean;
  occurredAt: string;
  payload: Record<string, unknown>;
  payloadEntries: MessageTracePayloadEntry[];
  providerMessageId?: string;
  providerResponseCode?: string;
  providerResponseMessage?: string;
  providerRouteId?: string;
  providerType?: MailMessageEventRecord["providerType"];
  retryable?: boolean;
  source: MailMessageEventRecord["source"];
  traceId: string;
}

export interface MessageDeliveryAttemptModel {
  attemptId: string;
  attemptNumber: number;
  durationMs?: number;
  errorClass?: string;
  finishedAt: string;
  messageId: string;
  nextRetryAt?: string;
  providerMessageId?: string;
  providerResponseCode?: string;
  providerResponseMessage?: string;
  providerRouteId: string;
  providerType: MailDeliveryAttemptRecord["providerType"];
  rawResponseJson?: Record<string, unknown>;
  startedAt: string;
  status: MailDeliveryAttemptRecord["status"];
  traceId: string;
}

export interface MessageTraceModel {
  deliveryAttempts: MessageDeliveryAttemptModel[];
  eventCount: number;
  lastEvent?: MessageTimelineEventModel;
  timeline: MessageTimelineEventModel[];
}

export interface MessageDetailPageModel {
  content: {
    attachmentCount: number;
    attachments: MessageAttachmentModel[];
    hasHtml: boolean;
    hasText: boolean;
    headerMessageId?: string;
    html?: string;
    subject?: string;
    text?: string;
  };
  generatedAt: string;
  recipients: {
    bcc: MessageAddressModel[];
    cc: MessageAddressModel[];
    primaryRecipient?: MessageAddressModel;
    to: MessageAddressModel[];
  };
  sender: {
    envelopeFrom: string;
    from?: MessageAddressModel;
    headerFrom?: string;
    replyTo?: MessageAddressModel;
  };
  summary: {
    eventCount: number;
    lastEventAt?: string;
    lastEventType?: MailMessageEventRecord["eventType"];
    messageId: string;
    providerRoute?: string;
    recipientCount: number;
    smtpSessionId?: string;
    source: MailMessageDetail["message"]["source"];
    status: MailMessageDetail["status"];
    stream: string;
    subject?: string;
    submittedAt: string;
    traceId: string;
    workspaceId: string;
  };
  trace: MessageTraceModel;
}

export function buildMessageDetailPage(
  detail: MailMessageDetail,
  events: MailMessageEventRecord[],
  now = new Date().toISOString()
): MessageDetailPageModel {
  const timeline = buildTimeline(events);
  const deliveryAttempts = detail.deliveryAttempts.map(buildDeliveryAttemptModel);
  const primaryRecipient = detail.normalizedPayload.to[0]
    ? buildAddressModel(detail.normalizedPayload.to[0])
    : undefined;

  return {
    content: {
      attachmentCount: detail.normalizedPayload.attachments.length,
      attachments: detail.normalizedPayload.attachments.map((attachment) => ({
        contentDisposition: attachment.contentDisposition,
        contentId: attachment.contentId,
        contentTransferEncoding: attachment.contentTransferEncoding,
        contentType: attachment.contentType,
        filename: attachment.filename,
        inline: attachment.inline ?? false,
        partId: attachment.partId,
        sizeBytes: attachment.sizeBytes
      })),
      hasHtml: Boolean(detail.normalizedPayload.html),
      hasText: Boolean(detail.normalizedPayload.text),
      headerMessageId: detail.normalizedPayload.headerMessageId,
      html: detail.normalizedPayload.html,
      subject: detail.normalizedPayload.subject ?? detail.message.subject,
      text: detail.normalizedPayload.text
    },
    generatedAt: now,
    recipients: {
      bcc: detail.normalizedPayload.bcc.map(buildAddressModel),
      cc: detail.normalizedPayload.cc.map(buildAddressModel),
      primaryRecipient,
      to: detail.normalizedPayload.to.map(buildAddressModel)
    },
    sender: {
      envelopeFrom: detail.normalizedPayload.envelopeFrom,
      from: detail.normalizedPayload.from ? buildAddressModel(detail.normalizedPayload.from) : undefined,
      headerFrom: detail.normalizedPayload.headerFrom ?? detail.message.headerFrom,
      replyTo: detail.normalizedPayload.replyTo
        ? buildAddressModel(detail.normalizedPayload.replyTo)
        : undefined
    },
    summary: {
      eventCount: detail.eventCount,
      lastEventAt: detail.lastEvent?.occurredAt,
      lastEventType: detail.lastEvent?.eventType,
      messageId: detail.message.messageId,
      providerRoute: detail.message.providerRoute,
      recipientCount: detail.message.recipientCount,
      smtpSessionId: detail.message.smtpSessionId,
      source: detail.message.source,
      status: detail.status,
      stream: detail.message.stream,
      subject: detail.normalizedPayload.subject ?? detail.message.subject,
      submittedAt: detail.message.submittedAt,
      traceId: detail.message.traceId,
      workspaceId: detail.message.workspaceId
    },
    trace: {
      deliveryAttempts,
      eventCount: timeline.length,
      lastEvent: timeline[timeline.length - 1],
      timeline
    }
  };
}

export function buildMessageDetailPageFromSource(
  source: MailMessageReadSource,
  messageId: string,
  workspaceId?: string,
  now?: string
): MessageDetailPageModel | undefined {
  const detail = source.getMessageDetail(messageId, workspaceId);
  if (!detail) {
    return undefined;
  }

  return buildMessageDetailPage(
    detail,
    source.listMessageEvents(messageId, workspaceId),
    now
  );
}

function buildAddressModel(address: MailQueueAddress): MessageAddressModel {
  return {
    display: formatAddress(address),
    email: address.email,
    name: address.name
  };
}

function buildDeliveryAttemptModel(
  attempt: MailDeliveryAttemptRecord
): MessageDeliveryAttemptModel {
  return {
    attemptId: attempt.attemptId,
    attemptNumber: attempt.attemptNumber,
    durationMs: buildDurationMs(attempt.startedAt, attempt.finishedAt),
    errorClass: attempt.errorClass,
    finishedAt: attempt.finishedAt,
    messageId: attempt.messageId,
    nextRetryAt: attempt.nextRetryAt,
    providerMessageId: attempt.providerMessageId,
    providerResponseCode: attempt.providerResponseCode,
    providerResponseMessage: attempt.providerResponseMessage,
    providerRouteId: attempt.providerRouteId,
    providerType: attempt.providerType,
    rawResponseJson: attempt.rawResponseJson,
    startedAt: attempt.startedAt,
    status: attempt.status,
    traceId: attempt.traceId
  };
}

function buildTimeline(events: MailMessageEventRecord[]): MessageTimelineEventModel[] {
  return events.map((event, index) => ({
    eventId: event.eventId,
    eventType: event.eventType,
    isLatest: index === events.length - 1,
    occurredAt: event.occurredAt,
    payload: event.payload,
    payloadEntries: buildPayloadEntries(event.payload),
    providerMessageId: event.providerMessageId,
    providerResponseCode: getStringValue(event.payload.providerResponseCode),
    providerResponseMessage: getStringValue(event.payload.providerResponseMessage),
    providerRouteId: getStringValue(event.payload.providerRouteId),
    providerType: event.providerType,
    retryable: getBooleanValue(event.payload.retryable),
    source: event.source,
    traceId: event.traceId
  }));
}

function buildPayloadEntries(payload: Record<string, unknown>): MessageTracePayloadEntry[] {
  return Object.entries(payload)
    .flatMap(([key, value]) => {
      const rendered = renderPayloadValue(value);
      if (rendered === undefined) {
        return [];
      }

      return {
        key,
        value: rendered
      };
    })
    .sort((left, right) => left.key.localeCompare(right.key));
}

function renderPayloadValue(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function getBooleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function buildDurationMs(startedAt: string, finishedAt: string): number | undefined {
  const started = Date.parse(startedAt);
  const finished = Date.parse(finishedAt);

  if (Number.isNaN(started) || Number.isNaN(finished) || finished < started) {
    return undefined;
  }

  return finished - started;
}

function formatAddress(address: MailQueueAddress): string {
  if (!address.name) {
    return address.email;
  }

  return `${address.name} <${address.email}>`;
}
