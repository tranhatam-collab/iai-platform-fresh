import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import {
  createDemoPayReadModel,
  createDemoPayReadModelSource,
  createResolvedPayReadModel
} from "../../apps/pay/dist/read-model.js";
import {
  buildPaymentEmailOutboundPayload,
  PaymentEmailOutboundAdapterError,
  sendPaymentEmailOutbound
} from "../../apps/pay/dist/payment-email-outbound-adapter.js";
import { createPayRequestHandler } from "../../apps/pay/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const readModel = createDemoPayReadModel();
const homeRefs = readModel.getHomeRouteRefs();
const demoSession = readModel.getPaymentSession(homeRefs.demoCheckoutSessionId);
const demoReceipt = readModel.getReceipt(homeRefs.demoReceiptId);

function createPaymentEmailInput(overrides = {}) {
  return {
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
    requestId: "req_pay_email_test_123",
    siteUrl: "https://tranhatam.com",
    supportEmail: "support@tranhatam.com",
    templateId: "payment_receipt",
    xSiteKey: "site_tranhatam",
    ...overrides
  };
}

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

test("pay health route exposes phase D prep contract and locale lock", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/health"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(payload.ok, true);
  assert.equal(payload.data.service, "iai-pay");
  assert.equal(payload.data.status, "phase_d_prep");
  assert.deepEqual(payload.data.gate, {
    owner: "team1_program_root",
    phase: "phase_d_prep",
    release_claim: false,
    state: "locked"
  });
  assert.deepEqual(payload.data.locale_contract, {
    default_locale: "en",
    fallback_locale: "en",
    supported_locales: ["en", "vi"]
  });
  assert.deepEqual(payload.data.read_model, {
    fallback_mode: "demo_contract",
    mode: "fallback_enabled",
    primary_mode: "shared_stub",
    selection_mode: "shared_fallback_demo"
  });
  // Q1 SIGNED 2026-04-26: /health emits a contract-shaped stub for the
  // shared runtime fields when no real runtime is bound, so the Team 2
  // probe (scripts/team2-pay-shared-runtime-probe.mjs) can verify contract
  // compliance. The stub is marked _health_contract_stub: true and asserts
  // rolloutReadyForSharedOnly=true (contract-readiness signal, not
  // data-readiness). Real bindings replace the stub with real status when
  // configured (see /supports file-backed shared read model rollout/ tests).
  assert.equal(payload.data.shared_read_model._health_contract_stub, true);
  assert.equal(payload.data.shared_read_model.rolloutReadyForSharedOnly, true);
  assert.equal(payload.data.shared_read_model.configured, false);
  assert.equal(payload.data.shared_read_model.source, "none");
  assert.equal(payload.data.shared_upstream_runtime._health_contract_stub, true);
  assert.equal(payload.data.shared_upstream_runtime.activeReadMode, "shared_contract");
  assert.equal(payload.data.shared_upstream_runtime.releaseGate.ready, true);
  assert.equal(payload.data.shared_upstream_runtime.configured, false);
  assert.equal(payload.data.web_surface_enabled, false);
  assert.equal(payload.data.web_url, null);
  assert.ok(payload.data.route_family.api.includes("/api/receiver-registry"));
  assert.ok(
    payload.data.route_family.api.includes(
      "/api/payment-routing?domain={domain}&country={country}&currency={currency}&amount={amount}"
    )
  );
  assert.ok(payload.data.route_family.api.includes("/api/payment-email-templates?domain={domain}"));
  assert.ok(payload.data.route_family.api.includes("/api/payment-surface-registry?domain={domain}"));
  assert.ok(payload.data.route_family.api.includes("/api/site-activation-registry?domain={domain}"));
  assert.ok(payload.data.route_family.internal.includes("/internal/payment-email/send"));
  assert.ok(payload.data.route_family.internal.includes("/internal/payment-event/callback"));
  assert.ok(payload.data.route_family.internal.includes("/internal/payment-event/proof"));
  assert.ok(
    payload.data.route_family.internal.includes(
      "/internal/payment-event/evidence?domain={domain}&provider_reference={provider_ref}"
    )
  );
  assert.ok(
    payload.data.route_family.public.includes(
      "/payment-block?domain={domain}&country={country}&currency={currency}&amount={amount}"
    )
  );
  assert.ok(payload.data.route_family.public.includes("/checkout/{payment_session_id}"));
  assert.ok(payload.data.route_family.public.includes("/receipt/{payment_or_receipt_id}"));
  assert.ok(payload.data.route_family.operator.includes("/ops/reconciliation"));
  assert.ok(payload.data.route_family.operator.includes("/ops/audit"));
  assert.ok(payload.data.route_family.operator.includes("/ops/payments/{item_id}"));
});

test("pay exposes centralized receiver registry for assigned and hold receivers", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/receiver-registry"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.generatedFrom, "PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md");
  assert.equal(payload.data.receiverCount, 12);
  assert.equal(payload.data.sensitiveReceiverRule.includes("HOLD_NOT_ASSIGNED"), true);
  assert.equal(payload.data.notificationRule.mode, "domain_email_triplet");
  assert.equal(payload.data.assignmentMap[0].domain, "tranhatam.com");
  assert.equal(payload.data.assignmentMap[0].primaryVndReceiverId, "recv_vnd_personal_tranhatam_acb");
  const relayReceiver = payload.data.receivers.find(
    (receiver) => receiver.receiverId === "recv_usd_angeledutam_foundation_relay_thread"
  );
  assert.ok(relayReceiver);
  assert.equal(relayReceiver.assignmentStatus, "ACTIVE_DOMAIN_DEFAULT");
  assert.equal(relayReceiver.channelType, "us_bank_account");
  assert.equal(relayReceiver.accountNumber, "200001161269");
  assert.equal(relayReceiver.routingNumber, "064209588");
  assert.deepEqual(relayReceiver.defaultForDomains, [
    "vc.vetuonglai.com",
    "invest.vetuonglai.com",
    "life.vetuonglai.com"
  ]);
  const omdalatAssignment = payload.data.assignmentMap.find(
    (assignment) => assignment.domain === "omdalat.com"
  );
  assert.ok(omdalatAssignment);
  assert.equal(omdalatAssignment.status, "ACTIVE_NOW");
  assert.equal(omdalatAssignment.primaryVndReceiverId, "recv_vnd_thailam_acb");
  const vetuonglaiVcAssignment = payload.data.assignmentMap.find(
    (assignment) => assignment.domain === "vc.vetuonglai.com"
  );
  assert.ok(vetuonglaiVcAssignment);
  assert.equal(vetuonglaiVcAssignment.status, "ACTIVE_NOW");
  assert.equal(vetuonglaiVcAssignment.primaryVndReceiverId, "recv_vnd_thanhtamphat_acb");
  assert.equal(
    vetuonglaiVcAssignment.primaryUsdReceiverId,
    "recv_usd_angeledutam_foundation_relay_thread"
  );
});

test("pay resolves VND payment routing with dynamic VietQR quick links and domain email triplet", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-routing?domain=tranhatam.com&country=VN&amount=150000&package_code=starter-g1"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "tranhatam.com");
  assert.equal(payload.data.assignmentStatus, "ACTIVE_NOW");
  assert.equal(payload.data.resolvedCurrency, "VND");
  assert.equal(payload.data.channels.length, 1);
  assert.equal(payload.data.fallbackChannels.length, 2);

  const primaryChannel = payload.data.channels[0];
  assert.equal(primaryChannel.receiver.receiverId, "recv_vnd_personal_tranhatam_acb");
  assert.equal(primaryChannel.quickLink.provider, "vietqr_quick_link");
  assert.match(primaryChannel.quickLink.url, /img\.vietqr\.io\/image\/ACB-27588277-compact2\.png/);
  assert.match(primaryChannel.quickLink.url, /amount=150000/);
  assert.deepEqual(primaryChannel.transactionNotification.addresses, [
    "pay@tranhatam.com",
    "billing@tranhatam.com",
    "support@tranhatam.com"
  ]);

  const fallbackVnd = payload.data.fallbackChannels.find(
    (channel) => channel.receiver.receiverId === "recv_vnd_personal_tranhatam_vcb"
  );
  assert.ok(fallbackVnd);
  assert.match(fallbackVnd.quickLink.url, /img\.vietqr\.io\/image\/Vietcombank-0231000091212-compact2\.png/);

  const usdFallback = payload.data.fallbackChannels.find(
    (channel) => channel.receiver.receiverId === "recv_usd_personal_tranhatam_paypal"
  );
  assert.ok(usdFallback);
  assert.equal(usdFallback.paymentTarget.paypal_email, "tranhatam@gmail.com");
});

test("pay enforces VND for Vietnam-issued ID on tranhatam.com dual-rail checkout", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-routing?domain=tranhatam.com&id_country=VN&currency=USD&amount=150000&package_code=starter-g1"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "tranhatam.com");
  assert.equal(payload.data.resolvedCurrency, "VND");
  assert.equal(payload.data.channels.length, 1);
  assert.equal(payload.data.channels[0].receiver.receiverId, "recv_vnd_personal_tranhatam_acb");
  assert.equal(payload.data.fallbackChannels.length, 1);
  assert.equal(payload.data.fallbackChannels[0].receiver.receiverId, "recv_vnd_personal_tranhatam_vcb");
  assert.equal(payload.data.currencyPolicy.rule, "VN_ID_REQUIRES_VND");
  assert.equal(payload.data.currencyPolicy.requiredCurrency, "VND");
  assert.equal(payload.data.requestedIdCountry, "VN");
  assert.match(payload.data.notes.join(" "), /overridden by ID-country policy/i);
});

test("pay enforces USD for non-Vietnam ID on tranhatam.com international checkout", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-routing?domain=tranhatam.com&id_country=US&currency=VND&amount=50&package_code=starter-g1"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "tranhatam.com");
  assert.equal(payload.data.resolvedCurrency, "USD");
  assert.equal(payload.data.channels.length, 1);
  assert.equal(payload.data.channels[0].receiver.receiverId, "recv_usd_personal_tranhatam_paypal");
  assert.equal(payload.data.channels[0].channelType, "paypal_email");
  assert.equal(payload.data.fallbackChannels.length, 0);
  assert.equal(payload.data.currencyPolicy.rule, "NON_VN_ID_REQUIRES_USD");
  assert.equal(payload.data.currencyPolicy.requiredCurrency, "USD");
  assert.equal(payload.data.requestedIdCountry, "US");
  assert.match(payload.data.notes.join(" "), /overridden by ID-country policy/i);
});

