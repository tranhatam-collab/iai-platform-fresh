import { spawn } from "node:child_process";

const timezone = "Asia/Ho_Chi_Minh";

function todayInTimezone(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function getDateArg() {
  const explicit = process.argv.find((argument) => argument.startsWith("--date="));
  return explicit ? explicit.slice("--date=".length) : todayInTimezone(timezone);
}

function runCommand(step, command, args, env = {}) {
  return new Promise((resolve) => {
    process.stdout.write(`\n[team4-proof] ${step}\n`);
    process.stdout.write(`[team4-proof] $ ${[command, ...args].join(" ")}\n`);

    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: "pipe"
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      resolve({
        step,
        ok: code === 0,
        code: code ?? -1,
        stdout,
        stderr
      });
    });
  });
}

function runQuiet(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "pipe"
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}

async function collectPortPids(port) {
  const result = await runQuiet("lsof", ["-ti", `tcp:${port}`]);
  if (result.code !== 0 || !result.stdout.trim()) {
    return [];
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => Number.parseInt(line.trim(), 10))
    .filter((value) => Number.isInteger(value) && value > 0);
}

async function cleanupPorts(ports) {
  const pidSet = new Set();
  for (const port of ports) {
    const pids = await collectPortPids(port);
    for (const pid of pids) {
      pidSet.add(pid);
    }
  }
  if (pidSet.size === 0) {
    return;
  }

  process.stdout.write(
    `[team4-proof] Cleaning stale port owners on [${ports.join(", ")}]: ${[...pidSet].join(", ")}\n`
  );

  for (const pid of pidSet) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {}
  }
  await new Promise((resolve) => setTimeout(resolve, 500));

  for (const pid of pidSet) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
  }
}

async function runWithRetry(config) {
  const retries = Number.isInteger(config.retries) && config.retries > 0 ? config.retries : 0;
  let attempt = 0;
  let lastResult = null;

  while (attempt <= retries) {
    if (Array.isArray(config.cleanupPorts) && config.cleanupPorts.length > 0) {
      await cleanupPorts(config.cleanupPorts);
    }
    const label =
      attempt === 0 ? config.step : `${config.step} (retry ${attempt}/${retries})`;
    lastResult = await runCommand(label, config.command, config.args, config.env);
    if (lastResult.ok) {
      return lastResult;
    }
    if (attempt < retries) {
      const waitMs = Math.min(3000, 1000 * (attempt + 1));
      process.stdout.write(`[team4-proof] Waiting ${waitMs}ms before retry...\n`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    attempt += 1;
  }

  return lastResult;
}

async function main() {
  const date = getDateArg();
  const steps = [
    {
      step: `Format + readiness check (${date})`,
      command: "node",
      args: ["scripts/team4-checkpoint-review.mjs", `--date=${date}`]
    },
    {
      step: "Build NOOS web",
      command: "pnpm",
      args: ["--filter", "@iai/noos-web", "build"]
    },
    {
      step: "NOOS web integration tests",
      command: "node",
      args: ["--test", "tests/integration/noos-commerce-surface.test.mjs"]
    },
    {
      step: "NOOS stack test",
      command: "node",
      args: ["--test", "tests/integration/noos-commerce-stack.test.mjs"],
      env: { NOOS_STACK_TEST: "1" },
      cleanupPorts: [4313, 4322],
      retries: 2
    },
    {
      step: "Lane status snapshot",
      command: "node",
      args: ["scripts/team1-lane-status-check.mjs"]
    }
  ];

  const results = [];
  for (const config of steps) {
    const result = await runWithRetry(config);
    results.push(result);
    if (!result.ok) {
      break;
    }
  }

  process.stdout.write("\n[team4-proof] Summary\n");
  for (const result of results) {
    process.stdout.write(
      `- ${result.ok ? "PASS" : "FAIL"} | ${result.step} | exit=${result.code}\n`
    );
  }

  const failed = results.find((result) => !result.ok);
  if (failed) {
    process.stderr.write(
      `[team4-proof] Failed at step: ${failed.step}. Stop and fix before checkpoint.\n`
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `[team4-proof] Team 4 checkpoint proof PASS for ${date}.\n`
  );
}

main().catch((error) => {
  process.stderr.write(
    `[team4-proof] Unexpected error: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
