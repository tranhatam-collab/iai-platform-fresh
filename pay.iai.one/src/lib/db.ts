import { nowIso, normalizeUrl, stringValue } from "./utils";

export interface D1Env {
  PAYMENTS_DB?: D1Database;
}

export interface PersistedPaymentIntent {
  id: string;
  tenant_id: string;
  internal_order_id: string;
  tenant_code: string;
  site_code: string;
  amount: number;
  currency: string;
  payment_status: string;
  fulfillment_status: string;
  provider_code: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  metadata_json: Record<string, unknown>;
  attempt_count: number;
}

export interface PaymentIntentDispatchContext {
  attempt_id: string;
  payment_intent_id: string;
  internal_order_id: string;
  payment_status: string;
  fulfillment_status: string;
  tenant_id: string;
  tenant_code: string;
  site_code: string;
  amount: number;
  currency: string;
  callback_url: string | null;
  metadata_json: Record<string, unknown>;
}

export interface IdempotencyRecord {
  route: string;
  idempotency_key: string;
  request_hash: string;
  status_code: number;
  response_json: Record<string, unknown>;
  created_at: string;
}

export interface ServiceApiKeyRecord {
  id: string;
  tenant_code: string;
  site_code: string;
  key_label: string;
  scopes_json: string;
  last_used_at: string | null;
}

export interface ProviderEventRecord {
  id: string;
  provider_code: string;
  tenant_id: string | null;
  provider_event_id: string;
  event_type: string;
  signature_valid: boolean;
  processed: boolean;
  received_at: string;
  processed_at: string | null;
  error_detail: string | null;
  payload_json: Record<string, unknown>;
}

export interface AuditLogRecord {
  id: string;
  tenant_id: string | null;
  actor_type: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  detail_json: Record<string, unknown>;
  created_at: string;
}

export interface RefundRecord {
  id: string;
  payment_intent_id: string;
  provider_code: string;
  provider_refund_id: string | null;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  requested_at: string;
  updated_at: string;
}

export interface RefundDetailRecord extends RefundRecord {
  internal_order_id: string;
  tenant_id: string;
  tenant_code: string;
  site_code: string;
}

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

export function requireDb(env: D1Env): D1Database {
  if (!env.PAYMENTS_DB) {
    const error = new Error("PAYMENTS_DB binding is missing.");
    (error as Error & { code?: string; status?: number }).code = "DB_NOT_READY";
    (error as Error & { code?: string; status?: number }).status = 503;
    throw error;
  }
  return env.PAYMENTS_DB;
}

export async function ensureTenant(db: D1Database, tenantCode: string) {
  const now = nowIso();
  const normalizedCode = stringValue(tenantCode);
  const existing = await db
    .prepare("SELECT id, tenant_code FROM tenants WHERE tenant_code = ?1 LIMIT 1")
    .bind(normalizedCode)
    .first<{ id: string; tenant_code: string }>();

  if (existing) return existing;

  const id = randomId("ten");
  await db
    .prepare(
      `INSERT INTO tenants (id, tenant_code, legal_name, display_name, settlement_currency, status, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, 'VND', 'active', ?5, ?6)`
    )
    .bind(id, normalizedCode, normalizedCode, normalizedCode, now, now)
    .run();

  return { id, tenant_code: normalizedCode };
}

export async function ensureMerchantSite(db: D1Database, tenantId: string, siteCode: string, returnUrl?: string | null) {
  const now = nowIso();
  const normalizedCode = stringValue(siteCode);
  const normalizedReturnUrl = normalizeUrl(returnUrl);
  const fallbackDomain = normalizedReturnUrl ? new URL(normalizedReturnUrl).hostname : `${normalizedCode}.local`;
  const fallbackOrigin = normalizedReturnUrl ? new URL(normalizedReturnUrl).origin : "http://localhost";

  const existing = await db
    .prepare("SELECT id, site_code, domain, allowed_origin FROM merchant_sites WHERE site_code = ?1 LIMIT 1")
    .bind(normalizedCode)
    .first<{ id: string; site_code: string; domain: string; allowed_origin: string }>();

  if (existing) return existing;

  const id = randomId("site");
  await db
    .prepare(
      `INSERT INTO merchant_sites (
          id, tenant_id, site_code, domain, allowed_origin, success_url, cancel_url, callback_url, webhook_secret_hash, active, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, NULL, NULL, NULL, NULL, 1, ?6, ?7)`
    )
    .bind(id, tenantId, normalizedCode, fallbackDomain, fallbackOrigin, now, now)
    .run();

  return { id, site_code: normalizedCode, domain: fallbackDomain, allowed_origin: fallbackOrigin };
}

