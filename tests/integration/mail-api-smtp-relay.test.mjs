/**
 * The SMTP relay delivery: a queued message goes to an outbound SMTP server and is reported as accepted only after
 * the server has accepted it. Every case talks to a small SMTP server that runs inside the test on 127.0.0.1; no
 * mail leaves the machine.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { processQueuedMessage } from "../../apps/mail-worker/dist/index.js";
import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend, resolveQueueSettings } from "../../apps/mail-api/dist/smtp-internal.js";
import {
  createSmtpProviderAdapter,
  probeSmtpRelay,
  resolveSmtpRelayConfig,
  sendViaSmtp
} from "../../apps/mail-api/dist/smtp-provider.js";
import { closedPort, createTestCertificate, startFakeSmtp } from "../support/fake-smtp-server.mjs";
import { dispatchToHandler } from "../support/http-handler.mjs";

const certificate = createTestCertificate();

function payload(overrides = {}) {
  return {
    attachments: [],
    bcc: [],
    cc: [],
    credentialId: "cred_relay",
    envelopeFrom: "ops@sender.example",
    from: { email: "ops@sender.example", name: "Ops Team" },
    headers: {},
    messageId: "msg_relay_1",
    messageIdempotencyKey: "idem-relay-1",
    recipients: ["customer@example.net"],
    source: "api",
    stream: "transactional",
    submittedAt: "2026-10-13T10:00:00.000Z",
    subject: "Hello there",
    text: "First line\nSecond line",
    to: [{ email: "customer@example.net" }],
    traceId: "trace_relay_1",
    workspaceId: "ws_relay",
    ...overrides
  };
}

function config(server, overrides = {}) {
  return {
    heloName: "client.test",
    host: "127.0.0.1",
    port: server.port,
    timeoutMs: 5000,
    tls: "none",
    tlsOptions: { ca: certificate.cert },
    ...overrides
  };
}

async function withServer(options, run) {
  const server = await startFakeSmtp({ certificate, ...options });
  try {
    return await run(server);
  } finally {
    await server.close();
  }
}

const verbs = (session) => session.commands.map((line) => line.split(" ")[0].toUpperCase());

test("a 250 after the message data is the only thing reported as accepted", async () => {
  await withServer({}, async (server) => {
    const outcome = await sendViaSmtp(config(server), payload());
    assert.equal(outcome.accepted, true);
    assert.equal(outcome.retryable, false);
    assert.equal(outcome.responseCode, "250");
    assert.equal(outcome.providerMessageId, "smtp_msg_relay_1");
    const [session] = server.sessions;
    assert.deepEqual(verbs(session), ["EHLO", "MAIL", "RCPT", "DATA", "QUIT"]);
    assert.equal(session.commands[1], "MAIL FROM:<ops@sender.example>");
    assert.equal(session.commands[2], "RCPT TO:<customer@example.net>");
    const text = session.data.toString("latin1");
    assert.match(text, /^From: "Ops Team" <ops@sender\.example>\r\n/u);
    assert.match(text, /\r\nTo: customer@example\.net\r\n/u);
    assert.match(text, /\r\nSubject: Hello there\r\n/u);
    assert.match(text, /\r\nContent-Type: text\/plain; charset=UTF-8\r\n/u);
    const body = text.split("\r\n\r\n")[1].replace(/\r\n/gu, "");
    assert.equal(Buffer.from(body, "base64").toString("utf8"), "First line\nSecond line");
  });
});

test("mail submitted as raw MIME is sent as it is, with lines that start with a dot stuffed", async () => {
  await withServer({}, async (server) => {
    const raw = "From: ops@sender.example\r\nSubject: raw\r\n\r\n.starts with a dot\r\nplain\r\n";
    const outcome = await sendViaSmtp(config(server), payload({ rawMimeBase64: Buffer.from(raw, "latin1").toString("base64") }));
    assert.equal(outcome.accepted, true);
    const text = server.sessions[0].data.toString("latin1");
    assert.ok(text.includes("\r\n\r\n..starts with a dot\r\nplain\r\n"), "the leading dot is doubled on the wire");
    assert.ok(text.startsWith("From: ops@sender.example\r\nSubject: raw\r\n"));
  });
});

test("a reply of 4xx is a retryable failure, at the recipient and after the message data", async () => {
  await withServer({ rcpt: () => "451 4.7.1 try again later" }, async (server) => {
    const outcome = await sendViaSmtp(config(server), payload());
    assert.deepEqual(
      { accepted: outcome.accepted, errorClass: outcome.errorClass, responseCode: outcome.responseCode, retryable: outcome.retryable },
      { accepted: false, errorClass: "recipient_rejected", responseCode: "451", retryable: true }
    );
    assert.ok(!verbs(server.sessions[0]).includes("DATA"), "no message data is sent after a rejected recipient");
  });

  await withServer({ final: "452 4.2.2 mailbox full" }, async (server) => {
    const outcome = await sendViaSmtp(config(server), payload());
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, true);
    assert.equal(outcome.errorClass, "message_rejected");
    assert.equal(outcome.responseCode, "452");
  });
});

test("a reply of 5xx to the message is final, at the recipient and after the message data", async () => {
  await withServer({ rcpt: () => "550 5.1.1 no such user" }, async (server) => {
    const outcome = await sendViaSmtp(config(server), payload());
    assert.deepEqual(
      { accepted: outcome.accepted, errorClass: outcome.errorClass, responseCode: outcome.responseCode, retryable: outcome.retryable },
      { accepted: false, errorClass: "recipient_rejected", responseCode: "550", retryable: false }
    );
  });

  await withServer({ final: "554 5.6.0 message refused" }, async (server) => {
    const outcome = await sendViaSmtp(config(server), payload());
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, false);
    assert.equal(outcome.errorClass, "message_rejected");
  });
});

test("a connection that ends before the relay answers the message data is not an acceptance", async () => {
  await withServer({ final: null }, async (server) => {
    const outcome = await sendViaSmtp(config(server), payload());
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, true);
    assert.equal(outcome.errorClass, "connection_closed");
    assert.deepEqual(verbs(server.sessions[0]).slice(-1), ["DATA"]);
  });
});

test("when TLS is required, mail and credentials are never sent over a connection that is not encrypted", async () => {
  await withServer({ auth: true, tls: "none" }, async (server) => {
    const outcome = await sendViaSmtp(config(server, { password: "pw-never-sent", tls: "starttls", user: "relay-user" }), payload());
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, true);
    assert.equal(outcome.errorClass, "tls_unavailable");
    const [session] = server.sessions;
    assert.deepEqual(verbs(session), ["EHLO"], "nothing but EHLO went over the clear connection");
    assert.equal(session.auth, undefined);
  });
});

test("STARTTLS: the relay sees EHLO, STARTTLS, a new EHLO over TLS, then AUTH and the mail", async () => {
  await withServer({ auth: true, tls: "starttls" }, async (server) => {
    const outcome = await sendViaSmtp(config(server, { password: "pw-for-test", tls: "starttls", user: "relay-user" }), payload());
    assert.equal(outcome.accepted, true);
    const [session] = server.sessions;
    assert.deepEqual(verbs(session), ["EHLO", "STARTTLS", "EHLO", "AUTH", "MAIL", "RCPT", "DATA", "QUIT"]);
    assert.equal(session.tlsUpgraded, true);
    assert.equal(session.auth, "\u0000relay-user\u0000pw-for-test");
    assert.ok(!JSON.stringify(outcome).includes("pw-for-test"), "the password is not part of the result");
  });
});

test("a line the relay sends together with its answer to STARTTLS ends the delivery before the handshake", async () => {
  await withServer({ extraAfterStarttls: "250 injected line\r\n", tls: "starttls" }, async (server) => {
    const outcome = await sendViaSmtp(config(server, { tls: "starttls" }), payload());
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, true);
    assert.equal(outcome.errorClass, "unexpected_reply");
    const [session] = server.sessions;
    assert.deepEqual(verbs(session), ["EHLO", "STARTTLS"]);
    assert.ok(!verbs(session).includes("MAIL"));
  });
});

test("credentials are not sent to a relay that does not offer AUTH PLAIN", async () => {
  await withServer({ auth: true, authLine: "AUTH LOGIN", tls: "starttls" }, async (server) => {
    const outcome = await sendViaSmtp(config(server, { password: "pw-not-sent", tls: "starttls", user: "relay-user" }), payload());
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, true);
    assert.equal(outcome.errorClass, "relay_auth_unavailable");
    assert.equal(server.sessions[0].auth, undefined);
    assert.ok(!verbs(server.sessions[0]).includes("AUTH"));
  });
});

test("a reply that is too large or has too many lines ends the delivery", async () => {
  await withServer({ greeting: `220 ${"x".repeat(70000)}` }, async (server) => {
    const outcome = await sendViaSmtp(config(server), payload());
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, true);
    assert.equal(outcome.errorClass, "reply_too_large");
  });

  const manyLines = `${Array.from({ length: 150 }, (_, index) => `220-line ${index}`).join("\r\n")}\r\n220 end`;
  await withServer({ greeting: manyLines }, async (server) => {
    const outcome = await sendViaSmtp(config(server), payload());
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, true);
    assert.equal(outcome.errorClass, "reply_too_large");
  });
});

test("a message without recipients is refused before any connection is made", async () => {
  await withServer({}, async (server) => {
    const outcome = await sendViaSmtp(config(server), payload({ recipients: [], to: [] }));
    assert.deepEqual({ accepted: outcome.accepted, errorClass: outcome.errorClass, retryable: outcome.retryable }, { accepted: false, errorClass: "no_recipients", retryable: false });
    assert.equal(server.sessions.length, 0);
  });
});

test("implicit TLS accepts mail and carries the credentials", async () => {
  await withServer({ auth: true, tls: "implicit" }, async (server) => {
    const outcome = await sendViaSmtp(config(server, { password: "pw-implicit", tls: "implicit", user: "relay-user" }), payload());
    assert.equal(outcome.accepted, true);
    assert.equal(server.sessions[0].auth, "\u0000relay-user\u0000pw-implicit");
  });
});

test("a certificate that is not trusted stops the delivery before any mail is sent, and can be retried", async () => {
  await withServer({ tls: "starttls" }, async (server) => {
    const outcome = await sendViaSmtp(config(server, { tls: "starttls", tlsOptions: {} }), payload());
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, true);
    assert.equal(outcome.errorClass, "tls_verification_failed");
    assert.ok(!verbs(server.sessions[0]).includes("MAIL"));
  });
});

test("rejected credentials are retried later, they do not fail the message", async () => {
  await withServer({ auth: true, authReply: "535 5.7.8 bad credentials", tls: "starttls" }, async (server) => {
    const outcome = await sendViaSmtp(config(server, { password: "wrong", tls: "starttls", user: "relay-user" }), payload());
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, true);
    assert.equal(outcome.errorClass, "relay_auth_failed");
    assert.equal(outcome.responseCode, "535");
    assert.ok(!verbs(server.sessions[0]).includes("MAIL"));
  });
});

test("a relay that never answers ends in a retryable timeout within the limit", async () => {
  await withServer({ silent: true }, async (server) => {
    const started = Date.now();
    const outcome = await sendViaSmtp(config(server, { timeoutMs: 300 }), payload());
    const elapsed = Date.now() - started;
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, true);
    assert.equal(outcome.errorClass, "timeout");
    assert.ok(elapsed >= 250 && elapsed < 3000, `took ${elapsed} ms`);
  });
});

test("a refused connection is a retryable failure", async () => {
  const outcome = await sendViaSmtp({ heloName: "client.test", host: "127.0.0.1", port: await closedPort(), timeoutMs: 3000, tls: "none" }, payload());
  assert.equal(outcome.accepted, false);
  assert.equal(outcome.retryable, true);
  assert.equal(outcome.errorClass, "connection_refused");
});

test("addresses and headers that could add a line or a command are refused before any connection is made", async () => {
  await withServer({}, async (server) => {
    const cases = [
      ["recipient", { recipients: ["victim@example.net\r\nRCPT TO:<other@example.net>"] }, "invalid_address"],
      ["recipient with a line feed only", { recipients: ["victim@example.net\nDATA"] }, "invalid_address"],
      ["envelope sender", { envelopeFrom: "ops@sender.example>\r\nMAIL FROM:<x@example.net" }, "invalid_address"],
      ["display name", { from: { email: "ops@sender.example", name: "Ops\r\nBcc: other@example.net" } }, "invalid_header"],
      ["subject", { subject: "Hi\r\nBcc: other@example.net" }, "invalid_header"],
      ["extra header value", { headers: { "X-Custom": "a\r\nBcc: other@example.net" } }, "invalid_header"],
      ["extra header name", { headers: { "X-Custom: a\r\nBcc": "other@example.net" } }, "invalid_header"]
    ];

    for (const [label, overrides, errorClass] of cases) {
      const outcome = await sendViaSmtp(config(server), payload(overrides));
      assert.equal(outcome.accepted, false, label);
      assert.equal(outcome.retryable, false, label);
      assert.equal(outcome.errorClass, errorClass, label);
    }

    assert.equal(server.sessions.length, 0, "the relay was never contacted");
  });
});

test("a message with attachments is refused: the queue keeps no attachment content to send", async () => {
  await withServer({}, async (server) => {
    const outcome = await sendViaSmtp(config(server), payload({ attachments: [{ contentType: "application/pdf", filename: "a.pdf", sizeBytes: 10 }] }));
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.retryable, false);
    assert.equal(outcome.errorClass, "attachment_content_unavailable");
    assert.equal(server.sessions.length, 0);
  });
});

test("a message over the size limit or with too many recipients fails at once, without a connection", async () => {
  await withServer({}, async (server) => {
    const tooLarge = await sendViaSmtp(config(server, { maxMessageBytes: 1024 }), payload({ text: "x".repeat(2000) }));
    assert.deepEqual(
      { accepted: tooLarge.accepted, errorClass: tooLarge.errorClass, retryable: tooLarge.retryable },
      { accepted: false, errorClass: "message_too_large", retryable: false }
    );

    const raw = Buffer.from(`Subject: raw\r\n\r\n${"y".repeat(3000)}\r\n`, "latin1").toString("base64");
    const rawTooLarge = await sendViaSmtp(config(server, { maxMessageBytes: 1024 }), payload({ rawMimeBase64: raw }));
    assert.equal(rawTooLarge.errorClass, "message_too_large");

    const recipients = ["a@example.net", "b@example.net", "c@example.net"];
    const tooMany = await sendViaSmtp(config(server, { maxRecipients: 2 }), payload({ recipients, to: recipients.map((email) => ({ email })) }));
    assert.deepEqual(
      { accepted: tooMany.accepted, errorClass: tooMany.errorClass, retryable: tooMany.retryable },
      { accepted: false, errorClass: "too_many_recipients", retryable: false }
    );

    assert.equal(server.sessions.length, 0, "the relay was never contacted");
    const within = await sendViaSmtp(config(server, { maxMessageBytes: 4096, maxRecipients: 3 }), payload({ recipients, to: recipients.map((email) => ({ email })) }));
    assert.equal(within.accepted, true, "the limits are inclusive");
  });
});

test("settings come from MAIL_RELAY_* and are checked", () => {
  const resolved = resolveSmtpRelayConfig({
    MAIL_RELAY_HELO_NAME: "mailer.example",
    MAIL_RELAY_HOST: "relay.example",
    MAIL_RELAY_PASSWORD: "secret-from-env",
    MAIL_RELAY_USER: "relay-user"
  });
  assert.deepEqual(
    { heloName: resolved.heloName, host: resolved.host, port: resolved.port, timeoutMs: resolved.timeoutMs, tls: resolved.tls, user: resolved.user },
    { heloName: "mailer.example", host: "relay.example", port: 587, timeoutMs: 30000, tls: "starttls", user: "relay-user" }
  );
  assert.equal(resolved.password, "secret-from-env");
  assert.equal(resolveSmtpRelayConfig({ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_TLS: "implicit" }).port, 465);
  for (const host of ["127.0.0.1", "127.0.1.5", "::1", "localhost"]) {
    assert.equal(resolveSmtpRelayConfig({ MAIL_RELAY_HOST: host, MAIL_RELAY_TLS: "none" }).tls, "none", `${host} may use unencrypted SMTP`);
  }
  assert.deepEqual(
    { maxMessageBytes: resolved.maxMessageBytes, maxRecipients: resolved.maxRecipients },
    { maxMessageBytes: 10485760, maxRecipients: 100 }
  );
  const limited = resolveSmtpRelayConfig({ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_MAX_MESSAGE_BYTES: "2048", MAIL_RELAY_MAX_RECIPIENTS: "5" });
  assert.deepEqual({ maxMessageBytes: limited.maxMessageBytes, maxRecipients: limited.maxRecipients }, { maxMessageBytes: 2048, maxRecipients: 5 });

  const refused = [
    [{}, /MAIL_RELAY_HOST is required/u],
    [{ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_USER: "u" }, /set together/u],
    [{ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_PASSWORD: "p" }, /set together/u],
    [{ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_PASSWORD: "p", MAIL_RELAY_TLS: "none", MAIL_RELAY_USER: "u" }, /credentials are never sent without TLS/u],
    [{ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_TLS: "none" }, /only allowed for a relay on this machine/u],
    [{ MAIL_RELAY_HOST: "127.0.0.1", MAIL_RELAY_TLS: "none", NODE_ENV: "production" }, /not allowed when NODE_ENV is "production"/u],
    [{ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_TLS: "maybe" }, /MAIL_RELAY_TLS must be/u],
    [{ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_PORT: "70000" }, /MAIL_RELAY_PORT must be an integer from 1 to 65535/u],
    [{ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_TIMEOUT_SECONDS: "0" }, /MAIL_RELAY_TIMEOUT_SECONDS must be an integer from 1 to 120/u],
    [{ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_MAX_MESSAGE_BYTES: "10" }, /MAIL_RELAY_MAX_MESSAGE_BYTES must be an integer from 1024 to 52428800/u],
    [{ MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_MAX_RECIPIENTS: "0" }, /MAIL_RELAY_MAX_RECIPIENTS must be an integer from 1 to 1000/u],
    [{ MAIL_RELAY_HOST: "relay example" }, /host name or an IP address/u]
  ];
  for (const [env, pattern] of refused) {
    assert.throws(() => resolveSmtpRelayConfig(env), pattern);
  }

  for (const env of refused.map(([entry]) => ({ ...entry, MAIL_RELAY_PASSWORD: "super-secret-value", MAIL_RELAY_USER: "u" }))) {
    try {
      resolveSmtpRelayConfig(env);
    } catch (error) {
      assert.ok(!String(error.message).includes("super-secret-value"), "no error message carries the password");
    }
  }
});

test("the queue only uses the relay when asked to: the default stays without a provider", () => {
  const withRelayVariables = { MAIL_RELAY_HOST: "relay.example", MAIL_RELAY_PASSWORD: "p", MAIL_RELAY_USER: "u" };
  const defaults = resolveQueueSettings({}, withRelayVariables);
  assert.equal(defaults.deliver.name, "noProviderQueueDelivery");
  assert.throws(() => resolveQueueSettings({}, { MAIL_PROVIDER_ADAPTER: "smtp" }), /MAIL_RELAY_HOST is required/u);
  assert.throws(() => resolveQueueSettings({}, { MAIL_PROVIDER_ADAPTER: "ses" }), /must be "none", "fake" or "smtp"/u);
  assert.equal(typeof resolveQueueSettings({}, { ...withRelayVariables, MAIL_PROVIDER_ADAPTER: "smtp" }).deliver, "function");

  // the relay must give up before the queue stops waiting, or a message the relay still accepts is sent again
  const smtp = { ...withRelayVariables, MAIL_PROVIDER_ADAPTER: "smtp" };
  assert.throws(() => resolveQueueSettings({}, { ...smtp, MAIL_RELAY_TIMEOUT_SECONDS: "60" }), /MAIL_RELAY_TIMEOUT_SECONDS must be shorter than the delivery timeout/u);
  assert.throws(() => resolveQueueSettings({}, { ...smtp, MAIL_RELAY_TIMEOUT_SECONDS: "45", MAIL_QUEUE_DELIVERY_TIMEOUT_SECONDS: "40" }), /shorter than the delivery timeout/u);
  assert.equal(typeof resolveQueueSettings({}, { ...smtp, MAIL_RELAY_TIMEOUT_SECONDS: "59" }).deliver, "function");
  assert.equal(typeof resolveQueueSettings({}, { ...smtp, MAIL_RELAY_TIMEOUT_SECONDS: "45", MAIL_QUEUE_DELIVERY_TIMEOUT_SECONDS: "50" }).deliver, "function");
  assert.equal(typeof resolveQueueSettings({}, { ...withRelayVariables, MAIL_PROVIDER_ADAPTER: "smtp", NODE_ENV: "production" }).deliver, "function");
});

// --- through the queue ---

const API_KEY = "mail-api-key-for-relay-tests";
const WORKSPACE = "ws_relay";
const SEED = {
  blockedRecipient: "blocked@example.com",
  defaultSender: "ops@sender.example",
  password: "smtp-secret",
  primaryDomain: "sender.example",
  username: "user-relay",
  workspaceId: WORKSPACE
};

function tempDb() {
  const dbPath = `/tmp/iai-mail-api-relay-${randomUUID()}.sqlite`;
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

function rows(dbPath, sql) {
  const db = new DatabaseSync(dbPath);
  try {
    return db.prepare(sql).all().map((row) => ({ ...row }));
  } finally {
    db.close();
  }
}

async function send(backend, key) {
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  const response = await dispatchToHandler(handler, {
    body: JSON.stringify({
      from: { email: "ops@sender.example" },
      message_idempotency_key: key,
      stream: "transactional",
      subject: "Queue relay",
      text: "hello through the relay",
      to: [{ email: "customer@example.net" }]
    }),
    headers: { authorization: `Bearer ${API_KEY}`, "x-workspace-id": WORKSPACE },
    method: "POST",
    url: "/v1/send"
  });
  assert.equal(response.status, 202);
  return (await response.json()).data;
}

test("through the queue: accepted after the relay's 250, deferred on 4xx and retried, failed on 5xx", async () => {
  const { cleanup, dbPath, url } = tempDb();
  let current = Date.parse("2026-10-13T10:00:00.000Z");
  const replies = { final: "250 2.0.0 queued as q-1" };
  // the fake server reads the reply to the message data from this object each time
  const live = await startFakeSmtp({ certificate, get final() { return replies.final; } });
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: url,
    queue: { maxAttempts: 3, now: () => new Date(current), providerAdapter: "smtp", random: () => 0, smtpRelay: config(live) },
    seed: SEED
  });
  try {
    const accepted = await send(backend, "relay-ok");
    assert.equal(accepted.delivery_status, "provider_accepted");
    assert.deepEqual(
      rows(dbPath, "SELECT status, provider_response_code AS code FROM delivery_attempts;"),
      [{ code: "250", status: "accepted" }]
    );
    assert.equal(rows(dbPath, "SELECT COUNT(*) AS n FROM message_events WHERE event_type = 'provider_accepted';")[0].n, 1);

    replies.final = "451 4.3.0 try later";
    const deferred = await send(backend, "relay-defer");
    assert.equal(deferred.delivery_status, "deferred");
    assert.equal(
      rows(dbPath, `SELECT status FROM messages WHERE id = '${deferred.message_id}';`)[0].status,
      "deferred"
    );

    replies.final = "250 2.0.0 queued as q-2";
    current += 3600 * 1000;
    assert.equal(await backend.queue.processNextAsync(), true);
    assert.equal(
      rows(dbPath, `SELECT status FROM messages WHERE id = '${deferred.message_id}';`)[0].status,
      "provider_accepted"
    );

    replies.final = "554 5.7.1 refused";
    const failed = await send(backend, "relay-fail");
    assert.equal(failed.delivery_status, "failed");
    assert.equal(rows(dbPath, `SELECT status FROM smtp_queue_jobs WHERE message_id = '${failed.message_id}';`)[0].status, "failed");
  } finally {
    backend.close();
    await live.close();
    cleanup();
  }
});

test("the relay adapter runs through the mail worker's own runtime", async () => {
  await withServer({}, async (server) => {
    const adapter = createSmtpProviderAdapter(config(server));
    const route = { active: true, priority: 1, provider: "smtp", routeId: "route_relay", streams: ["transactional"] };
    const result = await processQueuedMessage(payload(), { adapters: { smtp: adapter }, routes: [route] });
    assert.equal(result.deliveryAttempt.status, "accepted");
    assert.equal(result.timelineEvent.eventType, "provider_accepted");
    assert.equal(result.deliveryAttempt.providerResponseCode, "250");
  });

  await withServer({ rcpt: () => "450 4.2.0 greylisted" }, async (server) => {
    const adapter = createSmtpProviderAdapter(config(server));
    const route = { active: true, priority: 1, provider: "smtp", routeId: "route_relay", streams: ["transactional"] };
    const result = await processQueuedMessage(payload(), { adapters: { smtp: adapter }, routes: [route] });
    assert.equal(result.deliveryAttempt.status, "deferred");
    assert.equal(result.deliveryAttempt.errorClass, "provider_transient_failure");
  });

  await withServer({ rcpt: () => "550 5.1.1 unknown" }, async (server) => {
    const adapter = createSmtpProviderAdapter(config(server));
    const route = { active: true, priority: 1, provider: "smtp", routeId: "route_relay", streams: ["transactional"] };
    const result = await processQueuedMessage(payload(), { adapters: { smtp: adapter }, routes: [route] });
    assert.equal(result.deliveryAttempt.status, "failed");
    assert.equal(result.deliveryAttempt.errorClass, "provider_permanent_failure");
  });
});

test("the health probe says EHLO and sends no mail", async () => {
  await withServer({ tls: "starttls" }, async (server) => {
    assert.deepEqual(await probeSmtpRelay(config(server, { tls: "starttls" })), { ok: true });
    assert.ok(!verbs(server.sessions[0]).includes("MAIL"));
  });

  await withServer({ tls: "none" }, async (server) => {
    assert.deepEqual(await probeSmtpRelay(config(server, { tls: "starttls" })), { detail: "tls_unavailable", ok: false });
  });

  const probe = await probeSmtpRelay({ heloName: "client.test", host: "127.0.0.1", port: await closedPort(), timeoutMs: 2000, tls: "none" });
  assert.deepEqual(probe, { detail: "connection_refused", ok: false });
});
