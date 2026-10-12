/**
 * /ready measures how much delivery work is due, not how many jobs exist. Jobs that failed temporarily and are
 * waiting for their retry time are queued too, but are not due; a provider outage that sends hundreds of jobs
 * into backoff must not make the service report itself unready while nothing is due.
 *
 * The retry time is a column the retry bookkeeping adds to the queue table. These tests add it to the test
 * database the same way, so the cases hold for a database that has it; the health tests in
 * mail-api-health.test.mjs cover a database without it.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

function setup(maxDepth) {
  const dbPath = `/tmp/iai-mail-api-health-retry-${randomUUID()}.sqlite`;
  const backend = createSmtpInternalBackend({ apiKey: "health-test-key", databaseUrl: `sqlite:${dbPath}`, healthMaxQueueDepth: maxDepth });
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  const db = new DatabaseSync(dbPath);
  db.exec("ALTER TABLE smtp_queue_jobs ADD COLUMN next_attempt_at TEXT;");
  const cleanup = () => {
    db.close();
    backend.close();
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(`${dbPath}${suffix}`, { force: true });
    }
  };
  return { cleanup, db, handler };
}

let sequence = 0;
function addJobs(db, count, { nextAttemptAt = null, status = "queued" } = {}) {
  const now = new Date().toISOString();
  for (let index = 0; index < count; index += 1) {
    sequence += 1;
    db.prepare(
      "INSERT INTO smtp_queue_jobs (id, message_id, workspace_id, payload_json, status, attempts, created_at, updated_at, next_attempt_at) VALUES (?, ?, ?, '{}', ?, 0, ?, ?, ?);"
    ).run(`job_${sequence}_${randomUUID()}`, `msg_${sequence}`, "ws_health", status, now, now, nextAttemptAt);
  }
}

async function ready(handler) {
  const response = await dispatchToHandler(handler, { method: "GET", url: "/ready" });
  return { json: await response.json(), status: response.status };
}

const inAMinute = () => new Date(Date.now() + 60_000).toISOString();
const aMinuteAgo = () => new Date(Date.now() - 60_000).toISOString();

test("jobs waiting for a retry time do not make /ready fail", async () => {
  const { cleanup, db, handler } = setup(2);
  try {
    addJobs(db, 50, { nextAttemptAt: inAMinute() });
    const result = await ready(handler);
    assert.equal(result.status, 200);
    assert.deepEqual(result.json.data.failed, []);
  } finally {
    cleanup();
  }
});

test("due jobs above the limit still make /ready fail, with or without a retry time that has passed", async () => {
  const { cleanup, db, handler } = setup(2);
  try {
    addJobs(db, 2);
    assert.equal((await ready(handler)).status, 200, "at the limit");
    addJobs(db, 1, { nextAttemptAt: aMinuteAgo() });
    const result = await ready(handler);
    assert.equal(result.status, 503);
    assert.deepEqual(result.json.data.failed, ["queue"]);
  } finally {
    cleanup();
  }
});

test("only the due jobs are counted when due and waiting jobs are mixed", async () => {
  const { cleanup, db, handler } = setup(3);
  try {
    addJobs(db, 3);
    addJobs(db, 100, { nextAttemptAt: inAMinute() });
    assert.equal((await ready(handler)).status, 200, "three due jobs are within the limit of three");
    addJobs(db, 1, { nextAttemptAt: aMinuteAgo() });
    assert.equal((await ready(handler)).status, 503, "four due jobs are over it");
  } finally {
    cleanup();
  }
});

test("jobs that are not queued do not count, due or not", async () => {
  const { cleanup, db, handler } = setup(1);
  try {
    addJobs(db, 5, { status: "processing" });
    addJobs(db, 5, { status: "completed" });
    addJobs(db, 5, { nextAttemptAt: inAMinute(), status: "failed" });
    assert.equal((await ready(handler)).status, 200);
  } finally {
    cleanup();
  }
});
