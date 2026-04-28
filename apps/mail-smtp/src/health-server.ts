import {
  createServer,
  type Server,
  type ServerResponse
} from "node:http";

import type { MailSmtpConfig } from "@iai/config";

import type { MailSmtpDependencies } from "./contracts.js";
import type { RuntimeStats } from "./stats.js";

export function createHealthServer(
  config: MailSmtpConfig,
  dependencies: MailSmtpDependencies,
  stats: RuntimeStats
) {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");

    if (url.pathname === "/health") {
      return writeJson(response, 200, {
        app: "mail-smtp",
        backendMode: config.backend.mode,
        ok: true,
        smtp: {
          hostname: config.server.hostname,
          port: config.server.port,
          startTlsRequired: config.tls.startTlsRequired
        },
        stats: stats.snapshot()
      });
    }

    if (url.pathname === "/health/dependencies") {
      try {
        const health = await dependencies.healthcheck();
        return writeJson(response, health.ok ? 200 : 503, health);
      } catch (error) {
        return writeJson(response, 503, {
          checks: [
            {
              detail: error instanceof Error ? error.message : "Unknown health error",
              name: "dependency_healthcheck",
              ok: false
            }
          ],
          mode: config.backend.mode,
          ok: false
        });
      }
    }

    return writeJson(response, 404, {
      ok: false,
      path: url.pathname
    });
  });
}

export function listenHealthServer(server: Server, host: string, port: number) {
  return new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
}

export function closeHealthServer(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown
) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload, null, 2));
}
