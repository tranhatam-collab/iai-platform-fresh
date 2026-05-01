#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
WORKER_DIR="${ROOT_DIR}/pay.iai.one"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
WRANGLER_BIN="${WRANGLER_BIN:-./node_modules/wrangler/bin/wrangler.js}"

SECRETS=(
  "EMAIL_FROM_BILLING"
  "EMAIL_FROM_PAY"
  "EMAIL_REPLY_TO_SUPPORT"
  "PAY_IAI_ONE_WEBHOOK_SECRET"
  "SMTP_AUTH_MODE"
  "SMTP_HELO_DOMAIN"
  "SMTP_HOST"
  "SMTP_PASSWORD"
  "SMTP_PORT"
  "SMTP_SECURE_TRANSPORT"
  "SMTP_USERNAME"
  "TURNSTILE_SECRET"
)

restore_tty() {
  stty echo 2>/dev/null || true
}

trap restore_tty EXIT

if [[ ! -d "${WORKER_DIR}" ]]; then
  echo "Worker dir not found: ${WORKER_DIR}" >&2
  exit 1
fi

cd "${WORKER_DIR}"

if [[ ! -x "${WRANGLER_BIN}" && ! -f "${WRANGLER_BIN}" ]]; then
  echo "Wrangler binary not found: ${WORKER_DIR}/${WRANGLER_BIN}" >&2
  exit 1
fi

cat <<'EOF'
About to provision the 12 production secrets required by pay-iai-one.

Notes:
- Values are read from hidden stdin prompts and are not echoed back.
- PAY_IAI_ONE_WEBHOOK_SECRET is distinct from any legacy PAYMENT_WEBHOOK_SECRET.
- This template does not print secret values, but wrangler may print status lines.
EOF

for secret_name in "${SECRETS[@]}"; do
  stty -echo
  printf "%s: " "${secret_name}" >&2
  IFS= read -r secret_value
  stty echo
  printf "\n" >&2

  if [[ -z "${secret_value}" ]]; then
    echo "ABORT: ${secret_name} was empty." >&2
    exit 1
  fi

  printf '%s' "${secret_value}" | "${WRANGLER_BIN}" secret put "${secret_name}" --env "${DEPLOY_ENV}"
  unset secret_value
done

echo "Done provisioning ${#SECRETS[@]} secrets for pay-iai-one (${DEPLOY_ENV})."
