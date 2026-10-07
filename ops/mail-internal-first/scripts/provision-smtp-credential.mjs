#!/usr/bin/env node
// Provision the first workspace / SMTP credential in a production mail-api database.
//
// mail-api does NOT seed the well-known dev login (smtp-dev / dev-secret) when
// NODE_ENV=production, and it has no admin API yet, so a fresh production
// database has no credentials until this is run. It goes through the same
// seed path the server uses (idempotent INSERT OR IGNORE of domain, sender
// identity, credential and provider route), so it cannot drift from the schema.
//
// Run it where the database lives, e.g. inside the mail-api container:
//
//   docker exec \
//     -e MAIL_DB_URL=sqlite:/data/iai-mail-flow.sqlite \
//     -e PROVISION_WORKSPACE_ID=ws_main \
//     -e PROVISION_SMTP_USERNAME=smtp-main \
//     -e PROVISION_SMTP_PASSWORD="$(openssl rand -hex 24)" \
//     -e PROVISION_PRIMARY_DOMAIN=tx.iai.one \
//     -e PROVISION_DEFAULT_SENDER=no-reply@tx.iai.one \
//     iai-mail-api-internal node /workspace/ops/mail-internal-first/scripts/provision-smtp-credential.mjs
//
// Keep the generated password: it is what SMTP clients (and SMTP_SMOKE_PASS) use.
// Re-running with an existing username/credential id changes nothing, so to rotate
// a password delete the old smtp_credentials row first.
//
// One workspace per database for now: the seed uses fixed sender-identity and
// provider-route ids, so a second workspace in the same database is silently skipped.
//
// Optional: PROVISION_ALLOWED_STREAMS (csv, default "transactional"),
// PROVISION_DEFAULT_STREAM, PROVISION_CREDENTIAL_ID (default smtpcred_<workspace>),
// PROVISION_PROVIDER_ROUTE_ID.

const smtpInternalUrl = new URL("../../../apps/mail-api/dist/smtp-internal.js", import.meta.url);

function required(name) {
  const value = (process.env[name] ?? "").trim();
  if (!value) {
    console.error(`${name} is required.`);
    process.exit(2);
  }
  return value;
}

function optional(name) {
  const value = (process.env[name] ?? "").trim();
  return value || undefined;
}

const databaseUrl = required("MAIL_DB_URL");
const workspaceId = required("PROVISION_WORKSPACE_ID");
const password = required("PROVISION_SMTP_PASSWORD");

if (password === "dev-secret" || password.length < 16) {
  console.error("PROVISION_SMTP_PASSWORD must be at least 16 characters and not the dev default.");
  process.exit(2);
}

const { createSmtpInternalBackend } = await import(smtpInternalUrl.href);

const backend = createSmtpInternalBackend({
  databaseUrl,
  // Nothing is served from this process; a throwaway token keeps the startup
  // check quiet without ever opening the internal routes.
  remoteToken: "provisioning-only",
  seed: {
    allowedStreams: optional("PROVISION_ALLOWED_STREAMS")?.split(","),
    credentialId: optional("PROVISION_CREDENTIAL_ID") ?? `smtpcred_${workspaceId}`,
    defaultSender: required("PROVISION_DEFAULT_SENDER"),
    defaultStream: optional("PROVISION_DEFAULT_STREAM"),
    password,
    primaryDomain: required("PROVISION_PRIMARY_DOMAIN"),
    providerRouteId: optional("PROVISION_PROVIDER_ROUTE_ID"),
    username: required("PROVISION_SMTP_USERNAME"),
    workspaceId
  }
});
backend.close();

console.log(
  JSON.stringify({
    ok: true,
    username: process.env.PROVISION_SMTP_USERNAME,
    workspaceId
  })
);
