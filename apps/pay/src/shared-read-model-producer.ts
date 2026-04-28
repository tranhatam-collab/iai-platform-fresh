import { readFileSync } from "node:fs";
import { isAbsolute, resolve as resolvePath } from "node:path";
import type { OpsArea } from "./demo-data.js";
import type { PayHomeRouteRefs } from "./read-model.js";
import {
  createSharedPayReadModelRuntimeFromCoreData,
  type SharedPayCoreDataFile,
  type SharedPayCoreOpsSnapshotRecord,
  type SharedPayCoreReceiptRecord,
  type SharedPayCoreSessionRecord,
  type SharedPayReadModelRuntime
} from "./shared-read-model.js";

export interface SharedPaySessionLaneFile {
  emitted_at?: string;
  home_route_refs?: PayHomeRouteRefs;
  payment_sessions?: Record<string, SharedPayCoreSessionRecord>;
  receipts?: Record<string, SharedPayCoreReceiptRecord>;
  schema_version: "iai.pay.session-lane.v1";
}

export interface SharedPayReconciliationLaneFile {
  emitted_at?: string;
  ops?: Partial<Record<OpsArea, SharedPayCoreOpsSnapshotRecord>>;
  schema_version: "iai.pay.reconciliation-lane.v1";
}

export interface SharedPayLaneProducerOptions {
  reconciliationFilePath?: string;
  sessionFilePath?: string;
}

export function createSharedPayReadModelRuntimeFromLaneFiles(
  options: SharedPayLaneProducerOptions
): SharedPayReadModelRuntime {
  const sessionLane = options.sessionFilePath ? readSessionLaneFile(options.sessionFilePath) : null;
  const reconciliationLane = options.reconciliationFilePath
    ? readReconciliationLaneFile(options.reconciliationFilePath)
    : null;
  const filePath = [options.sessionFilePath, options.reconciliationFilePath]
    .filter((value): value is string => Boolean(value))
    .map((value) => resolveFilePath(value))
    .join(", ");

  return createSharedPayReadModelRuntimeFromLaneData(
    {
      reconciliationLane,
      sessionLane
    },
    {
      filePath: filePath || null,
      source: "lane_sources"
    }
  );
}

export function createSharedPayReadModelRuntimeFromLaneData(
  input: {
    reconciliationLane?: SharedPayReconciliationLaneFile | null;
    sessionLane?: SharedPaySessionLaneFile | null;
  },
  options: {
    filePath: string | null;
    source: "lane_sources" | "upstream_runtime";
  }
): SharedPayReadModelRuntime {
  const producedData: SharedPayCoreDataFile = {
    emitted_at:
      input.sessionLane?.emitted_at ??
      input.reconciliationLane?.emitted_at,
    schema_version: "iai.pay.shared-read-model.v1",
    home_route_refs: input.sessionLane?.home_route_refs,
    ops: input.reconciliationLane?.ops ?? {},
    payment_sessions: input.sessionLane?.payment_sessions ?? {},
    receipts: input.sessionLane?.receipts ?? {}
  };

  return createSharedPayReadModelRuntimeFromCoreData(producedData, {
    filePath: options.filePath,
    source: options.source
  });
}

function readSessionLaneFile(filePath: string): SharedPaySessionLaneFile {
  const parsed = JSON.parse(readFileSync(resolveFilePath(filePath), "utf8")) as SharedPaySessionLaneFile;

  if (parsed.schema_version !== "iai.pay.session-lane.v1") {
    throw new Error(`Unsupported shared pay session-lane schema: ${parsed.schema_version}`);
  }

  return parsed;
}

function readReconciliationLaneFile(filePath: string): SharedPayReconciliationLaneFile {
  const parsed = JSON.parse(
    readFileSync(resolveFilePath(filePath), "utf8")
  ) as SharedPayReconciliationLaneFile;

  if (parsed.schema_version !== "iai.pay.reconciliation-lane.v1") {
    throw new Error(
      `Unsupported shared pay reconciliation-lane schema: ${parsed.schema_version}`
    );
  }

  return parsed;
}

function resolveFilePath(filePath: string): string {
  return isAbsolute(filePath) ? filePath : resolvePath(process.cwd(), filePath);
}
