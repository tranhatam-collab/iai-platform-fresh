import { mkdir, writeFile } from "node:fs/promises";
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

function getDateArg() {
  return getArg("date") ?? todayInTimezone(timezone);
}

function boolStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function toSafeJson(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value;
}

function getNested(input, pathParts) {
  let current = input;
  for (const key of pathParts) {
    if (!current || typeof current !== "object" || !(key in current)) {
      return null;
    }
    current = current[key];
  }
  return current ?? null;
}

async function fetchJsonWithMeta(url, init = {}) {
  const startedAt = new Date().toISOString();
  const response = await fetch(url, init);
  const endedAt = new Date().toISOString();
  const text = await response.text();

  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return {
    url,
    method: init.method ?? "GET",
    startedAt,
    endedAt,
    status: response.status,
    ok: response.ok,
    body: json ?? text
  };
}

export function extractSharedRuntimeSignals(healthBody) {
  const normalizedHealthBody = toSafeJson(healthBody);
  const sharedReadModel = getNested(normalizedHealthBody, ["data", "shared_read_model"]);
  const sharedUpstreamRuntime = getNested(normalizedHealthBody, ["data", "shared_upstream_runtime"]);
  const healthContractExposesSharedReadModel = Boolean(sharedReadModel);
  const healthContractExposesSharedUpstreamRuntime = Boolean(sharedUpstreamRuntime);
  const sharedReadModelReadyForSharedOnly =
    getNested(sharedReadModel, ["rolloutReadyForSharedOnly"]) === true;
  const sharedUpstreamActiveReadMode = getNested(sharedUpstreamRuntime, ["activeReadMode"]);
  const sharedUpstreamActiveReadModeSharedContract =
    sharedUpstreamActiveReadMode === "shared_contract";
  const sharedUpstreamReleaseGateReady =
    getNested(sharedUpstreamRuntime, ["releaseGate", "ready"]) === true;
  const sharedUpstreamReleaseGateReasons =
    getNested(sharedUpstreamRuntime, ["releaseGate", "reasons"]);

  return {
    healthContractExposesSharedReadModel,
    healthContractExposesSharedUpstreamRuntime,
    healthContractShape:
      healthContractExposesSharedReadModel || healthContractExposesSharedUpstreamRuntime
        ? "shared_runtime_contract"
        : "legacy_or_unknown",
    sharedReadModel,
    sharedReadModelReadyForSharedOnly,
    sharedUpstreamActiveReadMode,
    sharedUpstreamActiveReadModeSharedContract,
    sharedUpstreamReleaseGateReady,
    sharedUpstreamReleaseGateReasons: Array.isArray(sharedUpstreamReleaseGateReasons)
      ? sharedUpstreamReleaseGateReasons
      : null,
    sharedUpstreamRuntime
  };
}

