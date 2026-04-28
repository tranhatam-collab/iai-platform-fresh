export const smtpLogEvents = {
  authRejected: "smtp.auth.rejected",
  authSucceeded: "smtp.auth.succeeded",
  healthServerStarted: "smtp.health.started",
  healthServerStopped: "smtp.health.stopped",
  mailFromAccepted: "smtp.mail_from.accepted",
  mailFromRejected: "smtp.mail_from.rejected",
  messageQueued: "smtp.message.queued",
  messageRejected: "smtp.message.rejected",
  recipientAccepted: "smtp.recipient.accepted",
  recipientRejected: "smtp.recipient.rejected",
  runtimeShutdownFailed: "smtp.runtime.shutdown_failed",
  runtimeShutdownSucceeded: "smtp.runtime.shutdown_succeeded",
  runtimeStarted: "smtp.runtime.started",
  runtimeStartupFailed: "smtp.runtime.startup_failed",
  runtimeUnhandledError: "smtp.runtime.unhandled_error"
} as const;

export const smtpMetricNames = {
  activeSessions: "smtp.session.active",
  authFailureTotal: "smtp.auth.failure_total",
  authSuccessTotal: "smtp.auth.success_total",
  healthDependenciesOk: "smtp.health.dependencies_ok",
  mailFromAcceptedTotal: "smtp.mail_from.accepted_total",
  messageQueuedTotal: "smtp.message.queued_total",
  recipientAcceptedTotal: "smtp.recipient.accepted_total",
  rejectionTotal: "smtp.reject.total"
} as const;

type SmtpLogEvent = (typeof smtpLogEvents)[keyof typeof smtpLogEvents];

interface LoggerContext {
  component: string;
  hostname: string;
  mode: string;
  port: number;
}

type LogLevel = "info" | "warn" | "error";

export interface SmtpLogger {
  error(event: SmtpLogEvent, fields?: Record<string, unknown>): void;
  info(event: SmtpLogEvent, fields?: Record<string, unknown>): void;
  warn(event: SmtpLogEvent, fields?: Record<string, unknown>): void;
}

export function createSmtpLogger(context: LoggerContext): SmtpLogger {
  return {
    error(event, fields) {
      emit("error", context, event, fields);
    },
    info(event, fields) {
      emit("info", context, event, fields);
    },
    warn(event, fields) {
      emit("warn", context, event, fields);
    }
  };
}

function emit(
  level: LogLevel,
  context: LoggerContext,
  event: SmtpLogEvent,
  fields: Record<string, unknown> = {}
) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    component: context.component,
    mode: context.mode,
    hostname: context.hostname,
    port: context.port,
    ...fields
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}
