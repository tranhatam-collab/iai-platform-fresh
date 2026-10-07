import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

// A render failure must answer a fixed 500 body. The thrown message can carry an upstream URL or a
// filesystem path, so it belongs in the server log only.
// Needs `pnpm --filter @iai/noos-web build`; works with or without the docs fixtures because the
// commerce API is required and answers 500, so the render fails either way.

const { createNoosWebServer } = await import("../../apps/noos-web/dist/http-server.js");

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

function get(port, path) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port, path }, (response) => {
        let text = "";
        response.on("data", (chunk) => (text += chunk));
        response.on("end", () => resolve({ status: response.statusCode, text }));
      })
      .on("error", reject);
  });
}

test("a render failure answers a constant 500 body and never echoes the thrown message", async () => {
  const upstream = http.createServer((_req, res) => {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("upstream-secret-marker");
  });
  const upstreamPort = await listen(upstream);

  const previous = {
    base: process.env.NOOS_COMMERCE_API_BASE,
    require: process.env.NOOS_COMMERCE_REQUIRE_API
  };
  process.env.NOOS_COMMERCE_API_BASE = `http://127.0.0.1:${upstreamPort}/internal-commerce-path`;
  process.env.NOOS_COMMERCE_REQUIRE_API = "1";

  const server = createNoosWebServer({ port: 0 });
  const port = await listen(server);
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const response = await get(port, "/en/products");
    assert.equal(response.status, 500, response.text.slice(0, 200));
    assert.deepEqual(JSON.parse(response.text), {
      code: "noos_web_render_error",
      message: "Unexpected server error"
    });
    assert.doesNotMatch(response.text, /Commerce API|internal-commerce-path|upstream-secret-marker|ENOENT|\/home\/|node_modules/);

    const health = await get(port, "/health");
    assert.equal(health.status, 200);
  } finally {
    console.error = originalConsoleError;
    if (previous.base === undefined) delete process.env.NOOS_COMMERCE_API_BASE;
    else process.env.NOOS_COMMERCE_API_BASE = previous.base;
    if (previous.require === undefined) delete process.env.NOOS_COMMERCE_REQUIRE_API;
    else process.env.NOOS_COMMERCE_REQUIRE_API = previous.require;
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => upstream.close(resolve));
  }
});
