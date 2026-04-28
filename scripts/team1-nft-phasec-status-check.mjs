import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
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

async function fileExists(absolutePath) {
  try {
    await access(absolutePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function extractPacketStatus(body) {
  const match = body.match(/^## Status:\s*(.+)$/m);
  return match ? match[1].trim() : "UNKNOWN";
}

function extractFastReadTableStatuses(body) {
  const anchor = body.indexOf("### Team 1 fast-read checklist");
  if (anchor < 0) {
    return [];
  }

  const tail = body.slice(anchor);
  const nextSection = tail.indexOf("\n---");
  const block = nextSection >= 0 ? tail.slice(0, nextSection) : tail;

  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && !line.includes("|---"))
    .filter((line) => !line.includes("| Check | Status |"))
    .map((line) => {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);

      if (cells.length < 2) {
        return null;
      }

      return {
        check: cells[0],
        status: cells[1]
      };
    })
    .filter(Boolean);
}

function extractQueueStatus(queueBody, slot) {
  const pattern = new RegExp(`\\|\\s*${slot}\\s*\\|[^\\n]+\\|`);
  const row = queueBody.match(pattern)?.[0] ?? "";
  const cells = row
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  if (cells.length < 6) {
    return {
      packetStatus: "UNKNOWN",
      intakeStatus: "UNKNOWN"
    };
  }

  return {
    packetStatus: cells[3],
    intakeStatus: cells[4]
  };
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");

  const packetTeam2 = "docs/runtime/TEAM2_NFT_LIVE_EVIDENCE_PACKET_2026.md";
  const packetTeam4 = "docs/reports/team4/TEAM4_NFT_PARTNER_OPS_EVIDENCE_PACKET_2026.md";
  const intakeQueue = "docs/reports/team1/NFT_PHASE_C_TEAM1_INTAKE_REVIEW_QUEUE_2026-04-17.md";
  const readinessSync = "docs/reports/team1/NFT_TEAM1_READINESS_SYNC_2026-04-17.md";

  const files = [
    packetTeam2,
    packetTeam4,
    intakeQueue,
    readinessSync
  ];

  const fileChecks = await Promise.all(
    files.map(async (relativePath) => {
      const present = await fileExists(path.join(root, relativePath));
      return { file: relativePath, present };
    })
  );

  const allFilesPresent = fileChecks.every((entry) => entry.present);
  if (!allFilesPresent) {
    const missing = fileChecks.filter((entry) => !entry.present).map((entry) => entry.file);
    throw new Error(`missing required files: ${missing.join(", ")}`);
  }

  const team2Body = await readFile(path.join(root, packetTeam2), "utf8");
  const team4Body = await readFile(path.join(root, packetTeam4), "utf8");
  const queueBody = await readFile(path.join(root, intakeQueue), "utf8");

  const team2Status = extractPacketStatus(team2Body);
  const team4Status = extractPacketStatus(team4Body);

  const team2Checklist = extractFastReadTableStatuses(team2Body);
  const team2Missing = team2Checklist.filter((entry) => entry.status === "MISSING");
  const team2Fail = team2Checklist.filter((entry) => entry.status === "FAIL");
  const team2RawUrlPass = /-\s*statement:\s*\n\s*-\s*`PASS`/m.test(team2Body);

  const team4HasWrongAssetTrace = /wrong asset opening request/i.test(team4Body);
  const team4HasDenyMismatchTrace = /deny mismatch/i.test(team4Body);

  const queueA = extractQueueStatus(queueBody, "A");
  const queueB = extractQueueStatus(queueBody, "B");

  const preconditionPass =
    team2Status === "READY_FOR_TEAM1_REVIEW" &&
    team4Status === "READY_FOR_TEAM1_REVIEW";

  const team2EvidencePass =
    team2Missing.length === 0 &&
    team2Fail.length === 0 &&
    team2RawUrlPass;

  const team4OpsPass =
    team4HasWrongAssetTrace &&
    team4HasDenyMismatchTrace;

  const overallPass = preconditionPass && team2EvidencePass && team4OpsPass;
  const verdict = overallPass ? "GO" : "NO-GO";

  const actionItems = [];
  if (team2Status !== "READY_FOR_TEAM1_REVIEW") {
    actionItems.push("Team 2: move packet status to `READY_FOR_TEAM1_REVIEW` only after full proof chain closure.");
  }
  if (team2Missing.length > 0 || team2Fail.length > 0) {
    actionItems.push(
      `Team 2: close checklist gaps (MISSING=${team2Missing.length}, FAIL=${team2Fail.length}).`
    );
  }
  if (!team2RawUrlPass) {
    actionItems.push("Team 2: close raw protected URL exposure check to `PASS`.");
  }
  if (!team4HasWrongAssetTrace || !team4HasDenyMismatchTrace) {
    actionItems.push(
      "Team 4: add explicit incident trace mapping for `wrong asset opening request` and `deny mismatch`."
    );
  }
  if (actionItems.length === 0) {
    actionItems.push("No blocking action items.");
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    overallPass,
    verdict,
    checks: {
      requiredFiles: {
        pass: allFilesPresent,
        items: fileChecks
      },
      packets: {
        team2Status,
        team4Status,
        preconditionPass
      },
      team2Evidence: {
        pass: team2EvidencePass,
        missingCount: team2Missing.length,
        failCount: team2Fail.length,
        rawUrlPass: team2RawUrlPass
      },
      team4OpsTrace: {
        pass: team4OpsPass,
        hasWrongAssetTrace: team4HasWrongAssetTrace,
        hasDenyMismatchTrace: team4HasDenyMismatchTrace
      },
      queueConsistency: {
        slotA: queueA,
        slotB: queueB
      }
    },
    actionItems
  };

  const reportJsonPath = path.join(reportDir, `NFT_PHASE_C_GATE_STATUS_${date}.json`);
  const reportMdPath = path.join(reportDir, `NFT_PHASE_C_GATE_STATUS_${date}.md`);

  await mkdir(reportDir, { recursive: true });
  await writeFile(reportJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# NFT_PHASE_C_GATE_STATUS_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Overall: ${markdownStatus(overallPass)}`,
    `- Final verdict: ${verdict}`,
    "",
    "## Required Files",
    `- Status: ${markdownStatus(allFilesPresent)}`,
    ...fileChecks.map((entry) => `- ${entry.present ? "[x]" : "[ ]"} ${entry.file}`),
    "",
    "## Packet Preconditions",
    `- Team 2 packet status: ${team2Status}`,
    `- Team 4 packet status: ${team4Status}`,
    `- Status: ${markdownStatus(preconditionPass)}`,
    "",
    "## Team 2 Evidence",
    `- Checklist MISSING rows: ${team2Missing.length}`,
    `- Checklist FAIL rows: ${team2Fail.length}`,
    `- Raw protected URL closure: ${team2RawUrlPass ? "PASS" : "FAIL"}`,
    `- Status: ${markdownStatus(team2EvidencePass)}`,
    "",
    "## Team 4 Ops Trace Mapping",
    `- Has \`wrong asset opening request\` mapping: ${team4HasWrongAssetTrace ? "Y" : "N"}`,
    `- Has \`deny mismatch\` mapping: ${team4HasDenyMismatchTrace ? "Y" : "N"}`,
    `- Status: ${markdownStatus(team4OpsPass)}`,
    "",
    "## Queue Consistency",
    `- Slot A packet/intake: ${queueA.packetStatus} / ${queueA.intakeStatus}`,
    `- Slot B packet/intake: ${queueB.packetStatus} / ${queueB.intakeStatus}`,
    "",
    "## Action Items",
    ...actionItems.map((item) => `- ${item}`),
    ""
  ].join("\n");

  await writeFile(reportMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `NFT Phase C gate snapshot generated for ${date}.`,
      `Overall: ${overallPass ? "PASS" : "FAIL"}.`,
      `Verdict: ${verdict}.`,
      `JSON: ${path.relative(root, reportJsonPath)}`,
      `MD: ${path.relative(root, reportMdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `nft phase c gate status check failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
