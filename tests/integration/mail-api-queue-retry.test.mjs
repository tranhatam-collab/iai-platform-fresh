/**
 * Retry behaviour of the mail-api delivery queue: backoff with jitter, deferred and failed results,
 * and the attempt limit. Deliveries are scripted through the queue's delivery hook; time and
 * randomness are injected so every value is exact.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { computeBackoffDelayMs, createSmtpInternalBackend, resolveQueueSettings } from "../../apps/mail-api/dist/smtp-internal.js";
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


const DEFERRED = { errorClass: "mailbox_busy", eventType: "deferred", providerResponseCode: "451", providerResponseMessage: "try again later" };
const ACCEPTED = { eventType: "provider_accepted", providerMessageId: "prov_1", providerResponseCode: "250", providerResponseMessage: "ok" };
const REJECTED = { errorClass: "mailbox_unknown", eventType: "failed", providerResponseCode: "550", providerResponseMessage: "no such user" };

/** A delivery hook that answers from a list, repeating the last answer, and records its inputs. */
function scripted(results) {
  const calls = [];
  const deliver = (input) => {
    calls.push(input);
    return results[Math.min(calls.length - 1, results.length - 1)];
  };
  // The send itself is delivered inline once; queuedJob() puts the job back, so start counting there.
  return { calls, deliver, reset: () => calls.splice(0) };
}

const iso = (ms) => new Date(ms).toISOString();

const events = (dbPath, type) =>
  withDb(dbPath, (db) =>
    db
      .prepare("SELECT payload_json FROM message_events WHERE event_type = ? ORDER BY occurred_at, id;")
      .all(type)
      .map((row) => JSON.parse(row.payload_json))
  );
const attempts = (dbPath) =>
  withDb(dbPath, (db) =>
    db
      .prepare("SELECT attempt_number, status, error_class, provider_response_code, next_retry_at FROM delivery_attempts ORDER BY attempt_number;")
      .all()
      .map((row) => ({ ...row }))
  );
const messageStatus = (dbPath) => withDb(dbPath, (db) => db.prepare("SELECT status FROM messages;").get().status);

test("backoff table: min(base x 2^(attempt-1), cap) plus up to 20 percent jitter", () => {
  const none = () => 0;
  const nearlyOne = () => 0.999999;
  const waits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 40].map((attempt) => computeBackoffDelayMs(attempt, 30, 3600, none) / 1000);
  assert.deepEqual(waits, [30, 60, 120, 240, 480, 960, 1920, 3600, 3600, 3600]);
  assert.equal(computeBackoffDelayMs(1, 30, 3600, () => 0.5), 33000);
  assert.equal(computeBackoffDelayMs(3, 30, 3600, () => 0.5), 132000);
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const base = computeBackoffDelayMs(attempt, 30, 3600, none);
    const top = computeBackoffDelayMs(attempt, 30, 3600, nearlyOne);
    assert.ok(top > base && top <= base * 1.2, `attempt ${attempt}: ${base}..${top}`);
  }
  assert.equal(computeBackoffDelayMs(8, 30, 3600, nearlyOne) <= 3600 * 1.2 * 1000, true, "the cap applies before jitter");
});

test("backoff settings default to 30s and 1h and are clamped, not refused, outside their range", () => {
  const settings = (input, env = {}) => resolveQueueSettings(input, env);
  const pick = (value) => ({ base: value.backoffBaseSeconds, cap: value.backoffCapSeconds });
  assert.deepEqual(pick(settings({})), { base: 30, cap: 3600 });
  assert.deepEqual(pick(settings({ backoffBaseSeconds: 0, backoffCapSeconds: 1 })), { base: 1, cap: 10 });
  assert.deepEqual(pick(settings({ backoffBaseSeconds: 99999, backoffCapSeconds: 999999 })), { base: 3600, cap: 86400 });
  assert.deepEqual(pick(settings({ backoffBaseSeconds: 600, backoffCapSeconds: 60 })), { base: 600, cap: 600 }, "the cap is never below the base");
  assert.deepEqual(
    pick(settings({}, { MAIL_QUEUE_BACKOFF_BASE_SECONDS: "5", MAIL_QUEUE_BACKOFF_CAP_SECONDS: "120" })),
    { base: 5, cap: 120 }
  );
  assert.throws(() => settings({}, { MAIL_QUEUE_BACKOFF_BASE_SECONDS: "soon" }), /MAIL_QUEUE_BACKOFF_BASE_SECONDS must be a whole number/u);
});

test("a retryable result defers the message with a retry time; the job is claimable again only when due, then accepted", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const script = scripted([DEFERRED, DEFERRED, ACCEPTED]);
  const backend = openBackend(url, { backoffBaseSeconds: 30, deliver: script.deliver, now: time.now, random: () => 0.5 });
  try {
    const id = await queuedJob(backend, dbPath, "idem-defer");
    script.reset();
    const start = Date.parse(time.at());

    backend.queue.processNext();
    assert.equal(messageStatus(dbPath), "deferred");
    let row = jobRow(dbPath, id);
    assert.equal(row.status, "queued");
    assert.equal(row.next_attempt_at, iso(start + 33000), "30s plus half of the 20 percent jitter");
    assert.equal(row.last_error_class, "mailbox_busy");
    assert.deepEqual(attempts(dbPath), [
      { attempt_number: 1, error_class: "mailbox_busy", next_retry_at: iso(start + 33000), provider_response_code: "451", status: "deferred" }
    ]);
    const [deferred] = events(dbPath, "deferred");
    assert.equal(deferred.nextAttemptAt, iso(start + 33000));
    assert.equal(deferred.retryable, true);
    assert.equal(deferred.errorClass, "mailbox_busy");

    time.advanceSeconds(32);
    assert.equal(backend.queue.claimNextJob(), undefined, "not due yet");
    time.advanceSeconds(1);
    backend.queue.processNext();
    row = jobRow(dbPath, id);
    assert.equal(row.status, "queued");
    assert.equal(row.attempts, 2);
    assert.equal(row.next_attempt_at, iso(start + 33000 + 66000), "the wait doubles");

    time.advanceSeconds(66);
    backend.queue.processNext();
    assert.equal(messageStatus(dbPath), "provider_accepted");
    assert.equal(jobRow(dbPath, id).status, "completed");
    assert.deepEqual(
      attempts(dbPath).map((attempt) => [attempt.attempt_number, attempt.status]),
      [[1, "deferred"], [2, "deferred"], [3, "accepted"]]
    );
    assert.deepEqual(script.calls.map((call) => call.attempt), [1, 2, 3]);
    assert.equal(backend.queue.claimNextJob(), undefined);
  } finally {
    backend.close();
    cleanup();
  }
});

