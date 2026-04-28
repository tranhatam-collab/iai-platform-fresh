import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface PaymentEventEvidenceAuditEntry {
  at: string;
  details: Record<string, string>;
  event:
    | "outbound_webhook_sent"
    | "payment_email_accepted"
    | "payment_event_callback_received"
    | "payment_event_proof_attached";
}

export interface PaymentEventEvidenceRecord {
  accepted_at: string;
  audit_log: PaymentEventEvidenceAuditEntry[];
  callback_received_at: string;
  callback_status: string;
  canonical_row_ref: string;
  created_at: string;
  db_evidence_ref: string;
  domain: string;
  inbox_proof_ref: string;
  internal_inbox_proof_ref: string;
  log_evidence_ref: string;
  mail_message_id: string;
  mail_provider_route: string;
  mail_request_id: string;
  mail_status: string;
  order_id: string;
  /** Tenant slug pay used to dispatch the outbound webhook (e.g. "tranhatam"). */
  outbound_webhook_tenant_code: string;
  /** Pay-platform tenant UUID surfaced for audit (e.g. "ten_2e0143ae028a7a3c"). */
  outbound_webhook_tenant_id: string;
  /** Destination URL pay POSTed to (full URL with query string). */
  outbound_webhook_destination_url: string;
  /** "delivered" | "failed" | "" when no attempt yet. */
  outbound_webhook_status: string;
  /** Total attempts (including the successful one if delivered). */
  outbound_webhook_attempt_count: string;
  /** HTTP status of the final attempt. "0" on network error. */
  outbound_webhook_final_status: string;
  /** Signature of the final attempt (audit + replay diagnosis). */
  outbound_webhook_signature: string;
  /** Wall-clock at which the (final) outbound POST was issued. */
  outbound_webhook_sent_at: string;
  payment_session_id: string;
  payment_status: string;
  provider_event_id: string;
  provider_reference: string;
  provider_status: string;
  recipient_email: string;
  recipient_name: string;
  source_domain: string;
  template_id: string;
  updated_at: string;
  x_site_key: string;
}

export interface PaymentEventEvidenceSendInput {
  accepted_at?: string;
  callback_status?: string;
  domain: string;
  mail_message_id: string;
  mail_provider_route?: string;
  mail_request_id?: string;
  mail_status?: string;
  order_id?: string;
  payment_session_id?: string;
  payment_status?: string;
  provider_event_id?: string;
  provider_reference?: string;
  provider_status?: string;
  recipient_email?: string;
  recipient_name?: string;
  request_id?: string;
  source_domain?: string;
  template_id?: string;
  x_site_key?: string;
}

export interface PaymentEventEvidenceCallbackInput {
  callback_status?: string;
  canonical_row_ref?: string;
  domain: string;
  order_id?: string;
  payment_session_id?: string;
  payment_status?: string;
  provider_event_id?: string;
  provider_reference?: string;
  provider_status?: string;
  request_id?: string;
}

export interface PaymentEventEvidenceProofInput {
  canonical_row_ref?: string;
  db_evidence_ref?: string;
  domain: string;
  inbox_proof_ref?: string;
  internal_inbox_proof_ref?: string;
  log_evidence_ref?: string;
  mail_message_id?: string;
  order_id?: string;
  payment_session_id?: string;
  provider_reference?: string;
  request_id?: string;
}

export interface PaymentEventEvidenceLookupInput {
  canonical_row_ref?: string;
  domain?: string;
  mail_message_id?: string;
  order_id?: string;
  payment_session_id?: string;
  provider_reference?: string;
}

export interface PaymentEventEvidenceOutboundWebhookInput {
  attempt_count: number;
  delivered: boolean;
  destination_url: string;
  domain: string;
  final_status: number;
  order_id?: string;
  payment_session_id?: string;
  provider_event_id?: string;
  provider_reference?: string;
  request_id?: string;
  sent_at?: string;
  signature?: string;
  tenant_code: string;
  tenant_id?: string;
}

