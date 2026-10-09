/**
 * Child process for the claim race test: opens the mail-api backend on a shared SQLite file, waits
 * for a common start time, then claims jobs until none is due and prints what it won as JSON.
 *
 * Usage: node queue-claimer.mjs <sqlite url> <start time in epoch ms>
 */
import { DatabaseSync } from "node:sqlite";

import { createSmtpInternalBackend } from "../../../apps/mail-api/dist/smtp-internal.js";

const [url, startAt] = process.argv.slice(2);

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

while (Date.now() < Number(startAt)) {
  // busy wait: both processes start claiming at the same instant
}

// A claim that loses a race returns nothing, exactly like an empty queue, so keep going until no
// job is left queued.
const reader = new DatabaseSync(new URL(url).pathname);
const queued = () => reader.prepare("SELECT COUNT(*) AS count FROM smtp_queue_jobs WHERE status = 'queued';").get().count;

const won = [];
while (queued() > 0) {
  const claim = backend.queue.claimNextJob();
  if (claim) {
    won.push(claim);
  }
}
reader.close();
backend.close();
process.stdout.write(JSON.stringify(won));
