import { PROVIDERS, missingProviderEnvKeys } from "./providers";
import { stringValue } from "./utils";

/**
 * Expected tables per migration file:
 * 0001_init.sql: core payment tables
 * 0002_internal_smtp_evidence.sql: email delivery evidence
 * 0003_ledger_v1.sql: ledger and wallet tables
 */
const EXPECTED_TABLES = [
  // 0001_init
  "tenants",
  "merchant_sites",
  "provider_accounts",
  "service_api_keys",
  "customers",
  "payment_intents",
  "payment_attempts",
  "provider_events",
  "refunds",
  "email_receipts",
  "idempotency_keys",
  "audit_logs",
  // 0002_internal_smtp_evidence
  "email_delivery_evidence",
  // 0003_ledger_v1
  "wallet_accounts",
  "ledger_accounts",
  "ledger_transfers",
  "ledger_entries",
  "wallet_balances",
  // 0004_reconciliation_cases
  "reconciliation_cases"
] as const;

export interface HealthCheckResult {
  ok: boolean;
  service: string;
  environment: string;
  api_base_url: string | null;
  data: {
    shared_read_model: HealthContractSharedReadModel;
    shared_upstream_runtime: HealthContractSharedUpstreamRuntime;
  };
  db_bound: boolean;
  db_ready: boolean;
  schema_ready: boolean;
  schema_proof: {
    expected_tables: number;
    found_tables: number;
    missing_tables: string[];
    present_tables: string[];
  } | null;
  providers_total: number;
  provider_ready: boolean;
  provider_proof: Array<{
    code: string;
    label: string;
    env_ready: boolean;
    missing_env_keys: string[];
    stage: string;
  }>;
  smtp_ready: boolean;
  smtp_proof: {
    missing_env_keys: string[];
  };
  status: string;
  mission: string;
  checked_at: string;
}

interface HealthContractSharedReadModel {
  capabilities: {
    homeRouteRefs: boolean;
    opsDetail: boolean;
    opsSnapshot: boolean;
    paymentSession: boolean;
    receipt: boolean;
  };
  configured: boolean;
  counts: {
    opsAreas: number | null;
    opsWorkItems: number | null;
    paymentSessions: number | null;
    receipts: number | null;
  };
  filePath: string | null;
  rolloutReadyForSharedOnly: boolean;
  source: string;
  _health_contract_stub: true;
  _health_contract_stub_note: string;
}

interface HealthContractSharedUpstreamRuntime {
  activeReadMode: "shared_contract";
  configured: boolean;
  mode: "read_model_url";
  releaseGate: {
    checkedAt: string;
    ready: boolean;
    reasons: string[];
  };
  sources: {
    auth: string | null;
    readModel: string | null;
    reconciliation: string | null;
    session: string | null;
  };
  telemetry: {
    consecutiveRefreshFailures: number;
    lastError: string | null;
    lastRefreshAttemptAt: string | null;
    lastRefreshFailureAt: string | null;
    lastRefreshSuccessAt: string | null;
  };
  _health_contract_stub: true;
  _health_contract_stub_note: string;
}

interface HealthEnv {
  PAYMENTS_DB?: D1Database;
  PAY_ENV?: string;
  PAY_API_BASE_URL?: string;
  PAYOS_CLIENT_ID?: string;
  PAYOS_API_KEY?: string;
  PAYOS_CHECKSUM_KEY?: string;
  SMTP_HOST?: string;
  SMTP_USERNAME?: string;
  SMTP_PASSWORD?: string;
  EMAIL_FROM_PAY?: string;
  EMAIL_FROM_BILLING?: string;
  [key: string]: unknown;
}

async function probeSchema(db: D1Database): Promise<{
  found: string[];
  missing: string[];
}> {
  try {
    const result = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all<{ name: string }>();

    const existingTables = new Set((result.results || []).map((r) => r.name));
    const found: string[] = [];
    const missing: string[] = [];

    for (const table of EXPECTED_TABLES) {
      if (existingTables.has(table)) {
        found.push(table);
      } else {
        missing.push(table);
      }
    }

    return { found, missing };
  } catch (_error) {
    return { found: [], missing: [...EXPECTED_TABLES] };
  }
}

