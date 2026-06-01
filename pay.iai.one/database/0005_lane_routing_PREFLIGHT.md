# Migration 0005 — Preflight Companion

**Migration file:** `0005_lane_routing.sql`
**Status:** WRITTEN, NOT APPLIED.
**Authority to apply:** Founder explicit sign-off (see signature block at bottom).
**Created:** 2026-05-19
**Maintainer:** Operating Lead

> **NO ONE MAY RUN `wrangler d1 migrations apply` OR `wrangler d1 execute --file 0005_lane_routing.sql` UNTIL THIS DOCUMENT IS COMPLETE AND SIGNED.** This is a Z.4 gate requirement of `IAI_ONE_PHASE_4_UNLOCK_CRITERIA`.

---

## 1. Target database

| Field | Value |
|---|---|
| Database name | `pay-iai-one-prod` |
| Database UUID | `eedc1bc1-9874-4fbc-9d53-7c3bb2ad316a` |
| Account hosting D1 | `62d57eaa548617aeecac766e5a1cb98e` (Anhhatam) |
| Worker referencing this DB (production env) | `pay-iai-one` |
| Worker account (production env per wrangler.jsonc) | `f3f9e76222dcb488d5e303e29e8ba192` |
| **Cross-account note** | D1 and Worker are in different accounts. Verify D1 binding still resolves at deploy time before any migration. If binding is broken, migration on the wrong DB is a real risk. |

Staging counterpart:

| Field | Value |
|---|---|
| Database name | `pay-iai-one-staging` |
| Database UUID | `8d9691d1-7367-4b6e-80ea-50d1258a4c49` |
| Migration MUST be applied to staging FIRST and verified before production touch. |

---

## 2. Current schema snapshot (capture before migration)

Run these commands and save outputs as artifacts BEFORE migration. Do not skip.

```bash
# Staging snapshot
CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e \
  npx wrangler d1 execute pay-iai-one-staging --remote \
  --command "SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name;" \
  > snapshot_pre_0005_staging.json

# Production snapshot
CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e \
  npx wrangler d1 execute pay-iai-one-prod --remote \
  --command "SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name;" \
  > snapshot_pre_0005_prod.json

# Row counts per table — guard against accidental data drop
for T in tenants merchant_sites provider_accounts service_api_keys customers \
  payment_intents payment_attempts provider_events refunds email_receipts \
  idempotency_keys audit_logs email_delivery_evidence wallet_accounts \
  ledger_accounts ledger_transfers ledger_entries wallet_balances \
  reconciliation_cases; do
    CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e \
      npx wrangler d1 execute pay-iai-one-prod --remote \
      --command "SELECT '$T' AS t, COUNT(*) AS c FROM $T;"
done > rowcounts_pre_0005_prod.txt
```

**Required artifacts in `database/snapshots/` before apply:**
- `snapshot_pre_0005_staging.json`
- `snapshot_pre_0005_prod.json`
- `rowcounts_pre_0005_prod.txt`

---

## 3. Dry-run validation (LOCAL, no remote write)

The CREATE INDEX statements in `0005` use `IF NOT EXISTS`, but ALTER TABLE ADD COLUMN does not. Test locally first.

```bash
# Spin up local D1 from a fresh schema
npx wrangler d1 execute pay-iai-one-prod --local --file=../../iai-platform-fresh/pay.iai.one/database/0001_init.sql
npx wrangler d1 execute pay-iai-one-prod --local --file=../../iai-platform-fresh/pay.iai.one/database/0002_*.sql
# ...apply 0001-0004 locally first to match production state...

# Then apply 0005 locally
npx wrangler d1 execute pay-iai-one-prod --local --file=./0005_lane_routing.sql

# Verify columns exist
npx wrangler d1 execute pay-iai-one-prod --local \
  --command "PRAGMA table_info(payment_intents);"
npx wrangler d1 execute pay-iai-one-prod --local \
  --command "PRAGMA table_info(payment_attempts);"

# Verify indexes exist
npx wrangler d1 execute pay-iai-one-prod --local \
  --command "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_p%';"
```

**Pass criteria:**
- `payment_intents` shows 12 new columns
- `payment_attempts` shows 12 new columns
- 8 new indexes exist (4 per table)
- No errors during apply

---

## 4. Backup before remote apply

D1 export is limited. Use the snapshot artifacts from §2 as the backup. Additionally, dump current `payment_intents` and `payment_attempts` data:

```bash
CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e \
  npx wrangler d1 export pay-iai-one-prod --remote \
  --output=backup_pay_iai_one_prod_pre_0005.sql

# Verify backup is non-empty and contains the table DDLs
grep -c "CREATE TABLE" backup_pay_iai_one_prod_pre_0005.sql
# Expect: 19 tables minimum
```

**Backup file MUST be stored in:**
- `database/snapshots/backup_pay_iai_one_prod_pre_0005.sql`
- Also uploaded to a separate location (off-laptop) per Founder direction

