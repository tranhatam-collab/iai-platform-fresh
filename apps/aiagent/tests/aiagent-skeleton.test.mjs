import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import http from "node:http";
import { spawn } from "node:child_process";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { contractRoutes, createAiagentServer, maxBodyBytes } from "../dist/server.js";

const appDir = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const EXPECTED_ROUTES = ["POST /v1/site/generate"];
const AUTH_MODE = "none";
const authHeaders = AUTH_MODE === "bearer" ? { authorization: "Bearer not-a-real-token" } : {};
const expectedStatus = (headers) => (AUTH_MODE === "bearer" && !/^Bearer\s+\S+$/iu.test(headers.authorization ?? "") ? 401 : 501);

let server;
let port;

before(async () => {
  server = createAiagentServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

function call(method, target, { headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request({ host: "127.0.0.1", port, method, path: target, headers, agent: false }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve({ status: response.statusCode, headers: response.headers, text, json: text ? JSON.parse(text) : undefined });
      });
    });
    request.on("error", reject);
    request.end(body);
  });
}

const concrete = (template) => template.replace(/\{[^}]+\}/gu, "example-id");

describe("contract", () => {
  test("the routes in the code are exactly the ones this skeleton documents", () => {
    assert.deepEqual(
      contractRoutes.map((route) => `${route.method} ${route.path}`),
      EXPECTED_ROUTES
    );
  });
});

describe("health", () => {
  test("GET /health says plainly that nothing is implemented", async () => {
    const response = await call("GET", "/health");
    assert.equal(response.status, 200);
    assert.deepEqual(response.json, { status: "not_implemented" });
    assert.match(response.headers["content-type"], /^application\/json/u);
    assert.equal(response.headers["cache-control"], "no-store");
  });

  test("health does not report ok, ready or live under any query string", async () => {
    for (const target of ["/health?deep=1", "/health?status=ok", "/health?format=text"]) {
      const response = await call("GET", target);
      assert.deepEqual(response.json, { status: "not_implemented" });
    }
  });

  test("health accepts GET only", async () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]) {
      const response = await call(method, "/health");
      assert.equal(response.status, 405, method);
      assert.equal(response.headers.allow, "GET", method);
    }
  });
});

describe("routes outside the contract", () => {
  test("unknown paths are 404", async () => {
    for (const target of ["/", "/v1", "/v1/unknown", "/admin", "/%68ealth", "/health/", "/health/extra", "/../health", "/.env", "/wrangler.toml"]) {
      const response = await call("GET", target);
      assert.equal(response.status, 404, target);
      assert.deepEqual(response.json, { error: "not_found" }, target);
    }
  });

  test("a request target that is not a path is 400", async () => {
    const response = await call("GET", "//example.invalid/health");
    assert.equal(response.status, 400);
  });

  test("error bodies never echo the request", async () => {
    const response = await call("GET", "/v1/unknown-marker-1234?q=marker-5678", { headers: { "x-user-id": "marker-9012" } });
    assert.ok(!response.text.includes("marker-"));
  });
});

