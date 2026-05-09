import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const requiredCdnRefs = [
  "deploy_log_ref",
  "rule_snapshot_ref",
  "cache_header_proof_ref",
  "purge_rollback_note_ref",
  "asset_header_proof_ref"
];
const requiredFlowsRefs = [
  "route_map_production_ref",
  "runtime_production_ref",
  "screenshot_production_ref"
];
const claimStatuses = new Set([
  "READY_FOR_REOPEN_REVIEW",
  "RELEASE_READY",
  "COMPLETE_VERIFIED",
  "READY_FOR_LIVE",
  "LIVE"
]);
const inferredOwnerNotes = new Set([
  "INFERRED_BY_TEAM_NOVA_OPS_AWAITING_OWNER_CONFIRMATION",
  "INFERRED_PENDING_OWNER_EXTERNAL_PROOF"
]);
const notPublicReadyStates = new Set([
  "NOT_PUBLIC_READY",
  "NOT_PUBLIC_READY_ACCEPTED",
  "FORMAL_NOT_PUBLIC_READY"
]);

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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalize(value) {
  return String(value ?? "").trim();
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

async function resolveLatestTeam1Verdicts(root, requestedDate) {
  const reportDir = path.join(root, "docs", "reports", "team1");
  const entries = await readdir(reportDir);
  const dates = entries
    .flatMap((entry) => {
      const match = /^TEAM1_DOMAIN_REOPEN_VERDICTS_(\d{4}-\d{2}-\d{2})\.md$/.exec(entry);
      return match ? [match[1]] : [];
    })
    .sort((left, right) => right.localeCompare(left));

  const selectedDate = dates.find((date) => date <= requestedDate) ?? dates[0];
  if (!selectedDate) {
    return null;
  }

  const absolutePath = path.join(reportDir, `TEAM1_DOMAIN_REOPEN_VERDICTS_${selectedDate}.md`);
  const raw = await readFile(absolutePath, "utf8");

  const cdnVerdict =
    raw.match(/###\s*`cdn\.iai\.one`[\s\S]*?Verdict:\s*`([^`]+)`/i)?.[1] ?? "MISSING";
  const flowsVerdict =
    raw.match(/###\s*`flows\.iai\.one`[\s\S]*?Verdict:\s*`([^`]+)`/i)?.[1] ?? "MISSING";

  return {
    date: selectedDate,
    path: path.relative(root, absolutePath),
    cdnVerdict,
    flowsVerdict
  };
}

async function resolveEvidenceFile(root, requestedDate) {
  const reportDir = path.join(root, "docs", "reports", "team1");
  const entries = await readdir(reportDir).catch(() => []);
  const dates = entries
    .flatMap((entry) => {
      const match = /^TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_(\d{4}-\d{2}-\d{2})\.json$/.exec(entry);
      return match ? [match[1]] : [];
    })
    .sort((left, right) => right.localeCompare(left));

  const selectedDate = dates.find((date) => date <= requestedDate) ?? dates[0] ?? null;
  if (!selectedDate) {
    return null;
  }

  const absolutePath = path.join(reportDir, `TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_${selectedDate}.json`);
  const raw = await readFile(absolutePath, "utf8").catch(() => null);
  if (!raw) return null;

  return {
    date: selectedDate,
    absolutePath,
    relativePath: path.relative(root, absolutePath),
    evidence: JSON.parse(raw)
  };
}

function validateEvidence(evidence, verdicts) {
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
      cdnEvidenceComplete: false,
      checks,
      flowsEvidenceComplete: false,
      overallPass: false,
      productionEvidenceComplete: false,
      status: "INVALID"
    };
  }

  addCheck(
    "scope_locked",
    evidence.scope === "team-b-cdn-flows",
    "Scope must be team-b-cdn-flows."
  );

  const cdn = isRecord(evidence.cdn) ? evidence.cdn : {};
  const flows = isRecord(evidence.flows) ? evidence.flows : {};
  const claimPolicy = isRecord(evidence.claim_policy) ? evidence.claim_policy : {};

  addCheck(
    "cdn_domain_locked",
    normalize(cdn.domain) === "cdn.iai.one",
    "CDN evidence must be locked to cdn.iai.one."
  );
  addCheck(
    "flows_domain_locked",
    normalize(flows.domain) === "flows.iai.one",
    "Flows evidence must be locked to flows.iai.one."
  );

  const cdnRepresented = requiredCdnRefs.every((field) => Object.hasOwn(cdn, field));
  addCheck(
    "cdn_required_fields_represented",
    cdnRepresented,
    cdnRepresented
      ? "CDN required evidence fields are represented."
      : `Missing CDN fields: ${requiredCdnRefs.filter((field) => !Object.hasOwn(cdn, field)).join(", ")}`
  );

  const flowsRepresented = requiredFlowsRefs.every((field) => Object.hasOwn(flows, field));
  addCheck(
    "flows_required_fields_represented",
    flowsRepresented,
    flowsRepresented
      ? "Flows required evidence fields are represented."
      : `Missing Flows fields: ${requiredFlowsRefs
          .filter((field) => !Object.hasOwn(flows, field))
          .join(", ")}`
  );

  addCheck(
    "claim_policy_locked",
    claimPolicy.release_ready_forbidden_until_both_domains_complete === true,
    "Claim policy must keep release-ready forbidden until both domains complete."
  );

  const cdnMissingRefs = requiredCdnRefs.filter((field) => normalize(cdn[field]).length === 0);
  const flowsMissingRefs = requiredFlowsRefs.filter((field) => normalize(flows[field]).length === 0);
  const cdnDnsResolves = cdn.runtime_reachability?.dns_resolves === true;
  const cdnEvidenceComplete = cdnMissingRefs.length === 0 && cdnDnsResolves;
  const flowsEvidenceComplete = flowsMissingRefs.length === 0;
  const productionEvidenceComplete = cdnEvidenceComplete && flowsEvidenceComplete;
  const cdnNotPublicReady =
    notPublicReadyStates.has(normalize(cdn.public_ready_state)) ||
    notPublicReadyStates.has(normalize(cdn.status));
  const flowsNotPublicReady =
    notPublicReadyStates.has(normalize(flows.public_ready_state)) ||
    notPublicReadyStates.has(normalize(flows.status));
  const formalNotPublicReadyAccepted = cdnNotPublicReady && flowsNotPublicReady;
  const productionEvidenceResolved = productionEvidenceComplete || formalNotPublicReadyAccepted;

  const status = normalize(evidence.status);
  const claimStatusRequested = claimStatuses.has(status);
  const noOverclaim = !(claimStatusRequested && !productionEvidenceResolved);
  addCheck(
    "no_overclaim_before_domain_production_evidence_complete",
    noOverclaim,
    noOverclaim
      ? "Evidence does not overclaim release-ready before production evidence closure."
      : "Overclaim detected: status requests release-ready while required production evidence is incomplete."
  );

  const cdnOwnerNote = normalize(cdn.evidence_note || evidence.evidence_note || "");
  const flowsOwnerNote = normalize(flows.evidence_note || evidence.evidence_note || "");
  addCheck(
    "cdn_owner_confirmation_note_present",
    inferredOwnerNotes.has(cdnOwnerNote) || inferredOwnerNotes.has(flowsOwnerNote),
    "CDN packet should explicitly carry TEAM_NOVA_OPS inferred-owner note while waiting external owner proof."
  );
  addCheck(
    "flows_owner_confirmation_note_present",
    inferredOwnerNotes.has(flowsOwnerNote) || inferredOwnerNotes.has(cdnOwnerNote),
    "Flows packet should explicitly carry TEAM_NOVA_OPS inferred-owner note while waiting external owner proof."
  );

  if (verdicts) {
    const cdnVerdictAligned = cdnEvidenceComplete
      ? true
      : /PENDING|DENIED/i.test(verdicts.cdnVerdict);
    const flowsVerdictAligned = flowsEvidenceComplete
      ? true
      : /PENDING/i.test(verdicts.flowsVerdict);

    addCheck(
      "team1_cdn_verdict_alignment",
      cdnVerdictAligned,
      `Team 1 CDN verdict should remain pending/denied while CDN evidence incomplete (current: ${verdicts.cdnVerdict}).`
    );
    addCheck(
      "team1_flows_verdict_alignment",
      flowsVerdictAligned,
      `Team 1 Flows verdict should remain pending while Flows evidence incomplete (current: ${verdicts.flowsVerdict}).`
    );
  }

  return {
    cdnDnsResolves,
    cdnEvidenceComplete,
    cdnMissingRefs,
    cdnNotPublicReady,
    checks,
    flowsNotPublicReady,
    flowsEvidenceComplete,
    flowsMissingRefs,
    formalNotPublicReadyAccepted,
    overallPass: checks.every((check) => check.pass),
    productionEvidenceComplete,
    productionEvidenceResolved,
    status
  };
}

async function main() {
  const date = getDateArg();
  const writeOutputs = shouldWriteOutputs();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");
  const evidenceFile = await resolveEvidenceFile(root, date);
  if (!evidenceFile) {
    throw new Error(
      "Missing TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_<date>.json in docs/reports/team1."
    );
  }
  const evidence = evidenceFile.evidence;
  const verdicts = await resolveLatestTeam1Verdicts(root, date).catch(() => null);
  const validation = validateEvidence(evidence, verdicts);
  const generatedAt = new Date().toISOString();

  const snapshot = {
    generatedAt,
    timezone,
    date,
    evidencePath: evidenceFile.relativePath,
    evidenceDate: evidenceFile.date,
    verdictSource: verdicts
      ? {
          date: verdicts.date,
          path: verdicts.path,
          cdnVerdict: verdicts.cdnVerdict,
          flowsVerdict: verdicts.flowsVerdict
        }
      : null,
    ...validation
  };

  const markdown = [
    `# TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS_${date}`,
    `- Generated at: ${generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Evidence source: \`${snapshot.evidencePath}\``,
    `- Team 1 verdict source: ${
      snapshot.verdictSource
        ? `\`${snapshot.verdictSource.path}\` (${snapshot.verdictSource.date})`
        : "`MISSING`"
    }`,
    `- Evidence status: \`${validation.status}\``,
    `- Production evidence complete: ${markdownStatus(validation.productionEvidenceComplete)}`,
    `- Formal NOT_PUBLIC_READY accepted: ${markdownStatus(validation.formalNotPublicReadyAccepted)}`,
    `- Production evidence resolved for Team 2: ${markdownStatus(validation.productionEvidenceResolved)}`,
    `- CDN evidence complete: ${markdownStatus(validation.cdnEvidenceComplete)}`,
    `- Flows evidence complete: ${markdownStatus(validation.flowsEvidenceComplete)}`,
    `- Overall checker pass: ${markdownStatus(validation.overallPass)}`,
    "",
    "## Checks",
    ...validation.checks.map(
      (check) =>
        `- ${markdownStatus(check.pass)} \`${check.name}\`${check.details ? ` — ${check.details}` : ""}`
    ),
    "",
    "## Completion Breakdown",
    `- CDN DNS resolves: ${markdownStatus(validation.cdnDnsResolves)}`,
    `- CDN formal NOT_PUBLIC_READY: ${markdownStatus(validation.cdnNotPublicReady)}`,
    `- CDN missing refs: ${
      validation.cdnMissingRefs.length > 0 ? validation.cdnMissingRefs.join(", ") : "none"
    }`,
    `- Flows formal NOT_PUBLIC_READY: ${markdownStatus(validation.flowsNotPublicReady)}`,
    `- Flows missing refs: ${
      validation.flowsMissingRefs.length > 0 ? validation.flowsMissingRefs.join(", ") : "none"
    }`,
    ""
  ].join("\n");

  if (writeOutputs) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(
      path.join(reportDir, `TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS_${date}.json`),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      "utf8"
    );
    await writeFile(
      path.join(reportDir, `TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS_${date}.md`),
      `${markdown}\n`,
      "utf8"
    );
  }

  process.stdout.write(`${markdown}\n`);

  if (!validation.overallPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
