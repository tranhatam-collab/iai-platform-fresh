#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];
const passes = [];
const notes = [];

const surfaceDomains = {
  app: "app.iai.one",
  dash: "dash.iai.one",
  developer: "developer.iai.one",
  docs: "docs.iai.one",
  flow: "flow.iai.one",
  home: "home.iai.one",
  nft: "nft.iai.one",
  "noos-web": "noos.iai.one",
  pay: "pay.iai.one",
  root: "iai.one",
  web: "web.iai.one"
};

const requiredHeadPatterns = [
  { label: "doctype", pattern: /<!doctype html>/i },
  { label: "html lang", pattern: /<html\s+lang=/i },
  { label: "viewport", pattern: /<meta\s+name="viewport"/i },
  { label: "description", pattern: /<meta\s+name="description"/i },
  { label: "canonical", pattern: /rel="canonical"/i },
  { label: "hreflang vi", pattern: /hreflang="\$\{[^}]*htmlLang[^}]*\}"|hreflang="vi"/i },
  { label: "hreflang en", pattern: /hreflang="\$\{[^}]*htmlLang[^}]*\}"|hreflang="en"/i },
  { label: "hreflang x-default", pattern: /hreflang="x-default"/i },
  { label: "og:title", pattern: /property="og:title"/i },
  { label: "og:description", pattern: /property="og:description"/i },
  { label: "og:url", pattern: /property="og:url"/i },
  { label: "og:type", pattern: /property="og:type"/i },
  { label: "og:image", pattern: /property="og:image"/i },
  { label: "twitter:card", pattern: /name="twitter:card"/i },
  { label: "twitter:image", pattern: /name="twitter:image"/i },
  { label: "h1", pattern: /<h1[\s>]/i }
];

function rel(path) {
  return relative(root, path);
}

function addPass(message) {
  passes.push(message);
}

function addNote(message) {
  notes.push(message);
}

