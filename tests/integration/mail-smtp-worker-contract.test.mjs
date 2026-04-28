import test from "node:test";
import assert from "node:assert/strict";

import { buildQueuedMailArtifacts } from "../../packages/mail-core/dist/index.js";
import { buildSmtpQueuedArtifacts, toMailQueueSubmitPayload } from "../../apps/mail-smtp/dist/worker-contract.js";

function createNormalizedMessage() {
  return {
    attachments: [
      {
        contentType: "application/pdf",
        filename: "guide.pdf",
        inline: false,
        partId: "1.2",
        sizeBytes: 1024
      }
    ],
    bcc: [],
    cc: [{ email: "audit@example.com", name: "Audit" }],
    credentialId: "smtpcred_123",
    envelopeFrom: "no-reply@tx.iai.one",
    from: {
      email: "no-reply@tx.iai.one",
      name: "IAI"
    },
    headerFrom: "no-reply@tx.iai.one",
    headerMessageId: "<header-msg-123@tx.iai.one>",
    headers: {
      subject: "Worker contract"
    },
    html: "<p>Hello</p>",
    messageId: "msg_123",
    messageIdempotencyKey: "trace_123",
    rawMime: Buffer.from("hello", "utf8"),
    recipients: ["user@example.com"],
    replyTo: {
      email: "support@iai.one"
    },
    smtpSessionId: "smtp_123",
    senderIdentityId: "sender_123",
    source: "smtp",
    stream: "transactional",
    submittedAt: "2026-04-14T10:00:00.000Z",
    subject: "Worker contract",
    text: "Hello",
    to: [{ email: "user@example.com", name: "User" }],
    traceId: "trace_123",
    workspaceId: "ws_123"
  };
}

test("mail-smtp maps normalized messages to the shared queue submit payload", () => {
  const payload = toMailQueueSubmitPayload(createNormalizedMessage());

  assert.equal(payload.messageId, "msg_123");
  assert.equal(payload.traceId, "trace_123");
  assert.equal(payload.smtpSessionId, "smtp_123");
  assert.equal(payload.attachments[0]?.filename, "guide.pdf");
  assert.equal(payload.to[0]?.email, "user@example.com");
  assert.equal(payload.source, "smtp");
});

test("shared queued artifacts build deterministic message and queued event records", () => {
  const artifacts = buildQueuedMailArtifacts(
    toMailQueueSubmitPayload(createNormalizedMessage()),
    {
      messageEventId: "evt_123",
      messageId: "msg_123",
      providerRoute: "transactional_primary",
      queuedAt: "2026-04-14T10:00:05.000Z",
      smtpSessionId: "smtp_123",
      traceId: "trace_123"
    }
  );

  assert.equal(artifacts.messageRecord.status, "queued");
  assert.equal(artifacts.messageRecord.providerRoute, "transactional_primary");
  assert.equal(artifacts.messageRecord.recipientCount, 1);
  assert.equal(artifacts.queuedEvent.eventType, "queued");
  assert.equal(artifacts.queuedEvent.eventId, "evt_123");
  assert.equal(
    artifacts.queuedEvent.payload.messageIdempotencyKey,
    "trace_123"
  );
});

test("mail-smtp queued artifact builder falls back to normalized trace fields", () => {
  const artifacts = buildSmtpQueuedArtifacts(createNormalizedMessage(), {
    messageId: "msg_123",
    providerRoute: "transactional_primary",
    queuedAt: "2026-04-14T10:00:05.000Z"
  });

  assert.equal(artifacts.messageRecord.traceId, "trace_123");
  assert.equal(artifacts.messageRecord.smtpSessionId, "smtp_123");
  assert.equal(
    artifacts.queuedEvent.eventId,
    "evt_msg_123_queued"
  );
});
