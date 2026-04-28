import { nowIso } from "./utils";

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

function parseJson(value: unknown): Record<string, unknown> {
  if (typeof value !== "string" || !value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
}

export type ReconciliationCaseType =
  | "amount_mismatch"
  | "missing_provider_event"
  | "missing_ledger_entry"
  | "duplicate_payment"
  | "orphan_webhook"
  | "settlement_discrepancy"
  | "refund_mismatch"
  | "manual_investigation";

export type ReconciliationCaseStatus = "open" | "investigating" | "resolved" | "escalated" | "closed";
export type ReconciliationSeverity = "low" | "medium" | "high" | "critical";

export interface ReconciliationCase {
  id: string;
  case_code: string;
  case_type: ReconciliationCaseType;
  case_status: ReconciliationCaseStatus;
  severity: ReconciliationSeverity;
  payment_intent_id: string | null;
  provider_code: string | null;
  provider_order_id: string | null;
  ledger_transfer_id: string | null;
  expected_amount: number | null;
  actual_amount: number | null;
  currency: string;
  discrepancy_amount: number | null;
  description: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ReconciliationCaseDetail extends ReconciliationCase {
  evidence_json: Record<string, unknown>;
}

export async function getReconciliationCaseById(
  db: D1Database,
  caseId: string
): Promise<ReconciliationCaseDetail | null> {
  const row = await db
    .prepare(
      `SELECT
         id, case_code, case_type, case_status, severity,
         payment_intent_id, provider_code, provider_order_id, ledger_transfer_id,
         expected_amount, actual_amount, currency, discrepancy_amount,
         description, resolution_notes, evidence_json,
         created_at, updated_at, resolved_at
       FROM reconciliation_cases
       WHERE id = ?1
       LIMIT 1`
    )
    .bind(caseId)
    .first<{
      id: string;
      case_code: string;
      case_type: ReconciliationCaseType;
      case_status: ReconciliationCaseStatus;
      severity: ReconciliationSeverity;
      payment_intent_id: string | null;
      provider_code: string | null;
      provider_order_id: string | null;
      ledger_transfer_id: string | null;
      expected_amount: number | null;
      actual_amount: number | null;
      currency: string;
      discrepancy_amount: number | null;
      description: string;
      resolution_notes: string | null;
      evidence_json: string | null;
      created_at: string;
      updated_at: string;
      resolved_at: string | null;
    }>();

  if (!row) return null;

  return {
    ...row,
    evidence_json: parseJson(row.evidence_json)
  };
}

export interface OpenReconciliationCaseInput {
  tenantId: string;
  caseType: ReconciliationCaseType;
  severity: ReconciliationSeverity;
  paymentIntentId?: string;
  providerCode?: string;
  providerOrderId?: string;
  ledgerTransferId?: string;
  expectedAmount?: number;
  actualAmount?: number;
  currency: string;
  description: string;
  evidence?: Record<string, unknown>;
  openedByType?: string;
  openedById?: string;
}

export async function openReconciliationCase(
  db: D1Database,
  input: OpenReconciliationCaseInput
): Promise<{ id: string; caseCode: string }> {
  const id = randomId("rc");
  const caseCode = `RC-${Date.now().toString(36).toUpperCase()}-${id.slice(-6).toUpperCase()}`;
  const now = nowIso();
  const discrepancy =
    input.expectedAmount != null && input.actualAmount != null
      ? input.expectedAmount - input.actualAmount
      : null;

  await db
    .prepare(
      `INSERT INTO reconciliation_cases (
        id, tenant_id, case_code, case_type, case_status, severity,
        payment_intent_id, provider_code, provider_order_id, ledger_transfer_id,
        expected_amount, actual_amount, currency, discrepancy_amount,
        description, resolution_notes,
        opened_by_type, opened_by_id, resolved_by_type, resolved_by_id,
        evidence_json, created_at, updated_at, resolved_at
      ) VALUES (?1, ?2, ?3, ?4, 'open', ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, NULL, ?15, ?16, NULL, NULL, ?17, ?18, ?19, NULL)`
    )
    .bind(
      id,
      input.tenantId,
      caseCode,
      input.caseType,
      input.severity,
      input.paymentIntentId || null,
      input.providerCode || null,
      input.providerOrderId || null,
      input.ledgerTransferId || null,
      input.expectedAmount ?? null,
      input.actualAmount ?? null,
      input.currency,
      discrepancy,
      input.description,
      input.openedByType || "system",
      input.openedById || "pay.iai.one",
      serializeJson(input.evidence),
      now,
      now
    )
    .run();

  return { id, caseCode };
}

export async function resolveReconciliationCase(
  db: D1Database,
  caseId: string,
  input: {
    resolutionNotes: string;
    resolvedByType?: string;
    resolvedById?: string;
  }
): Promise<void> {
  const now = nowIso();
  await db
    .prepare(
      `UPDATE reconciliation_cases
       SET case_status = 'resolved',
           resolution_notes = ?2,
           resolved_by_type = ?3,
           resolved_by_id = ?4,
           resolved_at = ?5,
           updated_at = ?6
       WHERE id = ?1 AND case_status IN ('open', 'investigating')`
    )
    .bind(
      caseId,
      input.resolutionNotes,
      input.resolvedByType || "system",
      input.resolvedById || "pay.iai.one",
      now,
      now
    )
    .run();
}

export async function escalateReconciliationCase(
  db: D1Database,
  caseId: string,
  reason: string
): Promise<void> {
  const now = nowIso();
  await db
    .prepare(
      `UPDATE reconciliation_cases
       SET case_status = 'escalated', updated_at = ?2,
           resolution_notes = COALESCE(resolution_notes || ' | ', '') || ?3
       WHERE id = ?1 AND case_status IN ('open', 'investigating')`
    )
    .bind(caseId, now, `Escalated: ${reason}`)
    .run();
}

export async function listOpenReconciliationCases(
  db: D1Database,
  tenantId: string,
  limit = 50
): Promise<ReconciliationCase[]> {
  const result = await db
    .prepare(
      `SELECT
        id, case_code, case_type, case_status, severity,
        payment_intent_id, provider_code, provider_order_id, ledger_transfer_id,
        expected_amount, actual_amount, currency, discrepancy_amount,
        description, resolution_notes, created_at, updated_at, resolved_at
       FROM reconciliation_cases
       WHERE tenant_id = ?1 AND case_status IN ('open', 'investigating', 'escalated')
       ORDER BY
         CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         created_at DESC
       LIMIT ?2`
    )
    .bind(tenantId, limit)
    .all<ReconciliationCase>();

  return result.results || [];
}

export async function listReconciliationCasesForInvestigation(
  db: D1Database,
  input: {
    tenantId?: string;
    paymentIntentId?: string;
    refundId?: string;
    status?: ReconciliationCaseStatus;
    limit?: number;
  }
): Promise<ReconciliationCaseDetail[]> {
  const predicates: string[] = [];
  const bindValues: Array<string | number> = [];
  let bindIndex = 1;

  if (input.tenantId) {
    predicates.push(`tenant_id = ?${bindIndex}`);
    bindValues.push(input.tenantId);
    bindIndex += 1;
  }

  if (input.paymentIntentId) {
    predicates.push(`payment_intent_id = ?${bindIndex}`);
    bindValues.push(input.paymentIntentId);
    bindIndex += 1;
  }

  if (input.refundId) {
    predicates.push(`json_extract(evidence_json, '$.refund_id') = ?${bindIndex}`);
    bindValues.push(input.refundId);
    bindIndex += 1;
  }

  if (input.status) {
    predicates.push(`case_status = ?${bindIndex}`);
    bindValues.push(input.status);
    bindIndex += 1;
  }

  if (predicates.length === 0) return [];

  const limit = Math.max(1, Math.min(input.limit || 50, 200));
  const whereClause = predicates.join(" AND ");

  const result = await db
    .prepare(
      `SELECT
         id, case_code, case_type, case_status, severity,
         payment_intent_id, provider_code, provider_order_id, ledger_transfer_id,
         expected_amount, actual_amount, currency, discrepancy_amount,
         description, resolution_notes, evidence_json,
         created_at, updated_at, resolved_at
       FROM reconciliation_cases
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${limit}`
    )
    .bind(...bindValues)
    .all<{
      id: string;
      case_code: string;
      case_type: ReconciliationCaseType;
      case_status: ReconciliationCaseStatus;
      severity: ReconciliationSeverity;
      payment_intent_id: string | null;
      provider_code: string | null;
      provider_order_id: string | null;
      ledger_transfer_id: string | null;
      expected_amount: number | null;
      actual_amount: number | null;
      currency: string;
      discrepancy_amount: number | null;
      description: string;
      resolution_notes: string | null;
      evidence_json: string | null;
      created_at: string;
      updated_at: string;
      resolved_at: string | null;
    }>();

  return (result.results || []).map((row) => ({
    ...row,
    evidence_json: parseJson(row.evidence_json)
  }));
}
