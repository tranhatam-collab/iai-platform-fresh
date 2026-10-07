/**
 * Shared fixtures for the pay.iai.one Worker E2E suites: fake credentials, seed rows and a
 * one-call stack (fake PayOS API + wrangler dev + migrated local D1).
 *
 * The Worker has the PayOS API host hard-coded (src/lib/payos.ts), so the stack runs a
 * test-only staged copy of src/ in which that single literal points at the local fake. The
 * repository sources are never modified. If the literal cannot be found, `isolated` is false,
 * no tenant secrets are provisioned (so the Worker cannot make an outbound PayOS call) and
 * the suites skip every test that needs one.
 */
import { startFakePayOS, sha256Hex } from "./payos.mjs";
import { repoRoot, startWorker, stageSource } from "./wrangler.mjs";

export const NOW = "2026-01-01T00:00:00.000Z";
const PAYOS_HOST = "https://api-merchant.payos.vn";

/** Fake PayOS merchant credentials, per tenant prefix. */
export const PAYOS = {
  acme: { prefix: "ACME_PAYOS", clientId: "acme-client-e2e", apiKey: "acme-api-key-e2e", checksumKey: "acme-checksum-e2e" },
  beta: { prefix: "BETA_PAYOS", clientId: "beta-client-e2e", apiKey: "beta-api-key-e2e", checksumKey: "beta-checksum-e2e" },
  global: { clientId: "global-client-e2e", apiKey: "global-api-key-e2e", checksumKey: "global-checksum-e2e" }
};

/**
 * Tenants: code, site, site key, and the provider_accounts row (null = no row at all).
 * The expected readiness outcome is documented per row.
 */
export const TENANTS = [
  { key: "acme", code: "acme", site: "acme-shop", siteKey: "acme-site-key-e2e", account: { status: "active", live: 1, merchant: "MERCH-ACME", prefix: "ACME_PAYOS" } },
  { key: "beta", code: "beta", site: "beta-shop", siteKey: "beta-site-key-e2e", account: { status: "active", live: 1, merchant: "MERCH-BETA", prefix: "BETA_PAYOS" } },
  { key: "norow", code: "norow-co", site: "norow-shop", siteKey: "norow-site-key-e2e", account: null },
  { key: "pending", code: "pending-co", site: "pending-shop", siteKey: "pending-site-key-e2e", account: { status: "pending_merchant_verification", live: 0, merchant: "", prefix: "PENDING_PAYOS" } },
  { key: "testmode", code: "testmode-co", site: "testmode-shop", siteKey: "testmode-site-key-e2e", account: { status: "active", live: 0, merchant: "MERCH-TEST", prefix: "TESTMODE_PAYOS" } },
  { key: "nomerchant", code: "nomerchant-co", site: "nomerchant-shop", siteKey: "nomerchant-site-key-e2e", account: { status: "active", live: 1, merchant: "", prefix: "NOMERCH_PAYOS" } },
  { key: "badprefix", code: "badprefix-co", site: "badprefix-shop", siteKey: "badprefix-site-key-e2e", account: { status: "active", live: 1, merchant: "MERCH-BAD", prefix: "lower_case" } },
  { key: "nosecret", code: "nosecret-co", site: "nosecret-shop", siteKey: "nosecret-site-key-e2e", account: { status: "active", live: 1, merchant: "MERCH-NOSECRET", prefix: "NOSECRET_PAYOS" } },
  { key: "partial", code: "partial-co", site: "partial-shop", siteKey: "partial-site-key-e2e", account: { status: "active", live: 1, merchant: "MERCH-PARTIAL", prefix: "PARTIAL_PAYOS" } }
];

/** An extra key on the acme site that lacks the checkout scope. */
export const ACME_UNSCOPED_KEY = "acme-unscoped-key-e2e";

export const byKey = Object.fromEntries(TENANTS.map((tenant) => [tenant.key, tenant]));