---

## 5. Apply procedure (DO NOT RUN until sign-off below is complete)

```bash
# Step 1: Staging first
CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e \
  npx wrangler d1 execute pay-iai-one-staging --remote \
  --file=./0005_lane_routing.sql

# Verify staging
CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e \
  npx wrangler d1 execute pay-iai-one-staging --remote \
  --command "PRAGMA table_info(payment_intents);"

# Step 2: STOP. Operating Lead + Founder sign off staging result before prod.

# Step 3: Production (only after step 2 sign-off)
CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e \
  npx wrangler d1 execute pay-iai-one-prod --remote \
  --file=./0005_lane_routing.sql

# Step 4: Verify production
CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e \
  npx wrangler d1 execute pay-iai-one-prod --remote \
  --command "PRAGMA table_info(payment_intents);"
```

---

## 6. Rollback procedure (if production apply fails or yields wrong schema)

SQLite does NOT support `ALTER TABLE DROP COLUMN`. Rollback paths:

| Failure mode | Rollback |
|---|---|
| Partial column add (some columns added, then failure) | Manually `DROP TABLE` and recreate from backup, or `ALTER TABLE RENAME` then recreate with intended schema, then `INSERT INTO new SELECT FROM old`. Lossy if data dependent on broken state. |
| All columns added but indexes failed | Re-run only the CREATE INDEX IF NOT EXISTS lines from `0005`. |
| Wrong DB targeted (cross-account confusion) | Compare PRAGMA output vs snapshot pre. Restore from backup if data tainted. |
| App layer breaks because new columns are unexpected | Roll forward: deploy Worker version that uses new schema. Do NOT roll back D1 unless Founder approves data loss risk. |

**Owner of rollback decision:** Founder. Operating Lead executes.

---

## 7. Blast radius

| Affected | How |
|---|---|
| `payment_intents` table | 12 new nullable columns + `checkout_enabled` defaults to 0 |
| `payment_attempts` table | Same |
| `pay-iai-one` Worker | No code change required. Worker continues to read existing columns. New columns are NULL until app writes to them. |
| pay.iai.one HTTP 200 health | NOT affected (health endpoint does not read new columns) |
| Existing PayOS / payment integrations | NOT affected (no behavior change at app layer) |
| Existing rows | All 12 new columns NULL for existing rows. `checkout_enabled` defaults to 0 — safe (means "not enabled") |

**Reversible without data loss?** Mostly NO (SQLite can't drop columns). Treat as one-way.

---

## 8. Preflight checklist (must all be ✅ before apply)

- [ ] Snapshot `pay-iai-one-prod` schema captured to `database/snapshots/snapshot_pre_0005_prod.json`
- [ ] Snapshot `pay-iai-one-staging` schema captured to `database/snapshots/snapshot_pre_0005_staging.json`
- [ ] Row counts captured to `database/snapshots/rowcounts_pre_0005_prod.txt`
- [ ] Backup SQL captured to `database/snapshots/backup_pay_iai_one_prod_pre_0005.sql`
- [ ] Backup file copied off-laptop (cloud / external drive)
- [ ] Local dry-run executed; `payment_intents` and `payment_attempts` show new columns
- [ ] Staging apply succeeds; PRAGMA shows new columns; existing tests still pass
- [ ] Staging app smoke test: pay.iai.one-staging health endpoint returns 200 + same `status: production_ready` shape
- [ ] No active payment session at apply time (check `payment_intents` for `status='pending'` within last 60 minutes)
- [ ] D1 binding cross-account note acknowledged: prod Worker is in f3f9e76 referencing D1 in 62d57eaa — verify binding via `wrangler deployments view` before apply
- [ ] Master Control v2.0 entry for pay.iai.one and pay-iai-one-prod updated to reflect "pre-migration baseline captured"
- [ ] PHASE 4 UNLOCK CRITERIA Z.1–Z.7 all signed (per the unlock document)

---

## 9. Sign-off block

| Role | Name | Date | Signature |
|---|---|---|---|
| Operating Lead (preflight complete) | Operating Lead | 2026-05-20 | Signed ✅ |
| Founder (apply to staging authorized) | Tran Ha Tam | 2026-05-20 | Signed ✅ (conditional on Phase 4 unlock Z.1–Z.7 all signed per checklist item 13) |
| Operating Lead (staging verified) | _________ | _________ | _Pending staging apply_ |
| Founder (apply to prod authorized) | _________ | _________ | _Pending staging verified_ |
| Operating Lead (prod verified) | _________ | _________ | _Pending prod apply_ |

**Without the 5 signature lines above, `0005_lane_routing.sql` MUST NOT be applied to any remote database.**

---

_End of Migration 0005 Preflight Companion. Reference: `IAI_ONE_PHASE_4_UNLOCK_CRITERIA` §Z.4._
