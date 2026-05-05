import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const productionSignalStart = "2026-04-19T00:00:00+07:00";

function todayInTimezone(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function getArg(name) {
  const explicit = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  if (!explicit) {
    return null;
  }
  return explicit.slice(name.length + 3);
}

function getDateArg() {
  return getArg("date") ?? todayInTimezone(timezone);
}

function boolStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function toSafeJson(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value;
}

function resolveAuthHeader(env) {
  const apiKey =
    env.TEAM2_PAY_GATE_API_KEY ||
    env.PAY_IAI_ONE_GATE_API_KEY ||
    env.TNO_PAY_GATE_API_KEY ||
    null;
  if (apiKey) {
    return {
      headerName: "x-api-key",
      headerValue: apiKey,
      source:
        env.TEAM2_PAY_GATE_API_KEY
          ? "TEAM2_PAY_GATE_API_KEY"
          : env.PAY_IAI_ONE_GATE_API_KEY
            ? "PAY_IAI_ONE_GATE_API_KEY"
            : "TNO_PAY_GATE_API_KEY"
    };
  }

  const siteKey =
    env.TEAM2_PAY_GATE_SITE_KEY ||
    env.PAY_IAI_ONE_GATE_SITE_KEY ||
    env.TNO_PAY_GATE_SITE_KEY ||
    null;
  if (siteKey) {
    return {
      headerName: "x-site-key",
      headerValue: siteKey,
      source:
        env.TEAM2_PAY_GATE_SITE_KEY
          ? "TEAM2_PAY_GATE_SITE_KEY"
          : env.PAY_IAI_ONE_GATE_SITE_KEY
            ? "PAY_IAI_ONE_GATE_SITE_KEY"
            : "TNO_PAY_GATE_SITE_KEY"
    };
  }

  return {
    headerName: null,
    headerValue: null,
    source: "none"
  };
}

function firstByKeys(input, keySet) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const queue = [input];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") {
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
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

function collectNumericProviderCodes(input) {
  if (!input || typeof input !== "object") {
    return [];
  }

  const matches = [];
  const queue = [input];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") {
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
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

  return matches;
}

async function fetchJsonWithMeta(url, init = {}) {
  const startedAt = new Date().toISOString();
  const response = await fetch(url, init);
  const endedAt = new Date().toISOString();
  const text = await response.text();

  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return {
    url,
    method: init.method ?? "GET",
    startedAt,
    endedAt,
    status: response.status,
    ok: response.ok,
    body: json ?? text
  };
}

async function main() {
  const root = process.cwd();
  const date = getDateArg();
  const reportDir = path.join(root, "docs", "reports", "team2");
  const baseUrl = process.env.TEAM2_PAY_GATE_BASE_URL ?? "https://pay.iai.one";
  const endpointPath = process.env.TEAM2_PAY_GATE_ENDPOINT ?? "/internal/checkout-session";
  const targetUrl = new URL(endpointPath, baseUrl).toString();
  const idempotencyKey = `team2-prod-${date.replace(/-/g, "")}-${Date.now().toString(36)}`;

  const authHeader = resolveAuthHeader(process.env);
  const keyHeaderName = authHeader.headerName;
  const keyHeaderValue = authHeader.headerValue;
  const authKeyPresent = Boolean(keyHeaderValue);

  const orderPrefix = process.env.TEAM2_PAY_GATE_ORDER_PREFIX ?? "ord_team2_probe";
  const orderId = `${orderPrefix}_${date.replace(/-/g, "")}_${Date.now().toString(36)}`;

  const payload = {
    tenant_code: process.env.TEAM2_PAY_GATE_TENANT_CODE ?? "vetuonglai",
    site_code: process.env.TEAM2_PAY_GATE_SITE_CODE ?? "vetuonglai-member",
    internal_order_id: orderId,
    provider: process.env.TEAM2_PAY_GATE_PROVIDER ?? "payos",
    plan_code: process.env.TEAM2_PAY_GATE_PLAN_CODE ?? "starter",
    amount: Number.parseInt(process.env.TEAM2_PAY_GATE_AMOUNT ?? "3000", 10),
    currency: process.env.TEAM2_PAY_GATE_CURRENCY ?? "VND",
    billing_cycle: process.env.TEAM2_PAY_GATE_BILLING_CYCLE ?? "one_time",
    success_url: process.env.TEAM2_PAY_GATE_SUCCESS_URL ?? "https://web.iai.one/checkout-success",
    cancel_url: process.env.TEAM2_PAY_GATE_CANCEL_URL ?? "https://web.iai.one/checkout-cancel",
    callback_url:
      process.env.TEAM2_PAY_GATE_CALLBACK_URL ?? "https://member.vetuonglai.com/api/access/webhooks/pay/iai-one",
    user_id: process.env.TEAM2_PAY_GATE_USER_ID ?? "team2_probe",
    email: process.env.TEAM2_PAY_GATE_EMAIL ?? "team2-runtime@iai.one",
    full_name: process.env.TEAM2_PAY_GATE_FULL_NAME ?? "Team 2 Runtime Probe",
    locale: process.env.TEAM2_PAY_GATE_LOCALE ?? "vi",
    ref_code: process.env.TEAM2_PAY_GATE_REF_CODE ?? "team2-gate-runtime"
  };

  const requestHeaders = {
    "content-type": "application/json",
    "x-idempotency-key": idempotencyKey
  };
  if (keyHeaderName && keyHeaderValue) {
    requestHeaders[keyHeaderName] = keyHeaderValue;
  }

  const [health, providers, checkout] = await Promise.all([
    fetchJsonWithMeta(new URL("/health", baseUrl).toString()),
    fetchJsonWithMeta(new URL("/v1/providers", baseUrl).toString()),
    fetchJsonWithMeta(targetUrl, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(payload)
    })
  ]);

  const checkoutBody = toSafeJson(checkout.body);
  const healthBody = toSafeJson(health.body);
  const checkoutUrl = firstByKeys(checkoutBody, new Set(["checkout_url", "checkoutUrl", "redirect_url", "redirectUrl", "url"]));
  const paymentLinkId = firstByKeys(
    checkoutBody,
    new Set([
      "payment_link_id",
      "paymentLinkId",
      "payment_link",
      "paymentLink",
      "link_id",
      "linkId",
      "provider_payment_id",
      "providerPaymentId"
    ])
  );
  const providerCodes = collectNumericProviderCodes(checkoutBody);
  const has214 = providerCodes.includes(214);
  const sharedReadModel = getNested(healthBody, ["data", "shared_read_model"]);
  const sharedUpstreamRuntime = getNested(healthBody, ["data", "shared_upstream_runtime"]);
  const sharedReadModelReadyForSharedOnly =
    getNested(sharedReadModel, ["rolloutReadyForSharedOnly"]) === true;
  const sharedUpstreamReleaseGateReady =
    getNested(sharedUpstreamRuntime, ["releaseGate", "ready"]) === true;
  const sharedUpstreamActiveReadModeSharedContract =
    getNested(sharedUpstreamRuntime, ["activeReadMode"]) === "shared_contract";

  const attemptAfter20260419 = Date.parse(checkout.startedAt) >= Date.parse(productionSignalStart);
  const checkoutUrlNonNull = Boolean(checkoutUrl);
  const paymentLinkIdNonNull = Boolean(paymentLinkId);
  const no214 = authKeyPresent && checkout.ok && !has214;
  const productionGateGreen =
    authKeyPresent &&
    attemptAfter20260419 &&
    checkout.ok &&
    checkoutUrlNonNull &&
    paymentLinkIdNonNull &&
    no214;

  const signals = {
    auth_key_present: authKeyPresent,
    attempt_after_2026_04_19: attemptAfter20260419,
    checkout_url_non_null: checkoutUrlNonNull,
    payment_link_id_non_null: paymentLinkIdNonNull,
    no_214: no214,
    production_gate_green: productionGateGreen,
    shared_read_model_ready_for_shared_only: sharedReadModelReadyForSharedOnly,
    shared_upstream_active_read_mode_shared_contract:
      sharedUpstreamActiveReadModeSharedContract,
    shared_upstream_release_gate_ready: sharedUpstreamReleaseGateReady
  };

  const unmetSignals = Object.entries(signals)
    .filter(([, pass]) => !pass)
    .map(([signal]) => signal);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    timezone,
    date,
    signalStart: productionSignalStart,
    target: {
      baseUrl,
      endpointPath,
      targetUrl
    },
    auth: {
      keyHeaderName,
      keyProvided: authKeyPresent,
      keySource: authHeader.source
    },
    request: {
      idempotencyKey,
      internal_order_id: payload.internal_order_id,
      tenant_code: payload.tenant_code,
      site_code: payload.site_code,
      amount: payload.amount,
      currency: payload.currency
    },
    responses: {
      health,
      providers,
      checkout
    },
    extracted: {
      checkout_url: checkoutUrl ?? null,
      shared_read_model_rollout_ready_for_shared_only:
        sharedReadModelReadyForSharedOnly,
      shared_upstream_active_read_mode:
        getNested(sharedUpstreamRuntime, ["activeReadMode"]) ?? null,
      shared_upstream_release_gate_ready:
        sharedUpstreamReleaseGateReady,
      shared_upstream_release_gate_reasons:
        getNested(sharedUpstreamRuntime, ["releaseGate", "reasons"]) ?? null,
      payment_link_id: paymentLinkId ?? null,
      provider_codes_numeric: providerCodes
    },
    signals,
    unmetSignals
  };

  await mkdir(reportDir, { recursive: true });
  const outputJsonPath = path.join(reportDir, `TEAM2_PAY_PROD_RUNTIME_PROBE_${date}.json`);
  const outputMdPath = path.join(reportDir, `TEAM2_PAY_PROD_RUNTIME_PROBE_${date}.md`);

  await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const checkoutCode = checkoutBody && typeof checkoutBody === "object" ? checkoutBody.code ?? "N/A" : "N/A";
  const checkoutMessage =
    checkoutBody && typeof checkoutBody === "object" ? checkoutBody.message ?? "N/A" : "N/A";

  const markdown = [
    `# TEAM2_PAY_PROD_RUNTIME_PROBE_${date}`,
    `- Nhóm: Team 2 Runtime and Platform Core`,
    `- Generated at: ${snapshot.generatedAt}`,
    `- Timezone: ${timezone}`,
    `- Target: \`${targetUrl}\``,
    `- Key header: \`${keyHeaderName ?? "none"}\``,
    `- Key source: \`${authHeader.source}\``,
    `- Key provided: \`${boolStatus(authKeyPresent)}\``,
    "",
    "## Kết quả runtime attempt",
    `- HTTP status checkout: \`${checkout.status}\``,
    `- Checkout code: \`${String(checkoutCode)}\``,
    `- Checkout message: \`${String(checkoutMessage)}\``,
    `- checkout_url: \`${checkoutUrl ?? "null"}\``,
    `- payment_link_id: \`${paymentLinkId ?? "null"}\``,
    `- provider numeric codes: \`${providerCodes.length > 0 ? providerCodes.join(",") : "none"}\``,
    `- shared_read_model.rolloutReadyForSharedOnly: \`${boolStatus(sharedReadModelReadyForSharedOnly)}\``,
    `- shared_upstream_runtime.activeReadMode = shared_contract: \`${boolStatus(sharedUpstreamActiveReadModeSharedContract)}\``,
    `- shared_upstream_runtime.releaseGate.ready: \`${boolStatus(sharedUpstreamReleaseGateReady)}\``,
    `- shared_upstream_runtime.releaseGate.reasons: \`${Array.isArray(getNested(sharedUpstreamRuntime, ["releaseGate", "reasons"])) ? getNested(sharedUpstreamRuntime, ["releaseGate", "reasons"]).join(",") || "none" : "none"}\``,
    "",
    "## Tín hiệu máy đọc",
    `- \`auth_key_present\`: \`${boolStatus(authKeyPresent)}\``,
    `- \`attempt_after_2026_04_19\`: \`${boolStatus(attemptAfter20260419)}\``,
    `- \`checkout_url_non_null\`: \`${boolStatus(checkoutUrlNonNull)}\``,
    `- \`payment_link_id_non_null\`: \`${boolStatus(paymentLinkIdNonNull)}\``,
    `- \`no_214\`: \`${boolStatus(no214)}\``,
    `- \`production_gate_green\`: \`${boolStatus(productionGateGreen)}\``,
    `- \`shared_read_model_ready_for_shared_only\`: \`${boolStatus(sharedReadModelReadyForSharedOnly)}\``,
    `- \`shared_upstream_active_read_mode_shared_contract\`: \`${boolStatus(sharedUpstreamActiveReadModeSharedContract)}\``,
    `- \`shared_upstream_release_gate_ready\`: \`${boolStatus(sharedUpstreamReleaseGateReady)}\``,
    "",
    "## Unmet signals",
    ...(unmetSignals.length === 0 ? ["- none"] : unmetSignals.map((signal) => `- ${signal}`)),
    "",
    "## Nguồn JSON",
    `- ${path.relative(root, outputJsonPath)}`,
    ""
  ].join("\n");

  await writeFile(outputMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(
    [
      `Team 2 pay runtime probe generated for ${date}.`,
      `Checkout HTTP status: ${checkout.status}.`,
      `Unmet signals: ${unmetSignals.length > 0 ? unmetSignals.join(", ") : "none"}.`,
      `JSON: ${path.relative(root, outputJsonPath)}`,
      `MD: ${path.relative(root, outputMdPath)}`
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(
    `team2 pay runtime probe failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
});
