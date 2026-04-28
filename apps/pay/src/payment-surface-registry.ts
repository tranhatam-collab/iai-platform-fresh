export type PaymentPackId = "PACK_A" | "PACK_B" | "PACK_C" | "PACK_D" | "PACK_NONE";
export type PaymentSurfaceClass =
  | "PAYMENT_ACTIVE_OR_CANDIDATE"
  | "BILLING_SUPPORT_ONLY"
  | "NON_PAYMENT_SURFACE";
export type PaymentSurfaceStatus =
  | "ACTIVE_INTERNAL"
  | "CANDIDATE"
  | "PREP_ONLY"
  | "BLOCKED"
  | "BILLING_SUPPORT_ONLY"
  | "NOT_ALLOWED";
export type LocaleMode =
  | "VI_DEFAULT_EN_SECONDARY"
  | "USER_LOCALE_FIRST_FALLBACK_VI"
  | "SITE_LOCALE_FIRST"
  | "WORKSPACE_LOCALE_FIRST"
  | "CONTRACT_LOCALE_FIRST"
  | "EN_FRIENDLY"
  | "NOT_APPLICABLE";
export type ToneMode =
  | "CANONICAL_NEUTRAL"
  | "BUILDER_FIRST"
  | "WARM_HUMAN"
  | "ACCOUNT_CENTRIC"
  | "STRUCTURED_TRUST_FIRST"
  | "COMMERCE_GROWTH_TRUST_FIRST"
  | "ENTERPRISE_FORMAL"
  | "RUNTIME_BILLING"
  | "TECHNICAL_INTEGRATION"
  | "NON_TRANSACTIONAL";

export interface PaymentSenderPolicy {
  brandOverrideRequired: boolean;
  emailFromBilling: string | null;
  emailFromPay: string | null;
  emailReplyToSupport: string | null;
  noreplyAddress: string | null;
  noreplyAllowedForPaymentMail: boolean;
  supportEmail: string | null;
}

export interface PaymentIdPrefixes {
  invoice: string | null;
  paymentIntent: string | null;
  receipt: string | null;
  refund: string | null;
}

export interface PaymentSurfaceRegistryEntry {
  allowedLocales: string[];
  brandName: string;
  currencyScope: string[];
  customerFacingPaymentEmailAllowed: boolean;
  defaultLocale: string;
  domain: string;
  idPrefixes: PaymentIdPrefixes;
  localeMode: LocaleMode;
  notes: string[];
  paymentPack: PaymentPackId;
  paymentStatus: PaymentSurfaceStatus;
  providerScope: string[];
  payoutProfileRequired: boolean;
  receiverProfileRequired: boolean;
  requiredLinks: string[];
  requiredTemplateIds: string[];
  senderPolicy: PaymentSenderPolicy | null;
  surfaceClass: PaymentSurfaceClass;
  surfaceRole: string;
  toneMode: ToneMode;
}

export interface PaymentTemplatePackDefinition {
  id: PaymentPackId;
  notes: string[];
  requiredTemplateIds: string[];
  reservedTemplateIds: string[];
  surfaceUseCases: string[];
}

export interface PaymentSurfaceRegistrySnapshot {
  classificationCounts: {
    billingSupportOnly: number;
    nonPaymentSurface: number;
    paymentActiveOrCandidate: number;
  };
  hardRules: string[];
  requiredDomainPacketFields: string[];
  requiredTemplateVariables: string[];
  scope: "*.iai.one";
  surfaceCount: number;
  surfaces: PaymentSurfaceRegistryEntry[];
  templatePacks: PaymentTemplatePackDefinition[];
  version: "2026-04-22";
}

const packARequiredTemplateIds = [
  "checkout_pending",
  "manual_payment_instruction",
  "payment_receipt",
  "payment_failed",
  "payment_expired",
  "refund_notice",
  "adjustment_notice",
  "invoice_available"
] as const;

const packBRequiredTemplateIds = [
  "invoice_issued",
  "invoice_paid",
  "billing_failed",
  "payment_method_update_required",
  "usage_threshold_notice",
  "refund_notice",
  "adjustment_notice"
] as const;

const packBReservedTemplateIds = ["renewal_success", "renewal_failed"] as const;