export async function createPaymentIntentRecord(
  db: D1Database,
  input: {
    tenantId: string;
    siteId: string;
    internalOrderId: string;
    amount: number;
    currency: string;
    providerCode: string;
    paymentType: string;
    successUrl: string;
    cancelUrl: string;
    callbackUrl?: string | null;
    metadata: Record<string, unknown>;
  }
) {
  const existing = await db
    .prepare(
      `SELECT id, internal_order_id
       FROM payment_intents
       WHERE internal_order_id = ?1
       LIMIT 1`
    )
    .bind(input.internalOrderId)
    .first<{ id: string; internal_order_id: string }>();

  if (existing) {
    const error = new Error("internal_order_id already exists.");
    (error as Error & { code?: string; status?: number }).code = "ORDER_ALREADY_EXISTS";
    (error as Error & { code?: string; status?: number }).status = 409;
    throw error;
  }

  const id = randomId("pi");
  const now = nowIso();

  await db
    .prepare(
      `INSERT INTO payment_intents (
          id, tenant_id, site_id, customer_id, internal_order_id, amount, currency, payment_type, provider_code,
          payment_status, fulfillment_status, success_url, cancel_url, callback_url, expires_at, metadata_json,
          created_at, updated_at, paid_at
        ) VALUES (?1, ?2, ?3, NULL, ?4, ?5, ?6, ?7, ?8, 'created', 'pending', ?9, ?10, ?11, NULL, ?12, ?13, ?14, NULL)`
    )
    .bind(
      id,
      input.tenantId,
      input.siteId,
      input.internalOrderId,
      input.amount,
      input.currency,
      input.paymentType,
      input.providerCode,
      input.successUrl,
      input.cancelUrl,
      input.callbackUrl || null,
      serializeJson(input.metadata),
      now,
      now
    )
    .run();

  return { id, internal_order_id: input.internalOrderId };
}