test("pay resolves omdalat.com to the Thai Lam VND receiver assignment", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-routing?domain=omdalat.com&country=VN&amount=250000&package_code=omdalat-access"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "omdalat.com");
  assert.equal(payload.data.assignmentStatus, "ACTIVE_NOW");
  assert.equal(payload.data.resolvedCurrency, "VND");
  assert.equal(payload.data.channels.length, 1);
  assert.equal(payload.data.fallbackChannels.length, 0);
  assert.equal(payload.data.channels[0].receiver.receiverId, "recv_vnd_thailam_acb");
  assert.equal(payload.data.channels[0].receiver.displayName, "Công ty TNHH SX - TM - DV Thai Lam");
  assert.match(payload.data.channels[0].quickLink.url, /img\.vietqr\.io\/image\/ACB-43545878-compact2\.png/);
  assert.match(payload.data.channels[0].quickLink.url, /amount=250000/);
  assert.deepEqual(payload.data.channels[0].transactionNotification.addresses, [
    "pay@omdalat.com",
    "billing@omdalat.com",
    "support@omdalat.com"
  ]);
});

test("pay resolves vc.vetuonglai.com to the Thanh Tam Phat VND receiver assignment", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-routing?domain=vc.vetuonglai.com&country=VN&amount=300000&package_code=vc-access"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "vc.vetuonglai.com");
  assert.equal(payload.data.assignmentStatus, "ACTIVE_NOW");
  assert.equal(payload.data.resolvedCurrency, "VND");
  assert.equal(payload.data.channels.length, 1);
  assert.equal(payload.data.fallbackChannels.length, 1);
  assert.equal(payload.data.channels[0].receiver.receiverId, "recv_vnd_thanhtamphat_acb");
  assert.equal(payload.data.channels[0].receiver.displayName, "Công ty TNHH ĐTTM Thanh Tam Phat");
  assert.match(payload.data.channels[0].quickLink.url, /img\.vietqr\.io\/image\/ACB-369999996-compact2\.png/);
  assert.match(payload.data.channels[0].quickLink.url, /amount=300000/);
  assert.equal(
    payload.data.fallbackChannels[0].receiver.receiverId,
    "recv_usd_angeledutam_foundation_relay_thread"
  );
  assert.deepEqual(payload.data.channels[0].transactionNotification.addresses, [
    "pay@vc.vetuonglai.com",
    "billing@vc.vetuonglai.com",
    "support@vc.vetuonglai.com"
  ]);
});

test("pay enforces VND for Vietnam-issued ID on vetuonglai surfaces", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-routing?domain=vc.vetuonglai.com&id_country=VN&currency=USD&amount=300000&package_code=vc-access"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "vc.vetuonglai.com");
  assert.equal(payload.data.resolvedCurrency, "VND");
  assert.equal(payload.data.channels.length, 1);
  assert.equal(payload.data.channels[0].receiver.receiverId, "recv_vnd_thanhtamphat_acb");
  assert.equal(payload.data.fallbackChannels.length, 0);
  assert.equal(payload.data.currencyPolicy.rule, "VN_ID_REQUIRES_VND");
  assert.equal(payload.data.currencyPolicy.requiredCurrency, "VND");
  assert.equal(payload.data.requestedIdCountry, "VN");
  assert.match(payload.data.notes.join(" "), /overridden by ID-country policy/i);
});

test("pay enforces USD for non-Vietnam ID on vetuonglai surfaces", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-routing?domain=vc.vetuonglai.com&id_country=US&currency=VND&amount=1200&package_code=vc-access"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "vc.vetuonglai.com");
  assert.equal(payload.data.resolvedCurrency, "USD");
  assert.equal(payload.data.channels.length, 1);
  assert.equal(
    payload.data.channels[0].receiver.receiverId,
    "recv_usd_angeledutam_foundation_relay_thread"
  );
  assert.equal(payload.data.channels[0].channelType, "us_bank_account");
  assert.equal(payload.data.fallbackChannels.length, 0);
  assert.equal(payload.data.currencyPolicy.rule, "NON_VN_ID_REQUIRES_USD");
  assert.equal(payload.data.currencyPolicy.requiredCurrency, "USD");
  assert.equal(payload.data.requestedIdCountry, "US");
  assert.match(payload.data.notes.join(" "), /overridden by ID-country policy/i);
});

test("pay resolves USD payment routing and keeps honest PayPal target when paypal.me is not assigned", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-routing?domain=tranhatam.com&country=US&amount=25"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.resolvedCurrency, "USD");
  assert.equal(payload.data.channels.length, 1);
  assert.equal(payload.data.channels[0].receiver.receiverId, "recv_usd_personal_tranhatam_paypal");
  assert.equal(payload.data.channels[0].paymentTarget.paypal_email, "tranhatam@gmail.com");
  assert.equal(payload.data.channels[0].quickLink.url, null);
  assert.equal(payload.data.fallbackChannels[0].receiver.receiverId, "recv_vnd_personal_tranhatam_acb");
});

test("pay keeps deferred domains blocked in routing resolver until founder assignment exists", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-routing?domain=omdala.com&country=VN&amount=90000"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.assignmentStatus, "DEFERRED_UNTIL_FOUNDER_INSTRUCTION");
  assert.equal(payload.data.channels.length, 0);
  assert.match(payload.data.notes[0], /prep packet is locked/i);
  assert.match(payload.data.notes[1], /deferred until founder/i);
});

test("pay exposes machine-readable Team D site activation registry for all intake sites", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/site-activation-registry"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.scope, "team_d_intake_sites");
  assert.equal(payload.data.totalSites, 17);
  assert.equal(payload.data.assignmentCounts.activeNow, 5);
  assert.equal(payload.data.assignmentCounts.deferredUntilFounderInstruction, 12);
  assert.equal(payload.data.marketCounts.vn, 10);
  assert.equal(payload.data.marketCounts.international, 1);
  assert.equal(payload.data.marketCounts.tbd, 6);
});

test("pay exposes per-domain site activation prep packet with deferred payment assignment", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/site-activation-registry?domain=flow.iai.one"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "flow.iai.one");
  assert.equal(payload.data.intakeId, "SITE-INTAKE-106");
  assert.equal(payload.data.paymentAssignmentState, "DEFERRED_UNTIL_FOUNDER_INSTRUCTION");
  assert.equal(payload.data.senderPackage.pay, "pay@flow.iai.one");
  assert.ok(payload.data.requiredLinks.includes("checkout_base_url:flow.iai.one"));
  assert.match(payload.data.paymentAssignmentNote, /deferred until founder/i);
});

test("pay marks prepared Team D domains as form-in-progress once the packet is locked", async () => {
  const cases = [
    {
      domain: "nguyenlananh.com",
      expectedAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      expectedLocale: "vi",
      expectedForm: "PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md"
    },
    {
      domain: "omdala.com",
      expectedAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      expectedLocale: "vi",
      expectedForm: "PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md"
    },
    {
      domain: "vc.vetuonglai.com",
      expectedAssignmentState: "ACTIVE_NOW",
      expectedLocale: "vi",
      expectedForm: "PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md"
    },
    {
      domain: "aiaccountingloop.com",
      expectedAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      expectedLocale: "en",
      expectedForm: "PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md"
    }
  ];

  for (const item of cases) {
    const response = await dispatchToHandler(createPayRequestHandler(), {
      url: `/api/site-activation-registry?domain=${item.domain}`
    });
    const payload = await response.json();

    assert.equal(response.status, 200, item.domain);
    assert.equal(payload.ok, true, item.domain);
    assert.equal(payload.data.currentBoardStatus, "FORM_IN_PROGRESS", item.domain);
    assert.equal(payload.data.defaultLocale, item.expectedLocale, item.domain);
    assert.equal(payload.data.onboardingForm, item.expectedForm, item.domain);
    assert.equal(payload.data.paymentAssignmentState, item.expectedAssignmentState, item.domain);
    assert.equal(payload.data.senderPackage.pay, `pay@${item.domain}`, item.domain);
    assert.match(
      payload.data.nextOpsPacketAction,
      /active|founder instruction|callback|mailbox|legal owner|risk|collection/i,
      item.domain
    );
  }
});

test("pay keeps site activation registry honest for unsupported domains", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/site-activation-registry?domain=unknown.example"
  });
  const payload = await response.json();

  assert.equal(response.status, 404);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "SITE_ACTIVATION_REGISTRY_NOT_CONFIGURED");
});

test("pay exposes locked bilingual payment email templates for tranhatam.com", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-email-templates?domain=tranhatam.com"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "tranhatam.com");
  assert.equal(payload.data.templateCount, 14);
  assert.equal(payload.data.policy.paymentReceiptSender, "pay@tranhatam.com");
  assert.equal(payload.data.policy.billingFailedRefundSender, "billing@tranhatam.com");
  assert.equal(payload.data.policy.replyTo, "support@tranhatam.com");
  assert.equal(payload.data.policy.noreplyAllowedForPaymentMail, false);
  assert.equal(payload.data.templateScope, "TEAM_D_CORE_PAYMENT_SET");
  assert.match(payload.data.templates.payment_receipt.subject.vi, /Biên nhận thanh toán/);
  assert.match(payload.data.templates.payment_receipt.subject.en, /Payment receipt/);
  assert.match(payload.data.templates.checkout_status_update.subject.vi, /đang chờ xác nhận/);
  assert.match(payload.data.templates.payment_failed_notice.subject.en, /Payment was not completed/);
  assert.match(payload.data.templates.refund_notice.subject.vi, /Cập nhật hoàn tiền/);
  assert.match(payload.data.templates.checkout_pending.textBody, /{{docs_url}}/);
  assert.match(payload.data.templates.manual_payment_instruction.textBody, /pay@tranhatam\.com|thanh toán chính thức/i);
  assert.match(payload.data.templates.invoice_available.textBody, /{{invoice_url}}/);
  assert.match(payload.data.templates.contact_request_received.subject.vi, /đã nhận được tin nhắn/i);
  assert.match(payload.data.templates.support_request_received.sender, /support@tranhatam\.com/);
  assert.match(payload.data.templates.join_request_received.textBody, /pay@tranhatam\.com/);
  assert.match(payload.data.templates.docs_access_guidance.textBody, /{{docs_url}}/);
  assert.match(payload.data.footer, /Email này được gửi tự động từ Tranhatam\.com/);
  assert.ok(payload.data.commonVariables.includes("{{support_email}}"));
  assert.ok(payload.data.commonVariables.includes("{{docs_url}}"));
  assert.ok(payload.data.commonVariables.includes("{{request_id}}"));
});

