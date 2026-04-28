/**
 * team1-pay-gate-loop-contract.test.mjs
 *
 * Verifies the "PAY GATE LOOP SUMMARY" JSON emitted by
 * `scripts/team1-pay-gate-loop.mjs` keeps a stable contract that Team 1
 * tooling depends on. Pinned to date 2026-04-28 (artifacts already present
 * in repo) so the test does not regenerate or mutate evidence.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "..", "..");
const FIXED_DATE = "2026-04-28";

const REQUIRED_TOP_LEVEL_KEYS = [
  "date",
  "timezone",
  "gate_overall_pass",
  "gate_decision",
  "gate_unmet_signals",
  "bundle_status",
  "completion_state",
  "completion_percent",
  "runtime_probe_auth_key_present",
  "runtime_probe_checkout_status",
  "shared_health_contract_shape",
  "step_results"
];

const REQUIRED_STEP_LABELS = [
  "team2-runtime-probe",
  "team2-shared-runtime-probe",
  "team2-rerun-bundle",
  "team1-pay-prod-gate",
  "team1-rerun-review",
  "team1-all-teams-completion"
];

function extractSummary(stdout) {
  const marker = "=== PAY GATE LOOP SUMMARY ===";
  const idx = stdout.lastIndexOf(marker);
  if (idx === -1) {
    throw new Error("PAY GATE LOOP SUMMARY marker not found in stdout");
  }
  const tail = stdout.slice(idx + marker.length).trim();
  // Take from first '{' to last '}' to be tolerant of trailing newlines.
  const first = tail.indexOf("{");
  const last = tail.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("Could not isolate JSON block in summary");
  }
  return JSON.parse(tail.slice(first, last + 1));
}

test("team1-pay-gate-loop emits stable summary contract", { timeout: 600_000 }, () => {
  const proc = spawnSync(
    "node",
    ["scripts/team1-pay-gate-loop.mjs", `--date=${FIXED_DATE}`],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: process.env,
      timeout: 540_000
    }
  );
  assert.equal(proc.status, 0, `loop exited non-zero. stderr=${proc.stderr}`);
  const summary = extractSummary(proc.stdout);

  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(summary, key),
      `summary missing key: ${key}`
    );
  }

  assert.equal(summary.date, FIXED_DATE);
  assert.equal(summary.timezone, "Asia/Ho_Chi_Minh");
  assert.equal(typeof summary.gate_overall_pass, "boolean");
  assert.equal(typeof summary.gate_decision, "string");
  assert.ok(Array.isArray(summary.gate_unmet_signals));
  assert.equal(typeof summary.bundle_status, "string");
  assert.equal(typeof summary.shared_health_contract_shape, "string");
  assert.ok(Array.isArray(summary.step_results));
  assert.equal(summary.step_results.length, REQUIRED_STEP_LABELS.length);

  const labels = summary.step_results.map((step) => step.label);
  assert.deepEqual(
    labels,
    REQUIRED_STEP_LABELS,
    `step_results label order/identity mismatch. got=${labels.join(",")}`
  );

  for (const step of summary.step_results) {
    assert.equal(typeof step.label, "string");
    assert.equal(typeof step.exit_code, "number");
  }
});
