/**
 * /v1/messages and /v1/suppressions read the SQLite data that /v1/send writes
 * and that send-time suppression checks read, instead of sample data.
 *
 * Covers: a sent message appears in the list with the existing filters and
 * paging, workspaces are isolated, a suppression row blocks a send and is
 * listed, persisted reads need the API key, and the sample data is only served
 * with an explicit demo flag.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createMailMessageSource } from "../../packages/mail-core/dist/index.js";
import { buildServerOptionsFromEnv } from "../../apps/mail-api/dist/bootstrap.js";
import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const API_KEY = "mail-api-key-for-tests";
const WORKSPACE = "ws_lists";
const OTHER_WORKSPACE = "ws_lists_other";
const BLOCKED = "blocked@example.com";
const seed = (workspaceId, username) => ({
  blockedRecipient: BLOCKED,
  defaultSender: "ops@lists.example",
  password: "smtp-secret",
  primaryDomain: "lists.example",
  username,
  workspaceId
});

function setup(workspaceId = WORKSPACE) {
  const dbPath = `/tmp/iai-mail-api-lists-${randomUUID()}.sqlite`;
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: `sqlite:${dbPath}`,
    seed: seed(workspaceId, `user-${workspaceId}`)
  });
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  const cleanup = () => {
    backend.close();
    rmSync(dbPath, { force: true });
    rmSync(`${dbPath}-wal`, { force: true });
    rmSync(`${dbPath}-shm`, { force: true });
  };
  return { backend, cleanup, dbPath, handler };
}

const auth = (workspaceId = WORKSPACE) => ({ authorization: `Bearer ${API_KEY}`, "x-workspace-id": workspaceId });

function send(handler, overrides = {}, workspaceId = WORKSPACE) {
  return dispatchToHandler(handler, {
    body: JSON.stringify({
      from: { email: "ops@lists.example" },
      message_idempotency_key: `idem-${randomUUID()}`,
      stream: "transactional",
      subject: "List me",
      text: "hello",
      to: [{ email: "customer@example.com" }],
      ...overrides
    }),
    headers: auth(workspaceId),
    method: "POST",
    url: "/v1/send"
  });
}

async function get(handler, url, headers = auth()) {
  const response = await dispatchToHandler(handler, { headers, method: "GET", url });
  return { json: await response.json(), status: response.status };
}

test("a message accepted by /v1/send appears in GET /v1/messages", async () => {
  const { cleanup, handler } = setup();
  try {
    const sent = await send(handler, { subject: "First listed" });
    assert.equal(sent.status, 202);
    const messageId = (await sent.json()).data.message_id;

    const list = await get(handler, "/v1/messages");
    assert.equal(list.status, 200);
    assert.equal(list.json.data.total, 1);
    const [item] = list.json.data.items;
    assert.equal(item.messageId, messageId);
    assert.equal(item.subject, "First listed");
    assert.equal(item.workspaceId, WORKSPACE);
    assert.equal(item.primaryRecipient, "customer@example.com");
    assert.equal(item.stream, "transactional");
  } finally {
    cleanup();
  }
});

test("the existing list filters and paging apply to persisted messages", async () => {
  const { cleanup, handler } = setup();
  try {
    await send(handler, { subject: "to-alice", to: [{ email: "alice@example.com" }] });
    await send(handler, { subject: "to-bob", to: [{ email: "bob@example.com" }] });
    await send(handler, { subject: "to-carol", to: [{ email: "carol@example.com" }] });

    const all = await get(handler, "/v1/messages?page_size=2&page=1");
    assert.equal(all.json.data.total, 3);
    assert.equal(all.json.data.items.length, 2);
    assert.equal(all.json.data.page_size, 2);
    const second = await get(handler, "/v1/messages?page_size=2&page=2");
    assert.equal(second.json.data.items.length, 1);

    const byRecipient = await get(handler, "/v1/messages?to=bob");
    assert.deepEqual(byRecipient.json.data.items.map((item) => item.subject), ["to-bob"]);

    const byStream = await get(handler, "/v1/messages?stream=marketing");
    assert.equal(byStream.json.data.total, 0);

    const byFrom = await get(handler, "/v1/messages?from=ops@lists.example");
    assert.equal(byFrom.json.data.total, 3);
    const byOtherFrom = await get(handler, "/v1/messages?from=nobody@elsewhere");
    assert.equal(byOtherFrom.json.data.total, 0);

    const future = await get(handler, `/v1/messages?created_from=${encodeURIComponent("2999-01-01T00:00:00Z")}`);
    assert.equal(future.json.data.total, 0);
  } finally {
    cleanup();
  }
});

test("message lists are scoped to the requested workspace", async () => {
  const { backend, cleanup, handler } = setup();
  try {
    const sent = await send(handler);
    assert.equal(sent.status, 202);
    const otherWorkspace = await get(handler, "/v1/messages", auth(OTHER_WORKSPACE));
    assert.equal(otherWorkspace.status, 200);
    assert.equal(otherWorkspace.json.data.total, 0);
    assert.deepEqual(backend.persistedSources.messages.listMessages({ workspaceId: OTHER_WORKSPACE }).items, []);
  } finally {
    cleanup();
  }
});

test("persisted list reads need the same API key as /v1/send", async () => {
  const { cleanup, handler } = setup();
  try {
    await send(handler);
    for (const url of ["/v1/messages", "/v1/suppressions"]) {
      const missing = await get(handler, url, { "x-workspace-id": WORKSPACE });
      assert.equal(missing.status, 401, url);
      const wrong = await get(handler, url, { authorization: "Bearer nope", "x-workspace-id": WORKSPACE });
      assert.equal(wrong.status, 401, url);
    }
  } finally {
    cleanup();
  }
});

test("GET /v1/suppressions lists the rows that block /v1/send, and filters apply", async () => {
  const { cleanup, dbPath, handler } = setup();
  try {
    const listed = await get(handler, `/v1/suppressions?email=${encodeURIComponent(BLOCKED)}`);
    assert.equal(listed.status, 200);
    assert.equal(listed.json.data.total, 1);
    assert.equal(listed.json.data.items[0].email, BLOCKED);
    assert.equal(listed.json.data.items[0].workspaceId, WORKSPACE);

    // The very recipient that is listed is refused at send time.
    const blocked = await send(handler, { to: [{ email: BLOCKED }] });
    assert.ok(blocked.status >= 400 && blocked.status < 500, `blocked send answered ${blocked.status}`);

    // A suppression added after startup is enforced and listed.
    const db = new DatabaseSync(dbPath);
    try {
      db.prepare(
        "INSERT INTO suppressions (id, workspace_id, email, stream, reason, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?);"
      ).run("sup_late", WORKSPACE, "late@example.com", "marketing", "unsubscribe", new Date().toISOString());
      db.prepare(
        "INSERT INTO suppressions (id, workspace_id, email, stream, reason, active, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?);"
      ).run("sup_off", WORKSPACE, "off@example.com", "manual", new Date().toISOString());
    } finally {
      db.close();
    }

    const late = await get(handler, "/v1/suppressions?email=late@example.com");
    assert.equal(late.json.data.total, 1);
    assert.equal(late.json.data.items[0].reason, "unsubscribe");
    assert.equal(late.json.data.items[0].scope, "stream");
    assert.equal(late.json.data.items[0].stream, "marketing");

    const lateSend = await send(handler, { stream: "marketing", to: [{ email: "late@example.com" }] });
    assert.ok(lateSend.status >= 400 && lateSend.status < 500, `late suppression not enforced: ${lateSend.status}`);

    const everything = await get(handler, "/v1/suppressions");
    assert.equal(everything.json.data.total, 3);
    const activeOnly = await get(handler, "/v1/suppressions?active_only=true");
    assert.deepEqual(
      activeOnly.json.data.items.map((item) => item.email).sort(),
      [BLOCKED, "late@example.com"].sort()
    );
    const byReason = await get(handler, "/v1/suppressions?reason=unsubscribe");
    assert.deepEqual(byReason.json.data.items.map((item) => item.email), ["late@example.com"]);
    const byScope = await get(handler, "/v1/suppressions?scope=workspace&active_only=true");
    assert.deepEqual(byScope.json.data.items.map((item) => item.email), [BLOCKED]);
  } finally {
    cleanup();
  }
});

test("suppressions are scoped to the requested workspace", async () => {
  const { cleanup, handler } = setup();
  try {
    const other = await get(handler, "/v1/suppressions", auth(OTHER_WORKSPACE));
    assert.equal(other.status, 200);
    assert.equal(other.json.data.total, 0);
  } finally {
    cleanup();
  }
});

test("without the demo flag no sample data is served; with it the samples are", async () => {
  const { backend, cleanup } = setup();
  try {
    const plain = createFlowApiRequestHandler({ smtpInternalBackend: backend });
    const messages = await get(plain, "/v1/messages", auth("ws_mail_main"));
    assert.equal(messages.json.data.total, 0, "no sample messages by default");
    const suppressions = await get(plain, "/v1/suppressions", auth("ws_mail_main"));
    assert.equal(suppressions.json.data.total, 0, "no sample suppressions by default");

    const demo = createFlowApiRequestHandler({ demoData: true, smtpInternalBackend: backend });
    const demoMessages = await dispatchToHandler(demo, { headers: { "x-workspace-id": "ws_mail_main" }, method: "GET", url: "/v1/messages" });
    assert.equal(demoMessages.status, 200);
    assert.ok((await demoMessages.json()).data.total > 0, "demo flag serves the samples");
    const demoSuppressions = await dispatchToHandler(demo, { headers: { "x-workspace-id": "ws_mail_main" }, method: "GET", url: "/v1/suppressions" });
    assert.ok((await demoSuppressions.json()).data.total > 0);
  } finally {
    cleanup();
  }
});

test("MAIL_API_DEMO_DATA=1 enables the demo flag outside production only", () => {
  assert.equal(buildServerOptionsFromEnv({}).options.demoData, false);
  assert.equal(buildServerOptionsFromEnv({ MAIL_API_DEMO_DATA: "1" }).options.demoData, true);
  assert.equal(buildServerOptionsFromEnv({ MAIL_API_DEMO_DATA: "true" }).options.demoData, false);
  assert.equal(buildServerOptionsFromEnv({ MAIL_API_DEMO_DATA: "1", NODE_ENV: "production" }).options.demoData, false);
});

// --- paging in SQL, page_size cap, scan ceiling -------------------------------

/** Copy the first stored message (and its queue payload) `count` times under new ids. */
function inflate(dbPath, count, { stream } = {}) {
  const db = new DatabaseSync(dbPath);
  try {
    const message = db.prepare("SELECT * FROM messages ORDER BY created_at ASC LIMIT 1;").get();
    const job = db.prepare("SELECT * FROM smtp_queue_jobs WHERE message_id = ?;").get(message.id);
    const insertMessage = db.prepare(
      `INSERT INTO messages (${Object.keys(message).join(", ")}) VALUES (${Object.keys(message).map(() => "?").join(", ")});`
    );
    const insertJob = db.prepare(
      `INSERT INTO smtp_queue_jobs (${Object.keys(job).join(", ")}) VALUES (${Object.keys(job).map(() => "?").join(", ")});`
    );
    db.exec("BEGIN;");
    for (let index = 0; index < count; index += 1) {
      const id = `msg_bulk_${index}_${randomUUID()}`;
      const copy = {
        ...message,
        created_at: new Date(Date.now() - (index + 1) * 1000).toISOString(),
        id,
        message_idempotency_key: `bulk-${id}`,
        ...(stream ? { stream } : {})
      };
      insertMessage.run(...Object.values(copy));
      insertJob.run(...Object.values({ ...job, id: `job_${id}`, message_id: id }));
    }
    db.exec("COMMIT;");
  } finally {
    db.close();
  }
}

