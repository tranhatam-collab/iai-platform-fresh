export type OpsArea = "audit" | "payments" | "payouts" | "reconciliation" | "review";
export type PaymentSessionShellState =
  | "active"
  | "cancelled"
  | "confirmed"
  | "failed"
  | "session_not_found";
export type ReceiptShellState = "confirmed" | "receipt_not_found";

export interface DemoPaymentSession {
  amountValue: number;
  confirmationEta: string;
  createdAt: string;
  currency: string;
  expiresAt: string;
  lateSignalWindowEndsAt: string;
  lastSignal: string;
  lastSignalAt: string;
  orderReference: string;
  originSite: string;
  payerLabel: string;
  paymentReference: string;
  providerFlow: string;
  providerLabel: string;
  receiptId: string;
  sessionId: string;
  state: PaymentSessionShellState;
  supportChannel: string;
  supportEvidence: string[];
}

export interface DemoReceipt {
  amountValue: number;
  confirmedAt: string;
  currency: string;
  originSite: string;
  orderReference: string;
  payerLabel: string;
  paymentMethod: string;
  paymentReference: string;
  receiptId: string;
  returnSiteLabel: string;
  sessionId: string;
  state: ReceiptShellState;
}

export interface DemoOpsMetric {
  label: string;
  value: string;
}

export interface DemoOpsWorkItem {
  detailItems: string[];
  id: string;
  nextAction: string;
  owner: string;
  severity: "high" | "low" | "medium";
  summary: string;
}

export interface DemoOpsSnapshot {
  metrics: DemoOpsMetric[];
  workItems: DemoOpsWorkItem[];
}

export const demoCheckoutSessionId = "ps_demo_phase_d_001";
export const demoCancelledCheckoutSessionId = "ps_demo_cancelled_001";
export const demoConfirmedCheckoutSessionId = "ps_demo_confirmed_001";
export const demoFailedCheckoutSessionId = "ps_demo_failed_001";
export const demoMissingCheckoutSessionId = "ps_demo_missing_001";
export const demoMissingReceiptId = "rcpt_demo_missing_001";
export const demoReceiptId = "rcpt_demo_phase_d_001";

export function getDemoPaymentSession(sessionId: string): DemoPaymentSession {
  const token = deriveToken(sessionId);
  const state = resolvePaymentSessionState(sessionId);

  return {
    amountValue: 1250000,
    confirmationEta: "callback + reconciliation watch within 3 minutes",
    createdAt: "2026-04-21T09:15:00+07:00",
    currency: "VND",
    expiresAt: "2026-04-21T09:45:00+07:00",
    lateSignalWindowEndsAt: "2026-04-21T10:30:00+07:00",
    lastSignal: "payer_return_received",
    lastSignalAt: "2026-04-21T09:23:00+07:00",
    orderReference: `ORD-${token}`,
    originSite: "noos.iai.one",
    payerLabel: "Tran Hatam",
    paymentReference: `PAY-${token}`,
    providerFlow: "hosted checkout -> bank transfer -> reconciliation watch",
    providerLabel: "Vietcombank QR transfer",
    receiptId: sessionId === demoCheckoutSessionId ? demoReceiptId : `rcpt_shell_${token.toLowerCase()}`,
    sessionId,
    state,
    supportChannel: "finance-ops@iai.one",
    supportEvidence: [
      "bank receipt screenshot",
      "provider return timestamp",
      "order reference confirmation"
    ]
  };
}

export function getDemoReceipt(receiptId: string): DemoReceipt {
  const token = deriveToken(receiptId);
  const sessionId = receiptId === demoReceiptId ? demoCheckoutSessionId : `ps_shell_${token.toLowerCase()}`;
  const session = getDemoPaymentSession(sessionId);
  const state = receiptId === demoMissingReceiptId ? "receipt_not_found" : "confirmed";

  return {
    amountValue: session.amountValue,
    confirmedAt: "2026-04-21T09:24:00+07:00",
    currency: session.currency,
    originSite: session.originSite,
    orderReference: session.orderReference,
    payerLabel: session.payerLabel,
    paymentMethod: session.providerLabel,
    paymentReference: session.paymentReference,
    receiptId,
    returnSiteLabel: "app.iai.one billing workspace",
    sessionId,
    state
  };
}

