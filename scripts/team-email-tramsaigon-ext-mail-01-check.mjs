import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const domain = "tramsaigon.com";
const reportPrefix = "TEAM_EMAIL_TRAMSAIGON_EXT_MAIL_01_STATUS";
const requiredMailSecrets = [
  "EMAIL_FROM_PAY",
  "EMAIL_FROM_BILLING",
  "EMAIL_REPLY_TO_SUPPORT",
  "MAIL_API_KEY",
  "MAIL_API_WORKSPACE_ID",
  "PAY_EMAIL_ADAPTER_INTERNAL_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE_TRANSPORT",
  "SMTP_AUTH_MODE",
  "SMTP_USERNAME",
  "SMTP_PASSWORD",
  "SMTP_HELO_DOMAIN"
];
const requiredTemplates = [
  "payment_receipt",
  "checkout_status_update",
  "payment_failed_notice",
  "refund_notice"
];

function todayInTimezone(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).format(new Date());
}

function getDateArg() {
  const explicit = process.argv.find((argument) => argument.startsWith("--date="));
  if (explicit) {
    return explicit.slice("--date=".length);
  }
  return todayInTimezone(timezone);
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

async function readJsonIfExists(filePath) {
  if (!(await exists(filePath))) {
    return null;
  }
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function resolveLatestEvidenceDir(root, requestedDate) {
  const baseDir = path.join(root, "docs", "release-evidence", "pay.iai.one");
  const entries = await readdir(baseDir).catch(() => []);
  const validDates = entries
    .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry))
    .filter((entry) => entry <= requestedDate)
    .sort((left, right) => right.localeCompare(left));

  for (const date of validDates) {
    const candidate = path.join(baseDir, date, domain);
    if (await exists(candidate)) {
      return {
        date,
        absolutePath: candidate,
        relativePath: path.relative(root, candidate)
      };
    }
  }
  return null;
}

function addCheck(checks, name, pass, details) {
  checks.push({ name, pass, details });
}

function hasTemplateDelivery(mailReadback, templateId) {
  const templatesSent = Array.isArray(mailReadback?.templates_sent)
    ? mailReadback.templates_sent
    : [];
  return templatesSent.some((entry) => {
    const normalizedTemplate = normalize(entry?.template_id || entry?.template).toLowerCase();
    const finalState = normalize(entry?.final_state || entry?.status).toLowerCase();
    return (
      normalizedTemplate === templateId &&
      normalize(entry?.message_id).length > 0 &&
      ["delivered", "sent", "accepted"].includes(finalState)
    );
  });
}

function parseAllowlistProof(allowlistReadback) {
  if (!isRecord(allowlistReadback) || pendingStatus(allowlistReadback._status)) {
    return {
      pass: false,
      details: "allowlist readback is missing or still PENDING."
    };
  }

  const allowedDomains = Array.isArray(allowlistReadback.allowed_domains)
    ? allowlistReadback.allowed_domains.map((entry) => normalize(entry).toLowerCase())
    : [];
  const declaredDomain = normalize(allowlistReadback.domain).toLowerCase();
  const verificationStatus = normalize(
    allowlistReadback.verification_status || allowlistReadback.status
  ).toLowerCase();
  const domainIncluded = allowedDomains.includes(domain) || declaredDomain === domain;
  const statusVerified =
    verificationStatus.length === 0 ||
    ["verified", "active", "complete_verified"].includes(verificationStatus);

  return {
    pass: domainIncluded && statusVerified,
    details: domainIncluded
      ? statusVerified
        ? "allowlist readback includes tramsaigon.com with verified/active status."
        : `allowlist row is present but verification status is ${verificationStatus || "missing"}.`
      : "allowlist readback does not include tramsaigon.com."
  };
}

function parseStringArray(value) {
  return Array.isArray(value)
    ? value.map((entry) => normalize(entry)).filter((entry) => entry.length > 0)
    : [];
}

