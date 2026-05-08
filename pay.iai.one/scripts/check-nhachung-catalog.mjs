import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const catalogPath = resolve(root, "config/nhachung-catalog.json");

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

assert.equal(catalog.contract_version, "2026-05-09");
assert.equal(catalog.tenant_code, "nhachung");
assert.equal(catalog.site_code, "nhachung-app");
assert.equal(catalog.checkout_provider_policy.live_provider, "payos");
assert.equal(catalog.checkout_provider_policy.live_currency, "VND");
assert.equal(catalog.checkout_provider_policy.subscription_status, "planned_not_live");

const expectedSkus = {
  nc_starter: { tier: "starter", monthly_usd_cents: 500 },
  nc_builder: { tier: "builder", monthly_usd_cents: 1900 },
  nc_pro: { tier: "pro", monthly_usd_cents: 4900 },
  nc_master: { tier: "master", monthly_usd_cents: 9900 }
};

assert.deepEqual(Object.keys(catalog.skus).sort(), Object.keys(expectedSkus).sort());

for (const [sku, expected] of Object.entries(expectedSkus)) {
  const item = catalog.skus[sku];
  assert.equal(item.sku, sku);
  assert.equal(item.tier, expected.tier);
  assert.equal(item.monthly_usd_cents, expected.monthly_usd_cents);
  assert.equal(item.annual_usd_cents, expected.monthly_usd_cents * 10);
  assert.equal(item.points_per_usd, 2);
  assert.equal(item.public_financial_promise, false);
  assert.ok(Array.isArray(item.entitlements));
  assert.ok(item.entitlements.length >= 2);
}

assert.deepEqual(catalog.webhook_events, [
  "checkout.completed",
  "subscription.renewed",
  "subscription.cancelled",
  "refund"
]);

assert.equal(catalog.webhook_destination.url, "https://app.nhachung.org/api/payment-webhook");
assert.equal(catalog.webhook_destination.signature_header, "X-Signature");
assert.equal(catalog.webhook_destination.timestamp_header, "X-Timestamp");
assert.equal(catalog.webhook_destination.secret_runtime_key, "PAY_NHACHUNG_HMAC");

console.log("NHACHUNG_CATALOG_CONTRACT_PASS");
