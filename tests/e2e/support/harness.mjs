import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

// Every *.iai.one surface this repo ships as a Node process. `entry` is the
// built output, so run `pnpm build` (or the per-app build) before the suite.
export const SURFACES = [
  { name: "root", domain: "iai.one", entry: "apps/root/dist/index.js", portEnv: "ROOT_PORT", hostEnv: "ROOT_HOST" },
  { name: "home", domain: "home.iai.one", entry: "apps/home/dist/index.js", portEnv: "HOME_PORT", hostEnv: "HOME_HOST" },
  { name: "app", domain: "app.iai.one", entry: "apps/app/dist/index.js", portEnv: "APP_PORT", hostEnv: "APP_HOST" },
  {
    name: "dash",
    domain: "dash.iai.one",
    entry: "apps/dash/dist/index.js",
    portEnv: "DASH_PORT",
    hostEnv: "DASH_HOST",
    htmlPath: "/login",
    mailApiEnv: "DASH_FLOW_API_BASE"
  },
  { name: "developer", domain: "developer.iai.one", entry: "apps/developer/dist/index.js", portEnv: "DEVELOPER_PORT", hostEnv: "DEVELOPER_HOST", sitemap: true },
  { name: "docs", domain: "docs.iai.one", entry: "apps/docs/dist/index.js", portEnv: "DOCS_PORT", hostEnv: "DOCS_HOST" },
  { name: "flow", domain: "flow.iai.one", entry: "apps/flow/dist/index.js", portEnv: "FLOW_PORT", hostEnv: "FLOW_HOST", sitemap: true },
  { name: "nft", domain: "nft.iai.one", entry: "apps/nft/dist/index.js", portEnv: "NFT_PORT", hostEnv: "NFT_HOST" },
  { name: "pay", domain: "pay.iai.one", entry: "apps/pay/dist/index.js", portEnv: "PAY_PORT", hostEnv: "PAY_HOST" },
  {
    name: "web",
    domain: "web.iai.one",
    entry: "apps/web/dist/index.js",
    portEnv: "WEB_PORT",
    hostEnv: "WEB_BIND_ADDRESS",
    // /health and / call the shared flow API, so web needs a live mail-api.
    mailApiEnv: "WEB_SHARED_FLOW_API_BASE",
    requiresMailApi: true
  },
  {
    name: "noos-web",
    domain: "noos.iai.one",
    entry: "apps/noos-web/dist/server.js",
    portEnv: "NOOS_WEB_PORT",
    hostEnv: null,
    // Catalog pages read gitignored docs/noos fixtures at runtime.
    requiresDocsFixtures: true,
    htmlPath: "/en/products"
  }
];

// Hosts that may legitimately appear in links rendered by any surface. A link to
// an *.iai.one host outside this list is a typo or an undeclared sub-project.
export const KNOWN_IAI_HOSTS = new Set([
  "iai.one",
  "app.iai.one",
  "dash.iai.one",
  "developer.iai.one",
  "docs.iai.one",
  "flow.iai.one",
  "home.iai.one",
  "nft.iai.one",
  "pay.iai.one",
  "web.iai.one",
  "noos.iai.one",
  "api.iai.one",
  "api.flow.iai.one",
  "api.mail.iai.one",
  "api.aiagent.iai.one",
  "mail.iai.one",
  "cios.iai.one",
  "life.iai.one",
  "verify-runtime.iai.one",
  "app-preview.iai.one",
  "dash-preview.iai.one",
  "flow-preview.iai.one"
]);

/**
 * True when the private docs/noos pack is present, or when REQUIRE_DOCS_FIXTURES=1:
 * in that lane a missing pack must fail the suite loudly instead of skipping it.
 */
export function docsFixturesAvailable() {
  if (process.env.REQUIRE_DOCS_FIXTURES === "1") {
    return true;
  }
  return existsSync(path.join(repoRoot, "docs", "noos"));
}

export function builtEntryAvailable(entry) {
  return existsSync(path.join(repoRoot, entry));
}

export async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function waitUntilReady(baseUrl, readyPath, child, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`process exited early with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}${readyPath}`, { signal: AbortSignal.timeout(1500) });
      await response.arrayBuffer();
      // Any HTTP answer proves the listener is up; callers assert on content.
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`not ready within ${timeoutMs}ms: ${lastError?.message ?? "no response"}`);
}

/** How many times startService picks a new port after the child exits because its port was taken. */
export const PORT_IN_USE_RETRIES = 3;

class EarlyExitError extends Error {
  constructor(message, output) {
    super(message);
    this.output = output;
  }
}

/**
 * Spawn a built service as a real child process and wait until it answers HTTP.
 * Returns { baseUrl, port, logs(), stop() } where stop() resolves to the exit
 * result so tests can assert on graceful shutdown.
 *
 * The port is chosen by binding port 0 and closing it, so another process can take it before the
 * child binds. When the child exits early with EADDRINUSE, a new port is chosen and the child is
 * started again (at most PORT_IN_USE_RETRIES times). Any other failure, including any other early
 * exit and a readiness timeout, fails at once. `getPort` replaces the port picker (tests).
 */
