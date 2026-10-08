/**
 * Input bounds on the mail-api internal SMTP / send surface: addresses are
 * length-capped before the (quadratic) email regex runs, and request bodies
 * have a size limit whose 413 actually reaches the client.
 */

import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

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

// --- oversize address input and request bodies -----------------------------

const CRAFTED_ADDRESS = `a@${"a.".repeat(40000)} b`;

test("crafted 80 KB address is rejected quickly on internal and send routes", async () => {
  assert.equal(CRAFTED_ADDRESS.length > 80000, true);

  await withEnv({}, async () => {
    const { backend, handler } = createHandler({ apiKey: API_KEY, remoteToken: SERVICE_TOKEN });
    try {
      const auth = {
        allowedStreams: ["transactional"],
        credentialId: "smtpcred_dev",
        defaultStream: "transactional",
        principal: "smtp-dev",
        workspaceId: "ws_dev"
      };

      const timings = [];
      const timed = async (label, run) => {
        const startedAt = performance.now();
        const response = await run();
        timings.push([label, performance.now() - startedAt]);
        return response;
      };

      const recipient = await timed("recipient", () =>
        internalPost(handler, "recipient", { auth, recipient: CRAFTED_ADDRESS }, bearer(SERVICE_TOKEN))
      );
      assert.equal(recipient.status, 422);

      const mailFrom = await timed("mail-from", () =>
        internalPost(handler, "mail-from", { address: CRAFTED_ADDRESS, auth }, bearer(SERVICE_TOKEN))
      );
      assert.equal(mailFrom.status, 422);

      const send = await timed("send", () =>
        dispatchToHandler(handler, {
          body: JSON.stringify({
            from: { email: "no-reply@tx.iai.one" },
            message_idempotency_key: "idem-crafted",
            stream: "transactional",
            text: "hello",
            to: [{ email: CRAFTED_ADDRESS }]
          }),
          headers: { ...bearer(API_KEY), "x-workspace-id": "ws_dev" },
          method: "POST",
          url: "/v1/send"
        })
      );
      assert.equal(send.status, 422);
      assert.match((await send.json()).error.message, /valid email address/u);

      for (const [label, elapsedMs] of timings) {
        assert.ok(elapsedMs < 100, `${label} took ${elapsedMs.toFixed(1)} ms, expected well under 100 ms`);
      }
    } finally {
      backend.close();
    }
  });
});

test("address length cap is 254 characters", async () => {
  await withEnv({}, async () => {
    const { backend, handler } = createHandler({ remoteToken: SERVICE_TOKEN });
    try {
      const auth = {
        allowedStreams: ["transactional"],
        credentialId: "smtpcred_dev",
        defaultStream: "transactional",
        principal: "smtp-dev",
        workspaceId: "ws_dev"
      };
      const addressOfLength = (length) => {
        const domain = "example.com";
        return `${"a".repeat(length - domain.length - 1)}@${domain}`;
      };

      const atLimit = await internalPost(
        handler,
        "recipient",
        { auth, recipient: addressOfLength(254) },
        bearer(SERVICE_TOKEN)
      );
      assert.equal(atLimit.status, 200);

      const overLimit = await internalPost(
        handler,
        "recipient",
        { auth, recipient: addressOfLength(255) },
        bearer(SERVICE_TOKEN)
      );
      assert.equal(overLimit.status, 422);
    } finally {
      backend.close();
    }
  });
});

test("oversize request body is refused with 413 (declared length and streamed)", async () => {
  await withEnv({}, async () => {
    const { backend, handler } = createHandler({ maxBodyBytes: 1024, remoteToken: SERVICE_TOKEN });
    try {
      const big = JSON.stringify({ ...AUDIT_BODY, metadata: { filler: "x".repeat(4096) } });

      // Declared Content-Length is over the cap: refused without reading the body.
      const declared = await internalPost(handler, "audit", JSON.parse(big), {
        ...bearer(SERVICE_TOKEN),
        "content-length": String(Buffer.byteLength(big))
      });
      assert.equal(declared.status, 413);
      assert.equal((await declared.json()).error.code, "PAYLOAD_TOO_LARGE");

      // No Content-Length (chunked): refused once the cap is crossed.
      const streamed = await internalPost(handler, "audit", JSON.parse(big), bearer(SERVICE_TOKEN));
      assert.equal(streamed.status, 413);

      // Under the cap still works.
      const small = await internalPost(handler, "audit", AUDIT_BODY, bearer(SERVICE_TOKEN));
      assert.equal(small.status, 200);

      // Authentication is checked before the body is read.
      const unauthenticated = await internalPost(handler, "audit", JSON.parse(big), {
        "content-length": String(Buffer.byteLength(big))
      });
      assert.equal(unauthenticated.status, 401);
    } finally {
      backend.close();
    }
  });
});

test("oversize request body reaches a real HTTP client as 413", async () => {
  await withEnv({}, async () => {
    const { backend, handler } = createHandler({ maxBodyBytes: 1024, remoteToken: SERVICE_TOKEN });
    const server = createServer(handler);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/v1/internal/smtp/audit`, {
        body: JSON.stringify({ ...AUDIT_BODY, metadata: { filler: "x".repeat(4 * 1024 * 1024) } }),
        headers: { ...bearer(SERVICE_TOKEN), "content-type": "application/json" },
        method: "POST",
        signal: AbortSignal.timeout(10_000)
      });
      assert.equal(response.status, 413);
      assert.equal((await response.json()).error.code, "PAYLOAD_TOO_LARGE");

      // The server keeps serving after the rejected upload.
      const followUp = await fetch(`http://127.0.0.1:${port}/v1/internal/smtp/audit`, {
        body: JSON.stringify(AUDIT_BODY),
        headers: { ...bearer(SERVICE_TOKEN), "content-type": "application/json" },
        method: "POST",
        signal: AbortSignal.timeout(10_000)
      });
      assert.equal(followUp.status, 200);
    } finally {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
      backend.close();
    }
  });
});

test("default body limit accommodates a base64-encoded 20 MiB SMTP message", async () => {
  await withEnv({}, async () => {
    const { backend, handler } = createHandler({ remoteToken: SERVICE_TOKEN });
    try {
      const auth = {
        allowedStreams: ["transactional"],
        credentialId: "smtpcred_dev",
        defaultStream: "transactional",
        principal: "smtp-dev",
        workspaceId: "ws_dev"
      };
      const rawMimeBase64 = Buffer.alloc(20 * 1024 * 1024, 0x61).toString("base64");
      const response = await internalPost(
        handler,
        "normalize",
        {
          auth,
          envelopeFrom: "no-reply@tx.iai.one",
          rawMimeBase64,
          recipients: ["user@example.com"],
          stream: "transactional"
        },
        bearer(SERVICE_TOKEN)
      );
      assert.equal(response.status, 200);
    } finally {
      backend.close();
    }
  });
});

test("invalid body limit configuration fails fast", async () => {
  await withEnv({ MAIL_API_MAX_BODY_BYTES: "not-a-number" }, async () => {
    assert.throws(() => createSmtpInternalBackend({ databaseUrl: MEMORY_DB }), /MAIL_API_MAX_BODY_BYTES/u);
  });
  await withEnv({}, async () => {
    assert.throws(
      () => createSmtpInternalBackend({ databaseUrl: MEMORY_DB, maxBodyBytes: 0 }),
      /maxBodyBytes/u
    );
  });
});
