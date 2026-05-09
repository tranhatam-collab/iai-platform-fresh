import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";

const requiredLanguageFiles = [
  "docs/IAI_UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_COMMAND_2026.md",
  "docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md",
  "content/iai-language-codex.md",
  "content/iai-ui-copy-registry.md",
  "content/iai-ui-text-system.md",
  "content/vi.json",
  "content/en.json",
  "content/seo-registry.csv"
];

const lockedLanguageDecisions = [
  "Tiếng Việt là nguồn chuẩn nội dung của toàn hệ.",
  "Tiếng Anh là lớp quốc tế thứ hai và không được phép dùng fallback dịch máy.",
  "Mọi public text phải đi qua shared content source hoặc registry đã khóa.",
  "Mỗi surface public phải có metadata song ngữ riêng theo locale đang render.",
  "Không được live page public khi còn hard-coded text, text placeholder hoặc text lẫn ngôn ngữ."
];

const surfaces = [
  { appId: "root", baseUrl: "https://iai.one", renderPath: "apps/root/src/render.ts", serverPath: "apps/root/src/server.ts", i18nPath: "apps/root/src/i18n.ts" },
  { appId: "home", baseUrl: "https://home.iai.one", renderPath: "apps/home/src/render.ts", serverPath: "apps/home/src/server.ts", i18nPath: "apps/home/src/i18n.ts" },
  { appId: "app", baseUrl: "https://app.iai.one", renderPath: "apps/app/src/render.ts", serverPath: "apps/app/src/server.ts", i18nPath: "apps/app/src/i18n.ts" },
  { appId: "flow", baseUrl: "https://flow.iai.one", renderPath: "apps/flow/src/render.ts", serverPath: "apps/flow/src/server.ts", i18nPath: "apps/flow/src/i18n.ts" },
  { appId: "docs", baseUrl: "https://docs.iai.one", renderPath: "apps/docs/src/render.ts", serverPath: "apps/docs/src/server.ts", i18nPath: "apps/docs/src/i18n.ts" },
  { appId: "developer", baseUrl: "https://developer.iai.one", renderPath: "apps/developer/src/render.ts", serverPath: "apps/developer/src/server.ts", i18nPath: "apps/developer/src/i18n.ts", publicDir: "apps/developer/public" },
  { appId: "nft", baseUrl: "https://nft.iai.one", renderPath: "apps/nft/src/render.ts", serverPath: "apps/nft/src/server.ts", i18nPath: "apps/nft/src/i18n.ts" },
  { appId: "pay", baseUrl: "https://pay.iai.one", renderPath: "apps/pay/src/render.ts", serverPath: "apps/pay/src/server.ts", i18nPath: "apps/pay/src/i18n.ts" },
  { appId: "dash", baseUrl: "https://dash.iai.one", renderPath: "apps/dash/src/render.ts", serverPath: "apps/dash/src/server.ts", i18nPath: "apps/dash/src/i18n.ts" },
  { appId: "web", baseUrl: "https://web.iai.one", renderPath: "apps/web/src/render.ts", serverPath: "apps/web/src/server.ts", i18nPath: "apps/web/src/i18n.ts" },
  { appId: "noos-web", baseUrl: "https://noos.iai.one", renderPath: "apps/noos-web/src/render.ts", serverPath: "apps/noos-web/src/server.ts", i18nPath: "apps/noos-web/src/i18n.ts" }
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

function getArg(name) {
  const explicit = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  return explicit ? explicit.slice(name.length + 3) : null;
}

function getDateArg() {
  return getArg("date") ?? todayInTimezone(timezone);
}

async function fileExists(absolutePath) {
  try {
    await access(absolutePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readText(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!(await fileExists(absolutePath))) {
    return "";
  }
  return readFile(absolutePath, "utf8");
}

function dedupe(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function normalizeRoute(route) {
  if (!route || route === "/") {
    return "/";
  }
  return route.replace(/\/+$/, "");
}

function isPublicRoute(route) {
  if (!route || !route.startsWith("/") || route === "/health") {
    return false;
  }

  return !(
    route.startsWith("/v1/") ||
    route.startsWith("/events") ||
    route.startsWith("/api/") ||
    route.startsWith("/realtime/") ||
    route.includes("/:") ||
    route.includes("${")
  );
}

function extractRoutesFromServer(source = "") {
  const routes = [];
  const pathnameMatches = source.matchAll(/(?:url\.pathname|pathname)\s*===\s*"([^"]+)"/g);
  for (const match of pathnameMatches) {
    const route = normalizeRoute(match[1]);
    if (isPublicRoute(route)) {
      routes.push(route);
    }
  }
  return routes;
}

function extractRoutesFromRender(source = "") {
  const routes = [];
  const localizedPathMatches = source.matchAll(/buildLocalizedPath\("([^"]+)"/g);
  for (const match of localizedPathMatches) {
    const route = normalizeRoute(match[1]);
    if (isPublicRoute(route)) {
      routes.push(route);
    }
  }

  const caseMatches = source.matchAll(/case\s+"([^"]+)":/g);
  for (const match of caseMatches) {
    const route = normalizeRoute(match[1]);
    if (isPublicRoute(route)) {
      routes.push(route);
    }
  }

  return routes;
}

function extractRoutesFromPublicFiles(publicFiles = []) {
  return publicFiles.map((relativePath) => {
    const normalized = relativePath.replace(/\\/g, "/");
    if (normalized.endsWith("/index.html")) {
      const route = normalized
        .replace(/^apps\/[^/]+\/public/, "")
        .replace(/\/index\.html$/, "");
      return normalizeRoute(route || "/");
    }

    if (normalized.endsWith(".html")) {
      const route = normalized
        .replace(/^apps\/[^/]+\/public/, "")
        .replace(/\.html$/, "");
      return normalizeRoute(route || "/");
    }

    return "";
  }).filter((route) => route && isPublicRoute(route));
}

function collectPublicLiteralCandidates(source = "", file = "") {
  const candidates = [];
  const lineMatches = source.matchAll(/>([^<${}\n]{4,})</g);
  for (const match of lineMatches) {
    const value = match[1].replace(/\s+/g, " ").trim();
    if (value && /[A-Za-zÀ-ỹ]/.test(value)) {
      candidates.push({ file, kind: "html-node", value });
    }
  }

  const quotedMatches = source.matchAll(/["'`]([^"'`\n]{6,})["'`]/g);
  for (const match of quotedMatches) {
    const value = match[1].trim();
    const start = Math.max(0, match.index - 80);
    const end = Math.min(source.length, match.index + match[0].length + 80);
    const context = source.slice(start, end);
    if (!value) {
      continue;
    }
    if (
      value.includes("${") ||
      value.includes("<") ||
      value.includes(">") ||
      value.includes("=") ||
      value.includes("{") ||
      value.includes("}")
    ) {
      continue;
    }
    if (/^(IBM Plex|Space Grotesk|Aptos|Segoe UI)/i.test(value)) {
      continue;
    }
    if (value.split(/\s+/).every((part) => /^[a-z-]+$/i.test(part))) {
      continue;
    }
    if (value.startsWith("http") || value.startsWith("/") || value.startsWith("#")) {
      continue;
    }
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) {
      continue;
    }
    if (/^[a-z0-9._:/-]+$/i.test(value)) {
      continue;
    }
    if (!/\s/.test(value)) {
      continue;
    }
    if (!/[A-Za-zÀ-ỹ]/.test(value)) {
      continue;
    }
    if (
      !/(<h[1-6]|<p|<a|<button|aria-label|placeholder|description|title|label|lede|eyebrow)/i.test(
        context
      )
    ) {
      continue;
    }
    candidates.push({ file, kind: "quoted-copy", value });
  }

  return dedupe(candidates.map((entry) => `${entry.file}::${entry.kind}::${entry.value}`)).map((entry) => {
    const [entryFile, kind, value] = entry.split("::");
    return { file: entryFile, kind, value };
  });
}

function parseCsvLine(line = "") {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (character === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

function parseSeoRegistry(csv = "") {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length <= 1) {
    return [];
  }

  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]));
  });
}

function collectHeadChecks(renderSource = "") {
  const hasDynamicAlternateLinks =
    /supportedLocales[\s\S]*hreflang="\$\{localeMeta\[entry\]\.htmlLang\}"/.test(renderSource);

  return {
    hasTitle: /<title>[\s\S]*<\/title>/.test(renderSource),
    hasDescription: /<meta\s+name="description"\s+content=/.test(renderSource),
    hasCanonical: /<link\s+rel="canonical"\s+href=/.test(renderSource),
    hasHreflangVi: /hreflang="vi"/.test(renderSource) || hasDynamicAlternateLinks,
    hasHreflangEn: /hreflang="en"/.test(renderSource) || hasDynamicAlternateLinks,
    hasHreflangXDefault: /hreflang="x-default"/.test(renderSource),
    hasJsonLd: /application\/ld\+json/.test(renderSource),
    hasOgTitle: /property="og:title"/.test(renderSource),
    hasOgDescription: /property="og:description"/.test(renderSource),
    hasOgUrl: /property="og:url"/.test(renderSource),
    hasOgType: /property="og:type"/.test(renderSource),
    hasTwitterCard: /name="twitter:card"/.test(renderSource),
    hasTwitterTitle: /name="twitter:title"/.test(renderSource),
    hasTwitterDescription: /name="twitter:description"/.test(renderSource),
    hasOgImage: /property="og:image"/.test(renderSource),
    hasTwitterImage: /name="twitter:image"/.test(renderSource)
  };
}

function collectAltStats(renderSource = "") {
  const imageCount = [...renderSource.matchAll(/<img\b/g)].length;
  const all = [...renderSource.matchAll(/<img[\s\S]*?alt=/g)].length;
  const localized =
    [...renderSource.matchAll(/alt="\$\{escapeHtml\(t\(locale,/g)].length +
    [...renderSource.matchAll(/alt="\$\{escapeHtml\([A-Za-z0-9_.]+\)\}"/g)].length;

  return {
    imageCount,
    totalAltAttributes: all,
    localizedAltAttributes: localized
  };
}

function collectUiSignalStats(renderSource = "") {
  return {
    formKeys: [...renderSource.matchAll(/t\(locale,\s*"form\./g)].length,
    placeholderKeys: [...renderSource.matchAll(/t\(locale,\s*"ph\./g)].length,
    buttonKeys:
      [...renderSource.matchAll(/t\(locale,\s*"btn\./g)].length +
      [...renderSource.matchAll(/t\(locale,\s*"noos\.btn\./g)].length,
    navKeys:
      [...renderSource.matchAll(/t\(locale,\s*"nav\./g)].length +
      [...renderSource.matchAll(/t\(locale,\s*"noos\.nav\./g)].length,
    footerKeys:
      [...renderSource.matchAll(/t\(locale,\s*"footer\./g)].length +
      [...renderSource.matchAll(/t\(locale,\s*"[^"]*footer[^"]*"/g)].length
  };
}

function countFalseEntries(object) {
  return Object.values(object).filter((value) => value === false).length;
}

async function main() {
  const root = process.cwd();
  const date = getDateArg();
  const reportDir = path.join(root, "docs", "reports", "team1");
  const seoRegistry = parseSeoRegistry(await readText(root, "content/seo-registry.csv"));
  const seoBySurface = new Map(seoRegistry.map((entry) => [entry.surface, entry]));

  const globalFiles = await Promise.all(
    requiredLanguageFiles.map(async (relativePath) => ({
      file: relativePath,
      present: await fileExists(path.join(root, relativePath))
    }))
  );

  const missingGlobalFiles = globalFiles.filter((entry) => !entry.present).map((entry) => entry.file);

  const surfaceResults = [];
  let totalRoutes = 0;
  let pagesBlocked = 0;
  let vietnameseIssueCount = 0;
  let englishIssueCount = 0;
  let metadataIssueCount = 0;
  let altIssueCount = 0;
  let uiTextIssueCount = 0;

  for (const surface of surfaces) {
    const [renderSource, serverSource, i18nSource] = await Promise.all([
      readText(root, surface.renderPath),
      readText(root, surface.serverPath),
      readText(root, surface.i18nPath)
    ]);

    const renderRoutes = extractRoutesFromRender(renderSource);
    const serverRoutes = extractRoutesFromServer(serverSource);
    const publicRoutes = extractRoutesFromPublicFiles(
      surface.publicDir
        ? (await listPublicFiles(path.join(root, surface.publicDir))).map((absolutePath) =>
            path.relative(root, absolutePath)
          )
        : []
    );
    const routes = dedupe([...renderRoutes, ...serverRoutes, ...publicRoutes]);
    const localizedUrlCount = routes.length * 2;
    totalRoutes += localizedUrlCount;

    const contentSourceChecks = {
      usesSharedContentEn: /content\/en\.json/.test(i18nSource),
      usesSharedContentVi: /content\/vi\.json/.test(i18nSource),
      usesSeoRegistry: /content\/seo-registry\.csv/.test(i18nSource)
    };
    const headChecks = collectHeadChecks(renderSource);
    const altStats = collectAltStats(renderSource);
    const uiSignals = collectUiSignalStats(renderSource);
    const hardcodedCandidates = collectPublicLiteralCandidates(renderSource, surface.renderPath);

    const missingSurfaceSeoRow = !seoBySurface.has(`${surface.appId}.iai.one`) &&
      !seoBySurface.has(surface.baseUrl.replace("https://", "").replace(/\/$/, ""));

    const issues = [];
    if (missingSurfaceSeoRow) {
      issues.push(`Thiếu dòng SEO registry cho surface ${surface.appId}.`);
      metadataIssueCount += 1;
    }
    if (!contentSourceChecks.usesSharedContentVi) {
      issues.push("Không đọc content/vi.json từ lớp i18n.");
      vietnameseIssueCount += 1;
    }
    if (!contentSourceChecks.usesSharedContentEn) {
      issues.push("Không đọc content/en.json từ lớp i18n.");
      englishIssueCount += 1;
    }
    if (!contentSourceChecks.usesSeoRegistry) {
      issues.push("Không đọc content/seo-registry.csv từ lớp i18n.");
      metadataIssueCount += 1;
    }

    const missingHeadChecks = Object.entries(headChecks)
      .filter(([, pass]) => !pass)
      .map(([name]) => name);
    metadataIssueCount += missingHeadChecks.length;
    if (missingHeadChecks.length > 0) {
      issues.push(`Thiếu metadata head: ${missingHeadChecks.join(", ")}.`);
    }

    if (altStats.imageCount > altStats.totalAltAttributes) {
      altIssueCount += altStats.imageCount - altStats.totalAltAttributes;
      issues.push("Có image tag nhưng thiếu alt text.");
    } else if (altStats.totalAltAttributes > 0 && altStats.localizedAltAttributes < altStats.totalAltAttributes) {
      altIssueCount += altStats.totalAltAttributes - altStats.localizedAltAttributes;
      issues.push("Có alt text chưa chứng minh được là locale-aware.");
    }

    if (hardcodedCandidates.length > 0) {
      uiTextIssueCount += 1;
      issues.push("Còn candidate hard-coded public text trong render source.");
    }

    if (uiSignals.buttonKeys === 0 || uiSignals.navKeys === 0 || uiSignals.footerKeys === 0) {
      uiTextIssueCount += 1;
      issues.push("UI copy chưa đi qua đầy đủ key hệ thống cho nav/button/footer.");
    }

    if (issues.length > 0) {
      pagesBlocked += routes.length || 1;
    }

    surfaceResults.push({
      appId: surface.appId,
      baseUrl: surface.baseUrl,
      localizedUrlCount,
      routeInventory: routes.map((route) => ({
        route,
        sampleEn: `${surface.baseUrl}${route === "/" ? "/" : route}?lang=en`,
        sampleVi: `${surface.baseUrl}${route === "/" ? "/" : route}`
      })),
      contentSourceChecks,
      headChecks,
      altStats,
      uiSignals,
      hardcodedCandidates: hardcodedCandidates.slice(0, 20),
      issueCount: issues.length,
      issues
    });
  }

  const pendingPages = surfaceResults
    .filter((surface) => surface.issueCount > 0)
    .flatMap((surface) =>
      surface.routeInventory.length > 0
        ? surface.routeInventory.map((route) => ({
            appId: surface.appId,
            route: route.route,
            issueCount: surface.issueCount
          }))
        : [{ appId: surface.appId, route: "(surface-root)", issueCount: surface.issueCount }]
    );

  const overallPass =
    missingGlobalFiles.length === 0 &&
    pendingPages.length === 0 &&
    metadataIssueCount === 0 &&
    altIssueCount === 0 &&
    uiTextIssueCount === 0;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    summary: {
      totalUrlsAudited: totalRoutes,
      totalPagesFlagged: pagesBlocked,
      vietnameseIssuesOpen: vietnameseIssueCount,
      englishIssuesOpen: englishIssueCount,
      metadataIssuesOpen: metadataIssueCount,
      altTextIssuesOpen: altIssueCount,
      ctaFormMenuFooterIssuesOpen: uiTextIssueCount
    },
    globalFiles,
    missingGlobalFiles,
    lockedLanguageDecisions,
    surfaceResults,
    pendingPages,
    finalConfirmation: {
      vietnameseReady: vietnameseIssueCount === 0,
      englishReady: englishIssueCount === 0,
      seoReady: metadataIssueCount === 0 && missingGlobalFiles.length === 0,
      liveReady: overallPass
    }
  };

  await mkdir(reportDir, { recursive: true });
  const jsonPath = path.join(reportDir, `UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT_${date}.json`);
  const mdPath = path.join(reportDir, `UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT_${date}.md`);
  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const markdown = [
    `# UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT_${date}`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Total URLs audited: ${snapshot.summary.totalUrlsAudited}`,
    `- Total pages flagged: ${snapshot.summary.totalPagesFlagged}`,
    `- Vietnamese issues open: ${snapshot.summary.vietnameseIssuesOpen}`,
    `- English issues open: ${snapshot.summary.englishIssuesOpen}`,
    `- Metadata issues open: ${snapshot.summary.metadataIssuesOpen}`,
    `- Alt text issues open: ${snapshot.summary.altTextIssuesOpen}`,
    `- CTA/form/menu/footer issues open: ${snapshot.summary.ctaFormMenuFooterIssuesOpen}`,
    "",
    "## Locked Decisions",
    ...lockedLanguageDecisions.map((entry) => `- ${entry}`),
    "",
    "## Global Sources",
    ...globalFiles.map((entry) => `- ${entry.present ? "[x]" : "[ ]"} ${entry.file}`),
    "",
    "## Surface Audit",
    ...surfaceResults.flatMap((surface) => [
      `### ${surface.appId}`,
      `- Base URL: ${surface.baseUrl}`,
      `- Localized URL count: ${surface.localizedUrlCount}`,
      `- Issues: ${surface.issueCount}`,
      `- Content source: en=${surface.contentSourceChecks.usesSharedContentEn ? "PASS" : "FAIL"}, vi=${surface.contentSourceChecks.usesSharedContentVi ? "PASS" : "FAIL"}, seo=${surface.contentSourceChecks.usesSeoRegistry ? "PASS" : "FAIL"}`,
      `- Metadata head: ${countFalseEntries(surface.headChecks) === 0 ? "PASS" : `FAIL (${Object.entries(surface.headChecks).filter(([, pass]) => !pass).map(([name]) => name).join(", ")})`}`,
      `- Alt stats: total=${surface.altStats.totalAltAttributes}, localized=${surface.altStats.localizedAltAttributes}`,
      `- UI registry signals: nav=${surface.uiSignals.navKeys}, btn=${surface.uiSignals.buttonKeys}, form=${surface.uiSignals.formKeys}, placeholder=${surface.uiSignals.placeholderKeys}, footer=${surface.uiSignals.footerKeys}`,
      ...surface.routeInventory.slice(0, 12).map((route) => `- Route: ${route.route} | VI ${route.sampleVi} | EN ${route.sampleEn}`),
      ...surface.hardcodedCandidates.slice(0, 10).map((candidate) => `- Hard-coded candidate (${candidate.kind}): ${candidate.value}`),
      ...surface.issues.map((issue) => `- Issue: ${issue}`),
      ""
    ]),
    "## Pending Pages",
    ...(pendingPages.length === 0
      ? ["- none"]
      : pendingPages.slice(0, 200).map((entry) => `- ${entry.appId} ${entry.route} (${entry.issueCount} issues)`)),
    "",
    "## Final Confirmation",
    `- Du chuan tieng Viet: ${snapshot.finalConfirmation.vietnameseReady ? "YES" : "NO"}`,
    `- Du chuan tieng Anh: ${snapshot.finalConfirmation.englishReady ? "YES" : "NO"}`,
    `- Du chuan SEO: ${snapshot.finalConfirmation.seoReady ? "YES" : "NO"}`,
    `- Du chuan live: ${snapshot.finalConfirmation.liveReady ? "YES" : "NO"}`,
    ""
  ].join("\n");

  await writeFile(mdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Universal bilingual language rebuild audit generated for ${date}.`,
      `Live ready: ${snapshot.finalConfirmation.liveReady ? "PASS" : "FAIL"}.`,
      `JSON: ${path.relative(root, jsonPath)}`,
      `MD: ${path.relative(root, mdPath)}`
    ].join("\n")
  );
}

async function listPublicFiles(absoluteDir) {
  const entries = await readDirectorySafe(absoluteDir);
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listPublicFiles(absolutePath)));
    } else {
      files.push(absolutePath);
    }
  }

  return files;
}

async function readDirectorySafe(absoluteDir) {
  try {
    return readdir(absoluteDir, { withFileTypes: true });
  } catch {
    return [];
  }
}

main().catch((error) => {
  process.stderr.write(
    `universal bilingual language rebuild audit failed: ${
      error instanceof Error ? error.message : String(error)
    }\n`
  );
  process.exitCode = 1;
});
