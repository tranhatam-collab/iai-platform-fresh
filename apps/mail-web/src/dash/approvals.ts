import type { ApprovalStatus, FlowApproval, FlowSourceOfTruthSnapshot } from "@iai/mail-core";

export interface ApprovalsDashModel {
  blockingQueue: FlowApproval[];
  byStatus: Record<ApprovalStatus, number>;
  humanRequiredCount: number;
  overdueCount: number;
  pendingCount: number;
}

export function buildApprovalsDash(
  snapshot: FlowSourceOfTruthSnapshot,
  now = new Date().toISOString()
): ApprovalsDashModel {
  const byStatus: Record<ApprovalStatus, number> = {
    approved: 0,
    expired: 0,
    pending: 0,
    rejected: 0
  };

  const pendingItems: FlowApproval[] = [];
  let overdueCount = 0;
  let humanRequiredCount = 0;

  for (const item of snapshot.approvals) {
    byStatus[item.status] += 1;

    if (item.status !== "pending") {
      continue;
    }

    pendingItems.push(item);

    if (item.requiresHuman) {
      humanRequiredCount += 1;
    }

    if (Date.parse(item.slaDueAt) < Date.parse(now)) {
      overdueCount += 1;
    }
  }

  return {
    blockingQueue: pendingItems
      .filter((item) => item.requiresHuman || Date.parse(item.slaDueAt) < Date.parse(now))
      .sort((left, right) => Date.parse(left.slaDueAt) - Date.parse(right.slaDueAt)),
    byStatus,
    humanRequiredCount,
    overdueCount,
    pendingCount: pendingItems.length
  };
}
