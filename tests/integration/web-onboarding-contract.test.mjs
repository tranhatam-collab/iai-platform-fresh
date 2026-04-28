import assert from "node:assert/strict";
import test from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createWebRequestHandler } from "../../apps/web/dist/server.js";
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

test("web onboarding reads shared Team 2 contracts and redirects to shared auth", async () => {
  const flowApiBase = "http://internal.flow.test";
  const contractRequests = [];
  const apiHandler = createFlowApiRequestHandler({
    webContractConfig: {
      sharedAuthUrl: "https://app-preview.iai.one/auth/entry",
      sharedBillingUrl: "https://dash-preview.iai.one/billing-center",
      sharedAppUrl: "https://app-preview.iai.one",
      sharedFlowUrl: "https://flow-preview.iai.one",
      sharedDashUrl: "https://dash-preview.iai.one"
    }
  });
  const webHandler = createWebRequestHandler({
    fetchImpl: createHandlerFetch(flowApiBase, apiHandler, contractRequests),
    flowApiBase
  });

  const healthResponse = await dispatchToHandler(webHandler, {
    url: "/health"
  });
  const healthPayload = await healthResponse.json();
  assert.equal(healthResponse.status, 200);
  assert.equal(healthPayload.ok, true);
  assert.equal(healthPayload.data.auth_mode, "shared_redirect");

  const contractResponse = await dispatchToHandler(webHandler, {
    url: "/contract-status"
  });
  const contractPayload = await contractResponse.json();
  assert.equal(contractResponse.status, 200);
  assert.equal(contractPayload.ok, true);
  assert.equal(contractPayload.data.contract.service, "api.flow");
  assert.equal(contractPayload.data.contract.approvalsPending, 2);
  assert.equal(contractPayload.data.contract.billingOverdueCount, 1);
  assert.equal(contractPayload.data.readiness.sharedContractState, "blocked");

  const onboardingResponse = await dispatchToHandler(webHandler, {
    url: "/onboarding"
  });
  const onboardingHtml = await onboardingResponse.text();
  assert.equal(onboardingResponse.status, 200);
  assert.match(onboardingHtml, /Route a new user into the right shared product surface/);
  assert.match(onboardingHtml, /https:\/\/app-preview\.iai\.one\/auth\/entry/);

  const summaryResponse = await dispatchToHandler(webHandler, {
    body: new URLSearchParams({
      intent: "leads",
      role: "builder"
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    method: "POST",
    url: "/onboarding"
  });
  const summaryHtml = await summaryResponse.text();
  assert.equal(summaryResponse.status, 200);
  assert.match(summaryHtml, /Shared contract check passed/);
  assert.match(summaryHtml, /Flow-powered lead capture/);
  assert.match(summaryHtml, /Continue with shared auth/);
  assert.match(summaryHtml, /blocked/);

  const authResponse = await dispatchToHandler(webHandler, {
    url: "/shared-auth?role=builder&intent=leads"
  });
  assert.equal(authResponse.status, 303);
  const location = authResponse.headers.get("location");
  assert.ok(location);
  assert.match(location, /^https:\/\/app-preview\.iai\.one\/auth\/entry\?/);
  assert.match(location, /origin=web.iai.one/);
  assert.match(location, /intent=leads/);
  assert.match(
    location,
    /next=https%3A%2F%2Fflow-preview\.iai\.one%2Ftemplates%2Flead-intake%3Fsurface%3Dweb/
  );

  const eventsResponse = await dispatchToHandler(webHandler, {
    url: "/events"
  });
  const eventsPayload = await eventsResponse.json();
  assert.equal(eventsResponse.status, 200);
  assert.equal(eventsPayload.ok, true);
  assert.equal(eventsPayload.data.total, 3);
  assert.deepEqual(
    eventsPayload.data.items.map((item) => item.eventName),
    ["web_onboarding_started", "web_role_selected", "web_auth_handoff_started"]
  );
  assert.ok(contractRequests.length > 0);
  assert.ok(
    contractRequests.every((request) => request.headers["x-workspace-id"] === "ws_flow_main")
  );
});
