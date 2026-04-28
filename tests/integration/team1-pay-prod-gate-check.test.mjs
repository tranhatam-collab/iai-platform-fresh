import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve as resolvePath } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("team1 pay gate checker consumes shared runtime probe sources without crashing", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "iai-team1-pay-gate-"));
  const team1Dir = join(fixtureRoot, "docs", "reports", "team1");
  const team2Dir = join(fixtureRoot, "docs", "reports", "team2");

  mkdirSync(team1Dir, { recursive: true });
  mkdirSync(team2Dir, { recursive: true });

  writeFileSync(
    join(team1Dir, "PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-22.md"),
    [
      "# PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-22",
      "- `attempt_after_2026_04_19`: `PASS`",
      "- `checkout_url_non_null`: `FAIL`",
      "- `payment_link_id_non_null`: `FAIL`",
      "- `no_214`: `FAIL`",
      "- `production_gate_green`: `FAIL`",
      ""
    ].join("\n"),
    "utf8"
  );

  writeFileSync(
    join(team2Dir, "TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-22.json"),
    JSON.stringify(
      {
        signals: {
          shared_read_model_ready_for_shared_only: false,
          shared_upstream_active_read_mode_shared_contract: false,
          shared_upstream_release_gate_ready: false
        }
      },
      null,
      2
    ),
    "utf8"
  );

  const workspaceRoot = resolvePath(
    fileURLToPath(new URL("../../", import.meta.url))
  );
  const scriptPath = resolvePath(workspaceRoot, "scripts", "team1-pay-prod-gate-check.mjs");
  execFileSync("node", [scriptPath, "--date=2026-04-22"], {
    cwd: fixtureRoot,
    encoding: "utf8"
  });

  const renderedReport = readFileSync(
    join(team1Dir, "TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md"),
    "utf8"
  );

  assert.match(renderedReport, /Shared runtime probe source present: PASS/);
  assert.match(renderedReport, /team2_shared_runtime_probe_json/);
  assert.match(renderedReport, /shared_read_model_ready_for_shared_only: FAIL/);
});

test("team1 pay gate checker prefers shared runtime probe source for shared signals", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "iai-team1-pay-gate-source-"));
  const team1Dir = join(fixtureRoot, "docs", "reports", "team1");
  const team2Dir = join(fixtureRoot, "docs", "reports", "team2");

  mkdirSync(team1Dir, { recursive: true });
  mkdirSync(team2Dir, { recursive: true });

  writeFileSync(
    join(team1Dir, "PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-22.md"),
    [
      "# PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-22",
      "- `attempt_after_2026_04_19`: `PASS`",
      "- `checkout_url_non_null`: `FAIL`",
      "- `payment_link_id_non_null`: `FAIL`",
      "- `no_214`: `FAIL`",
      "- `production_gate_green`: `FAIL`",
      ""
    ].join("\n"),
    "utf8"
  );

  writeFileSync(
    join(team2Dir, "TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.json"),
    JSON.stringify(
      {
        auth: {
          keyProvided: false
        },
        signals: {
          attempt_after_2026_04_19: true,
          checkout_url_non_null: false,
          payment_link_id_non_null: false,
          no_214: false,
          production_gate_green: false,
          shared_read_model_ready_for_shared_only: true,
          shared_upstream_active_read_mode_shared_contract: true,
          shared_upstream_release_gate_ready: true
        }
      },
      null,
      2
    ),
    "utf8"
  );

  writeFileSync(
    join(team2Dir, "TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-22.json"),
    JSON.stringify(
      {
        signals: {
          shared_read_model_ready_for_shared_only: false,
          shared_upstream_active_read_mode_shared_contract: false,
          shared_upstream_release_gate_ready: false
        }
      },
      null,
      2
    ),
    "utf8"
  );

  const workspaceRoot = resolvePath(
    fileURLToPath(new URL("../../", import.meta.url))
  );
  const scriptPath = resolvePath(workspaceRoot, "scripts", "team1-pay-prod-gate-check.mjs");
  execFileSync("node", [scriptPath, "--date=2026-04-22"], {
    cwd: fixtureRoot,
    encoding: "utf8"
  });

  const renderedReport = readFileSync(
    join(team1Dir, "TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md"),
    "utf8"
  );

  assert.match(renderedReport, /auth_key_present: FAIL \(present=PASS, value=FAIL, source=team2_probe_json/);
  assert.match(
    renderedReport,
    /shared_read_model_ready_for_shared_only: FAIL \(present=PASS, value=FAIL, source=team2_shared_runtime_probe_json/
  );
});
