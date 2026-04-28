-- pay.iai.one reconciliation case model
-- Tracks mismatches between provider state and ledger state for investigation.

CREATE TABLE IF NOT EXISTS reconciliation_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  case_code TEXT NOT NULL UNIQUE,
  case_type TEXT NOT NULL,
  case_status TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'medium',
  payment_intent_id TEXT,
  provider_code TEXT,
  provider_order_id TEXT,
  ledger_transfer_id TEXT,
  expected_amount INTEGER,
  actual_amount INTEGER,
  currency TEXT NOT NULL DEFAULT 'VND',
  discrepancy_amount INTEGER,
  description TEXT NOT NULL,
  resolution_notes TEXT,
  opened_by_type TEXT NOT NULL DEFAULT 'system',
  opened_by_id TEXT,
  resolved_by_type TEXT,
  resolved_by_id TEXT,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id),
  FOREIGN KEY (ledger_transfer_id) REFERENCES ledger_transfers(id),
  CHECK (case_type IN (
    'amount_mismatch',
    'missing_provider_event',
    'missing_ledger_entry',
    'duplicate_payment',
    'orphan_webhook',
    'settlement_discrepancy',
    'refund_mismatch',
    'manual_investigation'
  )),
  CHECK (case_status IN ('open', 'investigating', 'resolved', 'escalated', 'closed')),
  CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_cases_status
  ON reconciliation_cases(tenant_id, case_status, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_cases_payment
  ON reconciliation_cases(payment_intent_id, case_status);

CREATE INDEX IF NOT EXISTS idx_reconciliation_cases_provider
  ON reconciliation_cases(provider_code, provider_order_id, case_status);
