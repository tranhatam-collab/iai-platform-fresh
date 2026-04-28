import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve as resolvePath } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { deriveFullRerunReviewStatus } from "../../scripts/team1-pay-full-rerun-review-check.mjs";

test("team1 full rerun review stays blocked when preflight is not ready", () => {
  const status = deriveFullRerunReviewStatus({
    artifactChecks: [
      { present: true },
      { present: true }
    ],
    bundle: {
      status: "BLOCKED_PRECHECK",
      preflight: {
        ready: false
      }
    },
    gateSnapshot: {
      overallPass: false
    },
    runtimeProbe: {},
    sharedRuntimeProbe: {
      extracted: {
        health_contract_shape: "legacy_or_unknown"
      }
    }
  });

  assert.equal(status, "REVIEW_BLOCKED_PRECHECK");
});

test("team1 full rerun review becomes ready only when bundle and gate are green", () => {
  const status = deriveFullRerunReviewStatus({
    artifactChecks: new Array(8).fill({ present: true }),
    bundle: {
      status: "RERUN_GREEN",
      preflight: {
        ready: true
      }
    },
    gateSnapshot: {
      overallPass: true
    },
    runtimeProbe: {
      signals: {
        auth_key_present: true
      }
    },
    sharedRuntimeProbe: {
      extracted: {
        health_contract_shape: "shared_runtime_contract"
      }
    }
  });

  assert.equal(status, "READY_FOR_TEAM1_FLIP_REVIEW");
});

test("team1 full rerun review script writes blocked review snapshot for current fail state", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "iai-team1-rerun-review-"));
  const team1Dir = join(fixtureRoot, "docs", "reports", "team1");
  const team2Dir = join(fixtureRoot, "docs", "reports", "team2");
  mkdirSync(team1Dir, { recursive: true });
  mkdirSync(team2Dir, { recursive: true });

  writeFileSync(
    join(team2Dir, "TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-22.json"),
    JSON.stringify(
      {
        status: "BLOCKED_PRECHECK",
        preflight: {
          ready: false
        },
        nextActions: ["Provide canonical env."]
      },
      null,
      2
    ),
    "utf8"
  );
  writeFileSync(
    join(team2Dir, "TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-22.md"),
    "# bundle\n",
    "utf8"
  );
  writeFileSync(
    join(team2Dir, "TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.json"),
    JSON.stringify({ signals: { auth_key_present: false } }, null, 2),
    "utf8"
  );
  writeFileSync(
    join(team2Dir, "TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.md"),
    "# runtime\n",
    "utf8"
  );
  writeFileSync(
    join(team2Dir, "TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-22.json"),
    JSON.stringify(
      {
        extracted: {
          health_contract_shape: "legacy_or_unknown"
        }
      },
      null,
      2
    ),
    "utf8"
  );
  writeFileSync(
    join(team2Dir, "TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-22.md"),
    "# shared\n",
    "utf8"
  );
  writeFileSync(
    join(team1Dir, "TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.json"),
    JSON.stringify(
      {
        overallPass: false,
        gateDecision: "LOCK_RETAINED_WITH_REASON",
        unmetSignals: ["auth_key_present"],
        checks: [
          {
            signal: "auth_key_present",
            pass: false,
            sourcePath: "docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.json"
          }
        ]
      },
      null,
      2
    ),
    "utf8"
  );
  writeFileSync(
    join(team1Dir, "TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md"),
    "# gate\n",
    "utf8"
  );

  const workspaceRoot = resolvePath(fileURLToPath(new URL("../../", import.meta.url)));
  const scriptPath = resolvePath(workspaceRoot, "scripts", "team1-pay-full-rerun-review-check.mjs");

  execFileSync("node", [scriptPath, "--date=2026-04-22"], {
    cwd: fixtureRoot,
    encoding: "utf8"
  });

  const report = readFileSync(
    join(team1Dir, "TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_2026-04-22.md"),
    "utf8"
  );

  assert.match(report, /Status: `REVIEW_BLOCKED_PRECHECK`/);
  assert.match(report, /bundle_preflight_ready/);
  assert.match(report, /Giải quyết precheck canonical env trước khi xin Team 1 review flip/);
});
