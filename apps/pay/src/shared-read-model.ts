import { readFileSync } from "node:fs";
import { isAbsolute, resolve as resolvePath } from "node:path";
import type {
  DemoOpsSnapshot,
  DemoOpsWorkItem,
  DemoPaymentSession,
  DemoReceipt,
  OpsArea
} from "./demo-data.js";
import type {
  PayHomeRouteRefs,
  PayReadAccessContext,
  PayReadModelSource,
  PayReadModelSourceMode,
  PayViewerRole
} from "./read-model.js";

export interface SharedPaySessionRecord {
  amountValue: number;
  confirmationEta: string;
  createdAt: string;
  currency: string;
  expiresAt: string;
  lateSignalWindowEndsAt: string;
  lastSignal: string;
  lastSignalAt: string;
  orderReference: string;
  originSite: string;
  payerLabel: string;
  paymentReference: string;
  providerFlow: string;
  providerLabel: string;
  receiptId: string;
  sessionId: string;
  state: DemoPaymentSession["state"];
  supportChannel: string;
  supportEvidence: string[];
}

export interface SharedPayReceiptRecord {
  amountValue: number;
  confirmedAt: string;
  currency: string;
  originSite: string;
  orderReference: string;
  payerLabel: string;
  paymentMethod: string;
  paymentReference: string;
  receiptId: string;
  returnSiteLabel: string;
  sessionId: string;
  state: DemoReceipt["state"];
}

export interface SharedPayOpsSnapshotRecord {
  metrics: DemoOpsSnapshot["metrics"];
  workItems: DemoOpsWorkItem[];
}

export interface SharedPayCoreSessionRecord {
  amount_due_value: number;
  callback_status: string;
  confirmed_receipt_id: string;
  created_at: string;
  currency_code: string;
  expires_at: string;
  last_signal: string;
  last_signal_at: string;
  late_signal_window_ends_at: string;
  order_reference: string;
  origin_site: string;
  payer_label: string;
  payment_reference: string;
  provider_flow: string;
  provider_label: string;
  reconciliation_status: string;
  session_id: string;
  session_state: DemoPaymentSession["state"];
  support_channel: string;
  support_evidence: string[];
}

export interface SharedPayCoreReceiptRecord {
  amount_value: number;
  confirmed_at: string;
  currency_code: string;
  origin_site: string;
  order_reference: string;
  payer_label: string;
  payment_method: string;
  payment_reference: string;
  receipt_id: string;
  receipt_state: DemoReceipt["state"];
  return_site_label: string;
  session_id: string;
}

export interface SharedPayCoreOpsWorkItemRecord {
  full_view_roles?: PayViewerRole[];
  id: string;
  next_action: string;
  owner: string;
  safe_detail_items?: string[];
  severity: DemoOpsWorkItem["severity"];
  sensitive_detail_items?: string[];
  summary: string;
}

export interface SharedPayCoreOpsSnapshotRecord {
  metrics: Array<{ label: string; value: string }>;
  work_items: SharedPayCoreOpsWorkItemRecord[];
}

export interface SharedPayCoreDataFile {
  emitted_at?: string;
  home_route_refs?: PayHomeRouteRefs;
  ops?: Partial<Record<OpsArea, SharedPayCoreOpsSnapshotRecord>>;
  payment_sessions?: Record<string, SharedPayCoreSessionRecord>;
  receipts?: Record<string, SharedPayCoreReceiptRecord>;
  schema_version: "iai.pay.shared-read-model.v1";
}

export interface SharedPayReadModelBindings {
  findOpsWorkItem?(
    area: OpsArea,
    itemId: string,
    accessContext?: PayReadAccessContext
  ): DemoOpsWorkItem | null;
  getHomeRouteRefs?(): PayHomeRouteRefs | null;
  getOpsSnapshot?(area: OpsArea): SharedPayOpsSnapshotRecord | null;
  getPaymentSession?(sessionId: string): SharedPaySessionRecord | null;
  getReceipt?(receiptId: string): SharedPayReceiptRecord | null;
}

