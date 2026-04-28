import type { ServiceApiKeyRecord } from "./db";
import { findActiveServiceApiKeyByHash, touchServiceApiKeyLastUsed } from "./db";
import { json } from "./http";
import { sha256Hex, stringValue } from "./utils";

const INTERNAL_CHECKOUT_SCOPE = "internal:checkout-session:create";
const INTERNAL_REFUND_SCOPE = "internal:refund:create";
const INTERNAL_RECON_SCOPE = "internal:reconciliation:manage";

function requestApiKey(request: Request): string {
  return stringValue(request.headers.get("x-api-key")) || stringValue(request.headers.get("x-site-key"));
}

function parseScopes(value: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch (_error) {
    return [];
  }
}

function hasRequiredScope(record: ServiceApiKeyRecord): boolean {
  const scopes = parseScopes(record.scopes_json);
  return scopes.includes("*") || scopes.includes(INTERNAL_CHECKOUT_SCOPE);
}

function hasRefundScope(record: ServiceApiKeyRecord): boolean {
  const scopes = parseScopes(record.scopes_json);
  return scopes.includes("*") || scopes.includes(INTERNAL_REFUND_SCOPE);
}

function hasReconciliationScope(record: ServiceApiKeyRecord): boolean {
  const scopes = parseScopes(record.scopes_json);
  return scopes.includes("*") || scopes.includes(INTERNAL_RECON_SCOPE);
}

export async function authorizeInternalCheckoutSiteKey(
  db: D1Database,
  request: Request,
  input: {
    tenantCode: string;
    siteCode: string;
  }
): Promise<{ ok: true; record: ServiceApiKeyRecord } | { ok: false; response: Response }> {
  const siteKey = requestApiKey(request);

  if (!siteKey) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          success: false,
          contract_version: "2026-04-15",
          code: "API_KEY_REQUIRED",
          message: "x-api-key is required on the internal checkout contract. Legacy x-site-key is still accepted."
        },
        401
      )
    };
  }

  const keyHash = await sha256Hex(siteKey);
  const record = await findActiveServiceApiKeyByHash(db, {
    tenantCode: input.tenantCode,
    siteCode: input.siteCode,
    keyHash
  });

  if (!record) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          success: false,
          contract_version: "2026-04-15",
          code: "API_KEY_INVALID",
          message: "The supplied API key is invalid for this tenant/site contract."
        },
        403
      )
    };
  }

  if (!hasRequiredScope(record)) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          success: false,
          contract_version: "2026-04-15",
          code: "API_KEY_SCOPE_MISMATCH",
          message: "The supplied API key does not have permission to create internal checkout sessions."
        },
        403
      )
    };
  }

  await touchServiceApiKeyLastUsed(db, record.id);

  return {
    ok: true,
    record
  };
}

export async function authorizeInternalRefundSiteKey(
  db: D1Database,
  request: Request,
  input: {
    tenantCode: string;
    siteCode: string;
  }
): Promise<{ ok: true; record: ServiceApiKeyRecord } | { ok: false; response: Response }> {
  const siteKey = requestApiKey(request);

  if (!siteKey) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          success: false,
          contract_version: "2026-04-15",
          code: "API_KEY_REQUIRED",
          message: "x-api-key is required on the internal refund contract. Legacy x-site-key is still accepted."
        },
        401
      )
    };
  }

  const keyHash = await sha256Hex(siteKey);
  const record = await findActiveServiceApiKeyByHash(db, {
    tenantCode: input.tenantCode,
    siteCode: input.siteCode,
    keyHash
  });

  if (!record) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          success: false,
          contract_version: "2026-04-15",
          code: "API_KEY_INVALID",
          message: "The supplied API key is invalid for this tenant/site refund contract."
        },
        403
      )
    };
  }

  if (!hasRefundScope(record)) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          success: false,
          contract_version: "2026-04-15",
          code: "API_KEY_SCOPE_MISMATCH",
          message: "The supplied API key does not have permission to create internal refunds."
        },
        403
      )
    };
  }

  await touchServiceApiKeyLastUsed(db, record.id);

  return {
    ok: true,
    record
  };
}

export async function authorizeInternalReconciliationSiteKey(
  db: D1Database,
  request: Request,
  input: {
    tenantCode: string;
    siteCode: string;
  }
): Promise<{ ok: true; record: ServiceApiKeyRecord } | { ok: false; response: Response }> {
  const siteKey = requestApiKey(request);

  if (!siteKey) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          success: false,
          contract_version: "2026-04-15",
          code: "API_KEY_REQUIRED",
          message: "x-api-key is required on reconciliation management routes. Legacy x-site-key is still accepted."
        },
        401
      )
    };
  }

  const keyHash = await sha256Hex(siteKey);
  const record = await findActiveServiceApiKeyByHash(db, {
    tenantCode: input.tenantCode,
    siteCode: input.siteCode,
    keyHash
  });

  if (!record) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          success: false,
          contract_version: "2026-04-15",
          code: "API_KEY_INVALID",
          message: "The supplied API key is invalid for this tenant/site reconciliation contract."
        },
        403
      )
    };
  }

  if (!hasReconciliationScope(record)) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          success: false,
          contract_version: "2026-04-15",
          code: "API_KEY_SCOPE_MISMATCH",
          message: "The supplied API key does not have permission to manage reconciliation cases."
        },
        403
      )
    };
  }

  await touchServiceApiKeyLastUsed(db, record.id);

  return {
    ok: true,
    record
  };
}
