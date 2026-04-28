import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("pay docs integration checker passes in no-write mode", async () => {
  const root = path.resolve(import.meta.dirname, "..", "..");
  const scriptPath = path.join(root, "scripts", "pay-docs-integration-check.mjs");

  const { stdout } = await execFileAsync(process.execPath, [scriptPath, "--date=2026-04-21", "--no-write"], {
    cwd: root
  });

  assert.match(stdout, /Overall: PASS\./);
  assert.match(stdout, /Write outputs: SKIPPED\./);
});
