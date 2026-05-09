import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  const entry = process.argv.find((argument) => argument.startsWith(`${prefix}=`));
  return entry ? entry.slice(prefix.length + 1) : null;
}

function previousDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error(`Định dạng ngày không hợp lệ: ${date}. Dùng YYYY-MM-DD.`);
  }
  const [, year, month, day] = match;
  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utcDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatPercent(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "chưa đủ dữ liệu";
  }
  return `${value}%`;
}

async function loadJson(root, relativePath) {
  const filePath = path.join(root, relativePath);
  const source = await readFile(filePath, "utf8");
  return { filePath, data: JSON.parse(source) };
}

function readHeadHash(root) {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: root,
      encoding: "utf8"
    }).trim();
  } catch {
    return "unknown";
  }
}

async function main() {
  const root = process.cwd();
  const date = parseArg("--date") ?? todayInTimezone(timezone);
  const requestedCompareDate = parseArg("--compare-date");

  const readiness = await loadJson(root, `docs/reports/team5/TEAM5_LIVE_SYNC_READINESS_${date}.json`);
  const bundle = await loadJson(root, `docs/reports/team5/WEB_KPI_BUNDLE_${date}.json`);
  const compareDate =
    requestedCompareDate ??
    (typeof bundle.data.compareDate === "string" ? bundle.data.compareDate : null) ??
    previousDate(date);
  const headHash = readHeadHash(root);

  const authCurrent = bundle.data.summary?.authFailRatePercent?.current ?? null;
  const authPrevious = bundle.data.summary?.authFailRatePercent?.previous ?? null;
  const authDelta = bundle.data.summary?.authFailRatePercent?.delta ?? null;
  const routeCurrent = bundle.data.summary?.routeFailRatePercent?.current ?? null;
  const routePrevious = bundle.data.summary?.routeFailRatePercent?.previous ?? null;
  const routeDelta = bundle.data.summary?.routeFailRatePercent?.delta ?? null;

  const packet = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    compareDate,
    status: readiness.data.status,
    releaseClaimState: readiness.data.gates?.releaseClaimUnlocked?.releaseClaimState ?? "UNKNOWN",
    gates: readiness.data.gates,
    blockers: readiness.data.blockers ?? [],
    kpiSummary: {
      authFailRatePercent: {
        current: authCurrent,
        previous: authPrevious,
        delta: authDelta
      },
      routeFailRatePercent: {
        current: routeCurrent,
        previous: routePrevious,
        delta: routeDelta
      }
    },
    sources: {
      readiness: path.relative(root, readiness.filePath),
      bundle: path.relative(root, bundle.filePath)
    },
    commitHash: headHash
  };

  const unmetConditions = [];
  if (!packet.gates?.noGoOwnersDone?.pass) {
    unmetConditions.push("owner sign-off NO-GO theo mô hình đang active");
  }
  if (!packet.gates?.payProductionGateDone?.pass) {
    unmetConditions.push("pay production gate PASS");
  }
  if (!packet.gates?.releaseClaimUnlocked?.pass) {
    unmetConditions.push("release-claim state thoát LOCK_RETAINED");
  }

  const reportDir = path.join(root, "docs", "reports", "team5");
  await mkdir(reportDir, { recursive: true });

  const jsonPath = path.join(reportDir, `TEAM5_LIVE_SYNC_FINAL_PACKET_${date}.json`);
  const mdPath = path.join(reportDir, `TEAM5_LIVE_SYNC_FINAL_PACKET_${date}.md`);

  await writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAM5_LIVE_SYNC_FINAL_PACKET_${date}`,
    `- Thời điểm tạo: ${packet.generatedAt}`,
    `- Múi giờ: ${timezone}`,
    `- Trạng thái live-sync: ${packet.status}`,
    `- Release-claim state: ${packet.releaseClaimState}`,
    "",
    "DONE:",
    "- Đã chạy flow chuẩn Team 3 (Release Sync): `snapshot -> delta -> bundle -> packet`.",
    "- Đã cập nhật KPI bundle và live-sync readiness theo tracker Team 1.",
    "",
    "IN PROGRESS:",
    "- Tiếp tục ingest pilot traffic thật cho `web.iai.one`.",
    "- Duy trì monitor-only trên shared contract, không mở scope mới.",
    "",
    "BLOCK:",
    ...(packet.blockers.length > 0
      ? packet.blockers.map((blocker) => `- ${blocker}`)
      : ["- không có"]),
    "",
    "NEXT:",
    "- Tiếp tục chạy `pnpm report:team5-gate-flow` + `pnpm report:team5-live-sync-readiness` mỗi checkpoint.",
    unmetConditions.length > 0
      ? `- Chỉ chuyển live-sync khi hoàn tất các điều kiện còn thiếu: ${unmetConditions.join(" + ")}.`
      : "- Đủ điều kiện chuyển live-sync; chờ Team 1 phát lệnh flip chính thức.",
    "",
    "TEST PROOF:",
    "- `pnpm report:team5-gate-flow`",
    `- \`pnpm report:team5-live-sync-readiness -- --date=${date}\``,
    `- \`pnpm report:team5-live-sync-packet -- --date=${date}\``,
    "",
    "KPI SUMMARY:",
    `- Auth fail rate: ${formatPercent(authPrevious)} -> ${formatPercent(authCurrent)} (delta ${formatPercent(authDelta)})`,
    `- Route fail rate: ${formatPercent(routePrevious)} -> ${formatPercent(routeCurrent)} (delta ${formatPercent(routeDelta)})`,
    "",
    "COMMIT HASH:",
    `- ${headHash}`,
    "",
    "Sources:",
    `- ${packet.sources.readiness}`,
    `- ${packet.sources.bundle}`,
    ""
  ].join("\n");

  await writeFile(mdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Đã tạo Team 3 live-sync final packet cho ngày ${date}.`,
      `Status: ${packet.status}.`,
      `Auth fail rate: ${formatPercent(authPrevious)} -> ${formatPercent(authCurrent)}.`,
      `Route fail rate: ${formatPercent(routePrevious)} -> ${formatPercent(routeCurrent)}.`,
      `JSON: ${path.relative(root, jsonPath)}`,
      `MD: ${path.relative(root, mdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team5 live-sync final packet failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