export async function createPaymentAttemptRecord(
  db: D1Database,
  input: {
    paymentIntentId: string;
    providerCode: string;
    providerOrderId: string;
    providerTransactionId?: string | null;
    providerPaymentUrl?: string | null;
    providerRawStatus?: string | null;
    captureReference?: string | null;
    responseJson: Record<string, unknown>;
  }
) {
  const id = randomId("att");
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO payment_attempts (
          id, payment_intent_id, provider_code, provider_order_id, provider_transaction_id,
          provider_payment_url, provider_raw_status, capture_reference, response_json, initiated_at, completed_at, failed_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, NULL, NULL)`
    )
    .bind(
      id,
      input.paymentIntentId,
      input.providerCode,
      input.providerOrderId,
      input.providerTransactionId || null,
      input.providerPaymentUrl || null,
      input.providerRawStatus || null,
      input.captureReference || null,
      serializeJson(input.responseJson),
      now
    )
    .run();

  return { id };
}

export async function getPaymentByInternalOrderId(db: D1Database, internalOrderId: string): Promise<PersistedPaymentIntent | null> {
  const row = await db
    .prepare(
      `SELECT
         pi.id,
         pi.tenant_id,
         pi.internal_order_id,
         t.tenant_code,
         s.site_code,
         pi.amount,
         pi.currency,
         pi.payment_status,
         pi.fulfillment_status,
         pi.provider_code,
         pi.created_at,
         pi.updated_at,
         pi.paid_at,
         pi.metadata_json,
         COUNT(pa.id) AS attempt_count
       FROM payment_intents pi
       JOIN tenants t ON t.id = pi.tenant_id
       JOIN merchant_sites s ON s.id = pi.site_id
       LEFT JOIN payment_attempts pa ON pa.payment_intent_id = pi.id
       WHERE pi.internal_order_id = ?1
       GROUP BY pi.id, t.tenant_code, s.site_code
       LIMIT 1`
    )
    .bind(internalOrderId)
     .first<{
       id: string;
       tenant_id: string;
       internal_order_id: string;
       tenant_code: string;
       site_code: string;
      amount: number;
      currency: string;
      payment_status: string;
      fulfillment_status: string;
      provider_code: string | null;
      created_at: string;
      updated_at: string;
      paid_at: string | null;
      metadata_json: string | null;
      attempt_count: number;
    }>();

  if (!row) return null;

  return {
    ...row,
    metadata_json: parseJson(row.metadata_json)
  };
}

export async function getPaymentById(db: D1Database, paymentIntentId: string): Promise<PersistedPaymentIntent | null> {
  const row = await db
    .prepare(
      `SELECT
         pi.id,
         pi.tenant_id,
         pi.internal_order_id,
         t.tenant_code,
         s.site_code,
         pi.amount,
         pi.currency,
         pi.payment_status,
         pi.fulfillment_status,
         pi.provider_code,
         pi.created_at,
         pi.updated_at,
         pi.paid_at,
         pi.metadata_json,
         COUNT(pa.id) AS attempt_count
       FROM payment_intents pi
       JOIN tenants t ON t.id = pi.tenant_id
       JOIN merchant_sites s ON s.id = pi.site_id
       LEFT JOIN payment_attempts pa ON pa.payment_intent_id = pi.id
       WHERE pi.id = ?1
       GROUP BY pi.id, t.tenant_code, s.site_code
       LIMIT 1`
    )
    .bind(paymentIntentId)
    .first<{
      id: string;
      tenant_id: string;
      internal_order_id: string;
      tenant_code: string;
      site_code: string;
      amount: number;
      currency: string;
      payment_status: string;
      fulfillment_status: string;
      provider_code: string | null;
      created_at: string;
      updated_at: string;
      paid_at: string | null;
      metadata_json: string | null;
      attempt_count: number;
    }>();

  if (!row) return null;

  return {
    ...row,
    metadata_json: parseJson(row.metadata_json)
  };
}

export async function searchPayments(
  db: D1Database,
  input: {
    internalOrderId?: string;
    recipientEmail?: string;
    providerOrderId?: string;
    messageId?: string;
    siteCode?: string;
    limit?: number;
  }
): Promise<PersistedPaymentIntent[]> {
  const predicates: string[] = [];
  const bindValues: Array<string | number> = [];
  let bindIndex = 1;

  if (input.internalOrderId) {
    predicates.push(`pi.internal_order_id = ?${bindIndex}`);
    bindValues.push(input.internalOrderId);
    bindIndex += 1;
  }

  if (input.siteCode) {
    predicates.push(`s.site_code = ?${bindIndex}`);
    bindValues.push(input.siteCode);
    bindIndex += 1;
  }

  if (input.providerOrderId) {
    predicates.push(`pa.provider_order_id = ?${bindIndex}`);
    bindValues.push(input.providerOrderId);
    bindIndex += 1;
  }

  if (input.recipientEmail) {
    predicates.push(`er.recipient_email = ?${bindIndex}`);
    bindValues.push(input.recipientEmail);
    bindIndex += 1;
  }

  if (input.messageId) {
    predicates.push(`ede.message_id = ?${bindIndex}`);
    bindValues.push(input.messageId);
    bindIndex += 1;
  }

  if (predicates.length === 0) return [];

  const limit = Math.max(1, Math.min(input.limit || 20, 100));
  const whereClause = predicates.join(" AND ");

  const result = await db
    .prepare(
      `SELECT
         pi.id,
         pi.tenant_id,
         pi.internal_order_id,
         t.tenant_code,
         s.site_code,
         pi.amount,
         pi.currency,
         pi.payment_status,
         pi.fulfillment_status,
         pi.provider_code,
         pi.created_at,
         pi.updated_at,
         pi.paid_at,
         pi.metadata_json,
         COUNT(DISTINCT pa.id) AS attempt_count
       FROM payment_intents pi
       JOIN tenants t ON t.id = pi.tenant_id
       JOIN merchant_sites s ON s.id = pi.site_id
       LEFT JOIN payment_attempts pa ON pa.payment_intent_id = pi.id
       LEFT JOIN email_receipts er ON er.payment_intent_id = pi.id
       LEFT JOIN email_delivery_evidence ede ON ede.payment_intent_id = pi.id
       WHERE ${whereClause}
       GROUP BY pi.id, t.tenant_code, s.site_code
       ORDER BY pi.created_at DESC
       LIMIT ${limit}`
    )
    .bind(...bindValues)
    .all<{
      id: string;
      tenant_id: string;
      internal_order_id: string;
      tenant_code: string;
      site_code: string;
      amount: number;
      currency: string;
      payment_status: string;
      fulfillment_status: string;
      provider_code: string | null;
      created_at: string;
      updated_at: string;
      paid_at: string | null;
      metadata_json: string | null;
      attempt_count: number;
    }>();

  return (result.results || []).map((row) => ({
    ...row,
    metadata_json: parseJson(row.metadata_json)
  }));
}

export async function listPaymentAttempts(db: D1Database, paymentIntentId: string) {
  const result = await db
    .prepare(
      `SELECT
         id,
         provider_code,
         provider_order_id,
         provider_transaction_id,
         provider_payment_url,
         provider_raw_status,
         capture_reference,
         response_json,
         initiated_at,
         completed_at,
         failed_at
       FROM payment_attempts
       WHERE payment_intent_id = ?1
       ORDER BY initiated_at DESC`
    )
    .bind(paymentIntentId)
    .all<{
      id: string;
      provider_code: string;
      provider_order_id: string | null;
      provider_transaction_id: string | null;
      provider_payment_url: string | null;
      provider_raw_status: string | null;
      capture_reference: string | null;
      response_json: string | null;
      initiated_at: string;
      completed_at: string | null;
      failed_at: string | null;
    }>();

  return (result.results || []).map((row) => ({
    ...row,
    response_json: parseJson(row.response_json)
  }));
}

export async function findPaymentIntentByProviderOrderId(
  db: D1Database,
  providerCode: string,
  providerOrderId: string
): Promise<PaymentIntentDispatchContext | null> {
  const row = await db
    .prepare(
      `SELECT
         pa.id AS attempt_id,
         pi.id AS payment_intent_id,
         pi.internal_order_id,
         pi.payment_status,
         pi.fulfillment_status,
         pi.tenant_id,
         t.tenant_code,
         ms.site_code,
         pi.amount,
         pi.currency,
         pi.callback_url,
         pi.metadata_json
       FROM payment_attempts pa
       JOIN payment_intents pi ON pi.id = pa.payment_intent_id
       JOIN tenants t ON t.id = pi.tenant_id
       JOIN merchant_sites ms ON ms.id = pi.site_id
       WHERE pa.provider_code = ?1 AND pa.provider_order_id = ?2
       LIMIT 1`
    )
    .bind(providerCode, providerOrderId)
    .first<{
      attempt_id: string;
      payment_intent_id: string;
      internal_order_id: string;
      payment_status: string;
      fulfillment_status: string;
      tenant_id: string;
      tenant_code: string;
      site_code: string;
      amount: number;
      currency: string;
      callback_url: string | null;
      metadata_json: string | null;
    }>();

  if (!row) return null;

  return {
    ...row,
    metadata_json: parseJson(row.metadata_json)
  };
}

export async function updatePaymentAttemptStatus(
  db: D1Database,
  attemptId: string,
  input: {
    providerTransactionId?: string | null;
    providerRawStatus?: string | null;
    captureReference?: string | null;
    responseJson?: Record<string, unknown>;
    completed?: boolean;
    failed?: boolean;
  }
) {
  const now = nowIso();
  await db
    .prepare(
      `UPDATE payment_attempts
       SET provider_transaction_id = COALESCE(?2, provider_transaction_id),
           provider_raw_status = COALESCE(?3, provider_raw_status),
           capture_reference = COALESCE(?4, capture_reference),
           response_json = COALESCE(?5, response_json),
           completed_at = CASE WHEN ?6 = 1 THEN ?7 ELSE completed_at END,
           failed_at = CASE WHEN ?8 = 1 THEN ?7 ELSE failed_at END
       WHERE id = ?1`
    )
    .bind(
      attemptId,
      input.providerTransactionId || null,
      input.providerRawStatus || null,
      input.captureReference || null,
      input.responseJson ? serializeJson(input.responseJson) : null,
      input.completed ? 1 : 0,
      now,
      input.failed ? 1 : 0
    )
    .run();
}

export async function updatePaymentIntentStatus(
  db: D1Database,
  paymentIntentId: string,
  input: {
    paymentStatus: string;
    fulfillmentStatus?: string;
    paid?: boolean;
  }
) {
  const now = nowIso();
  await db
    .prepare(
      `UPDATE payment_intents
       SET payment_status = ?2,
           fulfillment_status = COALESCE(?3, fulfillment_status),
           updated_at = ?4,
           paid_at = CASE WHEN ?5 = 1 THEN COALESCE(paid_at, ?4) ELSE paid_at END
       WHERE id = ?1`
    )
    .bind(paymentIntentId, input.paymentStatus, input.fulfillmentStatus || null, now, input.paid ? 1 : 0)
    .run();
}

export async function recordProviderEvent(
  db: D1Database,
  input: {
    providerCode: string;
    tenantId?: string | null;
    providerEventId: string;
    eventType: string;
    signatureValid: boolean;
    payload: Record<string, unknown>;
    processed?: boolean;
    errorDetail?: string | null;
  }
) {
  const id = randomId("evt");
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO provider_events (
          id, provider_code, tenant_id, provider_event_id, event_type, signature_valid, payload_json,
          processed, received_at, processed_at, error_detail
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        ON CONFLICT(provider_code, provider_event_id) DO UPDATE SET
          signature_valid = excluded.signature_valid,
          payload_json = excluded.payload_json,
          processed = excluded.processed,
          processed_at = excluded.processed_at,
          error_detail = excluded.error_detail`
    )
    .bind(
      id,
      input.providerCode,
      input.tenantId || null,
      input.providerEventId,
      input.eventType,
      input.signatureValid ? 1 : 0,
      serializeJson(input.payload),
      input.processed ? 1 : 0,
      now,
      input.processed ? now : null,
      input.errorDetail || null
    )
    .run();
}

