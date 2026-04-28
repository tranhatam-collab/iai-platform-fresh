import { randomUUID } from "node:crypto";

import type { MailSmtpConfig } from "@iai/config";

import type {
  AuditEvent,
  AuthRequest,
  MailSmtpDependencies,
  MailStream,
  MessageHeaders,
  NormalizationContext,
  NormalizedMessage
} from "./contracts.js";
import { buildNormalizedMessage } from "./normalize-message.js";
import { createSmtpError } from "./smtp-error.js";
import {
  buildSmtpQueuedArtifacts,
  toMailQueueSubmitPayload
} from "./worker-contract.js";

interface StubStore {
  audits: AuditEvent[];
  queuedMessages: Array<{
    artifacts: ReturnType<typeof buildSmtpQueuedArtifacts>;
    message: NormalizedMessage;
    messageId: string;
    queuePayload: ReturnType<typeof toMailQueueSubmitPayload>;
    queuedAt: string;
  }>;
}

export function createStubMailSmtpDependencies(
  config: MailSmtpConfig
): MailSmtpDependencies {
  const store: StubStore = {
    audits: [],
    queuedMessages: []
  };

  const allowedSenders = new Set(
    config.development.allowedSenders.map((sender) => sender.toLowerCase())
  );
  const allowedStreams = new Set(config.development.allowedStreams);
  const suppressedRecipients = new Set(
    config.development.suppressedRecipients.map((email) => email.toLowerCase())
  );
  const verifiedDomains = new Set(
    config.development.verifiedDomains.map((domain) => domain.toLowerCase())
  );

  return {
    async authenticate(input: AuthRequest) {
      if (!config.development.authUser || !config.development.authPassword) {
        throw createSmtpError(
          "Stub backend missing MAIL_SMTP_DEV_AUTH_USER or MAIL_SMTP_DEV_AUTH_PASS",
          454
        );
      }

      if (
        input.username !== config.development.authUser ||
        input.password !== config.development.authPassword
      ) {
        throw createSmtpError("Invalid SMTP credentials", 535);
      }

      return {
        allowedStreams: [...allowedStreams],
        credentialId: config.development.credentialId,
        defaultStream: config.policy.defaultStream,
        principal: config.development.authUser,
        workspaceId: config.development.workspaceId
      };
    },

    async authorizeMailFrom(input) {
      const sender = input.address.toLowerCase();
      if (!allowedSenders.has(sender)) {
        return {
          ok: false,
          reason: `Sender identity ${input.address} is not allowed`,
          smtpCode: 550
        };
      }

      const domain = sender.split("@")[1];
      if (!domain || !verifiedDomains.has(domain)) {
        return {
          ok: false,
          reason: `Domain for ${input.address} is not verified`,
          smtpCode: 550
        };
      }

      return {
        ok: true,
        stream: input.auth.defaultStream
      };
    },

    async authorizeRecipient(input) {
      if (!looksLikeEmail(input.recipient)) {
        return {
          ok: false,
          reason: `Recipient ${input.recipient} is invalid`,
          smtpCode: 550
        };
      }

      if (
        config.policy.rejectSuppressedRecipients &&
        suppressedRecipients.has(input.recipient.toLowerCase())
      ) {
        return {
          ok: false,
          reason: `Recipient ${input.recipient} is suppressed`,
          smtpCode: 550
        };
      }

      return {
        ok: true
      };
    },

    async healthcheck() {
      const checks = [
        {
          detail:
            config.backend.mode === "stub"
              ? "Stub backend enabled for local SMTP smoke"
              : "Remote backend selected",
          name: "backend_mode",
          ok: true
        },
        {
          detail: `${allowedSenders.size} sender(s) loaded`,
          name: "allowed_senders",
          ok: allowedSenders.size > 0
        },
        {
          detail: `${verifiedDomains.size} verified domain(s) loaded`,
          name: "verified_domains",
          ok: verifiedDomains.size > 0
        },
        {
          detail: config.queue.url,
          name: "queue_target",
          ok: Boolean(config.queue.url)
        },
        {
          detail: config.storage.healthUrl,
          name: "api_health_url",
          ok: Boolean(config.storage.healthUrl)
        }
      ];

      return {
        checks,
        mode: config.backend.mode,
        ok: checks.every((check) => check.ok)
      };
    },

    async normalizeMessage(input: NormalizationContext) {
      const normalized = buildNormalizedMessage(input);
      const requestedStream = getRequestedStream(normalized.headers, config);
      if (requestedStream && !allowedStreams.has(requestedStream)) {
        throw createSmtpError(
          `Stream ${requestedStream} is not allowed for this credential`,
          550
        );
      }

      const finalStream = requestedStream ?? input.stream;
      const headerFrom = normalized.headerFrom;
      if (headerFrom && !allowedSenders.has(headerFrom.toLowerCase())) {
        throw createSmtpError(
          `Header From ${headerFrom} is not allowed for this credential`,
          550
        );
      }

      if (headerFrom) {
        const domain = headerFrom.split("@")[1]?.toLowerCase();
        if (!domain || !verifiedDomains.has(domain)) {
          throw createSmtpError(
            `Header From domain for ${headerFrom} is not verified`,
            550
          );
        }
      }

      return {
        ...normalized,
        stream: finalStream,
        senderIdentityId: input.auth.senderIdentityId
      };
    },

    async publishToQueue(message) {
      const queuedAt = new Date().toISOString();
      const messageEventId = `evt_${randomUUID()}`;
      const queuePayload = toMailQueueSubmitPayload(message);
      const result = {
        messageEventId,
        messageId: message.messageId,
        providerRoute: config.routing.primaryRoute,
        queuedAt,
        smtpSessionId: message.smtpSessionId,
        traceId: message.traceId
      };
      const artifacts = buildSmtpQueuedArtifacts(message, result);

      store.queuedMessages.unshift({
        artifacts,
        message,
        messageId: message.messageId,
        queuePayload,
        queuedAt
      });
      store.queuedMessages.length = Math.min(store.queuedMessages.length, 100);

      return result;
    },

    async recordAudit(event) {
      store.audits.unshift(event);
      store.audits.length = Math.min(store.audits.length, 100);
      console.info("[mail-smtp][audit]", JSON.stringify(event));
    }
  };
}

function getRequestedStream(headers: MessageHeaders, config: MailSmtpConfig) {
  if (!config.policy.allowHeaderStreamOverride) {
    return undefined;
  }

  const rawStream = headers["x-iai-stream"];
  if (!rawStream) {
    return undefined;
  }

  return normalizeStream(rawStream);
}

function normalizeStream(stream: string): MailStream {
  const normalized = stream.trim().toLowerCase();
  if (
    normalized === "transactional" ||
    normalized === "system" ||
    normalized === "marketing" ||
    normalized === "alerts"
  ) {
    return normalized;
  }

  throw createSmtpError(`Unsupported X-IAI-Stream value: ${stream}`, 550);
}

function looksLikeEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/u.test(value.trim());
}
