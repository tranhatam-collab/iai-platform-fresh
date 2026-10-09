/**
 * End-to-end contract for every *.iai.one surface in this repo.
 *
 * Each surface is started as a real child process from its built output and
 * exercised over real sockets. The same contract runs against all of them so a
 * new sub-project is covered by adding one row to SURFACES in support/harness.mjs.
 *
 * Needs: `pnpm build` (plus @iai/noos-web). Runs with `pnpm test:e2e`.
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import {
  KNOWN_IAI_HOSTS,
  SURFACES,
  builtEntryAvailable,
  docsFixturesAvailable,
  extractHrefs,
  healthStatus,
  rawRequest,
  request,
  skipUnlessBuilt,
  startMailApi,
  startService
} from "./support/harness.mjs";

const STACK_TRACE = /(\/home\/|\/Users\/|node_modules|at [\w.<>]+ \(.*:\d+:\d+\)|ENOENT)/;

let mailApi = null;
const mailApiBuilt = builtEntryAvailable("apps/mail-api/dist/bootstrap.js");
const needsMailApi = (surface) => Boolean(surface.requiresMailApi || surface.mailApiEnv);

before(async () => {
  // Only start mail-api when it is built: the surfaces that need it are skipped (or fail on their
  // own, with E2E_REQUIRE_BUILT=1) instead of one failing hook cancelling every surface.
  if (mailApiBuilt && SURFACES.some(needsMailApi)) {
    mailApi = await startMailApi();
  }
});

after(async () => {
  await mailApi?.stop();
});

for (const surface of SURFACES) {
  const skipReason = !builtEntryAvailable(surface.entry)
    ? skipUnlessBuilt(false, `${surface.entry} not built`)
    : needsMailApi(surface) && !mailApiBuilt
      ? skipUnlessBuilt(false, "apps/mail-api not built")
      : surface.requiresDocsFixtures && !docsFixturesAvailable()
        ? "needs gitignored docs/noos fixtures (set up the private docs pack to run)"
        : false;

  describe(`${surface.name} (${surface.domain})`, { skip: skipReason }, () => {
    let service;
    let shutdown = null;
    const htmlPath = surface.htmlPath ?? "/";

    before(async () => {
      if (needsMailApi(surface) && !mailApi) {
        throw new Error("apps/mail-api is not built, and this surface needs it");
      }
      const env = {};
      if (surface.mailApiEnv && mailApi) {
        env[surface.mailApiEnv] = mailApi.baseUrl;
      }
      service = await startService({
        name: surface.name,
        entry: surface.entry,
        portEnv: surface.portEnv,
        hostEnv: surface.hostEnv,
        env
      });
    });

    after(async () => {
      shutdown = await service?.stop();
    });

    // Follow at most one redirect hop so surfaces that bounce `/` (login, locale) are still checked.
    async function getPage(pathname = htmlPath) {
      let response = await request(service.baseUrl, pathname);
      if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.get("location")?.startsWith("/")) {
        response = await request(service.baseUrl, response.headers.get("location"));
      }
      return response;
    }

    test("GET /health reports ok as JSON and is never cached", async () => {
      const response = await request(service.baseUrl, "/health");
      assert.equal(response.status, 200, response.text);
      assert.match(response.headers.get("content-type") ?? "", /application\/json/);
      assert.equal(healthStatus(response.json), "ok");
      assert.match(response.headers.get("cache-control") ?? "", /no-store|no-cache/);
    });

    test("landing page is complete, indexable HTML on its own canonical domain", async () => {
      const response = await getPage();
      assert.equal(response.status, 200, response.text.slice(0, 300));
      assert.match(response.headers.get("content-type") ?? "", /text\/html/);
      const html = response.text;
      assert.match(html, /<!doctype html>/i);
      assert.match(html, /<html\s+lang="[a-z-]+"/i);
      assert.match(html, /<title>[^<]{3,}<\/title>/i);
      assert.match(html, /<meta\s+name="viewport"/i);
      assert.match(html, /<meta\s+name="description"\s+content="[^"]{10,}"/i);
      assert.match(html, /<h1[\s>]/i);
      if (surface.name !== "noos-web") {
        // canonical must point at this surface's own domain, never a sibling's
        const canonical = /<link rel="canonical" href="([^"]+)"/i.exec(html)?.[1];
        assert.ok(canonical, "missing canonical link");
        assert.equal(new URL(canonical).host, surface.domain);
      }
    });

    test("every *.iai.one link on the page targets a declared sub-project host", async () => {
      const response = await getPage();
      const unknown = extractHrefs(response.text)
        .map((href) => new URL(href).host)
        .filter((host) => (host === "iai.one" || host.endsWith(".iai.one")) && !KNOWN_IAI_HOSTS.has(host));
      assert.deepEqual([...new Set(unknown)], [], "links to undeclared iai.one hosts");
    });

    test("?lang=en renders an English document", async () => {
      if (surface.name === "noos-web") {
        return; // noos uses /en and /vi path prefixes, covered by its own suite
      }
      const response = await getPage(`${htmlPath}${htmlPath.includes("?") ? "&" : "?"}lang=en`);
      assert.equal(response.status, 200);
      assert.match(response.text, /<html\s+lang="en"/i);
    });

    test("unknown routes return a clean 404 without leaking internals", async () => {
      const response = await request(service.baseUrl, "/definitely-not-a-route-e2e");
      // noos redirects unknown paths into a locale first
      if (response.status === 308) {
        const followed = await request(service.baseUrl, response.headers.get("location"));
        assert.ok([404, 200].includes(followed.status));
        return;
      }
      assert.equal(response.status, 404, response.text.slice(0, 200));
      assert.doesNotMatch(response.text, STACK_TRACE);
    });

    test("unsupported methods never cause a 5xx", async () => {
      for (const method of ["POST", "PUT", "DELETE"]) {
        const response = await request(service.baseUrl, "/health", {
          method,
          headers: { "content-type": "application/json" },
          body: "{}"
        });
        assert.ok(response.status < 500, `${method} /health -> ${response.status}`);
      }
    });

    test("HEAD / is served", async () => {
      const response = await request(service.baseUrl, htmlPath, { method: "HEAD" });
      assert.ok(response.status < 500, `HEAD -> ${response.status}`);
    });

    test("malformed request targets never crash or 5xx the server, and it keeps serving", async () => {
      const targets = [
        "//",
        "///",
        "/%E0%A4%A", // truncated percent-escape
        "/%zz",
        `/${"a".repeat(6000)}`,
        "/\u0000".replace("\u0000", "%00"),
        "/health?x=%"
      ];
      for (const target of targets) {
        const response = await rawRequest(service.port, target);
        assert.ok(
          response.status >= 200 && response.status < 500,
          `${target.slice(0, 30)} -> ${response.status}`
        );
        assert.doesNotMatch(response.text, STACK_TRACE, `${target.slice(0, 30)} leaked internals`);
        assert.ok(service.isRunning(), `server died after ${target.slice(0, 30)}`);
      }
      const health = await request(service.baseUrl, "/health");
      assert.equal(health.status, 200);
    });

    test("sets baseline hardening headers on HTML and JSON", async () => {
      const page = await getPage();
      const health = await request(service.baseUrl, "/health");
      for (const response of [page, health]) {
        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      }
    });

    if (surface.sitemap) {
      test("sitemap.xml lists only this surface's own URLs", async () => {
        const response = await request(service.baseUrl, "/sitemap.xml");
        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-type") ?? "", /xml/);
        assert.match(response.text, /<urlset[\s>]/);
        const locs = [...response.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).host);
        assert.ok(locs.length > 0);
        assert.deepEqual([...new Set(locs)], [surface.domain]);
      });
    }

    test("shuts down cleanly on SIGTERM", async () => {
      const result = await service.stop();
      shutdown = result;
      assert.ok(result.code === 0 || result.signal === null || result.signal === "SIGTERM", JSON.stringify(result));
      assert.equal(service.isRunning(), false);
    });
  });
}