const packCRequiredTemplateIds = [
  "quote_ready",
  "invoice_issued",
  "payment_received",
  "manual_review_notice",
  "credit_note_or_adjustment",
  "refund_notice"
] as const;

const packDRequiredTemplateIds = [
  "provider_webhook_failed",
  "settlement_mismatch_alert",
  "payment_email_delivery_failed",
  "refund_manual_review_required",
  "receiver_profile_missing",
  "mailbox_sender_binding_missing"
] as const;

function createPerDomainSenderPolicy(domain: string, input?: {
  billing?: string;
  pay?: string;
  replyTo?: string;
  support?: string;
}) {
  const pay = input?.pay ?? `pay@${domain}`;
  const billing = input?.billing ?? `billing@${domain}`;
  const replyTo = input?.replyTo ?? `support@${domain}`;
  const support = input?.support ?? `support@${domain}`;

  return {
    brandOverrideRequired: false,
    emailFromBilling: billing,
    emailFromPay: pay,
    emailReplyToSupport: replyTo,
    noreplyAddress: `noreply@${domain}`,
    noreplyAllowedForPaymentMail: false,
    supportEmail: support
  } satisfies PaymentSenderPolicy;
}

const templatePacks: PaymentTemplatePackDefinition[] = [
  {
    id: "PACK_A",
    notes: [
      "One-time checkout / VND-first.",
      "Use for product surfaces that may collect customer payment directly."
    ],
    requiredTemplateIds: [...packARequiredTemplateIds],
    reservedTemplateIds: [],
    surfaceUseCases: [
      "flow.iai.one",
      "life.iai.one",
      "app.iai.one",
      "noos.iai.one",
      "web.iai.one"
    ]
  },
  {
    id: "PACK_B",
    notes: [
      "Workspace billing / usage / account billing.",
      "Do not open recurring templates until the recurring contract is explicitly approved."
    ],
    requiredTemplateIds: [...packBRequiredTemplateIds],
    reservedTemplateIds: [...packBReservedTemplateIds],
    surfaceUseCases: [
      "dash.iai.one",
      "web.iai.one",
      "developer.iai.one",
      "flow.iai.one"
    ]
  },
  {
    id: "PACK_C",
    notes: [
      "Enterprise / B2B / contract billing.",
      "Use formal invoice / quote / contract language only."
    ],
    requiredTemplateIds: [...packCRequiredTemplateIds],
    reservedTemplateIds: [],
    surfaceUseCases: ["cios.iai.one"]
  },
  {
    id: "PACK_D",
    notes: [
      "Internal operations / settlement / provider alerts.",
      "This pack exists for finance ops, treasury ops, Team D, and Team B."
    ],
    requiredTemplateIds: [...packDRequiredTemplateIds],
    reservedTemplateIds: [],
    surfaceUseCases: ["pay.iai.one"]
  }
];

