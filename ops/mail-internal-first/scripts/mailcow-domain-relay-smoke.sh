#!/usr/bin/env bash
set -euo pipefail

# Submit a real outbound smoke message from any active Mailcow system
# mailbox/alias. This complements mailcow-live-relay-smoke.sh, which stays
# strict for the iai.one relay/BCC gate.
#
# Required:
#   MAILCOW_DIR=/opt/mailcow-dockerized
#   SMOKE_FROM=pay@example.com
#
# Optional:
#   SMOKE_REPLY_TO=support@example.com
#   SMOKE_RECIPIENTS=tranhatam66@gmail.com,tranhatam@gmail.com
#   SMOKE_SUBJECT_PREFIX="[Domain Relay Smoke]"

MAILCOW_DIR="${MAILCOW_DIR:-/opt/mailcow-dockerized}"
SMOKE_FROM="${SMOKE_FROM:-}"
SMOKE_REPLY_TO="${SMOKE_REPLY_TO:-}"
SMOKE_RECIPIENTS="${SMOKE_RECIPIENTS:-tranhatam66@gmail.com,tranhatam@gmail.com}"
SMOKE_SUBJECT_PREFIX="${SMOKE_SUBJECT_PREFIX:-[Domain Relay Smoke]}"

dc() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "${MAILCOW_DIR}/docker-compose.yml" "$@"
  else
    docker-compose -f "${MAILCOW_DIR}/docker-compose.yml" "$@"
  fi
}

fail() {
  echo "$1" >&2
  exit 1
}

require_file() {
  [ -f "$1" ] || fail "Missing required file: $1"
}

mysql_scalar() {
  dc exec -T mysql-mailcow mysql -N -B -u"${DBUSER}" -p"${DBPASS}" "${DBNAME}" -e "$1"
}

wait_for_runtime_relay() {
  local runtime=""
  local attempt

  for attempt in $(seq 1 30); do
    runtime="$(dc exec -T postfix-mailcow postconf -h relayhost 2>/dev/null || true)"
    if [[ -n "${runtime}" ]]; then
      printf '%s\n' "${runtime}"
      return 0
    fi
    sleep 1
  done

  return 1
}

trim() {
  printf '%s' "$1" | xargs
}

require_file "${MAILCOW_DIR}/docker-compose.yml"
require_file "${MAILCOW_DIR}/mailcow.conf"

# shellcheck disable=SC1090
source "${MAILCOW_DIR}/mailcow.conf"

[[ -n "${DBUSER:-}" ]] || fail "DBUSER is missing from mailcow.conf"
[[ -n "${DBPASS:-}" ]] || fail "DBPASS is missing from mailcow.conf"
[[ -n "${DBNAME:-}" ]] || fail "DBNAME is missing from mailcow.conf"

[[ -n "${SMOKE_FROM}" ]] || fail "SMOKE_FROM is required."
[[ "${SMOKE_FROM}" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || fail "SMOKE_FROM is not a valid system email address."

from_domain="${SMOKE_FROM##*@}"
if [[ -z "${SMOKE_REPLY_TO}" ]]; then
  SMOKE_REPLY_TO="support@${from_domain}"
fi

domain_count="$(mysql_scalar "SELECT COUNT(*) FROM domain WHERE domain='${from_domain}' AND active=1;")"
[[ "${domain_count}" = "1" ]] || fail "SMOKE_FROM domain is not active in Mailcow: ${from_domain}"

mailbox_count="$(mysql_scalar "SELECT COUNT(*) FROM mailbox WHERE username='${SMOKE_FROM}' AND active=1;")"
alias_count="$(mysql_scalar "SELECT COUNT(*) FROM alias WHERE address='${SMOKE_FROM}' AND active=1;")"
if [[ "${mailbox_count}" = "0" && "${alias_count}" = "0" ]]; then
  fail "SMOKE_FROM must be an active Mailcow mailbox or alias: ${SMOKE_FROM}"
fi

relayhost_value="$(wait_for_runtime_relay || true)"
[[ -n "${relayhost_value}" ]] || fail "relayhost is not configured inside postfix-mailcow."

IFS=',' read -r -a recipients <<< "${SMOKE_RECIPIENTS}"
[[ "${#recipients[@]}" -gt 0 ]] || fail "No recipients were provided."

echo "Domain smoke sender:"
echo "  from=${SMOKE_FROM}"
echo "  domain=${from_domain}"
echo "  mailbox_active=${mailbox_count}"
echo "  alias_active=${alias_count}"
echo "  reply_to=${SMOKE_REPLY_TO}"
echo ""
echo "Relay runtime:"
dc exec -T postfix-mailcow postconf relayhost smtp_sasl_auth_enable smtp_sasl_password_maps smtp_tls_security_level
echo ""

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

for raw_recipient in "${recipients[@]}"; do
  recipient="$(trim "${raw_recipient}")"
  [[ -n "${recipient}" ]] || continue

  timestamp_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  message_id="<domain-relay-smoke-$(date +%s)-$RANDOM@${from_domain}>"
  subject="${SMOKE_SUBJECT_PREFIX} ${from_domain} ${timestamp_utc}"
  message_file="${tmpdir}/$(printf '%s' "${recipient}" | tr '@.' '__').eml"

  cat > "${message_file}" <<EOF
From: ${SMOKE_FROM}
To: ${recipient}
Reply-To: ${SMOKE_REPLY_TO}
Subject: ${subject}
Date: $(LC_ALL=C date -R)
Message-ID: ${message_id}
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8

Kiểm thử gửi mail thật từ hệ thống.

Đây không phải email cá nhân. Email này được gửi từ Mailcow/Mail API của hệ thống để xác nhận domain đã sẵn sàng gửi ra Gmail.

sender=${SMOKE_FROM}
recipient=${recipient}
message_id=${message_id}
generated_at=${timestamp_utc}
EOF

  dc exec -T postfix-mailcow sh -lc "/usr/sbin/sendmail -f '${SMOKE_FROM}' -t -oi" < "${message_file}"
  printf 'SUBMITTED recipient=%s message_id=%s\n' "${recipient}" "${message_id}"
done

sleep 5

echo ""
echo "Postfix queue after submission:"
dc exec -T postfix-mailcow postqueue -p || true

echo ""
echo "Recent postfix logs:"
dc logs --since 3m postfix-mailcow | tail -n 160 || true

echo ""
echo "Proof gate:"
echo "- Email chỉ được tính pass khi cả hai inbox Gmail nhận được thư thật."
echo "- Founder/personal mailbox không được dùng làm sender proof."
echo "- Nếu SendGrid trả lỗi Sender Identity, cần xác thực đúng domain From trước khi test lại."
