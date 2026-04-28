export const payLogEvents = {
  outboundWebhookDispatchFailed: "pay.outbound_webhook.dispatch_failed",
  outboundWebhookEvidencePersistError: "pay.outbound_webhook.evidence_persist_error",
  sharedOnlyGateBlocked: "pay.shared_only.gate_blocked",
  sharedUpstreamRefreshFailed: "pay.shared_upstream.refresh_failed",
  sharedUpstreamRefreshStarted: "pay.shared_upstream.refresh_started",
  sharedUpstreamRefreshSucceeded: "pay.shared_upstream.refresh_succeeded"
} as const;

type PayLogEvent = (typeof payLogEvents)[keyof typeof payLogEvents];
type PayLogLevel = "error" | "info" | "warn";

interface PayLoggerContext {
  component: string;
  service: string;
}

export interface PayLogger {
  error(event: PayLogEvent, fields?: Record<string, unknown>): void;
  info(event: PayLogEvent, fields?: Record<string, unknown>): void;
  warn(event: PayLogEvent, fields?: Record<string, unknown>): void;
}

export function createPayLogger(context: PayLoggerContext): PayLogger {
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
  level: PayLogLevel,
  context: PayLoggerContext,
  event: PayLogEvent,
  fields: Record<string, unknown> = {}
): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    component: context.component,
    service: context.service,
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
