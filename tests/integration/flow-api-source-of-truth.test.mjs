import test from "node:test";
import assert from "node:assert/strict";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

test("api.flow exposes source-of-truth summary and domain slices", async () => {
  const handler = createFlowApiRequestHandler();
  const headers = {
    "x-request-id": "req_flow_contract",
    "x-workspace-id": "ws_flow_main"
  };

  const sourceResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/source-of-truth"
  });
  const sourcePayload = await sourceResponse.json();
  assert.equal(sourceResponse.status, 200);
  assert.equal(sourcePayload.ok, true);
  assert.equal(sourcePayload.data.summary.approvals.pending, 2);
  assert.equal(sourcePayload.data.summary.billing.overdueCount, 1);
  assert.equal(sourcePayload.data.snapshot.flows.length, 3);
  assert.equal(sourcePayload.data.snapshot.runtimeExecutions.length, 3);

  const flowsResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/flows?require_attention=true"
  });
  const flowsPayload = await flowsResponse.json();
  assert.equal(flowsResponse.status, 200);
  assert.equal(flowsPayload.ok, true);
  assert.equal(flowsPayload.data.total, 1);
  assert.equal(flowsPayload.data.items[0].flowId, "flow_invoice_recovery");

  const flowDetailResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/flows/flow_locale_handoff"
  });
  const flowDetailPayload = await flowDetailResponse.json();
  assert.equal(flowDetailResponse.status, 200);
  assert.equal(flowDetailPayload.ok, true);
  assert.equal(flowDetailPayload.data.flow.flowId, "flow_locale_handoff");
  assert.equal(flowDetailPayload.data.flow.builder.lockStatus, "read_only");
  assert.equal(flowDetailPayload.data.recentExecutions[0].executionId, "exec_9003");
  assert.equal(flowDetailPayload.data.flow.publishReadiness.status, "ready");

  const flowVersionsResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/flows/flow_lead_intake/versions"
  });
  const flowVersionsPayload = await flowVersionsResponse.json();
  assert.equal(flowVersionsResponse.status, 200);
  assert.equal(flowVersionsPayload.ok, true);
  assert.equal(flowVersionsPayload.data.flowId, "flow_lead_intake");
  assert.equal(flowVersionsPayload.data.total, 2);
  assert.equal(flowVersionsPayload.data.items[0].versionId, "v12");

  const flowDraftsResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/flows/flow_invoice_recovery/drafts"
  });
  const flowDraftsPayload = await flowDraftsResponse.json();
  assert.equal(flowDraftsResponse.status, 200);
  assert.equal(flowDraftsPayload.ok, true);
  assert.equal(flowDraftsPayload.data.flowId, "flow_invoice_recovery");
  assert.equal(flowDraftsPayload.data.total, 1);
  assert.equal(flowDraftsPayload.data.items[0].openIssues, 3);
  assert.equal(flowDraftsPayload.data.items[0].status, "blocked");

  const flowPublishResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/flows/flow_invoice_recovery/publish"
  });
  const flowPublishPayload = await flowPublishResponse.json();
  assert.equal(flowPublishResponse.status, 200);
  assert.equal(flowPublishPayload.ok, true);
  assert.equal(flowPublishPayload.data.flowId, "flow_invoice_recovery");
  assert.equal(flowPublishPayload.data.readiness.status, "blocked");
  assert.ok(flowPublishPayload.data.readiness.blockerRefs.includes("apr_101"));

  const saveDraftResponse = await dispatchToHandler(handler, {
    headers: {
      ...headers,
      "x-actor-id": "dash.session.ops"
    },
    method: "POST",
    url: "/v1/flow/flows/flow_lead_intake/builder/save"
  });
  const saveDraftPayload = await saveDraftResponse.json();
  assert.equal(saveDraftResponse.status, 200);
  assert.equal(saveDraftPayload.ok, true);
  assert.equal(saveDraftPayload.data.result.action, "builder.save");
  assert.equal(saveDraftPayload.data.result.outcome, "succeeded");

  const validateDraftFailResponse = await dispatchToHandler(handler, {
    headers: {
      ...headers,
      "x-actor-id": "dash.session.ops"
    },
    method: "POST",
    url: "/v1/flow/flows/flow_invoice_recovery/builder/validate"
  });
  const validateDraftFailPayload = await validateDraftFailResponse.json();
  assert.equal(validateDraftFailResponse.status, 200);
  assert.equal(validateDraftFailPayload.ok, true);
  assert.equal(validateDraftFailPayload.data.result.action, "builder.validate");
  assert.equal(validateDraftFailPayload.data.result.outcome, "failed");

  const previewPublishResponse = await dispatchToHandler(handler, {
    headers: {
      ...headers,
      "x-actor-id": "dash.session.ops"
    },
    method: "POST",
    url: "/v1/flow/flows/flow_locale_handoff/publish/preview"
  });
  const previewPublishPayload = await previewPublishResponse.json();
  assert.equal(previewPublishResponse.status, 200);
  assert.equal(previewPublishPayload.ok, true);
  assert.equal(previewPublishPayload.data.result.action, "publish.preview");
  assert.equal(previewPublishPayload.data.result.outcome, "succeeded");

  const confirmPublishResponse = await dispatchToHandler(handler, {
    headers: {
      ...headers,
      "x-actor-id": "dash.session.ops"
    },
    method: "POST",
    url: "/v1/flow/flows/flow_locale_handoff/publish/confirm"
  });
  const confirmPublishPayload = await confirmPublishResponse.json();
  assert.equal(confirmPublishResponse.status, 200);
  assert.equal(confirmPublishPayload.ok, true);
  assert.equal(confirmPublishPayload.data.result.action, "publish.confirm");
  assert.equal(confirmPublishPayload.data.result.outcome, "succeeded");

  const auditResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/audit?action=publish.confirm&flow_id=flow_locale_handoff"
  });
  const auditPayload = await auditResponse.json();
  assert.equal(auditResponse.status, 200);
  assert.equal(auditPayload.ok, true);
  assert.equal(auditPayload.data.total >= 1, true);
  assert.equal(auditPayload.data.items[0].action, "publish.confirm");
  assert.equal(auditPayload.data.items[0].flowId, "flow_locale_handoff");

  const runtimeExecutionsResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/runtime/executions?status=failed,running"
  });
  const runtimeExecutionsPayload = await runtimeExecutionsResponse.json();
  assert.equal(runtimeExecutionsResponse.status, 200);
  assert.equal(runtimeExecutionsPayload.ok, true);
  assert.equal(runtimeExecutionsPayload.data.total, 2);
  assert.equal(runtimeExecutionsPayload.data.items[0].executionId, "exec_9001");

  const runtimeExecutionDetailResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/runtime/executions/exec_9002"
  });
  const runtimeExecutionDetailPayload = await runtimeExecutionDetailResponse.json();
  assert.equal(runtimeExecutionDetailResponse.status, 200);
  assert.equal(runtimeExecutionDetailPayload.ok, true);
  assert.equal(runtimeExecutionDetailPayload.data.execution.status, "failed");
  assert.equal(runtimeExecutionDetailPayload.data.execution.steps[1].nodeId, "node_approval_writeoff");

  const alertsResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/alerts?status=open&severity=critical"
  });
  const alertsPayload = await alertsResponse.json();
  assert.equal(alertsResponse.status, 200);
  assert.equal(alertsPayload.ok, true);
  assert.equal(alertsPayload.data.total, 1);
  assert.equal(alertsPayload.data.items[0].alertId, "alt_9001");

  const webContractResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/flow/web-onboarding-contract"
  });
  const webContractPayload = await webContractResponse.json();
  assert.equal(webContractResponse.status, 200);
  assert.equal(webContractPayload.ok, true);
  assert.equal(webContractPayload.data.authMode, "shared_redirect");
  assert.equal(webContractPayload.data.billingMode, "shared_reference");
  assert.equal(webContractPayload.data.defaultLocale, "en");
  assert.equal(webContractPayload.data.fallbackLocale, "en");
  assert.deepEqual(webContractPayload.data.supportedLocales, ["en", "vi"]);
  assert.equal(
    webContractPayload.data.wording.auth.titleKey,
    "web.onboarding.contracts.auth.title"
  );
  assert.equal(
    webContractPayload.data.wording.auth.bodyKey,
    "web.onboarding.contracts.auth.body"
  );
  assert.equal(
    webContractPayload.data.wording.auth.modeKey,
    "web.summary.auth_mode.shared"
  );
  assert.equal(
    webContractPayload.data.wording.billing.titleKey,
    "web.onboarding.contracts.billing.title"
  );
  assert.equal(
    webContractPayload.data.wording.billing.bodyKey,
    "web.onboarding.contracts.billing.body"
  );
  assert.equal(webContractPayload.data.routeTargets.leads.productSurface, "flow");
  assert.equal(webContractPayload.data.readiness.sharedContractState, "blocked");
  assert.match(webContractPayload.data.readiness.blockers[0], /critical-alerts-open/);
});

