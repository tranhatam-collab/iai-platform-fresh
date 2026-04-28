import type {
  AlertScope,
  AlertSeverity,
  AlertStatus,
  FlowAlertRecord,
  FlowSourceOfTruthSnapshot
} from "@iai/mail-core";

export interface AlertsDashModel {
  byScope: Record<AlertScope, number>;
  bySeverity: Record<AlertSeverity, number>;
  byStatus: Record<AlertStatus, number>;
  criticalOpen: FlowAlertRecord[];
  humanRequiredOpenCount: number;
  openCount: number;
}

export function buildAlertsDash(snapshot: FlowSourceOfTruthSnapshot): AlertsDashModel {
  const byScope: Record<AlertScope, number> = {
    approvals: 0,
    billing: 0,
    proofs: 0,
    runtime: 0,
    security: 0
  };
  const bySeverity: Record<AlertSeverity, number> = {
    critical: 0,
    info: 0,
    warning: 0
  };
  const byStatus: Record<AlertStatus, number> = {
    acked: 0,
    open: 0,
    resolved: 0
  };

  const criticalOpen: FlowAlertRecord[] = [];
  let humanRequiredOpenCount = 0;
  let openCount = 0;

  for (const item of snapshot.alerts) {
    byScope[item.scope] += 1;
    bySeverity[item.severity] += 1;
    byStatus[item.status] += 1;

    if (item.status !== "open") {
      continue;
    }

    openCount += 1;
    if (item.requiresHuman) {
      humanRequiredOpenCount += 1;
    }

    if (item.severity === "critical") {
      criticalOpen.push(item);
    }
  }

  return {
    byScope,
    bySeverity,
    byStatus,
    criticalOpen: criticalOpen.sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
    ),
    humanRequiredOpenCount,
    openCount
  };
}