test("page_size above 100 is refused with 400 for persisted and demo sources; 100 is accepted", async () => {
  const { backend, cleanup, handler } = setup();
  try {
    await send(handler);
    const tooBig = await get(handler, "/v1/messages?page_size=101");
    assert.equal(tooBig.status, 400);
    assert.equal(tooBig.json.error.code, "VALIDATION_ERROR");
    assert.equal(tooBig.json.error.details.maximum, 100);

    const atCap = await get(handler, "/v1/messages?page_size=100");
    assert.equal(atCap.status, 200);
    assert.equal(atCap.json.data.page_size, 100);

    const demo = createFlowApiRequestHandler({ demoData: true, smtpInternalBackend: backend });
    const demoTooBig = await dispatchToHandler(demo, {
      headers: { "x-workspace-id": "ws_mail_main" },
      method: "GET",
      url: "/v1/messages?page_size=101"
    });
    assert.equal(demoTooBig.status, 400);
  } finally {
    cleanup();
  }
});

test("SQL paging returns the same pages, totals and filtered results as the in-memory read model", async () => {
  const { backend, cleanup, handler } = setup();
  try {
    const recipients = ["a", "b", "c", "a", "b", "a", "c"];
    for (const [index, name] of recipients.entries()) {
      await send(handler, { subject: `m${index}`, to: [{ email: `${name}@example.com` }] });
    }

    const reference = createMailMessageSource(backend.persistedSources.messages.snapshot(WORKSPACE));
    const ids = (items) => items.map((item) => item.messageId);

    // Paging through every page yields each message exactly once and the same set as the reference.
    const seen = [];
    for (let page = 1; page <= 4; page += 1) {
      const result = await get(handler, `/v1/messages?page=${page}&page_size=3`);
      assert.equal(result.status, 200);
      assert.equal(result.json.data.total, 7);
      assert.equal(result.json.data.items.length, page <= 2 ? 3 : page === 3 ? 1 : 0, `page ${page}`);
      seen.push(...ids(result.json.data.items));
    }
    assert.equal(new Set(seen).size, 7, "no duplicates across pages");
    assert.deepEqual([...seen].sort(), ids(reference.listMessages({ pageSize: 100, workspaceId: WORKSPACE }).items).sort());

    // A page number far past the end is an empty page, not an error.
    const far = await get(handler, "/v1/messages?page=999999999999999999999&page_size=3");
    assert.equal(far.status, 200);
    assert.deepEqual(far.json.data.items, []);

    // Detail-derived filters give the same set and total as the reference.
    for (const query of ["to=a@example.com", "to=b@", "from=ops@lists.example", "status=queued", "status=delivered"]) {
      const result = await get(handler, `/v1/messages?page_size=100&${query}`);
      const params = Object.fromEntries(new URLSearchParams(query));
      const expected = reference.listMessages({
        from: params.from,
        pageSize: 100,
        statuses: params.status ? [params.status] : undefined,
        to: params.to,
        workspaceId: WORKSPACE
      });
      assert.equal(result.json.data.total, expected.total, query);
      assert.deepEqual(ids(result.json.data.items).sort(), ids(expected.items).sort(), query);
    }
  } finally {
    cleanup();
  }
});

