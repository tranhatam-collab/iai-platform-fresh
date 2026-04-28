export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";
export type BillingStatus = "pending" | "paid" | "overdue" | "failed" | "refunded";
export type ProofStatus = "pending" | "verified" | "failed";
export type ProofKind = "approval" | "execution" | "relay" | "audit";
export type AlertScope = "approvals" | "billing" | "proofs" | "runtime" | "security";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "open" | "acked" | "resolved";

export * from "./mail-messages.js";
export * from "./mail-queue.js";
export * from "./domain-dns-health.js";
export * from "./provider-routes.js";
export * from "./suppressions.js";
export * from "./wave2-internal-alerts.js";
export * from "./wave2-auth-templates.js";

export interface FlowApproval {
  approvalId: string;
  workspaceId: string;
  workflowKey: string;
  intentId: string;
  status: ApprovalStatus;
  requestedAt: string;
  requestedBy: string;
  approverGroup: string;
  priority: "normal" | "high" | "critical";
  requiresHuman: boolean;
  slaDueAt: string;
  amountCents?: number;
  currency?: string;
  resourceRef?: string;
  note?: string;
}

export interface FlowBillingRecord {
  invoiceId: string;
  workspaceId: string;
  status: BillingStatus;
  amountCents: number;
  currency: string;
  dueAt: string;
  updatedAt: string;
  customerRef: string;
  sourceApprovalId?: string;
  paidAt?: string;
}

export interface FlowProofRecord {
  proofId: string;
  workspaceId: string;
  intentId: string;
  kind: ProofKind;
  status: ProofStatus;
  capturedAt: string;
  hash: string;
  custodyChainLength: number;
  confidence: number;
  approvalId?: string;
  verifiedAt?: string;
}

export interface FlowAlertRecord {
  alertId: string;
  workspaceId: string;
  scope: AlertScope;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  createdAt: string;
  sourceRef?: string;
  requiresHuman: boolean;
}

export type FlowStatus = "healthy" | "attention" | "blocked";
export type FlowExecutionStatus = "queued" | "running" | "succeeded" | "failed";
export type FlowExecutionStepStatus = "queued" | "running" | "completed" | "failed";
export type FlowBuilderLockStatus = "unlocked" | "locked" | "read_only";
export type FlowBuilderAutosaveStatus = "saved" | "pending" | "attention";
export type FlowVersionStatus = "published" | "archived";
export type FlowDraftStatus = "ready" | "attention" | "blocked" | "locked";
export type FlowPublishReadinessStatus = "ready" | "attention" | "blocked";
export type FlowPublishChecklistStatus = "complete" | "pending" | "blocked";
export type FlowAuditAction = "builder.save" | "builder.validate" | "publish.preview" | "publish.confirm";
export type FlowActionOutcome = "succeeded" | "failed";

export interface FlowBuilderNode {
  category: string;
  label: string;
  nodeType: string;
}

export interface FlowBuilderState {
  autosaveStatus: FlowBuilderAutosaveStatus;
  lastSavedAt: string;
  lastValidatedAt: string;
  lockOwner?: string;
  lockStatus: FlowBuilderLockStatus;
  nodeCatalog: FlowBuilderNode[];
  openIssues: number;
}

export interface FlowVersionRecord {
  author: string;
  changeSummary: string;
  flowId: string;
  releasedAt: string;
  status: FlowVersionStatus;
  versionId: string;
  workspaceId: string;
}

export interface FlowDraftRecord {
  draftId: string;
  editor: string;
  flowId: string;
  openIssues: number;
  previewPacketId?: string;
  status: FlowDraftStatus;
  summary: string;
  updatedAt: string;
  versionId: string;
  workspaceId: string;
}

export interface FlowPublishChecklistItem {
  detail: string;
  key: string;
  label: string;
  status: FlowPublishChecklistStatus;
}

export interface FlowPublishReadiness {
  blockerRefs: string[];
  blockers: string[];
  checklist: FlowPublishChecklistItem[];
  flowId: string;
  lastValidatedAt: string;
  operatorNote: string;
  previewGeneratedAt?: string;
  previewPacketId?: string;
  status: FlowPublishReadinessStatus;
  targetVersion: string;
  workspaceId: string;
}

export interface FlowAuditEvent {
  action: FlowAuditAction;
  actor: string;
  createdAt: string;
  details: string;
  eventId: string;
  flowId: string;
  outcome: FlowActionOutcome;
  workspaceId: string;
}

export interface FlowActionResult {
  action: FlowAuditAction;
  actor: string;
  builder?: FlowBuilderState;
  event: FlowAuditEvent;
  flowId: string;
  message: string;
  outcome: FlowActionOutcome;
  publishReadiness?: FlowPublishReadiness;
  workspaceId: string;
}

export interface FlowRecord {
  activeVersion: string;
  draftVersion: string;
  flowId: string;
  lastExecutionAt: string;
  lastPublishedAt: string;
  name: string;
  openAlerts: number;
  owner: string;
  pendingApprovals: number;
  status: FlowStatus;
  summary: string;
  trigger: string;
  workspaceId: string;
}

export interface FlowDetail extends FlowRecord {
  builder: FlowBuilderState;
  drafts: FlowDraftRecord[];
  latestPublishNote: string;
  publishReadiness: FlowPublishReadiness;
  recentExecutionIds: string[];
  versions: FlowVersionRecord[];
}

export interface FlowExecutionStep {
  endedAt?: string;
  label: string;
  nodeId: string;
  startedAt?: string;
  status: FlowExecutionStepStatus;
  summary: string;
}

export interface FlowExecutionRecord {
  currentStepLabel?: string;
  endedAt?: string;
  executionId: string;
  flowId: string;
  flowName: string;
  initiatedBy: string;
  requiresAttention: boolean;
  startedAt: string;
  status: FlowExecutionStatus;
  summary: string;
  trigger: string;
  workspaceId: string;
}

export interface FlowExecutionDetail extends FlowExecutionRecord {
  alertIds: string[];
  approvalIds: string[];
  proofIds: string[];
  steps: FlowExecutionStep[];
}

export interface FlowSourceOfTruthSnapshot {
  version: "flow_sot_v1";
  generatedAt: string;
  approvals: FlowApproval[];
  auditEvents: FlowAuditEvent[];
  billing: FlowBillingRecord[];
  proofs: FlowProofRecord[];
  alerts: FlowAlertRecord[];
  flows: FlowDetail[];
  runtimeExecutions: FlowExecutionDetail[];
}

export interface FlowApprovalFilter {
  workspaceId?: string;
  statuses?: ApprovalStatus[];
  overdueOnly?: boolean;
  requireHuman?: boolean;
  now?: string;
}

export interface FlowBillingFilter {
  workspaceId?: string;
  statuses?: BillingStatus[];
  overdueOnly?: boolean;
  now?: string;
}

export interface FlowProofFilter {
  workspaceId?: string;
  statuses?: ProofStatus[];
  kinds?: ProofKind[];
  minConfidence?: number;
}