export async function getProviderEventByEventId(
  db: D1Database,
  providerCode: string,
  providerEventId: string
): Promise<ProviderEventRecord | null> {
  const row = await db
    .prepare(
      `SELECT
         id,
         provider_code,
         tenant_id,
         provider_event_id,
         event_type,
         signature_valid,
         processed,
         received_at,
         processed_at,
         error_detail,
         payload_json
       FROM provider_events
       WHERE provider_code = ?1 AND provider_event_id = ?2
       LIMIT 1`
    )
    .bind(providerCode, providerEventId)
    .first<{
      id: string;
      provider_code: string;
      tenant_id: string | null;
      provider_event_id: string;
      event_type: string;
      signature_valid: number;
      processed: number;
      received_at: string;
      processed_at: string | null;
      error_detail: string | null;
      payload_json: string | null;
    }>();

  if (!row) return null;

  return {
    ...row,
    signature_valid: Boolean(row.signature_valid),
    processed: Boolean(row.processed),
    payload_json: parseJson(row.payload_json)
  };
}

export async function getIdempotencyRecord(db: D1Database, route: string, idempotencyKey: string): Promise<IdempotencyRecord | null> {
  const row = await db
    .prepare(
      `SELECT route, idempotency_key, request_hash, status_code, response_json, created_at
       FROM idempotency_keys
       WHERE route = ?1 AND idempotency_key = ?2
       LIMIT 1`
    )
    .bind(route, idempotencyKey)
    .first<{
      route: string;
      idempotency_key: string;
      request_hash: string;
      status_code: number;
      response_json: string | null;
      created_at: string;
    }>();

  if (!row) return null;

  return {
    ...row,
    response_json: parseJson(row.response_json)
  };
}

