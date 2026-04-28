# pay.iai.one B1 ledger schema v1 migration plan

Status: proposed
Owner: pay.iai.one
Updated: 2026-04-17

## Purpose

This document is the detailed migration plan for:

`B1: Define ledger schema v1 and foundational account tables`

It is written so the backend team can implement the first ledger migration immediately after Epic A is materially stable.

## B1 objective

Create the minimum durable ledger foundation so `pay.iai.one` can:

- journal money movements instead of trusting provider callback state alone
- support VND first and USD next without redesign
- keep wallet-like balance read models separate from the source-of-truth journal
- prepare cleanly for B2, B3, and B4

## Scope for B1 only

In scope:

- schema design
- tables
- indexes
- DB-enforced constraints
- immutability guardrails
- acceptance SQL

Out of scope:

- payment posting logic
- refund posting logic
- payout posting logic
- historical backfill
- public wallet balances

## Migration strategy

Recommended new migration file:

- `database/0003_ledger_v1.sql`

Optional split if the team wants smaller deploy units:

- `database/0003_ledger_v1_tables.sql`
- `database/0004_ledger_v1_guardrails.sql`

Preferred rule:

- ship schema first
- ship posting logic in B2
- do not mix ledger schema with payout schema in the same migration

## Core design principle

`ledger_entries` are the source of truth.

`wallet_balances` are a read model derived from the journal.

That means:

1. never trust `wallet_balances` as the canonical money source
2. never mutate finalized journal rows in place
3. corrections and refunds create new journal rows
4. provider events must map to journal posting logic later, not directly to balances

## Proposed tables

## 1) `wallet_accounts`

Purpose:

- identify a wallet owner or balance container for a tenant, customer, site, treasury bucket, or later merchant entity

Recommended columns:

```sql
CREATE TABLE wallet_accounts (
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
```

Notes:

- `wallet_owner_ref_id` is polymorphic by design
- do not over-model merchant entities in B1 if that table does not exist yet

## 2) `ledger_accounts`

Purpose:

- represent double-entry accounts for wallet states, clearing, reserves, fees, and treasury

Recommended columns:

```sql
CREATE TABLE ledger_accounts (
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
```

Notes:

- `balance_bucket` lets the same wallet concept map to multiple account states
- `wallet_account_id` is optional because some accounts are treasury or provider clearing accounts, not user-facing wallet rows

## 3) `ledger_transfers`

Purpose:

- serve as the journal header for a balanced posting batch

Recommended columns:

```sql
CREATE TABLE ledger_transfers (
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
```

Notes:

- SQLite unique constraints allow multiple `NULL` values, so `idempotency_key` can remain nullable
- `transfer_type` list is intentionally short in v1

## 4) `ledger_entries`

Purpose:

- store journal lines belonging to a transfer

Recommended columns:

```sql
CREATE TABLE ledger_entries (
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
```

Notes:

- `amount` uses integer minor units, same as existing payment tables
- one transfer must later contain balanced debit and credit totals

## 5) `wallet_balances`

Purpose:

- materialized balance read model by wallet and currency

Recommended columns:

```sql
CREATE TABLE wallet_balances (
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
```

Notes:

- this table is not the accounting source of truth
- `version` is for safe recomputation or optimistic refresh later

## Recommended index plan

Use explicit names so acceptance SQL can verify them.

```sql
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
```

## Recommended guardrail triggers

If the team keeps B1 as schema-only, these triggers are still worth shipping now.

### 1) `ledger_entries` immutable

```sql
CREATE TRIGGER IF NOT EXISTS trg_ledger_entries_no_update
BEFORE UPDATE ON ledger_entries
BEGIN
  SELECT RAISE(ABORT, 'ledger_entries are immutable');
END;
```

```sql
CREATE TRIGGER IF NOT EXISTS trg_ledger_entries_no_delete
BEFORE DELETE ON ledger_entries
BEGIN
  SELECT RAISE(ABORT, 'ledger_entries cannot be deleted');
END;
```

### 2) `ledger_transfers` status guard

Recommendation:

- allow normal updates while `transfer_status = 'draft'`
- do not allow arbitrary update after `posted`, except controlled reversal metadata

If the team wants to defer this trigger to B2, document that explicitly.

## Recommended account taxonomy for seeding later

Do not seed everything inside the migration itself.

Seed accounts through bootstrap code or a controlled seed script after the schema exists.

Minimum account families to support:

- wallet available
- wallet pending
- wallet reserved
- wallet settled
- provider clearing
- provider receivable
- provider payable
- fee revenue
- refund reserve
- manual adjustment

Suggested account code pattern:

```txt
wallet.available
wallet.pending
wallet.reserved
wallet.settled
provider.clearing
provider.receivable
provider.payable
revenue.fee
liability.refund_reserve
adjustment.manual
```

Per-wallet or per-scope differentiation can happen via:

- `wallet_account_id`
- `scope_type`
- `scope_ref_id`
- `currency`

## Invariants

## DB-enforced in B1

These should be enforced directly by schema or triggers:

1. positive journal amounts only
2. one `wallet_balances` row per wallet and currency
3. one `ledger_entries.sequence_no` per transfer
4. one `ledger_transfers.transfer_code` per tenant
5. immutable `ledger_entries`
6. no negative materialized wallet balance buckets

## App-enforced in B1, SQL-verified in acceptance

These are best enforced in posting logic and verified by SQL:

1. each posted transfer is balanced:
   - debit total = credit total
2. all entries in one transfer share the same currency as the transfer
3. all entries in one transfer belong to the same tenant as the transfer
4. only active ledger accounts are used for new postings
5. wallet balance read model matches journaled state

## Explicit non-invariants for B1

