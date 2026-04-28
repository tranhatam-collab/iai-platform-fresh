#!/usr/bin/env bash
set -euo pipefail

TARGET_IP="${TARGET_IP:-89.167.116.167}"
API_HOST="${API_HOST:-api.mail.iai.one}"
SMTP_HOST="${SMTP_HOST:-smtp.mail.iai.one}"
INBOUND_HOST="${INBOUND_HOST:-inbound.mail.iai.one}"

usage() {
  cat <<'EOF'
Usage:
  bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh <check>

Checks:
  api-health
  api-dependencies
  api-cert
  smtp-cert
  inbound-cert

Optional env:
  TARGET_IP=89.167.116.167
  API_HOST=api.mail.iai.one
  SMTP_HOST=smtp.mail.iai.one
  INBOUND_HOST=inbound.mail.iai.one
EOF
}

require_san() {
  local output="$1"
  local hostname="$2"

  if ! printf '%s\n' "$output" | grep -q "DNS:${hostname}"; then
    printf 'FAIL: certificate SAN does not include %s\n' "$hostname" >&2
    exit 1
  fi
}

fetch_cert_details() {
  local connect_target="$1"
  local servername="$2"
  local starttls_mode="${3:-}"
  local pem

  if [[ -n "$starttls_mode" ]]; then
    pem="$(printf '' | openssl s_client -starttls "$starttls_mode" -connect "$connect_target" -servername "$servername" 2>/dev/null \
      | sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p')"
  else
    pem="$(printf '' | openssl s_client -connect "$connect_target" -servername "$servername" 2>/dev/null \
      | sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p')"
  fi

  if [[ -z "$pem" ]]; then
    printf 'FAIL: could not read certificate from %s for %s\n' "$connect_target" "$servername" >&2
    exit 1
  fi

  {
    printf '%s\n' "$pem" | openssl x509 -noout -subject -issuer -dates
    printf '%s\n' "$pem" | openssl x509 -noout -text \
      | awk '/Subject Alternative Name/{getline; gsub(/^[[:space:]]+/, "", $0); print "SAN: " $0}'
  }
}

run_api_health() {
  curl --fail --silent --show-error --resolve "${API_HOST}:443:${TARGET_IP}" "https://${API_HOST}/v1/health"
  printf '\nPASS: %s /v1/health\n' "$API_HOST"
}

run_api_dependencies() {
  curl --fail --silent --show-error --resolve "${API_HOST}:443:${TARGET_IP}" "https://${API_HOST}/v1/health/dependencies"
  printf '\nPASS: %s /v1/health/dependencies\n' "$API_HOST"
}

run_api_cert() {
  local output
  output="$(fetch_cert_details "${TARGET_IP}:443" "$API_HOST")"
  printf '%s\n' "$output"
  require_san "$output" "$API_HOST"
  printf 'PASS: certificate covers %s via %s:443\n' "$API_HOST" "$TARGET_IP"
}

run_smtp_cert() {
  local output
  output="$(fetch_cert_details "${TARGET_IP}:587" "$SMTP_HOST" smtp)"
  printf '%s\n' "$output"
  require_san "$output" "$SMTP_HOST"
  printf 'PASS: STARTTLS certificate covers %s via %s:587\n' "$SMTP_HOST" "$TARGET_IP"
}

run_inbound_cert() {
  local output
  output="$(fetch_cert_details "${TARGET_IP}:443" "$INBOUND_HOST")"
  printf '%s\n' "$output"
  require_san "$output" "$INBOUND_HOST"
  printf 'PASS: certificate covers %s via %s:443\n' "$INBOUND_HOST" "$TARGET_IP"
}

main() {
  if [[ $# -ne 1 ]]; then
    usage >&2
    exit 1
  fi

  case "$1" in
    api-health)
      run_api_health
      ;;
    api-dependencies)
      run_api_dependencies
      ;;
    api-cert)
      run_api_cert
      ;;
    smtp-cert)
      run_smtp_cert
      ;;
    inbound-cert)
      run_inbound_cert
      ;;
    *)
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
