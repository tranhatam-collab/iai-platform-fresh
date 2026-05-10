import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const timezone = "Asia/Ho_Chi_Minh";
const reportPrefix = "TEAM1_TRAMSAIGON_PAY_CLOSEOUT";

function todayInTimezone(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).format(new Date());
}

function getArgValue(name, fallback = null) {
  const explicit = process.argv.find((argument) => argument.startsWith(`${name}=`));
  return explicit ? explicit.slice(name.length + 1) : fallback;
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

function markdownStatus(value) {
  return value ? "PASS" : "FAIL";
}

async function runChecker(root, scriptFile, date) {
  try {
    const { stdout, stderr } = await execFileAsync("node", [scriptFile, `--date=${date}`], {
      cwd: root,
      maxBuffer: 8 * 1024 * 1024
    });
    return {
      checker: scriptFile,
      ok: true,
      code: 0,
      stdout: normalize(stdout),
      stderr: normalize(stderr)
    };
  } catch (error) {
    const stdout = normalize(error?.stdout);
    const stderr = normalize(error?.stderr);
    const code =
      typeof error?.code === "number"
        ? error.code
        : Number.isFinite(Number(error?.code))
          ? Number(error.code)
          : 1;
    return {
      checker: scriptFile,
      ok: false,
      code,
      stdout,
      stderr
    };
  }
}

async function readJsonIfPresent(filePath) {
  try {
    const body = await readFile(filePath, "utf8");
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function pushBlocker(blockers, key, details) {
  blockers.push({
    key,
    details
  });
}

async function main() {
  const date = getArgValue("--date", todayInTimezone(timezone));
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");
  const teamDPath = path.join(
    root,
    "docs",
    "reports",
    "teamd",
    `TRAMSAIGON_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_${date}.json`
  );
  const extPayPath = path.join(
    root,
    "docs",
    "reports",
    "team1",
    `EXT_PAY_04_TRAMSAIGON_STATUS_${date}.json`
  );
  const extMailPath = path.join(
    root,
    "docs",
    "reports",
    "team1",
    `TEAM_EMAIL_TRAMSAIGON_EXT_MAIL_01_STATUS_${date}.json`
  );

  const checkerRuns = [];
  checkerRuns.push(
    await runChecker(root, "scripts/pay-team-d-tramsaigon-evidence-check.mjs", date)
  );
  checkerRuns.push(await runChecker(root, "scripts/ext-pay-04-tramsaigon-status-check.mjs", date));
  checkerRuns.push(
    await runChecker(root, "scripts/team-email-tramsaigon-ext-mail-01-check.mjs", date)
  );

  const teamD = await readJsonIfPresent(teamDPath);
  const extPay = await readJsonIfPresent(extPayPath);
  const extMail = await readJsonIfPresent(extMailPath);

  const blockers = [];

  const teamDActivationComplete = teamD?.activationEvidenceComplete === true;
  const teamDLiveClaimBlocked = teamD?.liveClaimBlocked === true;
  if (!teamD) {
    pushBlocker(blockers, "TEAMD_REPORT_MISSING", path.relative(root, teamDPath));
  } else {
    if (!teamDActivationComplete) {
      pushBlocker(
        blockers,
        "TEAMD_ACTIVATION_EVIDENCE_INCOMPLETE",
        `activationEvidenceComplete=${normalize(teamD.activationEvidenceComplete)}`
      );
    }
    if (teamDLiveClaimBlocked) {
      pushBlocker(blockers, "TEAMD_LIVE_CLAIM_BLOCKED", "liveClaimBlocked=true");
    }
  }

  const extPayCompletion = extPay?.completion ?? {};
  const extPayReady = extPay?.status === "READY_FOR_PAYMENT_LIVE";
  if (!extPay) {
    pushBlocker(blockers, "EXT_PAY_04_REPORT_MISSING", path.relative(root, extPayPath));
  } else if (!extPayReady) {
    if (extPayCompletion.secretsBoundConfirmed !== true) {
      pushBlocker(blockers, "EXT_PAY_04_SECRETS_BOUND_MISSING", "secretsBoundConfirmed=false");
    }
    if (extPayCompletion.signatureVerifiedConfirmed !== true) {
      pushBlocker(
        blockers,
        "EXT_PAY_04_SIGNATURE_VERIFICATION_MISSING",
        "signatureVerifiedConfirmed=false"
      );
    }
    if (extPayCompletion.merchantLiveConfirmed !== true) {
      pushBlocker(
        blockers,
        "EXT_PAY_04_MERCHANT_CHANNEL_MISSING",
        "merchantLiveConfirmed=false"
      );
    }
    if (extPayCompletion.providerE2EComplete !== true) {
      pushBlocker(blockers, "EXT_PAY_04_PROVIDER_E2E_MISSING", "providerE2EComplete=false");
    }
    if (extPayCompletion.d1ReadbackComplete !== true) {
      pushBlocker(blockers, "EXT_PAY_04_D1_READBACK_MISSING", "d1ReadbackComplete=false");
    }
    if (extPayCompletion.mailReadbackComplete !== true) {
      pushBlocker(blockers, "EXT_PAY_04_MAIL_READBACK_MISSING", "mailReadbackComplete=false");
    }
  }

  const extMailReady = extMail?.extMailReady === true;
  if (!extMail) {
    pushBlocker(blockers, "EXT_MAIL_01_REPORT_MISSING", path.relative(root, extMailPath));
  } else if (!extMailReady) {
    pushBlocker(
      blockers,
      "EXT_MAIL_01_EVIDENCE_INCOMPLETE",
      `${normalize(extMail.gapClassification)}: ${normalize(extMail.gapReason)}`
    );
  }

  const checkerFailures = checkerRuns.filter((item) => item.ok !== true);
  for (const failed of checkerFailures) {
    pushBlocker(
      blockers,
      "CHECKER_FAILED",
      `${failed.checker} exited ${failed.code}${failed.stderr ? ` | ${failed.stderr}` : ""}`
    );
  }

  const readyForSynchronizedLive =
    teamDActivationComplete &&
    !teamDLiveClaimBlocked &&
    extPayReady &&
    extMailReady &&
    checkerFailures.length === 0;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    status: readyForSynchronizedLive
      ? "READY_FOR_SYNCHRONIZED_LIVE"
      : "BLOCKED_REAL_EVIDENCE_MISSING",
    readyForSynchronizedLive,
    sources: {
      teamD: path.relative(root, teamDPath),
      extPay: path.relative(root, extPayPath),
      extMail: path.relative(root, extMailPath)
    },
    checkerRuns: checkerRuns.map((run) => ({
      checker: run.checker,
      ok: run.ok,
      code: run.code
    })),
    summary: {
      teamDActivationEvidenceComplete: teamDActivationComplete,
      teamDLiveClaimBlocked: teamDLiveClaimBlocked,
      extPay04Ready: extPayReady,
      extMail01Ready: extMailReady
    },
    blockers
  };

  const markdown = [
    `# ${reportPrefix}_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Status: \`${snapshot.status}\``,
    `- Ready for synchronized live: ${boolLabel(snapshot.readyForSynchronizedLive)}`,
    "",
    "## Summary",
    `- Team D activation evidence complete: ${markdownStatus(
      snapshot.summary.teamDActivationEvidenceComplete
    )}`,
    `- Team D live claim blocked: ${markdownStatus(!snapshot.summary.teamDLiveClaimBlocked)}`,
    `- EXT-PAY-04 ready: ${markdownStatus(snapshot.summary.extPay04Ready)}`,
    `- EXT-MAIL-01 ready: ${markdownStatus(snapshot.summary.extMail01Ready)}`,
    "",
    "## Checker Runs",
    ...snapshot.checkerRuns.map(
      (run) =>
        `- ${markdownStatus(run.ok)} \`${run.checker}\` (exit_code=${run.code})`
    ),
    "",
    "## Sources",
    `- Team D status: \`${snapshot.sources.teamD}\``,
    `- EXT-PAY-04 status: \`${snapshot.sources.extPay}\``,
    `- EXT-MAIL-01 status: \`${snapshot.sources.extMail}\``,
    "",
    "## Blockers",
    ...(snapshot.blockers.length > 0
      ? snapshot.blockers.map((blocker) => `- \`${blocker.key}\` — ${blocker.details}`)
      : ["- none"]),
    ""
  ].join("\n");

  if (shouldWriteOutputs()) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(
      path.join(reportDir, `${reportPrefix}_${date}.json`),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      "utf8"
    );
    await writeFile(path.join(reportDir, `${reportPrefix}_${date}.md`), `${markdown}\n`, "utf8");
  }

  process.stdout.write(
    [
      `Tramsaigon pay closeout packet generated for ${date}.`,
      `Status: ${snapshot.status}.`,
      `Ready: ${snapshot.readyForSynchronizedLive ? "PASS" : "FAIL"}.`,
      `JSON: docs/reports/team1/${reportPrefix}_${date}.json`,
      `MD: docs/reports/team1/${reportPrefix}_${date}.md`
    ].join("\n")
  );

  if (!readyForSynchronizedLive) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(
    `team1 tramsaigon pay closeout failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
