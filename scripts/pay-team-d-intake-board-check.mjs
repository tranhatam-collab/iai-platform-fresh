import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";

export const REQUIRED_COLUMNS = [
  "intake_id",
  "site_code",
  "domain",
  "priority",
  "market_type",
  "onboarding_form",
  "owner_type",
  "legal_owner",
  "collection_required",
  "payout_required",
  "collection_country_currency",
  "payout_country_currency",
  "assigned_owner",
  "current_status",
  "blocker",
  "next_action",
  "next_action_owner",
  "target_staging_date",
  "target_live_date",
  "evidence_refs",
  "notes"
];

export const ALLOWED_STATUSES = new Set([
  "NEW_INTAKE",
  "FORM_SELECTION_REQUIRED",
  "FORM_IN_PROGRESS",
  "OWNER_VERIFICATION_PENDING",
  "FINANCE_OPS_REVIEW",
  "TREASURY_REVIEW",
  "SECURITY_REVIEW",
  "TEAM_B_MAPPING_PENDING",
  "READY_FOR_STAGING",
  "READY_FOR_LIVE",
  "LIVE",
  "BLOCKED",
  "REJECTED"
]);

export const ALLOWED_PRIORITIES = new Set(["P0", "P1", "P2", "P3"]);

export const EXPECTED_DOMAINS = [
  "tranhatam.com",
  "nguyenlananh.com",
  "omdala.com",
  "app.omdala.com",
  "omdalat.com",
  "app.omdalat.com",
  "flow.iai.one",
  "life.iai.one",
  "vc.vetuonglai.com",
  "invest.vetuonglai.com",
  "life.vetuonglai.com",
  "aiaccountingloop.com",
  "tramsaigon.com",
  "app.iai.one",
  "noos.iai.one",
  "cios.iai.one",
  "lamviec.muonnoi.org"
];

export const VN_FORM = "PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md";
export const INTERNATIONAL_FORM =
  "PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md";

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

function shouldWriteOutputs() {
  return !process.argv.includes("--no-write");
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function normalizeCell(value) {
  return value.trim().replace(/^`|`$/g, "");
}

function parseMarkdownTable(tableText) {
  const lines = tableText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith("|"));

  if (lines.length < 2) {
    throw new Error("Markdown table requires at least a header and a separator row.");
  }

  const parseRow = (line) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => normalizeCell(cell));

  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map((line) => {
    const cells = parseRow(line);
    const entry = {};

    headers.forEach((header, index) => {
      entry[header] = cells[index] ?? "";
    });

    return entry;
  });

  return { headers, rows };
}

export function extractActiveBoardTable(markdown) {
  const lines = markdown.split("\n");
  const headingIndex = lines.findIndex((line) => line.trim() === "10. Active intake board");

  if (headingIndex === -1) {
    throw new Error("Could not find `10. Active intake board` section.");
  }

  let tableStart = -1;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    if (lines[index].trim().startsWith("|")) {
      tableStart = index;
      break;
    }
  }

  if (tableStart === -1) {
    throw new Error("Could not find markdown table after active intake board heading.");
  }

  const tableLines = [];
  for (let index = tableStart; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.startsWith("|")) {
      break;
    }
    tableLines.push(line);
  }

  return parseMarkdownTable(tableLines.join("\n"));
}

