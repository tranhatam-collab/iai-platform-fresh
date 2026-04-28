import { Buffer } from "node:buffer";

import type { MailSmtpConfig } from "@iai/config";
import type { MailQueueSubmitPayload } from "../../../packages/mail-core/dist/index.js";

import type {
  AuditEvent,
  AuthRequest,
  AuthResult,
  DependencyHealthResult,
  MailFromContext,
  MailFromDecision,
  MailSmtpDependencies,
  NormalizationContext,
  NormalizedMessage,
  QueuePublishResult,
  RecipientContext,
  SmtpDecision
} from "./contracts.js";
import { buildNormalizedMessage } from "./normalize-message.js";
import { createSmtpError } from "./smtp-error.js";
import { toMailQueueSubmitPayload } from "./worker-contract.js";

type RemoteOperation =
  | "auth"
  | "mailFrom"
  | "recipient"
  | "normalize"
  | "queue"
  | "audit"
  | "health";

interface RemoteEnvelope<T> {
  data?: T;
  error?: {
    code?: string;
    details?: Record<string, unknown>;
    message?: string;
  };
  message?: string;
  ok?: boolean;
  reason?: string;
  smtpCode?: number;
}

type RemoteNormalizedMessage = Partial<Omit<NormalizedMessage, "rawMime">> & {
  rawMimeBase64?: string;
};

type RemoteNormalizationPayload = Omit<NormalizationContext, "rawMime"> & {
  rawMimeBase64: string;
};

type RemoteQueuePayload = MailQueueSubmitPayload & {
  rawMimeBase64: string;
};

export function createRemoteMailSmtpDependencies(
  config: MailSmtpConfig
): MailSmtpDependencies {
  return {
    async authenticate(input: AuthRequest) {
      return postJson<AuthRequest, AuthResult>(config, "auth", input);
    },

    async authorizeMailFrom(input: MailFromContext) {
      return postJson<MailFromContext, MailFromDecision>(
        config,
        "mailFrom",
        input
      );
    },

    async authorizeRecipient(input: RecipientContext) {
      return postJson<RecipientContext, SmtpDecision>(
        config,
        "recipient",
        input
      );
    },

    async healthcheck() {
      try {
        return await getJson<DependencyHealthResult>(
          config.storage.dependenciesHealthUrl,
          config
        );
      } catch (error) {
        return {
          checks: [
            {
              detail:
                error instanceof Error
                  ? error.message
                  : "Unknown remote health failure",
              name: "smtp_remote_dependencies",
              ok: false
            }
          ],
          mode: config.backend.mode,
          ok: false
        };
      }
    },

    async normalizeMessage(input: NormalizationContext) {
      const fallback = buildNormalizedMessage(input);
      const payload: RemoteNormalizationPayload = {
        ...input,
        rawMimeBase64: input.rawMime.toString("base64")
      };

      const normalized = await postJson<
        RemoteNormalizationPayload,
        RemoteNormalizedMessage
      >(config, "normalize", payload);

      const rawMime = normalized.rawMimeBase64
        ? Buffer.from(normalized.rawMimeBase64, "base64")
        : input.rawMime;

      return {
        ...fallback,
        ...normalized,
        headers: normalized.headers ?? fallback.headers,
        attachments: normalized.attachments ?? fallback.attachments,
        bcc: normalized.bcc ?? fallback.bcc,
        cc: normalized.cc ?? fallback.cc,
        rawMime,
        to: normalized.to ?? fallback.to
      };
    },

    async publishToQueue(input: NormalizedMessage) {
      const sharedPayload = toMailQueueSubmitPayload(input);
      const payload: RemoteQueuePayload = {
        ...sharedPayload,
        rawMimeBase64: input.rawMime.toString("base64")
      };

      const queued = await postJson<RemoteQueuePayload, Partial<QueuePublishResult>>(
        config,
        "queue",
        payload
      );

      return {
        messageEventId: queued.messageEventId,
        messageId: queued.messageId ?? input.messageId,
        providerRoute: queued.providerRoute,
        queuedAt: queued.queuedAt ?? new Date().toISOString(),
        smtpSessionId: queued.smtpSessionId ?? input.smtpSessionId,
        traceId: queued.traceId ?? input.traceId
      };
    },

    async recordAudit(event: AuditEvent) {
      await postJson<AuditEvent, { accepted?: boolean }>(config, "audit", event);
    }
  };
}

