/**
 * Static guards for the internal-first production stack config
 * (ops/mail-internal-first). These are the mistakes that only show up at deploy time:
 * a container whose entrypoint never listens, and a secret that silently becomes "".
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

const compose = read("ops/mail-internal-first/docker-compose.prod.yml");
const envExample = read("ops/mail-internal-first/.env.production.example");

test("compose runs the mail-api entrypoint that actually listens", () => {
  const command = compose.match(/command: \["node", "(apps\/mail-api\/dist\/[^"]+)"\]/u);
  assert.ok(command, "mail-api command not found");

  // dist/index.js only re-exports the library API (and exits); bootstrap.js is the bin that listens.
  assert.equal(command[1], "apps/mail-api/dist/bootstrap.js");

  const pkg = JSON.parse(read("apps/mail-api/package.json"));
  assert.equal(`apps/mail-api/${pkg.bin["iai-mail-api"].replace(/^\.\//u, "")}`, command[1]);

  const bootstrapSource = read("apps/mail-api/src/bootstrap.ts");
  assert.match(bootstrapSource, /server\.listen\(/u);
  assert.doesNotMatch(read("apps/mail-api/src/index.ts"), /server\.listen\(/u);
});

test("compose requires MAIL_SMTP_REMOTE_TOKEN instead of defaulting it to an empty string", () => {
  assert.doesNotMatch(compose, /\$\{MAIL_SMTP_REMOTE_TOKEN\}/u);
  assert.doesNotMatch(compose, /\$\{MAIL_SMTP_REMOTE_TOKEN:-/u);

  const required = compose.match(/\$\{MAIL_SMTP_REMOTE_TOKEN:\?[^}]+\}/gu) ?? [];
  assert.equal(required.length, 2, "both mail-api and mail-smtp must require the token");
});

test("compose passes MAIL_API_KEY through only as an optional value", () => {
  assert.match(compose, /MAIL_API_KEY: "\$\{MAIL_API_KEY:-\}"/u);
});

test(".env.production.example does not advertise the dev SMTP login as production smoke defaults", () => {
  assert.doesNotMatch(envExample, /^SMTP_SMOKE_(USER|PASS)=(smtp-dev|dev-secret)\s*$/mu);
  assert.match(envExample, /^SMTP_SMOKE_USER=REPLACE_WITH_/mu);
  assert.match(envExample, /^SMTP_SMOKE_PASS=REPLACE_WITH_/mu);
  assert.match(envExample, /^MAIL_SMTP_REMOTE_TOKEN=REPLACE_WITH_/mu);
});
