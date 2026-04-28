import { loadMailSmtpConfig } from "@iai/config";

import { createStubMailSmtpDependencies } from "./dev-backend.js";
import { closeHealthServer, createHealthServer, listenHealthServer } from "./health-server.js";
import type { MailSmtpDependencies } from "./contracts.js";
import { createRemoteMailSmtpDependencies } from "./remote-backend.js";
import { createMailSmtpServer } from "./runtime.js";
import { createRuntimeStats } from "./stats.js";
import { createSmtpLogger, smtpLogEvents } from "./telemetry.js";

const config = loadMailSmtpConfig();
const stats = createRuntimeStats();
const dependencies = createDependencies(config);
const logger = createSmtpLogger({
  component: "mail-smtp",
  hostname: config.server.hostname,
  mode: config.backend.mode,
  port: config.server.port
});

const server = createMailSmtpServer(config, dependencies, stats, logger);
const healthServer = createHealthServer(config, dependencies, stats);

server.on("error", (error) => {
  logger.error(smtpLogEvents.runtimeUnhandledError, {
    error: error instanceof Error ? error.message : String(error)
  });
});

void start().catch((error) => {
  logger.error(smtpLogEvents.runtimeStartupFailed, {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exitCode = 1;
});

async function start() {
  await listenHealthServer(
    healthServer,
    config.observability.bindAddress,
    config.observability.healthPort
  );
  logger.info(smtpLogEvents.healthServerStarted, {
    bindAddress: config.observability.bindAddress,
    healthPort: config.observability.healthPort
  });
  server.listen(config.server.port, config.server.bindAddress, () => {
    logger.info(smtpLogEvents.runtimeStarted, {
      bindAddress: config.server.bindAddress,
      healthBindAddress: config.observability.bindAddress,
      healthPort: config.observability.healthPort
    });
  });
}

function createDependencies(currentConfig: typeof config): MailSmtpDependencies {
  if (currentConfig.backend.mode === "stub") {
    return createStubMailSmtpDependencies(currentConfig);
  }

  return createRemoteMailSmtpDependencies(currentConfig);
}

const shutdown = async () => {
  try {
    await closeHealthServer(healthServer);
    logger.info(smtpLogEvents.healthServerStopped, {
      bindAddress: config.observability.bindAddress,
      healthPort: config.observability.healthPort
    });
  } catch (error) {
    logger.error(smtpLogEvents.runtimeShutdownFailed, {
      error: error instanceof Error ? error.message : String(error),
      step: "health-server"
    });
    process.exitCode = 1;
  }

  server.close((error?: Error) => {
    if (error) {
      logger.error(smtpLogEvents.runtimeShutdownFailed, {
        error: error.message,
        step: "smtp-server"
      });
      process.exitCode = 1;
      return;
    }

    logger.info(smtpLogEvents.runtimeShutdownSucceeded, {
      bindAddress: config.server.bindAddress
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
