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

function shouldWriteOutputs() {
  return !process.argv.includes("--no-write");
}

async function fileExists(absolutePath) {
  try {
    await access(absolutePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function markdownStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function evaluateNamedChecks(body, checks) {
  const results = checks.map((check) => ({
    name: check.name,
    pass: check.pattern.test(body)
  }));

  return {
    pass: results.every((entry) => entry.pass),
    results
  };
}

function evaluateLinkIntegrity(file, body) {
  const absoluteLocalDocLinks = [...body.matchAll(/\]\((\/Users\/[^)]+\/docs\/[^)]+\.md)\)/g)].map(
    (match) => match[1]
  );
  const relativeDocLinks = [...body.matchAll(/\]\(\.\/([^)]+\.md)\)/g)].map((match) => match[1]);

  return {
    file,
    absoluteLocalDocLinks,
    relativeDocLinks,
    pass: absoluteLocalDocLinks.length === 0
  };
}

function pendingDependencyStatus(name, present, bodies) {
  if (present) {
    return {
      name,
      status: "MATERIALIZED",
      pass: true,
      checks: [
        { name: "filePresent", pass: true },
        { name: "readmeDocumentsPendingState", pass: true },
        { name: "packIndexDocumentsPendingState", pass: true },
        { name: "protocolDocumentsPendingState", pass: true },
        { name: "checklistDocumentsPendingState", pass: true }
      ]
    };
  }

  const checks = [
    {
      name: "readmeDocumentsPendingState",
      pass: bodies.readme.includes(name)
    },
    {
      name: "packIndexDocumentsPendingState",
      pass: bodies.packIndex.includes(name)
    },
    {
      name: "protocolDocumentsPendingState",
      pass: bodies.protocol.includes(name)
    },
    {
      name: "checklistDocumentsPendingState",
      pass: bodies.checklist.includes(name)
    }
  ];

  return {
    name,
    status: "PENDING_AND_DOCUMENTED",
    pass: checks.every((entry) => entry.pass),
    checks
  };
}