interface SerializedPaymentEventEvidenceState {
  records: PaymentEventEvidenceRecord[];
  version: 1;
}

const CURRENT_STATE_VERSION = 1;

export class PaymentEventEvidenceStore {
  private readonly records = new Map<string, PaymentEventEvidenceRecord>();
  private readonly recordRefsByMessageId = new Map<string, string>();
  private readonly recordRefsByOrderId = new Map<string, string>();
  private readonly recordRefsByPaymentSessionId = new Map<string, string>();
  private readonly recordRefsByProviderReference = new Map<string, string>();

  constructor(private readonly filePath?: string) {
    this.load();
  }

  recordPaymentEmailAccepted(input: PaymentEventEvidenceSendInput): PaymentEventEvidenceRecord {
    const now = input.accepted_at?.trim() || new Date().toISOString();
    const domain = normalizeDomain(input.domain);
    const record = this.resolveRecord({
      domain,
      mail_message_id: input.mail_message_id,
      order_id: input.order_id,
      payment_session_id: input.payment_session_id,
      provider_reference: input.provider_reference
    });

    record.accepted_at = now;
    record.callback_status = normalizeOptionalString(input.callback_status) || record.callback_status;
    record.domain = domain;
    record.mail_message_id = normalizeRequiredString(input.mail_message_id, "mail_message_id");
    record.mail_provider_route =
      normalizeOptionalString(input.mail_provider_route) || record.mail_provider_route;
    record.mail_request_id =
      normalizeOptionalString(input.mail_request_id ?? input.request_id) || record.mail_request_id;
    record.mail_status = normalizeOptionalString(input.mail_status) || record.mail_status;
    record.order_id = normalizeOptionalString(input.order_id) || record.order_id;
    record.payment_session_id =
      normalizeOptionalString(input.payment_session_id) || record.payment_session_id;
    record.payment_status = normalizeOptionalString(input.payment_status) || record.payment_status;
    record.provider_event_id =
      normalizeOptionalString(input.provider_event_id) || record.provider_event_id;
    record.provider_reference =
      normalizeOptionalString(input.provider_reference) || record.provider_reference;
    record.provider_status = normalizeOptionalString(input.provider_status) || record.provider_status;
    record.recipient_email = normalizeOptionalString(input.recipient_email) || record.recipient_email;
    record.recipient_name = normalizeOptionalString(input.recipient_name) || record.recipient_name;
    record.source_domain = normalizeOptionalString(input.source_domain) || record.source_domain;
    record.template_id = normalizeOptionalString(input.template_id) || record.template_id;
    record.updated_at = now;
    record.x_site_key = normalizeOptionalString(input.x_site_key) || record.x_site_key;

    this.appendAuditEntry(record, now, "payment_email_accepted", {
      callback_status: record.callback_status,
      mail_message_id: record.mail_message_id,
      order_id: record.order_id,
      payment_session_id: record.payment_session_id,
      provider_reference: record.provider_reference,
      request_id: record.mail_request_id,
      template_id: record.template_id
    });

    this.commitRecord(record);
    return cloneRecord(record);
  }

  recordPaymentEventCallback(input: PaymentEventEvidenceCallbackInput): PaymentEventEvidenceRecord {
    const now = new Date().toISOString();
    const record = this.resolveRecord(input);

    record.callback_received_at = now;
    record.callback_status = normalizeOptionalString(input.callback_status) || record.callback_status;
    record.domain = normalizeDomain(input.domain);
    record.order_id = normalizeOptionalString(input.order_id) || record.order_id;
    record.payment_session_id =
      normalizeOptionalString(input.payment_session_id) || record.payment_session_id;
    record.payment_status = normalizeOptionalString(input.payment_status) || record.payment_status;
    record.provider_event_id =
      normalizeOptionalString(input.provider_event_id) || record.provider_event_id;
    record.provider_reference =
      normalizeOptionalString(input.provider_reference) || record.provider_reference;
    record.provider_status = normalizeOptionalString(input.provider_status) || record.provider_status;
    record.updated_at = now;

    this.appendAuditEntry(record, now, "payment_event_callback_received", {
      callback_status: record.callback_status,
      order_id: record.order_id,
      payment_session_id: record.payment_session_id,
      payment_status: record.payment_status,
      provider_event_id: record.provider_event_id,
      provider_reference: record.provider_reference,
      provider_status: record.provider_status,
      request_id: normalizeOptionalString(input.request_id)
    });

    this.commitRecord(record);
    return cloneRecord(record);
  }

