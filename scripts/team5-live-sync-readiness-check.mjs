import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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

function parseArg(prefix) {
  const entry = process.argv.find((argument) => argument.startsWith(`${prefix}=`));
  return entry ? entry.slice(prefix.length + 1) : null;
}

function boolStatus(value) {
  return value ? "PASS" : "FAIL";
}

async function resolveControlTowerSnapshot(root, requestedDate) {
  const reportsDir = path.join(root, "docs", "reports", "team1");
  const requestedPath = path.join(
    reportsDir,
    `CONTROL_TOWER_AUTOMATION_STATUS_${requestedDate}.json`
  );

  try {
    const source = await readFile(requestedPath, "utf8");
    return {
      source,
      sourceDate: requestedDate,
      sourcePath: requestedPath
    };
  } catch (error) {
    const isMissingFile =
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT";

    if (!isMissingFile) {
      throw error;
    }

    const entries = await readdir(reportsDir);
    const availableDates = entries
      .flatMap((entry) => {
        const match = /^CONTROL_TOWER_AUTOMATION_STATUS_(\d{4}-\d{2}-\d{2})\.json$/.exec(entry);
        return match ? [match[1]] : [];
      })
      .sort((left, right) => right.localeCompare(left));

    const fallbackDate =
      availableDates.find((date) => date <= requestedDate) ?? availableDates[0];

    if (!fallbackDate) {
      throw new Error("Không tìm thấy CONTROL_TOWER_AUTOMATION_STATUS_*.json.");
    }

    const fallbackPath = path.join(
      reportsDir,
      `CONTROL_TOWER_AUTOMATION_STATUS_${fallbackDate}.json`
    );
    const source = await readFile(fallbackPath, "utf8");
    return {
      source,
      sourceDate: fallbackDate,
      sourcePath: fallbackPath
    };
  }
}

async function main() {
  const root = process.cwd();
  const date = parseArg("--date") ?? todayInTimezone(timezone);
  const controlTowerSnapshot = await resolveControlTowerSnapshot(root, date);
  const controlTower = JSON.parse(controlTowerSnapshot.source);

  const governanceReady = controlTower.releaseControlState === "READY" || controlTower.controlReady === true;
  const noGoOwnersDone = controlTower.checks?.noGoPacketTracker?.pass === true;
  const payProdGateDone = controlTower.checks?.payProductionGate?.pass === true;
  const releaseClaimUnlocked =
    controlTower.releaseClaimEligible === true &&
    controlTower.releaseClaimState !== "LOCK_RETAINED";

  const readyForSynchronizedLive =
    governanceReady &&
    noGoOwnersDone &&
    payProdGateDone &&
    releaseClaimUnlocked;

  const blockers = [];
  if (!governanceReady) {
    blockers.push("Governance loop chưa ở READY.");
  }
  if (!noGoOwnersDone) {
    const pending = controlTower.checks?.noGoPacketTracker?.pendingOwnerSignoffDomains ?? [];
    blockers.push(
      `Owner sign-off NO-GO chưa hoàn tất${pending.length > 0 ? `: ${pending.join(", ")}` : "."}`
    );
  }
  if (!payProdGateDone) {
    const unmetSignals = controlTower.checks?.payProductionGate?.unmetSignals ?? [];
    blockers.push(
      `Pay production gate chưa pass${unmetSignals.length > 0 ? `: ${unmetSignals.join(", ")}` : "."}`
    );
  }
  if (!releaseClaimUnlocked) {
    blockers.push(
      `Release-claim state chưa thoát ${controlTower.releaseClaimState ?? "LOCK_RETAINED"}.`
    );
  }

  const result = {
    generatedAt: new Date().toISOString(),
    timezone,
    requestedDate: date,
    date: controlTowerSnapshot.sourceDate,
    source: {
      controlTowerPath: path.relative(root, controlTowerSnapshot.sourcePath)
    },
    status: readyForSynchronizedLive
      ? "READY_FOR_SYNCHRONIZED_LIVE"
      : "NOT_READY_FOR_SYNCHRONIZED_LIVE",
    gates: {
      governanceReady: {
        pass: governanceReady,
        releaseControlState: controlTower.releaseControlState ?? "UNKNOWN"
      },
      noGoOwnersDone: {
        pass: noGoOwnersDone,
        pendingOwnerSignoffDomains:
          controlTower.checks?.noGoPacketTracker?.pendingOwnerSignoffDomains ?? []
      },
      payProductionGateDone: {
        pass: payProdGateDone,
        unmetSignals: controlTower.checks?.payProductionGate?.unmetSignals ?? []
      },
      releaseClaimUnlocked: {
        pass: releaseClaimUnlocked,
        releaseClaimState: controlTower.releaseClaimState ?? "UNKNOWN",
        releaseClaimEligible: controlTower.releaseClaimEligible === true
      }
    },
    blockers
  };

  const reportDir = path.join(root, "docs", "reports", "team5");
  await mkdir(reportDir, { recursive: true });

  const jsonPath = path.join(reportDir, `TEAM5_LIVE_SYNC_READINESS_${date}.json`);
  const mdPath = path.join(reportDir, `TEAM5_LIVE_SYNC_READINESS_${date}.md`);

  await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAM5_LIVE_SYNC_READINESS_${date}`,
    `- Thời điểm tạo: ${result.generatedAt}`,
    `- Múi giờ: ${timezone}`,
    `- Ngày checkpoint Team 5: ${date}`,
    `- Ngày snapshot Team 1 dùng để đối chiếu: ${result.date}`,
    `- Nguồn control-tower: ${result.source.controlTowerPath}`,
    `- Kết luận: ${result.status}`,
    "",
    "## Gate checks",
    `- Governance READY: ${boolStatus(result.gates.governanceReady.pass)} (state=${result.gates.governanceReady.releaseControlState})`,
    `- NO-GO owner sign-off done: ${boolStatus(result.gates.noGoOwnersDone.pass)}`,
    `- Pay production gate done: ${boolStatus(result.gates.payProductionGateDone.pass)}`,
    `- Release-claim unlocked: ${boolStatus(result.gates.releaseClaimUnlocked.pass)} (state=${result.gates.releaseClaimUnlocked.releaseClaimState})`,
    "",
    "## Blockers",
    ...(result.blockers.length > 0 ? result.blockers.map((blocker) => `- ${blocker}`) : ["- không có"]),
    ""
  ].join("\n");

  await writeFile(mdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Team 5 live-sync readiness cho ngày ${date}: ${result.status}.`,
      `Team 1 snapshot dùng để đối chiếu: ${result.date}.`,
      `Governance READY: ${boolStatus(governanceReady)}.`,
      `NO-GO owner sign-off done: ${boolStatus(noGoOwnersDone)}.`,
      `Pay production gate done: ${boolStatus(payProdGateDone)}.`,
      `Release-claim unlocked: ${boolStatus(releaseClaimUnlocked)}.`,
      `JSON: ${path.relative(root, jsonPath)}`,
      `MD: ${path.relative(root, mdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team5 live-sync readiness check failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
