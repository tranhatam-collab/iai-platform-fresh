import test from "node:test";
import assert from "node:assert/strict";

import { loadMailSmtpConfig } from "../../packages/config/dist/index.js";
import { createRemoteMailSmtpDependencies } from "../../apps/mail-smtp/dist/remote-backend.js";

function createRemoteConfig() {
  return loadMailSmtpConfig({
    MAIL_DB_URL: "postgres://postgres:postgres@localhost:5432/iai_mail",
    MAIL_SMTP_BACKEND_MODE: "remote",
    MAIL_SMTP_REMOTE_AUTH_PATH: "auth",
    MAIL_SMTP_REMOTE_AUDIT_PATH: "audit",
    MAIL_SMTP_REMOTE_BASE_URL: "https://control.mail.iai.one/v1/internal/smtp/",
    MAIL_SMTP_REMOTE_MAIL_FROM_PATH: "mail-from",
    MAIL_SMTP_REMOTE_NORMALIZE_PATH: "normalize",
    MAIL_SMTP_REMOTE_QUEUE_PATH: "queue",
    MAIL_SMTP_REMOTE_RECIPIENT_PATH: "recipient",
    MAIL_SMTP_REMOTE_TOKEN: "remote-token",
    NODE_ENV: "production"
  });
}

function withMockFetch(handler) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json"
    },
    status
  });
}

test("remote backend sends auth request to configured endpoint and unwraps envelope response", async () => {
  const config = createRemoteConfig();
  const dependencies = createRemoteMailSmtpDependencies(config);

  let seenRequest;
  const restore = withMockFetch(async (url, init) => {
    seenRequest = { init, url };
    return jsonResponse({
      ok: true,
      data: {
        credentialId: "smtpcred_123",
        workspaceId: "ws_123",
        principal: "smtp-user",
        defaultStream: "transactional",
        allowedStreams: ["transactional", "system"]
      }
    });
  });

  try {
    const result = await dependencies.authenticate({
      method: "LOGIN",
      password: "secret",
      secure: true,
      username: "smtp-user"
    });

    assert.equal(result.credentialId, "smtpcred_123");
    assert.equal(
      seenRequest.url,
      "https://control.mail.iai.one/v1/internal/smtp/auth"
    );
    assert.equal(seenRequest.init.method, "POST");
    assert.equal(seenRequest.init.headers.authorization, "Bearer remote-token");
  } finally {
    restore();
  }
});

test("remote backend maps normalize response and decodes rawMimeBase64", async () => {
  const config = createRemoteConfig();
  const dependencies = createRemoteMailSmtpDependencies(config);

  const restore = withMockFetch(async (_url, init) => {
    const body = JSON.parse(String(init.body));
    assert.equal(
      body.rawMimeBase64,
      Buffer.from("hello", "utf8").toString("base64")
    );

    return jsonResponse({
      workspaceId: "ws_123",
      credentialId: "smtpcred_123",
      stream: "transactional",
      envelopeFrom: "no-reply@tx.iai.one",
      headers: {
        subject: "Normalized"
      },
      recipients: ["user@example.com"],
      subject: "Normalized",
      rawMimeBase64: Buffer.from("normalized", "utf8").toString("base64")
    });
  });

  try {
    const result = await dependencies.normalizeMessage({
      auth: {
        allowedStreams: ["transactional"],
        credentialId: "smtpcred_123",
        defaultStream: "transactional",
        principal: "smtp-user",
        workspaceId: "ws_123"
      },
      envelopeFrom: "no-reply@tx.iai.one",
      rawMime: Buffer.from("hello", "utf8"),
      recipients: ["user@example.com"],
      stream: "transactional"
    });

    assert.equal(result.subject, "Normalized");
    assert.equal(result.rawMime.toString("utf8"), "normalized");
    assert.equal(result.source, "smtp");
    assert.match(result.messageId, /^msg_/u);
    assert.match(result.traceId, /^trace_/u);
  } finally {
    restore();
  }
});

