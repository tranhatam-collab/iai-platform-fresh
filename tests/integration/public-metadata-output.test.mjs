import assert from "node:assert/strict";
import test from "node:test";

import { createNftRequestHandler } from "../../apps/nft/dist/server.js";
import { createRootRequestHandler } from "../../apps/root/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const failing = {
  toString() {
    throw new Error("detail-that-must-not-be-returned");
  }
};

test("root health lists no URL for any configured link", async () => {
  const handler = createRootRequestHandler({
    appUrl: "https://app.example.test",
    googleClientId: "client-id-value",
    portalUrl: "https://portal.example.test"
  });
  const response = await dispatchToHandler(handler, { url: "/health" });
  const text = await response.text();

  assert.equal(response.status, 200);
  assert.doesNotMatch(text, /example\.test|https?:\/\/|client-id-value/u);
});

test("an unexpected failure answers a fixed code and message in root and nft", async () => {
  for (const [name, handler, code] of [
    ["root", createRootRequestHandler({ appUrl: failing }), "ROOT_SERVER_ERROR"],
    ["nft", createNftRequestHandler({ appUrl: failing }), "NFT_SERVER_ERROR"]
  ]) {
    const response = await dispatchToHandler(handler, { url: "/" });
    const text = await response.text();
    assert.equal(response.status, 500, name);
    assert.equal(JSON.parse(text).error.code, code, name);
    assert.doesNotMatch(text, /detail-that-must-not-be-returned/u, name);
  }
});

test("the root social image limits the length and shape of its parameters", async () => {
  const handler = createRootRequestHandler();
  const long = "a".repeat(5000);
  const response = await dispatchToHandler(handler, {
    url: `/og.svg?${new URLSearchParams({ description: long, surface: long, title: long }).toString()}`
  });
  const text = await response.text();

  assert.equal(response.status, 200);
  assert.ok(text.length < 8000, `image is ${text.length} characters`);
  assert.doesNotMatch(text, /a{200}/u);
  assert.match(text, />IAI\.ONE</u, "an over-long surface falls back to the default");

  const spaced = await dispatchToHandler(handler, {
    url: `/og.svg?${new URLSearchParams({ surface: "docs", title: "  Hello   world  " }).toString()}`
  });
  const spacedText = await spaced.text();
  assert.match(spacedText, />Hello world</u);
  assert.match(spacedText, />DOCS</u);
});