export interface FlowAlertFilter {
  workspaceId?: string;
  statuses?: AlertStatus[];
  severities?: AlertSeverity[];
  scopes?: AlertScope[];
  requireHuman?: boolean;
}

export interface FlowListFilter {
  workspaceId?: string;
  statuses?: FlowStatus[];
  requireAttention?: boolean;
}

export interface FlowRuntimeExecutionFilter {
  workspaceId?: string;
  flowId?: string;
  statuses?: FlowExecutionStatus[];
  requireAttention?: boolean;
}

export interface FlowAuditFilter {
  actions?: FlowAuditAction[];
  flowId?: string;
  limit?: number;
  outcomes?: FlowActionOutcome[];
  workspaceId?: string;
}

export interface FlowSourceSummary {
  approvals: {
    total: number;
    pending: number;
    overdue: number;
    humanRequired: number;
  };
  billing: {
    total: number;
    unpaidCount: number;
    overdueCount: number;
    outstandingCents: number;
  };
  proofs: {
    total: number;
    pending: number;
    failed: number;
    verifiedRatio: number;
  };
  alerts: {
    total: number;
    open: number;
    criticalOpen: number;
    humanRequiredOpen: number;
  };
}

export interface FlowSourceOfTruth {
  buildSummary(workspaceId?: string, now?: string): FlowSourceSummary;
  getFlowDetail(flowId: string, workspaceId?: string): FlowDetail | undefined;
  getFlowPublishReadiness(flowId: string, workspaceId?: string): FlowPublishReadiness | undefined;
  getRuntimeExecutionDetail(executionId: string, workspaceId?: string): FlowExecutionDetail | undefined;
  listAlerts(filter?: FlowAlertFilter): FlowAlertRecord[];
  listApprovals(filter?: FlowApprovalFilter): FlowApproval[];
  listAuditEvents(filter?: FlowAuditFilter): FlowAuditEvent[];
  listBilling(filter?: FlowBillingFilter): FlowBillingRecord[];
  listFlowDrafts(flowId: string, workspaceId?: string): FlowDraftRecord[] | undefined;
  listFlows(filter?: FlowListFilter): FlowRecord[];
  listFlowVersions(flowId: string, workspaceId?: string): FlowVersionRecord[] | undefined;
  listProofs(filter?: FlowProofFilter): FlowProofRecord[];
  listRuntimeExecutions(filter?: FlowRuntimeExecutionFilter): FlowExecutionRecord[];
  previewFlowPublish(flowId: string, workspaceId: string, actor: string): FlowActionResult | undefined;
  publishFlow(flowId: string, workspaceId: string, actor: string): FlowActionResult | undefined;
  saveFlowDraft(flowId: string, workspaceId: string, actor: string): FlowActionResult | undefined;
  snapshot(workspaceId?: string): FlowSourceOfTruthSnapshot;
  validateFlowDraft(flowId: string, workspaceId: string, actor: string): FlowActionResult | undefined;
}