async function main() {
  const date = getDateArg();
  const writeOutputs = shouldWriteOutputs();
  const root = process.cwd();
  const reportDir = path.join(root, "docs", "reports", "team1");

  const requiredFiles = [
    "docs/PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md",
    "docs/PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md",
    "docs/PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026.md",
    "docs/PAY_IAI_ONE_TEAM_DEV_STARTER_MAP_2026.md",
    "docs/PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md",
    "docs/PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026.md",
    "docs/PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md",
    "docs/PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md",
    "docs/PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md",
    "docs/PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md",
    "docs/PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md",
    "docs/PAY_IAI_ONE_THREE_TEAM_EXECUTION_PLAN_2026.md",
    "docs/README.md"
  ];

  const filePresence = await Promise.all(
    requiredFiles.map(async (relativePath) => ({
      file: relativePath,
      present: await fileExists(path.join(root, relativePath))
    }))
  );

  const readmePath = path.join(root, "docs", "README.md");
  const packIndexPath = path.join(root, "docs", "PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md");
  const masterIndexPath = path.join(root, "docs", "PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md");
  const canonicalIndexPath = path.join(root, "docs", "PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026.md");
  const starterMapPath = path.join(root, "docs", "PAY_IAI_ONE_TEAM_DEV_STARTER_MAP_2026.md");
  const usageProtocolPath = path.join(root, "docs", "PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md");
  const checklistPath = path.join(root, "docs", "PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026.md");

  const [
    readme,
    packIndex,
    masterIndex,
    canonicalIndex,
    starterMap,
    usageProtocol,
    checklist
  ] = await Promise.all([
    readFile(readmePath, "utf8"),
    readFile(packIndexPath, "utf8"),
    readFile(masterIndexPath, "utf8"),
    readFile(canonicalIndexPath, "utf8"),
    readFile(starterMapPath, "utf8"),
    readFile(usageProtocolPath, "utf8"),
    readFile(checklistPath, "utf8")
  ]);

  const readmeHierarchy = evaluateNamedChecks(readme, [
    { name: "payLaneHeading", pattern: /^## pay\.iai\.one$/m },
    { name: "requiredFirstReadHeading", pattern: /^### Required first read$/m },
    { name: "coreBuildPackHeading", pattern: /^### Core build pack$/m },
    { name: "governancePackHeading", pattern: /^### Governance pack$/m },
    { name: "executionAndRiskHeading", pattern: /^### Execution and risk pack$/m },
    { name: "docsUsageProtocolHeading", pattern: /^### Docs usage protocol$/m },
    { name: "repoIntegrationChecklistHeading", pattern: /^### Repo docs integration checklist$/m },
    { name: "acceleratedOverlayHeading", pattern: /^### Current accelerated execution overlay$/m },
    { name: "pendingLockedDependenciesHeading", pattern: /^### Pending locked dependencies$/m },
    {
      name: "readmeLinksPackIndex",
      pattern: /\[PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026\.md\]\(\.\/PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026\.md\)/
    },
    {
      name: "readmeLinksMasterIndex",
      pattern: /\[PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026\.md\]\(\.\/PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026\.md\)/
    },
    {
      name: "readmeLinksChecklist",
      pattern: /\[PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026\.md\]\(\.\/PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026\.md\)/
    },
    {
      name: "readmeMentionsVerifierCommand",
      pattern: /pnpm report:pay-docs-integration/
    }
  ]);

  const packHierarchy = {
    pass: false,
    sections: {
      packIndex: evaluateNamedChecks(packIndex, [
        {
          name: "packIndexCallsItselfNavigationShell",
          pattern: /final repository-ready documentation pack index/i
        },
        {
          name: "packIndexIncludesUsageProtocolAndChecklistLayer",
          pattern: /Pack usage protocol and integration verification/i
        },
        {
          name: "packIndexRegistersChecklistFile",
          pattern: /PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026\.md/
        },
        {
          name: "packIndexMentionsVerifierCommand",
          pattern: /pnpm report:pay-docs-integration/
        }
      ]),
      masterIndex: evaluateNamedChecks(masterIndex, [
        {
          name: "masterIndexLinksPackIndex",
          pattern: /\[PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026\.md\]\(\.\/PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026\.md\)/
        },
        {
          name: "masterIndexLinksUsageProtocol",
          pattern: /\[PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026\.md\]\(\.\/PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026\.md\)/
        },
        {
          name: "masterIndexStatesActualEntryPoint",
          pattern: /actual highest operational and implementation entry point/i
        }
      ]),
      canonicalIndex: evaluateNamedChecks(canonicalIndex, [
        {
          name: "canonicalIndexLinksPackIndex",
          pattern: /\[PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026\.md\]\(\.\/PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026\.md\)/
        },
        {
          name: "canonicalIndexStatesDownstreamPack",
          pattern: /downstream detailed reading pack/i
        },
        {
          name: "canonicalIndexSaysDoesNotOverrideMaster",
          pattern: /không override master execution order/i
        }
      ]),
      starterMap: evaluateNamedChecks(starterMap, [
        {
          name: "starterMapLinksPackIndex",
          pattern: /\[PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026\.md\]\(\.\/PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026\.md\)/
        },
        {
          name: "starterMapStatesNotEntryPoint",
          pattern: /Starter map không phải là entry point ngang cấp với master index/i
        },
        {
          name: "starterMapRequiresMasterPreread",
          pattern: /\[PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026\.md\]\(\.\/PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026\.md\)/
        }
      ])
    }
  };

  packHierarchy.pass = Object.values(packHierarchy.sections).every((section) => section.pass);

  const usageDiscipline = evaluateNamedChecks(usageProtocol, [
    { name: "protocolListsChecklistInRequiredSet", pattern: /Repo integration checklist/i },
    { name: "protocolHasMandatoryStartingSequence", pattern: /mandatory starting sequence/i },
    { name: "protocolUsesDocsPackIndexFirst", pattern: /Step 1[\s\S]*PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026\.md/i },
    {
      name: "protocolUsesMasterBeforeDownstream",
      pattern: /Step 2[\s\S]*PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026\.md[\s\S]*Step 3[\s\S]*PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026\.md/i
    },
    {
      name: "protocolExplainsExecutionBoardAndRiskRegister",
      pattern: /5\.6 Execution board and risk register/i
    },
    {
      name: "protocolExplainsPendingDependencies",
      pattern: /5\.7 Pending dependencies/i
    },
    {
      name: "protocolRequiresChecklistForRepoDocsChanges",
      pattern: /PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026\.md/
    },
    {
      name: "protocolMentionsAutomationCommand",
      pattern: /pnpm report:pay-docs-integration/i
    }
  ]);

  const linkIntegrityChecks = [
    evaluateLinkIntegrity("docs/README.md", readme),
    evaluateLinkIntegrity("docs/PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md", masterIndex),
    evaluateLinkIntegrity("docs/PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026.md", canonicalIndex),
    evaluateLinkIntegrity("docs/PAY_IAI_ONE_TEAM_DEV_STARTER_MAP_2026.md", starterMap)
  ];

  const linkIntegrity = {
    pass:
      linkIntegrityChecks.every((entry) => entry.pass) &&
      linkIntegrityChecks.some((entry) => entry.relativeDocLinks.length > 0),
    checks: linkIntegrityChecks
  };

  const pendingDependencies = [
    {
      name: "PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md",
      present: await fileExists(path.join(root, "docs", "PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md"))
    },
    {
      name: "PAY_IAI_ONE_API_SPEC_FULL_V1.md",
      present: await fileExists(path.join(root, "docs", "PAY_IAI_ONE_API_SPEC_FULL_V1.md"))
    }
  ].map((entry) =>
    pendingDependencyStatus(entry.name, entry.present, {
      readme,
      packIndex,
      protocol: usageProtocol,
      checklist
    })
  );

  const overallPass =
    filePresence.every((entry) => entry.present) &&
    readmeHierarchy.pass &&
    packHierarchy.pass &&
    usageDiscipline.pass &&
    linkIntegrity.pass &&
    pendingDependencies.every((entry) => entry.pass);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    overallPass,
    checks: {
      filePresence,
      readmeHierarchy,
      packHierarchy,
      usageDiscipline,
      linkIntegrity,
      pendingDependencies
    }
  };

  const outputJsonPath = path.join(
    reportDir,
    `PAY_IAI_ONE_REPO_DOCS_INTEGRATION_STATUS_${date}.json`
  );
  const outputMdPath = path.join(
    reportDir,
    `PAY_IAI_ONE_REPO_DOCS_INTEGRATION_STATUS_${date}.md`
  );

  const markdown = [
    `# PAY_IAI_ONE_REPO_DOCS_INTEGRATION_STATUS_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Overall: ${markdownStatus(overallPass)}`,
    "",
    "## File Presence",
    ...filePresence.map((entry) => `- ${entry.present ? "[x]" : "[ ]"} ${entry.file}`),
    "",
    "## README Hierarchy",
    `- Status: ${markdownStatus(readmeHierarchy.pass)}`,
    ...readmeHierarchy.results.map(
      (entry) => `- ${entry.pass ? "[x]" : "[ ]"} ${entry.name}`
    ),
    "",
    "## Pack Hierarchy",
    `- Status: ${markdownStatus(packHierarchy.pass)}`,
    ...Object.entries(packHierarchy.sections).flatMap(([sectionName, section]) => [
      `- ${sectionName}: ${markdownStatus(section.pass)}`,
      ...section.results.map((entry) => `  - ${entry.pass ? "[x]" : "[ ]"} ${entry.name}`)
    ]),
    "",
    "## Usage Discipline",
    `- Status: ${markdownStatus(usageDiscipline.pass)}`,
    ...usageDiscipline.results.map((entry) => `- ${entry.pass ? "[x]" : "[ ]"} ${entry.name}`),
    "",
    "## Link Integrity",
    `- Status: ${markdownStatus(linkIntegrity.pass)}`,
    ...linkIntegrity.checks.flatMap((entry) => [
      `- ${entry.file}: ${markdownStatus(entry.pass)}`,
      ...(entry.absoluteLocalDocLinks.length === 0
        ? ["  - no machine-local absolute docs links"]
        : entry.absoluteLocalDocLinks.map((link) => `  - absolute link: ${link}`)),
      `  - relative link count: ${entry.relativeDocLinks.length}`
    ]),
    "",
    "## Pending Dependencies",
    ...pendingDependencies.flatMap((entry) => [
      `- ${entry.name}: ${entry.status} / ${markdownStatus(entry.pass)}`,
      ...entry.checks.map((check) => `  - ${check.pass ? "[x]" : "[ ]"} ${check.name}`)
    ]),
    ""
  ].join("\n");

  if (writeOutputs) {
    await mkdir(reportDir, { recursive: true });
    await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    await writeFile(outputMdPath, `${markdown}\n`, "utf8");
  }

  process.stdout.write(
    [
      `pay.iai.one repo docs integration snapshot generated for ${date}.`,
      `Overall: ${overallPass ? "PASS" : "FAIL"}.`,
      `Write outputs: ${writeOutputs ? "ENABLED" : "SKIPPED"}.`,
      `JSON: ${writeOutputs ? path.relative(root, outputJsonPath) : "skipped"}`,
      `MD: ${writeOutputs ? path.relative(root, outputMdPath) : "skipped"}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `pay docs integration check failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