/** Webhook fixture orders: seeded intent + attempt, unpaid, one per scenario. */
export const ORDERS = {
  flow: { tenant: "acme", orderCode: 910001, amount: 120000 },
  replay: { tenant: "acme", orderCode: 910002, amount: 130000 },
  concurrent: { tenant: "acme", orderCode: 910003, amount: 140000 },
  concurrent2: { tenant: "acme", orderCode: 910014, amount: 145000 },
  badsig: { tenant: "acme", orderCode: 910004, amount: 150000 },
  tamper: { tenant: "acme", orderCode: 910005, amount: 160000 },
  failed: { tenant: "acme", orderCode: 910006, amount: 170000 },
  globalkey: { tenant: "acme", orderCode: 910007, amount: 180000 },
  otherkey: { tenant: "acme", orderCode: 910008, amount: 190000 },
  betaflow: { tenant: "beta", orderCode: 910009, amount: 200000 },
  scope: { tenant: "acme", orderCode: 910010, amount: 210000 },
  paid: { tenant: "acme", orderCode: 910011, amount: 220000 },
  crossa: { tenant: "acme", orderCode: 910012, amount: 230000 },
  crossb: { tenant: "beta", orderCode: 910013, amount: 240000 }
};

const q = (value) => (value === null || value === undefined ? "NULL" : `'${String(value).replaceAll("'", "''")}'`);

export function orderSeed(name, { tenant, orderCode, amount, status = "created" }) {
  const t = byKey[tenant];
  const intentId = `pi_${name}`;
  return [
    `INSERT INTO payment_intents (id, tenant_id, site_id, internal_order_id, amount, currency, payment_type, provider_code, payment_status, fulfillment_status, success_url, cancel_url, metadata_json, created_at, updated_at)
     VALUES (${q(intentId)}, ${q(`ten_${tenant}`)}, ${q(`site_${tenant}`)}, ${q(`ord-${name}`)}, ${amount}, 'VND', 'hosted_checkout', 'payos', ${q(status)}, 'pending', 'https://${t.site}.example/ok', 'https://${t.site}.example/cancel', ${q(JSON.stringify({ provider: "payos", tenant_code: t.code, site_code: t.site, order_code: orderCode }))}, ${q(NOW)}, ${q(NOW)})`,
    `INSERT INTO payment_attempts (id, payment_intent_id, provider_code, provider_order_id, provider_transaction_id, provider_payment_url, provider_raw_status, response_json, initiated_at)
     VALUES (${q(`att_${name}`)}, ${q(intentId)}, 'payos', ${q(String(orderCode))}, ${q(`plink_${orderCode}`)}, ${q(`https://pay.payos.vn/web/plink_${orderCode}`)}, 'PENDING', '{}', ${q(NOW)})`
  ];
}

export function buildSeed({ extra = [] } = {}) {
  const statements = [];
  for (const tenant of TENANTS) {
    statements.push(
      `INSERT INTO tenants VALUES (${q(`ten_${tenant.key}`)}, ${q(tenant.code)}, ${q(tenant.code)}, ${q(tenant.code)}, 'VND', 'active', ${q(NOW)}, ${q(NOW)})`,
      `INSERT INTO merchant_sites VALUES (${q(`site_${tenant.key}`)}, ${q(`ten_${tenant.key}`)}, ${q(tenant.site)}, ${q(`${tenant.site}.example`)}, ${q(`https://${tenant.site}.example`)}, NULL, NULL, NULL, NULL, 1, ${q(NOW)}, ${q(NOW)})`,
      `INSERT INTO service_api_keys VALUES (${q(`key_${tenant.key}`)}, ${q(`ten_${tenant.key}`)}, ${q(`site_${tenant.key}`)}, 'e2e', ${q(sha256Hex(tenant.siteKey))}, '["internal:checkout-session:create"]', NULL, NULL, ${q(NOW)})`
    );
    if (tenant.account) {
      const a = tenant.account;
      statements.push(
        `INSERT INTO provider_accounts VALUES (${q(`pa_${tenant.key}`)}, ${q(`ten_${tenant.key}`)}, 'payos', 'main', ${q(a.merchant)}, NULL, ${q(a.prefix)}, ${a.live}, ${q(a.status)}, ${q(NOW)}, ${q(NOW)})`
      );
    }
  }
  statements.push(
    `INSERT INTO service_api_keys VALUES ('key_acme_unscoped', 'ten_acme', 'site_acme', 'e2e-unscoped', ${q(sha256Hex(ACME_UNSCOPED_KEY))}, '["internal:other:scope"]', NULL, NULL, ${q(NOW)})`
  );
  for (const [name, order] of Object.entries(ORDERS)) {
    statements.push(...orderSeed(name, { ...order, status: name === "paid" ? "paid" : "created" }));
  }
  return [...statements, ...extra];
}