test("pay exposes researched core payment email templates for flow.iai.one", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-email-templates?domain=flow.iai.one"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "flow.iai.one");
  assert.equal(payload.data.paymentPack, "PACK_A");
  assert.equal(payload.data.surfaceClass, "PAYMENT_ACTIVE_OR_CANDIDATE");
  assert.equal(payload.data.customerFacingPaymentEmailAllowed, true);
  assert.equal(payload.data.templateCount, 4);
  assert.equal(payload.data.templateScope, "TEAM_D_CORE_PAYMENT_SET");
  assert.equal(payload.data.policy.paymentReceiptSender, "pay@flow.iai.one");
  assert.equal(payload.data.policy.billingFailedRefundSender, "billing@flow.iai.one");
  assert.equal(payload.data.policy.replyTo, "support@flow.iai.one");
  assert.match(payload.data.templates.payment_receipt.subject.vi, /IAI Flow/);
  assert.match(payload.data.templates.checkout_status_update.textBody, /workflows, agents, and runtime/i);
  assert.match(payload.data.templates.payment_failed_notice.subject.en, /Billing action was not completed/);
});

test("pay exposes pack B billing email templates for dash.iai.one", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-email-templates?domain=dash.iai.one"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "dash.iai.one");
  assert.equal(payload.data.paymentPack, "PACK_B");
  assert.equal(payload.data.surfaceClass, "BILLING_SUPPORT_ONLY");
  assert.equal(payload.data.customerFacingPaymentEmailAllowed, false);
  assert.equal(payload.data.templateCount, 7);
  assert.equal(payload.data.templateScope, "PACK_FULL_SET");
  assert.equal(payload.data.policy.paymentReceiptSender, "pay@dash.iai.one");
  assert.equal(payload.data.policy.billingFailedRefundSender, "billing@dash.iai.one");
  assert.match(payload.data.templates.invoice_issued.subject.en, /Invoice issued/);
  assert.match(payload.data.templates.billing_failed.subject.vi, /thu phí không thành công/);
  assert.match(
    payload.data.templates.payment_method_update_required.subject.vi,
    /Cần cập nhật phương thức thanh toán/
  );
});

test("pay exposes pack D ops templates for pay.iai.one", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-email-templates?domain=pay.iai.one"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "pay.iai.one");
  assert.equal(payload.data.paymentPack, "PACK_D");
  assert.equal(payload.data.surfaceClass, "PAYMENT_ACTIVE_OR_CANDIDATE");
  assert.equal(payload.data.customerFacingPaymentEmailAllowed, false);
  assert.equal(payload.data.templateCount, 6);
  assert.equal(payload.data.templateScope, "PACK_FULL_SET");
  assert.equal(payload.data.policy.paymentReceiptSender, "pay@pay.iai.one");
  assert.equal(payload.data.policy.billingFailedRefundSender, "billing@pay.iai.one");
  assert.match(payload.data.templates.provider_webhook_failed.subject.en, /Provider webhook failed/);
  assert.match(
    payload.data.templates.mailbox_sender_binding_missing.subject.vi,
    /Thiếu sender binding/
  );
});

test("pay exposes researched core payment email templates for omdala.com", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-email-templates?domain=omdala.com"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "omdala.com");
  assert.equal(payload.data.templateCount, 4);
  assert.equal(payload.data.templateScope, "TEAM_D_CORE_PAYMENT_SET");
  assert.match(payload.data.templates.checkout_status_update.textBody, /coordination plan|access lane/i);
  assert.match(payload.data.templates.payment_receipt.subject.en, /OMDALA/);
  assert.match(payload.data.footer, /OMDALA/);
});

test("pay exposes complete Om Dalat payment and interaction email pack", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-email-templates?domain=omdalat.com"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "omdalat.com");
  assert.equal(payload.data.templateCount, 14);
  assert.equal(payload.data.policy.paymentReceiptSender, "pay@omdalat.com");
  assert.equal(payload.data.policy.billingFailedRefundSender, "billing@omdalat.com");
  assert.equal(payload.data.policy.replyTo, "support@omdalat.com");
  assert.equal(payload.data.policy.noreplyAllowedForPaymentMail, false);
  assert.match(payload.data.templates.payment_receipt.subject.vi, /Ôm Đà Lạt/);
  assert.match(payload.data.templates.checkout_pending.textBody, /{{docs_url}}/);
  assert.match(payload.data.templates.manual_payment_instruction.textBody, /pay@omdalat\.com|thanh toán chính thức/i);
  assert.match(payload.data.templates.payment_failed.textBody, /support@omdalat\.com|{{support_email}}/);
  assert.match(payload.data.templates.invoice_available.textBody, /{{invoice_url}}/);
  assert.match(payload.data.templates.contact_request_received.subject.vi, /đã nhận được tin nhắn/i);
  assert.match(payload.data.templates.support_request_received.sender, /support@omdalat\.com/);
  assert.match(payload.data.templates.join_request_received.textBody, /pay@omdalat\.com/);
  assert.match(payload.data.templates.docs_access_guidance.textBody, /{{docs_url}}/);
  assert.ok(payload.data.commonVariables.includes("{{docs_url}}"));
  assert.ok(payload.data.commonVariables.includes("{{request_id}}"));
});

test("pay exposes researched billing-oriented templates for aiaccountingloop.com", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-email-templates?domain=aiaccountingloop.com"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "aiaccountingloop.com");
  assert.equal(payload.data.paymentPack, "PACK_B");
  assert.equal(payload.data.defaultLocale, "en");
  assert.equal(payload.data.templateCount, 4);
  assert.equal(payload.data.templateScope, "TEAM_D_CORE_PAYMENT_SET");
  assert.match(payload.data.templates.checkout_status_update.textBody, /accounting, reconciliation, reporting, or compliance/i);
  assert.match(payload.data.templates.payment_receipt.subject.en, /Billing receipt/);
  assert.equal(payload.data.policy.replyTo, "support@aiaccountingloop.com");
});

test("pay exposes the Team D core payment email set for every prepared domain", async () => {
  const domains = [
    "tranhatam.com",
    "nguyenlananh.com",
    "omdala.com",
    "app.omdala.com",
    "omdalat.com",
    "app.omdalat.com",
    "flow.iai.one",
    "life.iai.one",
    "vc.vetuonglai.com",
    "invest.vetuonglai.com",
    "life.vetuonglai.com",
    "aiaccountingloop.com",
    "tramsaigon.com",
    "app.iai.one",
    "noos.iai.one",
    "cios.iai.one",
    "lamviec.muonnoi.org"
  ];
  const expectedTemplateCounts = new Map([
    ["omdalat.com", 14],
    ["tranhatam.com", 14]
  ]);

  for (const domain of domains) {
    const response = await dispatchToHandler(createPayRequestHandler(), {
      url: `/api/payment-email-templates?domain=${domain}`
    });
    const payload = await response.json();

    assert.equal(response.status, 200, domain);
    assert.equal(payload.ok, true, domain);
    assert.equal(payload.data.domain, domain);
    assert.equal(payload.data.templateScope, "TEAM_D_CORE_PAYMENT_SET", domain);
    assert.equal(payload.data.templateCount, expectedTemplateCounts.get(domain) ?? 4, domain);
    assert.ok(payload.data.templates.payment_receipt, domain);
    assert.ok(payload.data.templates.checkout_status_update, domain);
    assert.ok(payload.data.templates.payment_failed_notice, domain);
    assert.ok(payload.data.templates.refund_notice, domain);
  }
});

