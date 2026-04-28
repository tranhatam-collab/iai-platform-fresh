#!/usr/bin/env bash

set -euo pipefail

SMTP_HOST="${SMTP_HOST:-127.0.0.1}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_SERVERNAME="${SMTP_SERVERNAME:-$SMTP_HOST}"
SMTP_HEALTH_URL="${SMTP_HEALTH_URL:-http://127.0.0.1:9091/health}"
SMTP_DEPENDENCIES_URL="${SMTP_DEPENDENCIES_URL:-http://127.0.0.1:9091/health/dependencies}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS:-}"
SMTP_FROM="${SMTP_FROM:-no-reply@tx.iai.one}"
SMTP_TO="${SMTP_TO:-you@example.com}"
SMTP_SUBJECT="${SMTP_SUBJECT:-SMTP smoke test}"
SMTP_BODY="${SMTP_BODY:-smtp smoke test}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd openssl

echo "==> /health"
curl -fsS "$SMTP_HEALTH_URL"
echo

echo "==> /health/dependencies"
curl -fsS "$SMTP_DEPENDENCIES_URL"
echo

echo "==> STARTTLS handshake"
openssl s_client \
  -starttls smtp \
  -connect "${SMTP_HOST}:${SMTP_PORT}" \
  -servername "${SMTP_SERVERNAME}" \
  </dev/null | sed -n '1,25p'

if command -v swaks >/dev/null 2>&1; then
  if [[ -z "$SMTP_USER" || -z "$SMTP_PASS" ]]; then
    echo "==> swaks available but SMTP_USER/SMTP_PASS not set; skipping AUTH send"
    exit 0
  fi

  echo "==> AUTH happy path"
  swaks \
    --server "$SMTP_HOST" \
    --port "$SMTP_PORT" \
    --tls \
    --auth LOGIN \
    --auth-user "$SMTP_USER" \
    --auth-password "$SMTP_PASS" \
    --from "$SMTP_FROM" \
    --to "$SMTP_TO" \
    --header "Subject: $SMTP_SUBJECT" \
    --body "$SMTP_BODY"
else
  echo "==> swaks not installed; skipping AUTH send"
fi
