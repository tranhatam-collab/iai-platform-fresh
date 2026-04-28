import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve as resolvePath } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  deriveRerunBundleStatus,
  resolveRerunBundlePreflight
} from "../../scripts/team2-pay-prod-rerun-bundle.mjs";

test("team2 pay rerun bundle preflight requires canonical auth and site identity", () => {
  const blocked = resolveRerunBundlePreflight({});

  assert.equal(blocked.ready, false);
  assert.equal(blocked.authKeyHeaderName, null);
  assert.deepEqual(
    blocked.checks.map((check) => [check.name, check.pass]),
    [
      ["auth_key_present", false],
      ["tenant_code_explicit", false],
      ["site_code_explicit", false]
    ]
  );

  const ready = resolveRerunBundlePreflight({
    TEAM2_PAY_GATE_API_KEY: "secret-api-key",
    TEAM2_PAY_GATE_TENANT_CODE: "omdala",
    TEAM2_PAY_GATE_SITE_CODE: "omdala-web"
  });

  assert.equal(ready.ready, true);
  assert.equal(ready.authKeyHeaderName, "x-api-key");

  const readyByCanonicalAlias = resolveRerunBundlePreflight({
    PAY_IAI_ONE_GATE_API_KEY: "canonical-gate-key",
    TEAM2_PAY_GATE_TENANT_CODE: "omdala",
    TEAM2_PAY_GATE_SITE_CODE: "omdala-web"
  });

  assert.equal(readyByCanonicalAlias.ready, true);
  assert.equal(readyByCanonicalAlias.authKeyHeaderName, "x-api-key");
  assert.equal(readyByCanonicalAlias.authKeySource, "PAY_IAI_ONE_GATE_API_KEY");

  const readyByTnoAlias = resolveRerunBundlePreflight({
    TNO_PAY_GATE_SITE_KEY: "tno-site-key",
    TEAM2_PAY_GATE_TENANT_CODE: "omdala",
    TEAM2_PAY_GATE_SITE_CODE: "omdala-web"
  });

  assert.equal(readyByTnoAlias.ready, true);
  assert.equal(readyByTnoAlias.authKeyHeaderName, "x-site-key");
  assert.equal(readyByTnoAlias.authKeySource, "TNO_PAY_GATE_SITE_KEY");
});

test("team2 pay rerun bundle status distinguishes preflight, command failure, and gate fail", () => {
  const preflight = resolveRerunBundlePreflight({
    TEAM2_PAY_GATE_SITE_KEY: "site-key",
    TEAM2_PAY_GATE_TENANT_CODE: "omdalat",
    TEAM2_PAY_GATE_SITE_CODE: "omdalat-web"
  });

  assert.equal(
    deriveRerunBundleStatus({
      preflight,
      gateSnapshot: null,
      runtimeProbe: null,
      sharedRuntimeProbe: null,
      commands: [],
      preflightOnly: true
    }),
    "PREFLIGHT_READY"
  );

  assert.equal(
    deriveRerunBundleStatus({
      preflight,
      gateSnapshot: null,
      runtimeProbe: null,
      sharedRuntimeProbe: null,
      commands: [{ required: true, exitCode: 1 }],
      preflightOnly: false
    }),
    "COMMAND_FAILURE"
  );

  assert.equal(
    deriveRerunBundleStatus({
      preflight,
      gateSnapshot: {
        overallPass: false
      },
      runtimeProbe: {
        signals: {
          auth_key_present: true
        }
      },
      sharedRuntimeProbe: {
        unmetSignals: ["shared_upstream_release_gate_ready"]
      },
      commands: [{ required: true, exitCode: 0 }],
      preflightOnly: false
    }),
    "RERUN_COMPLETED_GATE_FAIL"
  );
});

test("team2 pay rerun bundle writes preflight report artifacts without running probes", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "iai-team2-rerun-bundle-"));
  const workspaceRoot = resolvePath(fileURLToPath(new URL("../../", import.meta.url)));
  const scriptPath = resolvePath(workspaceRoot, "scripts", "team2-pay-prod-rerun-bundle.mjs");

  execFileSync("node", [scriptPath, "--date=2026-04-22", "--preflight-only"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      TEAM2_PAY_GATE_SITE_KEY: "site-key",
      TEAM2_PAY_GATE_TENANT_CODE: "nguyenlananh",
      TEAM2_PAY_GATE_SITE_CODE: "nguyenlananh-web"
    }
  });

  const jsonPath = join(
    fixtureRoot,
    "docs",
    "reports",
    "team2",
    "TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-22.json"
  );
  const markdownPath = join(
    fixtureRoot,
    "docs",
    "reports",
    "team2",
    "TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-22.md"
  );
  const bundle = JSON.parse(readFileSync(jsonPath, "utf8"));
  const markdown = readFileSync(markdownPath, "utf8");

  assert.equal(bundle.status, "PREFLIGHT_READY");
  assert.equal(bundle.preflight.ready, true);
  assert.equal(bundle.commands.length, 0);
  assert.match(markdown, /Status: `PREFLIGHT_READY`/);
  assert.match(markdown, /no commands executed/);
});
