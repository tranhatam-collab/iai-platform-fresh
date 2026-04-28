import {
  createSharedPayReadModelRuntime,
  createSharedPayReadModelRuntimeFromCoreData,
  type SharedPayCoreDataFile,
  type SharedPayReadModelRuntime,
  type SharedPayReadModelStatus
} from "./shared-read-model.js";
import {
  createSharedPayReadModelRuntimeFromLaneData,
  type SharedPayReconciliationLaneFile,
  type SharedPaySessionLaneFile
} from "./shared-read-model-producer.js";
import {
  createSharedPayAuthSourceFromData,
  type SharedPayAuthSource,
  type SharedPayAuthSourceFile
} from "./session-context.js";
import { payLogEvents, type PayLogger } from "./telemetry.js";

type SharedUpstreamMode = "lane_urls" | "read_model_url";

interface InternalSourceSnapshot {
  configured: boolean;
  emittedAt: string | null;
  fetchedAt: string | null;
  location: string | null;
}

interface SharedUpstreamSnapshot {
  authSource: SharedPayAuthSource | null;
  runtime: SharedPayReadModelRuntime;
  sources: {
    auth: InternalSourceSnapshot | null;
    readModel: InternalSourceSnapshot | null;
    reconciliation: InternalSourceSnapshot | null;
    session: InternalSourceSnapshot | null;
  };
}

export interface PaySharedUpstreamSourceStatus {
  ageMs: number | null;
  configured: boolean;
  emittedAt: string | null;
  fetchedAt: string | null;
  freshnessSource: "missing" | "payload_timestamp";
  location: string | null;
  stale: boolean;
}

export interface PaySharedUpstreamRuntimeStatus {
  activeReadMode: "shared_contract" | "shared_stub";
  configured: boolean;
  mode: SharedUpstreamMode;
  releaseGate: {
    checkedAt: string;
    ready: boolean;
    reasons: string[];
  };
  sources: {
    auth: PaySharedUpstreamSourceStatus | null;
    readModel: PaySharedUpstreamSourceStatus | null;
    reconciliation: PaySharedUpstreamSourceStatus | null;
    session: PaySharedUpstreamSourceStatus | null;
  };
  telemetry: {
    consecutiveRefreshFailures: number;
    lastError: string | null;
    lastRefreshAttemptAt: string | null;
    lastRefreshFailureAt: string | null;
    lastRefreshSuccessAt: string | null;
  };
}

export interface PaySharedUpstreamRuntimeManager {
  ensureFresh(reason?: string): Promise<void>;
  getAuthSource(): SharedPayAuthSource | null;
  getReleaseGate(): PaySharedUpstreamRuntimeStatus["releaseGate"];
  getSharedReadModelStatus(): SharedPayReadModelStatus;
  getStatus(): PaySharedUpstreamRuntimeStatus;
  getRuntime(): SharedPayReadModelRuntime;
}

export interface PaySharedUpstreamRuntimeOptions {
  authUrl?: string;
  fetchImpl: typeof globalThis.fetch;
  logger?: PayLogger;
  maxDataAgeMs?: number;
  readModelUrl?: string;
  reconciliationUrl?: string;
  refreshTtlMs?: number;
  requestHeaders?: Record<string, string>;
  sessionUrl?: string;
}