async function postJson<TRequest, TResponse>(
  config: MailSmtpConfig,
  operation: RemoteOperation,
  body: TRequest
): Promise<TResponse> {
  const response = await fetch(resolveOperationUrl(config, operation), {
    body: JSON.stringify(body),
    headers: buildHeaders(config),
    method: "POST",
    signal: AbortSignal.timeout(config.backend.remote.timeoutMs)
  });

  return parseResponse<TResponse>(config, operation, response);
}

async function getJson<TResponse>(
  url: string,
  config: MailSmtpConfig
): Promise<TResponse> {
  const response = await fetch(url, {
    headers: buildHeaders(config),
    method: "GET",
    signal: AbortSignal.timeout(config.backend.remote.timeoutMs)
  });

  return parseResponse<TResponse>(config, "health", response);
}

async function parseResponse<TResponse>(
  config: MailSmtpConfig,
  operation: RemoteOperation,
  response: Response
): Promise<TResponse> {
  let payload: unknown;

  if (response.status !== 204) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }
  }

  if (response.ok) {
    return unwrapSuccess<TResponse>(payload);
  }

  throw toSmtpError(config, operation, response.status, payload);
}

function unwrapSuccess<TResponse>(payload: unknown): TResponse {
  if (payload === undefined || payload === null || payload === "") {
    return {} as TResponse;
  }

  if (isEnvelope<TResponse>(payload)) {
    if (payload.ok === false) {
      throw createSmtpError(
        payload.error?.message ??
          payload.reason ??
          payload.message ??
          "Remote backend rejected the request",
        getEnvelopeSmtpCode(payload)
      );
    }

    if (payload.ok === true && payload.data !== undefined) {
      return payload.data as TResponse;
    }
  }

  return payload as TResponse;
}

function toSmtpError(
  config: MailSmtpConfig,
  operation: RemoteOperation,
  statusCode: number,
  payload: unknown
) {
  if (isEnvelope(payload)) {
    return createSmtpError(
      payload.error?.message ??
        payload.reason ??
        payload.message ??
        `Remote backend returned ${statusCode}`,
      getEnvelopeSmtpCode(payload, getDefaultSmtpCode(operation))
    );
  }

  if (typeof payload === "string" && payload.trim()) {
    return createSmtpError(
      `${payload.trim()} (${config.backend.remote.baseUrl})`,
      getDefaultSmtpCode(operation)
    );
  }

  return createSmtpError(
    `Remote backend returned ${statusCode} for ${operation}`,
    getDefaultSmtpCode(operation)
  );
}

function buildHeaders(config: MailSmtpConfig) {
  return {
    ...(config.backend.remote.token
      ? {
          authorization: `Bearer ${config.backend.remote.token}`
        }
      : {}),
    "content-type": "application/json",
    "user-agent": "iai-mail-smtp/0.0.0"
  };
}

function resolveOperationUrl(
  config: MailSmtpConfig,
  operation: RemoteOperation
) {
  const path = (() => {
    switch (operation) {
      case "auth":
        return config.backend.remote.authPath;
      case "mailFrom":
        return config.backend.remote.mailFromPath;
      case "recipient":
        return config.backend.remote.recipientPath;
      case "normalize":
        return config.backend.remote.normalizePath;
      case "queue":
        return config.backend.remote.queuePath;
      case "audit":
        return config.backend.remote.auditPath;
      case "health":
        return config.storage.dependenciesHealthUrl;
    }
  })();

  if (/^https?:\/\//u.test(path)) {
    return path;
  }

  const normalizedBaseUrl = config.backend.remote.baseUrl.endsWith("/")
    ? config.backend.remote.baseUrl
    : `${config.backend.remote.baseUrl}/`;

  return new URL(path.replace(/^\/+/u, ""), normalizedBaseUrl).toString();
}

function getDefaultSmtpCode(operation: RemoteOperation) {
  switch (operation) {
    case "auth":
      return 535;
    case "queue":
    case "audit":
    case "health":
      return 451;
    default:
      return 550;
  }
}

function getEnvelopeSmtpCode(
  payload: RemoteEnvelope<unknown>,
  fallback = 550
) {
  const detailsCode = payload.error?.details?.smtpCode;
  if (typeof detailsCode === "number") {
    return detailsCode;
  }

  return typeof payload.smtpCode === "number" ? payload.smtpCode : fallback;
}

function isEnvelope<T>(payload: unknown): payload is RemoteEnvelope<T> {
  return typeof payload === "object" && payload !== null && (
    "ok" in payload ||
    "data" in payload ||
    "error" in payload ||
    "reason" in payload ||
    "smtpCode" in payload
  );
}