export function readPayGateVerdict(markdown) {
  const match = markdown.match(/- Verdict:\s*`([^`]+)`/);
  return match ? match[1] : "MISSING";
}

function validateRequiredColumns(headers) {
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  return {
    pass: missing.length === 0,
    missing
  };
}

function validateRowRequiredFields(row) {
  const missing = REQUIRED_COLUMNS.filter((column) => !String(row[column] ?? "").trim());
  return {
    pass: missing.length === 0,
    missing
  };
}

function validateMarketAndForm(row) {
  const marketType = row.market_type;
  const onboardingForm = row.onboarding_form;
  const currentStatus = row.current_status;

  if (marketType === "VN") {
    return {
      pass: onboardingForm === VN_FORM,
      reason:
        onboardingForm === VN_FORM
          ? "VN row uses VN onboarding form."
          : "VN row must use the VN onboarding form."
    };
  }

  if (marketType === "INTERNATIONAL") {
    return {
      pass: onboardingForm === INTERNATIONAL_FORM,
      reason:
        onboardingForm === INTERNATIONAL_FORM
          ? "International row uses international onboarding form."
          : "International row must use the international onboarding form."
    };
  }

  const statusAllowsUnknownMarket =
    currentStatus === "FORM_SELECTION_REQUIRED" || currentStatus === "BLOCKED";

  return {
    pass: statusAllowsUnknownMarket,
    reason: statusAllowsUnknownMarket
      ? "Unknown market type is allowed only while form selection is unresolved or blocked."
      : "Rows with unresolved market type must remain FORM_SELECTION_REQUIRED or BLOCKED."
  };
}

export function validateIntakeBoard({ headers, rows, payGateVerdict }) {
  const requiredColumns = validateRequiredColumns(headers);
  const domainsPresent = new Set(rows.map((row) => row.domain));
  const missingExpectedDomains = EXPECTED_DOMAINS.filter((domain) => !domainsPresent.has(domain));

  const rowChecks = rows.map((row) => {
    const requiredFields = validateRowRequiredFields(row);
    const validStatus = ALLOWED_STATUSES.has(row.current_status);
    const validPriority = ALLOWED_PRIORITIES.has(row.priority);
    const marketAndForm = validateMarketAndForm(row);

    return {
      intakeId: row.intake_id,
      domain: row.domain,
      requiredFields,
      validStatus,
      validPriority,
      marketAndForm,
      pass:
        requiredFields.pass && validStatus && validPriority && marketAndForm.pass
    };
  });

  const liveStatusesForbiddenByGate =
    payGateVerdict.includes("LOCK_RETAINED") || payGateVerdict === "MISSING";
  const forbiddenLiveRows = liveStatusesForbiddenByGate
    ? rows.filter((row) => ["READY_FOR_LIVE", "LIVE"].includes(row.current_status))
    : [];

  const checks = [
    {
      name: "required_columns_present",
      pass: requiredColumns.pass,
      details:
        requiredColumns.missing.length === 0
          ? "All required columns are present."
          : `Missing columns: ${requiredColumns.missing.join(", ")}`
    },
    {
      name: "expected_domains_present",
      pass: missingExpectedDomains.length === 0,
      details:
        missingExpectedDomains.length === 0
          ? "All 17 expected Team D intake domains are present."
          : `Missing domains: ${missingExpectedDomains.join(", ")}`
    },
    {
      name: "row_fields_complete",
      pass: rowChecks.every((row) => row.requiredFields.pass),
      details: rowChecks
        .filter((row) => !row.requiredFields.pass)
        .map((row) => `${row.intakeId}: ${row.requiredFields.missing.join(", ")}`)
        .join(" | ") || "All rows contain every required field."
    },
    {
      name: "status_vocabulary_locked",
      pass: rowChecks.every((row) => row.validStatus),
      details: rowChecks
        .filter((row) => !row.validStatus)
        .map((row) => `${row.intakeId}: invalid status`)
        .join(" | ") || "All rows use allowed statuses."
    },
    {
      name: "priority_vocabulary_locked",
      pass: rowChecks.every((row) => row.validPriority),
      details: rowChecks
        .filter((row) => !row.validPriority)
        .map((row) => `${row.intakeId}: invalid priority`)
        .join(" | ") || "All rows use allowed priorities."
    },
    {
      name: "market_and_form_alignment",
      pass: rowChecks.every((row) => row.marketAndForm.pass),
      details: rowChecks
        .filter((row) => !row.marketAndForm.pass)
        .map((row) => `${row.intakeId}: ${row.marketAndForm.reason}`)
        .join(" | ") || "All rows respect market/form rules."
    },
    {
      name: "pay_gate_blocks_ready_for_live",
      pass: forbiddenLiveRows.length === 0,
      details:
        forbiddenLiveRows.length === 0
          ? "No row claims READY_FOR_LIVE or LIVE while pay gate remains locked."
          : `Rows not allowed while pay gate is locked: ${forbiddenLiveRows
              .map((row) => `${row.intake_id} (${row.domain})`)
              .join(", ")}`
    }
  ];

  return {
    pass: checks.every((check) => check.pass),
    checks,
    rowChecks,
    payGateVerdict,
    rowCount: rows.length
  };
}

async function main() {
  const date = getDateArg();
  const writeOutputs = shouldWriteOutputs();
  const root = process.cwd();

  const boardPath = path.join(root, "docs", "PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md");
  const gateVerdictPath = path.join(root, "docs", "reports", "team1", `PAY_IAI_ONE_GATE_VERDICT_${date}.md`);
  const reportDir = path.join(root, "docs", "reports", "teamd");

  const [boardBody, gateBody] = await Promise.all([
    readFile(boardPath, "utf8"),
    readFile(gateVerdictPath, "utf8").catch(() => null)
  ]);

  const board = extractActiveBoardTable(boardBody);
  const payGateVerdict = gateBody ? readPayGateVerdict(gateBody) : "MISSING";
  const validation = validateIntakeBoard({
    headers: board.headers,
    rows: board.rows,
    payGateVerdict
  });

  const generatedAt = new Date().toISOString();
  const snapshot = {
    generatedAt,
    timezone,
    date,
    boardPath: path.relative(root, boardPath),
    gateVerdictPath: path.relative(root, gateVerdictPath),
    payGateVerdict,
    rowCount: validation.rowCount,
    overallPass: validation.pass,
    checks: validation.checks,
    rowChecks: validation.rowChecks
  };

  const markdown = [
    `# PAY_TEAM_D_INTAKE_BOARD_STATUS_${date}`,
    `- Generated at: ${generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Board source: \`${snapshot.boardPath}\``,
    `- Gate verdict source: \`${snapshot.gateVerdictPath}\``,
    `- pay gate verdict: \`${payGateVerdict}\``,
    `- Row count: ${validation.rowCount}`,
    `- Overall: ${markdownStatus(validation.pass)}`,
    "",
    "## Checks",
    ...validation.checks.map(
      (check) =>
        `- ${markdownStatus(check.pass)} \`${check.name}\`${check.details ? ` — ${check.details}` : ""}`
    ),
    "",
    "## Row Detail",
    ...validation.rowChecks.map((row) => {
      const issues = [];
      if (!row.requiredFields.pass) {
        issues.push(`missing fields: ${row.requiredFields.missing.join(", ")}`);
      }
      if (!row.validStatus) {
        issues.push("invalid status");
      }
      if (!row.validPriority) {
        issues.push("invalid priority");
      }
      if (!row.marketAndForm.pass) {
        issues.push(row.marketAndForm.reason);
      }

      return `- ${markdownStatus(row.pass)} \`${row.intakeId}\` / \`${row.domain}\`${issues.length ? ` — ${issues.join("; ")}` : ""}`;
    }),
    ""
  ].join("\n");

  if (writeOutputs) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(
      path.join(reportDir, `PAY_TEAM_D_INTAKE_BOARD_STATUS_${date}.json`),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      "utf8"
    );
    await writeFile(
      path.join(reportDir, `PAY_TEAM_D_INTAKE_BOARD_STATUS_${date}.md`),
      `${markdown}\n`,
      "utf8"
    );
  }

  process.stdout.write(`${markdown}\n`);

  if (!validation.pass) {
    process.exitCode = 1;
  }
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
