import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  createFileInboundWebhookEvidenceSink,
  createInboundWebhookHandler,
  createInMemoryInboundWebhookEvidenceSink,
  INBOUND_WEBHOOK_SIGNATURE_HEADER,
  INBOUND_WEBHOOK_TIMESTAMP_HEADER,
  verifyInboundWebhook
} from "../../apps/mail-api/dist/inbound-webhook.js";

const SECRET = "test-mail-webhook-secret-2026-04-28";

function sign(secret, timestamp, rawBody) {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

test("verifyInboundWebhook accepts valid signature", () => {
  const ts = 1_777_777_777;
  const body = JSON.stringify({ provider_event_id: "evt_abc", kind: "delivered" });
  const sig = sign(SECRET, ts, body);

  const result = verifyInboundWebhook({
    rawBody: body,
    timestampHeader: String(ts),
    signatureHeader: sig,
    secret: SECRET,
    nowSeconds: ts,
    replayWindowSeconds: 300
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.providerEventId, "evt_abc");
    assert.equal(result.timestamp, ts);
  }
});

test("verifyInboundWebhook rejects when secret missing", () => {
  const result = verifyInboundWebhook({
    rawBody: "{}",
    timestampHeader: "1",
    signatureHeader: "abc",
    secret: "",
    nowSeconds: 1,
    replayWindowSeconds: 300
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "MAIL_API_WEBHOOK_SECRET_MISSING");
  }
});

test("verifyInboundWebhook rejects out-of-window timestamp", () => {
  const ts = 1_777_777_777;
  const body = "{}";
  const result = verifyInboundWebhook({
    rawBody: body,
    timestampHeader: String(ts),
    signatureHeader: sign(SECRET, ts, body),
    secret: SECRET,
    nowSeconds: ts + 600,
    replayWindowSeconds: 300
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "MAIL_WEBHOOK_TIMESTAMP_OUT_OF_WINDOW");
  }
});

test("verifyInboundWebhook rejects bad signature", () => {
  const ts = 1_777_777_777;
  const body = "{}";
  const result = verifyInboundWebhook({
    rawBody: body,
    timestampHeader: String(ts),
    signatureHeader: "0".repeat(64),
    secret: SECRET,
    nowSeconds: ts,
    replayWindowSeconds: 300
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "MAIL_WEBHOOK_SIGNATURE_INVALID");
  }
});

test("verifyInboundWebhook rejects missing timestamp header", () => {
  const result = verifyInboundWebhook({
    rawBody: "{}",
    timestampHeader: undefined,
    signatureHeader: "0".repeat(64),
    secret: SECRET,
    nowSeconds: 1,
    replayWindowSeconds: 300
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "MAIL_WEBHOOK_TIMESTAMP_MISSING");
  }
});

test("inbound webhook handler accepts valid request and records evidence", async () => {
  const sink = createInMemoryInboundWebhookEvidenceSink();
  const ts = 1_700_000_000;
  const handler = createInboundWebhookHandler({
    resolveSecret: () => SECRET,
    nowSeconds: () => ts,
    evidenceSink: sink
  });

  const body = JSON.stringify({ provider_event_id: "evt_xyz" });
  const sig = sign(SECRET, ts, body);

  const fakeReq = makeFakeRequest({
    method: "POST",
    url: "/v1/webhooks/inbound",
    headers: {
      [INBOUND_WEBHOOK_TIMESTAMP_HEADER]: String(ts),
      [INBOUND_WEBHOOK_SIGNATURE_HEADER]: sig,
      "content-type": "application/json"
    },
    body
  });
  const fakeRes = makeFakeResponse();

  const result = await handler(fakeReq, fakeRes, "req_test_1");
  assert.equal(result.handled, true);
  assert.equal(fakeRes.statusCode, 202);
  const payload = JSON.parse(fakeRes.body);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.provider_event_id, "evt_xyz");

  const records = sink.list();
  assert.equal(records.length, 1);
  assert.equal(records[0].signatureValid, true);
  assert.equal(records[0].providerEventId, "evt_xyz");
  assert.equal(records[0].rejectionCode, null);
});

test("inbound webhook handler rejects bad signature with 401 and records evidence", async () => {
  const sink = createInMemoryInboundWebhookEvidenceSink();
  const ts = 1_700_000_000;
  const handler = createInboundWebhookHandler({
    resolveSecret: () => SECRET,
    nowSeconds: () => ts,
    evidenceSink: sink
  });

  const fakeReq = makeFakeRequest({
    method: "POST",
    url: "/v1/webhooks/inbound",
    headers: {
      [INBOUND_WEBHOOK_TIMESTAMP_HEADER]: String(ts),
      [INBOUND_WEBHOOK_SIGNATURE_HEADER]: "0".repeat(64),
      "content-type": "application/json"
    },
    body: "{}"
  });
  const fakeRes = makeFakeResponse();

  const result = await handler(fakeReq, fakeRes, "req_test_2");
  assert.equal(result.handled, true);
  assert.equal(fakeRes.statusCode, 401);
  const records = sink.list();
  assert.equal(records.length, 1);
  assert.equal(records[0].signatureValid, false);
  assert.equal(records[0].rejectionCode, "MAIL_WEBHOOK_SIGNATURE_INVALID");
});

