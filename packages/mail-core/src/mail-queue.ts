export type MailMessageSource = "smtp" | "api";
export type MailTimelineEventType =
  | "queued"
  | "processing"
  | "provider_accepted"
  | "delivered"
  | "deferred"
  | "bounced"
  | "complained"
  | "failed";

export interface MailQueueAddress {
  email: string;
  name?: string;
}

export interface MailQueueAttachment {
  contentDisposition?: string;
  contentId?: string;
  contentTransferEncoding?: string;
  contentType: string;
  filename?: string;
  inline?: boolean;
  partId?: string;
  sizeBytes?: number;
}

export interface MailQueueSubmitPayload {
  attachments: MailQueueAttachment[];
  bcc: MailQueueAddress[];
  cc: MailQueueAddress[];
  credentialId: string;
  envelopeFrom: string;
  from?: MailQueueAddress;
  headerFrom?: string;
  headerMessageId?: string;
  headers: Record<string, string>;
  html?: string;
  metadata?: Record<string, unknown>;
  messageId: string;
  messageIdempotencyKey: string;
  recipients: string[];
  replyTo?: MailQueueAddress;
  senderIdentityId?: string;
  smtpSessionId?: string;
  source: MailMessageSource;
  stream: string;
  submittedAt: string;
  subject?: string;
  tags?: string[];
  text?: string;
  to: MailQueueAddress[];
  traceId: string;
  workspaceId: string;
}

export interface MailQueueAcceptance {
  messageEventId?: string;
  messageId: string;
  providerRoute?: string;
  queuedAt: string;
  smtpSessionId?: string;
  traceId?: string;
}

export interface MailQueuedMessageRecord {
  envelopeFrom: string;
  headerFrom?: string;
  messageId: string;
  messageIdempotencyKey: string;
  providerRoute?: string;
  recipientCount: number;
  smtpSessionId?: string;
  source: MailMessageSource;
  status: "queued";
  stream: string;
  subject?: string;
  submittedAt: string;
  traceId: string;
  workspaceId: string;
}

export interface MailQueuedEventRecord {
  eventId: string;
  eventType: MailTimelineEventType;
  messageId: string;
  occurredAt: string;
  payload: {
    messageIdempotencyKey: string;
    providerRoute?: string;
    recipientCount: number;
    smtpSessionId?: string;
    submittedAt: string;
  };
  source: MailMessageSource;
  traceId: string;
  workspaceId: string;
}

export interface MailQueuedArtifacts {
  messageRecord: MailQueuedMessageRecord;
  queuedEvent: MailQueuedEventRecord;
}

export function buildQueuedMailArtifacts(
  payload: MailQueueSubmitPayload,
  acceptance: MailQueueAcceptance
): MailQueuedArtifacts {
  const traceId = acceptance.traceId ?? payload.traceId;
  const smtpSessionId = acceptance.smtpSessionId ?? payload.smtpSessionId;
  const providerRoute = acceptance.providerRoute;
  const recipientCount = payload.recipients.length;

  return {
    messageRecord: {
      envelopeFrom: payload.envelopeFrom,
      headerFrom: payload.headerFrom,
      messageId: acceptance.messageId,
      messageIdempotencyKey: payload.messageIdempotencyKey,
      providerRoute,
      recipientCount,
      smtpSessionId,
      source: payload.source,
      status: "queued",
      stream: payload.stream,
      subject: payload.subject,
      submittedAt: payload.submittedAt,
      traceId,
      workspaceId: payload.workspaceId
    },
    queuedEvent: {
      eventId: acceptance.messageEventId ?? `evt_${acceptance.messageId}_queued`,
      eventType: "queued",
      messageId: acceptance.messageId,
      occurredAt: acceptance.queuedAt,
      payload: {
        messageIdempotencyKey: payload.messageIdempotencyKey,
        providerRoute,
        recipientCount,
        smtpSessionId,
        submittedAt: payload.submittedAt
      },
      source: payload.source,
      traceId,
      workspaceId: payload.workspaceId
    }
  };
}