test("remote backend maps envelope error to SMTP error", async () => {
  const config = createRemoteConfig();
  const dependencies = createRemoteMailSmtpDependencies(config);

  const restore = withMockFetch(async () =>
    jsonResponse(
      {
        ok: false,
        error: {
          message: "Recipient is suppressed",
          details: {
            smtpCode: 550
          }
        }
      },
      422
    )
  );

  try {
    await assert.rejects(
      () =>
        dependencies.authorizeRecipient({
          auth: {
            allowedStreams: ["transactional"],
            credentialId: "smtpcred_123",
            defaultStream: "transactional",
            principal: "smtp-user",
            workspaceId: "ws_123"
          },
          envelopeFrom: "no-reply@tx.iai.one",
          recipient: "blocked@example.com",
          recipientCount: 1,
          stream: "transactional"
        }),
      (error) =>
        error instanceof Error &&
        error.message.includes("Recipient is suppressed") &&
        error.responseCode === 550
    );
  } finally {
    restore();
  }
});

test("remote backend healthcheck falls back cleanly when fetch throws", async () => {
  const config = createRemoteConfig();
  const dependencies = createRemoteMailSmtpDependencies(config);

  const restore = withMockFetch(async () => {
    throw new Error("network unreachable");
  });

  try {
    const result = await dependencies.healthcheck();

    assert.equal(result.ok, false);
    assert.equal(result.mode, "remote");
    assert.equal(result.checks[0]?.name, "smtp_remote_dependencies");
  } finally {
    restore();
  }
});

test("remote backend queue result falls back to normalized trace contract fields", async () => {
  const config = createRemoteConfig();
  const dependencies = createRemoteMailSmtpDependencies(config);

  let seenRequest;
  const restore = withMockFetch(async (_url, init) => {
    seenRequest = JSON.parse(String(init.body));
    return jsonResponse({
      providerRoute: "transactional_primary",
      queuedAt: "2026-04-14T10:00:00.000Z"
    });
  });

  try {
    const result = await dependencies.publishToQueue({
      attachments: [],
      bcc: [],
      cc: [],
      credentialId: "smtpcred_123",
      envelopeFrom: "no-reply@tx.iai.one",
      headers: {
        subject: "Queued"
      },
      messageId: "msg_123",
      messageIdempotencyKey: "trace_123",
      rawMime: Buffer.from("hello", "utf8"),
      recipients: ["user@example.com"],
      smtpSessionId: "smtp_123",
      source: "smtp",
      stream: "transactional",
      submittedAt: "2026-04-14T09:59:00.000Z",
      text: "hello",
      to: [{ email: "user@example.com" }],
      traceId: "trace_123",
      workspaceId: "ws_123"
    });

    assert.equal(seenRequest.rawMimeBase64, Buffer.from("hello", "utf8").toString("base64"));
    assert.equal(result.messageId, "msg_123");
    assert.equal(result.traceId, "trace_123");
    assert.equal(result.smtpSessionId, "smtp_123");
    assert.equal(result.providerRoute, "transactional_primary");
  } finally {
    restore();
  }
});

// --- SMTP reply codes for failures of the remote backend ----------------------

const BASE_URL_HOST = "control.mail.iai.one";

function dependenciesFor(config) {
  return createRemoteMailSmtpDependencies(config);
}

