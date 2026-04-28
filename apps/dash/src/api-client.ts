export interface DashApiClientConfig {
  fetchImpl?: typeof globalThis.fetch;
  flowApiBase: string;
  workspaceId: string;
}

export interface DashApiError {
  code: string;
  message: string;
}

interface DashApiMeta {
  request_id?: string;
}

interface DashApiEnvelope<T> {
  data?: T;
  error?: DashApiError;
  meta?: DashApiMeta;
  ok?: boolean;
}

export interface DashRuntimeSummary {
  alertsCriticalOpen: number;
  approvalsPending: number;
  billingOverdueCount: number;
  generatedAt: string;
  healthStatus: string;
  service: string;
  workspaceId: string;
}

export interface DashApiFetchBase {
  error?: DashApiError;
  ok: boolean;
  requestId: string;
  statusCode: number;
}

export interface DashRuntimeFetchResult extends DashApiFetchBase {
  summary?: DashRuntimeSummary;
}

export type DashFlowStatus = "healthy" | "attention" | "blocked";
export type DashFlowBuilderLockStatus = "unlocked" | "locked" | "read_only";
export type DashFlowBuilderAutosaveStatus = "saved" | "pending" | "attention";
export type DashFlowVersionStatus = "published" | "archived";
export type DashFlowDraftStatus = "ready" | "attention" | "blocked" | "locked";
export type DashFlowPublishReadinessStatus = "ready" | "attention" | "blocked";
export type DashFlowPublishChecklistStatus = "complete" | "pending" | "blocked";
export type DashFlowAuditAction = "builder.save" | "builder.validate" | "publish.preview" | "publish.confirm";
export type DashFlowActionOutcome = "succeeded" | "failed";

export interface DashFlowBuilderNode {
  category: string;
  label: string;
  nodeType: string;
}

export interface DashFlowBuilderState {
  autosaveStatus: DashFlowBuilderAutosaveStatus;
  lastSavedAt: string;
  lastValidatedAt: string;
  lockOwner?: string;
  lockStatus: DashFlowBuilderLockStatus;
  nodeCatalog: DashFlowBuilderNode[];
  openIssues: number;
}

export interface DashFlowVersionRecord {
  author: string;
  changeSummary: string;
  flowId: string;
  releasedAt: string;
  status: DashFlowVersionStatus;
  versionId: string;
  workspaceId: string;
}

export interface DashFlowDraftRecord {
  draftId: string;
  editor: string;
  flowId: string;
  openIssues: number;
  previewPacketId?: string;
  status: DashFlowDraftStatus;
  summary: string;
  updatedAt: string;
  versionId: string;
  workspaceId: string;
}

export interface DashFlowPublishChecklistItem {
  detail: string;
  key: string;
  label: string;
  status: DashFlowPublishChecklistStatus;
}

export interface DashFlowPublishReadiness {
  blockerRefs: string[];
  blockers: string[];
  checklist: DashFlowPublishChecklistItem[];
  flowId: string;
  lastValidatedAt: string;
  operatorNote: string;
  previewGeneratedAt?: string;
  previewPacketId?: string;
  status: DashFlowPublishReadinessStatus;
  targetVersion: string;
  workspaceId: string;
}

export interface DashFlowAuditEvent {
  action: DashFlowAuditAction;
  actor: string;
  createdAt: string;
  details: string;
  eventId: string;
  flowId: string;
  outcome: DashFlowActionOutcome;
  workspaceId: string;
}

export interface DashFlowActionResult {
  action: DashFlowAuditAction;
  actor: string;
  builder?: DashFlowBuilderState;
  event: DashFlowAuditEvent;
  flowId: string;
  message: string;
  outcome: DashFlowActionOutcome;
  publishReadiness?: DashFlowPublishReadiness;
  workspaceId: string;
}

export interface DashFlowRecord {
  activeVersion: string;
  draftVersion: string;
  flowId: string;
  lastExecutionAt: string;
  lastPublishedAt: string;
  name: string;
  openAlerts: number;
  owner: string;
  pendingApprovals: number;
  status: DashFlowStatus;
  summary: string;
  trigger: string;
  workspaceId: string;
}

