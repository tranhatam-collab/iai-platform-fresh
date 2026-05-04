import { readFile } from "node:fs/promises";
import path from "node:path";

const surfaces = [
  {
    name: "pay",
    renderPath: "apps/pay/src/render.ts",
    i18nPath: "apps/pay/src/i18n.ts",
    minTranslationCalls: 40,
    requireImageAlt: true
  },
  {
    name: "dash",
    renderPath: "apps/dash/src/render.ts",
    i18nPath: "apps/dash/src/i18n.ts",
    minTranslationCalls: 40,
    requireImageAlt: false
  }
];

function countMatches(source, regex) {
  const matches = source.match(regex);
  return matches ? matches.length : 0;
}

function checkSurface(surface, renderSource, i18nSource) {
  const checks = [];

  const doctypeOk = /<!doctype html>/i.test(renderSource);
  checks.push({
    id: "html_doctype",
    pass: doctypeOk,
    detail: doctypeOk ? "doctype present" : "missing <!doctype html>"
  });

  const htmlLangOk = /<html lang="\$\{escapeHtml\(metadata\.htmlLang\)\}">/.test(renderSource);
  checks.push({
    id: "html_lang_binding",
    pass: htmlLangOk,
    detail: htmlLangOk ? "html lang bound to metadata" : "missing metadata html lang binding"
  });

  const canonicalOk = /<link rel="canonical" href="\$\{escapeHtml\(metadata\.canonical\)\}" \/>/.test(
    renderSource
  );
  checks.push({
    id: "seo_canonical",
    pass: canonicalOk,
    detail: canonicalOk ? "canonical link present" : "missing canonical link"
  });

  const hreflangViOk = /hreflang="vi"/.test(renderSource);
  const hreflangEnOk = /hreflang="en"/.test(renderSource);
  const hreflangDefaultOk = /hreflang="x-default"/.test(renderSource);
  checks.push({
    id: "seo_hreflang",
    pass: hreflangViOk && hreflangEnOk && hreflangDefaultOk,
    detail:
      hreflangViOk && hreflangEnOk && hreflangDefaultOk
        ? "vi/en/x-default present"
        : "missing one or more hreflang links"
  });

  const usesEnDictionary = /content\/en\.json/.test(i18nSource);
  const usesViDictionary = /content\/vi\.json/.test(i18nSource);
  const usesSeoRegistry = /content\/seo-registry\.csv/.test(i18nSource);
  checks.push({
    id: "language_sources",
    pass: usesEnDictionary && usesViDictionary && usesSeoRegistry,
    detail:
      usesEnDictionary && usesViDictionary && usesSeoRegistry
        ? "en/vi/seo registry sources present"
        : "missing one or more shared content sources"
  });

  const translationCallCount = countMatches(renderSource, /t\(locale,\s*"/g);
  const translationDensityOk = translationCallCount >= surface.minTranslationCalls;
  checks.push({
    id: "language_translation_density",
    pass: translationDensityOk,
    detail: `t(locale, ...) calls = ${translationCallCount}, required >= ${surface.minTranslationCalls}`
  });

  if (surface.requireImageAlt) {
    const imageCount = countMatches(renderSource, /<img\b/g);
    const altCount = countMatches(renderSource, /<img[\s\S]*?alt=/g);
    checks.push({
      id: "a11y_alt_text",
      pass: imageCount === altCount,
      detail: `img tags = ${imageCount}, alt attrs = ${altCount}`
    });
  }

  return checks;
}

async function main() {
  const root = process.cwd();
  const results = [];

  for (const surface of surfaces) {
    const [renderSource, i18nSource] = await Promise.all([
      readFile(path.join(root, surface.renderPath), "utf8"),
      readFile(path.join(root, surface.i18nPath), "utf8")
    ]);

    const checks = checkSurface(surface, renderSource, i18nSource);
    results.push({ surface: surface.name, checks });
  }

  let failing = 0;
  for (const result of results) {
    process.stdout.write(`\n[team2-quality-static] surface=${result.surface}\n`);
    for (const check of result.checks) {
      const status = check.pass ? "PASS" : "FAIL";
      process.stdout.write(`- ${status} ${check.id}: ${check.detail}\n`);
      if (!check.pass) {
        failing += 1;
      }
    }
  }

  process.stdout.write(
    `\n[team2-quality-static] overall=${failing === 0 ? "PASS" : "FAIL"}, failing_checks=${failing}\n`
  );

  if (failing > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(
    `[team2-quality-static] failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