describe("deny by default", () => {
  const credentialSets = [
    { name: "no credentials", headers: {} },
    { name: "x-user-id and x-tenant-id", headers: { "x-user-id": "u_1", "x-tenant-id": "t_1", "x-tenant": "t_1" } },
    { name: "a bearer token", headers: { authorization: "Bearer not-a-real-token" } },
    { name: "a cookie", headers: { cookie: "session=not-a-real-session" } },
    { name: "an api key header", headers: { "x-api-key": "not-a-real-key" } },
    { name: "a basic authorization header", headers: { authorization: "Basic bm90OnJlYWw=" } },
    { name: "an empty bearer credential", headers: { authorization: "Bearer " } }
  ];

  test("no route answers with a success status, with or without credentials", async () => {
    for (const route of contractRoutes) {
      for (const credentials of credentialSets) {
        const body = route.method === "GET" ? undefined : "{}";
        const headers = { ...credentials.headers, ...(body ? { "content-type": "application/json" } : {}) };
        const response = await call(route.method, concrete(route.path), { headers, body });
        const status = expectedStatus(credentials.headers);
        assert.equal(response.status, status, `${route.method} ${route.path} with ${credentials.name}`);
        assert.deepEqual(response.json, status === 401 ? { error: "unauthorized" } : { error: "not_implemented" });
      }
    }
  });

  test("identity headers change nothing and are not echoed", async () => {
    for (const route of contractRoutes) {
      const bare = await call(route.method, concrete(route.path), { headers: authHeaders, body: route.method === "GET" ? undefined : "{}" });
      const named = await call(route.method, concrete(route.path), {
        headers: { ...authHeaders, "x-user-id": "u_marker", "x-tenant-id": "t_marker" },
        body: route.method === "GET" ? undefined : "{}"
      });
      assert.equal(named.status, bare.status);
      assert.equal(named.text, bare.text);
      assert.ok(!named.text.includes("marker"));
    }
  });

  test("a method the contract does not list for a path is 405 with an Allow header", async () => {
    for (const route of contractRoutes) {
      const others = ["GET", "POST", "PUT", "PATCH", "DELETE"].filter((method) => !contractRoutes.some((entry) => entry.path === route.path && entry.method === method));
      for (const method of others) {
        const response = await call(method, concrete(route.path), { body: method === "GET" ? undefined : "{}" });
        assert.equal(response.status, 405, `${method} ${route.path}`);
        assert.ok(response.headers.allow, `${method} ${route.path}`);
      }
    }
  });
});

describe("challenge when no bearer credential is sent", () => {
  test("a missing, empty or non-bearer Authorization header is 401 with a Bearer challenge; any bearer value is 501", async () => {
    if (AUTH_MODE !== "bearer") {
      return;
    }
    const route = contractRoutes[0];
    const none = await call(route.method, concrete(route.path), { body: route.method === "GET" ? undefined : "{}" });
    assert.equal(none.status, 401);
    assert.equal(none.headers["www-authenticate"], "Bearer");
    assert.deepEqual(none.json, { error: "unauthorized" });
    for (const value of ["", "Bearer", "Bearer ", "Basic abc", "Token abc"]) {
      const response = await call(route.method, concrete(route.path), { headers: { authorization: value }, body: route.method === "GET" ? undefined : "{}" });
      assert.equal(response.status, 401, JSON.stringify(value));
    }
    for (const value of ["Bearer a", "bearer abc.def", "Bearer not-a-real-token"]) {
      const response = await call(route.method, concrete(route.path), { headers: { authorization: value }, body: route.method === "GET" ? undefined : "{}" });
      assert.equal(response.status, 501, value);
      assert.deepEqual(response.json, { error: "not_implemented" });
    }
  });

  test("the credential is not checked: two different bearer values give the same answer", async () => {
    if (AUTH_MODE !== "bearer") {
      return;
    }
    for (const route of contractRoutes) {
      const a = await call(route.method, concrete(route.path), { headers: { authorization: "Bearer aaaa" }, body: route.method === "GET" ? undefined : "{}" });
      const b = await call(route.method, concrete(route.path), { headers: { authorization: "Bearer bbbbbbbbbbbb" }, body: route.method === "GET" ? undefined : "{}" });
      assert.equal(a.status, 501);
      assert.equal(a.text, b.text);
    }
  });
});

