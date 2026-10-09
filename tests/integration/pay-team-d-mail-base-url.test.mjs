import assert from "node:assert/strict";
import test from "node:test";

import {
  PaymentEmailOutboundAdapterError,
  sendPaymentEmailOutbound
} from "../../apps/pay/dist/payment-email-outbound-adapter.js";
import { createPayRequestHandler } from "../../apps/pay/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

// The mail API location has no built-in default: it must be configured, and a missing or unusable
// value is refused before any request is made.

const input = {
  amount: 150000,
  currency: "VND",
  customerName: "Tran Ha Tam",
  domain: "tranhatam.com",
  invoiceUrl: "https://tranhatam.com/invoices/order_123",
  locale: "vi",
  messageIdempotencyKey: "pay-tranhatam-order-123-payment_receipt",
  orderId: "order_123",
  paidAt: "2026-04-23T09:00:00.000+07:00",
  paymentSessionId: "ps_123",
  productName: "Founder payment test",
  providerReference: "provider_ref_123",
  recipientEmail: "customer@example.com",
  recipientName: "Customer Example",
  requestId: "req_pay_email_base_url",
  siteUrl: "https://tranhatam.com",
  supportEmail: "support@tranhatam.com",
  templateId: "payment_receipt",
  xSiteKey: "site_tranhatam"
};

const ENV_KEYS = ["MAIL_API_BASE_URL", "MAIL_API_KEY", "MAIL_API_WORKSPACE_ID", "PAY_EMAIL_ADAPTER_INTERNAL_KEY"];

async function withEnv(values, run) {
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  Object.assign(process.env, values);
  try {
    return await run();
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

function countingFetch() {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ init, url });
    return new Response(JSON.stringify({ data: { message_id: "msg_1", status: "queued" }, ok: true }), { status: 202 });
  };
  return { calls, fetchImpl };
}

const credentials = { mailApiKey: "mail_test_key", workspaceId: "ws_pay_test" };

test("without a configured base URL the send is refused and fetch is never called", async () => {
  await withEnv({}, async () => {
    const { calls, fetchImpl } = countingFetch();
    await assert.rejects(
      () => sendPaymentEmailOutbound(input, { ...credentials, fetchImpl }),
      (error) => error instanceof PaymentEmailOutboundAdapterError && error.code === "MAIL_API_BASE_URL_MISSING"
    );
    assert.equal(calls.length, 0);
  });
});

test("a blank base URL counts as missing, from config or from the environment", async () => {
  for (const blank of ["", "   "]) {
    await withEnv({ MAIL_API_BASE_URL: blank }, async () => {
      const { calls, fetchImpl } = countingFetch();
      await assert.rejects(
        () => sendPaymentEmailOutbound(input, { ...credentials, fetchImpl }),
        (error) => error.code === "MAIL_API_BASE_URL_MISSING"
      );
      await assert.rejects(
        () => sendPaymentEmailOutbound(input, { ...credentials, fetchImpl, mailApiBaseUrl: blank }),
        (error) => error.code === "MAIL_API_BASE_URL_MISSING"
      );
      assert.equal(calls.length, 0);
    });
  }
});

test("a base URL that is not https (other than loopback) or not a URL is refused before any fetch", async () => {
  for (const bad of ["http://api.example.test/v1", "ftp://mail.example.test/v1", "not a url", "//mail.example.test/v1", "https:/", "javascript:alert(1)"]) {
    await withEnv({}, async () => {
      const { calls, fetchImpl } = countingFetch();
      await assert.rejects(
        () => sendPaymentEmailOutbound(input, { ...credentials, fetchImpl, mailApiBaseUrl: bad }),
        (error) => error instanceof PaymentEmailOutboundAdapterError && error.code === "MAIL_API_BASE_URL_INVALID",
        bad
      );
      assert.equal(calls.length, 0, bad);
    });
  }
});

test("an https base URL is used as configured, from the argument or the environment", async () => {
  await withEnv({}, async () => {
    const fromConfig = countingFetch();
    await sendPaymentEmailOutbound(input, { ...credentials, fetchImpl: fromConfig.fetchImpl, mailApiBaseUrl: "https://mail.example.test/v1/" });
    assert.deepEqual(fromConfig.calls.map((call) => call.url), ["https://mail.example.test/v1/send"]);
  });

  await withEnv({ MAIL_API_BASE_URL: "https://env-mail.example.test/v1" }, async () => {
    const fromEnv = countingFetch();
    await sendPaymentEmailOutbound(input, { ...credentials, fetchImpl: fromEnv.fetchImpl });
    assert.deepEqual(fromEnv.calls.map((call) => call.url), ["https://env-mail.example.test/v1/send"]);
  });
});

test("plain http is accepted for a loopback host only", async () => {
  await withEnv({}, async () => {
    for (const base of ["http://127.0.0.1:9999/v1", "http://localhost:9999/v1"]) {
      const { calls, fetchImpl } = countingFetch();
      await sendPaymentEmailOutbound(input, { ...credentials, fetchImpl, mailApiBaseUrl: base });
      assert.equal(calls.length, 1, base);
      assert.equal(calls[0].url, `${base}/send`);
    }
  });
});

test("a missing key or workspace is still reported before the base URL", async () => {
  await withEnv({}, async () => {
    const { calls, fetchImpl } = countingFetch();
    await assert.rejects(
      () => sendPaymentEmailOutbound(input, { fetchImpl, workspaceId: "ws_pay_test" }),
      (error) => error.code === "MAIL_API_KEY_MISSING"
    );
    await assert.rejects(
      () => sendPaymentEmailOutbound(input, { fetchImpl, mailApiKey: "mail_test_key" }),
      (error) => error.code === "MAIL_API_WORKSPACE_ID_MISSING"
    );
    assert.equal(calls.length, 0);
  });
});

test("the internal send route answers 503 with the error code when the base URL is not configured", async () => {
  await withEnv(
    { MAIL_API_KEY: "mail_test_key", MAIL_API_WORKSPACE_ID: "ws_pay_test", PAY_EMAIL_ADAPTER_INTERNAL_KEY: "adapter-secret" },
    async () => {
      const { calls, fetchImpl } = countingFetch();
      const response = await dispatchToHandler(createPayRequestHandler({ fetchImpl }), {
        body: JSON.stringify(input),
        headers: { "content-type": "application/json", "x-pay-email-adapter-key": "adapter-secret" },
        method: "POST",
        url: "/internal/payment-email/send"
      });
      const text = await response.text();
      assert.equal(response.status, 503);
      assert.match(text, /MAIL_API_BASE_URL_MISSING/u);
      assert.equal(calls.length, 0);
    }
  );
});
