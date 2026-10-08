/**
 * Helpers shared by the e2e files that drive a real mail-api process.
 *
 * Everything here uses the credentials that startMailApi() configures; nothing
 * talks to a real provider. The workspace/sender below are the defaults that
 * mail-api seeds into a fresh SQLite database.
 */
import { createHmac } from "node:crypto";

import { request } from "./harness.mjs";

export const DEV_WORKSPACE = "ws_dev";
export const DEV_SENDER = "no-reply@tx.iai.one";
export const SEEDED_SUPPRESSED_RECIPIENT = "blocked@example.com";
// Seeded development SMTP credential (mail-api resolveSeed defaults).
export const SMTP_DEV_USERNAME = "smtp-dev";
export const SMTP_DEV_PASSWORD = "dev-secret";

export function apiHeaders(mailApi, { workspaceId = DEV_WORKSPACE, requestId, extra = {} } = {}) {
  return {
    authorization: `Bearer ${mailApi.credentials.apiKey}`,
    "content-type": "application/json",
    ...(workspaceId ? { "x-workspace-id": workspaceId } : {}),
    ...(requestId ? { "x-request-id": requestId } : {}),
    ...extra
  };
}

let sequence = 0;
export function uniqueKey(prefix = "e2e") {
  sequence += 1;
  return `${prefix}-${process.pid}-${Date.now()}-${sequence}`;
}

export function buildSendPayload(overrides = {}) {
  return {
    from: { email: DEV_SENDER, name: "IAI E2E" },
    message_idempotency_key: uniqueKey("send"),
    stream: "transactional",
    subject: "E2E message",
    text: "Hello from the e2e suite.",
    to: [{ email: "recipient@example.com", name: "Recipient" }],
    ...overrides
  };
}

/** POST /v1/send with the configured API key. */
export async function sendMail(mailApi, overrides = {}, { headers = {} } = {}) {
  return await request(mailApi.baseUrl, "/v1/send", {
    method: "POST",
    headers: apiHeaders(mailApi, { extra: headers }),
    body: JSON.stringify(buildSendPayload(overrides))
  });
}

// Persisted message reads use the same bearer API key as POST /v1/send.
function readHeaders(mailApi, workspaceId) {
  return { authorization: `Bearer ${mailApi.credentials.apiKey}`, "x-workspace-id": workspaceId };
}

export async function getMessage(mailApi, messageId, workspaceId = DEV_WORKSPACE) {
  return await request(mailApi.baseUrl, `/v1/messages/${encodeURIComponent(messageId)}`, {
    headers: readHeaders(mailApi, workspaceId)
  });
}

export async function getMessageEvents(mailApi, messageId, workspaceId = DEV_WORKSPACE) {
  return await request(mailApi.baseUrl, `/v1/messages/${encodeURIComponent(messageId)}/events`, {
    headers: readHeaders(mailApi, workspaceId)
  });
}

/**
 * Headers for POST /v1/webhooks/inbound: HMAC-SHA256(secret, `${ts}.${body}`) as lowercase hex.
 */
export function signInboundWebhook(secret, rawBody, timestamp = Math.floor(Date.now() / 1000)) {
  const signature = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return {
    "content-type": "application/json",
    "x-mail-webhook-signature": signature,
    "x-mail-webhook-timestamp": String(timestamp)
  };
}

/** Poll `probe` until it returns a truthy value or the deadline passes. */
export async function waitFor(probe, { timeoutMs = 5000, intervalMs = 50, description = "condition" } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await probe();
    if (last) {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`timed out after ${timeoutMs}ms waiting for ${description}`);
}