export function createFlowSourceOfTruth(
  seed?: Partial<FlowSourceOfTruthSnapshot>
): FlowSourceOfTruth {
  const baseline = createMergedSnapshot(seed);
  const resolveFlow = (flowId: string, workspaceId?: string) =>
    filterByWorkspace(baseline.flows, workspaceId).find((item) => item.flowId === flowId);
  let auditSequence = baseline.auditEvents.length;

  const createAuditEvent = (
    flow: FlowDetail,
    action: FlowAuditAction,
    actor: string,
    outcome: FlowActionOutcome,
    details: string
  ): FlowAuditEvent => {
    auditSequence += 1;
    const event: FlowAuditEvent = {
      action,
      actor,
      createdAt: new Date().toISOString(),
      details,
      eventId: `audit_${String(auditSequence).padStart(4, "0")}`,
      flowId: flow.flowId,
      outcome,
      workspaceId: flow.workspaceId
    };
    baseline.auditEvents.unshift(event);
    return event;
  };

  const upsertValidationBlocker = (flow: FlowDetail): void => {
    const blockerRef = `val_${flow.flowId}_${flow.draftVersion}`;
    const blockerMessage = `Validation found ${flow.builder.openIssues} open issue(s) on ${flow.draftVersion}.`;
    if (!flow.publishReadiness.blockerRefs.includes(blockerRef)) {
      flow.publishReadiness.blockerRefs.push(blockerRef);
    }
    flow.publishReadiness.blockers = [
      ...flow.publishReadiness.blockers.filter((item) => !item.startsWith("Validation found ")),
      blockerMessage
    ];
  };

  const clearValidationBlockers = (flow: FlowDetail): void => {
    flow.publishReadiness.blockerRefs = flow.publishReadiness.blockerRefs.filter(
      (item) => !item.startsWith(`val_${flow.flowId}_`)
    );
    flow.publishReadiness.blockers = flow.publishReadiness.blockers.filter(
      (item) => !item.startsWith("Validation found ")
    );
  };

  const setChecklistState = (
    readiness: FlowPublishReadiness,
    key: string,
    status: FlowPublishChecklistStatus,
    detail: string
  ): void => {
    const item = readiness.checklist.find((entry) => entry.key === key);
    if (item) {
      item.status = status;
      item.detail = detail;
      return;
    }

    readiness.checklist.push({
      detail,
      key,
      label: key,
      status
    });
  };

  const updateReadinessStatus = (flow: FlowDetail): void => {
    const readiness = flow.publishReadiness;
    if (readiness.checklist.some((item) => item.status === "blocked")) {
      readiness.status = "blocked";
      return;
    }

    if (readiness.blockers.length > 0 || readiness.checklist.some((item) => item.status === "pending")) {
      readiness.status = "attention";
      return;
    }

    readiness.status = "ready";
  };

  const buildActionResult = (
    flow: FlowDetail,
    event: FlowAuditEvent,
    message: string
  ): FlowActionResult => ({
    action: event.action,
    actor: event.actor,
    builder: cloneFlowBuilderState(flow.builder),
    event: cloneFlowAuditEvent(event),
    flowId: flow.flowId,
    message,
    outcome: event.outcome,
    publishReadiness: cloneFlowPublishReadiness(flow.publishReadiness),
    workspaceId: flow.workspaceId
  });

  return {
    buildSummary(workspaceId, now) {
      return buildFlowSourceSummary(filterSnapshotByWorkspace(baseline, workspaceId), now);
    },
    getFlowDetail(flowId, workspaceId) {
      const flow = resolveFlow(flowId, workspaceId);
      return flow ? cloneFlowDetail(flow) : undefined;
    },
    getFlowPublishReadiness(flowId, workspaceId) {
      const flow = resolveFlow(flowId, workspaceId);
      return flow ? cloneFlowPublishReadiness(flow.publishReadiness) : undefined;
    },
    getRuntimeExecutionDetail(executionId, workspaceId) {
      const execution = filterByWorkspace(baseline.runtimeExecutions, workspaceId).find(
        (item) => item.executionId === executionId
      );
      return execution ? cloneRuntimeExecutionDetail(execution) : undefined;
    },
    listAlerts(filter = {}) {
      const alerts = filterByWorkspace(baseline.alerts, filter.workspaceId);
      return alerts.filter((item) => {
        if (filter.requireHuman !== undefined && item.requiresHuman !== filter.requireHuman) {
          return false;
        }

        if (filter.scopes && filter.scopes.length > 0 && !filter.scopes.includes(item.scope)) {
          return false;
        }

        if (
          filter.severities &&
          filter.severities.length > 0 &&
          !filter.severities.includes(item.severity)
        ) {
          return false;
        }

        if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(item.status)) {
          return false;
        }

        return true;
      });
    },
    listApprovals(filter = {}) {
      const now = filter.now ?? new Date().toISOString();
      const approvals = filterByWorkspace(baseline.approvals, filter.workspaceId);

      return approvals.filter((item) => {
        if (filter.requireHuman !== undefined && item.requiresHuman !== filter.requireHuman) {
          return false;
        }

        if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(item.status)) {
          return false;
        }

        if (filter.overdueOnly && !isOverdue(item.slaDueAt, now)) {
          return false;
        }

        return true;
      });
    },
    listAuditEvents(filter = {}) {
      const events = filterByWorkspace(baseline.auditEvents, filter.workspaceId);
      const filtered = events.filter((item) => {
        if (filter.actions && filter.actions.length > 0 && !filter.actions.includes(item.action)) {
          return false;
        }

        if (filter.flowId && item.flowId !== filter.flowId) {
          return false;
        }

        if (filter.outcomes && filter.outcomes.length > 0 && !filter.outcomes.includes(item.outcome)) {
          return false;
        }

        return true;
      });

      if (filter.limit !== undefined && filter.limit > 0) {
        return filtered.slice(0, filter.limit).map(cloneFlowAuditEvent);
      }

      return filtered.map(cloneFlowAuditEvent);
    },
    listBilling(filter = {}) {
      const now = filter.now ?? new Date().toISOString();
      const billing = filterByWorkspace(baseline.billing, filter.workspaceId);

      return billing.filter((item) => {
        if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(item.status)) {
          return false;
        }

        if (
          filter.overdueOnly &&
          !(
            item.status === "overdue" ||
            (item.status === "pending" && isOverdue(item.dueAt, now))
          )
        ) {
          return false;
        }

        return true;
      });
    },
    listFlowDrafts(flowId, workspaceId) {
      const flow = resolveFlow(flowId, workspaceId);
      return flow ? cloneFlowDrafts(flow.drafts) : undefined;
    },
    listFlows(filter = {}) {
      const flows = filterByWorkspace(baseline.flows, filter.workspaceId);

      return flows
        .filter((item) => {
          if (filter.requireAttention !== undefined) {
            const requiresAttention = item.openAlerts > 0 || item.pendingApprovals > 0 || item.status !== "healthy";
            if (requiresAttention !== filter.requireAttention) {
              return false;
            }
          }

          if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(item.status)) {
            return false;
          }

          return true;
        })
        .map(cloneFlowRecord);
    },
    listFlowVersions(flowId, workspaceId) {
      const flow = resolveFlow(flowId, workspaceId);
      return flow ? cloneFlowVersions(flow.versions) : undefined;
    },
    previewFlowPublish(flowId, workspaceId, actor) {
      const flow = resolveFlow(flowId, workspaceId);
      if (!flow) {
        return undefined;
      }

      if (flow.publishReadiness.status === "blocked" || flow.publishReadiness.blockers.length > 0) {
        const event = createAuditEvent(
          flow,
          "publish.preview",
          actor,
          "failed",
          "Preview blocked until publish blockers are resolved."
        );
        return buildActionResult(flow, event, "Preview blocked by active publish blockers.");
      }

      const now = new Date().toISOString();
      const previewPacketId = `pkt_${flow.flowId}_${now.replaceAll(/[-:.TZ]/g, "").slice(0, 14)}`;
      flow.publishReadiness.previewPacketId = previewPacketId;
      flow.publishReadiness.previewGeneratedAt = now;
      setChecklistState(
        flow.publishReadiness,
        "preview",
        "complete",
        `Preview packet ${previewPacketId} generated at ${now}.`
      );
      const primaryDraft = flow.drafts[0];
      if (primaryDraft) {
        primaryDraft.previewPacketId = previewPacketId;
        primaryDraft.updatedAt = now;
      }
      updateReadinessStatus(flow);

      const event = createAuditEvent(
        flow,
        "publish.preview",
        actor,
        "succeeded",
        `Generated preview packet ${previewPacketId}.`
      );
      return buildActionResult(flow, event, `Preview packet ${previewPacketId} generated.`);
    },
    publishFlow(flowId, workspaceId, actor) {
      const flow = resolveFlow(flowId, workspaceId);
      if (!flow) {
        return undefined;
      }

      const validateState = flow.publishReadiness.checklist.find((item) => item.key === "validate");
      const previewState = flow.publishReadiness.checklist.find((item) => item.key === "preview");
      const publishBlocked =
        flow.publishReadiness.blockers.length > 0 ||
        validateState?.status !== "complete" ||
        previewState?.status !== "complete";

      if (publishBlocked) {
        const event = createAuditEvent(
          flow,
          "publish.confirm",
          actor,
          "failed",
          "Publish blocked until validation and preview are complete with no blockers."
        );
        return buildActionResult(
          flow,
          event,
          "Publish failed. Resolve blockers and complete validation + preview first."
        );
      }

      const now = new Date().toISOString();
      flow.activeVersion = flow.publishReadiness.targetVersion;
      flow.lastPublishedAt = now;
      flow.latestPublishNote = `Published ${flow.activeVersion} from Dash action lane at ${now}.`;
      setChecklistState(
        flow.publishReadiness,
        "confirm",
        "complete",
        `Publish confirmed by ${actor} at ${now}.`
      );
      flow.publishReadiness.status = "ready";
      const primaryDraft = flow.drafts[0];
      if (primaryDraft) {
        primaryDraft.status = "locked";
        primaryDraft.updatedAt = now;
      }

      const versionEntry = flow.versions.find((item) => item.versionId === flow.activeVersion);
      if (versionEntry) {
        versionEntry.status = "published";
        versionEntry.releasedAt = now;
        versionEntry.author = actor;
      } else {
        flow.versions.unshift({
          author: actor,
          changeSummary: `Published through Dash control lane by ${actor}.`,
          flowId: flow.flowId,
          releasedAt: now,
          status: "published",
          versionId: flow.activeVersion,
          workspaceId: flow.workspaceId
        });
      }
      for (const version of flow.versions) {
        if (version.versionId !== flow.activeVersion && version.status === "published") {
          version.status = "archived";
        }
      }

      const event = createAuditEvent(
        flow,
        "publish.confirm",
        actor,
        "succeeded",
        `Published ${flow.activeVersion}.`
      );
      return buildActionResult(flow, event, `Published ${flow.activeVersion} successfully.`);
    },
    saveFlowDraft(flowId, workspaceId, actor) {
      const flow = resolveFlow(flowId, workspaceId);
      if (!flow) {
        return undefined;
      }

      if (flow.builder.lockStatus === "read_only") {
        const event = createAuditEvent(
          flow,
          "builder.save",
          actor,
          "failed",
          "Builder save denied because flow is read-only."
        );
        return buildActionResult(flow, event, "Builder is read-only. Save action denied.");
      }

      const now = new Date().toISOString();
      flow.builder.autosaveStatus = "saved";
      flow.builder.lastSavedAt = now;
      const primaryDraft = flow.drafts[0];
      if (primaryDraft) {
        primaryDraft.updatedAt = now;
        if (primaryDraft.status === "attention") {
          primaryDraft.status = "ready";
        }
      }

      const event = createAuditEvent(
        flow,
        "builder.save",
        actor,
        "succeeded",
        `Saved ${flow.draftVersion}.`
      );
      return buildActionResult(flow, event, `Draft ${flow.draftVersion} autosaved.`);
    },
    listProofs(filter = {}) {
      const proofs = filterByWorkspace(baseline.proofs, filter.workspaceId);

      return proofs.filter((item) => {
        if (filter.kinds && filter.kinds.length > 0 && !filter.kinds.includes(item.kind)) {
          return false;
        }

        if (filter.minConfidence !== undefined && item.confidence < filter.minConfidence) {
          return false;
        }

        if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(item.status)) {
          return false;
        }

        return true;
      });
    },
    listRuntimeExecutions(filter = {}) {
      const executions = filterByWorkspace(baseline.runtimeExecutions, filter.workspaceId);

      return executions
        .filter((item) => {
          if (filter.flowId && item.flowId !== filter.flowId) {
            return false;
          }

          if (
            filter.requireAttention !== undefined &&
            item.requiresAttention !== filter.requireAttention
          ) {
            return false;
          }

          if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(item.status)) {
            return false;
          }

          return true;
        })
        .map(cloneRuntimeExecutionRecord);
    },
    validateFlowDraft(flowId, workspaceId, actor) {
      const flow = resolveFlow(flowId, workspaceId);
      if (!flow) {
        return undefined;
      }

      const now = new Date().toISOString();
      flow.builder.lastValidatedAt = now;
      flow.publishReadiness.lastValidatedAt = now;

      const hasOpenIssues = flow.builder.openIssues > 0;
      if (hasOpenIssues) {
        flow.builder.autosaveStatus = "attention";
        const primaryDraft = flow.drafts[0];
        if (primaryDraft) {
          primaryDraft.status = "attention";
          primaryDraft.updatedAt = now;
        }
        upsertValidationBlocker(flow);
        setChecklistState(
          flow.publishReadiness,
          "validate",
          "blocked",
          `${flow.builder.openIssues} issue(s) remain before publish lane can move forward.`
        );
        updateReadinessStatus(flow);
        const event = createAuditEvent(
          flow,
          "builder.validate",
          actor,
          "failed",
          `Validation failed with ${flow.builder.openIssues} open issue(s).`
        );
        return buildActionResult(flow, event, `Validation failed with ${flow.builder.openIssues} open issue(s).`);
      }

      clearValidationBlockers(flow);
      setChecklistState(
        flow.publishReadiness,
        "validate",
        "complete",
        `Validation passed at ${now}.`
      );
      updateReadinessStatus(flow);
      const primaryDraft = flow.drafts[0];
      if (primaryDraft) {
        primaryDraft.status = "ready";
        primaryDraft.updatedAt = now;
      }

      const event = createAuditEvent(
        flow,
        "builder.validate",
        actor,
        "succeeded",
        "Validation passed."
      );
      return buildActionResult(flow, event, "Validation passed.");
    },
    snapshot(workspaceId) {
      return filterSnapshotByWorkspace(baseline, workspaceId);
    }
  };
}

