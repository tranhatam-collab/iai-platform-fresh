/**
 * The queue's provider adapter: `none` (default) never reports provider_accepted, `fake` is an
 * explicit stand-in, and production refuses the stand-in.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { bootstrapFromEnv } from "../../apps/mail-api/dist/bootstrap.js";
import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend, resolveQueueSettings } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const API_KEY = "mail-api-key-for-tests";
const WORKSPACE = "ws_adapter";
const SEED = {
  blockedRecipient: "blocked@example.com",
  defaultSender: "ops@adapter.example",
  password: "smtp-secret",
  primaryDomain: "adapter.example",
  username: "user-adapter",
  workspaceId: WORKSPACE
};

function tempDb() {
  const dbPath = `/tmp/iai-mail-api-adapter-${randomUUID()}.sqlite`;
  return {
    cleanup: () => {
      for (const suffix of ["", "-wal", "-shm"]) {
        rmSync(`${dbPath}${suffix}`, { force: true });
      }
    },
    dbPath,
    url: `sqlite:${dbPath}`
  };
}

async function send(backend, key) {
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  const response = await dispatchToHandler(handler, {
    body: JSON.stringify({
      from: { email: "ops@adapter.example" },
      message_idempotency_key: key,
      stream: "transactional",
      text: "hello",
      to: [{ email: "customer@example.com" }]
    }),
    headers: { authorization: `Bearer ${API_KEY}`, "x-workspace-id": WORKSPACE },
    method: "POST",
    url: "/v1/send"
  });
  assert.equal(response.status, 202);
  return (await response.json()).data;
}

const query = (dbPath, sql) => {
  const db = new DatabaseSync(dbPath);
  try {
    return db.prepare(sql).all().map((row) => ({ ...row }));
  } finally {
    db.close();
  }
};

function clock() {
  let current = Date.parse("2026-10-09T10:00:00.000Z");
  return { advance: (seconds) => (current += seconds * 1000), now: () => new Date(current) };
}

test("without a provider adapter a send is deferred, then failed as no_provider_configured; nothing is ever provider_accepted", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: { maxAttempts: 3, now: time.now, random: () => 0 },
    seed: SEED
  });
  try {
    const data = await send(backend, "idem-none");
    assert.equal(data.delivery_status, "deferred", "the send response reports the deferral, not an acceptance");
    assert.equal(query(dbPath, "SELECT status FROM messages;")[0].status, "deferred");

    for (let round = 0; round < 5; round += 1) {
      time.advance(3600);
      backend.queue.processNext();
    }

    assert.equal(query(dbPath, "SELECT status FROM messages;")[0].status, "failed");
    const [job] = query(dbPath, "SELECT status, attempts, last_error, last_error_class FROM smtp_queue_jobs;");
    assert.deepEqual(job, { attempts: 3, last_error: "max_attempts_exceeded", last_error_class: "no_provider_configured", status: "failed" });
    assert.deepEqual(
      query(dbPath, "SELECT status, error_class, provider_response_message FROM delivery_attempts ORDER BY attempt_number;"),
      [
        { error_class: "no_provider_configured", provider_response_message: "no_provider_configured", status: "deferred" },
        { error_class: "no_provider_configured", provider_response_message: "no_provider_configured", status: "deferred" },
        { error_class: "no_provider_configured", provider_response_message: "no_provider_configured", status: "failed" }
      ]
    );
    assert.deepEqual(
      query(dbPath, "SELECT COUNT(*) AS accepted FROM message_events WHERE event_type = 'provider_accepted';"),
      [{ accepted: 0 }]
    );
    assert.deepEqual(
      query(dbPath, "SELECT COUNT(*) AS accepted FROM delivery_attempts WHERE status = 'accepted';"),
      [{ accepted: 0 }]
    );
  } finally {
    backend.close();
    cleanup();
  }
});

test("the stand-in adapter must be asked for explicitly", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const backend = createSmtpInternalBackend({ apiKey: API_KEY, databaseUrl: url, queue: { providerAdapter: "fake" }, seed: SEED });
  try {
    const data = await send(backend, "idem-fake");
    assert.equal(data.delivery_status, "provider_accepted");
    assert.equal(query(dbPath, "SELECT status FROM messages;")[0].status, "provider_accepted");
  } finally {
    backend.close();
    cleanup();
  }

  const input = { attempt: 1, messageId: "msg_1", routeMatched: true, stream: "transactional", workspaceId: WORKSPACE };
  assert.equal(resolveQueueSettings({}, { MAIL_PROVIDER_ADAPTER: " FAKE " }).deliver(input).eventType, "provider_accepted");
  assert.equal(resolveQueueSettings({}, {}).deliver(input).eventType, "deferred", "no variable means no provider");
  assert.equal(resolveQueueSettings({}, { MAIL_PROVIDER_ADAPTER: "none" }).deliver(input).errorClass, "no_provider_configured");
});

test("the adapter name is validated and the stand-in is refused in production", async () => {
  assert.throws(() => resolveQueueSettings({}, { MAIL_PROVIDER_ADAPTER: "smtp" }), /MAIL_PROVIDER_ADAPTER must be "none" or "fake"/u);
  assert.throws(() => resolveQueueSettings({ providerAdapter: "x" }, {}), /providerAdapter must be "none" or "fake"/u);
  assert.throws(
    () => resolveQueueSettings({}, { MAIL_PROVIDER_ADAPTER: "fake", NODE_ENV: "production" }),
    /not allowed when NODE_ENV is "production"/u
  );
  assert.doesNotThrow(() => resolveQueueSettings({}, { MAIL_PROVIDER_ADAPTER: "none", NODE_ENV: "production" }));
  assert.doesNotThrow(() => resolveQueueSettings({}, { NODE_ENV: "production" }));

  await assert.rejects(
    () =>
      bootstrapFromEnv({
        MAIL_API_BIND_ADDRESS: "127.0.0.1",
        MAIL_PROVIDER_ADAPTER: "fake",
        MAIL_SMTP_REMOTE_TOKEN: "a-long-random-service-token-for-this-test-0123456789",
        NODE_ENV: "production",
        PORT: "0"
      }),
    /MAIL_PROVIDER_ADAPTER=fake is not allowed when NODE_ENV=production/u
  );
});
