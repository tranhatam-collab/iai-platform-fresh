import { readFile } from "node:fs/promises";
import path from "node:path";

const targetFiles = [
  "docs/reports/team5/DAILY_TEAM5_2026-04-14.md",
  "docs/reports/team5/DAILY_TEAM5_2026-04-15.md",
  "docs/reports/team5/DAILY_TEAM5_2026-04-17.md",
  "docs/reports/team5/DAILY_TEAM5_2026-04-18.md",
  "docs/reports/team5/DAILY_TEAM5_2026-04-19.md",
  "docs/reports/team5/REPORT_TEAM5_2026-04-18.md",
  "docs/reports/team5/REPORT_TEAM5_2026-04-19.md",
  "docs/reports/team5/WEB_KPI_DELTA_2026-04-18_TO_2026-04-19.md",
  "docs/reports/team5/WEB_KPI_BUNDLE_2026-04-19.md",
  "docs/reports/team5/TEAM5_LIVE_SYNC_READINESS_2026-04-19.md",
  "docs/reports/team5/TEAM5_LIVE_SYNC_FINAL_PACKET_2026-04-19.md",
  "docs/reports/team5/TEAM5_WEB_GATE_REOPEN_REQUEST_2026-04-17.md",
  "docs/reports/team5/WEEKLY_TEAM5_2026_W16.md",
  "docs/release-evidence/web.iai.one/WEB_IAI_ONE_PREVIEW_RELEASE_EVIDENCE_PACKET_2026-04-17.md",
  "docs/release-evidence/web.iai.one/WEB_IAI_ONE_BILINGUAL_ROUTE_QA_PACKET_2026-04-17.md",
  "docs/WEB_IAI_ONE_NEW_TEAM_EXECUTION_PLAN_2026.md",
  "docs/WEB_IAI_ONE_EXPERIMENT_REGISTRY_2026.md",
  "docs/WEB_IAI_ONE_KPI_BASELINE_AND_RELEASE_GATES_2026.md",
  "docs/WEB_IAI_ONE_WEEKLY_GROWTH_REPORT_2026.md",
  "docs/WEB_IAI_ONE_BILINGUAL_SEO_EXECUTION_LOG_2026.md"
];

const forbiddenPatterns = [
  /\bkhong\b/giu,
  /\bduoc\b/giu,
  /\bMuc tieu\b/giu,
  /\bcap nhat\b/giu,
  /\bdong bo\b/giu,
  /\btiep tuc\b/giu,
  /\bhoan tat\b/giu,
  /\bquan sat\b/giu,
  /\bro rang\b/giu,
  /\bbat buoc\b/giu,
  /\btoi thieu\b/giu,
  /\btat ca\b/giu,
  /\bthuc thi\b/giu,
  /\bxac nhan\b/giu,
  /\byeu cau\b/giu,
  /\bcua so\b/giu
];

function collectViolations(content) {
  const lines = content.split(/\r?\n/);
  const violations = [];

  lines.forEach((line, index) => {
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(line)) {
        violations.push({
          line: index + 1,
          pattern: pattern.source
        });
      }
    }
  });

  return violations;
}

async function main() {
  const root = process.cwd();
  let hasViolation = false;

  for (const relativeFile of targetFiles) {
    const absoluteFile = path.join(root, relativeFile);
    const content = await readFile(absoluteFile, "utf8");
    const violations = collectViolations(content);
    if (violations.length === 0) {
      continue;
    }

    hasViolation = true;
    for (const violation of violations) {
      process.stderr.write(
        `[team5-language] ${relativeFile}:${violation.line} matched forbidden pattern /${violation.pattern}/\n`
      );
    }
  }

  if (hasViolation) {
    process.stderr.write(
      "Team 5 language review failed: còn cụm tiếng Việt không dấu trong tài liệu kiểm soát.\n"
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Team 5 language review passed (${targetFiles.length} files).\n`
  );
}

main().catch((error) => {
  process.stderr.write(
    `team5 language review check failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
