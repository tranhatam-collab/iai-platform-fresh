import test from "node:test";
import assert from "node:assert/strict";

import { buildFlowSourceSummary, createFlowSourceOfTruth } from "../../packages/mail-core/dist/index.js";

const FIXED_NOW = "2026-04-14T10:30:00.000Z";

test("flow source-of-truth exposes deterministic filters and summary metrics", () => {
  const source = createFlowSourceOfTruth();
  const workspaceId = "ws_flow_main";

  const snapshot = source.snapshot(workspaceId);
  assert.equal(snapshot.version, "flow_sot_v1");
  assert.equal(snapshot.approvals.length, 4);
  assert.equal(snapshot.billing.length, 4);
  assert.equal(snapshot.proofs.length, 4);
  assert.equal(snapshot.alerts.length, 4);
  assert.equal(snapshot.flows.length, 3);
  assert.equal(snapshot.runtimeExecutions.length, 3);
  assert.equal(snapshot.generatedAt, "2026-04-14T10:30:00.000Z");

  const snapshotSecondRead = source.snapshot(workspaceId);
  assert.equal(snapshotSecondRead.generatedAt, snapshot.generatedAt);

  const pendingApprovals = source.listApprovals({
    statuses: ["pending"],
    workspaceId
  });
  assert.equal(pendingApprovals.length, 2);

  const overdueApprovals = source.listApprovals({
    now: FIXED_NOW,
    overdueOnly: true,
    statuses: ["pending"],
    workspaceId
  });
  assert.equal(overdueApprovals.length, 2);

  const overdueInvoices = source.listBilling({
    now: FIXED_NOW,
    overdueOnly: true,
    workspaceId
  });
  assert.equal(overdueInvoices.length, 1);
  assert.equal(overdueInvoices[0]?.invoiceId, "inv_2301");

  const lowConfidenceProofs = source.listProofs({
    minConfidence: 0.7,
    workspaceId
  });
  assert.equal(lowConfidenceProofs.length, 2);

  const flowsRequiringAttention = source.listFlows({
    requireAttention: true,
    workspaceId
  });
  assert.equal(flowsRequiringAttention.length, 1);
  assert.equal(flowsRequiringAttention[0]?.flowId, "flow_invoice_recovery");

  const flowDetail = source.getFlowDetail("flow_locale_handoff", workspaceId);
  assert.ok(flowDetail);
  assert.equal(flowDetail.builder.lockStatus, "read_only");
  assert.equal(flowDetail.recentExecutionIds[0], "exec_9003");
  assert.equal(flowDetail.publishReadiness.previewPacketId, "pkt_locale_v4");
  assert.equal(flowDetail.versions[0]?.versionId, "v4");

  const runtimeExecution = source.getRuntimeExecutionDetail("exec_9002", workspaceId);
  assert.ok(runtimeExecution);
  assert.equal(runtimeExecution.status, "failed");
  assert.equal(runtimeExecution.alertIds[0], "alt_9001");

  const flowVersions = source.listFlowVersions("flow_lead_intake", workspaceId);
  assert.ok(flowVersions);
  assert.equal(flowVersions.length, 2);
  assert.equal(flowVersions[0]?.versionId, "v12");

  const flowDrafts = source.listFlowDrafts("flow_invoice_recovery", workspaceId);
  assert.ok(flowDrafts);
  assert.equal(flowDrafts.length, 1);
  assert.equal(flowDrafts[0]?.status, "blocked");
  assert.equal(flowDrafts[0]?.openIssues, 3);

  const publishReadiness = source.getFlowPublishReadiness("flow_invoice_recovery", workspaceId);
  assert.ok(publishReadiness);
  assert.equal(publishReadiness.status, "blocked");
  assert.equal(publishReadiness.targetVersion, "v8");
  assert.ok(publishReadiness.blockerRefs.includes("apr_101"));

  const saveResult = source.saveFlowDraft("flow_lead_intake", workspaceId, "dash.session.ops");
  assert.ok(saveResult);
  assert.equal(saveResult.outcome, "succeeded");
  assert.equal(saveResult.action, "builder.save");

  const validateFailResult = source.validateFlowDraft("flow_invoice_recovery", workspaceId, "dash.session.ops");
  assert.ok(validateFailResult);
  assert.equal(validateFailResult.outcome, "failed");
  assert.equal(validateFailResult.action, "builder.validate");

  const previewFailResult = source.previewFlowPublish("flow_invoice_recovery", workspaceId, "dash.session.ops");
  assert.ok(previewFailResult);
  assert.equal(previewFailResult.outcome, "failed");
  assert.equal(previewFailResult.action, "publish.preview");

  const validatePassResult = source.validateFlowDraft("flow_locale_handoff", workspaceId, "dash.session.ops");
  assert.ok(validatePassResult);
  assert.equal(validatePassResult.outcome, "succeeded");

  const previewPassResult = source.previewFlowPublish("flow_locale_handoff", workspaceId, "dash.session.ops");
  assert.ok(previewPassResult);
  assert.equal(previewPassResult.outcome, "succeeded");
  assert.match(previewPassResult.publishReadiness.previewPacketId ?? "", /^pkt_flow_locale_handoff_/);

  const publishPassResult = source.publishFlow("flow_locale_handoff", workspaceId, "dash.session.ops");
  assert.ok(publishPassResult);
  assert.equal(publishPassResult.outcome, "succeeded");
  assert.equal(publishPassResult.action, "publish.confirm");

  const auditEvents = source.listAuditEvents({ workspaceId });
  assert.ok(auditEvents.length >= 7);
  assert.equal(auditEvents[0]?.action, "publish.confirm");
  assert.equal(auditEvents[0]?.actor, "dash.session.ops");

  const runtimeExecutions = source.listRuntimeExecutions({
    statuses: ["running", "failed"],
    workspaceId
  });
  assert.equal(runtimeExecutions.length, 2);

  const openCriticalAlerts = source.listAlerts({
    severities: ["critical"],
    statuses: ["open"],
    workspaceId
  });
  assert.equal(openCriticalAlerts.length, 1);
  assert.equal(openCriticalAlerts[0]?.alertId, "alt_9001");

  const summary = buildFlowSourceSummary(snapshot, FIXED_NOW);
  assert.deepEqual(summary.approvals, {
    humanRequired: 2,
    overdue: 2,
    pending: 2,
    total: 4
  });
  assert.deepEqual(summary.billing, {
    outstandingCents: 25149000,
    overdueCount: 1,
    total: 4,
    unpaidCount: 2
  });
  assert.deepEqual(summary.proofs, {
    failed: 1,
    pending: 1,
    total: 4,
    verifiedRatio: 0.5
  });
  assert.deepEqual(summary.alerts, {
    criticalOpen: 1,
    humanRequiredOpen: 2,
    open: 2,
    total: 4
  });
});
