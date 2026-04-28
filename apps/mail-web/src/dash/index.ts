import type { FlowSourceOfTruthSnapshot } from "@iai/mail-core";

import { buildAlertsDash, type AlertsDashModel } from "./alerts.js";
import { buildApprovalsDash, type ApprovalsDashModel } from "./approvals.js";
import { buildBillingDash, type BillingDashModel } from "./billing.js";
import { buildProofsDash, type ProofsDashModel } from "./proofs.js";

export interface FlowDashModel {
  alerts: AlertsDashModel;
  approvals: ApprovalsDashModel;
  billing: BillingDashModel;
  generatedAt: string;
  proofs: ProofsDashModel;
}

export function buildFlowDash(
  snapshot: FlowSourceOfTruthSnapshot,
  now = new Date().toISOString()
): FlowDashModel {
  return {
    alerts: buildAlertsDash(snapshot),
    approvals: buildApprovalsDash(snapshot, now),
    billing: buildBillingDash(snapshot, now),
    generatedAt: now,
    proofs: buildProofsDash(snapshot)
  };
}