/**
 * Fake secrets for the Worker. Every PayOS credential (tenant and global) is only handed out when
 * `isolated`, i.e. when the PayOS host is redirected to the local fake, so a build that cannot be
 * isolated has no credentials with which to make an outbound provider call.
 */
export function buildSecrets({ isolated }) {
  const secrets = {
    PAY_IAI_ONE_WEBHOOK_SECRET: "e2e-webhook-secret",
    TURNSTILE_SECRET: "e2e-turnstile-secret",
    SMTP_HOST: "smtp.invalid",
    SMTP_PORT: "587",
    SMTP_SECURE_TRANSPORT: "starttls",
    SMTP_AUTH_MODE: "login",
    SMTP_USERNAME: "e2e-smtp-user",
    SMTP_PASSWORD: "e2e-smtp-password",
    SMTP_HELO_DOMAIN: "iai.invalid",
    EMAIL_FROM_PAY: "pay@iai.invalid",
    EMAIL_FROM_BILLING: "billing@iai.invalid",
    EMAIL_REPLY_TO_SUPPORT: "support@iai.invalid"
  };
  if (isolated) {
    secrets.PAYOS_CLIENT_ID = PAYOS.global.clientId;
    secrets.PAYOS_API_KEY = PAYOS.global.apiKey;
    secrets.PAYOS_CHECKSUM_KEY = PAYOS.global.checksumKey;
    for (const tenant of ["acme", "beta"]) {
      const p = PAYOS[tenant];
      secrets[`${p.prefix}_CLIENT_ID`] = p.clientId;
      secrets[`${p.prefix}_API_KEY`] = p.apiKey;
      secrets[`${p.prefix}_CHECKSUM_KEY`] = p.checksumKey;
    }
    // incomplete credential set: no checksum key
    secrets.PARTIAL_PAYOS_CLIENT_ID = "partial-client-e2e";
    secrets.PARTIAL_PAYOS_API_KEY = "partial-api-key-e2e";
  }
  return secrets;
}

/**
 * Boot the full stack: fake PayOS API, staged Worker sources, migrated + seeded local D1.
 * `migrate: false` boots against an empty database (readiness checks).
 */
export async function startPayStack({ migrate = true, seed = true, secrets = true, extraSeed = [], name = "pay" } = {}) {
  const fake = await startFakePayOS({
    accounts: {
      [PAYOS.acme.clientId]: PAYOS.acme,
      [PAYOS.beta.clientId]: PAYOS.beta,
      [PAYOS.global.clientId]: PAYOS.global
    }
  });
  const staged = stageSource({
    projectDir: `${repoRoot}/pay.iai.one`,
    subdirs: ["src"],
    patch: (_file, text) => text.replaceAll(PAYOS_HOST, fake.baseUrl)
  });
  const isolated = staged.patched.length > 0;

  let worker;
  try {
    worker = await startWorker({
      name,
      dir: "pay.iai.one",
      config: "wrangler.jsonc",
      wranglerEnv: "production",
      main: `${staged.dir}/src/index.ts`,
      vars: { PAY_ENV: "e2e" },
      secrets: secrets ? buildSecrets({ isolated }) : {},
      migrations: migrate ? { database: "PAYMENTS_DB" } : undefined,
      seed: migrate && seed ? buildSeed({ extra: extraSeed }) : undefined
    });
  } catch (error) {
    await fake.close();
    staged.cleanup();
    throw error;
  }

  return {
    worker,
    fake,
    isolated,
    baseUrl: worker.baseUrl,
    d1: worker.d1,
    async stop() {
      await worker.stop();
      await fake.close();
      staged.cleanup();
    }
  };
}

/** POST /internal/checkout-session with sensible defaults. */
export function checkoutRequest(tenantKey, { order, idem, amount = 50000, headers = {}, body } = {}) {
  const tenant = byKey[tenantKey];
  return {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": tenant.siteKey, "x-idempotency-key": idem ?? `idem-${order}`, ...headers },
    body: body ?? JSON.stringify({
      tenant_code: tenant.code,
      site_code: tenant.site,
      internal_order_id: order,
      amount,
      success_url: `https://${tenant.site}.example/ok`,
      cancel_url: `https://${tenant.site}.example/cancel`
    })
  };
}

export function webhookRequest(body) {
  return { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) };
}
