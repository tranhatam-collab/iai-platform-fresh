-- ============================================================
-- Migration: 0005_lane_routing.sql
-- Purpose:   Add lane-routing, entity-binding, and compliance-
--            hold columns to payment_intents and payment_attempts
--            so every transaction can be tied to:
--              * a payment lane (commercial / invoice / donation / investment)
--              * a purpose code
--              * a merchant entity (legal entity of record)
--              * an invoice entity (entity issuing the invoice/receipt)
--              * an entity verification state
--              * a claims profile and evidence trail
--              * a compliance hold reason (if blocked)
-- ============================================================
-- Approval state:  WRITTEN BUT NOT YET APPLIED.
-- PREFLIGHT COMPANION (Z.4 GATE — REQUIRED):
--   See `0005_lane_routing_PREFLIGHT.md` in this directory.
-- DO NOT run any of:
--   wrangler d1 migrations apply pay-iai-one-prod --remote
--   wrangler d1 execute pay-iai-one-prod --remote --file=0005_lane_routing.sql
-- against any database until ALL 5 signature lines in the preflight
-- companion are filled. Z.4 of IAI_ONE_PHASE_4_UNLOCK_CRITERIA.
-- ============================================================
-- Compatibility: SQLite 3 / Cloudflare D1
-- Idempotent guards: use of `ADD COLUMN` is non-idempotent in SQLite;
-- this migration assumes a fresh state where no previous attempt left
-- partial columns. If partial state exists, edit before applying.
-- ============================================================

BEGIN TRANSACTION;

-- ------------------------------------------------------------
-- payment_intents — primary intent record
-- ------------------------------------------------------------

-- Lane routing
ALTER TABLE payment_intents ADD COLUMN lane_id TEXT;
ALTER TABLE payment_intents ADD COLUMN purpose_code TEXT;

-- Entity binding
ALTER TABLE payment_intents ADD COLUMN merchant_entity_id TEXT;
ALTER TABLE payment_intents ADD COLUMN invoice_entity_id TEXT;

-- Tax / customer context
ALTER TABLE payment_intents ADD COLUMN tax_region TEXT;
ALTER TABLE payment_intents ADD COLUMN customer_country TEXT;
ALTER TABLE payment_intents ADD COLUMN customer_type TEXT;

-- Compliance / verification (Founder-required extras 2026-05-17)
ALTER TABLE payment_intents ADD COLUMN entity_verification_state TEXT;
ALTER TABLE payment_intents ADD COLUMN checkout_enabled INTEGER DEFAULT 0;
ALTER TABLE payment_intents ADD COLUMN claims_profile_id TEXT;
ALTER TABLE payment_intents ADD COLUMN compliance_hold_reason TEXT;
ALTER TABLE payment_intents ADD COLUMN evidence_ref TEXT;

-- ------------------------------------------------------------
-- payment_attempts — per-attempt record
-- ------------------------------------------------------------

-- Lane routing
ALTER TABLE payment_attempts ADD COLUMN lane_id TEXT;
ALTER TABLE payment_attempts ADD COLUMN purpose_code TEXT;

-- Entity binding
ALTER TABLE payment_attempts ADD COLUMN merchant_entity_id TEXT;
ALTER TABLE payment_attempts ADD COLUMN invoice_entity_id TEXT;

-- Tax / customer context
ALTER TABLE payment_attempts ADD COLUMN tax_region TEXT;
ALTER TABLE payment_attempts ADD COLUMN customer_country TEXT;
ALTER TABLE payment_attempts ADD COLUMN customer_type TEXT;

-- Compliance / verification (Founder-required extras 2026-05-17)
ALTER TABLE payment_attempts ADD COLUMN entity_verification_state TEXT;
ALTER TABLE payment_attempts ADD COLUMN checkout_enabled INTEGER DEFAULT 0;
ALTER TABLE payment_attempts ADD COLUMN claims_profile_id TEXT;
ALTER TABLE payment_attempts ADD COLUMN compliance_hold_reason TEXT;
ALTER TABLE payment_attempts ADD COLUMN evidence_ref TEXT;

-- ------------------------------------------------------------
-- Indexes for routing + compliance queries
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_pi_lane_id          ON payment_intents (lane_id);
CREATE INDEX IF NOT EXISTS idx_pi_merchant_entity  ON payment_intents (merchant_entity_id);
CREATE INDEX IF NOT EXISTS idx_pi_purpose_code     ON payment_intents (purpose_code);
CREATE INDEX IF NOT EXISTS idx_pi_compliance_hold  ON payment_intents (compliance_hold_reason)
  WHERE compliance_hold_reason IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pa_lane_id          ON payment_attempts (lane_id);
CREATE INDEX IF NOT EXISTS idx_pa_merchant_entity  ON payment_attempts (merchant_entity_id);
CREATE INDEX IF NOT EXISTS idx_pa_purpose_code     ON payment_attempts (purpose_code);
CREATE INDEX IF NOT EXISTS idx_pa_compliance_hold  ON payment_attempts (compliance_hold_reason)
  WHERE compliance_hold_reason IS NOT NULL;

-- ------------------------------------------------------------
-- CHECK constraints would be ideal but SQLite does not support
-- adding CHECK to existing columns via ALTER. The application
-- layer (Worker handler) is responsible for enforcing:
--
--   1. payment_intents.lane_id IN
--        ('commercial_usd','commercial_vnd','invoice_b2b',
--         'donation_usd','investment_gated','internal_transfer')
--
--   2. payment_intents.purpose_code IN
--        ('SERVICE_FEE','SUBSCRIPTION','INVOICE_PAYMENT',
--         'DONATION_NO_BENEFIT','INTERNAL_TRANSFER','DEPOSIT',
--         'INVESTMENT_SUBSCRIPTION_PENDING_LEGAL')
--
--   3. If lane_id = 'investment_gated':
--        checkout_enabled MUST be 0
--        public_facing MUST be false
--        compliance_hold_reason MUST be set
--
--   4. If lane_id = 'donation_usd' AND merchant_entity_id =
--        'ANGEL_EDU_TAM_FOUNDATION_INC':
--        tax_deductible_claim_in_receipt MUST be false
--        until legal-entities.json shows tax_deductible_claim_allowed=true
--
--   5. checkout_enabled MUST be 0 unless:
--        merchant_entity.verified == true AND
--        merchant_entity.checkout_enabled == true AND
--        compliance_hold_reason IS NULL
-- ------------------------------------------------------------

COMMIT;

-- ============================================================
-- POST-MIGRATION VERIFICATION QUERY (manual, after apply only):
--
-- SELECT
--   name,
--   sql
-- FROM sqlite_master
-- WHERE name IN ('payment_intents', 'payment_attempts');
--
-- Expected: each table includes the 12 new columns above plus
-- the 5 indexes per table.
-- ============================================================
