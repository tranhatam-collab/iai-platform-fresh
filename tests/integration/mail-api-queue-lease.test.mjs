/**
 * Delivery queue bookkeeping in mail-api: retry columns added by migration 0003, due-time and
 * lease handling in claimNextJob, exclusive claims, and the real attempt number on delivery attempts.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { promisify } from "node:util";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { MIGRATIONS, applyMigrations } from "../../apps/mail-api/dist/migrations.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const API_KEY = "mail-api-key-for-tests";
const WORKSPACE = "ws_queue";
const SEED = {
  blockedRecipient: "blocked@example.com",
  defaultSender: "ops@queue.example",
  password: "smtp-secret",
  primaryDomain: "queue.example",
  username: "user-queue",
  workspaceId: WORKSPACE
};

function tempDb() {
  const dbPath = `/tmp/iai-mail-api-queue-${randomUUID()}.sqlite`;
  const cleanup = () => {
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(`${dbPath}${suffix}`, { force: true });
    }
  };
  return { cleanup, dbPath, url: `sqlite:${dbPath}` };
}

/** A controllable clock for the backend. */
function clock(startIso = "2026-10-09T10:00:00.000Z") {
  let current = Date.parse(startIso);
  return {
    advanceSeconds(seconds) {
      current += seconds * 1000;
    },
    at: () => new Date(current).toISOString(),
    now: () => new Date(current)
  };
}

function openBackend(url, queue = {}) {
  return createSmtpInternalBackend({ apiKey: API_KEY, databaseUrl: url, queue: { providerAdapter: "fake", ...queue }, seed: SEED });
}

