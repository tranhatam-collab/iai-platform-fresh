import type { PayOSEnv } from "./payos";
import { stringValue } from "./utils";

interface ProviderAccountRow {
  provider_code: string;
  merchant_reference: string | null;
  secret_binding_prefix: string | null;
  live_mode: number;
  status: string;
}

export type TenantPayOSResolution =
  | { ok: true; env: PayOSEnv; callbackHmac: string; account: ProviderAccountRow }
  | { ok: false; status: 503; body: Record<string, unknown> };

export async function resolveTenantPayOSEnvironment(
  db: D1Database,
  env: Record<string, unknown>,
  input: { tenantId?: string; tenantCode?: string }
): Promise<TenantPayOSResolution> {
  const tenantId = stringValue(input.tenantId);
  const tenantCode = stringValue(input.tenantCode);
  const account = tenantId
    ? await db
        .prepare(
          `SELECT provider_code, merchant_reference, secret_binding_prefix, live_mode, status
             FROM provider_accounts
             WHERE tenant_id = ?1 AND provider_code = 'payos'
             LIMIT 1`
        )
        .bind(tenantId)
        .first<ProviderAccountRow>()
    : await db
        .prepare(
          `SELECT pa.provider_code, pa.merchant_reference, pa.secret_binding_prefix, pa.live_mode, pa.status
             FROM provider_accounts pa
             JOIN tenants t ON t.id = pa.tenant_id
             WHERE t.tenant_code = ?1 AND pa.provider_code = 'payos'
             LIMIT 1`
        )
        .bind(tenantCode)
        .first<ProviderAccountRow>();

  const status = stringValue(account?.status) || "missing";
  const liveMode = Number(account?.live_mode || 0) === 1;
  const merchantReference = stringValue(account?.merchant_reference);
  const prefix = stringValue(account?.secret_binding_prefix);

  if (!account || status !== "active" || !liveMode || !merchantReference || !/^[A-Z][A-Z0-9_]{2,48}$/.test(prefix)) {
    return {
      ok: false,
      status: 503,
      body: {
        ok: false,
        code: "PAYOS_TENANT_ACCOUNT_NOT_READY",
        message: "The tenant PayOS merchant account is not ready for live transactions.",
        tenant_code: tenantCode || null,
        provider_account_status: status,
        live_mode: liveMode,
        merchant_reference_configured: Boolean(merchantReference),
        credential_binding_configured: Boolean(prefix)
      }
    };
  }

  const scopedEnv: PayOSEnv = {
    PAYOS_CLIENT_ID: stringValue(env[`${prefix}_CLIENT_ID`]),
    PAYOS_API_KEY: stringValue(env[`${prefix}_API_KEY`]),
    PAYOS_CHECKSUM_KEY: stringValue(env[`${prefix}_CHECKSUM_KEY`]),
    PAYOS_PARTNER_CODE: stringValue(env[`${prefix}_PARTNER_CODE`]) || undefined
  };
  const missingFields = [
    ["CLIENT_ID", scopedEnv.PAYOS_CLIENT_ID],
    ["API_KEY", scopedEnv.PAYOS_API_KEY],
    ["CHECKSUM_KEY", scopedEnv.PAYOS_CHECKSUM_KEY]
  ].filter(([, value]) => !value).map(([field]) => field);

  if (missingFields.length > 0) {
    return {
      ok: false,
      status: 503,
      body: {
        ok: false,
        code: "PAYOS_TENANT_CREDENTIALS_MISSING",
        message: "The tenant PayOS credential bindings are incomplete.",
        tenant_code: tenantCode || null,
        missing_credential_fields: missingFields
      }
    };
  }

  return {
    ok: true,
    env: scopedEnv,
    callbackHmac: stringValue(env[`${prefix}_CALLBACK_HMAC`]),
    account
  };
}
