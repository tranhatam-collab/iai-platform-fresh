/**
 * Contract between pay and mail-api for the delivery status of a handed-over payment email:
 * queued, deferred, failed and provider_accepted. Only provider_accepted means a provider took it.
 */

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

test("the internal send route and the stored evidence treat only provider_accepted as an acceptance", async () => {
  const previous = {};
  const set = (key, value) => {
    previous[key] = process.env[key];
    process.env[key] = value;
  };
  set("MAIL_API_BASE_URL", "https://api.mail.iai.one/v1");
  set("MAIL_API_KEY", "mail_test_key");
  set("MAIL_API_WORKSPACE_ID", "ws_pay_test");
  set("PAY_EMAIL_ADAPTER_INTERNAL_KEY", "adapter-secret");
  const dir = mkdtempSync(join(tmpdir(), "pay-status-evidence-"));

  try {
    const seen = [];
    for (const status of ["queued", "deferred", "failed", "provider_accepted"]) {
      const handler = createPayRequestHandler({
        fetchImpl: mailApi({ delivery_status: status }),
        paymentEventEvidenceStoreFilePath: join(dir, `${status}.json`)
      });
      const response = await dispatchToHandler(handler, {
        body: JSON.stringify({ ...INPUT, messageIdempotencyKey: `pay-status-${status}`, orderId: `order_${status}`, paymentSessionId: `ps_${status}` }),
        headers: { "content-type": "application/json", "x-pay-email-adapter-key": "adapter-secret" },
        method: "POST",
        url: "/internal/payment-email/send"
      });
      assert.equal(response.status, 202);
      const { data } = await response.json();
      const evidenceResponse = await dispatchToHandler(handler, {
        headers: { "x-pay-email-adapter-key": "adapter-secret" },
        url: `/internal/payment-event/evidence?canonical_row_ref=${data.canonical_row_ref}`
      });
      const evidence = (await evidenceResponse.json()).data;
      seen.push({
        auditEvents: evidence.audit_log.map((entry) => entry.event),
        auditStatus: evidence.audit_log[0].details.delivery_status ?? null,
        bodyAcceptedAt: data.accepted_at !== null,
        deliveryStatus: data.delivery_status,
        handedOver: typeof data.handed_over_at === "string",
        mailStatus: data.mail_status,
        recordAcceptedAt: evidence.accepted_at !== "",
        recordDeliveryStatus: evidence.mail_delivery_status
      });
    }

    const handedOver = (status) => ({
      auditEvents: ["payment_email_handoff"],
      auditStatus: status,
      bodyAcceptedAt: false,
      deliveryStatus: status,
      handedOver: true,
      mailStatus: "queued",
      recordAcceptedAt: false,
      recordDeliveryStatus: status
    });
    assert.deepEqual(seen, [
      handedOver("queued"),
      handedOver("deferred"),
      handedOver("failed"),
      {
        auditEvents: ["payment_email_accepted"],
        auditStatus: null,
        bodyAcceptedAt: true,
        deliveryStatus: "provider_accepted",
        handedOver: true,
        mailStatus: "queued",
        recordAcceptedAt: true,
        recordDeliveryStatus: "provider_accepted"
      }
    ]);
  } finally {
    rmSync(dir, { force: true, recursive: true });
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
