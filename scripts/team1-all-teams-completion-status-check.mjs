import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

function parseArg(prefix) {
  const arg = process.argv.find((entry) => entry.startsWith(`${prefix}=`));
  return arg ? arg.slice(prefix.length + 1) : null;
}

function boolStatus(value) {
  return value ? "PASS" : "FAIL";
}

function normalize(value) {
  return String(value ?? "").trim();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveDatedFile(root, relativeDir, prefix, extension, requestedDate) {
  const absoluteDir = path.join(root, relativeDir);
  let entries = [];

  try {
    entries = await readdir(absoluteDir);
  } catch {
    return null;
  }

  const pattern = new RegExp(
    `^${escapeRegex(prefix)}_(\\d{4}-\\d{2}-\\d{2})\\.${escapeRegex(extension)}$`
  );

  const dates = entries
    .flatMap((entry) => {
      const match = pattern.exec(entry);
      return match ? [match[1]] : [];
    })
    .sort((left, right) => right.localeCompare(left));

  if (dates.length === 0) {
    return null;
  }

  const selectedDate = dates.find((date) => date <= requestedDate) ?? dates[0];
  const absolutePath = path.join(absoluteDir, `${prefix}_${selectedDate}.${extension}`);
  const raw = await readFile(absolutePath, "utf8");

  return {
    date: selectedDate,
    absolutePath,
    relativePath: path.relative(root, absolutePath),
    raw
  };
}

async function resolveJsonSnapshot(root, relativeDir, prefix, requestedDate) {
  const file = await resolveDatedFile(root, relativeDir, prefix, "json", requestedDate);
  if (!file) {
    return null;
  }

  return {
    ...file,
    data: JSON.parse(file.raw)
  };
}

function getPaySignalSummary(payGateStatus, team2Probe, team2SharedProbe, controlTower) {
  if (payGateStatus?.data) {
    const signalEntries = [];
    const seen = new Set();
    const checks = Array.isArray(payGateStatus.data.checks) ? payGateStatus.data.checks : [];
    for (const check of checks) {
      if (!check?.signal || seen.has(check.signal)) {
        continue;
      }
      seen.add(check.signal);
      signalEntries.push({
        signal: check.signal,
        pass: check.pass === true
      });
    }

    const sourceChecks = Array.isArray(payGateStatus.data.sourceChecks)
      ? payGateStatus.data.sourceChecks
      : [];
    const runtimeProbePresence = sourceChecks.find(
      (entry) => entry?.name === "team2_runtime_probe_present"
    );
    if (runtimeProbePresence && !seen.has("team2_runtime_probe_present")) {
      signalEntries.push({
        signal: "team2_runtime_probe_present",
        pass: runtimeProbePresence.pass === true
      });
    }

    const passed = signalEntries.filter((entry) => entry.pass).length;
    return {
      source: "team1-pay-prod-gate-status",
      passed,
      total: signalEntries.length,
      unmetSignals: signalEntries.filter((entry) => !entry.pass).map((entry) => entry.signal),
      signalEntries,
      runtimeProbeSourcePresent: payGateStatus.data.runtimeProbeSourcePresent === true,
      sharedRuntimeProbeSourcePresent: payGateStatus.data.sharedRuntimeProbeSourcePresent === true
    };
  }

  const requiredSignals = [
    "attempt_after_2026_04_19",
    "checkout_url_non_null",
    "payment_link_id_non_null",
    "no_214",
    "production_gate_green",
    "shared_read_model_ready_for_shared_only",
    "shared_upstream_active_read_mode_shared_contract",
    "shared_upstream_release_gate_ready"
  ];

  const signalEntries = requiredSignals.map((signal) => ({
    signal,
    pass: false
  }));

  if (team2Probe?.data?.signals && typeof team2Probe.data.signals === "object") {
    for (const entry of signalEntries) {
      if (entry.signal in team2Probe.data.signals) {
        entry.pass = team2Probe.data.signals[entry.signal] === true;
      }
    }
  }

  if (team2SharedProbe?.data?.signals && typeof team2SharedProbe.data.signals === "object") {
    for (const entry of signalEntries) {
      if (entry.signal in team2SharedProbe.data.signals) {
        entry.pass = team2SharedProbe.data.signals[entry.signal] === true;
      }
    }
  }

  const unmetFromControlTower =
    controlTower?.data?.checks?.payProductionGate?.unmetSignals &&
    Array.isArray(controlTower.data.checks.payProductionGate.unmetSignals)
      ? controlTower.data.checks.payProductionGate.unmetSignals
      : [];

  for (const entry of signalEntries) {
    if (unmetFromControlTower.includes(entry.signal)) {
      entry.pass = false;
    }
  }

  const passed = signalEntries.filter((entry) => entry.pass).length;
  return {
    source: "team2-probes-and-control-tower",
    passed,
    total: signalEntries.length,
    unmetSignals: signalEntries.filter((entry) => !entry.pass).map((entry) => entry.signal),
    signalEntries,
    runtimeProbeSourcePresent: Boolean(team2Probe),
    sharedRuntimeProbeSourcePresent: Boolean(team2SharedProbe)
  };
}

function extractDomainVerdicts(domainVerdictsMarkdown) {
  if (!domainVerdictsMarkdown) {
    return {
      developerReopenApproved: false,
      cdnPendingOwnerEvidence: false,
      flowsPendingRouteRuntimeProof: false,
      flowsTs5083Cleared: false,
      ciosEvidenceReviewPending: false
    };
  }

  return {
    developerReopenApproved:
      /developer\.iai\.one[\s\S]*?Verdict:\s*`REOPEN_REVIEW_APPROVED`/i.test(domainVerdictsMarkdown),
    cdnPendingOwnerEvidence:
      /cdn\.iai\.one[\s\S]*?Verdict:\s*`REOPEN_REVIEW_DENIED_PENDING_OWNER_EVIDENCE`/i.test(
        domainVerdictsMarkdown
      ),
    flowsPendingRouteRuntimeProof:
      /flows\.iai\.one[\s\S]*?Verdict:\s*`REOPEN_REVIEW_PENDING_ROUTE_RUNTIME_PROOF`/i.test(
        domainVerdictsMarkdown
      ),
    flowsTs5083Cleared: /TS5083[\s\S]*?không còn tái hiện/i.test(domainVerdictsMarkdown),
    ciosEvidenceReviewPending:
      /cios\.iai\.one[\s\S]*?Verdict:\s*`SUBMITTED_EVIDENCE_REVIEW_PENDING`/i.test(
        domainVerdictsMarkdown
      )
  };
}

function extractCiosIssueState(ciosPacketMarkdown) {
  if (!ciosPacketMarkdown) {
    return {
      vitestEnvOpen: false,
      freshScreenshotOpen: false,
      strictSmokeOpen: false,
      openCount: 0
    };
  }

  const vitestEnvOpen =
    /(?:ERR_INVALID_PACKAGE_CONFIG|vitest run|Vitest local install|STALL\/TIMEOUT)[\s\S]*?`OPEN`/i.test(
      ciosPacketMarkdown
    );
  const freshScreenshotOpen = /fresh browser screenshot[\s\S]*?`OPEN`/i.test(ciosPacketMarkdown);
  const strictSmokeOpen = /strict deployed smoke[\s\S]*?`OPEN`/i.test(ciosPacketMarkdown);
  const openCount = [vitestEnvOpen, freshScreenshotOpen, strictSmokeOpen].filter(Boolean).length;

  return {
    vitestEnvOpen,
    freshScreenshotOpen,
    strictSmokeOpen,
    openCount
  };
}

function extractCdnEvidenceState(cdnPacketMarkdown, cdnDeltaMarkdown) {
  const packetPendingOwnerEvidence = /Status:\s*`PENDING_OWNER_EVIDENCE`/i.test(
    cdnPacketMarkdown ?? ""
  );
  const deltaSubmitted = Boolean(cdnDeltaMarkdown);
  const deltaDnsUnresolved = /Could not resolve host:\s*cdn\.iai\.one/i.test(
    cdnDeltaMarkdown ?? ""
  );
  const deltaPendingUnchanged = /Pending evidence remains unchanged/i.test(cdnDeltaMarkdown ?? "");
  const deltaExplicitOpen = /vẫn giữ\s*`OPEN`/i.test(cdnDeltaMarkdown ?? "");
  const deployRuleCacheProofClosed =
    deltaSubmitted &&
    !deltaDnsUnresolved &&
    !deltaPendingUnchanged &&
    !deltaExplicitOpen &&
    !packetPendingOwnerEvidence;

  return {
    deltaSubmitted,
    deltaDnsUnresolved,
    deltaPendingUnchanged,
    packetPendingOwnerEvidence,
    deployRuleCacheProofClosed
  };
}

function extractReminderInsights(reminderMarkdown) {
  if (!reminderMarkdown) {
    return {
      teamBCdnMissingEvidence: false,
      teamBFlowsBlockedByTs5083: false,
      teamCOpenRuntimeIssues: false
    };
  }

  return {
    teamBCdnMissingEvidence:
      /cdn\.iai\.one/i.test(reminderMarkdown) && /deploy\/rule\/cache/i.test(reminderMarkdown),
    teamBFlowsBlockedByTs5083:
      /flows\.iai\.one/i.test(reminderMarkdown) && /TS5083/i.test(reminderMarkdown),
    teamCOpenRuntimeIssues:
      /ERR_INVALID_PACKAGE_CONFIG/i.test(reminderMarkdown) ||
      /vitest/i.test(reminderMarkdown) ||
      /strict deployed smoke/i.test(reminderMarkdown)
  };
}

function extractMailLaneState(mailLaneMarkdown) {
  if (!mailLaneMarkdown) {
    return {
      statusLabel: "MISSING",
      mailboxAliasTruthDone: false,
      inboundRoutingTruthDone: false,
      gmailProofDone: false,
      outlookProofDone: false,
      internalInboxProofDone: false,
      wave1CloseoutReady: false
    };
  }

  const statusMatch = mailLaneMarkdown.match(/Status:\s*([^\n]+)/i);
  const statusLabel = statusMatch?.[1]?.trim() ?? "UNKNOWN";
  const isPartial = /PARTIAL|OPEN|LOCKED/i.test(statusLabel);
  const missingBlockAnnounced = /Chưa có evidence vận hành thật cho/i.test(mailLaneMarkdown);

  const mailboxAliasTruthMissing =
    missingBlockAnnounced &&
    /mailbox hoặc alias truth/i.test(mailLaneMarkdown);
  const inboundRoutingTruthMissing =
    missingBlockAnnounced && /inbound route truth/i.test(mailLaneMarkdown);
  const gmailProofMissing =
    missingBlockAnnounced && /inbox proof thật trên Gmail/i.test(mailLaneMarkdown);
  const outlookProofMissing =
    missingBlockAnnounced && /inbox proof thật trên Outlook/i.test(mailLaneMarkdown);
  const internalInboxProofMissing =
    missingBlockAnnounced && /inbox proof thật trên mailbox nội bộ/i.test(mailLaneMarkdown);

  const mailboxAliasTruthDone = !mailboxAliasTruthMissing;
  const inboundRoutingTruthDone = !inboundRoutingTruthMissing;
  const gmailProofDone = !gmailProofMissing;
  const outlookProofDone = !outlookProofMissing;
  const internalInboxProofDone = !internalInboxProofMissing;
  const wave1CloseoutReady =
    !isPartial &&
    mailboxAliasTruthDone &&
    inboundRoutingTruthDone &&
    gmailProofDone &&
    outlookProofDone &&
    internalInboxProofDone;

  return {
    statusLabel,
    mailboxAliasTruthDone,
    inboundRoutingTruthDone,
    gmailProofDone,
    outlookProofDone,
    internalInboxProofDone,
    wave1CloseoutReady
  };
}

function extractTeamChannelReminderState(reminderStatusMarkdown, reminderSchedule) {
  const schedule = reminderSchedule?.data;
  const scheduleRows = Array.isArray(schedule?.channel_map) ? schedule.channel_map : [];
  const activeRowsFromSchedule = scheduleRows.filter(
    (row) => normalize(row?.status) !== "COMPLETE_VERIFIED"
  ).length;

  const activeRowsFromMarkdown = Number(
    reminderStatusMarkdown?.match(/- Active rows:\s*`?(\d+)`?/)?.[1] ?? 0
  );
  const activeRows = activeRowsFromSchedule || activeRowsFromMarkdown;
  const cadenceIs15 =
    schedule?.cadence_minutes === 15 ||
    /- Cadence minutes:\s*`?15`?/i.test(reminderStatusMarkdown ?? "");
  const overallPass =
    /- Overall:\s*PASS/i.test(reminderStatusMarkdown ?? "") ||
    (cadenceIs15 && activeRows >= 10);

  return {
    available: Boolean(reminderStatusMarkdown || reminderSchedule),
    cadenceIs15,
    activeRows,
    overallPass,
    scheduleStatus: normalize(schedule?.status) || "UNKNOWN"
  };
}

function isBatchScopePath(filePath) {
  if (filePath === "package.json") {
    return true;
  }

  const prefixes = [
    "docs/reports/team1/",
    "docs/reports/team2/",
    "docs/reports/team5/",
    "docs/release-evidence/",
    "scripts/team1-",
    "scripts/team2-",
    "scripts/team5-"
  ];

  return prefixes.some((prefix) => filePath.startsWith(prefix));
}

function getGitScopeStatus(root) {
  try {
    const output = execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8"
    });

    const lines = output
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    const paths = lines.map((line) => {
      const payload = line.slice(3);
      const renamedTarget = payload.includes(" -> ") ? payload.split(" -> ").pop() : payload;
      const normalized = renamedTarget?.replace(/^"|"$/g, "") ?? payload;
      return normalized;
    });

    const outOfScopePaths = paths.filter((filePath) => !isBatchScopePath(filePath));
    const commitScopeLocked = outOfScopePaths.length === 0;

    return {
      available: true,
      dirtyFiles: paths.length,
      outOfScopeFiles: outOfScopePaths.length,
      outOfScopeExamples: outOfScopePaths.slice(0, 8),
      commitScopeLocked
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : String(error),
      dirtyFiles: -1,
      outOfScopeFiles: -1,
      outOfScopeExamples: [],
      commitScopeLocked: false
    };
  }
}

