#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = process.env.IAI_PAY_LOOP_OUTPUT_DIR ?? "/private/tmp/iai-pay-continuous-dev-loop";
const defaultIntervalMinutes = 10;

const activeSites = [
  {
    domain: "tranhatam.com",
    expectedD1SiteCode: "tranhatam",
    expectedTenantCode: "tranhatam",
    registrySiteCode: "TRANHATAM-WEB"
  },
  {
    domain: "omdalat.com",
    expectedD1SiteCode: "omdalat",
    expectedTenantCode: "omdalat",
    registrySiteCode: "OMDALAT-WEB"
  },
  {
    domain: "vc.vetuonglai.com",
    expectedD1SiteCode: "vc",
    expectedTenantCode: "vetuonglai",
    registrySiteCode: "VC"
  },
  {
    domain: "invest.vetuonglai.com",
    expectedD1SiteCode: "invest",
    expectedTenantCode: "vetuonglai",
    registrySiteCode: "INVEST"
  },
  {
    domain: "life.vetuonglai.com",
    expectedD1SiteCode: "life-vtl",
    expectedTenantCode: "vetuonglai",
    registrySiteCode: "LIFE-VTL"
  }
];

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  const intervalArg = process.argv.find((arg) => arg.startsWith("--interval-minutes="));
  const parsedInterval = intervalArg ? Number(intervalArg.split("=")[1]) : defaultIntervalMinutes;

  return {
    intervalMinutes: Number.isFinite(parsedInterval) && parsedInterval > 0 ? parsedInterval : defaultIntervalMinutes,
    loop: args.has("--loop")
  };
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function parseJsonArrayFromWrangler(output) {
  const text = stripAnsi(output);
  const positions = [];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "[") {
      positions.push(index);
    }
  }

  for (const index of positions.reverse()) {
    try {
      return JSON.parse(text.slice(index));
    } catch {
      // Try the next candidate bracket.
    }
  }

  return null;
}

function queryD1(command) {
  const result = run(
    "wrangler",
    ["d1", "execute", "pay-iai-one-prod", "--remote", "--json", "--command", command],
    { cwd: join(root, "pay.iai.one") }
  );
  const combined = `${result.stdout}\n${result.stderr}`;

  if (result.status !== 0) {
    return {
      error: stripAnsi(combined).trim(),
      ok: false,
      rows: []
    };
  }

  const parsed = parseJsonArrayFromWrangler(result.stdout) ?? parseJsonArrayFromWrangler(combined);
  return {
    error: parsed ? null : "Could not parse wrangler D1 JSON output.",
    ok: Boolean(parsed?.[0]?.success),
    rows: parsed?.[0]?.results ?? []
  };
}

function commandOutput(command, args, options = {}) {
  const result = run(command, args, options);
  return {
    ok: result.status === 0,
    output: stripAnsi(`${result.stdout}\n${result.stderr}`).trim(),
    status: result.status
  };
}

function checkSourceRegistries() {
  const siteRegistryPath = join(root, "apps/pay/src/site-activation-registry.ts");
  const webhookRegistryPath = join(root, "apps/pay/src/payment-webhook-tenant-registry.ts");
  const siteRegistry = readFileSync(siteRegistryPath, "utf8");
  const webhookRegistry = readFileSync(webhookRegistryPath, "utf8");

  return activeSites.map((site) => ({
    domain: site.domain,
    site_activation_registry_present:
      siteRegistry.includes(`domain: "${site.domain}"`) && siteRegistry.includes(`siteCode: "${site.registrySiteCode}"`),
    webhook_registry_present:
      webhookRegistry.includes(`tenant_code: "${site.expectedTenantCode}"`) &&
      webhookRegistry.includes(site.domain)
  }));
}

function checkSandboxCredentials() {
  const required = [
    "PAYOS_SANDBOX_CLIENT_ID",
    "PAYOS_SANDBOX_API_KEY",
    "PAYOS_SANDBOX_CHECKSUM_KEY"
  ];

  return required.map((name) => ({
    name,
    present: Boolean(process.env[name])
  }));
}

function buildPlan({ d1Ok, d1Rows, registryRows, sandboxCredentials }) {
  const missingD1 = [];
  const missingKeys = [];
  const missingWebhookRegistry = [];

  if (d1Ok) {
    for (const site of activeSites) {
      const row = d1Rows.find((item) => item.domain === site.domain);
      if (!row) {
        missingD1.push(site.domain);
        continue;
      }
      if (Number(row.keys ?? 0) < 2) {
        missingKeys.push(site.domain);
      }
    }
  }

  for (const row of registryRows) {
    if (!row.webhook_registry_present) {
      missingWebhookRegistry.push(row.domain);
    }
  }

  const missingSandbox = sandboxCredentials.filter((item) => !item.present).map((item) => item.name);

  return {
    blockers: {
      d1_query_failed: !d1Ok,
      missing_d1_site_or_tenant: missingD1,
      missing_rotation_keys: missingKeys,
      missing_sandbox_credentials: missingSandbox,
      missing_webhook_registry_entries: missingWebhookRegistry,
      payos_provider_truth: "payOS 214 remains external until sandbox credentials or KYB/business gateway clears it.",
      prod_write_permission: "Need explicit founder GO before INSERT/UPDATE on production D1."
    },
    next_actions: [
      !d1Ok
        ? "Restore D1 audit connectivity before interpreting tenant/site/key coverage."
        : missingD1.length > 0 || missingKeys.length > 0
        ? "Prepare production D1 provision SQL for founder approval; do not execute without GO."
        : "D1 ACTIVE_NOW site/key coverage is complete.",
      missingWebhookRegistry.length > 0
        ? "Collect destination webhook URLs, then patch payment-webhook-tenant-registry.ts."
        : "Webhook registry coverage is complete.",
      missingSandbox.length > 0
        ? "Wait for PAYOS_SANDBOX_CLIENT_ID, PAYOS_SANDBOX_API_KEY, PAYOS_SANDBOX_CHECKSUM_KEY."
        : "Run sandbox E2E checkout proof batch.",
      "Audit site-side checkout wiring for omdalat.com, vc.vetuonglai.com, invest.vetuonglai.com, life.vetuonglai.com once source repos are identified."
    ]
  };
}

