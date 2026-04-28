import {
  demoCancelledCheckoutSessionId,
  demoConfirmedCheckoutSessionId,
  demoCheckoutSessionId,
  demoFailedCheckoutSessionId,
  demoMissingCheckoutSessionId,
  demoMissingReceiptId,
  demoReceiptId,
  getDemoOpsSnapshot,
  getDemoOpsWorkItem,
  getDemoPaymentSession,
  getDemoReceipt,
  type DemoOpsWorkItem,
  type DemoOpsSnapshot,
  type DemoPaymentSession,
  type DemoReceipt,
  type OpsArea
} from "./demo-data.js";

export type PayViewerRole =
  | "public"
  | "super_admin"
  | "finance_admin"
  | "treasury_admin"
  | "payments_ops"
  | "support_admin"
  | "site_admin"
  | "security_admin"
  | "read_only_auditor";

export interface PayReadAccessContext {
  authenticated?: boolean;
  subjectId?: string | null;
  viewerRole: PayViewerRole;
  viewerRoles?: PayViewerRole[];
  workspaceId?: string;
}

export interface PayHomeRouteRefs {
  demoCancelledCheckoutSessionId: string;
  demoConfirmedCheckoutSessionId: string;
  demoCheckoutSessionId: string;
  demoFailedCheckoutSessionId: string;
  demoMissingCheckoutSessionId: string;
  demoMissingReceiptId: string;
  demoReceiptId: string;
}

export type PayReadModelSourceMode = "custom" | "demo_contract" | "shared_contract" | "shared_stub";

export interface PayReadModelSource {
  getHomeRouteRefs(): PayHomeRouteRefs | null;
  getOpsSnapshot(area: OpsArea): DemoOpsSnapshot | null;
  findOpsWorkItem(
    area: OpsArea,
    itemId: string,
    accessContext?: PayReadAccessContext
  ): DemoOpsWorkItem | null;
  getPaymentSession(sessionId: string): DemoPaymentSession | null;
  getReceipt(receiptId: string): DemoReceipt | null;
  mode: PayReadModelSourceMode;
}

export interface PayReadModel {
  getHomeRouteRefs(): PayHomeRouteRefs;
  getOpsSnapshot(area: OpsArea): DemoOpsSnapshot;
  findOpsWorkItem(
    area: OpsArea,
    itemId: string,
    accessContext?: PayReadAccessContext
  ): DemoOpsWorkItem | null;
  getPaymentSession(sessionId: string): DemoPaymentSession;
  getReceipt(receiptId: string): DemoReceipt;
  fallbackMode: PayReadModelSourceMode | null;
  mode: "fallback_enabled" | "primary_only";
  primaryMode: PayReadModelSourceMode;
}

export function createDemoPayReadModel(): PayReadModel {
  return createResolvedPayReadModel({
    primary: createDemoPayReadModelSource()
  });
}

export function createDemoPayReadModelSource(): PayReadModelSource {
  return {
    getHomeRouteRefs() {
      return {
        demoCancelledCheckoutSessionId,
        demoConfirmedCheckoutSessionId,
        demoCheckoutSessionId,
        demoFailedCheckoutSessionId,
        demoMissingCheckoutSessionId,
        demoMissingReceiptId,
        demoReceiptId
      };
    },
    getOpsSnapshot(area) {
      return getDemoOpsSnapshot(area);
    },
    findOpsWorkItem(area, itemId) {
      return getDemoOpsWorkItem(area, itemId);
    },
    getPaymentSession(sessionId) {
      return getDemoPaymentSession(sessionId);
    },
    getReceipt(receiptId) {
      return getDemoReceipt(receiptId);
    },
    mode: "demo_contract"
  };
}

export function createSharedPayReadModelSkeleton(): PayReadModelSource {
  return {
    getHomeRouteRefs() {
      return null;
    },
    getOpsSnapshot() {
      return null;
    },
    findOpsWorkItem() {
      return null;
    },
    getPaymentSession() {
      return null;
    },
    getReceipt() {
      return null;
    },
    mode: "shared_stub"
  };
}

export function createResolvedPayReadModel(options: {
  fallback?: PayReadModelSource | null;
  primary: PayReadModelSource;
}): PayReadModel {
  const fallback = options.fallback ?? null;

  return {
    fallbackMode: fallback?.mode ?? null,
    getHomeRouteRefs() {
      const resolved = options.primary.getHomeRouteRefs() ?? fallback?.getHomeRouteRefs();
      if (!resolved) {
        throw new Error("Pay read model could not resolve home route refs.");
      }
      return resolved;
    },
    getOpsSnapshot(area) {
      const resolved = options.primary.getOpsSnapshot(area) ?? fallback?.getOpsSnapshot(area);
      if (!resolved) {
        throw new Error(`Pay read model could not resolve ops snapshot for ${area}.`);
      }
      return resolved;
    },
    findOpsWorkItem(area, itemId, accessContext) {
      return (
        options.primary.findOpsWorkItem(area, itemId, accessContext) ??
        fallback?.findOpsWorkItem(area, itemId, accessContext) ??
        null
      );
    },
    getPaymentSession(sessionId) {
      const resolved =
        options.primary.getPaymentSession(sessionId) ?? fallback?.getPaymentSession(sessionId);
      if (!resolved) {
        throw new Error(`Pay read model could not resolve payment session ${sessionId}.`);
      }
      return resolved;
    },
    getReceipt(receiptId) {
      const resolved = options.primary.getReceipt(receiptId) ?? fallback?.getReceipt(receiptId);
      if (!resolved) {
        throw new Error(`Pay read model could not resolve receipt ${receiptId}.`);
      }
      return resolved;
    },
    mode: fallback ? "fallback_enabled" : "primary_only",
    primaryMode: options.primary.mode
  };
}
