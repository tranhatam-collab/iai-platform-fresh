/**
 * A delivery hook or adapter that throws or rejects is a temporary failure of that attempt, not a
 * crash: the job goes back to the queue with a retry time (or fails once it has no attempts left),
 * the message is deferred, and the caller of /v1/send gets the same answer as for a deferred result.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend, openMailQueue } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const API_KEY = "mail-api-key-for-tests";
const WORKSPACE = "ws_hookerr";
const ACCEPTED = { eventType: "provider_accepted", providerMessageId: "prov_1", providerResponseCode: "250", providerResponseMessage: "ok" };
const SEED = {
  blockedRecipient: "blocked@example.com",
  defaultSender: "ops@hookerr.example",
  password: "smtp-secret",
  primaryDomain: "hookerr.example",
  username: "user-hookerr",
  workspaceId: WORKSPACE
};

function tempDb() {
  const dbPath = `/tmp/iai-mail-api-hookerr-${randomUUID()}.sqlite`;
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
      from: { email: "ops@hookerr.example" },
      message_idempotency_key: key,
      stream: "transactional",
      text: "hello",
      to: [{ email: "customer@example.com" }]
    }),
    headers: { authorization: `Bearer ${API_KEY}`, "x-workspace-id": WORKSPACE },
    method: "POST",
    url: "/v1/send"
  });
  return { body: await response.json(), status: response.status };
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
  let current = Date.parse("2026-10-09T10:00:00.000Z");
  return { advance: (seconds) => (current += seconds * 1000), now: () => new Date(current) };
};

const withCode = (message, code) => Object.assign(new Error(message), { code });

test("a hook that throws a network error defers the message instead of failing the send", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: {
      deliver: () => {
        throw new Error("socket hang up");
      },
      now: time.now,
      random: () => 0
    },
    seed: SEED
  });
  try {
    const { body, status } = await send(backend, "idem-hang-up");
    assert.equal(status, 202, "the same answer as for a deferred result, not a 500");
    assert.equal(body.data.delivery_status, "deferred");
    assert.deepEqual(query(dbPath, "SELECT status FROM messages;"), [{ status: "deferred" }]);
    const [job] = query(dbPath, "SELECT status, attempts, last_error_class, next_attempt_at FROM smtp_queue_jobs;");
    assert.deepEqual({ ...job, next_attempt_at: Boolean(job.next_attempt_at) }, { attempts: 1, last_error_class: "network_error", next_attempt_at: true, status: "queued" });
    assert.deepEqual(query(dbPath, "SELECT status, error_class FROM delivery_attempts;"), [{ error_class: "network_error", status: "deferred" }]);
    assert.deepEqual(query(dbPath, "SELECT COUNT(*) AS stuck FROM smtp_queue_jobs WHERE status = 'processing';"), [{ stuck: 0 }]);
  } finally {
    backend.close();
    cleanup();
  }
});

test("timeouts and connection errors are classified; anything else is an unknown error, also retried", async () => {
  const cases = [
    [withCode("connect ETIMEDOUT 10.0.0.1:25", "ETIMEDOUT"), "timeout"],
    [Object.assign(new Error("The operation was aborted"), { name: "AbortError" }), "timeout"],
    [withCode("read ECONNRESET", "ECONNRESET"), "network_error"],
    [withCode("connect ECONNREFUSED 127.0.0.1:25", "ECONNREFUSED"), "network_error"],
    [new Error("socket hang up"), "network_error"],
    [new Error("something nobody planned for"), "unknown_error"],
    ["a thrown string", "unknown_error"]
  ];
  for (const [thrown, expected] of cases) {
    const { cleanup, dbPath, url } = tempDb();
    const backend = createSmtpInternalBackend({
      apiKey: API_KEY,
      databaseUrl: url,
      queue: {
        deliver: () => {
          throw thrown;
        }
      },
      seed: SEED
    });
    try {
      const { status } = await send(backend, `idem-${expected}`);
      assert.equal(status, 202, String(thrown));
      assert.equal(query(dbPath, "SELECT last_error_class AS c FROM smtp_queue_jobs;")[0].c, expected, String(thrown));
    } finally {
      backend.close();
      cleanup();
    }
  }
});

test("an unknown error is retried until the attempts run out, then the message fails", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const time = clock();
  let calls = 0;
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: {
      deliver: () => {
        calls += 1;
        throw new Error("boom");
      },
      maxAttempts: 3,
      now: time.now,
      random: () => 0
    },
    seed: SEED
  });
  try {
    await send(backend, "idem-unknown");
    for (let round = 0; round < 5; round += 1) {
      time.advance(3600);
      backend.queue.processNext();
    }
    assert.equal(calls, 3, "exactly max_attempts deliveries");
    assert.deepEqual(query(dbPath, "SELECT status FROM messages;"), [{ status: "failed" }]);
    assert.deepEqual(query(dbPath, "SELECT status, attempts, last_error, last_error_class FROM smtp_queue_jobs;"), [
      { attempts: 3, last_error: "max_attempts_exceeded", last_error_class: "unknown_error", status: "failed" }
    ]);
    assert.deepEqual(query(dbPath, "SELECT status FROM delivery_attempts ORDER BY attempt_number;"), [{ status: "deferred" }, { status: "deferred" }, { status: "failed" }]);
  } finally {
    backend.close();
    cleanup();
  }
});

test("an asynchronous delivery that rejects is handled the same way and does not leave the job processing", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const backend = createSmtpInternalBackend({ apiKey: API_KEY, databaseUrl: url, queue: { inline: false, providerAdapter: "fake" }, seed: SEED });
  const handle = openMailQueue({
    databaseUrl: url,
    queue: {
      deliver: async () => {
        throw withCode("connect ETIMEDOUT", "ETIMEDOUT");
      }
    }
  });
  try {
    await send(backend, "idem-async-reject");
    assert.equal(await handle.queue.processNextAsync(), true, "the job was claimed and handled, the worker does not see an error");
    assert.deepEqual(query(dbPath, "SELECT status FROM messages;"), [{ status: "deferred" }]);
    assert.deepEqual(query(dbPath, "SELECT status, attempts, last_error_class FROM smtp_queue_jobs;"), [{ attempts: 1, last_error_class: "timeout", status: "queued" }]);
  } finally {
    handle.close();
    backend.close();
    cleanup();
  }
});

test("/v1/send answers 503 with Retry-After when the database stays busy, and works once it is free", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const backend = createSmtpInternalBackend({ apiKey: API_KEY, databaseUrl: url, queue: { providerAdapter: "fake" }, seed: SEED });
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  const request = () =>
    dispatchToHandler(handler, {
      body: JSON.stringify({
        from: { email: "ops@hookerr.example" },
        message_idempotency_key: "idem-busy",
        stream: "transactional",
        text: "hello",
        to: [{ email: "customer@example.com" }]
      }),
      headers: { authorization: `Bearer ${API_KEY}`, "x-workspace-id": WORKSPACE },
      method: "POST",
      url: "/v1/send"
    });
  const holder = new DatabaseSync(dbPath);
  try {
    holder.exec("BEGIN IMMEDIATE;"); // another writer holds the database
    const busy = await request();
    assert.equal(busy.status, 503);
    assert.match(busy.headers.get("retry-after") ?? "", /^\d+$/u);
    const body = await busy.json();
    assert.equal(body.ok, false);
    assert.equal(body.error.code, "SERVICE_BUSY");
    assert.doesNotMatch(JSON.stringify(body), /locked|sqlite/iu, "no database detail in the answer");

    holder.exec("COMMIT;");
    const retry = await request();
    assert.equal(retry.status, 202, "the same request succeeds once the database is free");
  } finally {
    holder.close();
    backend.close();
    cleanup();
  }
});

test("only the error class is stored, never the error text", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: {
      deliver: () => {
        throw withCode("connect ETIMEDOUT secret-relay.internal.example:25 for rcpt customer.private@example.org", "ETIMEDOUT");
      }
    },
    seed: SEED
  });
  try {
    await send(backend, "idem-no-error-text");
    for (const suffix of ["", "-wal"]) {
      const file = `${dbPath}${suffix}`;
      if (existsSync(file)) {
        const bytes = readFileSync(file).toString("latin1");
        assert.ok(!bytes.includes("secret-relay.internal.example"), `hostname stored in ${suffix || "db"}`);
        assert.ok(!bytes.includes("customer.private@example.org"), `address stored in ${suffix || "db"}`);
      }
    }
    assert.deepEqual(query(dbPath, "SELECT provider_response_message AS m, error_class AS c FROM delivery_attempts;"), [{ c: "timeout", m: "delivery_exception:timeout" }]);
  } finally {
    backend.close();
    cleanup();
  }
});

test("inline delivery awaits an asynchronous hook: a resolved result is recorded and a rejection is a temporary failure", async () => {
  const hooks = [
    ["async function resolving accepted", async () => ACCEPTED, 202, "provider_accepted", "completed", "accepted"],
    ["plain function returning a resolved Promise", () => Promise.resolve(ACCEPTED), 202, "provider_accepted", "completed", "accepted"],
    ["async function rejecting with a timeout", async () => { throw withCode("connect ETIMEDOUT", "ETIMEDOUT"); }, 202, "deferred", "queued", "deferred"],
    ["plain function returning a rejected Promise", () => Promise.reject(new Error("socket hang up")), 202, "deferred", "queued", "deferred"]
  ];
  for (const [name, deliver, expectedStatus, expectedDelivery, expectedJob, expectedAttempt] of hooks) {
    const { cleanup, dbPath, url } = tempDb();
    const backend = createSmtpInternalBackend({ apiKey: API_KEY, databaseUrl: url, queue: { deliver }, seed: SEED });
    try {
      const { body, status } = await send(backend, `idem-inline-${expectedDelivery}`);
      assert.equal(status, expectedStatus, name);
      assert.equal(body.data.delivery_status, expectedDelivery, name);
      assert.deepEqual(query(dbPath, "SELECT status FROM smtp_queue_jobs;"), [{ status: expectedJob }], name);
      assert.deepEqual(query(dbPath, "SELECT status FROM delivery_attempts;"), [{ status: expectedAttempt }], name);
      assert.deepEqual(query(dbPath, "SELECT COUNT(*) AS stuck FROM smtp_queue_jobs WHERE status = 'processing';"), [{ stuck: 0 }], `${name}: no job is left processing`);
    } finally {
      backend.close();
      cleanup();
    }
  }
});

test("the synchronous processNext records a Promise-returning hook when it settles, without an unhandled rejection", async () => {
  const unhandled = [];
  const listener = (reason) => unhandled.push(reason);
  process.on("unhandledRejection", listener);
  try {
    const cases = [
      ["resolves accepted", () => Promise.resolve(ACCEPTED), "completed", "accepted", "provider_accepted"],
      ["rejects with a timeout", () => Promise.reject(withCode("connect ETIMEDOUT", "ETIMEDOUT")), "queued", "deferred", "deferred"]
    ];
    for (const [name, deliver, jobStatus, attemptStatus, messageStatus] of cases) {
      const { cleanup, dbPath, url } = tempDb();
      const backend = createSmtpInternalBackend({ apiKey: API_KEY, databaseUrl: url, queue: { inline: false, providerAdapter: "fake" }, seed: SEED });
      const handle = openMailQueue({ databaseUrl: url, queue: { deliver } });
      try {
        await send(backend, `idem-sync-promise-${attemptStatus}`);
        handle.queue.processNext(); // returns at once; the result is recorded when the Promise settles
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline && query(dbPath, "SELECT status FROM smtp_queue_jobs;")[0].status === "processing") {
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        assert.deepEqual(query(dbPath, "SELECT status FROM smtp_queue_jobs;"), [{ status: jobStatus }], name);
        assert.deepEqual(query(dbPath, "SELECT status FROM delivery_attempts;"), [{ status: attemptStatus }], name);
        assert.deepEqual(query(dbPath, "SELECT status FROM messages;"), [{ status: messageStatus }], name);
      } finally {
        handle.close();
        backend.close();
        cleanup();
      }
    }

    // The store may be closed by the time the Promise settles: that is logged by class only, not thrown.
    const { cleanup, dbPath, url } = tempDb();
    const backend = createSmtpInternalBackend({ apiKey: API_KEY, databaseUrl: url, queue: { inline: false, providerAdapter: "fake" }, seed: SEED });
    let settle;
    const gate = new Promise((resolve) => (settle = resolve));
    const handle = openMailQueue({ databaseUrl: url, queue: { deliver: () => gate.then(() => ACCEPTED) } });
    const logged = [];
    const originalError = console.error;
    console.error = (line) => logged.push(String(line));
    try {
      await send(backend, "idem-sync-promise-closed");
      handle.queue.processNext();
      handle.close(); // closed before the Promise settles
      settle();
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.ok(logged.some((line) => line.includes("mail_queue_late_result_not_recorded")), "the late result is reported by class");
      assert.ok(logged.every((line) => !line.includes("database is not open") && !line.includes("customer@example.com")), "no error text is logged");
      assert.deepEqual(query(dbPath, "SELECT status FROM smtp_queue_jobs;"), [{ status: "processing" }], "the job is left to its lease");
    } finally {
      console.error = originalError;
      backend.close();
      cleanup();
    }

    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(unhandled, [], "no unhandled rejection");
  } finally {
    process.off("unhandledRejection", listener);
  }
});