test("api.flow returns validation envelope on invalid query filters", async () => {
  const response = await dispatchToHandler(createFlowApiRequestHandler(), {
    headers: {
      "x-workspace-id": "ws_flow_main"
    },
    url: "/v1/flow/approvals?status=wrong"
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
});

test("api.flow requires workspace identity for contract routes", async () => {
  const response = await dispatchToHandler(createFlowApiRequestHandler(), {
    url: "/v1/flow/source-of-truth"
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "WORKSPACE_NOT_FOUND");
});

test("api.flow exposes message detail and normalized event timeline", async () => {
  const handler = createFlowApiRequestHandler();
  const headers = {
    "x-request-id": "req_mail_message_detail",
    "x-workspace-id": "ws_mail_main"
  };

  const detailResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/messages/msg_smtp_demo_001"
  });
  const detailPayload = await detailResponse.json();
  assert.equal(detailResponse.status, 200);
  assert.equal(detailPayload.ok, true);
  assert.equal(detailPayload.data.status, "provider_accepted");
  assert.equal(detailPayload.data.message.messageId, "msg_smtp_demo_001");
  assert.equal(detailPayload.data.lastEvent.eventType, "provider_accepted");

  const eventsResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/messages/msg_smtp_demo_001/events"
  });
  const eventsPayload = await eventsResponse.json();
  assert.equal(eventsResponse.status, 200);
  assert.equal(eventsPayload.ok, true);
  assert.equal(eventsPayload.data.total, 2);
  assert.equal(eventsPayload.data.items[0].eventType, "queued");
  assert.equal(eventsPayload.data.items[1].eventType, "provider_accepted");
});

