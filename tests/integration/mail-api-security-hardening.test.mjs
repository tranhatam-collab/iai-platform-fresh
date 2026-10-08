/**
 * Security regression tests for the mail-api internal SMTP / send surface.
 *
 * Covers:
 *   - /v1/internal/smtp/* fails closed when no service token is configured,
 *     with an explicit (non-production) opt-in for dev/tests
 *   - service token and API key are checked in constant time (wrong, short and
 *     long values are all plain 401s)
 *   - persisted-message GET routes need the same API key as POST /v1/send
 *   - bootstrap refuses to start in production without a service token
 *
 * See also mail-api-default-seed.test.mjs and mail-api-input-limits.test.mjs.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { bootstrapFromEnv } from "../../apps/mail-api/dist/bootstrap.js";
import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const BOOTSTRAP_PATH = fileURLToPath(new URL("../../apps/mail-api/dist/bootstrap.js", import.meta.url));
const SERVICE_TOKEN = "internal-service-token-for-tests";
const API_KEY = "mail-api-key-for-tests";
const MEMORY_DB = "sqlite::memory:";

const ENV_KEYS = [
  "MAIL_API_KEY",
  "MAIL_API_MAX_BODY_BYTES",
  "MAIL_DB_URL",
  "MAIL_SMTP_ALLOW_UNAUTHENTICATED_INTERNAL",
  "MAIL_SMTP_REMOTE_TOKEN",
  "NODE_ENV"
];

/** Run `fn` with exactly `vars` set for the keys this suite cares about. */
async function withEnv(vars, fn) {
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  Object.assign(process.env, vars);
  try {
    return await fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  }
}

function internalPost(handler, operation, body, headers = {}) {
  return dispatchToHandler(handler, {
    body: JSON.stringify(body),
    headers,
    method: "POST",
    url: `/v1/internal/smtp/${operation}`
  });
}

function bearer(token) {
  return { authorization: `Bearer ${token}` };
}

function createHandler(backendOptions) {
  const backend = createSmtpInternalBackend({ databaseUrl: MEMORY_DB, ...backendOptions });
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  return { backend, handler };
}

const AUDIT_BODY = {
  action: "forged.action",
  actorType: "user",
  workspaceId: "ws_victim"
};

// --- internal-route auth: fail closed, constant-time compare ---------------

test("internal smtp routes fail closed (503) when no service token is configured", async () => {
  await withEnv({}, async () => {
    const { backend, handler } = createHandler({});
    try {
      for (const [operation, body] of [
        ["auth", { password: "dev-secret", username: "smtp-dev" }],
        ["audit", AUDIT_BODY]
      ]) {
        const response = await internalPost(handler, operation, body);
        const payload = await response.json();
        assert.equal(response.status, 503, operation);
        assert.equal(payload.ok, false);
        assert.match(payload.error.message, /MAIL_SMTP_REMOTE_TOKEN/u);

        // Sending a token anyway must not help when the server has none.
        const withToken = await internalPost(handler, operation, body, bearer(SERVICE_TOKEN));
        assert.equal(withToken.status, 503, `${operation} with token`);
      }
    } finally {
      backend.close();
    }
  });
});

test("forged audit rows are not written when the service token is missing or wrong", async () => {
  await withEnv({}, async () => {
    const dbPath = `/tmp/iai-mail-api-hardening-${randomUUID()}.sqlite`;
    const { backend, handler } = createHandler({
      databaseUrl: `sqlite:${dbPath}`,
      remoteToken: SERVICE_TOKEN
    });
    try {
      const missing = await internalPost(handler, "audit", AUDIT_BODY);
      const wrong = await internalPost(handler, "audit", AUDIT_BODY, bearer("nope"));
      const right = await internalPost(handler, "audit", AUDIT_BODY, bearer(SERVICE_TOKEN));
      assert.equal(missing.status, 401);
      assert.equal(wrong.status, 401);
      assert.equal(right.status, 200);

      const db = new DatabaseSync(dbPath);
      try {
        const rows = db.prepare("SELECT COUNT(*) AS count FROM audit_logs;").get();
        assert.equal(rows.count, 1);
      } finally {
        db.close();
      }
    } finally {
      backend.close();
      rmSync(dbPath, { force: true });
    }
  });
});