export interface SharedPayReadModelStatus {
  capabilities: {
    homeRouteRefs: boolean;
    opsDetail: boolean;
    opsSnapshot: boolean;
    paymentSession: boolean;
    receipt: boolean;
  };
  configured: boolean;
  counts: {
    opsAreas: number | null;
    opsWorkItems: number | null;
    paymentSessions: number | null;
    receipts: number | null;
  };
  filePath: string | null;
  rolloutReadyForSharedOnly: boolean;
  source: "env_file" | "inline_bindings" | "lane_sources" | "none" | "upstream_runtime";
}

export interface SharedPayReadModelRuntime {
  bindings: SharedPayReadModelBindings;
  mode: PayReadModelSourceMode;
  status: SharedPayReadModelStatus;
}

export function createSharedPayReadModelBindingsFromFile(filePath: string): SharedPayReadModelRuntime {
  const resolvedPath = isAbsolute(filePath) ? filePath : resolvePath(process.cwd(), filePath);
  const source = readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(source) as SharedPayCoreDataFile;

  return createSharedPayReadModelRuntimeFromCoreData(parsed, {
    filePath: resolvedPath,
    source: "env_file"
  });
}

export function createSharedPayReadModelRuntimeFromCoreData(
  parsed: SharedPayCoreDataFile,
  options: {
    filePath: string | null;
    source: "env_file" | "lane_sources" | "upstream_runtime";
  }
): SharedPayReadModelRuntime {
  if (parsed.schema_version !== "iai.pay.shared-read-model.v1") {
    throw new Error(`Unsupported shared pay read-model schema: ${parsed.schema_version}`);
  }

  const paymentSessions = parsed.payment_sessions ?? {};
  const receipts = parsed.receipts ?? {};
  const opsSnapshots = parsed.ops ?? {};

  return {
    bindings: {
      findOpsWorkItem(area, itemId, accessContext) {
        const workItem = opsSnapshots[area]?.work_items.find((candidate) => candidate.id === itemId);
        if (!workItem) {
          return null;
        }

        return mapCoreOpsWorkItemRecordToShell(area, workItem, accessContext);
      },
      getHomeRouteRefs() {
        return parsed.home_route_refs ?? null;
      },
      getOpsSnapshot(area) {
        const snapshot = opsSnapshots[area];
        return snapshot ? mapCoreOpsSnapshotRecordToShell(area, snapshot) : null;
      },
      getPaymentSession(sessionId) {
        const record = paymentSessions[sessionId];
        return record ? mapCoreSessionRecordToShell(record) : null;
      },
      getReceipt(receiptId) {
        const record = receipts[receiptId];
        return record ? mapCoreReceiptRecordToShell(record) : null;
      }
    },
    mode: "shared_contract",
    status: {
      capabilities: {
        homeRouteRefs: Boolean(parsed.home_route_refs),
        opsDetail: Object.keys(opsSnapshots).length > 0,
        opsSnapshot: Object.keys(opsSnapshots).length > 0,
        paymentSession: Object.keys(paymentSessions).length > 0,
        receipt: Object.keys(receipts).length > 0
      },
      configured: true,
      counts: {
        opsAreas: Object.keys(opsSnapshots).length,
        opsWorkItems: Object.values(opsSnapshots).reduce((count, snapshot) => {
          return count + (snapshot?.work_items.length ?? 0);
        }, 0),
        paymentSessions: Object.keys(paymentSessions).length,
        receipts: Object.keys(receipts).length
      },
      filePath: options.filePath,
      rolloutReadyForSharedOnly:
        Boolean(parsed.home_route_refs) &&
        Object.keys(paymentSessions).length > 0 &&
        Object.keys(receipts).length > 0 &&
        Object.keys(opsSnapshots).length > 0,
      source: options.source
    }
  };
}

export function createSharedPayReadModelRuntime(
  bindings: SharedPayReadModelBindings = {},
  source: "inline_bindings" | "none" | "upstream_runtime" =
    Object.keys(bindings).length > 0 ? "inline_bindings" : "none"
): SharedPayReadModelRuntime {
  const capabilities = {
    homeRouteRefs: typeof bindings.getHomeRouteRefs === "function",
    opsDetail: typeof bindings.findOpsWorkItem === "function",
    opsSnapshot: typeof bindings.getOpsSnapshot === "function",
    paymentSession: typeof bindings.getPaymentSession === "function",
    receipt: typeof bindings.getReceipt === "function"
  };
  const configured = Object.values(capabilities).some(Boolean);

  return {
    bindings,
    mode: configured ? "shared_contract" : "shared_stub",
    status: {
      capabilities,
      configured,
      counts: {
        opsAreas: null,
        opsWorkItems: null,
        paymentSessions: null,
        receipts: null
      },
      filePath: null,
      rolloutReadyForSharedOnly: Object.values(capabilities).every(Boolean),
      source
    }
  };
}

