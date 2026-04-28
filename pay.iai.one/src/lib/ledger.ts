import { nowIso } from "./utils";

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type TransferType =
  | "payment_capture"
  | "payment_refund"
  | "payment_reversal"
  | "payment_fee"
  | "manual_adjustment"
  | "opening_balance"
  | "settlement";

export type TransferStatus = "draft" | "posted" | "reversed";
export type EntrySide = "debit" | "credit";
export type BalanceBucket = "available" | "pending" | "reserved" | "settled" | "n_a";
export type AccountKind = "asset" | "liability" | "equity" | "income" | "expense" | "memo";

export interface PostingEntry {
  ledgerAccountId: string;
  side: EntrySide;
  amount: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PostTransferInput {
  tenantId: string;
  transferType: TransferType;
  currency: string;
  sourceType: string;
  sourceRefId: string;
  idempotencyKey: string;
  referenceCode?: string;
  description?: string;
  entries: PostingEntry[];
  metadata?: Record<string, unknown>;
  createdByType?: string;
  createdById?: string;
}

export interface PostTransferResult {
  ok: boolean;
  transferId: string;
  transferCode: string;
  entryCount: number;
  error?: string;
}

// ─── Account Resolution ──────────────────────────────────────────────────────

export interface EnsureLedgerAccountInput {
  tenantId: string;
  accountCode: string;
  accountName: string;
  accountKind: AccountKind;
  balanceBucket: BalanceBucket;
  normalBalanceSide: EntrySide;
  scopeType: string;
  scopeRefId?: string;
  providerCode?: string;
  currency: string;
  walletAccountId?: string;
}

export async function ensureLedgerAccount(
  db: D1Database,
  input: EnsureLedgerAccountInput
): Promise<string> {
  const existing = await db
    .prepare(
      `SELECT id FROM ledger_accounts
       WHERE tenant_id = ?1 AND account_code = ?2 AND currency = ?3
       LIMIT 1`
    )
    .bind(input.tenantId, input.accountCode, input.currency)
    .first<{ id: string }>();

  if (existing) return existing.id;

  const id = randomId("la");
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO ledger_accounts (
        id, tenant_id, wallet_account_id, account_code, account_name,
        account_kind, balance_bucket, normal_balance_side,
        scope_type, scope_ref_id, provider_code, currency,
        account_status, metadata_json, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 'active', '{}', ?13, ?14)`
    )
    .bind(
      id,
      input.tenantId,
      input.walletAccountId || null,
      input.accountCode,
      input.accountName,
      input.accountKind,
      input.balanceBucket,
      input.normalBalanceSide,
      input.scopeType,
      input.scopeRefId || null,
      input.providerCode || null,
      input.currency,
      now,
      now
    )
    .run();

  return id;
}

// ─── Wallet Account Resolution ───────────────────────────────────────────────

export async function ensureWalletAccount(
  db: D1Database,
  input: {
    tenantId: string;
    walletOwnerType: string;
    walletOwnerRefId: string;
    walletCode: string;
    walletLabel: string;
    defaultCurrency: string;
  }
): Promise<string> {
  const existing = await db
    .prepare(
      `SELECT id FROM wallet_accounts
       WHERE tenant_id = ?1 AND wallet_owner_type = ?2 AND wallet_owner_ref_id = ?3 AND wallet_code = ?4
       LIMIT 1`
    )
    .bind(input.tenantId, input.walletOwnerType, input.walletOwnerRefId, input.walletCode)
    .first<{ id: string }>();

  if (existing) return existing.id;

  const id = randomId("wa");
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO wallet_accounts (
        id, tenant_id, wallet_owner_type, wallet_owner_ref_id,
        wallet_code, wallet_label, wallet_status, default_currency,
        metadata_json, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'active', ?7, '{}', ?8, ?9)`
    )
    .bind(
      id,
      input.tenantId,
      input.walletOwnerType,
      input.walletOwnerRefId,
      input.walletCode,
      input.walletLabel,
      input.defaultCurrency,
      now,
      now
    )
    .run();

  return id;
}

// ─── Transfer Posting ────────────────────────────────────────────────────────

/**
 * Post a double-entry transfer to the ledger.
 * Validates that debits == credits before writing.
 * Idempotent: duplicate idempotency_key returns existing transfer.
 */
