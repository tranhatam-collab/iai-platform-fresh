import { sha256Hex, timingSafeEqual } from "./utils";

export type OperatorAuthorizationResult =
  | { ok: true }
  | { ok: false; status: 401 | 403 | 503; code: string };

export function requiresOperatorAuthorization(path: string, method: string): boolean {
  if (method === "GET") {
    return (
      path === "/v1/payments/search" ||
      path.startsWith("/v1/payments/") ||
      path.startsWith("/v1/refunds/") ||
      path.startsWith("/v1/provider-events/") ||
      path.startsWith("/v1/reconciliation/") ||
      path.startsWith("/v1/finance/") ||
      path.startsWith("/v1/providers/payos/payment-requests/")
    );
  }

  return (
    method === "POST" &&
    (path === "/v1/providers/payos/confirm-webhook" ||
      (path.startsWith("/v1/providers/payos/payment-requests/") && path.endsWith("/cancel")))
  );
}

export async function authorizeOperator(
  headers: Headers,
  expectedSecret: string | undefined
): Promise<OperatorAuthorizationResult> {
  const expected = expectedSecret?.trim() ?? "";
  if (!expected) {
    return { ok: false, status: 503, code: "OPERATOR_AUTH_NOT_CONFIGURED" };
  }

  const provided = headers.get("x-operator-key")?.trim() || headers.get("x-api-key")?.trim() || "";
  if (!provided) {
    return { ok: false, status: 401, code: "OPERATOR_AUTH_REQUIRED" };
  }

  const [providedHash, expectedHash] = await Promise.all([
    sha256Hex(provided),
    sha256Hex(expected),
  ]);
  return timingSafeEqual(providedHash, expectedHash)
    ? { ok: true }
    : { ok: false, status: 403, code: "OPERATOR_AUTH_INVALID" };
}

export function checkoutUrlsMatchSiteOrigin(
  input: { success_url: string; cancel_url: string; callback_url?: string },
  allowedOrigin: string
): boolean {
  try {
    const expectedOrigin = new URL(allowedOrigin).origin;
    return [input.success_url, input.cancel_url, input.callback_url]
      .filter((value): value is string => Boolean(value))
      .every((value) => new URL(value).origin === expectedOrigin);
  } catch {
    return false;
  }
}
