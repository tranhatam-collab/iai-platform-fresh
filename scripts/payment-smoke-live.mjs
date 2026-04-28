import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const requiredRuntimeBindings = [
  "MAIL_API_BASE_URL",
  "MAIL_API_KEY",
  "MAIL_API_WORKSPACE_ID",
  "PAY_EMAIL_ADAPTER_INTERNAL_KEY"
];

function todayInTimezone(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).format(new Date());
}

function getArg(name, fallback = "") {
  const argument = process.argv.find((item) => item.startsWith(`--${name}=`));
  return argument ? argument.slice(name.length + 3) : fallback;
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function normalizeDomain(value) {
  return value.trim().toLowerCase().replace(/^https?:\/\//u, "").replace(/^www\./u, "");
}

function slugifyDomain(domain) {
  return domain.replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

function parseStringMapJson(raw, label) {
  const source = normalizeString(raw);
  if (!source) return {};

  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }

  const mapped = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!normalizeString(key)) continue;
    mapped[key] = normalizeString(value);
  }

  return mapped;
}

function hasHeader(headers, targetName) {
  const target = String(targetName || "").trim().toLowerCase();
  if (!target) return false;

  return Object.keys(headers).some((key) => String(key).trim().toLowerCase() === target);
}

function toSafeJson(value) {
  return value && typeof value === "object" ? value : null;
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
      if (keySet.has(key) && normalizeString(value) !== "") {
        return normalizeString(value);
      }
      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }
  return null;
}

async function fetchJsonWithMeta(url, init = {}) {
  const startedAt = new Date().toISOString();
  const response = await fetch(url, init);
  const endedAt = new Date().toISOString();
  const text = await response.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return {
    body,
    endedAt,
    method: init.method ?? "GET",
    ok: response.ok,
    startedAt,
    status: response.status,
    url
  };
}

function buildDefaultCheckoutPayload(domain) {
  return {
    amount: "250000",
    candidate_email: "tranhatam@gmail.com",
    cancel_url: `https://${domain}/membership`,
    entry: "homepage",
    gateway: "pay",
    intent: "annual-access",
    lang: "vi",
    metadata: {
      ref: "phase2-payment-smoke",
      slug: "phase2-payment-smoke"
    },
    return_url: `https://${domain}/thank-you`,
    source: "hero"
  };
}

function toMarkdown(snapshot) {
  const runtimeLines = snapshot.runtimeBindings
    .map((item) => `- ${item.present ? "PASS" : "FAIL"} \`${item.key}\``)
    .join("\n");
  const signalLines = Object.entries(snapshot.signals)
    .map(([key, pass]) => `- ${pass ? "PASS" : "FAIL"} \`${key}\``)
    .join("\n");

  return `# PAYMENT_SMOKE_LIVE_${snapshot.domainSlug.toUpperCase()}_${snapshot.date}
- Date: ${snapshot.date}
- Domain: \`${snapshot.domain}\`
- Mode: \`${snapshot.mode}\`
- Pay gate target state: \`LOCK_RETAINED_WITH_REASON -> PAYMENT_LIVE\`
- Phase 2 payment state: \`${snapshot.phase2PaymentState}\`
- Overall: \`${snapshot.overallPass ? "PASS" : "FAIL"}\`

## Runtime Binding Presence
${runtimeLines}

## Checkout Probe
- attempted: \`${snapshot.checkoutProbe.attempted}\`
- status: \`${snapshot.checkoutProbe.status}\`
- provider_ref: \`${snapshot.checkoutProbe.providerRef || "MISSING"}\`
- payment_session_ref: \`${snapshot.checkoutProbe.paymentSessionRef || "MISSING"}\`
- checkout_url: \`${snapshot.checkoutProbe.checkoutUrl || "MISSING"}\`

## Mail Handoff Probe
- attempted: \`${snapshot.mailHandoffProbe.attempted}\`
- status: \`${snapshot.mailHandoffProbe.status}\`
- accepted: \`${snapshot.mailHandoffProbe.accepted}\`
- message_id: \`${snapshot.mailHandoffProbe.messageId || "MISSING"}\`

## External Evidence
- provider_ref: \`${snapshot.externalEvidence.providerRef || "MISSING"}\`
- payment_session_ref: \`${snapshot.externalEvidence.paymentSessionRef || "MISSING"}\`
- mail_message_id: \`${snapshot.externalEvidence.messageId || "MISSING"}\`
- d1_or_canonical_row_ref: \`${snapshot.externalEvidence.d1OrCanonicalRowRef || "MISSING"}\`
- inbox_proof_gmail_1: \`${snapshot.externalEvidence.inboxProofGmail1 || "MISSING"}\`
- inbox_proof_gmail_2: \`${snapshot.externalEvidence.inboxProofGmail2 || "MISSING"}\`

## Required Signals
${signalLines}
`;
}

