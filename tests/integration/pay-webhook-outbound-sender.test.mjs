import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";
import test from "node:test";

import {
  buildPaymentWebhookBody,
  computePaymentWebhookSignature,
  paymentWebhookSignaturesEqual,
  PaymentWebhookOutboundError,
  sendPaymentWebhookOutbound
} from "../../apps/pay/dist/payment-webhook-outbound-sender.js";
import { getPaymentWebhookTenantConfig } from "../../apps/pay/dist/payment-webhook-tenant-registry.js";
import { createPayRequestHandler } from "../../apps/pay/dist/server.js";
import { PaymentEventEvidenceStore } from "../../apps/pay/dist/payment-event-evidence-store.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const TENANT_CODE = "tranhatam";
const TENANT = getPaymentWebhookTenantConfig(TENANT_CODE);
const SECRET = "test-secret-do-not-use-in-prod-32bytes!!";
const FIXED_TIMESTAMP = 1_745_564_400; // 2025-04-25T00:00:00Z, deterministic
const FIXED_NOW = () => FIXED_TIMESTAMP;
const NO_RETRY = {
  initialBackoffMs: 1,
  maxAttempts: 1,
  maxBackoffMs: 1
};

function snapshotEnv(keys) {
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function createMockReceiver({
  verifySignature = true,
  statusSequence = [200],
  slack = Number.MAX_SAFE_INTEGER
} = {}) {
  const calls = [];
  let callIndex = 0;
  const fetchImpl = async (url, init) => {
    const status = statusSequence[Math.min(callIndex, statusSequence.length - 1)];
    callIndex += 1;
    const headers = init?.headers ?? {};
    const ts = Number(headers[TENANT.timestamp_header] ?? "0");
    const sig = String(headers[TENANT.signature_header] ?? "");
    const rawBody = String(init?.body ?? "");

    let signatureMatch = null;
    if (verifySignature) {
      const expected = createHmac("sha256", SECRET).update(`${ts}.${rawBody}`).digest("hex");
      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(sig.toLowerCase(), "utf8");
      signatureMatch = a.length === b.length && timingSafeEqual(a, b);
      if (!signatureMatch) {
        calls.push({ url, status: 401, ts, sig, rawBody, signatureMatch });
        return new Response("invalid signature", { status: 401 });
      }
    }

    const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
    if (verifySignature && skew > slack) {
      calls.push({ url, status: 401, ts, sig, rawBody, signatureMatch, skew });
      return new Response("stale timestamp", { status: 401 });
    }

    calls.push({ url, status, ts, sig, rawBody, signatureMatch });
    return new Response("ok", { status });
  };
  return { fetchImpl, calls };
}

test("buildPaymentWebhookBody emits exactly the 5 receiver-locked fields", () => {
  const body = buildPaymentWebhookBody({
    amount: 9900,
    currency: "usd",
    orderId: "order_123",
    providerEventId: "evt_abc",
    tenantCode: TENANT_CODE
  });
  assert.deepEqual(Object.keys(body).sort(), [
    "amount",
    "currency",
    "order_id",
    "provider_event_id",
    "status"
  ]);
  assert.equal(body.currency, "USD");
  assert.equal(body.status, "succeeded");
  assert.equal(body.amount, 9900);
});

test("computePaymentWebhookSignature is byte-for-byte deterministic (regression guard)", () => {
  const body = JSON.stringify(
    buildPaymentWebhookBody({
      amount: 9900,
      currency: "USD",
      orderId: "order_123",
      providerEventId: "evt_abc",
      tenantCode: TENANT_CODE
    })
  );
  const sig = computePaymentWebhookSignature(SECRET, FIXED_TIMESTAMP, body);
  // Independently re-derive the expected hex with stdlib HMAC.
  const expected = createHmac("sha256", SECRET).update(`${FIXED_TIMESTAMP}.${body}`).digest("hex");
  assert.equal(sig, expected);
  assert.equal(sig, sig.toLowerCase(), "signature must be lowercase hex");
  assert.match(sig, /^[0-9a-f]{64}$/);
});

test("paymentWebhookSignaturesEqual is case-insensitive and length-safe", () => {
  const a = "abcdef0123";
  assert.equal(paymentWebhookSignaturesEqual(a, a.toUpperCase()), true);
  assert.equal(paymentWebhookSignaturesEqual(a, "abcdef0124"), false);
  assert.equal(paymentWebhookSignaturesEqual(a, "abcdef012"), false);
});

test("sendPaymentWebhookOutbound delivers on first 200 with valid signature", async () => {
  const receiver = createMockReceiver({ statusSequence: [200] });
  const result = await sendPaymentWebhookOutbound(
    {
      amount: 9900,
      currency: "USD",
      orderId: "order_123",
      providerEventId: "evt_abc",
      tenantCode: TENANT_CODE
    },
    {
      fetchImpl: receiver.fetchImpl,
      nowSeconds: FIXED_NOW,
      retryPolicy: NO_RETRY,
      secret: SECRET
    }
  );
  assert.equal(result.delivered, true);
  assert.equal(result.finalStatus, 200);
  assert.equal(result.attempts.length, 1);
  assert.equal(receiver.calls.length, 1);
  assert.equal(receiver.calls[0].signatureMatch, true);
  assert.equal(receiver.calls[0].url, TENANT.destination_url);
  // Idempotency key reused → same body bytes if caller retries with same providerEventId
  assert.match(receiver.calls[0].rawBody, /"provider_event_id":"evt_abc"/);
});

test("sendPaymentWebhookOutbound retries on 5xx and reuses provider_event_id across retries", async () => {
  const receiver = createMockReceiver({ statusSequence: [500, 502, 200] });
  const result = await sendPaymentWebhookOutbound(
    {
      amount: 9900,
      currency: "USD",
      orderId: "order_123",
      providerEventId: "evt_retry_5xx",
      tenantCode: TENANT_CODE
    },
    {
      fetchImpl: receiver.fetchImpl,
      nowSeconds: FIXED_NOW,
      retryPolicy: { initialBackoffMs: 1, maxAttempts: 5, maxBackoffMs: 4 },
      secret: SECRET,
      sleep: async () => {}
    }
  );
  assert.equal(result.delivered, true);
  assert.equal(result.finalStatus, 200);
  assert.equal(result.attempts.length, 3);
  // All 3 calls must carry the same idempotency key so receiver dedupes.
  for (const call of receiver.calls) {
    assert.match(call.rawBody, /"provider_event_id":"evt_retry_5xx"/);
  }
});

test("sendPaymentWebhookOutbound retries on 429 then succeeds", async () => {
  const receiver = createMockReceiver({ statusSequence: [429, 200] });
  const result = await sendPaymentWebhookOutbound(
    {
      amount: 100,
      currency: "VND",
      orderId: "order_429",
      providerEventId: "evt_retry_429",
      tenantCode: TENANT_CODE
    },
    {
      fetchImpl: receiver.fetchImpl,
      nowSeconds: FIXED_NOW,
      retryPolicy: { initialBackoffMs: 1, maxAttempts: 5, maxBackoffMs: 4 },
      secret: SECRET,
      sleep: async () => {}
    }
  );
  assert.equal(result.delivered, true);
  assert.equal(result.attempts.length, 2);
});

test("sendPaymentWebhookOutbound does NOT retry on 4xx (caller error)", async () => {
  const receiver = createMockReceiver({ statusSequence: [400, 200] });
  await assert.rejects(
    () =>
      sendPaymentWebhookOutbound(
        {
          amount: 100,
          currency: "VND",
          orderId: "order_400",
          providerEventId: "evt_no_retry_4xx",
          tenantCode: TENANT_CODE
        },
        {
          fetchImpl: receiver.fetchImpl,
          nowSeconds: FIXED_NOW,
          retryPolicy: { initialBackoffMs: 1, maxAttempts: 5, maxBackoffMs: 4 },
          secret: SECRET,
          sleep: async () => {}
        }
      ),
    (err) => {
      assert.ok(err instanceof PaymentWebhookOutboundError);
      assert.equal(err.code, "PAYMENT_WEBHOOK_DESTINATION_REJECTED");
      assert.equal(err.details.finalStatus, 400);
      return true;
    }
  );
  assert.equal(receiver.calls.length, 1, "no retry on 4xx");
});

test("receiver rejects stale timestamps (proves ±300s window enforcement on receiver side)", async () => {
  // The mock receiver uses real Date.now() vs the supplied timestamp; if we
  // hand an ancient FIXED_TIMESTAMP from 2025 with default slack=300s, the
  // mock will reject as stale (proves we exercise the receiver's contract).
  const receiver = createMockReceiver({ statusSequence: [200], slack: 300 });
  await assert.rejects(
    () =>
      sendPaymentWebhookOutbound(
        {
          amount: 100,
          currency: "VND",
          orderId: "order_stale",
          providerEventId: "evt_stale",
          tenantCode: TENANT_CODE
        },
        {
          fetchImpl: receiver.fetchImpl,
          nowSeconds: FIXED_NOW,
          retryPolicy: NO_RETRY,
          secret: SECRET,
          sleep: async () => {}
        }
      ),
    (err) => {
      assert.ok(err instanceof PaymentWebhookOutboundError);
      // 401 is NOT in the retryable set so we get DESTINATION_REJECTED.
      assert.equal(err.code, "PAYMENT_WEBHOOK_DESTINATION_REJECTED");
      assert.equal(err.details.finalStatus, 401);
      return true;
    }
  );
});

test("missing PAYMENT_WEBHOOK_SECRET returns SECRET_MISSING (503-class)", async () => {
  const receiver = createMockReceiver();
  await assert.rejects(
    () =>
      sendPaymentWebhookOutbound(
        {
          amount: 100,
          currency: "VND",
          orderId: "order_no_secret",
          providerEventId: "evt_no_secret",
          tenantCode: TENANT_CODE
        },
        {
          fetchImpl: receiver.fetchImpl,
          nowSeconds: FIXED_NOW,
          retryPolicy: NO_RETRY,
          secret: ""
        }
      ),
    (err) => {
      assert.ok(err instanceof PaymentWebhookOutboundError);
      assert.equal(err.code, "PAYMENT_WEBHOOK_SECRET_MISSING");
      return true;
    }
  );
  assert.equal(receiver.calls.length, 0, "no HTTP attempted when secret missing");
});

test("unknown tenant_code returns TENANT_UNKNOWN", async () => {
  const receiver = createMockReceiver();
  await assert.rejects(
    () =>
      sendPaymentWebhookOutbound(
        {
          amount: 100,
          currency: "VND",
          orderId: "order_x",
          providerEventId: "evt_x",
          tenantCode: "no-such-tenant"
        },
        {
          fetchImpl: receiver.fetchImpl,
          nowSeconds: FIXED_NOW,
          retryPolicy: NO_RETRY,
          secret: SECRET
        }
      ),
    (err) => {
      assert.ok(err instanceof PaymentWebhookOutboundError);
      assert.equal(err.code, "PAYMENT_WEBHOOK_TENANT_UNKNOWN");
      return true;
    }
  );
});

test("/internal/payment-webhook/dispatch records canonical evidence on success (202)", async () => {
  const envSnap = snapshotEnv(["PAY_EMAIL_ADAPTER_INTERNAL_KEY", "PAYMENT_WEBHOOK_SECRET"]);
  process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "test-internal-key";
  process.env.PAYMENT_WEBHOOK_SECRET = SECRET;

  const receiver = createMockReceiver({ statusSequence: [200] });
  const evidenceStore = new PaymentEventEvidenceStore();
  const handler = createPayRequestHandler({
    fetchImpl: receiver.fetchImpl,
    paymentEventEvidenceStore: evidenceStore
  });

  try {
    const response = await dispatchToHandler(handler, {
      body: JSON.stringify({
        amount: 9900,
        currency: "USD",
        domain: "tranhatam.com",
        order_id: "order_dispatch_ok",
        provider_event_id: "evt_dispatch_ok",
        status: "succeeded",
        tenant_code: TENANT_CODE
      }),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "test-internal-key"
      },
      method: "POST",
      url: "/internal/payment-webhook/dispatch"
    });

    assert.equal(response.status, 202);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.data.delivered, true);
    assert.equal(payload.data.final_status, 200);
    assert.equal(payload.data.tenant_code, TENANT_CODE);
    assert.equal(payload.data.tenant_id, TENANT.tenant_id);
    assert.equal(payload.data.destination_url, TENANT.destination_url);

    const record = evidenceStore.getRecord({
      domain: "tranhatam.com",
      order_id: "order_dispatch_ok"
    });
    assert.ok(record, "evidence record must exist after successful dispatch");
    assert.equal(record.outbound_webhook_status, "delivered");
    assert.equal(record.outbound_webhook_attempt_count, "1");
    assert.equal(record.outbound_webhook_final_status, "200");
    assert.equal(record.outbound_webhook_tenant_code, TENANT_CODE);
    assert.equal(record.outbound_webhook_tenant_id, TENANT.tenant_id);
    assert.ok(record.outbound_webhook_signature, "signature must be persisted for audit");
    assert.ok(
      record.audit_log.some((entry) => entry.event === "outbound_webhook_sent"),
      "audit log must include outbound_webhook_sent event"
    );
  } finally {
    restoreEnv(envSnap);
  }
});

