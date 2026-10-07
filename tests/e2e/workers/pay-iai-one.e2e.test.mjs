/**
 * Process-level E2E for the pay.iai.one Worker (PayOS gateway) under `wrangler dev --local`.
 *
 * Everything is local: workerd, a throwaway D1 database migrated with `wrangler d1 migrations
 * apply --local`, fake secrets, and a fake PayOS API (see support/pay-fixtures.mjs for how the
 * hard-coded PayOS host is redirected without touching the repository sources).
 *
 * Needs: `npm ci` in tests/e2e/workers (Node >= 22). Skips with a reason when wrangler/workerd
 * cannot run; set E2E_WORKERS_REQUIRE=1 to make that a failure instead.
 */
import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { request } from "../support/harness.mjs";
import { buildPayOSWebhook, payosDataSignature, sha256Hex } from "./support/payos.mjs";
import {
  ACME_UNSCOPED_KEY,
  NOW,
  ORDERS,
  PAYOS,
  byKey,
  checkoutRequest,
  orderSeed,
  startPayStack,
  webhookRequest
} from "./support/pay-fixtures.mjs";
import { prepareD1Only, repoRoot, workerRuntimeSkipReason } from "./support/wrangler.mjs";

const skip = workerRuntimeSkipReason();
const PAY_DIR = path.join(repoRoot, "pay.iai.one");
const MIGRATIONS_DIR = path.join(PAY_DIR, "database");
const LANE_COLUMNS = [
  "lane_id",
  "purpose_code",
  "merchant_entity_id",
  "invoice_entity_id",
  "tax_region",
  "customer_country",
  "customer_type",
  "entity_verification_state",
  "checkout_enabled",
  "claims_profile_id",
  "compliance_hold_reason",
  "evidence_ref"
];

const migrationFiles = () => readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith(".sql")).sort();

// ------------------------------------------------------------------------------------------
// Migrations, applied the way production applies them (plain `d1 migrations apply`)
// ------------------------------------------------------------------------------------------

describe("pay.iai.one D1 migrations", { skip }, () => {
  const cleanups = [];
  after(() => cleanups.forEach((fn) => fn()));

  test("every file in database/ applies in order, including 0005, and a re-apply is a no-op", async () => {
    const prep = await prepareD1Only({ name: "pay-mig", dir: "pay.iai.one", config: "wrangler.jsonc", wranglerEnv: "production", database: "PAYMENTS_DB" });
    cleanups.push(prep.cleanup);

    const applied = await prep.applyMigrations();
    assert.equal(applied.code, 0, applied.output.slice(-1500));

    const recorded = (await prep.d1.query("SELECT name FROM d1_migrations ORDER BY id")).map((row) => row.name);
    assert.deepEqual(recorded, migrationFiles());
    assert.ok(recorded.includes("0005_lane_routing.sql"), "0005 is part of the plain apply set");

    const again = await prep.applyMigrations();
    assert.equal(again.code, 0, again.output.slice(-800));
    assert.match(again.output, /No migrations to apply/i);
  });

  test("0005 adds the 12 lane/compliance columns and the 8 lane/compliance indexes to payment_intents and payment_attempts", async () => {
    const prep = await prepareD1Only({ name: "pay-mig-cols", dir: "pay.iai.one", config: "wrangler.jsonc", wranglerEnv: "production", database: "PAYMENTS_DB" });
    cleanups.push(prep.cleanup);
    assert.equal((await prep.applyMigrations()).code, 0);

    for (const table of ["payment_intents", "payment_attempts"]) {
      const columns = (await prep.d1.query(`PRAGMA table_info(${table})`)).map((row) => row.name);
      for (const column of LANE_COLUMNS) assert.ok(columns.includes(column), `${table}.${column} missing`);
    }
    const indexes = (await prep.d1.query("SELECT name FROM sqlite_master WHERE type = 'index'")).map((row) => row.name);
    for (const prefix of ["idx_pi", "idx_pa"]) {
      for (const suffix of ["lane_id", "merchant_entity", "purpose_code", "compliance_hold"]) {
        assert.ok(indexes.includes(`${prefix}_${suffix}`), `missing index ${prefix}_${suffix}`);
      }
    }
  });

  test("0005 is additive over a populated 0001-0004 database: rows survive, new columns default safely", async () => {
    // Stage 1: only 0001-0004 (the pre-0005 production shape).
    const preDir = mkdtempSync(path.join(tmpdir(), "iai-e2e-pay-pre0005-"));
    cleanups.push(() => rmSync(preDir, { recursive: true, force: true }));
    for (const file of migrationFiles().filter((name) => !name.startsWith("0005"))) copyFileSync(path.join(MIGRATIONS_DIR, file), path.join(preDir, file));

    const pre = await prepareD1Only({ name: "pay-mig-pre", dir: "pay.iai.one", config: "wrangler.jsonc", wranglerEnv: "production", database: "PAYMENTS_DB", migrationsDir: preDir });
    cleanups.push(pre.cleanup);
    assert.equal((await pre.applyMigrations()).code, 0);
    await pre.d1.seed([
      `INSERT INTO tenants VALUES ('ten_acme', 'acme', 'acme', 'acme', 'VND', 'active', '${NOW}', '${NOW}')`,
      `INSERT INTO merchant_sites VALUES ('site_acme', 'ten_acme', 'acme-shop', 'acme-shop.example', 'https://acme-shop.example', NULL, NULL, NULL, NULL, 1, '${NOW}', '${NOW}')`,
      ...orderSeed("pre0005", { tenant: "acme", orderCode: 880001, amount: 99000, status: "paid" })
    ]);
    const before = await pre.d1.query("SELECT * FROM payment_intents WHERE id = 'pi_pre0005'");
    assert.equal(before.length, 1);
    assert.ok(!("lane_id" in before[0]), "fixture should predate 0005");

    // Stage 2: the full production directory on the same database.
    const full = await prepareD1Only({ name: "pay-mig-full", dir: "pay.iai.one", config: "wrangler.jsonc", wranglerEnv: "production", database: "PAYMENTS_DB", persistDir: pre.persistDir });
    cleanups.push(full.cleanup);
    const applied = await full.applyMigrations();
    assert.equal(applied.code, 0, applied.output.slice(-1500));

    const after = (await full.d1.query("SELECT * FROM payment_intents WHERE id = 'pi_pre0005'"))[0];
    for (const [key, value] of Object.entries(before[0])) assert.equal(after[key], value, `payment_intents.${key} changed`);
    for (const column of LANE_COLUMNS.filter((name) => name !== "checkout_enabled")) assert.equal(after[column], null, `${column} should start NULL`);
    assert.equal(after.checkout_enabled, 0, "checkout_enabled defaults to 0 (not enabled)");

    const attempt = (await full.d1.query("SELECT * FROM payment_attempts WHERE id = 'att_pre0005'"))[0];
    assert.equal(attempt.provider_order_id, "880001");
    assert.equal(attempt.checkout_enabled, 0);
  });
});

