import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..");

/**
 * Some suites read the private iai.one docs pack (`docs/**`), which is
 * deliberately gitignored and so absent on a clean clone or in CI. Returns a
 * `skip` reason when any required path is missing, or `false` when the suite
 * can run. Set REQUIRE_DOCS_FIXTURES=1 where the pack is present to turn a
 * missing fixture into a hard failure instead of a skip.
 */
export function docsFixtureSkip(...relativePaths) {
  if (process.env.REQUIRE_DOCS_FIXTURES === "1") {
    return false;
  }
  const missing = relativePaths.filter((relativePath) => !existsSync(path.join(root, relativePath)));
  return missing.length > 0 ? `private docs pack not present (${missing[0]}); set REQUIRE_DOCS_FIXTURES=1 to enforce` : false;
}
