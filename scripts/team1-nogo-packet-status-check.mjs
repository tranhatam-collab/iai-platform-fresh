import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
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
  if (explicit) {
    return explicit.slice("--date=".length);
  }
  return todayInTimezone(timezone);
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

async function fileExists(absolutePath) {
  try {
    await access(absolutePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function readBacktickField(body, fieldName) {
  const pattern = new RegExp(`^- ${fieldName}:\\s*\\\`([^\\\`]+)\\\``, "m");
  const match = body.match(pattern);
  return match?.[1] ?? "";
}

function evaluatePacket(packet, body) {
  const todoCount = body
    .split("\n")
    .filter((line) => line.includes("TODO")).length;
  const commitRef = readBacktickField(body, "Commit / branch");
  const targetEnvironment = readBacktickField(body, "Target environment");
  const ownerSignoff = readBacktickField(body, "Owner sign-off");
  const finalStatus = readBacktickField(body, "Final status");

  const checks = {
    noTodo: todoCount === 0,
    commitRef: commitRef.length > 0 && commitRef !== "TODO",
    targetEnvironment: targetEnvironment.length > 0 && targetEnvironment !== "TODO",
    ownerSignoff: ownerSignoff.length > 0 && !/PENDING/i.test(ownerSignoff),
    finalStatus:
      finalStatus.length > 0 &&
      !/BLOCKED/i.test(finalStatus) &&
      !/PENDING/i.test(finalStatus)
  };

  return {
    ...packet,
    todoCount,
    fields: {
      commitRef,
      targetEnvironment,
      ownerSignoff,
      finalStatus
    },
    checks,
    pass: Object.values(checks).every(Boolean)
  };
}

async function main() {
  const date = getDateArg();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");

  const packets = [
    {
      domain: "developer.iai.one",
      owner: "Team A",
      path: "docs/release-evidence/developer.iai.one/DEVELOPER_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md"
    },
    {
      domain: "cios.iai.one",
      owner: "Team C",
      path: "docs/release-evidence/cios.iai.one/CIOS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md"
    },
    {
      domain: "cdn.iai.one",
      owner: "Team B",
      path: "docs/release-evidence/cdn.iai.one/CDN_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md"
    },
    {
      domain: "flows.iai.one",
      owner: "Team B",
      path: "docs/release-evidence/flows.iai.one/FLOWS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md"
    }
  ];

  const checks = await Promise.all(
    packets.map(async (packet) => {
      const absolutePath = path.join(root, packet.path);
      const present = await fileExists(absolutePath);
      if (!present) {
        return {
          ...packet,
          present: false,
          pass: false,
          todoCount: -1,
          fields: {
            commitRef: "",
            targetEnvironment: "",
            ownerSignoff: "",
            finalStatus: ""
          },
          checks: {
            noTodo: false,
            commitRef: false,
            targetEnvironment: false,
            ownerSignoff: false,
            finalStatus: false
          }
        };
      }

      const body = await readFile(absolutePath, "utf8");
      return {
        present: true,
        ...evaluatePacket(packet, body)
      };
    })
  );

  const overallPass = checks.every((entry) => entry.pass);
  const blockingDomains = checks.filter((entry) => !entry.pass).map((entry) => entry.domain);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    overallPass,
    blockingDomains,
    checks
  };

  await mkdir(reportDir, { recursive: true });

  const outputJsonPath = path.join(reportDir, `TEAM1_NO_GO_PACKET_STATUS_${date}.json`);
  const outputMdPath = path.join(reportDir, `TEAM1_NO_GO_PACKET_STATUS_${date}.md`);

  await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# TEAM1_NO_GO_PACKET_STATUS_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Overall: ${markdownStatus(overallPass)}`,
    "",
    "## Packet checks",
    ...checks.flatMap((entry) => [
      `- ${entry.domain} (${entry.owner}): ${markdownStatus(entry.pass)}`,
      `  - path: ${entry.path}`,
      `  - file present: ${markdownStatus(entry.present)}`,
      `  - TODO count: ${entry.todoCount}`,
      `  - commit ref: ${markdownStatus(entry.checks.commitRef)} (${entry.fields.commitRef || "missing"})`,
      `  - target environment: ${markdownStatus(entry.checks.targetEnvironment)} (${entry.fields.targetEnvironment || "missing"})`,
      `  - owner sign-off: ${markdownStatus(entry.checks.ownerSignoff)} (${entry.fields.ownerSignoff || "missing"})`,
      `  - final status: ${markdownStatus(entry.checks.finalStatus)} (${entry.fields.finalStatus || "missing"})`
    ]),
    "",
    "## Blocking domains",
    ...(blockingDomains.length === 0 ? ["- none"] : blockingDomains.map((domain) => `- ${domain}`)),
    ""
  ].join("\n");

  await writeFile(outputMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `NO-GO packet snapshot generated for ${date}.`,
      `Overall: ${overallPass ? "PASS" : "FAIL"}.`,
      `JSON: ${path.relative(root, outputJsonPath)}`,
      `MD: ${path.relative(root, outputMdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `no-go packet status check failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
