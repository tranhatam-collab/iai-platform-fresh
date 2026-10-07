/**
 * Mail platform end to end: a real mail-api process (SQLite on a temp dir), the
 * inbound webhook, the internal SMTP control routes, and a real mail-smtp
 * process in remote mode that is driven over a TCP socket with a hand-rolled
 * SMTP client.
 *
 * Nothing here talks to a real provider or relay. Needs `pnpm build`.
 * Run: node --test tests/e2e/mail-stack.e2e.test.mjs
 *
 * Known non-security gaps are written for the correct behaviour and flagged
 * `todo`, so they run without failing the suite.
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { builtEntryAvailable, request, startMailApi } from "./support/harness.mjs";
import {
  DEV_SENDER,
  DEV_WORKSPACE,
  SEEDED_SUPPRESSED_RECIPIENT,
  SMTP_DEV_PASSWORD,
  SMTP_DEV_USERNAME,
  apiHeaders,
  buildSendPayload,
  getMessage,
  getMessageEvents,
  sendMail,
  signInboundWebhook,
  uniqueKey,
  waitFor
} from "./support/mail-helpers.mjs";
import { opensslAvailable, startMailSmtp } from "./support/mail-smtp.mjs";

const apiBuilt = builtEntryAvailable("apps/mail-api/dist/bootstrap.js");
const smtpBuilt = builtEntryAvailable("apps/mail-smtp/dist/index.js");

const STACK_TRACE = /(\/home\/|\/Users\/|node_modules|at [\w.<>]+ \(.*:\d+:\d+\)|ENOENT)/;

describe("mail-api: /v1/send", { skip: apiBuilt ? false : "apps/mail-api not built" }, () => {
  let api;

  before(async () => {
    api = await startMailApi();
  });
  after(async () => {
    await api?.stop();
  });

  test("health and dependency checks report a working database", async () => {
    const health = await request(api.baseUrl, "/health");
    assert.equal(health.status, 200);
    assert.equal(health.json.data.status, "ok");

    const deps = await request(api.baseUrl, "/v1/health/dependencies");
    assert.equal(deps.status, 200);
    assert.equal(deps.json.ok, true);
    const database = deps.json.checks.find((check) => check.name === "database");
    assert.equal(database?.ok, true);
  });

  test("accepts a send with the API key and returns a message id", async () => {
    const response = await sendMail(api, { subject: "Accepted send" });
    assert.equal(response.status, 202, response.text);
    assert.equal(response.json.ok, true);
    const data = response.json.data;
    assert.match(data.message_id, /^msg_[0-9a-f-]{36}$/);
    assert.equal(data.status, "queued");
    assert.equal(data.delivery_status, "provider_accepted");
    assert.equal(data.provider_route, "transactional_primary");
    assert.equal(data.accepted_recipients, 1);
    assert.equal(data.suppressed_recipients, 0);
    assert.ok(response.json.meta.request_id);
  });

  test("message detail and timeline are readable per workspace", async () => {
    const send = await sendMail(api, {
      subject: "Detail check",
      text: "detail body",
      tags: ["e2e", "detail"],
      metadata: { order_id: "order-e2e-1" }
    });
    const messageId = send.json.data.message_id;

    const detail = await getMessage(api, messageId);
    assert.equal(detail.status, 200, detail.text);
    assert.equal(detail.json.data.message.messageId, messageId);
    assert.equal(detail.json.data.message.workspaceId, DEV_WORKSPACE);
    assert.equal(detail.json.data.message.subject, "Detail check");
    assert.equal(detail.json.data.message.source, "api");
    assert.equal(detail.json.data.status, "provider_accepted");
    assert.equal(detail.json.data.normalizedPayload.metadata.order_id, "order-e2e-1");
    assert.deepEqual(detail.json.data.normalizedPayload.recipients, ["recipient@example.com"]);
    assert.equal(detail.json.data.deliveryAttempts.length >= 1, true);

    const events = await getMessageEvents(api, messageId);
    assert.equal(events.status, 200);
    const types = events.json.data.items.map((item) => item.eventType);
    assert.equal(types[0], "queued");
    assert.equal(types.at(-1), "provider_accepted");
    assert.equal(events.json.data.total, types.length);
    for (const item of events.json.data.items) {
      assert.equal(item.messageId, messageId);
      assert.equal(item.workspaceId, DEV_WORKSPACE);
    }
  });

  test("a message is invisible to other workspaces and to callers without a workspace", async () => {
    const send = await sendMail(api);
    const messageId = send.json.data.message_id;

    const foreign = await getMessage(api, messageId, "ws_someone_else");
    assert.equal(foreign.status, 404);
    assert.equal(foreign.json.error.code, "MESSAGE_NOT_FOUND");
    assert.doesNotMatch(foreign.text, /recipient@example\.com/);

    const foreignEvents = await getMessageEvents(api, messageId, "ws_someone_else");
    assert.equal(foreignEvents.status, 404);

    // Reads need the API key, like POST /v1/send.
    const keyless = await request(api.baseUrl, `/v1/messages/${messageId}`, { headers: { "x-workspace-id": DEV_WORKSPACE } });
    assert.equal(keyless.status, 401);
    assert.doesNotMatch(keyless.text, /recipient@example\.com/);

    const anonymous = await request(api.baseUrl, `/v1/messages/${messageId}`, {
      headers: { authorization: `Bearer ${api.credentials.apiKey}` }
    });
    assert.equal(anonymous.status, 400);
    assert.equal(anonymous.json.error.code, "WORKSPACE_NOT_FOUND");
  });

  test("idempotency: the same message_idempotency_key returns the same message without a second queue entry", async () => {
    const key = uniqueKey("idem");
    const first = await sendMail(api, { message_idempotency_key: key });
    const second = await sendMail(api, { message_idempotency_key: key });
    assert.equal(first.status, 202);
    assert.equal(second.status, 202);
    assert.equal(second.json.data.message_id, first.json.data.message_id);
    assert.equal(second.json.data.delivery_status, first.json.data.delivery_status);

    const events = await getMessageEvents(api, first.json.data.message_id);
    const queued = events.json.data.items.filter((item) => item.eventType === "queued");
    assert.equal(queued.length, 1, "replayed send must not append a second queued event");

    const other = await sendMail(api, { message_idempotency_key: uniqueKey("idem") });
    assert.notEqual(other.json.data.message_id, first.json.data.message_id);
  });

  test("idempotency keys are scoped to the workspace", async () => {
    // The same key under a workspace that has no sender identity must not resolve to the
    // dev workspace's message; it is rejected on its own merits.
    const key = uniqueKey("scope");
    const first = await sendMail(api, { message_idempotency_key: key });
    assert.equal(first.status, 202);
    const foreign = await request(api.baseUrl, "/v1/send", {
      method: "POST",
      headers: apiHeaders(api, { workspaceId: "ws_someone_else" }),
      body: JSON.stringify(buildSendPayload({ message_idempotency_key: key }))
    });
    assert.equal(foreign.status, 422);
    assert.equal(foreign.json.error.code, "SENDER_NOT_ALLOWED");
  });

  test("a missing message_idempotency_key is a validation error, not a silent duplicate", async () => {
    const payload = buildSendPayload();
    delete payload.message_idempotency_key;
    const response = await request(api.baseUrl, "/v1/send", {
      method: "POST",
      headers: apiHeaders(api),
      body: JSON.stringify(payload)
    });
    assert.equal(response.status, 422);
    assert.equal(response.json.error.code, "VALIDATION_ERROR");
    assert.match(response.json.error.message, /message_idempotency_key/);
  });

  test("rejects requests without credentials, with a wrong key, or with the SMTP service token", async () => {
    const body = JSON.stringify(buildSendPayload());
    const noKey = await request(api.baseUrl, "/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json", "x-workspace-id": DEV_WORKSPACE },
      body
    });
    assert.equal(noKey.status, 401);
    assert.equal(noKey.json.error.code, "UNAUTHORIZED");

    const wrongKey = await request(api.baseUrl, "/v1/send", {
      method: "POST",
      headers: { ...apiHeaders(api), authorization: "Bearer not-the-key" },
      body
    });
    assert.equal(wrongKey.status, 401);

    const wrongScheme = await request(api.baseUrl, "/v1/send", {
      method: "POST",
      headers: { ...apiHeaders(api), authorization: api.credentials.apiKey },
      body
    });
    assert.equal(wrongScheme.status, 401);

    const serviceToken = await request(api.baseUrl, "/v1/send", {
      method: "POST",
      headers: { ...apiHeaders(api), authorization: `Bearer ${api.credentials.remoteToken}` },
      body
    });
    assert.equal(serviceToken.status, 401, "the SMTP service token must not double as an API key");

    for (const response of [noKey, wrongKey, wrongScheme, serviceToken]) {
      assert.doesNotMatch(response.text, new RegExp(api.credentials.apiKey));
      assert.doesNotMatch(response.text, STACK_TRACE);
    }
  });

  test("an unauthenticated request cannot create messages or probe the workspace", async () => {
    const key = uniqueKey("unauth");
    const response = await request(api.baseUrl, "/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json", "x-workspace-id": DEV_WORKSPACE },
      body: JSON.stringify(buildSendPayload({ message_idempotency_key: key }))
    });
    assert.equal(response.status, 401);
    // The key is still free, so a later authenticated send creates a fresh message.
    const real = await sendMail(api, { message_idempotency_key: key });
    assert.equal(real.status, 202);
  });

  test("requires a workspace and a JSON object body", async () => {
    const noWorkspace = await request(api.baseUrl, "/v1/send", {
      method: "POST",
      headers: apiHeaders(api, { workspaceId: null }),
      body: JSON.stringify(buildSendPayload())
    });
    assert.equal(noWorkspace.status, 400);
    assert.equal(noWorkspace.json.error.code, "WORKSPACE_NOT_FOUND");

    for (const [label, body] of [["truncated JSON", "{"], ["null", "null"], ["a string", '"hi"']]) {
      const response = await request(api.baseUrl, "/v1/send", {
        method: "POST",
        headers: apiHeaders(api),
        body
      });
      assert.equal(response.status, 400, `${label} -> ${response.status} ${response.text}`);
      assert.doesNotMatch(response.text, STACK_TRACE);
    }

    const get = await request(api.baseUrl, "/v1/send", { headers: apiHeaders(api) });
    assert.equal(get.status, 405);
  });

  test("validates the payload shape with 422 and stable error codes", async () => {
    const cases = [
      [{ to: [] }, "VALIDATION_ERROR", /to/],
      [{ to: [{ email: "not-an-email" }] }, "VALIDATION_ERROR", /email/],
      [{ stream: "carrier-pigeon" }, "VALIDATION_ERROR", /stream/],
      [{ text: undefined, html: undefined }, "VALIDATION_ERROR", /html.*text|text.*html/],
      [{ from: { email: "someone@elsewhere.example" } }, "SENDER_NOT_ALLOWED", /elsewhere/],
      [{ from: { email: "spoof@tx.iai.one" } }, "SENDER_NOT_ALLOWED", /spoof/]
    ];
    for (const [overrides, code, pattern] of cases) {
      const response = await sendMail(api, overrides);
      assert.equal(response.status, 422, `${JSON.stringify(overrides)} -> ${response.status} ${response.text}`);
      assert.equal(response.json.error.code, code);
      assert.match(response.json.error.message, pattern);
    }
  });

  test("suppressed recipients are refused before anything is queued", async () => {
    const key = uniqueKey("suppressed");
    const response = await sendMail(api, {
      message_idempotency_key: key,
      to: [{ email: "fine@example.com" }, { email: SEEDED_SUPPRESSED_RECIPIENT }]
    });
    assert.equal(response.status, 422, response.text);
    assert.equal(response.json.error.code, "SUPPRESSED_RECIPIENT");
    assert.equal(response.json.error.details.recipient, SEEDED_SUPPRESSED_RECIPIENT);

    // Matching is case-insensitive and also covers cc/bcc.
    for (const overrides of [
      { to: [{ email: "Blocked@Example.COM" }] },
      { to: [{ email: "fine@example.com" }], cc: [{ email: SEEDED_SUPPRESSED_RECIPIENT }] },
      { to: [{ email: "fine@example.com" }], bcc: [{ email: SEEDED_SUPPRESSED_RECIPIENT }] }
    ]) {
      const attempt = await sendMail(api, overrides);
      assert.equal(attempt.status, 422, JSON.stringify(overrides));
      assert.equal(attempt.json.error.code, "SUPPRESSED_RECIPIENT");
    }

    // The refused idempotency key never created a message: re-using it with a clean recipient works.
    const retry = await sendMail(api, { message_idempotency_key: key });
    assert.equal(retry.status, 202);
  });

  test("a stream without an active provider route is accepted but reported as failed, not delivered", async () => {
    const response = await sendMail(api, { stream: "marketing" });
    assert.equal(response.status, 202, response.text);
    assert.notEqual(response.json.data.provider_route, "transactional_primary");
    assert.equal(response.json.data.delivery_status, "failed");
    assert.ok(response.json.data.failure_code);

    const detail = await getMessage(api, response.json.data.message_id);
    assert.equal(detail.json.data.status, "failed");
  });

  test("API-key checks do not leak through error bodies or stack traces", async () => {
    const response = await request(api.baseUrl, "/v1/send", {
      method: "POST",
      headers: apiHeaders(api),
      body: JSON.stringify({ ...buildSendPayload(), headers: { "X-Bad": { nested: true } } })
    });
    assert.equal(response.status, 422);
    assert.doesNotMatch(response.text, STACK_TRACE);
  });

  test("the message list read model reflects what was just sent", { todo: "known gap, tracked on the team board" }, async () => {
    const send = await sendMail(api, { subject: "Listed message" });
    const list = await request(api.baseUrl, `/v1/messages?workspace_id=${DEV_WORKSPACE}&page_size=100`);
    assert.equal(list.status, 200);
    const ids = list.json.data.items.map((item) => item.messageId);
    assert.ok(ids.includes(send.json.data.message_id), "sent message missing from the list endpoint");
  });

  test("the suppression read model lists the recipient that /v1/send enforces", { todo: "known gap, tracked on the team board" }, async () => {
    const list = await request(api.baseUrl, `/v1/suppressions?workspace_id=${DEV_WORKSPACE}&email=${SEEDED_SUPPRESSED_RECIPIENT}`);
    assert.equal(list.status, 200);
    assert.ok(list.json.data.total >= 1, "seeded suppression is not visible through the API");
  });
});

describe("mail-api: key configuration fails closed", { skip: apiBuilt ? false : "apps/mail-api not built" }, () => {
  test("without MAIL_API_KEY /v1/send answers 503 and never queues", async () => {
    const api = await startMailApi({ env: { MAIL_API_KEY: "" } });
    try {
      const response = await request(api.baseUrl, "/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json", "x-workspace-id": DEV_WORKSPACE, authorization: "Bearer anything" },
        body: JSON.stringify(buildSendPayload())
      });
      assert.equal(response.status, 503, response.text);
      assert.match(response.json.error.message, /MAIL_API_KEY/);
    } finally {
      await api.stop();
    }
  });
});

describe("mail-api: internal SMTP control routes", { skip: apiBuilt ? false : "apps/mail-api not built" }, () => {
  let api;
  const operations = ["auth", "mail-from", "recipient", "normalize", "queue", "audit"];

  before(async () => {
    api = await startMailApi();
  });
  after(async () => {
    await api?.stop();
  });

  function internal(operation, { token, body = {}, method = "POST" } = {}) {
    return request(api.baseUrl, `/v1/internal/smtp/${operation}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: method === "GET" ? undefined : JSON.stringify(body)
    });
  }

  test("every operation requires the service token", async () => {
    for (const operation of operations) {
      const anonymous = await internal(operation);
      assert.equal(anonymous.status, 401, `${operation} without token -> ${anonymous.status}`);
      assert.equal(anonymous.json.error.code, "UNAUTHORIZED");

      const wrong = await internal(operation, { token: "wrong-token" });
      assert.equal(wrong.status, 401, `${operation} with wrong token -> ${wrong.status}`);

      const apiKeyAsToken = await internal(operation, { token: api.credentials.apiKey });
      assert.equal(apiKeyAsToken.status, 401, `${operation}: the public API key must not unlock internal routes`);
    }
  });

  test("credentials are never evaluated for unauthenticated callers", async () => {
    const response = await internal("auth", {
      body: { username: SMTP_DEV_USERNAME, password: SMTP_DEV_PASSWORD }
    });
    assert.equal(response.status, 401);
    assert.equal(response.json.workspaceId, undefined);
    assert.doesNotMatch(response.text, /smtpcred_dev|ws_dev/);
  });

  test("auth verifies the seeded credential and rejects bad passwords", async () => {
    const good = await internal("auth", {
      token: api.credentials.remoteToken,
      body: { username: SMTP_DEV_USERNAME, password: SMTP_DEV_PASSWORD, method: "PLAIN", secure: true }
    });
    assert.equal(good.status, 200, good.text);
    assert.equal(good.json.workspaceId, DEV_WORKSPACE);
    assert.deepEqual(good.json.allowedStreams, ["transactional"]);
    assert.equal(good.json.password, undefined, "stored secret must never be echoed");

    const bad = await internal("auth", {
      token: api.credentials.remoteToken,
      body: { username: SMTP_DEV_USERNAME, password: "wrong" }
    });
    assert.equal(bad.status, 401);
    assert.equal(bad.json.error.code, "AUTH_REJECTED");

    const missing = await internal("auth", { token: api.credentials.remoteToken, body: { username: SMTP_DEV_USERNAME } });
    assert.equal(missing.status, 400);

    const injection = await internal("auth", {
      token: api.credentials.remoteToken,
      body: { username: "' OR '1'='1", password: "' OR '1'='1" }
    });
    assert.equal(injection.status, 401);
  });

  test("mail-from and recipient apply sender and suppression policy", async () => {
    const auth = (
      await internal("auth", {
        token: api.credentials.remoteToken,
        body: { username: SMTP_DEV_USERNAME, password: SMTP_DEV_PASSWORD }
      })
    ).json;

    const allowed = await internal("mail-from", { token: api.credentials.remoteToken, body: { auth, address: DEV_SENDER } });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.json.ok, true);

    const denied = await internal("mail-from", { token: api.credentials.remoteToken, body: { auth, address: "intruder@evil.example" } });
    assert.equal(denied.status, 200);
    assert.equal(denied.json.ok, false);
    assert.equal(denied.json.smtpCode, 550);

    const suppressed = await internal("recipient", {
      token: api.credentials.remoteToken,
      body: { auth, recipient: SEEDED_SUPPRESSED_RECIPIENT, stream: "transactional" }
    });
    assert.equal(suppressed.json.ok, false);
    assert.equal(suppressed.json.smtpCode, 550);

    const fine = await internal("recipient", {
      token: api.credentials.remoteToken,
      body: { auth, recipient: "someone@example.com", stream: "transactional" }
    });
    assert.equal(fine.json.ok, true);
  });

  test("malformed JSON and unknown operations are client errors", async () => {
    const malformed = await request(api.baseUrl, "/v1/internal/smtp/auth", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${api.credentials.remoteToken}` },
      body: "{not json"
    });
    assert.equal(malformed.status, 400);
    assert.equal(malformed.json.error.code, "INVALID_JSON");

    const unknown = await internal("does-not-exist", { token: api.credentials.remoteToken });
    assert.equal(unknown.status, 404);
    assert.doesNotMatch(unknown.text, STACK_TRACE);

    const wrongMethod = await internal("auth", { method: "GET" });
    assert.equal(wrongMethod.status, 405);
  });
});

describe("mail-api: inbound webhook", { skip: apiBuilt ? false : "apps/mail-api not built" }, () => {
  let api;
  const secret = () => api.credentials.webhookSecret;

  before(async () => {
    api = await startMailApi();
  });
  after(async () => {
    await api?.stop();
  });

  function postWebhook(rawBody, headers) {
    return request(api.baseUrl, "/v1/webhooks/inbound", { method: "POST", headers, body: rawBody });
  }

  test("accepts a correctly signed event and records verifiable evidence", async () => {
    const eventId = uniqueKey("evt");
    const raw = JSON.stringify({ id: eventId, type: "delivered", recipient: "someone@example.com" });
    const response = await postWebhook(raw, signInboundWebhook(secret(), raw));
    assert.equal(response.status, 202, response.text);
    assert.equal(response.json.ok, true);
    assert.equal(response.json.data.provider_event_id, eventId);
    assert.match(response.json.data.evidence_id, /^evt_inbound_/);

    const evidence = await request(api.baseUrl, `/v1/webhooks/inbound/evidence?evidence_id=${response.json.data.evidence_id}`);
    assert.equal(evidence.status, 200);
    assert.equal(evidence.json.data.signatureValid, true);
    assert.equal(evidence.json.data.rejectionCode, null);
    assert.equal(evidence.json.data.bodyByteLength, Buffer.byteLength(raw));
    assert.doesNotMatch(evidence.text, /someone@example\.com/, "evidence must not store the payload");
  });

  test("a retry of the same event is an idempotent replay; the same id with a mutated body is a conflict", async () => {
    const eventId = uniqueKey("evt");
    const raw = JSON.stringify({ id: eventId, type: "bounced" });
    const first = await postWebhook(raw, signInboundWebhook(secret(), raw));
    const retry = await postWebhook(raw, signInboundWebhook(secret(), raw));
    assert.equal(first.status, 202);
    assert.equal(retry.status, 202);
    assert.equal(retry.json.data.replay, true);
    assert.equal(retry.json.data.evidence_id, first.json.data.evidence_id);

    const mutated = JSON.stringify({ id: eventId, type: "complained" });
    const conflict = await postWebhook(mutated, signInboundWebhook(secret(), mutated));
    assert.equal(conflict.status, 409);
    assert.equal(conflict.json.error.code, "MAIL_WEBHOOK_EVENT_ID_CONFLICT");
  });

  test("rejects a wrong or tampered signature with 401", async () => {
    const raw = JSON.stringify({ id: uniqueKey("evt") });
    const headers = signInboundWebhook(secret(), raw);

    const wrongSecret = await postWebhook(raw, signInboundWebhook("some-other-secret", raw));
    assert.equal(wrongSecret.status, 401);
    assert.equal(wrongSecret.json.error.code, "MAIL_WEBHOOK_SIGNATURE_INVALID");

    const tampered = await postWebhook(JSON.stringify({ id: uniqueKey("evt"), extra: true }), headers);
    assert.equal(tampered.status, 401);

    const shortSignature = await postWebhook(raw, { ...headers, "x-mail-webhook-signature": "ab" });
    assert.equal(shortSignature.status, 401);

    const flipped = headers["x-mail-webhook-signature"].replace(/^./, (c) => (c === "0" ? "1" : "0"));
    const bitFlip = await postWebhook(raw, { ...headers, "x-mail-webhook-signature": flipped });
    assert.equal(bitFlip.status, 401);

    // A signature computed for a different timestamp must not verify.
    const retimed = await postWebhook(raw, { ...headers, "x-mail-webhook-timestamp": String(Number(headers["x-mail-webhook-timestamp"]) + 1) });
    assert.equal(retimed.status, 401);

    for (const response of [wrongSecret, tampered, shortSignature, bitFlip, retimed]) {
      assert.doesNotMatch(response.text, new RegExp(secret()));
      const evidenceId = response.json.meta.evidence_id;
      const evidence = await request(api.baseUrl, `/v1/webhooks/inbound/evidence?evidence_id=${evidenceId}`);
      assert.equal(evidence.json.data.signatureValid, false);
      assert.equal(evidence.json.data.rejectionCode, "MAIL_WEBHOOK_SIGNATURE_INVALID");
    }
  });

  test("rejects missing or malformed signature and timestamp headers with 401", async () => {
    const raw = JSON.stringify({ id: uniqueKey("evt") });
    const signed = signInboundWebhook(secret(), raw);

    const noSignature = await postWebhook(raw, { "content-type": "application/json", "x-mail-webhook-timestamp": signed["x-mail-webhook-timestamp"] });
    assert.equal(noSignature.status, 401);
    assert.equal(noSignature.json.error.code, "MAIL_WEBHOOK_SIGNATURE_MISSING");

    const noTimestamp = await postWebhook(raw, { "content-type": "application/json", "x-mail-webhook-signature": signed["x-mail-webhook-signature"] });
    assert.equal(noTimestamp.status, 401);
    assert.equal(noTimestamp.json.error.code, "MAIL_WEBHOOK_TIMESTAMP_MISSING");

    for (const bad of ["abc", "-5", "0", ""]) {
      const response = await postWebhook(raw, { ...signed, "x-mail-webhook-timestamp": bad });
      assert.equal(response.status, 401, `timestamp ${JSON.stringify(bad)} -> ${response.status}`);
    }
  });

  test("rejects a replayed (stale or future) timestamp even when the signature is valid", async () => {
    const raw = JSON.stringify({ id: uniqueKey("evt") });
    const now = Math.floor(Date.now() / 1000);

    const stale = await postWebhook(raw, signInboundWebhook(secret(), raw, now - 3600));
    assert.equal(stale.status, 408, stale.text);
    assert.equal(stale.json.error.code, "MAIL_WEBHOOK_TIMESTAMP_OUT_OF_WINDOW");

    const future = await postWebhook(raw, signInboundWebhook(secret(), raw, now + 3600));
    assert.equal(future.status, 408);

    const edge = await postWebhook(raw, signInboundWebhook(secret(), raw, now - 60));
    assert.equal(edge.status, 202, "a timestamp inside the replay window is accepted");
  });

  test("without MAIL_API_WEBHOOK_SECRET the endpoint fails closed with 503", async () => {
    const unconfigured = await startMailApi({ env: { MAIL_API_WEBHOOK_SECRET: "" } });
    try {
      const raw = JSON.stringify({ id: uniqueKey("evt") });
      const response = await request(unconfigured.baseUrl, "/v1/webhooks/inbound", {
        method: "POST",
        headers: signInboundWebhook("", raw),
        body: raw
      });
      assert.equal(response.status, 503, response.text);
      assert.equal(response.json.error.code, "MAIL_API_WEBHOOK_SECRET_MISSING");
    } finally {
      await unconfigured.stop();
    }
  });

  test("the replay window and body limit are configurable from the environment", async () => {
    const strict = await startMailApi({
      env: { MAIL_API_INBOUND_REPLAY_WINDOW_S: "5", MAIL_API_INBOUND_MAX_BODY_BYTES: "512" }
    });
    try {
      const raw = JSON.stringify({ id: uniqueKey("evt") });
      const now = Math.floor(Date.now() / 1000);
      const stale = await request(strict.baseUrl, "/v1/webhooks/inbound", {
        method: "POST",
        headers: signInboundWebhook(strict.credentials.webhookSecret, raw, now - 30),
        body: raw
      });
      assert.equal(stale.status, 408);
      const fresh = await request(strict.baseUrl, "/v1/webhooks/inbound", {
        method: "POST",
        headers: signInboundWebhook(strict.credentials.webhookSecret, raw, now),
        body: raw
      });
      assert.equal(fresh.status, 202);
    } finally {
      await strict.stop();
    }
  });
});

const smtpSkip = !apiBuilt || !smtpBuilt
  ? "apps/mail-api or apps/mail-smtp not built"
  : !opensslAvailable()
    ? "the openssl CLI is needed to generate a throwaway STARTTLS certificate"
    : false;

describe("mail-smtp (remote mode) against a real mail-api", { skip: smtpSkip }, () => {
  let api;
  let smtp;
  const clients = [];

  async function connect(options) {
    const client = await smtp.connect(options);
    clients.push(client);
    return client;
  }

  async function authenticatedSession() {
    const client = await connect();
    await client.startTls();
    const auth = await client.authPlain(SMTP_DEV_USERNAME, SMTP_DEV_PASSWORD);
    assert.equal(auth.code, 235, auth.text);
    return client;
  }

  before(async () => {
    api = await startMailApi();
    smtp = await startMailSmtp({
      mailApi: api,
      env: { MAIL_SMTP_MAX_RECIPIENTS: "2", MAIL_SMTP_MAX_MESSAGE_SIZE_BYTES: "4096" }
    });
  });

  after(async () => {
    for (const client of clients) {
      client.close();
    }
    await smtp?.stop();
    await api?.stop();
  });

  test("greets with a banner and advertises STARTTLS and the configured size limit", async () => {
    const client = await connect();
    assert.equal(client.greeting.code, 220);
    assert.match(client.greeting.text, /IAI Mail SMTP Submission/);
    const ehlo = await client.command("EHLO e2e.local");
    assert.equal(ehlo.code, 250);
    assert.match(ehlo.text, /STARTTLS/);
    assert.match(ehlo.text, /SIZE 4096/);
    assert.equal((await client.command("QUIT")).code, 221);
  });

  test("health endpoints report the remote backend and the upstream mail-api", async () => {
    const health = await request(smtp.baseUrl, "/health");
    assert.equal(health.status, 200);
    assert.equal(health.json.backendMode, "remote");
    assert.equal(health.json.smtp.port, smtp.smtpPort);

    const deps = await waitFor(
      async () => {
        const response = await request(smtp.baseUrl, "/health/dependencies");
        return response.status === 200 ? response : null;
      },
      { description: "mail-smtp dependency health" }
    );
    assert.equal(deps.json.ok, true);
    assert.equal(deps.json.checks.find((check) => check.name === "database")?.ok, true);
  });

  test("MAIL FROM before AUTH is refused", async () => {
    const client = await connect();
    await client.command("EHLO e2e.local");
    const mailFrom = await client.command(`MAIL FROM:<${DEV_SENDER}>`);
    assert.equal(mailFrom.code, 530, mailFrom.text);
    const rcpt = await client.command("RCPT TO:<user@example.com>");
    assert.ok(rcpt.code >= 500, `RCPT before MAIL/AUTH -> ${rcpt.code}`);
    client.close();
  });

  test("AUTH over a plaintext channel is refused", async () => {
    const client = await connect();
    await client.command("EHLO e2e.local");
    const auth = await client.authPlain(SMTP_DEV_USERNAME, SMTP_DEV_PASSWORD);
    assert.equal(auth.code, 538, auth.text);
    const mailFrom = await client.command(`MAIL FROM:<${DEV_SENDER}>`);
    assert.equal(mailFrom.code, 530, "a refused AUTH must not leave the session authenticated");
    client.close();
  });

  test("wrong passwords and unknown users get 535 after STARTTLS", async () => {
    const client = await connect();
    await client.startTls();
    const wrong = await client.authPlain(SMTP_DEV_USERNAME, "not-the-password");
    assert.equal(wrong.code, 535, wrong.text);
    const unknown = await client.authPlain("nobody", "whatever");
    assert.equal(unknown.code, 535, unknown.text);
    const mailFrom = await client.command(`MAIL FROM:<${DEV_SENDER}>`);
    assert.equal(mailFrom.code, 530);
    client.close();
  });

  test("sender and recipient policy is enforced by mail-api", async () => {
    const client = await authenticatedSession();

    const rcptFirst = await client.command("RCPT TO:<user@example.com>");
    assert.ok(rcptFirst.code >= 500, `RCPT before MAIL FROM -> ${rcptFirst.code}`);

    const spoofed = await client.command("MAIL FROM:<intruder@evil.example>");
    assert.equal(spoofed.code, 550, spoofed.text);

    const mailFrom = await client.command(`MAIL FROM:<${DEV_SENDER}>`);
    assert.equal(mailFrom.code, 250, mailFrom.text);

    const blocked = await client.command(`RCPT TO:<${SEEDED_SUPPRESSED_RECIPIENT}>`);
    assert.equal(blocked.code, 550, blocked.text);
    assert.match(blocked.text, /suppressed/i);

    const dataWithoutRecipients = await client.command("DATA");
    assert.ok(dataWithoutRecipients.code >= 500 || dataWithoutRecipients.code === 503, `DATA with no recipients -> ${dataWithoutRecipients.code}`);
    client.close();
  });

  test("a recipient cap of 2 refuses the third RCPT", async () => {
    const client = await authenticatedSession();
    assert.equal((await client.command(`MAIL FROM:<${DEV_SENDER}>`)).code, 250);
    assert.equal((await client.command("RCPT TO:<one@example.com>")).code, 250);
    assert.equal((await client.command("RCPT TO:<two@example.com>")).code, 250);
    const third = await client.command("RCPT TO:<three@example.com>");
    assert.equal(third.code, 452, third.text);
    client.close();
  });

  test("the configured message size limit is enforced at MAIL FROM and while streaming DATA", async () => {
    const declared = await authenticatedSession();
    const tooBig = await declared.command(`MAIL FROM:<${DEV_SENDER}> SIZE=100000`);
    assert.equal(tooBig.code, 552, tooBig.text);
    declared.close();

    const streamed = await authenticatedSession();
    assert.equal((await streamed.command(`MAIL FROM:<${DEV_SENDER}>`)).code, 250);
    assert.equal((await streamed.command("RCPT TO:<user@example.com>")).code, 250);
    const body = `From: ${DEV_SENDER}\r\nTo: user@example.com\r\nSubject: oversize\r\n\r\n${"A".repeat(9000)}`;
    const { final } = await streamed.sendData(body);
    assert.equal(final.code, 552, final.text);
    streamed.close();
  });

  test("a full SMTP submission lands in mail-api and is readable by message id", async () => {
    const client = await authenticatedSession();
    const subject = `SMTP e2e ${uniqueKey("smtp")}`;

    assert.equal((await client.command(`MAIL FROM:<${DEV_SENDER}>`)).code, 250);
    assert.equal((await client.command("RCPT TO:<user@example.com>")).code, 250);
    const { start, final } = await client.sendData(
      [
        `From: IAI E2E <${DEV_SENDER}>`,
        "To: user@example.com",
        `Subject: ${subject}`,
        "Message-ID: <e2e-smtp@tx.iai.one>",
        "Content-Type: text/plain; charset=utf-8",
        "",
        "Hello over a real SMTP socket.",
        ".starts with a dot to exercise dot-stuffing"
      ].join("\r\n")
    );
    assert.equal(start.code, 354);
    assert.equal(final.code, 250, final.text);
    const messageId = /Queued as (msg_[0-9a-f-]{36})/.exec(final.text)?.[1];
    assert.ok(messageId, `no message id in ${final.text}`);
    assert.equal((await client.command("QUIT")).code, 221);
    client.close();

    const detail = await waitFor(
      async () => {
        const response = await getMessage(api, messageId);
        return response.status === 200 ? response : null;
      },
      { description: "SMTP-submitted message to appear in mail-api" }
    );
    const data = detail.json.data;
    assert.equal(data.message.source, "smtp");
    assert.equal(data.message.workspaceId, DEV_WORKSPACE);
    assert.equal(data.message.stream, "transactional");
    assert.equal(data.message.subject, subject);
    assert.equal(data.message.envelopeFrom, DEV_SENDER);
    assert.deepEqual(data.normalizedPayload.recipients, ["user@example.com"]);
    assert.equal(data.status, "provider_accepted");
    const raw = Buffer.from(data.normalizedPayload.rawMimeBase64, "base64").toString("utf8");
    assert.match(raw, /Hello over a real SMTP socket\./);
    assert.match(raw, /\r\n\.starts with a dot/, "dot-stuffed line must be un-stuffed on receipt");

    const events = await getMessageEvents(api, messageId);
    assert.equal(events.json.data.items[0].eventType, "queued");
    assert.equal(events.json.data.items.at(-1).eventType, "provider_accepted");

    const foreign = await getMessage(api, messageId, "ws_someone_else");
    assert.equal(foreign.status, 404);
  });

  test("two messages in one session are queued separately", async () => {
    const client = await authenticatedSession();
    const ids = [];
    for (const label of ["first", "second"]) {
      assert.equal((await client.command(`MAIL FROM:<${DEV_SENDER}>`)).code, 250);
      assert.equal((await client.command("RCPT TO:<user@example.com>")).code, 250);
      const { final } = await client.sendData(
        `From: ${DEV_SENDER}\r\nTo: user@example.com\r\nSubject: ${label}\r\n\r\nbody ${label}`
      );
      assert.equal(final.code, 250, final.text);
      ids.push(/Queued as (msg_\S+)/.exec(final.text)[1]);
    }
    assert.notEqual(ids[0], ids[1]);
    for (const id of ids) {
      assert.equal((await getMessage(api, id)).status, 200);
    }
    client.close();
  });

  test("RSET clears the envelope and NOOP keeps the session alive", async () => {
    const client = await authenticatedSession();
    assert.equal((await client.command(`MAIL FROM:<${DEV_SENDER}>`)).code, 250);
    assert.equal((await client.command("RCPT TO:<user@example.com>")).code, 250);
    assert.equal((await client.command("RSET")).code, 250);
    assert.equal((await client.command("NOOP")).code, 250);
    const data = await client.command("DATA");
    assert.ok(data.code >= 500, `DATA after RSET -> ${data.code}`);
    client.close();
  });

  test("a mail-smtp configured with the wrong service token cannot authenticate anyone", async () => {
    const misconfigured = await startMailSmtp({
      mailApi: api,
      env: { MAIL_SMTP_REMOTE_TOKEN: "not-the-service-token" }
    });
    try {
      const client = await misconfigured.connect();
      try {
        await client.startTls();
        const auth = await client.authPlain(SMTP_DEV_USERNAME, SMTP_DEV_PASSWORD);
        assert.notEqual(auth.code, 235, "valid credentials must not authenticate through an unauthorised relay");
        assert.ok(auth.code >= 400, auth.text);
        const mailFrom = await client.command(`MAIL FROM:<${DEV_SENDER}>`);
        assert.equal(mailFrom.code, 530);
      } finally {
        client.close();
      }
    } finally {
      await misconfigured.stop();
    }
  });

  test("the SMTP server exits cleanly on SIGTERM once connections are closed", async () => {
    for (const client of clients) {
      client.close();
    }
    const result = await smtp.stop();
    assert.ok(result.code === 0 || result.signal === "SIGTERM", JSON.stringify(result));
  });
});

describe("mail-worker", () => {
  test("runs as a process", { skip: "apps/mail-worker is a library (src/index.ts exports processQueuedMessage only); it has no process entry point. Queue processing is covered inline by mail-api's processNextQueuedJob in the tests above." }, () => {});
});