export function createPaySharedUpstreamRuntimeManager(
  options: PaySharedUpstreamRuntimeOptions
): PaySharedUpstreamRuntimeManager | null {
  const mode = resolveMode(options);
  if (!mode) {
    return null;
  }

  const refreshTtlMs = normalizeMs(options.refreshTtlMs, 30_000);
  const maxDataAgeMs = normalizeMs(options.maxDataAgeMs, 300_000);
  const emptyRuntime = createSharedPayReadModelRuntime({}, "upstream_runtime");
  const initialSources = {
    auth: createInitialSourceSnapshot(options.authUrl),
    readModel: createInitialSourceSnapshot(options.readModelUrl),
    reconciliation: createInitialSourceSnapshot(options.reconciliationUrl),
    session: createInitialSourceSnapshot(options.sessionUrl)
  };

  let inFlightRefresh: Promise<void> | null = null;
  let lastError: string | null = null;
  let lastRefreshAttemptAt: string | null = null;
  let lastRefreshFailureAt: string | null = null;
  let lastRefreshSuccessAt: string | null = null;
  let consecutiveRefreshFailures = 0;
  let snapshot: SharedUpstreamSnapshot | null = null;

  return {
    async ensureFresh(reason = "request") {
      const now = Date.now();
      if (
        lastRefreshAttemptAt &&
        now - Date.parse(lastRefreshAttemptAt) < refreshTtlMs
      ) {
        return;
      }

      if (inFlightRefresh) {
        await inFlightRefresh;
        return;
      }

      inFlightRefresh = refreshNow(reason).finally(() => {
        inFlightRefresh = null;
      });
      await inFlightRefresh;
    },
    getAuthSource() {
      const status = this.getStatus();
      if (!status.sources.auth?.configured) {
        return snapshot?.authSource ?? null;
      }
      return status.sources.auth.stale ? null : snapshot?.authSource ?? null;
    },
    getReleaseGate() {
      return this.getStatus().releaseGate;
    },
    getSharedReadModelStatus() {
      return snapshot?.runtime.status ?? emptyRuntime.status;
    },
    getStatus() {
      const sourceStatuses = {
        auth: toPublicSourceStatus(snapshot?.sources.auth ?? initialSources.auth, maxDataAgeMs),
        readModel: toPublicSourceStatus(snapshot?.sources.readModel ?? initialSources.readModel, maxDataAgeMs),
        reconciliation: toPublicSourceStatus(
          snapshot?.sources.reconciliation ?? initialSources.reconciliation,
          maxDataAgeMs
        ),
        session: toPublicSourceStatus(snapshot?.sources.session ?? initialSources.session, maxDataAgeMs)
      };
      const runtime = snapshot?.runtime ?? emptyRuntime;
      const readModelReady = isReadModelFresh(mode, sourceStatuses);
      const releaseGate = buildReleaseGate({
        authConfigured: Boolean(options.authUrl),
        checkedAt: new Date().toISOString(),
        mode,
        readModelReady,
        sharedReadModelStatus: runtime.status,
        sources: sourceStatuses
      });

      return {
        activeReadMode: readModelReady ? "shared_contract" : "shared_stub",
        configured: true,
        mode,
        releaseGate,
        sources: sourceStatuses,
        telemetry: {
          consecutiveRefreshFailures,
          lastError,
          lastRefreshAttemptAt,
          lastRefreshFailureAt,
          lastRefreshSuccessAt
        }
      };
    },
    getRuntime() {
      const status = this.getStatus();
      return status.activeReadMode === "shared_contract" && snapshot ? snapshot.runtime : emptyRuntime;
    }
  };

  async function refreshNow(reason: string): Promise<void> {
    const startedAt = new Date().toISOString();
    lastRefreshAttemptAt = startedAt;
    options.logger?.info(payLogEvents.sharedUpstreamRefreshStarted, {
      mode,
      reason
    });

    try {
      const refreshedSnapshot =
        mode === "read_model_url"
          ? await refreshFromReadModelUrl(options)
          : await refreshFromLaneUrls(options);
      snapshot = refreshedSnapshot;
      consecutiveRefreshFailures = 0;
      lastError = null;
      lastRefreshSuccessAt = new Date().toISOString();
      options.logger?.info(payLogEvents.sharedUpstreamRefreshSucceeded, {
        counts: refreshedSnapshot.runtime.status.counts,
        mode,
        reason,
        rolloutReadyForSharedOnly: refreshedSnapshot.runtime.status.rolloutReadyForSharedOnly
      });
    } catch (error) {
      consecutiveRefreshFailures += 1;
      lastError = error instanceof Error ? error.message : String(error);
      lastRefreshFailureAt = new Date().toISOString();
      options.logger?.warn(payLogEvents.sharedUpstreamRefreshFailed, {
        error: lastError,
        failures: consecutiveRefreshFailures,
        mode,
        reason
      });
    }
  }
}

