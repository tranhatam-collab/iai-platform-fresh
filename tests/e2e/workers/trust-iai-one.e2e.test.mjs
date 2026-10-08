/**
 * Process-level E2E for the trust.iai.one Worker (static assets + /api/trust/*) under
 * `wrangler dev --local` with a throwaway, migrated D1 database.
 *
 * Needs: `npm ci` in tests/e2e/workers (Node >= 22). Skips with a reason when wrangler/workerd
 * cannot run; set E2E_WORKERS_REQUIRE=1 to make that a failure instead.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { request } from "../support/harness.mjs";
import { repoRoot, startWorker, workerRuntimeSkipReason } from "./support/wrangler.mjs";

const skip = workerRuntimeSkipReason();
const TRUST_DIR = path.join(repoRoot, "trust-iai-one-starter");
const PUBLIC_DIR = path.join(TRUST_DIR, "public");
const stateOnDisk = JSON.parse(readFileSync(path.join(PUBLIC_DIR, "data", "trust-state.json"), "utf8"));

const json = (body, extra = {}) => ({ method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body), ...extra });

describe("trust.iai.one Worker", { skip }, () => {
  let worker;
  let base;
  let d1;

  before(async () => {
    worker = await startWorker({
      name: "trust",
      dir: "trust-iai-one-starter",
      config: "wrangler.toml",
      migrations: { database: "DB" },
      readyPath: "/api/trust/health"
    });
    base = worker.baseUrl;
    d1 = worker.d1;
  }, { timeout: 120_000 });
  after(async () => {
    await worker?.stop();
  });

  const get = (pathname, init) => request(base, pathname, init);
  const rows = (where = "1 = 1") => d1.query(`SELECT id, user_id, type, action, metadata, timestamp FROM audit_logs WHERE ${where} ORDER BY rowid`);
  const count = async () => (await d1.query("SELECT COUNT(*) AS c FROM audit_logs"))[0].c;

  describe("pages and static assets", () => {
    test("GET / serves the trust page (Vietnamese default) with its stylesheet and script", async () => {
      const response = await get("/");
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") ?? "", /text\/html/);
      assert.match(response.text, /<html lang="vi">/);
      assert.match(response.text, /<title>Trust IAI<\/title>/);
      assert.match(response.text, /href="\/style\.css"/);
      for (const id of ["m1", "m2", "m3", "m4", "m5", "m6", "m7"]) assert.match(response.text, new RegExp(`id="${id}"`), `module section ${id}`);
    });

    test("every file the page references is served with a sensible content type", async () => {
      const css = await get("/style.css");
      assert.equal(css.status, 200);
      assert.match(css.headers.get("content-type") ?? "", /text\/css/);
      const js = await get("/site.js");
      assert.equal(js.status, 200);
      assert.match(js.headers.get("content-type") ?? "", /javascript/);
      assert.equal(js.text, readFileSync(path.join(PUBLIC_DIR, "site.js"), "utf8"));
    });

    test("locale bundles for vi and en are valid JSON with the same keys", async () => {
      const [vi, en] = await Promise.all([get("/content/vi.json"), get("/content/en.json")]);
      assert.equal(vi.status, 200);
      assert.equal(en.status, 200);
      assert.ok(vi.json && en.json, "both bundles parse as JSON");
      const flatten = (value, prefix = "") =>
        Object.entries(value).flatMap(([key, child]) => (child && typeof child === "object" && !Array.isArray(child) ? flatten(child, `${prefix}${key}.`) : [`${prefix}${key}`]));
      // the footer disclosure key carries its locale as a suffix by design (footer_disclosure_vi / _en)
      const keys = (bundle) => flatten(bundle).map((key) => key.replace(/_(vi|en)$/, "")).sort();
      assert.deepEqual(keys(vi.json), keys(en.json));
    });

    test("the published trust state only uses the declared claim-status values", async () => {
      const response = await get("/data/trust-state.json");
      assert.equal(response.status, 200);
      const allowed = new Set(response.json.verification_policy.claim_status_enum);
      assert.deepEqual([...allowed].sort(), ["declared", "unverified", "verified"]);
      for (const [module, items] of Object.entries(response.json.modules)) {
        for (const item of items) {
          if (item.status !== undefined) assert.ok(allowed.has(item.status), `${module}: unexpected status ${item.status}`);
        }
      }
    });

    test("unknown paths are 404, not an HTML fallback", async () => {
      const response = await get("/no-such-page");
      assert.equal(response.status, 404);
      assert.doesNotMatch(response.text, /<title>Trust IAI<\/title>/);
    });

    test("data files are published once: no stray ' 2' duplicates are served", { todo: "known gap, tracked on the team board" }, async () => {
      const leftovers = readdirSync(path.join(PUBLIC_DIR, "data")).filter((name) => / 2\.\w+$/.test(name));
      for (const name of leftovers) assert.equal((await get(`/data/${encodeURIComponent(name)}`)).status, 404, name);
      assert.deepEqual(leftovers, []);
    });
  });

  describe("GET /api/trust", () => {
    test("/health reports ok as uncached JSON with permissive CORS for third-party verifiers", async () => {
      const response = await get("/api/trust/health");
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") ?? "", /application\/json/);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("access-control-allow-origin"), "*");
      assert.equal(response.json.ok, true);
      assert.equal(response.json.service, "trust.iai.one");
      assert.equal(response.json.phase, "phase_1_static");
      assert.ok(Math.abs(Date.now() - Date.parse(response.json.time)) < 60_000, "time is current");
    });

    test("/state returns the published trust state verbatim", async () => {
      const response = await get("/api/trust/state");
      assert.equal(response.status, 200);
      assert.deepEqual(response.json, stateOnDisk);
    });

    const slices = {
      "/api/trust/domains": "official_domains",
      "/api/trust/teams": "official_teams",
      "/api/trust/channels": "official_channels",
      "/api/trust/methods": "verification_methods",
      "/api/trust/go": "go_short_links",
      "/api/trust/reports": "report_and_impersonation",
      "/api/trust/pages": "trust_page_builder"
    };
    for (const [route, module] of Object.entries(slices)) {
      test(`${route} serves the ${module} slice with provenance`, async () => {
        const response = await get(route);
        assert.equal(response.status, 200);
        assert.equal(response.json.module, module);
        assert.equal(response.json.count, stateOnDisk.modules[module].length);
        assert.equal(response.json.items.length, response.json.count);
        assert.equal(response.json.generated_at, stateOnDisk.generated_at);
        assert.equal(response.json.build_commit, stateOnDisk.build_commit);
        assert.deepEqual(response.json.claim_status_enum, stateOnDisk.verification_policy.claim_status_enum);
      });
    }

    test("the user-data endpoints are explicitly not available in Phase 1 (501), not silently empty", async () => {
      for (const route of ["/api/trust/data", "/api/trust/export", "/api/trust/delete"]) {
        const response = await get(route);
        assert.equal(response.status, 501, route);
        assert.equal(response.json.error, "not_available_in_phase_1");
      }
    });

    test("unknown API routes and wrong methods answer a JSON error, never a 2xx", async () => {
      const unknown = await get("/api/trust/nope");
      assert.equal(unknown.status, 404);
      assert.equal(unknown.json.error, "not_found");
      const wrongMethod = await get("/api/trust/state", json({}));
      assert.ok(wrongMethod.status >= 400, `${wrongMethod.status}`);
      const getReport = await get("/api/trust/report");
      assert.ok(getReport.status >= 400, `${getReport.status}`);
    });

    test("OPTIONS preflight advertises the allowed methods and headers", async () => {
      const response = await get("/api/trust/report", { method: "OPTIONS" });
      assert.ok(response.status >= 200 && response.status < 300, `${response.status}`);
      assert.match(response.headers.get("access-control-allow-methods") ?? "", /POST/);
      assert.match(response.headers.get("access-control-allow-headers") ?? "", /content-type/i);
    });
  });

  describe("POST /api/trust/report", () => {
    test("a valid report is acknowledged and written to D1 as one audit_logs row", async () => {
      const before = await count();
      const response = await get("/api/trust/report", json({ type: "impersonation", affected: "example.invalid", message: "e2e report body", contact: "reporter@example.invalid" }));
      assert.equal(response.status, 200, response.text);
      assert.equal(response.json.ok, true);
      assert.equal(response.json.status, "received");
      assert.match(response.json.note, /logged for human review/i);

      assert.equal(await count(), before + 1);
      const [row] = await rows("action = 'issue_reported' AND metadata LIKE '%e2e report body%'");
      assert.ok(row, "row persisted");
      assert.match(row.id, /^log_[0-9a-f-]{36}$/);
      assert.equal(row.type, "report");
      assert.equal(row.user_id, "public_anonymous", "anonymous reports are attributed to public_anonymous");
      assert.deepEqual(JSON.parse(row.metadata), { type: "impersonation", affected: "example.invalid", message: "e2e report body", contact: "reporter@example.invalid" });
      assert.ok(!Number.isNaN(Date.parse(`${row.timestamp.replace(" ", "T")}Z`)), "timestamp populated");
    });

    test("defaults and truncation: type defaults to issue and long fields are cut to their limits", async () => {
      const marker = `trunc-${Date.now()}`;
      const response = await get("/api/trust/report", json({ message: `${marker}${"m".repeat(1500)}`, type: "t".repeat(100), affected: "a".repeat(300), contact: "c".repeat(300) }));
      assert.equal(response.status, 200);
      const [row] = await rows(`metadata LIKE '%${marker}%'`);
      const metadata = JSON.parse(row.metadata);
      assert.equal(metadata.message.length, 1000);
      assert.equal(metadata.type.length, 64);
      assert.equal(metadata.affected.length, 200);
      assert.equal(metadata.contact.length, 200);

      const bare = await get("/api/trust/report", json({ message: `${marker}-bare` }));
      assert.equal(bare.status, 200);
      const [bareRow] = await rows(`metadata LIKE '%${marker}-bare%'`);
      assert.deepEqual(JSON.parse(bareRow.metadata), { type: "issue", affected: "", message: `${marker}-bare`, contact: "" });
    });

    test("each report gets its own row and id", async () => {
      const marker = `multi-${Date.now()}`;
      await Promise.all([1, 2, 3].map((n) => get("/api/trust/report", json({ message: `${marker}-${n}` }))));
      const written = await rows(`metadata LIKE '%${marker}%'`);
      assert.equal(written.length, 3);
      assert.equal(new Set(written.map((row) => row.id)).size, 3);
    });

    test("input without a usable message is rejected with 400 message_required and writes nothing", async () => {
      const before = await count();
      for (const body of [{}, { message: "" }, { message: "   " }, { type: "issue" }, "not json at all", "[]", '"a string"', "123"]) {
        const response = await get("/api/trust/report", json(body));
        assert.equal(response.status, 400, `${JSON.stringify(body)} -> ${response.status} ${response.text.slice(0, 120)}`);
        assert.equal(response.json.error, "message_required");
      }
      assert.equal(await count(), before);
    });

    test("a JSON null body is a client error (400), not a Worker crash", { todo: "known gap, tracked on the team board" }, async () => {
      const response = await get("/api/trust/report", json("null"));
      assert.equal(response.status, 400, `${response.status} ${response.text.slice(0, 120)}`);
    });

    test("a non-string message is rejected instead of being stored as '[object Object]'", { todo: "known gap, tracked on the team board" }, async () => {
      const before = await count();
      const response = await get("/api/trust/report", json({ message: { nested: true } }));
      assert.equal(response.status, 400, response.text);
      assert.equal(await count(), before);
    });
  });
});
