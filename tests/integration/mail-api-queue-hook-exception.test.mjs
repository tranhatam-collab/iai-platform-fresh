/**
 * A delivery hook or adapter that throws or rejects is a temporary failure of that attempt, not a
 * crash: the job goes back to the queue with a retry time (or fails once it has no attempts left),
 * the message is deferred, and the caller of /v1/send gets the same answer as for a deferred result.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend, openMailQueue } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const API_KEY = "mail-api-key-for-tests";
const WORKSPACE = "ws_hookerr";
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
