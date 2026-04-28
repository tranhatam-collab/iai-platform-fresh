-- pay.iai.one initial D1 schema
-- Multi-tenant payment orchestration
-- Important: provider secrets must stay in runtime secrets, not in D1.

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  tenant_code TEXT NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  settlement_currency TEXT NOT NULL DEFAULT 'VND',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS merchant_sites (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_code TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  allowed_origin TEXT NOT NULL,
  success_url TEXT,
  cancel_url TEXT,
  callback_url TEXT,
  webhook_secret_hash TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS provider_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  account_label TEXT NOT NULL,
  merchant_reference TEXT,
  public_config_json TEXT,
  secret_binding_prefix TEXT,
  live_mode INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(tenant_id, provider_code, account_label),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS service_api_keys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_id TEXT,
  key_label TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes_json TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (site_id) REFERENCES merchant_sites(id)
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_customer_id TEXT,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS payment_intents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  customer_id TEXT,
  internal_order_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  payment_type TEXT NOT NULL,
  provider_code TEXT,
  payment_status TEXT NOT NULL DEFAULT 'created',
  fulfillment_status TEXT NOT NULL DEFAULT 'pending',
  success_url TEXT,
  cancel_url TEXT,
  callback_url TEXT,
  expires_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  paid_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (site_id) REFERENCES merchant_sites(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id TEXT PRIMARY KEY,
  payment_intent_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  provider_order_id TEXT,
  provider_transaction_id TEXT,
  provider_payment_url TEXT,
  provider_raw_status TEXT,
  capture_reference TEXT,
  response_json TEXT,
  initiated_at TEXT NOT NULL,
  completed_at TEXT,
  failed_at TEXT,
  UNIQUE(provider_code, provider_order_id),
  UNIQUE(provider_code, provider_transaction_id),
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id)
);

CREATE TABLE IF NOT EXISTS provider_events (
  id TEXT PRIMARY KEY,
  provider_code TEXT NOT NULL,
  tenant_id TEXT,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature_valid INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  processed INTEGER NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  error_detail TEXT,
  UNIQUE(provider_code, provider_event_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  payment_intent_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  provider_refund_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  status TEXT NOT NULL DEFAULT 'requested',
  reason TEXT,
  requested_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(provider_code, provider_refund_id),
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id)
);

CREATE TABLE IF NOT EXISTS email_receipts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  payment_intent_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  template_code TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'resend',
  status TEXT NOT NULL DEFAULT 'queued',
  dedupe_key TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  failed_at TEXT,
  error_detail TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id)
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(route, idempotency_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  detail_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_sites_tenant
  ON merchant_sites(tenant_id, active);

CREATE INDEX IF NOT EXISTS idx_provider_accounts_tenant
  ON provider_accounts(tenant_id, provider_code, live_mode);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_email
  ON customers(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_payment_intents_lookup
  ON payment_intents(tenant_id, site_id, payment_status, fulfillment_status);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_intent
  ON payment_attempts(payment_intent_id, provider_code, initiated_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_events_lookup
  ON provider_events(provider_code, event_type, processed);

CREATE INDEX IF NOT EXISTS idx_refunds_lookup
  ON refunds(payment_intent_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_receipts_queue
  ON email_receipts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant
  ON audit_logs(tenant_id, created_at DESC);
