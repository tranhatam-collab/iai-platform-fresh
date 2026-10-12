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
const BUILDS_BACKEND = /\b(createFlowApiRequestHandler|createFlowApiServer|createSmtpInternalBackend|bootstrapFromEnv|openMailQueue)\(/;
const NAMES_DATABASE = /databaseUrl|MAIL_DB_URL|useTempMailDatabase\(/;

export function filesWithoutOwnDatabase(directory) {
  return readdirSync(directory)
    .filter((name) => name.endsWith(".test.mjs"))
    .filter((name) => name !== path.basename(fileURLToPath(import.meta.url)))
    .filter((name) => {
      const source = readFileSync(path.join(directory, name), "utf8");
      return BUILDS_BACKEND.test(source) && !NAMES_DATABASE.test(source);
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
    assert.deepEqual(filesWithoutOwnDatabase(directory), ["shared.test.mjs"]);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});
