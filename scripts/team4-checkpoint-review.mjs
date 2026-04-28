import { access, readFile } from "node:fs/promises";
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
  return explicit ? explicit.slice("--date=".length) : todayInTimezone(timezone);
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function requireIncludes(content, required, label) {
  for (const item of required) {
    if (!content.includes(item)) {
      throw new Error(`${label} thiếu nội dung bắt buộc: ${item}`);
    }
  }
}

function requireMatches(content, patterns, label) {
  for (const pattern of patterns) {
    if (!pattern.test(content)) {
      throw new Error(`${label} thiếu nội dung khớp mẫu bắt buộc: ${pattern}`);
    }
  }
}

function requireNotIncludes(content, forbidden, label) {
  for (const item of forbidden) {
    if (content.includes(item)) {
      throw new Error(`${label} có nội dung không hợp lệ: ${item}`);
    }
  }
}

async function main() {
  const root = process.cwd();
  const date = getDateArg();

  const dailyRelative = `docs/reports/team4/DAILY_TEAM4_${date}.md`;
  const reportRelative = `docs/reports/team4/REPORT_TEAM4_${date}.md`;
  const packetRelative = "docs/reports/team4/TEAM4_NFT_PARTNER_OPS_EVIDENCE_PACKET_2026.md";
  const intakeRelative = "docs/reports/team4/TEAM4_TO_TEAM1_INTAKE_CHECKLIST_2026-04-17.md";

  const dailyPath = path.join(root, dailyRelative);
  const reportPath = path.join(root, reportRelative);
  const packetPath = path.join(root, packetRelative);
  const intakePath = path.join(root, intakeRelative);

  for (const target of [dailyPath, reportPath, packetPath, intakePath]) {
    if (!(await fileExists(target))) {
      throw new Error(`Không tìm thấy file bắt buộc: ${path.relative(root, target)}`);
    }
  }

  const [dailyBody, reportBody, packetBody, intakeBody] = await Promise.all([
    readFile(dailyPath, "utf8"),
    readFile(reportPath, "utf8"),
    readFile(packetPath, "utf8"),
    readFile(intakePath, "utf8")
  ]);

  const requiredCheckpointSections = [
    "DONE:",
    "IN PROGRESS:",
    "BLOCK:",
    "NEXT:",
    "TEST PROOF:",
    "COMMIT HASH:"
  ];

  requireIncludes(dailyBody, requiredCheckpointSections, dailyRelative);
  requireIncludes(reportBody, requiredCheckpointSections, reportRelative);

  requireIncludes(
    packetBody,
    [
      "## Status: READY_FOR_TEAM1_REVIEW",
      "Trạng thái hiện tại: `READY_FOR_TEAM1_REVIEW`"
    ],
    packetRelative
  );
  requireMatches(
    packetBody,
    [/trace mapping cho `wrong asset opening request` \+ `deny mismatch`/i],
    packetRelative
  );

  requireNotIncludes(
    packetBody,
    ["## Status: TEMPLATE", "Current status: `BLOCKED`", "Status: BLOCKED"],
    packetRelative
  );

  requireIncludes(
    intakeBody,
    [
      "Trạng thái packet: `READY_FOR_TEAM1_REVIEW`",
      "trace mapping cho `wrong asset opening request` + `deny mismatch`",
      "requested_asset_id"
    ],
    intakeRelative
  );

  process.stdout.write(
    [
      `Team 4 checkpoint review PASS cho ngày ${date}.`,
      `Verified: ${dailyRelative}`,
      `Verified: ${reportRelative}`,
      `Verified: ${packetRelative}`,
      `Verified: ${intakeRelative}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team4 checkpoint review failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