export function buildFlowSourceSummary(
  snapshot: FlowSourceOfTruthSnapshot,
  now = new Date().toISOString()
): FlowSourceSummary {
  const pendingApprovals = snapshot.approvals.filter((item) => item.status === "pending");
  const unpaidBilling = snapshot.billing.filter(
    (item) => item.status === "pending" || item.status === "overdue"
  );
  const overdueBilling = snapshot.billing.filter(
    (item) => item.status === "overdue" || (item.status === "pending" && isOverdue(item.dueAt, now))
  );
  const openAlerts = snapshot.alerts.filter((item) => item.status === "open");
  const proofsVerifiedCount = snapshot.proofs.filter((item) => item.status === "verified").length;

  return {
    alerts: {
      criticalOpen: openAlerts.filter((item) => item.severity === "critical").length,
      humanRequiredOpen: openAlerts.filter((item) => item.requiresHuman).length,
      open: openAlerts.length,
      total: snapshot.alerts.length
    },
    approvals: {
      humanRequired: pendingApprovals.filter((item) => item.requiresHuman).length,
      overdue: pendingApprovals.filter((item) => isOverdue(item.slaDueAt, now)).length,
      pending: pendingApprovals.length,
      total: snapshot.approvals.length
    },
    billing: {
      outstandingCents: unpaidBilling.reduce((sum, item) => sum + item.amountCents, 0),
      overdueCount: overdueBilling.length,
      total: snapshot.billing.length,
      unpaidCount: unpaidBilling.length
    },
    proofs: {
      failed: snapshot.proofs.filter((item) => item.status === "failed").length,
      pending: snapshot.proofs.filter((item) => item.status === "pending").length,
      total: snapshot.proofs.length,
      verifiedRatio: snapshot.proofs.length === 0 ? 0 : proofsVerifiedCount / snapshot.proofs.length
    }
  };
}

function createMergedSnapshot(
  seed?: Partial<FlowSourceOfTruthSnapshot>
): FlowSourceOfTruthSnapshot {
  const defaults = createDefaultSnapshot();

  return {
    alerts: cloneAlerts(seed?.alerts ?? defaults.alerts),
    approvals: cloneApprovals(seed?.approvals ?? defaults.approvals),
    auditEvents: cloneFlowAuditEvents(seed?.auditEvents ?? defaults.auditEvents),
    billing: cloneBilling(seed?.billing ?? defaults.billing),
    flows: cloneFlowDetails(seed?.flows ?? defaults.flows),
    generatedAt: seed?.generatedAt ?? defaults.generatedAt ?? new Date().toISOString(),
    proofs: cloneProofs(seed?.proofs ?? defaults.proofs),
    runtimeExecutions: cloneRuntimeExecutionDetails(seed?.runtimeExecutions ?? defaults.runtimeExecutions),
    version: "flow_sot_v1"
  };
}

