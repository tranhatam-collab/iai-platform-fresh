#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);

const option = (name, fallback) => {
  const flag = `--${name}`;
  const index = args.indexOf(flag);
  if (index === -1) {
    return fallback;
  }
  return args[index + 1] ?? fallback;
};

const openWaveRaw = option("open-wave", "2");
const openWave = Number.parseInt(openWaveRaw, 10);
if (!Number.isInteger(openWave) || openWave < 1) {
  console.error(`Invalid --open-wave value: ${openWaveRaw}`);
  process.exit(2);
}

const trackerPath = resolve(
  option(
    "tracker",
    "docs/iai-mail-platform/MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md"
  )
);

const source = readFileSync(trackerPath, "utf8");
const lines = source.split(/\r?\n/u);

const masterHeadingIndex = lines.findIndex((line) =>
  line.trim().toLowerCase() === "## tracker (master)"
);
if (masterHeadingIndex === -1) {
  console.error("Cannot find section '## Tracker (Master)' in tracker file.");
  process.exit(2);
}

const tableStart = lines.findIndex(
  (line, idx) => idx > masterHeadingIndex && line.trim().startsWith("| flow_name |")
);
if (tableStart === -1) {
  console.error("Cannot find master tracker table header.");
  process.exit(2);
}

const splitRow = (line) =>
  line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());

const headers = splitRow(lines[tableStart]);

const rows = [];
for (let i = tableStart + 1; i < lines.length; i += 1) {
  const line = lines[i].trim();
  if (!line.startsWith("|")) {
    break;
  }

  const cells = splitRow(line);
  if (cells.length !== headers.length) {
    continue;
  }

  const row = Object.fromEntries(headers.map((header, idx) => [header, cells[idx]]));
  if (row.flow_name === "---" || row.wave === "---") {
    continue;
  }

  const wave = Number.parseInt(row.wave, 10);
  if (!Number.isInteger(wave)) {
    continue;
  }

  rows.push({
    flowName: row.flow_name,
    wave,
    owner: row.owner,
    status: row.status,
    notes: row.notes
  });
}

const summary = {
  tracker: trackerPath,
  openWave,
  timestamp: new Date().toISOString(),
  byWave: [1, 2, 3].map((wave) => ({
    wave,
    total: rows.filter((row) => row.wave === wave).length,
    migrated: rows.filter((row) => row.wave === wave && row.status === "migrated").length
  }))
};

if (openWave <= 1) {
  console.log(JSON.stringify({ ok: true, reason: "wave_1_has_no_previous_gate", summary }, null, 2));
  process.exit(0);
}

const requiredWave = openWave - 1;
const blocking = rows.filter((row) => row.wave === requiredWave && row.status !== "migrated");

if (blocking.length > 0) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        reason: `wave_${openWave}_blocked_by_wave_${requiredWave}`,
        summary,
        blocking: blocking.map((row) => ({
          flowName: row.flowName,
          owner: row.owner,
          status: row.status,
          notes: row.notes
        }))
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      reason: `wave_${openWave}_can_start`,
      summary
    },
    null,
    2
  )
);