test("pay builds normalized outbound payment email payloads from the locked registry", () => {
  const payload = buildPaymentEmailOutboundPayload(createPaymentEmailInput());

  assert.equal(payload.stream, "transactional");
  assert.equal(payload.message_idempotency_key, "pay-tranhatam-order-123-payment_receipt");
  assert.equal(payload.from.email, "pay@tranhatam.com");
  assert.equal(payload.reply_to.email, "support@tranhatam.com");
  assert.equal(payload.to[0].email, "customer@example.com");
  assert.match(payload.subject, /Biên nhận thanh toán #order_123/);
  assert.match(payload.text, /Founder payment test/);
  assert.match(payload.text, /https:\/\/tranhatam\.com\/invoices\/order_123/);
  assert.doesNotMatch(payload.subject, /{{/);
  assert.doesNotMatch(payload.text, /{{/);
  assert.deepEqual(payload.tags, ["pay", "payment_receipt", "tranhatam.com"]);
  assert.equal(payload.metadata.source_app, "pay.iai.one");
  assert.equal(payload.metadata.source_domain, "tranhatam.com");
  assert.equal(payload.metadata.template_id, "payment_receipt");
  assert.equal(payload.metadata.provider_reference, "provider_ref_123");
  assert.equal(payload.metadata.x_site_key, "site_tranhatam");
});

test("pay builds Om Dalat interaction email payloads from support sender", () => {
  const payload = buildPaymentEmailOutboundPayload(
    createPaymentEmailInput({
      amount: 0,
      currency: "VND",
      customerName: "Anh Tâm",
      domain: "omdalat.com",
      locale: "vi",
      messageIdempotencyKey: "omdalat-support-req-001",
      orderId: "omdalat_req_001",
      productName: "Tư vấn tham gia Ôm Đà Lạt",
      recipientEmail: "tranhatam@gmail.com",
      recipientName: "Trần Hà Tâm",
      requestId: "omdalat_req_001",
      siteUrl: "https://omdalat.com",
      supportEmail: "support@omdalat.com",
      templateId: "support_request_received",
      workspaceName: "Ôm Đà Lạt Web",
      xSiteKey: "site_omdalat"
    })
  );

  assert.equal(payload.from.email, "support@omdalat.com");
  assert.equal(payload.from.name, "Ôm Đà Lạt");
  assert.equal(payload.reply_to.email, "support@omdalat.com");
  assert.match(payload.subject, /Đã nhận yêu cầu hỗ trợ/);
  assert.match(payload.text, /https:\/\/omdalat\.com\/docs/);
  assert.match(payload.text, /omdalat_req_001/);
  assert.doesNotMatch(payload.text, /{{/);
  assert.deepEqual(payload.tags, ["pay", "support_request_received", "omdalat.com"]);
});

test("pay fails closed when outbound payment email variables are missing", () => {
  assert.throws(
    () =>
      buildPaymentEmailOutboundPayload(
        createPaymentEmailInput({
          invoiceUrl: undefined
        })
      ),
    (error) =>
      error instanceof PaymentEmailOutboundAdapterError &&
      error.code === "PAYMENT_EMAIL_UNRESOLVED_VARIABLES" &&
      Array.isArray(error.details.missingVariables) &&
      error.details.missingVariables.includes("invoice_url")
  );
});

test("pay hands normalized payment email payloads to the mail API when configured", async () => {
  const calls = [];
  const result = await sendPaymentEmailOutbound(createPaymentEmailInput(), {
    fetchImpl: async (url, init) => {
      calls.push({
        body: JSON.parse(init.body),
        headers: init.headers,
        method: init.method,
        url
      });

      return new Response(
        JSON.stringify({
          data: {
            accepted_recipients: 1,
            message_id: "msg_pay_email_123",
            provider_route: "transactional_primary",
            status: "queued"
          },
          ok: true
        }),
        {
          status: 202
        }
      );
    },
    mailApiBaseUrl: "https://api.mail.iai.one/v1",
    mailApiKey: "mail_test_key",
    workspaceId: "ws_pay_test"
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.mail.iai.one/v1/send");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers.Authorization, "Bearer mail_test_key");
  assert.equal(calls[0].headers["X-Workspace-Id"], "ws_pay_test");
  assert.equal(calls[0].headers["X-Request-Id"], "req_pay_email_test_123");
  assert.equal(calls[0].body.from.email, "pay@tranhatam.com");
  assert.equal(calls[0].body.reply_to.email, "support@tranhatam.com");
  assert.equal(calls[0].body.metadata.order_id, "order_123");
  assert.equal(result.messageId, "msg_pay_email_123");
  assert.equal(result.providerRoute, "transactional_primary");
  assert.equal(result.status, "queued");
});

test("pay refuses outbound payment email handoff without MAIL_API_KEY", async () => {
  await assert.rejects(
    () =>
      sendPaymentEmailOutbound(createPaymentEmailInput(), {
        fetchImpl: async () => {
          throw new Error("fetch should not be called without MAIL_API_KEY");
        },
        workspaceId: "ws_pay_test"
      }),
    (error) =>
      error instanceof PaymentEmailOutboundAdapterError &&
      error.code === "MAIL_API_KEY_MISSING"
  );
});

test("pay exposes a guarded internal runtime route for payment email handoff", async () => {
  const env = snapshotEnv([
    "MAIL_API_BASE_URL",
    "MAIL_API_KEY",
    "MAIL_API_WORKSPACE_ID",
    "PAY_EMAIL_ADAPTER_INTERNAL_KEY"
  ]);
  const calls = [];

  try {
    process.env.MAIL_API_BASE_URL = "https://api.mail.iai.one/v1";
    process.env.MAIL_API_KEY = "mail_test_key";
    process.env.MAIL_API_WORKSPACE_ID = "ws_pay_test";
    process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "adapter-secret";

    const response = await dispatchToHandler(
      createPayRequestHandler({
        fetchImpl: async (url, init) => {
          calls.push({
            body: JSON.parse(init.body),
            headers: init.headers,
            method: init.method,
            url
          });

          return new Response(
            JSON.stringify({
              data: {
                message_id: "msg_pay_email_route_123",
                provider_route: "transactional_primary",
                status: "queued"
              },
              ok: true
            }),
            {
              status: 202
            }
          );
        }
      }),
      {
        body: JSON.stringify(createPaymentEmailInput()),
        headers: {
          "content-type": "application/json",
          "x-pay-email-adapter-key": "adapter-secret"
        },
        method: "POST",
        url: "/internal/payment-email/send"
      }
    );
    const payload = await response.json();

    assert.equal(response.status, 202);
    assert.equal(payload.ok, true);
    assert.equal(payload.data.message_id, "msg_pay_email_route_123");
    assert.equal(payload.data.mail_status, "queued");
    assert.equal(payload.data.source_domain, "tranhatam.com");
    assert.equal(payload.data.template_id, "payment_receipt");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.mail.iai.one/v1/send");
    assert.equal(calls[0].body.metadata.source_domain, "tranhatam.com");
    assert.equal(calls[0].headers["X-Workspace-Id"], "ws_pay_test");
  } finally {
    restoreEnv(env);
  }
});

test("pay persists a canonical payment evidence row when internal payment email handoff is accepted", async () => {
  const env = snapshotEnv([
    "MAIL_API_BASE_URL",
    "MAIL_API_KEY",
    "MAIL_API_WORKSPACE_ID",
    "PAY_EMAIL_ADAPTER_INTERNAL_KEY"
  ]);
  const evidenceDir = mkdtempSync(join(tmpdir(), "pay-evidence-"));
  const evidenceFilePath = join(evidenceDir, "tranhatam-payment-evidence.json");

  try {
    process.env.MAIL_API_BASE_URL = "https://api.mail.iai.one/v1";
    process.env.MAIL_API_KEY = "mail_test_key";
    process.env.MAIL_API_WORKSPACE_ID = "ws_pay_test";
    process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "adapter-secret";

    const handler = createPayRequestHandler({
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            data: {
              message_id: "msg_pay_email_canon_123",
              provider_route: "transactional_primary",
              status: "queued"
            },
            ok: true
          }),
          {
            status: 202
          }
        ),
      paymentEventEvidenceStoreFilePath: evidenceFilePath
    });

    const sendResponse = await dispatchToHandler(handler, {
      body: JSON.stringify(createPaymentEmailInput()),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "adapter-secret"
      },
      method: "POST",
      url: "/internal/payment-email/send"
    });
    const sendPayload = await sendResponse.json();

    assert.equal(sendResponse.status, 202);
    assert.equal(sendPayload.ok, true);
    assert.match(sendPayload.data.canonical_row_ref, /^canon_tranhatam_com_/u);
    assert.equal(sendPayload.data.message_id, "msg_pay_email_canon_123");

    const evidenceResponse = await dispatchToHandler(handler, {
      headers: {
        "x-pay-email-adapter-key": "adapter-secret"
      },
      url: "/internal/payment-event/evidence?domain=tranhatam.com&provider_reference=provider_ref_123"
    });
    const evidencePayload = await evidenceResponse.json();

    assert.equal(evidenceResponse.status, 200);
    assert.equal(evidencePayload.ok, true);
    assert.equal(evidencePayload.data.canonical_row_ref, sendPayload.data.canonical_row_ref);
    assert.equal(evidencePayload.data.domain, "tranhatam.com");
    assert.equal(evidencePayload.data.mail_message_id, "msg_pay_email_canon_123");
    assert.equal(evidencePayload.data.provider_reference, "provider_ref_123");
    assert.equal(evidencePayload.data.payment_session_id, "ps_123");
    assert.equal(evidencePayload.data.template_id, "payment_receipt");
    assert.equal(evidencePayload.data.callback_status, "pending");
    assert.equal(evidencePayload.data.audit_log.length, 1);
    assert.equal(evidencePayload.data.audit_log[0].event, "payment_email_accepted");

    const persistedState = JSON.parse(readFileSync(evidenceFilePath, "utf8"));
    assert.equal(persistedState.version, 1);
    assert.equal(persistedState.records.length, 1);
    assert.equal(persistedState.records[0].canonical_row_ref, sendPayload.data.canonical_row_ref);
    assert.equal(persistedState.records[0].mail_message_id, "msg_pay_email_canon_123");
  } finally {
    restoreEnv(env);
  }
});

test("pay updates callback and proof evidence on the same canonical payment row", async () => {
  const env = snapshotEnv([
    "MAIL_API_BASE_URL",
    "MAIL_API_KEY",
    "MAIL_API_WORKSPACE_ID",
    "PAY_EMAIL_ADAPTER_INTERNAL_KEY"
  ]);
  const evidenceDir = mkdtempSync(join(tmpdir(), "pay-evidence-"));
  const evidenceFilePath = join(evidenceDir, "tranhatam-payment-evidence.json");

  try {
    process.env.MAIL_API_BASE_URL = "https://api.mail.iai.one/v1";
    process.env.MAIL_API_KEY = "mail_test_key";
    process.env.MAIL_API_WORKSPACE_ID = "ws_pay_test";
    process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "adapter-secret";

    const handler = createPayRequestHandler({
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            data: {
              message_id: "msg_pay_email_canon_456",
              provider_route: "transactional_primary",
              status: "accepted"
            },
            ok: true
          }),
          {
            status: 202
          }
        ),
      paymentEventEvidenceStoreFilePath: evidenceFilePath
    });

    const sendResponse = await dispatchToHandler(handler, {
      body: JSON.stringify(createPaymentEmailInput()),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "adapter-secret"
      },
      method: "POST",
      url: "/internal/payment-email/send"
    });
    const sendPayload = await sendResponse.json();

    const callbackResponse = await dispatchToHandler(handler, {
      body: JSON.stringify({
        callback_status: "callback_confirmed",
        domain: "tranhatam.com",
        order_id: "order_123",
        payment_session_id: "ps_123",
        payment_status: "paid",
        provider_event_id: "evt_pay_123",
        provider_reference: "provider_ref_123",
        provider_status: "confirmed"
      }),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "adapter-secret"
      },
      method: "POST",
      url: "/internal/payment-event/callback"
    });
    const callbackPayload = await callbackResponse.json();

    assert.equal(callbackResponse.status, 202);
    assert.equal(callbackPayload.ok, true);
    assert.equal(callbackPayload.data.canonical_row_ref, sendPayload.data.canonical_row_ref);
    assert.equal(callbackPayload.data.callback_status, "callback_confirmed");
    assert.equal(callbackPayload.data.payment_status, "paid");
    assert.equal(callbackPayload.data.provider_event_id, "evt_pay_123");

    const proofResponse = await dispatchToHandler(handler, {
      body: JSON.stringify({
        canonical_row_ref: sendPayload.data.canonical_row_ref,
        db_evidence_ref: "sqlite://pay-evidence/tranhatam.com#row_01",
        domain: "tranhatam.com",
        inbox_proof_ref: "gmail://tranhatam@gmail.com/msg_123",
        internal_inbox_proof_ref: "dovecot://support@tranhatam.com/msg_123",
        log_evidence_ref: "postfix://queue/ABC123",
        mail_message_id: "msg_pay_email_canon_456",
        provider_reference: "provider_ref_123"
      }),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "adapter-secret"
      },
      method: "POST",
      url: "/internal/payment-event/proof"
    });
    const proofPayload = await proofResponse.json();

    assert.equal(proofResponse.status, 200);
    assert.equal(proofPayload.ok, true);
    assert.equal(proofPayload.data.db_evidence_ref, "sqlite://pay-evidence/tranhatam.com#row_01");
    assert.equal(proofPayload.data.log_evidence_ref, "postfix://queue/ABC123");
    assert.equal(proofPayload.data.inbox_proof_ref, "gmail://tranhatam@gmail.com/msg_123");
    assert.equal(
      proofPayload.data.internal_inbox_proof_ref,
      "dovecot://support@tranhatam.com/msg_123"
    );

    const evidenceResponse = await dispatchToHandler(handler, {
      headers: {
        "x-pay-email-adapter-key": "adapter-secret"
      },
      url: `/internal/payment-event/evidence?canonical_row_ref=${sendPayload.data.canonical_row_ref}`
    });
    const evidencePayload = await evidenceResponse.json();

    assert.equal(evidenceResponse.status, 200);
    assert.equal(evidencePayload.ok, true);
    assert.equal(evidencePayload.data.mail_message_id, "msg_pay_email_canon_456");
    assert.equal(evidencePayload.data.callback_status, "callback_confirmed");
    assert.equal(evidencePayload.data.provider_status, "confirmed");
    assert.equal(evidencePayload.data.audit_log.length, 3);
    assert.deepEqual(
      evidencePayload.data.audit_log.map((entry) => entry.event),
      [
        "payment_email_accepted",
        "payment_event_callback_received",
        "payment_event_proof_attached"
      ]
    );
  } finally {
    restoreEnv(env);
  }
});

