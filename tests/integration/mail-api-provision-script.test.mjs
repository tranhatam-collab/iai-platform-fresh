/**
 * The production runbook provisions the first SMTP credential with
 * ops/mail-internal-first/scripts/provision-smtp-credential.mjs, because
 * mail-api no longer seeds smtp-dev / dev-secret when NODE_ENV=production.
 * This proves the script and the server's seed path stay in sync.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const SCRIPT_PATH = fileURLToPath(
  new URL("../../ops/mail-internal-first/scripts/provision-smtp-credential.mjs", import.meta.url)
);

function runScript(overrides) {
  return spawnSync(process.execPath, [SCRIPT_PATH], {
    encoding: "utf8",
    env: {
      NODE_ENV: "production",
      PATH: process.env.PATH,
      PROVISION_DEFAULT_SENDER: "no-reply@tx.iai.one",
      PROVISION_PRIMARY_DOMAIN: "tx.iai.one",
      PROVISION_SMTP_PASSWORD: "0123456789abcdef0123456789abcdef",
      PROVISION_SMTP_USERNAME: "smtp-main",
      PROVISION_WORKSPACE_ID: "ws_main",
      ...overrides
    },
    timeout: 20_000
  });
}

test("provision script creates a usable credential in a production database", async () => {
  const dbPath = `/tmp/iai-mail-provision-${randomUUID()}.sqlite`;
  try {
    const result = runScript({ MAIL_DB_URL: `sqlite:${dbPath}` });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout.trim().split("\n").at(-1)).ok, true);

    // Run it twice: idempotent.
    assert.equal(runScript({ MAIL_DB_URL: `sqlite:${dbPath}` }).status, 0);

    const previousNodeEnv = process.env.NODE_ENV;
    let backend;
    process.env.NODE_ENV = "production";
    try {
      backend = createSmtpInternalBackend({
        databaseUrl: `sqlite:${dbPath}`,
        remoteToken: "service-token"
      });
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }

    try {
      const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
      const login = (username, password) =>
        dispatchToHandler(handler, {
          body: JSON.stringify({ method: "LOGIN", password, secure: true, username }),
          headers: { authorization: "Bearer service-token" },
          method: "POST",
          url: "/v1/internal/smtp/auth"
        });

      const good = await login("smtp-main", "0123456789abcdef0123456789abcdef");
      assert.equal(good.status, 200);
      const auth = await good.json();
      assert.equal(auth.workspaceId, "ws_main");
      assert.equal(auth.credentialId, "smtpcred_ws_main");

      assert.equal((await login("smtp-dev", "dev-secret")).status, 401);
    } finally {
      backend.close();
    }
  } finally {
    rmSync(dbPath, { force: true });
  }
});

test("provision script refuses weak or default passwords and missing inputs", () => {
  const dbPath = `/tmp/iai-mail-provision-${randomUUID()}.sqlite`;
  try {
    for (const overrides of [
      { PROVISION_SMTP_PASSWORD: "dev-secret" },
      { PROVISION_SMTP_PASSWORD: "short" },
      { PROVISION_SMTP_USERNAME: "" },
      { PROVISION_WORKSPACE_ID: "" }
    ]) {
      const result = runScript({ MAIL_DB_URL: `sqlite:${dbPath}`, ...overrides });
      assert.equal(result.status, 2, JSON.stringify(overrides));
    }

    assert.equal(runScript({}).status, 2, "MAIL_DB_URL is required");
  } finally {
    rmSync(dbPath, { force: true });
  }
});
