/**
 * Gives a test file its own mail database.
 *
 * A handler or server built without an explicit `databaseUrl` opens whatever
 * MAIL_DB_URL names, falling back to a fixed file under the system temp
 * directory. `node --test` runs files in parallel, so files sharing that file
 * lock each other out and leave data behind. Call this once at the top of any
 * test file that builds a mail-api handler or server without its own database:
 * it points MAIL_DB_URL at a fresh directory and removes it (with its -wal and
 * -shm files) when the process exits.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function useTempMailDatabase() {
  const directory = mkdtempSync(path.join(tmpdir(), "iai-mail-test-"));
  const databasePath = path.join(directory, "mail.db");
  process.env.MAIL_DB_URL = `sqlite:${databasePath}`;
  process.on("exit", () => {
    rmSync(directory, { force: true, recursive: true });
  });
  return databasePath;
}
