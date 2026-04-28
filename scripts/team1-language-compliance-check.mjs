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

function collectViolations(file, body, patterns) {
  const lines = body.split("\n");
  const violations = [];

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        violations.push({
          file,
          line: index + 1,
          pattern: pattern.name,
          text: line.trim()
        });
      }
    }
  });

  return violations;
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");

  const team1ScopeFiles = [
    "docs/EXECUTION_BOARD_2026-04-18.md",
    "docs/IAI_TEAM1_LIVE_TRACKING_BOARD_2026.md",
    "docs/TEAM_DAILY_COMMAND_PACK_2026-04-18.md",
    "docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-18.md",
    "docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-19.md",
    "docs/reports/team1/TEAM1_DECISION_LOG_2026.md",
    "docs/reports/team1/TEAM1_CONTINUOUS_EXECUTION_TIMELINE_2026-04-18.md",
    "docs/reports/team1/TEAM1_CONTINUOUS_EXECUTION_TIMELINE_2026-04-19.md",
    "docs/reports/team1/TEAM1_REMAINING_GATE_PACKET_CHECKLIST_2026-04-18.md",
    "docs/reports/team1/TEAM1_PACKET_REQUEST_BATCH_2026-04-18.md",
    "docs/reports/team1/TEAM1_OWNER_SIGNOFF_AND_PAY_GATE_CLOSURE_BATCH_2026-04-19.md",
    "docs/reports/team1/TEAM_ADMIN_NEXT_TASK_DIRECTIVE_2026-04-19.md",
    "docs/reports/team1/TEAM1_NO_GO_PACKET_STUB_AUDIT_2026-04-19.md",
    "docs/reports/team1/TEAM1_NO_GO_PACKET_STATUS_2026-04-19.md",
    "docs/reports/team1/PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-19.md",
    "docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-19.md",
    "docs/reports/team1/TEAM1_RISK_REGISTER_2026.md",
    "docs/reports/team1/WEEKLY_TEAM1_INTEGRATED_2026_W16.md",
    "docs/reports/team1/LANE_A_EXECUTION_DIRECTIVE_2026-04-15.md",
    "docs/reports/team1/DAILY_TEAM1_2026-04-19.md",
    "docs/reports/team1/TEAM1_LANGUAGE_COMPLIANCE_REVIEW_2026-04-19.md"
  ];

  const readinessFiles = [
    "docs/IAI_MULTILINGUAL_EXPANSION_PLAYBOOK_2026.md",
    "docs/IAI_LANGUAGE_GLOSSARY_CANONICAL_2026.md",
    `docs/reports/team1/TEAM1_MULTILINGUAL_EXPANSION_READINESS_${date}.md`,
    `docs/reports/team1/TEAM1_DEV_BEST_VERSION_BASELINE_${date}.md`
  ];

  const unaccentedPatternRules = [
    { name: "khong", regex: /\bkhong\b/ },
    { name: "duoc", regex: /\bduoc\b/ },
    { name: "chua", regex: /\bchua\b/ },
    { name: "giu", regex: /\bgiu\b/ },
    { name: "mo", regex: /\bmo\b/ },
    { name: "dong", regex: /\bdong\b/ },
    { name: "tiep", regex: /\btiep\b/ },
    { name: "cap_nhat", regex: /\bcap nhat\b/ },
    { name: "quyet_dinh", regex: /\bquyet dinh\b/ },
    { name: "bao_cao", regex: /\bbao cao\b/ },
    { name: "giao_viec", regex: /\bgiao viec\b/ },
    { name: "hoan_tat", regex: /\bhoan tat\b/ },
    { name: "thuc_thi", regex: /\bthuc thi\b/ },
    { name: "on_dinh", regex: /\bon dinh\b/ },
    { name: "mo_rong", regex: /\bmo rong\b/ },
    { name: "nhan", regex: /\bnhan\b/ },
    { name: "xac_nhan", regex: /\bxac nhan\b/ },
    { name: "tat_ca", regex: /\btat ca\b/ },
    { name: "ngon_ngu", regex: /\bngon ngu\b/ },
    { name: "bat_buoc", regex: /\bbat buoc\b/ },
    { name: "can_mot", regex: /\bcan mot\b/ },
    { name: "nhieu", regex: /\bnhieu\b/ },
    { name: "thieu", regex: /\bthieu\b/ },
    { name: "dang", regex: /\bdang\b/ },
    { name: "truoc", regex: /\btruoc\b/ },
    { name: "hien_tai", regex: /\bhien tai\b/ }
  ];

  const scopeChecks = await Promise.all(
    team1ScopeFiles.map(async (relativePath) => {
      const absolutePath = path.join(root, relativePath);
      const present = await fileExists(absolutePath);
      if (!present) {
        return {
          file: relativePath,
          present,
          violations: []
        };
      }

      const body = await readFile(absolutePath, "utf8");
      return {
        file: relativePath,
        present,
        violations: collectViolations(relativePath, body, unaccentedPatternRules)
      };
    })
  );

  const readinessChecks = await Promise.all(
    readinessFiles.map(async (relativePath) => ({
      file: relativePath,
      present: await fileExists(path.join(root, relativePath))
    }))
  );

  const missingScopeFiles = scopeChecks.filter((entry) => !entry.present);
  const scopeViolations = scopeChecks.flatMap((entry) => entry.violations);
  const missingReadinessFiles = readinessChecks.filter((entry) => !entry.present);

  const scopePass = missingScopeFiles.length === 0 && scopeViolations.length === 0;
  const readinessPass = missingReadinessFiles.length === 0;
  const overallPass = scopePass && readinessPass;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    overallPass,
    checks: {
      team1ScopeLanguage: {
        pass: scopePass,
        missingFiles: missingScopeFiles.map((entry) => entry.file),
        violationCount: scopeViolations.length,
        violations: scopeViolations.slice(0, 200)
      },
      multilingualReadiness: {
        pass: readinessPass,
        requiredFiles: readinessChecks
      }
    }
  };

  await mkdir(reportDir, { recursive: true });
  const summaryPathJson = path.join(reportDir, `TEAM1_LANGUAGE_COMPLIANCE_STATUS_${date}.json`);
  const summaryPathMd = path.join(reportDir, `TEAM1_LANGUAGE_COMPLIANCE_STATUS_${date}.md`);
  await writeFile(summaryPathJson, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAM1_LANGUAGE_COMPLIANCE_STATUS_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Overall: ${markdownStatus(overallPass)}`,
    "",
    "## Team 1 Scope Language",
    `- Status: ${markdownStatus(scopePass)}`,
    `- Missing files: ${missingScopeFiles.length}`,
    ...missingScopeFiles.map((entry) => `- [ ] ${entry.file}`),
    `- Violations: ${scopeViolations.length}`,
    ...scopeViolations.slice(0, 50).map(
      (entry) => `- ${entry.file}:${entry.line} [${entry.pattern}] ${entry.text}`
    ),
    "",
    "## Multilingual Readiness Files",
    `- Status: ${markdownStatus(readinessPass)}`,
    ...readinessChecks.map((entry) => `- ${entry.present ? "[x]" : "[ ]"} ${entry.file}`),
    ""
  ].join("\n");

  await writeFile(summaryPathMd, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Team 1 language snapshot generated for ${date}.`,
      `Overall: ${overallPass ? "PASS" : "FAIL"}.`,
      `JSON: ${path.relative(root, summaryPathJson)}`,
      `MD: ${path.relative(root, summaryPathMd)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team1 language compliance check failed: ${
      error instanceof Error ? error.message : String(error)
    }\n`
  );
  process.exitCode = 1;
});
