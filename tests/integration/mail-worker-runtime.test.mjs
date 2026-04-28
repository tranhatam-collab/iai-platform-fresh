import test from "node:test";
import assert from "node:assert/strict";

import {
  createStubProviderAdapter,
  processQueuedMessage,
  selectProviderRoute
} from "../../apps/mail-worker/dist/index.js";

function createQueuedMessage() {
  return {
    attachments: [
      {
        contentType: "application/pdf",
        filename: "guide.pdf",
        sizeBytes: 1024
      }
    ],
    bcc: [],
    cc: [],
    credentialId: "smtpcred_123",
    envelopeFrom: "no-reply@tx.iai.one",
    from: {
      email: "no-reply@tx.iai.one",
      name: "IAI"
    },
    headerFrom: "no-reply@tx.iai.one",
    headerMessageId: "<header-msg-123@tx.iai.one>",
    headers: {
      subject: "Worker handoff"
    },
    html: "<p>Hello</p>",
    messageId: "msg_123",
    messageIdempotencyKey: "trace_123",
    recipients: ["user@example.com"],
    replyTo: {
      email: "support@iai.one"
    },
    smtpSessionId: "smtp_123",
    source: "smtp",
    stream: "transactional",
    submittedAt: "2026-04-14T10:00:00.000Z",
    subject: "Worker handoff",
    text: "Hello",
    to: [{ email: "user@example.com", name: "User" }],
    traceId: "trace_123",
    workspaceId: "ws_123"
  };
}

test("mail-worker prefers workspace-specific provider routes before shared routes", () => {
  const route = selectProviderRoute(createQueuedMessage(), [
    {
      active: true,
      priority: 1,
      provider: "ses",
      routeId: "shared_primary",
      streams: ["transactional"]
    },
    {
      active: true,
      priority: 9,
      provider: "sendgrid",
      routeId: "workspace_tx",
      streams: ["transactional"],
      workspaceId: "ws_123"
    }
  ]);

  assert.equal(route.routeId, "workspace_tx");
  assert.equal(route.provider, "sendgrid");
});

test("mail-worker builds accepted attempt and provider_accepted event artifacts", async () => {
  const result = await processQueuedMessage(createQueuedMessage(), {
    adapters: {
      sendgrid: createStubProviderAdapter("sendgrid", {
        providerMessageIdPrefix: "sg"
      })
    },
    now: "2026-04-14T10:00:05.000Z",
    routes: [
      {
        active: true,
        priority: 1,
        provider: "sendgrid",
        routeId: "workspace_tx",
        streams: ["transactional"],
        workspaceId: "ws_123"
      }
    ]
  });

  assert.equal(result.route.routeId, "workspace_tx");
  assert.equal(result.deliveryAttempt.status, "accepted");
  assert.equal(result.deliveryAttempt.providerType, "sendgrid");
  assert.equal(result.timelineEvent.eventType, "provider_accepted");
  assert.equal(result.timelineEvent.providerMessageId, "sg_msg_123");
});

test("mail-worker maps retryable provider responses into deferred artifacts", async () => {
  const result = await processQueuedMessage(createQueuedMessage(), {
    adapters: {
      ses: createStubProviderAdapter("ses", {
        accepted: false,
        retryable: true
      })
    },
    now: "2026-04-14T10:00:05.000Z",
    retryDelaySeconds: 120,
    routes: [
      {
        active: true,
        priority: 1,
        provider: "ses",
        routeId: "ses_primary",
        streams: ["transactional"]
      }
    ]
  });

  assert.equal(result.deliveryAttempt.status, "deferred");
  assert.equal(result.deliveryAttempt.nextRetryAt, "2026-04-14T10:02:05.000Z");
  assert.equal(result.timelineEvent.eventType, "deferred");
  assert.equal(result.timelineEvent.payload.retryable, true);
});
