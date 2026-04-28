import type {
  FlowSourceOfTruth,
  MailDomainDnsHealthSource,
  MailMessageListFilter,
  MailMessageReadSource,
  MailProviderRouteFilter,
  MailProviderRouteSource,
  MailSuppressionFilter,
  MailSuppressionReadSource
} from "@iai/mail-core";

import { buildFlowDash, type FlowDashModel } from "./dash/index.js";
import {
  buildDomainDnsHealthPage,
  buildDomainDnsHealthPageFromSource,
  type DomainDnsHealthPageModel
} from "./domain-dns-health.js";
import {
  buildMessageDetailPage,
  buildMessageDetailPageFromSource,
  type MessageDetailPageModel
} from "./message-detail.js";
import { buildMessagesPage, type MessagesPageModel } from "./messages.js";
import {
  buildProviderRoutesPage,
  type ProviderRoutesPageModel
} from "./provider-routes.js";
import {
  buildSuppressionsPage,
  type SuppressionsPageModel
} from "./suppressions.js";

export { buildFlowDash } from "./dash/index.js";
export type { AlertsDashModel } from "./dash/alerts.js";
export type { ApprovalsDashModel } from "./dash/approvals.js";
export type { BillingDashModel } from "./dash/billing.js";
export type { ProofsDashModel } from "./dash/proofs.js";
export type { FlowDashModel };
export { buildDomainDnsHealthPage, buildDomainDnsHealthPageFromSource } from "./domain-dns-health.js";
export type { DomainDnsHealthPageModel };
export { buildMessageDetailPage, buildMessageDetailPageFromSource } from "./message-detail.js";
export type { MessageDetailPageModel };
export { buildMessagesPage } from "./messages.js";
export type { MessagesPageModel };
export { buildProviderRoutesPage } from "./provider-routes.js";
export type { ProviderRoutesPageModel };
export { buildSuppressionsPage } from "./suppressions.js";
export type { SuppressionsPageModel };

export function buildFlowDashFromSource(
  source: FlowSourceOfTruth,
  workspaceId?: string,
  now?: string
): FlowDashModel {
  return buildFlowDash(source.snapshot(workspaceId), now);
}

export function buildMessagesPageFromSource(
  source: MailMessageReadSource,
  filter: MailMessageListFilter = {},
  now?: string
): MessagesPageModel {
  return buildMessagesPage(source.listMessages(filter), now);
}

export function buildMessageDetailViewFromSource(
  source: MailMessageReadSource,
  messageId: string,
  workspaceId?: string,
  now?: string
): MessageDetailPageModel | undefined {
  return buildMessageDetailPageFromSource(source, messageId, workspaceId, now);
}

export function buildProviderRoutesPageFromSource(
  source: MailProviderRouteSource,
  filter: MailProviderRouteFilter = {},
  now?: string
): ProviderRoutesPageModel {
  return buildProviderRoutesPage(source.listRoutes(filter), now);
}

export function buildDomainDnsHealthViewFromSource(
  source: MailDomainDnsHealthSource,
  domainId: string,
  workspaceId?: string,
  now?: string
): DomainDnsHealthPageModel | undefined {
  return buildDomainDnsHealthPageFromSource(source, domainId, workspaceId, now);
}

export function buildSuppressionsPageFromSource(
  source: MailSuppressionReadSource,
  filter: MailSuppressionFilter = {},
  now?: string
): SuppressionsPageModel {
  return buildSuppressionsPage(
    source.listSuppressions({
      ...filter,
      now: filter.now ?? now
    }),
    filter.now ?? now
  );
}
