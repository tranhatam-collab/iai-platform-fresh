#!/usr/bin/env bash
set -euo pipefail

DATE_ARG="${1:-}"
if [[ -n "${DATE_ARG}" ]]; then
  PROBE_DATE="${DATE_ARG}"
else
  PROBE_DATE="$(TZ=Asia/Ho_Chi_Minh date +%F)"
fi

BASE_URL="${TEAM2_PAY_GATE_BASE_URL:-https://pay.iai.one}"
TENANT_CODE="${TEAM2_PAY_GATE_TENANT_CODE:-vetuonglai}"
SITE_CODE="${TEAM2_PAY_GATE_SITE_CODE:-vetuonglai-member}"
PROVIDER_CODE="${TEAM2_PAY_GATE_PROVIDER:-payos}"
SUCCESS_URL="${TEAM2_PAY_GATE_SUCCESS_URL:-https://web.iai.one/checkout-success}"
CANCEL_URL="${TEAM2_PAY_GATE_CANCEL_URL:-https://web.iai.one/checkout-cancel}"
CALLBACK_URL="${TEAM2_PAY_GATE_CALLBACK_URL:-https://member.vetuonglai.com/api/access/webhooks/pay/iai-one}"
PLAN_CODE="${TEAM2_PAY_GATE_PLAN_CODE:-starter}"
AMOUNT="${TEAM2_PAY_GATE_AMOUNT:-3000}"
CURRENCY="${TEAM2_PAY_GATE_CURRENCY:-VND}"

restore_tty() {
  stty echo 2>/dev/null || true
}

trap restore_tty EXIT

if [[ -z "${TEAM2_PAY_GATE_API_KEY:-}" ]]; then
  stty -echo
  printf "TEAM2_PAY_GATE_API_KEY: " >&2
  IFS= read -r TEAM2_PAY_GATE_API_KEY
  stty echo
  printf "\n" >&2
  export TEAM2_PAY_GATE_API_KEY
fi

if [[ -z "${TEAM2_PAY_GATE_API_KEY:-}" ]]; then
  echo "ABORT: TEAM2_PAY_GATE_API_KEY is required." >&2
  exit 1
fi

STAMP="$(date +%s)"
IDEMPOTENCY_KEY="team2-one-shot-${PROBE_DATE//-/}-${STAMP}"
INTERNAL_ORDER_ID="ord_one_shot_${PROBE_DATE//-/}_${STAMP}"

HEALTH_OUT="/private/tmp/pay-one-shot-health-${PROBE_DATE}.json"
CHECKOUT_OUT="/private/tmp/pay-one-shot-checkout-${PROBE_DATE}.json"
SUMMARY_OUT="/private/tmp/pay-one-shot-summary-${PROBE_DATE}.json"

health_status="$(
  curl -sS -o "${HEALTH_OUT}" -w "%{http_code}" \
    "${BASE_URL}/health"
)"

checkout_status="$(
  curl -sS -o "${CHECKOUT_OUT}" -w "%{http_code}" \
    -X POST "${BASE_URL}/internal/checkout-session" \
    -H "content-type: application/json" \
    -H "x-api-key: ${TEAM2_PAY_GATE_API_KEY}" \
    -H "x-idempotency-key: ${IDEMPOTENCY_KEY}" \
    --data "$(cat <<EOF
{"tenant_code":"${TENANT_CODE}","site_code":"${SITE_CODE}","internal_order_id":"${INTERNAL_ORDER_ID}","provider":"${PROVIDER_CODE}","plan_code":"${PLAN_CODE}","amount":${AMOUNT},"currency":"${CURRENCY}","billing_cycle":"one_time","success_url":"${SUCCESS_URL}","cancel_url":"${CANCEL_URL}","callback_url":"${CALLBACK_URL}","user_id":"team2_probe","email":"team2-runtime@iai.one","full_name":"Team 2 Runtime Probe","locale":"vi","ref_code":"team2-one-shot"}
EOF
)"
)"

node - "${HEALTH_OUT}" "${CHECKOUT_OUT}" "${SUMMARY_OUT}" "${health_status}" "${checkout_status}" <<'EOF'
const fs = require("fs");

