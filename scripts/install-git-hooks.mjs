#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const hooksPath = ".githooks";

function run(command, args) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe"
  });
}

const insideGit = run("git", ["rev-parse", "--is-inside-work-tree"]);
if (insideGit.status !== 0 || insideGit.stdout.trim() !== "true") {
  process.exit(0);
}

if (!existsSync(join(root, hooksPath, "pre-commit"))) {
  console.warn(`Git hook install skipped: ${hooksPath}/pre-commit is missing.`);
  process.exit(0);
}

const configured = run("git", ["config", "core.hooksPath", hooksPath]);
if (configured.status !== 0) {
  console.error(configured.stderr || configured.stdout);
  process.exit(configured.status ?? 1);
}

console.log(`Git hooks enabled: core.hooksPath=${hooksPath}`);
