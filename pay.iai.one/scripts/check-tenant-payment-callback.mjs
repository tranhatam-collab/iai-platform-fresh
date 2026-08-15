import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sources = [
  "src/index.ts",
  "src/lib/provider-account.ts",
  "src/lib/tenant-payment-callback.ts",
  "src/lib/db.ts"
].map((file) => readFileSync(resolve(root, file), "utf8")).join("\n");

const checks = [
  ["callback URL comes from merchant site", /configuredCallbackUrl = stringValue\(site\.callback_url\)/],
  ["unregistered callback fails closed", /TENANT_CALLBACK_NOT_READY/],
  ["tenant callback secret is scoped", /env\[`\$\{prefix\}_CALLBACK_HMAC`\]/],
  ["missing callback secret fails closed", /TENANT_CALLBACK_SECRET_MISSING/],
  ["callback uses HMAC SHA-256", /hmacSha256Hex\(input\.callbackHmac, rawBody\)/],
  ["callback sends signature header", /"x-iai-signature": signature/],
  ["callback sends idempotency header", /"x-idempotency-key": `pay:\$\{input\.providerEventId\}`/],
  ["paid event dispatches generic callback", /dispatchTenantPaymentCallback\(\{/],
  ["delivery failure remains retryable", /TENANT_CALLBACK_DELIVERY_FAILED/],
  ["merchant site query reads configured callback", /SELECT id, site_code, domain, allowed_origin, callback_url FROM merchant_sites/]
];

const failures = checks.filter(([, pattern]) => !pattern.test(sources)).map(([label]) => label);
if (failures.length > 0) {
  console.error(`FAIL tenant payment callback guard: ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`PASS tenant payment callback guard (${checks.length}/${checks.length})`);
