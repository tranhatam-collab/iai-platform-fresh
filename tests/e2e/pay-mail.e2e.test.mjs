/**
 * apps/pay running as a real process next to a real mail-api, with the tenant
 * webhook receiver replaced by an in-test fake.
 *
 * - Payment emails: pay -> POST {MAIL_API_BASE_URL}/send -> mail-api, then read back
 *   through the mail-api message API.
 * - Outbound payment webhooks: pay signs with PAYMENT_WEBHOOK_SECRET. The registered
 *   tenant destination is an https URL on the public internet, so the services run with
 *   a preload (support/network-guard) that redirects exactly that origin to the fake
 *   receiver and refuses every other non-loopback request.
 *
 * All secrets below are throwaway test values. Needs `pnpm build`.
 * Run: node --test tests/e2e/pay-mail.e2e.test.mjs
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { sendJson, startFakeServer } from "./support/fake-http.mjs";
import { builtEntryAvailable, request, startMailApi, startService } from "./support/harness.mjs";
import { DEV_WORKSPACE, getMessage, getMessageEvents, uniqueKey } from "./support/mail-helpers.mjs";
import { BLOCKED_MARKER, networkGuardEnv } from "./support/network-guard.mjs";

const built = builtEntryAvailable("apps/pay/dist/index.js") && builtEntryAvailable("apps/mail-api/dist/bootstrap.js");

const INTERNAL_KEY = "e2e-pay-internal-key";
const WEBHOOK_SECRET = "e2e-payment-webhook-secret";
const TENANT_ORIGIN = "https://api.tranhatam.com";
const TENANT_PATH = "/v1/payments/webhook?provider=pay_iai_one";
const STACK_TRACE = /(\/home\/|\/Users\/|node_modules|at [\w.<>]+ \(.*:\d+:\d+\)|ENOENT)/;
const INTERNAL_ROUTES = [
  ["POST", "/internal/payment-email/send"],
  ["POST", "/internal/payment-event/callback"],
  ["POST", "/internal/payment-event/proof"],
  ["POST", "/internal/payment-webhook/dispatch"],
  ["GET", "/internal/payment-event/evidence?domain=tranhatam.com"]
];

function startPay(env, name = "pay") {
  return startService({
    name,
    entry: "apps/pay/dist/index.js",
    portEnv: "PAY_PORT",
    hostEnv: "PAY_HOST",
    env
  });
}

function emailInput(overrides = {}) {
  const orderId = `order_${uniqueKey("o")}`;
  return {
    amount: 150000,
    currency: "VND",
    customerName: "Tran Ha Tam",
    domain: "tranhatam.com",
    invoiceUrl: "https://tranhatam.com/invoices/order_123",
    locale: "en",
    messageIdempotencyKey: `pay-e2e-${orderId}-payment_receipt`,
    orderId,
    paidAt: "2026-04-23T09:00:00.000+07:00",
    paymentSessionId: `ps_${orderId}`,
    productName: "E2E founder payment",
    providerReference: `provider_ref_${orderId}`,
    recipientEmail: "customer@example.com",
    recipientName: "Customer Example",
    requestId: `req_${orderId}`,
    siteUrl: "https://tranhatam.com",
    supportEmail: "support@tranhatam.com",
    templateId: "payment_receipt",
    xSiteKey: "site_tranhatam",
    ...overrides
  };
}

function post(base, pathname, body, headers = { "x-pay-email-adapter-key": INTERNAL_KEY }) {
  return request(base, pathname, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

describe("pay with a real mail-api", { skip: built ? false : "apps/pay or apps/mail-api not built" }, () => {
  let workDir;
  let mailApi;
  let tenant;
  let tenantBehavior;
  let pay;

  before(async () => {
    workDir = mkdtempSync(path.join(tmpdir(), "iai-e2e-pay-"));
    const dbPath = path.join(workDir, "mail.db");
    mailApi = await startMailApi({ env: { MAIL_DB_URL: `sqlite:${dbPath}` } });

    // Give the dev workspace the tranhatam.com sender identities pay's templates use.
    const db = new DatabaseSync(dbPath);
    try {
      const now = new Date().toISOString();
      db.prepare(
        "INSERT OR IGNORE INTO domains (id, workspace_id, domain, verification_status, created_at) VALUES (?, ?, ?, 'verified', ?)"
      ).run("dom_e2e_tranhatam", DEV_WORKSPACE, "tranhatam.com", now);
      for (const local of ["pay", "billing", "support"]) {
        db.prepare(
          "INSERT OR IGNORE INTO sender_identities (id, workspace_id, domain_id, email, allowed_streams_json, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?)"
        ).run(`sender_e2e_${local}`, DEV_WORKSPACE, "dom_e2e_tranhatam", `${local}@tranhatam.com`, JSON.stringify(["transactional"]), now);
      }
    } finally {
      db.close();
    }

    tenantBehavior = () => 200;
    tenant = await startFakeServer((req, res, record) => {
      const timestamp = req.headers["x-tranhatam-timestamp"];
      const expected = createHmac("sha256", WEBHOOK_SECRET).update(`${timestamp}.${record.rawBody}`).digest("hex");
      record.signatureValid = req.headers["x-tranhatam-signature"] === expected;
      sendJson(res, tenantBehavior(record), { received: true });
    });

    pay = await startPay({
      PAY_EMAIL_ADAPTER_INTERNAL_KEY: INTERNAL_KEY,
      MAIL_API_BASE_URL: `${mailApi.baseUrl}/v1`,
      MAIL_API_KEY: mailApi.credentials.apiKey,
      MAIL_API_WORKSPACE_ID: DEV_WORKSPACE,
      PAYMENT_WEBHOOK_SECRET: WEBHOOK_SECRET,
      ...networkGuardEnv({ [TENANT_ORIGIN]: tenant.baseUrl })
    });
  });

  after(async () => {
    await pay?.stop();
    await tenant?.close();
    await mailApi?.stop();
    if (workDir) {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  describe("public registries", () => {
    test("/api/* endpoints return JSON documents", async () => {
      const cases = [
        "/api/receiver-registry",
        "/api/payment-routing?domain=tranhatam.com&country=VN&currency=VND&amount=150000",
        "/api/payment-email-templates?domain=tranhatam.com",
        "/api/site-activation-registry",
        "/api/site-activation-registry?domain=tranhatam.com"
      ];
      for (const pathname of cases) {
        const response = await request(pay.baseUrl, pathname);
        assert.equal(response.status, 200, `${pathname} -> ${response.status}`);
        assert.match(response.headers.get("content-type"), /application\/json/);
        assert.equal(response.json.ok, true, pathname);
        assert.ok(response.json.data && typeof response.json.data === "object", pathname);
        assert.equal(response.headers.get("cache-control"), "no-store");
      }
    });

    test("the receiver registry keeps its documented shape", async () => {
      const { data } = (await request(pay.baseUrl, "/api/receiver-registry")).json;
      assert.ok(Array.isArray(data.receivers) && data.receivers.length > 0);
      assert.equal(data.receiverCount, data.receivers.length);
      assert.ok(Array.isArray(data.assignmentMap));
      assert.ok(data.assignmentMap.some((entry) => entry.domain === "tranhatam.com"));
    });

    test("payment routing resolves a domain and requires one", async () => {
      const routing = await request(pay.baseUrl, "/api/payment-routing?domain=tranhatam.com&country=VN&currency=VND&amount=150000");
      assert.equal(routing.json.data.domain, "tranhatam.com");
      assert.equal(routing.json.data.requestedCurrency, "VND");
      assert.ok(Array.isArray(routing.json.data.channels));

      const missing = await request(pay.baseUrl, "/api/payment-routing");
      assert.equal(missing.status, 400);
      assert.equal(missing.json.ok, false);
      assert.equal(missing.json.error.code, "PAY_ROUTING_DOMAIN_REQUIRED");
    });

    test("email template registry: locked templates for known domains, JSON errors otherwise", async () => {
      const known = await request(pay.baseUrl, "/api/payment-email-templates?domain=tranhatam.com");
      assert.equal(known.json.data.domain, "tranhatam.com");
      assert.ok(known.json.data.templateCount >= 1);
      assert.ok(known.json.data.templates.payment_receipt);

      const unknown = await request(pay.baseUrl, "/api/payment-email-templates?domain=unknown.example");
      assert.equal(unknown.status, 404);
      assert.equal(unknown.json.error.code, "PAYMENT_EMAIL_TEMPLATES_NOT_CONFIGURED");

      const missing = await request(pay.baseUrl, "/api/payment-email-templates");
      assert.equal(missing.status, 400);
    });

    test("registry endpoints are read-only", async () => {
      for (const pathname of ["/api/receiver-registry", "/api/payment-routing?domain=tranhatam.com"]) {
        const response = await request(pay.baseUrl, pathname, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
        assert.equal(response.status, 405, pathname);
        assert.equal(response.json.error.code, "METHOD_NOT_ALLOWED");
      }
    });

    test("unknown surfaces answer with JSON 404, not stack traces", async () => {
      const response = await request(pay.baseUrl, "/api/payment-surface-registry?domain=unknown.example");
      assert.equal(response.status, 404);
      assert.equal(response.json.ok, false);
      assert.doesNotMatch(response.text, STACK_TRACE);
    });
  });

  describe("internal routes: adapter key", () => {
    test("every internal route fails closed (503) when no key is configured, even for callers presenting one", async () => {
      const unconfigured = await startPay({ PAY_EMAIL_ADAPTER_INTERNAL_KEY: "", ...networkGuardEnv() }, "pay-no-key");
      try {
        for (const [method, pathname] of INTERNAL_ROUTES) {
          for (const headers of [{}, { "x-pay-email-adapter-key": "anything" }, { "x-pay-email-adapter-key": "" }]) {
            const response = await request(unconfigured.baseUrl, pathname, {
              method,
              headers: { "content-type": "application/json", ...headers },
              body: method === "POST" ? "{}" : undefined
            });
            assert.equal(response.status, 503, `${method} ${pathname} ${JSON.stringify(headers)} -> ${response.status}`);
            assert.equal(response.json.error.code, "PAY_EMAIL_ADAPTER_INTERNAL_KEY_MISSING");
          }
        }
      } finally {
        await unconfigured.stop();
      }
    });

    test("a missing or wrong key is a 401 on every internal route", async () => {
      for (const [method, pathname] of INTERNAL_ROUTES) {
        for (const headers of [{}, { "x-pay-email-adapter-key": "wrong" }, { "x-pay-email-adapter-key": `${INTERNAL_KEY} ` + "x" }]) {
          const response = await request(pay.baseUrl, pathname, {
            method,
            headers: { "content-type": "application/json", ...headers },
            body: method === "POST" ? "{}" : undefined
          });
          assert.equal(response.status, 401, `${method} ${pathname} ${JSON.stringify(headers)} -> ${response.status}`);
          assert.equal(response.json.error.code, "PAY_EMAIL_ADAPTER_UNAUTHORIZED");
          assert.doesNotMatch(response.text, new RegExp(INTERNAL_KEY));
        }
      }
    });

    test("the key is only accepted in its dedicated header", async () => {
      for (const headers of [
        { authorization: `Bearer ${INTERNAL_KEY}` },
        { "x-api-key": INTERNAL_KEY },
        { cookie: `x-pay-email-adapter-key=${INTERNAL_KEY}` }
      ]) {
        const response = await post(pay.baseUrl, "/internal/payment-email/send", emailInput(), headers);
        assert.equal(response.status, 401, JSON.stringify(headers));
      }
    });

    test("internal routes reject the wrong HTTP method", async () => {
      for (const [method, pathname] of [["GET", "/internal/payment-email/send"], ["PUT", "/internal/payment-webhook/dispatch"], ["POST", "/internal/payment-event/evidence?domain=tranhatam.com"]]) {
        const response = await request(pay.baseUrl, pathname, {
          method,
          headers: { "x-pay-email-adapter-key": INTERNAL_KEY, "content-type": "application/json" },
          body: method === "GET" ? undefined : "{}"
        });
        assert.equal(response.status, 405, `${method} ${pathname}`);
      }
    });
  });

  describe("payment email handoff to mail-api", () => {
    test("sends a real email that is readable in mail-api", async () => {
      const input = emailInput();
      const response = await post(pay.baseUrl, "/internal/payment-email/send", input);
      assert.equal(response.status, 202, response.text);
      const data = response.json.data;
      assert.match(data.message_id, /^msg_/);
      assert.equal(data.mail_status, "queued");
      assert.equal(data.provider_route, "transactional_primary");
      assert.equal(data.order_id, input.orderId);
      assert.equal(data.source_domain, "tranhatam.com");
      assert.equal(data.template_id, "payment_receipt");
      assert.match(data.canonical_row_ref, /^canon_tranhatam_com_/);

      const detail = await getMessage(mailApi, data.message_id);
      assert.equal(detail.status, 200, detail.text);
      const message = detail.json.data;
      assert.equal(message.status, "provider_accepted");
      assert.equal(message.message.subject, `Tranhatam.com | Payment receipt #${input.orderId}`);
      const payload = message.normalizedPayload;
      assert.equal(payload.from.email, "pay@tranhatam.com");
      assert.equal(payload.replyTo.email, "support@tranhatam.com");
      assert.deepEqual(payload.recipients, ["customer@example.com"]);
      assert.equal(payload.stream, "transactional");
      assert.equal(payload.messageIdempotencyKey, input.messageIdempotencyKey);
      assert.deepEqual(payload.tags, ["pay", "payment_receipt", "tranhatam.com"]);
      assert.equal(payload.metadata.template_id, "payment_receipt");
      assert.equal(payload.metadata.source_app, "pay.iai.one");
      assert.equal(payload.metadata.order_id, input.orderId);
      assert.equal(payload.metadata.x_site_key, "site_tranhatam");
      assert.equal(payload.headers["X-Source-App"], "pay.iai.one");
      assert.match(payload.text, new RegExp(input.orderId));
      assert.doesNotMatch(payload.text, /\{\{/, "no template placeholders may survive rendering");

      const events = await getMessageEvents(mailApi, data.message_id);
      assert.equal(events.json.data.items.at(-1).eventType, "provider_accepted");
    });

    test("resending the same idempotency key does not create a second message", async () => {
      const input = emailInput();
      const first = await post(pay.baseUrl, "/internal/payment-email/send", input);
      const second = await post(pay.baseUrl, "/internal/payment-email/send", input);
      assert.equal(first.status, 202);
      assert.equal(second.status, 202);
      assert.equal(second.json.data.message_id, first.json.data.message_id);
    });

    test("the payment evidence row links the order to the mail message id", async () => {
      const input = emailInput();
      const sent = await post(pay.baseUrl, "/internal/payment-email/send", input);
      const evidence = await request(
        pay.baseUrl,
        `/internal/payment-event/evidence?domain=tranhatam.com&provider_reference=${encodeURIComponent(input.providerReference)}`,
        { headers: { "x-pay-email-adapter-key": INTERNAL_KEY } }
      );
      assert.equal(evidence.status, 200, evidence.text);
      assert.equal(evidence.json.data.mail_message_id, sent.json.data.message_id);
      assert.equal(evidence.json.data.payment_session_id, input.paymentSessionId);
      assert.equal(evidence.json.data.template_id, "payment_receipt");
      assert.equal(evidence.json.data.canonical_row_ref, sent.json.data.canonical_row_ref);
    });

    test("input errors are 400s with stable codes and never reach mail-api", async () => {
      const cases = [
        [emailInput({ recipientEmail: "not-an-email" }), "PAYMENT_EMAIL_INVALID_RECIPIENT"],
        [emailInput({ messageIdempotencyKey: "   " }), "PAYMENT_EMAIL_IDEMPOTENCY_KEY_REQUIRED"],
        [emailInput({ domain: "unknown.example" }), "PAYMENT_EMAIL_REGISTRY_NOT_CONFIGURED"],
        [emailInput({ templateId: "no_such_template" }), "PAYMENT_EMAIL_TEMPLATE_NOT_CONFIGURED"],
        [emailInput({ orderId: "" }), "PAYMENT_EMAIL_UNRESOLVED_VARIABLES"]
      ];
      for (const [input, code] of cases) {
        const response = await post(pay.baseUrl, "/internal/payment-email/send", input);
        assert.equal(response.status, 400, `${code} -> ${response.status} ${response.text}`);
        assert.equal(response.json.error.code, code);
        assert.doesNotMatch(response.text, STACK_TRACE);
      }
      const notObject = await post(pay.baseUrl, "/internal/payment-email/send", "[1,2]");
      assert.equal(notObject.status, 400);
      const garbage = await post(pay.baseUrl, "/internal/payment-email/send", "{not json");
      assert.equal(garbage.status, 400);
    });

    test("a mail-api rejection surfaces as 502 without leaking the API key", async () => {
      const response = await post(pay.baseUrl, "/internal/payment-email/send", emailInput({ recipientEmail: "blocked@example.com" }));
      assert.equal(response.status, 502, response.text);
      assert.equal(response.json.error.code, "MAIL_API_REQUEST_FAILED");
      assert.equal(response.json.error.details.status, 422);
      assert.doesNotMatch(response.text, new RegExp(mailApi.credentials.apiKey));
    });

    test("without MAIL_API_KEY or workspace the handoff reports 503 and sends nothing", async () => {
      for (const [missing, code] of [
        [{ MAIL_API_KEY: "" }, "MAIL_API_KEY_MISSING"],
        [{ MAIL_API_WORKSPACE_ID: "" }, "MAIL_API_WORKSPACE_ID_MISSING"]
      ]) {
        const misconfigured = await startPay(
          {
            PAY_EMAIL_ADAPTER_INTERNAL_KEY: INTERNAL_KEY,
            MAIL_API_BASE_URL: `${mailApi.baseUrl}/v1`,
            MAIL_API_KEY: mailApi.credentials.apiKey,
            MAIL_API_WORKSPACE_ID: DEV_WORKSPACE,
            ...missing,
            ...networkGuardEnv()
          },
          "pay-misconfigured"
        );
        try {
          const input = emailInput();
          const response = await post(misconfigured.baseUrl, "/internal/payment-email/send", input);
          assert.equal(response.status, 503, response.text);
          assert.equal(response.json.error.code, code);
        } finally {
          await misconfigured.stop();
        }
      }
    });

    test("a body above the documented 64 KiB limit is refused with 413", { todo: "known gap, tracked on the team board" }, async () => {
      const response = await post(pay.baseUrl, "/internal/payment-email/send", JSON.stringify(emailInput({ customerName: "x".repeat(100 * 1024) })));
      assert.equal(response.status, 413, response.text);
    });
  });

  describe("payment event callback and proof", () => {
    test("callback -> proof -> evidence share one canonical row", async () => {
      const orderId = `order_${uniqueKey("cb")}`;
      const providerReference = `ref_${orderId}`;
      const callback = await post(pay.baseUrl, "/internal/payment-event/callback", {
        callback_status: "pending",
        domain: "tranhatam.com",
        order_id: orderId,
        payment_session_id: `ps_${orderId}`,
        provider_reference: providerReference
      });
      assert.equal(callback.status, 202, callback.text);
      assert.equal(callback.json.data.outbound_webhook.attempted, false);
      assert.equal(callback.json.data.outbound_webhook.reason, "callback_status_not_terminal_success");

      const proof = await post(pay.baseUrl, "/internal/payment-event/proof", {
        db_evidence_ref: "db://e2e/row/1",
        domain: "tranhatam.com",
        provider_reference: providerReference
      });
      assert.equal(proof.status, 200, proof.text);
      assert.equal(proof.json.data.canonical_row_ref, callback.json.data.canonical_row_ref);

      const evidence = await request(
        pay.baseUrl,
        `/internal/payment-event/evidence?domain=tranhatam.com&provider_reference=${providerReference}`,
        { headers: { "x-pay-email-adapter-key": INTERNAL_KEY } }
      );
      assert.equal(evidence.json.data.canonical_row_ref, callback.json.data.canonical_row_ref);
      assert.equal(evidence.json.data.db_evidence_ref, "db://e2e/row/1");
      const events = evidence.json.data.audit_log.map((entry) => entry.event);
      assert.ok(events.length >= 2, JSON.stringify(events));
    });

    test("payloads missing domain, identifier or proof are 400s", async () => {
      for (const [route, body, code] of [
        ["/internal/payment-event/callback", { order_id: "o" }, "PAYMENT_EVENT_DOMAIN_REQUIRED"],
        ["/internal/payment-event/callback", { domain: "tranhatam.com" }, "PAYMENT_EVENT_IDENTIFIER_REQUIRED"],
        ["/internal/payment-event/proof", { domain: "tranhatam.com", order_id: "o" }, "PAYMENT_EVENT_PROOF_REQUIRED"],
        ["/internal/payment-event/proof", { domain: "tranhatam.com", db_evidence_ref: "x" }, "PAYMENT_EVENT_IDENTIFIER_REQUIRED"]
      ]) {
        const response = await post(pay.baseUrl, route, body);
        assert.equal(response.status, 400, `${route} ${JSON.stringify(body)}`);
        assert.equal(response.json.error.code, code);
      }
      const noLookup = await request(pay.baseUrl, "/internal/payment-event/evidence", { headers: { "x-pay-email-adapter-key": INTERNAL_KEY } });
      assert.equal(noLookup.status, 400);
    });
  });

  describe("outbound payment webhook", () => {
    const dispatch = (body) => post(pay.baseUrl, "/internal/payment-webhook/dispatch", body);
    const baseEvent = () => ({
      amount: 150000,
      currency: "vnd",
      domain: "tranhatam.com",
      order_id: `order_${uniqueKey("wh")}`,
      provider_event_id: uniqueKey("evt"),
      tenant_code: "tranhatam"
    });

    test("delivers an HMAC-signed 5-field body to the registered tenant destination", async () => {
      tenantBehavior = () => 200;
      const calls = tenant.requests.length;
      const event = baseEvent();
      const response = await dispatch(event);
      assert.equal(response.status, 202, response.text);
      assert.equal(response.json.data.delivered, true);
      assert.equal(response.json.data.attempts, 1);
      assert.equal(response.json.data.final_status, 200);
      assert.equal(response.json.data.tenant_code, "tranhatam");
      assert.equal(response.json.data.destination_url, `${TENANT_ORIGIN}${TENANT_PATH}`);

      assert.equal(tenant.requests.length, calls + 1);
      const received = tenant.requests.at(-1);
      assert.equal(received.method, "POST");
      assert.equal(received.url, TENANT_PATH);
      assert.equal(received.headers["x-e2e-original-url"], `${TENANT_ORIGIN}${TENANT_PATH}`);
      assert.match(received.headers["content-type"], /application\/json/);
      assert.deepEqual(received.json, {
        amount: 150000,
        currency: "VND",
        order_id: event.order_id,
        provider_event_id: event.provider_event_id,
        status: "succeeded"
      });
      assert.deepEqual(Object.keys(received.json).sort(), ["amount", "currency", "order_id", "provider_event_id", "status"]);
      assert.equal(received.signatureValid, true, "signature must be hex HMAC-SHA256(secret, `${timestamp}.${rawBody}`)");
      assert.match(received.headers["x-tranhatam-signature"], /^[0-9a-f]{64}$/);
      const skew = Math.abs(Date.now() / 1000 - Number(received.headers["x-tranhatam-timestamp"]));
      assert.ok(skew < 60, `timestamp skew ${skew}s`);
      assert.doesNotMatch(JSON.stringify(response.json), new RegExp(WEBHOOK_SECRET));
    });

    test("tampering with a delivered body invalidates its signature", async () => {
      tenantBehavior = () => 200;
      await dispatch(baseEvent());
      const received = tenant.requests.at(-1);
      const forged = createHmac("sha256", WEBHOOK_SECRET)
        .update(`${received.headers["x-tranhatam-timestamp"]}.${received.rawBody.replace("succeeded", "refunded")}`)
        .digest("hex");
      assert.notEqual(forged, received.headers["x-tranhatam-signature"]);
      const wrongSecret = createHmac("sha256", "some-other-secret")
        .update(`${received.headers["x-tranhatam-timestamp"]}.${received.rawBody}`)
        .digest("hex");
      assert.notEqual(wrongSecret, received.headers["x-tranhatam-signature"]);
    });

    test("a retryable receiver failure is retried with the same event id and a fresh signature", async () => {
      let attempt = 0;
      tenantBehavior = () => {
        attempt += 1;
        return attempt === 1 ? 503 : 200;
      };
      const calls = tenant.requests.length;
      const event = baseEvent();
      const response = await dispatch(event);
      tenantBehavior = () => 200;
      assert.equal(response.status, 202, response.text);
      assert.equal(response.json.data.attempts, 2);
      assert.equal(response.json.data.delivered, true);
      const [first, second] = tenant.requests.slice(calls);
      assert.equal(first.json.provider_event_id, event.provider_event_id);
      assert.equal(second.json.provider_event_id, event.provider_event_id);
      assert.equal(first.signatureValid, true);
      assert.equal(second.signatureValid, true);
    });

    test("a non-retryable receiver rejection is reported as 502 after a single attempt", async () => {
      tenantBehavior = () => 400;
      const calls = tenant.requests.length;
      const response = await dispatch(baseEvent());
      tenantBehavior = () => 200;
      assert.equal(response.status, 502, response.text);
      assert.equal(response.json.error.code, "PAYMENT_WEBHOOK_DESTINATION_REJECTED");
      assert.equal(tenant.requests.length, calls + 1);
    });

    test("unregistered tenants are refused with 422 and nothing is sent anywhere", async () => {
      const calls = tenant.requests.length;
      for (const tenant_code of ["iai", "dsts", "nhachung", "unknown-tenant", "TRANHATAM.evil", "../tranhatam"]) {
        const response = await dispatch({ ...baseEvent(), tenant_code });
        assert.equal(response.status, 422, `${tenant_code} -> ${response.status} ${response.text}`);
        assert.equal(response.json.error.code, "PAYMENT_WEBHOOK_TENANT_UNKNOWN");
      }
      assert.equal(tenant.requests.length, calls);
      assert.doesNotMatch(pay.logs(), new RegExp(BLOCKED_MARKER));
    });

    test("a caller-supplied destination is ignored: only the registered https destination is used", async () => {
      tenantBehavior = () => 200;
      const loopbackSink = await startFakeServer((_req, res) => sendJson(res, 200, {}));
      try {
        const calls = tenant.requests.length;
        const response = await dispatch({
          ...baseEvent(),
          destination_url: `${loopbackSink.baseUrl}/sink`,
          destinationUrl: `${loopbackSink.baseUrl}/sink`,
          webhook_url: "http://example.org/hook"
        });
        assert.equal(response.status, 202, response.text);
        assert.equal(response.json.data.destination_url, `${TENANT_ORIGIN}${TENANT_PATH}`);
        assert.equal(loopbackSink.requests.length, 0, "payload must never be sent to a caller-chosen URL");
        assert.equal(tenant.requests.length, calls + 1);
        assert.equal(new URL(tenant.requests.at(-1).headers["x-e2e-original-url"]).protocol, "https:");
      } finally {
        await loopbackSink.close();
      }
    });

    test("payload validation: tenant, event id, order id, currency and integer amount are required", async () => {
      const calls = tenant.requests.length;
      for (const mutation of [
        { tenant_code: "" },
        { provider_event_id: "" },
        { order_id: "" },
        { currency: "" },
        { amount: "abc" },
        { amount: undefined },
        { amount: 12.5 },
        { amount: -1 }
      ]) {
        const response = await dispatch({ ...baseEvent(), ...mutation });
        assert.equal(response.status, 400, `${JSON.stringify(mutation)} -> ${response.status} ${response.text}`);
      }
      assert.equal(tenant.requests.length, calls);
    });

    test("without PAYMENT_WEBHOOK_SECRET dispatch answers 503 and sends nothing", async () => {
      const calls = tenant.requests.length;
      const unsigned = await startPay(
        {
          PAY_EMAIL_ADAPTER_INTERNAL_KEY: INTERNAL_KEY,
          PAYMENT_WEBHOOK_SECRET: "",
          ...networkGuardEnv({ [TENANT_ORIGIN]: tenant.baseUrl })
        },
        "pay-no-webhook-secret"
      );
      try {
        const response = await post(unsigned.baseUrl, "/internal/payment-webhook/dispatch", baseEvent());
        assert.equal(response.status, 503, response.text);
        assert.equal(response.json.error.code, "PAYMENT_WEBHOOK_SECRET_MISSING");
      } finally {
        await unsigned.stop();
      }
      assert.equal(tenant.requests.length, calls);
    });

    test("a terminal-success payment callback dispatches the webhook and records the outcome", async () => {
      tenantBehavior = () => 200;
      const calls = tenant.requests.length;
      const orderId = `order_${uniqueKey("auto")}`;
      const providerEventId = uniqueKey("evt");
      const response = await post(pay.baseUrl, "/internal/payment-event/callback", {
        amount: 99000,
        callback_status: "succeeded",
        currency: "VND",
        domain: "tranhatam.com",
        order_id: orderId,
        provider_event_id: providerEventId,
        provider_reference: `ref_${orderId}`,
        tenant_code: "tranhatam"
      });
      assert.equal(response.status, 202, response.text);
      assert.equal(response.json.data.outbound_webhook.attempted, true);
      assert.equal(response.json.data.outbound_webhook.delivered, true);
      assert.equal(tenant.requests.length, calls + 1);
      assert.equal(tenant.requests.at(-1).signatureValid, true);
      assert.equal(tenant.requests.at(-1).json.order_id, orderId);

      const evidence = await request(
        pay.baseUrl,
        `/internal/payment-event/evidence?domain=tranhatam.com&order_id=${orderId}`,
        { headers: { "x-pay-email-adapter-key": INTERNAL_KEY } }
      );
      assert.equal(evidence.status, 200);
      assert.equal(JSON.stringify(evidence.json).includes(WEBHOOK_SECRET), false);
    });

    test("a callback that is not terminal success never dispatches", async () => {
      const calls = tenant.requests.length;
      const response = await post(pay.baseUrl, "/internal/payment-event/callback", {
        amount: 99000,
        callback_status: "failed",
        currency: "VND",
        domain: "tranhatam.com",
        order_id: `order_${uniqueKey("nofire")}`,
        provider_event_id: uniqueKey("evt"),
        tenant_code: "tranhatam"
      });
      assert.equal(response.status, 202);
      assert.equal(response.json.data.outbound_webhook.attempted, false);
      assert.equal(tenant.requests.length, calls);
    });

    test("no request ever left for a non-loopback host other than the redirected tenant origin", async () => {
      assert.doesNotMatch(pay.logs(), new RegExp(BLOCKED_MARKER));
    });
  });

  describe("operator pages and viewer roles", () => {
    let opsDir;
    let ops;
    const itemPath = `/ops/reconciliation/${encodeURIComponent("recon:e2e_001")}?lang=en`;
    const text = (html) => html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    before(async () => {
      opsDir = mkdtempSync(path.join(tmpdir(), "iai-e2e-pay-ops-"));
      const readModelPath = path.join(opsDir, "read-model.json");
      const authPath = path.join(opsDir, "auth.json");
      writeFileSync(
        readModelPath,
        JSON.stringify({
          schema_version: "iai.pay.shared-read-model.v1",
          ops: {
            reconciliation: {
              metrics: [{ label: "late_payments", value: "0" }],
              work_items: [
                {
                  id: "recon:e2e_001",
                  next_action: "confirm callback outbox delivery",
                  owner: "finance_admin",
                  safe_detail_items: ["callback_status: confirmed"],
                  sensitive_detail_items: ["internal_note: e2e-restricted-ledger-detail"],
                  severity: "medium",
                  summary: "E2E shared reconciliation item"
                }
              ]
            }
          }
        })
      );
      writeFileSync(
        authPath,
        JSON.stringify({
          schema_version: "iai.auth.shared-session.v1",
          subjects: {
            sub_e2e_finance: { workspaces: { ws_pay_main: { roles: ["finance_admin"] } } },
            sub_e2e_support: { workspaces: { ws_pay_main: { roles: ["support_admin"] } } }
          }
        })
      );
      ops = await startPay(
        {
          PAY_READ_MODEL_MODE: "shared_fallback_demo",
          PAY_SHARED_READ_MODEL_FILE: readModelPath,
          PAY_SHARED_AUTH_SOURCE_FILE: authPath,
          ...networkGuardEnv()
        },
        "pay-ops"
      );
    });
    after(async () => {
      await ops?.stop();
      if (opsDir) {
        rmSync(opsDir, { recursive: true, force: true });
      }
    });

    const asSubject = (subject) => ({ "x-iai-subject-id": subject, "x-workspace-id": "ws_pay_main", "x-iai-session": "e2e-session" });

    test("health reports the shared read model that was loaded", async () => {
      const response = await request(ops.baseUrl, "/health");
      assert.equal(response.status, 200);
      assert.equal(response.json.data.shared_read_model.configured, true);
      assert.equal(response.json.data.shared_read_model.counts.opsWorkItems, 1);
    });

    test("an identified finance role sees restricted detail items", async () => {
      const response = await request(ops.baseUrl, itemPath, { headers: asSubject("sub_e2e_finance") });
      assert.equal(response.status, 200);
      const body = text(response.text);
      assert.match(body, /callback_status: confirmed/);
      assert.match(body, /e2e-restricted-ledger-detail/);
    });

    test("a support role sees safe items and a restriction notice, not restricted detail", async () => {
      const response = await request(ops.baseUrl, itemPath, { headers: asSubject("sub_e2e_support") });
      assert.equal(response.status, 200);
      const body = text(response.text);
      assert.match(body, /callback_status: confirmed/);
      assert.match(body, /restricted detail hidden for current role/);
      assert.doesNotMatch(body, /e2e-restricted-ledger-detail/);
    });

    test("an anonymous viewer and an unlisted subject never get restricted detail", async () => {
      for (const headers of [{}, asSubject("sub_not_in_auth_source")]) {
        const response = await request(ops.baseUrl, itemPath, { headers });
        assert.ok(response.status < 500);
        assert.doesNotMatch(response.text, /e2e-restricted-ledger-detail/);
        assert.doesNotMatch(response.text, /callback_status: confirmed/);
      }
    });
  });
});

describe("pay reports the delivery status of a real mail-api", { skip: built ? false : "apps/pay or apps/mail-api not built" }, () => {
  /** Starts mail-api with the given provider settings and a pay in front of it; returns a sender and a stop. */
  async function stack(mailEnv) {
    const dir = mkdtempSync(path.join(tmpdir(), "iai-e2e-pay-status-"));
    const dbPath = path.join(dir, "mail.db");
    const mailApi = await startMailApi({ env: { MAIL_DB_URL: `sqlite:${dbPath}`, ...mailEnv } });
    const db = new DatabaseSync(dbPath);
    try {
      const now = new Date().toISOString();
      db.prepare(
        "INSERT OR IGNORE INTO domains (id, workspace_id, domain, verification_status, created_at) VALUES (?, ?, ?, 'verified', ?)"
      ).run("dom_e2e_tranhatam", DEV_WORKSPACE, "tranhatam.com", now);
      for (const local of ["pay", "billing", "support"]) {
        db.prepare(
          "INSERT OR IGNORE INTO sender_identities (id, workspace_id, domain_id, email, allowed_streams_json, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?)"
        ).run(`sender_e2e_${local}`, DEV_WORKSPACE, "dom_e2e_tranhatam", `${local}@tranhatam.com`, JSON.stringify(["transactional"]), now);
      }
    } finally {
      db.close();
    }
    const pay = await startPay({
      PAY_EMAIL_ADAPTER_INTERNAL_KEY: INTERNAL_KEY,
      MAIL_API_BASE_URL: `${mailApi.baseUrl}/v1`,
      MAIL_API_KEY: mailApi.credentials.apiKey,
      MAIL_API_WORKSPACE_ID: DEV_WORKSPACE,
      PAYMENT_WEBHOOK_SECRET: WEBHOOK_SECRET,
      ...networkGuardEnv({})
    });
    return {
      mailApi,
      pay,
      async stop() {
        await pay.stop();
        await mailApi.stop();
        rmSync(dir, { force: true, recursive: true });
      }
    };
  }

  const cases = [
    ["provider_accepted", { MAIL_PROVIDER_ADAPTER: "fake" }, "provider_accepted"],
    ["deferred", { MAIL_PROVIDER_ADAPTER: "none" }, "deferred"],
    ["failed", { MAIL_PROVIDER_ADAPTER: "none", MAIL_QUEUE_MAX_ATTEMPTS: "1" }, "failed"]
  ];

  for (const [name, mailEnv, expected] of cases) {
    test(`${name}: the status mail-api reports is the status pay reports`, async () => {
      const { mailApi, pay, stop } = await stack(mailEnv);
      try {
        const response = await post(pay.baseUrl, "/internal/payment-email/send", emailInput());
        assert.equal(response.status, 202, response.text);
        const data = response.json.data;
        assert.equal(data.delivery_status, expected);
        assert.equal(data.mail_status, "queued", "the handoff itself is queued whatever the delivery status");

        const detail = await getMessage(mailApi, data.message_id);
        assert.equal(detail.json.data.status, expected, "the message in mail-api has the same status");
        const events = await getMessageEvents(mailApi, data.message_id);
        const types = events.json.data.items.map((item) => item.eventType);
        assert.equal(types.includes("provider_accepted"), expected === "provider_accepted");
      } finally {
        await stop();
      }
    });
  }
});
