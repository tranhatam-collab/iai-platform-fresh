import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";

const packets = [
  {
    key: "teamA",
    label: "Team A / developer.iai.one",
    path: "docs/release-evidence/developer.iai.one/DEVELOPER_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md"
  },
  {
    key: "teamB_cdn",
    label: "Team B / cdn.iai.one",
    path: "docs/release-evidence/cdn.iai.one/CDN_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md"
  },
  {
    key: "teamB_flows",
    label: "Team B / flows.iai.one",
    path: "docs/release-evidence/flows.iai.one/FLOWS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md"
  },
  {
    key: "teamC",
    label: "Team C / cios.iai.one",
    path: "docs/release-evidence/cios.iai.one/CIOS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md"
  }
];

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

function getModelModeArg() {
  const explicit = process.argv.find((argument) => argument.startsWith("--model="));
  if (!explicit) {
    return "three-team";
  }
  const value = explicit.slice("--model=".length).trim().toLowerCase();
  return value === "legacy-abcd" ? "legacy-abcd" : "three-team";
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function readBacktickField(body, fieldName) {
  const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp("^- " + escapedField + ":\\s*`([^`]+)`", "m");
  const match = body.match(pattern);
  return match?.[1] ?? "";
}

function evaluatePacketBody(body) {
  const todoCount = body
    .split("\n")
    .filter((line) => line.includes("TODO")).length;

  const commitRef = readBacktickField(body, "Commit / branch");
  const targetEnvironment = readBacktickField(body, "Target environment");
  const ownerSignoff = readBacktickField(body, "Owner sign-off");
  const finalStatus = readBacktickField(body, "Final status");

  const checks = {
    noTodo: todoCount === 0,
    commitRef: Boolean(commitRef) && commitRef !== "TODO",
    targetEnvironment: Boolean(targetEnvironment) && targetEnvironment !== "TODO",
    ownerSignoff: Boolean(ownerSignoff) && !/PENDING/i.test(ownerSignoff),
    finalStatus: Boolean(finalStatus) && !/PENDING|BLOCKED/i.test(finalStatus)
  };

  return {
    todoCount,
    fields: {
      commitRef,
      targetEnvironment,
      ownerSignoff,
      finalStatus
    },
    checks,
    pass: Object.values(checks).every(Boolean)
  };
}

function normalize(value) {
  return String(value ?? "").trim();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveLatestJsonSnapshot(root, relativeDir, prefix, requestedDate) {
  const absoluteDir = path.join(root, relativeDir);
  let entries = [];
  try {
    entries = await readdir(absoluteDir);
  } catch {
    return null;
  }
  const pattern = new RegExp(`^${escapeRegex(prefix)}_(\\d{4}-\\d{2}-\\d{2})\\.json$`);
  const dates = entries
    .flatMap((entry) => {
      const match = pattern.exec(entry);
      return match ? [match[1]] : [];
    })
    .sort((left, right) => right.localeCompare(left));
  const selectedDate = dates.find((date) => date <= requestedDate) ?? dates[0];
  if (!selectedDate) {
    return null;
  }
  const absolutePath = path.join(absoluteDir, `${prefix}_${selectedDate}.json`);
  const source = await readFile(absolutePath, "utf8");
  return {
    sourceDate: selectedDate,
    sourcePath: absolutePath,
    data: JSON.parse(source)
  };
}

async function evaluateTeamBEvidence(root, requestedDate) {
  const legacyEvidencePath = path.join(
    root,
    "docs/reports/team1/TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_2026-04-23.json"
  );
  const statusSnapshot = await resolveLatestJsonSnapshot(
    root,
    path.join("docs", "reports", "team1"),
    "TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS",
    requestedDate
  );

  if (statusSnapshot?.data) {
    const missingCdnRefs = Array.isArray(statusSnapshot.data.cdnMissingRefs)
      ? statusSnapshot.data.cdnMissingRefs
      : requiredCdnRefs;
    const missingFlowsRefs = Array.isArray(statusSnapshot.data.flowsMissingRefs)
      ? statusSnapshot.data.flowsMissingRefs
      : requiredFlowsRefs;
    const productionEvidenceComplete = statusSnapshot.data.productionEvidenceComplete === true;
    const formalNotPublicReadyAccepted =
      statusSnapshot.data.formalNotPublicReadyAccepted === true;
    const productionEvidenceResolved =
      statusSnapshot.data.productionEvidenceResolved === true ||
      productionEvidenceComplete ||
      formalNotPublicReadyAccepted;

    return {
      present: true,
      path: path.relative(root, statusSnapshot.sourcePath),
      sourceDate: statusSnapshot.sourceDate,
      sourceKind: "TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS",
      checks: {
        cdnRefsComplete: statusSnapshot.data.cdnEvidenceComplete === true,
        flowsRefsComplete: statusSnapshot.data.flowsEvidenceComplete === true,
        productionEvidenceComplete,
        formalNotPublicReadyAccepted,
        productionEvidenceResolved
      },
      missing: {
        cdn: missingCdnRefs,
        flows: missingFlowsRefs
      }
    };
  }

  if (!(await fileExists(legacyEvidencePath))) {
    return {
      present: false,
      path: path.relative(root, legacyEvidencePath),
      sourceDate: null,
      sourceKind: "TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE",
      checks: {
        cdnRefsComplete: false,
        flowsRefsComplete: false,
        productionEvidenceComplete: false,
        formalNotPublicReadyAccepted: false,
        productionEvidenceResolved: false
      },
      missing: {
        cdn: requiredCdnRefs,
        flows: requiredFlowsRefs
      }
    };
  }

  const evidence = JSON.parse(await readFile(legacyEvidencePath, "utf8"));
  const cdn = evidence?.cdn ?? {};
  const flows = evidence?.flows ?? {};

  const missingCdnRefs = requiredCdnRefs.filter((key) => !normalize(cdn[key]));
  const missingFlowsRefs = requiredFlowsRefs.filter((key) => !normalize(flows[key]));

  return {
    present: true,
    path: path.relative(root, legacyEvidencePath),
    sourceDate: "2026-04-23",
    sourceKind: "TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE",
    checks: {
      cdnRefsComplete: missingCdnRefs.length === 0,
      flowsRefsComplete: missingFlowsRefs.length === 0,
      productionEvidenceComplete: missingCdnRefs.length === 0 && missingFlowsRefs.length === 0,
      formalNotPublicReadyAccepted: false,
      productionEvidenceResolved: missingCdnRefs.length === 0 && missingFlowsRefs.length === 0
    },
    missing: {
      cdn: missingCdnRefs,
      flows: missingFlowsRefs
    }
  };
}

async function evaluateTeamCRuntimeClosure(root, date) {
  const closurePath = path.join(root, `docs/reports/team1/TEAMC_CIOS_REVIEW_CLOSURE_STATUS_${date}.json`);
  if (!(await fileExists(closurePath))) {
    return {
      present: false,
      path: path.relative(root, closurePath),
      reviewClosureReady: false
    };
  }

  const closure = JSON.parse(await readFile(closurePath, "utf8"));
  return {
    present: true,
    path: path.relative(root, closurePath),
    reviewClosureReady: closure?.reviewClosureReady === true
  };
}

async function main() {
  const date = getDateArg();
  const modelMode = getModelModeArg();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");

  const packetResults = await Promise.all(
    packets.map(async (packet) => {
      const absolutePath = path.join(root, packet.path);
      if (!(await fileExists(absolutePath))) {
        return {
          ...packet,
          present: false,
          pass: false,
          todoCount: -1,
          fields: {
            commitRef: "",
            targetEnvironment: "",
            ownerSignoff: "",
            finalStatus: ""
          },
          checks: {
            noTodo: false,
            commitRef: false,
            targetEnvironment: false,
            ownerSignoff: false,
            finalStatus: false
          }
        };
      }

      const body = await readFile(absolutePath, "utf8");
      return {
        ...packet,
        present: true,
        ...evaluatePacketBody(body)
      };
    })
  );

  const teamBEvidence = await evaluateTeamBEvidence(root, date);
  const teamCRuntime = await evaluateTeamCRuntimeClosure(root, date);

  const legacyAbcdPass =
    packetResults.every((entry) => entry.pass) &&
    teamBEvidence.checks.cdnRefsComplete &&
    teamBEvidence.checks.flowsRefsComplete &&
    teamCRuntime.reviewClosureReady;

  const threeTeamModelPass =
    teamBEvidence.checks.productionEvidenceResolved === true &&
    teamCRuntime.reviewClosureReady === true;

  const overallPass = modelMode === "legacy-abcd" ? legacyAbcdPass : threeTeamModelPass;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    modelMode,
    overallPass,
    modelEvaluation: {
      legacyAbcdPass,
      threeTeamModelPass,
      using: modelMode
    },
    packetResults,
    teamBEvidence,
    teamCRuntime
  };

  await mkdir(reportDir, { recursive: true });
  const outputJsonPath = path.join(reportDir, `TEAM1_ABCD_NOGO_PRECHECK_${date}.json`);
  const outputMdPath = path.join(reportDir, `TEAM1_ABCD_NOGO_PRECHECK_${date}.md`);

  await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAM1_ABCD_NOGO_PRECHECK_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Model mode: ${modelMode}`,
    `- Overall: ${markdownStatus(overallPass)}`,
    `- Legacy ABCD pass: ${markdownStatus(legacyAbcdPass)}`,
    `- Active 3-team pass: ${markdownStatus(threeTeamModelPass)}`,
    "",
    "## Packet checks",
    ...packetResults.flatMap((entry) => [
      `- ${entry.label}: ${markdownStatus(entry.pass)}`,
      `  - path: ${entry.path}`,
      `  - file present: ${markdownStatus(entry.present)}`,
      `  - TODO count: ${entry.todoCount}`,
      `  - commit ref: ${markdownStatus(entry.checks.commitRef)} (${entry.fields.commitRef || "missing"})`,
      `  - target environment: ${markdownStatus(entry.checks.targetEnvironment)} (${entry.fields.targetEnvironment || "missing"})`,
      `  - owner sign-off: ${markdownStatus(entry.checks.ownerSignoff)} (${entry.fields.ownerSignoff || "missing"})`,
      `  - final status: ${markdownStatus(entry.checks.finalStatus)} (${entry.fields.finalStatus || "missing"})`
    ]),
    "",
    "## Team B evidence refs",
    `- source: ${teamBEvidence.path}`,
    `- present: ${markdownStatus(teamBEvidence.present)}`,
    `- source kind: ${teamBEvidence.sourceKind ?? "unknown"}`,
    `- source date: ${teamBEvidence.sourceDate ?? "unknown"}`,
    `- cdn refs complete: ${markdownStatus(teamBEvidence.checks.cdnRefsComplete)}`,
    `- flows refs complete: ${markdownStatus(teamBEvidence.checks.flowsRefsComplete)}`,
    `- production evidence complete: ${markdownStatus(teamBEvidence.checks.productionEvidenceComplete)}`,
    `- formal NOT_PUBLIC_READY accepted: ${markdownStatus(teamBEvidence.checks.formalNotPublicReadyAccepted)}`,
    `- production evidence resolved: ${markdownStatus(teamBEvidence.checks.productionEvidenceResolved)}`,
    `- missing cdn refs: ${teamBEvidence.missing.cdn.length > 0 ? teamBEvidence.missing.cdn.join(", ") : "none"}`,
    `- missing flows refs: ${teamBEvidence.missing.flows.length > 0 ? teamBEvidence.missing.flows.join(", ") : "none"}`,
    "",
    "## Team C runtime closure",
    `- source: ${teamCRuntime.path}`,
    `- present: ${markdownStatus(teamCRuntime.present)}`,
    `- reviewClosureReady: ${markdownStatus(teamCRuntime.reviewClosureReady)}`,
    "",
    "## Quick rerun",
    "- `node scripts/team1-abcd-nogo-precheck.mjs --date=YYYY-MM-DD --model=three-team`",
    "- `node scripts/team1-abcd-nogo-precheck.mjs --date=YYYY-MM-DD --model=legacy-abcd`",
    ""
  ].join("\n");

  await writeFile(outputMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `ABCD precheck generated for ${date}.`,
      `Overall: ${overallPass ? "PASS" : "FAIL"}.`,
      `JSON: ${path.relative(root, outputJsonPath)}`,
      `MD: ${path.relative(root, outputMdPath)}`
    ].join("\n")
  );

  if (!overallPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(
    `abcd no-go precheck failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
