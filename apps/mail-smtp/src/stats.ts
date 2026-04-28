export interface RuntimeStatsSnapshot {
  activeSessions: number;
  authFailureCount: number;
  authSuccessCount: number;
  lastError?: {
    at: string;
    code?: number;
    message: string;
  };
  lastQueuedMessageId?: string;
  mailFromAcceptedCount: number;
  messageQueuedCount: number;
  recipientAcceptedCount: number;
  rejectionCount: number;
  startedAt: string;
  uptimeMs: number;
}

export interface RuntimeStats {
  recordAuthFailure(message: string, code?: number): void;
  recordAuthSuccess(): void;
  recordMailFromAccepted(): void;
  recordMessageQueued(messageId: string): void;
  recordRecipientAccepted(): void;
  recordRejection(message: string, code?: number): void;
  sessionClosed(): void;
  sessionOpened(): void;
  snapshot(): RuntimeStatsSnapshot;
}

export function createRuntimeStats(): RuntimeStats {
  const startedAt = new Date();
  const counters = {
    activeSessions: 0,
    authFailureCount: 0,
    authSuccessCount: 0,
    lastError: undefined as RuntimeStatsSnapshot["lastError"],
    lastQueuedMessageId: undefined as string | undefined,
    mailFromAcceptedCount: 0,
    messageQueuedCount: 0,
    recipientAcceptedCount: 0,
    rejectionCount: 0
  };

  return {
    recordAuthFailure(message, code) {
      counters.authFailureCount += 1;
      counters.rejectionCount += 1;
      counters.lastError = {
        at: new Date().toISOString(),
        code,
        message
      };
    },
    recordAuthSuccess() {
      counters.authSuccessCount += 1;
    },
    recordMailFromAccepted() {
      counters.mailFromAcceptedCount += 1;
    },
    recordMessageQueued(messageId) {
      counters.messageQueuedCount += 1;
      counters.lastQueuedMessageId = messageId;
    },
    recordRecipientAccepted() {
      counters.recipientAcceptedCount += 1;
    },
    recordRejection(message, code) {
      counters.rejectionCount += 1;
      counters.lastError = {
        at: new Date().toISOString(),
        code,
        message
      };
    },
    sessionClosed() {
      counters.activeSessions = Math.max(0, counters.activeSessions - 1);
    },
    sessionOpened() {
      counters.activeSessions += 1;
    },
    snapshot() {
      return {
        activeSessions: counters.activeSessions,
        authFailureCount: counters.authFailureCount,
        authSuccessCount: counters.authSuccessCount,
        lastError: counters.lastError,
        lastQueuedMessageId: counters.lastQueuedMessageId,
        mailFromAcceptedCount: counters.mailFromAcceptedCount,
        messageQueuedCount: counters.messageQueuedCount,
        recipientAcceptedCount: counters.recipientAcceptedCount,
        rejectionCount: counters.rejectionCount,
        startedAt: startedAt.toISOString(),
        uptimeMs: Date.now() - startedAt.getTime()
      };
    }
  };
}
