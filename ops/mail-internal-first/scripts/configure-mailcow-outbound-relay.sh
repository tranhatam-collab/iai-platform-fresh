#!/usr/bin/env bash
set -euo pipefail

# Manage Postfix outbound relay for a Mailcow stack.
#
# Required env for enable:
#   RELAYHOST=smtp-relay.example.com
#   RELAYHOST_PORT=587
#   RELAYHOST_USER=apikey-or-username
#   RELAYHOST_PASS=relay-password
#   RELAYHOST_TLS_LEVEL=encrypt
#
# Optional env:
#   MAILCOW_DIR=/opt/mailcow-dockerized
#
# Usage:
#   bash ops/mail-internal-first/scripts/configure-mailcow-outbound-relay.sh enable
#   bash ops/mail-internal-first/scripts/configure-mailcow-outbound-relay.sh status
#   bash ops/mail-internal-first/scripts/configure-mailcow-outbound-relay.sh disable

MODE="${1:-status}"
MAILCOW_DIR="${MAILCOW_DIR:-/opt/mailcow-dockerized}"
POSTFIX_CONF_DIR="${MAILCOW_DIR}/data/conf/postfix"
EXTRA_CF="${POSTFIX_CONF_DIR}/extra.cf"
SASL_PASSWD="${POSTFIX_CONF_DIR}/sasl_passwd"
BEGIN_MARKER="# BEGIN IAI OUTBOUND RELAY"
END_MARKER="# END IAI OUTBOUND RELAY"

RELAYHOST="${RELAYHOST:-}"
RELAYHOST_PORT="${RELAYHOST_PORT:-587}"
RELAYHOST_USER="${RELAYHOST_USER:-}"
RELAYHOST_PASS="${RELAYHOST_PASS:-}"
RELAYHOST_TLS_LEVEL="${RELAYHOST_TLS_LEVEL:-encrypt}"

dc() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "${MAILCOW_DIR}/docker-compose.yml" "$@"
  else
    docker-compose -f "${MAILCOW_DIR}/docker-compose.yml" "$@"
  fi
}

wait_for_runtime_relay() {
  local expected="[${RELAYHOST}]:${RELAYHOST_PORT}"
  local runtime=""
  local attempt

  for attempt in $(seq 1 30); do
    runtime="$(dc exec -T postfix-mailcow postconf -h relayhost 2>/dev/null || true)"
    if [ "${runtime}" = "${expected}" ]; then
      echo "Postfix runtime relay is active: ${runtime}"
      return 0
    fi
    sleep 1
  done

  echo "Postfix runtime relay did not converge to ${expected} within 30s." >&2
  echo "Current runtime value: ${runtime:-<empty>}" >&2
  return 1
}

require_file() {
  [ -f "$1" ] || {
    echo "Missing required file: $1" >&2
    exit 1
  }
}

strip_managed_block() {
  local file="$1"
  local tmp
  tmp="$(mktemp)"

  if [ -f "$file" ]; then
    awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" '
      $0 == begin { skip=1; next }
      $0 == end { skip=0; next }
      !skip { print }
    ' "$file" > "$tmp"
    mv "$tmp" "$file"
  else
    : > "$file"
    rm -f "$tmp"
  fi
}

append_managed_block() {
  cat >> "$EXTRA_CF" <<EOF
$BEGIN_MARKER
relayhost = [${RELAYHOST}]:${RELAYHOST_PORT}
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = texthash:/opt/postfix/conf/sasl_passwd
smtp_sasl_security_options = noanonymous
smtp_sasl_tls_security_options = noanonymous
smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt
smtp_use_tls = yes
smtp_tls_security_level = ${RELAYHOST_TLS_LEVEL}
$END_MARKER
EOF
}

enable_relay() {
  require_file "${MAILCOW_DIR}/docker-compose.yml"
  mkdir -p "$POSTFIX_CONF_DIR"

  [ -n "$RELAYHOST" ] || { echo "RELAYHOST is required" >&2; exit 1; }
  [ -n "$RELAYHOST_USER" ] || { echo "RELAYHOST_USER is required" >&2; exit 1; }
  [ -n "$RELAYHOST_PASS" ] || { echo "RELAYHOST_PASS is required" >&2; exit 1; }

  strip_managed_block "$EXTRA_CF"
  append_managed_block

  printf "[%s]:%s %s:%s\n" "$RELAYHOST" "$RELAYHOST_PORT" "$RELAYHOST_USER" "$RELAYHOST_PASS" > "$SASL_PASSWD"
  chmod 600 "$EXTRA_CF" "$SASL_PASSWD"

  dc exec -T postfix-mailcow postmap /opt/postfix/conf/sasl_passwd
  dc restart postfix-mailcow >/dev/null
  wait_for_runtime_relay

  echo "Relay enabled."
  echo "  relayhost: ${RELAYHOST}:${RELAYHOST_PORT}"
  echo "  tls level: ${RELAYHOST_TLS_LEVEL}"
}

disable_relay() {
  require_file "${MAILCOW_DIR}/docker-compose.yml"
  strip_managed_block "$EXTRA_CF"
  rm -f "$SASL_PASSWD" "${SASL_PASSWD}.db"
  dc restart postfix-mailcow >/dev/null
  echo "Relay disabled. Postfix is back to direct delivery mode."
}

show_status() {
  require_file "${MAILCOW_DIR}/docker-compose.yml"

  echo "Mailcow dir: ${MAILCOW_DIR}"
  if [ -f "$EXTRA_CF" ] && grep -qF "$BEGIN_MARKER" "$EXTRA_CF"; then
    echo "Managed relay block:"
    sed -n "/$BEGIN_MARKER/,/$END_MARKER/p" "$EXTRA_CF"
  else
    echo "Managed relay block: not present"
  fi

  if [ -f "$SASL_PASSWD" ]; then
    echo "sasl_passwd: present"
  else
    echo "sasl_passwd: missing"
  fi

  echo ""
  echo "Postfix relay runtime:"
  dc exec -T postfix-mailcow postconf relayhost smtp_sasl_auth_enable smtp_sasl_password_maps smtp_tls_security_level || true

  echo ""
  echo "Postfix queue:"
  dc exec -T postfix-mailcow postqueue -p || true
}

case "$MODE" in
  enable)
    enable_relay
    ;;
  disable)
    disable_relay
    ;;
  status)
    show_status
    ;;
  *)
    echo "Usage: $0 {enable|disable|status}" >&2
    exit 1
    ;;
esac
