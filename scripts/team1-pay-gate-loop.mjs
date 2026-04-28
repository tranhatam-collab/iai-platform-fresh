#!/usr/bin/env node
/**
 * team1-pay-gate-loop.mjs
 *
 * Chay tuan tu toan bo chuoi probe + gate + review + completion cho pay
 * production gate, in tom tat 1 man hinh de Team 1 doc nhanh.
 *
 * Usage:
 *   node scripts/team1-pay-gate-loop.mjs            # date theo ICT hom nay
 *   node scripts/team1-pay-gate-loop.mjs --date=YYYY-MM-DD
 */

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
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
  const explicit = process.argv.find((arg) => arg.startsWith("--date="));
  if (explicit) {
    return explicit.slice("--date=".length);
  }
  return todayInTimezone(timezone);
}

function runStep(label, command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ label, code: code ?? 0, stdout, stderr });
    });
  });
}

async function readJsonOrNull(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();

  const steps = [
    {
      label: "team2-runtime-probe",
      command: "node",
      args: ["scripts/team2-pay-prod-runtime-probe.mjs", `--date=${date}`]
    },
    {
      label: "team2-shared-runtime-probe",
      command: "node",
      args: ["scripts/team2-pay-shared-runtime-probe.mjs", `--date=${date}`]
    },
    {
      label: "team2-rerun-bundle",
      command: "node",
      args: ["scripts/team2-pay-prod-rerun-bundle.mjs", `--date=${date}`]
    },
    {
      label: "team1-pay-prod-gate",
      command: "node",
      args: ["scripts/team1-pay-prod-gate-check.mjs", `--date=${date}`]
    },
    {
      label: "team1-rerun-review",
      command: "node",
      args: ["scripts/team1-pay-full-rerun-review-check.mjs", `--date=${date}`]
    },
    {
      label: "team1-all-teams-completion",
      command: "node",
      args: ["scripts/team1-all-teams-completion-status-check.mjs", `--date=${date}`]
    }
  ];

  const results = [];
  for (const step of steps) {
    process.stdout.write(`\n>> ${step.label}\n`);
    const result = await runStep(step.label, step.command, step.args);
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    results.push(result);
  }

  const gatePath = path.join(
    root,
    "docs",
    "reports",
    "team1",
    `TEAM1_PAY_PROD_GATE_STATUS_${date}.json`
  );
  const bundlePath = path.join(
    root,
    "docs",
    "reports",
    "team2",
    `TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_${date}.json`
  );
  const completionPath = path.join(
    root,
    "docs",
    "reports",
    "team1",
    `TEAM_ADMIN_ALL_TEAMS_COMPLETION_STATUS_${date}.json`
  );
  const probePath = path.join(
    root,
    "docs",
    "reports",
    "team2",
    `TEAM2_PAY_PROD_RUNTIME_PROBE_${date}.json`
  );
  const sharedProbePath = path.join(
    root,
    "docs",
    "reports",
    "team2",
    `TEAM2_PAY_SHARED_RUNTIME_PROBE_${date}.json`
  );

  const [gate, bundle, completion, probe, sharedProbe] = await Promise.all([
    readJsonOrNull(gatePath),
    readJsonOrNull(bundlePath),
    readJsonOrNull(completionPath),
    readJsonOrNull(probePath),
    readJsonOrNull(sharedProbePath)
  ]);

  const summary = {
    date,
    timezone,
    gate_overall_pass: gate?.overallPass === true,
    gate_decision: gate?.gateDecision ?? "UNKNOWN",
    gate_unmet_signals: gate?.unmetSignals ?? [],
    bundle_status: bundle?.status ?? "UNKNOWN",
    completion_state: completion?.gateState ?? completion?.state ?? "UNKNOWN",
    completion_percent: completion?.completionPercent ?? null,
    runtime_probe_auth_key_present: probe?.signals?.auth_key_present === true,
    runtime_probe_checkout_status: probe?.responses?.checkout?.status ?? null,
    shared_health_contract_shape:
      sharedProbe?.extracted?.health_contract_shape ?? "unknown",
    step_results: results.map((result) => ({
      label: result.label,
      exit_code: result.code
    }))
  };

  process.stdout.write("\n=== PAY GATE LOOP SUMMARY ===\n");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (!summary.gate_overall_pass) {
    process.exitCode = 0; // do not fail loop; this is a status reporter
  }
}

main().catch((error) => {
  process.stderr.write(
    `team1-pay-gate-loop failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
