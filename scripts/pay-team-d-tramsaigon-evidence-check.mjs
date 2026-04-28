import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const domain = "tramsaigon.com";
const reportPrefix = "TRAMSAIGON_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS";
const requiredJsonFiles = ["provider-response.json", "d1-readback.json", "mail-readback.json"];
const requiredArtifactGroups = [
  {
    name: "checkout_screenshot",
    completeFile: "checkout-screenshot.png",
    pendingFile: "checkout-screenshot.png.PENDING.txt"
  },
  {
    name: "mailbox_inbox_proof",
    completeFile: "inbox-proof-pay@tramsaigon.com.eml",
    pendingFile: "inbox-proof-pay@tramsaigon.com.eml.PENDING.txt"
  },
  {
    name: "customer_gmail_proof",
    completeFile: "inbox-proof-customer-gmail.png",
    pendingFile: "inbox-proof-customer-gmail.png.PENDING.txt"
  }
];
const requiredTemplates = [
  "payment_receipt",
  "checkout_status_update",
  "payment_failed_notice",
  "refund_notice"
];
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

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function normalize(value) {
  return String(value ?? "").trim();
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

async function readJsonFile(filePath) {
  const body = await readFile(filePath, "utf8");
  return JSON.parse(body);
}

function manifestStatus(manifestBody) {
  return (
    manifestBody.match(/- Status:\s*\*\*([^*]+)\*\*/)?.[1]?.trim() ||
    manifestBody.match(/status:\s*([^\n]+)/i)?.[1]?.trim() ||
    "UNKNOWN"
  );
}

function manifestClaimsLive(manifestBody) {
  const status = manifestStatus(manifestBody).toUpperCase();
  return status.includes("READY_FOR_LIVE") || status === "LIVE";
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

  const rowRef =
    d1Readback.payment_intent_id ||
    d1Readback.payment_session_id ||
    d1Readback.order_id ||
    d1Readback.d1_or_canonical_row_ref;
  return Boolean(normalize(rowRef));
}

function mailEvidenceComplete(mailReadback) {
  if (!isRecord(mailReadback) || pendingStatus(mailReadback._status)) {
    return false;
  }

  const sentTemplates = Array.isArray(mailReadback.templates_sent)
    ? mailReadback.templates_sent
    : [];
  return requiredTemplates.every((templateId) =>
    sentTemplates.some(
      (template) =>
        normalize(template.template_id || template.template) === templateId &&
        Boolean(normalize(template.message_id)) &&
        ["delivered", "sent", "accepted"].includes(
          normalize(template.final_state || template.status).toLowerCase()
        )
    )
  );
}

async function classifyArtifactGroup(evidenceDir, group) {
  const completePath = path.join(evidenceDir, group.completeFile);
  const pendingPath = path.join(evidenceDir, group.pendingFile);
  const complete = await exists(completePath);
  const pending = await exists(pendingPath);
  return {
    ...group,
    complete,
    pending,
    represented: complete || pending,
    status: complete ? "COMPLETE" : pending ? "PENDING" : "MISSING"
  };
}

function addCheck(checks, name, pass, details) {
  checks.push({ name, pass, details });
}

async function main() {
  const date = getArgValue("--date", todayInTimezone(timezone));
  const root = process.cwd();
  const evidenceDir = path.join(
    root,
    "docs",
    "release-evidence",
    "pay.iai.one",
    date,
    domain
  );
  const reportDir = path.join(root, "docs", "reports", "teamd");
  const manifestPath = path.join(evidenceDir, "manifest.md");
  const checks = [];

  const evidenceFolderPresent = await exists(evidenceDir);
  addCheck(
    checks,
    "evidence_folder_present",
    evidenceFolderPresent,
    `Expected evidence folder: ${path.relative(root, evidenceDir)}`
  );

  const manifestPresent = await exists(manifestPath);
  addCheck(
    checks,
    "manifest_present",
    manifestPresent,
    `Expected manifest: ${path.relative(root, manifestPath)}`
  );

  const manifestBody = manifestPresent ? await readFile(manifestPath, "utf8") : "";
  const manifestDomainLocked = manifestBody.includes("tramsaigon.com");
  addCheck(
    checks,
    "manifest_domain_locked",
    manifestDomainLocked,
    "Manifest must stay locked to tramsaigon.com."
  );

  const jsonReadbacks = {};
  for (const fileName of requiredJsonFiles) {
    const filePath = path.join(evidenceDir, fileName);
    const present = await exists(filePath);
    addCheck(checks, `${fileName}_present`, present, `Expected ${fileName}.`);
    if (present) {
      jsonReadbacks[fileName] = await readJsonFile(filePath);
    }
  }

  const artifactGroups = await Promise.all(
    requiredArtifactGroups.map((group) => classifyArtifactGroup(evidenceDir, group))
  );
  for (const artifact of artifactGroups) {
    addCheck(
      checks,
      `${artifact.name}_represented`,
      artifact.represented,
      `${artifact.completeFile} or ${artifact.pendingFile} must exist.`
    );
  }

  const providerComplete = providerEvidenceComplete(jsonReadbacks["provider-response.json"]);
  const d1Complete = d1EvidenceComplete(jsonReadbacks["d1-readback.json"]);
  const mailComplete = mailEvidenceComplete(jsonReadbacks["mail-readback.json"]);
  const artifactsComplete = artifactGroups.every((artifact) => artifact.complete);
  const activationEvidenceComplete =
    providerComplete && d1Complete && mailComplete && artifactsComplete;
  const liveClaimBlocked = !activationEvidenceComplete;
  const liveOverclaimed = manifestClaimsLive(manifestBody) && liveClaimBlocked;

  addCheck(
    checks,
    "no_ready_for_live_while_evidence_missing",
    !liveOverclaimed,
    liveOverclaimed
      ? "Manifest claims live readiness before all provider/mail/D1/inbox evidence is complete."
      : "Manifest does not claim live readiness before evidence is complete."
  );

  const generatedAt = new Date().toISOString();
  const snapshot = {
    generatedAt,
    timezone,
    date,
    domain,
    evidenceDir: path.relative(root, evidenceDir),
    manifestStatus: manifestStatus(manifestBody),
    activationEvidenceComplete,
    liveClaimBlocked,
    overallPass: checks.every((check) => check.pass),
    providerEvidenceComplete: providerComplete,
    d1EvidenceComplete: d1Complete,
    mailEvidenceComplete: mailComplete,
    artifactEvidenceComplete: artifactsComplete,
    artifactGroups,
    checks
  };

  const markdown = [
    `# ${reportPrefix}_${date}`,
    `- Generated at: ${generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Domain: \`${domain}\``,
    `- Evidence folder: \`${snapshot.evidenceDir}\``,
    `- Manifest status: \`${snapshot.manifestStatus}\``,
    `- Activation evidence complete: ${markdownStatus(activationEvidenceComplete)}`,
    `- Live claim blocked: ${markdownStatus(liveClaimBlocked)}`,
    `- Overall checker pass: ${markdownStatus(snapshot.overallPass)}`,
    "",
    "## Checks",
    ...checks.map(
      (check) =>
        `- ${markdownStatus(check.pass)} \`${check.name}\`${check.details ? ` — ${check.details}` : ""}`
    ),
    "",
    "## Completion Breakdown",
    `- provider evidence complete: ${markdownStatus(providerComplete)}`,
    `- D1 evidence complete: ${markdownStatus(d1Complete)}`,
    `- mail evidence complete: ${markdownStatus(mailComplete)}`,
    `- file artifact evidence complete: ${markdownStatus(artifactsComplete)}`,
    ...artifactGroups.map(
      (artifact) => `- ${artifact.name}: \`${artifact.status}\``
    ),
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

  if (!snapshot.overallPass) {
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