export function createSharedPayReadModelSource(
  bindings: SharedPayReadModelBindings = {},
  mode: PayReadModelSourceMode = Object.keys(bindings).length > 0 ? "shared_contract" : "shared_stub"
): PayReadModelSource {
  return {
    findOpsWorkItem(area, itemId, accessContext) {
      return bindings.findOpsWorkItem?.(area, itemId, accessContext) ?? null;
    },
    getHomeRouteRefs() {
      return bindings.getHomeRouteRefs?.() ?? null;
    },
    getOpsSnapshot(area) {
      const snapshot = bindings.getOpsSnapshot?.(area);
      if (!snapshot) {
        return null;
      }

      return {
        metrics: snapshot.metrics.map((metric) => ({
          label: metric.label,
          value: metric.value
        })),
        workItems: snapshot.workItems.map((workItem) => normalizeWorkItem(workItem))
      };
    },
    getPaymentSession(sessionId) {
      const session = bindings.getPaymentSession?.(sessionId);
      return session ? normalizeSessionRecord(session) : null;
    },
    getReceipt(receiptId) {
      const receipt = bindings.getReceipt?.(receiptId);
      return receipt ? normalizeReceiptRecord(receipt) : null;
    },
    mode
  };
}

function mapCoreSessionRecordToShell(record: SharedPayCoreSessionRecord): SharedPaySessionRecord {
  return {
    amountValue: record.amount_due_value,
    confirmationEta: `${record.callback_status} + ${record.reconciliation_status}`,
    createdAt: record.created_at,
    currency: record.currency_code,
    expiresAt: record.expires_at,
    lateSignalWindowEndsAt: record.late_signal_window_ends_at,
    lastSignal: record.last_signal,
    lastSignalAt: record.last_signal_at,
    orderReference: record.order_reference,
    originSite: record.origin_site,
    payerLabel: record.payer_label,
    paymentReference: record.payment_reference,
    providerFlow: record.provider_flow,
    providerLabel: record.provider_label,
    receiptId: record.confirmed_receipt_id,
    sessionId: record.session_id,
    state: record.session_state,
    supportChannel: record.support_channel,
    supportEvidence: [...record.support_evidence]
  };
}

function mapCoreReceiptRecordToShell(record: SharedPayCoreReceiptRecord): SharedPayReceiptRecord {
  return {
    amountValue: record.amount_value,
    confirmedAt: record.confirmed_at,
    currency: record.currency_code,
    originSite: record.origin_site,
    orderReference: record.order_reference,
    payerLabel: record.payer_label,
    paymentMethod: record.payment_method,
    paymentReference: record.payment_reference,
    receiptId: record.receipt_id,
    returnSiteLabel: record.return_site_label,
    sessionId: record.session_id,
    state: record.receipt_state
  };
}

function mapCoreOpsSnapshotRecordToShell(
  area: OpsArea,
  record: SharedPayCoreOpsSnapshotRecord
): SharedPayOpsSnapshotRecord {
  return {
    metrics: record.metrics.map((metric) => ({
      label: metric.label,
      value: metric.value
    })),
    workItems: record.work_items
      .map((workItem) => mapCoreOpsWorkItemRecordToShell(area, workItem))
      .filter((item): item is DemoOpsWorkItem => item !== null)
  };
}

