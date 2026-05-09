import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const expectedScope = "team-email-smtp-wave1";
const requiredClusters = [
  "mailbox_alias_truth",
  "inbound_routing_truth",
  "gmail_proof",
  "outlook_proof",
  "internal_inbox_proof"
];
const requiredWave1Flows = [
  "support_form_submission",
  "contact_form_submission",
  "life_contact_briefing_request",
  "low_risk_internal_alert",
  "low_volume_notification"
];
const requiredWave1Fields = [
  "action_ref",
  "message_id",
  "messages_ref",
  "message_events_ref",
  "delivery_attempts_ref",
  "db_or_log_ref"
];
const requiredInboxTargets = ["tranhatam66@gmail.com", "tranhatam@gmail.com"];
const liveClaimStatuses = new Set([
  "READY_FOR_SYNCHRONIZED_LIVE",
  "READY_FOR_LIVE",
  "LIVE",
  "COMPLETE_VERIFIED"
]);
const publicSendClosedStates = new Set(["CLOSED", "HEALTH_ONLY", "NOT_OPEN", "OFF"]);

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

function normalize(value) {
  return String(value ?? "").trim();
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function isCompleteCluster(cluster) {
  if (!isRecord(cluster)) {
    return false;
  }

  const status = normalize(cluster.status).toUpperCase();
  const proofRefs = Array.isArray(cluster.proof_refs)
    ? cluster.proof_refs.filter((entry) => normalize(entry).length > 0)
    : [];

  return status === "COMPLETE_VERIFIED" && proofRefs.length > 0;
}

function flowResult(flowName, flowPayload) {
  const flow = isRecord(flowPayload) ? flowPayload : {};
  const missingFields = requiredWave1Fields.filter((field) => normalize(flow[field]).length === 0);
  const recipients = Array.isArray(flow.recipients)
    ? flow.recipients.map((entry) => normalize(entry).toLowerCase()).filter(Boolean)
    : [];
  const missingInboxTargets = requiredInboxTargets.filter(
    (target) => !recipients.includes(target.toLowerCase())
  );
  const inboxProofRefs = Array.isArray(flow.inbox_proof_refs)
    ? flow.inbox_proof_refs.filter((entry) => normalize(entry).length > 0)
    : [];
  const inboxProofReady = inboxProofRefs.length >= 2;
  const complete = missingFields.length === 0 && missingInboxTargets.length === 0 && inboxProofReady;

  return {
    flowName,
    complete,
    missingFields,
    missingInboxTargets,
    inboxProofRefCount: inboxProofRefs.length
  };
}

async function resolveEvidenceFile(root, requestedDate) {
  const reportDir = path.join(root, "docs", "reports", "team1");
  const entries = await readdir(reportDir).catch(() => []);
  const dates = entries
    .flatMap((entry) => {
      const match = /^TEAM_EMAIL_SMTP_WAVE1_EVIDENCE_(\d{4}-\d{2}-\d{2})\.json$/.exec(entry);
      return match ? [match[1]] : [];
    })
    .sort((left, right) => right.localeCompare(left));

  const selectedDate = dates.find((date) => date <= requestedDate) ?? dates[0] ?? null;
  if (!selectedDate) return null;

  const absolutePath = path.join(reportDir, `TEAM_EMAIL_SMTP_WAVE1_EVIDENCE_${selectedDate}.json`);
  const raw = await readFile(absolutePath, "utf8").catch(() => null);
  if (!raw) return null;

  return {
    date: selectedDate,
    absolutePath,
    relativePath: path.relative(root, absolutePath),
    evidence: JSON.parse(raw)
  };
}

function buildMissingSnapshot() {
  return {
    statusLabel: "MISSING_EVIDENCE_FILE",
    status: "MISSING",
    gapClassification: "INPUT_MISSING",
    gapReason: "TEAM_EMAIL_SMTP_WAVE1_EVIDENCE_<date>.json is missing.",
    mailboxAliasTruthDone: false,
    inboundRoutingTruthDone: false,
    gmailProofDone: false,
    outlookProofDone: false,
    internalInboxProofDone: false,
    bccLockedOff: false,
    publicSendClosed: false,
    wave1RowsComplete: false,
    wave1CloseoutReady: false,
    overallPass: false,
    checks: [
      {
        name: "evidence_file_present",
        pass: false,
        details: "Missing TEAM_EMAIL_SMTP_WAVE1_EVIDENCE_<date>.json in docs/reports/team1."
      }
    ],
    flowResults: requiredWave1Flows.map((flowName) => ({
      flowName,
      complete: false,
      missingFields: [...requiredWave1Fields],
      missingInboxTargets: [...requiredInboxTargets],
      inboxProofRefCount: 0
    }))
  };
}

function validateEvidence(evidence) {
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
      ...buildMissingSnapshot(),
      checks
    };
  }

  addCheck(
    "scope_locked",
    normalize(evidence.scope) === expectedScope,
    `Scope must be ${expectedScope}.`
  );

  const status = normalize(evidence.status).toUpperCase();
  const clusters = isRecord(evidence.clusters) ? evidence.clusters : {};
  const clusterComplete = Object.fromEntries(
    requiredClusters.map((clusterName) => [clusterName, isCompleteCluster(clusters[clusterName])])
  );

  addCheck(
    "required_clusters_represented",
    requiredClusters.every((clusterName) => Object.hasOwn(clusters, clusterName)),
    requiredClusters.every((clusterName) => Object.hasOwn(clusters, clusterName))
      ? "All five required clusters are represented."
      : `Missing clusters: ${requiredClusters
          .filter((clusterName) => !Object.hasOwn(clusters, clusterName))
          .join(", ")}`
  );

  const operationLocks = isRecord(evidence.operational_locks) ? evidence.operational_locks : {};
  const bccLockedOff = normalize(operationLocks.bcc_system).toUpperCase() === "OFF";
  const publicSendClosed = publicSendClosedStates.has(
    normalize(operationLocks.public_send).toUpperCase()
  );

  addCheck(
    "bcc_off_lock",
    bccLockedOff,
    "System BCC must remain OFF until wave1 proof closes."
  );
  addCheck(
    "public_send_closed_lock",
    publicSendClosed,
    "Public /v1/send must remain closed (health-only is allowed)."
  );

  const wave1 = isRecord(evidence.wave1) ? evidence.wave1 : {};
  const flows = isRecord(wave1.flows) ? wave1.flows : {};
  const flowResults = requiredWave1Flows.map((flowName) => flowResult(flowName, flows[flowName]));
  const missingFlowRows = requiredWave1Flows.filter((flowName) => !Object.hasOwn(flows, flowName));

  addCheck(
    "required_wave1_rows_represented",
    missingFlowRows.length === 0,
    missingFlowRows.length === 0
      ? "All required Wave 1 flow rows are represented."
      : `Missing Wave 1 rows: ${missingFlowRows.join(", ")}`
  );

  const wave1RowsComplete = flowResults.every((result) => result.complete);
  addCheck(
    "wave1_rows_evidence_complete",
    wave1RowsComplete,
    wave1RowsComplete
      ? "Wave 1 flow rows include action + message_id + DB/log + inbox chain."
      : "One or more Wave 1 rows still miss action/message_id/DB-log/inbox evidence."
  );

  const mailboxAliasTruthDone = clusterComplete.mailbox_alias_truth;
  const inboundRoutingTruthDone = clusterComplete.inbound_routing_truth;
  const gmailProofDone = clusterComplete.gmail_proof;
  const outlookProofDone = clusterComplete.outlook_proof;
  const internalInboxProofDone = clusterComplete.internal_inbox_proof;

  const wave1CloseoutReady =
    mailboxAliasTruthDone &&
    inboundRoutingTruthDone &&
    gmailProofDone &&
    outlookProofDone &&
    internalInboxProofDone &&
    bccLockedOff &&
    publicSendClosed &&
    wave1RowsComplete;

  const liveClaimRequested = liveClaimStatuses.has(status);
  addCheck(
    "no_live_overclaim",
    !(liveClaimRequested && !wave1CloseoutReady),
    liveClaimRequested && !wave1CloseoutReady
      ? "Live/complete status is overclaimed before Wave 1 closeout is ready."
      : "No overclaim detected."
  );

  const statusLabel =
    wave1CloseoutReady
      ? "WAVE1_CLOSEOUT_READY"
      : normalize(evidence.status_label) || "PARTIAL CLOSEOUT, DEV LANE OPEN, LIVE CLAIM EVIDENCE-LOCKED";

  let gapClassification = "NONE";
  let gapReason = "All required wave1 evidence is complete.";
  const requiredFlags = [
    mailboxAliasTruthDone,
    inboundRoutingTruthDone,
    gmailProofDone,
    outlookProofDone,
    internalInboxProofDone,
    bccLockedOff,
    publicSendClosed,
    wave1RowsComplete
  ];
  const allRequiredFlagsPass = requiredFlags.every(Boolean);
  if (!wave1CloseoutReady) {
    gapClassification = allRequiredFlagsPass ? "CHECKER_BUG_SUSPECTED" : "REAL_EVIDENCE_MISSING";
    gapReason = allRequiredFlagsPass
      ? "Wave1 is marked not-ready even though all required evidence flags are true."
      : "Wave1 required evidence fields/clusters are still incomplete."
  }

  return {
    statusLabel,
    status,
    gapClassification,
    gapReason,
    mailboxAliasTruthDone,
    inboundRoutingTruthDone,
    gmailProofDone,
    outlookProofDone,
    internalInboxProofDone,
    bccLockedOff,
    publicSendClosed,
    wave1RowsComplete,
    wave1CloseoutReady,
    overallPass: checks.every((check) => check.pass),
    checks,
    flowResults
  };
}

