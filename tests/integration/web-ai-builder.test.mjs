import assert from "node:assert/strict";
import test from "node:test";

import { createWebRequestHandler } from "../../apps/web/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

function stubClient(result) {
  const calls = [];
  return {
    calls,
    generateSite(request) {
      calls.push(request);
      return Promise.resolve(result);
    }
  };
}

test("the build route is hidden when the AI builder flag is off", async () => {
  const handler = createWebRequestHandler({ aiBuilderEnabled: false });

  const response = await dispatchToHandler(handler, { url: "/build" });
  assert.equal(response.status, 404);
});

test("a successful AI build renders the generated sections and records completion", async () => {
  const client = stubClient({
    ok: true,
    siteId: "site_123",
    sections: [
      { heading: "Hero", body: "Welcome to Tam Coffee" },
      { heading: "Menu", body: "Fresh drinks daily" }
    ],
    previewHtml: "<section>Hero</section>"
  });
  const handler = createWebRequestHandler({ aiBuilderEnabled: true, aiAgentClient: client });

  const formResponse = await dispatchToHandler(handler, { url: "/build" });
  assert.equal(formResponse.status, 200);
  assert.match(await formResponse.text(), /Build with AI/);

  const buildResponse = await dispatchToHandler(handler, {
    body: new URLSearchParams({
      businessName: "Tam Coffee",
      goal: "Sell coffee online",
      intent: "commerce",
      role: "operator"
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    url: "/build"
  });
  const buildHtml = await buildResponse.text();
  assert.equal(buildResponse.status, 200);
  assert.match(buildHtml, /Draft site for Tam Coffee/);
  assert.match(buildHtml, /Hero/);
  assert.match(buildHtml, /Menu/);
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].businessName, "Tam Coffee");

  const eventsResponse = await dispatchToHandler(handler, { url: "/events" });
  const eventsPayload = await eventsResponse.json();
  const names = eventsPayload.data.items.map((item) => item.eventName);
  assert.deepEqual(names, ["web_ai_build_started", "web_ai_build_completed"]);
});

test("a quota-exceeded AI build renders the quota error and records failure", async () => {
  const client = stubClient({ ok: false, error: "AI_QUOTA_EXCEEDED" });
  const handler = createWebRequestHandler({ aiBuilderEnabled: true, aiAgentClient: client });

  const buildResponse = await dispatchToHandler(handler, {
    body: new URLSearchParams({
      businessName: "Tam Coffee",
      goal: "Sell coffee online",
      intent: "commerce",
      role: "operator"
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    url: "/build"
  });
  const buildHtml = await buildResponse.text();
  assert.equal(buildResponse.status, 502);
  assert.match(buildHtml, /free AI build quota is reached/);

  const eventsResponse = await dispatchToHandler(handler, { url: "/events" });
  const eventsPayload = await eventsResponse.json();
  const failed = eventsPayload.data.items.find((item) => item.eventName === "web_ai_build_failed");
  assert.ok(failed);
  assert.equal(failed.buildOutcome, "AI_QUOTA_EXCEEDED");
});

test("an unauthorized BYOK build renders the unauthorized error", async () => {
  const client = stubClient({ ok: false, error: "AI_UNAUTHORIZED" });
  const handler = createWebRequestHandler({ aiBuilderEnabled: true, aiAgentClient: client });

  const buildResponse = await dispatchToHandler(handler, {
    body: new URLSearchParams({
      businessName: "Tam Coffee",
      goal: "Sell coffee online"
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    url: "/build"
  });
  const buildHtml = await buildResponse.text();
  assert.equal(buildResponse.status, 502);
  assert.match(buildHtml, /AI access was not authorized/);
});

test("missing build inputs return a validation error", async () => {
  const client = stubClient({ ok: true, sections: [{ heading: "Hero", body: "x" }] });
  const handler = createWebRequestHandler({ aiBuilderEnabled: true, aiAgentClient: client });

  const buildResponse = await dispatchToHandler(handler, {
    body: new URLSearchParams({ businessName: "", goal: "" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    url: "/build"
  });
  assert.equal(buildResponse.status, 400);
  assert.match(await buildResponse.text(), /add a business name and goal/);
  assert.equal(client.calls.length, 0);
});