These are intentionally not solved in B1:

1. historical backfill
2. payout accounting
3. FX accounting
4. chargeback lifecycle accounting
5. crypto ledgering

## Migration order inside `0003_ledger_v1.sql`

Recommended order:

1. `wallet_accounts`
2. `ledger_accounts`
3. `ledger_transfers`
4. `ledger_entries`
5. `wallet_balances`
6. indexes
7. guardrail triggers

## Compatibility with current schema

The new ledger schema must link cleanly to existing tables:

- `payment_intents`
- `payment_attempts`
- `provider_events`
- `refunds`
- `audit_logs`

Recommended linking approach in v1:

- use `ledger_transfers.source_type` and `source_ref_id`
- keep detailed external references in `metadata_json`
- do not add hard foreign keys to every upstream table in B1

That keeps the journal generic and avoids over-coupling.

## Acceptance SQL

## A. Table existence

```sql
SELECT name
FROM sqlite_master
WHERE type = 'table'
  AND name IN (
    'wallet_accounts',
    'ledger_accounts',
    'ledger_transfers',
    'ledger_entries',
    'wallet_balances'
  )
ORDER BY name;
```

Expected count:

```sql
SELECT COUNT(*) AS expected_table_count
FROM sqlite_master
WHERE type = 'table'
  AND name IN (
    'wallet_accounts',
    'ledger_accounts',
    'ledger_transfers',
    'ledger_entries',
    'wallet_balances'
  );
```

Expected:

- `5`

## B. Index existence

```sql
SELECT name
FROM sqlite_master
WHERE type = 'index'
  AND name IN (
    'idx_wallet_accounts_owner',
    'idx_wallet_accounts_status',
    'idx_ledger_accounts_scope',
    'idx_ledger_accounts_wallet',
    'idx_ledger_transfers_source',
    'idx_ledger_transfers_status',
    'idx_ledger_entries_account_created',
    'idx_ledger_entries_tenant_currency',
    'idx_wallet_balances_tenant_currency'
  )
ORDER BY name;
```

Expected count:

```sql
SELECT COUNT(*) AS expected_index_count
FROM sqlite_master
WHERE type = 'index'
  AND name IN (
    'idx_wallet_accounts_owner',
    'idx_wallet_accounts_status',
    'idx_ledger_accounts_scope',
    'idx_ledger_accounts_wallet',
    'idx_ledger_transfers_source',
    'idx_ledger_transfers_status',
    'idx_ledger_entries_account_created',
    'idx_ledger_entries_tenant_currency',
    'idx_wallet_balances_tenant_currency'
  );
```

Expected:

- `9`

## C. Column inspection

```sql
PRAGMA table_info(wallet_accounts);
PRAGMA table_info(ledger_accounts);
PRAGMA table_info(ledger_transfers);
PRAGMA table_info(ledger_entries);
PRAGMA table_info(wallet_balances);
```

Use this to confirm required columns and defaults exist.

## D. Read-only invariant checks

These should return zero rows after migration and remain useful later when data exists.

### D1. Transfers with no entries

```sql
SELECT lt.id, lt.transfer_code
FROM ledger_transfers lt
LEFT JOIN ledger_entries le ON le.transfer_id = lt.id
GROUP BY lt.id, lt.transfer_code
HAVING COUNT(le.id) = 0;
```

### D2. Unbalanced transfers

```sql
SELECT
  le.transfer_id,
  SUM(CASE WHEN le.entry_side = 'debit' THEN le.amount ELSE 0 END) AS debit_total,
  SUM(CASE WHEN le.entry_side = 'credit' THEN le.amount ELSE 0 END) AS credit_total
FROM ledger_entries le
GROUP BY le.transfer_id
HAVING debit_total <> credit_total;
```

### D3. Entry currency mismatch against transfer

```sql
SELECT le.id, le.transfer_id, le.currency AS entry_currency, lt.currency AS transfer_currency
FROM ledger_entries le
JOIN ledger_transfers lt ON lt.id = le.transfer_id
WHERE le.currency <> lt.currency;
```

### D4. Entry tenant mismatch against transfer

```sql
SELECT le.id, le.transfer_id, le.tenant_id AS entry_tenant, lt.tenant_id AS transfer_tenant
FROM ledger_entries le
JOIN ledger_transfers lt ON lt.id = le.transfer_id
WHERE le.tenant_id <> lt.tenant_id;
```

### D5. Negative wallet balance buckets

```sql
SELECT id, wallet_account_id, currency
FROM wallet_balances
WHERE available_amount < 0
   OR pending_amount < 0
   OR reserved_amount < 0
   OR settled_amount < 0;
```

## E. Staging-only synthetic acceptance

Run only in staging, not production:

```sql
BEGIN TRANSACTION;

INSERT INTO wallet_accounts (
  id, tenant_id, wallet_owner_type, wallet_owner_ref_id, wallet_code, wallet_label,
  wallet_status, default_currency, created_at, updated_at
)
VALUES (
  'wa_test_001', 'tenant_test_001', 'treasury', 'tenant_test_001', 'main', 'Main treasury wallet',
  'active', 'VND', datetime('now'), datetime('now')
);

ROLLBACK;
```

If the tenant id does not exist in staging, use a real staging tenant id or skip synthetic inserts and use only the read-only acceptance SQL.

## Rollout recommendation

1. land migration in code
2. run on staging
3. execute acceptance SQL on staging
4. review schema and index output
5. run on production
6. execute production read-only acceptance SQL
7. only then open B2 for active implementation

## What backend should produce from this plan

The backend team should return:

- migration file name and diff
- acceptance SQL output
- short note on which invariants are DB-enforced vs app-enforced
- confirmation that B2 can start on top of this schema without redesign