function completionBand(completionPercent) {
  if (completionPercent >= 95) return "FINAL_LOCK_PENDING";
  if (completionPercent >= 75) return "NARROW_REMAINING_SCOPE";
  if (completionPercent >= 50) return "IN_PROGRESS";
  return "EARLY_STAGE";
}

async function main() {
  const root = process.cwd();
  const requestedDate = parseArg("--date") ?? todayInTimezone(timezone);

  const [
    controlTower,
    payGateStatus,
    team1FullRerunReview,
    team2Probe,
    team2SharedProbe,
    team2RerunBundle,
    team5Readiness,
    teamDEvidenceStatus,
    teamBCdnFlowsEvidenceStatus,
    channelReminderSchedule,
    channelReminderStatus,
    docsIntegration,
    languageAudit,
    ciosClosure,
    mailLaneStatus,
    reminder,
    domainVerdicts,
    ciosPacket,
    cdnPacket,
    cdnDelta
  ] = await Promise.all([
    resolveJsonSnapshot(root, "docs/reports/team1", "CONTROL_TOWER_AUTOMATION_STATUS", requestedDate),
    resolveJsonSnapshot(root, "docs/reports/team1", "TEAM1_PAY_PROD_GATE_STATUS", requestedDate),
    resolveJsonSnapshot(
      root,
      "docs/reports/team1",
      "TEAM1_PAY_FULL_RERUN_REVIEW_STATUS",
      requestedDate
    ),
    resolveJsonSnapshot(root, "docs/reports/team2", "TEAM2_PAY_PROD_RUNTIME_PROBE", requestedDate),
    resolveJsonSnapshot(root, "docs/reports/team2", "TEAM2_PAY_SHARED_RUNTIME_PROBE", requestedDate),
    resolveJsonSnapshot(
      root,
      "docs/reports/team2",
      "TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS",
      requestedDate
    ),
    resolveJsonSnapshot(root, "docs/reports/team5", "TEAM5_LIVE_SYNC_READINESS", requestedDate),
    resolveJsonSnapshot(
      root,
      "docs/reports/teamd",
      "TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS",
      requestedDate
    ),
    resolveJsonSnapshot(
      root,
      "docs/reports/team1",
      "TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS",
      requestedDate
    ),
    resolveJsonSnapshot(
      root,
      "docs/reports/team1",
      "TEAM_CHANNEL_REMINDER_SCHEDULE",
      requestedDate
    ),
    resolveDatedFile(
      root,
      "docs/reports/team1",
      "TEAM_CHANNEL_REMINDER_STATUS",
      "md",
      requestedDate
    ),
    resolveJsonSnapshot(
      root,
      "docs/reports/team1",
      "PAY_IAI_ONE_REPO_DOCS_INTEGRATION_STATUS",
      requestedDate
    ),
    resolveJsonSnapshot(
      root,
      "docs/reports/team1",
      "UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT",
      requestedDate
    ),
    resolveJsonSnapshot(
      root,
      "docs/reports/team1",
      "TEAMC_CIOS_REVIEW_CLOSURE_STATUS",
      requestedDate
    ),
    resolveDatedFile(
      root,
      "docs/iai-mail-platform",
      "MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS",
      "md",
      requestedDate
    ),
    resolveDatedFile(
      root,
      "docs/reports/team1",
      "TEAM_ADMIN_ALL_TEAMS_COMPLETION_REMINDER",
      "md",
      requestedDate
    ),
    resolveDatedFile(
      root,
      "docs/reports/team1",
      "TEAM1_DOMAIN_REOPEN_VERDICTS",
      "md",
      requestedDate
    ),
    resolveDatedFile(
      root,
      "docs/release-evidence/cios.iai.one",
      "CIOS_IAI_ONE_RELEASE_EVIDENCE_PACKET",
      "md",
      requestedDate
    ),
    resolveDatedFile(
      root,
      "docs/release-evidence/cdn.iai.one",
      "CDN_IAI_ONE_RELEASE_EVIDENCE_PACKET",
      "md",
      requestedDate
    ),
    resolveDatedFile(
      root,
      "docs/release-evidence/cdn.iai.one",
      "CDN_IAI_ONE_DELTA_EVIDENCE",
      "md",
      requestedDate
    )
  ]);

  if (!controlTower) {
    throw new Error("Missing CONTROL_TOWER_AUTOMATION_STATUS_*.json snapshot.");
  }

  if (!team5Readiness) {
    throw new Error("Missing TEAM5_LIVE_SYNC_READINESS_*.json snapshot.");
  }

  const governanceReady =
    controlTower.data.releaseControlState === "READY" || controlTower.data.controlReady === true;
  const noGoOwnersDone = controlTower.data.checks?.noGoPacketTracker?.pass === true;
  const liveSyncReady = team5Readiness.data.status === "READY_FOR_SYNCHRONIZED_LIVE";

  const paySignals = getPaySignalSummary(payGateStatus, team2Probe, team2SharedProbe, controlTower);
  const controlTowerPayGateDone = controlTower.data.checks?.payProductionGate?.pass === true;
  const payGateStatusOverallPass = payGateStatus?.data?.overallPass === true;
  const payGateDecisionLockFlipped = payGateStatus?.data?.gateDecision === "LOCK_FLIPPED";
  const paySignalFullyMet = paySignals.total > 0 && paySignals.unmetSignals.length === 0;
  const controlTowerStaleComparedToPayGate =
    Boolean(payGateStatus?.date) &&
    Boolean(controlTower?.date) &&
    String(controlTower.date) < String(payGateStatus.date);

  const payProductionGateDone =
    controlTowerPayGateDone || payGateStatusOverallPass || payGateDecisionLockFlipped || paySignalFullyMet;

  const controlTowerReleaseClaimUnlocked =
    controlTower.data.releaseClaimEligible === true &&
    controlTower.data.releaseClaimState !== "LOCK_RETAINED";
  const releaseClaimUnlocked =
    controlTowerReleaseClaimUnlocked ||
    (payProductionGateDone &&
      (payGateDecisionLockFlipped || payGateStatusOverallPass) &&
      team1FullRerunReview?.data?.status === "READY_FOR_TEAM1_FLIP_REVIEW");

  const paySignalProgress = paySignals.total > 0 ? paySignals.passed / paySignals.total : 0;
  const docsPackIntegrated = docsIntegration ? docsIntegration.data.overallPass === true : null;
  const reminderInsights = extractReminderInsights(reminder?.raw ?? "");
  const domainVerdictState = extractDomainVerdicts(domainVerdicts?.raw ?? "");
  const ciosIssueState = ciosClosure?.data
    ? {
        vitestEnvOpen: ciosClosure.data.checks?.upstreamVitestPass !== true,
        freshScreenshotOpen: ciosClosure.data.checks?.screenshotPackPresent !== true,
        strictSmokeOpen: ciosClosure.data.checks?.strictSmokePass !== true,
        openCount: Array.isArray(ciosClosure.data.unmetChecks)
          ? ciosClosure.data.unmetChecks.length
          : ciosClosure.data.reviewClosureReady === true
            ? 0
            : 1
      }
    : extractCiosIssueState(ciosPacket?.raw ?? "");
  const cdnEvidenceState = extractCdnEvidenceState(cdnPacket?.raw ?? "", cdnDelta?.raw ?? "");
  const bilingualLiveReady = languageAudit?.data?.finalConfirmation?.liveReady === true;
  const bilingualPendingSurfaces = Array.from(
    new Set((languageAudit?.data?.pendingPages ?? []).map((entry) => entry?.appId).filter(Boolean))
  );
  const mailLaneState = extractMailLaneState(mailLaneStatus?.raw ?? "");
  const teamChannelReminderState = extractTeamChannelReminderState(
    channelReminderStatus?.raw ?? "",
    channelReminderSchedule
  );
  const ciosClosureReady = ciosClosure?.data?.reviewClosureReady === true;
  const teamDState = {
    available: Boolean(teamDEvidenceStatus),
    status: String(teamDEvidenceStatus?.data?.status ?? "UNKNOWN"),
    activationEvidenceComplete:
      teamDEvidenceStatus?.data?.activationEvidenceComplete === true,
    liveClaimBlocked: teamDEvidenceStatus?.data?.liveClaimBlocked !== false
  };
  const teamBCdnFlowsState = {
    available: Boolean(teamBCdnFlowsEvidenceStatus),
    status: String(teamBCdnFlowsEvidenceStatus?.data?.status ?? "UNKNOWN"),
    overallPass: teamBCdnFlowsEvidenceStatus?.data?.overallPass === true,
    productionEvidenceComplete:
      teamBCdnFlowsEvidenceStatus?.data?.productionEvidenceComplete === true,
    cdnEvidenceComplete: teamBCdnFlowsEvidenceStatus?.data?.cdnEvidenceComplete === true,
    flowsEvidenceComplete: teamBCdnFlowsEvidenceStatus?.data?.flowsEvidenceComplete === true,
    cdnMissingRefs: Array.isArray(teamBCdnFlowsEvidenceStatus?.data?.cdnMissingRefs)
      ? teamBCdnFlowsEvidenceStatus.data.cdnMissingRefs
      : [],
    flowsMissingRefs: Array.isArray(teamBCdnFlowsEvidenceStatus?.data?.flowsMissingRefs)
      ? teamBCdnFlowsEvidenceStatus.data.flowsMissingRefs
      : []
  };

  const weightedProgress = [
    { key: "governanceReady", weight: 35, progress: governanceReady ? 1 : 0 },
    { key: "noGoOwnersDone", weight: 35, progress: noGoOwnersDone ? 1 : 0 },
    { key: "payProductionGateSignals", weight: 20, progress: paySignalProgress },
    { key: "releaseClaimUnlocked", weight: 5, progress: releaseClaimUnlocked ? 1 : 0 },
    { key: "liveSyncReady", weight: 5, progress: liveSyncReady ? 1 : 0 }
  ];

  const completionPercent = Math.round(
    weightedProgress.reduce((sum, entry) => sum + entry.weight * entry.progress, 0)
  );
  const remainingPercent = Math.max(0, 100 - completionPercent);

  const remainingActions = [];

  if (!payProductionGateDone) {
    remainingActions.push(
      "Team 1 must secure final provider/live owner confirmation for pay.iai.one and update the owner note checkpoint."
    );
    remainingActions.push(
      "Team 2 must rerun production probe + pay gate after owner confirmation and close unmet signals."
    );
    if (team2RerunBundle?.data?.status === "BLOCKED_PRECHECK") {
      const preflightChecks = Array.isArray(team2RerunBundle.data.preflight?.checks)
        ? team2RerunBundle.data.preflight.checks
        : [];
      const missingPreflight = preflightChecks
        .filter((entry) => entry?.pass !== true)
        .map((entry) => entry?.name)
        .filter(Boolean);
      remainingActions.push(
        `Team 2 must clear rerun precheck before full rerun bundle (missing: ${missingPreflight.length > 0 ? missingPreflight.join(", ") : "unknown"}).`
      );
    }
    if (
      team1FullRerunReview?.data?.status &&
      team1FullRerunReview.data.status !== "READY_FOR_TEAM1_FLIP_REVIEW"
    ) {
      remainingActions.push(
        `Team 1 must keep lock until full rerun review checker reaches READY_FOR_TEAM1_FLIP_REVIEW (current: ${team1FullRerunReview.data.status}).`
      );
    }
    if (paySignals.unmetSignals.includes("team2_runtime_probe_present")) {
      remainingActions.push(
        "Team 2 must publish the current-checkpoint runtime probe snapshot before Team 1 re-evaluates lock."
      );
    }
  }

  if (payProductionGateDone && !releaseClaimUnlocked) {
    remainingActions.push(
      "Team 1 must publish lock verdict: LOCK_FLIPPED or LOCK_RETAINED_WITH_REASON."
    );
  }

  if (releaseClaimUnlocked && !liveSyncReady) {
    remainingActions.push("Team 5 must rerun live-sync readiness and final packet immediately.");
  }

  if (teamBCdnFlowsState.available) {
    if (!teamBCdnFlowsState.productionEvidenceComplete) {
      remainingActions.push(
        `Team B CDN/Flows must submit domain-specific production evidence (CDN missing: ${
          teamBCdnFlowsState.cdnMissingRefs.length > 0
            ? teamBCdnFlowsState.cdnMissingRefs.join(", ")
            : "none"
        }; Flows missing: ${
          teamBCdnFlowsState.flowsMissingRefs.length > 0
            ? teamBCdnFlowsState.flowsMissingRefs.join(", ")
            : "none"
        }).`
      );
    }
  } else {
    if (
      !cdnEvidenceState.deployRuleCacheProofClosed &&
      (domainVerdictState.cdnPendingOwnerEvidence || reminderInsights.teamBCdnMissingEvidence)
    ) {
      if (cdnEvidenceState.deltaSubmitted) {
        remainingActions.push(
          "Team B CDN delta evidence is submitted; Team 1 should keep OPEN until deploy/rule/cache proof is runtime-readable (DNS reachability, asset/header proof, purge/rollback note)."
        );
      } else {
        remainingActions.push(
          "Team B CDN owner must attach domain-specific deploy/rule/cache evidence for cdn.iai.one."
        );
      }
    }

    if (domainVerdictState.flowsPendingRouteRuntimeProof) {
      remainingActions.push(
        "Team B Flows owner must submit production route/runtime proof and refresh the packet with new evidence."
      );
    } else if (
      !domainVerdictState.flowsTs5083Cleared &&
      reminderInsights.teamBFlowsBlockedByTs5083
    ) {
      remainingActions.push(
        "Team B Flows owner must resolve TS5083 and rerun flow-surface with route/runtime proof."
      );
    }
  }

  if (domainVerdictState.ciosEvidenceReviewPending || reminderInsights.teamCOpenRuntimeIssues) {
    const ciosOpenItems = [];
    if (ciosIssueState.vitestEnvOpen) {
      ciosOpenItems.push("Vitest/local install repair and upstream npm test rerun");
    }
    if (ciosIssueState.freshScreenshotOpen) {
      ciosOpenItems.push("fresh browser screenshot proof");
    }
    if (ciosIssueState.strictSmokeOpen) {
      ciosOpenItems.push("strict deployed smoke rerun with current URL + secrets");
    }

    if (ciosClosureReady && ciosOpenItems.length === 0) {
      remainingActions.push(
        "Team 1 must accept or reject the Team C CIOS closure packet; checker is PASS, Team C stays monitor-only until the verdict is recorded."
      );
    } else {
      remainingActions.push(
        ciosOpenItems.length > 0
          ? `Team C must close CIOS packet issues: ${ciosOpenItems.join(", ")}.`
          : "Team C must close the remaining CIOS evidence-review items."
      );
    }
  }

  if (!mailLaneState.wave1CloseoutReady) {
    remainingActions.push(
      "Team Email SMTP must close 5 evidence clusters before live-close: mailbox/alias truth, inbound routing truth, Gmail proof, Outlook proof, internal inbox proof."
    );
  }

  if (
    teamChannelReminderState.available &&
    (!teamChannelReminderState.overallPass ||
      !teamChannelReminderState.cadenceIs15 ||
      teamChannelReminderState.activeRows < 10)
  ) {
    remainingActions.push(
      "Team 1 ops must keep channel reminder protocol locked at 15-minute cadence with all required active team channels until COMPLETE_VERIFIED."
    );
  }

  if (teamDState.available && (!teamDState.activationEvidenceComplete || teamDState.liveClaimBlocked)) {
    remainingActions.push(
      "Team D must close tranhatam.com external activation evidence (mailbox/alias, runtime bindings, provider_ref, message_id, D1 row, inbox proof) before any READY_FOR_LIVE claim."
    );
  }

  if (!bilingualLiveReady) {
    remainingActions.push(
      `Team C language lane must remove remaining hard-coded bilingual copy and metadata drift (pending surfaces: ${bilingualPendingSurfaces.length > 0 ? bilingualPendingSurfaces.join(", ") : "unknown"}).`
    );
  }

  if (!ciosClosureReady && ciosClosure?.data?.nextActions?.length) {
    for (const action of ciosClosure.data.nextActions) {
      remainingActions.push(`Team C cios closure: ${action}`);
    }
  }

  if (remainingActions.length === 0) {
    remainingActions.push("No remaining blocking action detected from current snapshots.");
  }

  const gateState = liveSyncReady
    ? "READY_FOR_SYNCHRONIZED_LIVE"
    : payProductionGateDone
      ? releaseClaimUnlocked
        ? "READY_FOR_TEAM5_RERUN"
        : "READY_FOR_TEAM1_LOCK_VERDICT"
      : "BLOCKED_ON_PAY_PRODUCTION_GATE";

  const gitScopeStatus = getGitScopeStatus(root);
  const batchReadyToStage = true;
  const batchReadyToCommit = gitScopeStatus.commitScopeLocked;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    requestedDate,
    gateState,
    completion: {
      percent: completionPercent,
      remainingPercent,
      band: completionBand(completionPercent),
      model: weightedProgress
    },
    readiness: {
      batchReadyToStage,
      batchReadyToCommit,
      commitScopeLocked: gitScopeStatus.commitScopeLocked
    },
    checks: {
      governanceReady,
      noGoOwnersDone,
      payProductionGateDone,
      payGateDerivedFromFreshArtifacts:
        !controlTowerPayGateDone &&
        (payGateStatusOverallPass || payGateDecisionLockFlipped || paySignalFullyMet),
      controlTowerStaleComparedToPayGate,
      releaseClaimUnlocked,
      liveSyncReady,
      paySignals: {
        source: paySignals.source,
        passed: paySignals.passed,
        total: paySignals.total,
        unmetSignals: paySignals.unmetSignals,
        runtimeProbeSourcePresent: paySignals.runtimeProbeSourcePresent,
        sharedRuntimeProbeSourcePresent: paySignals.sharedRuntimeProbeSourcePresent
      },
      team2RerunBundle: team2RerunBundle
        ? {
            status: team2RerunBundle.data.status ?? null,
            preflightReady: team2RerunBundle.data.preflight?.ready === true
          }
        : null,
      team1FullRerunReviewStatus: team1FullRerunReview?.data?.status ?? null,
      teamEmailSmtp: mailLaneState,
      teamChannelReminder: teamChannelReminderState,
      teamDState,
      teamBCdnFlowsState,
      bilingualLiveReady,
      bilingualPendingSurfaces,
      ciosReviewClosureReady: ciosClosureReady,
      docsPackIntegrated,
      cdnEvidenceState,
      domainVerdicts: domainVerdictState,
      ciosIssueState
    },
    reminderInsights,
    sources: {
      controlTower: {
        date: controlTower.date,
        path: controlTower.relativePath
      },
      payGateStatus: payGateStatus
        ? {
            date: payGateStatus.date,
            path: payGateStatus.relativePath
          }
        : null,
      team1FullRerunReview: team1FullRerunReview
        ? {
            date: team1FullRerunReview.date,
            path: team1FullRerunReview.relativePath
          }
        : null,
      team2Probe: team2Probe
        ? {
            date: team2Probe.date,
            path: team2Probe.relativePath
          }
        : null,
      team2SharedProbe: team2SharedProbe
        ? {
            date: team2SharedProbe.date,
            path: team2SharedProbe.relativePath
          }
        : null,
      team2RerunBundle: team2RerunBundle
        ? {
            date: team2RerunBundle.date,
            path: team2RerunBundle.relativePath
          }
        : null,
      team5Readiness: {
        date: team5Readiness.date,
        path: team5Readiness.relativePath
      },
      teamDEvidenceStatus: teamDEvidenceStatus
        ? {
            date: teamDEvidenceStatus.date,
            path: teamDEvidenceStatus.relativePath
          }
        : null,
      teamBCdnFlowsEvidenceStatus: teamBCdnFlowsEvidenceStatus
        ? {
            date: teamBCdnFlowsEvidenceStatus.date,
            path: teamBCdnFlowsEvidenceStatus.relativePath
          }
        : null,
      channelReminderSchedule: channelReminderSchedule
        ? {
            date: channelReminderSchedule.date,
            path: channelReminderSchedule.relativePath
          }
        : null,
      channelReminderStatus: channelReminderStatus
        ? {
            date: channelReminderStatus.date,
            path: channelReminderStatus.relativePath
          }
        : null,
      docsIntegration: docsIntegration
        ? {
            date: docsIntegration.date,
            path: docsIntegration.relativePath
          }
        : null,
      languageAudit: languageAudit
        ? {
            date: languageAudit.date,
            path: languageAudit.relativePath
          }
        : null,
      ciosClosure: ciosClosure
        ? {
            date: ciosClosure.date,
            path: ciosClosure.relativePath
          }
        : null,
      mailLaneStatus: mailLaneStatus
        ? {
            date: mailLaneStatus.date,
            path: mailLaneStatus.relativePath
          }
        : null,
      reminder: reminder
        ? {
            date: reminder.date,
            path: reminder.relativePath
          }
        : null,
      domainVerdicts: domainVerdicts
        ? {
            date: domainVerdicts.date,
            path: domainVerdicts.relativePath
          }
        : null,
      ciosPacket: ciosPacket
        ? {
            date: ciosPacket.date,
            path: ciosPacket.relativePath
          }
        : null,
      cdnPacket: cdnPacket
        ? {
            date: cdnPacket.date,
            path: cdnPacket.relativePath
          }
        : null,
      cdnDelta: cdnDelta
        ? {
            date: cdnDelta.date,
            path: cdnDelta.relativePath
          }
        : null
    },
    gitScopeStatus,
    remainingActions
  };

  const reportDir = path.join(root, "docs", "reports", "team1");
  await mkdir(reportDir, { recursive: true });

  const jsonPath = path.join(
    reportDir,
    `TEAM_ADMIN_ALL_TEAMS_COMPLETION_STATUS_${requestedDate}.json`
  );
  const mdPath = path.join(reportDir, `TEAM_ADMIN_ALL_TEAMS_COMPLETION_STATUS_${requestedDate}.md`);

  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAM_ADMIN_ALL_TEAMS_COMPLETION_STATUS_${requestedDate}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Gate state: ${gateState}`,
    `- Completion: ${completionPercent}%`,
    `- Remaining: ${remainingPercent}%`,
    `- Completion band: ${snapshot.completion.band}`,
    `- Batch ready to stage: ${boolStatus(batchReadyToStage)}`,
    `- Batch ready to commit: ${boolStatus(batchReadyToCommit)}`,
    "",
    "## Gate checks",
    `- Governance ready: ${boolStatus(governanceReady)}`,
    `- NO-GO owners done: ${boolStatus(noGoOwnersDone)}`,
    `- Pay production gate done: ${boolStatus(payProductionGateDone)}`,
    `- Release claim unlocked: ${boolStatus(releaseClaimUnlocked)}`,
    `- Team 5 live-sync ready: ${boolStatus(liveSyncReady)}`,
    `- Pay signal progress: ${paySignals.passed}/${paySignals.total} (${paySignals.source})`,
    `- Pay unmet signals: ${paySignals.unmetSignals.length > 0 ? paySignals.unmetSignals.join(", ") : "none"}`,
    `- Pay runtime probe source present: ${boolStatus(paySignals.runtimeProbeSourcePresent)}`,
    `- Pay shared runtime probe source present: ${boolStatus(paySignals.sharedRuntimeProbeSourcePresent)}`,
    `- Team 2 rerun precheck status: ${
      team2RerunBundle?.data?.status ? `\`${team2RerunBundle.data.status}\`` : "UNKNOWN"
    }`,
    `- Team 1 full rerun review status: ${
      team1FullRerunReview?.data?.status
        ? `\`${team1FullRerunReview.data.status}\``
        : "UNKNOWN"
    }`,
    `- Team Email SMTP lane status: \`${mailLaneState.statusLabel}\``,
    `- Team Email SMTP wave1 closeout ready: ${boolStatus(mailLaneState.wave1CloseoutReady)}`,
    `- Team Email SMTP mailbox/alias truth done: ${boolStatus(mailLaneState.mailboxAliasTruthDone)}`,
    `- Team Email SMTP inbound routing truth done: ${boolStatus(mailLaneState.inboundRoutingTruthDone)}`,
    `- Team Email SMTP Gmail proof done: ${boolStatus(mailLaneState.gmailProofDone)}`,
    `- Team Email SMTP Outlook proof done: ${boolStatus(mailLaneState.outlookProofDone)}`,
    `- Team Email SMTP internal inbox proof done: ${boolStatus(mailLaneState.internalInboxProofDone)}`,
    `- Team channel reminder schedule available: ${boolStatus(teamChannelReminderState.available)}`,
    `- Team channel reminder cadence is 15 minutes: ${boolStatus(teamChannelReminderState.cadenceIs15)}`,
    `- Team channel reminder active rows: ${teamChannelReminderState.activeRows}`,
    `- Team channel reminder overall pass: ${boolStatus(teamChannelReminderState.overallPass)}`,
    `- Team D evidence status available: ${boolStatus(teamDState.available)}`,
    `- Team D state: \`${teamDState.status}\``,
    `- Team D activation evidence complete: ${boolStatus(teamDState.activationEvidenceComplete)}`,
    `- Team D live claim blocked: ${boolStatus(teamDState.liveClaimBlocked)}`,
    `- Team B CDN/Flows evidence status available: ${boolStatus(teamBCdnFlowsState.available)}`,
    `- Team B CDN/Flows state: \`${teamBCdnFlowsState.status}\``,
    `- Team B CDN evidence complete: ${boolStatus(teamBCdnFlowsState.cdnEvidenceComplete)}`,
    `- Team B Flows evidence complete: ${boolStatus(teamBCdnFlowsState.flowsEvidenceComplete)}`,
    `- Team B CDN/Flows production evidence complete: ${boolStatus(teamBCdnFlowsState.productionEvidenceComplete)}`,
    `- Team B CDN/Flows checker overall pass: ${boolStatus(teamBCdnFlowsState.overallPass)}`,
    `- Universal bilingual live ready: ${boolStatus(bilingualLiveReady)}`,
    `- Universal bilingual pending surfaces: ${bilingualPendingSurfaces.length > 0 ? bilingualPendingSurfaces.join(", ") : "none"}`,
    `- Team C review closure ready: ${boolStatus(ciosClosureReady)}`,
    `- Pay docs integration pass: ${docsPackIntegrated === null ? "UNKNOWN" : boolStatus(docsPackIntegrated)}`,
    `- Domain verdict (developer reopen): ${boolStatus(domainVerdictState.developerReopenApproved)}`,
    `- Domain verdict (cdn pending owner evidence): ${boolStatus(domainVerdictState.cdnPendingOwnerEvidence)}`,
    `- CDN delta evidence submitted: ${boolStatus(cdnEvidenceState.deltaSubmitted)}`,
    `- CDN DNS reachable in delta check: ${boolStatus(!cdnEvidenceState.deltaDnsUnresolved)}`,
    `- CDN deploy/rule/cache proof closed: ${boolStatus(cdnEvidenceState.deployRuleCacheProofClosed)}`,
    `- Domain verdict (flows pending route/runtime): ${boolStatus(domainVerdictState.flowsPendingRouteRuntimeProof)}`,
    `- Domain verdict (flows TS5083 cleared): ${boolStatus(domainVerdictState.flowsTs5083Cleared)}`,
    `- Domain verdict (cios evidence pending): ${boolStatus(domainVerdictState.ciosEvidenceReviewPending)}`,
    `- Team C open issues: ${ciosIssueState.openCount}`,
    "",
    "## Remaining actions",
    ...snapshot.remainingActions.map((action, index) => `${index + 1}. ${action}`),
    "",
    "## Sources",
    `- Control tower (${snapshot.sources.controlTower.date}): ${snapshot.sources.controlTower.path}`,
    `- Team 2 probe: ${
      snapshot.sources.team2Probe
        ? `${snapshot.sources.team2Probe.date} / ${snapshot.sources.team2Probe.path}`
        : "not found"
    }`,
    `- Team 2 shared probe: ${
      snapshot.sources.team2SharedProbe
        ? `${snapshot.sources.team2SharedProbe.date} / ${snapshot.sources.team2SharedProbe.path}`
        : "not found"
    }`,
    `- Team 2 rerun bundle: ${
      snapshot.sources.team2RerunBundle
        ? `${snapshot.sources.team2RerunBundle.date} / ${snapshot.sources.team2RerunBundle.path}`
        : "not found"
    }`,
    `- Team 1 full rerun review: ${
      snapshot.sources.team1FullRerunReview
        ? `${snapshot.sources.team1FullRerunReview.date} / ${snapshot.sources.team1FullRerunReview.path}`
        : "not found"
    }`,
    `- Team 1 pay gate status: ${
      snapshot.sources.payGateStatus
        ? `${snapshot.sources.payGateStatus.date} / ${snapshot.sources.payGateStatus.path}`
        : "not found"
    }`,
    `- Team 5 readiness (${snapshot.sources.team5Readiness.date}): ${snapshot.sources.team5Readiness.path}`,
    `- Team D evidence status: ${
      snapshot.sources.teamDEvidenceStatus
        ? `${snapshot.sources.teamDEvidenceStatus.date} / ${snapshot.sources.teamDEvidenceStatus.path}`
        : "not found"
    }`,
    `- Team B CDN/Flows evidence status: ${
      snapshot.sources.teamBCdnFlowsEvidenceStatus
        ? `${snapshot.sources.teamBCdnFlowsEvidenceStatus.date} / ${snapshot.sources.teamBCdnFlowsEvidenceStatus.path}`
        : "not found"
    }`,
    `- Team channel reminder schedule: ${
      snapshot.sources.channelReminderSchedule
        ? `${snapshot.sources.channelReminderSchedule.date} / ${snapshot.sources.channelReminderSchedule.path}`
        : "not found"
    }`,
    `- Team channel reminder status: ${
      snapshot.sources.channelReminderStatus
        ? `${snapshot.sources.channelReminderStatus.date} / ${snapshot.sources.channelReminderStatus.path}`
        : "not found"
    }`,
    `- Docs integration: ${
      snapshot.sources.docsIntegration
        ? `${snapshot.sources.docsIntegration.date} / ${snapshot.sources.docsIntegration.path}`
        : "not found"
    }`,
    `- Bilingual audit: ${
      snapshot.sources.languageAudit
        ? `${snapshot.sources.languageAudit.date} / ${snapshot.sources.languageAudit.path}`
        : "not found"
    }`,
    `- Team C closure snapshot: ${
      snapshot.sources.ciosClosure
        ? `${snapshot.sources.ciosClosure.date} / ${snapshot.sources.ciosClosure.path}`
        : "not found"
    }`,
    `- Team Email SMTP lane status: ${
      snapshot.sources.mailLaneStatus
        ? `${snapshot.sources.mailLaneStatus.date} / ${snapshot.sources.mailLaneStatus.path}`
        : "not found"
    }`,
    `- Team admin reminder: ${
      snapshot.sources.reminder
        ? `${snapshot.sources.reminder.date} / ${snapshot.sources.reminder.path}`
        : "not found"
    }`,
    `- Team 1 domain verdicts: ${
      snapshot.sources.domainVerdicts
        ? `${snapshot.sources.domainVerdicts.date} / ${snapshot.sources.domainVerdicts.path}`
        : "not found"
    }`,
    `- Team C packet: ${
      snapshot.sources.ciosPacket
        ? `${snapshot.sources.ciosPacket.date} / ${snapshot.sources.ciosPacket.path}`
        : "not found"
    }`,
    `- CDN packet: ${
      snapshot.sources.cdnPacket
        ? `${snapshot.sources.cdnPacket.date} / ${snapshot.sources.cdnPacket.path}`
        : "not found"
    }`,
    `- CDN delta evidence: ${
      snapshot.sources.cdnDelta
        ? `${snapshot.sources.cdnDelta.date} / ${snapshot.sources.cdnDelta.path}`
        : "not found"
    }`,
    "",
    "## Git scope",
    `- Dirty files: ${gitScopeStatus.dirtyFiles}`,
    `- Out-of-scope files: ${gitScopeStatus.outOfScopeFiles}`,
    `- Commit scope locked: ${boolStatus(gitScopeStatus.commitScopeLocked)}`,
    `- Out-of-scope sample: ${
      gitScopeStatus.outOfScopeExamples.length > 0
        ? gitScopeStatus.outOfScopeExamples.join(", ")
        : "none"
    }`,
    "",
    "## Runbook",
    "- `pnpm report:team-admin-completion -- --date=YYYY-MM-DD`",
    ""
  ].join("\n");

  await writeFile(mdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Team admin completion snapshot generated for ${requestedDate}.`,
      `Gate state: ${gateState}.`,
      `Completion: ${completionPercent}% (remaining ${remainingPercent}%).`,
      `Batch ready to stage: ${boolStatus(batchReadyToStage)}.`,
      `Batch ready to commit: ${boolStatus(batchReadyToCommit)}.`,
      `JSON: ${path.relative(root, jsonPath)}`,
      `MD: ${path.relative(root, mdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team admin completion status check failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
