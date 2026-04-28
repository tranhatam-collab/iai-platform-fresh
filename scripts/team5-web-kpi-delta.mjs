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

function formatPercentValue(value) {
  if (value === null || value === undefined) {
    return "chưa đủ dữ liệu";
  }
  return `${value}%`;
}

function formatDelta(value, unit = "%") {
  if (value === null) {
    return "chưa đủ dữ liệu";
  }
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}${unit}`;
}

function classifyTrend(current, previous, { lowerIsBetter }) {
  if (current === null || previous === null) {
    return {
      delta: null,
      status: "không đủ dữ liệu"
    };
  }

  const delta = toNumber(current - previous);
  if (delta === 0) {
    return { delta, status: "không đổi" };
  }

  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  return {
    delta,
    status: improved ? "cải thiện" : "xấu đi"
  };
}

async function loadSnapshot(root, date) {
  const filePath = path.join(root, "docs", "reports", "team5", `WEB_KPI_SNAPSHOT_${date}.json`);
  const source = await readFile(filePath, "utf8");
  const parsed = JSON.parse(source);
  return { filePath, parsed };
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

  const currentAuthFail = toNumber(current.parsed.funnel?.failedAuthHandoffRatePercent);
  const previousAuthFail = toNumber(previous.parsed.funnel?.failedAuthHandoffRatePercent);
  const currentRouteFail = toNumber(current.parsed.funnel?.brokenRouteHandoffRatePercent);
  const previousRouteFail = toNumber(previous.parsed.funnel?.brokenRouteHandoffRatePercent);
  const currentCoverage = toNumber(current.parsed.baseline?.coveragePercent);
  const previousCoverage = toNumber(previous.parsed.baseline?.coveragePercent);
  const currentEvents = toNumber(current.parsed.totalEventsObserved, 0);
  const previousEvents = toNumber(previous.parsed.totalEventsObserved, 0);

  const authTrend = classifyTrend(currentAuthFail, previousAuthFail, { lowerIsBetter: true });
  const routeTrend = classifyTrend(currentRouteFail, previousRouteFail, { lowerIsBetter: true });
  const coverageTrend = classifyTrend(currentCoverage, previousCoverage, { lowerIsBetter: false });
  const eventTrend = classifyTrend(currentEvents, previousEvents, { lowerIsBetter: false });

  const summary = {
    compareDate,
    currentDate: date,
    generatedAt: new Date().toISOString(),
    timezone,
    metrics: {
      failedAuthHandoffRatePercent: {
        current: currentAuthFail,
        previous: previousAuthFail,
        ...authTrend
      },
      brokenRouteHandoffRatePercent: {
        current: currentRouteFail,
        previous: previousRouteFail,
        ...routeTrend
      },
      baselineCoveragePercent: {
        current: currentCoverage,
        previous: previousCoverage,
        ...coverageTrend
      },
      totalEventsObserved: {
        current: currentEvents,
        previous: previousEvents,
        ...eventTrend
      }
    },
    sources: {
      current: path.relative(root, current.filePath),
      previous: path.relative(root, previous.filePath)
    }
  };

  const reportDir = path.join(root, "docs", "reports", "team5");
  await mkdir(reportDir, { recursive: true });

  const jsonPath = path.join(reportDir, `WEB_KPI_DELTA_${compareDate}_TO_${date}.json`);
  const mdPath = path.join(reportDir, `WEB_KPI_DELTA_${compareDate}_TO_${date}.md`);

  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  const markdown = [
    `# WEB_KPI_DELTA_${compareDate}_TO_${date}`,
    `- Thời điểm tạo: ${summary.generatedAt}`,
    `- Múi giờ: ${timezone}`,
    `- Snapshot trước: ${summary.sources.previous}`,
    `- Snapshot sau: ${summary.sources.current}`,
    "",
    "## Delta handoff",
    `- Auth fail rate: ${formatPercentValue(previousAuthFail)} -> ${formatPercentValue(currentAuthFail)} (${authTrend.status}, ${formatDelta(authTrend.delta)})`,
    `- Route fail rate: ${formatPercentValue(previousRouteFail)} -> ${formatPercentValue(currentRouteFail)} (${routeTrend.status}, ${formatDelta(routeTrend.delta)})`,
    "",
    "## Delta baseline",
    `- Coverage: ${formatPercentValue(previousCoverage)} -> ${formatPercentValue(currentCoverage)} (${coverageTrend.status}, ${formatDelta(coverageTrend.delta)})`,
    `- Tổng event quan sát: ${previousEvents ?? "chưa đủ dữ liệu"} -> ${currentEvents ?? "chưa đủ dữ liệu"} (${eventTrend.status}, ${formatDelta(eventTrend.delta, "")})`,
    "",
    "## Kết luận",
    authTrend.status === "cải thiện" && routeTrend.status === "cải thiện"
      ? "- Tỷ lệ lỗi handoff auth/route đều cải thiện so với ngày trước."
      : "- Cần tiếp tục theo dõi vì có chỉ số handoff chưa cải thiện đồng thời.",
    ""
  ].join("\n");

  await writeFile(mdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Đã tạo KPI delta Team 5: ${compareDate} -> ${date}.`,
      `Auth fail rate delta: ${formatDelta(authTrend.delta)} (${authTrend.status}).`,
      `Route fail rate delta: ${formatDelta(routeTrend.delta)} (${routeTrend.status}).`,
      `JSON: ${path.relative(root, jsonPath)}`,
      `MD: ${path.relative(root, mdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team5 KPI delta report failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