test("a non-retryable result fails the message with the provider's code and class, and is not retried", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const script = scripted([REJECTED]);
  const backend = openBackend(url, { deliver: script.deliver, now: time.now });
  try {
    const id = await queuedJob(backend, dbPath, "idem-reject");
    script.reset();
    backend.queue.processNext();
    assert.equal(messageStatus(dbPath), "failed");
    const row = jobRow(dbPath, id);
    assert.equal(row.status, "failed");
    assert.equal(row.last_error_class, "mailbox_unknown");
    assert.equal(row.next_attempt_at, null);
    assert.deepEqual(attempts(dbPath), [
      { attempt_number: 1, error_class: "mailbox_unknown", next_retry_at: null, provider_response_code: "550", status: "failed" }
    ]);
    const [failed] = events(dbPath, "failed");
    assert.equal(failed.providerResponseCode, "550");
    assert.equal(failed.errorClass, "mailbox_unknown");
    assert.equal(failed.retryable, false);

    time.advanceSeconds(86400);
    assert.equal(backend.queue.claimNextJob(), undefined);
    assert.equal(script.calls.length, 1);
  } finally {
    backend.close();
    cleanup();
  }
});

test("a job that is still retryable on its last attempt fails with max_attempts_exceeded; there is no endless retry", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const script = scripted([DEFERRED]);
  const backend = openBackend(url, { deliver: script.deliver, maxAttempts: 3, now: time.now, random: () => 0 });
  try {
    const id = await queuedJob(backend, dbPath, "idem-max");
    script.reset();
    const deferredBefore = events(dbPath, "deferred").length; // the inline send above was deferred too
    for (let round = 0; round < 3; round += 1) {
      backend.queue.processNext();
      time.advanceSeconds(3600);
    }

    assert.equal(script.calls.length, 3, "exactly max_attempts deliveries");
    assert.equal(messageStatus(dbPath), "failed");
    const row = jobRow(dbPath, id);
    assert.equal(row.status, "failed");
    assert.equal(row.attempts, 3);
    assert.equal(row.last_error, "max_attempts_exceeded");
    assert.equal(row.last_error_class, "mailbox_busy", "the provider's class is kept");
    assert.deepEqual(
      attempts(dbPath).map((attempt) => [attempt.attempt_number, attempt.status, attempt.next_retry_at === null]),
      [[1, "deferred", false], [2, "deferred", false], [3, "failed", true]]
    );
    const [failed] = events(dbPath, "failed");
    assert.equal(failed.reason, "max_attempts_exceeded");
    assert.equal(failed.retryable, false);
    assert.equal(events(dbPath, "deferred").length - deferredBefore, 2);

    time.advanceSeconds(86400);
    backend.queue.processNext();
    assert.equal(script.calls.length, 3, "nothing is claimed after the limit");
  } finally {
    backend.close();
    cleanup();
  }
});

test("a job queued with a lower maximum uses its own limit", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const script = scripted([DEFERRED]);
  const backend = openBackend(url, { deliver: script.deliver, maxAttempts: 5, now: time.now });
  try {
    const id = await queuedJob(backend, dbPath, "idem-own-max", { maxAttempts: 1 });
    script.reset();
    backend.queue.processNext();
    assert.equal(jobRow(dbPath, id).status, "failed");
    assert.equal(jobRow(dbPath, id).last_error, "max_attempts_exceeded");
    assert.equal(script.calls.length, 1);
  } finally {
    backend.close();
    cleanup();
  }
});

test("a worker that finishes after its lease expired and the job was claimed again records nothing", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  let second;
  let slowCalls = 0;
  let armed = false;
  const slow = () => {
    if (!armed) {
      return ACCEPTED; // the inline delivery of the send used to create the job
    }
    slowCalls += 1;
    // While this delivery runs, the lease runs out and another worker takes the job.
    time.advanceSeconds(61);
    assert.deepEqual(second.queue.claimNextJob(), { attempts: 2, id: stolenId });
    return ACCEPTED;
  };
  const first = openBackend(url, { deliver: slow, leaseSeconds: 60, now: time.now });
  second = openBackend(url, { leaseSeconds: 60, now: time.now });
  let stolenId;
  try {
    stolenId = await queuedJob(first, dbPath, "idem-late");
    armed = true;
    const attemptsBefore = attempts(dbPath).length;
    first.queue.processNext();
    assert.equal(slowCalls, 1);
    const row = jobRow(dbPath, stolenId);
    assert.equal(row.status, "processing", "the newer claim is untouched");
    assert.equal(row.attempts, 2);
    assert.equal(attempts(dbPath).length, attemptsBefore, "the late worker wrote no attempt");
  } finally {
    first.close();
    second.close();
    cleanup();
  }
});