test("pay keeps the internal payment email handoff route closed without its guard key", async () => {
  const env = snapshotEnv(["PAY_EMAIL_ADAPTER_INTERNAL_KEY"]);

  try {
    delete process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY;

    const response = await dispatchToHandler(createPayRequestHandler(), {
      body: JSON.stringify(createPaymentEmailInput()),
      headers: {
        "content-type": "application/json",
        "x-pay-email-adapter-key": "adapter-secret"
      },
      method: "POST",
      url: "/internal/payment-email/send"
    });
    const payload = await response.json();

    assert.equal(response.status, 503);
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "PAY_EMAIL_ADAPTER_INTERNAL_KEY_MISSING");
  } finally {
    restoreEnv(env);
  }
});

test("pay keeps payment email template registry honest for unknown domains", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-email-templates?domain=unknown.example"
  });
  const payload = await response.json();

  assert.equal(response.status, 404);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "PAYMENT_EMAIL_TEMPLATES_NOT_CONFIGURED");
});

test("pay exposes the machine-readable *.iai.one payment surface registry snapshot", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-surface-registry"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.scope, "*.iai.one");
  assert.equal(payload.data.surfaceCount, 15);
  assert.equal(payload.data.classificationCounts.paymentActiveOrCandidate, 7);
  assert.equal(payload.data.classificationCounts.billingSupportOnly, 2);
  assert.equal(payload.data.classificationCounts.nonPaymentSurface, 6);
  assert.equal(payload.data.templatePacks.length, 4);
  assert.ok(payload.data.requiredTemplateVariables.includes("{{receiver_profile_id}}"));
  assert.ok(payload.data.requiredDomainPacketFields.includes("receiver_profile_id"));
});

test("pay resolves per-surface machine-readable payment registry for flow.iai.one", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-surface-registry?domain=flow.iai.one"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.domain, "flow.iai.one");
  assert.equal(payload.data.paymentPack, "PACK_A");
  assert.equal(payload.data.paymentStatus, "CANDIDATE");
  assert.equal(payload.data.defaultLocale, "vi");
  assert.equal(payload.data.localeMode, "USER_LOCALE_FIRST_FALLBACK_VI");
  assert.equal(payload.data.senderPolicy.emailFromPay, "pay@flow.iai.one");
  assert.equal(payload.data.idPrefixes.paymentIntent, "pi_flw_");
  assert.equal(payload.data.receiverProfileRequired, true);
  assert.equal(payload.data.payoutProfileRequired, false);
  assert.ok(payload.data.requiredTemplateIds.includes("manual_payment_instruction"));
  assert.ok(payload.data.requiredLinks.includes("workspace_billing_url"));
});

test("pay keeps non-payment surfaces out of customer-facing payment email", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-surface-registry?domain=docs.iai.one"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.surfaceClass, "NON_PAYMENT_SURFACE");
  assert.equal(payload.data.paymentPack, "PACK_NONE");
  assert.equal(payload.data.customerFacingPaymentEmailAllowed, false);
  assert.equal(payload.data.senderPolicy, null);
});

test("pay keeps payment surface registry honest for unknown domains", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/api/payment-surface-registry?domain=unknown.iai.one"
  });
  const payload = await response.json();

  assert.equal(response.status, 404);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "PAYMENT_SURFACE_REGISTRY_NOT_CONFIGURED");
});

test("pay renders a payment block for officially assigned domains", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/payment-block?domain=tranhatam.com&country=VN&amount=150000&package_code=starter-g1&lang=vi"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /Khối nhận thanh toán/);
  assert.match(html, /tranhatam\.com/);
  assert.match(html, /recv_vnd_personal_tranhatam_acb/);
  assert.match(html, /pay@tranhatam\.com/);
  assert.match(html, /billing@tranhatam\.com/);
  assert.match(html, /support@tranhatam\.com/);
  assert.match(html, /img\.vietqr\.io\/image\/ACB-27588277-compact2\.png/);
});

test("pay renders blocked payment block state for unassigned domains", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/payment-block?domain=omdala.com&country=VN&amount=90000"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Domain is prepared but receiver assignment is deferred/);
  assert.match(html, /DEFERRED_UNTIL_FOUNDER_INSTRUCTION/);
  assert.match(html, /omdala\.com/);
});

test("pay landing page keeps EN-first metadata and phase messaging", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Payment and settlement layer/);
  assert.match(html, /Phase D opens only as prep with evidence-first checkpoints/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow" \/>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/pay\.iai\.one\/" \/>/);
  assert.match(html, /hreflang="vi"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, new RegExp(`/checkout/${homeRefs.demoCheckoutSessionId}`));
  assert.match(html, /\/ops\/reconciliation/);
  assert.doesNotMatch(html, /https:\/\/web\.iai\.one/);
});

test("pay can explicitly re-enable the web surface when Team 1 flips deploy truth", async () => {
  const response = await dispatchToHandler(
    createPayRequestHandler({
      webSurfaceEnabled: true
    }),
    {
      url: "/"
    }
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /https:\/\/web\.iai\.one/);
});

test("pay supports explicit vietnamese rendering", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/?lang=vi"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /Lớp thanh toán và quyết toán/);
  assert.match(html, /Phase D chỉ mở ở chế độ chuẩn bị với các mốc kiểm ưu tiên bằng chứng/);
  assert.match(html, /Bề mặt thanh toán/);
});

test("pay falls back to english for invalid locale input", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/?lang=jp"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /<html lang="en">/);
});

test("pay checkout shell exposes hosted checkout structure without false success claims", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: `/checkout/${homeRefs.demoCheckoutSessionId}`
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(html, new RegExp(`Checkout session ${homeRefs.demoCheckoutSessionId}`));
  assert.match(html, /State: active shell/);
  assert.match(html, /One session, one truth/);
  assert.match(html, new RegExp(`order_reference: ${demoSession.orderReference}`));
  assert.match(html, new RegExp(`provider_label: ${demoSession.providerLabel}`));
  assert.match(html, /Do not claim success from a provider return or query string alone\./);
  assert.match(html, new RegExp(`/checkout/${homeRefs.demoCheckoutSessionId}/status`));
});

test("pay checkout status shell supports explicit vietnamese awaiting-confirmation guidance", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: `/checkout/${homeRefs.demoCheckoutSessionId}/status?lang=vi`
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, new RegExp(`Trạng thái thanh toán ${homeRefs.demoCheckoutSessionId}`));
  assert.match(html, /Trạng thái: chờ xác nhận/);
  assert.match(html, /Đây là trạng thái quan trọng nhất của trải nghiệm/);
  assert.match(html, /Tín hiệu gần nhất:/);
  assert.match(html, new RegExp(escapeRegex(demoSession.supportChannel)));
  assert.match(html, /Người thanh toán có thể làm gì lúc này/);
});

test("pay expired shell keeps late-signal and reconciliation boundaries explicit", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: `/checkout/${homeRefs.demoCheckoutSessionId}/expired`
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, new RegExp(`Expired shell ${homeRefs.demoCheckoutSessionId}`));
  assert.match(html, /State: expired/);
  assert.match(html, new RegExp(`payment_reference: ${demoSession.paymentReference}`));
  assert.match(html, /Expired does not mean the system is allowed to forget about a late payment\./);
  assert.match(html, /Late-signal handling/);
});

test("pay receipt shell keeps confirmation and next-step structure explicit", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: `/receipt/${homeRefs.demoReceiptId}`
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, new RegExp(`Receipt shell ${homeRefs.demoReceiptId}`));
  assert.match(html, /State: confirmed receipt shell/);
  assert.match(html, new RegExp(`payment_reference: ${demoReceipt.paymentReference}`));
  assert.match(html, new RegExp(`session_id: ${demoReceipt.sessionId}`));
  assert.match(html, /The receipt opens only after internal confirmation completes\./);
  assert.match(html, /Confirmed receipt snapshot/);
});

test("pay help shell explains delayed-transfer and wrong-reference support paths", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: `/payment/${homeRefs.demoCheckoutSessionId}/help`
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, new RegExp(`Payment help ${homeRefs.demoCheckoutSessionId}`));
  assert.match(html, new RegExp(`support_channel: ${demoSession.supportChannel}`));
  assert.match(html, new RegExp(`payment_reference: ${demoSession.paymentReference}`));
  assert.match(html, /A failed provider return does not mean the payment failed/);
  assert.match(html, /Wrong amount or wrong reference/);
});

