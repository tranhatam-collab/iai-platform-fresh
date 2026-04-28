import { mkdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

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

const dateTag = getDateArg();
const outputDir = "docs/release-evidence/cios.iai.one/artifacts/screenshots";
const manifestDir = "docs/release-evidence/cios.iai.one/artifacts";
const markdownPath = `${manifestDir}/CIOS_IAI_ONE_FRESH_SCREENSHOT_PROOF_${dateTag}.md`;
const jsonPath = `${manifestDir}/CIOS_IAI_ONE_FRESH_SCREENSHOT_PROOF_${dateTag}.json`;

const screenshotTargets = [
  {
    source: "../cios.iai.one/site/index.html",
    route: "https://cios.iai.one/",
    file: "root.png"
  },
  {
    source: "../cios.iai.one/site/cios/index.html",
    route: "https://cios.iai.one/cios/",
    file: "cios-hub.png"
  },
  {
    source: "../cios.iai.one/site/cios/app/index.html",
    route: "https://cios.iai.one/cios/app/",
    file: "cios-app.png"
  },
  {
    source: "../cios.iai.one/site/cios/pricing/index.html",
    route: "https://cios.iai.one/cios/pricing/",
    file: "cios-pricing.png"
  },
  {
    source: "../cios.iai.one/site/cios/demo/index.html",
    route: "https://cios.iai.one/cios/demo/",
    file: "cios-demo.png"
  }
];

mkdirSync(outputDir, { recursive: true });
mkdirSync(manifestDir, { recursive: true });

const generatedAt = new Date().toISOString();
const results = [];

for (const target of screenshotTargets) {
  const run = spawnSync(
    "qlmanage",
    ["-t", "-s", "1600", "-o", outputDir, target.source],
    { encoding: "utf8" }
  );

  if (run.status !== 0) {
    const errorOutput = [run.stdout, run.stderr].filter(Boolean).join("\n");
    throw new Error(`qlmanage failed for ${target.source}\n${errorOutput}`);
  }

  const tempFile = path.join(outputDir, `${path.basename(target.source)}.png`);
  const finalFile = path.join(outputDir, target.file);
  renameSync(tempFile, finalFile);

  const bytes = statSync(finalFile).size;
  results.push({
    bytes,
    file: finalFile,
    route: target.route,
    source: target.source
  });
}

writeFileSync(jsonPath, `${JSON.stringify({ generatedAt, timezone, dateTag, results }, null, 2)}\n`, "utf8");
writeFileSync(markdownPath, renderMarkdown(generatedAt, results), "utf8");

process.stdout.write(`${markdownPath}\n`);
process.stdout.write(`${jsonPath}\n`);

function renderMarkdown(generatedAtValue, rows) {
  const lines = [];
  lines.push(`# CIOS Fresh Screenshot Proof ${dateTag}`);
  lines.push("");
  lines.push(`- Generated at: \`${generatedAtValue}\``);
  lines.push(`- Timezone: \`${timezone}\``);
  lines.push(`- Method: \`qlmanage -t -s 1600\``);
  lines.push("");
  lines.push("| Route | Source shell | Screenshot file | Size (bytes) |");
  lines.push("|---|---|---|---:|");

  for (const row of rows) {
    lines.push(
      `| \`${row.route}\` | \`${row.source}\` | \`${row.file}\` | ${row.bytes} |`
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}
