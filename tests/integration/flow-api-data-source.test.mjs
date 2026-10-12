/**
 * /v1/flow/* does not serve sample rows as if they were real data.
 *
 * Covers: without the demo flag every list route answers 200 with an empty list
 * and dataSource "empty" (one shape for the whole group); the demo flag brings
 * the sample rows back; the audit trail is read from audit_logs per workspace;
 * the demo flag is ignored in production; the contract route says it is static.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { buildServerOptionsFromEnv } from "../../apps/mail-api/dist/bootstrap.js";
import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const API_KEY = "mail-api-key-for-flow-data-tests";
const WORKSPACE = "ws_flow_data";
// The workspace the sample rows belong to: a default that served them would show here.
const SAMPLE_WORKSPACE = "ws_flow_main";
const OTHER_WORKSPACE = "ws_flow_data_other";
const LIST_ROUTES = [
  "/v1/flow/flows",
  "/v1/flow/approvals",
  "/v1/flow/billing",
  "/v1/flow/proofs",
  "/v1/flow/alerts",
  "/v1/flow/runtime/executions"
];

const get = (handler, url, workspaceId = WORKSPACE, extra = {}) =>
  dispatchToHandler(handler, { headers: { "x-workspace-id": workspaceId, ...extra }, url });

function setupPersisted() {
  const dbPath = `/tmp/iai-flow-data-${randomUUID()}.sqlite`;
  const backend = createSmtpInternalBackend({
    apiKey: API_KEY,
    databaseUrl: `sqlite:${dbPath}`,
    seed: {
      blockedRecipient: "blocked@example.com",
      defaultSender: "ops@flowdata.example",
      password: "smtp-secret",
      primaryDomain: "flowdata.example",
      username: "flow-data-user",
      workspaceId: WORKSPACE
    }
  });
  const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
  const insert = (row) => {
    const db = new DatabaseSync(dbPath);
    try {
      db.prepare(
        `INSERT INTO audit_logs (id, workspace_id, action, actor_type, actor_identifier, target_type, target_id, metadata_json, created_at)
         VALUES (?, ?, ?, 'user', ?, ?, ?, ?, ?);`
      ).run(
        row.id,
        row.workspaceId,
        row.action,
        row.actor ?? "operator@example.com",
        row.targetType ?? "flow",
        row.targetId ?? "flow_a",
        JSON.stringify(row.metadata ?? {}),
        row.createdAt
      );
    } finally {
      db.close();
    }
  };
  const cleanup = () => {
    backend.close();
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(`${dbPath}${suffix}`, { force: true });
    }
  };
  return { cleanup, handler, insert };
}

test("every flow list route answers 200 with an empty list by default", async () => {
  const handler = createFlowApiRequestHandler();
  for (const route of LIST_ROUTES) {
    const response = await get(handler, route, SAMPLE_WORKSPACE);
    const payload = await response.json();
    assert.equal(response.status, 200, route);
    assert.equal(payload.ok, true, route);
    assert.equal(payload.data.dataSource, "empty", route);
    assert.deepEqual(payload.data.items, [], route);
    assert.equal(payload.data.total, 0, route);
  }
});

test("the default handler holds no sample rows behind the detail and snapshot routes", async () => {
  const handler = createFlowApiRequestHandler();
  const snapshot = await (await get(handler, "/v1/flow/source-of-truth", SAMPLE_WORKSPACE)).json();
  assert.equal(snapshot.data.dataSource, "empty");
  for (const key of ["approvals", "auditEvents", "billing", "proofs", "alerts", "flows", "runtimeExecutions"]) {
    assert.deepEqual(snapshot.data.snapshot[key], [], key);
  }
  assert.equal(snapshot.data.summary.approvals.total, 0);
  assert.equal(snapshot.data.summary.billing.total, 0);

  // Ids that exist in the sample data are unknown here.
  const demoFlows = await (await get(createFlowApiRequestHandler({ demoData: true }), "/v1/flow/flows", SAMPLE_WORKSPACE)).json();
  const sampleFlowId = demoFlows.data.items[0].flowId;
  assert.ok(sampleFlowId);
  const detail = await get(handler, `/v1/flow/flows/${sampleFlowId}`, SAMPLE_WORKSPACE);
  assert.equal(detail.status, 404);
  assert.equal((await detail.json()).error.code, "FLOW_NOT_FOUND");
  const versions = await get(handler, `/v1/flow/flows/${sampleFlowId}/versions`, SAMPLE_WORKSPACE);
  assert.equal(versions.status, 404);
});

test("the demo flag serves the sample rows and labels them as demo", async () => {
  const handler = createFlowApiRequestHandler({ demoData: true });
  for (const route of LIST_ROUTES) {
    const payload = await (await get(handler, route, SAMPLE_WORKSPACE)).json();
    assert.equal(payload.data.dataSource, "demo", route);
  }
  const flows = await (await get(handler, "/v1/flow/flows", SAMPLE_WORKSPACE)).json();
  assert.ok(flows.data.total > 0);
  const audit = await (await get(handler, "/v1/flow/audit", SAMPLE_WORKSPACE)).json();
  assert.equal(audit.data.dataSource, "demo");
  assert.ok(audit.data.total > 0);
});

test("the audit trail reads audit_logs for the requested workspace only", async () => {
  const { cleanup, handler, insert } = setupPersisted();
  try {
    insert({ action: "publish.confirm", createdAt: "2026-10-01T10:00:00.000Z", id: "audit_a1", metadata: { details: "Published v2" }, targetId: "flow_a", workspaceId: WORKSPACE });
    insert({ action: "builder.save", createdAt: "2026-10-01T09:00:00.000Z", id: "audit_a2", metadata: { outcome: "failed" }, targetId: "flow_b", workspaceId: WORKSPACE });
    insert({ action: "publish.confirm", createdAt: "2026-10-01T11:00:00.000Z", id: "audit_other", targetId: "flow_a", workspaceId: OTHER_WORKSPACE });
    // Mail actions in the same table are not part of the flow trail.
    insert({ action: "message.queued", createdAt: "2026-10-01T12:00:00.000Z", id: "audit_mail", targetId: "msg_1", targetType: "message", workspaceId: WORKSPACE });

    const auth = { authorization: `Bearer ${API_KEY}` };
    const all = await (await get(handler, "/v1/flow/audit", WORKSPACE, auth)).json();
    assert.equal(all.data.dataSource, "persisted");
    assert.deepEqual(all.data.items.map((item) => item.eventId), ["audit_a1", "audit_a2"]);
    assert.deepEqual(all.data.items[0], {
      action: "publish.confirm",
      actor: "operator@example.com",
      createdAt: "2026-10-01T10:00:00.000Z",
      details: "Published v2",
      eventId: "audit_a1",
      flowId: "flow_a",
      outcome: "succeeded",
      workspaceId: WORKSPACE
    });
    assert.equal(all.data.items[1].outcome, "failed");

    const byFlow = await (await get(handler, "/v1/flow/audit?flow_id=flow_b", WORKSPACE, auth)).json();
    assert.deepEqual(byFlow.data.items.map((item) => item.eventId), ["audit_a2"]);
    const byAction = await (await get(handler, "/v1/flow/audit?action=publish.confirm", WORKSPACE, auth)).json();
    assert.deepEqual(byAction.data.items.map((item) => item.eventId), ["audit_a1"]);
    const byOutcome = await (await get(handler, "/v1/flow/audit?outcome=failed", WORKSPACE, auth)).json();
    assert.deepEqual(byOutcome.data.items.map((item) => item.eventId), ["audit_a2"]);
    const limited = await (await get(handler, "/v1/flow/audit?limit=1", WORKSPACE, auth)).json();
    assert.equal(limited.data.items.length, 1);

    const other = await (await get(handler, "/v1/flow/audit", OTHER_WORKSPACE, auth)).json();
    assert.deepEqual(other.data.items.map((item) => item.eventId), ["audit_other"]);
    const empty = await (await get(handler, "/v1/flow/audit", "ws_unknown", auth)).json();
    assert.deepEqual(empty.data.items, []);
  } finally {
    cleanup();
  }
});

test("the persisted audit read needs the API key like the other persisted reads", async () => {
  const { cleanup, handler } = setupPersisted();
  try {
    const refused = await get(handler, "/v1/flow/audit");
    assert.ok([401, 403].includes(refused.status), `status ${refused.status}`);
    assert.equal((await refused.json()).ok, false);
  } finally {
    cleanup();
  }
});

test("a backend with persisted data leaves the other flow routes empty", async () => {
  const { cleanup, handler } = setupPersisted();
  try {
    for (const route of LIST_ROUTES) {
      const payload = await (await get(handler, route, SAMPLE_WORKSPACE)).json();
      assert.equal(payload.data.dataSource, "empty", route);
      assert.deepEqual(payload.data.items, [], route);
    }
  } finally {
    cleanup();
  }
});

test("the demo flag is ignored in production", () => {
  const dev = buildServerOptionsFromEnv({ MAIL_API_DEMO_DATA: "1", NODE_ENV: "development" });
  assert.equal(dev.options.demoData, true);
  const production = buildServerOptionsFromEnv({ MAIL_API_DEMO_DATA: "1", NODE_ENV: "production" });
  assert.equal(production.options.demoData, false);
});

test("the onboarding contract route says its content is static", async () => {
  for (const options of [{}, { demoData: true }]) {
    const payload = await (await get(createFlowApiRequestHandler(options), "/v1/flow/web-onboarding-contract")).json();
    assert.equal(payload.data.dataSource, "static");
    assert.equal(payload.data.authMode, "shared_redirect");
  }
});