function mapCoreOpsWorkItemRecordToShell(
  area: OpsArea,
  record: SharedPayCoreOpsWorkItemRecord,
  accessContext?: PayReadAccessContext
): DemoOpsWorkItem | null {
  const viewerRoles = resolveViewerRoles(accessContext);
  const defaultPolicy = getDefaultViewerPolicy(area);
  const fullViewRoles = record.full_view_roles ?? defaultPolicy.fullViewRoles;
  const safeViewRoles = defaultPolicy.safeViewRoles;

  if (viewerRoles.some((viewerRole) => fullViewRoles.includes(viewerRole))) {
    return {
      detailItems: [...(record.safe_detail_items ?? []), ...(record.sensitive_detail_items ?? [])],
      id: record.id,
      nextAction: record.next_action,
      owner: record.owner,
      severity: record.severity,
      summary: record.summary
    };
  }

  if (viewerRoles.some((viewerRole) => safeViewRoles.includes(viewerRole))) {
    return {
      detailItems: [
        ...(record.safe_detail_items ?? []),
        "sensitivity_notice: restricted detail hidden for current role"
      ],
      id: record.id,
      nextAction: record.next_action,
      owner: record.owner,
      severity: record.severity,
      summary: record.summary
    };
  }

  return null;
}

function resolveViewerRoles(accessContext?: PayReadAccessContext): PayViewerRole[] {
  const viewerRoles = accessContext?.viewerRoles ?? [];

  if (viewerRoles.length > 0) {
    return viewerRoles;
  }

  return [accessContext?.viewerRole ?? "public"];
}

function getDefaultViewerPolicy(area: OpsArea): {
  fullViewRoles: PayViewerRole[];
  safeViewRoles: PayViewerRole[];
} {
  switch (area) {
    case "payments":
      return {
        fullViewRoles: [
          "super_admin",
          "finance_admin",
          "payments_ops",
          "security_admin",
          "read_only_auditor"
        ],
        safeViewRoles: ["support_admin", "site_admin", "treasury_admin"]
      };
    case "reconciliation":
      return {
        fullViewRoles: [
          "super_admin",
          "finance_admin",
          "security_admin",
          "read_only_auditor"
        ],
        safeViewRoles: ["payments_ops", "support_admin", "site_admin", "treasury_admin"]
      };
    case "review":
      return {
        fullViewRoles: [
          "super_admin",
          "finance_admin",
          "payments_ops",
          "security_admin",
          "read_only_auditor"
        ],
        safeViewRoles: ["support_admin", "site_admin", "treasury_admin"]
      };
    case "audit":
      return {
        fullViewRoles: ["super_admin", "security_admin", "read_only_auditor", "finance_admin"],
        safeViewRoles: ["payments_ops"]
      };
    case "payouts":
      return {
        fullViewRoles: ["super_admin", "treasury_admin", "finance_admin", "read_only_auditor"],
        safeViewRoles: ["payments_ops"]
      };
  }
}

function normalizeSessionRecord(record: SharedPaySessionRecord): DemoPaymentSession {
  return {
    amountValue: record.amountValue,
    confirmationEta: record.confirmationEta,
    createdAt: record.createdAt,
    currency: record.currency,
    expiresAt: record.expiresAt,
    lateSignalWindowEndsAt: record.lateSignalWindowEndsAt,
    lastSignal: record.lastSignal,
    lastSignalAt: record.lastSignalAt,
    orderReference: record.orderReference,
    originSite: record.originSite,
    payerLabel: record.payerLabel,
    paymentReference: record.paymentReference,
    providerFlow: record.providerFlow,
    providerLabel: record.providerLabel,
    receiptId: record.receiptId,
    sessionId: record.sessionId,
    state: record.state,
    supportChannel: record.supportChannel,
    supportEvidence: [...record.supportEvidence]
  };
}

function normalizeReceiptRecord(record: SharedPayReceiptRecord): DemoReceipt {
  return {
    amountValue: record.amountValue,
    confirmedAt: record.confirmedAt,
    currency: record.currency,
    originSite: record.originSite,
    orderReference: record.orderReference,
    payerLabel: record.payerLabel,
    paymentMethod: record.paymentMethod,
    paymentReference: record.paymentReference,
    receiptId: record.receiptId,
    returnSiteLabel: record.returnSiteLabel,
    sessionId: record.sessionId,
    state: record.state
  };
}

function normalizeWorkItem(workItem: DemoOpsWorkItem): DemoOpsWorkItem {
  return {
    detailItems: [...workItem.detailItems],
    id: workItem.id,
    nextAction: workItem.nextAction,
    owner: workItem.owner,
    severity: workItem.severity,
    summary: workItem.summary
  };
}
