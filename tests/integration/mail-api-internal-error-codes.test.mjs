/**
 * Error codes of the internal SMTP routes: an error the caller caused keeps its
 * own SMTP code, while an unexpected server-side failure is a temporary one
 * (HTTP 503 with smtpCode 451) so the SMTP gateway asks the client to retry
 * instead of reporting a permanent failure.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const SERVICE_TOKEN = "internal-service-token-for-tests";

function setup() {
  const dbPath = `/tmp/iai-mail-api-codes-${randomUUID()}.sqlite`;
  const backend = createSmtpInternalBackend({ databaseUrl: `sqlite:${dbPath}`, remoteToken: SERVICE_TOKEN });
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  const cleanup = () => {
    try {
      backend.close();
    } catch {
      // already closed by the test
    }
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(`${dbPath}${suffix}`, { force: true });
    }
  };
  return { backend, cleanup, dbPath, handler };
}

function post(handler, operation, body, token = SERVICE_TOKEN) {
  return dispatchToHandler(handler, {
    body: JSON.stringify(body),
    headers: token ? { authorization: `Bearer ${token}` } : {},
    method: "POST",
    url: `/v1/internal/smtp/${operation}`
  });
}

test("an unexpected failure in an internal route is 503 with smtpCode 451", async () => {
  const { backend, cleanup, dbPath, handler } = setup();
  try {
    // A real failure inside the route: the database handle is gone, so the lookup throws.
    backend.close();

    const sessionAuth = {
      allowedStreams: ["transactional"],
      credentialId: "smtpcred_1",
      defaultStream: "transactional",
      principal: "smtp-user",
      workspaceId: "ws_dev"
    };
    for (const [operation, body] of [
      ["auth", { password: "dev-secret", username: "smtp-dev" }],
      ["mail-from", { address: "a@example.com", auth: sessionAuth }],
      ["recipient", { auth: sessionAuth, recipient: "b@example.com", stream: "transactional" }]
    ]) {
      const response = await post(handler, operation, body);
      const text = await response.text();
      assert.equal(response.status, 503, `${operation}: ${text}`);
      const payload = JSON.parse(text);
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "INTERNAL_ERROR");
      assert.equal(payload.error.details.smtpCode, 451, operation);
      assert.ok(!text.includes(dbPath) && !/database is not open/iu.test(text), "no internal detail is exposed");
    }
  } finally {
    cleanup();
  }
});

test("errors the caller caused keep their own SMTP codes", async () => {
  const { cleanup, handler } = setup();
  try {
    const missingCredentials = await post(handler, "auth", {});
    assert.equal(missingCredentials.status, 400);
    assert.equal((await missingCredentials.json()).error.details.smtpCode, 535);

    const wrongToken = await post(handler, "auth", { password: "x", username: "y" }, "not-the-token");
    assert.equal(wrongToken.status, 401);
    assert.equal((await wrongToken.json()).error.details.smtpCode, 535);

    const unknownRoute = await post(handler, "nope", {});
    assert.equal(unknownRoute.status, 404);
  } finally {
    cleanup();
  }
});

test("an unconfigured service token stays a temporary 503 / 451 (unchanged)", async () => {
  const dbPath = `/tmp/iai-mail-api-codes-${randomUUID()}.sqlite`;
  const backend = createSmtpInternalBackend({ databaseUrl: `sqlite:${dbPath}` });
  try {
    const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
    const response = await post(handler, "auth", { password: "x", username: "y" }, null);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.details.smtpCode, 451);
  } finally {
    backend.close();
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(`${dbPath}${suffix}`, { force: true });
    }
  }
});
