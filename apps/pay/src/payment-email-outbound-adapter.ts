import {
  getPaymentEmailTemplateRegistry,
  type PaymentEmailTemplateDefinition,
  type PaymentEmailTemplateId,
  type PaymentEmailTemplateRegistry
} from "./payment-email-templates.js";

export type PaymentEmailOutboundErrorCode =
  | "MAIL_API_KEY_MISSING"
  | "MAIL_API_REQUEST_FAILED"
  | "MAIL_API_WORKSPACE_ID_MISSING"
  | "PAYMENT_EMAIL_IDEMPOTENCY_KEY_REQUIRED"
  | "PAYMENT_EMAIL_INVALID_RECIPIENT"
  | "PAYMENT_EMAIL_REGISTRY_NOT_CONFIGURED"
  | "PAYMENT_EMAIL_SENDER_POLICY_VIOLATION"
  | "PAYMENT_EMAIL_TEMPLATE_NOT_CONFIGURED"
  | "PAYMENT_EMAIL_UNRESOLVED_VARIABLES";

export class PaymentEmailOutboundAdapterError extends Error {
  constructor(
    public readonly code: PaymentEmailOutboundErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "PaymentEmailOutboundAdapterError";
  }
}

export interface PaymentEmailOutboundInput {
  amount: number | string;
  billingUrl?: string;
  checkoutUrl?: string;
  currency: string;
  customerName?: string;
  domain: string;
  expiresAt?: string;
  invoiceId?: string;
  invoiceUrl?: string;
  locale?: string;
  messageIdempotencyKey: string;
  orderId: string;
  packageName?: string;
  paidAt?: string;
  paymentIntentId?: string;
  paymentSessionId?: string;
  productName: string;
  providerName?: string;
  providerReference?: string;
  receiptId?: string;
  receiptUrl?: string;
  recipientEmail: string;
  recipientName?: string;
  refundAmount?: number | string;
  refundReason?: string;
  requestId?: string;
  siteUrl?: string;
  supportEmail?: string;
  supportUrl?: string;
  templateId: PaymentEmailTemplateId;
  workspaceName?: string;
  xSiteKey?: string;
}

export interface PaymentEmailOutboundPayload {
  from: {
    email: string;
    name: string;
  };
  headers: Record<string, string>;
  message_idempotency_key: string;
  metadata: Record<string, string>;
  reply_to: {
    email: string;
    name: string;
  };
  stream: "transactional";
  subject: string;
  tags: string[];
  text: string;
  to: Array<{
    email: string;
    name?: string;
  }>;
}

export interface PaymentEmailOutboundConfig {
  fetchImpl?: typeof globalThis.fetch;
  mailApiBaseUrl?: string;
  mailApiKey?: string;
  workspaceId?: string;
}

export interface PaymentEmailOutboundResult {
  acceptedAt: string;
  mailResponse: Record<string, unknown>;
  messageId: string;
  payload: PaymentEmailOutboundPayload;
  providerRoute?: string;
  requestId: string;
  status: string;
}

const variablePattern = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/gu;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function buildPaymentEmailOutboundPayload(
  input: PaymentEmailOutboundInput
): PaymentEmailOutboundPayload {
  const domain = normalizeDomain(input.domain);
  const registry = getPaymentEmailTemplateRegistry(domain);

  if (!registry) {
    throw new PaymentEmailOutboundAdapterError(
      "PAYMENT_EMAIL_REGISTRY_NOT_CONFIGURED",
      `No payment email registry is configured for ${domain}.`,
      { domain }
    );
  }

  const template = registry.templates[input.templateId];
  if (!template) {
    throw new PaymentEmailOutboundAdapterError(
      "PAYMENT_EMAIL_TEMPLATE_NOT_CONFIGURED",
      `Template ${input.templateId} is not configured for ${domain}.`,
      { domain, templateId: input.templateId }
    );
  }

  assertSenderPolicy(registry, template);
  const recipientEmail = normalizeEmail(input.recipientEmail, "recipientEmail");
  const idempotencyKey = normalizeRequiredString(
    input.messageIdempotencyKey,
    "messageIdempotencyKey",
    "PAYMENT_EMAIL_IDEMPOTENCY_KEY_REQUIRED"
  );
  const locale = resolveTemplateLocale(registry, input.locale);
  const values = createTemplateVariables(registry, input, domain);
  const subject = renderText(template.subject[locale], values, {
    domain,
    field: "subject",
    templateId: template.id
  });
  const body = renderText(template.textBody, values, {
    domain,
    field: "text",
    templateId: template.id
  });
  const footer = renderText(registry.footer, values, {
    domain,
    field: "footer",
    templateId: template.id
  });
  const brandName = createBrandName(registry);
  const requestId = input.requestId?.trim() || idempotencyKey;

  return {
    from: {
      email: template.sender,
      name: brandName
    },
    headers: {
      "X-Pay-Template-Id": template.id,
      "X-Source-App": "pay.iai.one"
    },
    message_idempotency_key: idempotencyKey,
    metadata: createMetadata(input, domain, template.id, requestId),
    reply_to: {
      email: template.replyTo,
      name: `${brandName} Support`
    },
    stream: "transactional",
    subject,
    tags: ["pay", template.id, domain],
    text: `${body}\n\n${footer}`,
    to: [
      input.recipientName?.trim()
        ? {
            email: recipientEmail,
            name: input.recipientName.trim()
          }
        : {
            email: recipientEmail
          }
    ]
  };
}

