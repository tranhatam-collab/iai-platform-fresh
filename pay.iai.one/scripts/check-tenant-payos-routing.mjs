import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexSource = readFileSync(resolve(root, "src/index.ts"), "utf8");
const accountSource = readFileSync(resolve(root, "src/lib/provider-account.ts"), "utf8");

const checks = [
  ["checkout resolves tenant account", /resolveTenantPayOSEnvironment\(db, env, \{/],
  ["checkout uses scoped credentials", /createPayOSCheckoutSession\(tenantProvider\.env,/],
  ["webhook uses scoped credentials", /handlePayOSWebhook\(\s*tenantProvider\.env,/],
  ["pending merchant fails closed", /PAYOS_TENANT_ACCOUNT_NOT_READY/],
  ["missing tenant credentials fail closed", /PAYOS_TENANT_CREDENTIALS_MISSING/],
  ["live mode is mandatory", /status !== "active" \|\| !liveMode \|\| !merchantReference/],
  ["secret prefix is validated", /\^\[A-Z\]\[A-Z0-9_\]\{2,48\}\$/]
];

const combined = `${indexSource}\n${accountSource}`;
const failures = checks.filter(([, pattern]) => !pattern.test(combined)).map(([label]) => label);
if (failures.length > 0) {
  console.error(`FAIL tenant PayOS routing guard: ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`PASS tenant PayOS routing guard (${checks.length}/${checks.length})`);