const auth = { method: "LOGIN", password: "secret", secure: true, username: "smtp-user" };
const sessionAuth = {
  allowedStreams: ["transactional"],
  credentialId: "smtpcred_123",
  defaultStream: "transactional",
  principal: "smtp-user",
  workspaceId: "ws_123"
};
const normalizedMessage = {
  auth: sessionAuth,
  envelopeFrom: "no-reply@tx.iai.one",
  rawMime: Buffer.from("hello", "utf8"),
  recipients: ["user@example.com"],
  stream: "transactional"
};
const queuedMessage = {
  attachments: [],
  bcc: [],
  cc: [],
  credentialId: "smtpcred_123",
  envelopeFrom: "no-reply@tx.iai.one",
  headers: { subject: "Queued" },
  messageId: "msg_123",
  messageIdempotencyKey: "trace_123",
  rawMime: Buffer.from("hello", "utf8"),
  recipients: ["user@example.com"],
  smtpSessionId: "smtp_123",
  source: "smtp",
  stream: "transactional",
  submittedAt: "2026-04-14T09:59:00.000Z",
  text: "hello",
  to: [{ email: "user@example.com" }],
  traceId: "trace_123",
  workspaceId: "ws_123"
};

/** Each operation of the remote backend, with a call that exercises it. */
const OPERATIONS = {
  auth: (dependencies) => dependencies.authenticate(auth),
  mailFrom: (dependencies) =>
    dependencies.authorizeMailFrom({ auth: sessionAuth, envelopeFrom: "no-reply@tx.iai.one", stream: "transactional" }),
  recipient: (dependencies) =>
    dependencies.authorizeRecipient({ auth: sessionAuth, envelopeFrom: "no-reply@tx.iai.one", recipient: "user@example.com", stream: "transactional" }),
  normalize: (dependencies) => dependencies.normalizeMessage(normalizedMessage),
  queue: (dependencies) => dependencies.publishToQueue(queuedMessage),
  audit: (dependencies) =>
    dependencies.recordAudit({ action: "test", actorIdentifier: "smtp-user", actorType: "smtp-credential", targetType: "session", workspaceId: "ws_123" })
};

/** Temporary-failure code per operation: 454 for authentication, 451 otherwise. */
const TEMPORARY_CODE = { audit: 451, auth: 454, mailFrom: 451, normalize: 451, queue: 451, recipient: 451 };
/** Code for a plain 4xx with no smtpCode: the existing per-operation default. */
const CLIENT_ERROR_CODE = { audit: 451, auth: 535, mailFrom: 550, normalize: 550, queue: 451, recipient: 550 };

async function failureOf(call) {
  try {
    await call();
  } catch (error) {
    return error;
  }
  assert.fail("expected the call to fail");
}

