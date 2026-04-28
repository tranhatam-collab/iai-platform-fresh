import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function getArg(name) {
  const explicit = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  if (!explicit) {
    return null;
  }
  return explicit.slice(name.length + 3);
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function boolStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

async function readJsonOrNull(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function resolveRerunBundlePreflight(env = process.env) {
  const canonicalApiKey =
    env.TEAM2_PAY_GATE_API_KEY ||
    env.PAY_IAI_ONE_GATE_API_KEY ||
    env.TNO_PAY_GATE_API_KEY ||
    null;
  const canonicalSiteKey =
    env.TEAM2_PAY_GATE_SITE_KEY ||
    env.PAY_IAI_ONE_GATE_SITE_KEY ||
    env.TNO_PAY_GATE_SITE_KEY ||
    null;
  const authKeyHeaderName = canonicalApiKey
    ? "x-api-key"
    : canonicalSiteKey
      ? "x-site-key"
      : null;
  const authKeySource = env.TEAM2_PAY_GATE_API_KEY
    ? "TEAM2_PAY_GATE_API_KEY"
    : env.PAY_IAI_ONE_GATE_API_KEY
      ? "PAY_IAI_ONE_GATE_API_KEY"
      : env.TNO_PAY_GATE_API_KEY
        ? "TNO_PAY_GATE_API_KEY"
        : env.TEAM2_PAY_GATE_SITE_KEY
          ? "TEAM2_PAY_GATE_SITE_KEY"
          : env.PAY_IAI_ONE_GATE_SITE_KEY
            ? "PAY_IAI_ONE_GATE_SITE_KEY"
            : env.TNO_PAY_GATE_SITE_KEY
              ? "TNO_PAY_GATE_SITE_KEY"
              : "none";

  const checks = [
    {
      name: "auth_key_present",
      pass: Boolean(authKeyHeaderName),
      note: authKeyHeaderName
        ? `Using ${authKeyHeaderName} from ${authKeySource}.`
        : "Missing canonical pay gate key. Set TEAM2_PAY_GATE_* or PAY_IAI_ONE_GATE_* or TNO_PAY_GATE_* variables."
    },
    {
      name: "tenant_code_explicit",
      pass: Boolean(env.TEAM2_PAY_GATE_TENANT_CODE),
      note: env.TEAM2_PAY_GATE_TENANT_CODE
        ? `tenant=${env.TEAM2_PAY_GATE_TENANT_CODE}`
        : "Missing TEAM2_PAY_GATE_TENANT_CODE."
    },
    {
      name: "site_code_explicit",
      pass: Boolean(env.TEAM2_PAY_GATE_SITE_CODE),
      note: env.TEAM2_PAY_GATE_SITE_CODE
        ? `site=${env.TEAM2_PAY_GATE_SITE_CODE}`
        : "Missing TEAM2_PAY_GATE_SITE_CODE."
    }
  ];

  return {
    authKeyHeaderName,
    authKeySource,
    checks,
    ready: checks.every((check) => check.pass)
  };
}

export function deriveRerunBundleStatus({
  preflight,
  gateSnapshot,
  runtimeProbe,
  sharedRuntimeProbe,
  commands,
  preflightOnly
}) {
  if (!preflight.ready) {
    return "BLOCKED_PRECHECK";
  }

  if (preflightOnly) {
    return "PREFLIGHT_READY";
  }

  if (commands.some((command) => command.required && command.exitCode !== 0)) {
    return "COMMAND_FAILURE";
  }

  if (gateSnapshot?.overallPass === true) {
    return "RERUN_GREEN";
  }

  if (gateSnapshot?.overallPass === false || runtimeProbe || sharedRuntimeProbe) {
    return "RERUN_COMPLETED_GATE_FAIL";
  }

  return "RERUN_INCOMPLETE";
}

function buildNextActions({ preflight, gateSnapshot, runtimeProbe, sharedRuntimeProbe, preflightOnly }) {
  const actions = [];

  if (!preflight.checks.find((check) => check.name === "auth_key_present")?.pass) {
    actions.push("Cấp key canonical cho probe nội bộ (`TEAM2_PAY_GATE_API_KEY` hoặc `TEAM2_PAY_GATE_SITE_KEY`).");
  }
  if (!preflight.checks.find((check) => check.name === "tenant_code_explicit")?.pass) {
    actions.push("Khóa `TEAM2_PAY_GATE_TENANT_CODE` cho site/domain đang rerun.");
  }
  if (!preflight.checks.find((check) => check.name === "site_code_explicit")?.pass) {
    actions.push("Khóa `TEAM2_PAY_GATE_SITE_CODE` cho site/domain đang rerun.");
  }

  if (preflightOnly && preflight.ready) {
    actions.push("Có thể chạy full rerun bundle ngay khi owner/provider cho phép cửa sổ rerun.");
  }

  if (runtimeProbe?.signals?.auth_key_present === false) {
    actions.push("Rerun checkout probe chỉ sau khi key/header canonical đã được owner xác nhận đúng contract.");
  }

  if (Array.isArray(sharedRuntimeProbe?.unmetSignals) && sharedRuntimeProbe.unmetSignals.length > 0) {
    actions.push("Đồng bộ deploy/runtime production để `/health` expose `shared_read_model` và `shared_upstream_runtime` đúng contract.");
  }

  if (Array.isArray(gateSnapshot?.unmetSignals) && gateSnapshot.unmetSignals.length > 0) {
    actions.push(`Đóng các tín hiệu gate còn fail: ${gateSnapshot.unmetSignals.join(", ")}.`);
  }

  return [...new Set(actions)];
}

function runCommand(root, command, args, options = {}) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: process.env
  });
  const endedAt = new Date().toISOString();

  return {
    command,
    args,
    category: options.category ?? "general",
    endedAt,
    exitCode: typeof result.status === "number" ? result.status : 1,
    ok: result.status === 0,
    required: options.required ?? true,
    startedAt,
    stderr: result.stderr?.trim() ?? "",
    stdout: result.stdout?.trim() ?? ""
  };
}

