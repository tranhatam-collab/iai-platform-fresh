/**
 * Test files that build a mail-api handler or server must not fall back to the
 * shared default database file: `node --test` runs files in parallel, so they
 * would lock each other out and leave data behind. A file that builds one has
 * to name its own database (databaseUrl / MAIL_DB_URL) or call
 * useTempMailDatabase().
 */

import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// Only the top level of tests/integration is scanned: tests/e2e starts services as child processes with their
// own database (see tests/e2e/support/harness.mjs), and the support folders hold no tests.
const SHARED_DEFAULT_PATH = /iai-mail\.db/;
const BUILDS_BACKEND = /\b(createFlowApiRequestHandler|createFlowApiServer|createSmtpInternalBackend|bootstrapFromEnv|openMailQueue)\(/;
const NAMES_DATABASE = /databaseUrl|MAIL_DB_URL|useTempMailDatabase\(/;

// Comments must not satisfy or trigger the check, so they are removed before matching.
function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "");
}

export function filesWithoutOwnDatabase(directory) {
  return readdirSync(directory)
    .filter((name) => name.endsWith(".test.mjs"))
    .filter((name) => name !== path.basename(fileURLToPath(import.meta.url)))
    .filter((name) => {
      const source = withoutComments(readFileSync(path.join(directory, name), "utf8"));
      return BUILDS_BACKEND.test(source) && (!NAMES_DATABASE.test(source) || SHARED_DEFAULT_PATH.test(source));
    })
    .sort();
}

test("every integration test file that builds a mail-api backend names its own database", () => {
  assert.deepEqual(filesWithoutOwnDatabase(here), []);
});

test("the check flags a file that builds a backend without naming a database", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "iai-isolation-check-"));
  try {
    writeFileSync(path.join(directory, "shared.test.mjs"), "const handler = createFlowApiRequestHandler();\n");
    writeFileSync(path.join(directory, "explicit.test.mjs"), 'createSmtpInternalBackend({ databaseUrl: "sqlite:x" });\n');
    writeFileSync(path.join(directory, "helper.test.mjs"), "useTempMailDatabase();\nbootstrapFromEnv(env);\n");
    writeFileSync(path.join(directory, "unrelated.test.mjs"), "assert.ok(true);\n");
    // A commented-out helper call or a mention in a comment does not count as naming a database.
    writeFileSync(path.join(directory, "commented.test.mjs"), "// useTempMailDatabase();\n/* MAIL_DB_URL */\nbootstrapFromEnv(env);\n");
    // Naming the shared default file is the problem, not a fix.
    writeFileSync(path.join(directory, "default-path.test.mjs"), 'process.env.MAIL_DB_URL = "sqlite:/tmp/iai-mail.db";\ncreateFlowApiRequestHandler();\n');
    assert.deepEqual(filesWithoutOwnDatabase(directory), ["commented.test.mjs", "default-path.test.mjs", "shared.test.mjs"]);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});
