/**
 * A delivery hook that never settles does not hang the send path or hold a job until its lease runs out: after
 * the delivery timeout the attempt is a temporary failure with class `timeout` and the job is retried later.
 * A hook that settles after that, or after its job was claimed again, is not recorded.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend, resolveQueueSettings } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const API_KEY = "mail-api-key-for-tests";
const WORKSPACE = "ws_hooktimeout";
const ACCEPTED = { eventType: "provider_accepted", providerMessageId: "prov_1", providerResponseCode: "250", providerResponseMessage: "ok" };
const SEED = {
  blockedRecipient: "blocked@example.com",
  defaultSender: "ops@hooktimeout.example",
  password: "smtp-secret",
  primaryDomain: "hooktimeout.example",
  username: "user-hooktimeout",
  workspaceId: WORKSPACE
};

function tempDb() {
  const dbPath = `/tmp/iai-mail-api-hooktimeout-${randomUUID()}.sqlite`;
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

const query = (dbPath, sql) => {
  const db = new DatabaseSync(dbPath);
  try {
    return db.prepare(sql).all().map((row) => ({ ...row }));
  } finally {
    db.close();
  }
};

const clock = () => {
  let current = Date.parse("2026-10-12T10:00:00.000Z");
  return { advance: (seconds) => (current += seconds * 1000), now: () => new Date(current) };
};

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
};

function send(backend, key) {
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  return dispatchToHandler(handler, {
    body: JSON.stringify({
      from: { email: "ops@hooktimeout.example" },
      message_idempotency_key: key,
      stream: "transactional",
      text: "hello",
      to: [{ email: "customer@example.com" }]
    }),
    headers: { authorization: `Bearer ${API_KEY}`, "x-workspace-id": WORKSPACE },
    method: "POST",
    url: "/v1/send"
  });
}

function captureErrors() {
  const original = console.error;
  const lines = [];
  console.error = (line) => lines.push(String(line));
  return { lines, restore: () => (console.error = original) };
}

const within = (promise, ms, label) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`${label}: still waiting after ${ms} ms`)), ms))]);

test("an inline send with a hook that never settles answers 202 deferred after the timeout", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: { deliver: () => new Promise(() => {}), deliveryTimeoutSeconds: 0.05, now: time.now, random: () => 0 },
    seed: SEED
  });
  try {
    const response = await within(send(backend, "idem-never"), 3000, "inline send");
    assert.equal(response.status, 202);
    assert.equal((await response.json()).data.delivery_status, "deferred");
    const [job] = query(dbPath, "SELECT status, attempts, last_error_class, next_attempt_at FROM smtp_queue_jobs;");
    assert.deepEqual({ ...job, next_attempt_at: Boolean(job.next_attempt_at) }, { attempts: 1, last_error_class: "timeout", next_attempt_at: true, status: "queued" });
    assert.deepEqual(query(dbPath, "SELECT status, error_class FROM delivery_attempts;"), [{ error_class: "timeout", status: "deferred" }]);
    assert.deepEqual(query(dbPath, "SELECT status FROM messages;"), [{ status: "deferred" }]);
  } finally {
    backend.close();
    cleanup();
  }
});

test("a worker's claim with a hook that never settles returns to the queue with backoff after the timeout", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: { deliver: () => new Promise(() => {}), deliveryTimeoutSeconds: 0.05, inline: false, now: time.now, random: () => 0 },
    seed: SEED
  });
  try {
    assert.equal((await send(backend, "idem-worker")).status, 202);
    const started = Date.now();
    assert.equal(await within(backend.queue.processNextAsync(), 3000, "processNextAsync"), true);
    assert.ok(Date.now() - started < 2000);
    const [job] = query(dbPath, "SELECT status, last_error_class, next_attempt_at FROM smtp_queue_jobs;");
    assert.equal(job.status, "queued");
    assert.equal(job.last_error_class, "timeout");
    assert.ok(Date.parse(job.next_attempt_at) > time.now().getTime(), "not claimable before the retry time");
    assert.equal(backend.queue.claimNextJob(), undefined);
  } finally {
    backend.close();
    cleanup();
  }
});

test("a hook that settles after its timeout is not recorded", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const slow = deferred();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: { deliver: () => slow.promise, deliveryTimeoutSeconds: 0.05, inline: false, now: time.now, random: () => 0 },
    seed: SEED
  });
  const errors = captureErrors();
  try {
    await send(backend, "idem-late-after-timeout");
    await within(backend.queue.processNextAsync(), 3000, "processNextAsync");
    slow.resolve(ACCEPTED);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual(query(dbPath, "SELECT status FROM delivery_attempts;"), [{ status: "deferred" }], "only the timeout attempt is recorded");
    assert.deepEqual(query(dbPath, "SELECT status FROM messages;"), [{ status: "deferred" }]);
    assert.deepEqual(query(dbPath, "SELECT status, last_error_class FROM smtp_queue_jobs;"), [{ last_error_class: "timeout", status: "queued" }]);
    const logged = errors.lines.map((line) => JSON.parse(line)).filter((entry) => entry.msg === "mail_queue_late_delivery_result_ignored");
    assert.equal(logged.length, 1);
    assert.equal(logged[0].settledAs, "result");
    assert.deepEqual(Object.keys(logged[0]).sort(), ["jobId", "level", "msg", "settledAs", "ts"], "no addresses or message text in the log");
  } finally {
    errors.restore();
    backend.close();
    cleanup();
  }
});

test("a result that arrives after the lease expired and the job was claimed again is dropped and logged", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const first = deferred();
  let calls = 0;
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: {
      deliver: () => {
        calls += 1;
        return calls === 1 ? first.promise : ACCEPTED;
      },
      deliveryTimeoutSeconds: 9,
      inline: false,
      leaseSeconds: 10,
      now: time.now,
      random: () => 0
    },
    seed: SEED
  });
  const errors = captureErrors();
  try {
    await send(backend, "idem-lease");
    const firstRun = backend.queue.processNextAsync();
    await new Promise((resolve) => setTimeout(resolve, 10));
    time.advance(11);
    assert.equal(await backend.queue.processNextAsync(), true, "the expired claim is taken again");
    assert.deepEqual(query(dbPath, "SELECT status, attempts FROM smtp_queue_jobs;"), [{ attempts: 2, status: "completed" }]);

    first.resolve({ eventType: "failed", errorClass: "from_the_old_claim", providerResponseCode: "550", providerResponseMessage: "old" });
    await within(firstRun, 3000, "first run");
    assert.deepEqual(query(dbPath, "SELECT status FROM smtp_queue_jobs;"), [{ status: "completed" }], "the newer claim's outcome stands");
    assert.deepEqual(query(dbPath, "SELECT status, attempt_number FROM delivery_attempts;"), [{ attempt_number: 2, status: "accepted" }]);
    assert.deepEqual(query(dbPath, "SELECT status FROM messages;"), [{ status: "provider_accepted" }]);
    const dropped = errors.lines.map((line) => JSON.parse(line)).filter((entry) => entry.msg === "mail_queue_late_result_dropped");
    assert.equal(dropped.length, 1);
    assert.equal(dropped[0].errorClass, "from_the_old_claim");
    assert.deepEqual(Object.keys(dropped[0]).sort(), ["errorClass", "jobId", "level", "msg", "ts"]);
  } finally {
    errors.restore();
    backend.close();
    cleanup();
  }
});

test("a hook that settles within the timeout is recorded as before", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: { deliver: async () => ACCEPTED, deliveryTimeoutSeconds: 5 },
    seed: SEED
  });
  try {
    const response = await send(backend, "idem-fast");
    assert.equal((await response.json()).data.delivery_status, "provider_accepted");
    assert.deepEqual(query(dbPath, "SELECT status FROM smtp_queue_jobs;"), [{ status: "completed" }]);
  } finally {
    backend.close();
    cleanup();
  }
});

test("the delivery timeout must be a positive number smaller than the lease", () => {
  const settings = (queue, env = {}) => resolveQueueSettings(queue, env);
  assert.equal(settings({}).deliveryTimeoutMs, 60_000, "default");
  assert.equal(settings({ leaseSeconds: 30 }).deliveryTimeoutMs, 29_000, "default is capped below a short lease");
  assert.equal(settings({ deliveryTimeoutSeconds: 12 }).deliveryTimeoutMs, 12_000);
  assert.equal(settings({}, { MAIL_QUEUE_DELIVERY_TIMEOUT_SECONDS: "45" }).deliveryTimeoutMs, 45_000);
  for (const bad of [0, -1, Number.NaN, 300, 301]) {
    assert.throws(() => settings({ deliveryTimeoutSeconds: bad }), /deliveryTimeoutSeconds/, String(bad));
  }
  for (const bad of ["abc", "0", "-5", "300", "1e2"]) {
    assert.throws(() => settings({}, { MAIL_QUEUE_DELIVERY_TIMEOUT_SECONDS: bad }), /MAIL_QUEUE_DELIVERY_TIMEOUT_SECONDS/, bad);
  }
  assert.throws(() => settings({ leaseSeconds: 20, deliveryTimeoutSeconds: 20 }), /smaller than the lease/);
});
