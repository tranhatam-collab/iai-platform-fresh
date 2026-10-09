import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import http from "node:http";
import { readFileSync } from "node:fs";
import test from "node:test";

import { dispatchToHandler } from "../support/http-handler.mjs";

// Every HTML surface answers with a Content-Security-Policy. The base policy allows no script,
// frames, base URI or connection; images only from the surface itself and, where a page really
// shows one, a single named host. Needs `pnpm build`.

const surfaces = [
  ["app", "../../apps/app/dist/server.js", "createAppRequestHandler"],
  ["dash", "../../apps/dash/dist/server.js", "createDashRequestHandler"],
  ["developer", "../../apps/developer/dist/server.js", "createDeveloperRequestHandler"],
  ["docs", "../../apps/docs/dist/server.js", "createDocsRequestHandler"],
  ["flow", "../../apps/flow/dist/server.js", "createFlowRequestHandler"],
  ["home", "../../apps/home/dist/server.js", "createHomeRequestHandler"],
  ["nft", "../../apps/nft/dist/server.js", "createNftRequestHandler"],
  ["pay", "../../apps/pay/dist/server.js", "createPayRequestHandler"],
  ["root", "../../apps/root/dist/server.js", "createRootRequestHandler"],
  ["web", "../../apps/web/dist/server.js", "createWebRequestHandler"]
];

const extraImageHosts = { noos: ["https://picsum.photos"], pay: ["https://img.vietqr.io"] };

function parsePolicy(value) {
  assert.ok(value, "content-security-policy header is missing");
  return new Map(
    value
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...sources] = part.split(/\s+/u);
        return [name, sources];
      })
  );
}

function assertBasePolicy(name, value, scriptSources = ["'none'"]) {
  // `scriptSources` null: the caller checks script-src itself (root allows one hashed script).
  const policy = parsePolicy(value);
  assert.deepEqual(policy.get("default-src"), ["'none'"], name);
  assert.deepEqual(policy.get("base-uri"), ["'none'"], name);
  assert.deepEqual(policy.get("frame-ancestors"), ["'none'"], name);
  assert.deepEqual(policy.get("form-action"), ["'self'"], name);
  assert.deepEqual(policy.get("style-src"), ["'unsafe-inline'"], name);
  if (scriptSources !== null) {
    assert.deepEqual(policy.get("script-src"), scriptSources, name);
  }
  assert.deepEqual(policy.get("img-src"), ["'self'", "data:", ...(extraImageHosts[name] ?? [])], name);
  for (const forbidden of ["'unsafe-eval'", "*", "http:", "https:"]) {
    for (const [directive, sources] of policy) {
      assert.ok(!sources.includes(forbidden), `${name}: ${directive} allows ${forbidden}`);
    }
  }
}

for (const [name, modulePath, factory] of surfaces) {
  test(`${name} HTML responses carry the content security policy`, async () => {
    const handler = (await import(modulePath))[factory]();
    // web answers an unknown path with JSON, so it is probed on a page that renders without a network call.
    const response = await dispatchToHandler(handler, { url: name === "web" ? "/feedback" : "/no-such-page" });
    assert.match(response.headers.get("content-type") ?? "", /text\/html/u);
    assertBasePolicy(name, response.headers.get("content-security-policy"), name === "root" ? null : ["'none'"]);
  });
}

test("root allows exactly its one inline script, by hash, and pages hold no other script or handler", async () => {
  const { createRootRequestHandler } = await import("../../apps/root/dist/server.js");
  const handler = createRootRequestHandler();
  for (const url of ["/", "/login", "/privacy"]) {
    const response = await dispatchToHandler(handler, { url });
    const html = await response.text();
    const policy = parsePolicy(response.headers.get("content-security-policy"));
    const scriptSources = policy.get("script-src");
    assert.equal(scriptSources.length, 1, url);
    assert.match(scriptSources[0], /^'sha256-[A-Za-z0-9+/]+={0,2}'$/u, url);

    const executable = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)].filter(
      ([, attributes]) => !/type="application\/ld\+json"/u.test(attributes)
    );
    assert.equal(executable.length, 1, `${url}: expected one executable inline script`);
    const digest = createHash("sha256").update(executable[0][2], "utf8").digest("base64");
    assert.equal(scriptSources[0], `'sha256-${digest}'`, `${url}: the policy hash must match the inline script`);
    assert.doesNotMatch(html, /\son[a-z]+\s*=\s*["']/iu, `${url}: no inline event handler attributes`);
  }
});

test("no surface template renders an inline event handler or a script that is not data", () => {
  for (const app of ["app", "dash", "developer", "docs", "flow", "home", "nft", "noos-web", "pay", "web"]) {
    const source = readFileSync(new URL(`../../apps/${app}/src/render.ts`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\son(click|load|error|submit|change|input)\s*=\s*["'`]/u, `${app}: inline handler`);
    for (const match of source.matchAll(/<script\b([^>]*)>/gu)) {
      assert.match(match[1], /type="application\/ld\+json"/u, `${app}: executable <script>`);
    }
  }
});

test("noos-web HTML responses carry the content security policy", async () => {
  const { createNoosWebServer } = await import("../../apps/noos-web/dist/http-server.js");
  const server = createNoosWebServer({});
  const port = await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
  try {
    const headers = await new Promise((resolve, reject) => {
      http
        .get({ host: "127.0.0.1", port, path: "/en/no-such-page" }, (response) => {
          response.resume();
          response.on("end", () => resolve({ status: response.statusCode, headers: response.headers }));
        })
        .on("error", reject);
    });
    assert.match(headers.headers["content-type"] ?? "", /text\/html/u, `status ${headers.status}`);
    assertBasePolicy("noos", headers.headers["content-security-policy"]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("the developer static build writes the policy into _headers", () => {
  const source = readFileSync(new URL("../../apps/developer/scripts/build-static.mjs", import.meta.url), "utf8");
  assert.match(source, /Content-Security-Policy: \$\{contentSecurityPolicy\}/u);
  const policy = /const contentSecurityPolicy =\s*"([^"]+)"/u.exec(source)?.[1];
  assertBasePolicy("developer", policy);
});
