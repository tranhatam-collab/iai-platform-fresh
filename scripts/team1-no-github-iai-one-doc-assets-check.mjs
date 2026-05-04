#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";

const protectedRoots = [
  {
    name: "docs root",
    test: (filePath) => filePath.startsWith("docs/")
  },
  {
    name: "pay docs",
    test: (filePath) => filePath.startsWith("pay.iai.one/docs/")
  },
  {
    name: "pay plans",
    test: (filePath) => filePath.startsWith("pay.iai.one/plans/")
  }
];

const protectedExtensions = new Set([
  ".doc",
  ".docx",
  ".epub",
  ".pdf",
  ".zip",
  ".kpf",
  ".pages",
  ".key",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx"
]);

const rootOperationalDocs = new Set([
  "AI_TEAM_AUTO_ORCHESTRATOR.md",
  "AUTO_CREDIT_MANAGER_FOR_AI_DEVELOPMENT.md",
  "IAI_FLOW_DASK_TUYET_DOI.md",
  "PROJECT_STATUS_SNAPSHOT.md"
]);

const keywordRules = [
  {
    name: "security/env/bindings",
    pattern: /(^|[/_.-])(env|secret|secrets|token|api[-_]?key|credential|credentials|binding|bindings|owner|account|matrix)([/_.-]|$)/i
  },
  {
    name: "cloudflare/deploy/release",
    pattern: /(^|[/_.-])(cloudflare|wrangler|deploy|deployment|release|gate|go[-_]?live)([/_.-]|$)/i
  },
  {
    name: "team plan/board/handoff",
    pattern: /(^|[/_.-])(plan|execution|directive|board|handoff|sync|status|snapshot|packet|checklist|report)([/_.-]|$)/i
  },
  {
    name: "payment/mail/provider operations",
    pattern: /(^|[/_.-])(pay|payment|payos|smtp|mail|provider|webhook|wallet|settlement|reconciliation)([/_.-]|$)/i
  },
  {
    name: "publication/book artifact",
    pattern: /(^|[/_.-])(book|manuscript|chapter|publication|kdp|final[-_]?package|amazon[-_]?exports)([/_.-]|$)/i
  }
];

function runGit(args, root) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `git ${args.join(" ")} failed`);
  }

  return result.stdout;
}

function timestampInTimezone(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  })
    .formatToParts(new Date())
    .reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}_ICT`;
}

function classify(filePath) {
  const categories = [];
  const extension = path.extname(filePath).toLowerCase();

  for (const root of protectedRoots) {
    if (root.test(filePath)) {
      categories.push(root.name);
    }
  }

  if (protectedExtensions.has(extension)) {
    categories.push("publication/binary document");
  }

  if (rootOperationalDocs.has(filePath)) {
    categories.push("root operational doc");
  }

  if (categories.length > 0) {
    for (const rule of keywordRules) {
      if (rule.pattern.test(filePath)) {
        categories.push(rule.name);
      }
    }
  }

  return [...new Set(categories)];
}

function countBy(items, getKeys) {
  const counts = new Map();
  for (const item of items) {
    for (const key of getKeys(item)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function topFindings(findings, limit = 80) {
  return findings
    .slice(0, limit)
    .map((finding) => `- ${finding.path} | ${finding.categories.join(", ")}`);
}

async function main() {
  const root = runGit(["rev-parse", "--show-toplevel"], process.cwd()).trim();
  const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"], root).trim();
  const timestamp = timestampInTimezone(timezone);
  const reportDir = path.join(root, "docs", "reports", "team1");
  const reportFile = `TEAM1_NO_GITHUB_IAI_DOC_ASSETS_CHECK_${timestamp}.md`;
  const reportPath = path.join(reportDir, reportFile);

  const trackedFiles = runGit(["ls-files", "-z"], root)
    .split("\0")
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const findings = trackedFiles
    .map((filePath) => ({
      path: filePath,
      categories: classify(filePath)
    }))
    .filter((entry) => entry.categories.length > 0);

  const blocked = findings.length > 0;
  const categoryCounts = countBy(findings, (finding) => finding.categories);
  const rootCounts = countBy(findings, (finding) => [finding.path.split("/")[0]]);

  await mkdir(reportDir, { recursive: true });

  const markdown = [
    `# TEAM1_NO_GITHUB_IAI_DOC_ASSETS_CHECK_${timestamp}`,
    `- Generated at: ${new Date().toISOString()}`,
    `- Timezone: ${timezone}`,
    `- Repository: ${root}`,
    `- Branch: ${branch}`,
    `- Policy: no GitHub upload for iai.one docs/plans/reports/evidence/book/publication assets`,
    `- Status: ${blocked ? "BLOCKED" : "PASS"}`,
    `- Git index files scanned: ${trackedFiles.length}`,
    `- Findings in Git index: ${findings.length}`,
    "",
    "## Category counts",
    ...(categoryCounts.length === 0
      ? ["- none"]
      : categoryCounts.map(([category, count]) => `- ${category}: ${count}`)),
    "",
    "## Top-level counts",
    ...(rootCounts.length === 0
      ? ["- none"]
      : rootCounts.map(([rootName, count]) => `- ${rootName}: ${count}`)),
    "",
    "## Findings",
    ...(findings.length === 0 ? ["- none"] : topFindings(findings)),
    findings.length > 80 ? `- ... ${findings.length - 80} additional findings omitted from preview` : "",
    "",
    "## Team notice",
    "- Do not create a new repository to push iai.one docs, plans, release evidence, reports, or book/publication assets.",
    "- Do not git add docs/, pay.iai.one/docs/, pay.iai.one/plans/, binary publication assets, env binding docs, deployment matrices, release packets, or team handoff/status docs.",
    "- Keep GitHub for code, safe metadata, public samples, and manifests that do not contain raw operational material.",
    "- Full cleanup requires a reviewed quarantine/remove-from-index/history session; this guard intentionally does not rewrite history.",
    ""
  ].filter(Boolean).join("\n");

  await writeFile(reportPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `IAI GitHub docs/assets guard: ${blocked ? "BLOCKED" : "PASS"}`,
      `Git index files scanned: ${trackedFiles.length}`,
      `Findings in Git index: ${findings.length}`,
      `Report: ${path.relative(root, reportPath)}`
    ].join("\n")
  );

  if (blocked) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(
    `IAI GitHub docs/assets guard failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
