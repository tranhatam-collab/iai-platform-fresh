/**
 * GET /health reflects the real state of mail-api: SQLite access and queue
 * depth. 200 only when every component is fine; otherwise 503 with the names
 * of the failing components and nothing else (no paths, no error text, no counts).
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

function setup(backendOptions = {}) {
  const dbPath = `/tmp/iai-mail-api-health-${randomUUID()}.sqlite`;
  const backend = createSmtpInternalBackend({
    apiKey: "health-test-key",
    databaseUrl: `sqlite:${dbPath}`,
    ...backendOptions
  });
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  const cleanup = () => {
    try {
      backend.close();
    } catch {
      // already closed by the test
    }
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(`${dbPath}${suffix}`, { force: true });
    }
  };
  return { backend, cleanup, dbPath, handler };
}

async function health(handler, url = "/health") {
  const response = await dispatchToHandler(handler, { method: "GET", url });
  const text = await response.text();
  return { json: JSON.parse(text), status: response.status, text };
}

function enqueueJobs(dbPath, count) {
  const db = new DatabaseSync(dbPath);
  try {
    const now = new Date().toISOString();
    for (let index = 0; index < count; index += 1) {
      db.prepare(
        "INSERT INTO smtp_queue_jobs (id, message_id, workspace_id, payload_json, status, attempts, created_at, updated_at) VALUES (?, ?, ?, '{}', 'queued', 0, ?, ?);"
      ).run(`job_${index}_${randomUUID()}`, `msg_${index}`, "ws_health", now, now);
    }
  } finally {
    db.close();
  }
}

test("/health answers 200 with every component ok when SQLite and the queue are fine", async () => {
  const { cleanup, handler } = setup();
  try {
    const result = await health(handler);
    assert.equal(result.status, 200);
    assert.equal(result.json.ok, true);
    assert.equal(result.json.data.status, "ok");
    assert.deepEqual(result.json.data.failed, []);
    assert.deepEqual(result.json.data.checks, [
      { name: "database", status: "ok" },
      { name: "queue", status: "ok" }
    ]);
  } finally {
    cleanup();
  }
});

test("/health answers 503 and names database and queue when SQLite is unreachable", async () => {
  const { backend, cleanup, dbPath, handler } = setup();
  try {
    assert.equal((await health(handler)).status, 200);

    // A real failure: the database handle is gone, so every query throws.
    backend.close();

    const result = await health(handler);
    assert.equal(result.status, 503);
    assert.equal(result.json.ok, false);
    assert.equal(result.json.data.status, "unavailable");
    assert.deepEqual(result.json.data.failed, ["database", "queue"]);
    assert.deepEqual(result.json.data.checks, [
      { name: "database", status: "failed" },
      { name: "queue", status: "failed" }
    ]);

    // Nothing internal leaks: no path, no engine name, no error text, no stack.
    assert.ok(!result.text.includes(dbPath), "database path must not be exposed");
    assert.ok(!result.text.includes("/tmp/"), "no filesystem path");
    assert.doesNotMatch(result.text, /sqlite|database is not open|Error|at \S+\.(js|ts)/iu);

    // The dependencies route reports the same failure instead of crashing.
    const dependencies = await health(handler, "/v1/health/dependencies");
    assert.equal(dependencies.status, 503);
    assert.equal(dependencies.json.ok, false);
  } finally {
    cleanup();
  }
});

test("/health answers 503 naming only the queue when it is over the depth limit, and recovers", async () => {
  const { cleanup, dbPath, handler } = setup({ healthMaxQueueDepth: 2 });
  try {
    enqueueJobs(dbPath, 2);
    assert.equal((await health(handler)).status, 200, "at the limit is still healthy");

    enqueueJobs(dbPath, 1);
    const result = await health(handler);
    assert.equal(result.status, 503);
    assert.deepEqual(result.json.data.failed, ["queue"]);
    assert.deepEqual(result.json.data.checks, [
      { name: "database", status: "ok" },
      { name: "queue", status: "failed" }
    ]);
    assert.doesNotMatch(result.text, /\b3\b/u, "the queue depth is not exposed");

    const db = new DatabaseSync(dbPath);
    try {
      db.prepare("UPDATE smtp_queue_jobs SET status = 'done' WHERE id IN (SELECT id FROM smtp_queue_jobs LIMIT 1);").run();
    } finally {
      db.close();
    }
    assert.equal((await health(handler)).status, 200, "recovers once the backlog drains");
  } finally {
    cleanup();
  }
});

test("healthMaxQueueDepth is validated", () => {
  for (const bad of [-1, 1.5, Number.NaN]) {
    assert.throws(
      () => createSmtpInternalBackend({ databaseUrl: "sqlite::memory:", healthMaxQueueDepth: bad }),
      /healthMaxQueueDepth/u
    );
  }
});
