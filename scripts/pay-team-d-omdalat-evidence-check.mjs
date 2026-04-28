import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const requiredMailboxes = [
  "pay@omdalat.com",
  "billing@omdalat.com",
  "support@omdalat.com",
  "noreply@omdalat.com"
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
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).format(new Date());
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

  return (
    gateMarkdown.match(/- Gate decision:\s*([^\n]+)/)?.[1]?.trim() ||
    gateMarkdown.match(/- Verdict:\s*`([^`]+)`/)?.[1]?.trim() ||
    "UNKNOWN"
  );
}

function isGateLocked(gateState) {
  return gateState === "MISSING" || gateState.includes("LOCK_RETAINED");
}

function hasMailbox(evidence, address) {
  return Array.isArray(evidence.mailboxes)
    ? evidence.mailboxes.find((mailbox) => normalize(mailbox.address).toLowerCase() === address)
    : null;
}

export function validateOmdalatEvidence({ evidence, payGateState = "MISSING" }) {
  const checks = [];
  const addCheck = (name, pass, details) => checks.push({ name, pass, details });

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
    "domain_locked_to_omdalat",
    evidence.domain === "omdalat.com",
    "Evidence domain must be omdalat.com."
  );
  addCheck(
    "intake_row_locked",
    evidence.intake_id === "SITE-INTAKE-104",
    "Evidence must refer to SITE-INTAKE-104."
  );
  addCheck(
    "legal_owner_locked_to_thai_lam",
    evidence.legal_owner === "Công ty TNHH SX - TM - DV Thai Lam" &&
      evidence.owner_type === "company",
    "Legal owner must be locked to Công ty TNHH SX - TM - DV Thai Lam."
  );
  addCheck(
    "receiver_locked_to_thai_lam_acb",
    isRecord(evidence.receiver_assignment) &&
      evidence.receiver_assignment.assignment_status === "ACTIVE_NOW" &&
      evidence.receiver_assignment.primary_vnd_receiver_id === "recv_vnd_thailam_acb",
    "Receiver assignment must be ACTIVE_NOW with recv_vnd_thailam_acb."
  );

  const mailboxResults = requiredMailboxes.map((address) => {
    const mailbox = hasMailbox(evidence, address);
    return {
      address,
      bindingConfirmed: normalize(mailbox?.binding_status) === "CONFIRMED",
      inboundConfirmed: normalize(mailbox?.inbound_routing_status) === "CONFIRMED",
      inboxProofPresent: Boolean(normalize(mailbox?.inbox_proof_ref)),
      present: Boolean(mailbox)
    };
  });
  addCheck(
    "required_mailboxes_present",
    mailboxResults.every((mailbox) => mailbox.present),
    mailboxResults.every((mailbox) => mailbox.present)
      ? "All required omdalat.com mailbox identities are represented."
      : `Missing mailboxes: ${mailboxResults
          .filter((mailbox) => !mailbox.present)
          .map((mailbox) => mailbox.address)
          .join(", ")}`
  );

  const senderPolicy = isRecord(evidence.sender_policy) ? evidence.sender_policy : {};
  addCheck(
    "sender_policy_locked",
    senderPolicy.payment_receipt === "pay@omdalat.com" &&
      senderPolicy.checkout_status_update === "billing@omdalat.com" &&
      senderPolicy.payment_failed_notice === "billing@omdalat.com" &&
      senderPolicy.refund_notice === "billing@omdalat.com" &&
      senderPolicy.reply_to === "support@omdalat.com" &&
      senderPolicy.noreply_payment_sender_allowed === false,
    "Sender policy must use pay@, billing@, support@, and forbid noreply as payment sender."
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

    return { bindingName, confirmed, present, valueRefPresent };
  });
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
  addCheck(
    "payment_proof_fields_represented",
    requiredProofFields.every((field) => Object.hasOwn(paymentProof, field)),
    "Provider ref, checkout/session ref, messageId, D1/canonical row, and inbox proof fields must be represented."
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
  const status = normalize(evidence.status);
  const liveClaimed = status === "READY_FOR_LIVE" || status === "LIVE";
  const liveClaimBlocked = payGateLocked || !activationEvidenceComplete;

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
    liveClaimBlocked,
    mailboxEvidenceComplete,
    overallPass: checks.every((check) => check.pass),
    paymentEvidenceComplete,
    payGateLocked,
    payGateState,
    runtimeEvidenceComplete,
    status
  };
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "teamd");
  const evidencePath = path.join(reportDir, `OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_${date}.json`);
  const team1GatePath = path.join(
    root,
    "docs",
    "reports",
    "team1",
    `TEAM1_PAY_PROD_GATE_STATUS_${date}.md`
  );
  const fallbackGatePath = path.join(
    root,
    "docs",
    "reports",
    "team1",
    `PAY_IAI_ONE_GATE_VERDICT_${date}.md`
  );
  const [evidenceBody, gateBody, fallbackGateBody] = await Promise.all([
    readFile(evidencePath, "utf8"),
    readFile(team1GatePath, "utf8").catch(() => null),
    readFile(fallbackGatePath, "utf8").catch(() => null)
  ]);
  const payGateState = readGateState(gateBody ?? fallbackGateBody);
  const validation = validateOmdalatEvidence({
    evidence: JSON.parse(evidenceBody),
    payGateState
  });
  const generatedAt = new Date().toISOString();
  const snapshot = {
    generatedAt,
    timezone,
    date,
    evidencePath: path.relative(root, evidencePath),
    gatePath: path.relative(root, gateBody ? team1GatePath : fallbackGatePath),
    ...validation
  };
  const markdown = [
    `# OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_${date}`,
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
    ""
  ].join("\n");

  if (shouldWriteOutputs()) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(
      path.join(reportDir, `OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_${date}.json`),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      "utf8"
    );
    await writeFile(
      path.join(reportDir, `OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_${date}.md`),
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