  attachProof(input: PaymentEventEvidenceProofInput): PaymentEventEvidenceRecord {
    const now = new Date().toISOString();
    const record = this.resolveRecord(input);

    record.db_evidence_ref =
      normalizeOptionalString(input.db_evidence_ref) || record.db_evidence_ref;
    record.domain = normalizeDomain(input.domain);
    record.inbox_proof_ref =
      normalizeOptionalString(input.inbox_proof_ref) || record.inbox_proof_ref;
    record.internal_inbox_proof_ref =
      normalizeOptionalString(input.internal_inbox_proof_ref) || record.internal_inbox_proof_ref;
    record.log_evidence_ref =
      normalizeOptionalString(input.log_evidence_ref) || record.log_evidence_ref;
    record.mail_message_id =
      normalizeOptionalString(input.mail_message_id) || record.mail_message_id;
    record.order_id = normalizeOptionalString(input.order_id) || record.order_id;
    record.payment_session_id =
      normalizeOptionalString(input.payment_session_id) || record.payment_session_id;
    record.provider_reference =
      normalizeOptionalString(input.provider_reference) || record.provider_reference;
    record.updated_at = now;

    this.appendAuditEntry(record, now, "payment_event_proof_attached", {
      db_evidence_ref: record.db_evidence_ref,
      inbox_proof_ref: record.inbox_proof_ref,
      internal_inbox_proof_ref: record.internal_inbox_proof_ref,
      log_evidence_ref: record.log_evidence_ref,
      mail_message_id: record.mail_message_id,
      provider_reference: record.provider_reference,
      request_id: normalizeOptionalString(input.request_id)
    });

    this.commitRecord(record);
    return cloneRecord(record);
  }

  recordOutboundWebhookSent(
    input: PaymentEventEvidenceOutboundWebhookInput
  ): PaymentEventEvidenceRecord {
    const now = input.sent_at?.trim() || new Date().toISOString();
    const record = this.resolveRecord({
      domain: input.domain,
      order_id: input.order_id,
      payment_session_id: input.payment_session_id,
      provider_reference: input.provider_reference
    });

    record.domain = normalizeDomain(input.domain);
    record.order_id = normalizeOptionalString(input.order_id) || record.order_id;
    record.payment_session_id =
      normalizeOptionalString(input.payment_session_id) || record.payment_session_id;
    record.provider_event_id =
      normalizeOptionalString(input.provider_event_id) || record.provider_event_id;
    record.provider_reference =
      normalizeOptionalString(input.provider_reference) || record.provider_reference;
    record.outbound_webhook_tenant_code =
      normalizeOptionalString(input.tenant_code) || record.outbound_webhook_tenant_code;
    record.outbound_webhook_tenant_id =
      normalizeOptionalString(input.tenant_id) || record.outbound_webhook_tenant_id;
    record.outbound_webhook_destination_url =
      normalizeOptionalString(input.destination_url) || record.outbound_webhook_destination_url;
    record.outbound_webhook_status = input.delivered ? "delivered" : "failed";
    record.outbound_webhook_attempt_count = String(Math.max(0, Math.trunc(input.attempt_count)));
    record.outbound_webhook_final_status = String(Math.max(0, Math.trunc(input.final_status)));
    record.outbound_webhook_signature =
      normalizeOptionalString(input.signature) || record.outbound_webhook_signature;
    record.outbound_webhook_sent_at = now;
    record.updated_at = now;

    this.appendAuditEntry(record, now, "outbound_webhook_sent", {
      attempt_count: record.outbound_webhook_attempt_count,
      destination_url: record.outbound_webhook_destination_url,
      final_status: record.outbound_webhook_final_status,
      order_id: record.order_id,
      provider_event_id: record.provider_event_id,
      request_id: normalizeOptionalString(input.request_id),
      status: record.outbound_webhook_status,
      tenant_code: record.outbound_webhook_tenant_code,
      tenant_id: record.outbound_webhook_tenant_id
    });

    this.commitRecord(record);
    return cloneRecord(record);
  }

