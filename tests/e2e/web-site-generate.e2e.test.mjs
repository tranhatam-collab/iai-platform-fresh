/**
 * web's AI site generation (POST /v1/site/generate and the /build form) against
 * a fake AI upstream that runs inside this test process. No real AI provider is
 * ever contacted.
 *
 *   WEB_AIAGENT_API_BASE=<fake>   WEB_AIAGENT_MODE=free-demo|byok
 *   WEB_AI_BUILDER_ENABLED=true   (gates both the /build form and POST /v1/site/generate)
 *   WEB_PUBLICATION_HOLD          (default on -> X-Robots-Tag: noindex, nofollow)
 *
 * None of these routes read the shared flow API, so no mail-api is needed.
 * Needs `pnpm build`. Run: node --test tests/e2e/web-site-generate.e2e.test.mjs
 */
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";

import { builtEntryAvailable, request, startService } from "./support/harness.mjs";
import { sendJson, startFakeServer } from "./support/fake-http.mjs";

const built = builtEntryAvailable("apps/web/dist/index.js");
const FAKE_KEY = "e2e-fake-ai-key";
// Text a real provider might put in an error body; it must never reach web's callers.
const UPSTREAM_LEAK = "UPSTREAM-DETAIL provider-stack at /srv/ai/handler.py:42 key=sk-e2e-not-real";
const STACK_TRACE = /(\/home\/|\/Users\/|node_modules|at [\w.<>]+ \(.*:\d+:\d+\)|ENOENT)/;

const GOOD_SITE = {
  site_id: "site_fake_001",
  sections: [
    { heading: "Welcome", body: "A friendly coffee house." },
    { heading: "Menu", body: "Espresso and pastries." }
  ],
  preview_html: "<h1>Preview</h1>"
};

function startWeb(extraEnv, name = "web") {
  return startService({
    name,
    entry: "apps/web/dist/index.js",
    portEnv: "WEB_PORT",
    hostEnv: "WEB_BIND_ADDRESS",
    // /events does not need the shared flow API, unlike /health and /.
    readyPath: "/events",
    env: { WEB_AI_BUILDER_ENABLED: "true", ...extraEnv }
  });
}


