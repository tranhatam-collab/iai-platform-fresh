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
