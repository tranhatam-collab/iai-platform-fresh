import assert from "node:assert/strict";
import test from "node:test";

import { createWebRequestHandler } from "../../apps/web/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const EVENT_API_KEY = "web-event-security-test-key";

test("web event routes fail closed and reject invalid service credentials", async () => {
  const unconfigured = await dispatchToHandler(createWebRequestHandler(), { url: "/events" });
  const unconfiguredPayload = await unconfigured.json();
  assert.equal(unconfigured.status, 503);
  assert.equal(unconfiguredPayload.error.code, "EVENT_API_KEY_MISSING");

  const unauthorized = await dispatchToHandler(
    createWebRequestHandler({ eventApiKey: EVENT_API_KEY }),
    { headers: { authorization: "Bearer wrong-key" }, url: "/events" }
  );
  const unauthorizedPayload = await unauthorized.json();
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorizedPayload.error.code, "UNAUTHORIZED");
});

test("web event ingestion accepts only the locked baseline allowlist", async () => {
  const handler = createWebRequestHandler({ eventApiKey: EVENT_API_KEY });
  const headers = {
    authorization: `Bearer ${EVENT_API_KEY}`,
    "content-type": "application/json"
  };
  const accepted = await dispatchToHandler(handler, {
    body: JSON.stringify({
      eventName: "web_first_action_completed",
      assignmentReason: "integration_test",
      sourceCampaign: "test",
      variantId: "A"
    }),
    headers,
    method: "POST",
    url: "/events/track"
  });
  assert.equal(accepted.status, 202);

  const rejected = await dispatchToHandler(handler, {
    body: JSON.stringify({ eventName: "arbitrary_attacker_event" }),
    headers,
    method: "POST",
    url: "/events/track"
  });
  assert.equal(rejected.status, 400);

  const baseline = await dispatchToHandler(handler, {
    headers: { authorization: `Bearer ${EVENT_API_KEY}` },
    url: "/events/baseline"
  });
  const baselinePayload = await baseline.json();
  assert.equal(baseline.status, 200);
  assert.equal(baselinePayload.data.seen.includes("web_first_action_completed"), true);
  assert.equal(baselinePayload.data.missing.includes("web_landing_view"), true);
});
