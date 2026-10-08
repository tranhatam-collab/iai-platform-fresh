/**
 * mail-api must not create the well-known dev login (smtp-dev / dev-secret for
 * ws_dev) in a production database; only an explicit, complete seed provisions
 * anything there. Outside production the dev seed is unchanged.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
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

// --- no default credential in production -----------------------------------

function authAttempt(handler, username, password) {
  return internalPost(handler, "auth", { method: "LOGIN", password, secure: true, username }, bearer(SERVICE_TOKEN));
}

test("production without an explicit seed creates no default credential", async () => {
  await withEnv({ NODE_ENV: "production" }, async () => {
    const dbPath = `/tmp/iai-mail-api-hardening-${randomUUID()}.sqlite`;
    const { backend, handler } = createHandler({
      databaseUrl: `sqlite:${dbPath}`,
      remoteToken: SERVICE_TOKEN
    });
    try {
      const response = await authAttempt(handler, "smtp-dev", "dev-secret");
      assert.equal(response.status, 401);
      assert.equal((await response.json()).error.code, "AUTH_REJECTED");

      const db = new DatabaseSync(dbPath);
      try {
        for (const table of ["smtp_credentials", "domains", "sender_identities", "provider_routes", "suppressions"]) {
          const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table};`).get();
          assert.equal(row.count, 0, `${table} must be empty`);
        }
      } finally {
        db.close();
      }
    } finally {
      backend.close();
      rmSync(dbPath, { force: true });
    }
  });
});

test("production with an explicit seed provisions only that credential", async () => {
  await withEnv({ NODE_ENV: "production" }, async () => {
    const { backend, handler } = createHandler({
      remoteToken: SERVICE_TOKEN,
      seed: { password: "real-secret", username: "smtp-operator", workspaceId: "ws_real" }
    });
    try {
      const good = await authAttempt(handler, "smtp-operator", "real-secret");
      assert.equal(good.status, 200);
      assert.equal((await good.json()).workspaceId, "ws_real");
      assert.equal((await authAttempt(handler, "smtp-dev", "dev-secret")).status, 401);
    } finally {
      backend.close();
    }
  });
});

test("production refuses a partial seed that would fall back to the default credential", async () => {
  await withEnv({ NODE_ENV: "production" }, async () => {
    assert.throws(
      () => createSmtpInternalBackend({ databaseUrl: MEMORY_DB, seed: { workspaceId: "ws_real" } }),
      /seed\.username and seed\.password/u
    );
  });
});

test("outside production the dev seed is unchanged", async () => {
  for (const nodeEnv of [undefined, "development", "test"]) {
    await withEnv(nodeEnv ? { NODE_ENV: nodeEnv } : {}, async () => {
      const { backend, handler } = createHandler({ remoteToken: SERVICE_TOKEN });
      try {
        const response = await authAttempt(handler, "smtp-dev", "dev-secret");
        assert.equal(response.status, 200, String(nodeEnv));
        assert.equal((await response.json()).workspaceId, "ws_dev");
      } finally {
        backend.close();
      }
    });
  }
});

test("production warns loudly when a previously seeded default credential is still in the database", async () => {
  const dbPath = `/tmp/iai-mail-api-hardening-${randomUUID()}.sqlite`;
  try {
    await withEnv({}, async () => {
      createSmtpInternalBackend({ databaseUrl: `sqlite:${dbPath}`, remoteToken: SERVICE_TOKEN }).close();
    });

    const logged = [];
    const originalError = console.error;
    console.error = (...args) => logged.push(args.join(" "));
    try {
      await withEnv({ NODE_ENV: "production" }, async () => {
        createSmtpInternalBackend({ databaseUrl: `sqlite:${dbPath}`, remoteToken: SERVICE_TOKEN }).close();
      });
    } finally {
      console.error = originalError;
    }

    const warning = logged.find((line) => line.includes("mail_api_default_smtp_credential_present"));
    assert.ok(warning, `expected a default-credential warning, got: ${logged.join("\n")}`);
    assert.match(warning, /smtp-dev/u);
  } finally {
    rmSync(dbPath, { force: true });
  }
});
