import { spawn } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const defaultTimeoutMs = 60_000;
const screenshotRequirements = [
  {
    label: "Root landing",
    route: "https://cios.iai.one/",
    relativePath: "docs/release-evidence/cios.iai.one/artifacts/screenshots/root.png"
  },
  {
    label: "CIOS hub",
    route: "https://cios.iai.one/cios/",
    relativePath: "docs/release-evidence/cios.iai.one/artifacts/screenshots/hub.png"
  },
  {
    label: "CIOS app",
    route: "https://cios.iai.one/cios/app/",
    relativePath: "docs/release-evidence/cios.iai.one/artifacts/screenshots/app.png"
  },
  {
    label: "CIOS pricing",
    route: "https://cios.iai.one/cios/pricing/",
    relativePath: "docs/release-evidence/cios.iai.one/artifacts/screenshots/pricing.png"
  },
  {
    label: "CIOS demo",
    route: "https://cios.iai.one/cios/demo/",
    relativePath: "docs/release-evidence/cios.iai.one/artifacts/screenshots/demo.png"
  }
];

function todayInTimezone(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function getArg(name) {
  const explicit = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  if (!explicit) {
    return null;
  }
  return explicit.slice(name.length + 3);
}

function getDateArg() {
  return getArg("date") ?? todayInTimezone(timezone);
}

function getTimeoutMsArg() {
  const parsed = Number.parseInt(getArg("timeout-ms") ?? `${defaultTimeoutMs}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultTimeoutMs;
}

function boolStatus(value) {
  return value ? "PASS" : "FAIL";
}

function trimOutput(output) {
  const normalized = output.replace(/\u001b\[[0-9;]*m/g, "").trim();
  if (normalized.length <= 2000) {
    return normalized;
  }
  return `${normalized.slice(0, 2000)}...`;
}

async function fileExists(absolutePath) {
  try {
    await access(absolutePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function parseDotEnv(text) {
  const entries = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

async function runCommand({ command, args, cwd, env = {}, timeoutMs }) {
  return await new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;
    let timeoutId = null;

    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolve({
        ...result,
        durationMs: Date.now() - startedAt,
        stdout: trimOutput(stdout),
        stderr: trimOutput(stderr)
      });
    };

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      finish({
        ok: false,
        exitCode: null,
        signal: null,
        timedOut,
        error: error.message
      });
    });

    child.on("close", (exitCode, signal) => {
      finish({
        ok: exitCode === 0 && !timedOut,
        exitCode,
        signal,
        timedOut,
        error: null
      });
    });

    timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!settled) {
          child.kill("SIGKILL");
        }
      }, 1_000);
    }, timeoutMs);
  });
}

function evaluateSmokeReadiness(dotEnv) {
  const workersJwtSecret =
    process.env.WORKERS_JWT_SECRET ??
    process.env.CIOS_WORKERS_JWT_SECRET ??
    dotEnv.WORKERS_JWT_SECRET ??
    dotEnv.CIOS_WORKERS_JWT_SECRET ??
    process.env.JWT_SECRET ??
    dotEnv.JWT_SECRET ??
    "";
  const directToken =
    process.env.CIOS_WORKERS_BEARER_TOKEN ?? dotEnv.CIOS_WORKERS_BEARER_TOKEN ?? "";
  const sessionPassword =
    process.env.CIOS_AUTH_PASSWORD ??
    process.env.AUTH_DEMO_PASSWORD ??
    dotEnv.CIOS_AUTH_PASSWORD ??
    dotEnv.AUTH_DEMO_PASSWORD ??
    "demo123456";
  const workersApiUrl =
    dotEnv.WORKERS_API_URL ??
    process.env.WORKERS_API_URL ??
    process.env.CIOS_WORKERS_API_URL ??
    "https://cios-workers-api.tranhatam66.workers.dev";

  const hasWorkersJwtSecret = Boolean(workersJwtSecret);
  const hasDirectToken = Boolean(directToken);
  const hasSessionAuth = Boolean(sessionPassword);
  const hasWorkersApiUrl = Boolean(workersApiUrl);
  const workersJwtLooksPlaceholder =
    workersJwtSecret === "replace_me" ||
    /^changeme$/i.test(workersJwtSecret) ||
    /^example$/i.test(workersJwtSecret);

  const authReady = hasDirectToken || hasSessionAuth || hasWorkersJwtSecret;

  return {
    hasWorkersJwtSecret,
    hasDirectToken,
    hasSessionAuth,
    hasWorkersApiUrl,
    ready: authReady && hasWorkersApiUrl,
    workersJwtLooksPlaceholder,
    workersJwtSource:
      process.env.WORKERS_JWT_SECRET || process.env.CIOS_WORKERS_JWT_SECRET
        ? "environment"
        : dotEnv.WORKERS_JWT_SECRET || dotEnv.CIOS_WORKERS_JWT_SECRET
          ? ".env"
          : process.env.JWT_SECRET
            ? "environment(jwt_secret)"
            : dotEnv.JWT_SECRET
              ? ".env(jwt_secret)"
              : "missing",
    directTokenSource:
      process.env.CIOS_WORKERS_BEARER_TOKEN
        ? "environment"
        : dotEnv.CIOS_WORKERS_BEARER_TOKEN
          ? ".env"
          : "missing",
    sessionAuthSource:
      process.env.CIOS_AUTH_PASSWORD || process.env.AUTH_DEMO_PASSWORD
        ? "environment"
        : dotEnv.CIOS_AUTH_PASSWORD || dotEnv.AUTH_DEMO_PASSWORD
          ? ".env"
          : "default(demo123456)",
    workersApiUrlSource: dotEnv.WORKERS_API_URL
      ? ".env"
      : process.env.WORKERS_API_URL || process.env.CIOS_WORKERS_API_URL
        ? "environment"
        : "default",
    workersApiUrl: workersApiUrl || null
  };
}

function commandSummary(result) {
  if (result.ok) {
    return "PASS";
  }
  if (result.timedOut) {
    return "TIMEOUT";
  }
  if (result.exitCode !== null) {
    return `FAIL_EXIT_${result.exitCode}`;
  }
  if (result.signal) {
    return `FAIL_SIGNAL_${result.signal}`;
  }
  return "FAIL";
}

async function main() {
  const root = process.cwd();
  const date = getDateArg();
  const timeoutMs = getTimeoutMsArg();
  const reportDir = path.join(root, "docs", "reports", "team1");
  const ciosRoot = path.resolve(root, "..", "cios.iai.one");
  const packetPath = path.join(
    root,
    "docs",
    "release-evidence",
    "cios.iai.one",
    "CIOS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md"
  );
  const runtimeProofPath = path.join(
    root,
    "docs",
    "release-evidence",
    "cios.iai.one",
    "CIOS_IAI_ONE_RUNTIME_CONTRACT_PROOF_2026-04-21.md"
  );
  const strictSmokeArtifactJsonPath = path.join(
    root,
    "docs",
    "release-evidence",
    "cios.iai.one",
    "artifacts",
    `CIOS_IAI_ONE_STRICT_SMOKE_${date}.json`
  );
  const ciosEnvPath = path.join(ciosRoot, ".env");

  const [ciosRootExists, packetExists, runtimeProofExists, ciosEnvText, strictSmokeArtifactRaw] = await Promise.all([
    fileExists(ciosRoot),
    fileExists(packetPath),
    fileExists(runtimeProofPath),
    readFile(ciosEnvPath, "utf8").catch(() => ""),
    readFile(strictSmokeArtifactJsonPath, "utf8").catch(() => "")
  ]);

  const dotEnv = parseDotEnv(ciosEnvText);
  const smokeReadiness = evaluateSmokeReadiness(dotEnv);
  const strictSmokeArtifact = strictSmokeArtifactRaw ? JSON.parse(strictSmokeArtifactRaw) : null;
  const strictSmokeArtifactPass = strictSmokeArtifact?.success === true;

  const screenshotChecks = await Promise.all(
    screenshotRequirements.map(async (requirement) => {
      const absolutePath = path.join(root, requirement.relativePath);
      return {
        ...requirement,
        present: await fileExists(absolutePath)
      };
    })
  );
  const screenshotPackPresent = screenshotChecks.every((item) => item.present);

  const workspaceEvidenceGuard = await runCommand({
    command: process.execPath,
    args: ["--test", "tests/integration/cios-release-evidence.test.mjs"],
    cwd: root,
    timeoutMs
  });

  const upstreamVitest = ciosRootExists
    ? await runCommand({
        command: process.execPath,
        args: [
          "node_modules/vitest/vitest.mjs",
          "run",
          "--reporter=verbose",
          "--maxWorkers=1",
          "--configLoader",
          "runner"
        ],
        cwd: ciosRoot,
        env: {
          CI: "1",
          PGCONNECT_TIMEOUT: "2"
        },
        timeoutMs
      })
    : {
        ok: false,
        exitCode: null,
        signal: null,
        timedOut: false,
        error: "Sibling cios workspace missing.",
        stdout: "",
        stderr: "",
        durationMs: 0
      };

  let strictSmoke = {
    ok: false,
    exitCode: null,
    signal: null,
    timedOut: false,
    error: "Skipped because WORKERS_API_URL or auth strategy is not ready.",
    stdout: "",
    stderr: "",
    durationMs: 0,
    skipped: true
  };

  if (strictSmokeArtifactPass) {
    strictSmoke = {
      ok: true,
      exitCode: 0,
      signal: null,
      timedOut: false,
      error: null,
      stdout: strictSmokeArtifactJsonPath,
      stderr: "",
      durationMs: Number(strictSmokeArtifact?.finalResult?.durationMs ?? 0),
      skipped: false,
      reusedArtifact: true
    };
  } else if (ciosRootExists && smokeReadiness.ready) {
    const smokeResult = await runCommand({
      command: process.execPath,
      args: ["scripts/teamc-cios-strict-smoke-capture.mjs", `--date=${date}`],
      cwd: root,
      timeoutMs
    });

    strictSmoke = {
      ...smokeResult,
      skipped: false
    };
  }

  const checks = {
    ciosWorkspacePresent: ciosRootExists,
    packetPresent: packetExists,
    runtimeProofPresent: runtimeProofExists,
    screenshotPackPresent,
    workspaceEvidenceGuardPass: workspaceEvidenceGuard.ok,
    upstreamVitestPass: upstreamVitest.ok,
    strictSmokeReady: smokeReadiness.ready,
    strictSmokePass: strictSmoke.ok
  };

  const unmetChecks = Object.entries(checks)
    .filter(([, pass]) => !pass)
    .map(([name]) => name);

  const nextActions = [];
  if (!checks.ciosWorkspacePresent) {
    nextActions.push("Khôi phục sibling workspace ../cios.iai.one trước khi claim Team C closure.");
  }
  if (!checks.packetPresent) {
    nextActions.push("Giữ packet Team C ở path canonical trong docs/release-evidence/cios.iai.one.");
  }
  if (!checks.runtimeProofPresent) {
    nextActions.push("Khôi phục runtime contract proof canonical cho Team C.");
  }
  if (!checks.screenshotPackPresent) {
    nextActions.push(
      "Chạy `pnpm proof:teamc-cios-screenshots` sau khi được cấp quyền render preview để tạo screenshot pack 5 route."
    );
  }
  if (!checks.upstreamVitestPass) {
    if (upstreamVitest.timedOut) {
      nextActions.push(
        "Rerun Team C closure checker với `--timeout-ms=60000` hoặc cao hơn sau khi hydrate workspace; suite upstream hiện pass khoảng 34 giây nên timeout quá thấp sẽ tạo false blocker."
      );
    } else {
      nextActions.push(
        "Điều tra `npm test` của ../cios.iai.one trong môi trường có DB/toolchain đúng hoặc thêm harness test phù hợp trước khi Team 1 dùng upstream suite làm proof."
      );
    }
  }
  if (!checks.strictSmokeReady) {
    nextActions.push(
      "Bổ sung `WORKERS_API_URL` hoặc cung cấp auth strategy hợp lệ (session/token/secret) rồi rerun strict smoke."
    );
  } else if (!checks.strictSmokePass) {
    nextActions.push(
      "Rerun `node scripts/teamc-cios-strict-smoke-capture.mjs` và xử lý lỗi runtime theo artifact strict smoke mới."
    );
  }
  if (smokeReadiness.workersJwtLooksPlaceholder) {
    nextActions.push(
      "JWT secret hiện có dấu hiệu placeholder; nên rotate sang secret mạnh sau khi Team C review closure hoàn tất."
    );
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    timeoutMs,
    paths: {
      ciosRoot: path.relative(root, ciosRoot),
      packetPath: path.relative(root, packetPath),
      runtimeProofPath: path.relative(root, runtimeProofPath)
    },
    smokeReadiness,
    screenshotChecks,
    commands: {
      workspaceEvidenceGuard: {
        command: "node --test tests/integration/cios-release-evidence.test.mjs",
        result: commandSummary(workspaceEvidenceGuard),
        ...workspaceEvidenceGuard
      },
      upstreamVitest: {
        command: "node node_modules/vitest/vitest.mjs run --reporter=verbose --maxWorkers=1 --configLoader runner",
        result: commandSummary(upstreamVitest),
        ...upstreamVitest
      },
      strictSmoke: {
        command: "node scripts/teamc-cios-strict-smoke-capture.mjs",
        result: strictSmoke.skipped
          ? "SKIPPED_ENV_NOT_READY"
          : strictSmoke.reusedArtifact
            ? "PASS_REUSED_ARTIFACT"
            : commandSummary(strictSmoke),
        ...strictSmoke
      }
    },
    checks,
    unmetChecks,
    reviewClosureReady: unmetChecks.length === 0,
    nextActions
  };

  await mkdir(reportDir, { recursive: true });
  const outputJsonPath = path.join(reportDir, `TEAMC_CIOS_REVIEW_CLOSURE_STATUS_${date}.json`);
  const outputMdPath = path.join(reportDir, `TEAMC_CIOS_REVIEW_CLOSURE_STATUS_${date}.md`);

  await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAMC_CIOS_REVIEW_CLOSURE_STATUS_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Review closure ready: ${boolStatus(snapshot.reviewClosureReady)}`,
    `- Timeout per command: ${timeoutMs}ms`,
    "",
    "## Gate checks",
    `- ciosWorkspacePresent: ${boolStatus(checks.ciosWorkspacePresent)}`,
    `- packetPresent: ${boolStatus(checks.packetPresent)}`,
    `- runtimeProofPresent: ${boolStatus(checks.runtimeProofPresent)}`,
    `- screenshotPackPresent: ${boolStatus(checks.screenshotPackPresent)}`,
    `- workspaceEvidenceGuardPass: ${boolStatus(checks.workspaceEvidenceGuardPass)}`,
    `- upstreamVitestPass: ${boolStatus(checks.upstreamVitestPass)}`,
    `- strictSmokeReady: ${boolStatus(checks.strictSmokeReady)}`,
    `- strictSmokePass: ${boolStatus(checks.strictSmokePass)}`,
    "",
    "## Screenshot pack",
    ...screenshotChecks.map(
      (entry) =>
        `- ${entry.label} (${entry.route}): ${boolStatus(entry.present)} -> ${entry.relativePath}`
    ),
    "",
    "## Smoke readiness",
    `- Direct bearer token ready: ${boolStatus(smokeReadiness.hasDirectToken)} (source=${smokeReadiness.directTokenSource})`,
    `- Auth session ready: ${boolStatus(smokeReadiness.hasSessionAuth)} (source=${smokeReadiness.sessionAuthSource})`,
    `- Workers JWT secret ready: ${boolStatus(smokeReadiness.hasWorkersJwtSecret)} (source=${smokeReadiness.workersJwtSource})`,
    `- Workers JWT secret looks placeholder: ${boolStatus(smokeReadiness.workersJwtLooksPlaceholder)}`,
    `- Workers API URL ready: ${boolStatus(smokeReadiness.hasWorkersApiUrl)} (source=${smokeReadiness.workersApiUrlSource}, value=${smokeReadiness.workersApiUrl ?? "missing"})`,
    "",
    "## Command results",
    `- workspace evidence guard: ${snapshot.commands.workspaceEvidenceGuard.result}`,
    `- upstream vitest: ${snapshot.commands.upstreamVitest.result}`,
    `- strict smoke: ${snapshot.commands.strictSmoke.result}`,
    "",
    "## Command output excerpts",
    `- workspace evidence guard stdout: ${snapshot.commands.workspaceEvidenceGuard.stdout || "none"}`,
    `- workspace evidence guard stderr: ${snapshot.commands.workspaceEvidenceGuard.stderr || "none"}`,
    `- upstream vitest stdout: ${snapshot.commands.upstreamVitest.stdout || "none"}`,
    `- upstream vitest stderr: ${snapshot.commands.upstreamVitest.stderr || "none"}`,
    `- strict smoke stdout: ${snapshot.commands.strictSmoke.stdout || "none"}`,
    `- strict smoke stderr: ${snapshot.commands.strictSmoke.stderr || "none"}`,
    "",
    "## Unmet checks",
    ...(snapshot.unmetChecks.length === 0
      ? ["- none"]
      : snapshot.unmetChecks.map((entry) => `- ${entry}`)),
    "",
    "## Next actions",
    ...(nextActions.length === 0 ? ["- none"] : nextActions.map((entry) => `- ${entry}`)),
    "",
    "## Source paths",
    `- ${path.relative(root, packetPath)}`,
    `- ${path.relative(root, runtimeProofPath)}`,
    `- ${path.relative(root, ciosEnvPath)}`,
    ""
  ].join("\n");

  await writeFile(outputMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Team C CIOS review closure snapshot generated for ${date}.`,
      `Review closure ready: ${snapshot.reviewClosureReady ? "PASS" : "FAIL"}.`,
      `Unmet checks: ${snapshot.unmetChecks.length > 0 ? snapshot.unmetChecks.join(", ") : "none"}.`,
      `JSON: ${path.relative(root, outputJsonPath)}`,
      `MD: ${path.relative(root, outputMdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team c cios review closure check failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
