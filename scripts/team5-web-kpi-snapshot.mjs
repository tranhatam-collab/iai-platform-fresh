import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const baselineEvents = [
  "web_landing_view",
  "web_role_selected",
  "web_onboarding_started",
  "web_auth_handoff_started",
  "web_auth_handoff_completed",
  "web_auth_handoff_failed",
  "web_first_action_completed",
  "web_flow_handoff_completed",
  "web_route_handoff_failed",
  "web_paid_intent_started",
  "web_revenue_assist_completed",
  "web_returned_within_7d"
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

function parseArg(prefix) {
  const entry = process.argv.find((argument) => argument.startsWith(`${prefix}=`));
  return entry ? entry.slice(prefix.length + 1) : null;
}

function toNumber(value) {
  if (!Number.isFinite(value)) {
    return null;
  }
  return Number(value.toFixed(4));
}

function percentage(numerator, denominator) {
  if (denominator <= 0) {
    return null;
  }
  return Number(((numerator / denominator) * 100).toFixed(2));
}

async function fileExists(absolutePath) {
  try {
    await access(absolutePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return null;
  }

  const eventName =
    typeof record.eventName === "string" ? record.eventName.trim() : "";

  if (!eventName) {
    return null;
  }

  return {
    eventName,
    recordedAt:
      typeof record.recordedAt === "string" ? record.recordedAt : null,
    sourceCampaign:
      typeof record.sourceCampaign === "string" && record.sourceCampaign.trim().length > 0
        ? record.sourceCampaign
        : "unknown"
  };
}

async function loadEventsFromJsonl(filePath) {
  const source = await readFile(filePath, "utf8");
  const events = [];
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      const parsed = JSON.parse(trimmed);
      const normalized = normalizeRecord(parsed);
      if (normalized) {
        events.push(normalized);
      }
    } catch {
      // ignore malformed lines to keep snapshot resilient
    }
  }
  return events;
}

function buildMetrics(events) {
  const counts = Object.fromEntries(baselineEvents.map((eventName) => [eventName, 0]));
  const campaignCounts = new Map();

  for (const event of events) {
    if (Object.prototype.hasOwnProperty.call(counts, event.eventName)) {
      counts[event.eventName] += 1;
    }
    if (event.sourceCampaign && event.sourceCampaign !== "unknown") {
      campaignCounts.set(
        event.sourceCampaign,
        (campaignCounts.get(event.sourceCampaign) ?? 0) + 1
      );
    }
  }

  const seen = baselineEvents.filter((eventName) => counts[eventName] > 0);
  const missing = baselineEvents.filter((eventName) => counts[eventName] === 0);
  const coveragePercent = Number(((seen.length / baselineEvents.length) * 100).toFixed(2));

  const visitors = counts.web_landing_view;
  const authCompleted = counts.web_auth_handoff_completed;
  const firstAction = counts.web_first_action_completed;
  const handoffAttempts = counts.web_auth_handoff_started + counts.web_flow_handoff_completed;
  const qualifiedPipeline =
    counts.web_paid_intent_started + counts.web_revenue_assist_completed;

  return {
    baseline: {
      coveragePercent,
      missing,
      seen,
      totalEvents: baselineEvents.length
    },
    campaignsTracked: [...campaignCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([campaign, count]) => ({ campaign, count })),
    counts,
    funnel: {
      campaignToQualifiedPipelineRatio:
        visitors > 0 ? toNumber(qualifiedPipeline / visitors) : null,
      failedAuthHandoffRatePercent: percentage(counts.web_auth_handoff_failed, counts.web_auth_handoff_started),
      firstActionToRetainedRatio: firstAction > 0
        ? toNumber(counts.web_returned_within_7d / firstAction)
        : null,
      firstActionWithin24hRatio: authCompleted > 0
        ? toNumber(firstAction / authCompleted)
        : null,
      brokenRouteHandoffRatePercent: percentage(
        counts.web_route_handoff_failed,
        handoffAttempts
      ),
      revenueAssistConversionRatio: firstAction > 0
        ? toNumber(counts.web_revenue_assist_completed / firstAction)
        : null,
      visitorToSignupRatio: visitors > 0
        ? toNumber(authCompleted / visitors)
        : null
    },
    totalEventsObserved: events.length
  };
}

function markdownList(items) {
  if (!items || items.length === 0) {
    return "- không có";
  }
  return items.map((item) => `- ${item}`).join("\n");
}

