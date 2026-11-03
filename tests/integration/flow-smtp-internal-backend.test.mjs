import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

function createBackendConfig() {
  return {
    defaultSender: "no-reply@tx.iai.one",
    password: "smtp-secret",
    primaryDomain: "tx.iai.one",
    username: "smtp-operator",
    workspaceId: "ws_mail_main"
  };
}

const API_KEY = "mail-api-test-key";
const REMOTE_TOKEN = "mail-smtp-remote-test-token";

function internalHeaders() {
  return {
    authorization: `Bearer ${REMOTE_TOKEN}`
  };
}

test("internal smtp backend normalizes, queues, and persists worker artifacts", async (t) => {
  const dbPath = `/tmp/iai-mail-smtp-internal-${randomUUID()}.sqlite`;
  const seed = createBackendConfig();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: `sqlite:${dbPath}`,
    remoteToken: REMOTE_TOKEN,
    seed
  });
  const handler = createFlowApiRequestHandler({
    smtpInternalBackend: backend
  });

  t.after(() => {
    backend.close();
    rmSync(dbPath, {
      force: true
    });
  });

  const authResponse = await dispatchToHandler(handler, {
    body: JSON.stringify({
      method: "LOGIN",
      password: seed.password,
      secure: true,
      username: seed.username
    }),
    headers: internalHeaders(),
    method: "POST",
    url: "/v1/internal/smtp/auth"
  });
  const authPayload = await authResponse.json();
  assert.equal(authResponse.status, 200);
  assert.equal(authPayload.workspaceId, "ws_mail_main");
  assert.equal(authPayload.credentialId, "smtpcred_ws_mail_main");

  const rawMimeBase64 = Buffer.from(
    "From: no-reply@tx.iai.one\r\nSubject: Smoke\r\n\r\nhello",
    "utf8"
  ).toString("base64");

  const normalizeResponse = await dispatchToHandler(handler, {
    body: JSON.stringify({
      auth: authPayload,
      envelopeFrom: "no-reply@tx.iai.one",
      rawMimeBase64,
      recipients: ["user@example.com"],
      stream: "transactional"
    }),
    headers: internalHeaders(),
    method: "POST",
    url: "/v1/internal/smtp/normalize"
  });
  const normalizePayload = await normalizeResponse.json();
  assert.equal(normalizeResponse.status, 200);
  assert.equal(normalizePayload.workspaceId, "ws_mail_main");
  assert.match(normalizePayload.messageId, /^msg_/u);
  assert.match(normalizePayload.traceId, /^trace_/u);

  const queueResponse = await dispatchToHandler(handler, {
    body: JSON.stringify({
      attachments: [],
      bcc: [],
      cc: [],
      credentialId: normalizePayload.credentialId,
      envelopeFrom: normalizePayload.envelopeFrom,
      headers: normalizePayload.headers,
      messageId: normalizePayload.messageId,
      messageIdempotencyKey: normalizePayload.messageIdempotencyKey,
      rawMimeBase64,
      recipients: normalizePayload.recipients,
      senderIdentityId: normalizePayload.senderIdentityId,
      smtpSessionId: normalizePayload.smtpSessionId,
      source: "smtp",
      stream: normalizePayload.stream,
      submittedAt: normalizePayload.submittedAt,
      to: normalizePayload.to,
      traceId: normalizePayload.traceId,
      workspaceId: normalizePayload.workspaceId
    }),
    headers: internalHeaders(),
    method: "POST",
    url: "/v1/internal/smtp/queue"
  });
  const queuePayload = await queueResponse.json();
  assert.equal(queueResponse.status, 200);
  assert.equal(queuePayload.messageId, normalizePayload.messageId);
  assert.equal(queuePayload.providerRoute, "transactional_primary");

  const dependenciesResponse = await dispatchToHandler(handler, {
    method: "GET",
    url: "/v1/health/dependencies"
  });
  const dependenciesPayload = await dependenciesResponse.json();
  assert.equal(dependenciesResponse.status, 200);
  assert.equal(dependenciesPayload.ok, true);
  assert.equal(dependenciesPayload.mode, "remote");

  const db = new DatabaseSync(dbPath);
  t.after(() => db.close());

  const messageRow = db
    .prepare("SELECT status FROM messages WHERE id = ?")
    .get(queuePayload.messageId);
  const queuedEvents = db
    .prepare("SELECT COUNT(*) AS count FROM message_events WHERE message_id = ?")
    .get(queuePayload.messageId);
  const attempts = db
    .prepare("SELECT COUNT(*) AS count FROM delivery_attempts WHERE message_id = ?")
    .get(queuePayload.messageId);

  assert.equal(messageRow.status, "provider_accepted");
  assert.equal(queuedEvents.count >= 2, true);
  assert.equal(attempts.count >= 1, true);
});