function createDefaultSnapshot(): FlowSourceOfTruthSnapshot {
  return {
    alerts: [
      {
        alertId: "alt_9001",
        createdAt: "2026-04-14T09:20:00.000Z",
        message: "Invoice INV-2301 overdue and awaiting manual settlement decision.",
        requiresHuman: true,
        scope: "billing",
        severity: "critical",
        sourceRef: "inv_2301",
        status: "open",
        workspaceId: "ws_flow_main"
      },
      {
        alertId: "alt_9002",
        createdAt: "2026-04-14T10:11:00.000Z",
        message: "Approval APR-102 exceeded SLA window by more than 45 minutes.",
        requiresHuman: true,
        scope: "approvals",
        severity: "warning",
        sourceRef: "apr_102",
        status: "open",
        workspaceId: "ws_flow_main"
      },
      {
        alertId: "alt_9003",
        createdAt: "2026-04-14T07:50:00.000Z",
        message: "Proof PRF-700 verification retried and completed successfully.",
        requiresHuman: false,
        scope: "proofs",
        severity: "info",
        sourceRef: "prf_700",
        status: "resolved",
        workspaceId: "ws_flow_main"
      },
      {
        alertId: "alt_9004",
        createdAt: "2026-04-14T08:42:00.000Z",
        message: "Runtime queue lag moved above warning threshold.",
        requiresHuman: false,
        scope: "runtime",
        severity: "critical",
        sourceRef: "queue_main",
        status: "acked",
        workspaceId: "ws_flow_main"
      }
    ],
    approvals: [
      {
        amountCents: 25000000,
        approvalId: "apr_101",
        approverGroup: "finance-leads",
        currency: "USD",
        intentId: "intent_writeoff_101",
        note: "Write-off request for enterprise invoice INV-2301.",
        priority: "critical",
        requestedAt: "2026-04-14T08:10:00.000Z",
        requestedBy: "flow.billing.reconciliation",
        requiresHuman: true,
        resourceRef: "inv_2301",
        slaDueAt: "2026-04-14T09:00:00.000Z",
        status: "pending",
        workflowKey: "billing.writeoff",
        workspaceId: "ws_flow_main"
      },
      {
        amountCents: 990000,
        approvalId: "apr_102",
        approverGroup: "ops-managers",
        currency: "USD",
        intentId: "intent_limit_override_230",
        priority: "high",
        requestedAt: "2026-04-14T09:25:00.000Z",
        requestedBy: "flow.approvals.guardian",
        requiresHuman: true,
        resourceRef: "acct_enterprise_88",
        slaDueAt: "2026-04-14T09:50:00.000Z",
        status: "pending",
        workflowKey: "approvals.limit-override",
        workspaceId: "ws_flow_main"
      },
      {
        amountCents: 149000,
        approvalId: "apr_103",
        approverGroup: "finance-leads",
        currency: "USD",
        intentId: "intent_invoice_release_778",
        priority: "normal",
        requestedAt: "2026-04-14T09:15:00.000Z",
        requestedBy: "flow.billing.invoice-release",
        requiresHuman: false,
        resourceRef: "inv_2302",
        slaDueAt: "2026-04-14T10:30:00.000Z",
        status: "approved",
        workflowKey: "billing.invoice-release",
        workspaceId: "ws_flow_main"
      },
      {
        amountCents: 320000,
        approvalId: "apr_104",
        approverGroup: "risk-ops",
        currency: "USD",
        intentId: "intent_proof_remediation_700",
        priority: "high",
        requestedAt: "2026-04-14T07:35:00.000Z",
        requestedBy: "flow.proofs.recovery",
        requiresHuman: true,
        resourceRef: "prf_700",
        slaDueAt: "2026-04-14T08:00:00.000Z",
        status: "rejected",
        workflowKey: "proofs.remediation",
        workspaceId: "ws_flow_main"
      }
    ],
    auditEvents: [
      {
        action: "publish.confirm",
        actor: "runtime-platform",
        createdAt: "2026-04-14T09:32:00.000Z",
        details: "Published v4 after locale-safe contract validation.",
        eventId: "audit_0001",
        flowId: "flow_locale_handoff",
        outcome: "succeeded",
        workspaceId: "ws_flow_main"
      },
      {
        action: "builder.validate",
        actor: "ops-managers",
        createdAt: "2026-04-14T08:58:00.000Z",
        details: "Validation failed with 3 open issues on invoice recovery.",
        eventId: "audit_0002",
        flowId: "flow_invoice_recovery",
        outcome: "failed",
        workspaceId: "ws_flow_main"
      }
    ],
    billing: [
      {
        amountCents: 25000000,
        currency: "USD",
        customerRef: "acct_enterprise_88",
        dueAt: "2026-04-14T08:45:00.000Z",
        invoiceId: "inv_2301",
        sourceApprovalId: "apr_101",
        status: "overdue",
        updatedAt: "2026-04-14T09:15:00.000Z",
        workspaceId: "ws_flow_main"
      },
      {
        amountCents: 149000,
        currency: "USD",
        customerRef: "acct_growth_12",
        dueAt: "2026-04-14T11:30:00.000Z",
        invoiceId: "inv_2302",
        sourceApprovalId: "apr_103",
        status: "pending",
        updatedAt: "2026-04-14T10:02:00.000Z",
        workspaceId: "ws_flow_main"
      },
      {
        amountCents: 89000,
        currency: "USD",
        customerRef: "acct_growth_42",
        dueAt: "2026-04-14T07:00:00.000Z",
        invoiceId: "inv_2299",
        paidAt: "2026-04-14T07:08:00.000Z",
        status: "paid",
        updatedAt: "2026-04-14T07:08:00.000Z",
        workspaceId: "ws_flow_main"
      },
      {
        amountCents: 499000,
        currency: "USD",
        customerRef: "acct_partner_20",
        dueAt: "2026-04-14T08:20:00.000Z",
        invoiceId: "inv_2300",
        status: "failed",
        updatedAt: "2026-04-14T08:30:00.000Z",
        workspaceId: "ws_flow_main"
      }
    ],
    flows: [
      {
        activeVersion: "v12",
        builder: {
          autosaveStatus: "saved",
          lastSavedAt: "2026-04-14T10:16:00.000Z",
          lastValidatedAt: "2026-04-14T10:14:00.000Z",
          lockStatus: "unlocked",
          nodeCatalog: [
            { category: "Trigger", label: "Lead form intake", nodeType: "trigger.form" },
            { category: "Decision", label: "Qualification split", nodeType: "decision.rules" },
            { category: "Action", label: "Assign owner", nodeType: "action.assign" }
          ],
          openIssues: 1
        },
        drafts: [
          {
            draftId: "draft_lead_v13",
            editor: "growth-ops",
            flowId: "flow_lead_intake",
            openIssues: 1,
            previewPacketId: "pkt_lead_v13",
            status: "attention",
            summary: "Final scoring note cleanup remains before the next publish packet can freeze.",
            updatedAt: "2026-04-14T10:16:00.000Z",
            versionId: "v13",
            workspaceId: "ws_flow_main"
          }
        ],
        draftVersion: "v13",
        flowId: "flow_lead_intake",
        lastExecutionAt: "2026-04-14T10:18:00.000Z",
        lastPublishedAt: "2026-04-14T09:40:00.000Z",
        latestPublishNote: "Published the new intake split while keeping workspace guardrails unchanged.",
        name: "Lead Intake Qualification",
        openAlerts: 0,
        owner: "growth-ops",
        pendingApprovals: 0,
        publishReadiness: {
          blockerRefs: ["val_lead_v13"],
          blockers: ["One scoring note still needs validation sign-off before the publish packet can lock."],
          checklist: [
            {
              detail: "Structural validation completed on 2026-04-14T10:14:00.000Z.",
              key: "validate",
              label: "Validation run",
              status: "complete"
            },
            {
              detail: "Preview packet will regenerate once the final scoring note lands.",
              key: "preview",
              label: "Preview packet",
              status: "pending"
            },
            {
              detail: "Growth ops can confirm publish after the regenerated packet is reviewed.",
              key: "confirm",
              label: "Publish confirmation",
              status: "pending"
            }
          ],
          flowId: "flow_lead_intake",
          lastValidatedAt: "2026-04-14T10:14:00.000Z",
          operatorNote: "Low-risk publish once the scoring note is cleared and the preview packet is refreshed.",
          previewGeneratedAt: "2026-04-14T10:15:00.000Z",
          previewPacketId: "pkt_lead_v13",
          status: "attention",
          targetVersion: "v13",
          workspaceId: "ws_flow_main"
        },
        recentExecutionIds: ["exec_9001"],
        status: "healthy",
        summary: "Routes new leads into qualification, owner assignment, and follow-up proof capture.",
        trigger: "Form submit + enrichment webhook",
        versions: [
          {
            author: "growth-ops",
            changeSummary: "Added high-intent routing and owner balancing guardrails.",
            flowId: "flow_lead_intake",
            releasedAt: "2026-04-14T09:40:00.000Z",
            status: "published",
            versionId: "v12",
            workspaceId: "ws_flow_main"
          },
          {
            author: "growth-ops",
            changeSummary: "Retired the manual retry lane after the scoring uplift stabilized.",
            flowId: "flow_lead_intake",
            releasedAt: "2026-04-10T14:20:00.000Z",
            status: "archived",
            versionId: "v11",
            workspaceId: "ws_flow_main"
          }
        ],
        workspaceId: "ws_flow_main"
      },
      {
        activeVersion: "v7",
        builder: {
          autosaveStatus: "attention",
          lastSavedAt: "2026-04-14T09:05:00.000Z",
          lastValidatedAt: "2026-04-14T08:58:00.000Z",
          lockOwner: "ops-managers",
          lockStatus: "locked",
          nodeCatalog: [
            { category: "Trigger", label: "Invoice overdue", nodeType: "trigger.billing" },
            { category: "Action", label: "Request write-off approval", nodeType: "action.approval" },
            { category: "Action", label: "Escalate operator", nodeType: "action.escalate" }
          ],
          openIssues: 3
        },
        drafts: [
          {
            draftId: "draft_invoice_v8",
            editor: "ops-managers",
            flowId: "flow_invoice_recovery",
            openIssues: 3,
            status: "blocked",
            summary: "Approval fallback and proof remediation are still failing the draft release gate.",
            updatedAt: "2026-04-14T09:05:00.000Z",
            versionId: "v8",
            workspaceId: "ws_flow_main"
          }
        ],
        draftVersion: "v8",
        flowId: "flow_invoice_recovery",
        lastExecutionAt: "2026-04-14T09:12:00.000Z",
        lastPublishedAt: "2026-04-14T08:45:00.000Z",
        latestPublishNote: "Latest publish keeps the write-off approval lane attached to operator escalation.",
        name: "Invoice Recovery Escalation",
        openAlerts: 1,
        owner: "finance-ops",
        pendingApprovals: 2,
        publishReadiness: {
          blockerRefs: ["apr_101", "alt_9001", "prf_701"],
          blockers: [
            "Approval APR-101 is still overdue and blocks the publish lane.",
            "Critical alert ALT-9001 stays open on the recovery flow.",
            "Proof capture PRF-701 is still pending for the failing draft run."
          ],
          checklist: [
            {
              detail: "Three open builder issues keep the draft from passing release validation.",
              key: "validate",
              label: "Validation run",
              status: "blocked"
            },
            {
              detail: "Preview packet is withheld until approval and proof pressure are resolved.",
              key: "preview",
              label: "Preview packet",
              status: "pending"
            },
            {
              detail: "Finance ops cannot confirm publish while the write-off approval stays open.",
              key: "confirm",
              label: "Publish confirmation",
              status: "blocked"
            }
          ],
          flowId: "flow_invoice_recovery",
          lastValidatedAt: "2026-04-14T08:58:00.000Z",
          operatorNote: "Do not publish until the overdue approval, proof remediation, and alert closure are complete.",
          status: "blocked",
          targetVersion: "v8",
          workspaceId: "ws_flow_main"
        },
        recentExecutionIds: ["exec_9002"],
        status: "attention",
        summary: "Escalates overdue invoices into approval, operator follow-up, and billing recovery.",
        trigger: "Billing overdue threshold",
        versions: [
          {
            author: "finance-ops",
            changeSummary: "Pinned operator escalation behind the write-off approval lane.",
            flowId: "flow_invoice_recovery",
            releasedAt: "2026-04-14T08:45:00.000Z",
            status: "published",
            versionId: "v7",
            workspaceId: "ws_flow_main"
          },
          {
            author: "finance-ops",
            changeSummary: "Deprecated the direct settlement branch after audit feedback.",
            flowId: "flow_invoice_recovery",
            releasedAt: "2026-04-07T16:30:00.000Z",
            status: "archived",
            versionId: "v6",
            workspaceId: "ws_flow_main"
          }
        ],
        workspaceId: "ws_flow_main"
      },
      {
        activeVersion: "v4",
        builder: {
          autosaveStatus: "saved",
          lastSavedAt: "2026-04-14T10:01:00.000Z",
          lastValidatedAt: "2026-04-14T09:59:00.000Z",
          lockStatus: "read_only",
          nodeCatalog: [
            { category: "Trigger", label: "Shared auth complete", nodeType: "trigger.auth" },
            { category: "Decision", label: "Locale branch", nodeType: "decision.locale" },
            { category: "Action", label: "Deep-link handoff", nodeType: "action.redirect" }
          ],
          openIssues: 0
        },
        drafts: [
          {
            draftId: "draft_locale_v4",
            editor: "runtime-platform",
            flowId: "flow_locale_handoff",
            openIssues: 0,
            previewPacketId: "pkt_locale_v4",
            status: "locked",
            summary: "Draft stays pinned to the live contract while locale preview evidence is refreshed.",
            updatedAt: "2026-04-14T10:01:00.000Z",
            versionId: "v4",
            workspaceId: "ws_flow_main"
          }
        ],
        draftVersion: "v4",
        flowId: "flow_locale_handoff",
        lastExecutionAt: "2026-04-14T10:09:00.000Z",
        lastPublishedAt: "2026-04-14T09:32:00.000Z",
        latestPublishNote: "Locale-safe handoff stays pinned to the shared onboarding contract.",
        name: "Locale-safe Handoff",
        openAlerts: 0,
        owner: "runtime-platform",
        pendingApprovals: 0,
        publishReadiness: {
          blockerRefs: [],
          blockers: [],
          checklist: [
            {
              detail: "Validation remains green on the shared locale contract.",
              key: "validate",
              label: "Validation run",
              status: "complete"
            },
            {
              detail: "Preview packet pkt_locale_v4 was generated for the current live contract.",
              key: "preview",
              label: "Preview packet",
              status: "complete"
            },
            {
              detail: "No additional publish confirmation is needed while live and draft stay aligned.",
              key: "confirm",
              label: "Publish confirmation",
              status: "complete"
            }
          ],
          flowId: "flow_locale_handoff",
          lastValidatedAt: "2026-04-14T09:59:00.000Z",
          operatorNote: "No publish action is required unless the shared onboarding contract changes again.",
          previewGeneratedAt: "2026-04-14T10:00:00.000Z",
          previewPacketId: "pkt_locale_v4",
          status: "ready",
          targetVersion: "v4",
          workspaceId: "ws_flow_main"
        },
        recentExecutionIds: ["exec_9003"],
        status: "healthy",
        summary: "Keeps shared auth and route handoff aligned with locale and workspace truth.",
        trigger: "Shared auth callback",
        versions: [
          {
            author: "runtime-platform",
            changeSummary: "Locked shared auth handoff to the locale-safe redirect contract.",
            flowId: "flow_locale_handoff",
            releasedAt: "2026-04-14T09:32:00.000Z",
            status: "published",
            versionId: "v4",
            workspaceId: "ws_flow_main"
          },
          {
            author: "runtime-platform",
            changeSummary: "Archived the legacy locale fallback once shared auth became canonical.",
            flowId: "flow_locale_handoff",
            releasedAt: "2026-04-03T12:00:00.000Z",
            status: "archived",
            versionId: "v3",
            workspaceId: "ws_flow_main"
          }
        ],
        workspaceId: "ws_flow_main"
      }
    ],
    generatedAt: "2026-04-14T10:30:00.000Z",
    proofs: [
      {
        approvalId: "apr_103",
        capturedAt: "2026-04-14T09:17:00.000Z",
        confidence: 0.99,
        custodyChainLength: 3,
        hash: "sha256:proof_700",
        intentId: "intent_invoice_release_778",
        kind: "approval",
        proofId: "prf_700",
        status: "verified",
        verifiedAt: "2026-04-14T09:18:00.000Z",
        workspaceId: "ws_flow_main"
      },
      {
        approvalId: "apr_101",
        capturedAt: "2026-04-14T08:12:00.000Z",
        confidence: 0.62,
        custodyChainLength: 1,
        hash: "sha256:proof_701",
        intentId: "intent_writeoff_101",
        kind: "execution",
        proofId: "prf_701",
        status: "pending",
        workspaceId: "ws_flow_main"
      },
      {
        approvalId: "apr_104",
        capturedAt: "2026-04-14T07:40:00.000Z",
        confidence: 0.48,
        custodyChainLength: 2,
        hash: "sha256:proof_702",
        intentId: "intent_proof_remediation_700",
        kind: "relay",
        proofId: "prf_702",
        status: "failed",
        workspaceId: "ws_flow_main"
      },
      {
        capturedAt: "2026-04-14T09:55:00.000Z",
        confidence: 0.93,
        custodyChainLength: 4,
        hash: "sha256:proof_703",
        intentId: "intent_limit_override_230",
        kind: "audit",
        proofId: "prf_703",
        status: "verified",
        verifiedAt: "2026-04-14T09:58:00.000Z",
        workspaceId: "ws_flow_main"
      }
    ],
    runtimeExecutions: [
      {
        alertIds: [],
        approvalIds: [],
        currentStepLabel: "Assign owner",
        executionId: "exec_9001",
        flowId: "flow_lead_intake",
        flowName: "Lead Intake Qualification",
        initiatedBy: "system.web-intake",
        proofIds: ["prf_703"],
        requiresAttention: false,
        startedAt: "2026-04-14T10:17:12.000Z",
        status: "running",
        steps: [
          {
            endedAt: "2026-04-14T10:17:14.000Z",
            label: "Lead form intake",
            nodeId: "node_trigger_form",
            startedAt: "2026-04-14T10:17:12.000Z",
            status: "completed",
            summary: "Validated payload and normalized source campaign tags."
          },
          {
            endedAt: "2026-04-14T10:17:18.000Z",
            label: "Qualification split",
            nodeId: "node_decision_score",
            startedAt: "2026-04-14T10:17:14.000Z",
            status: "completed",
            summary: "Lead crossed the high-intent threshold and stayed in the main lane."
          },
          {
            label: "Assign owner",
            nodeId: "node_assign_owner",
            startedAt: "2026-04-14T10:17:18.000Z",
            status: "running",
            summary: "Waiting for owner capacity confirmation before final handoff."
          }
        ],
        summary: "High-intent lead is moving through owner assignment without active blockers.",
        trigger: "Form submit + enrichment webhook",
        workspaceId: "ws_flow_main"
      },
      {
        alertIds: ["alt_9001"],
        approvalIds: ["apr_101"],
        currentStepLabel: "Request write-off approval",
        endedAt: "2026-04-14T09:12:45.000Z",
        executionId: "exec_9002",
        flowId: "flow_invoice_recovery",
        flowName: "Invoice Recovery Escalation",
        initiatedBy: "scheduler.billing-overdue",
        proofIds: ["prf_701"],
        requiresAttention: true,
        startedAt: "2026-04-14T09:11:02.000Z",
        status: "failed",
        steps: [
          {
            endedAt: "2026-04-14T09:11:09.000Z",
            label: "Invoice overdue",
            nodeId: "node_trigger_invoice",
            startedAt: "2026-04-14T09:11:02.000Z",
            status: "completed",
            summary: "Invoice INV-2301 crossed the overdue threshold."
          },
          {
            endedAt: "2026-04-14T09:12:45.000Z",
            label: "Request write-off approval",
            nodeId: "node_approval_writeoff",
            startedAt: "2026-04-14T09:11:09.000Z",
            status: "failed",
            summary: "Approval lane stayed pending beyond SLA and raised a billing-critical alert."
          },
          {
            label: "Escalate operator",
            nodeId: "node_escalate_operator",
            status: "queued",
            summary: "Operator escalation did not open because the approval stage failed first."
          }
        ],
        summary: "Billing recovery is blocked on overdue approval and requires human follow-up.",
        trigger: "Billing overdue threshold",
        workspaceId: "ws_flow_main"
      },
      {
        alertIds: [],
        approvalIds: [],
        endedAt: "2026-04-14T10:09:41.000Z",
        executionId: "exec_9003",
        flowId: "flow_locale_handoff",
        flowName: "Locale-safe Handoff",
        initiatedBy: "shared-auth.redirect",
        proofIds: [],
        requiresAttention: false,
        startedAt: "2026-04-14T10:09:31.000Z",
        status: "succeeded",
        steps: [
          {
            endedAt: "2026-04-14T10:09:34.000Z",
            label: "Shared auth complete",
            nodeId: "node_trigger_auth",
            startedAt: "2026-04-14T10:09:31.000Z",
            status: "completed",
            summary: "Shared auth callback resolved workspace and locale context."
          },
          {
            endedAt: "2026-04-14T10:09:37.000Z",
            label: "Locale branch",
            nodeId: "node_decision_locale",
            startedAt: "2026-04-14T10:09:34.000Z",
            status: "completed",
            summary: "Locale stayed on the Vietnamese lane with no fallback applied."
          },
          {
            endedAt: "2026-04-14T10:09:41.000Z",
            label: "Deep-link handoff",
            nodeId: "node_redirect_handoff",
            startedAt: "2026-04-14T10:09:37.000Z",
            status: "completed",
            summary: "User was redirected into the matching locale-safe app route."
          }
        ],
        summary: "Shared onboarding handoff completed without locale drift.",
        trigger: "Shared auth callback",
        workspaceId: "ws_flow_main"
      }
    ],
    version: "flow_sot_v1"
  };
}

