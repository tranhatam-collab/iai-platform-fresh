import assert from "node:assert/strict";
import test from "node:test";

import { createFlowRequestHandler } from "../../apps/flow/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

test("flow health route exposes execution shell wiring", async () => {
  const response = await dispatchToHandler(createFlowRequestHandler(), {
    url: "/health"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.equal(payload.ok, true);
  assert.equal(payload.data.service, "iai-flow");
  assert.equal(payload.data.dash_url, "https://dash.iai.one");
});

test("flow landing page stays an execution shell and keeps canonical metadata", async () => {
  const response = await dispatchToHandler(createFlowRequestHandler(), {
    url: "/"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /Bề mặt thực thi sống/);
  assert.match(html, /Flow giữ vai thực thi sống cho workflow và runtime truth/);
  assert.match(html, /https:\/\/dash\.iai\.one/);
  assert.match(html, /https:\/\/api\.flow\.iai\.one/);
  assert.match(html, /<link rel="canonical" href="https:\/\/flow\.iai\.one\/" \/>/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /application\/ld\+json/);
});

test("flow supports explicit english rendering", async () => {
  const response = await dispatchToHandler(createFlowRequestHandler(), {
    url: "/?lang=en"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Flow keeps the living execution role for workflows and runtime truth/);
  assert.match(html, /Execution lanes must stay evidence-first, not presentation-first/);
});

test("flow exposes a valid XML sitemap instead of HTML fallback", async () => {
  const response = await dispatchToHandler(createFlowRequestHandler(), {
    url: "/sitemap.xml"
  });
  const xml = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/xml/);
  assert.match(xml, /<urlset/);
  assert.match(xml, /https:\/\/flow\.iai\.one\//);
  assert.doesNotMatch(xml, /<!doctype html>/i);
});

test("flow keeps missing routes explicit", async () => {
  const response = await dispatchToHandler(createFlowRequestHandler(), {
    url: "/missing"
  });
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /Route này không tồn tại trên flow/);
});