async function main() {
  const root = process.cwd();
  const date = getArg("date", todayInTimezone(timezone));
  const modeArg = normalizeString(getArg("mode", ""));
  const mode =
    process.argv.includes("--dry-run") || modeArg.toLowerCase() === "dry-run"
      ? "dry-run"
      : "live";
  const allowRed = process.argv.includes("--allow-red");
  const domainInput =
    normalizeString(getArg("domain", "")) ||
    normalizeString(getArg("site", "")) ||
    normalizeString(process.env.PAYMENT_SMOKE_DOMAIN) ||
    "tranhatam.com";
  const domain = normalizeDomain(domainInput);
  const domainSlug = slugifyDomain(domain);
  const payBaseUrl = getArg("pay-base-url", process.env.PAYMENT_SMOKE_PAY_BASE_URL || "https://pay.iai.one");
  const checkoutEndpoint = getArg(
    "checkout-endpoint",
    process.env.PAYMENT_SMOKE_CHECKOUT_ENDPOINT || ""
  );
  const checkoutHeaders = parseStringMapJson(
    getArg("checkout-headers-json", process.env.PAYMENT_SMOKE_CHECKOUT_HEADERS_JSON || ""),
    "PAYMENT_SMOKE_CHECKOUT_HEADERS_JSON"
  );
  if (!hasHeader(checkoutHeaders, "x-idempotency-key")) {
    checkoutHeaders["x-idempotency-key"] = `payment-smoke-${domainSlug}-${Date.now()}`;
  }
  const checkoutPayloadSource =
    getArg("checkout-payload-json", process.env.PAYMENT_SMOKE_CHECKOUT_PAYLOAD_JSON || "") || null;
  let checkoutPayload = buildDefaultCheckoutPayload(domain);
  if (checkoutPayloadSource) {
    try {
      checkoutPayload = JSON.parse(checkoutPayloadSource);
    } catch (error) {
      throw new Error(`PAYMENT_SMOKE_CHECKOUT_PAYLOAD_JSON is not valid JSON: ${error.message}`);
    }
  }

  const runtimeBindings = requiredRuntimeBindings.map((key) => ({
    key,
    present: normalizeString(process.env[key]) !== ""
  }));
  const runtimeBindingsReady = runtimeBindings.every((item) => item.present);

  const checkoutProbe = {
    attempted: false,
    body: null,
    checkoutUrl: normalizeString(process.env.PAYMENT_SMOKE_CHECKOUT_URL),
    paymentSessionRef: normalizeString(process.env.PAYMENT_SMOKE_SESSION_REF),
    providerRef: normalizeString(process.env.PAYMENT_SMOKE_PROVIDER_REF),
    status: null
  };

  if (mode !== "dry-run" && checkoutEndpoint) {
    checkoutProbe.attempted = true;
    const checkoutResponse = await fetchJsonWithMeta(checkoutEndpoint, {
      body: JSON.stringify(checkoutPayload),
      headers: {
        "content-type": "application/json",
        ...checkoutHeaders
      },
      method: "POST"
    });
    checkoutProbe.status = checkoutResponse.status;
    checkoutProbe.body = checkoutResponse.body;
    const checkoutBody = toSafeJson(checkoutResponse.body);
    checkoutProbe.providerRef =
      checkoutProbe.providerRef ||
      firstByKeys(checkoutBody, new Set(["provider_ref", "providerRef", "provider_reference"]));
    checkoutProbe.paymentSessionRef =
      checkoutProbe.paymentSessionRef ||
      firstByKeys(
        checkoutBody,
        new Set([
          "payment_session_id",
          "paymentSessionId",
          "session_id",
          "sessionId",
          "payment_link_id",
          "paymentLinkId",
          "provider_order_id",
          "order_code",
          "orderCode",
          "transaction_id",
          "transactionId",
          "id"
        ])
      );
    checkoutProbe.checkoutUrl =
      checkoutProbe.checkoutUrl ||
      firstByKeys(
        checkoutBody,
        new Set(["checkout_url", "checkoutUrl", "payment_url", "paymentUrl", "url"])
      );
  }

  const mailHandoffProbe = {
    accepted: parseBool(process.env.PAYMENT_SMOKE_SEND_ACCEPTED, false),
    attempted: false,
    body: null,
    messageId: normalizeString(process.env.PAYMENT_SMOKE_MESSAGE_ID),
    route: "none",
    status: null
  };

  if (mode !== "dry-run") {
    const adapterPath =
      getArg("mail-handoff-path", process.env.PAYMENT_SMOKE_MAIL_HANDOFF_PATH || "") ||
      "/internal/payment-email/send";
    const mailApiSendPath =
      getArg("mail-api-send-path", process.env.PAYMENT_SMOKE_MAIL_API_SEND_PATH || "") || "/send";
    const handoffModeRaw = normalizeString(
      getArg("mail-handoff-mode", process.env.PAYMENT_SMOKE_MAIL_HANDOFF_MODE || "auto")
    ).toLowerCase();
    const handoffMode =
      handoffModeRaw === "adapter" || handoffModeRaw === "mailapi" || handoffModeRaw === "auto"
        ? handoffModeRaw
        : "auto";

    const attemptAdapterSend = async () => {
      const adapterKey = normalizeString(process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY);
      if (!adapterKey) return null;

      mailHandoffProbe.attempted = true;
      mailHandoffProbe.route = "pay_adapter";
      const handoffUrl = new URL(adapterPath, payBaseUrl).toString();
      const handoffPayload = {
        amount: "250000",
        currency: "VND",
        domain,
        messageIdempotencyKey: `phase2-live-${domainSlug}-${Date.now()}`,
        orderId: `phase2_order_${Date.now()}`,
        paymentSessionId: checkoutProbe.paymentSessionRef || `phase2_session_${Date.now()}`,
        productName: "Phase 2 payment smoke",
        providerReference: checkoutProbe.providerRef || `phase2_provider_${Date.now()}`,
        recipientEmail: process.env.PAYMENT_SMOKE_RECIPIENT_EMAIL || "tranhatam@gmail.com",
        recipientName: "Phase 2 Smoke",
        templateId: "payment_receipt"
      };

      const handoffResponse = await fetchJsonWithMeta(handoffUrl, {
        body: JSON.stringify(handoffPayload),
        headers: {
          "content-type": "application/json",
          "x-pay-email-adapter-key": adapterKey
        },
        method: "POST"
      });
      mailHandoffProbe.status = handoffResponse.status;
      mailHandoffProbe.body = handoffResponse.body;

      const handoffBody = toSafeJson(handoffResponse.body);
      const statusValue = normalizeString(firstByKeys(handoffBody, new Set(["status"]))).toLowerCase();
      const messageId = firstByKeys(handoffBody, new Set(["message_id", "messageId", "mail_message_id"]));
      if (messageId) mailHandoffProbe.messageId = messageId;
      mailHandoffProbe.accepted =
        handoffResponse.status === 202 &&
        (statusValue === "queued" || statusValue === "accepted");

      return handoffResponse;
    };

    const attemptMailApiSend = async () => {
      const mailApiBaseUrl = normalizeString(process.env.MAIL_API_BASE_URL);
      const mailApiKey = normalizeString(process.env.MAIL_API_KEY);
      const workspaceId = normalizeString(process.env.MAIL_API_WORKSPACE_ID);
      if (!mailApiBaseUrl || !mailApiKey || !workspaceId) return null;

      mailHandoffProbe.attempted = true;
      mailHandoffProbe.route = "mail_api_send";
      const sendUrl = new URL(mailApiSendPath, mailApiBaseUrl).toString();
      const recipientEmail = normalizeString(process.env.PAYMENT_SMOKE_RECIPIENT_EMAIL) || "tranhatam@gmail.com";
      const fromEmail = `pay@${domain}`;
      const replyToEmail = `support@${domain}`;
      const idempotencyKey = `pay-${domainSlug}-${Date.now()}-payment_receipt`;
      const useLegacyEmailsEndpoint = normalizeString(mailApiSendPath).toLowerCase() === "/emails";
      const payload = useLegacyEmailsEndpoint
        ? {
            from: `${domain} <${fromEmail}>`,
            html: `<p>Payment smoke message for <strong>${domain}</strong>.</p>`,
            reply_to: replyToEmail,
            subject: `${domain} | Payment receipt`,
            text: `Payment smoke message for ${domain}.`,
            to: recipientEmail
          }
        : {
            from: {
              email: fromEmail,
              name: domain
            },
            headers: {
              "X-Source-App": "pay.iai.one"
            },
            message_idempotency_key: idempotencyKey,
            metadata: {
              order_id: `phase2_order_${Date.now()}`,
              payment_session_id: checkoutProbe.paymentSessionRef || `phase2_session_${Date.now()}`,
              provider_reference: checkoutProbe.providerRef || `phase2_provider_${Date.now()}`,
              source_app: "pay.iai.one",
              source_domain: domain,
              template_id: "payment_receipt"
            },
            reply_to: {
              email: replyToEmail,
              name: `${domain} Support`
            },
            stream: "transactional",
            subject: `${domain} | Payment receipt`,
            tags: ["pay", "payment_receipt", domain],
            text: `Payment smoke message for ${domain}.`,
            to: [
              {
                email: recipientEmail,
                name: "Payment Smoke"
              }
            ]
          };

      const sendResponse = await fetchJsonWithMeta(sendUrl, {
        body: JSON.stringify(payload),
        headers: {
          authorization: `Bearer ${mailApiKey}`,
          "content-type": "application/json",
          "x-request-id": idempotencyKey,
          "x-workspace-id": workspaceId
        },
        method: "POST"
      });
      mailHandoffProbe.status = sendResponse.status;
      mailHandoffProbe.body = sendResponse.body;

      const sendBody = toSafeJson(sendResponse.body);
      const statusValue = normalizeString(firstByKeys(sendBody, new Set(["status"]))).toLowerCase();
      const messageId = firstByKeys(
        sendBody,
        new Set(["message_id", "messageId", "mail_message_id", "id"])
      );
      if (messageId) mailHandoffProbe.messageId = messageId;
      const acceptedViaCanonical =
        sendResponse.status === 202 &&
        (statusValue === "queued" || statusValue === "accepted");
      const acceptedViaLegacy = sendResponse.status >= 200 && sendResponse.status < 300 && normalizeString(messageId) !== "";
      mailHandoffProbe.accepted = acceptedViaCanonical || acceptedViaLegacy;

      return sendResponse;
    };

    if (handoffMode === "adapter") {
      await attemptAdapterSend();
    } else if (handoffMode === "mailapi") {
      await attemptMailApiSend();
    } else {
      const adapterResponse = await attemptAdapterSend();
      if (!adapterResponse || adapterResponse.status === 404) {
        await attemptMailApiSend();
      }
    }
  }

  const externalEvidence = {
    checkoutUrl: checkoutProbe.checkoutUrl,
    d1OrCanonicalRowRef:
      normalizeString(
        firstByKeys(
          toSafeJson(mailHandoffProbe.body),
          new Set(["canonical_row_ref", "canonicalRowRef", "d1_or_canonical_row_ref"])
        )
      ) ||
      normalizeString(process.env.PAYMENT_SMOKE_D1_ROW_REF) ||
      normalizeString(process.env.PAYMENT_SMOKE_CANONICAL_ROW_REF),
    inboxProofGmail1: normalizeString(process.env.PAYMENT_SMOKE_INBOX_PROOF_GMAIL_1),
    inboxProofGmail2: normalizeString(process.env.PAYMENT_SMOKE_INBOX_PROOF_GMAIL_2),
    messageId: mailHandoffProbe.messageId,
    paymentSessionRef: checkoutProbe.paymentSessionRef,
    providerRef: checkoutProbe.providerRef
  };

  const signals = {
    checkout_endpoint_called: checkoutProbe.attempted,
    checkout_http_ok: checkoutProbe.status !== null && checkoutProbe.status >= 200 && checkoutProbe.status < 300,
    checkout_url_non_null: normalizeString(externalEvidence.checkoutUrl) !== "",
    d1_or_canonical_row_ref_non_null: normalizeString(externalEvidence.d1OrCanonicalRowRef) !== "",
    inbox_proof_gmail_1_non_null: normalizeString(externalEvidence.inboxProofGmail1) !== "",
    inbox_proof_gmail_2_non_null: normalizeString(externalEvidence.inboxProofGmail2) !== "",
    mail_message_id_non_null: normalizeString(externalEvidence.messageId) !== "",
    payment_session_ref_non_null: normalizeString(externalEvidence.paymentSessionRef) !== "",
    provider_ref_non_null: normalizeString(externalEvidence.providerRef) !== "",
    runtime_bindings_present: runtimeBindingsReady,
    v1_send_accepted: mailHandoffProbe.accepted
  };

  if (mode === "dry-run") {
    signals.checkout_endpoint_called = true;
    signals.checkout_http_ok = true;
  }

  const overallPass = Object.values(signals).every(Boolean);
  const phase2PaymentState = overallPass ? "PAYMENT_LIVE" : "PHASE_2_NOT_IN_SCOPE";

  const snapshot = {
    date,
    domain,
    domainSlug,
    externalEvidence,
    generatedAt: new Date().toISOString(),
    mode,
    overallPass,
    phase2PaymentState,
    signals,
    checkoutProbe,
    mailHandoffProbe,
    runtimeBindings,
    timezone
  };

  const markdown = toMarkdown(snapshot);
  const outputDir = path.join(root, "reports", "payment-smoke");
  const outputJsonPath = path.join(outputDir, `${domainSlug}_payment_smoke_${date}.json`);
  const outputMdPath = path.join(outputDir, `${domainSlug}_payment_smoke_${date}.md`);
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await writeFile(outputMdPath, `${markdown}\n`, "utf8");

  process.stdout.write(`${markdown}\n`);
  process.stdout.write(`Saved JSON: ${path.relative(root, outputJsonPath)}\n`);
  process.stdout.write(`Saved MD: ${path.relative(root, outputMdPath)}\n`);

  if (!overallPass && !allowRed) {
    process.exitCode = 1;
  }
}

await main();
