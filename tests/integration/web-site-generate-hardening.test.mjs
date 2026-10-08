import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import { createAiAgentClient, defaultAiAgentTimeoutMs } from "../../apps/web/dist/aiagent-client.js";
import { createWebRequestHandler, createWebServer } from "../../apps/web/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const maxBodyBytes = 64 * 1024;

function stubClient(result = { ok: true, siteId: "site_1", sections: [{ heading: "Hero", body: "Hi" }] }) {
  const calls = [];
  return {
    calls,
    generateSite(request) {
      calls.push(request);
      return Promise.resolve(result);
    }
  };
}

// AbortSignal.timeout() uses an unref'd timer; a real server's open socket keeps the loop alive,
// but these in-process tests need something to do the same while they wait for the abort.
async function untilTimeoutFires(promise) {
  const keepAlive = setTimeout(() => {}, 10_000);
  try {
    return await promise;
  } finally {
    clearTimeout(keepAlive);
  }
}

function generate(handler, body, headers = {}) {
  return dispatchToHandler(handler, {
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
    method: "POST",
    url: "/v1/site/generate"
  });
}

function enabledHandler(client = stubClient()) {
  return { client, handler: createWebRequestHandler({ aiAgentClient: client, aiBuilderEnabled: true }) };
}

test("POST /v1/site/generate honors the AI builder feature flag like /build does", async () => {
  const client = stubClient();
  const handler = createWebRequestHandler({ aiAgentClient: client, aiBuilderEnabled: false });

  const build = await dispatchToHandler(handler, { url: "/build" });
  const generated = await generate(handler, { businessName: "Tam Coffee", goal: "Sell coffee" });

  assert.equal(generated.status, build.status);
  assert.equal(generated.status, 404);
  const payload = await generated.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "NOT_FOUND");
  assert.equal(client.calls.length, 0);
});

test("POST /v1/site/generate rejects bodies that are not JSON objects with 400", async () => {
  for (const body of ["null", "[]", '"text"', "42", "true", "{not json", ""]) {
    const { client, handler } = enabledHandler();

    const response = await generate(handler, body);
    assert.equal(response.status, 400, `body ${JSON.stringify(body)}`);
    const payload = await response.json();
    assert.equal(payload.ok, false);
    assert.equal(payload.error.code, "INVALID_REQUEST");
    assert.equal(client.calls.length, 0);
  }
});

test("POST /v1/site/generate rejects non-string and missing required fields", async () => {
  for (const body of [
    {},
    { businessName: "Tam Coffee" },
    { goal: "Sell coffee" },
    { businessName: { value: "Tam Coffee" }, goal: "Sell coffee" },
    { businessName: "Tam Coffee", goal: ["Sell coffee"] },
    { businessName: 123, goal: 456 },
    { businessName: "   ", goal: "Sell coffee" }
  ]) {
    const { client, handler } = enabledHandler();

    const response = await generate(handler, body);
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.equal((await response.json()).error.code, "INVALID_REQUEST");
    assert.equal(client.calls.length, 0);
  }
});

test("POST /v1/site/generate caps businessName and goal length", async () => {
  const { client, handler } = enabledHandler();

  const longName = await generate(handler, { businessName: "n".repeat(201), goal: "Sell coffee" });
  assert.equal(longName.status, 400);
  assert.equal((await longName.json()).error.code, "INVALID_REQUEST");

  const longGoal = await generate(handler, { businessName: "Tam Coffee", goal: "g".repeat(2_001) });
  assert.equal(longGoal.status, 400);

  assert.equal(client.calls.length, 0);

  const atLimit = await generate(handler, { businessName: "n".repeat(200), goal: "g".repeat(2_000) });
  assert.equal(atLimit.status, 200);
  assert.equal(client.calls.length, 1);
});

test("POST /v1/site/generate ignores unknown intent and role values like before", async () => {
  const { client, handler } = enabledHandler();

  const response = await generate(handler, {
    businessName: "Tam Coffee",
    goal: "Sell coffee",
    intent: { bad: true },
    role: "root"
  });

  assert.equal(response.status, 200);
  assert.equal(client.calls[0].intent, "information");
  assert.equal(client.calls[0].role, "starter");
});

test("POST /v1/site/generate rejects an oversized body with 413 before calling the AI client", async () => {
  const { client, handler } = enabledHandler();

  const response = await generate(handler, JSON.stringify({ businessName: "n", goal: "g".repeat(maxBodyBytes) }));

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, "PAYLOAD_TOO_LARGE");
  assert.equal(client.calls.length, 0);
});

test("form routes share the body-size limit", async () => {
  const { handler } = enabledHandler();

  const response = await dispatchToHandler(handler, {
    body: new URLSearchParams({ category: "idea", message: "m".repeat(maxBodyBytes) }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    url: "/feedback"
  });

  assert.equal(response.status, 413);
});

test("an oversized body over real HTTP gets 413 and the server keeps serving", async (t) => {
  const server = createWebServer({ aiAgentClient: stubClient(), aiBuilderEnabled: true });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();

  function post(path, body) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        { agent: false, headers: { "content-type": "application/json" }, host: "127.0.0.1", method: "POST", path, port },
        (res) => {
          const parts = [];
          res.on("data", (chunk) => parts.push(chunk));
          res.on("end", () => resolve({ body: Buffer.concat(parts).toString("utf8"), status: res.statusCode }));
        }
      );
      req.setTimeout(5000, () => req.destroy(new Error("timed out")));
      req.on("error", reject);
      req.end(body);
    });
  }

  const tooLarge = await post("/v1/site/generate", JSON.stringify({ businessName: "n", goal: "g".repeat(maxBodyBytes + 1) }));
  assert.equal(tooLarge.status, 413);

  const ok = await post("/v1/site/generate", JSON.stringify({ businessName: "Tam Coffee", goal: "Sell coffee" }));
  assert.equal(ok.status, 200);
});