export async function putIdempotencyRecord(
  db: D1Database,
  input: {
    route: string;
    idempotencyKey: string;
    requestHash: string;
    statusCode: number;
    responseJson: Record<string, unknown>;
  }
) {
  const id = randomId("idem");
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO idempotency_keys (
          id, route, idempotency_key, request_hash, status_code, response_json, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        ON CONFLICT(route, idempotency_key) DO NOTHING`
    )
    .bind(id, input.route, input.idempotencyKey, input.requestHash, input.statusCode, serializeJson(input.responseJson), now)
    .run();
}

export async function findActiveServiceApiKeyByHash(
  db: D1Database,
  input: {
    tenantCode: string;
    siteCode: string;
    keyHash: string;
  }
): Promise<ServiceApiKeyRecord | null> {
  return db
    .prepare(
      `SELECT
         sak.id,
         t.tenant_code,
         ms.site_code,
         sak.key_label,
         sak.scopes_json,
         sak.last_used_at
       FROM service_api_keys sak
       JOIN tenants t
         ON t.id = sak.tenant_id
       JOIN merchant_sites ms
         ON ms.id = sak.site_id
       WHERE sak.key_hash = ?1
         AND sak.revoked_at IS NULL
         AND t.tenant_code = ?2
         AND ms.site_code = ?3
         AND ms.active = 1
       LIMIT 1`
    )
    .bind(input.keyHash, input.tenantCode, input.siteCode)
    .first<ServiceApiKeyRecord>();
}

export async function touchServiceApiKeyLastUsed(db: D1Database, serviceApiKeyId: string) {
  await db
    .prepare(
      `UPDATE service_api_keys
       SET last_used_at = ?2
       WHERE id = ?1`
    )
    .bind(serviceApiKeyId, nowIso())
    .run();
}

export async function recordAuditLog(
  db: D1Database,
  input: {
    tenantId?: string | null;
    actorType: string;
    actorId?: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    detail?: Record<string, unknown>;
  }
) {
  const id = randomId("audit");
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO audit_logs (
         id, tenant_id, actor_type, actor_id, action, target_type, target_id, detail_json, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
    .bind(
      id,
      input.tenantId || null,
      input.actorType,
      input.actorId || null,
      input.action,
      input.targetType,
      input.targetId || null,
      serializeJson(input.detail),
      now
    )
    .run();
}

export async function listAuditLogsByTarget(
  db: D1Database,
  targetType: string,
  targetId: string,
  limit = 50
): Promise<AuditLogRecord[]> {
  const result = await db
    .prepare(
      `SELECT
         id,
         tenant_id,
         actor_type,
         actor_id,
         action,
         target_type,
         target_id,
         detail_json,
         created_at
       FROM audit_logs
       WHERE target_type = ?1 AND target_id = ?2
       ORDER BY created_at DESC
       LIMIT ?3`
    )
    .bind(targetType, targetId, limit)
    .all<{
      id: string;
      tenant_id: string | null;
      actor_type: string;
      actor_id: string | null;
      action: string;
      target_type: string;
      target_id: string | null;
      detail_json: string | null;
      created_at: string;
    }>();

  return (result.results || []).map((row) => ({
    ...row,
    detail_json: parseJson(row.detail_json)
  }));
}

export async function listAuditLogsByPaymentIntentId(
  db: D1Database,
  paymentIntentId: string,
  limit = 100
): Promise<AuditLogRecord[]> {
  const result = await db
    .prepare(
      `SELECT
         id,
         tenant_id,
         actor_type,
         actor_id,
         action,
         target_type,
         target_id,
         detail_json,
         created_at
       FROM audit_logs
       WHERE (target_type = 'payment_intent' AND target_id = ?1)
          OR json_extract(detail_json, '$.payment_intent_id') = ?1
       ORDER BY created_at DESC
       LIMIT ?2`
    )
    .bind(paymentIntentId, limit)
    .all<{
      id: string;
      tenant_id: string | null;
      actor_type: string;
      actor_id: string | null;
      action: string;
      target_type: string;
      target_id: string | null;
      detail_json: string | null;
      created_at: string;
    }>();

  return (result.results || []).map((row) => ({
    ...row,
    detail_json: parseJson(row.detail_json)
  }));
}

export async function listProviderEventsByInternalOrderId(db: D1Database, providerCode: string, providerOrderId: string) {
  const result = await db
    .prepare(
      `SELECT
         pe.id,
         pe.provider_event_id,
         pe.event_type,
         pe.signature_valid,
         pe.processed,
         pe.received_at,
         pe.processed_at,
         pe.error_detail,
         pe.payload_json
       FROM provider_events pe
       JOIN payment_attempts pa
         ON pa.provider_code = pe.provider_code
       WHERE pa.provider_code = ?1
         AND pa.provider_order_id = ?2
       ORDER BY pe.received_at DESC`
    )
    .bind(providerCode, providerOrderId)
    .all<{
      id: string;
      provider_event_id: string;
      event_type: string;
      signature_valid: number;
      processed: number;
      received_at: string;
      processed_at: string | null;
      error_detail: string | null;
      payload_json: string | null;
    }>();

  return (result.results || []).map((row) => ({
    ...row,
    signature_valid: Boolean(row.signature_valid),
    processed: Boolean(row.processed),
    payload_json: parseJson(row.payload_json)
  }));
}

export async function listProviderEventDeadLetters(
  db: D1Database,
  providerCode: string,
  limit = 50
) {
  const result = await db
    .prepare(
      `SELECT
         id,
         provider_code,
         tenant_id,
         provider_event_id,
         event_type,
         signature_valid,
         processed,
         received_at,
         processed_at,
         error_detail,
         payload_json
       FROM provider_events
       WHERE provider_code = ?1
         AND (processed = 0 OR error_detail IS NOT NULL)
       ORDER BY received_at DESC
       LIMIT ?2`
    )
    .bind(providerCode, limit)
    .all<{
      id: string;
      provider_code: string;
      tenant_id: string | null;
      provider_event_id: string;
      event_type: string;
      signature_valid: number;
      processed: number;
      received_at: string;
      processed_at: string | null;
      error_detail: string | null;
      payload_json: string | null;
    }>();

  return (result.results || []).map((row) => ({
    ...row,
    signature_valid: Boolean(row.signature_valid),
    processed: Boolean(row.processed),
    payload_json: parseJson(row.payload_json)
  }));
}

export async function listLedgerTransfersByPaymentIntentId(db: D1Database, paymentIntentId: string) {
  const result = await db
    .prepare(
      `SELECT
         id,
         transfer_code,
         transfer_type,
         transfer_status,
         currency,
         source_type,
         source_ref_id,
         idempotency_key,
         reference_code,
         description,
         metadata_json,
         effective_at,
         posted_at,
         reversed_at,
         reversed_by_transfer_id,
         created_by_type,
         created_by_id,
         created_at,
         updated_at
       FROM ledger_transfers
       WHERE source_type = 'payment_intent' AND source_ref_id = ?1
       ORDER BY created_at DESC`
    )
    .bind(paymentIntentId)
    .all<{
      id: string;
      transfer_code: string;
      transfer_type: string;
      transfer_status: string;
      currency: string;
      source_type: string | null;
      source_ref_id: string | null;
      idempotency_key: string | null;
      reference_code: string | null;
      description: string | null;
      metadata_json: string | null;
      effective_at: string;
      posted_at: string | null;
      reversed_at: string | null;
      reversed_by_transfer_id: string | null;
      created_by_type: string | null;
      created_by_id: string | null;
      created_at: string;
      updated_at: string;
    }>();

  return (result.results || []).map((row) => ({
    ...row,
    metadata_json: parseJson(row.metadata_json)
  }));
}

export async function listEmailReceiptsByPaymentIntentId(db: D1Database, paymentIntentId: string) {
  const result = await db
    .prepare(
      `SELECT
         er.id,
         er.tenant_id,
         er.payment_intent_id,
         er.recipient_email,
         er.template_code,
         er.provider,
         er.status,
         er.dedupe_key,
         er.payload_json,
         er.created_at,
         er.sent_at,
         er.failed_at,
         er.error_detail,
         ede.id AS delivery_evidence_id,
         ede.flow_code,
         ede.transport,
         ede.sender_email,
         ede.message_id,
         ede.transport_status,
         ede.transport_response_json,
         ede.inbox_status,
         ede.inbox_evidence_json,
         ede.accepted_at,
         ede.inbox_verified_at
       FROM email_receipts er
       LEFT JOIN email_delivery_evidence ede
         ON ede.email_receipt_id = er.id
       WHERE er.payment_intent_id = ?1
       ORDER BY er.created_at DESC`
    )
    .bind(paymentIntentId)
    .all<{
      id: string;
      tenant_id: string;
      payment_intent_id: string;
      recipient_email: string;
      template_code: string;
      provider: string;
      status: string;
      dedupe_key: string;
      payload_json: string | null;
      created_at: string;
      sent_at: string | null;
      failed_at: string | null;
      error_detail: string | null;
      delivery_evidence_id: string | null;
      flow_code: string | null;
      transport: string | null;
      sender_email: string | null;
      message_id: string | null;
      transport_status: string | null;
      transport_response_json: string | null;
      inbox_status: string | null;
      inbox_evidence_json: string | null;
      accepted_at: string | null;
      inbox_verified_at: string | null;
    }>();

  return (result.results || []).map((row) => ({
    id: row.id,
    tenant_id: row.tenant_id,
    payment_intent_id: row.payment_intent_id,
    recipient_email: row.recipient_email,
    template_code: row.template_code,
    provider: row.provider,
    status: row.status,
    dedupe_key: row.dedupe_key,
    payload_json: parseJson(row.payload_json),
    created_at: row.created_at,
    sent_at: row.sent_at,
    failed_at: row.failed_at,
    error_detail: row.error_detail,
    delivery_evidence: row.delivery_evidence_id
      ? {
          id: row.delivery_evidence_id,
          flow_code: row.flow_code,
          transport: row.transport,
          sender_email: row.sender_email,
          message_id: row.message_id,
          transport_status: row.transport_status,
          transport_response_json: parseJson(row.transport_response_json),
          inbox_status: row.inbox_status,
          inbox_evidence_json: parseJson(row.inbox_evidence_json),
          accepted_at: row.accepted_at,
          inbox_verified_at: row.inbox_verified_at
        }
      : null
  }));
}

export async function createRefundRecord(
  db: D1Database,
  input: {
    paymentIntentId: string;
    providerCode: string;
    providerRefundId?: string | null;
    amount: number;
    currency: string;
    status: string;
    reason?: string | null;
  }
): Promise<{ id: string }> {
  const id = randomId("rf");
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO refunds (
         id, payment_intent_id, provider_code, provider_refund_id, amount, currency, status, reason, requested_at, updated_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
    )
    .bind(
      id,
      input.paymentIntentId,
      input.providerCode,
      input.providerRefundId || null,
      input.amount,
      input.currency,
      input.status,
      input.reason || null,
      now,
      now
    )
    .run();

  return { id };
}

export async function listRefundsByPaymentIntentId(db: D1Database, paymentIntentId: string): Promise<RefundRecord[]> {
  const result = await db
    .prepare(
      `SELECT
         id,
         payment_intent_id,
         provider_code,
         provider_refund_id,
         amount,
         currency,
         status,
         reason,
         requested_at,
         updated_at
       FROM refunds
       WHERE payment_intent_id = ?1
       ORDER BY requested_at DESC`
    )
    .bind(paymentIntentId)
    .all<RefundRecord>();

  return result.results || [];
}

export async function getRefundById(db: D1Database, refundId: string): Promise<RefundDetailRecord | null> {
  const row = await db
    .prepare(
      `SELECT
         r.id,
         r.payment_intent_id,
         r.provider_code,
         r.provider_refund_id,
         r.amount,
         r.currency,
         r.status,
         r.reason,
         r.requested_at,
         r.updated_at,
         pi.internal_order_id,
         pi.tenant_id,
         t.tenant_code,
         ms.site_code
       FROM refunds r
       JOIN payment_intents pi
         ON pi.id = r.payment_intent_id
       JOIN tenants t
         ON t.id = pi.tenant_id
       JOIN merchant_sites ms
         ON ms.id = pi.site_id
       WHERE r.id = ?1
       LIMIT 1`
    )
    .bind(refundId)
    .first<RefundDetailRecord>();

  return row || null;
}

export async function totalProcessedRefundAmountByPaymentIntentId(db: D1Database, paymentIntentId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM refunds
       WHERE payment_intent_id = ?1
         AND status IN ('processed', 'completed')`
    )
    .bind(paymentIntentId)
    .first<{ total: number | null }>();

  return Number(row?.total || 0);
}

