import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const domain = "tramsaigon.com";
const reportPrefix = "EXT_PAY_04_TRAMSAIGON_STATUS";
const requiredProviderFields = [
  "provider_ref",
  "payment_link_id",
  "checkout_url",
  "amount",
  "currency",
  "status",
  "created_at_utc",
  "tenant_code",
  "site_code"
];
const requiredTemplates = [
  "payment_receipt",
  "checkout_status_update",
  "payment_failed_notice",
  "refund_notice"
];
const requiredOpsFields = [
  "secrets_matrix_ref",
  "runtime_env_ref",
  "merchant_ref",
  "merchant_channel_ref",
  "webhook_signature_ref"
];

function todayInTimezone(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).format(new Date());
}

function getArgValue(name, fallback = null) {
  const explicit = process.argv.find((argument) => argument.startsWith(`${name}=`));
  return explicit ? explicit.slice(name.length + 1) : fallback;
}

function shouldWriteOutputs() {
  return !process.argv.includes("--no-write");
}

function shouldExitNonZeroOnBlocked() {
  return !process.argv.includes("--status-only") && !process.argv.includes("--soft");
}

function normalize(value) {
  return String(value ?? "").trim();
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pendingStatus(value) {
  return normalize(value).toUpperCase().includes("PENDING");
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfPresent(filePath) {
  if (!(await exists(filePath))) {
    return null;
  }
  return JSON.parse(await readFile(filePath, "utf8"));
}

function providerEvidenceComplete(providerResponse) {
  return (
    isRecord(providerResponse) &&
    !pendingStatus(providerResponse._status) &&
    requiredProviderFields.every((field) => Boolean(normalize(providerResponse[field])))
  );
}

function d1EvidenceComplete(d1Readback) {
  if (!isRecord(d1Readback) || pendingStatus(d1Readback._status)) {
    return false;
  }
  return Boolean(
    normalize(
      d1Readback.payment_intent_id ||
        d1Readback.payment_session_id ||
        d1Readback.order_id ||
        d1Readback.d1_or_canonical_row_ref
    )
  );
}

function mailEvidenceComplete(mailReadback) {
  if (!isRecord(mailReadback) || pendingStatus(mailReadback._status)) {
    return false;
  }
  const sentTemplates = Array.isArray(mailReadback.templates_sent) ? mailReadback.templates_sent : [];
  return requiredTemplates.every((templateId) =>
    sentTemplates.some(
      (entry) =>
        normalize(entry.template_id || entry.template) === templateId &&
        Boolean(normalize(entry.message_id)) &&
        ["delivered", "sent", "accepted"].includes(
          normalize(entry.final_state || entry.status).toLowerCase()
        )
    )
  );
}

function opsEvidenceStatus(opsRuntimeProof) {
  if (!isRecord(opsRuntimeProof) || pendingStatus(opsRuntimeProof._status)) {
    return {
      secretsReady: false,
      signatureReady: false,
      merchantReady: false,
      fieldsPresent: false
    };
  }

  const fieldsPresent = requiredOpsFields.every((field) =>
    Boolean(normalize(opsRuntimeProof[field]))
  );

  return {
    secretsReady: opsRuntimeProof.secrets_bound === true && fieldsPresent,
    signatureReady: opsRuntimeProof.webhook_signature_verified === true && fieldsPresent,
    merchantReady: opsRuntimeProof.merchant_live_verified === true && fieldsPresent,
    fieldsPresent
  };
}

function addCheck(checks, name, pass, details) {
  checks.push({ name, pass, details });
}

async function main() {
  const date = getArgValue("--date", todayInTimezone(timezone));
  const root = process.cwd();
  const evidenceDir = path.join(root, "docs", "release-evidence", "pay.iai.one", date, domain);
  const reportDir = path.join(root, "docs", "reports", "team1");
  const checks = [];

  const files = {
    manifest: path.join(evidenceDir, "manifest.md"),
    provider: path.join(evidenceDir, "provider-response.json"),
    d1: path.join(evidenceDir, "d1-readback.json"),
    mail: path.join(evidenceDir, "mail-readback.json"),
    ops: path.join(evidenceDir, "ops-runtime-proof.json")
  };

  const evidenceFolderPresent = await exists(evidenceDir);
  addCheck(
    checks,
    "evidence_folder_present",
    evidenceFolderPresent,
    `Expected evidence folder: ${path.relative(root, evidenceDir)}`
  );

  const [manifestPresent, providerJson, d1Json, mailJson, opsJson] = await Promise.all([
    exists(files.manifest),
    readJsonIfPresent(files.provider),
    readJsonIfPresent(files.d1),
    readJsonIfPresent(files.mail),
    readJsonIfPresent(files.ops)
  ]);

  addCheck(checks, "manifest_present", manifestPresent, "manifest.md must exist.");
  addCheck(checks, "provider_response_present", Boolean(providerJson), "provider-response.json must exist.");
  addCheck(checks, "d1_readback_present", Boolean(d1Json), "d1-readback.json must exist.");
  addCheck(checks, "mail_readback_present", Boolean(mailJson), "mail-readback.json must exist.");
  addCheck(
    checks,
    "ops_runtime_proof_present",
    Boolean(opsJson),
    "ops-runtime-proof.json must exist."
  );

  const providerComplete = providerEvidenceComplete(providerJson);
  const d1Complete = d1EvidenceComplete(d1Json);
  const mailComplete = mailEvidenceComplete(mailJson);
  const opsStatus = opsEvidenceStatus(opsJson);

  addCheck(
    checks,
    "secrets_bound_confirmed",
    opsStatus.secretsReady,
    "Ops runtime proof must confirm live secrets matrix binding."
  );
  addCheck(
    checks,
    "signature_verified_confirmed",
    opsStatus.signatureReady,
    "Ops runtime proof must confirm signed webhook/callback verification."
  );
  addCheck(
    checks,
    "merchant_live_confirmed",
    opsStatus.merchantReady,
    "Ops runtime proof must confirm merchant/channel live verification."
  );
  addCheck(
    checks,
    "provider_e2e_complete",
    providerComplete,
    "provider-response.json must contain real checkout/payment fields (non-pending)."
  );
  addCheck(
    checks,
    "d1_readback_complete",
    d1Complete,
    "d1-readback.json must contain non-pending canonical row reference."
  );
  addCheck(
    checks,
    "mail_readback_complete",
    mailComplete,
    "mail-readback.json must include all 4 core templates with message_id + sent/delivered state."
  );

  const overallPass = checks.every((check) => check.pass);
  const blockerOwner = overallPass ? "NONE" : "Team Pay / Team 2 / Ops";

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    lane: "EXT-PAY-04",
    domain,
    owner: blockerOwner,
    status: overallPass ? "READY_FOR_PAYMENT_LIVE" : "BLOCKED_REAL_EVIDENCE_MISSING",
    evidenceDir: path.relative(root, evidenceDir),
    completion: {
      secretsBoundConfirmed: opsStatus.secretsReady,
      signatureVerifiedConfirmed: opsStatus.signatureReady,
      merchantLiveConfirmed: opsStatus.merchantReady,
      providerE2EComplete: providerComplete,
      d1ReadbackComplete: d1Complete,
      mailReadbackComplete: mailComplete
    },
    checks
  };

  const markdown = [
    `# ${reportPrefix}_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Lane: \`EXT-PAY-04\``,
    `- Domain: \`${domain}\``,
    `- Owner: \`${blockerOwner}\``,
    `- Status: \`${snapshot.status}\``,
    `- Evidence folder: \`${snapshot.evidenceDir}\``,
    "",
    "## Completion Matrix",
    `- secrets_bound_confirmed: ${markdownStatus(snapshot.completion.secretsBoundConfirmed)}`,
    `- signature_verified_confirmed: ${markdownStatus(snapshot.completion.signatureVerifiedConfirmed)}`,
    `- merchant_live_confirmed: ${markdownStatus(snapshot.completion.merchantLiveConfirmed)}`,
    `- provider_e2e_complete: ${markdownStatus(snapshot.completion.providerE2EComplete)}`,
    `- d1_readback_complete: ${markdownStatus(snapshot.completion.d1ReadbackComplete)}`,
    `- mail_readback_complete: ${markdownStatus(snapshot.completion.mailReadbackComplete)}`,
    "",
    "## Checks",
    ...checks.map(
      (check) =>
        `- ${markdownStatus(check.pass)} \`${check.name}\`${check.details ? ` — ${check.details}` : ""}`
    ),
    "",
    "## Next Commands",
    "- `node scripts/ext-pay-04-tramsaigon-status-check.mjs --date=YYYY-MM-DD`",
    "- `node scripts/pay-team-d-tramsaigon-evidence-check.mjs --date=YYYY-MM-DD`",
    ""
  ].join("\n");

  if (shouldWriteOutputs()) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(
      path.join(reportDir, `${reportPrefix}_${date}.json`),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      "utf8"
    );
    await writeFile(path.join(reportDir, `${reportPrefix}_${date}.md`), `${markdown}\n`, "utf8");
  }

  process.stdout.write(`${markdown}\n`);
  if (!overallPass && shouldExitNonZeroOnBlocked()) {
    process.exitCode = 1;
  }
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
