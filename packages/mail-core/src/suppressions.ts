export type MailSuppressionReason = "hard_bounce" | "complaint" | "unsubscribe" | "manual";
export type MailSuppressionScope = "recipient" | "workspace" | "stream";
export type MailSuppressionOrigin =
  | "provider_webhook"
  | "operator"
  | "recipient_action"
  | "policy_engine";

export interface MailSuppressionRecord {
  createdAt: string;
  email: string;
  expiresAt?: string;
  notes?: string;
  reason: MailSuppressionReason;
  removedAt?: string;
  scope: MailSuppressionScope;
  source: MailSuppressionOrigin;
  stream?: string;
  suppressionId: string;
  workspaceId: string;
}

export interface MailSuppressionFilter {
  activeOnly?: boolean;
  email?: string;
  now?: string;
  reasons?: MailSuppressionReason[];
  scopes?: MailSuppressionScope[];
  sources?: MailSuppressionOrigin[];
  stream?: string;
  workspaceId?: string;
}

export interface MailSuppressionSourceSnapshot {
  generatedAt: string;
  items: MailSuppressionRecord[];
  version: "mail_suppressions_sot_v1";
}

export interface MailSuppressionReadSource {
  listSuppressions(filter?: MailSuppressionFilter): MailSuppressionRecord[];
  snapshot(workspaceId?: string): MailSuppressionSourceSnapshot;
}

export function createMailSuppressionSource(
  seed?: Partial<MailSuppressionSourceSnapshot>
): MailSuppressionReadSource {
  const baseline = createMergedSnapshot(seed);

  return {
    listSuppressions(filter = {}) {
      const now = filter.now ?? baseline.generatedAt;

      return baseline.items
        .filter((item) => {
          if (filter.workspaceId && item.workspaceId !== filter.workspaceId) {
            return false;
          }

          if (filter.email && item.email !== filter.email) {
            return false;
          }

          if (filter.stream && item.stream !== filter.stream) {
            return false;
          }

          if (filter.reasons && filter.reasons.length > 0 && !filter.reasons.includes(item.reason)) {
            return false;
          }

          if (filter.scopes && filter.scopes.length > 0 && !filter.scopes.includes(item.scope)) {
            return false;
          }

          if (filter.sources && filter.sources.length > 0 && !filter.sources.includes(item.source)) {
            return false;
          }

          if (filter.activeOnly && !isSuppressionActive(item, now)) {
            return false;
          }

          return true;
        })
        .sort(compareSuppressions);
    },
    snapshot(workspaceId) {
      if (!workspaceId) {
        return baseline;
      }

      return {
        generatedAt: baseline.generatedAt,
        items: baseline.items.filter((item) => item.workspaceId === workspaceId),
        version: baseline.version
      };
    }
  };
}

export function isSuppressionActive(item: MailSuppressionRecord, now: string): boolean {
  if (item.removedAt) {
    return false;
  }

  if (item.expiresAt && Date.parse(item.expiresAt) <= Date.parse(now)) {
    return false;
  }

  return true;
}

function createMergedSnapshot(
  seed?: Partial<MailSuppressionSourceSnapshot>
): MailSuppressionSourceSnapshot {
  const defaults = createDefaultSnapshot();

  return {
    generatedAt: seed?.generatedAt ?? defaults.generatedAt,
    items: seed?.items ?? defaults.items,
    version: "mail_suppressions_sot_v1"
  };
}

function createDefaultSnapshot(): MailSuppressionSourceSnapshot {
  return {
    generatedAt: "2026-04-14T10:25:00.000Z",
    items: [
      {
        createdAt: "2026-04-14T09:58:00.000Z",
        email: "bounce@example.com",
        reason: "hard_bounce",
        scope: "recipient",
        source: "provider_webhook",
        suppressionId: "sup_hard_bounce_001",
        workspaceId: "ws_mail_main"
      },
      {
        createdAt: "2026-04-14T09:59:00.000Z",
        email: "complaint@example.com",
        reason: "complaint",
        scope: "recipient",
        source: "provider_webhook",
        suppressionId: "sup_complaint_001",
        workspaceId: "ws_mail_main"
      },
      {
        createdAt: "2026-04-14T09:55:00.000Z",
        email: "promo-optout@example.com",
        reason: "unsubscribe",
        scope: "stream",
        source: "recipient_action",
        stream: "marketing",
        suppressionId: "sup_unsubscribe_001",
        workspaceId: "ws_mail_main"
      },
      {
        createdAt: "2026-04-14T09:40:00.000Z",
        email: "manual-temporary@example.com",
        expiresAt: "2026-04-14T09:50:00.000Z",
        notes: "Temporary manual hold during mailbox warmup.",
        reason: "manual",
        scope: "workspace",
        source: "operator",
        suppressionId: "sup_manual_expired_001",
        workspaceId: "ws_mail_main"
      },
      {
        createdAt: "2026-04-14T09:35:00.000Z",
        email: "restored@example.com",
        notes: "Recipient restored after operator review.",
        reason: "manual",
        removedAt: "2026-04-14T10:05:00.000Z",
        scope: "workspace",
        source: "operator",
        suppressionId: "sup_manual_removed_001",
        workspaceId: "ws_mail_main"
      }
    ],
    version: "mail_suppressions_sot_v1"
  };
}

function compareSuppressions(left: MailSuppressionRecord, right: MailSuppressionRecord): number {
  const createdAtDelta = Date.parse(right.createdAt) - Date.parse(left.createdAt);
  if (createdAtDelta !== 0) {
    return createdAtDelta;
  }

  return left.suppressionId.localeCompare(right.suppressionId);
}