function filterSnapshotByWorkspace(
  snapshot: FlowSourceOfTruthSnapshot,
  workspaceId?: string
): FlowSourceOfTruthSnapshot {
  const approvals = filterByWorkspace(snapshot.approvals, workspaceId);
  const auditEvents = filterByWorkspace(snapshot.auditEvents, workspaceId);
  const billing = filterByWorkspace(snapshot.billing, workspaceId);
  const proofs = filterByWorkspace(snapshot.proofs, workspaceId);
  const alerts = filterByWorkspace(snapshot.alerts, workspaceId);
  const flows = filterByWorkspace(snapshot.flows, workspaceId);
  const runtimeExecutions = filterByWorkspace(snapshot.runtimeExecutions, workspaceId);

  return {
    alerts: cloneAlerts(alerts),
    approvals: cloneApprovals(approvals),
    auditEvents: cloneFlowAuditEvents(auditEvents),
    billing: cloneBilling(billing),
    flows: cloneFlowDetails(flows),
    generatedAt: snapshot.generatedAt,
    proofs: cloneProofs(proofs),
    runtimeExecutions: cloneRuntimeExecutionDetails(runtimeExecutions),
    version: "flow_sot_v1"
  };
}

function filterByWorkspace<T extends { workspaceId: string }>(items: T[], workspaceId?: string): T[] {
  if (!workspaceId) {
    return [...items];
  }

  return items.filter((item) => item.workspaceId === workspaceId);
}

