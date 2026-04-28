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

function getDateArg() {
  const explicit = process.argv.find((argument) => argument.startsWith("--date="));
  return explicit ? explicit.slice("--date=".length) : todayInTimezone(timezone);
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalize(value) {
  return String(value ?? "").trim();
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function validateSchedule(schedule) {
  const checks = [];
  const addCheck = (name, pass, details) => checks.push({ name, pass, details });

  addCheck(
    "schedule_is_object",
    isRecord(schedule),
    isRecord(schedule) ? "Schedule is a JSON object." : "Schedule must be a JSON object."
  );

  if (!isRecord(schedule)) {
    return { checks, overallPass: false };
  }

  addCheck(
    "cadence_is_15_minutes",
    schedule.cadence_minutes === 15,
    schedule.cadence_minutes === 15
      ? "Reminder cadence is locked to 15 minutes."
      : "Reminder cadence must be 15 minutes."
  );
  addCheck(
    "status_active_until_complete",
    schedule.status === "ACTIVE_UNTIL_VERIFIED_COMPLETE",
    "Schedule must remain active until teams are verified complete."
  );
  addCheck(
    "channel_map_present",
    Array.isArray(schedule.channel_map) && schedule.channel_map.length > 0,
    "Schedule must include at least one team channel mapping."
  );

  const seenTeamIds = new Set();
  for (const [index, row] of Array.isArray(schedule.channel_map)
    ? schedule.channel_map.entries()
    : []) {
    const prefix = `channel_map_${index + 1}`;
    const teamId = normalize(row?.team_id);
    const duplicateTeamId = teamId && seenTeamIds.has(teamId);

    if (teamId) {
      seenTeamIds.add(teamId);
    }

    addCheck(`${prefix}_team_id_present`, Boolean(teamId), "Every row needs team_id.");
    addCheck(
      `${prefix}_team_id_unique`,
      Boolean(teamId) && !duplicateTeamId,
      duplicateTeamId ? `Duplicate team_id: ${teamId}` : "team_id is unique."
    );
    addCheck(
      `${prefix}_logical_channel_present`,
      Boolean(normalize(row?.logical_channel)),
      "Every row needs logical_channel."
    );
    addCheck(
      `${prefix}_owner_present`,
      Boolean(normalize(row?.owner)),
      "Every row needs owner."
    );
    addCheck(
      `${prefix}_status_present`,
      Boolean(normalize(row?.status)),
      "Every row needs status."
    );
    addCheck(
      `${prefix}_stop_condition_present`,
      Boolean(normalize(row?.stop_condition)),
      "Every row needs a stop_condition."
    );
    addCheck(
      `${prefix}_reminder_command_present`,
      Boolean(normalize(row?.reminder_command)),
      "Every row needs a full reminder_command."
    );
  }

  return {
    activeRows: schedule.channel_map.filter((row) => row.status !== "COMPLETE_VERIFIED").length,
    checks,
    overallPass: checks.every((check) => check.pass)
  };
}

function renderReminderPacket(schedule, date) {
  const rows = schedule.channel_map.filter((row) => row.status !== "COMPLETE_VERIFIED");
  return [
    `# TEAM_REMINDER_DISPATCH_PACKET_${date}`,
    `- Generated at: ${new Date().toISOString()}`,
    `- Timezone: ${timezone}`,
    `- Cadence: every ${schedule.cadence_minutes} minutes`,
    `- Active rows: ${rows.length}`,
    "",
    "## Reminder Commands",
    "",
    ...rows.flatMap((row, index) => [
      `### ${index + 1}. ${row.team_name}`,
      "",
      `- team_id: \`${row.team_id}\``,
      `- logical_channel: \`${row.logical_channel}\``,
      `- owner: \`${row.owner}\``,
      `- status: \`${row.status}\``,
      `- stop_condition: ${row.stop_condition}`,
      "",
      "```text",
      row.reminder_command,
      "```",
      ""
    ])
  ].join("\n");
}

function renderStatus(schedule, validation, date) {
  const heartbeat = isRecord(schedule.thread_heartbeat) ? schedule.thread_heartbeat : null;

  return [
    `# TEAM_CHANNEL_REMINDER_STATUS_${date}`,
    `- Generated at: ${new Date().toISOString()}`,
    `- Timezone: ${timezone}`,
    `- Schedule source: \`docs/reports/team1/TEAM_CHANNEL_REMINDER_SCHEDULE_${date}.json\``,
    `- Cadence minutes: \`${schedule.cadence_minutes ?? "MISSING"}\``,
    `- Active rows: \`${validation.activeRows ?? 0}\``,
    `- Overall: ${validation.overallPass ? "PASS" : "FAIL"}`,
    ...(heartbeat
      ? [
          `- App heartbeat: \`${heartbeat.status ?? "UNKNOWN"}\` (\`${heartbeat.automation_id ?? "UNKNOWN"}\`)`,
          `- Dispatch mode: ${heartbeat.dispatch_mode ?? "repo-side checker + thread heartbeat"}`,
          `- External transport: ${heartbeat.external_transport ?? "requires Slack/Teams connector or runner attachment"}`
        ]
      : []),
    "",
    "## Checks",
    "",
    ...validation.checks.map(
      (check) => `- ${markdownStatus(check.pass)} \`${check.name}\` — ${check.details}`
    ),
    "",
    "## Active Reminder Rows",
    "",
    ...(Array.isArray(schedule.channel_map)
      ? schedule.channel_map.map(
          (row) =>
            `- \`${row.team_id}\` / \`${row.logical_channel}\` / status=\`${row.status}\``
        )
      : [])
  ].join("\n");
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();
  const schedulePath = path.join(
    root,
    "docs",
    "reports",
    "team1",
    `TEAM_CHANNEL_REMINDER_SCHEDULE_${date}.json`
  );
  const schedule = JSON.parse(await readFile(schedulePath, "utf8"));
  const validation = validateSchedule(schedule);

  if (hasFlag("--emit")) {
    console.log(renderReminderPacket(schedule, date));
  } else {
    console.log(renderStatus(schedule, validation, date));
  }

  if (hasFlag("--write")) {
    const reportDir = path.join(root, "docs", "reports", "team1");
    await mkdir(reportDir, { recursive: true });
    await writeFile(
      path.join(reportDir, `TEAM_CHANNEL_REMINDER_STATUS_${date}.md`),
      `${renderStatus(schedule, validation, date)}\n`
    );
  }

  if (!validation.overallPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
