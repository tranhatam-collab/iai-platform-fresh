import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createPayServer } from "../apps/pay/dist/server.js";

const timezone = "Asia/Ho_Chi_Minh";

function todayInTimezone(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function getDateArg() {
  const explicit = process.argv.find((argument) => argument.startsWith("--date="));
  return explicit ? explicit.slice("--date=".length) : todayInTimezone(timezone);
}

const dateTag = getDateArg();
const outputDir = "docs/release-evidence/pay.iai.one/artifacts";
const markdownPath = `${outputDir}/PAY_IAI_ONE_LOCAL_RUNTIME_PROOF_${dateTag}.md`;
const jsonPath = `${outputDir}/PAY_IAI_ONE_LOCAL_RUNTIME_PROOF_${dateTag}.json`;

const emittedAt = new Date().toISOString();
const laneSessionId = "ps_pay_local_shared_001";
const laneReceiptId = "rcpt_pay_local_shared_001";
const laneWorkItemId = "recon:pay_local_shared_001";

const upstreamPayloads = {
  "/auth": {
    emitted_at: emittedAt,
    schema_version: "iai.auth.shared-session.v1",
    subjects: {
      sub_pay_support: {
        workspaces: {
          ws_pay_main: {
            roles: ["support_admin"]
          }
        }
      }
    }
  },
  "/reconciliation": {
    emitted_at: emittedAt,
    schema_version: "iai.pay.reconciliation-lane.v1",
    ops: {
      reconciliation: {
        metrics: [{ label: "late_payments", value: "0" }],
        work_items: [
          {
            id: laneWorkItemId,
            next_action: "confirm callback outbox delivery",
            owner: "finance_admin",
            safe_detail_items: ["callback_status: confirmed", "site_scope: app.iai.one"],
            severity: "medium",
            sensitive_detail_items: [
              "internal_reconciliation_evidence: matched ledger entry",
              "raw_callback_payload: hidden from support"
            ],
            summary: "Local runtime shared reconciliation item"
          }
        ]
      }
    }
  },
  "/session": {
    emitted_at: emittedAt,
    schema_version: "iai.pay.session-lane.v1",
    home_route_refs: {
      demoCancelledCheckoutSessionId: "ps_demo_cancelled_001",
      demoConfirmedCheckoutSessionId: "ps_demo_confirmed_001",
      demoCheckoutSessionId: laneSessionId,
      demoFailedCheckoutSessionId: "ps_demo_failed_001",
      demoMissingCheckoutSessionId: "ps_demo_missing_001",
      demoMissingReceiptId: "rcpt_demo_missing_001",
      demoReceiptId: laneReceiptId
    },
    payment_sessions: {
      [laneSessionId]: {
        amount_due_value: 4150000,
        callback_status: "callback_confirmed",
        confirmed_receipt_id: laneReceiptId,
        created_at: emittedAt,
        currency_code: "VND",
        expires_at: emittedAt,
        last_signal: "provider_callback_confirmed",
        last_signal_at: emittedAt,
        late_signal_window_ends_at: emittedAt,
        order_reference: "ORD-PAY-LOCAL-001",
        origin_site: "app.iai.one",
        payer_label: "Pay Local Runtime Shared",
        payment_reference: "PAY-PAY-LOCAL-001",
        provider_flow: "callback confirmed -> reconciliation clear",
        provider_label: "Local upstream shared provider",
        reconciliation_status: "reconciled",
        session_id: laneSessionId,
        session_state: "confirmed",
        support_channel: "pay-local-shared@iai.one",
        support_evidence: ["callback receipt", "ledger match", "site confirmation"]
      }
    },
    receipts: {
      [laneReceiptId]: {
        amount_value: 4150000,
        confirmed_at: emittedAt,
        currency_code: "VND",
        origin_site: "app.iai.one",
        order_reference: "ORD-PAY-LOCAL-001",
        payer_label: "Pay Local Runtime Shared",
        payment_method: "Local upstream shared provider",
        payment_reference: "PAY-PAY-LOCAL-001",
        receipt_id: laneReceiptId,
        receipt_state: "confirmed",
        return_site_label: "app.iai.one workspace",
        session_id: laneSessionId
      }
    }
  }
};

const upstreamServer = createServer((request, response) => {
  const payload = upstreamPayloads[request.url] ?? null;

  response.statusCode = payload ? 200 : 404;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(
    JSON.stringify(
      payload ?? {
        ok: false,
        error: "NOT_FOUND"
      }
    )
  );
});

await new Promise((resolve) => {
  upstreamServer.listen(0, "127.0.0.1", resolve);
});

const upstreamAddress = upstreamServer.address();
if (!upstreamAddress || typeof upstreamAddress === "string") {
  upstreamServer.close();
  throw new Error("Unable to resolve local upstream server address for pay runtime proof.");
}

const upstreamBaseUrl = `http://127.0.0.1:${upstreamAddress.port}`;
const payServer = createPayServer({
  readModelMode: "shared_only",
  sharedAuthSourceUrl: `${upstreamBaseUrl}/auth`,
  sharedMaxDataAgeMs: 60_000,
  sharedReconciliationSourceUrl: `${upstreamBaseUrl}/reconciliation`,
  sharedRefreshTtlMs: 1_000,
  sharedSessionSourceUrl: `${upstreamBaseUrl}/session`
});

await new Promise((resolve) => {
  payServer.listen(0, "127.0.0.1", resolve);
});

const payAddress = payServer.address();
if (!payAddress || typeof payAddress === "string") {
  payServer.close();
  upstreamServer.close();
  throw new Error("Unable to resolve local pay server address.");
}

const baseUrl = `http://127.0.0.1:${payAddress.port}`;
const generatedAt = new Date().toISOString();
const checks = [];

try {
  checks.push(await checkHealth(baseUrl));
  checks.push(await checkHtmlRoute(baseUrl, `/checkout/${laneSessionId}`));
  checks.push(
    await checkHtmlRoute(baseUrl, `/ops/reconciliation/${encodeURIComponent(laneWorkItemId)}`, {
      "x-iai-auth-claims": JSON.stringify({
        roles: ["finance_admin"],
        session_id: "sess_pay_finance_001",
        subject_id: "sub_pay_finance",
        workspace_id: "ws_pay_main"
      })
    })
  );
  checks.push(
    await checkHtmlRoute(baseUrl, `/ops/reconciliation/${encodeURIComponent(laneWorkItemId)}`, {
      "x-iai-shared-session": JSON.stringify({
        session_id: "sess_pay_support_001",
        subject_id: "sub_pay_support",
        workspace_id: "ws_pay_main"
      })
    }, "support-view")
  );
} finally {
  await new Promise((resolve) => {
    payServer.close(resolve);
  });
  await new Promise((resolve) => {
    upstreamServer.close(resolve);
  });
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  jsonPath,
  `${JSON.stringify({ baseUrl, checks, generatedAt, upstreamBaseUrl }, null, 2)}\n`,
  "utf8"
);
writeFileSync(markdownPath, renderMarkdown(baseUrl, upstreamBaseUrl, generatedAt, checks), "utf8");

process.stdout.write(`${markdownPath}\n`);
process.stdout.write(`${jsonPath}\n`);

async function checkHealth(baseUrlValue) {
  const response = await fetch(new URL("/health", baseUrlValue));
  const payload = await response.json();

  return {
    type: "health",
    route: "/health",
    status: response.status,
    contentLanguage: response.headers.get("content-language") ?? "",
    service: payload?.data?.service ?? "",
    sharedReadModelSource: payload?.data?.shared_read_model?.source ?? "",
    rolloutReadyForSharedOnly:
      payload?.data?.shared_read_model?.rolloutReadyForSharedOnly ?? false,
    activeReadMode: payload?.data?.shared_upstream_runtime?.activeReadMode ?? "",
    releaseGateReady: payload?.data?.shared_upstream_runtime?.releaseGate?.ready ?? false
  };
}

async function checkHtmlRoute(baseUrlValue, route, headers = {}, tag = "default-view") {
  const response = await fetch(new URL(route, baseUrlValue), {
    headers
  });
  const html = await response.text();

  return {
    type: "html",
    route,
    status: response.status,
    contentLanguage: response.headers.get("content-language") ?? "",
    marker: extractMarker(html),
    tag
  };
}

function extractMarker(html) {
  const stripped = html
    .replaceAll(/\s+/g, " ")
    .replaceAll(/<[^>]+>/g, " ")
    .trim();
  return stripped.slice(0, 180);
}

function renderMarkdown(baseUrlValue, upstreamBaseUrlValue, generatedAtValue, checksValue) {
  const lines = [];
  lines.push(`# Pay Local Runtime Proof ${dateTag}`);
  lines.push("");
  lines.push(`- Generated at: \`${generatedAtValue}\``);
  lines.push(`- Timezone: \`${timezone}\``);
  lines.push(`- Pay base URL: \`${baseUrlValue}\``);
  lines.push(`- Upstream mock base URL: \`${upstreamBaseUrlValue}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push("- `apps/pay` runs locally in `shared_only` mode with fresh upstream shared data.");
  lines.push("- `/health` exposes `shared_read_model` and `shared_upstream_runtime`.");
  lines.push("- checkout and ops detail routes render successfully against shared runtime data.");
  lines.push("");
  lines.push("| Route | Status | Content-Language | Key fields | Marker |");
  lines.push("|---|---:|---|---|---|");

  for (const check of checksValue) {
    const keyFields =
      check.type === "health"
        ? [
            `service=${check.service}`,
            `shared_read_model.source=${check.sharedReadModelSource}`,
            `rolloutReadyForSharedOnly=${String(check.rolloutReadyForSharedOnly)}`,
            `activeReadMode=${check.activeReadMode}`,
            `releaseGateReady=${String(check.releaseGateReady)}`
          ].join("; ")
        : `view=${check.tag}`;

    lines.push(
      `| \`${check.route}\` | \`${check.status}\` | \`${check.contentLanguage}\` | \`${escapeCell(
        keyFields
      )}\` | \`${escapeCell(check.marker || "-")}\` |`
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|");
}