function cloneApprovals(items: FlowApproval[]) {
  return items.map((item) => ({ ...item }));
}

function cloneBilling(items: FlowBillingRecord[]) {
  return items.map((item) => ({ ...item }));
}

function cloneProofs(items: FlowProofRecord[]) {
  return items.map((item) => ({ ...item }));
}

function cloneAlerts(items: FlowAlertRecord[]) {
  return items.map((item) => ({ ...item }));
}

function cloneFlowAuditEvent(item: FlowAuditEvent): FlowAuditEvent {
  return { ...item };
}

function cloneFlowAuditEvents(items: FlowAuditEvent[]) {
  return items.map(cloneFlowAuditEvent);
}

function cloneFlowBuilderState(item: FlowBuilderState): FlowBuilderState {
  return {
    autosaveStatus: item.autosaveStatus,
    lastSavedAt: item.lastSavedAt,
    lastValidatedAt: item.lastValidatedAt,
    lockOwner: item.lockOwner,
    lockStatus: item.lockStatus,
    nodeCatalog: item.nodeCatalog.map((node) => ({ ...node })),
    openIssues: item.openIssues
  };
}

function cloneFlowVersion(item: FlowVersionRecord): FlowVersionRecord {
  return { ...item };
}

function cloneFlowVersions(items: FlowVersionRecord[]) {
  return items.map(cloneFlowVersion);
}

