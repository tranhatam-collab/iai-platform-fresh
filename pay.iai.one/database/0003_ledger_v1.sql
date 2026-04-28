-- pay.iai.one ledger schema v1
-- Source of truth: ledger_entries
-- Read model only: wallet_balances
-- This migration creates only schema and guardrails.
-- Posting logic belongs to B2/B3, not this migration.

CREATE TABLE IF NOT EXISTS wallet_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  wallet_owner_type TEXT NOT NULL,
  wallet_owner_ref_id TEXT NOT NULL,
  wallet_code TEXT NOT NULL,
  wallet_label TEXT NOT NULL,
  wallet_status TEXT NOT NULL DEFAULT 'active',
  default_currency TEXT NOT NULL DEFAULT 'VND',
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE (tenant_id, wallet_owner_type, wallet_owner_ref_id, wallet_code),
  CHECK (wallet_status IN ('draft', 'active', 'frozen', 'closed')),
  CHECK (wallet_owner_type IN ('platform', 'tenant', 'site', 'customer', 'treasury', 'provider'))
);

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  wallet_account_id TEXT,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_kind TEXT NOT NULL,
  balance_bucket TEXT NOT NULL DEFAULT 'n_a',
  normal_balance_side TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  scope_ref_id TEXT,
  provider_code TEXT,
  currency TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'active',
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (wallet_account_id) REFERENCES wallet_accounts(id),
  UNIQUE (tenant_id, account_code, currency),
  CHECK (account_kind IN ('asset', 'liability', 'equity', 'income', 'expense', 'memo')),
  CHECK (balance_bucket IN ('available', 'pending', 'reserved', 'settled', 'n_a')),
  CHECK (normal_balance_side IN ('debit', 'credit')),
  CHECK (account_status IN ('draft', 'active', 'archived')),
  CHECK (scope_type IN ('platform', 'tenant', 'site', 'customer', 'wallet', 'provider', 'treasury', 'system'))
);

CREATE TABLE IF NOT EXISTS ledger_transfers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  transfer_code TEXT NOT NULL,
  transfer_type TEXT NOT NULL,
  transfer_status TEXT NOT NULL DEFAULT 'draft',
  currency TEXT NOT NULL,
  source_type TEXT,
  source_ref_id TEXT,
  idempotency_key TEXT,
  reference_code TEXT,
  description TEXT,
  metadata_json TEXT,
  effective_at TEXT NOT NULL,
  posted_at TEXT,
  reversed_at TEXT,
  reversed_by_transfer_id TEXT,
  created_by_type TEXT,
  created_by_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (reversed_by_transfer_id) REFERENCES ledger_transfers(id),
  UNIQUE (tenant_id, transfer_code),
  UNIQUE (tenant_id, transfer_type, idempotency_key),
  CHECK (transfer_status IN ('draft', 'posted', 'reversed')),
  CHECK (transfer_type IN (
    'payment_capture',
    'payment_refund',
    'payment_reversal',
    'payment_fee',
    'manual_adjustment',
    'opening_balance',
    'settlement'
  ))
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  transfer_id TEXT NOT NULL,
  ledger_account_id TEXT NOT NULL,
  sequence_no INTEGER NOT NULL,
  entry_side TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (transfer_id) REFERENCES ledger_transfers(id),
  FOREIGN KEY (ledger_account_id) REFERENCES ledger_accounts(id),
  UNIQUE (transfer_id, sequence_no),
  CHECK (entry_side IN ('debit', 'credit')),
  CHECK (amount > 0)
);

CREATE TABLE IF NOT EXISTS wallet_balances (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  wallet_account_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  available_amount INTEGER NOT NULL DEFAULT 0,
  pending_amount INTEGER NOT NULL DEFAULT 0,
  reserved_amount INTEGER NOT NULL DEFAULT 0,
  settled_amount INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (wallet_account_id) REFERENCES wallet_accounts(id),
  UNIQUE (wallet_account_id, currency),
  CHECK (available_amount >= 0),
  CHECK (pending_amount >= 0),
  CHECK (reserved_amount >= 0),
  CHECK (settled_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_wallet_accounts_owner
  ON wallet_accounts(tenant_id, wallet_owner_type, wallet_owner_ref_id, wallet_status);

CREATE INDEX IF NOT EXISTS idx_wallet_accounts_status
  ON wallet_accounts(tenant_id, wallet_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_accounts_scope
  ON ledger_accounts(tenant_id, scope_type, scope_ref_id, currency);

CREATE INDEX IF NOT EXISTS idx_ledger_accounts_wallet
  ON ledger_accounts(wallet_account_id, balance_bucket, currency);

CREATE INDEX IF NOT EXISTS idx_ledger_transfers_source
  ON ledger_transfers(tenant_id, source_type, source_ref_id, transfer_type);

CREATE INDEX IF NOT EXISTS idx_ledger_transfers_status
  ON ledger_transfers(tenant_id, transfer_status, effective_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_created
  ON ledger_entries(ledger_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_tenant_currency
  ON ledger_entries(tenant_id, currency, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_balances_tenant_currency
  ON wallet_balances(tenant_id, currency, updated_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_ledger_entries_no_update
BEFORE UPDATE ON ledger_entries
BEGIN
  SELECT RAISE(ABORT, 'ledger_entries are immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_ledger_entries_no_delete
BEFORE DELETE ON ledger_entries
BEGIN
  SELECT RAISE(ABORT, 'ledger_entries cannot be deleted');
END;