test("pay renders checkout and receipt state variants beyond the happy path", async () => {
  const routes = [
    {
      url: `/checkout/${homeRefs.demoConfirmedCheckoutSessionId}/status`,
      status: /State: confirmed/,
      title: /Confirmed session/
    },
    {
      url: `/checkout/${homeRefs.demoFailedCheckoutSessionId}/status`,
      status: /State: failed/,
      title: /Failed session/
    },
    {
      url: `/checkout/${homeRefs.demoCancelledCheckoutSessionId}/status`,
      status: /State: cancelled/,
      title: /Cancelled session/
    },
    {
      url: `/checkout/${homeRefs.demoMissingCheckoutSessionId}`,
      status: /State: session not found/,
      title: /Session not found/
    },
    {
      url: `/receipt/${homeRefs.demoMissingReceiptId}`,
      status: /State: receipt not found/,
      title: /Receipt not found/
    }
  ];

  for (const route of routes) {
    const response = await dispatchToHandler(createPayRequestHandler(), {
      url: route.url
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, route.status);
    assert.match(html, route.title);
  }
});

test("pay ops shells expose payments, payouts, and reconciliation cockpit structure", async () => {
  const paymentsSnapshot = readModel.getOpsSnapshot("payments");
  const payoutsSnapshot = readModel.getOpsSnapshot("payouts");
  const reconciliationSnapshot = readModel.getOpsSnapshot("reconciliation");
  const routes = [
    {
      url: "/ops/payments",
      heading: /Payments monitor/,
      detail: new RegExp(`payments_today: ${paymentsSnapshot.metrics[0].value}`),
      workItem: new RegExp(paymentsSnapshot.workItems[0].summary)
    },
    {
      url: "/ops/payouts",
      heading: /Payout queue/,
      detail: new RegExp(`approval_holds: ${payoutsSnapshot.metrics[1].value}`),
      workItem: new RegExp(payoutsSnapshot.workItems[0].summary)
    },
    {
      url: "/ops/reconciliation",
      heading: /Reconciliation queue/,
      detail: new RegExp(`late_payments: ${reconciliationSnapshot.metrics[0].value}`),
      workItem: new RegExp(reconciliationSnapshot.workItems[0].summary)
    }
  ];

  for (const route of routes) {
    const response = await dispatchToHandler(createPayRequestHandler(), {
      url: route.url
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-language"), "en");
    assert.match(html, route.heading);
    assert.match(html, route.detail);
    assert.match(html, route.workItem);
  }
});

test("pay ops detail routes expose per-item detail shells for queue items", async () => {
  const paymentItem = readModel.getOpsSnapshot("payments").workItems[0];
  const reviewItem = readModel.getOpsSnapshot("review").workItems[0];

  const paymentResponse = await dispatchToHandler(createPayRequestHandler(), {
    url: `/ops/payments/${encodeURIComponent(paymentItem.id)}`
  });
  const paymentHtml = await paymentResponse.text();

  assert.equal(paymentResponse.status, 200);
  assert.match(paymentHtml, /Payments detail/);
  assert.match(paymentHtml, new RegExp(`item_id: ${escapeRegex(paymentItem.id)}`));
  assert.match(paymentHtml, new RegExp(`owner: ${escapeRegex(paymentItem.owner)}`));

  const reviewResponse = await dispatchToHandler(createPayRequestHandler(), {
    url: `/ops/review/${encodeURIComponent(reviewItem.id)}`
  });
  const reviewHtml = await reviewResponse.text();

  assert.equal(reviewResponse.status, 200);
  assert.match(reviewHtml, /Review detail/);
  assert.match(reviewHtml, new RegExp(`severity: ${reviewItem.severity}`));
});

test("pay supports injected custom read model with demo fallback", async () => {
  const customSessionId = "ps_custom_injected_001";
  const customReceiptId = "rcpt_custom_injected_001";
  const baseSession = readModel.getPaymentSession(homeRefs.demoCheckoutSessionId);
  const baseReceipt = readModel.getReceipt(homeRefs.demoReceiptId);
  const customSession = {
    ...baseSession,
    orderReference: "ORD-CUSTOM-001",
    paymentReference: "PAY-CUSTOM-001",
    providerLabel: "Custom bank rail",
    receiptId: customReceiptId,
    sessionId: customSessionId,
    state: "confirmed",
    supportChannel: "custom-ops@iai.one"
  };
  const customReceipt = {
    ...baseReceipt,
    orderReference: customSession.orderReference,
    paymentReference: customSession.paymentReference,
    receiptId: customReceiptId,
    sessionId: customSessionId
  };
  const customReadModel = createResolvedPayReadModel({
    fallback: createDemoPayReadModelSource(),
    primary: {
      getHomeRouteRefs() {
        return null;
      },
      getOpsSnapshot() {
        return null;
      },
      findOpsWorkItem() {
        return null;
      },
      getPaymentSession(sessionId) {
        return sessionId === customSessionId ? customSession : null;
      },
      getReceipt(receiptId) {
        return receiptId === customReceiptId ? customReceipt : null;
      },
      mode: "custom"
    }
  });
  const handler = createPayRequestHandler({ readModel: customReadModel });

  const healthResponse = await dispatchToHandler(handler, { url: "/health" });
  const healthPayload = await healthResponse.json();
  assert.deepEqual(healthPayload.data.read_model, {
    fallback_mode: "demo_contract",
    mode: "fallback_enabled",
    primary_mode: "custom",
    selection_mode: "custom_injected"
  });
  // Q1 SIGNED 2026-04-26: /health emits a contract-shaped stub for the
  // shared runtime fields when no real runtime is bound, so the Team 2
  // probe (scripts/team2-pay-shared-runtime-probe.mjs) can verify contract
  // compliance. The stub is marked _health_contract_stub: true.
  assert.equal(healthPayload.data.shared_read_model._health_contract_stub, true);
  assert.equal(healthPayload.data.shared_read_model.rolloutReadyForSharedOnly, true);
  assert.equal(healthPayload.data.shared_read_model.configured, false);
  assert.equal(healthPayload.data.shared_upstream_runtime._health_contract_stub, true);
  assert.equal(healthPayload.data.shared_upstream_runtime.activeReadMode, "shared_contract");
  assert.equal(healthPayload.data.shared_upstream_runtime.releaseGate.ready, true);

  const customResponse = await dispatchToHandler(handler, {
    url: `/checkout/${customSessionId}`
  });
  const customHtml = await customResponse.text();

  assert.equal(customResponse.status, 200);
  assert.match(customHtml, /State: confirmed/);
  assert.match(customHtml, /ORD-CUSTOM-001/);
  assert.match(customHtml, /PAY-CUSTOM-001/);

  const fallbackResponse = await dispatchToHandler(handler, {
    url: `/checkout/${homeRefs.demoCheckoutSessionId}`
  });
  const fallbackHtml = await fallbackResponse.text();

  assert.equal(fallbackResponse.status, 200);
  assert.match(fallbackHtml, new RegExp(`order_reference: ${demoSession.orderReference}`));
  assert.match(fallbackHtml, new RegExp(`provider_label: ${escapeRegex(demoSession.providerLabel)}`));
});

test("pay supports shared binding wiring with explicit selection mode", async () => {
  const sharedSessionId = "ps_shared_bound_001";
  const sharedReceiptId = "rcpt_shared_bound_001";
  const handler = createPayRequestHandler({
    readModelMode: "shared_fallback_demo",
    sharedReadModelBindings: {
      getPaymentSession(sessionId) {
        if (sessionId !== sharedSessionId) {
          return null;
        }

        return {
          ...demoSession,
          orderReference: "ORD-SHARED-001",
          paymentReference: "PAY-SHARED-001",
          providerFlow: "shared callback -> reconciliation -> receipt",
          providerLabel: "Shared provider rail",
          receiptId: sharedReceiptId,
          sessionId: sharedSessionId,
          state: "confirmed",
          supportChannel: "shared-ops@iai.one"
        };
      },
      getReceipt(receiptId) {
        if (receiptId !== sharedReceiptId) {
          return null;
        }

        return {
          ...demoReceipt,
          orderReference: "ORD-SHARED-001",
          paymentReference: "PAY-SHARED-001",
          receiptId: sharedReceiptId,
          sessionId: sharedSessionId,
          state: "confirmed"
        };
      }
    }
  });

  const healthResponse = await dispatchToHandler(handler, { url: "/health" });
  const healthPayload = await healthResponse.json();
  assert.deepEqual(healthPayload.data.read_model, {
    fallback_mode: "demo_contract",
    mode: "fallback_enabled",
    primary_mode: "shared_contract",
    selection_mode: "shared_fallback_demo"
  });
  assert.deepEqual(healthPayload.data.shared_read_model, {
    capabilities: {
      homeRouteRefs: false,
      opsDetail: false,
      opsSnapshot: false,
      paymentSession: true,
      receipt: true
    },
    configured: true,
    counts: {
      opsAreas: null,
      opsWorkItems: null,
      paymentSessions: null,
      receipts: null
    },
    filePath: null,
    rolloutReadyForSharedOnly: false,
    source: "inline_bindings"
  });

  const sessionResponse = await dispatchToHandler(handler, {
    url: `/checkout/${sharedSessionId}`
  });
  const sessionHtml = await sessionResponse.text();

  assert.equal(sessionResponse.status, 200);
  assert.match(sessionHtml, /State: confirmed/);
  assert.match(sessionHtml, /ORD-SHARED-001/);
  assert.match(sessionHtml, /PAY-SHARED-001/);

  const fallbackResponse = await dispatchToHandler(handler, {
    url: `/checkout/${homeRefs.demoCheckoutSessionId}`
  });
  const fallbackHtml = await fallbackResponse.text();

  assert.equal(fallbackResponse.status, 200);
  assert.match(fallbackHtml, new RegExp(`order_reference: ${demoSession.orderReference}`));
});

test("pay supports file-backed shared read model rollout and permission-aware ops detail filtering", async () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "iai-pay-shared-"));
  const fixturePath = join(fixtureDir, "shared-read-model.json");
  const fileSessionId = "ps_file_shared_001";
  const fileReceiptId = "rcpt_file_shared_001";
  const fileWorkItemId = "recon:file_shared_001";

  writeFileSync(
    fixturePath,
    JSON.stringify(
      {
        schema_version: "iai.pay.shared-read-model.v1",
        home_route_refs: {
          ...homeRefs,
          demoCheckoutSessionId: fileSessionId,
          demoReceiptId: fileReceiptId
        },
        payment_sessions: {
          [fileSessionId]: {
            amount_due_value: 2500000,
            callback_status: "callback_confirmed",
            confirmed_receipt_id: fileReceiptId,
            created_at: "2026-04-21T11:00:00+07:00",
            currency_code: "VND",
            expires_at: "2026-04-21T11:30:00+07:00",
            last_signal: "provider_callback_confirmed",
            last_signal_at: "2026-04-21T11:03:00+07:00",
            late_signal_window_ends_at: "2026-04-21T12:15:00+07:00",
            order_reference: "ORD-FILE-001",
            origin_site: "app.iai.one",
            payer_label: "Nguyen Thi Shared",
            payment_reference: "PAY-FILE-001",
            provider_flow: "callback confirmed -> reconciliation clear",
            provider_label: "Shared file provider",
            reconciliation_status: "reconciled",
            session_id: fileSessionId,
            session_state: "confirmed",
            support_channel: "shared-file@iai.one",
            support_evidence: ["callback receipt", "ledger match", "site confirmation"]
          }
        },
        receipts: {
          [fileReceiptId]: {
            amount_value: 2500000,
            confirmed_at: "2026-04-21T11:04:00+07:00",
            currency_code: "VND",
            origin_site: "app.iai.one",
            order_reference: "ORD-FILE-001",
            payer_label: "Nguyen Thi Shared",
            payment_method: "Shared file provider",
            payment_reference: "PAY-FILE-001",
            receipt_id: fileReceiptId,
            receipt_state: "confirmed",
            return_site_label: "app.iai.one workspace",
            session_id: fileSessionId
          }
        },
        ops: {
          reconciliation: {
            metrics: [{ label: "late_payments", value: "0" }],
            work_items: [
              {
                id: fileWorkItemId,
                next_action: "confirm callback outbox delivery",
                owner: "finance_admin",
                safe_detail_items: ["callback_status: confirmed", "site_scope: app.iai.one"],
                severity: "medium",
                sensitive_detail_items: [
                  "internal_reconciliation_evidence: matched ledger entry",
                  "raw_callback_payload: hidden from support"
                ],
                summary: "Shared file reconciliation item"
              }
            ]
          }
        }
      },
      null,
      2
    )
  );

  const handler = createPayRequestHandler({
    readModelMode: "shared_fallback_demo",
    sharedReadModelFilePath: fixturePath
  });

  const healthResponse = await dispatchToHandler(handler, { url: "/health" });
  const healthPayload = await healthResponse.json();
  assert.deepEqual(healthPayload.data.read_model, {
    fallback_mode: "demo_contract",
    mode: "fallback_enabled",
    primary_mode: "shared_contract",
    selection_mode: "shared_fallback_demo"
  });
  assert.deepEqual(healthPayload.data.shared_read_model, {
    capabilities: {
      homeRouteRefs: true,
      opsDetail: true,
      opsSnapshot: true,
      paymentSession: true,
      receipt: true
    },
    configured: true,
    counts: {
      opsAreas: 1,
      opsWorkItems: 1,
      paymentSessions: 1,
      receipts: 1
    },
    filePath: fixturePath,
    rolloutReadyForSharedOnly: true,
    source: "env_file"
  });

  const sessionResponse = await dispatchToHandler(handler, {
    url: `/checkout/${fileSessionId}`
  });
  const sessionHtml = await sessionResponse.text();

  assert.equal(sessionResponse.status, 200);
  assert.match(sessionHtml, /ORD-FILE-001/);
  assert.match(sessionHtml, /PAY-FILE-001/);

  const financeResponse = await dispatchToHandler(handler, {
    headers: {
      "x-iai-session-claims": buildSessionClaims({
        roles: ["finance_admin"],
        subjectId: "sub_file_finance",
        workspaceId: "ws_pay_main"
      })
    },
    url: `/ops/reconciliation/${encodeURIComponent(fileWorkItemId)}`
  });
  const financeHtml = await financeResponse.text();

  assert.equal(financeResponse.status, 200);
  assert.match(financeHtml, /matched ledger entry/);
  assert.match(financeHtml, /raw_callback_payload: hidden from support/);

  const supportResponse = await dispatchToHandler(handler, {
    headers: {
      "x-iai-session-claims": buildSessionClaims({
        roles: ["support_admin"],
        subjectId: "sub_file_support",
        workspaceId: "ws_pay_main"
      })
    },
    url: `/ops/reconciliation/${encodeURIComponent(fileWorkItemId)}`
  });
  const supportHtml = await supportResponse.text();

  assert.equal(supportResponse.status, 200);
  assert.match(supportHtml, /callback_status: confirmed/);
  assert.match(supportHtml, /restricted detail hidden for current role/);
  assert.doesNotMatch(supportHtml, /matched ledger entry/);
});