test("service token: right token passes; wrong, short, long and prefix tokens are plain 401s", async () => {
  await withEnv({}, async () => {
    const { backend, handler } = createHandler({ remoteToken: SERVICE_TOKEN });
    try {
      const right = await internalPost(handler, "audit", AUDIT_BODY, bearer(SERVICE_TOKEN));
      assert.equal(right.status, 200);

      for (const attempt of [
        undefined,
        "",
        "x",
        SERVICE_TOKEN.slice(0, -1),
        `${SERVICE_TOKEN}x`,
        `${SERVICE_TOKEN}${SERVICE_TOKEN}`,
        SERVICE_TOKEN.toUpperCase(),
        "z".repeat(5000)
      ]) {
        const headers = attempt === undefined ? {} : bearer(attempt);
        const response = await internalPost(handler, "audit", AUDIT_BODY, headers);
        assert.equal(response.status, 401, JSON.stringify(attempt)?.slice(0, 40));
        const payload = await response.json();
        assert.equal(payload.error.code, "UNAUTHORIZED");
      }

      // Raw token without the Bearer scheme is not accepted either.
      const noScheme = await internalPost(handler, "audit", AUDIT_BODY, {
        authorization: SERVICE_TOKEN
      });
      assert.equal(noScheme.status, 401);
    } finally {
      backend.close();
    }
  });
});

test("service token is read from MAIL_SMTP_REMOTE_TOKEN when no option is passed", async () => {
  await withEnv({ MAIL_SMTP_REMOTE_TOKEN: SERVICE_TOKEN }, async () => {
    const { backend, handler } = createHandler({});
    try {
      assert.equal((await internalPost(handler, "audit", AUDIT_BODY)).status, 401);
      assert.equal(
        (await internalPost(handler, "audit", AUDIT_BODY, bearer(SERVICE_TOKEN))).status,
        200
      );
    } finally {
      backend.close();
    }
  });
});

test("explicit opt-in allows unauthenticated internal routes only when no token is set", async () => {
  await withEnv({}, async () => {
    const optedIn = createHandler({ allowUnauthenticatedInternal: true });
    try {
      assert.equal((await internalPost(optedIn.handler, "audit", AUDIT_BODY)).status, 200);
    } finally {
      optedIn.backend.close();
    }

    // A configured token always wins over the opt-in.
    const tokenAndOptIn = createHandler({
      allowUnauthenticatedInternal: true,
      remoteToken: SERVICE_TOKEN
    });
    try {
      assert.equal((await internalPost(tokenAndOptIn.handler, "audit", AUDIT_BODY)).status, 401);
    } finally {
      tokenAndOptIn.backend.close();
    }

    // allowUnauthenticatedInternal: false is the same as not opting in.
    const optedOut = createHandler({ allowUnauthenticatedInternal: false });
    try {
      assert.equal((await internalPost(optedOut.handler, "audit", AUDIT_BODY)).status, 503);
    } finally {
      optedOut.backend.close();
    }
  });
});

test("MAIL_SMTP_ALLOW_UNAUTHENTICATED_INTERNAL opts in outside production but is ignored in production", async () => {
  await withEnv({ MAIL_SMTP_ALLOW_UNAUTHENTICATED_INTERNAL: "1", NODE_ENV: "development" }, async () => {
    const { backend, handler } = createHandler({});
    try {
      assert.equal((await internalPost(handler, "audit", AUDIT_BODY)).status, 200);
    } finally {
      backend.close();
    }
  });

  await withEnv({ MAIL_SMTP_ALLOW_UNAUTHENTICATED_INTERNAL: "1", NODE_ENV: "production" }, async () => {
    const { backend, handler } = createHandler({});
    try {
      assert.equal((await internalPost(handler, "audit", AUDIT_BODY)).status, 503);
    } finally {
      backend.close();
    }
  });
});

