import { randomUUID } from "node:crypto";

import type { MailQueueSubmitPayload, MailTimelineEventType } from "@iai/mail-core";

import type {
  MailDeliveryAttemptRecord,
  MailDeliveryAttemptStatus,
  MailMessageEventRecord,
  ProcessQueuedMessageOptions,
  ProcessQueuedMessageResult,
  ProviderAdapter,
  ProviderRoute
} from "./contracts.js";

const DEFAULT_RETRY_DELAY_SECONDS = 300;

export class MailWorkerError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "MailWorkerError";
  }
}

export async function processQueuedMessage(
  message: MailQueueSubmitPayload,
  options: ProcessQueuedMessageOptions
): Promise<ProcessQueuedMessageResult> {
  const startedAt = options.now ?? new Date().toISOString();
  const route = selectProviderRoute(message, options.routes);
  const adapter = options.adapters[route.provider];

  if (!adapter) {
    throw new MailWorkerError("PROVIDER_ADAPTER_NOT_FOUND", "No provider adapter registered.", {
      provider: route.provider,
      routeId: route.routeId
    });
  }

  adapter.validateConfig(route);
  assertRouteSupportsMessage(message, route, adapter);

  const attemptNumber = options.attemptNumber ?? 1;
  const attemptId = `att_${randomUUID()}`;
  const sendResult = await adapter.send(message, {
    attemptId,
    attemptNumber,
    queuedAt: message.submittedAt,
    route,
    startedAt
  });
  const finishedAt = options.now ?? new Date().toISOString();
  const classification = adapter.classifyError(sendResult);
  const eventType = resolveTimelineEventType(sendResult.accepted, classification.retryable);
  const status = mapEventTypeToAttemptStatus(eventType);
  const nextRetryAt =
    status === "deferred"
      ? addSeconds(finishedAt, options.retryDelaySeconds ?? DEFAULT_RETRY_DELAY_SECONDS)
      : undefined;

  return {
    deliveryAttempt: buildDeliveryAttemptRecord({
      attemptId,
      attemptNumber,
      errorClass: classification.errorClass,
      finishedAt,
      message,
      nextRetryAt,
      providerRoute: route,
      sendResult,
      startedAt,
      status
    }),
    route,
    timelineEvent: buildTimelineEventRecord({
      attemptId,
      eventType,
      finishedAt,
      message,
      providerRoute: route,
      sendResult
    })
  };
}

export function selectProviderRoute(
  message: MailQueueSubmitPayload,
  routes: ProviderRoute[]
): ProviderRoute {
  const candidates = routes
    .filter((route) => route.active)
    .filter((route) => route.streams.includes(message.stream))
    .filter((route) => route.workspaceId === undefined || route.workspaceId === message.workspaceId)
    .sort((left, right) => {
      const leftSpecificity = left.workspaceId === message.workspaceId ? 0 : 1;
      const rightSpecificity = right.workspaceId === message.workspaceId ? 0 : 1;

      if (leftSpecificity !== rightSpecificity) {
        return leftSpecificity - rightSpecificity;
      }

      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      return left.routeId.localeCompare(right.routeId);
    });

  const route = candidates[0];
  if (route) {
    return route;
  }

  throw new MailWorkerError("PROVIDER_ROUTE_NOT_FOUND", "No active provider route matched.", {
    stream: message.stream,
    workspaceId: message.workspaceId
  });
}

function assertRouteSupportsMessage(
  message: MailQueueSubmitPayload,
  route: ProviderRoute,
  adapter: ProviderAdapter
) {
  if (message.attachments.length > 0 && !adapter.supports("attachments")) {
    throw new MailWorkerError(
      "PROVIDER_FEATURE_UNSUPPORTED",
      "Selected provider route does not support attachments.",
      {
        provider: route.provider,
        routeId: route.routeId
      }
    );
  }

  if (
    route.maxMessageSizeBytes !== undefined &&
    calculateApproximateMessageSize(message) > route.maxMessageSizeBytes
  ) {
    throw new MailWorkerError(
      "MESSAGE_TOO_LARGE_FOR_ROUTE",
      "Queued message exceeds the selected route size limit.",
      {
        maxMessageSizeBytes: route.maxMessageSizeBytes,
        routeId: route.routeId
      }
    );
  }
}