for (const [operation, call] of Object.entries(OPERATIONS)) {
  test(`remote ${operation}: fetch failures and timeouts are temporary (${TEMPORARY_CODE[operation]}) with a generic message`, async () => {
    const dependencies = dependenciesFor(createRemoteConfig());
    const failures = [
      Object.assign(new TypeError("fetch failed"), { cause: Object.assign(new Error("connect ECONNREFUSED 10.0.0.9:443"), { code: "ECONNREFUSED" }) }),
      Object.assign(new TypeError("fetch failed"), { cause: Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" }) }),
      new DOMException("The operation was aborted due to timeout", "TimeoutError"),
      new Error("getaddrinfo ENOTFOUND control.mail.iai.one")
    ];

    for (const failure of failures) {
      const restore = withMockFetch(async () => {
        throw failure;
      });
      try {
        const error = await failureOf(() => call(dependencies));
        assert.equal(error.responseCode, TEMPORARY_CODE[operation], `${failure.message}`);
        assert.equal(error.message, "Remote backend is temporarily unavailable");
        assert.ok(!error.message.includes(BASE_URL_HOST) && !/10\.0\.0\.9|ECONN/u.test(error.message));
      } finally {
        restore();
      }
    }
  });

  test(`remote ${operation}: 500, 502, 503 and 429 without an smtpCode are temporary (${TEMPORARY_CODE[operation]})`, async () => {
    const dependencies = dependenciesFor(createRemoteConfig());
    for (const status of [500, 502, 503, 504, 429]) {
      for (const body of [
        () => jsonResponse({ ok: false, error: { code: "INTERNAL_ERROR", message: "Upstream trouble" } }, status),
        () => new Response("upstream says no", { headers: { "content-type": "text/plain" }, status }),
        () => new Response(null, { status })
      ]) {
        const restore = withMockFetch(async () => body());
        try {
          const error = await failureOf(() => call(dependencies));
          assert.equal(error.responseCode, TEMPORARY_CODE[operation], `${status}`);
          assert.ok(!error.message.includes(BASE_URL_HOST), "the upstream address is not in the message");
        } finally {
          restore();
        }
      }
    }
  });

  test(`remote ${operation}: a plain 4xx without an smtpCode keeps the default (${CLIENT_ERROR_CODE[operation]})`, async () => {
    const dependencies = dependenciesFor(createRemoteConfig());
    for (const status of [400, 403, 404, 422]) {
      const restore = withMockFetch(async () => jsonResponse({ ok: false, error: { code: "VALIDATION_ERROR", message: "Rejected" } }, status));
      try {
        const error = await failureOf(() => call(dependencies));
        assert.equal(error.responseCode, CLIENT_ERROR_CODE[operation], `${status}`);
        assert.equal(error.message, "Rejected");
      } finally {
        restore();
      }
    }
  });

  test(`remote ${operation}: an smtpCode sent by the backend wins over the status default`, async () => {
    const dependencies = dependenciesFor(createRemoteConfig());
    for (const [status, smtpCode] of [[503, 452], [400, 554], [500, 535]]) {
      const restore = withMockFetch(async () => jsonResponse({ ok: false, error: { code: "X", message: "Backend says", details: { smtpCode } } }, status));
      try {
        const error = await failureOf(() => call(dependencies));
        assert.equal(error.responseCode, smtpCode, `${status}`);
      } finally {
        restore();
      }
    }
  });
}

test("remote queue: a 400 response answers 451, not a permanent failure", async () => {
  const dependencies = dependenciesFor(createRemoteConfig());
  const restore = withMockFetch(async () => jsonResponse({ ok: false, error: { code: "VALIDATION_ERROR", message: "Bad payload" } }, 400));
  try {
    const error = await failureOf(() => OPERATIONS.queue(dependencies));
    assert.equal(error.responseCode, 451);
  } finally {
    restore();
  }
});

test("remote backend: a response body that cannot be read or parsed is temporary, like an unavailable backend", async () => {
  const dependencies = dependenciesFor(createRemoteConfig());
  const truncated = () =>
    new Response('{"ok":true,"data":', { headers: { "content-type": "application/json" }, status: 200 });
  const restore = withMockFetch(async () => truncated());
  try {
    assert.equal((await failureOf(() => OPERATIONS.auth(dependencies))).responseCode, 454);
    assert.equal((await failureOf(() => OPERATIONS.queue(dependencies))).responseCode, 451);
  } finally {
    restore();
  }
});

test("remote backend: a raw error body is not echoed and the base URL never appears in a message", async () => {
  const dependencies = dependenciesFor(createRemoteConfig());
  const restore = withMockFetch(async () => new Response("secret-ish upstream detail 10.1.2.3", { headers: { "content-type": "text/plain" }, status: 502 }));
  try {
    for (const call of Object.values(OPERATIONS)) {
      const error = await failureOf(() => call(dependencies));
      assert.ok(!error.message.includes("secret-ish") && !error.message.includes("10.1.2.3"), error.message);
      assert.ok(!error.message.includes(BASE_URL_HOST), error.message);
    }
  } finally {
    restore();
  }
});

test("remote backend: authentication headers are unchanged (bearer token still sent)", async () => {
  const dependencies = dependenciesFor(createRemoteConfig());
  let headers;
  const restore = withMockFetch(async (_url, init) => {
    headers = init.headers;
    throw new Error("down");
  });
  try {
    await failureOf(() => OPERATIONS.auth(dependencies));
    assert.equal(headers.authorization, "Bearer remote-token");
    assert.equal(headers["content-type"], "application/json");
  } finally {
    restore();
  }
});