test("the scan ceiling refuses detail-derived filters over too many messages (422) but plain paging still works", async () => {
  const { cleanup, dbPath, handler } = setup();
  try {
    assert.equal((await send(handler)).status, 202);
    inflate(dbPath, 1000); // 1001 messages in the workspace, all in the transactional stream

    const plain = await get(handler, "/v1/messages?page=2&page_size=100");
    assert.equal(plain.status, 200);
    assert.equal(plain.json.data.total, 1001);
    assert.equal(plain.json.data.items.length, 100);

    for (const query of ["to=customer@example.com", "from=ops@lists.example", "status=queued", "created_from=2000-01-01T00:00:00Z"]) {
      const refused = await get(handler, `/v1/messages?${query}`);
      assert.equal(refused.status, 422, query);
      assert.equal(refused.json.error.code, "VALIDATION_ERROR");
      assert.equal(refused.json.error.details.limit, 1000);
    }

    // Narrowing the candidates with the stream (an exact SQL filter) brings the scan under the ceiling.
    const narrowed = await get(handler, "/v1/messages?stream=marketing&to=customer@example.com");
    assert.equal(narrowed.status, 200);
    assert.equal(narrowed.json.data.total, 0);
  } finally {
    cleanup();
  }
});

test("a detail-derived filter over exactly the ceiling is served", async () => {
  const { cleanup, dbPath, handler } = setup();
  try {
    assert.equal((await send(handler)).status, 202);
    inflate(dbPath, 999); // 1000 messages
    const served = await get(handler, "/v1/messages?to=customer@example.com&page_size=100");
    assert.equal(served.status, 200);
    assert.equal(served.json.data.total, 1000);
    assert.equal(served.json.data.items.length, 100);
  } finally {
    cleanup();
  }
});
