import assert from "node:assert/strict";
import test from "node:test";

import { createAppRequestHandler } from "../../apps/app/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

test("app health route exposes user product shell wiring", async () => {
  const response = await dispatchToHandler(createAppRequestHandler(), {
    url: "/health"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.equal(payload.ok, true);
  assert.equal(payload.data.service, "iai-app");
  assert.equal(payload.data.home_url, "https://home.iai.one");
});

test("app landing page stays a user product shell and keeps canonical metadata", async () => {
  const response = await dispatchToHandler(createAppRequestHandler(), {
    url: "/"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /Bề mặt sản phẩm người dùng/);
  assert.match(html, /Bắt đầu từ hành trình của người dùng, không từ hạ tầng/);
  assert.match(html, /https:\/\/nft\.iai\.one/);
  assert.match(html, /https:\/\/dash\.iai\.one/);
  assert.match(html, /<link rel="canonical" href="https:\/\/app\.iai\.one\/" \/>/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /application\/ld\+json/);
});

test("app supports explicit english rendering", async () => {
  const response = await dispatchToHandler(createAppRequestHandler(), {
    url: "/?lang=en"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Start from the user journey, not from the infrastructure/);
  assert.match(html, /The app is a product surface, not every layer at once/);
});

test("app keeps missing routes explicit", async () => {
  const response = await dispatchToHandler(createAppRequestHandler(), {
    url: "/missing"
  });
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /Đường dẫn này không tồn tại trên app/);
});
