import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const mockPort = process.env.NOOS_COMMERCE_MOCK_PORT ?? "4311";
const webPort = process.env.NOOS_WEB_PORT ?? "4320";
const apiBase = `http://127.0.0.1:${mockPort}`;
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

const mock = spawnChild(
  process.execPath,
  [path.join(workspaceRoot, "scripts/noos-commerce-mock-server.mjs"), `--port=${mockPort}`],
  process.env,
  "mock"
);
const web = spawnChild(
  pnpmCommand,
  ["--filter", "@iai/noos-web", "dev"],
  {
    ...process.env,
    NOOS_WEB_PORT: webPort,
    NOOS_COMMERCE_API_BASE: apiBase,
    NOOS_COMMERCE_REQUIRE_API: "1"
  },
  "web"
);

function shutdown(signal) {
  mock.kill(signal);
  web.kill(signal);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

Promise.all([
  new Promise((resolve) => mock.once("exit", resolve)),
  new Promise((resolve) => web.once("exit", resolve))
]).then(() => process.exit(0));
