import assert from "node:assert/strict";
import test from "node:test";

import { createNftRequestHandler } from "../../apps/nft/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

test("nft health route exposes public trust shell wiring", async () => {
  const response = await dispatchToHandler(createNftRequestHandler(), {
    url: "/health"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.equal(payload.ok, true);
  assert.equal(payload.data.service, "iai-nft");
  assert.equal(payload.data.flow_url, "https://flow.iai.one");
});

test("nft landing page stays a trust shell and keeps canonical metadata", async () => {
  const response = await dispatchToHandler(createNftRequestHandler(), {
    url: "/"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /Bề mặt trust công khai/);
  assert.match(html, /NFT giữ lớp trust công khai, xác minh và công bố cho toàn hệ/);
  assert.match(html, /https:\/\/developer\.iai\.one/);
  assert.match(html, /https:\/\/flow\.iai\.one/);
  assert.match(html, /<link rel="canonical" href="https:\/\/nft\.iai\.one\/" \/>/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /application\/ld\+json/);
});

test("nft supports explicit english rendering", async () => {
  const response = await dispatchToHandler(createNftRequestHandler(), {
    url: "/?lang=en"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /NFT holds the public trust, verification, and disclosure lane for the system/);
  assert.match(html, /Public trust lanes stay evidence-first and never bypass policy/);
});

test("nft keeps missing routes explicit", async () => {
  const response = await dispatchToHandler(createNftRequestHandler(), {
    url: "/missing"
  });
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /Route này không tồn tại trên nft/);
});