export async function sendPaymentEmailOutbound(
  input: PaymentEmailOutboundInput,
  config: PaymentEmailOutboundConfig = {}
): Promise<PaymentEmailOutboundResult> {
  const payload = buildPaymentEmailOutboundPayload(input);
  const mailApiKey = config.mailApiKey?.trim() || process.env.MAIL_API_KEY?.trim();
  const workspaceId =
    config.workspaceId?.trim() || process.env.MAIL_API_WORKSPACE_ID?.trim();

  if (!mailApiKey) {
    throw new PaymentEmailOutboundAdapterError(
      "MAIL_API_KEY_MISSING",
      "MAIL_API_KEY is required before pay can hand off payment email to the mail lane."
    );
  }

  if (!workspaceId) {
    throw new PaymentEmailOutboundAdapterError(
      "MAIL_API_WORKSPACE_ID_MISSING",
      "MAIL_API_WORKSPACE_ID is required before pay can hand off payment email to the mail lane."
    );
  }

  const fetchImpl = config.fetchImpl ?? globalThis.fetch;
  const baseUrl = (config.mailApiBaseUrl ?? process.env.MAIL_API_BASE_URL ?? "https://api.mail.iai.one/v1")
    .trim()
    .replace(/\/+$/u, "");
  const requestId = input.requestId?.trim() || payload.message_idempotency_key;
  const response = await fetchImpl(`${baseUrl}/send`, {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${mailApiKey}`,
      "Content-Type": "application/json",
      "X-Request-Id": requestId,
      "X-Workspace-Id": workspaceId
    },
    method: "POST"
  });
  const responseText = await response.text();
  const parsed = parseMailApiResponse(responseText);

  if (!response.ok || parsed.ok !== true) {
    throw new PaymentEmailOutboundAdapterError(
      "MAIL_API_REQUEST_FAILED",
      "Mail API rejected the payment email handoff.",
      {
        response: parsed,
        status: response.status
      }
    );
  }

  const data = isRecord(parsed.data) ? parsed.data : {};

  return {
    acceptedAt: new Date().toISOString(),
    mailResponse: data,
    messageId: normalizeRequiredString(data.message_id, "data.message_id", "MAIL_API_REQUEST_FAILED"),
    payload,
    providerRoute: typeof data.provider_route === "string" ? data.provider_route : undefined,
    requestId,
    status: typeof data.status === "string" ? data.status : "accepted"
  };
}

function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/^https?:\/\//u, "").replace(/^www\./u, "");
}

function normalizeEmail(email: string, field: string) {
  const normalized = email.trim().toLowerCase();
  if (!emailPattern.test(normalized)) {
    throw new PaymentEmailOutboundAdapterError(
      "PAYMENT_EMAIL_INVALID_RECIPIENT",
      `${field} must be a valid email address.`,
      { field }
    );
  }

  return normalized;
}

function normalizeRequiredString(
  value: unknown,
  field: string,
  code: PaymentEmailOutboundErrorCode
) {
  if (typeof value !== "string" || !value.trim()) {
    throw new PaymentEmailOutboundAdapterError(code, `${field} is required.`, { field });
  }

  return value.trim();
}

function assertSenderPolicy(
  registry: PaymentEmailTemplateRegistry,
  template: PaymentEmailTemplateDefinition
) {
  const allowedSenders = new Set([
    registry.policy.paymentReceiptSender,
    registry.policy.billingFailedRefundSender,
    registry.policy.replyTo
  ]);

  if (!allowedSenders.has(template.sender) || template.sender.startsWith("noreply@")) {
    throw new PaymentEmailOutboundAdapterError(
      "PAYMENT_EMAIL_SENDER_POLICY_VIOLATION",
      `Template ${template.id} uses a sender outside the locked payment sender policy.`,
      {
        allowedSenders: [...allowedSenders],
        sender: template.sender,
        templateId: template.id
      }
    );
  }

  if (template.replyTo !== registry.policy.replyTo) {
    throw new PaymentEmailOutboundAdapterError(
      "PAYMENT_EMAIL_SENDER_POLICY_VIOLATION",
      `Template ${template.id} uses a reply-to outside the locked payment sender policy.`,
      {
        replyTo: template.replyTo,
        templateId: template.id
      }
    );
  }
}

function resolveTemplateLocale(registry: PaymentEmailTemplateRegistry, locale?: string) {
  const requested = locale?.trim().toLowerCase();
  if ((requested === "en" || requested === "vi") && registry.allowedLocales.includes(requested)) {
    return requested as "en" | "vi";
  }

  if (
    (registry.defaultLocale === "en" || registry.defaultLocale === "vi") &&
    registry.allowedLocales.includes(registry.defaultLocale)
  ) {
    return registry.defaultLocale as "en" | "vi";
  }

  return registry.allowedLocales.includes("vi") ? "vi" : "en";
}

function createTemplateVariables(
  registry: PaymentEmailTemplateRegistry,
  input: PaymentEmailOutboundInput,
  domain: string
) {
  const supportEmail = input.supportEmail?.trim() || registry.policy.replyTo;
  const siteUrl = (input.siteUrl?.trim() || `https://${domain}`).replace(/\/+$/u, "");
  const providerReference = input.providerReference?.trim();

  return {
    amount: String(input.amount),
    billing_url: input.billingUrl,
    brand_name: createBrandName(registry),
    checkout_url: input.checkoutUrl,
    contact_url: `${siteUrl}/contact`,
    currency: input.currency,
    docs_url: `${siteUrl}/docs`,
    customer_name: input.customerName?.trim() || input.recipientName?.trim(),
    expires_at: input.expiresAt,
    invoice_id: input.invoiceId,
    invoice_url: input.invoiceUrl,
    join_url: `${siteUrl}/join`,
    order_id: input.orderId,
    package_name: input.packageName,
    paid_at: input.paidAt,
    payment_intent_id: input.paymentIntentId,
    product_name: input.productName,
    provider_name: input.providerName,
    provider_ref: providerReference,
    receipt_id: input.receiptId,
    receipt_url: input.receiptUrl,
    receiver_profile_id: undefined,
    request_id: input.requestId?.trim() || input.messageIdempotencyKey,
    refund_amount: input.refundAmount === undefined ? undefined : String(input.refundAmount),
    refund_reason: input.refundReason,
    site_url: siteUrl,
    support_email: supportEmail,
    support_url: input.supportUrl ?? `mailto:${supportEmail}`,
    surface_domain: domain,
    workspace_name: input.workspaceName
  };
}

function renderText(
  text: string,
  values: Record<string, unknown>,
  context: {
    domain: string;
    field: string;
    templateId: string;
  }
) {
  const missing = new Set<string>();
  const rendered = text.replace(variablePattern, (token, key: string) => {
    const value = values[key];
    if (value === undefined || value === null || String(value).trim() === "") {
      missing.add(key);
      return token;
    }

    return String(value);
  });

  if (missing.size > 0) {
    throw new PaymentEmailOutboundAdapterError(
      "PAYMENT_EMAIL_UNRESOLVED_VARIABLES",
      `Template ${context.templateId} has unresolved variables in ${context.field}.`,
      {
        domain: context.domain,
        field: context.field,
        missingVariables: [...missing],
        templateId: context.templateId
      }
    );
  }

  return rendered;
}

function createBrandName(registry: PaymentEmailTemplateRegistry) {
  if (registry.domain === "tranhatam.com") {
    return "Tranhatam.com";
  }

  if (registry.domain === "omdalat.com") {
    return "Ôm Đà Lạt";
  }

  if (registry.domain === "app.omdalat.com") {
    return "Ôm Đà Lạt App";
  }

  return registry.domain;
}

function createMetadata(
  input: PaymentEmailOutboundInput,
  domain: string,
  templateId: PaymentEmailTemplateId,
  requestId: string
) {
  return compactStringRecord({
    invoice_id: input.invoiceId,
    order_id: input.orderId,
    payment_intent_id: input.paymentIntentId,
    payment_session_id: input.paymentSessionId,
    provider_reference: input.providerReference,
    receipt_id: input.receiptId,
    request_id: requestId,
    source_app: "pay.iai.one",
    source_domain: domain,
    template_id: templateId,
    x_site_key: input.xSiteKey
  });
}

function compactStringRecord(values: Record<string, unknown>) {
  const output: Record<string, string> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || String(value).trim() === "") {
      continue;
    }
    output[key] = String(value);
  }

  return output;
}

function parseMailApiResponse(responseText: string) {
  try {
    const parsed: unknown = JSON.parse(responseText);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {
      ok: false,
      raw: responseText
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