export async function postTransfer(
  db: D1Database,
  input: PostTransferInput
): Promise<PostTransferResult> {
  const transferCode = `${input.transferType}_${randomId("tx")}`;
  const transferId = randomId("lt");
  const now = nowIso();

  // Validate balanced entries
  let totalDebit = 0;
  let totalCredit = 0;
  for (const entry of input.entries) {
    if (entry.side === "debit") totalDebit += entry.amount;
    else totalCredit += entry.amount;
  }

  if (totalDebit !== totalCredit) {
    return {
      ok: false,
      transferId: "",
      transferCode: "",
      entryCount: 0,
      error: `Unbalanced entries: debit=${totalDebit} credit=${totalCredit}`
    };
  }

  if (input.entries.length < 2) {
    return {
      ok: false,
      transferId: "",
      transferCode: "",
      entryCount: 0,
      error: "A transfer requires at least two entries (debit + credit)."
    };
  }

  // Check idempotency
  const existing = await db
    .prepare(
      `SELECT id, transfer_code FROM ledger_transfers
       WHERE tenant_id = ?1 AND transfer_type = ?2 AND idempotency_key = ?3
       LIMIT 1`
    )
    .bind(input.tenantId, input.transferType, input.idempotencyKey)
    .first<{ id: string; transfer_code: string }>();

  if (existing) {
    return {
      ok: true,
      transferId: existing.id,
      transferCode: existing.transfer_code,
      entryCount: input.entries.length
    };
  }

  // Create transfer
  await db
    .prepare(
      `INSERT INTO ledger_transfers (
        id, tenant_id, transfer_code, transfer_type, transfer_status,
        currency, source_type, source_ref_id, idempotency_key,
        reference_code, description, metadata_json,
        effective_at, posted_at, reversed_at, reversed_by_transfer_id,
        created_by_type, created_by_id, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, 'posted', ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, NULL, NULL, ?14, ?15, ?16, ?17)`
    )
    .bind(
      transferId,
      input.tenantId,
      transferCode,
      input.transferType,
      input.currency,
      input.sourceType,
      input.sourceRefId,
      input.idempotencyKey,
      input.referenceCode || null,
      input.description || null,
      serializeJson(input.metadata),
      now,
      now,
      input.createdByType || "system",
      input.createdById || "pay.iai.one",
      now,
      now
    )
    .run();

  // Create entries
  for (let i = 0; i < input.entries.length; i++) {
    const entry = input.entries[i];
    const entryId = randomId("le");
    await db
      .prepare(
        `INSERT INTO ledger_entries (
          id, tenant_id, transfer_id, ledger_account_id, sequence_no,
          entry_side, amount, currency, description, metadata_json, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
      )
      .bind(
        entryId,
        input.tenantId,
        transferId,
        entry.ledgerAccountId,
        i + 1,
        entry.side,
        entry.amount,
        input.currency,
        entry.description || null,
        serializeJson(entry.metadata),
        now
      )
      .run();
  }

  return {
    ok: true,
    transferId,
    transferCode,
    entryCount: input.entries.length
  };
}

// ─── Payment Capture Posting Rule (B2) ───────────────────────────────────────

/**
 * Post a payment_capture transfer when a payment is confirmed.
 * Creates the standard double-entry:
 *   DR provider_receivable (asset/pending)
 *   CR tenant_revenue (liability/available)
 *
 * This is the core posting rule for Wave 2.
 */
export async function postPaymentCapture(
  db: D1Database,
  input: {
    tenantId: string;
    siteCode: string;
    paymentIntentId: string;
    providerCode: string;
    providerOrderId: string;
    amount: number;
    currency: string;
  }
): Promise<PostTransferResult> {
  // Ensure accounts exist
  const receivableAccountId = await ensureLedgerAccount(db, {
    tenantId: input.tenantId,
    accountCode: `provider_receivable:${input.providerCode}`,
    accountName: `${input.providerCode} receivable`,
    accountKind: "asset",
    balanceBucket: "pending",
    normalBalanceSide: "debit",
    scopeType: "provider",
    scopeRefId: input.providerCode,
    providerCode: input.providerCode,
    currency: input.currency
  });

  const revenueAccountId = await ensureLedgerAccount(db, {
    tenantId: input.tenantId,
    accountCode: `tenant_revenue:${input.siteCode}`,
    accountName: `${input.siteCode} revenue`,
    accountKind: "liability",
    balanceBucket: "available",
    normalBalanceSide: "credit",
    scopeType: "site",
    scopeRefId: input.siteCode,
    currency: input.currency
  });

  return postTransfer(db, {
    tenantId: input.tenantId,
    transferType: "payment_capture",
    currency: input.currency,
    sourceType: "payment_intent",
    sourceRefId: input.paymentIntentId,
    idempotencyKey: `capture:${input.paymentIntentId}`,
    referenceCode: input.providerOrderId,
    description: `Payment capture for ${input.providerCode} order ${input.providerOrderId}`,
    entries: [
      {
        ledgerAccountId: receivableAccountId,
        side: "debit",
        amount: input.amount,
        description: `Receivable from ${input.providerCode}`
      },
      {
        ledgerAccountId: revenueAccountId,
        side: "credit",
        amount: input.amount,
        description: `Revenue for site ${input.siteCode}`
      }
    ],
    metadata: {
      payment_intent_id: input.paymentIntentId,
      provider_order_id: input.providerOrderId,
      provider_code: input.providerCode
    }
  });
}

// ─── B3: Refund Posting Rule ─────────────────────────────────────────────────

/**
 * Post a payment_refund transfer when a refund is processed.
 * Reverses the revenue entry:
 *   DR tenant_revenue (liability/available) -- reduce revenue
 *   CR provider_receivable (asset/pending) -- reduce receivable
 */
export async function postPaymentRefund(
  db: D1Database,
  input: {
    tenantId: string;
    siteCode: string;
    paymentIntentId: string;
    refundId: string;
    providerCode: string;
    providerRefundId: string;
    amount: number;
    currency: string;
    reason?: string;
  }
): Promise<PostTransferResult> {
  const receivableAccountId = await ensureLedgerAccount(db, {
    tenantId: input.tenantId,
    accountCode: `provider_receivable:${input.providerCode}`,
    accountName: `${input.providerCode} receivable`,
    accountKind: "asset",
    balanceBucket: "pending",
    normalBalanceSide: "debit",
    scopeType: "provider",
    scopeRefId: input.providerCode,
    providerCode: input.providerCode,
    currency: input.currency
  });

  const revenueAccountId = await ensureLedgerAccount(db, {
    tenantId: input.tenantId,
    accountCode: `tenant_revenue:${input.siteCode}`,
    accountName: `${input.siteCode} revenue`,
    accountKind: "liability",
    balanceBucket: "available",
    normalBalanceSide: "credit",
    scopeType: "site",
    scopeRefId: input.siteCode,
    currency: input.currency
  });

  return postTransfer(db, {
    tenantId: input.tenantId,
    transferType: "payment_refund",
    currency: input.currency,
    sourceType: "refund",
    sourceRefId: input.refundId,
    idempotencyKey: `refund:${input.refundId}`,
    referenceCode: input.providerRefundId,
    description: `Refund for payment ${input.paymentIntentId}${input.reason ? `: ${input.reason}` : ""}`,
    entries: [
      {
        ledgerAccountId: revenueAccountId,
        side: "debit",
        amount: input.amount,
        description: `Revenue reversal for refund`
      },
      {
        ledgerAccountId: receivableAccountId,
        side: "credit",
        amount: input.amount,
        description: `Receivable reduction for refund from ${input.providerCode}`
      }
    ],
    metadata: {
      payment_intent_id: input.paymentIntentId,
      refund_id: input.refundId,
      provider_refund_id: input.providerRefundId,
      reason: input.reason || null
    }
  });
}

// ─── B3: Reversal Posting Rule ───────────────────────────────────────────────

/**
 * Post a payment_reversal transfer (immutable reversal, not mutable correction).
 * Creates a new transfer that reverses the original, then marks original as reversed.
 *   DR tenant_revenue (reverse the credit)
 *   CR provider_receivable (reverse the debit)
 */
export async function postPaymentReversal(
  db: D1Database,
  input: {
    tenantId: string;
    siteCode: string;
    originalTransferId: string;
    paymentIntentId: string;
    providerCode: string;
    amount: number;
    currency: string;
    reason?: string;
  }
): Promise<PostTransferResult> {
  const receivableAccountId = await ensureLedgerAccount(db, {
    tenantId: input.tenantId,
    accountCode: `provider_receivable:${input.providerCode}`,
    accountName: `${input.providerCode} receivable`,
    accountKind: "asset",
    balanceBucket: "pending",
    normalBalanceSide: "debit",
    scopeType: "provider",
    scopeRefId: input.providerCode,
    providerCode: input.providerCode,
    currency: input.currency
  });

  const revenueAccountId = await ensureLedgerAccount(db, {
    tenantId: input.tenantId,
    accountCode: `tenant_revenue:${input.siteCode}`,
    accountName: `${input.siteCode} revenue`,
    accountKind: "liability",
    balanceBucket: "available",
    normalBalanceSide: "credit",
    scopeType: "site",
    scopeRefId: input.siteCode,
    currency: input.currency
  });

  const result = await postTransfer(db, {
    tenantId: input.tenantId,
    transferType: "payment_reversal",
    currency: input.currency,
    sourceType: "ledger_transfer",
    sourceRefId: input.originalTransferId,
    idempotencyKey: `reversal:${input.originalTransferId}`,
    description: `Reversal of transfer ${input.originalTransferId}${input.reason ? `: ${input.reason}` : ""}`,
    entries: [
      {
        ledgerAccountId: revenueAccountId,
        side: "debit",
        amount: input.amount,
        description: "Revenue reversal"
      },
      {
        ledgerAccountId: receivableAccountId,
        side: "credit",
        amount: input.amount,
        description: "Receivable reversal"
      }
    ],
    metadata: {
      original_transfer_id: input.originalTransferId,
      payment_intent_id: input.paymentIntentId,
      reason: input.reason || null
    }
  });

  if (result.ok) {
    // Mark original transfer as reversed
    const now = nowIso();
    await db
      .prepare(
        `UPDATE ledger_transfers
         SET transfer_status = 'reversed', reversed_at = ?2, reversed_by_transfer_id = ?3, updated_at = ?4
         WHERE id = ?1 AND transfer_status = 'posted'`
      )
      .bind(input.originalTransferId, now, result.transferId, now)
      .run();
  }

  return result;
}

// ─── B4: Reconciliation Case Model ──────────────────────────────────────────

/**
 * Wallet balance update after a transfer is posted.
 * Updates the read model (wallet_balances) based on the bucket of each ledger account.
 */
export async function updateWalletBalance(
  db: D1Database,
  input: {
    tenantId: string;
    walletAccountId: string;
    currency: string;
    bucket: BalanceBucket;
    delta: number;
  }
): Promise<void> {
  const now = nowIso();
  const bucketColumn =
    input.bucket === "available"
      ? "available_amount"
      : input.bucket === "pending"
        ? "pending_amount"
        : input.bucket === "reserved"
          ? "reserved_amount"
          : input.bucket === "settled"
            ? "settled_amount"
            : null;

  if (!bucketColumn) return;

  // Upsert wallet balance
  const existing = await db
    .prepare(
      `SELECT id, version FROM wallet_balances
       WHERE wallet_account_id = ?1 AND currency = ?2
       LIMIT 1`
    )
    .bind(input.walletAccountId, input.currency)
    .first<{ id: string; version: number }>();

  if (existing) {
    await db
      .prepare(
        `UPDATE wallet_balances
         SET ${bucketColumn} = MAX(0, ${bucketColumn} + ?2), version = version + 1, updated_at = ?3
         WHERE id = ?1`
      )
      .bind(existing.id, input.delta, now)
      .run();
  } else {
    const id = randomId("wb");
    const initialValues = {
      available_amount: 0,
      pending_amount: 0,
      reserved_amount: 0,
      settled_amount: 0
    };
    initialValues[bucketColumn as keyof typeof initialValues] = Math.max(0, input.delta);

    await db
      .prepare(
        `INSERT INTO wallet_balances (
          id, tenant_id, wallet_account_id, currency,
          available_amount, pending_amount, reserved_amount, settled_amount,
          version, metadata_json, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, '{}', ?9, ?10)`
      )
      .bind(
        id,
        input.tenantId,
        input.walletAccountId,
        input.currency,
        initialValues.available_amount,
        initialValues.pending_amount,
        initialValues.reserved_amount,
        initialValues.settled_amount,
        now,
        now
      )
      .run();
  }
}
