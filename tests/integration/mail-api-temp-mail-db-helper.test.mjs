/**
 * The temporary mail database helper removes its directory, including the
 * -wal and -shm files, when the process ends, however it ends, and does not
 * leak MAIL_DB_URL to this process.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const helperUrl = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "support", "temp-mail-db.mjs")).href;

function runChild(ending) {
  const script = `
    import { writeFileSync } from "node:fs";
    import { useTempMailDatabase } from ${JSON.stringify(helperUrl)};
    const databasePath = useTempMailDatabase();
    for (const suffix of ["", "-wal", "-shm"]) {
      writeFileSync(databasePath + suffix, "x");
    }
    console.log(JSON.stringify({ databasePath, url: process.env.MAIL_DB_URL }));
    ${ending}
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8" });
  const line = result.stdout.trim().split("\n").filter(Boolean).pop();
  return { ...JSON.parse(line), status: result.status };
}

for (const [name, ending, expectedStatus] of [
  ["a normal end", "", 0],
  ["process.exit with a failure code", "process.exit(1);", 1],
  ["an uncaught exception", 'throw new Error("boom");', 1]
]) {
  test(`the temporary mail database is removed after ${name}`, () => {
    const child = runChild(ending);
    assert.equal(child.status, expectedStatus);
    assert.equal(child.url, `sqlite:${child.databasePath}`);
    for (const suffix of ["", "-wal", "-shm"]) {
      assert.equal(existsSync(child.databasePath + suffix), false, suffix || "main file");
    }
    assert.equal(existsSync(path.dirname(child.databasePath)), false);
  });
}

test("the helper does not change MAIL_DB_URL of the process that spawns the child", () => {
  const before = process.env.MAIL_DB_URL;
  runChild("");
  assert.equal(process.env.MAIL_DB_URL, before);
});