function withDb(dbPath, fn) {
  const db = new DatabaseSync(dbPath);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

async function sendMessage(backend, key) {
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  const response = await dispatchToHandler(handler, {
    body: JSON.stringify({
      from: { email: "ops@queue.example" },
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

/** Sends one message (processed inline) and puts its job back in the queue, untouched by any attempt. */
async function queuedJob(backend, dbPath, key, overrides = {}) {
  await sendMessage(backend, key);
  return withDb(dbPath, (db) => {
    const job = db.prepare("SELECT id FROM smtp_queue_jobs ORDER BY created_at DESC LIMIT 1;").get();
    db.exec("DELETE FROM delivery_attempts;");
    db.prepare(
      "UPDATE smtp_queue_jobs SET status = 'queued', attempts = 0, next_attempt_at = ?, last_error = NULL, last_error_class = NULL, updated_at = ? WHERE id = ?;"
    ).run(overrides.nextAttemptAt ?? null, "2026-10-09T09:00:00.000Z", job.id);
    if (overrides.maxAttempts !== undefined) {
      db.prepare("UPDATE smtp_queue_jobs SET max_attempts = ? WHERE id = ?;").run(overrides.maxAttempts, job.id);
    }
    return job.id;
  });
}

const jobRow = (dbPath, id) =>
  withDb(dbPath, (db) => ({ ...db.prepare("SELECT * FROM smtp_queue_jobs WHERE id = ?;").get(id) }));

test("migration 0003 adds the retry columns and index; new jobs carry the configured maximum", async () => {
  const { cleanup, dbPath, url } = tempDb();
  try {
    const backend = openBackend(url, { maxAttempts: 7 });
    await sendMessage(backend, "idem-columns");
    backend.close();
    withDb(dbPath, (db) => {
      const columns = db.prepare("PRAGMA table_info(smtp_queue_jobs);").all().map((column) => column.name);
      for (const name of ["next_attempt_at", "max_attempts", "last_error_class"]) {
        assert.ok(columns.includes(name), `${name} column`);
      }
      const index = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'idx_smtp_queue_jobs_status_next_attempt';").get();
      assert.match(index.sql, /\(status, next_attempt_at\)/u);
      const job = db.prepare("SELECT max_attempts, next_attempt_at, last_error_class FROM smtp_queue_jobs;").get();
      assert.deepEqual({ ...job }, { last_error_class: null, max_attempts: 7, next_attempt_at: null });
    });
  } finally {
    cleanup();
  }
});

test("the maximum attempts and the lease are bounded and refused outside their range", () => {
  const { cleanup, url } = tempDb();
  try {
    for (const queue of [{ maxAttempts: 0 }, { maxAttempts: 11 }, { maxAttempts: 1.5 }, { leaseSeconds: 9 }, { leaseSeconds: 3601 }]) {
      assert.throws(() => openBackend(url, queue), /must be an integer from/u, JSON.stringify(queue));
    }
    const previous = { attempts: process.env.MAIL_QUEUE_MAX_ATTEMPTS, lease: process.env.MAIL_QUEUE_LEASE_SECONDS };
    try {
      process.env.MAIL_QUEUE_MAX_ATTEMPTS = "abc";
      assert.throws(() => openBackend(url), /MAIL_QUEUE_MAX_ATTEMPTS must be an integer from 1 to 10/u);
      process.env.MAIL_QUEUE_MAX_ATTEMPTS = "3";
      process.env.MAIL_QUEUE_LEASE_SECONDS = "60";
      openBackend(url).close();
    } finally {
      for (const [name, value] of [["MAIL_QUEUE_MAX_ATTEMPTS", previous.attempts], ["MAIL_QUEUE_LEASE_SECONDS", previous.lease]]) {
        if (value === undefined) {
          delete process.env[name];
        } else {
          process.env[name] = value;
        }
      }
    }
  } finally {
    cleanup();
  }
});

test("a database from before 0003 is upgraded in place, and an older build still opens a newer database", async () => {
  const { cleanup, dbPath, url } = tempDb();
  try {
    // "Older build": only migrations 1 and 2.
    withDb(dbPath, (db) => {
      assert.deepEqual(applyMigrations(db, MIGRATIONS.slice(0, 2)).applied, [1, 2]);
      db.exec(`
        INSERT INTO messages (id, workspace_id, message_idempotency_key, stream, from_email, status, created_at, updated_at)
        VALUES ('msg_old', 'ws_queue', 'idem-old', 'transactional', 'ops@queue.example', 'queued', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z');
        INSERT INTO smtp_queue_jobs (id, message_id, workspace_id, payload_json, status, attempts, created_at, updated_at)
        VALUES ('job_old', 'msg_old', 'ws_queue', '{}', 'queued', 0, '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z');
      `);
    });

    openBackend(url).close();
    withDb(dbPath, (db) => {
      assert.deepEqual(
        db.prepare("SELECT version FROM schema_migrations ORDER BY version;").all().map((row) => row.version),
        [1, 2, 3]
      );
      const old = db.prepare("SELECT * FROM smtp_queue_jobs WHERE id = 'job_old';").get();
      assert.equal(old.status, "queued");
      assert.equal(old.max_attempts, 5, "existing rows take the default");
      assert.equal(old.next_attempt_at, null);

      // The older build ignores the new columns: its migration list reports 0003 as unknown (a warning) and its
      // inserts, which do not name the new columns, are accepted.
      const warnings = [];
      assert.deepEqual(
        applyMigrations(db, MIGRATIONS.slice(0, 2), { onWarning: (message) => warnings.push(message) }),
        { applied: [], unknownVersions: [3] }
      );
      assert.equal(warnings.length, 1);
      db.exec(`
        INSERT INTO smtp_queue_jobs (id, message_id, workspace_id, payload_json, status, attempts, created_at, updated_at)
        VALUES ('job_older_build', 'msg_old', 'ws_queue', '{}', 'queued', 0, '2026-10-02T00:00:00.000Z', '2026-10-02T00:00:00.000Z');
      `);
      assert.equal(db.prepare("SELECT max_attempts FROM smtp_queue_jobs WHERE id = 'job_older_build';").get().max_attempts, 5);
    });
    openBackend(url).close();
  } finally {
    cleanup();
  }
});

test("a job is not claimable before its next_attempt_at and is claimed once it is due", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = openBackend(url, { now: time.now });
  try {
    const id = await queuedJob(backend, dbPath, "idem-due", { nextAttemptAt: "2026-10-09T10:05:00.000Z" });
    assert.equal(backend.queue.claimNextJob(), undefined, "not due yet");
    time.advanceSeconds(299);
    assert.equal(backend.queue.claimNextJob(), undefined, "still not due");
    time.advanceSeconds(1);
    assert.deepEqual(backend.queue.claimNextJob(), { attempts: 1, id });
    assert.equal(jobRow(dbPath, id).status, "processing");
  } finally {
    backend.close();
    cleanup();
  }
});

test("when several callers race for one job exactly one claim succeeds", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const first = openBackend(url, { now: time.now });
  const second = openBackend(url, { now: time.now });
  try {
    const id = await queuedJob(first, dbPath, "idem-race");
    const claims = [];
    for (let round = 0; round < 4; round += 1) {
      claims.push(first.queue.claimNextJob(), second.queue.claimNextJob());
    }
    const won = claims.filter(Boolean);
    assert.deepEqual(won, [{ attempts: 1, id }], "only one of eight claims wins, with attempt 1");
    assert.equal(jobRow(dbPath, id).attempts, 1);
  } finally {
    first.close();
    second.close();
    cleanup();
  }
});

test("a claim not finished within the lease goes back to the queue; the next attempt is numbered 2", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = openBackend(url, { leaseSeconds: 60, now: time.now });
  try {
    const id = await queuedJob(backend, dbPath, "idem-lease");
    assert.deepEqual(backend.queue.claimNextJob(), { attempts: 1, id });

    time.advanceSeconds(59);
    assert.equal(backend.queue.claimNextJob(), undefined, "the lease has not expired");
    assert.equal(jobRow(dbPath, id).status, "processing");

    time.advanceSeconds(1);
    backend.queue.processNext(); // releases the lease, claims attempt 2 and delivers
    const row = jobRow(dbPath, id);
    assert.equal(row.status, "completed");
    assert.equal(row.attempts, 2);
    assert.equal(row.last_error_class, "lease_expired");
    withDb(dbPath, (db) => {
      const attempts = db.prepare("SELECT attempt_number, next_retry_at FROM delivery_attempts;").all().map((attempt) => ({ ...attempt }));
      assert.deepEqual(attempts, [{ attempt_number: 2, next_retry_at: null }]);
    });
  } finally {
    backend.close();
    cleanup();
  }
});

test("an expired claim with no attempts left is failed, not queued again", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = openBackend(url, { leaseSeconds: 60, maxAttempts: 2, now: time.now });
  try {
    const id = await queuedJob(backend, dbPath, "idem-exhausted", { maxAttempts: 2 });
    assert.equal(backend.queue.claimNextJob()?.attempts, 1);
    time.advanceSeconds(60);
    assert.equal(backend.queue.claimNextJob()?.attempts, 2, "second and last attempt");
    time.advanceSeconds(60);
    assert.equal(backend.queue.claimNextJob(), undefined, "no third attempt");
    const row = jobRow(dbPath, id);
    assert.equal(row.status, "failed");
    assert.equal(row.last_error, "max_attempts_exceeded");
    assert.equal(row.last_error_class, "lease_expired");
    assert.equal(row.attempts, 2);
  } finally {
    backend.close();
    cleanup();
  }
});

test("claiming reads the queue through the status and next-attempt index, not a table scan", async () => {
  const { cleanup, dbPath, url } = tempDb();
  try {
    openBackend(url).close();
    withDb(dbPath, (db) => {
      const plan = db
        .prepare(
          "EXPLAIN QUERY PLAN SELECT id FROM smtp_queue_jobs WHERE status = 'queued' AND (next_attempt_at IS NULL OR next_attempt_at <= ?) ORDER BY created_at ASC, id ASC LIMIT 1;"
        )
        .all("2026-10-09T10:00:00.000Z")
        .map((row) => row.detail);
      assert.ok(plan.every((detail) => !/^SCAN smtp_queue_jobs\b/u.test(detail)), plan.join(" | "));
      assert.ok(plan.some((detail) => /USING (COVERING )?INDEX idx_smtp_queue_jobs/u.test(detail)), plan.join(" | "));
    });
  } finally {
    cleanup();
  }
});

const run = promisify(execFile);
const CLAIMER = new URL("./support/queue-claimer.mjs", import.meta.url).pathname;

test("separate processes claiming from one table never claim a job twice", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const backend = openBackend(url);
  const JOBS = 1000;
  try {
    const template = await queuedJob(backend, dbPath, "idem-many");
    backend.close();
    withDb(dbPath, (db) => {
      db.prepare(
        `
          WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ?)
          INSERT INTO smtp_queue_jobs (id, message_id, workspace_id, payload_json, status, attempts, max_attempts, created_at, updated_at)
          SELECT 'job_many_' || printf('%05d', i), message_id, workspace_id, payload_json, 'queued', 0, max_attempts,
                 '2026-10-09T08:00:00.000Z', '2026-10-09T08:00:00.000Z'
          FROM n, (SELECT message_id, workspace_id, payload_json, max_attempts FROM smtp_queue_jobs WHERE id = ?);
        `
      ).run(JOBS, template);
      db.prepare("DELETE FROM smtp_queue_jobs WHERE id = ?;").run(template);
    });

    const startAt = String(Date.now() + 1500);
    const results = await Promise.all(
      [1, 2, 3].map(async () => JSON.parse((await run(process.execPath, [CLAIMER, url, startAt], { maxBuffer: 1024 * 1024 })).stdout))
    );

    const ids = results.flat().map((claim) => claim.id);
    assert.equal(ids.length, JOBS, "every job is claimed");
    assert.equal(new Set(ids).size, JOBS, "no job is claimed by two processes");
    assert.ok(results.every((won) => won.every((claim) => claim.attempts === 1)), "every claim is the job's first");
    assert.ok(results.filter((won) => won.length > 0).length >= 2, "the processes really overlapped");
    withDb(dbPath, (db) => {
      const rows = db.prepare("SELECT COUNT(*) AS jobs, MIN(attempts) AS lowest, MAX(attempts) AS highest FROM smtp_queue_jobs;").get();
      assert.deepEqual({ ...rows }, { highest: 1, jobs: JOBS, lowest: 1 });
    });
  } finally {
    cleanup();
  }
});

test("a job failed by an expired lease with no attempts left fails its message and records the event", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = openBackend(url, { inline: false, leaseSeconds: 60, now: time.now });
  try {
    const failing = await queuedJob(backend, dbPath, "idem-lease-fail", { maxAttempts: 1 });
    const retryable = await queuedJob(backend, dbPath, "idem-lease-retry", { maxAttempts: 3 });
    withDb(dbPath, (db) => {
      db.prepare("UPDATE smtp_queue_jobs SET created_at = ? WHERE id = ?;").run("2026-10-09T08:00:00.000Z", failing);
      db.prepare("UPDATE smtp_queue_jobs SET created_at = ? WHERE id = ?;").run("2026-10-09T08:01:00.000Z", retryable);
    });
    const messageOf = (jobId) => withDb(dbPath, (db) => db.prepare("SELECT message_id AS id FROM smtp_queue_jobs WHERE id = ?;").get(jobId).id);
    const failingMessage = messageOf(failing);
    const retryableMessage = messageOf(retryable);
    const status = (messageId) => withDb(dbPath, (db) => db.prepare("SELECT status FROM messages WHERE id = ?;").get(messageId).status);

    // Both jobs are claimed and never finished.
    assert.equal(backend.queue.claimNextJob()?.id, failing);
    assert.equal(backend.queue.claimNextJob()?.id, retryable);
    time.advanceSeconds(61);
    assert.equal(backend.queue.claimNextJob()?.id, retryable, "the job with attempts left is claimed again; the other is failed");

    assert.equal(jobRow(dbPath, failing).status, "failed");
    assert.equal(status(failingMessage), "failed");
    const events = withDb(dbPath, (db) =>
      db.prepare("SELECT event_type, payload_json FROM message_events WHERE message_id = ? AND event_type = 'failed';").all(failingMessage).map((row) => ({ ...row }))
    );
    assert.equal(events.length, 1);
    assert.deepEqual(JSON.parse(events[0].payload_json), { errorClass: "lease_expired", reason: "max_attempts_exceeded", retryable: false });
    assert.notEqual(status(retryableMessage), "failed", "a job with attempts left keeps its message");

    // No failed job may leave its message queued or processing, and the failure is recorded once.
    withDb(dbPath, (db) => {
      const stranded = db
        .prepare("SELECT j.id FROM smtp_queue_jobs j JOIN messages m ON m.id = j.message_id WHERE j.status = 'failed' AND m.status IN ('queued', 'processing');")
        .all();
      assert.deepEqual(stranded, []);
    });
    time.advanceSeconds(3600);
    backend.queue.claimNextJob();
    assert.equal(
      withDb(dbPath, (db) => db.prepare("SELECT COUNT(*) AS n FROM message_events WHERE message_id = ? AND event_type = 'failed';").get(failingMessage).n),
      1
    );
  } finally {
    backend.close();
    cleanup();
  }
});
