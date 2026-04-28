import {
  buildQueuedMailArtifacts,
  type MailQueueAcceptance,
  type MailQueueSubmitPayload,
  type MailQueuedArtifacts
} from "../../../packages/mail-core/dist/index.js";

import type { NormalizedMessage, QueuePublishResult } from "./contracts.js";

export function toMailQueueSubmitPayload(
  message: NormalizedMessage
): MailQueueSubmitPayload {
  return {
    attachments: message.attachments.map((attachment) => ({
      contentDisposition: attachment.contentDisposition,
      contentId: attachment.contentId,
      contentTransferEncoding: attachment.contentTransferEncoding,
      contentType: attachment.contentType,
      filename: attachment.filename,
      inline: attachment.inline,
      partId: attachment.partId,
      sizeBytes: attachment.sizeBytes
    })),
    bcc: message.bcc.map(cloneAddress),
    cc: message.cc.map(cloneAddress),
    credentialId: message.credentialId,
    envelopeFrom: message.envelopeFrom,
    from: cloneMaybeAddress(message.from),
    headerFrom: message.headerFrom,
    headerMessageId: message.headerMessageId,
    headers: {
      ...message.headers
    },
    html: message.html,
    messageId: message.messageId,
    messageIdempotencyKey: message.messageIdempotencyKey,
    recipients: [...message.recipients],
    replyTo: cloneMaybeAddress(message.replyTo),
    senderIdentityId: message.senderIdentityId,
    smtpSessionId: message.smtpSessionId,
    source: message.source,
    stream: message.stream,
    submittedAt: message.submittedAt,
    subject: message.subject,
    text: message.text,
    to: message.to.map(cloneAddress),
    traceId: message.traceId,
    workspaceId: message.workspaceId
  };
}

export function buildSmtpQueuedArtifacts(
  message: NormalizedMessage,
  result: QueuePublishResult
): MailQueuedArtifacts {
  const acceptance: MailQueueAcceptance = {
    messageEventId: result.messageEventId,
    messageId: result.messageId,
    providerRoute: result.providerRoute,
    queuedAt: result.queuedAt,
    smtpSessionId: result.smtpSessionId ?? message.smtpSessionId,
    traceId: result.traceId ?? message.traceId
  };

  return buildQueuedMailArtifacts(toMailQueueSubmitPayload(message), acceptance);
}

function cloneAddress(address: { email: string; name?: string }) {
  return {
    email: address.email,
    ...(address.name ? { name: address.name } : {})
  };
}

function cloneMaybeAddress(address?: { email: string; name?: string }) {
  return address ? cloneAddress(address) : undefined;
}