function writeReports(snapshot) {
  mkdirSync(outputDir, { recursive: true });
  const timestamp = snapshot.generated_at.replaceAll(":", "").replaceAll(".", "");
  const jsonPath = join(outputDir, "latest.json");
  const mdPath = join(outputDir, "latest.md");
  const archiveJsonPath = join(outputDir, `${timestamp}.json`);

  writeFileSync(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  writeFileSync(archiveJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  writeFileSync(
    mdPath,
    [
      "# IAI Pay Continuous Dev Loop",
      `- Generated at: ${snapshot.generated_at}`,
      `- Repo: ${snapshot.repo.root}`,
      `- Git: ${snapshot.repo.head} (${snapshot.repo.status})`,
      `- D1 query: ${snapshot.d1.ok ? "PASS" : "FAIL"}`,
      `- Guard audit: ${snapshot.guard.ok ? "PASS" : "FAIL"}`,
      "",
      "## Missing D1 Site/Tenant",
      ...(snapshot.plan.blockers.d1_query_failed
        ? [`- not evaluated: D1 query failed (${String(snapshot.d1.error ?? "unknown error").split("\n")[0]})`]
        : snapshot.plan.blockers.missing_d1_site_or_tenant.length
        ? snapshot.plan.blockers.missing_d1_site_or_tenant.map((item) => `- ${item}`)
        : ["- none"]),
      "",
      "## Missing Webhook Registry",
      ...(snapshot.plan.blockers.missing_webhook_registry_entries.length
        ? snapshot.plan.blockers.missing_webhook_registry_entries.map((item) => `- ${item}`)
        : ["- none"]),
      "",
      "## Missing Sandbox Credentials",
      ...(snapshot.plan.blockers.missing_sandbox_credentials.length
        ? snapshot.plan.blockers.missing_sandbox_credentials.map((item) => `- ${item}`)
        : ["- none"]),
      "",
      "## Next Actions",
      ...snapshot.plan.next_actions.map((item) => `- ${item}`),
      ""
    ].join("\n"),
    "utf8"
  );

  return {
    archiveJsonPath,
    jsonPath,
    mdPath
  };
}

function runOnce() {
  const d1 = queryD1(
    "SELECT t.tenant_code, s.site_code, s.domain, s.active, COUNT(k.id) AS keys FROM merchant_sites s JOIN tenants t ON t.id = s.tenant_id LEFT JOIN service_api_keys k ON k.site_id = s.id GROUP BY t.tenant_code, s.site_code, s.domain, s.active ORDER BY t.tenant_code, s.site_code;"
  );
  const guard = commandOutput("node", ["scripts/team1-no-github-iai-one-doc-assets-check.mjs"]);
  const gitHead = commandOutput("git", ["rev-parse", "--short", "HEAD"]);
  const gitStatus = commandOutput("git", ["status", "--short", "--branch"]);
  const registryRows = checkSourceRegistries();
  const sandboxCredentials = checkSandboxCredentials();
  const plan = buildPlan({
    d1Ok: d1.ok,
    d1Rows: d1.rows,
    registryRows,
    sandboxCredentials
  });

  const snapshot = {
    active_sites: activeSites,
    d1,
    generated_at: new Date().toISOString(),
    guard,
    plan,
    registry: registryRows,
    repo: {
      head: gitHead.output,
      root,
      status: gitStatus.output
    },
    sandbox_credentials: sandboxCredentials
  };
  const paths = writeReports(snapshot);

  process.stdout.write(
    [
      `[iai-pay-loop] ${snapshot.generated_at}`,
      `[iai-pay-loop] d1=${d1.ok ? "PASS" : "FAIL"} guard=${guard.ok ? "PASS" : "FAIL"}`,
      `[iai-pay-loop] missing_d1=${plan.blockers.missing_d1_site_or_tenant.length}`,
      `[iai-pay-loop] missing_webhook_registry=${plan.blockers.missing_webhook_registry_entries.length}`,
      `[iai-pay-loop] missing_sandbox_credentials=${plan.blockers.missing_sandbox_credentials.length}`,
      `[iai-pay-loop] report=${relative(root, paths.mdPath)}`
    ].join("\n") + "\n"
  );
}

async function main() {
  const args = parseArgs();
  runOnce();

  if (!args.loop) {
    return;
  }

  const intervalMs = args.intervalMinutes * 60 * 1000;
  process.stdout.write(`[iai-pay-loop] running every ${args.intervalMinutes} minute(s)\n`);
  setInterval(runOnce, intervalMs);
}

main().catch((error) => {
  process.stderr.write(`[iai-pay-loop] failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