async function main() {
  const root = process.cwd();
  const date = getArg("date") ?? todayInTimezone(timezone);
  const preflightOnly = hasFlag("--preflight-only");
  const skipTests = hasFlag("--skip-tests");
  const preflight = resolveRerunBundlePreflight(process.env);
  const reportDir = path.join(root, "docs", "reports", "team2");

  const runtimeProbeJsonPath = path.join(reportDir, `TEAM2_PAY_PROD_RUNTIME_PROBE_${date}.json`);
  const sharedRuntimeProbeJsonPath = path.join(
    reportDir,
    `TEAM2_PAY_SHARED_RUNTIME_PROBE_${date}.json`
  );
  const gateJsonPath = path.join(root, "docs", "reports", "team1", `TEAM1_PAY_PROD_GATE_STATUS_${date}.json`);

  const commands = [];

  if (!preflightOnly && preflight.ready) {
    commands.push(
      runCommand(
        root,
        "node",
        ["scripts/team2-pay-prod-runtime-probe.mjs", `--date=${date}`],
        { category: "runtime_probe", required: true }
      ),
      runCommand(
        root,
        "node",
        ["scripts/team2-pay-shared-runtime-probe.mjs", `--date=${date}`],
        { category: "shared_runtime_probe", required: true }
      ),
      runCommand(
        root,
        "node",
        ["scripts/team1-pay-prod-gate-check.mjs", `--date=${date}`],
        { category: "team1_gate", required: true }
      )
    );

    if (!skipTests) {
      commands.push(
        runCommand(root, "pnpm", ["test:pay"], { category: "test_pay", required: true }),
        runCommand(root, "pnpm", ["test:dash"], { category: "test_dash", required: true })
      );
    }
  }

  const [runtimeProbe, sharedRuntimeProbe, gateSnapshot] = await Promise.all([
    readJsonOrNull(runtimeProbeJsonPath),
    readJsonOrNull(sharedRuntimeProbeJsonPath),
    readJsonOrNull(gateJsonPath)
  ]);

  const status = deriveRerunBundleStatus({
    commands,
    gateSnapshot,
    preflight,
    preflightOnly,
    runtimeProbe,
    sharedRuntimeProbe
  });

  const nextActions = buildNextActions({
    gateSnapshot,
    preflight,
    preflightOnly,
    runtimeProbe,
    sharedRuntimeProbe
  });

  const bundle = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    status,
    preflightOnly,
    skipTests,
    preflight,
    commands,
    artifacts: {
      runtimeProbe: path.relative(root, runtimeProbeJsonPath),
      sharedRuntimeProbe: path.relative(root, sharedRuntimeProbeJsonPath),
      team1Gate: path.relative(root, gateJsonPath)
    },
    summaries: {
      runtimeProbe: runtimeProbe
        ? {
            authKeyPresent: runtimeProbe.signals?.auth_key_present ?? null,
            checkoutUrlNonNull: runtimeProbe.signals?.checkout_url_non_null ?? null,
            paymentLinkIdNonNull: runtimeProbe.signals?.payment_link_id_non_null ?? null,
            no214: runtimeProbe.signals?.no_214 ?? null,
            productionGateGreen: runtimeProbe.signals?.production_gate_green ?? null,
            unmetSignals: runtimeProbe.unmetSignals ?? []
          }
        : null,
      sharedRuntimeProbe: sharedRuntimeProbe
        ? {
            healthContractShape: sharedRuntimeProbe.extracted?.health_contract_shape ?? null,
            sharedReadModelReadyForSharedOnly:
              sharedRuntimeProbe.signals?.shared_read_model_ready_for_shared_only ?? null,
            sharedUpstreamActiveReadModeSharedContract:
              sharedRuntimeProbe.signals?.shared_upstream_active_read_mode_shared_contract ?? null,
            sharedUpstreamReleaseGateReady:
              sharedRuntimeProbe.signals?.shared_upstream_release_gate_ready ?? null,
            unmetSignals: sharedRuntimeProbe.unmetSignals ?? []
          }
        : null,
      team1Gate: gateSnapshot
        ? {
            overallPass: gateSnapshot.overallPass ?? null,
            gateDecision: gateSnapshot.gateDecision ?? null,
            unmetSignals: gateSnapshot.unmetSignals ?? []
          }
        : null
    },
    nextActions
  };

  await mkdir(reportDir, { recursive: true });
  const outputJsonPath = path.join(reportDir, `TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_${date}.json`);
  const outputMdPath = path.join(reportDir, `TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_${date}.md`);
  await writeFile(outputJsonPath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_${date}`,
    `- Generated at: ${bundle.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Status: \`${status}\``,
    `- Preflight only: \`${preflightOnly ? "yes" : "no"}\``,
    `- Skip tests: \`${skipTests ? "yes" : "no"}\``,
    "",
    "## Preflight",
    ...preflight.checks.map(
      (check) => `- \`${check.name}\`: \`${boolStatus(check.pass)}\` — ${check.note}`
    ),
    "",
    "## Commands",
    ...(commands.length === 0
      ? ["- no commands executed"]
      : commands.map(
          (command) =>
            `- \`${command.command} ${command.args.join(" ")}\`: \`${boolStatus(command.ok)}\` (exit=${command.exitCode})`
        )),
    "",
    "## Artifact summaries",
    `- Runtime probe artifact: \`${bundle.artifacts.runtimeProbe}\``,
    `- Shared runtime probe artifact: \`${bundle.artifacts.sharedRuntimeProbe}\``,
    `- Team 1 gate artifact: \`${bundle.artifacts.team1Gate}\``,
    "",
    "## Runtime probe summary",
    ...(bundle.summaries.runtimeProbe
      ? [
          `- \`auth_key_present\`: \`${boolStatus(Boolean(bundle.summaries.runtimeProbe.authKeyPresent))}\``,
          `- \`checkout_url_non_null\`: \`${boolStatus(Boolean(bundle.summaries.runtimeProbe.checkoutUrlNonNull))}\``,
          `- \`payment_link_id_non_null\`: \`${boolStatus(Boolean(bundle.summaries.runtimeProbe.paymentLinkIdNonNull))}\``,
          `- \`no_214\`: \`${boolStatus(Boolean(bundle.summaries.runtimeProbe.no214))}\``,
          `- \`production_gate_green\`: \`${boolStatus(Boolean(bundle.summaries.runtimeProbe.productionGateGreen))}\``,
          `- unmet: \`${bundle.summaries.runtimeProbe.unmetSignals.join(", ") || "none"}\``
        ]
      : ["- runtime probe artifact not available"]),
    "",
    "## Shared runtime summary",
    ...(bundle.summaries.sharedRuntimeProbe
      ? [
          `- health contract shape: \`${bundle.summaries.sharedRuntimeProbe.healthContractShape ?? "unknown"}\``,
          `- \`shared_read_model_ready_for_shared_only\`: \`${boolStatus(Boolean(bundle.summaries.sharedRuntimeProbe.sharedReadModelReadyForSharedOnly))}\``,
          `- \`shared_upstream_active_read_mode_shared_contract\`: \`${boolStatus(Boolean(bundle.summaries.sharedRuntimeProbe.sharedUpstreamActiveReadModeSharedContract))}\``,
          `- \`shared_upstream_release_gate_ready\`: \`${boolStatus(Boolean(bundle.summaries.sharedRuntimeProbe.sharedUpstreamReleaseGateReady))}\``,
          `- unmet: \`${bundle.summaries.sharedRuntimeProbe.unmetSignals.join(", ") || "none"}\``
        ]
      : ["- shared runtime probe artifact not available"]),
    "",
    "## Team 1 gate summary",
    ...(bundle.summaries.team1Gate
      ? [
          `- overall: \`${boolStatus(Boolean(bundle.summaries.team1Gate.overallPass))}\``,
          `- decision: \`${bundle.summaries.team1Gate.gateDecision ?? "unknown"}\``,
          `- unmet: \`${bundle.summaries.team1Gate.unmetSignals.join(", ") || "none"}\``
        ]
      : ["- Team 1 gate artifact not available"]),
    "",
    "## Next actions",
    ...(nextActions.length === 0 ? ["- none"] : nextActions.map((item) => `- ${item}`)),
    ""
  ].join("\n");

  await writeFile(outputMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Team 2 pay rerun bundle status generated for ${date}.`,
      `Status: ${status}.`,
      `JSON: ${path.relative(root, outputJsonPath)}`,
      `MD: ${path.relative(root, outputMdPath)}`
    ].join("\n")
  );
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main().catch((error) => {
    process.stderr.write(
      `team2 pay rerun bundle failed: ${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exitCode = 1;
  });
}
