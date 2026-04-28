import assert from "node:assert/strict";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createDashRequestHandler } from "../../apps/dash/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

function normalizeHeaders(headers) {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

function createHandlerFetch(baseUrl, handler, requests = []) {
  return async (input, init = {}) => {
    const requestUrl =
      typeof input === "string" || input instanceof URL ? new URL(input.toString()) : new URL(input.url);

    if (!requestUrl.toString().startsWith(baseUrl)) {
      return fetch(input, init);
    }

    const headers = normalizeHeaders(init.headers);
    requests.push({
      headers,
      method: init.method ?? "GET",
      url: `${requestUrl.pathname}${requestUrl.search}`
    });

    return dispatchToHandler(handler, {
      body: init.body,
      headers,
      method: init.method ?? "GET",
      url: `${requestUrl.pathname}${requestUrl.search}`
    });
  };
}

test("dash health route exposes scaffold configuration", async () => {
  const response = await dispatchToHandler(createDashRequestHandler(), {
    url: "/health"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.equal(payload.ok, true);
  assert.equal(payload.data.service, "iai-dash");
  assert.equal(payload.data.default_workspace_id, "ws_flow_main");
});

test("dash requires an authenticated session before opening the app shell", async () => {
  const response = await dispatchToHandler(createDashRequestHandler(), {
    url: "/dashboard"
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/login?next=%2Fdashboard");
});

test("dash keeps locale when redirecting an unauthenticated english session", async () => {
  const response = await dispatchToHandler(createDashRequestHandler(), {
    url: "/dashboard?lang=en"
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/login?next=%2Fdashboard&lang=en");
});

test("dash dashboard reads runtime truth through api.flow with explicit workspace identity", async () => {
  const flowApiBase = "http://internal.flow.test";
  const flowRequests = [];
  const apiHandler = createFlowApiRequestHandler();
  const dashHandler = createDashRequestHandler({
    fetchImpl: createHandlerFetch(flowApiBase, apiHandler, flowRequests),
    flowApiBase
  });

  const response = await dispatchToHandler(dashHandler, {
    headers: {
      "x-dash-session": "session_test_001",
      "x-workspace-id": "ws_flow_main"
    },
    url: "/dashboard"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /Hệ điều khiển sống/);
  assert.match(html, /Điều khiển theo workspace/);
  assert.match(html, /Phê duyệt chờ/);
  assert.match(html, /Cảnh báo nghiêm trọng/);
  assert.match(html, /ws_flow_main/);
  assert.ok(flowRequests.length > 0);
  assert.ok(flowRequests.every((request) => request.headers["x-workspace-id"] === "ws_flow_main"));
  assert.ok(flowRequests.every((request) => request.url === "/v1/flow/source-of-truth"));
});

test("dash flow inventory reads flow contracts through api.flow", async () => {
  const flowApiBase = "http://internal.flow.test";
  const flowRequests = [];
  const apiHandler = createFlowApiRequestHandler();
  const dashHandler = createDashRequestHandler({
    fetchImpl: createHandlerFetch(flowApiBase, apiHandler, flowRequests),
    flowApiBase
  });

  const response = await dispatchToHandler(dashHandler, {
    headers: {
      "x-dash-session": "session_test_001",
      "x-workspace-id": "ws_flow_main"
    },
    url: "/flows"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /Danh mục flow/);
  assert.match(html, /Lead Intake Qualification/);
  assert.match(html, /Invoice Recovery Escalation/);
  assert.ok(flowRequests.some((request) => request.url === "/v1/flow/flows"));
  assert.ok(flowRequests.every((request) => request.headers["x-workspace-id"] === "ws_flow_main"));
});

test("dash flow detail and builder pages expose runtime-linked flow state", async () => {
  const flowApiBase = "http://internal.flow.test";
  const flowRequests = [];
  const apiHandler = createFlowApiRequestHandler();
  const dashHandler = createDashRequestHandler({
    fetchImpl: createHandlerFetch(flowApiBase, apiHandler, flowRequests),
    flowApiBase
  });

  const detailResponse = await dispatchToHandler(dashHandler, {
    headers: {
      "x-dash-session": "session_test_001",
      "x-workspace-id": "ws_flow_main"
    },
    url: "/flows/flow_invoice_recovery"
  });
  const detailHtml = await detailResponse.text();
  assert.equal(detailResponse.status, 200);
  assert.match(detailHtml, /Invoice Recovery Escalation/);
  assert.match(detailHtml, /Độ sẵn sàng của builder/);
  assert.match(detailHtml, /exec_9002/);

  const builderResponse = await dispatchToHandler(dashHandler, {
    headers: {
      "x-dash-session": "session_test_001",
      "x-workspace-id": "ws_flow_main"
    },
    url: "/flows/flow_locale_handoff/builder"
  });
  const builderHtml = await builderResponse.text();
  assert.equal(builderResponse.status, 200);
  assert.match(builderHtml, /Nền builder/);
  assert.match(builderHtml, /Locale-safe Handoff/);
  assert.match(builderHtml, /decision\.locale/);

  assert.ok(
    flowRequests.some((request) => request.url === "/v1/flow/flows/flow_invoice_recovery")
  );
  assert.ok(
    flowRequests.some((request) => request.url === "/v1/flow/flows/flow_locale_handoff")
  );
});

test("dash flow versions, drafts, and publish routes expose release-lane truth", async () => {
  const flowApiBase = "http://internal.flow.test";
  const flowRequests = [];
  const apiHandler = createFlowApiRequestHandler();
  const dashHandler = createDashRequestHandler({
    fetchImpl: createHandlerFetch(flowApiBase, apiHandler, flowRequests),
    flowApiBase
  });

  const versionsResponse = await dispatchToHandler(dashHandler, {
    headers: {
      "x-dash-session": "session_test_001",
      "x-workspace-id": "ws_flow_main"
    },
    url: "/flows/flow_lead_intake/versions"
  });
  const versionsHtml = await versionsResponse.text();
  assert.equal(versionsResponse.status, 200);
  assert.match(versionsHtml, /Lịch sử phiên bản/);
  assert.match(versionsHtml, /v12/);
  assert.match(versionsHtml, /Đã publish/);

  const draftsResponse = await dispatchToHandler(dashHandler, {
    headers: {
      "x-dash-session": "session_test_001",
      "x-workspace-id": "ws_flow_main"
    },
    url: "/flows/flow_invoice_recovery/drafts"
  });
  const draftsHtml = await draftsResponse.text();
  assert.equal(draftsResponse.status, 200);
  assert.match(draftsHtml, /Hàng draft/);
  assert.match(draftsHtml, /draft_invoice_v8/);
  assert.match(draftsHtml, /Issue đang mở/);

  const publishResponse = await dispatchToHandler(dashHandler, {
    headers: {
      "x-dash-session": "session_test_001",
      "x-workspace-id": "ws_flow_main"
    },
    url: "/flows/flow_invoice_recovery/publish"
  });
  const publishHtml = await publishResponse.text();
  assert.equal(publishResponse.status, 200);
  assert.match(publishHtml, /Độ sẵn sàng publish/);
  assert.match(publishHtml, /APR-101/);
  assert.match(publishHtml, /Checklist/);

  assert.ok(
    flowRequests.some((request) => request.url === "/v1/flow/flows/flow_lead_intake/versions")
  );
  assert.ok(
    flowRequests.some((request) => request.url === "/v1/flow/flows/flow_invoice_recovery/drafts")
  );
  assert.ok(
    flowRequests.some((request) => request.url === "/v1/flow/flows/flow_invoice_recovery/publish")
  );
});

test("dash builder and publish action routes execute commands and expose audit timeline", async () => {
  const flowApiBase = "http://internal.flow.test";
  const flowRequests = [];
  const apiHandler = createFlowApiRequestHandler();
  const dashHandler = createDashRequestHandler({
    fetchImpl: createHandlerFetch(flowApiBase, apiHandler, flowRequests),
    flowApiBase
  });
  const headers = {
    "x-dash-session": "session_test_001",
    "x-workspace-id": "ws_flow_main"
  };

  const saveResponse = await dispatchToHandler(dashHandler, {
    headers,
    method: "POST",
    url: "/flows/flow_lead_intake/builder/save"
  });
  assert.equal(saveResponse.status, 303);
  const saveLocation = saveResponse.headers.get("location");
  assert.ok(saveLocation);
  assert.match(saveLocation, /\/flows\/flow_lead_intake\/builder\?/);
  assert.match(saveLocation, /action=builder\.save/);
  assert.match(saveLocation, /outcome=succeeded/);

  const saveLandingResponse = await dispatchToHandler(dashHandler, {
    headers,
    url: saveLocation
  });
  const saveLandingHtml = await saveLandingResponse.text();
  assert.equal(saveLandingResponse.status, 200);
  assert.match(saveLandingHtml, /Kết quả action gần nhất/);
  assert.match(saveLandingHtml, /builder\.save/);

  const validateFailResponse = await dispatchToHandler(dashHandler, {
    headers,
    method: "POST",
    url: "/flows/flow_invoice_recovery/builder/validate"
  });
  assert.equal(validateFailResponse.status, 303);
  const validateFailLocation = validateFailResponse.headers.get("location");
  assert.ok(validateFailLocation);
  assert.match(validateFailLocation, /outcome=failed/);

  const previewResponse = await dispatchToHandler(dashHandler, {
    headers,
    method: "POST",
    url: "/flows/flow_locale_handoff/publish/preview"
  });
  assert.equal(previewResponse.status, 303);

  const publishResponse = await dispatchToHandler(dashHandler, {
    headers,
    method: "POST",
    url: "/flows/flow_locale_handoff/publish/confirm"
  });
  assert.equal(publishResponse.status, 303);
  const publishLocation = publishResponse.headers.get("location");
  assert.ok(publishLocation);
  assert.match(publishLocation, /action=publish\.confirm/);
  assert.match(publishLocation, /outcome=succeeded/);

  const publishLandingResponse = await dispatchToHandler(dashHandler, {
    headers,
    url: publishLocation
  });
  const publishLandingHtml = await publishLandingResponse.text();
  assert.equal(publishLandingResponse.status, 200);
  assert.match(publishLandingHtml, /Action publish/);
  assert.match(publishLandingHtml, /publish\.confirm/);

  const auditResponse = await dispatchToHandler(dashHandler, {
    headers,
    url: "/audit"
  });
  const auditHtml = await auditResponse.text();
  assert.equal(auditResponse.status, 200);
  assert.match(auditHtml, /Dòng thời gian audit/);
  assert.match(auditHtml, /publish\.confirm/);

  assert.ok(
    flowRequests.some(
      (request) =>
        request.method === "POST" &&
        request.url === "/v1/flow/flows/flow_lead_intake/builder/save"
    )
  );
  assert.ok(
    flowRequests.some(
      (request) =>
        request.method === "POST" &&
        request.url === "/v1/flow/flows/flow_invoice_recovery/builder/validate"
    )
  );
  assert.ok(
    flowRequests.some(
      (request) =>
        request.method === "POST" &&
        request.url === "/v1/flow/flows/flow_locale_handoff/publish/preview"
    )
  );
  assert.ok(
    flowRequests.some(
      (request) =>
        request.method === "POST" &&
        request.url === "/v1/flow/flows/flow_locale_handoff/publish/confirm"
    )
  );
  assert.ok(flowRequests.some((request) => request.url === "/v1/flow/audit"));
});

test("dash runtime execution routes expose execution truth from api.flow", async () => {
  const flowApiBase = "http://internal.flow.test";
  const flowRequests = [];
  const apiHandler = createFlowApiRequestHandler();
  const dashHandler = createDashRequestHandler({
    fetchImpl: createHandlerFetch(flowApiBase, apiHandler, flowRequests),
    flowApiBase
  });

  const listResponse = await dispatchToHandler(dashHandler, {
    headers: {
      "x-dash-session": "session_test_001",
      "x-workspace-id": "ws_flow_main"
    },
    url: "/runtime/executions"
  });
  const listHtml = await listResponse.text();
  assert.equal(listResponse.status, 200);
  assert.match(listHtml, /Lượt chạy runtime/);
  assert.match(listHtml, /exec_9002/);
  assert.match(listHtml, /Invoice Recovery Escalation/);

  const detailResponse = await dispatchToHandler(dashHandler, {
    headers: {
      "x-dash-session": "session_test_001",
      "x-workspace-id": "ws_flow_main"
    },
    url: "/runtime/executions/exec_9002"
  });
  const detailHtml = await detailResponse.text();
  assert.equal(detailResponse.status, 200);
  assert.match(detailHtml, /Chi tiết execution/);
  assert.match(detailHtml, /node_approval_writeoff/);
  assert.match(detailHtml, /alt_9001/);

  assert.ok(flowRequests.some((request) => request.url === "/v1/flow/runtime/executions"));
  assert.ok(
    flowRequests.some((request) => request.url === "/v1/flow/runtime/executions/exec_9002")
  );
});

test("dash login page supports explicit english rendering", async () => {
  const response = await dispatchToHandler(createDashRequestHandler(), {
    url: "/login?lang=en"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /The living control system begins behind a real session boundary\./);
  assert.match(html, /Runtime state is always read from api\.flow\./);
});

test("dash logout clears session and workspace cookies", async () => {
  const response = await dispatchToHandler(createDashRequestHandler(), {
    url: "/logout"
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/login");
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  assert.match(setCookie, /iai_session=/);
  assert.match(setCookie, /iai_workspace=/);
  assert.match(setCookie, /Max-Age=0/);
});