// ------------------------------------------------------------------------------------------
// Readiness against an empty database
// ------------------------------------------------------------------------------------------

describe("pay.iai.one health without a migrated database", { skip }, () => {
  let stack;
  before(async () => {
    stack = await startPayStack({ name: "pay-bare", migrate: false, secrets: false });
  }, { timeout: 120_000 });
  after(async () => {
    await stack?.stop();
  });

  test("GET /health reports not ready, with the missing tables listed", async () => {
    const response = await request(stack.baseUrl, "/health");
    assert.ok([200, 503].includes(response.status), response.text);
    assert.equal(response.json.ok, false);
    assert.equal(response.json.status, "not_ready");
    assert.equal(response.json.db_bound, true);
    assert.equal(response.json.db_ready, false);
    assert.equal(response.json.schema_ready, false);
    assert.equal(response.json.schema_proof.found_tables, 0);
    assert.ok(response.json.schema_proof.missing_tables.includes("payment_intents"));
    assert.equal(response.json.provider_ready, false);
    assert.equal(response.json.smtp_ready, false);
  });

  test("checkout cannot be reached on an unmigrated database: no success body", async () => {
    const response = await request(stack.baseUrl, "/internal/checkout-session", checkoutRequest("acme", { order: "ord-nodb" }));
    assert.ok(response.status >= 400, `${response.status} ${response.text}`);
    assert.notEqual(response.json?.ok, true);
  });
});

// ------------------------------------------------------------------------------------------
// The Worker on a fully migrated + seeded database
// ------------------------------------------------------------------------------------------