async function main() {
  const requestedDate = getDateArg();
  const writeOutputs = shouldWriteOutputs();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");
  const evidenceFile = await resolveEvidenceFile(root, requestedDate);
  const generatedAt = new Date().toISOString();

  const validation = evidenceFile ? validateEvidence(evidenceFile.evidence) : buildMissingSnapshot();

  const snapshot = {
    generatedAt,
    timezone,
    date: requestedDate,
    evidencePath: evidenceFile?.relativePath ?? null,
    evidenceDate: evidenceFile?.date ?? null,
    ...validation
  };

  const outputJsonPath = path.join(
    reportDir,
    `TEAM_EMAIL_SMTP_WAVE1_EVIDENCE_STATUS_${requestedDate}.json`
  );
  const outputMdPath = path.join(
    reportDir,
    `TEAM_EMAIL_SMTP_WAVE1_EVIDENCE_STATUS_${requestedDate}.md`
  );

  const markdown = [
    `# TEAM_EMAIL_SMTP_WAVE1_EVIDENCE_STATUS_${requestedDate}`,
    `- Generated at: ${generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Evidence source: ${snapshot.evidencePath ? `\`${snapshot.evidencePath}\`` : "`MISSING`"}`,
    `- Evidence date: ${snapshot.evidenceDate ?? "MISSING"}`,
    `- Lane status label: \`${snapshot.statusLabel}\``,
    `- Gap classification: \`${snapshot.gapClassification}\``,
    `- Gap reason: ${snapshot.gapReason}`,
    `- Wave 1 closeout ready: ${markdownStatus(snapshot.wave1CloseoutReady)}`,
    `- Mailbox/alias truth done: ${markdownStatus(snapshot.mailboxAliasTruthDone)}`,
    `- Inbound routing truth done: ${markdownStatus(snapshot.inboundRoutingTruthDone)}`,
    `- Gmail proof done: ${markdownStatus(snapshot.gmailProofDone)}`,
    `- Outlook proof done: ${markdownStatus(snapshot.outlookProofDone)}`,
    `- Internal inbox proof done: ${markdownStatus(snapshot.internalInboxProofDone)}`,
    `- BCC lock OFF: ${markdownStatus(snapshot.bccLockedOff)}`,
    `- Public /v1/send closed: ${markdownStatus(snapshot.publicSendClosed)}`,
    `- Wave 1 rows complete: ${markdownStatus(snapshot.wave1RowsComplete)}`,
    `- Overall checker pass: ${markdownStatus(snapshot.overallPass)}`,
    "",
    "## Checks",
    ...snapshot.checks.map(
      (check) =>
        `- ${markdownStatus(check.pass)} \`${check.name}\`${check.details ? ` — ${check.details}` : ""}`
    ),
    "",
    "## Wave 1 Flow Rows",
    ...snapshot.flowResults.map((row) => {
      const missingFields =
        row.missingFields.length > 0 ? row.missingFields.join(", ") : "none";
      const missingTargets =
        row.missingInboxTargets.length > 0 ? row.missingInboxTargets.join(", ") : "none";
      return `- ${markdownStatus(row.complete)} \`${row.flowName}\` — missing_fields: ${missingFields}; missing_inbox_targets: ${missingTargets}; inbox_proof_refs: ${row.inboxProofRefCount}`;
    }),
    "",
    "## Runbook",
    "- `pnpm report:team-email-smtp-evidence -- --date=YYYY-MM-DD`",
    ""
  ].join("\n");

  if (writeOutputs) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    await writeFile(outputMdPath, `${markdown}\n`, "utf8");
  }

  process.stdout.write(
    [
      `Team Email SMTP wave1 evidence status generated for ${requestedDate}.`,
      `Wave 1 closeout ready: ${snapshot.wave1CloseoutReady ? "PASS" : "FAIL"}.`,
      `JSON: ${path.relative(root, outputJsonPath)}`,
      `MD: ${path.relative(root, outputMdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team email smtp evidence check failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