test("api.flow exposes paginated message list and still enforces workspace contract", async () => {
  const handler = createFlowApiRequestHandler();
  const listResponse = await dispatchToHandler(handler, {
    headers: {
      "x-workspace-id": "ws_mail_main"
    },
    url: "/v1/messages?status=provider_accepted&stream=transactional&page=1&page_size=10"
  });
  const listPayload = await listResponse.json();
  assert.equal(listResponse.status, 200);
  assert.equal(listPayload.ok, true);
  assert.equal(listPayload.data.total, 1);
  assert.equal(listPayload.data.page, 1);
  assert.equal(listPayload.data.page_size, 10);
  assert.equal(listPayload.data.items[0].messageId, "msg_smtp_demo_001");

  const missingWorkspaceResponse = await dispatchToHandler(handler, {
    url: "/v1/messages"
  });
  const missingWorkspacePayload = await missingWorkspaceResponse.json();
  assert.equal(missingWorkspaceResponse.status, 400);
  assert.equal(missingWorkspacePayload.ok, false);
  assert.equal(missingWorkspacePayload.error.code, "WORKSPACE_NOT_FOUND");
});

test("api.flow exposes provider route list with workspace-bound filters", async () => {
  const response = await dispatchToHandler(createFlowApiRequestHandler(), {
    headers: {
      "x-workspace-id": "ws_mail_main"
    },
    url: "/v1/provider-routes?status=active&stream=transactional&provider=sendgrid"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.total, 1);
  assert.equal(payload.data.items[0].routeId, "transactional_primary");
  assert.equal(payload.data.items[0].healthStatus, "healthy");
});

test("api.flow exposes domain dns-health detail and suppression list contracts", async () => {
  const handler = createFlowApiRequestHandler();
  const headers = {
    "x-workspace-id": "ws_mail_main"
  };

  const dnsHealthResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/domains/dom_updates_main_001/dns-health"
  });
  const dnsHealthPayload = await dnsHealthResponse.json();
  assert.equal(dnsHealthResponse.status, 200);
  assert.equal(dnsHealthPayload.ok, true);
  assert.equal(dnsHealthPayload.data.domainId, "dom_updates_main_001");
  assert.equal(dnsHealthPayload.data.overallStatus, "fail");
  assert.equal(dnsHealthPayload.data.dmarc, "fail");

  const suppressionsResponse = await dispatchToHandler(handler, {
    headers,
    url: "/v1/suppressions?active_only=true&source=provider_webhook"
  });
  const suppressionsPayload = await suppressionsResponse.json();
  assert.equal(suppressionsResponse.status, 200);
  assert.equal(suppressionsPayload.ok, true);
  assert.equal(suppressionsPayload.data.total, 2);
  assert.equal(suppressionsPayload.data.items[0].source, "provider_webhook");
  assert.equal(suppressionsPayload.data.items[1].reason, "hard_bounce");
});