test("/internal/payment-webhook/dispatch returns 401 without internal key", async () => {
  const envSnap = snapshotEnv(["PAY_EMAIL_ADAPTER_INTERNAL_KEY", "PAYMENT_WEBHOOK_SECRET"]);
  process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "test-internal-key";
  process.env.PAYMENT_WEBHOOK_SECRET = SECRET;

  const receiver = createMockReceiver();
  const handler = createPayRequestHandler({
    fetchImpl: receiver.fetchImpl,
    paymentEventEvidenceStore: new PaymentEventEvidenceStore()
  });

  try {
    const response = await dispatchToHandler(handler, {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
      url: "/internal/payment-webhook/dispatch"
    });
    assert.equal(response.status, 401);
    assert.equal(receiver.calls.length, 0);
  } finally {
    restoreEnv(envSnap);
  }
});

test("/internal/payment-webhook/dispatch rejects missing required fields with 400", async () => {
  const envSnap = snapshotEnv(["PAY_EMAIL_ADAPTER_INTERNAL_KEY", "PAYMENT_WEBHOOK_SECRET"]);
  process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "test-internal-key";
  process.env.PAYMENT_WEBHOOK_SECRET = SECRET;

  const handler = createPayRequestHandler({
    paymentEventEvidenceStore: new PaymentEventEvidenceStore()
  });

  try {
    const response = await dispatchToHandler(handler, {
      body: JSON.stringify({ tenant_code: TENANT_CODE }),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "test-internal-key"
      },
      method: "POST",
      url: "/internal/payment-webhook/dispatch"
    });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "PAYMENT_WEBHOOK_PAYLOAD_INVALID");
  } finally {
    restoreEnv(envSnap);
  }
});