test("POST /v1/send API key: right key passes; wrong, short and long keys are 401; unset key is 503", async () => {
  await withEnv({}, async () => {
    const seed = {
      defaultSender: "pay@tranhatam.com",
      password: "smtp-secret",
      primaryDomain: "tranhatam.com",
      username: "smtp-operator",
      workspaceId: "ws_pay"
    };
    const sendBody = (key) => ({
      from: { email: "pay@tranhatam.com" },
      message_idempotency_key: `idem-${key}`,
      stream: "transactional",
      text: "hello",
      to: [{ email: "customer@example.com" }]
    });
    const send = (handler, key, authorization) =>
      dispatchToHandler(handler, {
        body: JSON.stringify(sendBody(key)),
        headers: { ...(authorization ? bearer(authorization) : {}), "x-workspace-id": "ws_pay" },
        method: "POST",
        url: "/v1/send"
      });

    const keyed = createHandler({ apiKey: API_KEY, seed });
    try {
      assert.equal((await send(keyed.handler, "ok", API_KEY)).status, 202);
      for (const attempt of [undefined, "x", API_KEY.slice(0, -1), `${API_KEY}x`, "z".repeat(5000)]) {
        assert.equal((await send(keyed.handler, `bad-${attempt?.length}`, attempt)).status, 401);
      }
    } finally {
      keyed.backend.close();
    }

    const unkeyed = createHandler({ seed });
    try {
      assert.equal((await send(unkeyed.handler, "unset", API_KEY)).status, 503);
    } finally {
      unkeyed.backend.close();
    }
  });
});

// --- persisted-message GET routes need the API key --------------------------

test("GET persisted message detail/events require the same API key as POST /v1/send", async () => {
  await withEnv({}, async () => {
    const seed = {
      defaultSender: "pay@tranhatam.com",
      primaryDomain: "tranhatam.com",
      password: "smtp-secret",
      username: "smtp-operator",
      workspaceId: "ws_pay"
    };
    const keyed = createHandler({ apiKey: API_KEY, seed });
    try {
      const sent = await dispatchToHandler(keyed.handler, {
        body: JSON.stringify({
          from: { email: "pay@tranhatam.com" },
          message_idempotency_key: "idem-get-auth",
          stream: "transactional",
          text: "hello",
          to: [{ email: "customer@example.com" }]
        }),
        headers: { ...bearer(API_KEY), "x-workspace-id": "ws_pay" },
        method: "POST",
        url: "/v1/send"
      });
      const messageId = (await sent.json()).data.message_id;

      for (const suffix of ["", "/events"]) {
        const url = `/v1/messages/${messageId}${suffix}`;
        const get = (headers) => dispatchToHandler(keyed.handler, { headers, method: "GET", url });

        // Workspace comes from the client, so without a key this is a cross-tenant read.
        assert.equal((await get({ "x-workspace-id": "ws_pay" })).status, 401, `${url} no key`);
        assert.equal(
          (await get({ ...bearer("wrong"), "x-workspace-id": "ws_pay" })).status,
          401,
          `${url} wrong key`
        );
        const ok = await get({ ...bearer(API_KEY), "x-workspace-id": "ws_pay" });
        assert.equal(ok.status, 200, `${url} right key`);
        assert.equal((await ok.json()).ok, true);

        // A key does not let a caller read another workspace's message.
        const otherWorkspace = await get({ ...bearer(API_KEY), "x-workspace-id": "ws_other" });
        assert.notEqual(otherWorkspace.status, 200, `${url} other workspace`);
      }
    } finally {
      keyed.backend.close();
    }

    // No API key configured: persisted reads are refused the same way /v1/send is.
    const dbPath = `/tmp/iai-mail-api-hardening-${randomUUID()}.sqlite`;
    const writer = createHandler({ apiKey: API_KEY, databaseUrl: `sqlite:${dbPath}`, seed });
    let messageId;
    try {
      const sent = await dispatchToHandler(writer.handler, {
        body: JSON.stringify({
          from: { email: "pay@tranhatam.com" },
          message_idempotency_key: "idem-get-unkeyed",
          stream: "transactional",
          text: "hello",
          to: [{ email: "customer@example.com" }]
        }),
        headers: { ...bearer(API_KEY), "x-workspace-id": "ws_pay" },
        method: "POST",
        url: "/v1/send"
      });
      messageId = (await sent.json()).data.message_id;
    } finally {
      writer.backend.close();
    }
    const reader = createHandler({ databaseUrl: `sqlite:${dbPath}`, seed });
    try {
      const response = await dispatchToHandler(reader.handler, {
        headers: { ...bearer(API_KEY), "x-workspace-id": "ws_pay" },
        method: "GET",
        url: `/v1/messages/${messageId}`
      });
      assert.equal(response.status, 503);
    } finally {
      reader.backend.close();
      rmSync(dbPath, { force: true });
    }
  });
});

