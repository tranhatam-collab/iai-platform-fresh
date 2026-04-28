import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createPayRequestHandler } from "../apps/pay/dist/server.js";
import { dispatchToHandler } from "../tests/support/http-handler.mjs";

const timezone = "Asia/Ho_Chi_Minh";
const requiredTemplateIds = [
  "payment_receipt",
  "checkout_status_update",
  "payment_failed_notice",
  "refund_notice",
  "contact_request_received",
  "support_request_received",
  "join_request_received"
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

function normalizeDomain(value) {
  return value.trim().toLowerCase().replace(/^https?:\/\//u, "").replace(/^www\./u, "");
}

function slugifyDomain(domain) {
  return domain.replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
}

function createInput(domain, templateId, index) {
  const now = new Date().toISOString();
  const amountByTemplate = templateId.includes("payment") || templateId.includes("checkout")
    ? "250000"
    : "0";

  return {
    amount: amountByTemplate,
    billingUrl: `https://${domain}/billing/order_${index + 1}`,
    checkoutUrl: `https://${domain}/checkout/order_${index + 1}`,
    currency: "VND",
    customerName: "Trần Hà Tâm",
    domain,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    invoiceId: `inv_${slugifyDomain(domain)}_${index + 1}`,
    invoiceUrl: `https://${domain}/invoices/order_${index + 1}`,
    locale: "vi",
    messageIdempotencyKey: `smoke-${slugifyDomain(domain)}-${templateId}-${index + 1}`,
    orderId: `order_${slugifyDomain(domain)}_${index + 1}`,
    paidAt: now,
    paymentIntentId: `pi_${slugifyDomain(domain)}_${index + 1}`,
    paymentSessionId: `ps_${slugifyDomain(domain)}_${index + 1}`,
    productName: `Smoke ${templateId} ${domain}`,
    providerName: "payOS",
    providerReference: `provider_ref_${slugifyDomain(domain)}_${index + 1}`,
    receiptId: `rcpt_${slugifyDomain(domain)}_${index + 1}`,
    receiptUrl: `https://${domain}/receipt/rcpt_${index + 1}`,
    recipientEmail: "tranhatam@gmail.com",
    recipientName: "Trần Hà Tâm",
    requestId: `req_${slugifyDomain(domain)}_${templateId}_${index + 1}`,
    refundAmount: "50000",
    refundReason: "customer_request",
    siteUrl: `https://${domain}`,
    supportEmail: `support@${domain}`,
    supportUrl: `https://${domain}/support`,
    templateId,
    workspaceName: `${domain} workspace`,
    xSiteKey: `site_${slugifyDomain(domain)}`
  };
}

function ensureRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toMarkdown({
  date,
  domain,
  fetchChecks,
  flowResults,
  requiredTemplateChecks,
  templateCount,
  templateRouteStatus
}) {
  const requiredLines = requiredTemplateChecks
    .map((item) => `- ${item.present ? "PASS" : "FAIL"} \`${item.templateId}\``)
    .join("\n");
  const flowLines = flowResults
    .map((item) =>
      `| \`${item.templateId}\` | \`${item.httpStatus}\` | \`${item.messageId}\` | \`${item.sender}\` | \`${item.replyTo}\` |`
    )
    .join("\n");
  const fetchLines = fetchChecks.map((item) => `- ${item.pass ? "PASS" : "FAIL"} ${item.label}`).join("\n");
  const overallPass =
    templateRouteStatus === 200 &&
    requiredTemplateChecks.every((item) => item.present) &&
    flowResults.every((item) => item.httpStatus === 202 && item.messageId !== "MISSING") &&
    fetchChecks.every((item) => item.pass);

  return `# PAY_TEAM_D_${slugifyDomain(domain).toUpperCase()}_EMAIL_FLOW_SMOKE_${date}
- Date: ${date}
- Domain: \`${domain}\`
- Template route status: \`${templateRouteStatus}\`
- Template count: \`${templateCount}\`
- Overall: \`${overallPass ? "PASS" : "FAIL"}\`

## Required Template Presence
${requiredLines}

## Flow Smoke Results
| template_id | route_status | message_id | sender | reply_to |
|---|---:|---|---|---|
${flowLines}

## Mail API Handoff Checks
${fetchLines}
`;
}

async function main() {
  const date = getArg("date", todayInTimezone(timezone));
  const domain = normalizeDomain(getArg("domain", "omdalat.com"));
  const writeOutput = !process.argv.includes("--no-write");
  const envSnapshot = {
    MAIL_API_BASE_URL: process.env.MAIL_API_BASE_URL,
    MAIL_API_KEY: process.env.MAIL_API_KEY,
    MAIL_API_WORKSPACE_ID: process.env.MAIL_API_WORKSPACE_ID,
    PAY_EMAIL_ADAPTER_INTERNAL_KEY: process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY
  };

  process.env.MAIL_API_BASE_URL = "https://api.mail.iai.one/v1";
  process.env.MAIL_API_KEY = "mail_smoke_key";
  process.env.MAIL_API_WORKSPACE_ID = `ws_${slugifyDomain(domain)}`;
  process.env.PAY_EMAIL_ADAPTER_INTERNAL_KEY = "adapter-smoke-key";

  try {
    const fetchCalls = [];
    const handler = createPayRequestHandler({
      fetchImpl: async (url, init) => {
        const parsedBody = init?.body ? JSON.parse(String(init.body)) : {};
        fetchCalls.push({
          body: parsedBody,
          headers: init?.headers ?? {},
          method: init?.method ?? "GET",
          url: String(url)
        });

        return new Response(
          JSON.stringify({
            data: {
              message_id: `msg_smoke_${slugifyDomain(domain)}_${String(fetchCalls.length).padStart(2, "0")}`,
              provider_route: "transactional_primary",
              status: "queued"
            },
            ok: true
          }),
          {
            status: 202
          }
        );
      }
    });

    const templateResponse = await dispatchToHandler(handler, {
      url: `/api/payment-email-templates?domain=${domain}`
    });
    const templatePayload = await templateResponse.json();
    if (!templatePayload?.ok || !ensureRecord(templatePayload.data) || !ensureRecord(templatePayload.data.templates)) {
      throw new Error("Template registry payload is missing or malformed.");
    }

    const templateKeys = new Set(Object.keys(templatePayload.data.templates));
    const requiredTemplateChecks = requiredTemplateIds.map((templateId) => ({
      present: templateKeys.has(templateId),
      templateId
    }));

    const flowResults = [];
    for (const [index, templateId] of requiredTemplateIds.entries()) {
      const handoffCallIndex = fetchCalls.length;
      const response = await dispatchToHandler(handler, {
        body: JSON.stringify(createInput(domain, templateId, index)),
        headers: {
          "content-type": "application/json",
          "x-pay-email-adapter-key": "adapter-smoke-key"
        },
        method: "POST",
        url: "/internal/payment-email/send"
      });
      const payload = await response.json();
      const handoffCall = fetchCalls[handoffCallIndex];
      flowResults.push({
        httpStatus: response.status,
        messageId: payload?.data?.message_id ? String(payload.data.message_id) : "MISSING",
        replyTo: handoffCall?.body?.reply_to?.email ? String(handoffCall.body.reply_to.email) : "MISSING",
        sender: handoffCall?.body?.from?.email ? String(handoffCall.body.from.email) : "MISSING",
        templateId
      });
    }

    const fetchChecks = [
      {
        label: "all requests hand off to /v1/send",
        pass: fetchCalls.every((call) => call.url === "https://api.mail.iai.one/v1/send")
      },
      {
        label: "all requests use Authorization bearer",
        pass: fetchCalls.every(
          (call) => ensureRecord(call.headers) && call.headers.Authorization === "Bearer mail_smoke_key"
        )
      },
      {
        label: "all requests include workspace header",
        pass: fetchCalls.every(
          (call) => ensureRecord(call.headers) && call.headers["X-Workspace-Id"] === `ws_${slugifyDomain(domain)}`
        )
      },
      {
        label: "all smoke flows reached mail API handoff",
        pass: fetchCalls.length === requiredTemplateIds.length
      }
    ];

    const markdown = toMarkdown({
      date,
      domain,
      fetchChecks,
      flowResults,
      requiredTemplateChecks,
      templateCount: Number(templatePayload.data.templateCount ?? 0),
      templateRouteStatus: templateResponse.status
    });

    if (writeOutput) {
      const outputDir = path.join("docs", "reports", "teamd");
      const outputPath = path.join(
        outputDir,
        `PAY_TEAM_D_${slugifyDomain(domain).toUpperCase()}_EMAIL_FLOW_SMOKE_${date}.md`
      );
      await mkdir(outputDir, { recursive: true });
      await writeFile(outputPath, markdown, "utf8");
      process.stdout.write(`${markdown}\nSaved report: ${outputPath}\n`);
    } else {
      process.stdout.write(markdown);
    }
  } finally {
    for (const [key, value] of Object.entries(envSnapshot)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

await main();