test("/internal/payment-event/callback auto-dispatches outbound webhook on terminal success when fields present", async () => {
  const envSnap = snapshotEnv(["PAY_EMAIL_ADAPTER_INTERNAL_KEY", "PAYMENT_WEBHOOK_SECRET"]);
  process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "test-internal-key";
  process.env.PAYMENT_WEBHOOK_SECRET = SECRET;

  const receiver = createMockReceiver({ statusSequence: [200] });
  const evidenceStore = new PaymentEventEvidenceStore();
  const handler = createPayRequestHandler({
    fetchImpl: receiver.fetchImpl,
    paymentEventEvidenceStore: evidenceStore
  });

  try {
    const response = await dispatchToHandler(handler, {
      body: JSON.stringify({
        amount: 9900,
        callback_status: "succeeded",
        currency: "USD",
        domain: "tranhatam.com",
        order_id: "order_callback_auto",
        provider_event_id: "evt_callback_auto",
        provider_reference: "provider_ref_callback_auto",
        tenant_code: TENANT_CODE
      }),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "test-internal-key"
      },
      method: "POST",
      url: "/internal/payment-event/callback"
    });
    assert.equal(response.status, 202);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.data.outbound_webhook.attempted, true);
    assert.equal(payload.data.outbound_webhook.delivered, true);
    assert.equal(payload.data.outbound_webhook.final_status, 200);
    assert.equal(payload.data.outbound_webhook.tenant_code, TENANT_CODE);
    assert.equal(receiver.calls.length, 1);

    const evidenceRecord = evidenceStore.getRecord({
      domain: "tranhatam.com",
      order_id: "order_callback_auto"
    });
    assert.ok(evidenceRecord);
    assert.equal(evidenceRecord.outbound_webhook_status, "delivered");
    assert.equal(evidenceRecord.callback_status, "succeeded");
  } finally {
    restoreEnv(envSnap);
  }
});

