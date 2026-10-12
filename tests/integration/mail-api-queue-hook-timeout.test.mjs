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

const OLD_CLAIM_RESULTS = [
  ["failed", { errorClass: "from_the_old_claim", eventType: "failed", providerResponseCode: "550", providerResponseMessage: "old" }],
  ["deferred", { errorClass: "from_the_old_claim", eventType: "deferred", providerResponseCode: "451", providerResponseMessage: "old" }],
  ["provider_accepted", { eventType: "provider_accepted", providerMessageId: "prov_old", providerResponseCode: "250", providerResponseMessage: "old" }]
];

async function lateResultAfterReclaim(oldResult, key) {
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
    await send(backend, key);
    const firstRun = backend.queue.processNextAsync();
    await new Promise((resolve) => setTimeout(resolve, 10));
    time.advance(11);
    assert.equal(await backend.queue.processNextAsync(), true, "the expired claim is taken again");
    assert.deepEqual(query(dbPath, "SELECT status, attempts FROM smtp_queue_jobs;"), [{ attempts: 2, status: "completed" }]);

    first.resolve(oldResult);
    await within(firstRun, 3000, "first run");
    assert.deepEqual(query(dbPath, "SELECT status, attempts FROM smtp_queue_jobs;"), [{ attempts: 2, status: "completed" }], "the newer claim's outcome stands");
    assert.deepEqual(query(dbPath, "SELECT status, attempt_number FROM delivery_attempts;"), [{ attempt_number: 2, status: "accepted" }]);
    assert.deepEqual(query(dbPath, "SELECT status FROM messages;"), [{ status: "provider_accepted" }]);
    return errors.lines.map((line) => JSON.parse(line)).filter((entry) => entry.msg === "mail_queue_late_result_dropped");
  } finally {
    errors.restore();
    backend.close();
    cleanup();
  }
}

for (const [kind, oldResult] of OLD_CLAIM_RESULTS) {
  test(`a ${kind} result that arrives after the lease expired and the job was claimed again is dropped and logged`, async () => {
    const dropped = await lateResultAfterReclaim(oldResult, `idem-lease-${kind}`);
    assert.equal(dropped.length, 1);
    assert.equal(dropped[0].errorClass, oldResult.errorClass ?? oldResult.eventType);
    assert.deepEqual(Object.keys(dropped[0]).sort(), ["errorClass", "jobId", "level", "msg", "ts"]);
  });
}

test("the logged error class of a dropped result is limited to a short safe pattern", async () => {
  const text = "failed for customer@example.com";
  const dropped = await lateResultAfterReclaim({ errorClass: text, eventType: "failed", providerResponseCode: "550", providerResponseMessage: text }, "idem-lease-text");
  assert.equal(dropped.length, 1);
  assert.equal(dropped[0].errorClass, "unknown");
  assert.ok(!JSON.stringify(dropped[0]).includes("customer@example.com"));
  const long = await lateResultAfterReclaim({ errorClass: "a".repeat(65), eventType: "failed", providerResponseCode: "550", providerResponseMessage: "x" }, "idem-lease-long");
  assert.equal(long[0].errorClass, "unknown");
  const edge = await lateResultAfterReclaim({ errorClass: "a".repeat(64), eventType: "failed", providerResponseCode: "550", providerResponseMessage: "x" }, "idem-lease-edge");
  assert.equal(edge[0].errorClass, "a".repeat(64));
});

test("a hook that returns a Promise to the synchronous caller times out too", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: { deliver: () => new Promise(() => {}), deliveryTimeoutSeconds: 0.05, inline: false, now: time.now, random: () => 0 },
    seed: SEED
  });
  try {
    await send(backend, "idem-sync-path");
    backend.queue.processNext();
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline && query(dbPath, "SELECT status FROM smtp_queue_jobs;")[0].status === "processing") {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    const [job] = query(dbPath, "SELECT status, last_error_class FROM smtp_queue_jobs;");
    assert.deepEqual({ ...job }, { last_error_class: "timeout", status: "queued" });
    assert.deepEqual(query(dbPath, "SELECT status, error_class FROM delivery_attempts;"), [{ error_class: "timeout", status: "deferred" }]);
  } finally {
    backend.close();
    cleanup();
  }
});

test("a hook that rejects before or after its timeout leaves no unhandled rejection", async () => {
  const unhandled = [];
  const listener = (reason) => unhandled.push(reason);
  process.on("unhandledRejection", listener);
  const errors = captureErrors();
  try {
    for (const [name, rejectAfterTimeout] of [["early", false], ["late", true]]) {
      const { cleanup, dbPath, url } = tempDb();
      const time = clock();
      const hook = deferred();
      const backend = createSmtpInternalBackend({
        apiKey: API_KEY,
        databaseUrl: url,
        queue: {
          deliver: () => (rejectAfterTimeout ? hook.promise : Promise.reject(new Error("socket hang up for customer@example.com"))),
          deliveryTimeoutSeconds: 0.05,
          inline: false,
          now: time.now,
          random: () => 0
        },
        seed: SEED
      });
      try {
        await send(backend, `idem-reject-${name}`);
        await within(backend.queue.processNextAsync(), 3000, "processNextAsync");
        if (rejectAfterTimeout) {
          hook.reject(new Error("rejected after the timeout for customer@example.com"));
        }
        // Rejections are reported once the microtask queue and the next turn of the event loop have run.
        await new Promise((resolve) => setImmediate(resolve));
        await new Promise((resolve) => setTimeout(resolve, 30));
        assert.deepEqual(unhandled, [], `${name} rejection`);
        assert.equal(query(dbPath, "SELECT COUNT(*) AS attempts FROM delivery_attempts;")[0].attempts, 1);
      } finally {
        backend.close();
        cleanup();
      }
    }
    assert.ok(!errors.lines.join("\n").includes("customer@example.com"), "no address reaches the log");
  } finally {
    errors.restore();
    process.off("unhandledRejection", listener);
  }
});

test("no timer is left running after a hook that settles within its timeout", async () => {
  const { cleanup, url } = tempDb();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: { deliver: async () => ACCEPTED, deliveryTimeoutSeconds: 30 },
    seed: SEED
  });
  try {
    const timers = () => process.getActiveResourcesInfo().filter((name) => name === "Timeout").length;
    const before = timers();
    await send(backend, "idem-timers");
    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(timers() <= before, `a 30 second delivery timer is still pending (${before} before, ${timers()} after)`);
  } finally {
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
  // Edges: a tiny value is raised to 1 ms, and a value that rounds up to the lease is refused.
  assert.equal(settings({ deliveryTimeoutSeconds: 0.0004 }).deliveryTimeoutMs, 1);
  assert.equal(settings({}, { MAIL_QUEUE_DELIVERY_TIMEOUT_SECONDS: "0.0001" }).deliveryTimeoutMs, 1);
  assert.equal(settings({ leaseSeconds: 10, deliveryTimeoutSeconds: 9.9994 }).deliveryTimeoutMs, 9999);
  assert.throws(() => settings({ leaseSeconds: 10, deliveryTimeoutSeconds: 9.9996 }), /smaller than the lease/);
});