describe("request size", () => {
  test("a body above the limit is refused with 413 before any route answers", async () => {
    const probe = contractRoutes.find((route) => route.method !== "GET") ?? contractRoutes[0];
    if (!probe) {
      return;
    }
    const big = "x".repeat(maxBodyBytes + 1);
    const response = await call(probe.method === "GET" ? "POST" : probe.method, concrete(probe.path), { headers: { ...authHeaders, "content-type": "application/json" }, body: big });
    if (probe.method === "GET") {
      assert.equal(response.status, 405);
      return;
    }
    assert.equal(response.status, 413);
    assert.deepEqual(response.json, { error: "payload_too_large" });
  });

  test("a chunked body above the limit is refused without a content-length", async () => {
    const probe = contractRoutes.find((route) => route.method !== "GET");
    if (!probe) {
      return;
    }
    const response = await new Promise((resolve, reject) => {
      const request = http.request({ host: "127.0.0.1", port, method: probe.method, path: concrete(probe.path), headers: { ...authHeaders, "transfer-encoding": "chunked" }, agent: false }, (reply) => {
        let text = "";
        reply.on("data", (chunk) => (text += chunk));
        reply.on("end", () => resolve({ status: reply.statusCode, text }));
      });
      request.on("error", reject);
      request.write("x".repeat(maxBodyBytes));
      request.end("x".repeat(16));
    });
    assert.equal(response.status, 413);
  });

  test("a body that declares a huge length is refused at once, before any body arrives", async () => {
    const probe = contractRoutes.find((route) => route.method !== "GET");
    if (!probe) {
      return;
    }
    const first = await new Promise((resolve, reject) => {
      const socket = net.connect(port, "127.0.0.1", () => {
        socket.write(`${probe.method} ${concrete(probe.path)} HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n${AUTH_MODE === "bearer" ? "Authorization: Bearer not-a-real-token\r\n" : ""}Content-Length: 99999999\r\n\r\n`);
      });
      let text = "";
      socket.on("data", (chunk) => {
        text += chunk;
        if (text.includes("\r\n")) {
          socket.destroy();
          resolve(text.split("\r\n")[0]);
        }
      });
      socket.on("error", reject);
      setTimeout(() => reject(new Error("no answer within 3 s")), 3000).unref();
    });
    assert.match(first, /^HTTP\/1\.1 413/u);
  });

  test("a body exactly at the limit is read and answered with 501", async () => {
    const probe = contractRoutes.find((route) => route.method !== "GET");
    if (!probe) {
      return;
    }
    const response = await call(probe.method, concrete(probe.path), { headers: { ...authHeaders, "content-type": "application/json" }, body: "x".repeat(maxBodyBytes) });
    assert.equal(response.status, 501);
  });
});

describe("cross-origin access", () => {
  test("no response carries a CORS header, even for a request with an Origin", async () => {
    const targets = ["/health", "/nothing-here", ...contractRoutes.map((route) => concrete(route.path))];
    for (const target of targets) {
      const response = await call("GET", target, { headers: { origin: "https://example.invalid" } });
      for (const name of Object.keys(response.headers)) {
        assert.ok(!name.startsWith("access-control-"), `${target} sent ${name}`);
      }
    }
    const preflight = await call("OPTIONS", "/health", { headers: { origin: "https://example.invalid", "access-control-request-method": "GET" } });
    assert.equal(preflight.status, 405);
  });
});

function listFiles(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    if (name === "dist" || name === "node_modules") {
      continue;
    }
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      found.push(...listFiles(full));
    } else {
      found.push(full);
    }
  }
  return found;
}

