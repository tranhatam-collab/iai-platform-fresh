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

function toNumber(value, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return Number(value.toFixed(digits));
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return "chưa đủ dữ liệu";
  }
  return `${value}%`;
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "chưa đủ dữ liệu";
  }
  return String(value);
}

function delta(current, previous) {
  if (current === null || previous === null) {
    return null;
  }
  return toNumber(current - previous);
}

function trend(deltaValue, lowerIsBetter) {
  if (deltaValue === null) {
    return "không đủ dữ liệu";
  }
  if (deltaValue === 0) {
    return "không đổi";
  }
  const improved = lowerIsBetter ? deltaValue < 0 : deltaValue > 0;
  return improved ? "cải thiện" : "xấu đi";
}

function formatDelta(deltaValue, unit = "%") {
  if (deltaValue === null) {
    return "chưa đủ dữ liệu";
  }
  const prefix = deltaValue > 0 ? "+" : "";
  return `${prefix}${deltaValue}${unit}`;
}

async function loadSnapshot(root, date) {
  const filePath = path.join(root, "docs", "reports", "team5", `WEB_KPI_SNAPSHOT_${date}.json`);
  const source = await readFile(filePath, "utf8");
  return {
    filePath,
    data: JSON.parse(source)
  };
}

async function resolveCompareDate(root, date, explicitCompareDate) {
  if (explicitCompareDate) {
    return explicitCompareDate;
  }

  const reportDir = path.join(root, "docs", "reports", "team5");
  const entries = await readdir(reportDir);
  const availableDates = entries
    .flatMap((entry) => {
      const match = /^WEB_KPI_SNAPSHOT_(\d{4}-\d{2}-\d{2})\.json$/.exec(entry);
      return match ? [match[1]] : [];
    })
    .sort((left, right) => right.localeCompare(left));

  const fallbackDate = availableDates.find((candidate) => candidate < date);
  if (fallbackDate) {
    return fallbackDate;
  }

  return previousDate(date);
}

async function main() {
  const root = process.cwd();
  const date = parseArg("--date") ?? todayInTimezone(timezone);
  const compareDate = await resolveCompareDate(root, date, parseArg("--compare-date"));

  const current = await loadSnapshot(root, date);
  const previous = await loadSnapshot(root, compareDate);

  const currentAuthFail = toNumber(current.data.funnel?.failedAuthHandoffRatePercent);
  const previousAuthFail = toNumber(previous.data.funnel?.failedAuthHandoffRatePercent);
  const currentRouteFail = toNumber(current.data.funnel?.brokenRouteHandoffRatePercent);
  const previousRouteFail = toNumber(previous.data.funnel?.brokenRouteHandoffRatePercent);
  const currentCoverage = toNumber(current.data.baseline?.coveragePercent);
  const previousCoverage = toNumber(previous.data.baseline?.coveragePercent);
  const currentEvents = toNumber(current.data.totalEventsObserved, 0);
  const previousEvents = toNumber(previous.data.totalEventsObserved, 0);

  const authDelta = delta(currentAuthFail, previousAuthFail);
  const routeDelta = delta(currentRouteFail, previousRouteFail);
  const coverageDelta = delta(currentCoverage, previousCoverage);
  const eventsDelta = delta(currentEvents, previousEvents);

  const bundle = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    compareDate,
    sources: {
      currentSnapshot: path.relative(root, current.filePath),
      previousSnapshot: path.relative(root, previous.filePath)
    },
    summary: {
      authFailRatePercent: {
        current: currentAuthFail,
        previous: previousAuthFail,
        delta: authDelta,
        trend: trend(authDelta, true)
      },
      routeFailRatePercent: {
        current: currentRouteFail,
        previous: previousRouteFail,
        delta: routeDelta,
        trend: trend(routeDelta, true)
      },
      baselineCoveragePercent: {
        current: currentCoverage,
        previous: previousCoverage,
        delta: coverageDelta,
        trend: trend(coverageDelta, false)
      },
      totalEventsObserved: {
        current: currentEvents,
        previous: previousEvents,
        delta: eventsDelta,
        trend: trend(eventsDelta, false)
      }
    }
  };

  const reportDir = path.join(root, "docs", "reports", "team5");
  await mkdir(reportDir, { recursive: true });

  const jsonPath = path.join(reportDir, `WEB_KPI_BUNDLE_${date}.json`);
  const mdPath = path.join(reportDir, `WEB_KPI_BUNDLE_${date}.md`);

  await writeFile(jsonPath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");

  const markdown = [
    `# WEB_KPI_BUNDLE_${date}`,
    `- Thời điểm tạo: ${bundle.generatedAt}`,
    `- Múi giờ: ${timezone}`,
    `- Snapshot hiện tại: ${bundle.sources.currentSnapshot}`,
    `- Snapshot so sánh: ${bundle.sources.previousSnapshot}`,
    "",
    "## Handoff summary",
    `- Auth fail rate: ${formatPercent(previousAuthFail)} -> ${formatPercent(currentAuthFail)} (${bundle.summary.authFailRatePercent.trend}, ${formatDelta(authDelta)})`,
    `- Route fail rate: ${formatPercent(previousRouteFail)} -> ${formatPercent(currentRouteFail)} (${bundle.summary.routeFailRatePercent.trend}, ${formatDelta(routeDelta)})`,
    "",
    "## Baseline summary",
    `- Coverage: ${formatPercent(previousCoverage)} -> ${formatPercent(currentCoverage)} (${bundle.summary.baselineCoveragePercent.trend}, ${formatDelta(coverageDelta)})`,
    `- Total observed events: ${formatNumber(previousEvents)} -> ${formatNumber(currentEvents)} (${bundle.summary.totalEventsObserved.trend}, ${formatDelta(eventsDelta, "")})`,
    "",
    "## Gate note",
    bundle.summary.authFailRatePercent.trend === "cải thiện" &&
    bundle.summary.routeFailRatePercent.trend === "cải thiện"
      ? "- Handoff auth/route đều cải thiện; giữ monitor-only và tiếp tục ingest pilot thật."
      : "- Chỉ số handoff chưa cải thiện đồng thời; tiếp tục theo dõi thêm trước khi nộp claim mới.",
    ""
  ].join("\n");

  await writeFile(mdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Đã tạo KPI bundle Team 5 cho ngày ${date}.`,
      `Auth fail rate: ${formatPercent(previousAuthFail)} -> ${formatPercent(currentAuthFail)} (${bundle.summary.authFailRatePercent.trend}).`,
      `Route fail rate: ${formatPercent(previousRouteFail)} -> ${formatPercent(currentRouteFail)} (${bundle.summary.routeFailRatePercent.trend}).`,
      `JSON: ${path.relative(root, jsonPath)}`,
      `MD: ${path.relative(root, mdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team5 KPI bundle report failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
