import { spawnSync } from "node:child_process";
import path from "node:path";

const files = [
  "cios-release-evidence.test.mjs",
  "docs-pay-docs-integration.test.mjs",
  "pay-team-d-intake-board.test.mjs",
  "team1-pay-full-rerun-review-check.test.mjs",
  "team1-pay-gate-loop-contract.test.mjs",
  "team1-pay-prod-gate-check.test.mjs",
  "team2-pay-prod-rerun-bundle.test.mjs",
  "team2-pay-shared-runtime-probe.test.mjs"
].map((name) => path.resolve("tests/integration", name));

console.log("External evidence tests require ignored governance files and/or sibling workspaces.");
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], {
  stdio: "inherit"
});
process.exit(result.status ?? 1);