function formatMetric(value, fallback = "chưa đủ baseline") {
  return value === null ? fallback : `${(value * 100).toFixed(2)}%`;
}

async function main() {
  const root = process.cwd();
  const date = parseArg("--date") ?? todayInTimezone(timezone);
  const explicitEventFile = parseArg("--events-file");
  const defaultEventFile = path.join(root, "runtime", "web", "events.jsonl");
  const sinkFromEnv = process.env.WEB_EVENT_SINK_PATH
    ? path.resolve(root, process.env.WEB_EVENT_SINK_PATH)
    : null;
  const eventFile =
    explicitEventFile
      ? path.resolve(root, explicitEventFile)
      : sinkFromEnv ?? defaultEventFile;

  const hasEventFile = await fileExists(eventFile);
  const events = hasEventFile ? await loadEventsFromJsonl(eventFile) : [];
  const metrics = buildMetrics(events);
  const readinessOnly = events.length === 0;

  const snapshot = {
    date,
    generatedAt: new Date().toISOString(),
    source: {
      eventFile,
      eventFilePresent: hasEventFile,
      mode: readinessOnly ? "readiness_only" : "event_observed"
    },
    timezone,
    ...metrics
  };

  const reportDir = path.join(root, "docs", "reports", "team5");
  await mkdir(reportDir, { recursive: true });

  const jsonPath = path.join(reportDir, `WEB_KPI_SNAPSHOT_${date}.json`);
  const mdPath = path.join(reportDir, `WEB_KPI_SNAPSHOT_${date}.md`);

  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# WEB_KPI_SNAPSHOT_${date}`,
    `- Thời điểm tạo: ${snapshot.generatedAt}`,
    `- Múi giờ: ${timezone}`,
    `- Chế độ nguồn: ${snapshot.source.mode}`,
    `- Tệp sự kiện: ${path.relative(root, eventFile)}`,
    `- Tệp sự kiện tồn tại: ${snapshot.source.eventFilePresent ? "CÓ" : "KHÔNG"}`,
    "",
    "## Độ phủ baseline",
    `- Độ phủ: ${snapshot.baseline.coveragePercent}%`,
    `- Số event đã thấy: ${snapshot.baseline.seen.length}/${snapshot.baseline.totalEvents}`,
    "- Event còn thiếu:",
    markdownList(snapshot.baseline.missing),
    "",
    "## Ảnh chụp KPI",
    `- visitor -> signup conversion: ${formatMetric(snapshot.funnel.visitorToSignupRatio)}`,
    `- signup -> first action activation: ${formatMetric(snapshot.funnel.firstActionWithin24hRatio)}`,
    `- first action -> retained user: ${formatMetric(snapshot.funnel.firstActionToRetainedRatio)}`,
    `- campaign -> qualified pipeline: ${formatMetric(snapshot.funnel.campaignToQualifiedPipelineRatio)}`,
    `- revenue-assist conversions: ${formatMetric(snapshot.funnel.revenueAssistConversionRatio)}`,
    `- tỷ lệ lỗi handoff auth: ${
      snapshot.funnel.failedAuthHandoffRatePercent === null
        ? "chưa đủ baseline"
        : `${snapshot.funnel.failedAuthHandoffRatePercent}%`
    }`,
    `- tỷ lệ lỗi handoff route: ${
      snapshot.funnel.brokenRouteHandoffRatePercent === null
        ? "chưa đủ baseline"
        : `${snapshot.funnel.brokenRouteHandoffRatePercent}%`
    }`,
    "",
    "## Số lượng",
    ...baselineEvents.map((eventName) => `- ${eventName}: ${snapshot.counts[eventName]}`),
    "",
    "## Chiến dịch",
    ...(snapshot.campaignsTracked.length > 0
      ? snapshot.campaignsTracked.map(
          (entry) => `- ${entry.campaign}: ${entry.count}`
        )
      : ["- chưa đủ baseline"]),
    ""
  ].join("\n");

  await writeFile(mdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Đã tạo ảnh chụp KPI Team 5 cho ngày ${date}.`,
      `Chế độ: ${snapshot.source.mode}.`,
      `Độ phủ baseline: ${snapshot.baseline.coveragePercent}%.`,
      `JSON: ${path.relative(root, jsonPath)}`,
      `MD: ${path.relative(root, mdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `Lỗi tạo ảnh chụp KPI Team 5: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
