/**
 * Start the real mail-smtp submission server (built output) in remote mode,
 * pointed at a running mail-api. The SMTP listener and the health listener both
 * use ephemeral loopback ports.
 *
 * AUTH is only offered after STARTTLS, and the certificate bundled with
 * smtp-server is too weak for current OpenSSL, so tests generate a throwaway
 * self-signed certificate (never committed) with the openssl CLI.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { getFreePort, startService } from "./harness.mjs";
import { SmtpClient } from "./smtp-client.mjs";

export function opensslAvailable() {
  try {
    execFileSync("openssl", ["version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function generateSelfSignedCert(dir) {
  const keyPath = path.join(dir, "smtp-key.pem");
  const certPath = path.join(dir, "smtp-cert.pem");
  execFileSync(
    "openssl",
    [
      "req", "-x509", "-newkey", "rsa:2048", "-nodes",
      "-keyout", keyPath, "-out", certPath,
      "-days", "1", "-subj", "/CN=localhost"
    ],
    { stdio: "ignore" }
  );
  return { keyPath, certPath };
}

export async function startMailSmtp({ mailApi, env = {} }) {
  const dir = mkdtempSync(path.join(tmpdir(), "iai-e2e-smtp-"));
  let service;
  try {
    const { keyPath, certPath } = generateSelfSignedCert(dir);
    const smtpPort = await getFreePort();
    const metricsPort = await getFreePort();
    service = await startService({
      name: "mail-smtp",
      entry: "apps/mail-smtp/dist/index.js",
      portEnv: "MAIL_SMTP_HEALTH_PORT",
      hostEnv: "MAIL_SMTP_HEALTH_BIND_ADDRESS",
      readyPath: "/health",
      env: {
        MAIL_DB_URL: "sqlite:/dev/null",
        MAIL_SMTP_BACKEND_MODE: "remote",
        MAIL_SMTP_BIND_ADDRESS: "127.0.0.1",
        MAIL_SMTP_PORT: String(smtpPort),
        MAIL_SMTP_METRICS_PORT: String(metricsPort),
        MAIL_SMTP_HOSTNAME: "smtp.e2e.local",
        MAIL_SMTP_TLS_CERT_PATH: certPath,
        MAIL_SMTP_TLS_KEY_PATH: keyPath,
        MAIL_SMTP_REMOTE_BASE_URL: `${mailApi.baseUrl}/v1/internal/smtp/`,
        MAIL_SMTP_REMOTE_TOKEN: mailApi.credentials.remoteToken,
        MAIL_API_DEPENDENCIES_HEALTH_URL: `${mailApi.baseUrl}/v1/health/dependencies`,
        MAIL_API_HEALTH_URL: `${mailApi.baseUrl}/health`,
        MAIL_SMTP_REMOTE_TIMEOUT_MS: "4000",
        ...env
      }
    });

    // The health listener comes up before the SMTP listener; wait for the banner.
    const deadline = Date.now() + 10000;
    let lastError = new Error("no attempt made");
    while (Date.now() < deadline) {
      try {
        const probe = await SmtpClient.connect(smtpPort, { timeoutMs: 1000 });
        probe.close();
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    if (lastError) {
      throw new Error(`mail-smtp never accepted SMTP connections: ${lastError.message}\n${service.logs()}`);
    }

    const stop = service.stop.bind(service);
    service.stop = async () => {
      try {
        return await stop();
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    };
    service.smtpPort = smtpPort;
    service.connect = (options) => SmtpClient.connect(smtpPort, options);
    return service;
  } catch (error) {
    await service?.stop();
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}