const [healthPath, checkoutPath, summaryPath, healthStatusRaw, checkoutStatusRaw] = process.argv.slice(2);
const healthStatus = Number(healthStatusRaw);
const checkoutStatus = Number(checkoutStatusRaw);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function getNested(input, path) {
  let current = input;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) {
      return null;
    }
    current = current[key];
  }
  return current ?? null;
}

function firstByKeys(input, keySet) {
  if (!input || typeof input !== "object") return null;
  const queue = [input];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }
    for (const [key, value] of Object.entries(current)) {
      if (keySet.has(key) && value !== null && value !== undefined && String(value).trim() !== "") {
        return value;
      }
      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }
  return null;
}

function collectNumericProviderCodes(input) {
  if (!input || typeof input !== "object") return [];
  const matches = [];
  const queue = [input];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }
    for (const [key, value] of Object.entries(current)) {
      const keyMatch = /payos|provider|status|code/i.test(key);
      if (keyMatch && (typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value)))) {
        matches.push(Number(value));
      }
      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }
  return [...new Set(matches)];
}

const health = readJson(healthPath);
const checkout = readJson(checkoutPath);

const sharedReadModel = getNested(health, ["data", "shared_read_model"]);
const sharedUpstreamRuntime = getNested(health, ["data", "shared_upstream_runtime"]);
const checkoutUrl = firstByKeys(checkout, new Set(["checkout_url", "checkoutUrl", "redirect_url", "redirectUrl", "url"]));
const checkoutCode =
  (checkout && typeof checkout === "object" && typeof checkout.code === "string" ? checkout.code : null) ||
  String(firstByKeys(checkout, new Set(["code"])) || "") ||
  null;
const checkoutMessage =
  (checkout && typeof checkout === "object" && typeof checkout.message === "string" ? checkout.message : null) ||
  (checkout && typeof checkout === "object" && typeof checkout.desc === "string" ? checkout.desc : null) ||
  null;
const paymentLinkId = firstByKeys(checkout, new Set(["payment_link_id", "paymentLinkId", "provider_payment_id", "providerPaymentId", "link_id", "linkId"]));
const providerCodes = collectNumericProviderCodes(checkout);
const has214 = providerCodes.includes(214);
const authFailureCodes = new Set(["API_KEY_REQUIRED", "API_KEY_INVALID", "API_KEY_SCOPE_MISMATCH"]);
const authContractPass = !authFailureCodes.has(checkoutCode || "") && checkoutStatus !== 401 && checkoutStatus !== 403;

const summary = {
  generatedAt: new Date().toISOString(),
  target: {
    health: healthPath,
    checkout: checkoutPath
  },
  signals: {
    health_status_ok: healthStatus === 200,
    shared_read_model_present: Boolean(sharedReadModel),
    auth_contract_pass: authContractPass,
    shared_upstream_runtime_present: Boolean(sharedUpstreamRuntime),
    checkout_status_201: checkoutStatus === 201,
    checkout_url_non_null: Boolean(checkoutUrl),
    payment_link_id_non_null: Boolean(paymentLinkId),
    no_214: !has214
  },
  extracted: {
    health_status: healthStatus,
    checkout_status: checkoutStatus,
    health_contract_shape:
      sharedReadModel || sharedUpstreamRuntime ? "shared_runtime_contract" : "legacy_or_unknown",
    checkout_code: checkoutCode,
    checkout_message: checkoutMessage,
    checkout_url: checkoutUrl || null,
    payment_link_id: paymentLinkId || null,
    provider_codes_numeric: providerCodes
  }
};

summary.pass = Object.values(summary.signals).every(Boolean);
summary.stop_owner = !summary.signals.shared_read_model_present || !summary.signals.shared_upstream_runtime_present
  ? "Team Runtime"
  : !summary.signals.auth_contract_pass
    ? "Team Runtime/Auth"
    : !summary.signals.checkout_url_non_null || !summary.signals.payment_link_id_non_null || !summary.signals.no_214
      ? "Team Pay"
      : "none";

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log(JSON.stringify(summary, null, 2));

if (!summary.pass) {
  process.exit(1);
}
EOF

echo "health_json=${HEALTH_OUT}"
echo "checkout_json=${CHECKOUT_OUT}"
echo "summary_json=${SUMMARY_OUT}"
