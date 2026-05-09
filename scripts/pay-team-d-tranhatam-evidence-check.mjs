import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const requiredMailboxes = [
  "pay@tranhatam.com",
  "billing@tranhatam.com",
  "support@tranhatam.com",
  "noreply@tranhatam.com"
];
const requiredRuntimeBindings = [
  "MAIL_API_BASE_URL",
  "MAIL_API_KEY",
  "MAIL_API_WORKSPACE_ID",
  "PAY_EMAIL_ADAPTER_INTERNAL_KEY"
];
const requiredProofFields = [
  "provider_ref",
  "checkout_or_payment_session_ref",
  "mail_message_id",
  "d1_or_canonical_row_ref",
  "inbox_proof_ref"
];

function todayInTimezone(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date());
}

function getDateArg() {
  const explicit = process.argv.find((argument) => argument.startsWith("--date="));
  return explicit ? explicit.slice("--date=".length) : todayInTimezone(timezone);
}

function shouldWriteOutputs() {
  return !process.argv.includes("--no-write");
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalize(value) {
  return String(value ?? "").trim();
}

function readGateState(gateMarkdown) {
  if (!gateMarkdown) {
    return "MISSING";
  }

  const gateDecision = gateMarkdown.match(/- Gate decision:\s*([^\n]+)/)?.[1]?.trim();
  const verdict = gateMarkdown.match(/- Verdict:\s*`([^`]+)`/)?.[1]?.trim();
  return gateDecision || verdict || "UNKNOWN";
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveDatedFile(root, relativeDir, prefix, extension, requestedDate) {
  const absoluteDir = path.join(root, relativeDir);
  const entries = await readdir(absoluteDir).catch(() => []);
  const pattern = new RegExp(
    `^${escapeRegex(prefix)}_(\\d{4}-\\d{2}-\\d{2})\\.${escapeRegex(extension)}$`
  );
  const dates = entries
    .flatMap((entry) => {
      const match = pattern.exec(entry);
      return match ? [match[1]] : [];
    })
    .sort((left, right) => right.localeCompare(left));

  if (dates.length === 0) {
    return null;
  }

  const selectedDate = dates.find((entryDate) => entryDate <= requestedDate) ?? dates[0];
  const absolutePath = path.join(absoluteDir, `${prefix}_${selectedDate}.${extension}`);
  const raw = await readFile(absolutePath, "utf8");

  return {
    absolutePath,
    date: selectedDate,
    raw,
    relativePath: path.relative(root, absolutePath)
  };
}

function isGateLocked(gateState) {
  return gateState === "MISSING" || gateState.includes("LOCK_RETAINED");
}

function findMailbox(evidence, address) {
  return Array.isArray(evidence.mailboxes)
    ? evidence.mailboxes.find((mailbox) => normalize(mailbox.address).toLowerCase() === address)
    : null;
}

export function validateTranhatamEvidence({ evidence, payGateState = "MISSING" }) {
  const checks = [];
  const addCheck = (name, pass, details) => {
    checks.push({ name, pass, details });
  };

  const evidenceIsRecord = isRecord(evidence);
  addCheck(
    "evidence_json_object",
    evidenceIsRecord,
    evidenceIsRecord ? "Evidence is a JSON object." : "Evidence must be a JSON object."
  );

  if (!evidenceIsRecord) {
    return {
      activationEvidenceComplete: false,
      checks,
      liveClaimBlocked: true,
      overallPass: false,
      payGateLocked: isGateLocked(payGateState),
      payGateState
    };
  }

  addCheck(
    "domain_locked_to_tranhatam",
    evidence.domain === "tranhatam.com",
    evidence.domain === "tranhatam.com"
      ? "Domain is locked to tranhatam.com."
      : "Evidence domain must be tranhatam.com."
  );
  addCheck(
    "intake_row_locked",
    evidence.intake_id === "SITE-INTAKE-100",
    evidence.intake_id === "SITE-INTAKE-100"
      ? "Intake row is SITE-INTAKE-100."
      : "Evidence must refer to SITE-INTAKE-100."
  );

  const mailboxResults = requiredMailboxes.map((address) => {
    const mailbox = findMailbox(evidence, address);
    const present = Boolean(mailbox);
    const bindingConfirmed = normalize(mailbox?.binding_status) === "CONFIRMED";
    const inboundConfirmed = normalize(mailbox?.inbound_routing_status) === "CONFIRMED";
    const inboxProofPresent = Boolean(normalize(mailbox?.inbox_proof_ref));

    return {
      address,
      bindingConfirmed,
      inboundConfirmed,
      inboxProofPresent,
      present
    };
  });
  const missingMailboxEvidence = mailboxResults
    .filter((mailbox) => !mailbox.present || !mailbox.bindingConfirmed || !mailbox.inboundConfirmed || !mailbox.inboxProofPresent)
    .map((mailbox) => ({
      address: mailbox.address,
      missing: {
        row: !mailbox.present,
        binding: !mailbox.bindingConfirmed,
        inboundRouting: !mailbox.inboundConfirmed,
        inboxProof: !mailbox.inboxProofPresent
      }
    }));
  addCheck(
    "required_mailboxes_present",
    mailboxResults.every((mailbox) => mailbox.present),
    mailboxResults.every((mailbox) => mailbox.present)
      ? "All required tranhatam.com mailbox identities are represented."
      : `Missing mailboxes: ${mailboxResults
          .filter((mailbox) => !mailbox.present)
          .map((mailbox) => mailbox.address)
          .join(", ")}`
  );

  const senderPolicy = isRecord(evidence.sender_policy) ? evidence.sender_policy : {};
  addCheck(
    "sender_policy_locked",
    senderPolicy.payment_receipt === "pay@tranhatam.com" &&
      senderPolicy.checkout_status_update === "billing@tranhatam.com" &&
      senderPolicy.payment_failed_notice === "billing@tranhatam.com" &&
      senderPolicy.refund_notice === "billing@tranhatam.com" &&
      senderPolicy.reply_to === "support@tranhatam.com" &&
      senderPolicy.noreply_payment_sender_allowed === false,
    "Sender policy must keep receipts on pay@, billing/refund/failure on billing@, reply-to on support@, and forbid noreply as payment sender."
  );

  const internationalGateway = isRecord(evidence.international_gateway)
    ? evidence.international_gateway
    : {};
  const internationalPolicy = isRecord(internationalGateway.currency_policy_when_id_country_present)
    ? internationalGateway.currency_policy_when_id_country_present
    : {};
  addCheck(
    "international_gateway_locked",
    internationalGateway.vnd_primary_receiver === "recv_vnd_personal_tranhatam_acb" &&
      internationalGateway.vnd_fallback_receiver === "recv_vnd_personal_tranhatam_vcb" &&
      internationalGateway.usd_primary_receiver === "recv_usd_personal_tranhatam_paypal" &&
      normalize(internationalGateway.usd_provider).toLowerCase() === "paypal" &&
      internationalPolicy.VN === "VND_REQUIRED" &&
      internationalPolicy.NON_VN === "USD_REQUIRED",
    "International gateway lock must keep tranhatam.com dual-rail mapping and id_country currency policy."
  );

  const runtimeBindings = isRecord(evidence.runtime_bindings) ? evidence.runtime_bindings : {};
  const runtimeResults = requiredRuntimeBindings.map((bindingName) => {
    const binding = runtimeBindings[bindingName];
    const present = isRecord(binding);
    const confirmed = present && normalize(binding.status) === "CONFIRMED";
    const valueRefPresent =
      present &&
      (bindingName === "MAIL_API_KEY" || bindingName === "PAY_EMAIL_ADAPTER_INTERNAL_KEY"
        ? normalize(binding.value_ref) === "secure_channel_confirmed"
        : Boolean(normalize(binding.value_ref)));

    return {
      bindingName,
      confirmed,
      present,
      valueRefPresent
    };
  });
  const missingRuntimeEvidence = runtimeResults
    .filter((binding) => !binding.present || !binding.confirmed || !binding.valueRefPresent)
    .map((binding) => ({
      bindingName: binding.bindingName,
      missing: {
        row: !binding.present,
        confirmedStatus: !binding.confirmed,
        valueRef: !binding.valueRefPresent
      }
    }));
  addCheck(
    "runtime_bindings_represented",
    runtimeResults.every((binding) => binding.present),
    runtimeResults.every((binding) => binding.present)
      ? "All required runtime bindings are represented."
      : `Missing runtime bindings: ${runtimeResults
          .filter((binding) => !binding.present)
          .map((binding) => binding.bindingName)
          .join(", ")}`
  );

  const paymentProof = isRecord(evidence.payment_proof) ? evidence.payment_proof : {};
  const proofResults = requiredProofFields.map((field) => ({
    field,
    present: Boolean(normalize(paymentProof[field]))
  }));
  const missingPaymentProofFields = proofResults
    .filter((proof) => !proof.present)
    .map((proof) => proof.field);
  addCheck(
    "payment_proof_fields_represented",
    requiredProofFields.every((field) => Object.hasOwn(paymentProof, field)),
    requiredProofFields.every((field) => Object.hasOwn(paymentProof, field))
      ? "All required payment proof fields are represented."
      : `Missing proof fields: ${requiredProofFields
          .filter((field) => !Object.hasOwn(paymentProof, field))
          .join(", ")}`
  );

  const payGateLocked = isGateLocked(payGateState);
  const mailboxEvidenceComplete = mailboxResults.every(
    (mailbox) =>
      mailbox.present &&
      mailbox.bindingConfirmed &&
      mailbox.inboundConfirmed &&
      mailbox.inboxProofPresent
  );
  const runtimeEvidenceComplete = runtimeResults.every(
    (binding) => binding.present && binding.confirmed && binding.valueRefPresent
  );
  const paymentEvidenceComplete = proofResults.every((proof) => proof.present);
  const activationEvidenceComplete =
    mailboxEvidenceComplete && runtimeEvidenceComplete && paymentEvidenceComplete;
  const evidenceStatus = normalize(evidence.status);
  const liveClaimed = evidenceStatus === "READY_FOR_LIVE" || evidenceStatus === "LIVE";
  const liveClaimBlocked = payGateLocked || !activationEvidenceComplete;
  const status = payGateLocked
    ? evidenceStatus
    : activationEvidenceComplete
      ? "READY_FOR_LIVE"
      : "PROOF_CHAIN_COMPLETE_EVIDENCE_PENDING";
  const gapClassification =
    activationEvidenceComplete && !payGateLocked
      ? "NONE"
      : "REAL_EVIDENCE_MISSING";
  const gapReason =
    activationEvidenceComplete && !payGateLocked
      ? "Team D activation evidence is complete and gate is unlocked."
      : payGateLocked
        ? "Pay gate remains locked or retained; activation cannot be promoted."
        : "Activation evidence fields are still incomplete.";

  addCheck(
    "no_ready_for_live_while_gate_locked_or_evidence_missing",
    !(liveClaimed && liveClaimBlocked),
    liveClaimed && liveClaimBlocked
      ? "Evidence overclaims live readiness while gate is locked or evidence is incomplete."
      : "Evidence does not claim live readiness before gate and evidence are complete."
  );

  return {
    activationEvidenceComplete,
    checks,
    evidenceStatus,
    gapClassification,
    gapReason,
    liveClaimBlocked,
    mailboxEvidenceComplete,
    mailboxResults,
    missingMailboxEvidence,
    missingPaymentProofFields,
    missingRuntimeEvidence,
    overallPass: checks.every((check) => check.pass),
    paymentEvidenceComplete,
    payGateLocked,
    payGateState,
    runtimeResults,
    runtimeEvidenceComplete,
    status
  };
}

async function main() {
  const date = getDateArg();
  const writeOutputs = shouldWriteOutputs();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "teamd");
  const [evidenceFile, team1GateFile, fallbackGateFile] = await Promise.all([
    resolveDatedFile(
      root,
      "docs/reports/teamd",
      "TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE",
      "json",
      date
    ),
    resolveDatedFile(root, "docs/reports/team1", "TEAM1_PAY_PROD_GATE_STATUS", "md", date),
    resolveDatedFile(root, "docs/reports/team1", "PAY_IAI_ONE_GATE_VERDICT", "md", date)
  ]);
  if (!evidenceFile) {
    throw new Error(`No Team D evidence file found on or before ${date}.`);
  }

  const gateFile = team1GateFile ?? fallbackGateFile;
  const evidence = JSON.parse(evidenceFile.raw);
  const payGateState = readGateState(gateFile?.raw ?? null);
  const validation = validateTranhatamEvidence({ evidence, payGateState });
  const generatedAt = new Date().toISOString();
  const snapshot = {
    generatedAt,
    timezone,
    date,
    evidencePath: evidenceFile.relativePath,
    gatePath: gateFile?.relativePath ?? "docs/reports/team1/<missing-pay-gate-source>.md",
    ...validation
  };
  const markdown = [
    `# TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_${date}`,
    `- Generated at: ${generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Evidence source: \`${snapshot.evidencePath}\``,
    `- Gate source: \`${snapshot.gatePath}\``,
    `- Pay gate state: \`${payGateState}\``,
    `- Evidence status: \`${validation.status}\``,
    `- Activation evidence complete: ${markdownStatus(validation.activationEvidenceComplete)}`,
    `- Live claim blocked: ${markdownStatus(validation.liveClaimBlocked)}`,
    `- Overall checker pass: ${markdownStatus(validation.overallPass)}`,
    "",
    "## Checks",
    ...validation.checks.map(
      (check) =>
        `- ${markdownStatus(check.pass)} \`${check.name}\`${check.details ? ` — ${check.details}` : ""}`
    ),
    "",
    "## Completion Breakdown",
    `- mailbox evidence complete: ${markdownStatus(validation.mailboxEvidenceComplete)}`,
    `- runtime evidence complete: ${markdownStatus(validation.runtimeEvidenceComplete)}`,
    `- payment proof complete: ${markdownStatus(validation.paymentEvidenceComplete)}`,
    `- pay gate locked: ${markdownStatus(validation.payGateLocked)}`,
    `- gap classification: \`${validation.gapClassification}\``,
    `- gap reason: ${validation.gapReason}`,
    `- missing mailbox evidence rows: ${validation.missingMailboxEvidence.length}`,
    `- missing runtime evidence rows: ${validation.missingRuntimeEvidence.length}`,
    `- missing payment proof fields: ${
      validation.missingPaymentProofFields.length > 0
        ? validation.missingPaymentProofFields.join(", ")
        : "none"
    }`,
    "",
    "## Missing Mailbox Evidence",
    ...(validation.missingMailboxEvidence.length === 0
      ? ["- none"]
      : validation.missingMailboxEvidence.map(
          (entry) =>
            `- ${entry.address}: row=${entry.missing.row ? "missing" : "ok"}, binding=${entry.missing.binding ? "missing" : "ok"}, inbound=${entry.missing.inboundRouting ? "missing" : "ok"}, inbox_proof=${entry.missing.inboxProof ? "missing" : "ok"}`
        )),
    "",
    "## Missing Runtime Evidence",
    ...(validation.missingRuntimeEvidence.length === 0
      ? ["- none"]
      : validation.missingRuntimeEvidence.map(
          (entry) =>
            `- ${entry.bindingName}: row=${entry.missing.row ? "missing" : "ok"}, confirmed_status=${entry.missing.confirmedStatus ? "missing" : "ok"}, value_ref=${entry.missing.valueRef ? "missing" : "ok"}`
        )),
    ""
  ].join("\n");

  if (writeOutputs) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(
      path.join(reportDir, `TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_${date}.json`),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      "utf8"
    );
    await writeFile(
      path.join(reportDir, `TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_${date}.md`),
      `${markdown}\n`,
      "utf8"
    );
  }

  process.stdout.write(`${markdown}\n`);

  if (!validation.overallPass) {
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