const surfaces: PaymentSurfaceRegistryEntry[] = [
  {
    allowedLocales: ["vi", "en"],
    brandName: "IAI Pay",
    currencyScope: ["VND"],
    customerFacingPaymentEmailAllowed: false,
    defaultLocale: "vi",
    domain: "pay.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: "pi_pay_",
      receipt: "rcpt_pay_",
      refund: "rfnd_pay_"
    },
    localeMode: "VI_DEFAULT_EN_SECONDARY",
    notes: [
      "Payment orchestration layer, not the final customer-facing payment brand for every site.",
      "If this surface sends on behalf of another surface, it must take brand override from the domain packet."
    ],
    paymentPack: "PACK_D",
    paymentStatus: "ACTIVE_INTERNAL",
    providerScope: ["payOS-first"],
    payoutProfileRequired: true,
    receiverProfileRequired: true,
    requiredLinks: [
      "orchestration_url",
      "provider_status_url",
      "ops_reconciliation_url",
      "ops_audit_url"
    ],
    requiredTemplateIds: [...packDRequiredTemplateIds],
    senderPolicy: {
      ...createPerDomainSenderPolicy("pay.iai.one"),
      brandOverrideRequired: true
    },
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "Payment orchestration and settlement layer",
    toneMode: "CANONICAL_NEUTRAL"
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "IAI Flow",
    currencyScope: ["VND"],
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "flow.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: "pi_flw_",
      receipt: "rcpt_flw_",
      refund: "rfnd_flw_"
    },
    localeMode: "USER_LOCALE_FIRST_FALLBACK_VI",
    notes: [
      "Builder-first payment candidate.",
      "Do not use brochure language or generic SaaS persuasion."
    ],
    paymentPack: "PACK_A",
    paymentStatus: "CANDIDATE",
    providerScope: ["payOS-first"],
    payoutProfileRequired: false,
    receiverProfileRequired: true,
    requiredLinks: [
      "checkout_base_url",
      "success_url",
      "cancel_url",
      "retry_url",
      "workspace_billing_url",
      "workspace_receipt_url"
    ],
    requiredTemplateIds: [...packARequiredTemplateIds],
    senderPolicy: createPerDomainSenderPolicy("flow.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "Product site / onboarding / execution onboarding",
    toneMode: "BUILDER_FIRST"
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "Life IAI",
    currencyScope: ["VND"],
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "life.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: "pi_lif_",
      receipt: "rcpt_lif_",
      refund: "rfnd_lif_"
    },
    localeMode: "VI_DEFAULT_EN_SECONDARY",
    notes: [
      "Warm and human support tone.",
      "Do not hide support or over-sell the payment state."
    ],
    paymentPack: "PACK_A",
    paymentStatus: "CANDIDATE",
    providerScope: ["payOS-first"],
    payoutProfileRequired: false,
    receiverProfileRequired: true,
    requiredLinks: [
      "checkout_base_url",
      "join_url",
      "checkout_status_url",
      "support_url",
      "success_url",
      "cancel_url",
      "retry_url"
    ],
    requiredTemplateIds: [...packARequiredTemplateIds],
    senderPolicy: createPerDomainSenderPolicy("life.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "Product surface with its own commerce potential",
    toneMode: "WARM_HUMAN"
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "IAI App",
    currencyScope: ["VND"],
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "app.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: "pi_app_",
      receipt: "rcpt_app_",
      refund: "rfnd_app_"
    },
    localeMode: "USER_LOCALE_FIRST_FALLBACK_VI",
    notes: [
      "Collection role is not locked yet.",
      "Use this packet only if app.iai.one is confirmed as a collection surface."
    ],
    paymentPack: "PACK_A",
    paymentStatus: "CANDIDATE",
    providerScope: ["payOS-first"],
    payoutProfileRequired: false,
    receiverProfileRequired: true,
    requiredLinks: [
      "checkout_base_url",
      "billing_url",
      "receipt_url",
      "access_url",
      "success_url",
      "cancel_url",
      "retry_url"
    ],
    requiredTemplateIds: [...packARequiredTemplateIds],
    senderPolicy: createPerDomainSenderPolicy("app.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "User product surface with conditional collection role",
    toneMode: "ACCOUNT_CENTRIC"
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "NOOS",
    currencyScope: ["VND"],
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "noos.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: "pi_nos_",
      receipt: "rcpt_nos_",
      refund: "rfnd_nos_"
    },
    localeMode: "VI_DEFAULT_EN_SECONDARY",
    notes: [
      "Candidate only.",
      "Open only after the intake row is unlocked."
    ],
    paymentPack: "PACK_A",
    paymentStatus: "CANDIDATE",
    providerScope: ["payOS-first"],
    payoutProfileRequired: false,
    receiverProfileRequired: true,
    requiredLinks: [
      "checkout_base_url",
      "plans_url",
      "receipt_url",
      "support_url",
      "success_url",
      "cancel_url",
      "retry_url"
    ],
    requiredTemplateIds: [...packARequiredTemplateIds],
    senderPolicy: createPerDomainSenderPolicy("noos.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "Future commerce / library / meaning layer",
    toneMode: "STRUCTURED_TRUST_FIRST"
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "IAI Web",
    currencyScope: ["VND"],
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "web.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: "pi_web_",
      receipt: "rcpt_web_",
      refund: "rfnd_web_"
    },
    localeMode: "SITE_LOCALE_FIRST",
    notes: [
      "Prepared in advance even if the intake row is not open yet.",
      "Growth tone must still remain trust-first."
    ],
    paymentPack: "PACK_A",
    paymentStatus: "PREP_ONLY",
    providerScope: ["payOS-first"],
    payoutProfileRequired: false,
    receiverProfileRequired: true,
    requiredLinks: [
      "checkout_base_url",
      "plans_url",
      "merchant_billing_url",
      "invoice_url",
      "success_url",
      "cancel_url",
      "retry_url"
    ],
    requiredTemplateIds: [...packARequiredTemplateIds],
    senderPolicy: createPerDomainSenderPolicy("web.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "Commerce growth layer",
    toneMode: "COMMERCE_GROWTH_TRUST_FIRST"
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "CIOS",
    currencyScope: ["VND"],
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "cios.iai.one",
    idPrefixes: {
      invoice: "inv_cio_",
      paymentIntent: "pi_cio_",
      receipt: null,
      refund: "rfnd_cio_"
    },
    localeMode: "CONTRACT_LOCALE_FIRST",
    notes: [
      "Blocked until the enterprise billing model is approved.",
      "Do not use consumer or member wording."
    ],
    paymentPack: "PACK_C",
    paymentStatus: "BLOCKED",
    providerScope: ["contract-billing"],
    payoutProfileRequired: false,
    receiverProfileRequired: true,
    requiredLinks: [
      "enterprise_billing_url",
      "quote_url",
      "invoice_url",
      "support_url"
    ],
    requiredTemplateIds: [...packCRequiredTemplateIds],
    senderPolicy: createPerDomainSenderPolicy("cios.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "Enterprise intelligence product",
    toneMode: "ENTERPRISE_FORMAL"
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "IAI Dash",
    currencyScope: ["VND"],
    customerFacingPaymentEmailAllowed: false,
    defaultLocale: "vi",
    domain: "dash.iai.one",
    idPrefixes: {
      invoice: "inv_dsh_",
      paymentIntent: null,
      receipt: null,
      refund: null
    },
    localeMode: "WORKSPACE_LOCALE_FIRST",
    notes: [
      "Billing-support or account-support only.",
      "Do not enable customer-facing collection by default."
    ],
    paymentPack: "PACK_B",
    paymentStatus: "BILLING_SUPPORT_ONLY",
    providerScope: ["workspace-billing-conditional"],
    payoutProfileRequired: false,
    receiverProfileRequired: false,
    requiredLinks: [
      "workspace_settings_billing_url",
      "usage_url",
      "invoice_url"
    ],
    requiredTemplateIds: [...packBRequiredTemplateIds],
    senderPolicy: createPerDomainSenderPolicy("dash.iai.one"),
    surfaceClass: "BILLING_SUPPORT_ONLY",
    surfaceRole: "Living control system / operations",
    toneMode: "RUNTIME_BILLING"
  },
  {
    allowedLocales: ["en", "vi"],
    brandName: "IAI Developer",
    currencyScope: ["VND"],
    customerFacingPaymentEmailAllowed: false,
    defaultLocale: "en",
    domain: "developer.iai.one",
    idPrefixes: {
      invoice: "inv_dev_",
      paymentIntent: null,
      receipt: null,
      refund: null
    },
    localeMode: "EN_FRIENDLY",
    notes: [
      "Developer-facing only.",
      "Do not use emotional persuasion or consumer checkout wording."
    ],
    paymentPack: "PACK_B",
    paymentStatus: "BILLING_SUPPORT_ONLY",
    providerScope: ["workspace-billing-conditional"],
    payoutProfileRequired: false,
    receiverProfileRequired: false,
    requiredLinks: [
      "billing_url",
      "invoice_url",
      "support_url"
    ],
    requiredTemplateIds: [...packBRequiredTemplateIds],
    senderPolicy: createPerDomainSenderPolicy("developer.iai.one"),
    surfaceClass: "BILLING_SUPPORT_ONLY",
    surfaceRole: "Build layer / developer surface",
    toneMode: "TECHNICAL_INTEGRATION"
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "IAI Docs",
    currencyScope: [],
    customerFacingPaymentEmailAllowed: false,
    defaultLocale: "vi",
    domain: "docs.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: null,
      receipt: null,
      refund: null
    },
    localeMode: "VI_DEFAULT_EN_SECONDARY",
    notes: ["Documentation surface only.", "No customer-facing payment email is allowed."],
    paymentPack: "PACK_NONE",
    paymentStatus: "NOT_ALLOWED",
    providerScope: [],
    payoutProfileRequired: false,
    receiverProfileRequired: false,
    requiredLinks: [],
    requiredTemplateIds: [],
    senderPolicy: null,
    surfaceClass: "NON_PAYMENT_SURFACE",
    surfaceRole: "Knowledge and standards layer",
    toneMode: "NON_TRANSACTIONAL"
  },
  {
    allowedLocales: ["en"],
    brandName: "IAI API",
    currencyScope: [],
    customerFacingPaymentEmailAllowed: false,
    defaultLocale: "en",
    domain: "api.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: null,
      receipt: null,
      refund: null
    },
    localeMode: "NOT_APPLICABLE",
    notes: ["Backend authority only.", "No customer-facing payment email is allowed."],
    paymentPack: "PACK_NONE",
    paymentStatus: "NOT_ALLOWED",
    providerScope: [],
    payoutProfileRequired: false,
    receiverProfileRequired: false,
    requiredLinks: [],
    requiredTemplateIds: [],
    senderPolicy: null,
    surfaceClass: "NON_PAYMENT_SURFACE",
    surfaceRole: "Backend authority",
    toneMode: "NON_TRANSACTIONAL"
  },
  {
    allowedLocales: ["en"],
    brandName: "IAI Flow API",
    currencyScope: [],
    customerFacingPaymentEmailAllowed: false,
    defaultLocale: "en",
    domain: "api.flow.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: null,
      receipt: null,
      refund: null
    },
    localeMode: "NOT_APPLICABLE",
    notes: ["Flow execution authority only.", "No customer-facing payment email is allowed."],
    paymentPack: "PACK_NONE",
    paymentStatus: "NOT_ALLOWED",
    providerScope: [],
    payoutProfileRequired: false,
    receiverProfileRequired: false,
    requiredLinks: [],
    requiredTemplateIds: [],
    senderPolicy: null,
    surfaceClass: "NON_PAYMENT_SURFACE",
    surfaceRole: "Flow execution authority",
    toneMode: "NON_TRANSACTIONAL"
  },
  {
    allowedLocales: ["en"],
    brandName: "IAI Mail",
    currencyScope: [],
    customerFacingPaymentEmailAllowed: false,
    defaultLocale: "en",
    domain: "mail.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: null,
      receipt: null,
      refund: null
    },
    localeMode: "NOT_APPLICABLE",
    notes: ["Internal infrastructure only.", "No customer-facing payment email is allowed."],
    paymentPack: "PACK_NONE",
    paymentStatus: "NOT_ALLOWED",
    providerScope: [],
    payoutProfileRequired: false,
    receiverProfileRequired: false,
    requiredLinks: [],
    requiredTemplateIds: [],
    senderPolicy: null,
    surfaceClass: "NON_PAYMENT_SURFACE",
    surfaceRole: "Internal infrastructure surface",
    toneMode: "NON_TRANSACTIONAL"
  },
  {
    allowedLocales: ["en"],
    brandName: "IAI CDN",
    currencyScope: [],
    customerFacingPaymentEmailAllowed: false,
    defaultLocale: "en",
    domain: "cdn.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: null,
      receipt: null,
      refund: null
    },
    localeMode: "NOT_APPLICABLE",
    notes: ["Internal infrastructure only.", "No customer-facing payment email is allowed."],
    paymentPack: "PACK_NONE",
    paymentStatus: "NOT_ALLOWED",
    providerScope: [],
    payoutProfileRequired: false,
    receiverProfileRequired: false,
    requiredLinks: [],
    requiredTemplateIds: [],
    senderPolicy: null,
    surfaceClass: "NON_PAYMENT_SURFACE",
    surfaceRole: "Internal infrastructure surface",
    toneMode: "NON_TRANSACTIONAL"
  },
  {
    allowedLocales: ["en"],
    brandName: "IAI Flows",
    currencyScope: [],
    customerFacingPaymentEmailAllowed: false,
    defaultLocale: "en",
    domain: "flows.iai.one",
    idPrefixes: {
      invoice: null,
      paymentIntent: null,
      receipt: null,
      refund: null
    },
    localeMode: "NOT_APPLICABLE",
    notes: ["Internal automation surface only.", "No customer-facing payment email is allowed."],
    paymentPack: "PACK_NONE",
    paymentStatus: "NOT_ALLOWED",
    providerScope: [],
    payoutProfileRequired: false,
    receiverProfileRequired: false,
    requiredLinks: [],
    requiredTemplateIds: [],
    senderPolicy: null,
    surfaceClass: "NON_PAYMENT_SURFACE",
    surfaceRole: "Internal automation surface",
    toneMode: "NON_TRANSACTIONAL"
  }
];