test("inbound webhook handler returns 503 when secret missing", async () => {
  const ts = 1_700_000_000;
  const handler = createInboundWebhookHandler({
    resolveSecret: () => undefined,
    nowSeconds: () => ts
  });

  const fakeReq = makeFakeRequest({
    method: "POST",
    url: "/v1/webhooks/inbound",
    headers: {
      [INBOUND_WEBHOOK_TIMESTAMP_HEADER]: String(ts),
      [INBOUND_WEBHOOK_SIGNATURE_HEADER]: "deadbeef",
      "content-type": "application/json"
    },
    body: "{}"
  });
  const fakeRes = makeFakeResponse();

  const result = await handler(fakeReq, fakeRes, "req_test_3");
  assert.equal(result.handled, true);
  assert.equal(fakeRes.statusCode, 503);
});

test("inbound webhook handler ignores non-POST and non-matching paths", async () => {
  const handler = createInboundWebhookHandler({
    resolveSecret: () => SECRET,
    nowSeconds: () => 1
  });
  const fakeReq = makeFakeRequest({
    method: "GET",
    url: "/v1/webhooks/inbound",
    headers: {},
    body: ""
  });
  const fakeRes = makeFakeResponse();
  const result = await handler(fakeReq, fakeRes, "req_test_4");
  assert.equal(result.handled, false);
});

test("GET /v1/webhooks/inbound/evidence returns list with newest first", async () => {
  const sink = createInMemoryInboundWebhookEvidenceSink();
  const ts = 1_700_000_100;
  const handler = createInboundWebhookHandler({
    resolveSecret: () => SECRET,
    nowSeconds: () => ts,
    evidenceSink: sink
  });

  for (const id of ["evt_a", "evt_b", "evt_c"]) {
    const body = JSON.stringify({ provider_event_id: id });
    const sig = sign(SECRET, ts, body);
    const req = makeFakeRequest({
      method: "POST",
      url: "/v1/webhooks/inbound",
      headers: {
        [INBOUND_WEBHOOK_TIMESTAMP_HEADER]: String(ts),
        [INBOUND_WEBHOOK_SIGNATURE_HEADER]: sig,
        "content-type": "application/json"
      },
      body
    });
    await handler(req, makeFakeResponse(), `req_post_${id}`);
  }

  const listReq = makeFakeRequest({
    method: "GET",
    url: "/v1/webhooks/inbound/evidence?limit=10",
    headers: {},
    body: ""
  });
  const listRes = makeFakeResponse();
  const result = await handler(listReq, listRes, "req_list");
  assert.equal(result.handled, true);
  assert.equal(listRes.statusCode, 200);
  const payload = JSON.parse(listRes.body);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.total, 3);
  assert.equal(payload.data.returned, 3);
  assert.deepEqual(
    payload.data.items.map((entry) => entry.providerEventId),
    ["evt_c", "evt_b", "evt_a"]
  );
});

test("GET evidence by provider_event_id returns 200 or 404", async () => {
  const sink = createInMemoryInboundWebhookEvidenceSink();
  const ts = 1_700_000_200;
  const handler = createInboundWebhookHandler({
    resolveSecret: () => SECRET,
    nowSeconds: () => ts,
    evidenceSink: sink
  });

  const body = JSON.stringify({ provider_event_id: "evt_target" });
  const sig = sign(SECRET, ts, body);
  await handler(
    makeFakeRequest({
      method: "POST",
      url: "/v1/webhooks/inbound",
      headers: {
        [INBOUND_WEBHOOK_TIMESTAMP_HEADER]: String(ts),
        [INBOUND_WEBHOOK_SIGNATURE_HEADER]: sig,
        "content-type": "application/json"
      },
      body
    }),
    makeFakeResponse(),
    "req_post"
  );

  const hitRes = makeFakeResponse();
  await handler(
    makeFakeRequest({
      method: "GET",
      url: "/v1/webhooks/inbound/evidence?provider_event_id=evt_target",
      headers: {},
      body: ""
    }),
    hitRes,
    "req_hit"
  );
  assert.equal(hitRes.statusCode, 200);
  const hitPayload = JSON.parse(hitRes.body);
  assert.equal(hitPayload.data.providerEventId, "evt_target");
  assert.equal(hitPayload.data.signatureValid, true);

  const missRes = makeFakeResponse();
  await handler(
    makeFakeRequest({
      method: "GET",
      url: "/v1/webhooks/inbound/evidence?provider_event_id=evt_missing",
      headers: {},
      body: ""
    }),
    missRes,
    "req_miss"
  );
  assert.equal(missRes.statusCode, 404);
  const missPayload = JSON.parse(missRes.body);
  assert.equal(missPayload.error.code, "MAIL_WEBHOOK_EVIDENCE_NOT_FOUND");
});