async function main() {
  const root = process.cwd();
  const date = getDateArg();
  const reportDir = path.join(root, "docs", "reports", "team2");
  const baseUrl = process.env.TEAM2_PAY_SHARED_BASE_URL ?? "https://pay.iai.one";
  const endpointPath = process.env.TEAM2_PAY_SHARED_HEALTH_ENDPOINT ?? "/health";
  const targetUrl = new URL(endpointPath, baseUrl).toString();

  const health = await fetchJsonWithMeta(targetUrl);
  const healthBody = toSafeJson(health.body);
  const extracted = extractSharedRuntimeSignals(healthBody);

  const signals = {
    health_endpoint_ok: health.ok,
    health_contract_exposes_shared_read_model:
      extracted.healthContractExposesSharedReadModel,
    health_contract_exposes_shared_upstream_runtime:
      extracted.healthContractExposesSharedUpstreamRuntime,
    shared_read_model_ready_for_shared_only:
      extracted.sharedReadModelReadyForSharedOnly,
    shared_upstream_active_read_mode_shared_contract:
      extracted.sharedUpstreamActiveReadModeSharedContract,
    shared_upstream_release_gate_ready:
      extracted.sharedUpstreamReleaseGateReady
  };

  const unmetSignals = Object.entries(signals)
    .filter(([, pass]) => !pass)
    .map(([signal]) => signal);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    target: {
      baseUrl,
      endpointPath,
      targetUrl
    },
    responses: {
      health
    },
    extracted: {
      health_contract_shape: extracted.healthContractShape,
      shared_read_model_rollout_ready_for_shared_only:
        extracted.sharedReadModelReadyForSharedOnly,
      shared_upstream_active_read_mode: extracted.sharedUpstreamActiveReadMode ?? null,
      shared_upstream_release_gate_ready:
        extracted.sharedUpstreamReleaseGateReady,
      shared_upstream_release_gate_reasons:
        extracted.sharedUpstreamReleaseGateReasons,
      shared_read_model_present:
        extracted.healthContractExposesSharedReadModel,
      shared_upstream_runtime_present:
        extracted.healthContractExposesSharedUpstreamRuntime
    },
    signals,
    unmetSignals
  };

  await mkdir(reportDir, { recursive: true });
  const outputJsonPath = path.join(reportDir, `TEAM2_PAY_SHARED_RUNTIME_PROBE_${date}.json`);
  const outputMdPath = path.join(reportDir, `TEAM2_PAY_SHARED_RUNTIME_PROBE_${date}.md`);

  await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAM2_PAY_SHARED_RUNTIME_PROBE_${date}`,
    `- Nhóm: Team 2 Runtime and Platform Core`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Target: \`${targetUrl}\``,
    "",
    "## Kết quả health/runtime shared check",
    `- HTTP status health: \`${health.status}\``,
    `- Health contract shape: \`${extracted.healthContractShape}\``,
    `- shared_read_model present: \`${boolStatus(extracted.healthContractExposesSharedReadModel)}\``,
    `- shared_upstream_runtime present: \`${boolStatus(extracted.healthContractExposesSharedUpstreamRuntime)}\``,
    `- shared_read_model.rolloutReadyForSharedOnly: \`${boolStatus(extracted.sharedReadModelReadyForSharedOnly)}\``,
    `- shared_upstream_runtime.activeReadMode = shared_contract: \`${boolStatus(extracted.sharedUpstreamActiveReadModeSharedContract)}\``,
    `- shared_upstream_runtime.releaseGate.ready: \`${boolStatus(extracted.sharedUpstreamReleaseGateReady)}\``,
    `- shared_upstream_runtime.releaseGate.reasons: \`${extracted.sharedUpstreamReleaseGateReasons?.join(",") || "none"}\``,
    "",
    "## Tín hiệu máy đọc",
    `- \`health_endpoint_ok\`: \`${boolStatus(health.ok)}\``,
    `- \`health_contract_exposes_shared_read_model\`: \`${boolStatus(extracted.healthContractExposesSharedReadModel)}\``,
    `- \`health_contract_exposes_shared_upstream_runtime\`: \`${boolStatus(extracted.healthContractExposesSharedUpstreamRuntime)}\``,
    `- \`shared_read_model_ready_for_shared_only\`: \`${boolStatus(extracted.sharedReadModelReadyForSharedOnly)}\``,
    `- \`shared_upstream_active_read_mode_shared_contract\`: \`${boolStatus(extracted.sharedUpstreamActiveReadModeSharedContract)}\``,
    `- \`shared_upstream_release_gate_ready\`: \`${boolStatus(extracted.sharedUpstreamReleaseGateReady)}\``,
    "",
    "## Unmet signals",
    ...(unmetSignals.length === 0 ? ["- none"] : unmetSignals.map((signal) => `- ${signal}`)),
    "",
    "## Nguồn JSON",
    `- ${path.relative(root, outputJsonPath)}`,
    ""
  ].join("\n");

  await writeFile(outputMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Team 2 pay shared runtime probe generated for ${date}.`,
      `Health HTTP status: ${health.status}.`,
      `Unmet signals: ${unmetSignals.length > 0 ? unmetSignals.join(", ") : "none"}.`,
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
      `team2 pay shared runtime probe failed: ${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exitCode = 1;
  });
}
