/**
 * The continuous pay audit script must fail closed: a D1 query that cannot run,
 * hangs or errors, or a failing guard check, makes it exit non-zero instead of
 * reporting a green run.
 *
 * Every case runs the real script inside a throwaway git repository that holds
 * only the script, the guard it calls, the two registry files it reads and a
 * `pay.iai.one` directory. `wrangler` is a fake executable placed first on PATH
 * (or absent): the real wrangler, real credentials and the network are never
 * reachable, and the script's report goes to a temporary output directory.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRIPT = "scripts/iai-pay-continuous-dev-loop.mjs";
const FILES = [
  SCRIPT,
  "scripts/team1-no-github-iai-one-doc-assets-check.mjs",
  "apps/pay/src/site-activation-registry.ts",
  "apps/pay/src/payment-webhook-tenant-registry.ts"
];
const DOMAINS = ["tranhatam.com", "omdalat.com", "vc.vetuonglai.com", "invest.vetuonglai.com", "life.vetuonglai.com"];

function git(cwd, ...args) {
  const result = spawnSync("git", ["-c", "core.hooksPath=/dev/null", "-c", "user.name=t", "-c", "user.email=t@example.invalid", ...args], {
    cwd,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, `git ${args.join(" ")}: ${result.stderr}`);
}

/** A fake `wrangler` (a node script run with this node binary), driven by FAKE_WRANGLER_MODE. */
function fakeWranglerSource() {
  const rows = DOMAINS.map((domain) => ({ active: 1, domain, keys: 2, site_code: domain, tenant_code: domain }));
  return `#!${process.execPath}
const mode = process.env.FAKE_WRANGLER_MODE;
if (mode === "hang") {
  setTimeout(() => {}, 600000);
} else if (mode === "exit") {
  process.stderr.write("fake wrangler failure\\n");
  process.exit(3);
} else {
  process.stdout.write(JSON.stringify([{ results: ${JSON.stringify(rows)}, success: true }]));
}
`;
}

function setup({ wrangler }) {
  const dir = mkdtempSync(join(tmpdir(), "iai-pay-audit-test-"));
  const repo = join(dir, "repo");
  const bin = join(dir, "bin");
  const out = join(dir, "out");
  mkdirSync(repo);
  mkdirSync(bin);

  for (const file of FILES) {
    mkdirSync(dirname(join(repo, file)), { recursive: true });
    copyFileSync(join(repoRoot, file), join(repo, file));
  }
  mkdirSync(join(repo, "pay.iai.one"));
  writeFileSync(join(repo, "pay.iai.one", "package.json"), "{}\n");
  git(repo, "init", "-q");
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "fixture");

  symlinkSync(process.execPath, join(bin, "node"));
  if (wrangler) {
    writeFileSync(join(bin, "wrangler"), fakeWranglerSource());
    chmodSync(join(bin, "wrangler"), 0o755);
  }

  // PATH is the shim directory plus the system directories, minus any directory
  // that provides a real wrangler, so the real tool can never be reached.
  const systemDirs = (process.env.PATH ?? "")
    .split(delimiter)
    .filter((entry) => entry && !existsSync(join(entry, "wrangler")));
  const env = {
    HOME: dir,
    IAI_PAY_LOOP_OUTPUT_DIR: out,
    PATH: [bin, ...systemDirs].join(delimiter)
  };

  return { cleanup: () => rmSync(dir, { force: true, recursive: true }), env, out, repo };
}

function runAudit({ repo, env }, extraEnv = {}) {
  const started = Date.now();
  const result = spawnSync(process.execPath, [join(repo, SCRIPT)], {
    cwd: repo,
    encoding: "utf8",
    env: { ...env, ...extraEnv },
    timeout: 60_000
  });
  return { elapsedMs: Date.now() - started, result, stdout: result.stdout ?? "" };
}

const latest = (out) => JSON.parse(readFileSync(join(out, "latest.json"), "utf8"));

test("without wrangler the audit fails (exit 1), reports d1=FAIL and missing_d1=not_evaluated", () => {
  const ctx = setup({ wrangler: false });
  try {
    const { result, stdout } = runAudit(ctx);
    assert.equal(result.status, 1, `${stdout}\n${result.stderr}`);
    assert.match(stdout, /d1=FAIL/u);
    assert.match(stdout, /missing_d1=not_evaluated/u);
    const snapshot = latest(ctx.out);
    assert.equal(snapshot.d1.ok, false);
    assert.match(snapshot.d1.error, /spawn_error:ENOENT/u);
  } finally {
    ctx.cleanup();
  }
});

test("with a valid D1 answer and a passing guard the audit exits 0", () => {
  const ctx = setup({ wrangler: true });
  try {
    const { result, stdout } = runAudit(ctx, { FAKE_WRANGLER_MODE: "ok" });
    assert.equal(result.status, 0, `${stdout}\n${result.stderr}`);
    assert.match(stdout, /d1=PASS guard=PASS/u);
    assert.match(stdout, /missing_d1=0/u);
    assert.doesNotMatch(stdout, /not_evaluated/u);
    assert.equal(latest(ctx.out).d1.ok, true);
  } finally {
    ctx.cleanup();
  }
});

test("a hanging D1 query is killed at the timeout and the audit fails (exit 1)", () => {
  const ctx = setup({ wrangler: true });
  try {
    const { elapsedMs, result, stdout } = runAudit(ctx, { FAKE_WRANGLER_MODE: "hang", IAI_PAY_LOOP_D1_TIMEOUT_MS: "500" });
    assert.equal(result.status, 1, `${stdout}\n${result.stderr}`);
    assert.ok(elapsedMs < 30_000, `the hung command was not killed in time (${elapsedMs} ms)`);
    assert.match(stdout, /d1=FAIL/u);
    assert.match(stdout, /missing_d1=not_evaluated/u);
    assert.match(latest(ctx.out).d1.error, /timeout/u);
  } finally {
    ctx.cleanup();
  }
});

test("a D1 command that exits non-zero fails the audit (exit 1)", () => {
  const ctx = setup({ wrangler: true });
  try {
    const { result, stdout } = runAudit(ctx, { FAKE_WRANGLER_MODE: "exit" });
    assert.equal(result.status, 1, `${stdout}\n${result.stderr}`);
    assert.match(stdout, /d1=FAIL/u);
    assert.match(stdout, /missing_d1=not_evaluated/u);
    assert.match(latest(ctx.out).d1.error, /exit:3/u);
  } finally {
    ctx.cleanup();
  }
});

test("a failing guard check fails the audit even when D1 answers", () => {
  const ctx = setup({ wrangler: true });
  try {
    // A tracked file under a protected root makes the guard report BLOCKED (exit 1).
    mkdirSync(join(ctx.repo, "docs"), { recursive: true });
    writeFileSync(join(ctx.repo, "docs", "note.txt"), "x\n");
    git(ctx.repo, "add", "-A");
    git(ctx.repo, "commit", "-q", "-m", "tracked doc");

    const { result, stdout } = runAudit(ctx, { FAKE_WRANGLER_MODE: "ok" });
    assert.equal(result.status, 1, `${stdout}\n${result.stderr}`);
    assert.match(stdout, /d1=PASS guard=FAIL/u);
  } finally {
    ctx.cleanup();
  }
});

test("the audit leaves no files outside its temporary directory", () => {
  const ctx = setup({ wrangler: true });
  try {
    runAudit(ctx, { FAKE_WRANGLER_MODE: "ok" });
    assert.ok(existsSync(join(ctx.out, "latest.md")));
  } finally {
    ctx.cleanup();
  }
  assert.equal(existsSync(ctx.out), false);
});