test("/internal/payment-event/callback skips outbound dispatch when status is non-terminal", async () => {
  const envSnap = snapshotEnv(["PAY_EMAIL_ADAPTER_INTERNAL_KEY", "PAYMENT_WEBHOOK_SECRET"]);
  process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "test-internal-key";
  process.env.PAYMENT_WEBHOOK_SECRET = SECRET;

  const receiver = createMockReceiver({ statusSequence: [200] });
  const handler = createPayRequestHandler({
    fetchImpl: receiver.fetchImpl,
    paymentEventEvidenceStore: new PaymentEventEvidenceStore()
  });

  try {
    const response = await dispatchToHandler(handler, {
      body: JSON.stringify({
        amount: 9900,
        callback_status: "pending",
        currency: "USD",
        domain: "tranhatam.com",
        order_id: "order_pending",
        provider_event_id: "evt_pending",
        tenant_code: TENANT_CODE
      }),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "test-internal-key"
      },
      method: "POST",
      url: "/internal/payment-event/callback"
    });
    assert.equal(response.status, 202);
    const payload = await response.json();
    assert.equal(payload.data.outbound_webhook.attempted, false);
    assert.equal(payload.data.outbound_webhook.reason, "callback_status_not_terminal_success");
    assert.equal(receiver.calls.length, 0, "no HTTP attempted on non-terminal status");
  } finally {
    restoreEnv(envSnap);
  }
});