async function refreshFromLaneUrls(
  options: PaySharedUpstreamRuntimeOptions
): Promise<SharedUpstreamSnapshot> {
  const [sessionRemote, reconciliationRemote, authRemote] = await Promise.all([
    options.sessionUrl ? fetchJsonSource<SharedPaySessionLaneFile>(options.fetchImpl, options.sessionUrl, options.requestHeaders) : Promise.resolve(null),
    options.reconciliationUrl
      ? fetchJsonSource<SharedPayReconciliationLaneFile>(
          options.fetchImpl,
          options.reconciliationUrl,
          options.requestHeaders
        )
      : Promise.resolve(null),
    options.authUrl ? fetchJsonSource<SharedPayAuthSourceFile>(options.fetchImpl, options.authUrl, options.requestHeaders) : Promise.resolve(null)
  ]);

  const runtime = createSharedPayReadModelRuntimeFromLaneData(
    {
      reconciliationLane: reconciliationRemote?.payload ?? null,
      sessionLane: sessionRemote?.payload ?? null
    },
    {
      filePath: null,
      source: "upstream_runtime"
    }
  );

  return {
    authSource: authRemote ? createSharedPayAuthSourceFromData(authRemote.payload) : null,
    runtime,
    sources: {
      auth: authRemote?.source ?? null,
      readModel: null,
      reconciliation: reconciliationRemote?.source ?? null,
      session: sessionRemote?.source ?? null
    }
  };
}

async function refreshFromReadModelUrl(
  options: PaySharedUpstreamRuntimeOptions
): Promise<SharedUpstreamSnapshot> {
  const [readModelRemote, authRemote] = await Promise.all([
    fetchJsonSource<SharedPayCoreDataFile>(
      options.fetchImpl,
      options.readModelUrl as string,
      options.requestHeaders
    ),
    options.authUrl ? fetchJsonSource<SharedPayAuthSourceFile>(options.fetchImpl, options.authUrl, options.requestHeaders) : Promise.resolve(null)
  ]);

  return {
    authSource: authRemote ? createSharedPayAuthSourceFromData(authRemote.payload) : null,
    runtime: createSharedPayReadModelRuntimeFromCoreData(readModelRemote.payload, {
      filePath: null,
      source: "upstream_runtime"
    }),
    sources: {
      auth: authRemote?.source ?? null,
      readModel: readModelRemote.source,
      reconciliation: null,
      session: null
    }
  };
}

async function fetchJsonSource<T>(
  fetchImpl: typeof globalThis.fetch,
  url: string,
  requestHeaders: Record<string, string> = {}
): Promise<{
  payload: T;
  source: InternalSourceSnapshot;
}> {
  const response = await fetchImpl(url, {
    headers: {
      accept: "application/json",
      "cache-control": "no-store",
      "user-agent": "iai-pay/0.0.0",
      ...requestHeaders
    }
  });
  if (!response.ok) {
    throw new Error(`Shared upstream source ${url} responded with HTTP ${response.status}.`);
  }

  const body = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`Shared upstream source ${url} returned invalid JSON.`);
  }

  const payload = unwrapPayload<T>(parsed);
  return {
    payload,
    source: {
      configured: true,
      emittedAt: extractFreshnessTimestamp(payload) ?? extractFreshnessTimestamp(parsed),
      fetchedAt: new Date().toISOString(),
      location: url
    }
  };
}

function unwrapPayload<T>(input: unknown): T {
  if (!input || typeof input !== "object") {
    return input as T;
  }

  const payloadCandidate = readNestedObject(input, ["data", "payload", "result"]);
  if (payloadCandidate && typeof payloadCandidate === "object" && "schema_version" in payloadCandidate) {
    return payloadCandidate as T;
  }

  return input as T;
}

function createInitialSourceSnapshot(location: string | undefined): InternalSourceSnapshot | null {
  if (!location) {
    return null;
  }

  return {
    configured: true,
    emittedAt: null,
    fetchedAt: null,
    location
  };
}

function toPublicSourceStatus(
  snapshot: InternalSourceSnapshot | null,
  maxDataAgeMs: number
): PaySharedUpstreamSourceStatus | null {
  if (!snapshot) {
    return null;
  }

  const ageMs =
    snapshot.emittedAt && Number.isFinite(Date.parse(snapshot.emittedAt))
      ? Math.max(0, Date.now() - Date.parse(snapshot.emittedAt))
      : null;

  return {
    ageMs,
    configured: snapshot.configured,
    emittedAt: snapshot.emittedAt,
    fetchedAt: snapshot.fetchedAt,
    freshnessSource: snapshot.emittedAt ? "payload_timestamp" : "missing",
    location: snapshot.location,
    stale: ageMs === null ? true : ageMs > maxDataAgeMs
  };
}