function cloneFlowDraft(item: FlowDraftRecord): FlowDraftRecord {
  return { ...item };
}

function cloneFlowDrafts(items: FlowDraftRecord[]) {
  return items.map(cloneFlowDraft);
}

function cloneFlowPublishChecklistItem(item: FlowPublishChecklistItem): FlowPublishChecklistItem {
  return { ...item };
}

function cloneFlowPublishReadiness(item: FlowPublishReadiness): FlowPublishReadiness {
  return {
    ...item,
    blockerRefs: [...item.blockerRefs],
    blockers: [...item.blockers],
    checklist: item.checklist.map(cloneFlowPublishChecklistItem)
  };
}

function cloneFlowRecord(item: FlowDetail): FlowRecord {
  return {
    activeVersion: item.activeVersion,
    draftVersion: item.draftVersion,
    flowId: item.flowId,
    lastExecutionAt: item.lastExecutionAt,
    lastPublishedAt: item.lastPublishedAt,
    name: item.name,
    openAlerts: item.openAlerts,
    owner: item.owner,
    pendingApprovals: item.pendingApprovals,
    status: item.status,
    summary: item.summary,
    trigger: item.trigger,
    workspaceId: item.workspaceId
  };
}

function cloneFlowDetail(item: FlowDetail): FlowDetail {
  return {
    ...cloneFlowRecord(item),
    builder: cloneFlowBuilderState(item.builder),
    drafts: cloneFlowDrafts(item.drafts),
    latestPublishNote: item.latestPublishNote,
    publishReadiness: cloneFlowPublishReadiness(item.publishReadiness),
    recentExecutionIds: [...item.recentExecutionIds],
    versions: cloneFlowVersions(item.versions)
  };
}

function cloneFlowDetails(items: FlowDetail[]) {
  return items.map(cloneFlowDetail);
}

function cloneRuntimeExecutionRecord(item: FlowExecutionDetail): FlowExecutionRecord {
  return {
    currentStepLabel: item.currentStepLabel,
    endedAt: item.endedAt,
    executionId: item.executionId,
    flowId: item.flowId,
    flowName: item.flowName,
    initiatedBy: item.initiatedBy,
    requiresAttention: item.requiresAttention,
    startedAt: item.startedAt,
    status: item.status,
    summary: item.summary,
    trigger: item.trigger,
    workspaceId: item.workspaceId
  };
}

function cloneRuntimeExecutionDetail(item: FlowExecutionDetail): FlowExecutionDetail {
  return {
    ...cloneRuntimeExecutionRecord(item),
    alertIds: [...item.alertIds],
    approvalIds: [...item.approvalIds],
    proofIds: [...item.proofIds],
    steps: item.steps.map((step) => ({ ...step }))
  };
}

function cloneRuntimeExecutionDetails(items: FlowExecutionDetail[]) {
  return items.map(cloneRuntimeExecutionDetail);
}

function isOverdue(isoTimestamp: string, now: string): boolean {
  return Date.parse(isoTimestamp) < Date.parse(now);
}