export interface DashFlowDetail extends DashFlowRecord {
  builder: DashFlowBuilderState;
  latestPublishNote: string;
  recentExecutionIds: string[];
}

export interface DashFlowListFetchResult extends DashApiFetchBase {
  items?: DashFlowRecord[];
  total?: number;
}

export interface DashFlowDetailFetchResult extends DashApiFetchBase {
  flow?: DashFlowDetail;
  recentExecutions?: DashRuntimeExecutionRecord[];
}

export interface DashFlowVersionListFetchResult extends DashApiFetchBase {
  flowId?: string;
  items?: DashFlowVersionRecord[];
  total?: number;
}

export interface DashFlowDraftListFetchResult extends DashApiFetchBase {
  flowId?: string;
  items?: DashFlowDraftRecord[];
  total?: number;
}

export interface DashFlowPublishReadinessFetchResult extends DashApiFetchBase {
  flowId?: string;
  readiness?: DashFlowPublishReadiness;
}

export interface DashFlowActionFetchResult extends DashApiFetchBase {
  result?: DashFlowActionResult;
}

export interface DashFlowAuditFetchResult extends DashApiFetchBase {
  items?: DashFlowAuditEvent[];
  total?: number;
}

export type DashRuntimeExecutionStatus = "queued" | "running" | "succeeded" | "failed";
export type DashRuntimeExecutionStepStatus = "queued" | "running" | "completed" | "failed";

export interface DashRuntimeExecutionRecord {
  currentStepLabel?: string;
  endedAt?: string;
  executionId: string;
  flowId: string;
  flowName: string;
  initiatedBy: string;
  requiresAttention: boolean;
  startedAt: string;
  status: DashRuntimeExecutionStatus;
  summary: string;
  trigger: string;
  workspaceId: string;
}

export interface DashRuntimeExecutionStep {
  endedAt?: string;
  label: string;
  nodeId: string;
  startedAt?: string;
  status: DashRuntimeExecutionStepStatus;
  summary: string;
}

export interface DashRuntimeExecutionDetail extends DashRuntimeExecutionRecord {
  alertIds: string[];
  approvalIds: string[];
  proofIds: string[];
  steps: DashRuntimeExecutionStep[];
}

export interface DashRuntimeExecutionListFetchResult extends DashApiFetchBase {
  items?: DashRuntimeExecutionRecord[];
  total?: number;
}

export interface DashRuntimeExecutionDetailFetchResult extends DashApiFetchBase {
  execution?: DashRuntimeExecutionDetail;
}

interface FlowSourceOfTruthSummaryPayload {
  summary?: {
    alerts?: {
      criticalOpen?: number;
    };
    approvals?: {
      pending?: number;
    };
    billing?: {
      overdueCount?: number;
    };
  };
  timestamp?: string;
}

interface FlowListPayload {
  items?: DashFlowRecord[];
  total?: number;
}

interface FlowDetailPayload {
  flow?: DashFlowDetail;
  recentExecutions?: DashRuntimeExecutionRecord[];
}

interface FlowVersionListPayload {
  flowId?: string;
  items?: DashFlowVersionRecord[];
  total?: number;
}

interface FlowDraftListPayload {
  flowId?: string;
  items?: DashFlowDraftRecord[];
  total?: number;
}

interface FlowPublishReadinessPayload {
  flowId?: string;
  readiness?: DashFlowPublishReadiness;
}

interface FlowActionPayload {
  result?: DashFlowActionResult;
}

interface FlowAuditPayload {
  items?: DashFlowAuditEvent[];
  total?: number;
}

interface RuntimeExecutionListPayload {
  items?: DashRuntimeExecutionRecord[];
  total?: number;
}

interface RuntimeExecutionDetailPayload {
  execution?: DashRuntimeExecutionDetail;
}

