import type { BillingStatus, FlowBillingRecord, FlowSourceOfTruthSnapshot } from "@iai/mail-core";

export interface BillingDashModel {
  byStatus: Record<BillingStatus, number>;
  collectionRiskCents: number;
  outstandingCents: number;
  overdueInvoices: FlowBillingRecord[];
  unpaidInvoices: FlowBillingRecord[];
}

export function buildBillingDash(
  snapshot: FlowSourceOfTruthSnapshot,
  now = new Date().toISOString()
): BillingDashModel {
  const byStatus: Record<BillingStatus, number> = {
    failed: 0,
    overdue: 0,
    paid: 0,
    pending: 0,
    refunded: 0
  };

  let collectionRiskCents = 0;
  let outstandingCents = 0;
  const overdueInvoices: FlowBillingRecord[] = [];
  const unpaidInvoices: FlowBillingRecord[] = [];

  for (const item of snapshot.billing) {
    byStatus[item.status] += 1;

    const isOverdue =
      item.status === "overdue" ||
      (item.status === "pending" && Date.parse(item.dueAt) < Date.parse(now));
    const isUnpaid = item.status === "pending" || item.status === "overdue";

    if (isUnpaid) {
      outstandingCents += item.amountCents;
      unpaidInvoices.push(item);
    }

    if (item.status === "failed" || isOverdue) {
      collectionRiskCents += item.amountCents;
    }

    if (isOverdue) {
      overdueInvoices.push(item);
    }
  }

  return {
    byStatus,
    collectionRiskCents,
    outstandingCents,
    overdueInvoices: overdueInvoices.sort((left, right) => Date.parse(left.dueAt) - Date.parse(right.dueAt)),
    unpaidInvoices: unpaidInvoices.sort((left, right) => Date.parse(left.dueAt) - Date.parse(right.dueAt))
  };
}
