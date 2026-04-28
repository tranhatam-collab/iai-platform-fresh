import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const sharedGateRequiredFrom = "2026-04-22";
const probeAuthSignals = ["auth_key_present"];
const legacySignals = [
  "attempt_after_2026_04_19",
  "checkout_url_non_null",
  "payment_link_id_non_null",
  "no_214",
  "production_gate_green"
];
const sharedGateSignals = [
  "shared_read_model_ready_for_shared_only",
  "shared_upstream_active_read_mode_shared_contract",
  "shared_upstream_release_gate_ready"
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

function readMachineSignal(markdown, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^-\\s*\\\`${escapedKey}\\\`:\\s*\\\`(PASS|FAIL)\\\`\\s*$`, "m");
  const match = markdown.match(pattern);
  if (!match) {
    return {
      present: false,
      pass: false,
      value: "MISSING"
    };
  }

  const value = match[1];
  return {
    present: true,
    pass: value === "PASS",
    value
  };
}

async function readUtf8OrNull(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function readJsonOrNull(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function getRequiredSignals(date) {
  if (date >= sharedGateRequiredFrom) {
    return [...probeAuthSignals, ...legacySignals, ...sharedGateSignals];
  }
  return legacySignals;
}

function readSignalFromJsonSignals(json, key) {
  if (!json || typeof json !== "object") {
    return null;
  }

  if (key === "auth_key_present") {
    const authKeyProvided = json.auth?.keyProvided;
    if (typeof authKeyProvided === "boolean") {
      return {
        present: true,
        pass: authKeyProvided,
        value: authKeyProvided ? "PASS" : "FAIL"
      };
    }
  }

  const signalMap = json.signals;
  if (
    !signalMap ||
    typeof signalMap !== "object" ||
    !Object.prototype.hasOwnProperty.call(signalMap, key)
  ) {
    return null;
  }

  const pass = signalMap[key] === true;
  return {
    present: true,
    pass,
    value: pass ? "PASS" : "FAIL"
  };
}

function resolveSignalCheck(signal, sources) {
  for (const source of sources) {
    if (!source.available) {
      continue;
    }

    const result =
      source.kind === "json"
        ? readSignalFromJsonSignals(source.body, signal)
        : readMachineSignal(String(source.body), signal);

    if (result?.present) {
      return {
        signal,
        ...result,
        source: source.id,
        sourcePath: source.path
      };
    }
  }

  return {
    signal,
    present: false,
    pass: false,
    value: "MISSING",
    source: "none",
    sourcePath: null
  };
}

function resolveSignalSources(signal, groups) {
  if (probeAuthSignals.includes(signal) || legacySignals.includes(signal)) {
    return [...groups.runtimeProbe, ...groups.manual];
  }

  if (sharedGateSignals.includes(signal)) {
    return [...groups.sharedRuntimeProbe, ...groups.runtimeProbe, ...groups.manual];
  }

  return [...groups.runtimeProbe, ...groups.sharedRuntimeProbe, ...groups.manual];
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");
  const manualSourceCandidates = [
    path.join(reportDir, `PAY_IAI_ONE_PROD_GATE_STATUS_${date}.md`),
    path.join(reportDir, `PAY_IAI_ONE_GATE_VERDICT_${date}.md`)
  ];
  const team2ReportDir = path.join(root, "docs", "reports", "team2");
  const team2JsonPath = path.join(team2ReportDir, `TEAM2_PAY_PROD_RUNTIME_PROBE_${date}.json`);
  const team2MarkdownPath = path.join(team2ReportDir, `TEAM2_PAY_PROD_RUNTIME_PROBE_${date}.md`);
  const team2SharedRuntimeJsonPath = path.join(
    team2ReportDir,
    `TEAM2_PAY_SHARED_RUNTIME_PROBE_${date}.json`
  );
  const team2SharedRuntimeMarkdownPath = path.join(
    team2ReportDir,
    `TEAM2_PAY_SHARED_RUNTIME_PROBE_${date}.md`
  );

  const requiredSignals = getRequiredSignals(date);
  const [manualSourceBodies, team2Json, team2Markdown, team2SharedRuntimeJson, team2SharedRuntimeMarkdown] = await Promise.all([
    Promise.all(manualSourceCandidates.map((candidatePath) => readUtf8OrNull(candidatePath))),
    readJsonOrNull(team2JsonPath),
    readUtf8OrNull(team2MarkdownPath),
    readJsonOrNull(team2SharedRuntimeJsonPath),
    readUtf8OrNull(team2SharedRuntimeMarkdownPath)
  ]);
  const manualSourceEntry =
    manualSourceCandidates
      .map((candidatePath, index) => ({
        absolutePath: candidatePath,
        relativePath: path.relative(root, candidatePath),
        body: manualSourceBodies[index]
      }))
      .find((entry) => Boolean(entry.body)) ?? null;
  const sourcePresent = Boolean(manualSourceEntry);
  const sourceMarkdown = manualSourceEntry?.body ?? null;
  const sourcePathDisplay = manualSourceEntry?.relativePath ?? path.relative(root, manualSourceCandidates[0]);

  const runtimeProbeSourcePresent = Boolean(team2Json || team2Markdown);
  const sharedRuntimeProbeSourcePresent = Boolean(
    team2SharedRuntimeJson || team2SharedRuntimeMarkdown
  );
  const runtimeProbeSources = [
    {
      id: "team2_probe_json",
      kind: "json",
      available: Boolean(team2Json),
      body: team2Json,
      path: path.relative(root, team2JsonPath)
    },
    {
      id: "team2_probe_markdown",
      kind: "markdown",
      available: Boolean(team2Markdown),
      body: team2Markdown,
      path: path.relative(root, team2MarkdownPath)
    }
  ];
  const sharedRuntimeProbeSources = [
    {
      id: "team2_shared_runtime_probe_json",
      kind: "json",
      available: Boolean(team2SharedRuntimeJson),
      body: team2SharedRuntimeJson,
      path: path.relative(root, team2SharedRuntimeJsonPath)
    },
    {
      id: "team2_shared_runtime_probe_markdown",
      kind: "markdown",
      available: Boolean(team2SharedRuntimeMarkdown),
      body: team2SharedRuntimeMarkdown,
      path: path.relative(root, team2SharedRuntimeMarkdownPath)
    }
  ];
  const manualSources = [
    {
      id: "team1_manual_note",
      kind: "markdown",
      available: Boolean(sourceMarkdown),
      body: sourceMarkdown,
      path: sourcePathDisplay
    }
  ];
  const signalSources = {
    manual: manualSources,
    runtimeProbe: runtimeProbeSources,
    sharedRuntimeProbe: sharedRuntimeProbeSources
  };

  const signalChecks = requiredSignals.map((signal) =>
    resolveSignalCheck(signal, resolveSignalSources(signal, signalSources))
  );
  const sourceChecks = [
    {
      name: "team1_manual_note_present",
      pass: sourcePresent,
      present: sourcePresent,
      value: sourcePresent ? "PRESENT" : "MISSING",
      sourcePath: sourcePresent
        ? sourcePathDisplay
        : manualSourceCandidates.map((candidatePath) => path.relative(root, candidatePath)).join(", ")
    },
    {
      name: "team2_runtime_probe_present",
      pass: runtimeProbeSourcePresent,
      present: runtimeProbeSourcePresent,
      value: runtimeProbeSourcePresent ? "PRESENT" : "MISSING",
      sourcePath: runtimeProbeSourcePresent
        ? [team2JsonPath, team2MarkdownPath]
            .filter((filePath, index) => (index === 0 ? Boolean(team2Json) : Boolean(team2Markdown)))
            .map((filePath) => path.relative(root, filePath))
            .join(", ")
        : path.relative(root, team2JsonPath)
    }
  ];

  const unmetSignals = [
    ...sourceChecks.filter((check) => !check.pass).map((check) => check.name),
    ...signalChecks.filter((check) => !check.pass).map((check) => check.signal)
  ];
  const overallPass =
    sourceChecks.every((check) => check.pass) && signalChecks.every((check) => check.pass);
  const gateDecision = overallPass ? "LOCK_FLIPPED" : "LOCK_RETAINED_WITH_REASON";
  const gateDecisionReason =
    unmetSignals.length === 0
      ? "Toan bo required signals va nguon evidence da dat."
      : `Chua du dieu kien production gate: ${unmetSignals.join(", ")}.`;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    sourcePath: sourcePathDisplay,
    sourcePresent,
    runtimeProbeSourcePresent,
    sharedRuntimeProbeSourcePresent,
    runtimeProbeSourcePaths: [team2JsonPath, team2MarkdownPath].map((filePath) =>
      path.relative(root, filePath)
    ),
    sharedRuntimeProbeSourcePaths: [
      team2SharedRuntimeJsonPath,
      team2SharedRuntimeMarkdownPath
    ].map((filePath) => path.relative(root, filePath)),
    requiredSignals,
    overallPass,
    gateDecision,
    gateDecisionReason,
    unmetSignals,
    sourceChecks,
    checks: signalChecks
  };

  await mkdir(reportDir, { recursive: true });
  const outputJsonPath = path.join(reportDir, `TEAM1_PAY_PROD_GATE_STATUS_${date}.json`);
  const outputMdPath = path.join(reportDir, `TEAM1_PAY_PROD_GATE_STATUS_${date}.md`);

  await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAM1_PAY_PROD_GATE_STATUS_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Source present: ${markdownStatus(sourcePresent)}`,
    `- Runtime probe source present: ${markdownStatus(runtimeProbeSourcePresent)}`,
    `- Shared runtime probe source present: ${markdownStatus(sharedRuntimeProbeSourcePresent)}`,
    `- Shared runtime signals required from: ${sharedGateRequiredFrom}`,
    `- Overall: ${markdownStatus(overallPass)}`,
    `- Gate decision: ${gateDecision}`,
    `- Gate reason: ${gateDecisionReason}`,
    "",
    "## Required signals",
    ...requiredSignals.map((signal) => `- ${signal}`),
    "",
    "## Source checks",
    ...sourceChecks.map(
      (check) =>
        `- ${check.name}: ${markdownStatus(check.pass)} (present=${markdownStatus(check.present)}, value=${check.value}, source=${check.sourcePath})`
    ),
    "",
    "## Signal checks",
    ...signalChecks.map(
      (check) =>
        `- ${check.signal}: ${markdownStatus(check.pass)} (present=${markdownStatus(check.present)}, value=${check.value}, source=${check.source}, sourcePath=${check.sourcePath ?? "none"})`
    ),
    "",
    "## Unmet signals",
    ...(unmetSignals.length === 0 ? ["- none"] : unmetSignals.map((signal) => `- ${signal}`)),
    "",
    "## Source",
    ...manualSourceCandidates.map((candidatePath) => `- ${path.relative(root, candidatePath)}`),
    `- ${path.relative(root, team2JsonPath)}`,
    `- ${path.relative(root, team2MarkdownPath)}`,
    `- ${path.relative(root, team2SharedRuntimeJsonPath)}`,
    `- ${path.relative(root, team2SharedRuntimeMarkdownPath)}`,
    ""
  ].join("\n");

  await writeFile(outputMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Pay production gate snapshot generated for ${date}.`,
      `Overall: ${overallPass ? "PASS" : "FAIL"}.`,
      `JSON: ${path.relative(root, outputJsonPath)}`,
      `MD: ${path.relative(root, outputMdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `pay production gate check failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
