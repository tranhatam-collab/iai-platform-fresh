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

function getArg(name) {
  const explicit = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  return explicit ? explicit.slice(name.length + 3) : null;
}

function shouldWriteOutputs() {
  return !process.argv.includes("--no-write");
}

function normalize(value) {
  return String(value ?? "").trim();
}

function boolLabel(value) {
  return value ? "PASS" : "FAIL";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

async function resolveLatestJson(root, relativeDir, prefix, requestedDate) {
  const absoluteDir = path.join(root, relativeDir);
  const entries = await readdir(absoluteDir).catch(() => []);
  const dates = entries
    .flatMap((entry) => {
      const match = new RegExp(`^${prefix}_(\\d{4}-\\d{2}-\\d{2})\\.json$`).exec(entry);
      return match ? [match[1]] : [];
    })
    .sort((left, right) => right.localeCompare(left));

  const selectedDate = dates.find((date) => date <= requestedDate) ?? dates[0] ?? null;
  if (!selectedDate) return null;

  const absolutePath = path.join(absoluteDir, `${prefix}_${selectedDate}.json`);
  const raw = await readFile(absolutePath, "utf8").catch(() => null);
  if (!raw) return null;

  return {
    date: selectedDate,
    relativePath: path.relative(root, absolutePath),
    data: JSON.parse(raw)
  };
}

function extractMailMissing(mailStatus) {
  const flowResults = asArray(mailStatus?.flowResults);
  const incompleteFlows = flowResults.filter((row) => row.complete !== true);

  return incompleteFlows.map((row) => ({
    flowName: normalize(row.flowName),
    missingFields: asArray(row.missingFields).map((field) => normalize(field)),
    missingInboxTargets: asArray(row.missingInboxTargets).map((target) => normalize(target)),
    inboxProofRefCount: Number(row.inboxProofRefCount ?? 0)
  }));
}

function extractTeamDMissing(teamDStatus) {
  return {
    missingMailboxEvidence: asArray(teamDStatus?.missingMailboxEvidence).map((entry) => ({
      address: normalize(entry?.address),
      missing: entry?.missing ?? {}
    })),
    missingRuntimeEvidence: asArray(teamDStatus?.missingRuntimeEvidence).map((entry) => ({
      bindingName: normalize(entry?.bindingName),
      missing: entry?.missing ?? {}
    })),
    missingPaymentProofFields: asArray(teamDStatus?.missingPaymentProofFields).map((field) =>
      normalize(field)
    )
  };
}

function buildChecklist({ mail, teamD, cios }) {
  const checklist = [];

  if (mail?.wave1CloseoutReady !== true) {
    checklist.push({
      lane: "Team Email SMTP",
      priority: "P0",
      action:
        "Close all 5 Wave1 flows with action_ref + message_id + messages_ref + message_events_ref + delivery_attempts_ref + db_or_log_ref + inbox proof for tranhatam@gmail.com and tranhatam66@gmail.com."
    });
    checklist.push({
      lane: "Team Email SMTP",
      priority: "P0",
      action:
        "Set 5 clusters to COMPLETE_VERIFIED with proof_refs: mailbox_alias_truth, inbound_routing_truth, gmail_proof, outlook_proof, internal_inbox_proof."
    });
  }

  if (teamD?.activationEvidenceComplete !== true || teamD?.liveClaimBlocked !== false) {
    if (asArray(teamD?.missingMailboxEvidence).length > 0) {
      checklist.push({
        lane: "Team D",
        priority: "P0",
        action:
          "Attach missing inbox_proof_ref for pay@tranhatam.com, billing@tranhatam.com, noreply@tranhatam.com."
      });
    }

    if (asArray(teamD?.missingRuntimeEvidence).length > 0) {
      checklist.push({
        lane: "Team D",
        priority: "P0",
        action:
          "Switch runtime bindings MAIL_API_BASE_URL, MAIL_API_KEY, MAIL_API_WORKSPACE_ID, PAY_EMAIL_ADAPTER_INTERNAL_KEY from LOCAL_PROOF_ONLY to CONFIRMED."
      });
    }

    if (teamD?.payGateLocked === true) {
      checklist.push({
        lane: "Team D",
        priority: "P0",
        action:
          "Unlock pay gate dependency and rerun teamd evidence checker to clear liveClaimBlocked."
      });
    }
  }

  if (cios?.authorityDecisionRecorded !== true) {
    checklist.push({
      lane: "Team 1",
      priority: "P1",
      action:
        "Record formal authority decision for CIOS closure (APPROVED/REJECTED) with evidence ref."
    });
  }

  return checklist;
}

async function main() {
  const root = process.cwd();
  const date = getArg("date") ?? todayInTimezone(timezone);
  const writeOutputs = shouldWriteOutputs();

  const [completion, mailStatus, teamDStatus, ciosDecision] = await Promise.all([
    resolveLatestJson(root, "docs/reports/team1", "TEAM_ADMIN_ALL_TEAMS_COMPLETION_STATUS", date),
    resolveLatestJson(root, "docs/reports/team1", "TEAM_EMAIL_SMTP_WAVE1_EVIDENCE_STATUS", date),
    resolveLatestJson(
      root,
      "docs/reports/teamd",
      "TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS",
      date
    ),
    resolveLatestJson(root, "docs/reports/team1", "TEAM1_CIOS_AUTHORITY_DECISION", date)
  ]);

  if (!completion) {
    throw new Error("Missing TEAM_ADMIN_ALL_TEAMS_COMPLETION_STATUS_*.json snapshot.");
  }

  const mailMissing = extractMailMissing(mailStatus?.data);
  const teamDMissing = extractTeamDMissing(teamDStatus?.data);
  const checklist = buildChecklist({
    mail: mailStatus?.data,
    teamD: teamDStatus?.data,
    cios: ciosDecision?.data
  });

  const packet = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    gateState: normalize(completion.data.gateState),
    completionPercent: Number(completion.data.completion?.percent ?? 0),
    remainingPercent: Number(completion.data.completion?.remainingPercent ?? 0),
    gapLabels: completion.data.checks?.gapLabels ?? {},
    status: checklist.length === 0 ? "READY_FOR_100_PERCENT_CLOSEOUT" : "EVIDENCE_CLOSEOUT_PENDING",
    sources: {
      completion: completion.relativePath,
      mailStatus: mailStatus?.relativePath ?? null,
      teamDStatus: teamDStatus?.relativePath ?? null,
      ciosAuthorityDecision: ciosDecision?.relativePath ?? null
    },
    mailLane: {
      wave1CloseoutReady: mailStatus?.data?.wave1CloseoutReady === true,
      statusLabel: normalize(mailStatus?.data?.statusLabel ?? "MISSING"),
      gapClassification: normalize(mailStatus?.data?.gapClassification ?? "MISSING"),
      gapReason: normalize(mailStatus?.data?.gapReason ?? "Missing status snapshot."),
      incompleteFlows: mailMissing
    },
    teamD: {
      status: normalize(teamDStatus?.data?.status ?? "MISSING"),
      activationEvidenceComplete: teamDStatus?.data?.activationEvidenceComplete === true,
      liveClaimBlocked: teamDStatus?.data?.liveClaimBlocked !== false,
      gapClassification: normalize(teamDStatus?.data?.gapClassification ?? "MISSING"),
      gapReason: normalize(teamDStatus?.data?.gapReason ?? "Missing status snapshot."),
      ...teamDMissing
    },
    team1CiosDecision: {
      present: Boolean(ciosDecision),
      status: normalize(ciosDecision?.data?.status ?? "MISSING"),
      decision: normalize(ciosDecision?.data?.decision ?? "MISSING"),
      authorityDecisionRecorded: ciosDecision?.data?.authorityDecisionRecorded === true,
      blockers: asArray(ciosDecision?.data?.blockers).map((blocker) => normalize(blocker))
    },
    checklist
  };

  const reportDir = path.join(root, "docs", "reports", "team1");
  const jsonPath = path.join(reportDir, `TEAM1_EVIDENCE_CLOSEOUT_PACKET_${date}.json`);
  const mdPath = path.join(reportDir, `TEAM1_EVIDENCE_CLOSEOUT_PACKET_${date}.md`);

  const markdown = [
    `# TEAM1_EVIDENCE_CLOSEOUT_PACKET_${date}`,
    `- Generated at: ${packet.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Gate state: \`${packet.gateState}\``,
    `- Completion: \`${packet.completionPercent}%\``,
    `- Remaining: \`${packet.remainingPercent}%\``,
    `- Packet status: \`${packet.status}\``,
    "",
    "## Source Snapshots",
    `- completion: \`${packet.sources.completion}\``,
    `- mail wave1 status: ${packet.sources.mailStatus ? `\`${packet.sources.mailStatus}\`` : "`MISSING`"}`,
    `- teamd status: ${packet.sources.teamDStatus ? `\`${packet.sources.teamDStatus}\`` : "`MISSING`"}`,
    `- team1 cios authority decision: ${packet.sources.ciosAuthorityDecision ? `\`${packet.sources.ciosAuthorityDecision}\`` : "`MISSING`"}`,
    "",
    "## Gap Labels",
    `- mailLaneWave1Closeout: \`${normalize(packet.gapLabels?.mailLaneWave1Closeout?.classification ?? "MISSING")}\` — ${normalize(packet.gapLabels?.mailLaneWave1Closeout?.reason ?? "MISSING")}`,
    `- teamDReadyForSync: \`${normalize(packet.gapLabels?.teamDReadyForSync?.classification ?? "MISSING")}\` — ${normalize(packet.gapLabels?.teamDReadyForSync?.reason ?? "MISSING")}`,
    "",
    "## Team Email SMTP",
    `- wave1 closeout ready: ${boolLabel(packet.mailLane.wave1CloseoutReady)}`,
    `- status: \`${packet.mailLane.statusLabel}\``,
    `- gap: \`${packet.mailLane.gapClassification}\` — ${packet.mailLane.gapReason}`,
    ...packet.mailLane.incompleteFlows.map(
      (flow) =>
        `- ${flow.flowName}: missing_fields=${flow.missingFields.join(", ") || "none"}; missing_inbox_targets=${flow.missingInboxTargets.join(", ") || "none"}; inbox_refs=${flow.inboxProofRefCount}`
    ),
    "",
    "## Team D (tranhatam.com)",
    `- activation evidence complete: ${boolLabel(packet.teamD.activationEvidenceComplete)}`,
    `- live claim blocked: ${boolLabel(packet.teamD.liveClaimBlocked)}`,
    `- status: \`${packet.teamD.status}\``,
    `- gap: \`${packet.teamD.gapClassification}\` — ${packet.teamD.gapReason}`,
    ...packet.teamD.missingMailboxEvidence.map((entry) => {
      const missingBits = [];
      if (entry.missing?.row) missingBits.push("row");
      if (entry.missing?.binding) missingBits.push("binding");
      if (entry.missing?.inboundRouting) missingBits.push("inboundRouting");
      if (entry.missing?.inboxProof) missingBits.push("inboxProof");
      return `- mailbox ${entry.address}: missing=${missingBits.join(", ") || "none"}`;
    }),
    ...packet.teamD.missingRuntimeEvidence.map((entry) => {
      const missingBits = [];
      if (entry.missing?.row) missingBits.push("row");
      if (entry.missing?.confirmedStatus) missingBits.push("confirmedStatus");
      if (entry.missing?.valueRef) missingBits.push("valueRef");
      return `- runtime ${entry.bindingName}: missing=${missingBits.join(", ") || "none"}`;
    }),
    `- payment proof missing fields: ${
      packet.teamD.missingPaymentProofFields.length > 0
        ? packet.teamD.missingPaymentProofFields.join(", ")
        : "none"
    }`,
    "",
    "## Team 1 CIOS Authority",
    `- decision snapshot present: ${boolLabel(packet.team1CiosDecision.present)}`,
    `- authority decision recorded: ${boolLabel(packet.team1CiosDecision.authorityDecisionRecorded)}`,
    `- status: \`${packet.team1CiosDecision.status}\``,
    `- decision: \`${packet.team1CiosDecision.decision}\``,
    `- blockers: ${packet.team1CiosDecision.blockers.length > 0 ? packet.team1CiosDecision.blockers.join(", ") : "none"}`,
    "",
    "## Immediate Checklist",
    ...(packet.checklist.length > 0
      ? packet.checklist.map(
          (item, index) => `${index + 1}. [${item.priority}] ${item.lane}: ${item.action}`
        )
      : ["1. No remaining evidence blockers. Ready to flip completion to 100%."]),
    "",
    "## Rerun Commands",
    "- `pnpm report:team-email-smtp-evidence -- --date=YYYY-MM-DD`",
    "- `node scripts/pay-team-d-tranhatam-evidence-check.mjs --date=YYYY-MM-DD`",
    "- `pnpm report:team1-cios-authority -- --date=YYYY-MM-DD --decision=APPROVED --evidence-ref=<ref>`",
    "- `node scripts/team1-all-teams-completion-status-check.mjs --date=YYYY-MM-DD`",
    ""
  ].join("\n");

  if (writeOutputs) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
    await writeFile(mdPath, `${markdown}\n`, "utf8");
  }

  process.stdout.write(
    [
      `Team1 evidence closeout packet generated for ${date}.`,
      `Status: ${packet.status}.`,
      `Remaining checklist items: ${packet.checklist.length}.`,
      `JSON: ${path.relative(root, jsonPath)}`,
      `MD: ${path.relative(root, mdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team1 evidence closeout packet failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
