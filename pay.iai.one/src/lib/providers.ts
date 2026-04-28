export type ProviderStage = "launch" | "phase_2" | "phase_3";
export type ProviderMode = "hosted_checkout" | "redirect" | "webhook" | "refund_api" | "query_api" | "subscription";

export interface ProviderDefinition {
  code: string;
  label: string;
  market: "vietnam" | "international";
  priority: number;
  stage: ProviderStage;
  modes: ProviderMode[];
  methods: string[];
  currencies: string[];
  envKeys: string[];
  notes: string;
}

export const PROVIDERS: ProviderDefinition[] = [
  {
    code: "payos",
    label: "payOS",
    market: "vietnam",
    priority: 1,
    stage: "launch",
    modes: ["hosted_checkout", "redirect", "webhook", "refund_api", "query_api"],
    methods: ["vietqr", "bank_transfer", "payment_link"],
    currencies: ["VND"],
    envKeys: ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY"],
    notes: "Fastest domestic launch candidate for payment link, QR, and banking-first checkout."
  },
  {
    code: "momo",
    label: "MoMo",
    market: "vietnam",
    priority: 2,
    stage: "launch",
    modes: ["hosted_checkout", "redirect", "webhook", "refund_api", "query_api", "subscription"],
    methods: ["wallet", "atm_card", "international_card", "installment"],
    currencies: ["VND"],
    envKeys: ["MOMO_PARTNER_CODE", "MOMO_ACCESS_KEY", "MOMO_SECRET_KEY"],
    notes: "Strong wallet and local checkout coverage with refund and recurring support."
  },
  {
    code: "zalopay",
    label: "ZaloPay",
    market: "vietnam",
    priority: 3,
    stage: "launch",
    modes: ["hosted_checkout", "redirect", "webhook", "refund_api", "query_api"],
    methods: ["wallet", "banking", "domestic_card", "international_card", "qr"],
    currencies: ["VND"],
    envKeys: ["ZALOPAY_APP_ID", "ZALOPAY_KEY1", "ZALOPAY_KEY2"],
    notes: "Useful for wallet-driven conversion and strong local brand recognition."
  },
  {
    code: "vnpay",
    label: "VNPay",
    market: "vietnam",
    priority: 4,
    stage: "launch",
    modes: ["hosted_checkout", "redirect", "webhook", "refund_api", "query_api"],
    methods: ["atm_card", "internet_banking", "vnpay_qr", "international_card"],
    currencies: ["VND"],
    envKeys: ["VNPAY_TMN_CODE", "VNPAY_HASH_SECRET"],
    notes: "Broad domestic bank and QR acceptance and common merchant familiarity."
  },
  {
    code: "paypal",
    label: "PayPal",
    market: "international",
    priority: 5,
    stage: "phase_2",
    modes: ["hosted_checkout", "redirect", "webhook", "refund_api", "query_api"],
    methods: ["paypal_balance", "international_card"],
    currencies: ["USD", "EUR", "GBP"],
    envKeys: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"],
    notes: "International layer for cross-border buyers once domestic launch is stable."
  },
  {
    code: "stripe",
    label: "Stripe",
    market: "international",
    priority: 6,
    stage: "phase_2",
    modes: ["hosted_checkout", "redirect", "webhook", "refund_api", "query_api", "subscription"],
    methods: ["international_card", "apple_pay", "google_pay"],
    currencies: ["USD", "EUR", "GBP"],
    envKeys: ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
    notes: "Best international API surface for subscriptions, cards, and wallet rails later."
  }
];

export function providerByCode(providerCode: string): ProviderDefinition | null {
  return PROVIDERS.find((provider) => provider.code === providerCode) || null;
}

export function missingProviderEnvKeys(provider: ProviderDefinition, env: Record<string, unknown>): string[] {
  return provider.envKeys.filter((key) => !env[key]);
}
