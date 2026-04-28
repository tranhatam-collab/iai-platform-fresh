#!/usr/bin/env bash

set -euo pipefail

MAIL_API_BASE_URL="${MAIL_API_BASE_URL:-https://api.mail.iai.one/v1}"
MAIL_WORKSPACE_ID="${MAIL_WORKSPACE_ID:-}"
MAIL_API_KEY="${MAIL_API_KEY:-}"
MAIL_TO="${MAIL_TO:-}"
MAIL_TO_NAME="${MAIL_TO_NAME:-Public Cutover Test}"
MAIL_FROM="${MAIL_FROM:-pay@tranhatam.com}"
MAIL_FROM_NAME="${MAIL_FROM_NAME:-Tranhatam.com}"
MAIL_REPLY_TO="${MAIL_REPLY_TO:-support@tranhatam.com}"
MAIL_REPLY_TO_NAME="${MAIL_REPLY_TO_NAME:-Tranhatam.com Support}"
MAIL_STREAM="${MAIL_STREAM:-transactional}"
MAIL_SOURCE_APP="${MAIL_SOURCE_APP:-pay.iai.one}"
MAIL_SOURCE_DOMAIN="${MAIL_SOURCE_DOMAIN:-tranhatam.com}"
MAIL_TEMPLATE_ID="${MAIL_TEMPLATE_ID:-payment_receipt}"
MAIL_SUBJECT="${MAIL_SUBJECT:-Public cutover smoke}"
MAIL_TEXT="${MAIL_TEXT:-Public /v1/send cutover smoke.}"
MAIL_IDEMPOTENCY_KEY="${MAIL_IDEMPOTENCY_KEY:-public-send-cutover-$(date +%Y%m%d%H%M%S)}"

if [[ -z "${MAIL_API_KEY}" ]]; then
  echo "Missing MAIL_API_KEY" >&2
  exit 1
fi

if [[ -z "${MAIL_WORKSPACE_ID}" ]]; then
  echo "Missing MAIL_WORKSPACE_ID" >&2
  exit 1
fi

if [[ -z "${MAIL_TO}" ]]; then
  echo "Missing MAIL_TO" >&2
  exit 1
fi

payload_file="$(mktemp)"
response_file="$(mktemp)"
trap 'rm -f "${payload_file}" "${response_file}"' EXIT

cat >"${payload_file}" <<JSON
{
  "from": {
    "email": "${MAIL_FROM}",
    "name": "${MAIL_FROM_NAME}"
  },
  "reply_to": {
    "email": "${MAIL_REPLY_TO}",
    "name": "${MAIL_REPLY_TO_NAME}"
  },
  "to": [
    {
      "email": "${MAIL_TO}",
      "name": "${MAIL_TO_NAME}"
    }
  ],
  "stream": "${MAIL_STREAM}",
  "subject": "${MAIL_SUBJECT}",
  "text": "${MAIL_TEXT}",
  "headers": {
    "X-Source-App": "${MAIL_SOURCE_APP}"
  },
  "message_idempotency_key": "${MAIL_IDEMPOTENCY_KEY}",
  "tags": [
    "public-cutover",
    "${MAIL_TEMPLATE_ID}",
    "${MAIL_SOURCE_DOMAIN}"
  ],
  "metadata": {
    "source_app": "${MAIL_SOURCE_APP}",
    "source_domain": "${MAIL_SOURCE_DOMAIN}",
    "template_id": "${MAIL_TEMPLATE_ID}",
    "cutover_scope": "public_v1_send"
  }
}
JSON

status_code="$(
  curl -sS \
    -o "${response_file}" \
    -w "%{http_code}" \
    -X POST "${MAIL_API_BASE_URL}/send" \
    -H "authorization: Bearer ${MAIL_API_KEY}" \
    -H "x-workspace-id: ${MAIL_WORKSPACE_ID}" \
    -H "content-type: application/json" \
    --data @"${payload_file}"
)"

printf 'HTTP_STATUS=%s\n' "${status_code}"
cat "${response_file}"
printf '\n'

node - "${status_code}" "${response_file}" <<'NODE'
const fs = require("node:fs");

const statusCode = process.argv[2];
const responsePath = process.argv[3];
const raw = fs.readFileSync(responsePath, "utf8");

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (error) {
  console.error("Response is not valid JSON.");
  process.exit(1);
}

if (statusCode !== "202") {
  console.error(`Expected HTTP 202 but received ${statusCode}.`);
  process.exit(1);
}

if (!parsed.ok || !parsed.data || typeof parsed.data.message_id !== "string") {
  console.error("Response does not include ok=true and data.message_id.");
  process.exit(1);
}

console.log(`MESSAGE_ID=${parsed.data.message_id}`);
NODE