export function createDashApiClient(config: DashApiClientConfig) {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;
  const flowApiBase = ensureTrailingSlash(config.flowApiBase);

  return {
    async loadFlowDetail(flowId: string, requestId: string): Promise<DashFlowDetailFetchResult> {
      const result = await fetchResource<FlowDetailPayload>(
        fetchImpl,
        flowApiBase,
        `v1/flow/flows/${encodeURIComponent(flowId)}`,
        config.workspaceId,
        requestId
      );

      if (!result.response.ok || result.payload?.ok !== true || !result.payload.data?.flow) {
        return buildErrorResult(
          result,
          requestId,
          "FLOW_API_ERROR",
          `Flow API returned ${result.response.status} while loading flow detail.`
        );
      }

      return {
        flow: result.payload.data.flow,
        ok: true,
        recentExecutions: result.payload.data.recentExecutions ?? [],
        requestId: resolveRequestId(result.payload, requestId),
        statusCode: result.response.status
      };
    },

    async loadFlowList(requestId: string): Promise<DashFlowListFetchResult> {
      const result = await fetchResource<FlowListPayload>(
        fetchImpl,
        flowApiBase,
        "v1/flow/flows",
        config.workspaceId,
        requestId
      );

      if (!result.response.ok || result.payload?.ok !== true || !result.payload.data?.items) {
        return buildErrorResult(
          result,
          requestId,
          "FLOW_API_ERROR",
          `Flow API returned ${result.response.status} while loading flow inventory.`
        );
      }

      return {
        items: result.payload.data.items,
        ok: true,
        requestId: resolveRequestId(result.payload, requestId),
        statusCode: result.response.status,
        total: result.payload.data.total ?? result.payload.data.items.length
      };
    },

    async loadFlowDrafts(flowId: string, requestId: string): Promise<DashFlowDraftListFetchResult> {
      const result = await fetchResource<FlowDraftListPayload>(
        fetchImpl,
        flowApiBase,
        `v1/flow/flows/${encodeURIComponent(flowId)}/drafts`,
        config.workspaceId,
        requestId
      );

      if (!result.response.ok || result.payload?.ok !== true || !result.payload.data?.items) {
        return buildErrorResult(
          result,
          requestId,
          "FLOW_API_ERROR",
          `Flow API returned ${result.response.status} while loading flow drafts.`
        );
      }

      return {
        flowId: result.payload.data.flowId ?? flowId,
        items: result.payload.data.items,
        ok: true,
        requestId: resolveRequestId(result.payload, requestId),
        statusCode: result.response.status,
        total: result.payload.data.total ?? result.payload.data.items.length
      };
    },

    async loadFlowAudit(requestId: string, flowId?: string): Promise<DashFlowAuditFetchResult> {
      const path = flowId
        ? `v1/flow/audit?flow_id=${encodeURIComponent(flowId)}`
        : "v1/flow/audit";
      const result = await fetchResource<FlowAuditPayload>(
        fetchImpl,
        flowApiBase,
        path,
        config.workspaceId,
        requestId
      );

      if (!result.response.ok || result.payload?.ok !== true || !result.payload.data?.items) {
        return buildErrorResult(
          result,
          requestId,
          "FLOW_API_ERROR",
          `Flow API returned ${result.response.status} while loading audit events.`
        );
      }

      return {
        items: result.payload.data.items,
        ok: true,
        requestId: resolveRequestId(result.payload, requestId),
        statusCode: result.response.status,
        total: result.payload.data.total ?? result.payload.data.items.length
      };
    },

    async loadFlowPublishReadiness(
      flowId: string,
      requestId: string
    ): Promise<DashFlowPublishReadinessFetchResult> {
      const result = await fetchResource<FlowPublishReadinessPayload>(
        fetchImpl,
        flowApiBase,
        `v1/flow/flows/${encodeURIComponent(flowId)}/publish`,
        config.workspaceId,
        requestId
      );

      if (!result.response.ok || result.payload?.ok !== true || !result.payload.data?.readiness) {
        return buildErrorResult(
          result,
          requestId,
          "FLOW_API_ERROR",
          `Flow API returned ${result.response.status} while loading publish readiness.`
        );
      }

      return {
        flowId: result.payload.data.flowId ?? flowId,
        ok: true,
        readiness: result.payload.data.readiness,
        requestId: resolveRequestId(result.payload, requestId),
        statusCode: result.response.status
      };
    },

    async previewFlowPublish(
      flowId: string,
      requestId: string,
      actor: string
    ): Promise<DashFlowActionFetchResult> {
      return runFlowAction(
        fetchImpl,
        flowApiBase,
        `v1/flow/flows/${encodeURIComponent(flowId)}/publish/preview`,
        config.workspaceId,
        requestId,
        actor,
        "preview publish packet"
      );
    },

    async publishFlow(
      flowId: string,
      requestId: string,
      actor: string
    ): Promise<DashFlowActionFetchResult> {
      return runFlowAction(
        fetchImpl,
        flowApiBase,
        `v1/flow/flows/${encodeURIComponent(flowId)}/publish/confirm`,
        config.workspaceId,
        requestId,
        actor,
        "publish flow"
      );
    },

    async saveFlowDraft(
      flowId: string,
      requestId: string,
      actor: string
    ): Promise<DashFlowActionFetchResult> {
      return runFlowAction(
        fetchImpl,
        flowApiBase,
        `v1/flow/flows/${encodeURIComponent(flowId)}/builder/save`,
        config.workspaceId,
        requestId,
        actor,
        "save flow draft"
      );
    },

    async validateFlowDraft(
      flowId: string,
      requestId: string,
      actor: string
    ): Promise<DashFlowActionFetchResult> {
      return runFlowAction(
        fetchImpl,
        flowApiBase,
        `v1/flow/flows/${encodeURIComponent(flowId)}/builder/validate`,
        config.workspaceId,
        requestId,
        actor,
        "validate flow draft"
      );
    },

    async loadFlowVersions(flowId: string, requestId: string): Promise<DashFlowVersionListFetchResult> {
      const result = await fetchResource<FlowVersionListPayload>(
        fetchImpl,
        flowApiBase,
        `v1/flow/flows/${encodeURIComponent(flowId)}/versions`,
        config.workspaceId,
        requestId
      );

      if (!result.response.ok || result.payload?.ok !== true || !result.payload.data?.items) {
        return buildErrorResult(
          result,
          requestId,
          "FLOW_API_ERROR",
          `Flow API returned ${result.response.status} while loading flow versions.`
        );
      }

      return {
        flowId: result.payload.data.flowId ?? flowId,
        items: result.payload.data.items,
        ok: true,
        requestId: resolveRequestId(result.payload, requestId),
        statusCode: result.response.status,
        total: result.payload.data.total ?? result.payload.data.items.length
      };
    },

    async loadRuntimeExecutionDetail(
      executionId: string,
      requestId: string
    ): Promise<DashRuntimeExecutionDetailFetchResult> {
      const result = await fetchResource<RuntimeExecutionDetailPayload>(
        fetchImpl,
        flowApiBase,
        `v1/flow/runtime/executions/${encodeURIComponent(executionId)}`,
        config.workspaceId,
        requestId
      );

      if (!result.response.ok || result.payload?.ok !== true || !result.payload.data?.execution) {
        return buildErrorResult(
          result,
          requestId,
          "FLOW_API_ERROR",
          `Flow API returned ${result.response.status} while loading execution detail.`
        );
      }

      return {
        execution: result.payload.data.execution,
        ok: true,
        requestId: resolveRequestId(result.payload, requestId),
        statusCode: result.response.status
      };
    },

    async loadRuntimeExecutions(requestId: string): Promise<DashRuntimeExecutionListFetchResult> {
      const result = await fetchResource<RuntimeExecutionListPayload>(
        fetchImpl,
        flowApiBase,
        "v1/flow/runtime/executions",
        config.workspaceId,
        requestId
      );

      if (!result.response.ok || result.payload?.ok !== true || !result.payload.data?.items) {
        return buildErrorResult(
          result,
          requestId,
          "FLOW_API_ERROR",
          `Flow API returned ${result.response.status} while loading runtime executions.`
        );
      }

      return {
        items: result.payload.data.items,
        ok: true,
        requestId: resolveRequestId(result.payload, requestId),
        statusCode: result.response.status,
        total: result.payload.data.total ?? result.payload.data.items.length
      };
    },

    async loadRuntimeSummary(requestId: string): Promise<DashRuntimeFetchResult> {
      const result = await fetchResource<FlowSourceOfTruthSummaryPayload>(
        fetchImpl,
        flowApiBase,
        "v1/flow/source-of-truth",
        config.workspaceId,
        requestId
      );

      if (!result.response.ok || result.payload?.ok !== true || !result.payload.data?.summary) {
        return buildErrorResult(
          result,
          requestId,
          "FLOW_API_ERROR",
          `Flow API returned ${result.response.status} while loading the runtime summary.`
        );
      }

      return {
        ok: true,
        requestId: resolveRequestId(result.payload, requestId),
        statusCode: result.response.status,
        summary: {
          alertsCriticalOpen: result.payload.data.summary.alerts?.criticalOpen ?? 0,
          approvalsPending: result.payload.data.summary.approvals?.pending ?? 0,
          billingOverdueCount: result.payload.data.summary.billing?.overdueCount ?? 0,
          generatedAt: result.payload.data.timestamp ?? new Date().toISOString(),
          healthStatus: "ok",
          service: "api.flow",
          workspaceId: config.workspaceId
        }
      };
    }
  };
}