test("/internal/payment-event/callback skips outbound dispatch when tenant_code/amount/currency missing (legacy callers unchanged)", async () => {
  const envSnap = snapshotEnv(["PAY_EMAIL_ADAPTER_INTERNAL_KEY", "PAYMENT_WEBHOOK_SECRET"]);
  process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "test-internal-key";
  process.env.PAYMENT_WEBHOOK_SECRET = SECRET;

  const receiver = createMockReceiver({ statusSequence: [200] });
  const handler = createPayRequestHandler({
    fetchImpl: receiver.fetchImpl,
    paymentEventEvidenceStore: new PaymentEventEvidenceStore()
  });

  try {
    const response = await dispatchToHandler(handler, {
      body: JSON.stringify({
        callback_status: "succeeded",
        domain: "tranhatam.com",
        order_id: "order_legacy",
        provider_event_id: "evt_legacy"
      }),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "test-internal-key"
      },
      method: "POST",
      url: "/internal/payment-event/callback"
    });
    assert.equal(response.status, 202, "legacy callback shape still returns 202");
    const payload = await response.json();
    assert.equal(payload.data.outbound_webhook.attempted, false);
    assert.equal(payload.data.outbound_webhook.reason, "tenant_code_or_amount_or_currency_missing");
    assert.equal(receiver.calls.length, 0);
  } finally {
    restoreEnv(envSnap);
  }
});

