import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const integrationRoot = path.resolve("tests/integration");
const externalEvidenceTests = new Set([
  "cios-release-evidence.test.mjs",
  "docs-pay-docs-integration.test.mjs",
  "pay-team-d-intake-board.test.mjs",
  "team1-pay-full-rerun-review-check.test.mjs",
  "team1-pay-gate-loop-contract.test.mjs",
  "team1-pay-prod-gate-check.test.mjs",
  "team2-pay-prod-rerun-bundle.test.mjs",
  "team2-pay-shared-runtime-probe.test.mjs"
]);

// The package-owned suite exercises the same modules with the Cloudflare test types.
const packageOwnedTests = new Set(["verify-runtime-surface.test.mjs"]);

const files = readdirSync(integrationRoot)
  .filter((name) => name.endsWith(".test.mjs"))
  .filter((name) => !externalEvidenceTests.has(name) && !packageOwnedTests.has(name))
  .sort()
  .map((name) => path.join(integrationRoot, name));

console.log(`Running ${files.length} reproducible source integration files.`);
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], {
  stdio: "inherit"
});
process.exit(result.status ?? 1);
