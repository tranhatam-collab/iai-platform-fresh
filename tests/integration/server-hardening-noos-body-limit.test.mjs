import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

// The checkout form is a handful of short fields. A body above the cap must be refused with a
// real 413 (not a socket reset, not unbounded buffering) and the server must keep serving.
// Needs `pnpm --filter @iai/noos-web build`; no docs fixtures are needed because the body is
// refused before any catalog data is read.

const { createNoosWebServer } = await import("../../apps/noos-web/dist/http-server.js");

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

function send(port, { path, headers, chunks }) {
  return new Promise((resolve, reject) => {
    const request = http.request({ host: "127.0.0.1", port, path, method: "POST", headers }, (response) => {
      let text = "";
      response.on("data", (chunk) => (text += chunk));
      response.on("end", () => resolve({ status: response.statusCode, text }));
    });
    request.on("error", reject);
    for (const chunk of chunks) {
      request.write(chunk);
    }
    request.end();
  });
}

test("an oversized checkout body gets a real 413 and the server keeps serving", async () => {
  const server = createNoosWebServer({ port: 0 });
  const port = await listen(server);
  try {
    const big = Buffer.alloc(80 * 1024, "a");

    // declared length above the cap
    const declared = await send(port, {
      path: "/en/checkout",
      headers: { "content-type": "application/x-www-form-urlencoded", "content-length": String(big.length) },
      chunks: [big]
    });
    assert.equal(declared.status, 413);

    // chunked body (no content-length) that crosses the cap while streaming
    const chunked = await send(port, {
      path: "/en/checkout",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      chunks: [big.subarray(0, 40 * 1024), big.subarray(40 * 1024)]
    });
    assert.equal(chunked.status, 413);

    const health = await new Promise((resolve, reject) => {
      http.get({ host: "127.0.0.1", port, path: "/health" }, (response) => {
        response.resume();
        response.on("end", () => resolve(response.statusCode));
      }).on("error", reject);
    });
    assert.equal(health, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
