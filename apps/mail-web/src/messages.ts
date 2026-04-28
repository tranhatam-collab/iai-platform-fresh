import type {
  MailMessageListFilter,
  MailMessageListPage,
  MailMessageListItem,
  MailMessageReadSource
} from "@iai/mail-core";

export interface MessagesPageModel {
  byStatus: Record<string, number>;
  byStream: Record<string, number>;
  generatedAt: string;
  items: MailMessageListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export function buildMessagesPage(
  page: MailMessageListPage,
  now = new Date().toISOString()
): MessagesPageModel {
  const byStatus: Record<string, number> = {};
  const byStream: Record<string, number> = {};

  for (const item of page.items) {
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    byStream[item.stream] = (byStream[item.stream] ?? 0) + 1;
  }

  return {
    byStatus,
    byStream,
    generatedAt: now,
    items: page.items,
    page: page.page,
    pageSize: page.pageSize,
    total: page.total
  };
}

export function buildMessagesPageFromSource(
  source: MailMessageReadSource,
  filter: MailMessageListFilter = {},
  now?: string
): MessagesPageModel {
  return buildMessagesPage(source.listMessages(filter), now);
}