test("pay supports lane-produced shared read model and shared-session role filtering", async () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "iai-pay-lanes-"));
  const authPath = join(fixtureDir, "auth-lane.json");
  const sessionPath = join(fixtureDir, "session-lane.json");
  const reconciliationPath = join(fixtureDir, "reconciliation-lane.json");
  const laneSessionId = "ps_lane_shared_001";
  const laneReceiptId = "rcpt_lane_shared_001";
  const laneWorkItemId = "recon:lane_shared_001";

  writeFileSync(
    authPath,
    JSON.stringify(
      {
        schema_version: "iai.auth.shared-session.v1",
        subjects: {
          sub_lane_finance: {
            workspaces: {
              ws_pay_main: {
                roles: ["finance_admin"]
              }
            }
          },
          sub_lane_support: {
            workspaces: {
              ws_pay_main: {
                roles: ["support_admin"]
              }
            }
          }
        }
      },
      null,
      2
    )
  );

  writeFileSync(
    sessionPath,
    JSON.stringify(
      {
        schema_version: "iai.pay.session-lane.v1",
        home_route_refs: {
          ...homeRefs,
          demoCheckoutSessionId: laneSessionId,
          demoReceiptId: laneReceiptId
        },
        payment_sessions: {
          [laneSessionId]: {
            amount_due_value: 3750000,
            callback_status: "callback_confirmed",
            confirmed_receipt_id: laneReceiptId,
            created_at: "2026-04-21T13:00:00+07:00",
            currency_code: "VND",
            expires_at: "2026-04-21T13:30:00+07:00",
            last_signal: "provider_callback_confirmed",
            last_signal_at: "2026-04-21T13:04:00+07:00",
            late_signal_window_ends_at: "2026-04-21T14:15:00+07:00",
            order_reference: "ORD-LANE-001",
            origin_site: "app.iai.one",
            payer_label: "Lane Auth Shared",
            payment_reference: "PAY-LANE-001",
            provider_flow: "callback confirmed -> reconciliation clear",
            provider_label: "Lane producer provider",
            reconciliation_status: "reconciled",
            session_id: laneSessionId,
            session_state: "confirmed",
            support_channel: "lane-shared@iai.one",
            support_evidence: ["callback receipt", "ledger match", "site confirmation"]
          }
        },
        receipts: {
          [laneReceiptId]: {
            amount_value: 3750000,
            confirmed_at: "2026-04-21T13:05:00+07:00",
            currency_code: "VND",
            origin_site: "app.iai.one",
            order_reference: "ORD-LANE-001",
            payer_label: "Lane Auth Shared",
            payment_method: "Lane producer provider",
            payment_reference: "PAY-LANE-001",
            receipt_id: laneReceiptId,
            receipt_state: "confirmed",
            return_site_label: "app.iai.one workspace",
            session_id: laneSessionId
          }
        }
      },
      null,
      2
    )
  );

  writeFileSync(
    reconciliationPath,
    JSON.stringify(
      {
        schema_version: "iai.pay.reconciliation-lane.v1",
        ops: {
          reconciliation: {
            metrics: [{ label: "late_payments", value: "0" }],
            work_items: [
              {
                id: laneWorkItemId,
                next_action: "confirm callback outbox delivery",
                owner: "finance_admin",
                safe_detail_items: ["callback_status: confirmed", "site_scope: app.iai.one"],
                severity: "medium",
                sensitive_detail_items: [
                  "internal_reconciliation_evidence: matched ledger entry",
                  "raw_callback_payload: hidden from support"
                ],
                summary: "Shared file reconciliation item"
              }
            ]
          }
        }
      },
      null,
      2
    )
  );

  const handler = createPayRequestHandler({
    readModelMode: "shared_fallback_demo",
    sharedAuthSourceFilePath: authPath,
    sharedReconciliationSourceFilePath: reconciliationPath,
    sharedSessionSourceFilePath: sessionPath
  });

  const healthResponse = await dispatchToHandler(handler, { url: "/health" });
  const healthPayload = await healthResponse.json();

  assert.equal(healthPayload.data.shared_read_model.source, "lane_sources");
  assert.equal(healthPayload.data.shared_read_model.rolloutReadyForSharedOnly, true);
  assert.equal(healthPayload.data.shared_read_model.counts.paymentSessions, 1);
  assert.equal(healthPayload.data.shared_read_model.counts.receipts, 1);
  assert.equal(healthPayload.data.shared_read_model.counts.opsWorkItems, 1);
  assert.match(healthPayload.data.shared_read_model.filePath, /session-lane\.json/);
  assert.match(healthPayload.data.shared_read_model.filePath, /reconciliation-lane\.json/);

  const sessionResponse = await dispatchToHandler(handler, {
    url: `/checkout/${laneSessionId}`
  });
  const sessionHtml = await sessionResponse.text();

  assert.equal(sessionResponse.status, 200);
  assert.match(sessionHtml, /ORD-LANE-001/);
  assert.match(sessionHtml, /PAY-LANE-001/);

  const financeResponse = await dispatchToHandler(handler, {
    headers: {
      "x-iai-session": "sess_lane_finance_001",
      "x-subject-id": "sub_lane_finance",
      "x-workspace-id": "ws_pay_main"
    },
    url: `/ops/reconciliation/${encodeURIComponent(laneWorkItemId)}`
  });
  const financeHtml = await financeResponse.text();

  assert.equal(financeResponse.status, 200);
  assert.match(financeHtml, /matched ledger entry/);

  const supportResponse = await dispatchToHandler(handler, {
    headers: {
      cookie: "iai_session=sess_lane_support_001; iai_subject_id=sub_lane_support; iai_workspace=ws_pay_main"
    },
    url: `/ops/reconciliation/${encodeURIComponent(laneWorkItemId)}`
  });
  const supportHtml = await supportResponse.text();

  assert.equal(supportResponse.status, 200);
  assert.match(supportHtml, /callback_status: confirmed/);
  assert.match(supportHtml, /restricted detail hidden for current role/);
  assert.doesNotMatch(supportHtml, /matched ledger entry/);
});