describe("nothing to deploy and nothing secret", () => {
  const files = listFiles(appDir);
  const configFiles = files.filter((file) => /(^|\/)(package\.json|tsconfig\.json)$/u.test(file) || /wrangler|\.toml$|\.jsonc$/u.test(path.basename(file)));

  test("there is no Cloudflare or deployment configuration file", () => {
    for (const file of files) {
      assert.ok(!/wrangler|\.toml$|\.jsonc$|\.dev\.vars|^\.env/u.test(path.basename(file)), `${file} looks like deployment or secret configuration`);
    }
    assert.ok(!existsSync(path.join(appDir, "wrangler.toml")));
  });

  test("configuration and source name no route, domain, account, namespace or secret", () => {
    const forbidden = new RegExp(
      [
        "account_id", "database_id", "kv_namespaces", "workers_dev", "custom_domain", "zone_id",
        "\\broutes?\\s*[=:]\\s*[\\[\"{]", "bucket_name", "r2_buckets", "d1_databases",
        "secret", "password", "api[_-]?key", "bearer\\s+[a-z0-9]{8,}", "iai\\.one"
      ].join("|"),
      "iu"
    );
    for (const file of [...configFiles, ...files.filter((entry) => entry.includes(`${path.sep}src${path.sep}`))]) {
      const text = readFileSync(file, "utf8");
      assert.ok(!forbidden.test(text), `${path.relative(appDir, file)} matches ${forbidden.exec(text)?.[0]}`);
    }
  });

  test("the source has no outgoing network call and no dependency", () => {
    const manifest = JSON.parse(readFileSync(path.join(appDir, "package.json"), "utf8"));
    assert.equal(manifest.dependencies, undefined);
    for (const file of files.filter((entry) => entry.includes(`${path.sep}src${path.sep}`))) {
      const text = readFileSync(file, "utf8");
      assert.ok(!/\bfetch\s*\(|node:https?["']\s*;?\s*$|node:net|node:dns|XMLHttpRequest|WebSocket/mu.test(text.replace(/import \{ createServer[^;]*;/u, "")), `${path.relative(appDir, file)} reaches the network`);
    }
  });
});

describe("labelling", () => {
  test("the README carries the planned-direction label in both languages", () => {
    const readme = readFileSync(path.join(appDir, "README.md"), "utf8");
    assert.match(readme, /Planned direction \(not released\)/u);
    assert.match(readme, /Định hướng \(chưa phát hành\)/u);
    assert.ok(readme.indexOf("Planned direction") < 400, "the label must open the README");
  });
});

describe("process settings", () => {
  test("every response carries x-content-type-options: nosniff", async () => {
    const answers = [
      await call("GET", "/health"),
      await call("GET", "/nothing-here"),
      await call("POST", "/health", { body: "{}" }),
      await call("GET", "//example.invalid/health")
    ];
    for (const response of answers) {
      assert.equal(response.headers["x-content-type-options"], "nosniff", `status ${response.status}`);
    }
  });

  test("the server limits how long a request may take", () => {
    assert.ok(server.requestTimeout > 0 && server.requestTimeout <= 30_000, `requestTimeout is ${server.requestTimeout}`);
    assert.ok(server.headersTimeout > 0 && server.headersTimeout <= 30_000, `headersTimeout is ${server.headersTimeout}`);
  });

  test("started without settings, the process listens on 127.0.0.1 only", async () => {
    const free = await new Promise((resolve) => {
      const probe = net.createServer();
      probe.listen(0, "127.0.0.1", () => {
        const { port: chosen } = probe.address();
        probe.close(() => resolve(chosen));
      });
    });
    const child = spawn(process.execPath, [path.join(appDir, "dist", "index.js")], {
      env: { PATH: process.env.PATH, AIAGENT_PORT: String(free) },
      stdio: ["ignore", "pipe", "pipe"]
    });
    try {
      const started = await new Promise((resolve, reject) => {
        let out = "";
        child.stdout.on("data", (chunk) => {
          out += chunk;
          if (out.includes("\n")) {
            resolve(out);
          }
        });
        child.on("exit", () => reject(new Error("the process exited before it started")));
        setTimeout(() => reject(new Error("no start message within 5 s")), 5000).unref();
      });
      assert.ok(started.includes(`listening on http://127.0.0.1:${free}`), started);

      const health = await new Promise((resolve, reject) => {
        http.get({ host: "127.0.0.1", port: free, path: "/health", agent: false }, (reply) => {
          reply.resume();
          reply.on("end", () => resolve(reply.statusCode));
        }).on("error", reject);
      });
      assert.equal(health, 200);

      const external = Object.values(os.networkInterfaces()).flat().find((entry) => entry && entry.family === "IPv4" && !entry.internal);
      if (external) {
        await assert.rejects(
          new Promise((resolve, reject) => {
            const socket = net.connect(free, external.address, () => {
              socket.destroy();
              resolve();
            });
            socket.on("error", reject);
          }),
          "the process answered on a non-loopback address"
        );
      }
    } finally {
      child.kill();
    }
  });
});
