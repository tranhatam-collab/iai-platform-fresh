// Public API entry point for @iai/mail-api.
//
// Re-exports the server factory + Path B inbound-webhook handler / sinks /
// types so consumers can compose their own runtime (no bootstrap here).
// The previous CLI bootstrap (server.listen on PORT/API_FLOW_BIND_ADDRESS)
// has been removed in favor of the library-style entry point — the
// production runtime is responsible for calling `createFlowApiServer()` and
// driving `.listen()` itself.

export {
  createFlowApiRequestHandler,
  createFlowApiServer,
  type FlowApiServerOptions
} from "./server.js";

export {
  DEFAULT_INBOUND_WEBHOOK_MAX_BODY_BYTES,
  DEFAULT_INBOUND_WEBHOOK_REPLAY_WINDOW_SECONDS,
  INBOUND_WEBHOOK_SIGNATURE_HEADER,
  INBOUND_WEBHOOK_TIMESTAMP_HEADER,
  createFileInboundWebhookEvidenceSink,
  createInMemoryInboundWebhookEvidenceSink,
  createInboundWebhookHandler,
  resolveInboundWebhookOptionsFromEnv,
  verifyInboundWebhook,
  type InboundWebhookEvidenceRecord,
  type InboundWebhookEvidenceSink,
  type InboundWebhookHandlerOptions,
  type InboundWebhookHandlerResult,
  type InboundWebhookRejectionCode,
  type InboundWebhookVerifyInput,
  type InboundWebhookVerifyResult,
  type ResolvedInboundWebhookOptions
} from "./inbound-webhook.js";

export {
  bootstrapFromEnv,
  buildServerOptionsFromEnv,
  type BootstrapResolution,
  type BootstrapResult
} from "./bootstrap.js";