  getRecord(input: PaymentEventEvidenceLookupInput): PaymentEventEvidenceRecord | null {
    const record = this.findRecord(input);
    return record ? cloneRecord(record) : null;
  }

  listRecords(domain?: string): PaymentEventEvidenceRecord[] {
    const normalizedDomain = normalizeOptionalString(domain)
      ? normalizeDomain(String(domain))
      : "";

    return Array.from(this.records.values())
      .filter((record) => !normalizedDomain || record.domain === normalizedDomain)
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
      .map((record) => cloneRecord(record));
  }

  private appendAuditEntry(
    record: PaymentEventEvidenceRecord,
    at: string,
    event: PaymentEventEvidenceAuditEntry["event"],
    details: Record<string, string>
  ) {
    record.audit_log.push({
      at,
      details: Object.fromEntries(
        Object.entries(details).filter(([, value]) => normalizeOptionalString(value) !== "")
      ),
      event
    });
  }

  private commitRecord(record: PaymentEventEvidenceRecord) {
    record.updated_at = record.updated_at || new Date().toISOString();
    this.records.set(record.canonical_row_ref, record);
    this.indexRecord(record);
    this.persist();
  }

  private createEmptyRecord(input: PaymentEventEvidenceLookupInput): PaymentEventEvidenceRecord {
    const now = new Date().toISOString();
    const domain = normalizeDomain(input.domain || "unknown.example");
    const seed =
      normalizeOptionalString(input.provider_reference) ||
      normalizeOptionalString(input.payment_session_id) ||
      normalizeOptionalString(input.order_id) ||
      normalizeOptionalString(input.mail_message_id) ||
      randomUUID();

    return {
      accepted_at: "",
      audit_log: [],
      callback_received_at: "",
      callback_status: "pending",
      canonical_row_ref:
        normalizeOptionalString(input.canonical_row_ref) ||
        `canon_${slugify(domain)}_${slugify(seed)}`,
      created_at: now,
      db_evidence_ref: "",
      domain,
      inbox_proof_ref: "",
      internal_inbox_proof_ref: "",
      log_evidence_ref: "",
      mail_message_id: normalizeOptionalString(input.mail_message_id),
      mail_provider_route: "",
      mail_request_id: "",
      mail_status: "",
      order_id: normalizeOptionalString(input.order_id),
      outbound_webhook_attempt_count: "",
      outbound_webhook_destination_url: "",
      outbound_webhook_final_status: "",
      outbound_webhook_sent_at: "",
      outbound_webhook_signature: "",
      outbound_webhook_status: "",
      outbound_webhook_tenant_code: "",
      outbound_webhook_tenant_id: "",
      payment_session_id: normalizeOptionalString(input.payment_session_id),
      payment_status: "",
      provider_event_id: "",
      provider_reference: normalizeOptionalString(input.provider_reference),
      provider_status: "",
      recipient_email: "",
      recipient_name: "",
      source_domain: domain,
      template_id: "",
      updated_at: now,
      x_site_key: ""
    };
  }