export function getDemoOpsSnapshot(area: OpsArea): DemoOpsSnapshot {
  const session = getDemoPaymentSession(demoCheckoutSessionId);
  const receipt = getDemoReceipt(demoReceiptId);

  const snapshots: Record<OpsArea, DemoOpsSnapshot> = {
    audit: {
      metrics: [
        { label: "trace_records_24h", value: "184" },
        { label: "approval_chains_open", value: "6" },
        { label: "evidence_packages_ready", value: "11" }
      ],
      workItems: [
        {
          detailItems: [
            `trace_id: trace_${session.sessionId}`,
            "linked_payloads: provider webhook + internal callback log",
            "approval_chain: finance_audit -> security_read"
          ],
          id: `trace:${session.sessionId}`,
          nextAction: "compare provider payload against callback delivery log",
          owner: "audit_ops",
          severity: "medium",
          summary: `Deep trace requested for ${session.orderReference}`
        },
        {
          detailItems: [
            `receipt_id: ${receipt.receiptId}`,
            `payment_reference: ${receipt.paymentReference}`,
            "export_gate: finance_audit approval required"
          ],
          id: `receipt:${receipt.receiptId}`,
          nextAction: "verify receipt field history before export",
          owner: "finance_audit",
          severity: "low",
          summary: `Historical receipt check for ${receipt.paymentReference}`
        }
      ]
    },
    payments: {
      metrics: [
        { label: "payments_today", value: "32" },
        { label: "awaiting_confirmation", value: "4" },
        { label: "unmatched_webhooks", value: "2" }
      ],
      workItems: [
        {
          detailItems: [
            `payment_session_id: ${session.sessionId}`,
            `order_reference: ${session.orderReference}`,
            "watchers: callback, reconciliation, support escalation"
          ],
          id: session.sessionId,
          nextAction: "watch callback and keep status shell calm",
          owner: "payments_ops",
          severity: "medium",
          summary: `Awaiting confirmation for ${session.orderReference}`
        },
        {
          detailItems: [
            `intent_id: intent_${session.orderReference}`,
            "provider_attempts: 2",
            "callback_delivery: pending retry"
          ],
          id: `intent:${session.orderReference}`,
          nextAction: "inspect provider attempt timeline",
          owner: "payments_ops",
          severity: "medium",
          summary: "Provider retry chain needs a detail-view read"
        }
      ]
    },
    payouts: {
      metrics: [
        { label: "ready_for_treasury", value: "2" },
        { label: "approval_holds", value: "3" },
        { label: "execution_failures_open", value: "1" }
      ],
      workItems: [
        {
          detailItems: [
            "payout_request_id: po_demo_24021",
            "execution_evidence: missing",
            "hold_reason: treasury evidence required"
          ],
          id: "po_demo_24021",
          nextAction: "collect treasury evidence before state change",
          owner: "treasury_ops",
          severity: "high",
          summary: "Approval granted but execution evidence missing"
        },
        {
          detailItems: [
            `linked_session: ${session.sessionId}`,
            "reconciliation_gate: open",
            "finance_note: hold until upstream cleared"
          ],
          id: "po_demo_24022",
          nextAction: "keep payout hold until reconciliation clears",
          owner: "finance_review",
          severity: "high",
          summary: `Downstream payout blocked by ${session.sessionId}`
        }
      ]
    },
    reconciliation: {
      metrics: [
        { label: "late_payments", value: "2" },
        { label: "amount_mismatches", value: "1" },
        { label: "duplicate_signals", value: "3" }
      ],
      workItems: [
        {
          detailItems: [
            `payment_session_id: ${session.sessionId}`,
            "signal_type: late bank transfer",
            "policy_window: late-signal capture still open"
          ],
          id: `recon:${session.sessionId}`,
          nextAction: "match late bank signal against expired-session policy",
          owner: "finance_ops",
          severity: "high",
          summary: `Late payment review for ${session.orderReference}`
        },
        {
          detailItems: [
            "received_amount: 1,100,000 VND",
            "expected_amount: 1,250,000 VND",
            "release_gate: locked pending manual confirmation"
          ],
          id: "recon:amt_mismatch_01",
          nextAction: "request payer evidence and lock downstream release",
          owner: "finance_ops",
          severity: "high",
          summary: "Amount mismatch needs manual confirmation"
        }
      ]
    },
    review: {
      metrics: [
        { label: "manual_review_open", value: "5" },
        { label: "high_value_holds", value: "2" },
        { label: "security_escalations", value: "1" }
      ],
      workItems: [
        {
          detailItems: [
            `payment_session_id: ${session.sessionId}`,
            "conflict_type: duplicate provider signal",
            "escalation_path: risk_review -> finance_ops"
          ],
          id: `review:${session.sessionId}`,
          nextAction: "attach reviewer note before escalation",
          owner: "risk_review",
          severity: "medium",
          summary: `Conflicting payment signal around ${session.orderReference}`
        },
        {
          detailItems: [
            "reference_received: wrong_ref_02",
            "required_evidence: payer transfer slip + site order context",
            "target_lane: reconciliation"
          ],
          id: "review:wrong_ref_02",
          nextAction: "collect evidence pack and route into reconciliation",
          owner: "support_ops",
          severity: "medium",
          summary: "Wrong reference transfer should not auto-complete access"
        }
      ]
    }
  };

  return snapshots[area];
}

export function getDemoOpsWorkItem(area: OpsArea, itemId: string): DemoOpsWorkItem | null {
  return getDemoOpsSnapshot(area).workItems.find((item) => item.id === itemId) ?? null;
}

function deriveToken(rawId: string): string {
  const compact = rawId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return compact.slice(-8) || "SHELL001";
}

function resolvePaymentSessionState(sessionId: string): PaymentSessionShellState {
  if (sessionId === demoConfirmedCheckoutSessionId) {
    return "confirmed";
  }

  if (sessionId === demoFailedCheckoutSessionId) {
    return "failed";
  }

  if (sessionId === demoCancelledCheckoutSessionId) {
    return "cancelled";
  }

  if (sessionId === demoMissingCheckoutSessionId) {
    return "session_not_found";
  }

  return "active";
}
