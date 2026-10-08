/**
 * Helpers for running a Cloudflare Worker sub-project under `wrangler dev --local`
 * (workerd) from a Node test, with a throwaway D1 database.
 *
 * Safety model (this file is the only place wrangler is spawned):
 *  - Only `dev --local`, `d1 migrations apply --local` and `d1 execute --local` are ever run.
 *    `deploy`, `--remote` and any other remote-capable command are not reachable from here.
 *  - The project's wrangler config is never edited. A local-only copy is derived into a temp
 *    directory (no account_id, routes or `remote` bindings; placeholder D1 ids) and passed
 *    through `--config`, so a stale `.dev.vars`/`.wrangler` in the project is never read.
 *  - The child environment is scrubbed of Cloudflare credentials, HOME is redirected to a temp
 *    directory (no cached wrangler login) and metrics/cf.json fetches are disabled.
 *  - All secrets are fake values supplied by the test through a generated temp `.dev.vars`.
 */
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getFreePort } from "../../support/harness.mjs";

export const workersDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const repoRoot = path.resolve(workersDir, "..", "..", "..");

const require = createRequire(import.meta.url);

/** Placeholder database id: local D1 never talks to Cloudflare, it only keys the sqlite file. */
const LOCAL_D1_ID = "00000000-0000-4000-8000-000000000001";
const MIN_NODE_MAJOR = 22; // wrangler 4.131 engine requirement

export function wranglerBin() {
  return path.join(workersDir, "node_modules", "wrangler", "bin", "wrangler.js");
}

// --------------------------------------------------------------------------------------------
// Runtime probe (wrangler installed? workerd executable?)
// --------------------------------------------------------------------------------------------

let probeCache = null;

/**
 * Synchronous, cached check that this machine can run wrangler + workerd.
 * Returns { ok, reason, wrangler, workerd }.
 */
export function probeWorkerRuntime() {
  if (probeCache) return probeCache;
  probeCache = runProbe();
  return probeCache;
}

function runProbe() {
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
  if (nodeMajor < MIN_NODE_MAJOR) {
    return { ok: false, reason: `wrangler 4.x needs Node >= ${MIN_NODE_MAJOR} (running ${process.versions.node})` };
  }
  if (!existsSync(wranglerBin())) {
    return { ok: false, reason: "wrangler is not installed: run `npm ci` in tests/e2e/workers" };
  }
  let workerdShim;
  try {
    workerdShim = require.resolve("workerd/bin/workerd", { paths: [workersDir] });
  } catch {
    return { ok: false, reason: "workerd is not installed (wrangler dependency missing): run `npm ci` in tests/e2e/workers" };
  }
  const wrangler = spawnSync(process.execPath, [wranglerBin(), "--version"], { encoding: "utf8", env: scrubbedEnv(), timeout: 60_000 });
  if (wrangler.status !== 0) {
    return { ok: false, reason: `wrangler --version failed: ${(wrangler.stderr || wrangler.error?.message || "").trim().slice(0, 200)}` };
  }
  // npm's postinstall swaps this file for the native binary (a node shim otherwise), so execute it directly.
  const workerd = spawnSync(workerdShim, ["--version"], { encoding: "utf8", env: scrubbedEnv(), timeout: 30_000 });
  if (workerd.status !== 0) {
    const detail = (workerd.stderr || workerd.error?.message || "").trim().slice(0, 200);
    return { ok: false, reason: `workerd cannot execute on this machine (${process.platform}/${process.arch}): ${detail}` };
  }
  return {
    ok: true,
    reason: null,
    wrangler: wrangler.stdout.trim().split("\n").pop(),
    workerd: workerd.stdout.trim()
  };
}

/**
 * Value for node:test's `skip` option. Returns false when the runtime is usable, or a human
 * readable reason. Set E2E_WORKERS_REQUIRE=1 (CI) to turn "unavailable" into a hard failure
 * instead of a silent skip.
 */
export function workerRuntimeSkipReason() {
  const probe = probeWorkerRuntime();
  if (probe.ok || process.env.E2E_WORKERS_REQUIRE === "1") return false;
  return `wrangler/workerd unavailable: ${probe.reason}`;
}

/** Throws a clear error if the runtime is unavailable (used by before-hooks under E2E_WORKERS_REQUIRE=1). */
export function assertWorkerRuntime() {
  const probe = probeWorkerRuntime();
  if (!probe.ok) throw new Error(`wrangler/workerd unavailable: ${probe.reason}`);
  return probe;
}