  private findRecord(input: PaymentEventEvidenceLookupInput): PaymentEventEvidenceRecord | null {
    const canonicalRowRef = normalizeOptionalString(input.canonical_row_ref);
    if (canonicalRowRef && this.records.has(canonicalRowRef)) {
      return this.records.get(canonicalRowRef) ?? null;
    }

    const domain = normalizeOptionalString(input.domain) ? normalizeDomain(String(input.domain)) : "";
    const providerReference = scopedLookupKey(domain, input.provider_reference);
    if (providerReference && this.recordRefsByProviderReference.has(providerReference)) {
      return this.records.get(this.recordRefsByProviderReference.get(providerReference) ?? "") ?? null;
    }

    const paymentSessionId = scopedLookupKey(domain, input.payment_session_id);
    if (paymentSessionId && this.recordRefsByPaymentSessionId.has(paymentSessionId)) {
      return this.records.get(this.recordRefsByPaymentSessionId.get(paymentSessionId) ?? "") ?? null;
    }

    const orderId = scopedLookupKey(domain, input.order_id);
    if (orderId && this.recordRefsByOrderId.has(orderId)) {
      return this.records.get(this.recordRefsByOrderId.get(orderId) ?? "") ?? null;
    }

    const mailMessageId = normalizeOptionalString(input.mail_message_id);
    if (mailMessageId && this.recordRefsByMessageId.has(mailMessageId)) {
      return this.records.get(this.recordRefsByMessageId.get(mailMessageId) ?? "") ?? null;
    }

    return null;
  }

  private indexRecord(record: PaymentEventEvidenceRecord) {
    const providerReference = scopedLookupKey(record.domain, record.provider_reference);
    if (providerReference) {
      this.recordRefsByProviderReference.set(providerReference, record.canonical_row_ref);
    }

    const paymentSessionId = scopedLookupKey(record.domain, record.payment_session_id);
    if (paymentSessionId) {
      this.recordRefsByPaymentSessionId.set(paymentSessionId, record.canonical_row_ref);
    }

    const orderId = scopedLookupKey(record.domain, record.order_id);
    if (orderId) {
      this.recordRefsByOrderId.set(orderId, record.canonical_row_ref);
    }

    const mailMessageId = normalizeOptionalString(record.mail_message_id);
    if (mailMessageId) {
      this.recordRefsByMessageId.set(mailMessageId, record.canonical_row_ref);
    }
  }

  private load() {
    if (!this.filePath) {
      return;
    }

    try {
      const raw = readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as SerializedPaymentEventEvidenceState;
      if (parsed?.version !== CURRENT_STATE_VERSION || !Array.isArray(parsed.records)) {
        return;
      }

      for (const record of parsed.records) {
        if (!record?.canonical_row_ref) {
          continue;
        }
        this.records.set(record.canonical_row_ref, record);
        this.indexRecord(record);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  private persist() {
    if (!this.filePath) {
      return;
    }

    mkdirSync(path.dirname(this.filePath), { recursive: true });
    const serialized: SerializedPaymentEventEvidenceState = {
      records: this.listRecords().reverse(),
      version: CURRENT_STATE_VERSION
    };
    writeFileSync(this.filePath, `${JSON.stringify(serialized, null, 2)}\n`, "utf8");
  }

  private resolveRecord(input: PaymentEventEvidenceLookupInput): PaymentEventEvidenceRecord {
    return this.findRecord(input) ?? this.createEmptyRecord(input);
  }
}

function cloneRecord(record: PaymentEventEvidenceRecord): PaymentEventEvidenceRecord {
  return JSON.parse(JSON.stringify(record)) as PaymentEventEvidenceRecord;
}

function normalizeDomain(domain: string): string {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) {
    throw new Error("domain is required.");
  }
  return normalized.replace(/^https?:\/\//u, "").replace(/^www\./u, "");
}

function normalizeOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRequiredString(value: unknown, field: string): string {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }
  return normalized;
}

function scopedLookupKey(domain: string, value: unknown): string {
  const normalizedValue = normalizeOptionalString(value);
  if (!normalizedValue) {
    return "";
  }
  return `${normalizeDomain(domain || "unknown.example")}::${normalizedValue.toLowerCase()}`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
}
