import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import { createRootServer } from "../../apps/root/dist/server.js";

const oauthCallbackLimitBytes = 16 * 1024;

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server.address().port;
}

function request(port, { body, chunks, headers = {}, method = "GET", path = "/" } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ agent: false, headers, host: "127.0.0.1", method, path, port }, (res) => {
      const parts = [];
      res.on("data", (chunk) => parts.push(chunk));
      res.on("end", () =>
        resolve({
          body: Buffer.concat(parts).toString("utf8"),
          headers: res.headers,
          status: res.statusCode
        })
      );
    });
    req.setTimeout(5000, () => req.destroy(new Error(`timed out waiting for ${method} ${path}`)));
    req.on("error", reject);

    if (chunks) {
      for (const chunk of chunks) {
        req.write(chunk);
      }
      req.end();
      return;
    }

    req.end(body);
  });
}

async function startRoot(t) {
  const server = createRootServer();
  const port = await listen(server);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return port;
}

const formHeaders = { "content-type": "application/x-www-form-urlencoded" };

test("an in-limit Apple form_post callback still completes", async (t) => {
  const port = await startRoot(t);

  const response = await request(port, {
    body: new URLSearchParams({ code: "code123", state: "state123" }).toString(),
    headers: { ...formHeaders, cookie: "iai_oauth_state_apple=state123" },
    method: "POST",
    path: "/auth/apple/callback"
  });

  assert.equal(response.status, 200);
});

test("an oversized OAuth callback body is rejected with 413 and the server keeps serving", async (t) => {
  const port = await startRoot(t);

  const response = await request(port, {
    body: `state=${"a".repeat(oauthCallbackLimitBytes + 1)}`,
    headers: { ...formHeaders, cookie: "iai_oauth_state_apple=state123" },
    method: "POST",
    path: "/auth/apple/callback"
  });

  assert.equal(response.status, 413);
  assert.equal(JSON.parse(response.body).error.code, "PAYLOAD_TOO_LARGE");
  assert.equal(response.headers.connection, "close");

  const next = await request(port, { path: "/health" });
  assert.equal(next.status, 200);
});

test("an oversized chunked OAuth callback body does not take the server down", async (t) => {
  const port = await startRoot(t);

  // No content-length, so the limit has to be enforced while the body streams in.
  const outcome = await request(port, {
    chunks: ["state=", "a".repeat(oauthCallbackLimitBytes), "a".repeat(oauthCallbackLimitBytes)],
    headers: { ...formHeaders, cookie: "iai_oauth_state_google=state123" },
    method: "POST",
    path: "/auth/google/callback"
  }).then(
    (response) => response.status,
    (error) => error.code
  );

  assert.ok(outcome === 413 || outcome === "ECONNRESET" || outcome === "EPIPE", `unexpected outcome ${outcome}`);

  const next = await request(port, { path: "/health" });
  assert.equal(next.status, 200);
});

test("a malformed state cookie is treated as missing instead of failing the callback with a 500", async (t) => {
  const port = await startRoot(t);

  const response = await request(port, {
    headers: { cookie: "iai_oauth_state_google=%E0%A4%A" },
    path: "/auth/google/callback?code=code123&state=%E0%A4%A"
  });

  assert.equal(response.status, 400);
  assert.match(response.body, /OAuth state did not match/);
});