async function fetchResource<T>(
  fetchImpl: typeof globalThis.fetch,
  flowApiBase: string,
  path: string,
  workspaceId: string,
  requestId: string
): Promise<{ payload?: DashApiEnvelope<T>; response: Response }> {
  const response = await fetchImpl(new URL(path, flowApiBase), {
    headers: {
      accept: "application/json",
      "x-request-id": requestId,
      "x-workspace-id": workspaceId
    }
  });

  let payload: DashApiEnvelope<T> | undefined;
  try {
    payload = (await response.json()) as DashApiEnvelope<T>;
  } catch {
    payload = undefined;
  }

  return {
    payload,
    response
  };
}

async function postResource<T>(
  fetchImpl: typeof globalThis.fetch,
  flowApiBase: string,
  path: string,
  workspaceId: string,
  requestId: string,
  actor: string
): Promise<{ payload?: DashApiEnvelope<T>; response: Response }> {
  const response = await fetchImpl(new URL(path, flowApiBase), {
    headers: {
      accept: "application/json",
      "content-type": "application/json; charset=utf-8",
      "x-actor-id": actor,
      "x-request-id": requestId,
      "x-workspace-id": workspaceId
    },
    method: "POST"
  });

  let payload: DashApiEnvelope<T> | undefined;
  try {
    payload = (await response.json()) as DashApiEnvelope<T>;
  } catch {
    payload = undefined;
  }

  return {
    payload,
    response
  };
}

