import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const terminalDecisions = new Set(["APPROVED", "REJECTED"]);

function todayInTimezone(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function getArg(name) {
  const explicit = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  return explicit ? explicit.slice(name.length + 3) : null;
}

function shouldWriteOutputs() {
  return !process.argv.includes("--no-write");
}

function normalize(value) {
  return String(value ?? "").trim();
}

function boolLabel(value) {
  return value ? "PASS" : "FAIL";
}

async function resolveLatestCiosClosure(root, requestedDate) {
  const reportDir = path.join(root, "docs", "reports", "team1");
  const entries = await readdir(reportDir).catch(() => []);
  const dates = entries
    .flatMap((entry) => {
      const match = /^TEAMC_CIOS_REVIEW_CLOSURE_STATUS_(\d{4}-\d{2}-\d{2})\.json$/.exec(entry);
      return match ? [match[1]] : [];
    })
    .sort((left, right) => right.localeCompare(left));

  const selectedDate = dates.find((date) => date <= requestedDate) ?? dates[0] ?? null;
  if (!selectedDate) {
    return null;
  }

  const absolutePath = path.join(reportDir, `TEAMC_CIOS_REVIEW_CLOSURE_STATUS_${selectedDate}.json`);
  const raw = await readFile(absolutePath, "utf8").catch(() => null);
  if (!raw) {
    return null;
  }

  return {
    date: selectedDate,
    relativePath: path.relative(root, absolutePath),
    data: JSON.parse(raw)
  };
}

async function main() {
  const root = process.cwd();
  const date = getArg("date") ?? todayInTimezone(timezone);
  const writeOutputs = shouldWriteOutputs();
  const decision = normalize(getArg("decision") ?? "PENDING_DECISION").toUpperCase();
  const owner = normalize(getArg("owner") ?? "Team1");
  const evidenceRef = normalize(getArg("evidence-ref") ?? "");
  const note = normalize(getArg("note") ?? "");

  const ciosClosure = await resolveLatestCiosClosure(root, date);
  const ciosClosureReady = ciosClosure?.data?.reviewClosureReady === true;

  const authorityDecisionRecorded =
    terminalDecisions.has(decision) && evidenceRef.length > 0 && ciosClosureReady;
  const status = authorityDecisionRecorded
    ? "DECISION_RECORDED"
    : ciosClosureReady
      ? "PENDING_TEAM1_DECISION"
      : "CIOS_NOT_READY";

  const blockers = [];
  if (!ciosClosureReady) {
    blockers.push("CIOS_REVIEW_CLOSURE_NOT_READY");
  }
  if (!terminalDecisions.has(decision)) {
    blockers.push("TERMINAL_DECISION_NOT_SET");
  }
  if (terminalDecisions.has(decision) && evidenceRef.length === 0) {
    blockers.push("EVIDENCE_REF_MISSING");
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    status,
    owner,
    decision,
    evidenceRef,
    note,
    ciosClosureReady,
    ciosClosureDate: ciosClosure?.date ?? null,
    ciosClosurePath: ciosClosure?.relativePath ?? null,
    authorityDecisionRecorded,
    blockers
  };

  const reportDir = path.join(root, "docs", "reports", "team1");
  const jsonPath = path.join(reportDir, `TEAM1_CIOS_AUTHORITY_DECISION_${date}.json`);
  const mdPath = path.join(reportDir, `TEAM1_CIOS_AUTHORITY_DECISION_${date}.md`);

  const markdown = [
    `# TEAM1_CIOS_AUTHORITY_DECISION_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Status: \`${status}\``,
    `- Owner: \`${owner}\``,
    `- Decision: \`${decision}\``,
    `- Evidence ref: ${evidenceRef ? `\`${evidenceRef}\`` : "`MISSING`"}`,
    `- CIOS closure ready: ${boolLabel(ciosClosureReady)}`,
    `- CIOS closure source: ${snapshot.ciosClosurePath ? `\`${snapshot.ciosClosurePath}\`` : "`MISSING`"}`,
    `- Authority decision recorded: ${boolLabel(authorityDecisionRecorded)}`,
    note ? `- Note: ${note}` : null,
    "",
    "## Blockers",
    ...(blockers.length > 0 ? blockers.map((blocker) => `- ${blocker}`) : ["- none"]),
    "",
    "## Runbook",
    "- Pending: `pnpm report:team1-cios-authority -- --date=YYYY-MM-DD --decision=PENDING_DECISION`",
    "- Approve: `pnpm report:team1-cios-authority -- --date=YYYY-MM-DD --decision=APPROVED --evidence-ref=<ref>`",
    "- Reject: `pnpm report:team1-cios-authority -- --date=YYYY-MM-DD --decision=REJECTED --evidence-ref=<ref>`",
    ""
  ]
    .filter(Boolean)
    .join("\n");

  if (writeOutputs) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    await writeFile(mdPath, `${markdown}\n`, "utf8");
  }

  process.stdout.write(
    [
      `Team1 CIOS authority decision status for ${date}: ${status}.`,
      `Authority decision recorded: ${authorityDecisionRecorded ? "PASS" : "FAIL"}.`,
      `JSON: ${path.relative(root, jsonPath)}`,
      `MD: ${path.relative(root, mdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team1 cios authority decision log failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
