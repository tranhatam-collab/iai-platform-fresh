import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

function createPaymentBackend(dbPath) {
  return createSmtpInternalBackend({
    apiKey: "mail-api-token",
    databaseUrl: `sqlite:${dbPath}`,
    seed: {
      defaultSender: "pay@tranhatam.com",
      password: "smtp-secret",
      primaryDomain: "tranhatam.com",
      username: "smtp-operator",
      workspaceId: "ws_pay_tranhatam"
    }
  });
}

function createPaymentPayload() {
  return {
    from: {
      email: "pay@tranhatam.com",
      name: "Tranhatam.com"
    },
    headers: {
      "X-Source-App": "pay.iai.one"
    },
    message_idempotency_key: "pay-tranhatam-order-123-payment_receipt",
    metadata: {
      order_id: "order_123",
      payment_session_id: "ps_123",
      provider_reference: "prov_123",
      source_app: "pay.iai.one",
      source_domain: "tranhatam.com",
      template_id: "payment_receipt",
      x_site_key: "site_tranhatam"
    },
    reply_to: {
      email: "support@tranhatam.com",
      name: "Tranhatam.com Support"
    },
    stream: "transactional",
    subject: "Tranhatam.com | Payment receipt #order_123",
    tags: ["pay", "payment_receipt", "tranhatam.com"],
    text: "Payment received for order_123.",
    to: [
      {
        email: "customer@example.com",
        name: "Nguyen Van A"
      }
    ]
  };
}

test("mail api /send accepts payment-style payload, stays idempotent, and persists evidence", async (t) => {
  const dbPath = `/tmp/iai-mail-api-send-${randomUUID()}.sqlite`;
  const backend = createPaymentBackend(dbPath);
  const handler = createFlowApiRequestHandler({
    smtpInternalBackend: backend
  });

  t.after(() => {
    backend.close();
    rmSync(dbPath, {
      force: true
    });
  });

  const request = {
    body: JSON.stringify(createPaymentPayload()),
    headers: {
      authorization: "Bearer mail-api-token",
      "x-request-id": "pay-tranhatam-order-123-payment_receipt",
      "x-workspace-id": "ws_pay_tranhatam"
    },
    method: "POST",
    url: "/v1/send"
  };

  const response = await dispatchToHandler(handler, request);
  const payload = await response.json();

  assert.equal(response.status, 202);
  assert.equal(payload.ok, true);
  assert.match(payload.data.message_id, /^msg_/u);
  assert.equal(payload.data.status, "queued");
  assert.equal(payload.data.delivery_status, "provider_accepted");
  assert.equal(payload.data.provider_route, "transactional_primary");
  assert.equal(payload.data.accepted_recipients, 1);
  assert.equal(payload.data.suppressed_recipients, 0);

  const duplicateResponse = await dispatchToHandler(handler, request);
  const duplicatePayload = await duplicateResponse.json();
  assert.equal(duplicateResponse.status, 202);
  assert.equal(duplicatePayload.data.message_id, payload.data.message_id);
  assert.equal(duplicatePayload.data.delivery_status, "provider_accepted");

  const detailResponse = await dispatchToHandler(handler, {
    headers: {
      "x-request-id": "req_mail_api_payment_detail",
      "x-workspace-id": "ws_pay_tranhatam"
    },
    method: "GET",
    url: `/v1/messages/${payload.data.message_id}`
  });
  const detailPayload = await detailResponse.json();
  assert.equal(detailResponse.status, 200);
  assert.equal(detailPayload.ok, true);
  assert.equal(detailPayload.data.message.messageId, payload.data.message_id);
  assert.equal(detailPayload.data.status, "provider_accepted");
  assert.equal(detailPayload.data.normalizedPayload.metadata.template_id, "payment_receipt");
  assert.deepEqual(detailPayload.data.normalizedPayload.tags, [
    "pay",
    "payment_receipt",
    "tranhatam.com"
  ]);

  const eventsResponse = await dispatchToHandler(handler, {
    headers: {
      "x-request-id": "req_mail_api_payment_events",
      "x-workspace-id": "ws_pay_tranhatam"
    },
    method: "GET",
    url: `/v1/messages/${payload.data.message_id}/events`
  });
  const eventsPayload = await eventsResponse.json();
  assert.equal(eventsResponse.status, 200);
  assert.equal(eventsPayload.ok, true);
  assert.equal(eventsPayload.data.total >= 2, true);
  assert.equal(eventsPayload.data.items[0].eventType, "queued");
  assert.equal(eventsPayload.data.items.at(-1).eventType, "provider_accepted");

  const db = new DatabaseSync(dbPath);
  t.after(() => db.close());

  const messageRow = db
    .prepare(
      `
        SELECT
          from_email AS fromEmail,
          reply_to_email AS replyToEmail,
          status,
          provider_route_id AS providerRouteId,
          metadata_json AS metadataJson,
          tags_json AS tagsJson
        FROM messages
        WHERE id = ?;
      `
    )
    .get(payload.data.message_id);
  const messageCount = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM messages
        WHERE workspace_id = ?
          AND message_idempotency_key = ?;
      `
    )
    .get("ws_pay_tranhatam", "pay-tranhatam-order-123-payment_receipt");
  const eventCount = db
    .prepare("SELECT COUNT(*) AS count FROM message_events WHERE message_id = ?;")
    .get(payload.data.message_id);
  const attemptCount = db
    .prepare("SELECT COUNT(*) AS count FROM delivery_attempts WHERE message_id = ?;")
    .get(payload.data.message_id);

  const metadata = JSON.parse(messageRow.metadataJson);
  const tags = JSON.parse(messageRow.tagsJson);

  assert.equal(messageRow.fromEmail, "pay@tranhatam.com");
  assert.equal(messageRow.replyToEmail, "support@tranhatam.com");
  assert.equal(messageRow.status, "provider_accepted");
  assert.equal(messageRow.providerRouteId, "transactional_primary");
  assert.equal(messageCount.count, 1);
  assert.equal(eventCount.count >= 2, true);
  assert.equal(attemptCount.count >= 1, true);
  assert.equal(metadata.template_id, "payment_receipt");
  assert.equal(metadata.provider_reference, "prov_123");
  assert.equal(metadata.source_domain, "tranhatam.com");
  assert.equal(metadata.queueSource, "mail.api.send");
  assert.deepEqual(tags, ["pay", "payment_receipt", "tranhatam.com"]);
});

test("mail api /send rejects payment sender outside the bound sender policy", async (t) => {
  const dbPath = `/tmp/iai-mail-api-send-${randomUUID()}.sqlite`;
  const backend = createPaymentBackend(dbPath);
  const handler = createFlowApiRequestHandler({
    smtpInternalBackend: backend
  });

  t.after(() => {
    backend.close();
    rmSync(dbPath, {
      force: true
    });
  });

  const response = await dispatchToHandler(handler, {
    body: JSON.stringify({
      ...createPaymentPayload(),
      from: {
        email: "noreply@tranhatam.com",
        name: "Tranhatam.com"
      }
    }),
    headers: {
      authorization: "Bearer mail-api-token",
      "x-request-id": "pay-tranhatam-order-124-payment_receipt",
      "x-workspace-id": "ws_pay_tranhatam"
    },
    method: "POST",
    url: "/v1/send"
  });
  const payload = await response.json();

  assert.equal(response.status, 422);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "SENDER_NOT_ALLOWED");
  assert.match(payload.error.message, /noreply@tranhatam\.com/u);
});
