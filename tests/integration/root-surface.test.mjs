import assert from "node:assert/strict";
import test from "node:test";

import { createRootRequestHandler } from "../../apps/root/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

test("root health route exposes constitutional shell wiring", async () => {
  const response = await dispatchToHandler(createRootRequestHandler(), {
    url: "/health"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.equal(payload.ok, true);
  assert.equal(payload.data.service, "iai-root");
  assert.equal(payload.data.portal_url, "https://home.iai.one");
  assert.equal(payload.data.web_surface_enabled, false);
  assert.equal(payload.data.web_url, null);
});

test("root landing page stays constitutional and locale-aware", async () => {
  const response = await dispatchToHandler(createRootRequestHandler(), {
    url: "/"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /Lớp trust hiến pháp/);
  assert.match(html, /Mỗi bề mặt chỉ làm đúng vai trò của mình/);
  assert.match(html, /https:\/\/home\.iai\.one/);
  assert.doesNotMatch(html, /https:\/\/web\.iai\.one/);
  assert.match(html, /https:\/\/docs\.iai\.one\/legal\/iai-flow\//);
  assert.match(html, /Angel Edu Tam Foundation Inc/);
  assert.match(html, /<link rel="canonical" href="https:\/\/iai\.one\/" \/>/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:title"/);
  assert.match(html, /name="twitter:image"/);
  assert.match(html, /application\/ld\+json/);
});

test("root supports explicit english rendering", async () => {
  const response = await dispatchToHandler(createRootRequestHandler(), {
    url: "/?lang=en"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Constitutional trust layer/);
  assert.match(html, /Each surface performs only its proper role/);
  assert.match(html, /Legal entity: Angel Edu Tam Foundation Inc/);
});

test("root can explicitly re-enable the web surface when deploy truth is ready", async () => {
  const response = await dispatchToHandler(
    createRootRequestHandler({
      webSurfaceEnabled: true
    }),
    {
      url: "/"
    }
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /https:\/\/web\.iai\.one/);
});

test("root keeps missing routes explicit", async () => {
  const response = await dispatchToHandler(createRootRequestHandler(), {
    url: "/missing"
  });
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /Route này không tồn tại trên root/);
});
