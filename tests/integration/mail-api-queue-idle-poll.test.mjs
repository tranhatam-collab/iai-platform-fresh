/**
 * A poll that finds nothing to do must not need the database's write lock: with other writers busy it would
 * otherwise wait out the busy timeout and throw "database is locked", and many idle workers would keep
 * competing with the senders for a lock they do not need.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const API_KEY = "mail-api-key-for-tests";
const WORKSPACE = "ws_idlepoll";
const SEED = {
  blockedRecipient: "blocked@example.com",
  defaultSender: "ops@idlepoll.example",
  password: "smtp-secret",
  primaryDomain: "idlepoll.example",
  username: "user-idlepoll",
  workspaceId: WORKSPACE
};

function tempDb() {
  const dbPath = `/tmp/iai-mail-api-idlepoll-${randomUUID()}.sqlite`;
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

const clock = () => {
  let current = Date.parse("2026-10-12T10:00:00.000Z");
  return { advance: (seconds) => (current += seconds * 1000), now: () => new Date(current) };
};

function open(url, time, queue = {}) {
  return createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: { inline: false, leaseSeconds: 60, now: time.now, providerAdapter: "fake", ...queue },
    seed: SEED
  });
}

async function queueMessage(backend, key) {
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  const response = await dispatchToHandler(handler, {
    body: JSON.stringify({
      from: { email: "ops@idlepoll.example" },
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
}

/** A second connection that holds the write lock until released. */
function holdWriteLock(dbPath) {
  const db = new DatabaseSync(dbPath);
  db.exec("BEGIN IMMEDIATE;");
  return () => {
    db.exec("ROLLBACK;");
    db.close();
  };
}

const rows = (dbPath, sql) => {
  const db = new DatabaseSync(dbPath);
  try {
    return db.prepare(sql).all().map((row) => ({ ...row }));
  } finally {
    db.close();
  }
};

test("a poll of an empty queue returns at once while another connection holds the write lock", () => {
  const { cleanup, dbPath, url } = tempDb();
  const backend = open(url, clock());
  const release = holdWriteLock(dbPath);
  try {
    const started = Date.now();
    assert.equal(backend.queue.claimNextJob(), undefined);
    assert.ok(Date.now() - started < 1000, `the poll waited ${Date.now() - started} ms for a lock it does not need`);
  } finally {
    release();
    backend.close();
    cleanup();
  }
});

test("a poll with only live claims in progress returns at once under a write lock and leaves them alone", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = open(url, time);
  try {
    await queueMessage(backend, "idem-live");
    assert.ok(backend.queue.claimNextJob(), "the job is claimed");
    time.advance(30);
    const before = rows(dbPath, "SELECT status, attempts, updated_at FROM smtp_queue_jobs;");
    const release = holdWriteLock(dbPath);
    try {
      const started = Date.now();
      assert.equal(backend.queue.claimNextJob(), undefined);
      assert.ok(Date.now() - started < 1000, "no wait for the write lock");
    } finally {
      release();
    }
    assert.deepEqual(rows(dbPath, "SELECT status, attempts, updated_at FROM smtp_queue_jobs;"), before);
  } finally {
    backend.close();
    cleanup();
  }
});

test("an expired claim is still released and claimed again", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = open(url, time);
  try {
    await queueMessage(backend, "idem-expired");
    assert.equal(backend.queue.claimNextJob()?.attempts, 1);
    time.advance(61);
    const again = backend.queue.claimNextJob();
    assert.equal(again?.attempts, 2, "the lease ran out, so the job is claimed a second time");
    assert.deepEqual(rows(dbPath, "SELECT status, attempts FROM smtp_queue_jobs;"), [{ attempts: 2, status: "processing" }]);
  } finally {
    backend.close();
    cleanup();
  }
});