test("GET for a message that is not persisted still falls through to the read-model routes", async () => {
  await withEnv({}, async () => {
    const { backend } = createHandler({ apiKey: API_KEY });
    try {
      const handled = await backend.handleRequest(
        { headers: { "x-workspace-id": "ws_dev" } },
        { setHeader() {}, end() {} },
        "req_fallthrough",
        new URL("http://localhost/v1/messages/msg_smtp_demo_001"),
        "GET"
      );
      assert.equal(handled, false);
    } finally {
      backend.close();
    }
  });
});

// --- startup posture --------------------------------------------------------

test("bootstrap refuses to start in production without a service token", async () => {
  await assert.rejects(
    () => bootstrapFromEnv({ MAIL_API_BIND_ADDRESS: "127.0.0.1", NODE_ENV: "production", PORT: "0" }),
    /MAIL_SMTP_REMOTE_TOKEN/u
  );

  // The env opt-in is ignored in production, so it does not rescue startup either.
  await assert.rejects(
    () =>
      bootstrapFromEnv({
        MAIL_API_BIND_ADDRESS: "127.0.0.1",
        MAIL_SMTP_ALLOW_UNAUTHENTICATED_INTERNAL: "1",
        NODE_ENV: "production",
        PORT: "0"
      }),
    /MAIL_SMTP_REMOTE_TOKEN/u
  );
});

test("bootstrap refuses to start in production with the example placeholder as the service token", async () => {
  await assert.rejects(
    () =>
      bootstrapFromEnv({
        MAIL_API_BIND_ADDRESS: "127.0.0.1",
        MAIL_SMTP_REMOTE_TOKEN: "REPLACE_WITH_OPENSSL_RAND_HEX_32",
        NODE_ENV: "production",
        PORT: "0"
      }),
    /placeholder/u
  );
});

test("bootstrap CLI exits non-zero with a clear error in production without a service token", () => {
  const result = spawnSync(process.execPath, [BOOTSTRAP_PATH], {
    encoding: "utf8",
    env: {
      MAIL_DB_URL: MEMORY_DB,
      MAIL_API_BIND_ADDRESS: "127.0.0.1",
      NODE_ENV: "production",
      PATH: process.env.PATH,
      PORT: "0"
    },
    timeout: 20_000
  });

  assert.equal(result.status, 1, result.stderr);
  const failure = result.stderr
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line))
    .find((entry) => entry.msg === "mail_api_bootstrap_failed");
  assert.ok(failure, result.stderr);
  assert.match(failure.error_message, /MAIL_SMTP_REMOTE_TOKEN/u);
});

test("outside production a missing service token is logged as a startup error but does not block startup", () => {
  const script = `
    import("${new URL("../../apps/mail-api/dist/smtp-internal.js", import.meta.url).href}")
      .then((m) => m.createSmtpInternalBackend({ databaseUrl: "sqlite::memory:" }).close());
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    encoding: "utf8",
    env: { PATH: process.env.PATH },
    timeout: 20_000
  });

  assert.equal(result.status, 0, result.stderr);
  const startup = result.stderr
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line))
    .find((entry) => entry.msg === "mail_api_smtp_internal_auth_not_configured");
  assert.ok(startup, result.stderr);
  assert.equal(startup.level, "error");
  assert.match(startup.detail, /MAIL_SMTP_REMOTE_TOKEN/u);
  assert.match(startup.detail, /MAIL_SMTP_ALLOW_UNAUTHENTICATED_INTERNAL/u);
});
