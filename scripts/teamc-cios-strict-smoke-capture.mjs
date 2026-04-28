import crypto from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const timezone = "Asia/Ho_Chi_Minh";
const maxAttempts = 4;
const requestTimeoutMs = 20_000;

function todayInTimezone(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function getArg(name) {
  const explicit = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  return explicit ? explicit.slice(name.length + 3) : null;
}

function getDateArg() {
  return getArg("date") ?? todayInTimezone(timezone);
}

function parseDotEnv(raw) {
  const result = {};
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function readEnvFile(filePath) {
  try {
    return parseDotEnv(readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function getConfig(dotEnv) {
  const workersApiUrl =
    dotEnv.WORKERS_API_URL ??
    process.env.WORKERS_API_URL ??
    process.env.CIOS_WORKERS_API_URL ??
    "https://cios-workers-api.tranhatam66.workers.dev";
  const issuer =
    dotEnv.JWT_ISSUER ??
    process.env.JWT_ISSUER ??
    process.env.CIOS_WORKERS_JWT_ISSUER ??
    "cios.iai.one";
  const audience =
    dotEnv.JWT_AUDIENCE ??
    process.env.JWT_AUDIENCE ??
    process.env.CIOS_WORKERS_JWT_AUDIENCE ??
    "cios-workers-api";
  const directToken =
    process.env.CIOS_WORKERS_BEARER_TOKEN ?? dotEnv.CIOS_WORKERS_BEARER_TOKEN ?? "";
  const sessionEmail = process.env.CIOS_AUTH_EMAIL ?? dotEnv.CIOS_AUTH_EMAIL ?? "admin@iai.one";
  const sessionPassword =
    process.env.CIOS_AUTH_PASSWORD ??
    process.env.AUTH_DEMO_PASSWORD ??
    dotEnv.CIOS_AUTH_PASSWORD ??
    dotEnv.AUTH_DEMO_PASSWORD ??
    "demo123456";
  const sessionWorkspaceCode =
    process.env.CIOS_AUTH_WORKSPACE_CODE ?? dotEnv.CIOS_AUTH_WORKSPACE_CODE ?? "demo";
  const sessionPlan = process.env.CIOS_AUTH_PLAN ?? dotEnv.CIOS_AUTH_PLAN ?? "enterprise";
  const workersJwtSecret =
    process.env.WORKERS_JWT_SECRET ??
    process.env.CIOS_WORKERS_JWT_SECRET ??
    dotEnv.WORKERS_JWT_SECRET ??
    dotEnv.CIOS_WORKERS_JWT_SECRET ??
    process.env.JWT_SECRET ??
    dotEnv.JWT_SECRET ??
    "";
  return {
    workersApiUrl,
    issuer,
    audience,
    directToken,
    sessionEmail,
    sessionPassword,
    sessionWorkspaceCode,
    sessionPlan,
    workersJwtSecret
  };
}

function trimOutput(output, limit = 1500) {
  if (!output) {
    return "";
  }
  const normalized = String(output).replace(/\u001b\[[0-9;]*m/g, "").trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit)}...`;
}

function isRetryableNetworkError(error) {
  const message = `${error?.message ?? ""} ${error?.cause?.message ?? ""}`.toLowerCase();
  return (
    message.includes("enotfound") ||
    message.includes("eai_again") ||
    message.includes("etimedout") ||
    message.includes("econnreset") ||
    message.includes("networkerror")
  );
}

function signLocalToken(secret, issuer, audience) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "smoke-user",
    role: "governor",
    iss: issuer,
    aud: audience,
    iat: now,
    nbf: now - 5,
    exp: now + 3600
  };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const encodedHeader = encode(header);
  const encodedPayload = encode(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return {
      ok: response.ok,
      status: response.status,
      text,
      json
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function acquireToken(config) {
  if (config.directToken) {
    return {
      ok: true,
      method: "provided_token",
      token: config.directToken,
      diagnostics: ["using CIOS_WORKERS_BEARER_TOKEN from environment"]
    };
  }

  const diagnostics = [];
  try {
    const session = await requestJson(`${config.workersApiUrl}/v1/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: config.sessionEmail,
        password: config.sessionPassword,
        workspaceCode: config.sessionWorkspaceCode,
        plan: config.sessionPlan
      })
    });
    const token = session.json?.data?.token;
    if (typeof token === "string" && token.length > 0) {
      diagnostics.push(`auth session accepted (status=${session.status})`);
      return {
        ok: true,
        method: "auth_session",
        token,
        diagnostics
      };
    }
    diagnostics.push(
      `auth session rejected (status=${session.status}, body=${trimOutput(session.text, 240) || "n/a"})`
    );
  } catch (error) {
    diagnostics.push(`auth session error: ${trimOutput(error?.message ?? "unknown error", 240)}`);
  }

  if (config.workersJwtSecret) {
    const token = signLocalToken(config.workersJwtSecret, config.issuer, config.audience);
    diagnostics.push("fallback to local HS256 token with workers/local secret");
    return {
      ok: true,
      method: "local_hs256",
      token,
      diagnostics
    };
  }

  return {
    ok: false,
    method: "none",
    token: "",
    diagnostics: [
      ...diagnostics,
      "no direct bearer token, auth session failed, and no JWT secret available for local signing"
    ]
  };
}