test("pay supports upstream lane runtime with auth middleware claims and shared session fallback", async () => {
  const emittedAt = new Date().toISOString();
  const laneSessionId = "ps_upstream_shared_001";
  const laneReceiptId = "rcpt_upstream_shared_001";
  const laneWorkItemId = "recon:upstream_shared_001";
  const authUrl = "https://shared.iai.one/auth";
  const sessionUrl = "https://shared.iai.one/pay/session";
  const reconciliationUrl = "https://shared.iai.one/pay/reconciliation";
  const fetchImpl = createJsonFetchMock({
    [authUrl]: {
      emitted_at: emittedAt,
      schema_version: "iai.auth.shared-session.v1",
      subjects: {
        sub_upstream_support: {
          workspaces: {
            ws_pay_main: {
              roles: ["support_admin"]
            }
          }
        }
      }
    },
    [reconciliationUrl]: {
      emitted_at: emittedAt,
      schema_version: "iai.pay.reconciliation-lane.v1",
      ops: {
        reconciliation: {
          metrics: [{ label: "late_payments", value: "0" }],
          work_items: [
            {
              id: laneWorkItemId,
              next_action: "confirm callback outbox delivery",
              owner: "finance_admin",
              safe_detail_items: ["callback_status: confirmed", "site_scope: app.iai.one"],
              severity: "medium",
              sensitive_detail_items: [
                "internal_reconciliation_evidence: matched ledger entry",
                "raw_callback_payload: hidden from support"
              ],
              summary: "Upstream reconciliation item"
            }
          ]
        }
      }
    },
    [sessionUrl]: {
      emitted_at: emittedAt,
      schema_version: "iai.pay.session-lane.v1",
      home_route_refs: {
        ...homeRefs,
        demoCheckoutSessionId: laneSessionId,
        demoReceiptId: laneReceiptId
      },
      payment_sessions: {
        [laneSessionId]: {
          amount_due_value: 4150000,
          callback_status: "callback_confirmed",
          confirmed_receipt_id: laneReceiptId,
          created_at: emittedAt,
          currency_code: "VND",
          expires_at: emittedAt,
          last_signal: "provider_callback_confirmed",
          last_signal_at: emittedAt,
          late_signal_window_ends_at: emittedAt,
          order_reference: "ORD-UPSTREAM-001",
          origin_site: "app.iai.one",
          payer_label: "Upstream Runtime Shared",
          payment_reference: "PAY-UPSTREAM-001",
          provider_flow: "callback confirmed -> reconciliation clear",
          provider_label: "Upstream producer provider",
          reconciliation_status: "reconciled",
          session_id: laneSessionId,
          session_state: "confirmed",
          support_channel: "upstream-shared@iai.one",
          support_evidence: ["callback receipt", "ledger match", "site confirmation"]
        }
      },
      receipts: {
        [laneReceiptId]: {
          amount_value: 4150000,
          confirmed_at: emittedAt,
          currency_code: "VND",
          origin_site: "app.iai.one",
          order_reference: "ORD-UPSTREAM-001",
          payer_label: "Upstream Runtime Shared",
          payment_method: "Upstream producer provider",
          payment_reference: "PAY-UPSTREAM-001",
          receipt_id: laneReceiptId,
          receipt_state: "confirmed",
          return_site_label: "app.iai.one workspace",
          session_id: laneSessionId
        }
      }
    }
  });

  const handler = createPayRequestHandler({
    fetchImpl,
    readModelMode: "shared_fallback_demo",
    sharedAuthSourceUrl: authUrl,
    sharedMaxDataAgeMs: 60_000,
    sharedReconciliationSourceUrl: reconciliationUrl,
    sharedSessionSourceUrl: sessionUrl
  });

  const healthResponse = await dispatchToHandler(handler, { url: "/health" });
  const healthPayload = await healthResponse.json();

  assert.equal(healthPayload.data.shared_read_model.source, "upstream_runtime");
  assert.equal(healthPayload.data.shared_read_model.rolloutReadyForSharedOnly, true);
  assert.equal(healthPayload.data.shared_upstream_runtime.mode, "lane_urls");
  assert.equal(healthPayload.data.shared_upstream_runtime.activeReadMode, "shared_contract");
  assert.equal(healthPayload.data.shared_upstream_runtime.releaseGate.ready, true);
  assert.equal(healthPayload.data.shared_upstream_runtime.sources.auth.stale, false);
  assert.equal(healthPayload.data.shared_upstream_runtime.sources.session.stale, false);
  assert.equal(healthPayload.data.shared_upstream_runtime.sources.reconciliation.stale, false);

  const sessionResponse = await dispatchToHandler(handler, {
    url: `/checkout/${laneSessionId}`
  });
  const sessionHtml = await sessionResponse.text();

  assert.equal(sessionResponse.status, 200);
  assert.match(sessionHtml, /ORD-UPSTREAM-001/);
  assert.match(sessionHtml, /PAY-UPSTREAM-001/);

  const financeResponse = await dispatchToHandler(handler, {
    headers: {
      "x-iai-auth-claims": JSON.stringify({
        roles: ["finance_admin"],
        session_id: "sess_upstream_finance_001",
        subject_id: "sub_upstream_finance",
        workspace_id: "ws_pay_main"
      })
    },
    url: `/ops/reconciliation/${encodeURIComponent(laneWorkItemId)}`
  });
  const financeHtml = await financeResponse.text();

  assert.equal(financeResponse.status, 200);
  assert.match(financeHtml, /matched ledger entry/);

  const supportResponse = await dispatchToHandler(handler, {
    headers: {
      "x-iai-shared-session": JSON.stringify({
        session_id: "sess_upstream_support_001",
        subject_id: "sub_upstream_support",
        workspace_id: "ws_pay_main"
      })
    },
    url: `/ops/reconciliation/${encodeURIComponent(laneWorkItemId)}`
  });
  const supportHtml = await supportResponse.text();

  assert.equal(supportResponse.status, 200);
  assert.match(supportHtml, /callback_status: confirmed/);
  assert.match(supportHtml, /restricted detail hidden for current role/);
  assert.doesNotMatch(supportHtml, /matched ledger entry/);
});

test("pay blocks shared_only requests when upstream shared runtime data is stale", async () => {
  const staleTimestamp = new Date(Date.now() - 10 * 60_000).toISOString();
  const laneSessionId = "ps_upstream_stale_001";
  const laneReceiptId = "rcpt_upstream_stale_001";
  const authUrl = "https://shared.iai.one/auth-stale";
  const sessionUrl = "https://shared.iai.one/pay/session-stale";
  const reconciliationUrl = "https://shared.iai.one/pay/reconciliation-stale";
  const fetchImpl = createJsonFetchMock({
    [authUrl]: {
      emitted_at: staleTimestamp,
      schema_version: "iai.auth.shared-session.v1",
      subjects: {}
    },
    [reconciliationUrl]: {
      emitted_at: staleTimestamp,
      schema_version: "iai.pay.reconciliation-lane.v1",
      ops: {
        reconciliation: {
          metrics: [{ label: "late_payments", value: "0" }],
          work_items: [
            {
              id: "recon:stale_001",
              next_action: "hold rollout",
              owner: "finance_admin",
              safe_detail_items: ["callback_status: pending"],
              severity: "medium",
              sensitive_detail_items: ["internal_reconciliation_evidence: stale"],
              summary: "Stale upstream reconciliation item"
            }
          ]
        }
      }
    },
    [sessionUrl]: {
      emitted_at: staleTimestamp,
      schema_version: "iai.pay.session-lane.v1",
      home_route_refs: {
        ...homeRefs,
        demoCheckoutSessionId: laneSessionId,
        demoReceiptId: laneReceiptId
      },
      payment_sessions: {
        [laneSessionId]: {
          amount_due_value: 1950000,
          callback_status: "callback_confirmed",
          confirmed_receipt_id: laneReceiptId,
          created_at: staleTimestamp,
          currency_code: "VND",
          expires_at: staleTimestamp,
          last_signal: "provider_callback_confirmed",
          last_signal_at: staleTimestamp,
          late_signal_window_ends_at: staleTimestamp,
          order_reference: "ORD-UPSTREAM-STALE-001",
          origin_site: "app.iai.one",
          payer_label: "Stale Upstream Shared",
          payment_reference: "PAY-UPSTREAM-STALE-001",
          provider_flow: "callback confirmed -> reconciliation clear",
          provider_label: "Upstream stale producer",
          reconciliation_status: "reconciled",
          session_id: laneSessionId,
          session_state: "confirmed",
          support_channel: "stale-shared@iai.one",
          support_evidence: ["callback receipt", "ledger match"]
        }
      },
      receipts: {
        [laneReceiptId]: {
          amount_value: 1950000,
          confirmed_at: staleTimestamp,
          currency_code: "VND",
          origin_site: "app.iai.one",
          order_reference: "ORD-UPSTREAM-STALE-001",
          payer_label: "Stale Upstream Shared",
          payment_method: "Upstream stale producer",
          payment_reference: "PAY-UPSTREAM-STALE-001",
          receipt_id: laneReceiptId,
          receipt_state: "confirmed",
          return_site_label: "app.iai.one workspace",
          session_id: laneSessionId
        }
      }
    }
  });

  const handler = createPayRequestHandler({
    fetchImpl,
    readModelMode: "shared_only",
    sharedAuthSourceUrl: authUrl,
    sharedMaxDataAgeMs: 60_000,
    sharedReconciliationSourceUrl: reconciliationUrl,
    sharedSessionSourceUrl: sessionUrl
  });

  const healthResponse = await dispatchToHandler(handler, { url: "/health" });
  const healthPayload = await healthResponse.json();

  assert.equal(healthPayload.data.shared_read_model.source, "upstream_runtime");
  assert.equal(healthPayload.data.shared_read_model.rolloutReadyForSharedOnly, true);
  assert.equal(healthPayload.data.shared_upstream_runtime.releaseGate.ready, false);
  assert.match(
    healthPayload.data.shared_upstream_runtime.releaseGate.reasons.join(","),
    /session_source_stale/
  );

  const blockedResponse = await dispatchToHandler(handler, {
    url: `/checkout/${laneSessionId}`
  });
  const blockedPayload = await blockedResponse.json();

  assert.equal(blockedResponse.status, 503);
  assert.equal(blockedPayload.error.code, "PAY_SHARED_ONLY_GATE_BLOCKED");
  assert.match(blockedPayload.error.message, /shared_only mode remains blocked/);
});

test("pay blocks shared_only mode when lane-produced shared data is incomplete", () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "iai-pay-shared-only-"));
  const sessionPath = join(fixtureDir, "session-lane-incomplete.json");

  writeFileSync(
    sessionPath,
    JSON.stringify(
      {
        schema_version: "iai.pay.session-lane.v1",
        home_route_refs: {
          ...homeRefs,
          demoCheckoutSessionId: "ps_incomplete_001",
          demoReceiptId: "rcpt_incomplete_001"
        },
        payment_sessions: {
          ps_incomplete_001: {
            amount_due_value: 1250000,
            callback_status: "callback_pending",
            confirmed_receipt_id: "rcpt_incomplete_001",
            created_at: "2026-04-21T15:00:00+07:00",
            currency_code: "VND",
            expires_at: "2026-04-21T15:30:00+07:00",
            last_signal: "payer_return_received",
            last_signal_at: "2026-04-21T15:05:00+07:00",
            late_signal_window_ends_at: "2026-04-21T16:00:00+07:00",
            order_reference: "ORD-INCOMPLETE-001",
            origin_site: "app.iai.one",
            payer_label: "Incomplete Shared",
            payment_reference: "PAY-INCOMPLETE-001",
            provider_flow: "callback pending -> reconciliation pending",
            provider_label: "Incomplete lane provider",
            reconciliation_status: "pending",
            session_id: "ps_incomplete_001",
            session_state: "active",
            support_channel: "incomplete@iai.one",
            support_evidence: ["callback receipt"]
          }
        },
        receipts: {}
      },
      null,
      2
    )
  );

  assert.throws(
    () =>
      createPayRequestHandler({
        readModelMode: "shared_only",
        sharedSessionSourceFilePath: sessionPath
      }),
    /shared_only mode is blocked/
  );
});

test("pay keeps missing routes explicit", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    url: "/missing"
  });
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-language"), "en");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(html, /This route does not exist on pay/);
});

test("pay denies non-GET methods on prep shell routes", async () => {
  const response = await dispatchToHandler(createPayRequestHandler(), {
    method: "POST",
    url: "/"
  });
  const payload = await response.json();

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("content-language"), "en");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "METHOD_NOT_ALLOWED");
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSessionClaims({ roles, subjectId, workspaceId }) {
  return JSON.stringify({
    roles,
    subject_id: subjectId,
    workspace_id: workspaceId
  });
}

function createJsonFetchMock(routes) {
  return async function fetchImpl(url) {
    const key = typeof url === "string" ? url : url instanceof URL ? url.toString() : String(url);
    if (!(key in routes)) {
      return new Response(JSON.stringify({ error: `No mock payload for ${key}` }), {
        headers: {
          "content-type": "application/json"
        },
        status: 404
      });
    }

    return new Response(JSON.stringify(routes[key]), {
      headers: {
        "content-type": "application/json"
      },
      status: 200
    });
  };
}
