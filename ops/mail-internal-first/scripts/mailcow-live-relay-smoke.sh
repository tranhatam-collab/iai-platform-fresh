#!/usr/bin/env bash
set -euo pipefail

# Submit real outbound smoke messages through postfix-mailcow
# after RELAYHOST* has been configured.
#
# Required:
#   MAILCOW_DIR=/opt/mailcow-dockerized
#
# Optional:
#   SMOKE_FROM=pay@iai.one
#   SMOKE_REPLY_TO=support@iai.one
#   SMOKE_RECIPIENTS=tranhatam66@gmail.com,tranhatam@gmail.com
#   SMOKE_SUBJECT_PREFIX="[IAI Relay Smoke]"

MAILCOW_DIR="${MAILCOW_DIR:-/opt/mailcow-dockerized}"
SMOKE_FROM="${SMOKE_FROM:-pay@iai.one}"
SMOKE_REPLY_TO="${SMOKE_REPLY_TO:-support@iai.one}"
SMOKE_RECIPIENTS="${SMOKE_RECIPIENTS:-tranhatam66@gmail.com,tranhatam@gmail.com}"
SMOKE_SUBJECT_PREFIX="${SMOKE_SUBJECT_PREFIX:-[IAI Relay Smoke]}"

dc() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "${MAILCOW_DIR}/docker-compose.yml" "$@"
  else
    docker-compose -f "${MAILCOW_DIR}/docker-compose.yml" "$@"
  fi
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

require_file() {
  [ -f "$1" ] || {
    echo "Missing required file: $1" >&2
    exit 1
  }
}

require_file "${MAILCOW_DIR}/docker-compose.yml"

case "${SMOKE_FROM}" in
  pay@iai.one|contact@iai.one|support@iai.one|billing@iai.one|noreply@iai.one)
    ;;
  *)
    echo "SMOKE_FROM must be a system sender on iai.one, not a personal/founder mailbox." >&2
    exit 1
    ;;
esac

relayhost_value="$(wait_for_runtime_relay || true)"
if [[ -z "${relayhost_value}" ]]; then
  echo "relayhost is not configured inside postfix-mailcow." >&2
  exit 1
fi

IFS=',' read -r -a recipients <<< "${SMOKE_RECIPIENTS}"
if [[ "${#recipients[@]}" -eq 0 ]]; then
  echo "No recipients were provided." >&2
  exit 1
fi

echo "Relay runtime:"
dc exec -T postfix-mailcow postconf relayhost smtp_sasl_auth_enable smtp_sasl_password_maps smtp_tls_security_level
echo ""

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

for raw_recipient in "${recipients[@]}"; do
  recipient="$(printf '%s' "${raw_recipient}" | xargs)"
  if [[ -z "${recipient}" ]]; then
    continue
  fi

  timestamp_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  message_id="<relay-smoke-$(date +%s)-$RANDOM@iai.one>"
  subject="${SMOKE_SUBJECT_PREFIX} ${timestamp_utc} -> ${recipient}"
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

IAI outbound relay live smoke.
recipient=${recipient}
message_id=${message_id}
generated_at=${timestamp_utc}
EOF

  dc exec -T postfix-mailcow sh -lc "/usr/sbin/sendmail -f '${SMOKE_FROM}' -t -oi" < "${message_file}"
  printf 'SUBMITTED recipient=%s message_id=%s\n' "${recipient}" "${message_id}"
done

sleep 3

echo ""
echo "Postfix queue after submission:"
dc exec -T postfix-mailcow postqueue -p || true

echo ""
echo "Recent postfix logs:"
dc logs --since 2m postfix-mailcow | tail -n 120 || true

if dc logs --since 2m postfix-mailcow 2>/dev/null | grep -q "does not match a verified Sender Identity"; then
  echo ""
  echo "Detected relay rejection:"
  echo "- SendGrid accepted the authenticated relay connection"
  echo "- but rejected the From address because the sender identity is not verified"
  echo "- current DNS/authentication truth must match the exact From domain used in SMOKE_FROM"
fi

echo ""
echo "Next gate:"
echo "- founder/personal mail does NOT count as proof"
echo "- verify both Gmail inboxes received the messages"
echo "- capture inbox proof mapped to each Message-ID above"
echo "- only then enable system BCC"
