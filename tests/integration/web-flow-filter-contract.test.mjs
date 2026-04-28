import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFlowContractSearchParams,
  buildFlowContractUrl
} from "../../apps/web/dist/flow-contract.js";

test("web filter mapper keeps exact Team 2 query/filter names", () => {
  const params = buildFlowContractSearchParams({
    status: ["open", "acked"],
    severity: "critical",
    overdueOnly: true,
    workspaceId: "ws_flow_main"
  });

  assert.equal(params.get("status"), "open,acked");
  assert.equal(params.get("severity"), "critical");
  assert.equal(params.get("overdue_only"), "true");
  assert.equal(params.get("workspace_id"), "ws_flow_main");
  assert.equal(params.get("overdueOnly"), null);
  assert.equal(params.get("workspaceId"), null);
});

test("web contract URLs stay aligned to the shared filter contract", () => {
  const alertsUrl = new URL(
    buildFlowContractUrl("https://api.flow.example", "/v1/flow/alerts", {
      status: "open",
      severity: "critical",
      workspaceId: "ws_flow_main"
    })
  );
  assert.equal(alertsUrl.pathname, "/v1/flow/alerts");
  assert.equal(alertsUrl.searchParams.get("status"), "open");
  assert.equal(alertsUrl.searchParams.get("severity"), "critical");
  assert.equal(alertsUrl.searchParams.get("workspace_id"), "ws_flow_main");

  const billingUrl = new URL(
    buildFlowContractUrl("https://api.flow.example", "/v1/flow/billing", {
      status: "overdue",
      overdueOnly: false,
      workspaceId: "ws_flow_main"
    })
  );
  assert.equal(billingUrl.pathname, "/v1/flow/billing");
  assert.equal(billingUrl.searchParams.get("status"), "overdue");
  assert.equal(billingUrl.searchParams.get("overdue_only"), "false");
  assert.equal(billingUrl.searchParams.get("workspace_id"), "ws_flow_main");
});
