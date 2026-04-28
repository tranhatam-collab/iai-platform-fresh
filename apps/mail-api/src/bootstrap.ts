/**
 * Production bootstrap for `@iai/mail-api`.
 *
 * Reads runtime config from `process.env`, wires the inbound-webhook
 * evidence sink (file-backed if `MAIL_API_INBOUND_EVIDENCE_FILE` is set,
 * otherwise in-memory), and starts the HTTP server.
 *
 * Replaces the ad-hoc `bootstrap.cjs` shipped during the 2026-04-28 Path B
 * deploy. Production should run `node ./dist/bootstrap.js` from the
 * compiled bundle.
 *
 * Env contract:
 *   PORT                            (default 3000)
 *   MAIL_API_BIND_ADDRESS           (default 0.0.0.0)
 *   MAIL_API_WEBHOOK_SECRET         (required for inbound webhook to accept)
 *   MAIL_API_INBOUND_EVIDENCE_FILE  (optional; NDJSON path → file sink)
 *   MAIL_API_INBOUND_REPLAY_WINDOW_S (optional; default 300)
 *   MAIL_API_INBOUND_MAX_BODY_BYTES  (optional; default 262144)
 *   API_FLOW_BIND_ADDRESS            (legacy alias for MAIL_API_BIND_ADDRESS)
 */

import type { Server } from "node:http";
import { fileURLToPath } from "node:url";
import process from "node:process";

import { resolveInboundWebhookOptionsFromEnv } from "./inbound-webhook.js";
import { createFlowApiServer, type FlowApiServerOptions } from "./server.js";

export interface BootstrapResolution {
  port: number;
  bindAddress: string;
  inbound: {
    sinkMode: "file" | "memory";
    sinkFilePath: string | null;
    replayWindowSeconds: number;
    maxBodyBytes: number;
    secretConfigured: boolean;
  };
}

export interface BootstrapResult {
  server: Server;
  resolution: BootstrapResolution;
}

/**
 * Build the server-options object from environment variables. Pure: does
 * not call `listen` and does not log. Suitable for unit tests.
 */
export function buildServerOptionsFromEnv(
  env: NodeJS.ProcessEnv = process.env
): { options: FlowApiServerOptions; resolution: BootstrapResolution } {
  const inboundResolved = resolveInboundWebhookOptionsFromEnv(env);
  const port = parsePort(env.PORT, 3000);
  const bindAddress =
    normalizeStringEnv(env.MAIL_API_BIND_ADDRESS) ??
    normalizeStringEnv(env.API_FLOW_BIND_ADDRESS) ??
    "0.0.0.0";

  const options: FlowApiServerOptions = {
    inboundWebhook: {
      // Bind the secret resolver to the *passed-in* env object so tests (and
      // any other caller that supplies a synthetic env) get a deterministic
      // secret. In production, `env === process.env`, so live rotation via
      // `MAIL_API_WEBHOOK_SECRET` still takes effect on the next request.
      resolveSecret: () => env.MAIL_API_WEBHOOK_SECRET,
      evidenceSink: inboundResolved.evidenceSink,
      replayWindowSeconds: inboundResolved.replayWindowSeconds,
      maxBodyBytes: inboundResolved.maxBodyBytes
    }
  };

  return {
    options,
    resolution: {
      port,
      bindAddress,
      inbound: {
        sinkMode: inboundResolved.resolution.sinkMode,
        sinkFilePath: inboundResolved.resolution.sinkFilePath,
        replayWindowSeconds: inboundResolved.resolution.replayWindowSeconds,
        maxBodyBytes: inboundResolved.resolution.maxBodyBytes,
        secretConfigured: Boolean((env.MAIL_API_WEBHOOK_SECRET ?? "").trim())
      }
    }
  };
}

/**
 * Build + listen. Returns the server + resolved config so callers can log
 * or assert on it. Caller owns process-level error handling.
 */
export function bootstrapFromEnv(
  env: NodeJS.ProcessEnv = process.env
): Promise<BootstrapResult> {
  const { options, resolution } = buildServerOptionsFromEnv(env);
  const server = createFlowApiServer(options);

  return new Promise((resolve, reject) => {
    const onError = (err: Error) => {
      server.removeListener("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolve({ server, resolution });
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(resolution.port, resolution.bindAddress);
  });
}

function parsePort(rawValue: string | undefined, fallback: number): number {
  const trimmed = (rawValue ?? "").trim();
  if (!trimmed) {
    return fallback;
  }
  const parsed = Number.parseInt(trimmed, 10);
  // PORT=0 is a valid idiom telling the OS to pick a free ephemeral port —
  // we use it in tests. Reject only out-of-range or non-integer values.
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(
      `PORT must be an integer in 0..65535 if set, got: ${JSON.stringify(rawValue)}`
    );
  }
  return parsed;
}

function normalizeStringEnv(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Wire SIGTERM / SIGINT to a clean `server.close()` so `docker stop` and
 * orchestrator-driven rollouts shut down deterministically instead of
 * being SIGKILLed at the 10s grace deadline. A 10s safety timer is armed
 * (and `unref`'d so it cannot keep the loop alive on its own) to force-
 * exit if connections refuse to drain. Only installed on the CLI path —
 * library callers manage their own lifecycle.
 */
function installGracefulShutdown(server: Server): void {
  let shuttingDown = false;
  const handle = (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        level: "info",
        msg: "mail_api_shutdown_received",
        signal,
        ts: new Date().toISOString()
      })
    );
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          level: "info",
          msg: "mail_api_shutdown_complete",
          ts: new Date().toISOString()
        })
      );
      process.exit(0);
    });
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          level: "error",
          msg: "mail_api_shutdown_force_exit",
          reason: "drain_timeout_10s",
          ts: new Date().toISOString()
        })
      );
      process.exit(1);
    }, 10_000).unref();
  };
  process.on("SIGTERM", () => handle("SIGTERM"));
  process.on("SIGINT", () => handle("SIGINT"));
}

// CLI entry: `node ./dist/bootstrap.js` starts the server.
const isDirectInvocation =
  typeof process.argv[1] === "string" &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectInvocation) {
  bootstrapFromEnv()
    .then(({ server, resolution }) => {
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          level: "info",
          msg: "mail_api_listening",
          port: resolution.port,
          bind_address: resolution.bindAddress,
          inbound_sink_mode: resolution.inbound.sinkMode,
          inbound_sink_file_path: resolution.inbound.sinkFilePath,
          inbound_replay_window_s: resolution.inbound.replayWindowSeconds,
          inbound_max_body_bytes: resolution.inbound.maxBodyBytes,
          inbound_secret_configured: resolution.inbound.secretConfigured,
          ts: new Date().toISOString()
        })
      );
      installGracefulShutdown(server);
    })
    .catch((err: Error) => {
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          level: "error",
          msg: "mail_api_bootstrap_failed",
          error_name: err.name,
          error_message: err.message,
          error_stack: err.stack ?? null,
          ts: new Date().toISOString()
        })
      );
      process.exitCode = 1;
    });
}