function hasFlowLogSuccess(flowLogs, flowRunId) {
  const entries = Array.isArray(flowLogs?.data) ? flowLogs.data : [];
  const hasAccepted = entries.some(
    (entry) => entry?.flow_run_id === flowRunId && entry?.status === "accepted"
  );
  const hasSuccess = entries.some(
    (entry) => entry?.flow_run_id === flowRunId && entry?.status === "success"
  );
  return { hasAccepted, hasSuccess };
}

function hasAuditSuccess(audit, dispatchTraceId, callbackTraceId) {
  const entries = Array.isArray(audit?.data) ? audit.data : [];
  const hasDispatchAudit = entries.some(
    (entry) =>
      entry?.action === "flow_dispatch" &&
      entry?.result === "success" &&
      entry?.traceId === dispatchTraceId
  );
  const hasCallbackAudit = entries.some(
    (entry) =>
      entry?.action === "flow_callback" &&
      entry?.result === "success" &&
      entry?.traceId === callbackTraceId
  );
  return { hasDispatchAudit, hasCallbackAudit };
}

async function runAttempt(config, attempt) {
  const startedAt = Date.now();
  const tokenResult = await acquireToken(config);
  if (!tokenResult.ok) {
    return {
      attempt,
      success: false,
      retryable: false,
      exitCode: 1,
      durationMs: Date.now() - startedAt,
      tokenMethod: tokenResult.method,
      diagnostics: tokenResult.diagnostics,
      error: "TOKEN_ACQUISITION_FAILED",
      strictSmokePayload: null
    };
  }

  const authHeaders = {
    Authorization: `Bearer ${tokenResult.token}`,
    "Content-Type": "application/json"
  };
  const ingestKey = `smoke-ingest-${Date.now()}-${attempt}`;
  const flowKey = `smoke-flow-${Date.now()}-${attempt}`;

  try {
    const health = await requestJson(`${config.workersApiUrl}/v1/system/health`, {
      headers: { Authorization: `Bearer ${tokenResult.token}` }
    });
    const ingest = await requestJson(`${config.workersApiUrl}/v1/events/ingest`, {
      method: "POST",
      headers: { ...authHeaders, "Idempotency-Key": ingestKey },
      body: JSON.stringify({
        source: "smoke-suite",
        event_type: "system.smoke",
        occurred_at: "2026-04-03T00:00:00.000Z",
        payload: { message: "workers smoke warmup" },
        entity_refs: ["org_demo"]
      })
    });
    const search = await requestJson(`${config.workersApiUrl}/v1/events/search?q=smoke-suite`, {
      headers: { Authorization: `Bearer ${tokenResult.token}` }
    });
    const dispatch = await requestJson(`${config.workersApiUrl}/v1/flow/dispatch`, {
      method: "POST",
      headers: { ...authHeaders, "Idempotency-Key": flowKey },
      body: JSON.stringify({
        trigger_name: "smoke.flow.callback",
        source_decision_id: "dec_smoke_bundle_001",
        priority: "high",
        expected_callback: "flow.callback",
        requested_by: "smoke-user",
        approved_by: "smoke-approver",
        payload: { reason: "workers smoke flow" }
      })
    });

    const flowRunId = dispatch.json?.data?.flow_dispatch_id ?? "";
    if (!flowRunId) {
      return {
        attempt,
        success: false,
        retryable: false,
        exitCode: 1,
        durationMs: Date.now() - startedAt,
        tokenMethod: tokenResult.method,
        diagnostics: tokenResult.diagnostics,
        error: "MISSING_FLOW_DISPATCH_ID",
        strictSmokePayload: {
          health: health.json,
          ingest: ingest.json,
          search: search.json,
          dispatch: dispatch.json,
          callback: null,
          flow_logs: null,
          governance_audit: null,
          strict_mode: true
        }
      };
    }

    const callback = await requestJson(`${config.workersApiUrl}/v1/flow/callback`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        flow_run_id: flowRunId,
        trigger_name: "smoke.flow.callback",
        status: "success",
        completed_at: "2026-04-03T00:30:00.000Z",
        trace_id: "trace_smoke_bundle_001",
        result: { message: "callback completed" }
      })
    });
    const flowLogs = await requestJson(`${config.workersApiUrl}/v1/flow/logs`, {
      headers: { Authorization: `Bearer ${tokenResult.token}` }
    });
    const audit = await requestJson(`${config.workersApiUrl}/v1/governance/audit`, {
      headers: { Authorization: `Bearer ${tokenResult.token}` }
    });

    const strictPayload = {
      health: health.json,
      ingest: ingest.json,
      search: search.json,
      dispatch: dispatch.json,
      callback: callback.json,
      flow_logs: flowLogs.json,
      governance_audit: audit.json,
      strict_mode: true
    };

    if (!dispatch.json?.ok || !callback.json?.ok) {
      return {
        attempt,
        success: false,
        retryable: false,
        exitCode: 1,
        durationMs: Date.now() - startedAt,
        tokenMethod: tokenResult.method,
        diagnostics: tokenResult.diagnostics,
        error: "STRICT_CHECK_FAILED: dispatch/callback did not return ok=true",
        strictSmokePayload: strictPayload
      };
    }

    const flowCheck = hasFlowLogSuccess(flowLogs.json, flowRunId);
    const callbackProcessed = callback.json?.data?.callback_processed === true;
    if (!flowCheck.hasAccepted) {
      return {
        attempt,
        success: false,
        retryable: false,
        exitCode: 1,
        durationMs: Date.now() - startedAt,
        tokenMethod: tokenResult.method,
        diagnostics: tokenResult.diagnostics,
        error: "STRICT_CHECK_FAILED: missing accepted flow_log for current flow_run_id",
        strictSmokePayload: strictPayload
      };
    }
    if (!flowCheck.hasSuccess && !callbackProcessed) {
      return {
        attempt,
        success: false,
        retryable: false,
        exitCode: 1,
        durationMs: Date.now() - startedAt,
        tokenMethod: tokenResult.method,
        diagnostics: tokenResult.diagnostics,
        error:
          "STRICT_CHECK_FAILED: missing success flow_log and callback_processed=false for current flow_run_id",
        strictSmokePayload: strictPayload
      };
    }

    const auditCheck = hasAuditSuccess(
      audit.json,
      dispatch.json?.trace_id,
      callback.json?.trace_id
    );
    if (!auditCheck.hasDispatchAudit || !auditCheck.hasCallbackAudit) {
      return {
        attempt,
        success: false,
        retryable: false,
        exitCode: 1,
        durationMs: Date.now() - startedAt,
        tokenMethod: tokenResult.method,
        diagnostics: tokenResult.diagnostics,
        error: "STRICT_CHECK_FAILED: missing flow_dispatch/flow_callback success audit records",
        strictSmokePayload: strictPayload
      };
    }

    return {
      attempt,
      success: true,
      retryable: false,
      exitCode: 0,
      durationMs: Date.now() - startedAt,
      tokenMethod: tokenResult.method,
      diagnostics: tokenResult.diagnostics,
      error: "",
      strictSmokePayload: strictPayload
    };
  } catch (error) {
    return {
      attempt,
      success: false,
      retryable: isRetryableNetworkError(error),
      exitCode: 1,
      durationMs: Date.now() - startedAt,
      tokenMethod: tokenResult.method,
      diagnostics: tokenResult.diagnostics,
      error: trimOutput(error?.message ?? "unknown network/runtime error", 600),
      strictSmokePayload: null
    };
  }
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