const requiredTemplateVariables = [
  "{{brand_name}}",
  "{{surface_domain}}",
  "{{customer_name}}",
  "{{workspace_name}}",
  "{{order_id}}",
  "{{payment_intent_id}}",
  "{{receipt_id}}",
  "{{invoice_id}}",
  "{{product_name}}",
  "{{package_name}}",
  "{{amount}}",
  "{{currency}}",
  "{{paid_at}}",
  "{{expires_at}}",
  "{{checkout_url}}",
  "{{invoice_url}}",
  "{{receipt_url}}",
  "{{billing_url}}",
  "{{support_url}}",
  "{{support_email}}",
  "{{refund_amount}}",
  "{{refund_reason}}",
  "{{provider_name}}",
  "{{provider_ref}}",
  "{{receiver_profile_id}}"
] as const;

const requiredDomainPacketFields = [
  "domain",
  "site_code",
  "surface_role",
  "brand_name",
  "default_locale",
  "allowed_locales",
  "tone_mode",
  "payment_pack",
  "EMAIL_FROM_PAY",
  "EMAIL_FROM_BILLING",
  "EMAIL_REPLY_TO_SUPPORT",
  "support_email",
  "help_url",
  "checkout_base_url",
  "receipt_base_url",
  "invoice_base_url",
  "success_url",
  "cancel_url",
  "retry_url",
  "receiver_profile_id",
  "payout_profile_id",
  "provider",
  "currency_scope",
  "payment_intent_prefix",
  "receipt_prefix",
  "invoice_prefix",
  "refund_prefix"
] as const;

