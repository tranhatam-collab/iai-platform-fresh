import assert from "node:assert/strict";
import test from "node:test";

import { createHomeRequestHandler } from "../../apps/home/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

test("home health route exposes portal shell wiring", async () => {
  const response = await dispatchToHandler(createHomeRequestHandler(), {
    url: "/health"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.equal(payload.ok, true);
  assert.equal(payload.data.service, "iai-home");
  assert.equal(payload.data.root_url, "https://iai.one");
  assert.equal(payload.data.web_surface_enabled, false);
  assert.equal(payload.data.web_url, null);
});

test("home landing page stays a portal and keeps canonical metadata", async () => {
  const response = await dispatchToHandler(createHomeRequestHandler(), {
    url: "/"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /Cổng vào hệ thống/);
  assert.match(html, /Chọn đúng bề mặt trước khi đi sâu hơn/);
  assert.match(html, /https:\/\/app\.iai\.one/);
  assert.match(html, /https:\/\/flow\.iai\.one/);
  assert.doesNotMatch(html, /https:\/\/web\.iai\.one/);
  assert.match(html, /https:\/\/docs\.iai\.one\/legal\/iai-flow\//);
  assert.match(html, /Angel Edu Tam Foundation Inc/);
  assert.match(html, /<link rel="canonical" href="https:\/\/home\.iai\.one\/" \/>/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:title"/);
  assert.match(html, /name="twitter:image"/);
  assert.match(html, /application\/ld\+json/);
});

test("home supports explicit english rendering", async () => {
  const response = await dispatchToHandler(createHomeRequestHandler(), {
    url: "/?lang=en"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Choose the right surface before going deeper/);
  assert.match(html, /The portal routes\. It does not replace roles\./);
  assert.match(html, /Legal entity: Angel Edu Tam Foundation Inc/);
});

test("home can explicitly re-enable the web surface when deploy truth is ready", async () => {
  const response = await dispatchToHandler(
    createHomeRequestHandler({
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

test("home keeps missing routes explicit", async () => {
  const response = await dispatchToHandler(createHomeRequestHandler(), {
    url: "/missing"
  });
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /Route này không tồn tại trên portal/);
});
