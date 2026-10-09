#!/usr/bin/env node
// Process entry for the mail delivery worker (started with `pnpm --filter @iai/mail-worker start`).
//
// It opens the mail database, claims due jobs from the queue and delivers them with the provider
// adapter named by MAIL_PROVIDER_ADAPTER. Run mail-api with MAIL_QUEUE_INLINE=0 next to it so the
// send path leaves the work to this process.
//
// Environment:
//   MAIL_DB_URL                     database shared with mail-api (default sqlite:/tmp/iai-mail.db)
//   MAIL_PROVIDER_ADAPTER           none (default) or fake; see the queue settings in smtp-internal.ts
//   MAIL_WORKER_POLL_SECONDS        pause when the queue is empty, 1..60 (default 5)
//   MAIL_WORKER_CONCURRENCY         jobs delivered at the same time, 1..4 (default 1)
//   MAIL_QUEUE_MAX_ATTEMPTS, MAIL_QUEUE_LEASE_SECONDS, MAIL_QUEUE_BACKOFF_*  as for mail-api

import { pathToFileURL } from "node:url";

import { openMailQueue, type MailQueueHandle } from "./smtp-internal.js";

export interface QueueWorkerOptions {
  /** Jobs delivered at the same time (1..4). */
  concurrency: number;
  /** Pause when no job is due, in milliseconds. */
  pollMs: number;
  queue: MailQueueHandle["queue"];
  /** Called with errors from a delivery; the worker keeps running. */
  onError?: (error: unknown) => void;
  /** Wait that ends early when the worker is stopped (tests inject their own). */
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  /** Stop signal: no new job is claimed once it is aborted; deliveries in progress finish. */
  signal: AbortSignal;
}

function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
    signal.addEventListener("abort", done, { once: true });
  });
}

/** Runs `concurrency` loops of claim, deliver, pause-when-idle until the signal aborts, then waits for them. */
export async function runQueueWorker(options: QueueWorkerOptions): Promise<void> {
  const sleep = options.sleep ?? abortableSleep;
  const loop = async () => {
    while (!options.signal.aborted) {
      let claimed = false;
      try {
        claimed = await options.queue.processNextAsync();
      } catch (error) {
        options.onError?.(error);
      }

      if (!claimed) {
        await sleep(options.pollMs, options.signal);
      }
    }
  };

  await Promise.all(Array.from({ length: options.concurrency }, loop));
}

function boundedEnvInteger(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number): number {
  const raw = env[name]?.trim();
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);
  if (!/^\d+$/u.test(raw) || value < min || value > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}, got: ${JSON.stringify(raw)}`);
  }

  return value;
}

function log(level: string, msg: string, extra: Record<string, unknown> = {}) {
  process.stdout.write(`${JSON.stringify({ level, msg, ts: new Date().toISOString(), ...extra })}\n`);
}

export async function main(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const pollSeconds = boundedEnvInteger(env, "MAIL_WORKER_POLL_SECONDS", 5, 1, 60);
  const concurrency = boundedEnvInteger(env, "MAIL_WORKER_CONCURRENCY", 1, 1, 4);
  const handle = openMailQueue({ databaseUrl: env.MAIL_DB_URL });
  const stop = new AbortController();

  const onSignal = (name: string) => {
    if (!stop.signal.aborted) {
      log("info", "mail_worker_stopping", { signal: name });
      stop.abort();
    }
  };
  process.on("SIGTERM", () => onSignal("SIGTERM"));
  process.on("SIGINT", () => onSignal("SIGINT"));

  log("info", "mail_worker_ready", { concurrency, pollSeconds });
  await runQueueWorker({
    concurrency,
    onError: (error) => log("error", "mail_worker_delivery_error", { error: error instanceof Error ? error.message : String(error) }),
    pollMs: pollSeconds * 1000,
    queue: handle.queue,
    signal: stop.signal
  });

  handle.close();
  log("info", "mail_worker_stopped");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${JSON.stringify({ level: "error", msg: "mail_worker_failed", error: error instanceof Error ? error.message : String(error), ts: new Date().toISOString() })}\n`);
    process.exitCode = 1;
  });
}
