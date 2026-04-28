import assert from "node:assert/strict";
import test from "node:test";

import { createDocsRequestHandler } from "../../apps/docs/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

test("docs health route exposes documentation shell wiring", async () => {
  const response = await dispatchToHandler(createDocsRequestHandler(), {
    url: "/health"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.equal(payload.ok, true);
  assert.equal(payload.data.service, "iai-docs");
  assert.equal(payload.data.flow_url, "https://flow.iai.one");
});

test("docs landing page stays a boundary shell and keeps canonical metadata", async () => {
  const response = await dispatchToHandler(createDocsRequestHandler(), {
    url: "/"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /Bề mặt tài liệu vận hành/);
  assert.match(html, /Docs giữ kiến trúc, chuẩn, vai trò và ranh giới của toàn hệ/);
  assert.match(html, /https:\/\/developer\.iai\.one/);
  assert.match(html, /https:\/\/flow\.iai\.one/);
  assert.match(html, /<link rel="canonical" href="https:\/\/docs\.iai\.one\/" \/>/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:title"/);
  assert.match(html, /name="twitter:image"/);
  assert.match(html, /application\/ld\+json/);
});

test("docs supports explicit english rendering", async () => {
  const response = await dispatchToHandler(createDocsRequestHandler(), {
    url: "/?lang=en"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Docs holds architecture, standards, roles, and system boundaries/);
  assert.match(html, /If a statement cannot be traced to codex and evidence/);
});

test("docs keeps missing routes explicit", async () => {
  const response = await dispatchToHandler(createDocsRequestHandler(), {
    url: "/missing"
  });
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /Route này không tồn tại trên docs/);
});
