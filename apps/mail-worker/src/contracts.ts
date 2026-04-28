import type {
  MailDeliveryAttemptRecord,
  MailDeliveryAttemptStatus,
  MailMessageEventRecord,
  MailProviderType,
  MailQueueSubmitPayload
} from "@iai/mail-core";

export type {
  MailDeliveryAttemptRecord,
  MailDeliveryAttemptStatus,
  MailMessageEventRecord,
  MailProviderType
} from "@iai/mail-core";
export type MailWorkerFeature = "attachments" | "tracking";

export interface ProviderRoute {
  active: boolean;
  maxMessageSizeBytes?: number;
  priority: number;
  provider: MailProviderType;
  routeId: string;
  streams: string[];
  workspaceId?: string;
}

export interface ProviderSendContext {
  attemptId: string;
  attemptNumber: number;
  queuedAt: string;
  route: ProviderRoute;
  startedAt: string;
}

export interface ProviderSendResult {
  accepted: boolean;
  providerMessageId?: string;
  providerResponseCode?: string;
  providerResponseMessage?: string;
  rawResponse?: Record<string, unknown>;
  retryable: boolean;
}

export interface ProviderErrorClassification {
  errorClass?: string;
  retryable: boolean;
}

export interface ProviderAdapter {
  provider: MailProviderType;
  classifyError(result: ProviderSendResult): ProviderErrorClassification;
  healthcheck(): Promise<{ detail?: string; ok: boolean }>;
  send(message: MailQueueSubmitPayload, context: ProviderSendContext): Promise<ProviderSendResult>;
  supports(feature: MailWorkerFeature): boolean;
  validateConfig(route: ProviderRoute): void;
}

export interface ProcessQueuedMessageOptions {
  adapters: Partial<Record<MailProviderType, ProviderAdapter>>;
  attemptNumber?: number;
  now?: string;
  retryDelaySeconds?: number;
  routes: ProviderRoute[];
}

export interface ProcessQueuedMessageResult {
  deliveryAttempt: MailDeliveryAttemptRecord;
  route: ProviderRoute;
  timelineEvent: MailMessageEventRecord;
}
