import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
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

function getDateArg() {
  const explicit = process.argv.find((argument) => argument.startsWith("--date="));
  if (explicit) {
    return explicit.slice("--date=".length);
  }
  return todayInTimezone(timezone);
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readJsonOrNull(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function deriveFullRerunReviewStatus({
  artifactChecks,
  bundle,
  gateSnapshot,
  runtimeProbe,
  sharedRuntimeProbe
}) {
  const allArtifactsPresent = artifactChecks.every((check) => check.present);
  const preflightReady = bundle?.preflight?.ready === true;
  const bundleGreen = bundle?.status === "RERUN_GREEN";
  const gateOverallPass = gateSnapshot?.overallPass === true;
  const sharedHealthContractShared =
    sharedRuntimeProbe?.extracted?.health_contract_shape === "shared_runtime_contract";

  if (!bundle) {
    return "REVIEW_BLOCKED_MISSING_BUNDLE";
  }

  if (!allArtifactsPresent) {
    return "REVIEW_BLOCKED_MISSING_ARTIFACTS";
  }

  if (!preflightReady) {
    return "REVIEW_BLOCKED_PRECHECK";
  }

  if (bundle?.status === "COMMAND_FAILURE") {
    return "REVIEW_BLOCKED_COMMAND_FAILURE";
  }

  if (!bundleGreen || !gateOverallPass || !sharedHealthContractShared || !runtimeProbe) {
    return "REVIEW_BLOCKED_GATE_FAIL";
  }

  return "READY_FOR_TEAM1_FLIP_REVIEW";
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();
  const team1ReportDir = path.join(root, "docs", "reports", "team1");
  const team2ReportDir = path.join(root, "docs", "reports", "team2");

  const expectedArtifacts = [
    {
      name: "bundle_markdown",
      absolutePath: path.join(
        team2ReportDir,
        `TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_${date}.md`
      )
    },
    {
      name: "bundle_json",
      absolutePath: path.join(
        team2ReportDir,
        `TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_${date}.json`
      )
    },
    {
      name: "runtime_probe_markdown",
      absolutePath: path.join(
        team2ReportDir,
        `TEAM2_PAY_PROD_RUNTIME_PROBE_${date}.md`
      )
    },
    {
      name: "runtime_probe_json",
      absolutePath: path.join(
        team2ReportDir,
        `TEAM2_PAY_PROD_RUNTIME_PROBE_${date}.json`
      )
    },
    {
      name: "shared_runtime_probe_markdown",
      absolutePath: path.join(
        team2ReportDir,
        `TEAM2_PAY_SHARED_RUNTIME_PROBE_${date}.md`
      )
    },
    {
      name: "shared_runtime_probe_json",
      absolutePath: path.join(
        team2ReportDir,
        `TEAM2_PAY_SHARED_RUNTIME_PROBE_${date}.json`
      )
    },
    {
      name: "team1_gate_markdown",
      absolutePath: path.join(
        team1ReportDir,
        `TEAM1_PAY_PROD_GATE_STATUS_${date}.md`
      )
    },
    {
      name: "team1_gate_json",
      absolutePath: path.join(
        team1ReportDir,
        `TEAM1_PAY_PROD_GATE_STATUS_${date}.json`
      )
    }
  ];

  const artifactChecks = await Promise.all(
    expectedArtifacts.map(async (artifact) => ({
      name: artifact.name,
      path: path.relative(root, artifact.absolutePath),
      present: await fileExists(artifact.absolutePath)
    }))
  );

  const bundleJsonPath = expectedArtifacts.find((artifact) => artifact.name === "bundle_json").absolutePath;
  const runtimeProbeJsonPath = expectedArtifacts.find(
    (artifact) => artifact.name === "runtime_probe_json"
  ).absolutePath;
  const sharedRuntimeProbeJsonPath = expectedArtifacts.find(
    (artifact) => artifact.name === "shared_runtime_probe_json"
  ).absolutePath;
  const gateSnapshotJsonPath = expectedArtifacts.find(
    (artifact) => artifact.name === "team1_gate_json"
  ).absolutePath;

  const [bundle, runtimeProbe, sharedRuntimeProbe, gateSnapshot] = await Promise.all([
    readJsonOrNull(bundleJsonPath),
    readJsonOrNull(runtimeProbeJsonPath),
    readJsonOrNull(sharedRuntimeProbeJsonPath),
    readJsonOrNull(gateSnapshotJsonPath)
  ]);

  const status = deriveFullRerunReviewStatus({
    artifactChecks,
    bundle,
    gateSnapshot,
    runtimeProbe,
    sharedRuntimeProbe
  });

  const signalChecks = [
    {
      name: "bundle_preflight_ready",
      pass: bundle?.preflight?.ready === true,
      details: bundle
        ? `bundle.status=${bundle.status}`
        : "bundle JSON missing"
    },
    {
      name: "bundle_green",
      pass: bundle?.status === "RERUN_GREEN",
      details: bundle ? `bundle.status=${bundle.status}` : "bundle JSON missing"
    },
    {
      name: "gate_overall_pass",
      pass: gateSnapshot?.overallPass === true,
      details: gateSnapshot
        ? `gateDecision=${gateSnapshot.gateDecision}`
        : "gate JSON missing"
    },
    {
      name: "shared_health_contract_shared_runtime",
      pass: sharedRuntimeProbe?.extracted?.health_contract_shape === "shared_runtime_contract",
      details: sharedRuntimeProbe
        ? `health_contract_shape=${sharedRuntimeProbe.extracted?.health_contract_shape ?? "unknown"}`
        : "shared runtime JSON missing"
    }
  ];

  const runtimeGateSignals = [
    "auth_key_present",
    "checkout_url_non_null",
    "payment_link_id_non_null",
    "no_214",
    "production_gate_green",
    "shared_read_model_ready_for_shared_only",
    "shared_upstream_active_read_mode_shared_contract",
    "shared_upstream_release_gate_ready"
  ].map((signal) => ({
    signal,
    pass: gateSnapshot?.checks?.find((entry) => entry.signal === signal)?.pass === true,
    source:
      gateSnapshot?.checks?.find((entry) => entry.signal === signal)?.sourcePath ?? "missing"
  }));

  const nextActions = [];
  if (artifactChecks.some((check) => !check.present)) {
    nextActions.push("Bổ sung đủ 8 artifact bắt buộc trước khi Team 1 đóng review.");
  }
  if (bundle?.preflight?.ready !== true) {
    nextActions.push("Giải quyết precheck canonical env trước khi xin Team 1 review flip.");
  }
  if (bundle?.status === "COMMAND_FAILURE") {
    nextActions.push("Sửa command failure trong full bundle rồi rerun lại cùng ngày.");
  }
  if (gateSnapshot?.overallPass !== true) {
    nextActions.push(
      `Đóng các tín hiệu gate còn fail: ${(gateSnapshot?.unmetSignals ?? []).join(", ") || "unknown"}.`
    );
  }
  if (sharedRuntimeProbe?.extracted?.health_contract_shape !== "shared_runtime_contract") {
    nextActions.push("Deploy production `/health` đúng shared runtime contract trước khi xin flip.");
  }
  if (nextActions.length === 0) {
    nextActions.push("Team 1 có thể mở review flip gate dựa trên bundle hiện tại.");
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    status,
    artifactChecks,
    signalChecks,
    runtimeGateSignals,
    bundleSummary: bundle
      ? {
          status: bundle.status,
          preflightReady: bundle.preflight?.ready === true,
          nextActions: bundle.nextActions ?? []
        }
      : null,
    gateSummary: gateSnapshot
      ? {
          overallPass: gateSnapshot.overallPass ?? false,
          gateDecision: gateSnapshot.gateDecision ?? "MISSING",
          unmetSignals: gateSnapshot.unmetSignals ?? []
        }
      : null,
    nextActions
  };

  await mkdir(team1ReportDir, { recursive: true });
  const outputJsonPath = path.join(
    team1ReportDir,
    `TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_${date}.json`
  );
  const outputMdPath = path.join(
    team1ReportDir,
    `TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_${date}.md`
  );

  await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Status: \`${status}\``,
    "",
    "## Artifact checks",
    ...artifactChecks.map(
      (check) => `- ${markdownStatus(check.present)} \`${check.name}\` — \`${check.path}\``
    ),
    "",
    "## Review checks",
    ...signalChecks.map(
      (check) =>
        `- ${markdownStatus(check.pass)} \`${check.name}\`${check.details ? ` — ${check.details}` : ""}`
    ),
    "",
    "## Gate signals",
    ...runtimeGateSignals.map(
      (check) =>
        `- ${markdownStatus(check.pass)} \`${check.signal}\` — source: \`${check.source}\``
    ),
    "",
    "## Bundle summary",
    ...(bundle
      ? [
          `- bundle.status: \`${bundle.status}\``,
          `- preflight.ready: \`${markdownStatus(bundle.preflight?.ready === true)}\``,
          `- bundle next actions: \`${(bundle.nextActions ?? []).join(" | ") || "none"}\``
        ]
      : ["- bundle JSON missing"]),
    "",
    "## Team 1 gate summary",
    ...(gateSnapshot
      ? [
          `- overallPass: \`${markdownStatus(gateSnapshot.overallPass === true)}\``,
          `- gateDecision: \`${gateSnapshot.gateDecision ?? "MISSING"}\``,
          `- unmetSignals: \`${(gateSnapshot.unmetSignals ?? []).join(", ") || "none"}\``
        ]
      : ["- Team 1 gate JSON missing"]),
    "",
    "## Next actions",
    ...nextActions.map((item) => `- ${item}`),
    ""
  ].join("\n");

  await writeFile(outputMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(`${markdown}\n`);
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
