export interface FlowFilterQuery {
  status?: string | string[];
  severity?: string | string[];
  overdueOnly?: boolean;
  workspaceId?: string;
}

function normalizeListValue(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];
  const normalized = values.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  return normalized.length > 0 ? normalized.join(",") : undefined;
}

export function buildFlowContractSearchParams(query: FlowFilterQuery): URLSearchParams {
  const params = new URLSearchParams();

  const status = normalizeListValue(query.status);
  if (status) {
    params.set("status", status);
  }

  const severity = normalizeListValue(query.severity);
  if (severity) {
    params.set("severity", severity);
  }

  if (query.overdueOnly !== undefined) {
    params.set("overdue_only", String(query.overdueOnly));
  }

  if (query.workspaceId) {
    params.set("workspace_id", query.workspaceId);
  }

  return params;
}

export function buildFlowContractUrl(
  baseUrl: string,
  pathname: string,
  query: FlowFilterQuery = {}
): string {
  const url = new URL(pathname, baseUrl);
  const params = buildFlowContractSearchParams(query);
  url.search = params.toString();
  return url.toString();
}
