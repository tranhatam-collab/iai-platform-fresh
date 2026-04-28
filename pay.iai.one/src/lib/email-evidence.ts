import { nowIso, stringValue } from "./utils";
import { sendViaInternalSmtp, type InternalSmtpEnv, type InternalSmtpResult } from "./smtp";
import type { PaymentEmailFlowCode } from "./email-policy";

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

export interface PaymentEmailEvidenceInput {
  flowCode: PaymentEmailFlowCode;
  tenantId: string;
  paymentIntentId: string;
  recipientEmail: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  replyTo?: string | null;
  templateCode: string;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentEmailEvidenceResult {
  ok: boolean;
  emailReceiptId: string;
  deliveryEvidenceId: string | null;
  messageId: string | null;
  sender: string | null;
  transport: "internal_smtp";
  smtpResult: InternalSmtpResult | null;
  error?: string;
}

/**
 * Send a payment email via internal SMTP and persist full evidence chain in D1.
 * Steps:
 * 1. Create email_receipts record (queued)
 * 2. Send via internal SMTP
 * 3. Update email_receipts with result
 * 4. Create email_delivery_evidence record with messageId
 */
export async function sendPaymentEmailWithEvidence(
  db: D1Database,
  env: InternalSmtpEnv,
  input: PaymentEmailEvidenceInput
): Promise<PaymentEmailEvidenceResult> {
  const emailReceiptId = randomId("er");
  const now = nowIso();

  // Step 1: Create email_receipts record (queued)
  await db
    .prepare(
      `INSERT INTO email_receipts (
        id, tenant_id, payment_intent_id, recipient_email, template_code,
        provider, status, dedupe_key, payload_json, created_at, sent_at, failed_at, error_detail
      ) VALUES (?1, ?2, ?3, ?4, ?5, 'internal_smtp', 'queued', ?6, ?7, ?8, NULL, NULL, NULL)
      ON CONFLICT(dedupe_key) DO NOTHING`
    )
    .bind(
      emailReceiptId,
      input.tenantId,
      input.paymentIntentId,
      input.recipientEmail,
      input.templateCode,
      input.dedupeKey,
      serializeJson({
        flow_code: input.flowCode,
        subject: input.subject,
        recipient: input.recipientEmail,
        metadata: input.metadata || {}
      }),
      now
    )
    .run();

  // Step 2: Send via internal SMTP
  let smtpResult: InternalSmtpResult | null = null;
  try {
    smtpResult = await sendViaInternalSmtp(env, {
      flowCode: input.flowCode,
      to: input.recipientEmail,
      subject: input.subject,
      text: input.textBody,
      html: input.htmlBody,
      replyTo: input.replyTo
    });
  } catch (error) {
    const typed = error as Error;
    // Step 3a: Update email_receipts with failure
    await db
      .prepare(
        `UPDATE email_receipts
         SET status = 'failed', failed_at = ?2, error_detail = ?3
         WHERE id = ?1`
      )
      .bind(emailReceiptId, now, typed.message || "SMTP transport error")
      .run();

    return {
      ok: false,
      emailReceiptId,
      deliveryEvidenceId: null,
      messageId: null,
      sender: null,
      transport: "internal_smtp",
      smtpResult: null,
      error: typed.message || "SMTP transport error"
    };
  }

  if (!smtpResult.ok) {
    // Step 3b: Update email_receipts with SMTP failure
    await db
      .prepare(
        `UPDATE email_receipts
         SET status = 'failed', failed_at = ?2, error_detail = ?3
         WHERE id = ?1`
      )
      .bind(
        emailReceiptId,
        now,
        smtpResult.smtpResponseLines.join(" | ") || "SMTP delivery failed"
      )
      .run();

    return {
      ok: false,
      emailReceiptId,
      deliveryEvidenceId: null,
      messageId: smtpResult.messageId,
      sender: smtpResult.sender,
      transport: "internal_smtp",
      smtpResult,
      error: smtpResult.smtpResponseLines.join(" | ")
    };
  }

  // Step 3c: Update email_receipts with success
  await db
    .prepare(
      `UPDATE email_receipts
       SET status = 'sent', sent_at = ?2
       WHERE id = ?1`
    )
    .bind(emailReceiptId, smtpResult.acceptedAt || now)
    .run();

  // Step 4: Create email_delivery_evidence record
  const deliveryEvidenceId = randomId("ede");
  await db
    .prepare(
      `INSERT INTO email_delivery_evidence (
        id, email_receipt_id, payment_intent_id, flow_code, transport,
        sender_email, recipient_email, message_id,
        transport_status, transport_response_json,
        inbox_status, inbox_evidence_json,
        created_at, accepted_at, inbox_verified_at
      ) VALUES (?1, ?2, ?3, ?4, 'internal_smtp', ?5, ?6, ?7, 'accepted', ?8, 'pending', NULL, ?9, ?10, NULL)`
    )
    .bind(
      deliveryEvidenceId,
      emailReceiptId,
      input.paymentIntentId,
      input.flowCode,
      smtpResult.sender,
      input.recipientEmail,
      smtpResult.messageId,
      serializeJson({
        smtp_response_lines: smtpResult.smtpResponseLines,
        missing_env_keys: smtpResult.missingEnvKeys
      }),
      now,
      smtpResult.acceptedAt
    )
    .run();

  return {
    ok: true,
    emailReceiptId,
    deliveryEvidenceId,
    messageId: smtpResult.messageId,
    sender: smtpResult.sender,
    transport: "internal_smtp",
    smtpResult
  };
}

/**
 * Generate a dedupe key for payment email to prevent duplicate sends.
 */
export function paymentEmailDedupeKey(
  paymentIntentId: string,
  flowCode: string,
  recipientEmail: string
): string {
  return `${paymentIntentId}:${flowCode}:${recipientEmail}`;
}
