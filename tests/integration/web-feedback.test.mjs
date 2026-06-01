import assert from "node:assert/strict";
import test from "node:test";

import { createWebRequestHandler } from "../../apps/web/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

test("web feedback form renders in English and Vietnamese", async () => {
  const handler = createWebRequestHandler();

  const enResponse = await dispatchToHandler(handler, { url: "/feedback" });
  const enHtml = await enResponse.text();
  assert.equal(enResponse.status, 200);
  assert.equal(enResponse.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(enHtml, /Type of feedback/);
  assert.match(enHtml, /name="message"/);

  const viResponse = await dispatchToHandler(handler, { url: "/feedback?lang=vi" });
  const viHtml = await viResponse.text();
  assert.equal(viResponse.status, 200);
  assert.equal(viResponse.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(viHtml, /Loại phản hồi/);
});

test("submitting valid feedback records an event and shows the submitted confirmation", async () => {
  const handler = createWebRequestHandler();

  const submitResponse = await dispatchToHandler(handler, {
    body: new URLSearchParams({
      category: "idea",
      message: "Please add dark mode.",
      rating: "5",
      email: "user@example.com"
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    url: "/feedback"
  });
  const submitHtml = await submitResponse.text();
  assert.equal(submitResponse.status, 200);
  assert.match(submitHtml, /Feedback submitted/);
  assert.match(submitHtml, /Reference/);

  const eventsResponse = await dispatchToHandler(handler, { url: "/events" });
  const eventsPayload = await eventsResponse.json();
  assert.equal(eventsResponse.status, 200);
  assert.equal(eventsPayload.data.total, 1);
  const event = eventsPayload.data.items[0];
  assert.equal(event.eventName, "web_feedback_submitted");
  assert.equal(event.feedbackCategory, "idea");
  assert.equal(event.feedbackRating, 5);
  assert.equal(event.messageLength, "Please add dark mode.".length);
});

test("submitting feedback without a message returns a validation error", async () => {
  const handler = createWebRequestHandler();

  const response = await dispatchToHandler(handler, {
    body: new URLSearchParams({ category: "bug", message: "" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    url: "/feedback"
  });
  const html = await response.text();
  assert.equal(response.status, 400);
  assert.match(html, /Please add a message before sending feedback/);
});

test("submitting feedback with an invalid email returns a validation error", async () => {
  const handler = createWebRequestHandler();

  const response = await dispatchToHandler(handler, {
    body: new URLSearchParams({ category: "idea", message: "Hello", email: "not-an-email" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    url: "/feedback"
  });
  const html = await response.text();
  assert.equal(response.status, 400);
  assert.match(html, /does not look valid/);
});
