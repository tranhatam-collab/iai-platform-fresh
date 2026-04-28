import test from "node:test";
import assert from "node:assert/strict";

import { createFlowSourceOfTruth } from "../../packages/mail-core/dist/index.js";
import { buildFlowDashFromSource } from "../../apps/mail-web/dist/index.js";

test("mail-web dash models approvals, billing, proofs, and alerts from source-of-truth", () => {
  const source = createFlowSourceOfTruth();
  const dash = buildFlowDashFromSource(
    source,
    "ws_flow_main",
    "2026-04-14T10:30:00.000Z"
  );

  assert.equal(dash.approvals.pendingCount, 2);
  assert.equal(dash.approvals.overdueCount, 2);
  assert.equal(dash.approvals.humanRequiredCount, 2);
  assert.equal(dash.approvals.blockingQueue[0]?.approvalId, "apr_101");

  assert.equal(dash.billing.outstandingCents, 25149000);
  assert.equal(dash.billing.collectionRiskCents, 25499000);
  assert.equal(dash.billing.overdueInvoices.length, 1);
  assert.equal(dash.billing.overdueInvoices[0]?.invoiceId, "inv_2301");

  assert.equal(dash.proofs.verificationRate, 0.5);
  assert.equal(dash.proofs.failedProofs.length, 1);
  assert.equal(dash.proofs.failedProofs[0]?.proofId, "prf_702");
  assert.equal(dash.proofs.lowConfidenceProofs.length, 2);

  assert.equal(dash.alerts.openCount, 2);
  assert.equal(dash.alerts.humanRequiredOpenCount, 2);
  assert.equal(dash.alerts.criticalOpen.length, 1);
  assert.equal(dash.alerts.criticalOpen[0]?.alertId, "alt_9001");
});
