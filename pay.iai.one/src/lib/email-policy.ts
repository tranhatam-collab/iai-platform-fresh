export const PAYMENT_EMAIL_FLOW_CODES = [
  "payment_receipt",
  "checkout_status_update",
  "renewal_or_failure_notice"
] as const;

export type PaymentEmailFlowCode = (typeof PAYMENT_EMAIL_FLOW_CODES)[number];

export interface PaymentEmailFlowPolicy {
  flowCode: PaymentEmailFlowCode;
  senderEnvKey: "EMAIL_FROM_PAY" | "EMAIL_FROM_BILLING";
  defaultSender: string;
  requiresRealPaymentEvidence: true;
  requiresMessageId: true;
  requiresInboxProof: true;
}

export const PAYMENT_EMAIL_FLOW_POLICIES: Record<PaymentEmailFlowCode, PaymentEmailFlowPolicy> = {
  payment_receipt: {
    flowCode: "payment_receipt",
    senderEnvKey: "EMAIL_FROM_PAY",
    defaultSender: "pay@iai.one",
    requiresRealPaymentEvidence: true,
    requiresMessageId: true,
    requiresInboxProof: true
  },
  checkout_status_update: {
    flowCode: "checkout_status_update",
    senderEnvKey: "EMAIL_FROM_BILLING",
    defaultSender: "billing@iai.one",
    requiresRealPaymentEvidence: true,
    requiresMessageId: true,
    requiresInboxProof: true
  },
  renewal_or_failure_notice: {
    flowCode: "renewal_or_failure_notice",
    senderEnvKey: "EMAIL_FROM_BILLING",
    defaultSender: "billing@iai.one",
    requiresRealPaymentEvidence: true,
    requiresMessageId: true,
    requiresInboxProof: true
  }
};

export const INTERNAL_SMTP_MIGRATION_GATES = [
  "Provider payment flow must be ready on a real or sandbox payment action with provider logs.",
  "Each payment email must have a messageId, D1 evidence, and inbox proof.",
  "Queued only is not migrated. Inbox delivery proof is required.",
  "Do not send payment mail from auth or general sender addresses.",
  "Use pay@iai.one or billing@iai.one depending on the payment flow."
] as const;

export function isPaymentEmailFlowCode(value: string): value is PaymentEmailFlowCode {
  return PAYMENT_EMAIL_FLOW_CODES.includes(value as PaymentEmailFlowCode);
}
