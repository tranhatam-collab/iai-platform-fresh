import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const apiPort = process.env.API_FLOW_PORT ?? "8787";
const webPort = process.env.WEB_PORT ?? "4330";
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function prefixStream(stream, prefix) {
  stream.on("data", (chunk) => {
    process.stdout.write(
      chunk
        .toString()
        .split("\n")
        .filter(Boolean)
        .map((line) => `[${prefix}] ${line}\n`)
        .join("")
    );
  });
}

function spawnChild(command, args, env, label) {
  const child = spawn(command, args, {
    cwd: workspaceRoot,
    env,
    stdio: ["inherit", "pipe", "pipe"]
  });

  prefixStream(child.stdout, label);
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

const api = spawnChild(
  pnpmCommand,
  ["--filter", "@iai/mail-api", "dev"],
  {
    ...process.env,
    PORT: apiPort
  },
  "api.flow"
);

const web = spawnChild(
  pnpmCommand,
  ["--filter", "@iai/web", "dev"],
  {
    ...process.env,
    WEB_PORT: webPort,
    WEB_SHARED_FLOW_API_BASE: `http://127.0.0.1:${apiPort}`
  },
  "web"
);

function shutdown(signal) {
  api.kill(signal);
  web.kill(signal);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

Promise.all([
  new Promise((resolve) => api.once("exit", resolve)),
  new Promise((resolve) => web.once("exit", resolve))
]).then(() => process.exit(0));
