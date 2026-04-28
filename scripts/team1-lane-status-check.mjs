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

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");

  const requiredFiles = [
    "docs/CLOUDFLARE_DOMAIN_PROJECT_ACCOUNT_OWNER_MATRIX_2026.md",
    "docs/IAI_DEPLOY_FREEZE_AND_RELEASE_AUTHORITY_2026.md",
    "docs/IAI_GIT_ICLOUD_HYGIENE_TRUTH_2026.md",
    "docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md",
    "docs/IAI_MASTER_DOMAIN_MISSION_MAP.md",
    "docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md",
    "docs/IAI_TEAM1_LIVE_TRACKING_BOARD_2026.md",
    "docs/reports/team1/P0_CLOSURE_REPORT_2026-04-14.md",
    "docs/reports/team1/LANE_A_EXECUTION_DIRECTIVE_2026-04-14.md"
  ];

  const requiredFileChecks = await Promise.all(
    requiredFiles.map(async (relativePath) => {
      const absolutePath = path.join(root, relativePath);
      const present = await fileExists(absolutePath);
      return {
        file: relativePath,
        present
      };
    })
  );

  const matrixPath = path.join(root, "docs", "CLOUDFLARE_DOMAIN_PROJECT_ACCOUNT_OWNER_MATRIX_2026.md");
  const matrixBody = await readFile(matrixPath, "utf8");
  const matrixRows = matrixBody
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("| `"));
  const unresolvedMatrixRows = matrixRows.filter((line) => /\bTBD\b|\bUNASSIGNED\b/.test(line));

  const missionMapPath = path.join(root, "docs", "IAI_MASTER_DOMAIN_MISSION_MAP.md");
  const missionMapBody = await readFile(missionMapPath, "utf8");
  const missionChecks = [
    {
      check: "noos_p0_enforcement_clause",
      pass: missionMapBody.includes("P0 enforcement (effective April 14, 2026)")
    },
    {
      check: "legacy_investment_route_clause",
      pass: missionMapBody.includes("/docs/investment-programs/")
    },
    {
      check: "team3_gate_clause",
      pass: missionMapBody.includes("Team C cannot release NOOS public content changes without Team A boundary sign-off")
    }
  ];

  const masterProtocolPath = path.join(root, "docs", "MASTER_DEV_EXECUTION_PROTOCOL_2026.md");
  const masterProtocolBody = await readFile(masterProtocolPath, "utf8");
  const directivePath = path.join(root, "docs", "IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md");
  const directiveBody = await readFile(directivePath, "utf8");
  const decisionLogPath = path.join(root, "docs", "reports", "team1", "TEAM1_DECISION_LOG_2026.md");
  const decisionLogBody = await readFile(decisionLogPath, "utf8");
  const protocolChecks = [
    {
      check: "master_protocol_locked_clause",
      pass: masterProtocolBody.includes("## 0. Non-negotiable statement")
    },
    {
      check: "directive_root_protocol_mandatory_clause",
      pass: directiveBody.includes("## 0.1 Root protocol now mandatory for all teams and AI")
    },
    {
      check: "decision_log_protocol_adoption_2026_04_18",
      pass: decisionLogBody.includes("Team 1 adopt `docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md`")
    }
  ];

  const dailyChecks = await Promise.all(
    [1, 2, 3, 4, 5].map(async (teamNumber) => {
      const relativePath = `docs/reports/team${teamNumber}/DAILY_TEAM${teamNumber}_${date}.md`;
      const present = await fileExists(path.join(root, relativePath));
      return { team: `team${teamNumber}`, file: relativePath, present };
    })
  );

  const noosBoundaryTestPath = path.join(
    root,
    "tests",
    "integration",
    "noos-commerce-surface.test.mjs"
  );
  const noosBoundaryTestBody = await readFile(noosBoundaryTestPath, "utf8");
  const noosBoundaryChecks = [
    {
      check: "investment_program_route_asserted",
      pass: noosBoundaryTestBody.includes('"/docs/investment-programs/"')
    },
    {
      check: "redirect_status_asserted",
      pass: noosBoundaryTestBody.includes("assert.equal(legacyDocsResponse.status, 308)")
    },
    {
      check: "noindex_header_asserted",
      pass: noosBoundaryTestBody.includes('assert.match(legacyDocsResponse.headers?.["x-robots-tag"] ?? "", /noindex/)')
    }
  ];

  const requiredFilesPass = requiredFileChecks.every((entry) => entry.present);
  const matrixPass = unresolvedMatrixRows.length === 0;
  const missionPass = missionChecks.every((entry) => entry.pass);
  const protocolPass = protocolChecks.every((entry) => entry.pass);
  const dailyPass = dailyChecks.every((entry) => entry.present);
  const noosBoundaryPass = noosBoundaryChecks.every((entry) => entry.pass);

  const overallPass =
    requiredFilesPass &&
    matrixPass &&
    missionPass &&
    protocolPass &&
    dailyPass &&
    noosBoundaryPass;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    overallPass,
    checks: {
      requiredFiles: {
        pass: requiredFilesPass,
        items: requiredFileChecks
      },
      ownershipMatrix: {
        pass: matrixPass,
        unresolvedRows: unresolvedMatrixRows
      },
      missionMap: {
        pass: missionPass,
        items: missionChecks
      },
      protocolAdoption: {
        pass: protocolPass,
        items: protocolChecks
      },
      dailyReports: {
        pass: dailyPass,
        items: dailyChecks
      },
      noosBoundaryTestCoverage: {
        pass: noosBoundaryPass,
        items: noosBoundaryChecks
      }
    }
  };

  const summaryPathJson = path.join(reportDir, `LANE_STATUS_SNAPSHOT_${date}.json`);
  const summaryPathMd = path.join(reportDir, `LANE_STATUS_SNAPSHOT_${date}.md`);

  await mkdir(reportDir, { recursive: true });
  await writeFile(summaryPathJson, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# LANE_STATUS_SNAPSHOT_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Overall: ${markdownStatus(overallPass)}`,
    "",
    "## Required Files",
    `- Status: ${markdownStatus(requiredFilesPass)}`,
    ...requiredFileChecks.map(
      (entry) => `- ${entry.present ? "[x]" : "[ ]"} ${entry.file}`
    ),
    "",
    "## Ownership Matrix",
    `- Status: ${markdownStatus(matrixPass)}`,
    `- Unresolved rows: ${unresolvedMatrixRows.length}`,
    ...ensureArray(unresolvedMatrixRows).map((row) => `- ${row}`),
    "",
    "## Mission Map",
    `- Status: ${markdownStatus(missionPass)}`,
    ...missionChecks.map((entry) => `- ${markdownStatus(entry.pass)} ${entry.check}`),
    "",
    "## Protocol Adoption",
    `- Status: ${markdownStatus(protocolPass)}`,
    ...protocolChecks.map((entry) => `- ${markdownStatus(entry.pass)} ${entry.check}`),
    "",
    "## Daily Reports",
    `- Status: ${markdownStatus(dailyPass)}`,
    ...dailyChecks.map(
      (entry) => `- ${entry.present ? "[x]" : "[ ]"} ${entry.file}`
    ),
    "",
    "## NOOS Boundary Test Coverage",
    `- Status: ${markdownStatus(noosBoundaryPass)}`,
    ...noosBoundaryChecks.map((entry) => `- ${markdownStatus(entry.pass)} ${entry.check}`),
    ""
  ].join("\n");

  await writeFile(summaryPathMd, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Lane snapshot generated for ${date}.`,
      `Overall: ${overallPass ? "PASS" : "FAIL"}.`,
      `JSON: ${path.relative(root, summaryPathJson)}`,
      `MD: ${path.relative(root, summaryPathMd)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(`lane status check failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
