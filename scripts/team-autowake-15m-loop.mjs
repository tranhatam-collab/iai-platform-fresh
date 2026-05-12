import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";

function todayInTimezone(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function parseArg(name, fallback = null) {
  const entry = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  return entry ? entry.slice(name.length + 3) : fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

// CIOS vitest suite takes ~150s on cold start, ~34s on warm. 120000ms (2 min)
// is below cold-start time and causes a false-fail every loop iteration,
// regressing the all-teams completion gate from 83% to 66% repeatedly.
// 300000ms (5 min) gives 2× headroom over cold-start and matches the
// defaultTimeoutMs inside teamc-cios-review-closure-check.mjs.
const CIOS_CLOSURE_TIMEOUT_MS = 300000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanOutput(value) {
  const text = String(value ?? "").replace(/\u001b\[[0-9;]*m/g, "").trim();
  if (text.length <= 4000) {
    return text;
  }
  return `${text.slice(0, 4000)}...`;
}

function runNode(label, script, args = []) {
  const startedAt = new Date().toISOString();
  try {
    const output = execFileSync(process.execPath, [script, ...args], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return {
      label,
      command: `node ${[script, ...args].join(" ")}`,
      startedAt,
      finishedAt: new Date().toISOString(),
      status: "PASS",
      exitCode: 0,
      output: cleanOutput(output)
    };
  } catch (error) {
    return {
      label,
      command: `node ${[script, ...args].join(" ")}`,
      startedAt,
      finishedAt: new Date().toISOString(),
      status: "FAIL",
      exitCode: typeof error.status === "number" ? error.status : 1,
      output: cleanOutput(`${error.stdout ?? ""}\n${error.stderr ?? ""}`)
    };
  }
}

async function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function getStopState(adminSnapshot) {
  const checks = adminSnapshot?.checks ?? {};
  const completionPercent = adminSnapshot?.completion?.percent ?? 0;
  const blocking = [];

  const required = [
    ["governanceReady", "Team 1 governance chưa ready"],
    ["noGoOwnersDone", "Team 3 Release Sync: owner sign-off của mô hình 3-team chưa complete"],
    ["payProductionGateDone", "Pay production gate chưa green"],
    ["releaseClaimUnlocked", "Release claim chưa unlock"],
    ["liveSyncReady", "Team 3 Release Sync: synchronized live chưa ready"]
  ];

  for (const [key, message] of required) {
    if (checks[key] !== true) {
      blocking.push(message);
    }
  }

  const clusterChecks = [
    [
      checks.teamBCdnFlowsState?.productionEvidenceResolved,
      "T2 Infra & Runtime Evidence: CDN/Flows production evidence chưa complete"
    ],
    [checks.bilingualLiveReady, "T1 Surface & Language: bilingual/noos-web chưa live-ready"],
    [checks.ciosReviewClosureReady, "T2 Infra & Runtime Evidence: CIOS review closure chưa ready"]
  ];

  for (const [pass, message] of clusterChecks) {
    if (pass !== true) {
      blocking.push(message);
    }
  }

  return {
    completionPercent,
    complete: completionPercent >= 100 && blocking.length === 0,
    blocking
  };
}

async function runCycle({ requestedDate, intervalMinutes }) {
  const root = process.cwd();
  const date = requestedDate ?? todayInTimezone(timezone);
  const reportDir = path.join(root, "docs", "reports", "team1");
  await mkdir(reportDir, { recursive: true });

  const cycleStartedAt = new Date();
  const args = [`--date=${date}`];
  const commands = [];

  commands.push(runNode("Team reminder schedule/status", "scripts/team-channel-reminder-check.mjs", [...args, "--write"]));

  const dispatchPacket = runNode("Team reminder dispatch packet", "scripts/team-channel-reminder-check.mjs", [
    ...args,
    "--emit"
  ]);
  commands.push(dispatchPacket);
  if (dispatchPacket.output) {
    await writeFile(
      path.join(reportDir, `TEAM_AUTOWAKE_DISPATCH_PACKET_${date}.md`),
      `${dispatchPacket.output}\n`,
      "utf8"
    );
  }

  commands.push(runNode("Team 2 CDN/Flows evidence check", "scripts/team-b-cdn-flows-evidence-check.mjs", args));
  commands.push(runNode("Team 2 CIOS closure check", "scripts/teamc-cios-review-closure-check.mjs", [
    ...args,
    `--timeout-ms=${CIOS_CLOSURE_TIMEOUT_MS}`
  ]));
  commands.push(
    runNode("Team 1 NO-GO precheck (3-team model)", "scripts/team1-abcd-nogo-precheck.mjs", [
      ...args,
      "--model=three-team"
    ])
  );
  commands.push(runNode("Team 3 live-sync readiness", "scripts/team5-live-sync-readiness-check.mjs", args));
  commands.push(runNode("Team 3 live-sync final packet", "scripts/team5-live-sync-packet.mjs", args));
  commands.push(runNode("Team 1 all-teams completion snapshot", "scripts/team1-all-teams-completion-status-check.mjs", args));

  const adminJsonPath = path.join(reportDir, `TEAM_ADMIN_ALL_TEAMS_COMPLETION_STATUS_${date}.json`);
  const adminSnapshot = await readJsonIfPresent(adminJsonPath);
  const stopState = getStopState(adminSnapshot);
  const nextWakeAt = new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString();

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    mode: hasFlag("--loop") ? "LOOP" : "ONCE",
    cadenceMinutes: intervalMinutes,
    status: stopState.complete ? "COMPLETE_VERIFIED_STOP_ALLOWED" : "AUTO_3TEAM_ACTIVE_UNTIL_VERIFIED_COMPLETE",
    cycleStartedAt: cycleStartedAt.toISOString(),
    cycleFinishedAt: new Date().toISOString(),
    nextWakeAt: stopState.complete ? null : nextWakeAt,
    completionPercent: stopState.completionPercent,
    stopConditionSatisfied: stopState.complete,
    blocking: stopState.blocking,
    commands
  };

  await writeFile(
    path.join(reportDir, `TEAM_AUTOWAKE_15M_STATUS_${date}.json`),
    `${JSON.stringify(snapshot, null, 2)}\n`,
    "utf8"
  );

  const markdown = [
    `# TEAM_AUTOWAKE_15M_STATUS_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Status: \`${snapshot.status}\``,
    `- Cadence: every ${intervalMinutes} minutes`,
    `- Completion: ${snapshot.completionPercent}%`,
    `- Stop condition satisfied: ${snapshot.stopConditionSatisfied ? "PASS" : "FAIL"}`,
    `- Next wake at: ${snapshot.nextWakeAt ?? "none - complete"}`,
    "",
    "## Blocking Until Complete",
    ...(snapshot.blocking.length === 0
      ? ["- none"]
      : snapshot.blocking.map((entry) => `- ${entry}`)),
    "",
    "## Commands This Cycle",
    ...snapshot.commands.map(
      (entry) =>
        `- ${entry.status} \`${entry.label}\` — exit=${entry.exitCode} — \`${entry.command}\``
    ),
    "",
    "## Dispatch Packet",
    `- docs/reports/team1/TEAM_AUTOWAKE_DISPATCH_PACKET_${date}.md`,
    "",
    "## Stop Rule",
    "- This loop must remain active until completion is 100% and the Team 1 / Team 2 / Team 3 gate-critical clusters are accepted: Team 3 owner/live-sync, Team 2 infra/runtime evidence, and Team 1 bilingual/noos-web.",
    ""
  ].join("\n");

  await writeFile(path.join(reportDir, `TEAM_AUTOWAKE_15M_STATUS_${date}.md`), `${markdown}\n`, "utf8");
  process.stdout.write(`${markdown}\n`);

  return snapshot;
}

async function main() {
  const intervalMinutes = Number.parseInt(parseArg("interval-minutes", "10"), 10);
  const safeInterval = Number.isFinite(intervalMinutes) && intervalMinutes > 0 ? intervalMinutes : 10;
  const requestedDate = parseArg("date", null);
  const loop = hasFlag("--loop") && !hasFlag("--once");

  if (!loop) {
    await runCycle({ requestedDate, intervalMinutes: safeInterval });
    return;
  }

  while (true) {
    const snapshot = await runCycle({ requestedDate: null, intervalMinutes: safeInterval });
    if (snapshot.stopConditionSatisfied) {
      return;
    }
    await sleep(safeInterval * 60 * 1000);
  }
}

main().catch((error) => {
  process.stderr.write(
    `team autowake loop failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