function probeSmtp(env: HealthEnv): string[] {
  const required = ["SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "EMAIL_FROM_PAY", "EMAIL_FROM_BILLING"];
  return required.filter((key) => !stringValue(env[key]));
}

function buildHealthContractStubSharedReadModel(): HealthContractSharedReadModel {
  return {
    capabilities: {
      homeRouteRefs: false,
      opsDetail: false,
      opsSnapshot: false,
      paymentSession: false,
      receipt: false
    },
    configured: false,
    counts: {
      opsAreas: null,
      opsWorkItems: null,
      paymentSessions: null,
      receipts: null
    },
    filePath: null,
    rolloutReadyForSharedOnly: true,
    source: "none",
    _health_contract_stub: true,
    _health_contract_stub_note:
      "Health-contract stub: Worker runtime does not bind the shared read model directly. rolloutReadyForSharedOnly=true is a contract-implementation signal, not provider/live data readiness."
  };
}

function buildHealthContractStubSharedUpstreamRuntime(checkedAt: string): HealthContractSharedUpstreamRuntime {
  return {
    activeReadMode: "shared_contract",
    configured: false,
    mode: "read_model_url",
    releaseGate: {
      checkedAt,
      ready: true,
      reasons: []
    },
    sources: {
      auth: null,
      readModel: null,
      reconciliation: null,
      session: null
    },
    telemetry: {
      consecutiveRefreshFailures: 0,
      lastError: null,
      lastRefreshAttemptAt: null,
      lastRefreshFailureAt: null,
      lastRefreshSuccessAt: null
    },
    _health_contract_stub: true,
    _health_contract_stub_note:
      "Health-contract stub: upstream shared runtime is not configured in this Worker instance. activeReadMode=shared_contract and releaseGate.ready=true are contract-implementation signals, not checkout/provider readiness."
  };
}

export async function buildHealthCheck(env: HealthEnv): Promise<HealthCheckResult> {
  const checkedAt = new Date().toISOString();
  const dbBound = Boolean(env.PAYMENTS_DB);
  let dbReady = false;
  let schemaReady = false;
  let schemaProof: HealthCheckResult["schema_proof"] = null;

  if (dbBound && env.PAYMENTS_DB) {
    const probe = await probeSchema(env.PAYMENTS_DB);
    dbReady = probe.found.length > 0;
    schemaReady = probe.missing.length === 0;
    schemaProof = {
      expected_tables: EXPECTED_TABLES.length,
      found_tables: probe.found.length,
      missing_tables: probe.missing,
      present_tables: probe.found
    };
  }

  const providerProof = PROVIDERS.map((provider) => {
    const missing = missingProviderEnvKeys(provider, env as Record<string, unknown>);
    return {
      code: provider.code,
      label: provider.label,
      env_ready: missing.length === 0,
      missing_env_keys: missing,
      stage: provider.stage
    };
  });

  // provider_ready = at least one launch-stage provider has all env keys
  const providerReady = providerProof.some(
    (p) => p.env_ready && PROVIDERS.find((pr) => pr.code === p.code)?.stage === "launch"
  );

  const smtpMissing = probeSmtp(env);
  const smtpReady = smtpMissing.length === 0;

  const allOk = dbBound && dbReady && schemaReady && providerReady && smtpReady;

  return {
    ok: allOk,
    service: "pay.iai.one",
    environment: stringValue(env.PAY_ENV) || "development",
    api_base_url: stringValue(env.PAY_API_BASE_URL) || null,
    data: {
      shared_read_model: buildHealthContractStubSharedReadModel(),
      shared_upstream_runtime: buildHealthContractStubSharedUpstreamRuntime(checkedAt)
    },
    db_bound: dbBound,
    db_ready: dbReady,
    schema_ready: schemaReady,
    schema_proof: schemaProof,
    providers_total: PROVIDERS.length,
    provider_ready: providerReady,
    provider_proof: providerProof,
    smtp_ready: smtpReady,
    smtp_proof: {
      missing_env_keys: smtpMissing
    },
    status: allOk ? "production_ready" : "not_ready",
    mission: "Private payment orchestration for all IAI sites",
    checked_at: checkedAt
  };
}