export async function searchRefunds(
  db: D1Database,
  input: {
    refundId?: string;
    internalOrderId?: string;
    providerRefundId?: string;
    status?: string;
    siteCode?: string;
    limit?: number;
  }
): Promise<RefundDetailRecord[]> {
  const predicates: string[] = [];
  const bindValues: Array<string | number> = [];
  let bindIndex = 1;

  if (input.refundId) {
    predicates.push(`r.id = ?${bindIndex}`);
    bindValues.push(input.refundId);
    bindIndex += 1;
  }

  if (input.internalOrderId) {
    predicates.push(`pi.internal_order_id = ?${bindIndex}`);
    bindValues.push(input.internalOrderId);
    bindIndex += 1;
  }

  if (input.providerRefundId) {
    predicates.push(`r.provider_refund_id = ?${bindIndex}`);
    bindValues.push(input.providerRefundId);
    bindIndex += 1;
  }

  if (input.status) {
    predicates.push(`r.status = ?${bindIndex}`);
    bindValues.push(input.status);
    bindIndex += 1;
  }

  if (input.siteCode) {
    predicates.push(`ms.site_code = ?${bindIndex}`);
    bindValues.push(input.siteCode);
    bindIndex += 1;
  }

  if (predicates.length === 0) return [];

  const limit = Math.max(1, Math.min(input.limit || 50, 200));
  const whereClause = predicates.join(" AND ");

  const result = await db
    .prepare(
      `SELECT
         r.id,
         r.payment_intent_id,
         r.provider_code,
         r.provider_refund_id,
         r.amount,
         r.currency,
         r.status,
         r.reason,
         r.requested_at,
         r.updated_at,
         pi.internal_order_id,
         pi.tenant_id,
         t.tenant_code,
         ms.site_code
       FROM refunds r
       JOIN payment_intents pi
         ON pi.id = r.payment_intent_id
       JOIN tenants t
         ON t.id = pi.tenant_id
       JOIN merchant_sites ms
         ON ms.id = pi.site_id
       WHERE ${whereClause}
       ORDER BY r.requested_at DESC
       LIMIT ${limit}`
    )
    .bind(...bindValues)
    .all<RefundDetailRecord>();

  return result.results || [];
}