function buildReleaseGate(input: {
  authConfigured: boolean;
  checkedAt: string;
  mode: SharedUpstreamMode;
  readModelReady: boolean;
  sharedReadModelStatus: SharedPayReadModelStatus;
  sources: PaySharedUpstreamRuntimeStatus["sources"];
}): PaySharedUpstreamRuntimeStatus["releaseGate"] {
  const reasons: string[] = [];

  appendSourceGateReason(
    reasons,
    input.mode === "read_model_url" ? "read_model" : "session",
    input.mode === "read_model_url" ? input.sources.readModel : input.sources.session
  );
  if (input.mode === "lane_urls") {
    appendSourceGateReason(reasons, "reconciliation", input.sources.reconciliation);
  }
  if (input.authConfigured) {
    appendSourceGateReason(reasons, "auth", input.sources.auth);
  }
  if (!input.readModelReady) {
    reasons.push("shared_upstream_not_fresh");
  }
  if (!input.sharedReadModelStatus.rolloutReadyForSharedOnly) {
    reasons.push("shared_read_model_incomplete");
  }

  return {
    checkedAt: input.checkedAt,
    ready: reasons.length === 0,
    reasons: [...new Set(reasons)]
  };
}

function appendSourceGateReason(
  reasons: string[],
  label: "auth" | "read_model" | "reconciliation" | "session",
  source: PaySharedUpstreamSourceStatus | null
): void {
  if (!source?.configured) {
    return;
  }
  if (!source.fetchedAt) {
    reasons.push(`${label}_source_unavailable`);
    return;
  }
  if (!source.emittedAt) {
    reasons.push(`${label}_source_missing_freshness`);
    return;
  }
  if (source.stale) {
    reasons.push(`${label}_source_stale`);
  }
}

function isReadModelFresh(
  mode: SharedUpstreamMode,
  sources: PaySharedUpstreamRuntimeStatus["sources"]
): boolean {
  if (mode === "read_model_url") {
    return Boolean(sources.readModel?.configured && !sources.readModel.stale && sources.readModel.emittedAt);
  }

  const requiredSources = [sources.session, sources.reconciliation].filter(
    (source): source is PaySharedUpstreamSourceStatus => Boolean(source?.configured)
  );
  if (requiredSources.length === 0) {
    return false;
  }

  return requiredSources.every((source) => !source.stale && Boolean(source.emittedAt));
}

function extractFreshnessTimestamp(input: unknown): string | null {
  const value = findFirstStringByKeys(input, [
    "emitted_at",
    "generated_at",
    "updated_at",
    "last_updated_at",
    "refreshed_at"
  ]);
  return value && Number.isFinite(Date.parse(value)) ? value : null;
}

function findFirstStringByKeys(input: unknown, keys: string[]): string | null {
  const match = findFirstValueByKeys(input, new Set(keys));
  if (typeof match !== "string") {
    return null;
  }

  const normalized = match.trim();
  return normalized.length > 0 ? normalized : null;
}

function findFirstValueByKeys(input: unknown, keys: Set<string>): unknown {
  if (!input || typeof input !== "object") {
    return null;
  }

  const queue: unknown[] = [input];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") {
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      if (keys.has(key) && value !== undefined && value !== null) {
        return value;
      }
      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
}

function readNestedObject(input: unknown, keys: string[]): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  for (const key of keys) {
    const value = (input as Record<string, unknown>)[key];
    if (value && typeof value === "object") {
      return value;
    }
  }

  return null;
}

function normalizeMs(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && typeof value === "number" && value > 0 ? Math.trunc(value) : fallback;
}

function resolveMode(options: PaySharedUpstreamRuntimeOptions): SharedUpstreamMode | null {
  if (options.readModelUrl) {
    return "read_model_url";
  }
  if (options.sessionUrl || options.reconciliationUrl) {
    return "lane_urls";
  }
  return null;
}