// --------------------------------------------------------------------------------------------
// Environment scrubbing
// --------------------------------------------------------------------------------------------

const CREDENTIAL_ENV = /^(CLOUDFLARE_|CF_|WRANGLER_(?!SEND_METRICS|HIDE_BANNER)|AWS_|GH_|GITHUB_|NPM_TOKEN|NODE_AUTH_TOKEN)/;

let sandboxHome = null;
function wranglerHome() {
  if (!sandboxHome) {
    sandboxHome = mkdtempSync(path.join(tmpdir(), "iai-e2e-wrangler-home-"));
    process.once("exit", () => rmSync(sandboxHome, { recursive: true, force: true }));
  }
  return sandboxHome;
}

export function scrubbedEnv(extra = {}) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!CREDENTIAL_ENV.test(key)) env[key] = value;
  }
  const home = wranglerHome();
  const noProxy = [env.NO_PROXY, env.no_proxy, "127.0.0.1", "localhost", "::1"].filter(Boolean).join(",");
  return {
    ...env,
    HOME: home,
    XDG_CONFIG_HOME: path.join(home, ".config"),
    NO_PROXY: noProxy,
    no_proxy: noProxy,
    NO_COLOR: "1",
    FORCE_COLOR: "0",
    CI: "1",
    WRANGLER_SEND_METRICS: "false",
    WRANGLER_HIDE_BANNER: "true",
    CLOUDFLARE_CF_FETCH_ENABLED: "false", // miniflare would otherwise fetch workers.cloudflare.com/cf.json
    ...extra
  };
}

// --------------------------------------------------------------------------------------------
// Config derivation
// --------------------------------------------------------------------------------------------

export function parseJsonc(text) {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inString) {
      out += char;
      if (char === "\\") {
        out += next ?? "";
        i += 1;
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
      out += char;
    } else if (char === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i += 1;
      out += "\n";
    } else if (char === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i += 1;
      i += 1;
    } else {
      out += char;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

async function readConfigFile(file) {
  const text = readFileSync(file, "utf8");
  if (file.endsWith(".toml")) {
    const { parse } = await import("smol-toml");
    return JSON.parse(JSON.stringify(parse(text))); // plain objects (drops TomlDate prototypes)
  }
  return parseJsonc(text);
}

function stripRemote(node) {
  if (Array.isArray(node)) return node.forEach(stripRemote);
  if (node && typeof node === "object") {
    delete node.remote;
    Object.values(node).forEach(stripRemote);
  }
}

/**
 * Turn a project's wrangler config into a local-only config object.
 * `wranglerEnv` selects an `[env.x]` section (shallow overlay on the top level).
 */
export async function deriveLocalConfig({ projectDir, configFile, wranglerEnv, transform, mainOverride }) {
  const raw = await readConfigFile(path.join(projectDir, configFile));
  const cfg = JSON.parse(JSON.stringify(raw));
  if (wranglerEnv) {
    const section = cfg.env?.[wranglerEnv];
    if (!section) throw new Error(`${configFile} has no env.${wranglerEnv} section`);
    Object.assign(cfg, section);
  }
  for (const key of ["env", "$schema", "account_id", "routes", "route", "workers_dev", "observability", "secrets", "logpush", "tail_consumers"]) {
    delete cfg[key];
  }
  stripRemote(cfg);

  cfg.main = mainOverride ?? path.resolve(projectDir, cfg.main);
  if (cfg.assets?.directory) cfg.assets.directory = path.resolve(projectDir, cfg.assets.directory);
  cfg.d1_databases = (cfg.d1_databases ?? []).map((db) => ({
    ...db,
    database_id: LOCAL_D1_ID,
    ...(db.migrations_dir || existsSync(path.join(projectDir, "migrations"))
      ? { migrations_dir: path.resolve(projectDir, db.migrations_dir ?? "migrations") }
      : {})
  }));
  if (!cfg.d1_databases.length) delete cfg.d1_databases;

  const result = transform ? (transform(cfg) ?? cfg) : cfg;
  assertLocalOnly(result);
  return result;
}

/** Defence in depth: refuse to start anything that could address a remote resource. */
export function assertLocalOnly(cfg) {
  const text = JSON.stringify(cfg);
  if (/"remote"\s*:\s*true/.test(text)) throw new Error("derived wrangler config still contains a remote binding");
  for (const key of ["account_id", "routes", "route", "zone_id"]) {
    if (key in cfg) throw new Error(`derived wrangler config must not set ${key}`);
  }
  for (const db of cfg.d1_databases ?? []) {
    if (db.database_id !== LOCAL_D1_ID) throw new Error("derived wrangler config must use the placeholder D1 id");
  }
}

/**
 * Copy part of a project to a temp dir, optionally rewriting file contents. Used for a
 * test-only build of a Worker whose dependencies cannot be redirected at runtime; the
 * original sources are never modified.
 */
export function stageSource({ projectDir, subdirs, patch }) {
  const stage = mkdtempSync(path.join(tmpdir(), "iai-e2e-stage-"));
  const patched = [];
  for (const sub of subdirs) {
    cpSync(path.join(projectDir, sub), path.join(stage, sub), { recursive: true });
  }
  if (patch) {
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|js|mjs)$/.test(entry.name)) {
          const before = readFileSync(full, "utf8");
          const after = patch(path.relative(stage, full), before);
          if (after !== before) {
            writeFileSync(full, after);
            patched.push(path.relative(stage, full));
          }
        }
      }
    };
    walk(stage);
  }
  return { dir: stage, patched, cleanup: () => rmSync(stage, { recursive: true, force: true }) };
}

