import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

// Boots every Node web server on an ephemeral 127.0.0.1 port and sends request targets
// that used to throw out of an async handler (`GET //`) or surface as 500s (bad percent-escapes).
// Needs the built dist of each app (`pnpm build` plus `pnpm --filter @iai/developer build`
// and `pnpm --filter @iai/noos-web build`).

const servers = [
  {
    name: "root",
    module: "../../apps/root/dist/server.js",
    factory: "createRootServer",
    okPath: "/health",
    htmlPath: "/login",
    extraCases: [
      {
        label: "malformed OAuth state cookie is ignored",
        path: "/auth/google/callback?code=abc&state=abc",
        headers: { cookie: "iai_oauth_state_google=%E0%A4%A" },
        expectedStatus: 400
      }
    ]
  },
  {
    name: "dash",
    module: "../../apps/dash/dist/server.js",
    factory: "createDashServer",
    okPath: "/health",
    htmlPath: "/login",
    extraCases: [
      { label: "malformed flow id", path: "/flows/%E0%A4%A", expectedStatus: 400 },
      { label: "malformed flow id on a nested route", path: "/flows/%E0%A4%A/builder", expectedStatus: 400 },
      { label: "malformed flow id on an action", method: "POST", path: "/flows/%E0%A4%A/builder/save", expectedStatus: 400 },
      { label: "malformed execution id", path: "/runtime/executions/%E0%A4%A", expectedStatus: 400 },
      {
        label: "malformed session cookie is ignored",
        path: "/dashboard",
        headers: { cookie: "iai_session=%E0%A4%A" },
        expectedStatus: 303
      }
    ]
  },
  { name: "home", module: "../../apps/home/dist/server.js", factory: "createHomeServer", okPath: "/health", htmlPath: "/" },
  { name: "app", module: "../../apps/app/dist/server.js", factory: "createAppServer", okPath: "/health", htmlPath: "/" },
  { name: "flow", module: "../../apps/flow/dist/server.js", factory: "createFlowServer", okPath: "/health", htmlPath: "/" },
  { name: "docs", module: "../../apps/docs/dist/server.js", factory: "createDocsServer", okPath: "/health", htmlPath: "/" },
  {
    name: "nft",
    module: "../../apps/nft/dist/server.js",
    factory: "createNftServer",
    okPath: "/health",
    htmlPath: "/",
    extraCases: [
      { label: "malformed asset id on download", path: "/v1/nft/assets/%E0%A4%A/download", expectedStatus: 400 },
      {
        label: "malformed asset id on access-check",
        method: "POST",
        path: "/v1/nft/assets/%E0%A4%A/access-check",
        body: "{}",
        expectedStatus: 400
      },
      {
        label: "malformed asset id on proxy-token",
        method: "POST",
        path: "/v1/nft/assets/%E0%A4%A/proxy-token",
        body: "{}",
        expectedStatus: 400
      }
    ]
  },
  {
    name: "developer",
    module: "../../apps/developer/dist/server.js",
    factory: "createDeveloperServer",
    okPath: "/health",
    htmlPath: "/"
  },
  {
    name: "noos-web",
    module: "../../apps/noos-web/dist/http-server.js",
    factory: "createNoosWebServer",
    options: { port: 0 },
    okPath: "/health",
    htmlPath: "/en/not-a-real-route"
  },
  {
    name: "web",
    module: "../../apps/web/dist/server.js",
    factory: "createWebServer",
    okPath: "/events",
    htmlPath: "/feedback"
  }
];

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server.address().port;
}

function request(port, { body, headers = {}, method = "GET", path = "/" } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ agent: false, headers, host: "127.0.0.1", method, path, port }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () =>
        resolve({
          body: Buffer.concat(chunks).toString("utf8"),
          headers: res.headers,
          status: res.statusCode
        })
      );
    });
    req.setTimeout(5000, () => req.destroy(new Error(`timed out waiting for ${method} ${path}`)));
    req.on("error", reject);
    req.end(body);
  });
}

async function startServer(entry) {
  const module = await import(entry.module);
  const server = module[entry.factory](entry.options);
  const port = await listen(server);
  return { port, stop: () => new Promise((resolve) => server.close(resolve)) };
}

for (const entry of servers) {
  test(`${entry.name} answers 400 for a malformed request target and keeps serving`, async (t) => {
    const { port, stop } = await startServer(entry);
    t.after(stop);

    for (const path of ["//", "///"]) {
      const response = await request(port, { path });
      assert.equal(response.status, 400, `GET ${path}`);
      assert.match(response.headers["content-type"] ?? "", /^(application\/json|text\/plain)/);
      assert.match(response.body, /Bad request|BAD_REQUEST/);
      assert.equal(response.headers["x-content-type-options"], "nosniff");

      const next = await request(port, { path: entry.okPath });
      assert.equal(next.status, 200, `GET ${entry.okPath} after GET ${path}`);
    }
  });

  test(`${entry.name} survives a malformed percent-escape without a 5xx`, async (t) => {
    const { port, stop } = await startServer(entry);
    t.after(stop);

    const generic = await request(port, { path: "/%E0%A4%A" });
    assert.ok(generic.status < 500, `GET /%E0%A4%A returned ${generic.status}`);

    const query = await request(port, { path: `${entry.okPath}?lang=%E0%A4%A&x=%` });
    assert.equal(query.status, 200);

    for (const extra of entry.extraCases ?? []) {
      const response = await request(port, {
        body: extra.body,
        headers: extra.headers,
        method: extra.method ?? "GET",
        path: extra.path
      });
      assert.equal(response.status, extra.expectedStatus, extra.label);
    }

    const next = await request(port, { path: entry.okPath });
    assert.equal(next.status, 200);
  });

  test(`${entry.name} sets baseline hardening headers`, async (t) => {
    const { port, stop } = await startServer(entry);
    t.after(stop);

    const json = await request(port, { path: entry.okPath });
    assert.equal(json.status, 200);
    assert.equal(json.headers["x-content-type-options"], "nosniff");
    assert.equal(json.headers["referrer-policy"], "strict-origin-when-cross-origin");

    const html = await request(port, { path: entry.htmlPath });
    assert.match(html.headers["content-type"] ?? "", /text\/html/);
    assert.equal(html.headers["x-content-type-options"], "nosniff");
    assert.equal(html.headers["referrer-policy"], "strict-origin-when-cross-origin");
    assert.equal(html.headers["x-frame-options"], "DENY");
  });
}
