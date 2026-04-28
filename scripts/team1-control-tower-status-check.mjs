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

function getDateArg() {
  const explicit = process.argv.find((argument) => argument.startsWith("--date="));
  if (explicit) {
    return explicit.slice("--date=".length);
  }
  return todayInTimezone(timezone);
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");

  const laneJsonPath = path.join(reportDir, `LANE_STATUS_SNAPSHOT_${date}.json`);
  const nftJsonPath = path.join(reportDir, `NFT_PHASE_C_GATE_STATUS_${date}.json`);

  const lane = JSON.parse(await readFile(laneJsonPath, "utf8"));
  const nft = JSON.parse(await readFile(nftJsonPath, "utf8"));

  const lanePass = Boolean(lane.overallPass);
  const nftPass = Boolean(nft.overallPass);
  const nftVerdict = nft.verdict ?? (nftPass ? "GO" : "NO-GO");

  const unresolvedOwnershipRows =
    lane?.checks?.ownershipMatrix?.unresolvedRows?.length ?? 0;

  const actionItems = Array.isArray(nft.actionItems) ? nft.actionItems : [];

  const controlReady = lanePass && nftPass;
  const releaseControlState = controlReady ? "READY" : "HOLD";

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    controlReady,
    releaseControlState,
    checks: {
      laneProtocol: {
        pass: lanePass,
        unresolvedOwnershipRows,
        dailyReportsPass: Boolean(lane?.checks?.dailyReports?.pass),
        missionMapPass: Boolean(lane?.checks?.missionMap?.pass)
      },
      nftPhaseC: {
        pass: nftPass,
        verdict: nftVerdict,
        team2Status: nft?.checks?.packets?.team2Status ?? "UNKNOWN",
        team4Status: nft?.checks?.packets?.team4Status ?? "UNKNOWN",
        team2Missing: nft?.checks?.team2Evidence?.missingCount ?? -1,
        team2Fail: nft?.checks?.team2Evidence?.failCount ?? -1,
        team2RawUrlPass: Boolean(nft?.checks?.team2Evidence?.rawUrlPass),
        team4OpsTracePass: Boolean(nft?.checks?.team4OpsTrace?.pass)
      }
    },
    actionItems
  };

  const outputJsonPath = path.join(reportDir, `CONTROL_TOWER_AUTOMATION_STATUS_${date}.json`);
  const outputMdPath = path.join(reportDir, `CONTROL_TOWER_AUTOMATION_STATUS_${date}.md`);

  await mkdir(reportDir, { recursive: true });
  await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# CONTROL_TOWER_AUTOMATION_STATUS_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Release control state: ${releaseControlState}`,
    `- Overall control readiness: ${markdownStatus(controlReady)}`,
    "",
    "## Lane Protocol",
    `- Status: ${markdownStatus(lanePass)}`,
    `- Mission map: ${markdownStatus(snapshot.checks.laneProtocol.missionMapPass)}`,
    `- Daily reports: ${markdownStatus(snapshot.checks.laneProtocol.dailyReportsPass)}`,
    `- Ownership unresolved rows: ${unresolvedOwnershipRows}`,
    "",
    "## NFT Phase C Pair Gate",
    `- Status: ${markdownStatus(nftPass)}`,
    `- Verdict: ${nftVerdict}`,
    `- Team 2 packet status: ${snapshot.checks.nftPhaseC.team2Status}`,
    `- Team 4 packet status: ${snapshot.checks.nftPhaseC.team4Status}`,
    `- Team 2 checklist gaps (MISSING/FAIL): ${snapshot.checks.nftPhaseC.team2Missing}/${snapshot.checks.nftPhaseC.team2Fail}`,
    `- Team 2 raw URL closure: ${snapshot.checks.nftPhaseC.team2RawUrlPass ? "PASS" : "FAIL"}`,
    `- Team 4 ops trace mapping: ${snapshot.checks.nftPhaseC.team4OpsTracePass ? "PASS" : "FAIL"}`,
    "",
    "## Action Items",
    ...(actionItems.length === 0 ? ["- No blocking action items."] : actionItems.map((item) => `- ${item}`)),
    "",
    "## Runbook",
    "- `pnpm report:control-tower`",
    ""
  ].join("\n");

  await writeFile(outputMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      "",
      `Control tower automation snapshot generated for ${date}.`,
      `Release control state: ${releaseControlState}.`,
      `Overall readiness: ${controlReady ? "PASS" : "FAIL"}.`,
      `JSON: ${path.relative(root, outputJsonPath)}`,
      `MD: ${path.relative(root, outputMdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `control tower automation status check failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
