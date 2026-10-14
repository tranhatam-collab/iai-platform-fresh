import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import http from "node:http";
import { spawn } from "node:child_process";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { createCdnServer } from "../dist/server.js";

const appDir = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

let server;
let port;

before(async () => {
  server = createCdnServer();
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

describe("nothing but the health check answers", () => {
  test("no request outside GET /health gets a success status, with or without credentials or identity headers", async () => {
    const credentialSets = [
      {},
      { "x-user-id": "u_1", "x-tenant-id": "t_1", "x-tenant": "t_1" },
      { authorization: "Bearer not-a-real-token" },
      { cookie: "session=not-a-real-session" },
      { "x-api-key": "not-a-real-key" }
    ];
    for (const headers of credentialSets) {
      for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
        for (const target of ["/", "/v1", "/v1/anything", "/assets/example", "/admin"]) {
          const response = await call(method, target, { headers, body: method === "GET" ? undefined : "{}" });
          assert.equal(response.status, 404, `${method} ${target}`);
          assert.deepEqual(response.json, { error: "not_found" });
        }
      }
    }
  });

  test("identity headers do not change the health answer and are not echoed", async () => {
    const bare = await call("GET", "/health");
    const named = await call("GET", "/health", { headers: { "x-user-id": "u_marker", "x-tenant-id": "t_marker" } });
    assert.equal(named.text, bare.text);
    assert.ok(!named.text.includes("marker"));
  });
});


describe("cross-origin access", () => {
  test("no response carries a CORS header, even for a request with an Origin", async () => {
    const targets = ["/health", "/nothing-here"];
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
      env: { PATH: process.env.PATH, CDN_PORT: String(free) },
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
