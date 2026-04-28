import type {
  MailProviderType,
  MailWorkerFeature,
  ProviderAdapter,
  ProviderErrorClassification,
  ProviderRoute,
  ProviderSendResult
} from "./contracts.js";

export interface StubProviderBehavior {
  accepted?: boolean;
  errorClass?: string;
  healthOk?: boolean;
  providerMessageIdPrefix?: string;
  responseCode?: string;
  responseMessage?: string;
  retryable?: boolean;
  supportedFeatures?: Partial<Record<MailWorkerFeature, boolean>>;
}

export function createStubProviderAdapter(
  provider: MailProviderType,
  behavior: StubProviderBehavior = {}
): ProviderAdapter {
  const supportedFeatures = {
    attachments: behavior.supportedFeatures?.attachments ?? true,
    tracking: behavior.supportedFeatures?.tracking ?? true
  };

  return {
    provider,
    classifyError(result: ProviderSendResult): ProviderErrorClassification {
      if (result.accepted) {
        return {
          retryable: false
        };
      }

      return {
        errorClass:
          behavior.errorClass ??
          (result.retryable ? "provider_transient_failure" : "provider_permanent_failure"),
        retryable: result.retryable
      };
    },
    async healthcheck() {
      return {
        ok: behavior.healthOk ?? true
      };
    },
    async send(message, context) {
      const accepted = behavior.accepted ?? true;
      const retryable = behavior.retryable ?? false;

      return {
        accepted,
        providerMessageId:
          accepted || behavior.providerMessageIdPrefix
            ? `${behavior.providerMessageIdPrefix ?? provider}_${message.messageId}`
            : undefined,
        providerResponseCode:
          behavior.responseCode ?? (accepted ? "202" : retryable ? "451" : "550"),
        providerResponseMessage:
          behavior.responseMessage ?? (accepted ? "accepted" : retryable ? "deferred" : "failed"),
        rawResponse: {
          attemptId: context.attemptId,
          routeId: context.route.routeId,
          stub: true
        },
        retryable
      };
    },
    supports(feature: MailWorkerFeature) {
      return supportedFeatures[feature];
    },
    validateConfig(route: ProviderRoute) {
      if (!route.routeId) {
        throw new Error("Provider route must include a routeId.");
      }
    }
  };
}