test("GET evidence by evidence_id returns 200 with matching record", async () => {
  const sink = createInMemoryInboundWebhookEvidenceSink();
  const ts = 1_700_000_300;
  const handler = createInboundWebhookHandler({
    resolveSecret: () => SECRET,
    nowSeconds: () => ts,
    evidenceSink: sink
  });

  const body = JSON.stringify({ provider_event_id: "evt_eid" });
  const sig = sign(SECRET, ts, body);
  const postRes = makeFakeResponse();
  await handler(
    makeFakeRequest({
      method: "POST",
      url: "/v1/webhooks/inbound",
      headers: {
        [INBOUND_WEBHOOK_TIMESTAMP_HEADER]: String(ts),
        [INBOUND_WEBHOOK_SIGNATURE_HEADER]: sig,
        "content-type": "application/json"
      },
      body
    }),
    postRes,
    "req_post"
  );
  const evidenceId = JSON.parse(postRes.body).data.evidence_id;
  assert.ok(evidenceId.startsWith("evt_inbound_"));

  const getRes = makeFakeResponse();
  await handler(
    makeFakeRequest({
      method: "GET",
      url: `/v1/webhooks/inbound/evidence?evidence_id=${encodeURIComponent(evidenceId)}`,
      headers: {},
      body: ""
    }),
    getRes,
    "req_get_eid"
  );
  assert.equal(getRes.statusCode, 200);
  const payload = JSON.parse(getRes.body);
  assert.equal(payload.data.evidenceId, evidenceId);
  assert.equal(payload.data.providerEventId, "evt_eid");
});

test("file-backed evidence sink persists records across instances", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mail-inbound-sink-"));
  const file = join(dir, "evidence.ndjson");
  try {
    const sinkA = createFileInboundWebhookEvidenceSink(file);
    const ts = 1_700_000_400;
    const handler = createInboundWebhookHandler({
      resolveSecret: () => SECRET,
      nowSeconds: () => ts,
      evidenceSink: sinkA
    });

    const body = JSON.stringify({ provider_event_id: "evt_persist" });
    const sig = sign(SECRET, ts, body);
    await handler(
      makeFakeRequest({
        method: "POST",
        url: "/v1/webhooks/inbound",
        headers: {
          [INBOUND_WEBHOOK_TIMESTAMP_HEADER]: String(ts),
          [INBOUND_WEBHOOK_SIGNATURE_HEADER]: sig,
          "content-type": "application/json"
        },
        body
      }),
      makeFakeResponse(),
      "req_persist"
    );

    const onDisk = readFileSync(file, "utf8").trim().split("\n");
    assert.equal(onDisk.length, 1);
    const parsed = JSON.parse(onDisk[0]);
    assert.equal(parsed.providerEventId, "evt_persist");
    assert.equal(parsed.signatureValid, true);

    // Re-open sink: should reload existing record.
    const sinkB = createFileInboundWebhookEvidenceSink(file);
    const found = sinkB.findByProviderEventId("evt_persist");
    assert.ok(found);
    assert.equal(found.evidenceId, parsed.evidenceId);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- helpers --------------------------------------------------------------

function makeFakeRequest({ method, url, headers, body }) {
  const listeners = new Map();
  const req = {
    method,
    url,
    headers,
    on(event, handler) {
      const list = listeners.get(event) ?? [];
      list.push(handler);
      listeners.set(event, list);
      // Immediately schedule data/end emission for first listener.
      if (event === "end") {
        queueMicrotask(() => {
          const dataListeners = listeners.get("data") ?? [];
          if (body && body.length > 0) {
            for (const fn of dataListeners) {
              fn(Buffer.from(body, "utf8"));
            }
          }
          for (const fn of listeners.get("end") ?? []) {
            fn();
          }
        });
      }
      return req;
    },
    destroy() {
      // no-op for tests
    }
  };
  return req;
}

function makeFakeResponse() {
  const res = {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(name, value) {
      res.headers[name.toLowerCase()] = value;
    },
    end(chunk) {
      if (chunk) {
        res.body = typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      }
    }
  };
  return res;
}
