/**
 * Child process for the claim race test: opens the mail-api backend on a shared SQLite file, signals
 * that it is ready, waits until every claimer is ready, then claims jobs until none is due and prints
 * what it won as JSON.
 *
 * Two barriers, both in one directory, make the overlap deterministic instead of depending on timing:
 *  1. each claimer writes a "ready" file once its backend is open and starts claiming only when <count>
 *     of them exist, so a slow start (module load, migrations on a busy machine) delays everybody;
 *  2. each claimer then claims ONE job, writes a "claimed" file, and goes on only when <count> of
 *     those exist. On a loaded machine one process can otherwise take its whole time slice and claim
 *     every job before the others run; with the second barrier every claimer holds a job from the
 *     contested first round and the rest of the queue is then raced for by all of them.
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

function waitForClaimers(prefix) {
  writeFileSync(path.join(barrierDirectory, `${prefix}-${process.pid}`), "");
  const barrierDeadline = Date.now() + 60_000;
  while (readdirSync(barrierDirectory).filter((name) => name.startsWith(`${prefix}-`)).length < Number(claimerCount)) {
    if (Date.now() > barrierDeadline) {
      throw new Error(`queue-claimer: the other claimers did not reach the "${prefix}" barrier within 60 seconds`);
    }
  }
}

waitForClaimers("ready");

// A claim that loses a race returns nothing, exactly like an empty queue, so keep going until no
// job is left queued.
const reader = new DatabaseSync(new URL(url).pathname);
const queued = () => reader.prepare("SELECT COUNT(*) AS count FROM smtp_queue_jobs WHERE status = 'queued';").get().count;

// Under heavy load a claim can also run out of patience waiting for the write lock and throw "database is
// locked". The worker loop treats that as a failed poll and tries again; so does this loop. It gives up
// after a while so a broken build cannot hang the test.
const won = [];
const deadline = Date.now() + 60_000;

/** One claim attempt: the claim, or undefined when none was won (a lost race, or a lock that timed out). */
function tryClaim() {
  if (Date.now() > deadline) {
    throw new Error("queue-claimer: jobs are still queued after 60 seconds");
  }

  try {
    return backend.queue.claimNextJob();
  } catch (error) {
    if (/database is locked|database table is locked/u.test(error instanceof Error ? error.message : "")) {
      return undefined;
    }
    throw error;
  }
}

// Round one: win a first job (a lost race just means trying again; there are far more jobs than claimers).
while (won.length === 0) {
  if (queued() === 0) {
    throw new Error("queue-claimer: the queue ran empty before this claimer won a job");
  }

  const claim = tryClaim();
  if (claim) {
    won.push(claim);
  }
}
waitForClaimers("claimed");

// Round two: everybody races for the rest.
while (queued() > 0) {
  const claim = tryClaim();
  if (claim) {
    won.push(claim);
  }
}
reader.close();
backend.close();
process.stdout.write(JSON.stringify(won));
