import { readFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";

import type { MailSmtpConfig } from "@iai/config";
import { SMTPServer } from "smtp-server";
import type {
  SMTPServerAddress,
  SMTPServerAuthentication,
  SMTPServerSession
} from "smtp-server";

import type {
  MailFromDecision,
  MailSmtpDependencies,
  RuntimeSessionState,
  SmtpDecision
} from "./contracts.js";
import {
  createSmtpError,
  getErrorMessage,
  getSmtpErrorCode
} from "./smtp-error.js";
import type { RuntimeStats } from "./stats.js";
import {
  smtpLogEvents,
  smtpMetricNames,
  type SmtpLogger
} from "./telemetry.js";

const sessionState = new WeakMap<SMTPServerSession, RuntimeSessionState>();

export function createMailSmtpServer(
  config: MailSmtpConfig,
  dependencies: MailSmtpDependencies,
  stats: RuntimeStats,
  logger: SmtpLogger
) {
  return new SMTPServer({
    authMethods: config.auth.methods,
    authOptional: false,
    banner: config.server.banner,
    ca: maybeReadCertificateChain(config.tls.caPath),
    cert: maybeReadFile(config.tls.certPath),
    hideSTARTTLS: false,
    key: maybeReadFile(config.tls.keyPath),
    logger: false,
    minVersion: config.tls.minVersion,
    onAuth(auth, session, callback) {
      void handleAuth(config, dependencies, auth, session)
        .then((result) => {
          stats.recordAuthSuccess();
          const snapshot = stats.snapshot();
          logger.info(smtpLogEvents.authSucceeded, {
            authMethod: auth.method,
            credentialId: result.credentialId,
            principal: result.principal,
            remoteAddress: session.remoteAddress,
            secure: session.secure,
            smtpSessionId: sessionState.get(session)?.smtpSessionId,
            username: auth.username,
            workspaceId: result.workspaceId,
            ...metricFields([
              [smtpMetricNames.authSuccessTotal, snapshot.authSuccessCount],
              [smtpMetricNames.activeSessions, snapshot.activeSessions]
            ])
          });
          callback(null, { user: auth.username });
        })
        .catch((error: Error) => {
          const message = getErrorMessage(error);
          const code = getSmtpErrorCode(error);
          stats.recordAuthFailure(message, code);
          const snapshot = stats.snapshot();
          logger.warn(smtpLogEvents.authRejected, {
            authMethod: auth.method,
            message,
            remoteAddress: session.remoteAddress,
            secure: session.secure,
            smtpSessionId: sessionState.get(session)?.smtpSessionId,
            smtpCode: code,
            username: auth.username,
            ...metricFields([
              [smtpMetricNames.authFailureTotal, snapshot.authFailureCount],
              [smtpMetricNames.rejectionTotal, snapshot.rejectionCount],
              [smtpMetricNames.activeSessions, snapshot.activeSessions]
            ])
          });
          callback(error);
        });
    },
    onClose(session) {
      sessionState.delete(session);
      stats.sessionClosed();
    },
    onConnect(session, callback) {
      sessionState.set(session, {
        recipients: [],
        smtpSessionId: `smtp_${randomUUID()}`
      });
      stats.sessionOpened();

      callback(null);
    },
    onData(stream, session, callback) {
      void handleData(config, dependencies, stream, session)
        .then((queued) => {
          stats.recordMessageQueued(queued.messageId);
          const snapshot = stats.snapshot();
          logger.info(smtpLogEvents.messageQueued, {
            credentialId: queued.credentialId,
            envelopeFrom: queued.envelopeFrom,
            messageEventId: queued.messageEventId,
            messageId: queued.messageId,
            principal: queued.principal,
            providerRoute: queued.providerRoute,
            queuedAt: queued.queuedAt,
            recipientCount: queued.recipientCount,
            smtpSessionId: queued.smtpSessionId,
            stream: queued.stream,
            traceId: queued.traceId,
            workspaceId: queued.workspaceId,
            ...metricFields([
              [smtpMetricNames.messageQueuedTotal, snapshot.messageQueuedCount],
              [smtpMetricNames.activeSessions, snapshot.activeSessions]
            ])
          });
          callback(null, `Queued as ${queued.messageId}`);
        })
        .catch((error: Error) => {
          const message = getErrorMessage(error);
          const code = getSmtpErrorCode(error);
          stats.recordRejection(message, code);
          const snapshot = stats.snapshot();
          logger.warn(smtpLogEvents.messageRejected, {
            message,
            remoteAddress: session.remoteAddress,
            smtpCode: code,
            ...getSessionLogFields(session),
            ...metricFields([
              [smtpMetricNames.rejectionTotal, snapshot.rejectionCount],
              [smtpMetricNames.activeSessions, snapshot.activeSessions]
            ])
          });
          callback(error);
        });
    },
    onMailFrom(address, session, callback) {
      void handleMailFrom(config, dependencies, address, session)
        .then((state) => {
          stats.recordMailFromAccepted();
          const snapshot = stats.snapshot();
          logger.info(smtpLogEvents.mailFromAccepted, {
            credentialId: state.auth?.credentialId,
            envelopeFrom: address.address,
            principal: state.auth?.principal,
            secure: session.secure,
            senderIdentityId: state.senderIdentityId,
            smtpSessionId: state.smtpSessionId,
            stream: state.stream,
            traceId: state.traceId,
            workspaceId: state.auth?.workspaceId,
            ...metricFields([
              [
                smtpMetricNames.mailFromAcceptedTotal,
                snapshot.mailFromAcceptedCount
              ],
              [smtpMetricNames.activeSessions, snapshot.activeSessions]
            ])
          });
          callback(null);
        })
        .catch((error: Error) => {
          const message = getErrorMessage(error);
          const code = getSmtpErrorCode(error);
          stats.recordRejection(message, code);
          const snapshot = stats.snapshot();
          logger.warn(smtpLogEvents.mailFromRejected, {
            envelopeFrom: address.address,
            message,
            remoteAddress: session.remoteAddress,
            secure: session.secure,
            smtpCode: code,
            ...getSessionLogFields(session),
            ...metricFields([
              [smtpMetricNames.rejectionTotal, snapshot.rejectionCount],
              [smtpMetricNames.activeSessions, snapshot.activeSessions]
            ])
          });
          callback(error);
        });
    },
    onRcptTo(address, session, callback) {
      void handleRecipient(config, dependencies, address, session)
        .then((state) => {
          stats.recordRecipientAccepted();
          const snapshot = stats.snapshot();
          logger.info(smtpLogEvents.recipientAccepted, {
            credentialId: state.auth?.credentialId,
            envelopeFrom: state.envelopeFrom,
            principal: state.auth?.principal,
            recipient: address.address,
            recipientCount: state.recipients.length,
            smtpSessionId: state.smtpSessionId,
            stream: state.stream,
            traceId: state.traceId,
            workspaceId: state.auth?.workspaceId,
            ...metricFields([
              [
                smtpMetricNames.recipientAcceptedTotal,
                snapshot.recipientAcceptedCount
              ],
              [smtpMetricNames.activeSessions, snapshot.activeSessions]
            ])
          });
          callback(null);
        })
        .catch((error: Error) => {
          const message = getErrorMessage(error);
          const code = getSmtpErrorCode(error);
          stats.recordRejection(message, code);
          const snapshot = stats.snapshot();
          logger.warn(smtpLogEvents.recipientRejected, {
            message,
            recipient: address.address,
            remoteAddress: session.remoteAddress,
            smtpCode: code,
            ...getSessionLogFields(session),
            ...metricFields([
              [smtpMetricNames.rejectionTotal, snapshot.rejectionCount],
              [smtpMetricNames.activeSessions, snapshot.activeSessions]
            ])
          });
          callback(error);
        });
    },
    secure: false,
    size: config.policy.maxMessageSizeBytes
  });
}

async function handleAuth(
  config: MailSmtpConfig,
  dependencies: MailSmtpDependencies,
  auth: SMTPServerAuthentication,
  session: SMTPServerSession
) {
  if (config.auth.requireTlsBeforeAuth && !session.secure) {
    throw createSmtpError("STARTTLS required before AUTH", 538);
  }

  const result = await dependencies.authenticate({
    clientHostname: session.clientHostname,
    method: auth.method,
    password: auth.password,
    remoteAddress: session.remoteAddress,
    secure: session.secure,
    username: auth.username
  });

  const existingState = sessionState.get(session);
  sessionState.set(session, {
    auth: result,
    recipients: existingState?.recipients ?? [],
    smtpSessionId: existingState?.smtpSessionId ?? `smtp_${randomUUID()}`,
    submittedAt: existingState?.submittedAt,
    traceId: existingState?.traceId
  });

  await dependencies.recordAudit({
    action: "smtp.auth.success",
    actorIdentifier: result.principal,
    actorType: "smtp-credential",
    metadata: {
      authMethod: auth.method,
      remoteAddress: session.remoteAddress,
      secure: session.secure,
      smtpSessionId: existingState?.smtpSessionId
    },
    targetId: result.credentialId,
    targetType: "smtp_credential",
    workspaceId: result.workspaceId
  });

  return result;
}

async function handleMailFrom(
  config: MailSmtpConfig,
  dependencies: MailSmtpDependencies,
  address: SMTPServerAddress,
  session: SMTPServerSession
) {
  const state = getState(session);

  if (!state.auth) {
    throw createSmtpError("Authentication required", 530);
  }

  const decision = await dependencies.authorizeMailFrom({
    address: address.address,
    auth: state.auth,
    clientHostname: session.clientHostname,
    secure: session.secure
  });
  if (!decision.ok) {
    throw createSmtpError(decision.reason, decision.smtpCode);
  }

  const nextState = {
    ...state,
    envelopeFrom: address.address,
    recipients: [],
    senderIdentityId: decision.senderIdentityId ?? state.auth.senderIdentityId,
    stream: decision.stream ?? state.auth.defaultStream,
    submittedAt: new Date().toISOString(),
    traceId: `trace_${randomUUID()}`
  };
  sessionState.set(session, nextState);

  await dependencies.recordAudit({
    action: "smtp.mail_from.accepted",
    actorIdentifier: state.auth.principal,
    actorType: "smtp-credential",
    metadata: {
      envelopeFrom: address.address,
      secure: session.secure,
      smtpSessionId: state.smtpSessionId,
      stream: decision.stream ?? state.auth.defaultStream,
      traceId: nextState.traceId
    },
    targetType: "smtp_session",
    workspaceId: state.auth.workspaceId
  });

  return nextState;
}

async function handleRecipient(
  config: MailSmtpConfig,
  dependencies: MailSmtpDependencies,
  address: SMTPServerAddress,
  session: SMTPServerSession
) {
  const state = getState(session);

  if (!state.auth) {
    throw createSmtpError("Authentication required", 530);
  }

  if (!state.envelopeFrom) {
    throw createSmtpError("MAIL FROM must be accepted before RCPT TO", 503);
  }

  const recipientCount = state.recipients.length + 1;
  if (recipientCount > config.policy.maxRecipients) {
    throw createSmtpError("Too many recipients for one message", 452);
  }

  const stream = state.stream ?? state.auth.defaultStream;
  const decision = await dependencies.authorizeRecipient({
    auth: state.auth,
    envelopeFrom: state.envelopeFrom,
    recipient: address.address,
    recipientCount,
    stream
  });

  assertDecision(decision);

  const nextState = {
    ...state,
    recipients: [...state.recipients, address.address],
    stream
  };
  sessionState.set(session, nextState);

  return nextState;
}

async function handleData(
  config: MailSmtpConfig,
  dependencies: MailSmtpDependencies,
  stream: Readable,
  session: SMTPServerSession
) {
  const state = getState(session);

  if (!state.auth) {
    throw createSmtpError("Authentication required", 530);
  }

  if (!state.envelopeFrom || state.recipients.length === 0) {
    throw createSmtpError("MAIL FROM and RCPT TO are required before DATA", 503);
  }

  const rawMime = await readMessage(stream, config.policy.maxMessageSizeBytes);
  const normalized = await dependencies.normalizeMessage({
    auth: state.auth,
    envelopeFrom: state.envelopeFrom,
    rawMime,
    recipients: state.recipients,
    smtpSessionId: state.smtpSessionId,
    stream: state.stream ?? state.auth.defaultStream,
    submittedAt: state.submittedAt,
    traceId: state.traceId
  });
  const queued = await dependencies.publishToQueue(normalized);

  await dependencies.recordAudit({
    action: "smtp.message.queued",
    actorIdentifier: state.auth.principal,
    actorType: "smtp-credential",
    metadata: {
      envelopeFrom: state.envelopeFrom,
      messageEventId: queued.messageEventId,
      messageId: queued.messageId,
      queuedAt: queued.queuedAt,
      recipientCount: state.recipients.length,
      smtpSessionId: normalized.smtpSessionId,
      stream: normalized.stream,
      traceId: normalized.traceId
    },
    targetId: queued.messageId,
    targetType: "message",
    workspaceId: state.auth.workspaceId
  });

  sessionState.set(session, {
    auth: state.auth,
    recipients: [],
    senderIdentityId: state.senderIdentityId,
    smtpSessionId: state.smtpSessionId
  });

  return {
    credentialId: state.auth.credentialId,
    envelopeFrom: state.envelopeFrom,
    messageEventId: queued.messageEventId,
    messageId: queued.messageId,
    principal: state.auth.principal,
    providerRoute: queued.providerRoute,
    queuedAt: queued.queuedAt,
    recipientCount: state.recipients.length,
    smtpSessionId: queued.smtpSessionId ?? normalized.smtpSessionId,
    stream: normalized.stream,
    traceId: queued.traceId ?? normalized.traceId,
    workspaceId: state.auth.workspaceId
  };
}

function getState(session: SMTPServerSession): RuntimeSessionState {
  const state = sessionState.get(session);
  if (!state) {
    throw createSmtpError("Session state not initialized", 451);
  }

  return state;
}

function assertDecision(decision: SmtpDecision | MailFromDecision) {
  if (!decision.ok) {
    throw createSmtpError(decision.reason, decision.smtpCode);
  }
}

function maybeReadFile(path?: string) {
  if (!path) {
    return undefined;
  }

  return readFileSync(path);
}

function maybeReadCertificateChain(path?: string) {
  if (!path) {
    return undefined;
  }

  return [readFileSync(path)];
}

async function readMessage(stream: Readable, maxBytes: number) {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;

    if (totalBytes > maxBytes) {
      throw createSmtpError("Message size exceeds configured limit", 552);
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function getSessionLogFields(session: SMTPServerSession) {
  const state = sessionState.get(session);
  if (!state?.auth) {
    return {};
  }

  return {
    credentialId: state.auth.credentialId,
    envelopeFrom: state.envelopeFrom,
    principal: state.auth.principal,
    recipientCount: state.recipients.length,
    senderIdentityId: state.senderIdentityId,
    smtpSessionId: state.smtpSessionId,
    stream: state.stream ?? state.auth.defaultStream,
    traceId: state.traceId,
    workspaceId: state.auth.workspaceId
  };
}

function metricFields(entries: Array<[string, number | boolean]>) {
  return {
    metrics: Object.fromEntries(entries) as Record<string, number | boolean>
  };
}