async function main() {
  const dateTag = getDateArg();
  const workspaceRoot = process.cwd();
  const ciosRoot = path.resolve(workspaceRoot, "..", "cios.iai.one");
  const ciosEnvPath = path.join(ciosRoot, ".env");
  const outputDir = path.join(
    workspaceRoot,
    "docs",
    "release-evidence",
    "cios.iai.one",
    "artifacts"
  );
  const jsonPath = path.join(outputDir, `CIOS_IAI_ONE_STRICT_SMOKE_${dateTag}.json`);
  const markdownPath = path.join(outputDir, `CIOS_IAI_ONE_STRICT_SMOKE_${dateTag}.md`);

  mkdirSync(outputDir, { recursive: true });

  const dotEnv = readEnvFile(ciosEnvPath);
  const config = getConfig(dotEnv);
  const attempts = [];
  let final = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await runAttempt(config, attempt);
    attempts.push({
      attempt: result.attempt,
      success: result.success,
      exitCode: result.exitCode,
      retryable: result.retryable,
      durationMs: result.durationMs,
      tokenMethod: result.tokenMethod,
      error: trimOutput(result.error, 200),
      diagnostics: result.diagnostics.map((item) => trimOutput(item, 180))
    });
    final = result;
    if (result.success || !result.retryable) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }

  const generatedAt = new Date().toISOString();
  const summary = {
    generatedAt,
    timezone,
    dateTag,
    ciosRoot,
    workersApiUrl: config.workersApiUrl,
    success: Boolean(final?.success),
    attempts,
    finalResult: final
      ? {
          attempt: final.attempt,
          exitCode: final.exitCode,
          durationMs: final.durationMs,
          tokenMethod: final.tokenMethod,
          error: final.error,
          diagnostics: final.diagnostics
        }
      : null,
    strictSmokePayload: final?.strictSmokePayload ?? null
  };

  writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  const markdownLines = [
    `# CIOS Strict Smoke Capture ${dateTag}`,
    "",
    `- Generated at: \`${generatedAt}\``,
    `- Timezone: \`${timezone}\``,
    `- CIOS workspace: \`${ciosRoot}\``,
    `- Workers API URL: \`${config.workersApiUrl}\``,
    `- Attempts: ${attempts.length}`,
    `- Final result: \`${summary.success ? "PASS" : "FAIL"}\``,
    `- Auth mode used (final): \`${final?.tokenMethod ?? "n/a"}\``,
    "",
    "## Attempt summary",
    "| Attempt | Pass | Exit code | Retryable | Auth mode | Error preview |",
    "|---:|---|---:|---|---|---|",
    ...attempts.map(
      (entry) =>
        `| ${entry.attempt} | ${entry.success ? "yes" : "no"} | ${entry.exitCode} | ${entry.retryable ? "yes" : "no"} | ${entry.tokenMethod} | \`${escapeCell(entry.error || "-")}\` |`
    ),
    ""
  ];

  if (summary.success) {
    markdownLines.push("## Artifact");
    markdownLines.push(`- JSON: \`${path.relative(workspaceRoot, jsonPath)}\``);
    markdownLines.push("");
  } else {
    markdownLines.push("## Failure details");
    markdownLines.push(`- Error: \`${escapeCell(final?.error || "n/a")}\``);
    markdownLines.push(
      `- Diagnostics: \`${escapeCell((final?.diagnostics ?? []).join(" | ") || "n/a")}\``
    );
    markdownLines.push(`- JSON: \`${path.relative(workspaceRoot, jsonPath)}\``);
    markdownLines.push("");
  }

  writeFileSync(markdownPath, `${markdownLines.join("\n")}\n`, "utf8");

  process.stdout.write(`${path.relative(workspaceRoot, markdownPath)}\n`);
  process.stdout.write(`${path.relative(workspaceRoot, jsonPath)}\n`);
  if (!summary.success) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`teamc strict smoke capture failed: ${error?.message ?? String(error)}\n`);
  process.exit(1);
});
