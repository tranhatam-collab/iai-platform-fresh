/**
 * Worker side of the delivery queue: MAIL_QUEUE_INLINE, asynchronous delivery, and the worker loop
 * (concurrency, idle pause, graceful stop).
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend, openMailQueue, resolveQueueSettings } from "../../apps/mail-api/dist/smtp-internal.js";
import { runQueueWorker } from "../../apps/mail-api/dist/queue-worker.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const API_KEY = "mail-api-key-for-tests";
const WORKSPACE = "ws_worker";
const SEED = {
  blockedRecipient: "blocked@example.com",
  defaultSender: "ops@worker.example",
  password: "smtp-secret",
  primaryDomain: "worker.example",
  username: "user-worker",
  workspaceId: WORKSPACE
};
const ACCEPTED = { eventType: "provider_accepted", providerMessageId: "prov", providerResponseCode: "250", providerResponseMessage: "ok" };

function tempDb() {
  const dbPath = `/tmp/iai-mail-api-worker-${randomUUID()}.sqlite`;
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
      from: { email: "ops@worker.example" },
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

test("with MAIL_QUEUE_INLINE off a send only queues; a worker delivers it, also with an asynchronous hook", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const backend = createSmtpInternalBackend({ apiKey: API_KEY, databaseUrl: url, queue: { inline: false, providerAdapter: "fake" }, seed: SEED });
  let handle;
  try {
    const data = await send(backend, "idem-worker");
    assert.equal(data.delivery_status, "queued", "nothing delivered it yet");
    assert.deepEqual(query(dbPath, "SELECT status FROM smtp_queue_jobs;"), [{ status: "queued" }]);
    assert.deepEqual(query(dbPath, "SELECT status FROM messages;"), [{ status: "queued" }]);

    let calls = 0;
    handle = openMailQueue({
      databaseUrl: url,
      queue: {
        deliver: async () => {
          calls += 1;
          await new Promise((resolve) => setTimeout(resolve, 20));
          return ACCEPTED;
        }
      }
    });
    assert.equal(await handle.queue.processNextAsync(), true);
    assert.equal(await handle.queue.processNextAsync(), false, "the queue is empty");
    assert.equal(calls, 1);
    assert.deepEqual(query(dbPath, "SELECT status FROM messages;"), [{ status: "provider_accepted" }]);
    assert.deepEqual(query(dbPath, "SELECT attempt_number, status FROM delivery_attempts;"), [{ attempt_number: 1, status: "accepted" }]);
  } finally {
    handle?.close();
    backend.close();
    cleanup();
  }
});

test("inline processing stays the default and the flag is validated", () => {
  assert.equal(resolveQueueSettings({}, {}).inline, true);
  for (const [raw, expected] of [["1", true], ["true", true], ["0", false], ["FALSE", false]]) {
    assert.equal(resolveQueueSettings({}, { MAIL_QUEUE_INLINE: raw }).inline, expected, raw);
  }
  assert.equal(resolveQueueSettings({ inline: false }, { MAIL_QUEUE_INLINE: "1" }).inline, false, "the option wins");
  assert.throws(() => resolveQueueSettings({}, { MAIL_QUEUE_INLINE: "maybe" }), /MAIL_QUEUE_INLINE must be 1, 0, true or false/u);
});

test("a synchronous processNext refuses an asynchronous hook instead of dropping its result", async () => {
  const { cleanup, url } = tempDb();
  const handle = openMailQueue({ databaseUrl: url, queue: { deliver: async () => ACCEPTED } });
  const backend = createSmtpInternalBackend({ apiKey: API_KEY, databaseUrl: url, queue: { inline: false }, seed: SEED });
  try {
    await send(backend, "idem-async-sync");
    assert.throws(() => handle.queue.processNext(), /use processNextAsync/u);
  } finally {
    handle.close();
    backend.close();
    cleanup();
  }
});

/** A queue stub that hands out `jobs` jobs, each delivery taking `ms`, recording the overlap. */
function stubQueue(jobs, ms) {
  let remaining = jobs;
  const stats = { done: 0, inFlight: 0, maxInFlight: 0 };
  return {
    queue: {
      claimNextJob: () => undefined,
      processNext: () => {},
      processNextAsync: async () => {
        if (remaining === 0) {
          return false;
        }
        remaining -= 1;
        stats.inFlight += 1;
        stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight);
        await new Promise((resolve) => setTimeout(resolve, ms));
        stats.inFlight -= 1;
        stats.done += 1;
        return true;
      }
    },
    stats
  };
}

test("the worker runs at most `concurrency` deliveries at a time and pauses only when the queue is empty", async () => {
  const stop = new AbortController();
  const { queue, stats } = stubQueue(12, 15);
  const sleeps = [];
  await runQueueWorker({
    concurrency: 3,
    pollMs: 7000,
    queue,
    signal: stop.signal,
    sleep: async (ms) => {
      sleeps.push(ms);
      await new Promise((resolve) => setTimeout(resolve, 1)); // a real pause, so timers get to run
      if (stats.done === 12) {
        stop.abort();
      }
    }
  });
  assert.equal(stats.done, 12);
  assert.equal(stats.maxInFlight, 3);
  assert.ok(sleeps.length > 0 && sleeps.every((ms) => ms === 7000), "it pauses for the poll interval when idle");
});

test("stopping lets deliveries in progress finish and claims nothing new", async () => {
  const stop = new AbortController();
  const { queue, stats } = stubQueue(100, 40);
  const running = runQueueWorker({ concurrency: 4, pollMs: 1000, queue, signal: stop.signal });
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(stats.inFlight, 4);
  stop.abort();
  await running;
  assert.equal(stats.inFlight, 0, "in-flight deliveries completed before the worker returned");
  assert.equal(stats.done, 4, "no job was started after the stop");
});

test("an error from one delivery is reported and the worker keeps going", async () => {
  const stop = new AbortController();
  let calls = 0;
  const errors = [];
  await runQueueWorker({
    concurrency: 1,
    onError: (error) => errors.push(error.message),
    pollMs: 1,
    queue: {
      claimNextJob: () => undefined,
      processNext: () => {},
      processNextAsync: async () => {
        calls += 1;
        if (calls === 1) {
          throw new Error("boom");
        }
        if (calls === 3) {
          stop.abort();
        }
        return calls < 3;
      }
    },
    signal: stop.signal
  });
  assert.deepEqual(errors, ["boom"]);
  assert.equal(calls, 3);
});
