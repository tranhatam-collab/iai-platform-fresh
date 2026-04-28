import type {
  MailSuppressionFilter,
  MailSuppressionOrigin,
  MailSuppressionReadSource,
  MailSuppressionReason,
  MailSuppressionRecord,
  MailSuppressionScope
} from "@iai/mail-core";
import { isSuppressionActive } from "@iai/mail-core";

export type SuppressionStatus = "active" | "expired" | "removed";

export interface SuppressionListItem {
  createdAt: string;
  email: string;
  expiresAt?: string;
  notes?: string;
  reason: MailSuppressionReason;
  removedAt?: string;
  scope: MailSuppressionScope;
  source: MailSuppressionOrigin;
  status: SuppressionStatus;
  stream?: string;
  suppressionId: string;
}

export interface SuppressionsPageModel {
  activeCount: number;
  byReason: Record<string, number>;
  byScope: Record<string, number>;
  bySource: Record<string, number>;
  expiredCount: number;
  generatedAt: string;
  items: SuppressionListItem[];
  removedCount: number;
  total: number;
}

export function buildSuppressionsPage(
  suppressions: MailSuppressionRecord[],
  now = new Date().toISOString()
): SuppressionsPageModel {
  const sortedItems = suppressions
    .map((item) => buildSuppressionListItem(item, now))
    .sort(compareSuppressionListItems);
  const byReason: Record<string, number> = {};
  const byScope: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (const item of sortedItems) {
    byReason[item.reason] = (byReason[item.reason] ?? 0) + 1;
    byScope[item.scope] = (byScope[item.scope] ?? 0) + 1;
    bySource[item.source] = (bySource[item.source] ?? 0) + 1;
  }

  return {
    activeCount: sortedItems.filter((item) => item.status === "active").length,
    byReason,
    byScope,
    bySource,
    expiredCount: sortedItems.filter((item) => item.status === "expired").length,
    generatedAt: now,
    items: sortedItems,
    removedCount: sortedItems.filter((item) => item.status === "removed").length,
    total: sortedItems.length
  };
}

export function buildSuppressionsPageFromSource(
  source: MailSuppressionReadSource,
  filter: MailSuppressionFilter = {},
  now?: string
): SuppressionsPageModel {
  const resolvedNow = filter.now ?? now ?? new Date().toISOString();

  return buildSuppressionsPage(
    source.listSuppressions({
      ...filter,
      now: resolvedNow
    }),
    resolvedNow
  );
}

function buildSuppressionListItem(
  record: MailSuppressionRecord,
  now: string
): SuppressionListItem {
  return {
    createdAt: record.createdAt,
    email: record.email,
    expiresAt: record.expiresAt,
    notes: record.notes,
    reason: record.reason,
    removedAt: record.removedAt,
    scope: record.scope,
    source: record.source,
    status: resolveSuppressionStatus(record, now),
    stream: record.stream,
    suppressionId: record.suppressionId
  };
}

function resolveSuppressionStatus(
  record: MailSuppressionRecord,
  now: string
): SuppressionStatus {
  if (record.removedAt) {
    return "removed";
  }

  if (!isSuppressionActive(record, now)) {
    return "expired";
  }

  return "active";
}

function compareSuppressionListItems(left: SuppressionListItem, right: SuppressionListItem): number {
  const leftRank = getSuppressionStatusRank(left.status);
  const rightRank = getSuppressionStatusRank(right.status);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const createdAtDelta = Date.parse(right.createdAt) - Date.parse(left.createdAt);
  if (createdAtDelta !== 0) {
    return createdAtDelta;
  }

  return left.suppressionId.localeCompare(right.suppressionId);
}

function getSuppressionStatusRank(status: SuppressionStatus): number {
  if (status === "active") {
    return 0;
  }

  if (status === "expired") {
    return 1;
  }

  return 2;
}
