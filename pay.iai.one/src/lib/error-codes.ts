/**
 * Stable internal error codes for pay.iai.one
 * Every provider error is normalized to one of these before returning to consumers.
 */

export type InternalPaymentErrorCode =
  | "PROVIDER_UNSUPPORTED"
  | "PROVIDER_CREDENTIALS_MISSING"
  | "PROVIDER_CONNECTIVITY_FAILED"
  | "PROVIDER_REQUEST_REJECTED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RESPONSE_INVALID"
  | "AMOUNT_INVALID"
  | "AMOUNT_TOO_LOW"
  | "AMOUNT_TOO_HIGH"
  | "CURRENCY_UNSUPPORTED"
  | "ORDER_ALREADY_EXISTS"
  | "ORDER_NOT_FOUND"
  | "IDEMPOTENCY_KEY_REQUIRED"
  | "IDEMPOTENCY_CONFLICT"
  | "API_KEY_REQUIRED"
  | "API_KEY_INVALID"
  | "API_KEY_SCOPE_MISMATCH"
  | "DB_NOT_READY"
  | "INVALID_JSON"
  | "INTERNAL_CONTRACT_INVALID"
  | "WEBHOOK_SIGNATURE_INVALID"
  | "WEBHOOK_DUPLICATE"
  | "PAYMENT_NOT_FOUND"
  | "UNHANDLED_ERROR";

export interface NormalizedPaymentError {
  code: InternalPaymentErrorCode;
  message: string;
  provider_code?: string;
  provider_error_code?: string;
  provider_error_message?: string;
  retryable: boolean;
}

const PAYOS_ERROR_MAP: Record<string, { code: InternalPaymentErrorCode; retryable: boolean }> = {
  "20": { code: "PROVIDER_REQUEST_REJECTED", retryable: false },
  "21": { code: "AMOUNT_INVALID", retryable: false },
  "22": { code: "PROVIDER_REQUEST_REJECTED", retryable: false },
  "23": { code: "ORDER_ALREADY_EXISTS", retryable: false },
  "25": { code: "PROVIDER_REQUEST_REJECTED", retryable: false },
  "26": { code: "PROVIDER_CONNECTIVITY_FAILED", retryable: true },
  "29": { code: "PROVIDER_CREDENTIALS_MISSING", retryable: false },
  "-1": { code: "PROVIDER_CONNECTIVITY_FAILED", retryable: true }
};

export function normalizePayOSError(
  providerErrorCode: string | null | undefined,
  providerMessage: string | null | undefined
): NormalizedPaymentError {
  const mapped = providerErrorCode ? PAYOS_ERROR_MAP[providerErrorCode] : undefined;

  return {
    code: mapped?.code || "PROVIDER_RESPONSE_INVALID",
    message: providerMessage || "Provider returned an error.",
    provider_code: "payos",
    provider_error_code: providerErrorCode || undefined,
    provider_error_message: providerMessage || undefined,
    retryable: mapped?.retryable ?? false
  };
}

/**
 * VND amount validation per payOS constraints:
 * - Minimum: 2,000 VND
 * - Maximum: 500,000,000 VND (500M)
 * - Must be integer (no decimals for VND)
 */
const VND_MIN_AMOUNT = 2_000;
const VND_MAX_AMOUNT = 500_000_000;

export function validatePaymentAmount(
  amount: number,
  currency: string
): NormalizedPaymentError | null {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    return {
      code: "AMOUNT_INVALID",
      message: "Amount must be a positive integer in minor units.",
      retryable: false
    };
  }

  if (currency === "VND") {
    if (amount < VND_MIN_AMOUNT) {
      return {
        code: "AMOUNT_TOO_LOW",
        message: `Minimum VND amount is ${VND_MIN_AMOUNT.toLocaleString()} VND.`,
        retryable: false
      };
    }
    if (amount > VND_MAX_AMOUNT) {
      return {
        code: "AMOUNT_TOO_HIGH",
        message: `Maximum VND amount is ${VND_MAX_AMOUNT.toLocaleString()} VND.`,
        retryable: false
      };
    }
  }

  return null;
}
