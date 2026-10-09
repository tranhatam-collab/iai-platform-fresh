/**
 * Contract between pay and mail-api for the delivery status of a handed-over payment email:
 * queued, deferred, failed and provider_accepted. Only provider_accepted means a provider took it.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePaymentEmailDeliveryStatus,
  sendPaymentEmailOutbound
} from "../../apps/pay/dist/payment-email-outbound-adapter.js";
import { createPayRequestHandler } from "../../apps/pay/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const INPUT = {
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
  requestId: "req_pay_email_status_123",
  siteUrl: "https://tranhatam.com",
  supportEmail: "support@tranhatam.com",
  templateId: "payment_receipt",
  xSiteKey: "site_tranhatam"
};

const mailApi = (data) => async () =>
  new Response(JSON.stringify({ data: { message_id: "msg_status_1", provider_route: "transactional_primary", status: "queued", ...data }, ok: true }), {
    status: 202
  });

const OPTIONS = { mailApiBaseUrl: "https://api.mail.iai.one/v1", mailApiKey: "mail_test_key", workspaceId: "ws_pay_test" };

test("each mail-api delivery status is carried through unchanged", async () => {
  for (const status of ["queued", "deferred", "failed", "provider_accepted"]) {
    const result = await sendPaymentEmailOutbound(INPUT, { ...OPTIONS, fetchImpl: mailApi({ delivery_status: status }) });
    assert.equal(result.deliveryStatus, status);
    assert.equal(result.status, "queued", "the request status of the handoff is separate from the delivery status");
  }
});

test("a missing or unknown delivery status is never treated as accepted", async () => {
  for (const data of [{}, { delivery_status: "delivered" }, { delivery_status: 202 }, { delivery_status: null }, { delivery_status: "PROVIDER_ACCEPTED" }]) {
    const result = await sendPaymentEmailOutbound(INPUT, { ...OPTIONS, fetchImpl: mailApi(data) });
    assert.equal(result.deliveryStatus, "queued", JSON.stringify(data));
  }
  assert.equal(normalizePaymentEmailDeliveryStatus(undefined), "queued");
});

test("the internal send route reports the delivery status and only provider_accepted is an acceptance", async () => {
  const previous = {};
  const set = (key, value) => {
    previous[key] = process.env[key];
    process.env[key] = value;
  };
  set("MAIL_API_BASE_URL", "https://api.mail.iai.one/v1");
  set("MAIL_API_KEY", "mail_test_key");
  set("MAIL_API_WORKSPACE_ID", "ws_pay_test");
  set("PAY_EMAIL_ADAPTER_INTERNAL_KEY", "adapter-secret");

  try {
    const seen = [];
    for (const status of ["queued", "deferred", "failed", "provider_accepted"]) {
      const response = await dispatchToHandler(createPayRequestHandler({ fetchImpl: mailApi({ delivery_status: status }) }), {
        body: JSON.stringify({ ...INPUT, messageIdempotencyKey: `pay-status-${status}`, orderId: `order_${status}`, paymentSessionId: `ps_${status}` }),
        headers: { "content-type": "application/json", "x-pay-email-adapter-key": "adapter-secret" },
        method: "POST",
        url: "/internal/payment-email/send"
      });
      assert.equal(response.status, 202);
      const { data } = await response.json();
      seen.push([data.delivery_status, data.mail_status]);
    }
    assert.deepEqual(seen, [
      ["queued", "queued"],
      ["deferred", "queued"],
      ["failed", "queued"],
      ["provider_accepted", "queued"]
    ]);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