describe("pay.iai.one Worker", { skip }, () => {
  let stack;
  let base;
  let d1;

  before(async () => {
    stack = await startPayStack({ name: "pay-main" });
    base = stack.baseUrl;
    d1 = stack.d1;
  }, { timeout: 180_000 });
  after(async () => {
    await stack?.stop();
  });

  const needsPayOSFake = (t) => {
    if (stack.isolated) return false;
    t.skip("PayOS API host is not redirectable in this checkout of src/lib/payos.ts (testability gap)");
    return true;
  };
  const get = (pathname, init) => request(base, pathname, init);
  const intentRow = async (orderId) => (await d1.query(`SELECT payment_status, fulfillment_status, paid_at FROM payment_intents WHERE internal_order_id = '${orderId}'`))[0];
  const transfersFor = (intentId) =>
    d1.query(`SELECT lt.id, lt.tenant_id, lt.transfer_type, lt.transfer_status, lt.currency,
                     (SELECT COUNT(*) FROM ledger_entries le WHERE le.transfer_id = lt.id) AS entries,
                     (SELECT SUM(amount) FROM ledger_entries le WHERE le.transfer_id = lt.id AND le.entry_side = 'debit') AS debit,
                     (SELECT SUM(amount) FROM ledger_entries le WHERE le.transfer_id = lt.id AND le.entry_side = 'credit') AS credit
                FROM ledger_transfers lt WHERE lt.source_type = 'payment_intent' AND lt.source_ref_id = '${intentId}'`);
  const eventsFor = (rawBody) => d1.query(`SELECT provider_event_id, signature_valid, processed, tenant_id FROM provider_events WHERE provider_event_id = '${sha256Hex(rawBody)}'`);
  const countRows = async (table) => (await d1.query(`SELECT COUNT(*) AS c FROM ${table}`))[0].c;
  const signedFor = (name, { key = PAYOS.acme.checksumKey, code = "00", overrides } = {}) =>
    buildPayOSWebhook({ orderCode: ORDERS[name].orderCode, amount: ORDERS[name].amount, checksumKey: key, code, overrides });
  const postWebhook = (tenantCode, body) => get(`/v1/webhooks/payos/${tenantCode}`, webhookRequest(body));

  describe("health and static contract", () => {
    test("GET /health is no-store JSON with the documented readiness shape", async () => {
      const response = await get("/health");
      assert.equal(response.status, 200, response.text);
      assert.match(response.headers.get("content-type") ?? "", /application\/json/);
      assert.match(response.headers.get("cache-control") ?? "", /no-store/);
      const body = response.json;
      assert.equal(body.service, "pay.iai.one");
      assert.equal(body.environment, "e2e");
      assert.equal(body.db_bound, true);
      assert.equal(body.db_ready, true);
      assert.equal(body.schema_ready, true);
      assert.equal(body.schema_proof.found_tables, body.schema_proof.expected_tables);
      assert.deepEqual(body.schema_proof.missing_tables, []);
      assert.equal(body.providers_total, 6);
      assert.equal(body.smtp_ready, true);
      if (stack.isolated) {
        assert.ok(body.provider_proof.some((provider) => provider.code === "payos" && provider.env_ready === true));
        assert.equal(body.ok, true);
        assert.equal(body.status, "production_ready");
      }
      assert.ok(!Number.isNaN(Date.parse(body.checked_at)));
    });

    test("GET / serves the same health document", async () => {
      const response = await get("/");
      assert.equal(response.status, 200);
      assert.equal(response.json.service, "pay.iai.one");
      assert.equal(typeof response.json.schema_ready, "boolean");
    });

    test("health never leaks secret values", async () => {
      const response = await get("/health");
      for (const secret of [PAYOS.global.apiKey, PAYOS.global.checksumKey, PAYOS.acme.apiKey, "e2e-smtp-password", "e2e-webhook-secret"]) {
        assert.ok(!response.text.includes(secret), "secret value present in health output");
      }
    });

    test("unknown routes answer a JSON 404 and OPTIONS preflight answers 204 with CORS headers", async () => {
      const missing = await get("/definitely-not-a-route");
      assert.equal(missing.status, 404);
      assert.equal(missing.json.code, "NOT_FOUND");
      const preflight = await get("/internal/checkout-session", { method: "OPTIONS", headers: { origin: "https://acme-shop.example", "access-control-request-method": "POST" } });
      assert.equal(preflight.status, 204);
      assert.match(preflight.headers.get("access-control-allow-headers") ?? "", /x-idempotency-key/);
      assert.match(preflight.headers.get("access-control-allow-methods") ?? "", /POST/);
    });

    test("/openapi.json and /docs describe the internal checkout contract", async () => {
      const spec = await get("/openapi.json");
      assert.equal(spec.status, 200);
      assert.match(spec.json.openapi, /^3\./);
      assert.ok(spec.json.paths["/internal/checkout-session"], "checkout path documented");
      const docs = await get("/docs");
      assert.equal(docs.status, 200);
      assert.match(docs.headers.get("content-type") ?? "", /text\/html/);
    });
  });

  describe("checkout fails closed unless the tenant PayOS account is live", () => {
    const cases = [
      { key: "norow", why: "no provider_accounts row", webhook: { account: "missing", live: false, merchant: false, binding: false } },
      { key: "pending", why: "status pending_merchant_verification", webhook: { account: "pending_merchant_verification", live: false, merchant: false, binding: true } },
      { key: "testmode", why: "active but live_mode = 0", webhook: { account: "active", live: false, merchant: true, binding: true } },
      { key: "nomerchant", why: "active + live but empty merchant_reference", webhook: { account: "active", live: true, merchant: false, binding: true } },
      { key: "badprefix", why: "secret_binding_prefix fails validation", webhook: { account: "active", live: true, merchant: true, binding: true } }
    ];

    for (const scenario of cases) {
      test(`checkout: ${scenario.why} -> 503 PAYOS_TENANT_ACCOUNT_NOT_READY, no PayOS call, no intent`, async () => {
        stack.fake.reset();
        const order = `ord-closed-${scenario.key}`;
        const response = await get("/internal/checkout-session", checkoutRequest(scenario.key, { order }));
        assert.equal(response.status, 503, response.text);
        assert.equal(response.json.ok, false);
        assert.equal(response.json.success, false);
        assert.equal(response.json.code, "PAYOS_TENANT_ACCOUNT_NOT_READY");
        assert.equal(response.json.checkout_url, null);
        assert.equal(stack.fake.calls.length, 0, "must not reach PayOS");
        assert.equal((await d1.query(`SELECT COUNT(*) AS c FROM payment_intents WHERE internal_order_id = '${order}'`))[0].c, 0);
      });

      test(`webhook: ${scenario.why} -> 503 with readiness detail and no stored event`, async () => {
        const events = await countRows("provider_events");
        const tenant = byKey[scenario.key];
        const response = await postWebhook(tenant.code, { code: "00", success: true, data: { orderCode: 1 }, signature: "x" });
        assert.equal(response.status, 503, response.text);
        assert.equal(response.json.code, "PAYOS_TENANT_ACCOUNT_NOT_READY");
        assert.equal(response.json.tenant_code, tenant.code);
        assert.equal(response.json.provider_account_status, scenario.webhook.account);
        assert.equal(response.json.live_mode, scenario.webhook.live);
        assert.equal(response.json.merchant_reference_configured, scenario.webhook.merchant);
        assert.equal(response.json.credential_binding_configured, scenario.webhook.binding);
        assert.equal(await countRows("provider_events"), events);
      });
    }

    test("webhook for a tenant code that does not exist at all -> 503 NOT_READY (status missing)", async () => {
      const response = await postWebhook("no-such-tenant", { code: "00", success: true, data: { orderCode: 1 }, signature: "x" });
      assert.equal(response.status, 503, response.text);
      assert.equal(response.json.code, "PAYOS_TENANT_ACCOUNT_NOT_READY");
      assert.equal(response.json.provider_account_status, "missing");
    });

    test("active tenant whose secret bindings are absent -> 503 PAYOS_TENANT_CREDENTIALS_MISSING (no fallback to global keys)", async () => {
      stack.fake.reset();
      const checkout = await get("/internal/checkout-session", checkoutRequest("nosecret", { order: "ord-closed-nosecret" }));
      assert.equal(checkout.status, 503, checkout.text);
      assert.equal(checkout.json.code, "PAYOS_TENANT_CREDENTIALS_MISSING");
      assert.equal(stack.fake.calls.length, 0, "global PAYOS_* credentials must never be substituted");

      const hook = await postWebhook(byKey.nosecret.code, { code: "00", success: true, data: { orderCode: 1 }, signature: "x" });
      assert.equal(hook.status, 503);
      assert.equal(hook.json.code, "PAYOS_TENANT_CREDENTIALS_MISSING");
      assert.deepEqual(hook.json.missing_credential_fields, ["CLIENT_ID", "API_KEY", "CHECKSUM_KEY"]);
    });

    test("partially provisioned bindings list exactly the missing field", async (t) => {
      if (needsPayOSFake(t)) return;
      const hook = await postWebhook(byKey.partial.code, { code: "00", success: true, data: { orderCode: 1 }, signature: "x" });
      assert.equal(hook.status, 503, hook.text);
      assert.equal(hook.json.code, "PAYOS_TENANT_CREDENTIALS_MISSING");
      assert.deepEqual(hook.json.missing_credential_fields, ["CHECKSUM_KEY"]);
    });
  });

  describe("internal checkout contract", () => {
    test("rejects a missing idempotency key, invalid JSON and an incomplete body before touching PayOS", async () => {
      stack.fake.reset();
      const noIdem = await get("/internal/checkout-session", { ...checkoutRequest("acme", { order: "ord-v1" }), headers: { "content-type": "application/json", "x-api-key": byKey.acme.siteKey } });
      assert.equal(noIdem.status, 422);
      assert.equal(noIdem.json.code, "IDEMPOTENCY_KEY_REQUIRED");

      const badJson = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-v2", body: "{not json" }));
      assert.equal(badJson.status, 400);
      assert.equal(badJson.json.code, "INVALID_JSON");

      const incomplete = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-v3", body: JSON.stringify({ tenant_code: "acme" }) }));
      assert.equal(incomplete.status, 422);
      assert.equal(incomplete.json.code, "INTERNAL_CONTRACT_INVALID");
      assert.equal(stack.fake.calls.length, 0);
    });

    test("enforces VND, one-time billing, payOS-only and the amount bounds", async () => {
      const post = (extra) => get("/internal/checkout-session", checkoutRequest("acme", { order: `ord-bounds-${Math.random().toString(36).slice(2, 8)}`, body: JSON.stringify({ tenant_code: "acme", site_code: "acme-shop", internal_order_id: "ord-bounds", amount: 50000, success_url: "https://acme-shop.example/ok", cancel_url: "https://acme-shop.example/cancel", ...extra }) }));
      assert.equal((await post({ currency: "USD" })).json.code, "UNSUPPORTED_CURRENCY");
      assert.equal((await post({ billing_cycle: "monthly" })).json.code, "UNSUPPORTED_BILLING_CYCLE");
      assert.equal((await post({ provider: "momo" })).json.code, "PROVIDER_NOT_READY");
      assert.equal((await post({ amount: 1999 })).json.code, "AMOUNT_TOO_LOW");
      assert.equal((await post({ amount: 500_000_001 })).json.code, "AMOUNT_TOO_HIGH");
      assert.equal((await post({ amount: 1500.5 })).status, 422);
    });

    test("requires a site API key bound to the tenant/site and holding the checkout scope", async () => {
      stack.fake.reset();
      const missing = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-auth-1", headers: { "x-api-key": "" } }));
      assert.equal(missing.status, 401);
      assert.equal(missing.json.code, "API_KEY_REQUIRED");

      const wrong = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-auth-2", headers: { "x-api-key": "not-a-real-key" } }));
      assert.equal(wrong.status, 403);
      assert.equal(wrong.json.code, "API_KEY_INVALID");

      const otherSite = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-auth-3", headers: { "x-api-key": byKey.beta.siteKey } }));
      assert.equal(otherSite.status, 403, "a key issued for another tenant/site must not authorize this one");
      assert.equal(otherSite.json.code, "API_KEY_INVALID");

      const unscoped = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-auth-4", headers: { "x-api-key": ACME_UNSCOPED_KEY } }));
      assert.equal(unscoped.status, 403);
      assert.equal(unscoped.json.code, "API_KEY_SCOPE_MISMATCH");

      assert.equal(stack.fake.calls.length, 0);
      assert.equal((await d1.query("SELECT COUNT(*) AS c FROM payment_intents WHERE internal_order_id LIKE 'ord-auth-%'"))[0].c, 0);
    });

    test("an active tenant's checkout calls PayOS with that tenant's credentials and persists the session", async (t) => {
      if (needsPayOSFake(t)) return;
      stack.fake.reset();
      const response = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-co-acme", amount: 75000 }));
      assert.equal(response.status, 201, response.text);
      assert.equal(response.json.ok, true);
      assert.equal(response.json.success, true);
      assert.equal(response.json.provider, "payos");
      assert.equal(response.json.amount, 75000);
      assert.equal(response.json.currency, "VND");
      assert.match(response.json.checkout_url, /^https:\/\/pay\.payos\.vn\/web\//);
      assert.match(response.json.provider_order_id, /^\d+$/);
      assert.equal(response.json.persistence.tenant_code, "acme");

      assert.equal(stack.fake.calls.length, 1);
      const call = stack.fake.calls[0];
      assert.equal(call.clientId, PAYOS.acme.clientId, "tenant-scoped client id");
      assert.equal(call.apiKey, PAYOS.acme.apiKey, "tenant-scoped api key");
      assert.equal(call.signatureValid, true, "request signed with the tenant checksum key");
      assert.equal(String(call.body.orderCode), response.json.provider_order_id);
      assert.equal(call.body.amount, 75000);
      assert.ok(call.body.description.length <= 9, "description trimmed to the payOS rail limit");

      const intent = (await d1.query("SELECT payment_status, amount, currency, provider_code FROM payment_intents WHERE internal_order_id = 'ord-co-acme'"))[0];
      assert.deepEqual({ ...intent }, { payment_status: "created", amount: 75000, currency: "VND", provider_code: "payos" });
      const attempt = (await d1.query("SELECT provider_order_id, provider_payment_url FROM payment_attempts WHERE provider_order_id = '" + response.json.provider_order_id + "'"))[0];
      assert.match(attempt.provider_payment_url, /^https:\/\/pay\.payos\.vn/);
    });

    test("a different tenant's checkout is made with that tenant's own credentials", async (t) => {
      if (needsPayOSFake(t)) return;
      stack.fake.reset();
      const response = await get("/internal/checkout-session", checkoutRequest("beta", { order: "ord-co-beta" }));
      assert.equal(response.status, 201, response.text);
      assert.equal(stack.fake.calls.length, 1);
      assert.equal(stack.fake.calls[0].clientId, PAYOS.beta.clientId);
      assert.equal(stack.fake.calls[0].signatureValid, true);
    });

    test("idempotency: same key + body replays the stored response without a second PayOS call; a different body conflicts", async (t) => {
      if (needsPayOSFake(t)) return;
      stack.fake.reset();
      const first = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-idem", idem: "idem-key-1" }));
      assert.equal(first.status, 201, first.text);
      const replay = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-idem", idem: "idem-key-1" }));
      assert.equal(replay.status, 201);
      assert.deepEqual(replay.json, first.json);
      assert.equal(stack.fake.calls.length, 1, "replay must not call PayOS again");

      const conflict = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-idem", idem: "idem-key-1", amount: 60000 }));
      assert.equal(conflict.status, 409);
      assert.equal(conflict.json.code, "IDEMPOTENCY_CONFLICT");
    });

    test("an existing internal_order_id with a new idempotency key returns the existing session", async (t) => {
      if (needsPayOSFake(t)) return;
      stack.fake.reset();
      const again = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-idem", idem: "idem-key-new" }));
      assert.equal(again.status, 200, again.text);
      assert.equal(again.json.reused, true);
      assert.match(again.json.checkout_url, /^https:\/\/pay\.payos\.vn/);
      assert.equal(stack.fake.calls.length, 0);
    });

    test("a PayOS-side rejection is surfaced as a failure and the intent is marked provider_error", async (t) => {
      if (needsPayOSFake(t)) return;
      stack.fake.reset();
      stack.fake.failNext(200, { code: "20", desc: "Invalid parameters", data: null });
      const response = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-co-fail" }));
      assert.equal(response.status, 502, response.text);
      assert.equal(response.json.ok, false);
      assert.equal(response.json.success, false);
      assert.equal(response.json.checkout_url, null);
      assert.equal((await intentRow("ord-co-fail")).payment_status, "provider_error");
    });

    test("retrying a failed order must not report success without a checkout_url", { todo: "retry of a failed order returns ok:true with checkout_url:null (index.ts ORDER_ALREADY_EXISTS branch -> buildInternalExistingCheckoutResponse)" }, async (t) => {
      if (needsPayOSFake(t)) return;
      const retry = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-co-fail", idem: "idem-retry-after-fail" }));
      assert.ok(!(retry.json.ok === true && !retry.json.checkout_url), `ok:${retry.json.ok} checkout_url:${retry.json.checkout_url}`);
    });
  });

  describe("signed PayOS webhooks", () => {
    test("end to end: checkout, then a valid signed webhook marks the order paid exactly once with one balanced ledger transfer", async (t) => {
      if (needsPayOSFake(t)) return;
      const created = await get("/internal/checkout-session", checkoutRequest("acme", { order: "ord-live-flow", amount: 88000 }));
      assert.equal(created.status, 201, created.text);
      const orderCode = Number(created.json.provider_order_id);
      const orderStatus = () => get(`/internal/order-status?tenant_code=acme&site_code=acme-shop&internal_order_id=ord-live-flow`, { headers: { "x-api-key": byKey.acme.siteKey } });

      const before = await orderStatus();
      assert.equal(before.status, 200, before.text);
      assert.equal(before.json.paid, false);
      assert.equal(before.json.verified, false);

      const hook = buildPayOSWebhook({ orderCode, amount: 88000, checksumKey: PAYOS.acme.checksumKey });
      const delivered = await postWebhook("acme", hook);
      assert.equal(delivered.status, 202, delivered.text);
      assert.equal(delivered.json.ok, true);
      assert.equal(delivered.json.signature_valid, true);
      assert.equal(delivered.json.ledger.ok, true);

      const after = await orderStatus();
      assert.equal(after.json.paid, true);
      assert.equal(after.json.verified, true);
      assert.equal(after.json.payment_status, "paid");
      assert.ok(after.json.paid_at, "paid_at stamped");
      assert.equal(after.json.provider_ref, hook.data.reference);

      const transfers = await transfersFor(created.json.payment_session_id);
      assert.equal(transfers.length, 1);
      assert.equal(transfers[0].transfer_type, "payment_capture");
      assert.equal(transfers[0].transfer_status, "posted");
      assert.equal(transfers[0].tenant_id, "ten_acme");
      assert.equal(transfers[0].entries, 2);
      assert.equal(transfers[0].debit, 88000);
      assert.equal(transfers[0].credit, 88000);
    });

    test("a valid signed webhook for a seeded order is accepted with 202 and recorded as a processed, signature-valid event", async () => {
      const hook = signedFor("flow");
      const response = await postWebhook("acme", hook);
      assert.equal(response.status, 202, response.text);
      assert.equal(response.json.webhook.order_code, ORDERS.flow.orderCode);
      assert.equal(response.json.webhook.amount, ORDERS.flow.amount);
      assert.equal((await intentRow("ord-flow")).payment_status, "paid");
      const [event] = await eventsFor(JSON.stringify(hook));
      assert.equal(event.signature_valid, 1);
      assert.equal(event.processed, 1);
      assert.equal(event.tenant_id, "ten_acme");
    });

    test("replaying the same body is a duplicate no-op (200 duplicate:true): still one paid_at, one transfer, one event", async () => {
      const hook = signedFor("replay");
      const body = JSON.stringify(hook);
      const first = await postWebhook("acme", body);
      assert.equal(first.status, 202, first.text);
      const paidAt = (await intentRow("ord-replay")).paid_at;
      assert.ok(paidAt);

      const replay = await postWebhook("acme", body);
      assert.equal(replay.status, 200, replay.text);
      assert.equal(replay.json.ok, true);
      assert.equal(replay.json.duplicate, true);
      assert.equal((await intentRow("ord-replay")).paid_at, paidAt, "paid_at must not move on replay");
      assert.equal((await transfersFor("pi_replay")).length, 1);
      assert.equal((await eventsFor(body)).length, 1);
    });

    test("concurrent identical deliveries produce a single capture and a single paid order", async () => {
      const body = JSON.stringify(signedFor("concurrent"));
      const responses = await Promise.all(Array.from({ length: 8 }, () => postWebhook("acme", body)));
      for (const response of responses) assert.ok([200, 202].includes(response.status), `${response.status} ${response.text.slice(0, 300)}`);
      assert.ok(responses.some((response) => response.status === 202), "one delivery performs the work");

      assert.equal((await intentRow("ord-concurrent")).payment_status, "paid");
      const transfers = await transfersFor("pi_concurrent");
      assert.equal(transfers.length, 1, "exactly one ledger transfer");
      assert.equal(transfers[0].entries, 2);
      assert.equal((await eventsFor(body)).length, 1);
      assert.equal((await d1.query("SELECT COUNT(*) AS c FROM ledger_transfers WHERE source_ref_id = 'pi_concurrent' AND transfer_type = 'payment_capture'"))[0].c, 1);
    });

    test("concurrent identical deliveries should not report ledger failures to the caller", { todo: "capture posting is read-then-insert (ledger.ts ensureLedgerAccount/postTransfer): losing racers return ledger.ok:false and log ledger.payment_capture_failed even though exactly one capture exists" }, async () => {
      const body = JSON.stringify(signedFor("concurrent2"));
      const responses = await Promise.all(Array.from({ length: 8 }, () => postWebhook("acme", body)));
      const failed = responses.filter((response) => response.json?.ledger && response.json.ledger.ok === false);
      assert.equal(failed.length, 0, `${failed.length} of ${responses.length} deliveries reported a ledger failure`);
      assert.equal((await transfersFor("pi_concurrent2")).length, 1, "end state is still a single capture");
    });

    test("a webhook with a bad signature is refused (401) and never marks an unpaid order paid or posts to the ledger", async () => {
      const hook = signedFor("badsig");
      hook.signature = "0".repeat(64);
      const response = await postWebhook("acme", hook);
      assert.equal(response.status, 401, response.text);
      assert.equal(response.json.ok, false);
      assert.equal(response.json.signature_valid, false);
      const intent = await intentRow("ord-badsig");
      assert.notEqual(intent.payment_status, "paid");
      assert.equal(intent.paid_at, null);
      assert.equal((await transfersFor("pi_badsig")).length, 0);
      const [event] = await eventsFor(JSON.stringify(hook));
      assert.equal(event.signature_valid, 0);
      assert.equal(event.processed, 0);
    });

    test("data altered after signing is refused", async () => {
      const hook = signedFor("tamper");
      hook.data.amount = 1;
      const response = await postWebhook("acme", hook);
      assert.equal(response.status, 401, response.text);
      assert.notEqual((await intentRow("ord-tamper")).payment_status, "paid");
      assert.equal((await transfersFor("pi_tamper")).length, 0);
    });

    test("a valid event with a failure code is accepted but does not mark the order paid", async () => {
      const response = await postWebhook("acme", signedFor("failed", { code: "07" }));
      assert.equal(response.status, 202, response.text);
      assert.equal(response.json.signature_valid, true);
      const intent = await intentRow("ord-failed");
      assert.notEqual(intent.payment_status, "paid");
      assert.equal(intent.paid_at, null);
      assert.equal((await transfersFor("pi_failed")).length, 0);
      assert.ok((await d1.query("SELECT failed_at FROM payment_attempts WHERE id = 'att_failed'"))[0].failed_at, "attempt marked failed");
    });

    test("the signing key is the tenant's own: neither the global key nor another tenant's key verifies", async () => {
      const withGlobal = await postWebhook("acme", signedFor("globalkey", { key: PAYOS.global.checksumKey }));
      assert.equal(withGlobal.status, 401, withGlobal.text);
      const withBeta = await postWebhook("acme", signedFor("otherkey", { key: PAYOS.beta.checksumKey }));
      assert.equal(withBeta.status, 401, withBeta.text);
      for (const name of ["globalkey", "otherkey"]) {
        assert.notEqual((await intentRow(`ord-${name}`)).payment_status, "paid");
        assert.equal((await transfersFor(`pi_${name}`)).length, 0);
      }
    });

    test("a second tenant's webhook verifies with that tenant's key and posts to that tenant's ledger", async () => {
      const response = await postWebhook("beta", signedFor("betaflow", { key: PAYOS.beta.checksumKey }));
      assert.equal(response.status, 202, response.text);
      assert.equal((await intentRow("ord-betaflow")).payment_status, "paid");
      const transfers = await transfersFor("pi_betaflow");
      assert.equal(transfers.length, 1);
      assert.equal(transfers[0].tenant_id, "ten_beta");
    });

    test("a correctly signed event for an unknown order code is accepted without touching any payment", async () => {
      const before = await d1.query("SELECT COUNT(*) AS c FROM payment_intents WHERE payment_status = 'paid'");
      const hook = buildPayOSWebhook({ orderCode: 424242424, amount: 5000, checksumKey: PAYOS.acme.checksumKey });
      const response = await postWebhook("acme", hook);
      assert.equal(response.status, 202, response.text);
      assert.equal(response.json.signature_valid, true);
      assert.deepEqual(await d1.query("SELECT COUNT(*) AS c FROM payment_intents WHERE payment_status = 'paid'"), before);
      const [event] = await eventsFor(JSON.stringify(hook));
      assert.equal(event.tenant_id, null);
    });

    test("malformed webhook bodies are rejected with 400 PAYOS_WEBHOOK_INVALID", async () => {
      for (const body of ["not json", "{}", JSON.stringify({ data: { orderCode: 1 } }), JSON.stringify({ signature: "abc" })]) {
        const response = await postWebhook("acme", body);
        assert.equal(response.status, 400, `${body} -> ${response.text}`);
        assert.equal(response.json.code, "PAYOS_WEBHOOK_INVALID");
      }
    });

    test("the signature algorithm is HMAC-SHA256 over key-sorted data fields (independent re-implementation matches the Worker)", async () => {
      const data = { orderCode: 910001, amount: 120000, nested: { b: 2, a: 1 }, list: [{ y: 1, x: 2 }], empty: null };
      assert.equal(payosDataSignature(data, "k"), payosDataSignature({ list: data.list, empty: null, nested: data.nested, amount: 120000, orderCode: 910001 }, "k"), "key order must not matter");
    });
  });

  describe("order status contract", () => {
    const status = (query, key = byKey.acme.siteKey) => get(`/internal/order-status?${query}`, { headers: key ? { "x-api-key": key } : {} });

    test("requires tenant_code, site_code and internal_order_id", async () => {
      const response = await status("tenant_code=acme");
      assert.equal(response.status, 422);
      assert.equal(response.json.code, "ORDER_STATUS_INPUT_REQUIRED");
    });

    test("requires a key valid for that tenant/site", async () => {
      assert.equal((await status("tenant_code=acme&site_code=acme-shop&internal_order_id=ord-flow", null)).status, 401);
      assert.equal((await status("tenant_code=acme&site_code=acme-shop&internal_order_id=ord-flow", byKey.beta.siteKey)).status, 403);
    });

    test("unknown orders are 404 PAYMENT_NOT_FOUND and a foreign provider_order_id is 409", async () => {
      const missing = await status("tenant_code=acme&site_code=acme-shop&internal_order_id=ord-does-not-exist");
      assert.equal(missing.status, 404);
      assert.equal(missing.json.code, "PAYMENT_NOT_FOUND");
      const mismatch = await status("tenant_code=acme&site_code=acme-shop&internal_order_id=ord-flow&provider_order_id=1");
      assert.equal(mismatch.status, 409);
      assert.equal(mismatch.json.code, "PROVIDER_ORDER_MISMATCH");
    });

    test("an order that belongs to another tenant/site is not visible through this tenant's key", async () => {
      const response = await status("tenant_code=acme&site_code=acme-shop&internal_order_id=ord-betaflow");
      assert.equal(response.status, 404);
    });
  });
});
