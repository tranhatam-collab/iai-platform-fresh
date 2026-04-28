/**
 * Integration tests for the env-driven bootstrap layer.
 *
 * Verifies:
 *   - resolveInboundWebhookOptionsFromEnv picks file vs in-memory sink
 *   - invalid env values throw clear errors
 *   - buildServerOptionsFromEnv reports resolution accurately
 *   - bootstrapFromEnv binds + serves; POST /v1/webhooks/inbound persists
 *     evidence to the configured file across server lifetimes
 */

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  bootstrapFromEnv,
  buildServerOptionsFromEnv,
  resolveInboundWebhookOptionsFromEnv,
  INBOUND_WEBHOOK_SIGNATURE_HEADER,
  INBOUND_WEBHOOK_TIMESTAMP_HEADER
} from "../../apps/mail-api/dist/index.js";

function sign(secret, ts, body) {
  return createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
}

test("resolveInboundWebhookOptionsFromEnv defaults to in-memory sink", () => {
  const resolved = resolveInboundWebhookOptionsFromEnv({});
  assert.equal(resolved.resolution.sinkMode, "memory");
  assert.equal(resolved.resolution.sinkFilePath, null);
  assert.equal(resolved.resolution.replayWindowSeconds, 300);
  assert.equal(resolved.resolution.maxBodyBytes, 256 * 1024);
});

test("resolveInboundWebhookOptionsFromEnv picks file sink when env set", () => {
  const dir = mkdtempSync(join(tmpdir(), "mail-bootstrap-"));
  const file = join(dir, "evidence.ndjson");
  try {
    const resolved = resolveInboundWebhookOptionsFromEnv({
      MAIL_API_INBOUND_EVIDENCE_FILE: file
    });
    assert.equal(resolved.resolution.sinkMode, "file");
    assert.equal(resolved.resolution.sinkFilePath, file);
    // FileEvidenceSink constructor creates parent dir.
    assert.ok(existsSync(dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveInboundWebhookOptionsFromEnv honors numeric overrides", () => {
  const resolved = resolveInboundWebhookOptionsFromEnv({
    MAIL_API_INBOUND_REPLAY_WINDOW_S: "120",
    MAIL_API_INBOUND_MAX_BODY_BYTES: "65536"
  });
  assert.equal(resolved.resolution.replayWindowSeconds, 120);
  assert.equal(resolved.resolution.maxBodyBytes, 65536);
});

test("resolveInboundWebhookOptionsFromEnv rejects invalid replay window", () => {
  assert.throws(
    () =>
      resolveInboundWebhookOptionsFromEnv({
        MAIL_API_INBOUND_REPLAY_WINDOW_S: "abc"
      }),
    /MAIL_API_INBOUND_REPLAY_WINDOW_S/
  );
});

test("resolveInboundWebhookOptionsFromEnv rejects zero/negative max body", () => {
  assert.throws(
    () =>
      resolveInboundWebhookOptionsFromEnv({
        MAIL_API_INBOUND_MAX_BODY_BYTES: "0"
      }),
    /MAIL_API_INBOUND_MAX_BODY_BYTES/
  );
});

test("buildServerOptionsFromEnv reports secret-configured + bind defaults", () => {
  const { resolution } = buildServerOptionsFromEnv({});
  assert.equal(resolution.port, 3000);
  assert.equal(resolution.bindAddress, "0.0.0.0");
  assert.equal(resolution.inbound.secretConfigured, false);
  assert.equal(resolution.inbound.sinkMode, "memory");

  const { resolution: r2 } = buildServerOptionsFromEnv({
    PORT: "4000",
    MAIL_API_BIND_ADDRESS: "127.0.0.1",
    MAIL_API_WEBHOOK_SECRET: "non-empty"
  });
  assert.equal(r2.port, 4000);
  assert.equal(r2.bindAddress, "127.0.0.1");
  assert.equal(r2.inbound.secretConfigured, true);

  // legacy alias still works
  const { resolution: r3 } = buildServerOptionsFromEnv({
    API_FLOW_BIND_ADDRESS: "10.0.0.5"
  });
  assert.equal(r3.bindAddress, "10.0.0.5");
});

test("buildServerOptionsFromEnv rejects PORT > 65535", () => {
  assert.throws(() => buildServerOptionsFromEnv({ PORT: "70000" }), /PORT/);
});

test(
  "bootstrapFromEnv binds + persists inbound evidence to file across restarts",
  { timeout: 15_000 },
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "mail-bootstrap-listen-"));
    const evidenceFile = join(dir, "evidence.ndjson");
    const SECRET = "bootstrap-test-secret";

    const env = {
      ...process.env,
      PORT: "0",
      MAIL_API_BIND_ADDRESS: "127.0.0.1",
      MAIL_API_WEBHOOK_SECRET: SECRET,
      MAIL_API_INBOUND_EVIDENCE_FILE: evidenceFile
    };

    let firstServer;
    try {
      // First lifetime: send one valid webhook.
      const first = await bootstrapFromEnv(env);
      firstServer = first.server;
      assert.equal(first.resolution.inbound.sinkMode, "file");
      assert.equal(first.resolution.inbound.sinkFilePath, evidenceFile);
      assert.equal(first.resolution.inbound.secretConfigured, true);

      const addr = firstServer.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      assert.ok(port > 0);

      const ts = Math.floor(Date.now() / 1000);
      const body = JSON.stringify({ provider_event_id: "evt_bootstrap_1" });
      const sig = sign(SECRET, ts, body);
      const res = await fetch(`http://127.0.0.1:${port}/v1/webhooks/inbound`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [INBOUND_WEBHOOK_TIMESTAMP_HEADER]: String(ts),
          [INBOUND_WEBHOOK_SIGNATURE_HEADER]: sig
        },
        body
      });
      assert.equal(res.status, 202);
      const payload = await res.json();
      assert.equal(payload.ok, true);
      assert.equal(payload.data.provider_event_id, "evt_bootstrap_1");

      // File should now contain the record.
      const onDisk = readFileSync(evidenceFile, "utf8").trim().split("\n");
      assert.equal(onDisk.length, 1);
      const parsed = JSON.parse(onDisk[0]);
      assert.equal(parsed.providerEventId, "evt_bootstrap_1");
      assert.equal(parsed.signatureValid, true);
    } finally {
      if (firstServer) {
        await new Promise((resolve) => firstServer.close(() => resolve()));
      }
    }

    // Second lifetime: a fresh bootstrap should be able to GET the
    // previously persisted evidence — proves restart-safe path.
    let secondServer;
    try {
      const second = await bootstrapFromEnv(env);
      secondServer = second.server;
      const addr = secondServer.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      assert.ok(port > 0);

      const res = await fetch(
        `http://127.0.0.1:${port}/v1/webhooks/inbound/evidence?provider_event_id=evt_bootstrap_1`
      );
      assert.equal(res.status, 200);
      const payload = await res.json();
      assert.equal(payload.ok, true);
      assert.equal(payload.data.providerEventId, "evt_bootstrap_1");
      assert.equal(payload.data.signatureValid, true);
    } finally {
      if (secondServer) {
        await new Promise((resolve) => secondServer.close(() => resolve()));
      }
      rmSync(dir, { recursive: true, force: true });
    }
  }
);
