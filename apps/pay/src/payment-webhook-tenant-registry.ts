/**
 * Per-tenant outbound webhook destination registry.
 *
 * Each entry binds a `tenant_code` to the destination URL pay.iai.one POSTs
 * to when a payment reaches a terminal state, plus the signature scheme
 * version locked with that consumer.
 *
 * Secrets are NOT stored here — they are read from runtime env at send time
 * by `payment-webhook-outbound-sender.ts`.
 *
 * Add a new tenant by appending to `BUILTIN_PAYMENT_WEBHOOK_TENANTS`.
 */

export type PaymentWebhookSignatureScheme = "tranhatam_hmac_sha256_v1";

export interface PaymentWebhookTenantConfig {
  /** Stable tenant slug used by pay-side internal code (e.g. "tranhatam"). */
  tenant_code: string;
  /**
   * UUID assigned by pay platform for this tenant
   * (e.g. "ten_2e0143ae028a7a3c"). Surfaced for audit / logging only;
   * not sent in the webhook body (receiver routes by destination URL).
   */
  tenant_id: string;
  /** Absolute destination URL including any required query string. */
  destination_url: string;
  /**
   * Locked signature scheme. Each consumer agrees the scheme up-front; pay
   * side MUST NOT silently change it. New scheme = new enum value + a
   * negotiated cutover.
   */
  signature_scheme: PaymentWebhookSignatureScheme;
  /**
   * Header name for the unix-seconds timestamp the receiver compares its
   * wall-clock against (±300s window).
   */
  timestamp_header: string;
  /** Header name for the hex-encoded HMAC signature. */
  signature_header: string;
}

const BUILTIN_PAYMENT_WEBHOOK_TENANTS: readonly PaymentWebhookTenantConfig[] = [
  {
    destination_url:
      "https://api.tranhatam.com/v1/payments/webhook?provider=pay_iai_one",
    signature_header: "x-tranhatam-signature",
    signature_scheme: "tranhatam_hmac_sha256_v1",
    tenant_code: "tranhatam",
    tenant_id: "ten_2e0143ae028a7a3c",
    timestamp_header: "x-tranhatam-timestamp"
  }
];

const BUILTIN_BY_CODE: ReadonlyMap<string, PaymentWebhookTenantConfig> = new Map(
  BUILTIN_PAYMENT_WEBHOOK_TENANTS.map((entry) => [entry.tenant_code, entry])
);

export function getPaymentWebhookTenantRegistrySnapshot(): readonly PaymentWebhookTenantConfig[] {
  return BUILTIN_PAYMENT_WEBHOOK_TENANTS;
}

export function getPaymentWebhookTenantConfig(
  tenantCode: string
): PaymentWebhookTenantConfig | undefined {
  const normalized = tenantCode.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  return BUILTIN_BY_CODE.get(normalized);
}

// TODO BLOCKED: Tenant webhook expansion
// VERIFY_IAI_ONE_TENANT_AND_FLOW_MATRIX_2026 defines 5 tenants:
//   iai, dsts, nhachung, muonnoi, aal
// Only "tranhatam" has a live PaymentWebhookTenantConfig above.
// The remaining 4 tenants MUST NOT be added until each has:
//   - destination_url
//   - tenant_id (pay platform UUID)
//   - signature_scheme + version lock
//   - timestamp_header + signature_header names
//   - runtime secret (stored in env, not in this file)
// Until then, any pay webhook route for those tenants returns 404.
// Owner: Team 2 / Pay runtime. Gate: Founder approval per tenant.