describe("web AI site generation against a fake AI upstream", { skip: built ? false : "apps/web not built" }, () => {
  let upstream;
  let behavior;
  let web;

  before(async () => {
    upstream = await startFakeServer((req, res) => behavior(req, res));
    web = await startWeb({
      WEB_AIAGENT_API_BASE: upstream.baseUrl,
      WEB_AIAGENT_MODE: "free-demo",
      WEB_AI_BUILDER_ENABLED: "true",
      WEB_SHARED_FLOW_API_BASE: "http://127.0.0.1:9"
    });
  });
  after(async () => {
    await web?.stop();
    await upstream?.close();
  });
  beforeEach(() => {
    upstream.requests.length = 0;
    behavior = (_req, res) => sendJson(res, 200, GOOD_SITE);
  });

  const generate = (body, headers = {}) =>
    request(web.baseUrl, "/v1/site/generate", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body)
    });
  const validBody = { businessName: "Tam's Coffee House", goal: "Sell beans online", intent: "commerce", role: "builder" };

  describe("POST /v1/site/generate", () => {
    test("success path returns the generated site and calls the upstream with the documented contract", async () => {
      const response = await generate(validBody);
      assert.equal(response.status, 200, response.text);
      assert.match(response.headers.get("content-type"), /application\/json/);
      const data = response.json.data;
      assert.equal(response.json.ok, true);
      assert.equal(data.site_id, "site_fake_001");
      assert.equal(data.status, "completed");
      assert.equal(data.preview_url, "/v1/site/site_fake_001/preview");
      assert.equal(data.business_name, validBody.businessName);
      assert.equal(data.intent, "commerce");
      assert.equal(data.role, "builder");
      assert.deepEqual(data.sections, GOOD_SITE.sections);
      assert.equal(data.preview_html, GOOD_SITE.preview_html);

      assert.equal(upstream.requests.length, 1);
      const sent = upstream.requests[0];
      assert.equal(sent.method, "POST");
      assert.equal(sent.url, "/v1/site/generate");
      assert.equal(sent.headers["x-aiagent-mode"], "free-demo");
      assert.equal(sent.headers.authorization, undefined, "free-demo mode must not send credentials");
      assert.deepEqual(sent.json, {
        business_name: validBody.businessName,
        goal: validBody.goal,
        intent: "commerce",
        role: "builder",
        locale: "en"
      });
    });

    test("falls back to the documented defaults for unknown intent and role", async () => {
      const response = await generate({ businessName: "A", goal: "B", intent: "nonsense", role: "root" });
      assert.equal(response.status, 200);
      assert.equal(response.json.data.intent, "information");
      assert.equal(response.json.data.role, "starter");
      assert.equal(upstream.requests[0].json.intent, "information");
      assert.equal(upstream.requests[0].json.role, "starter");
    });

    test("generates a site id when the upstream does not return one", async () => {
      behavior = (_req, res) => sendJson(res, 200, { sections: GOOD_SITE.sections });
      const response = await generate(validBody);
      assert.equal(response.status, 200);
      assert.match(response.json.data.site_id, /^site_[0-9a-f]{32}$/);
      assert.equal(response.json.data.preview_html, "");
    });

    test("trims whitespace and rejects blank required fields without calling the upstream", async () => {
      for (const body of [{}, { businessName: "x" }, { goal: "x" }, { businessName: "   ", goal: "x" }, { businessName: "x", goal: "\n\t" }]) {
        const response = await generate(body);
        assert.equal(response.status, 400, JSON.stringify(body));
        assert.equal(response.json.error.code, "INVALID_REQUEST");
      }
      assert.equal(upstream.requests.length, 0);
    });

    test("non-JSON and structurally wrong bodies are 400, not a crash", async () => {
      for (const raw of ["", "not json", "{", "[]", '"a string"', "42", "true"]) {
        const response = await generate(raw);
        assert.equal(response.status, 400, `body ${JSON.stringify(raw)} -> ${response.status} ${response.text}`);
        assert.doesNotMatch(response.text, STACK_TRACE);
      }
      assert.equal(upstream.requests.length, 0);
      assert.ok(web.isRunning());
    });

    test("a JSON null body is a 400 with no internal error text", async () => {
      const response = await generate("null");
      assert.equal(response.status, 400, response.text);
      assert.doesNotMatch(response.text, /Cannot read properties|TypeError/);
    });

    test("non-string field values never crash the handler and typed enums fall back", async () => {
      const response = await generate({ businessName: { nested: 1 }, goal: ["a", "b"], intent: 7, role: null });
      assert.ok(response.status < 500, `status ${response.status}`);
      if (response.status === 200) {
        assert.equal(response.json.data.intent, "information");
        assert.equal(response.json.data.role, "starter");
      }
      assert.doesNotMatch(response.text, STACK_TRACE);
    });

    for (const [label, behaviorFor, status, code] of [
      ["upstream 401", (_req, res) => sendJson(res, 401, { error: UPSTREAM_LEAK }), 401, "AI_UNAUTHORIZED"],
      ["upstream 403", (_req, res) => sendJson(res, 403, { error: UPSTREAM_LEAK }), 401, "AI_UNAUTHORIZED"],
      ["upstream 429", (_req, res) => sendJson(res, 429, { error: UPSTREAM_LEAK }), 429, "AI_QUOTA_EXCEEDED"],
      ["upstream 500", (_req, res) => sendJson(res, 500, { error: UPSTREAM_LEAK }), 503, "AI_UNAVAILABLE"],
      ["upstream 503", (_req, res) => sendJson(res, 503, { error: UPSTREAM_LEAK }), 503, "AI_UNAVAILABLE"],
      [
        "upstream 200 with non-JSON garbage",
        (_req, res) => {
          res.statusCode = 200;
          res.setHeader("content-type", "text/html");
          res.end(`<html>${UPSTREAM_LEAK}</html>`);
        },
        502,
        "AI_BAD_RESPONSE"
      ],
      ["upstream 200 with no sections", (_req, res) => sendJson(res, 200, { site_id: "s", sections: [], note: UPSTREAM_LEAK }), 502, "AI_BAD_RESPONSE"],
      ["upstream 200 with blank headings", (_req, res) => sendJson(res, 200, { sections: [{ heading: "  ", body: UPSTREAM_LEAK }] }), 502, "AI_BAD_RESPONSE"],
      ["upstream 200 with a JSON array", (_req, res) => sendJson(res, 200, [UPSTREAM_LEAK]), 502, "AI_BAD_RESPONSE"],
      [
        "upstream dropping the connection",
        (req, res) => {
          req.socket.destroy();
          res.destroy();
        },
        503,
        "AI_UNAVAILABLE"
      ]
    ]) {
      test(`${label} maps to ${status} ${code} with a generic message`, async () => {
        behavior = behaviorFor;
        const response = await generate(validBody);
        assert.equal(response.status, status, response.text);
        assert.equal(response.json.ok, false);
        assert.equal(response.json.error.code, code);
        assert.equal(response.json.error.message, "Site generation failed.");
        assert.doesNotMatch(response.text, /UPSTREAM-DETAIL|handler\.py|sk-e2e/);
        assert.doesNotMatch(response.text, STACK_TRACE);
        assert.equal(response.json.data, undefined);
        assert.ok(web.isRunning());
      });
    }

    test("an unreachable upstream is a 503, and the service recovers when it returns", async () => {
      const dead = await startFakeServer(() => {});
      const deadBase = dead.baseUrl;
      await dead.close();
      const isolated = await startWeb({ WEB_AIAGENT_API_BASE: deadBase, WEB_AIAGENT_MODE: "free-demo" }, "web-dead-upstream");
      try {
        const response = await request(isolated.baseUrl, "/v1/site/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody)
        });
        assert.equal(response.status, 503);
        assert.equal(response.json.error.code, "AI_UNAVAILABLE");
        assert.doesNotMatch(response.text, /ECONNREFUSED|127\.0\.0\.1/);
      } finally {
        await isolated.stop();
      }
      // The main instance is unaffected and succeeds again once the upstream behaves.
      const ok = await generate(validBody);
      assert.equal(ok.status, 200);
    });

    test("every attempt is recorded as an event with its outcome", async () => {
      const marker = `Event Check ${Date.now()}`;
      await generate({ ...validBody, businessName: marker });
      behavior = (_req, res) => sendJson(res, 429, {});
      await generate({ ...validBody, businessName: marker });
      const events = (await request(web.baseUrl, "/events")).json.data.items.filter((item) => item.eventName === "web_api_site_generate");
      const outcomes = events.slice(-2).map((item) => item.buildOutcome);
      assert.deepEqual(outcomes, ["site_fake_001", "AI_QUOTA_EXCEEDED"]);
      const dump = JSON.stringify(events);
      assert.doesNotMatch(dump, new RegExp(marker), "events must not retain the business name");
    });

    test("only POST is accepted", async () => {
      const get = await request(web.baseUrl, "/v1/site/generate");
      assert.equal(get.status, 404);
      assert.equal(upstream.requests.length, 0);
    });
  });

  describe("bring-your-own-key mode", () => {
    test("sends the configured key to the upstream and never echoes it", async () => {
      const byok = await startWeb(
        { WEB_AIAGENT_API_BASE: upstream.baseUrl, WEB_AIAGENT_MODE: "byok", WEB_AIAGENT_API_KEY: FAKE_KEY },
        "web-byok"
      );
      try {
        const response = await request(byok.baseUrl, "/v1/site/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody)
        });
        assert.equal(response.status, 200);
        assert.doesNotMatch(response.text, new RegExp(FAKE_KEY));
        assert.doesNotMatch(JSON.stringify([...response.headers]), new RegExp(FAKE_KEY));
        const sent = upstream.requests.at(-1);
        assert.equal(sent.headers.authorization, `Bearer ${FAKE_KEY}`);
        assert.equal(sent.headers["x-aiagent-mode"], "byok");
        assert.doesNotMatch(byok.logs(), new RegExp(FAKE_KEY), "the key must not be logged");
      } finally {
        await byok.stop();
      }
    });

    test("without a key it answers 401 and does not call the upstream", async () => {
      const keyless = await startWeb({ WEB_AIAGENT_API_BASE: upstream.baseUrl, WEB_AIAGENT_MODE: "byok", WEB_AIAGENT_API_KEY: "" }, "web-byok-nokey");
      try {
        const calls = upstream.requests.length;
        const response = await request(keyless.baseUrl, "/v1/site/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody)
        });
        assert.equal(response.status, 401);
        assert.equal(response.json.error.code, "AI_UNAUTHORIZED");
        assert.equal(upstream.requests.length, calls);
      } finally {
        await keyless.stop();
      }
    });
  });

  describe("GET /v1/site/:id/preview", () => {
    test("serves the draft placeholder as JSON", async () => {
      const response = await request(web.baseUrl, "/v1/site/site_fake_001/preview");
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /application\/json/);
      assert.equal(response.json.data.site_id, "site_fake_001");
      assert.equal(response.json.data.status, "draft");
      assert.match(response.json.data.html, /Placeholder/);
    });

    test("a hostile site id stays inside the JSON body", async () => {
      const response = await request(web.baseUrl, `/v1/site/${encodeURIComponent("<img src=x onerror=alert(1)>")}/preview`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /application\/json/);
      assert.equal(typeof response.json.data.site_id, "string");
    });

    test("only paths shaped /v1/site/:id/preview match", async () => {
      assert.equal((await request(web.baseUrl, "/v1/site/site_fake_001")).status, 404);
      assert.equal((await request(web.baseUrl, "/v1/site/site_fake_001/other")).status, 404);
    });
  });

  describe("/build form", () => {
    const form = (fields) => ({
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString()
    });

    test("GET renders the form when the flag is on", async () => {
      const response = await request(web.baseUrl, "/build?lang=en");
      assert.equal(response.status, 200);
      assert.match(response.text, /name="businessName"/);
      assert.match(response.text, /name="goal"/);
    });

    test("POST with missing fields is a 400 form with a message and no upstream call", async () => {
      const response = await request(web.baseUrl, "/build?lang=en", form({ businessName: "Only a name" }));
      assert.equal(response.status, 400);
      assert.match(response.text, /Please add a business name and goal/);
      assert.equal(upstream.requests.length, 0);
    });

    test("POST success renders the generated sections", async () => {
      const response = await request(web.baseUrl, "/build?lang=en", form({ businessName: "Tam's Coffee", goal: "Sell beans", intent: "leads", role: "operator" }));
      assert.equal(response.status, 200, response.text.slice(0, 300));
      assert.match(response.text, /Draft site for/);
      assert.match(response.text, /Welcome/);
      assert.match(response.text, /Espresso and pastries\./);
      assert.match(response.text, /app\.iai\.one\/auth\/start/);
    });

    test("AI output and the business name are HTML-escaped in the result page", async () => {
      behavior = (_req, res) =>
        sendJson(res, 200, {
          site_id: "s",
          sections: [{ heading: "<script>window.__ai=1</script>", body: '<img src=x onerror="window.__ai=2">' }],
          preview_html: "<script>window.__ai=3</script>"
        });
      const response = await request(
        web.baseUrl,
        "/build?lang=en",
        form({ businessName: "<svg onload=window.__ai=4>", goal: "x" })
      );
      assert.equal(response.status, 200);
      assert.doesNotMatch(response.text, /<script>window\.__ai/);
      assert.doesNotMatch(response.text, /<img src=x onerror/);
      assert.doesNotMatch(response.text, /<svg onload/);
    });

    for (const [label, behaviorFor, pattern] of [
      ["quota", (_req, res) => sendJson(res, 429, {}), /free AI build quota is reached/],
      ["unauthorized", (_req, res) => sendJson(res, 401, {}), /AI access was not authorized/],
      ["garbage", (_req, res) => res.end("<<<not json>>>"), /unexpected response/],
      ["outage", (_req, res) => sendJson(res, 500, { detail: UPSTREAM_LEAK }), /temporarily unavailable/]
    ]) {
      test(`upstream ${label} shows a friendly 502 page without upstream text`, async () => {
        behavior = behaviorFor;
        const response = await request(web.baseUrl, "/build?lang=en", form({ businessName: "Tam", goal: "Sell" }));
        assert.equal(response.status, 502);
        assert.match(response.text, pattern);
        assert.doesNotMatch(response.text, /UPSTREAM-DETAIL|handler\.py/);
      });
    }

    test("the Vietnamese locale is honoured on the form", async () => {
      const response = await request(web.baseUrl, "/build?lang=vi");
      assert.equal(response.status, 200);
      assert.match(response.text, /<html lang="vi"/);
    });
  });

  describe("feature flag and publication hold", () => {
    test("with WEB_AI_BUILDER_ENABLED unset the /build routes are disabled", async () => {
      const disabled = await startWeb({ WEB_AIAGENT_API_BASE: upstream.baseUrl, WEB_AI_BUILDER_ENABLED: "" }, "web-flag-off");
      try {
        const calls = upstream.requests.length;
        const get = await request(disabled.baseUrl, "/build");
        assert.equal(get.status, 404);
        assert.equal(get.json.error.code, "NOT_FOUND");
        const post = await request(disabled.baseUrl, "/build", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "businessName=A&goal=B"
        });
        assert.equal(post.status, 404);
        assert.equal(upstream.requests.length, calls, "a disabled builder must not spend AI quota");
      } finally {
        await disabled.stop();
      }
    });

    test("only the literal string true enables the builder", async () => {
      const lax = await startWeb({ WEB_AIAGENT_API_BASE: upstream.baseUrl, WEB_AI_BUILDER_ENABLED: "1" }, "web-flag-1");
      try {
        assert.equal((await request(lax.baseUrl, "/build")).status, 404);
      } finally {
        await lax.stop();
      }
    });

    test("X-Robots-Tag: noindex, nofollow is sent on every response while the publication hold is on (default)", async () => {
      const paths = [
        ["/events", "GET"],
        ["/feedback", "GET"],
        ["/v1/site/x/preview", "GET"],
        ["/nope", "GET"],
        ["/v1/site/generate", "POST"],
        ["/build", "GET"]
      ];
      for (const [pathname, method] of paths) {
        const response = await request(web.baseUrl, pathname, { method, headers: { "content-type": "application/json" }, body: method === "POST" ? "{}" : undefined });
        assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow", `${method} ${pathname} -> ${response.status}`);
      }
    });

    test("an explicit WEB_PUBLICATION_HOLD=true keeps the header", async () => {
      const held = await startWeb({ WEB_PUBLICATION_HOLD: "true" }, "web-hold-true");
      try {
        const response = await request(held.baseUrl, "/events");
        assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
      } finally {
        await held.stop();
      }
    });

    test("WEB_PUBLICATION_HOLD=false removes the header from every response", async () => {
      const open = await startWeb({ WEB_PUBLICATION_HOLD: "false", WEB_AIAGENT_API_BASE: upstream.baseUrl }, "web-hold-off");
      try {
        for (const [pathname, method] of [["/events", "GET"], ["/feedback", "GET"], ["/nope", "GET"], ["/v1/site/generate", "POST"]]) {
          const response = await request(open.baseUrl, pathname, { method, headers: { "content-type": "application/json" }, body: method === "POST" ? "{}" : undefined });
          assert.equal(response.headers.get("x-robots-tag"), null, `${method} ${pathname}`);
        }
      } finally {
        await open.stop();
      }
    });
  });
});