// --------------------------------------------------------------------------------------------
// Child process plumbing
// --------------------------------------------------------------------------------------------

const liveGroups = new Set();
process.once("exit", () => {
  for (const pid of liveGroups) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      // already gone
    }
  }
});

/** Belt and braces: nothing in this module may ever run a remote-capable wrangler invocation. */
function assertLocalInvocation(args) {
  const forbidden = ["deploy", "publish", "--remote", "-r", "login", "secret", "versions", "delete"];
  const bad = args.find((arg) => forbidden.includes(arg));
  if (bad || !args.includes("--local")) throw new Error(`refusing non-local wrangler invocation: ${args.join(" ")}`);
}

function runWrangler(args, { cwd, timeoutMs = 120_000 } = {}) {
  assertLocalInvocation(args);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [wranglerBin(), ...args], {
      cwd,
      env: scrubbedEnv(),
      stdio: ["ignore", "pipe", "pipe"],
      detached: true
    });
    liveGroups.add(child.pid);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        // already gone
      }
    }, timeoutMs);
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      liveGroups.delete(child.pid);
      resolve({ code: code ?? (signal ? 1 : 0), stdout, stderr, output: `${stdout}\n${stderr}` });
    });
  });
}

// --------------------------------------------------------------------------------------------
// D1 helper
// --------------------------------------------------------------------------------------------

let sqliteModule;
async function loadNodeSqlite() {
  if (sqliteModule === undefined) {
    try {
      const originalEmit = process.emitWarning;
      process.emitWarning = () => {}; // node:sqlite prints an ExperimentalWarning on import
      try {
        sqliteModule = await import("node:sqlite");
      } finally {
        process.emitWarning = originalEmit;
      }
    } catch {
      sqliteModule = null;
    }
  }
  return sqliteModule;
}

function findSqliteFile(persistDir) {
  const dir = path.join(persistDir, "v3", "d1", "miniflare-D1DatabaseObject");
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((name) => name.endsWith(".sqlite"));
  return files.length ? path.join(dir, files[0]) : null;
}

/**
 * Local D1 database addressed through wrangler (`d1 execute --local --persist-to`).
 * `query()` reads the persisted sqlite file directly when node:sqlite is available (much faster
 * for polling) and falls back to `wrangler d1 execute --json`.
 */
export class LocalD1 {
  constructor({ cwd, configPath, database, persistDir }) {
    this.cwd = cwd;
    this.configPath = configPath;
    this.database = database;
    this.persistDir = persistDir;
  }