test("unexpected errors are logged server-side and never echoed to the client", async (t) => {
  const logged = [];
  t.mock.method(console, "error", (...args) => {
    logged.push(args);
  });

  const secret = "connect ECONNREFUSED 10.0.0.7:5432 password=hunter2";
  const handler = createWebRequestHandler({
    aiAgentClient: {
      generateSite() {
        return Promise.reject(new Error(secret));
      }
    },
    aiBuilderEnabled: true
  });

  const response = await generate(handler, { businessName: "Tam Coffee", goal: "Sell coffee" });
  const text = await response.text();

  assert.equal(response.status, 502);
  assert.ok(!text.includes("hunter2"));
  assert.ok(!text.includes("ECONNREFUSED"));
  assert.equal(JSON.parse(text).error.message, "Upstream request failed.");
  assert.ok(logged.some((args) => args.some((arg) => arg instanceof Error && arg.message === secret)));
});

test("a failing shared contract no longer leaks its error text", async (t) => {
  t.mock.method(console, "error", () => {});
  const handler = createWebRequestHandler({
    fetchImpl: () => Promise.reject(new Error("getaddrinfo ENOTFOUND flow.internal.example"))
  });

  const response = await dispatchToHandler(handler, { url: "/contract-status" });
  const text = await response.text();

  assert.equal(response.status, 502);
  assert.ok(!text.includes("ENOTFOUND"));
});

test("a malformed request target returns 400 instead of an upstream error", async (t) => {
  const logged = [];
  t.mock.method(console, "error", (...args) => {
    logged.push(args);
  });
  const handler = createWebRequestHandler();

  const response = await dispatchToHandler(handler, { url: "//" });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "BAD_REQUEST");
  assert.equal(logged.length, 0);
});

test("responses carry nosniff and referrer-policy, and HTML adds frame denial", async () => {
  const { handler } = enabledHandler();

  const json = await generate(handler, { businessName: "Tam Coffee", goal: "Sell coffee" });
  assert.equal(json.headers.get("x-content-type-options"), "nosniff");
  assert.equal(json.headers.get("referrer-policy"), "strict-origin-when-cross-origin");

  const html = await dispatchToHandler(handler, { url: "/feedback" });
  assert.equal(html.headers.get("x-content-type-options"), "nosniff");
  assert.equal(html.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(html.headers.get("x-frame-options"), "DENY");
});

test("the AI client aborts a hung upstream fetch and reports it as unavailable", async () => {
  let receivedSignal;
  const client = createAiAgentClient({
    apiBase: "https://api.example.test",
    fetchImpl: (_url, init) => {
      receivedSignal = init.signal;
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      });
    },
    mode: "free-demo",
    timeoutMs: 30
  });

  const startedAt = Date.now();
  const result = await untilTimeoutFires(
    client.generateSite({
      businessName: "Tam Coffee",
      goal: "Sell coffee",
      intent: "information",
      locale: "en",
      role: "starter"
    })
  );

  assert.deepEqual(result, { ok: false, error: "AI_UNAVAILABLE" });
  assert.ok(receivedSignal instanceof AbortSignal);
  assert.ok(Date.now() - startedAt < 2_000, "timeout should fire quickly");
});

test("the AI client also bounds a response body that never finishes", async () => {
  const client = createAiAgentClient({
    apiBase: "https://api.example.test",
    fetchImpl: (_url, init) =>
      Promise.resolve({
        json: () =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener("abort", () => reject(init.signal.reason));
          }),
        ok: true,
        status: 200
      }),
    mode: "free-demo",
    timeoutMs: 30
  });

  const result = await untilTimeoutFires(
    client.generateSite({
      businessName: "Tam Coffee",
      goal: "Sell coffee",
      intent: "information",
      locale: "en",
      role: "starter"
    })
  );

  assert.deepEqual(result, { ok: false, error: "AI_UNAVAILABLE" });
});

test("the AI client has a finite default timeout and the server maps a timeout to 503", async () => {
  assert.ok(Number.isFinite(defaultAiAgentTimeoutMs) && defaultAiAgentTimeoutMs > 0);

  const handler = createWebRequestHandler({
    aiAgentApiBase: "https://api.example.test",
    aiAgentTimeoutMs: 30,
    aiBuilderEnabled: true,
    fetchImpl: (_url, init) =>
      new Promise((_resolve, reject) => {
        if (!init?.signal) {
          return;
        }
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      })
  });

  const response = await untilTimeoutFires(
    generate(handler, { businessName: "Tam Coffee", goal: "Sell coffee" })
  );

  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "AI_UNAVAILABLE");
});