function addFailure(message) {
  failures.push(message);
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function run(command, args, label, options = {}) {
  console.log(`\n[quality] ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
    ...options
  });

  if (result.status !== 0) {
    addFailure(`${label} failed with exit code ${result.status ?? "unknown"}.`);
    return false;
  }

  addPass(label);
  return true;
}

function listSurfaceDirs() {
  const appsRoot = join(root, "apps");
  return readdirSync(appsRoot)
    .map((name) => ({
      name,
      dir: join(appsRoot, name),
      renderPath: join(appsRoot, name, "src", "render.ts"),
      i18nPath: join(appsRoot, name, "src", "i18n.ts")
    }))
    .filter((entry) => existsSync(entry.renderPath) && existsSync(entry.i18nPath))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function extractTemplateBlocks(source) {
  const blocks = [];
  const regex = /`([\s\S]*?)`/g;
  let match;
  while ((match = regex.exec(source))) {
    const block = match[1];
    if (/<[a-z!]/i.test(block)) {
      blocks.push(block);
    }
  }
  return blocks;
}

function checkNoMissingImageAlt(surface, source) {
  const imageTags = source.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of imageTags) {
    const hasAlt = /\salt=/.test(tag);
    const isDecorative = /aria-hidden="true"/i.test(tag) || /role="presentation"/i.test(tag);
    if (!hasAlt && !isDecorative) {
      addFailure(`${surface}: image tag is missing alt text: ${tag}`);
    }
  }
}

function checkDuplicateIds(surface, blocks) {
  for (const [index, block] of blocks.entries()) {
    const seen = new Map();
    const idRegex = /\sid="([^"$]+)"/g;
    let match;
    while ((match = idRegex.exec(block))) {
      const id = match[1].trim();
      if (!id || id.includes("${")) {
        continue;
      }
      seen.set(id, (seen.get(id) ?? 0) + 1);
    }

    for (const [id, count] of seen.entries()) {
      if (count > 1) {
        addFailure(`${surface}: duplicate literal id "${id}" appears ${count} times in template block ${index + 1}.`);
      }
    }
  }
}

function checkButtonNames(surface, source) {
  const buttonTags = source.match(/<button\b[\s\S]*?<\/button>/gi) ?? [];
  for (const tag of buttonTags) {
    const hasAriaLabel = /\saria-label=/.test(tag);
    const hasDynamicText = /<button\b[\s\S]*?>[\s\S]*\$\{[\s\S]*?\}[\s\S]*<\/button>/i.test(tag);
    const visibleText = tag
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\$\{[\s\S]*?\}/g, "")
      .trim();
    if (!hasAriaLabel && !hasDynamicText && !visibleText) {
      addFailure(`${surface}: button has no aria-label or visible text: ${tag.slice(0, 160)}...`);
    }
  }
}

function checkHeadingStructure(surface, blocks) {
  for (const [index, block] of blocks.entries()) {
    if (!/<main\b/i.test(block)) {
      continue;
    }
    if (/\$\{\s*(?:localizedBody|body|content|pageBody|mainContent)\s*\}/.test(block)) {
      continue;
    }

    const headings = [...block.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
    if (headings.length === 0) {
      addFailure(`${surface}: main template block ${index + 1} has no heading.`);
      continue;
    }

    if (!headings.includes(1)) {
      addFailure(`${surface}: main template block ${index + 1} has no H1.`);
    }

    for (let i = 1; i < headings.length; i += 1) {
      if (headings[i] - headings[i - 1] > 1) {
        addFailure(
          `${surface}: heading jumps from H${headings[i - 1]} to H${headings[i]} in template block ${index + 1}.`
        );
      }
    }
  }
}

function checkVisibleHardcodedText(surface, blocks) {
  const textRegex = /<(?:h1|h2|h3|p|a|button|li|strong|span)\b[^>]*>([^<]*[A-Za-zÀ-ỹ][^<]*)<\/(?:h1|h2|h3|p|a|button|li|strong|span)>/gi;
  for (const [index, block] of blocks.entries()) {
    let match;
    while ((match = textRegex.exec(block))) {
      const text = match[1].trim();
      if (!text || text.includes("${") || text.includes("&")) {
        continue;
      }

      addFailure(`${surface}: visible hardcoded text in template block ${index + 1}: "${text}"`);
    }
  }
}

function checkHtmlAndSeo(surface) {
  const source = readText(surface.renderPath);
  const blocks = extractTemplateBlocks(source);
  const label = surface.name;

  for (const requirement of requiredHeadPatterns) {
    if (!requirement.pattern.test(source)) {
      addFailure(`${label}: missing ${requirement.label} in ${rel(surface.renderPath)}.`);
    }
  }

  checkNoMissingImageAlt(label, source);
  checkDuplicateIds(label, blocks);
  checkButtonNames(label, source);
  checkHeadingStructure(label, blocks);
  checkVisibleHardcodedText(label, blocks);

  addPass(`${label}: HTML/SEO/a11y source checks executed`);
}

function checkLanguage(surface) {
  const i18nSource = readText(surface.i18nPath);
  const renderSource = readText(surface.renderPath);
  const label = surface.name;

  if (!/type\s+Locale|export\s+type\s+Locale|supportedLocales/.test(i18nSource)) {
    addFailure(`${label}: i18n file does not expose locale typing or supported locales.`);
  }

  if (!/["']en["']/.test(i18nSource) || !/["']vi["']/.test(i18nSource)) {
    addFailure(`${label}: i18n file must define both en and vi locale handling.`);
  }

  const usesSharedContent =
    /content\/en\.json/.test(i18nSource) &&
    /content\/vi\.json/.test(i18nSource) &&
    /seo-registry\.csv/.test(i18nSource);
  const usesLocalI18n =
    /Record<\s*Locale/.test(i18nSource) ||
    /Record<Locale/.test(i18nSource) ||
    /getLocalized[A-Z]/.test(renderSource);

  if (!usesSharedContent && !usesLocalI18n) {
    addFailure(`${label}: no shared content source or explicit local i18n map detected.`);
  }

  if (!/t\(locale,|getLocalized[A-Z]|locale\s*===\s*["']vi["']/.test(renderSource)) {
    addFailure(`${label}: render source does not appear to use locale-aware copy helpers.`);
  }

  addPass(`${label}: language/i18n checks executed`);
}

function checkSeoRegistry() {
  const csvPath = join(root, "content", "seo-registry.csv");
  if (!existsSync(csvPath)) {
    addFailure("content/seo-registry.csv is missing.");
    return;
  }

  const rows = readText(csvPath)
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(",")[0]?.trim())
    .filter(Boolean);
  const rowSet = new Set(rows);

  for (const [surface, domain] of Object.entries(surfaceDomains)) {
    if (surface === "noos-web") {
      addNote("noos-web uses self-contained commerce i18n; seo-registry.csv row is not required by this gate.");
      continue;
    }
    if (!rowSet.has(domain)) {
      addFailure(`SEO registry missing row for ${domain}.`);
    }
  }

  addPass("SEO registry coverage checked");
}

function checkOptionalTooling() {
  const optionalBins = ["eslint", "prettier", "htmlhint", "pa11y-ci", "unlighthouse"];
  for (const bin of optionalBins) {
    const binPath = join(root, "node_modules", ".bin", bin);
    if (existsSync(binPath)) {
      addPass(`optional tool available: ${bin}`);
    } else {
      addNote(`optional tool not installed: ${bin}; built-in quality gate checks are active.`);
    }
  }
}

function checkGitWhitespace() {
  const result = spawnSync("git", ["diff", "--cached", "--check"], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe"
  });

  if (result.status !== 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    addFailure("git diff --cached --check failed.");
    return;
  }

  addPass("Git whitespace check passed");
}

function checkHookFiles() {
  const hookPath = join(root, ".githooks", "pre-commit");
  if (!existsSync(hookPath)) {
    addFailure(".githooks/pre-commit is missing.");
    return;
  }

  const mode = statSync(hookPath).mode;
  if ((mode & 0o111) === 0) {
    addFailure(".githooks/pre-commit is not executable.");
  }

  const packageJson = JSON.parse(readText(join(root, "package.json")));
  if (packageJson.scripts?.["quality:gate"] !== "node scripts/universal-quality-gate.mjs") {
    addFailure("package.json must expose scripts.quality:gate.");
  }
  if (packageJson.scripts?.prepare !== "node scripts/install-git-hooks.mjs") {
    addFailure("package.json must enable hooks through scripts.prepare.");
  }

  addPass("Pre-commit hook wiring checked");
}

console.log("Universal Quality Gate");
console.log(`Repo: ${root}`);

checkHookFiles();
checkOptionalTooling();
checkGitWhitespace();

run("pnpm", ["typecheck"], "Lint/Semantic gate (TypeScript typecheck)");

checkSeoRegistry();

for (const surface of listSurfaceDirs()) {
  checkHtmlAndSeo(surface);
  checkLanguage(surface);
}

console.log("\nQuality Gate Summary");
for (const pass of passes) {
  console.log(`PASS ${pass}`);
}
for (const note of notes) {
  console.log(`NOTE ${note}`);
}

if (failures.length > 0) {
  console.error("\nQuality Gate Failed");
  for (const failure of failures) {
    console.error(`FAIL ${failure}`);
  }
  process.exit(1);
}

console.log("\nQuality Gate Passed");
