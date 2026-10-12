/**
 * Child process for the claim race test: opens the mail-api backend on a shared SQLite file, signals
 * that it is ready, waits until every claimer is ready, then claims jobs until none is due and prints
 * what it won as JSON.
 *
 * The start barrier is a directory: each claimer writes one file into it once its backend is open and
 * starts claiming only when <count> files exist, so a slow start (module load, migrations on a busy
 * machine) delays everybody instead of letting one process finish before the others begin.
 *
 * Usage: node queue-claimer.mjs <sqlite url> <barrier directory> <number of claimers>
 */
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { createSmtpInternalBackend } from "../../../apps/mail-api/dist/smtp-internal.js";

const [url, barrierDirectory, claimerCount] = process.argv.slice(2);

const backend = createSmtpInternalBackend({
  apiKey: "mail-api-key-for-tests",
  databaseUrl: url,
  seed: {
    blockedRecipient: "blocked@example.com",
    defaultSender: "ops@queue.example",
    password: "smtp-secret",
    primaryDomain: "queue.example",
    username: "user-queue",
    workspaceId: "ws_queue"
  }
});

writeFileSync(path.join(barrierDirectory, `ready-${process.pid}`), "");
const barrierDeadline = Date.now() + 60_000;
while (readdirSync(barrierDirectory).length < Number(claimerCount)) {
  if (Date.now() > barrierDeadline) {
    throw new Error("queue-claimer: the other claimers did not become ready within 60 seconds");
  }
}

// A claim that loses a race returns nothing, exactly like an empty queue, so keep going until no
// job is left queued.
const reader = new DatabaseSync(new URL(url).pathname);
const queued = () => reader.prepare("SELECT COUNT(*) AS count FROM smtp_queue_jobs WHERE status = 'queued';").get().count;

// Under heavy load a claim can also run out of patience waiting for the write lock and throw "database is
// locked". The worker loop treats that as a failed poll and tries again; so does this loop. It gives up
// after a while so a broken build cannot hang the test.
const won = [];
const deadline = Date.now() + 60_000;
while (queued() > 0) {
  if (Date.now() > deadline) {
    throw new Error("queue-claimer: jobs are still queued after 60 seconds");
  }

  let claim;
  try {
    claim = backend.queue.claimNextJob();
  } catch (error) {
    if (/database is locked|database table is locked/u.test(error instanceof Error ? error.message : "")) {
      continue;
    }
    throw error;
  }

  if (claim) {
    won.push(claim);
  }
}
reader.close();
backend.close();
process.stdout.write(JSON.stringify(won));