function parseSecretsList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => normalize(entry)).filter((entry) => entry.length > 0);
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");
  const checks = [];

  const evidenceDir = await resolveLatestEvidenceDir(root, date);
  addCheck(
    checks,
    "evidence_dir_present",
    Boolean(evidenceDir),
    evidenceDir
      ? `Using latest evidence dir <= ${date}: ${evidenceDir.relativePath}`
      : `No evidence directory found for ${domain} on or before ${date}.`
  );

  const dnsProofPath = evidenceDir
    ? path.join(evidenceDir.absolutePath, "dns-live-proof.json")
    : null;
  const secretsProofPath = evidenceDir
    ? path.join(evidenceDir.absolutePath, "secrets-live-proof.json")
    : null;
  const publicSendProofPath = evidenceDir
    ? path.join(evidenceDir.absolutePath, "public-send-guard-proof.json")
    : null;
  const mailReadbackPath = evidenceDir
    ? path.join(evidenceDir.absolutePath, "mail-readback.json")
    : null;
  const allowlistReadbackPath = evidenceDir
    ? path.join(evidenceDir.absolutePath, "mail-allowlist-readback.json")
    : null;

  const dnsProof = dnsProofPath ? await readJsonIfExists(dnsProofPath) : null;
  const secretsProof = secretsProofPath ? await readJsonIfExists(secretsProofPath) : null;
  const publicSendProof = publicSendProofPath
    ? await readJsonIfExists(publicSendProofPath)
    : null;
  const mailReadback = mailReadbackPath ? await readJsonIfExists(mailReadbackPath) : null;
  const allowlistReadback = allowlistReadbackPath
    ? await readJsonIfExists(allowlistReadbackPath)
    : null;

  const mxValues = parseStringArray(dnsProof?.mx_records);
  const rootTxtValues = parseStringArray(dnsProof?.txt_root);
  const dmarcTxtValues = parseStringArray(dnsProof?.txt_dmarc);
  const dkimValues = parseStringArray(dnsProof?.dkim_records);
  const spfPass = rootTxtValues.some((entry) => entry.toLowerCase().includes("v=spf1"));
  const dmarcPass = dmarcTxtValues.some((entry) => entry.toLowerCase().includes("v=dmarc1"));
  const dkimPass = dkimValues.some((entry) => entry.toLowerCase().includes("v=dkim1"));
  const mxPass = mxValues.length > 0;
  const dnsProofPresent = isRecord(dnsProof);

  addCheck(
    checks,
    "dns_proof_file_present",
    dnsProofPresent,
    dnsProofPresent
      ? `Using ${path.relative(root, dnsProofPath)}`
      : "dns-live-proof.json is missing."
  );
  addCheck(
    checks,
    "dns_mx_present",
    mxPass,
    mxPass ? `MX records: ${mxValues.join(", ")}` : "No MX record in dns-live-proof.json."
  );
  addCheck(
    checks,
    "dns_spf_present",
    spfPass,
    spfPass
      ? `SPF TXT: ${rootTxtValues.find((entry) => entry.toLowerCase().includes("v=spf1"))}`
      : "No SPF TXT record in dns-live-proof.json."
  );
  addCheck(
    checks,
    "dns_dmarc_present",
    dmarcPass,
    dmarcPass
      ? `DMARC TXT: ${dmarcTxtValues.find((entry) => entry.toLowerCase().includes("v=dmarc1"))}`
      : "No DMARC TXT record in dns-live-proof.json."
  );
  addCheck(
    checks,
    "dns_dkim_present",
    dkimPass,
    dkimPass
      ? `DKIM TXT entries: ${dkimValues.join(", ")}`
      : "No DKIM TXT record in dns-live-proof.json."
  );

  const allowlistProof = parseAllowlistProof(allowlistReadback);
  addCheck(checks, "allowlist_runtime_proof_present", allowlistProof.pass, allowlistProof.details);

  const productionSecretNames = parseSecretsList(secretsProof?.production_secret_names);
  const stagingSecretNames = parseSecretsList(secretsProof?.staging_secret_names);
  const productionMissing = requiredMailSecrets.filter(
    (secret) => !productionSecretNames.includes(secret)
  );
  const stagingMissing = requiredMailSecrets.filter(
    (secret) => !stagingSecretNames.includes(secret)
  );
  const secretsProofPresent = isRecord(secretsProof);
  const secretsPass =
    secretsProofPresent && productionMissing.length === 0 && stagingMissing.length === 0;
  addCheck(
    checks,
    "secrets_proof_file_present",
    secretsProofPresent,
    secretsProofPresent
      ? `Using ${path.relative(root, secretsProofPath)}`
      : "secrets-live-proof.json is missing."
  );
  addCheck(
    checks,
    "runtime_mail_secrets_bound",
    secretsPass,
    `Missing production: ${productionMissing.length > 0 ? productionMissing.join(", ") : "none"}; missing staging: ${stagingMissing.length > 0 ? stagingMissing.join(", ") : "none"}.`
  );

  const deliveryOutputPass =
    isRecord(mailReadback) &&
    !pendingStatus(mailReadback._status) &&
    requiredTemplates.every((templateId) => hasTemplateDelivery(mailReadback, templateId));
  addCheck(
    checks,
    "delivery_output_present",
    deliveryOutputPass,
    isRecord(mailReadback)
      ? pendingStatus(mailReadback._status)
        ? "mail-readback.json still marked PENDING_OWNER_EVIDENCE."
        : "mail-readback.json must include all 4 templates with message_id and delivered/sent/accepted state."
      : "mail-readback.json is missing."
  );

  const publicSendStatusCode = Number.parseInt(
    normalize(publicSendProof?.post_v1_send_status_code || publicSendProof?.status_code),
    10
  );
  const publicSendLocked = [401, 403, 405].includes(publicSendStatusCode);
  addCheck(
    checks,
    "public_send_not_open",
    publicSendLocked,
    Number.isFinite(publicSendStatusCode)
      ? `POST /v1/send status=${publicSendStatusCode}`
      : "public-send-guard-proof.json missing status code."
  );

  const dnsAuthReady = mxPass && spfPass && dkimPass && dmarcPass;
  const extMailReady =
    dnsAuthReady &&
    allowlistProof.pass &&
    secretsPass &&
    deliveryOutputPass &&
    publicSendLocked;

  const missingClusters = [];
  if (!dnsAuthReady) {
    missingClusters.push("dns_auth");
  }
  if (!allowlistProof.pass) {
    missingClusters.push("allowlist");
  }
  if (!secretsPass) {
    missingClusters.push("secrets");
  }
  if (!deliveryOutputPass) {
    missingClusters.push("delivery_output");
  }
  if (!publicSendLocked) {
    missingClusters.push("public_send_guard");
  }

  const gapClassification = extMailReady ? "NONE" : "REAL_EVIDENCE_MISSING";
  const gapReason = extMailReady
    ? "EXT-MAIL-01 evidence clusters are complete."
    : `Missing clusters: ${missingClusters.join(", ")}.`;

  const generatedAt = new Date().toISOString();
  const snapshot = {
    generatedAt,
    timezone,
    date,
    domain,
    scope: "EXT-MAIL-01",
    status: extMailReady ? "READY_FOR_LIVE_MAIL_PROOF" : "EVIDENCE_LOCKED",
    gapClassification,
    gapReason,
    extMailReady,
    dns: {
      mx: mxValues,
      txtRoot: rootTxtValues,
      txtDmarc: dmarcTxtValues,
      dkimRecords: dkimValues,
      mxPass,
      spfPass,
      dkimPass,
      dmarcPass,
      evidencePath: dnsProofPath ? path.relative(root, dnsProofPath) : null
    },
    allowlist: {
      evidencePath: allowlistReadbackPath ? path.relative(root, allowlistReadbackPath) : null,
      pass: allowlistProof.pass,
      details: allowlistProof.details
    },
    secrets: {
      evidencePath: secretsProofPath ? path.relative(root, secretsProofPath) : null,
      productionSecretNames,
      stagingSecretNames,
      productionMissing,
      stagingMissing,
      requiredNames: requiredMailSecrets
    },
    delivery: {
      evidencePath: mailReadbackPath ? path.relative(root, mailReadbackPath) : null,
      pass: deliveryOutputPass,
      requiredTemplates
    },
    publicSendGuard: {
      evidencePath: publicSendProofPath ? path.relative(root, publicSendProofPath) : null,
      statusCode: Number.isFinite(publicSendStatusCode) ? publicSendStatusCode : null,
      pass: publicSendLocked
    },
    sources: {
      evidenceDir: evidenceDir?.relativePath ?? null
    },
    checks,
    overallPass: checks.every((check) => check.pass)
  };

  const outputJsonPath = path.join(reportDir, `${reportPrefix}_${date}.json`);
  const outputMdPath = path.join(reportDir, `${reportPrefix}_${date}.md`);
  const markdown = [
    `# ${reportPrefix}_${date}`,
    `- Generated at: ${generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Domain: \`${domain}\``,
    `- Scope: \`EXT-MAIL-01\``,
    `- Status: \`${snapshot.status}\``,
    `- Gap classification: \`${gapClassification}\``,
    `- Gap reason: ${gapReason}`,
    `- EXT-MAIL-01 ready: ${markdownStatus(extMailReady)}`,
    `- Evidence dir: ${evidenceDir ? `\`${evidenceDir.relativePath}\`` : "`MISSING`"}`,
    "",
    "## Checks",
    ...checks.map(
      (check) =>
        `- ${markdownStatus(check.pass)} \`${check.name}\`${check.details ? ` — ${check.details}` : ""}`
    ),
    "",
    "## Cluster Summary",
    `- DNS auth cluster (MX + SPF + DKIM + DMARC): ${markdownStatus(dnsAuthReady)}`,
    `- Allowlist runtime proof: ${markdownStatus(allowlistProof.pass)}`,
    `- Runtime secrets bound (production + staging): ${markdownStatus(secretsPass)}`,
    `- Delivery output (4 templates with message_id + final_state): ${markdownStatus(deliveryOutputPass)}`,
    `- Public /v1/send guard: ${markdownStatus(publicSendLocked)}`,
    "",
    "## Next commands",
    `- \`pnpm report:tramsaigon-ext-mail-01 -- --date=${date}\``,
    `- \`dig +short MX ${domain}\``,
    `- \`dig +short TXT ${domain}\``,
    `- \`dig +short TXT _dmarc.${domain}\``,
    `- \`wrangler secret list --config pay.iai.one/wrangler.jsonc --env production\``,
    `- \`wrangler secret list --config pay.iai.one/wrangler.jsonc --env staging\``,
    ""
  ].join("\n");

  if (shouldWriteOutputs()) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    await writeFile(outputMdPath, `${markdown}\n`, "utf8");
  }

  process.stdout.write(
    [
      `Tramsaigon EXT-MAIL-01 status generated for ${date}.`,
      `EXT-MAIL-01 ready: ${extMailReady ? "PASS" : "FAIL"}.`,
      `JSON: ${path.relative(root, outputJsonPath)}`,
      `MD: ${path.relative(root, outputMdPath)}`
    ].join("\n")
  );

  if (!extMailReady) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(
    `tramsaigon ext-mail-01 checker failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
