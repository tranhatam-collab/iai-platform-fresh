/**
 * Starts the mail delivery worker (apps/mail-api/dist/queue-worker.js, what
 * `pnpm --filter @iai/mail-worker start` runs) as a real process on a shared SQLite file.
 * Nothing here talks to a real provider.
 */
import { spawn } from "node:child_process";
import path from "node:path";

import { repoRoot } from "./harness.mjs";

export const MAIL_WORKER_ENTRY = "apps/mail-api/dist/queue-worker.js";

export async function startMailWorker({ dbUrl, env = {}, readyTimeoutMs = 15000 }) {
  const child = spawn(process.execPath, [path.join(repoRoot, MAIL_WORKER_ENTRY)], {
    cwd: repoRoot,
    env: {
      PATH: process.env.PATH,
      MAIL_DB_URL: dbUrl,
      MAIL_PROVIDER_ADAPTER: "fake",
      MAIL_WORKER_POLL_SECONDS: "1",
      ...env
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  const exited = new Promise((resolve) => child.once("exit", (code, signal) => resolve({ code, output, signal })));

  const deadline = Date.now() + readyTimeoutMs;
  while (!output.includes("mail_worker_ready")) {
    if (child.exitCode !== null) {
      throw new Error(`mail-worker exited before it was ready (code ${child.exitCode}):\n${output}`);
    }
    if (Date.now() > deadline) {
      child.kill("SIGKILL");
      throw new Error(`mail-worker was not ready after ${readyTimeoutMs}ms:\n${output}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  return {
    child,
    exited,
    output: () => output,
    /** SIGTERM and wait for the worker to finish what it is doing and exit. */
    async stop() {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGTERM");
      }
      return await exited;
    }
  };
}