export async function startService({
  name,
  entry,
  env = {},
  portEnv,
  hostEnv,
  readyPath = "/health",
  readyTimeoutMs = 20000,
  getPort = getFreePort
}) {
  if (!builtEntryAvailable(entry)) {
    throw new Error(`${entry} is missing; build it first (pnpm --filter ... build)`);
  }

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await startServiceOnce({ name, entry, env, portEnv, hostEnv, readyPath, readyTimeoutMs, port: await getPort() });
    } catch (error) {
      const portTaken = error instanceof EarlyExitError && /EADDRINUSE/u.test(error.output);
      if (!portTaken || attempt >= PORT_IN_USE_RETRIES) {
        throw error;
      }
    }
  }
}

async function startServiceOnce({ name, entry, env, portEnv, hostEnv, readyPath, readyTimeoutMs, port }) {
  const childEnv = { ...process.env, ...env, [portEnv]: String(port) };
  if (hostEnv) {
    childEnv[hostEnv] = "127.0.0.1";
  }
  const child = spawn(process.execPath, [path.join(repoRoot, entry)], {
    cwd: repoRoot,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));

  const exited = new Promise((resolve) => child.once("exit", (code, signal) => resolve({ code, signal })));
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await waitUntilReady(baseUrl, readyPath, child, readyTimeoutMs);
  } catch (error) {
    const earlyExit = child.exitCode !== null;
    child.kill("SIGKILL");
    if (earlyExit) {
      // Let the output streams drain so the exit reason is complete.
      await exited;
      await new Promise((resolve) => setImmediate(resolve));
    }
    const failure = `[${name}] ${error.message}\n--- process output ---\n${output}`;
    throw earlyExit ? new EarlyExitError(failure, output) : new Error(failure);
  }

  return {
    name,
    port,
    baseUrl,
    logs: () => output,
    isRunning: () => child.exitCode === null && child.signalCode === null,
    async stop() {
      if (child.exitCode !== null || child.signalCode !== null) {
        return await exited;
      }
      child.kill("SIGTERM");
      const forced = setTimeout(() => child.kill("SIGKILL"), 5000);
      try {
        return await exited;
      } finally {
        clearTimeout(forced);
      }
    }
  };
}

/** Start the real mail-api (bootstrap entry) on a throwaway SQLite database. */
export async function startMailApi({ env = {} } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "iai-e2e-mail-"));
  const service = await startService({
    name: "mail-api",
    entry: "apps/mail-api/dist/bootstrap.js",
    portEnv: "PORT",
    hostEnv: "MAIL_API_BIND_ADDRESS",
    readyPath: "/health",
    env: {
      MAIL_DB_URL: `sqlite:${path.join(dir, "mail.db")}`,
      MAIL_API_KEY: "e2e-mail-api-key",
      MAIL_SMTP_REMOTE_TOKEN: "e2e-smtp-remote-token",
      // Opt-in for hardened builds that otherwise refuse unauthenticated internal routes.
      MAIL_API_WEBHOOK_SECRET: "e2e-webhook-secret",
      ...env
    }
  });
  const stop = service.stop.bind(service);
  service.stop = async () => {
    try {
      return await stop();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  service.credentials = {
    apiKey: "e2e-mail-api-key",
    remoteToken: "e2e-smtp-remote-token",
    webhookSecret: "e2e-webhook-secret"
  };
  return service;
}

/** Plain fetch that never follows redirects and never throws on HTTP status. */
export async function request(baseUrl, pathname, { method = "GET", headers = {}, body, timeoutMs = 8000 } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs)
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: response.status, headers: response.headers, text, json };
}

/**
 * Send a hand-written HTTP/1.1 request line over a raw socket. fetch() normalises
 * odd targets like `//` or bad percent-escapes before they reach the server, so
 * malformed-input tests must bypass it.
 */
export async function rawRequest(port, target, { method = "GET", headers = {}, timeoutMs = 5000 } = {}) {
  return await new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1");
    let data = "";
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`raw request ${method} ${target.slice(0, 40)} timed out (server hung or dropped the connection)`));
    }, timeoutMs);
    socket.on("connect", () => {
      const headerLines = Object.entries({ Host: "127.0.0.1", Connection: "close", ...headers }).map(([k, v]) => `${k}: ${v}`);
      socket.write(`${method} ${target} HTTP/1.1\r\n${headerLines.join("\r\n")}\r\n\r\n`);
    });
    socket.on("data", (chunk) => (data += chunk));
    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    socket.on("close", () => {
      clearTimeout(timer);
      const [head, ...rest] = data.split("\r\n\r\n");
      const lines = head.split("\r\n");
      const match = /^HTTP\/1\.[01] (\d{3})/.exec(lines[0] ?? "");
      if (!match) {
        reject(new Error(`no HTTP response for ${method} ${target.slice(0, 40)} (connection closed: ${JSON.stringify(data.slice(0, 80))})`));
        return;
      }
      const headersOut = {};
      for (const line of lines.slice(1)) {
        const index = line.indexOf(":");
        if (index > 0) {
          headersOut[line.slice(0, index).toLowerCase()] = line.slice(index + 1).trim();
        }
      }
      resolve({ status: Number(match[1]), headers: headersOut, text: rest.join("\r\n\r\n") });
    });
  });
}

/**
 * Normalises the health envelopes used across the surfaces: `{status}`,
 * `{ok, data: {status}}` and pay's `{ok, data: {status: <phase>}}`.
 */
export function healthStatus(json) {
  if (json?.ok === true || json?.status === "ok" || json?.data?.status === "ok") {
    return "ok";
  }
  return json?.data?.status ?? json?.status ?? null;
}

export function extractHrefs(html) {
  return [...html.matchAll(/\b(?:href|src|content)="(https?:\/\/[^"]+)"/g)].map((match) => match[1]);
}