async function runFlowAction(
  fetchImpl: typeof globalThis.fetch,
  flowApiBase: string,
  path: string,
  workspaceId: string,
  requestId: string,
  actor: string,
  actionLabel: string
): Promise<DashFlowActionFetchResult> {
  const result = await postResource<FlowActionPayload>(
    fetchImpl,
    flowApiBase,
    path,
    workspaceId,
    requestId,
    actor
  );

  if (!result.response.ok || result.payload?.ok !== true || !result.payload.data?.result) {
    return buildErrorResult(
      result,
      requestId,
      "FLOW_API_ERROR",
      `Flow API returned ${result.response.status} while trying to ${actionLabel}.`
    );
  }

  return {
    ok: true,
    requestId: resolveRequestId(result.payload, requestId),
    result: result.payload.data.result,
    statusCode: result.response.status
  };
}

function buildErrorResult<T extends DashApiFetchBase>(
  result: { payload?: DashApiEnvelope<unknown>; response: Response },
  requestId: string,
  defaultCode: string,
  defaultMessage: string
): T {
  return {
    error: {
      code: result.payload?.error?.code ?? defaultCode,
      message: result.payload?.error?.message ?? defaultMessage
    },
    ok: false,
    requestId: resolveRequestId(result.payload, requestId),
    statusCode: result.response.status
  } as T;
}

function resolveRequestId(payload: DashApiEnvelope<unknown> | undefined, fallback: string): string {
  return payload?.meta?.request_id ?? fallback;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
