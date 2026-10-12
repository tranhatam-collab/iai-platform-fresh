/**
 * Opening the store while another process briefly holds the database lock waits for it instead of failing
 * at once. Starting several workers or services together on one database file depends on this: switching
 * the journal mode to WAL takes a lock too, and it used to run before the wait was configured.
 */

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";

const HOLD_MS = 500;
const SEED = {
  blockedRecipient: "blocked@example.com",
  defaultSender: "ops@opencontention.example",
  password: "smtp-secret",
  primaryDomain: "opencontention.example",
  username: "user-opencontention",
  workspaceId: "ws_opencontention"
};

/** Starts a process that holds an exclusive lock on the file for HOLD_MS and resolves once it holds it. */
function holdExclusiveLock(dbPath) {
  const script = `
    import { DatabaseSync } from "node:sqlite";
    const db = new DatabaseSync(${JSON.stringify(dbPath)});
    db.exec("BEGIN EXCLUSIVE;");
    process.stdout.write("held\\n");
    setTimeout(() => { db.exec("ROLLBACK;"); db.close(); }, ${HOLD_MS});
  `;
  const child = spawn(process.execPath, ["--input-type=module", "-e", script], { stdio: ["ignore", "pipe", "inherit"] });
  const held = new Promise((resolve, reject) => {
    child.stdout.on("data", (chunk) => String(chunk).includes("held") && resolve());
    child.on("error", reject);
    child.on("exit", (code) => code !== 0 && reject(new Error(`lock holder exited with ${code}`)));
  });
  const done = new Promise((resolve) => child.on("exit", resolve));
  return { done, held };
}

test("opening the store waits for a lock held by another process instead of failing at once", async () => {
  const dbPath = `/tmp/iai-mail-api-opencontention-${randomUUID()}.sqlite`;
  try {
    // A database file that is not in WAL mode yet, as a fresh deployment's is: switching it needs the lock.
    const prepared = new DatabaseSync(dbPath);
    prepared.exec("CREATE TABLE placeholder (id INTEGER);");
    prepared.close();

    const holder = holdExclusiveLock(dbPath);
    await holder.held;
    const started = Date.now();
    const backend = createSmtpInternalBackend({ apiKey: "mail-api-key-for-tests", databaseUrl: `sqlite:${dbPath}`, seed: SEED });
    const waited = Date.now() - started;
    backend.close();
    await holder.done;

    assert.ok(waited >= HOLD_MS / 2, `opened after ${waited} ms: it did not wait for the lock holder`);
    assert.ok(waited < 2000 + HOLD_MS, `opened after ${waited} ms`);
  } finally {
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(`${dbPath}${suffix}`, { force: true });
    }
  }
});