test("/internal/payment-event/callback persists failed dispatch + still returns 202 (best-effort)", async () => {
  const envSnap = snapshotEnv(["PAY_EMAIL_ADAPTER_INTERNAL_KEY", "PAYMENT_WEBHOOK_SECRET"]);
  process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "test-internal-key";
  process.env.PAYMENT_WEBHOOK_SECRET = SECRET;

  const receiver = createMockReceiver({ statusSequence: [400] });
  const evidenceStore = new PaymentEventEvidenceStore();
  const handler = createPayRequestHandler({
    fetchImpl: receiver.fetchImpl,
    paymentEventEvidenceStore: evidenceStore
  });

  try {
    const response = await dispatchToHandler(handler, {
      body: JSON.stringify({
        amount: 9900,
        callback_status: "succeeded",
        currency: "USD",
        domain: "tranhatam.com",
        order_id: "order_callback_fail",
        provider_event_id: "evt_callback_fail",
        tenant_code: TENANT_CODE
      }),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "test-internal-key"
      },
      method: "POST",
      url: "/internal/payment-event/callback"
    });
    // Callback persistence is the primary operation — outbound dispatch is
    // best-effort. Failure of dispatch must NOT fail the callback HTTP code.
    assert.equal(response.status, 202);
    const payload = await response.json();
    assert.equal(payload.data.outbound_webhook.attempted, true);
    assert.equal(payload.data.outbound_webhook.delivered, false);
    const record = evidenceStore.getRecord({
      domain: "tranhatam.com",
      order_id: "order_callback_fail"
    });
    assert.ok(record);
    assert.equal(record.outbound_webhook_status, "failed");
    assert.equal(record.outbound_webhook_final_status, "400");
  } finally {
    restoreEnv(envSnap);
  }
});

test("/internal/payment-webhook/dispatch persists failed dispatch for audit replay", async () => {
  const envSnap = snapshotEnv(["PAY_EMAIL_ADAPTER_INTERNAL_KEY", "PAYMENT_WEBHOOK_SECRET"]);
  process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "test-internal-key";
  process.env.PAYMENT_WEBHOOK_SECRET = SECRET;

  const receiver = createMockReceiver({ statusSequence: [400] });
  const evidenceStore = new PaymentEventEvidenceStore();
  const handler = createPayRequestHandler({
    fetchImpl: receiver.fetchImpl,
    paymentEventEvidenceStore: evidenceStore
  });

  try {
    const response = await dispatchToHandler(handler, {
      body: JSON.stringify({
        amount: 9900,
        currency: "USD",
        domain: "tranhatam.com",
        order_id: "order_dispatch_fail",
        provider_event_id: "evt_dispatch_fail",
        tenant_code: TENANT_CODE
      }),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "test-internal-key"
      },
      method: "POST",
      url: "/internal/payment-webhook/dispatch"
    });
    assert.equal(response.status, 502);
    const record = evidenceStore.getRecord({
      domain: "tranhatam.com",
      order_id: "order_dispatch_fail"
    });
    assert.ok(record, "failed dispatches must still leave an audit record");
    assert.equal(record.outbound_webhook_status, "failed");
    assert.equal(record.outbound_webhook_final_status, "400");
  } finally {
    restoreEnv(envSnap);
  }
});