function calculateApproximateMessageSize(message: MailQueueSubmitPayload) {
  const textBytes = Buffer.byteLength(message.text ?? "", "utf8");
  const htmlBytes = Buffer.byteLength(message.html ?? "", "utf8");
  const subjectBytes = Buffer.byteLength(message.subject ?? "", "utf8");
  const attachmentBytes = message.attachments.reduce(
    (total, item) => total + (item.sizeBytes ?? 0),
    0
  );

  return textBytes + htmlBytes + subjectBytes + attachmentBytes;
}

function buildDeliveryAttemptRecord(input: {
  attemptId: string;
  attemptNumber: number;
  errorClass?: string;
  finishedAt: string;
  message: MailQueueSubmitPayload;
  nextRetryAt?: string;
  providerRoute: ProviderRoute;
  sendResult: Awaited<ReturnType<ProviderAdapter["send"]>>;
  startedAt: string;
  status: MailDeliveryAttemptStatus;
}): MailDeliveryAttemptRecord {
  return {
    attemptId: input.attemptId,
    attemptNumber: input.attemptNumber,
    errorClass: input.errorClass,
    finishedAt: input.finishedAt,
    messageId: input.message.messageId,
    nextRetryAt: input.nextRetryAt,
    providerMessageId: input.sendResult.providerMessageId,
    providerResponseCode: input.sendResult.providerResponseCode,
    providerResponseMessage: input.sendResult.providerResponseMessage,
    providerRouteId: input.providerRoute.routeId,
    providerType: input.providerRoute.provider,
    rawResponseJson: input.sendResult.rawResponse,
    startedAt: input.startedAt,
    status: input.status,
    traceId: input.message.traceId,
    workspaceId: input.message.workspaceId
  };
}

function buildTimelineEventRecord(input: {
  attemptId: string;
  eventType: MailTimelineEventType;
  finishedAt: string;
  message: MailQueueSubmitPayload;
  providerRoute: ProviderRoute;
  sendResult: Awaited<ReturnType<ProviderAdapter["send"]>>;
}): MailMessageEventRecord {
  return {
    eventId: `evt_${input.message.messageId}_${input.eventType}_${input.attemptId}`,
    eventType: input.eventType,
    messageId: input.message.messageId,
    occurredAt: input.finishedAt,
    payload: {
      attemptId: input.attemptId,
      providerResponseCode: input.sendResult.providerResponseCode,
      providerResponseMessage: input.sendResult.providerResponseMessage,
      providerRouteId: input.providerRoute.routeId,
      retryable: input.sendResult.retryable
    },
    providerMessageId: input.sendResult.providerMessageId,
    providerType: input.providerRoute.provider,
    source: input.message.source,
    traceId: input.message.traceId,
    workspaceId: input.message.workspaceId
  };
}

function resolveTimelineEventType(
  accepted: boolean,
  retryable: boolean
): Extract<MailTimelineEventType, "provider_accepted" | "deferred" | "failed"> {
  if (accepted) {
    return "provider_accepted";
  }

  return retryable ? "deferred" : "failed";
}

function mapEventTypeToAttemptStatus(
  eventType: Extract<MailTimelineEventType, "provider_accepted" | "deferred" | "failed">
): MailDeliveryAttemptStatus {
  switch (eventType) {
    case "provider_accepted":
      return "accepted";
    case "deferred":
      return "deferred";
    case "failed":
      return "failed";
  }
}

function addSeconds(timestamp: string, seconds: number) {
  return new Date(Date.parse(timestamp) + seconds * 1000).toISOString();
}
