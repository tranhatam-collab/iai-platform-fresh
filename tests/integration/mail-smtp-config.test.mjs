import test from "node:test";
import assert from "node:assert/strict";

import { loadMailSmtpConfig } from "../../packages/config/dist/index.js";

test("loadMailSmtpConfig applies development stub defaults", () => {
  const config = loadMailSmtpConfig({
    MAIL_DB_URL: "postgres://postgres:postgres@localhost:5432/iai_mail",
    NODE_ENV: "development"
  });

  assert.equal(config.backend.mode, "stub");
  assert.equal(config.server.port, 587);
  assert.equal(config.observability.bindAddress, "127.0.0.1");
  assert.equal(config.policy.defaultStream, "transactional");
  assert.deepEqual(config.auth.methods, ["PLAIN", "LOGIN"]);
});

test("loadMailSmtpConfig allows explicit remote mode and stream config", () => {
  const config = loadMailSmtpConfig({
    LOG_LEVEL: "warn",
    MAIL_DB_URL: "postgres://postgres:postgres@localhost:5432/iai_mail",
    MAIL_SMTP_BACKEND_MODE: "remote",
    MAIL_SMTP_DEFAULT_STREAM: "system",
    MAIL_SMTP_HEALTH_BIND_ADDRESS: "0.0.0.0",
    MAIL_SMTP_PORT: "2525",
    NODE_ENV: "production"
  });

  assert.equal(config.backend.mode, "remote");
  assert.equal(config.runtime.logLevel, "warn");
  assert.equal(config.server.port, 2525);
  assert.equal(config.observability.bindAddress, "0.0.0.0");
  assert.equal(config.policy.defaultStream, "system");
});