const hardRules = [
  "pay.iai.one is the payment orchestration layer, not the final payment brand for every surface.",
  "Every payment-enabled subdomain must carry its own sender package.",
  "Payment mail may use only EMAIL_FROM_PAY, EMAIL_FROM_BILLING, and EMAIL_REPLY_TO_SUPPORT.",
  "noreply@<domain> must never be used as a payment sender.",
  "No payment template may hard-code account number, QR URL, PayPal email, legal entity, or payout account.",
  "All receiving truth must come from receiver_profile_id, payout_profile_id, payment-routing, provider, currency, and domain.",
  "Do not claim live without provider action or true sandbox action, checkout_url or provider_ref, SMTP messageId, D1 evidence, and inbox proof."
] as const;

const surfaceMap = new Map(surfaces.map((surface) => [surface.domain, surface]));

export function getPaymentSurfaceRegistrySnapshot(): PaymentSurfaceRegistrySnapshot {
  return {
    classificationCounts: {
      billingSupportOnly: surfaces.filter((surface) => surface.surfaceClass === "BILLING_SUPPORT_ONLY")
        .length,
      nonPaymentSurface: surfaces.filter((surface) => surface.surfaceClass === "NON_PAYMENT_SURFACE")
        .length,
      paymentActiveOrCandidate: surfaces.filter(
        (surface) => surface.surfaceClass === "PAYMENT_ACTIVE_OR_CANDIDATE"
      ).length
    },
    hardRules: [...hardRules],
    requiredDomainPacketFields: [...requiredDomainPacketFields],
    requiredTemplateVariables: [...requiredTemplateVariables],
    scope: "*.iai.one",
    surfaceCount: surfaces.length,
    surfaces,
    templatePacks,
    version: "2026-04-22"
  };
}

export function getPaymentSurfaceRegistryEntry(domain: string): PaymentSurfaceRegistryEntry | null {
  return surfaceMap.get(domain.trim().toLowerCase()) ?? null;
}
