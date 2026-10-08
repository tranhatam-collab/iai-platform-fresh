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
