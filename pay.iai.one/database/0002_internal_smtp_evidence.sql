-- Internal SMTP evidence for payment mail flows.
-- Migration status should still remain "not migrated" until messageId + D1 evidence + inbox proof exist.

CREATE TABLE IF NOT EXISTS email_delivery_evidence (
  id TEXT PRIMARY KEY,
  email_receipt_id TEXT NOT NULL,
  payment_intent_id TEXT NOT NULL,
  flow_code TEXT NOT NULL,
  transport TEXT NOT NULL DEFAULT 'internal_smtp',
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  message_id TEXT NOT NULL UNIQUE,
  transport_status TEXT NOT NULL DEFAULT 'accepted',
  transport_response_json TEXT NOT NULL,
  inbox_status TEXT NOT NULL DEFAULT 'pending',
  inbox_evidence_json TEXT,
  created_at TEXT NOT NULL,
  accepted_at TEXT,
  inbox_verified_at TEXT,
  FOREIGN KEY (email_receipt_id) REFERENCES email_receipts(id),
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id)
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_evidence_flow
  ON email_delivery_evidence(flow_code, transport_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_delivery_evidence_inbox
  ON email_delivery_evidence(inbox_status, inbox_verified_at DESC);