test("internal smtp backend recipient check returns suppression rejection", async (t) => {
  const dbPath = `/tmp/iai-mail-smtp-internal-${randomUUID()}.sqlite`;
  const seed = createBackendConfig();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: `sqlite:${dbPath}`,
    remoteToken: REMOTE_TOKEN,
    seed
  });
  const handler = createFlowApiRequestHandler({
    smtpInternalBackend: backend
  });

  t.after(() => {
    backend.close();
    rmSync(dbPath, {
      force: true
    });
  });

  const authResponse = await dispatchToHandler(handler, {
    body: JSON.stringify({
      method: "LOGIN",
      password: seed.password,
      secure: true,
      username: seed.username
    }),
    headers: internalHeaders(),
    method: "POST",
    url: "/v1/internal/smtp/auth"
  });
  const authPayload = await authResponse.json();

  const recipientResponse = await dispatchToHandler(handler, {
    body: JSON.stringify({
      auth: authPayload,
      envelopeFrom: "no-reply@tx.iai.one",
      recipient: "blocked@example.com",
      recipientCount: 1,
      stream: "transactional"
    }),
    headers: internalHeaders(),
    method: "POST",
    url: "/v1/internal/smtp/recipient"
  });
  const recipientPayload = await recipientResponse.json();

  assert.equal(recipientResponse.status, 200);
  assert.equal(recipientPayload.ok, false);
  assert.equal(recipientPayload.smtpCode, 550);
});

test("internal smtp backend fails closed when the service token is missing", async (t) => {
  const dbPath = `/tmp/iai-mail-smtp-internal-${randomUUID()}.sqlite`;
  const backend = createSmtpInternalBackend({
    databaseUrl: `sqlite:${dbPath}`,
    seed: createBackendConfig()
  });
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });

  t.after(() => {
    backend.close();
    rmSync(dbPath, { force: true });
  });

  const response = await dispatchToHandler(handler, {
    body: JSON.stringify({
      method: "LOGIN",
      password: "smtp-secret",
      secure: true,
      username: "smtp-operator"
    }),
    method: "POST",
    url: "/v1/internal/smtp/auth"
  });
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.error.code, "SERVICE_AUTH_NOT_CONFIGURED");
});

test("internal smtp backend does not create default credentials", async (t) => {
  const dbPath = `/tmp/iai-mail-smtp-internal-${randomUUID()}.sqlite`;
  const backend = createSmtpInternalBackend({
    databaseUrl: `sqlite:${dbPath}`,
    remoteToken: REMOTE_TOKEN
  });
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });

  t.after(() => {
    backend.close();
    rmSync(dbPath, { force: true });
  });

  const response = await dispatchToHandler(handler, {
    body: JSON.stringify({
      method: "LOGIN",
      password: "dev-secret",
      secure: true,
      username: "smtp-dev"
    }),
    headers: internalHeaders(),
    method: "POST",
    url: "/v1/internal/smtp/auth"
  });

  assert.equal(response.status, 401);
});
