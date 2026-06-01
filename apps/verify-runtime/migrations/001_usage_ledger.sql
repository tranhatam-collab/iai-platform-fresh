-- D1 Migration 001: Usage Ledger
-- Apply with: wrangler d1 execute verify-usage-ledger --file migrations/001_usage_ledger.sql --remote
--
-- DO NOT RUN until Phase 2D staging deploy.

CREATE TABLE IF NOT EXISTS usage_events (
  id            TEXT PRIMARY KEY,
  tenant        TEXT NOT NULL,
  workspace_id  TEXT NOT NULL,
  actor_id      TEXT NOT NULL,
  domain_surface TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  usage_amount  REAL NOT NULL,
  usage_unit    TEXT NOT NULL,
  source_object_id TEXT NOT NULL,
  metadata      TEXT,            -- JSON blob
  environment   TEXT NOT NULL,
  occurred_at   TEXT NOT NULL,   -- ISO 8601
  received_at   INTEGER NOT NULL -- unix ms (server time)
);

CREATE INDEX IF NOT EXISTS idx_usage_tenant_ts ON usage_events(tenant, occurred_at);
CREATE INDEX IF NOT EXISTS idx_usage_workspace ON usage_events(workspace_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_usage_env ON usage_events(environment, received_at);