  #args(extra) {
    return ["d1", "execute", this.database, "--local", "--persist-to", this.persistDir, "--config", this.configPath, ...extra];
  }

  /** Run one or more statements (a SQL string). Throws on failure. */
  async execute(sql) {
    const result = await runWrangler(this.#args(["--command", sql, "--json"]), { cwd: this.cwd });
    if (result.code !== 0) throw new Error(`d1 execute failed (${result.code}): ${result.output.slice(-1500)}`);
    return parseWranglerJson(result.stdout);
  }

  /** Run a list of statements as one .sql file (one wrangler invocation). */
  async seed(statements) {
    const file = path.join(path.dirname(this.configPath), `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.sql`);
    writeFileSync(file, `${statements.join(";\n")};\n`);
    const result = await runWrangler(this.#args(["--file", file, "--json"]), { cwd: this.cwd });
    rmSync(file, { force: true });
    if (result.code !== 0) throw new Error(`d1 seed failed (${result.code}): ${result.output.slice(-1500)}`);
  }

  /** SELECT helper returning an array of row objects. */
  async query(sql) {
    const sqlite = await loadNodeSqlite();
    const file = findSqliteFile(this.persistDir);
    if (sqlite && file) {
      let db;
      try {
        db = new sqlite.DatabaseSync(file, { readOnly: true });
        return db.prepare(sql).all().map((row) => ({ ...row }));
      } catch {
        // fall through to the wrangler path (e.g. file mid-checkpoint)
      } finally {
        db?.close();
      }
    }
    const parsed = await this.execute(sql);
    return parsed?.[0]?.results ?? [];
  }

  /** Poll `query` until `predicate(rows)` holds or the timeout expires; returns the last rows. */
  async waitFor(sql, predicate, { timeoutMs = 20_000, intervalMs = 400 } = {}) {
    const deadline = Date.now() + timeoutMs;
    let rows = [];
    while (Date.now() < deadline) {
      rows = await this.query(sql);
      if (predicate(rows)) return rows;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return rows;
  }
}

function parseWranglerJson(stdout) {
  const start = stdout.indexOf("[");
  if (start < 0) return null;
  try {
    return JSON.parse(stdout.slice(start));
  } catch {
    return null;
  }
}

export async function applyMigrations({ cwd, configPath, database, persistDir }) {
  return await runWrangler(["d1", "migrations", "apply", database, "--local", "--persist-to", persistDir, "--config", configPath], { cwd });
}

// --------------------------------------------------------------------------------------------
// startWorker
// --------------------------------------------------------------------------------------------

/**
 * Start a Worker project under `wrangler dev --local` on an ephemeral port.
 *
 * @param {object} options
 * @param {string} options.name            label used in error messages
 * @param {string} options.dir             project directory (absolute, or relative to the repo root)
 * @param {string} options.config          config file name inside `dir` (wrangler.jsonc / wrangler.toml)
 * @param {string} [options.wranglerEnv]   [env.x] section to overlay
 * @param {(cfg: object) => object|void} [options.transform]  last-chance edit of the derived config
 * @param {string} [options.main]          absolute path overriding the entry point (staged sources)
 * @param {Record<string,string>} [options.vars]     non-secret vars (--var)
 * @param {Record<string,string>} [options.secrets]  fake secrets (generated temp .dev.vars)
 * @param {{database: string}} [options.migrations]  apply `migrations_dir` to the local D1 first
 * @param {string[]} [options.seed]        SQL statements run after migrations, before boot
 * @param {string} [options.persistDir]    reuse a persistence directory (default: fresh temp dir)
 * @param {string} [options.readyPath]     path polled until the worker answers
 * @returns {Promise<{name, baseUrl, port, persistDir, configPath, d1, migrationOutput, logs(), stop()}>}
 */
export async function startWorker(options) {
  const { name, config, wranglerEnv, transform, main, vars = {}, secrets = {}, migrations, seed, readyPath = "/", readyTimeoutMs = 90_000 } = options;
  assertWorkerRuntime();
  const projectDir = path.resolve(repoRoot, options.dir);
  const workDir = mkdtempSync(path.join(tmpdir(), `iai-e2e-${name}-`));
  const persistDir = options.persistDir ?? path.join(workDir, "state");
  mkdirSync(persistDir, { recursive: true });

  const cfg = await deriveLocalConfig({ projectDir, configFile: config, wranglerEnv, transform, mainOverride: main });
  const configPath = path.join(workDir, "wrangler.json");
  writeFileSync(configPath, JSON.stringify(cfg, null, 2));
  if (Object.keys(secrets).length) {
    writeFileSync(path.join(workDir, ".dev.vars"), Object.entries(secrets).map(([k, v]) => `${k}=${JSON.stringify(String(v))}`).join("\n"));
  }

  const d1Binding = migrations?.database ?? cfg.d1_databases?.[0]?.binding;
  const d1 = d1Binding ? new LocalD1({ cwd: workDir, configPath, database: d1Binding, persistDir }) : null;

  let migrationOutput = "";
  if (migrations) {
    const applied = await applyMigrations({ cwd: workDir, configPath, database: migrations.database, persistDir });
    migrationOutput = applied.output;
    if (applied.code !== 0 && !migrations.allowFailure) {
      rmSync(workDir, { recursive: true, force: true });
      throw new Error(`[${name}] migrations failed:\n${applied.output.slice(-2500)}`);
    }
  }
  if (seed?.length) await d1.seed(seed);

  const port = await getFreePort();
  const inspectorPort = await getFreePort();
  const args = [
    "dev",
    "--local",
    "--config",
    configPath,
    "--ip",
    "127.0.0.1",
    "--port",
    String(port),
    "--inspector-port",
    String(inspectorPort),
    "--persist-to",
    persistDir,
    "--log-level",
    "log",
    "--show-interactive-dev-session=false",
    ...Object.entries(vars).flatMap(([key, value]) => ["--var", `${key}:${value}`])
  ];

  assertLocalInvocation(args);
  let output = "";
  const child = spawn(process.execPath, [wranglerBin(), ...args], {
    cwd: workDir,
    env: scrubbedEnv(),
    stdio: ["ignore", "pipe", "pipe"],
    detached: true
  });
  liveGroups.add(child.pid);
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  const exited = new Promise((resolve) => child.once("exit", (code, signal) => resolve({ code, signal })));
  const baseUrl = `http://127.0.0.1:${port}`;

  const killGroup = (signal) => {
    try {
      process.kill(-child.pid, signal);
    } catch {
      // already gone
    }
  };
  const cleanup = () => {
    liveGroups.delete(child.pid);
    if (!options.keepWorkDir) rmSync(workDir, { recursive: true, force: true });
  };

  const deadline = Date.now() + readyTimeoutMs;
  let ready = false;
  let lastError = "no response";
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      cleanup();
      throw new Error(`[${name}] wrangler dev exited early with code ${child.exitCode}\n--- output ---\n${output.slice(-3000)}`);
    }
    if (/\[ERROR\]|✘/.test(output)) {
      killGroup("SIGKILL");
      cleanup();
      throw new Error(`[${name}] wrangler dev reported an error\n--- output ---\n${output.slice(-3000)}`);
    }
    if (/Ready on/.test(output)) {
      try {
        const response = await fetch(`${baseUrl}${readyPath}`, { signal: AbortSignal.timeout(5000) });
        await response.arrayBuffer();
        ready = true;
        break;
      } catch (error) {
        lastError = error.message;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  if (!ready) {
    killGroup("SIGKILL");
    cleanup();
    throw new Error(`[${name}] not ready within ${readyTimeoutMs}ms (${lastError})\n--- output ---\n${output.slice(-3000)}`);
  }

  let stopped = null;
  return {
    name,
    port,
    baseUrl,
    persistDir,
    configPath,
    d1,
    migrationOutput,
    logs: () => output,
    async stop() {
      if (stopped) return await stopped;
      stopped = (async () => {
        killGroup("SIGTERM");
        const forced = setTimeout(() => killGroup("SIGKILL"), 8000);
        try {
          const result = await exited;
          killGroup("SIGKILL"); // reap workerd if it outlived the wrangler parent
          return result;
        } finally {
          clearTimeout(forced);
          cleanup();
        }
      })();
      return await stopped;
    }
  };
}

/**
 * Worker-less D1 handle: derive the local config, optionally point it at a different migrations
 * directory, and expose applyMigrations()/d1 for schema experiments.
 */
export async function prepareD1Only({ name, dir, config, wranglerEnv, database, persistDir, migrationsDir }) {
  assertWorkerRuntime();
  const projectDir = path.resolve(repoRoot, dir);
  const workDir = mkdtempSync(path.join(tmpdir(), `iai-e2e-${name}-`));
  const resolvedPersist = persistDir ?? path.join(workDir, "state");
  mkdirSync(resolvedPersist, { recursive: true });
  const cfg = await deriveLocalConfig({
    projectDir,
    configFile: config,
    wranglerEnv,
    transform: migrationsDir
      ? (draft) => {
          draft.d1_databases = draft.d1_databases.map((db) => ({ ...db, migrations_dir: migrationsDir }));
        }
      : undefined
  });
  const configPath = path.join(workDir, "wrangler.json");
  writeFileSync(configPath, JSON.stringify(cfg, null, 2));
  const d1 = new LocalD1({ cwd: workDir, configPath, database, persistDir: resolvedPersist });
  return {
    d1,
    configPath,
    persistDir: resolvedPersist,
    applyMigrations: () => applyMigrations({ cwd: workDir, configPath, database, persistDir: resolvedPersist }),
    cleanup: () => rmSync(workDir, { recursive: true, force: true })
  };
}
