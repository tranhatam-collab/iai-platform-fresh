/**
 * noos-web (noos.iai.one) as a real process.
 *
 * The catalog, product and buyer-library pages are rendered from gitignored
 * docs/noos fixtures, so this whole file is skipped when they are absent. When they
 * are present, expectations (product names, slugs, buyers, library items) are read from
 * the fixtures themselves rather than hard-coded, so the file keeps working as the
 * private content pack evolves.
 *
 * Covers locale redirects, catalog collections, product detail, the checkout form POST
 * in waitlist, local-fixture and (fake) commerce-API modes, the buyer library, role
 * profiles, sitemap/robots and output encoding of the role and slug parameters.
 *
 * Needs `pnpm --filter @iai/noos-web build`.
 * Run: node --test tests/e2e/noos-web.e2e.test.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, describe, test } from "node:test";

import { sendJson, startFakeServer } from "./support/fake-http.mjs";
import { builtEntryAvailable, docsFixturesAvailable, repoRoot, request, startService } from "./support/harness.mjs";
import { networkGuardEnv } from "./support/network-guard.mjs";

const ENTRY = "apps/noos-web/dist/server.js";
const fixturesRoot = path.join(repoRoot, "docs", "noos", "NOOS_COMMERCE_FIXTURES_v0.1");

const skipReason = !builtEntryAvailable(ENTRY)
  ? `${ENTRY} not built (pnpm --filter @iai/noos-web build)`
  : !docsFixturesAvailable()
    ? "skipped: needs the gitignored docs/noos commerce fixtures (set up the private docs pack to run these tests)"
    : false;

const STACK_TRACE = /(\/home\/|\/Users\/|node_modules|at [\w.<>]+ \(.*:\d+:\d+\)|ENOENT)/;

function readJson(...segments) {
  return JSON.parse(readFileSync(path.join(...segments), "utf8"));
}

// Page text with entities decoded, so product names containing & or ' compare naturally.
function decoded(html) {
  return html
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

const slugOf = (product) => product.route.split("/").filter(Boolean).at(-1);
const form = (fields) => ({
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(fields).toString()
});

describe("noos-web", { skip: skipReason }, () => {
  let noos; // waitlist mode (SELLING_ENABLED unset)
  let selling; // local fixtures, selling on
  let products = [];
  let libraries = [];
  let roleProfiles = [];

  before(async () => {
    products = readJson(fixturesRoot, "catalog", "product_definitions_all_v1.json").products;
    const libraryDir = path.join(fixturesRoot, "library");
    libraries = existsSync(libraryDir)
      ? readdirSync(libraryDir)
          .filter((name) => name.endsWith(".json"))
          .map((name) => readJson(libraryDir, name))
          .filter((library) => library.buyerId && Array.isArray(library.items))
      : [];
    const data = await import(pathToFileURL(path.join(repoRoot, "apps/noos-web/dist/data.js")).href);
    roleProfiles = data.getRoleProfiles();

    const base = { ...networkGuardEnv() };
    noos = await startService({ name: "noos", entry: ENTRY, portEnv: "NOOS_WEB_PORT", hostEnv: null, env: { ...base, SELLING_ENABLED: "" } });
    selling = await startService({ name: "noos-selling", entry: ENTRY, portEnv: "NOOS_WEB_PORT", hostEnv: null, env: { ...base, SELLING_ENABLED: "true" } });
  });
  after(async () => {
    await Promise.all([noos?.stop(), selling?.stop()]);
  });

  describe("locale routing", () => {
    test("unprefixed routes redirect to the English canonical and keep the query string", async () => {
      for (const [from, to] of [
        ["/", "/en/products"],
        ["/products", "/en/products"],
        ["/en", "/en/products"],
        ["/?buyer=buyer_alpha001", "/en/products?buyer=buyer_alpha001"],
        ["/library?buyer=buyer_alpha001", "/en/library?buyer=buyer_alpha001"],
        ["/vi", "/vi/products"],
        ["/vi/", "/vi/products"]
      ]) {
        const response = await request(noos.baseUrl, from);
        assert.equal(response.status, 308, from);
        assert.equal(response.headers.get("location"), to, from);
      }
    });

    test("the language switch is a pair of hreflang alternates", async () => {
      const en = await request(noos.baseUrl, "/en/products");
      assert.equal(en.status, 200);
      assert.match(en.text, /<html lang="en"/);
      assert.match(en.text, /hreflang="vi"/);
      assert.match(en.text, /href="\/vi\/products/);
      const vi = await request(noos.baseUrl, "/vi/products");
      assert.match(vi.text, /<html lang="vi"/);
      assert.match(vi.text, /hreflang="en"/);
      for (const html of [en.text, vi.text]) {
        const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
        assert.equal(new URL(canonical).host, "noos.iai.one");
      }
    });

    test("health reports the commerce source mode", async () => {
      const response = await request(noos.baseUrl, "/health");
      assert.equal(response.status, 200);
      assert.equal(response.json.service, "noos-web");
      assert.equal(response.json.commerceSourceMode, "local-fixtures");
    });
  });

  describe("catalog and product pages", () => {
    test("the catalog lists every product in the fixture, linking to its detail page", async () => {
      const response = await request(noos.baseUrl, "/en/products");
      const text = decoded(response.text);
      assert.ok(products.length > 0);
      for (const product of products) {
        assert.ok(text.includes(product.name), `catalog is missing "${product.name}"`);
        assert.ok(response.text.includes(`/product/${slugOf(product)}`), `catalog does not link to ${slugOf(product)}`);
      }
    });

    test("the documents and programs collections show their tiers", async () => {
      const documents = decoded((await request(noos.baseUrl, "/en/documents")).text);
      for (const product of products.filter((entry) => ["Entry", "Entry/Core", "Core", "Master"].includes(entry.tier))) {
        assert.ok(documents.includes(product.name), `documents is missing "${product.name}"`);
      }
      const programs = decoded((await request(noos.baseUrl, "/en/programs")).text);
      for (const product of products.filter((entry) => entry.tier === "Advanced Program")) {
        assert.ok(programs.includes(product.name), `programs is missing "${product.name}"`);
      }
    });

    test("every product detail page renders in both locales", async () => {
      for (const product of products) {
        const en = await request(noos.baseUrl, `/en/product/${slugOf(product)}`);
        assert.equal(en.status, 200, `${slugOf(product)} (en)`);
        assert.ok(decoded(en.text).includes(product.name), `${slugOf(product)} (en) lacks its name`);
        assert.match(en.text, /<h1[\s>]/);
        const vi = await request(noos.baseUrl, `/vi/product/${slugOf(product)}`);
        assert.equal(vi.status, 200, `${slugOf(product)} (vi)`);
        assert.match(vi.text, /<html lang="vi"/);
      }
    });

    test("unknown products and routes are clean 404 pages", async () => {
      for (const pathname of ["/en/product/no-such-product", "/en/no-such-page", "/vi/library/product/no-such-product"]) {
        const response = await request(noos.baseUrl, pathname);
        assert.equal(response.status, 404, pathname);
        assert.match(response.headers.get("content-type"), /text\/html/);
        assert.doesNotMatch(response.text, STACK_TRACE);
      }
    });

    test("the slug in a 404 is not reflected as markup", async () => {
      const response = await request(noos.baseUrl, `/en/product/${encodeURIComponent('"><img src=x onerror=window.__xss=1>')}`);
      assert.equal(response.status, 404);
      assert.doesNotMatch(response.text, /<img src=x/);
    });

    test("sitemap and robots describe the localized site", async () => {
      const sitemap = await request(noos.baseUrl, "/sitemap.xml");
      assert.equal(sitemap.status, 200);
      assert.match(sitemap.headers.get("content-type"), /xml/);
      const locs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
      assert.ok(locs.length >= 2);
      assert.deepEqual([...new Set(locs.map((loc) => loc.host))], ["noos.iai.one"]);
      const paths = locs.map((loc) => loc.pathname);
      assert.ok(paths.includes("/en/products") && paths.includes("/vi/products"));
      for (const loc of locs.slice(0, 40)) {
        const response = await request(noos.baseUrl, `${loc.pathname}${loc.search}`);
        assert.equal(response.status, 200, loc.href);
      }

      const robots = await request(noos.baseUrl, "/robots.txt");
      assert.equal(robots.status, 200);
      assert.match(robots.headers.get("content-type"), /text\/plain/);
      assert.match(robots.text, /User-agent:/i);
      assert.match(robots.text, /Sitemap:\s*https:\/\/noos\.iai\.one\/sitemap\.xml/i);
      assert.equal((await request(noos.baseUrl, "/en/sitemap.xml")).headers.get("location"), "/sitemap.xml");
    });
  });

  describe("role profiles", () => {
    test("each role renders the catalog with its own profile, unknown roles fall back to the default", async () => {
      assert.ok(roleProfiles.length >= 2);
      const pages = new Map();
      for (const profile of roleProfiles) {
        const response = await request(noos.baseUrl, `/en/products?role=${profile.role}`);
        assert.equal(response.status, 200, profile.role);
        assert.ok(decoded(response.text).includes(profile.label), `role ${profile.role} does not show its label`);
        pages.set(profile.role, response.text);
      }
      const distinct = new Set(pages.values());
      assert.ok(distinct.size > 1, "role profiles must change the rendered page");

      const bogus = await request(noos.baseUrl, "/en/products?role=definitely-not-a-role");
      assert.equal(bogus.status, 200);
      assert.equal(bogus.text.length > 0, true);
      const defaultRole = roleProfiles[0].role;
      const explicitDefault = await request(noos.baseUrl, `/en/products?role=${defaultRole}`);
      assert.equal(
        decoded(bogus.text).includes(roleProfiles[0].label),
        decoded(explicitDefault.text).includes(roleProfiles[0].label)
      );
    });

    test("the from parameter of the organization inquiry page is encoded", async () => {
      const response = await request(noos.baseUrl, `/en/organization-inquiry?from=${encodeURIComponent('x" data-probe="1')}`);
      assert.equal(response.status, 200);
      assert.doesNotMatch(response.text, /"\s*data-probe=/);
    });

    test("the role parameter is not reflected as markup", async () => {
      const response = await request(noos.baseUrl, `/en/products?role=${encodeURIComponent('"onmouseover="window.__xss=1" x="')}`);
      assert.equal(response.status, 200);
      assert.doesNotMatch(response.text, /"\s*onmouseover=/i);
    });
  });

  describe("buyer library", () => {
    test("each fixture buyer sees their own items", async () => {
      assert.ok(libraries.length > 0, "no library fixtures found");
      for (const library of libraries) {
        const response = await request(noos.baseUrl, `/en/library?buyer=${encodeURIComponent(library.buyerId)}`);
        assert.equal(response.status, 200, library.buyerId);
        const text = decoded(response.text);
        for (const item of library.items) {
          assert.ok(text.includes(item.name), `${library.buyerId} library is missing "${item.name}"`);
        }
      }
    });

    test("a buyer never sees another buyer's items", async () => {
      if (libraries.length < 2) {
        return;
      }
      const [first, second] = libraries;
      const firstOnly = first.items.filter((item) => !second.items.some((other) => other.name === item.name));
      const secondPage = decoded((await request(noos.baseUrl, `/en/library?buyer=${encodeURIComponent(second.buyerId)}`)).text);
      for (const item of firstOnly) {
        assert.ok(!secondPage.includes(`>${item.name}<`), `${second.buyerId}'s library leaks "${item.name}"`);
      }
    });

    test("an unknown buyer gets an empty library page, not an error", async () => {
      const response = await request(noos.baseUrl, "/en/library?buyer=buyer_does_not_exist_e2e");
      assert.equal(response.status, 200);
      for (const library of libraries) {
        for (const item of library.items) {
          assert.ok(!decoded(response.text).includes(`>${item.name}<`));
        }
      }
    });

    test("updates, licenses and account sub-pages render per buyer", async () => {
      const buyer = libraries[0]?.buyerId ?? "buyer_alpha001";
      for (const sub of ["updates", "licenses", "account"]) {
        const response = await request(noos.baseUrl, `/vi/library/${sub}?buyer=${encodeURIComponent(buyer)}`);
        assert.equal(response.status, 200, sub);
        assert.match(response.text, /<html lang="vi"/);
      }
      const licenses = await request(noos.baseUrl, "/en/licenses");
      assert.equal(licenses.status, 200);
    });
  });

  describe("checkout", () => {
    const product = () => products.find((entry) => entry.productCode === "P03") ?? products[0];

    test("the checkout page renders for a product and rejects unknown product codes", async () => {
      const ok = await request(noos.baseUrl, `/en/checkout?product=${product().productCode}&buyer=buyer_alpha001`);
      assert.equal(ok.status, 200);
      assert.ok(decoded(ok.text).includes(product().name));
      assert.match(ok.text, /<form[^>]*method="post"/i);
      const unknown = await request(noos.baseUrl, "/en/checkout?product=P99");
      assert.equal(unknown.status, 404);
    });

    test("in waitlist mode (selling disabled) the form POST places no order", async () => {
      const response = await request(noos.baseUrl, "/en/checkout", form({ product: product().productCode, buyer: "buyer_alpha001", email: "e2e@example.com" }));
      assert.equal(response.status, 200, response.text.slice(0, 200));
      assert.equal(response.headers.get("location"), null);
      assert.match(response.headers.get("content-type"), /text\/html/);
      assert.doesNotMatch(response.text, /ord_local_/);
    });

    test("with selling enabled the form POST redirects to a success page for the new order", async () => {
      const response = await request(selling.baseUrl, "/en/checkout", form({ product: product().productCode, buyer: "buyer_alpha001", email: "Jane.Doe@Example.com", license: product().defaultLicense }));
      assert.equal(response.status, 303, response.text.slice(0, 200));
      const location = new URL(response.headers.get("location"), "http://noos.local");
      assert.equal(location.pathname, "/en/checkout-success");
      assert.equal(location.searchParams.get("product"), product().productCode);
      assert.equal(location.searchParams.get("buyer"), "buyer_jane_doe", "buyer id is derived from the email");
      assert.match(location.searchParams.get("order"), /^ord_local_[a-z0-9]+$/);

      const success = await request(selling.baseUrl, `${location.pathname}${location.search}`);
      assert.equal(success.status, 200);
      assert.ok(decoded(success.text).includes(product().name));
    });

    test("the Vietnamese form keeps its locale across the redirect", async () => {
      const response = await request(selling.baseUrl, "/vi/checkout", form({ product: product().productCode }));
      assert.equal(response.status, 303);
      assert.match(response.headers.get("location"), /^\/vi\/checkout-success\?/);
    });

    test("line breaks in form fields cannot split the redirect header", async () => {
      const response = await request(selling.baseUrl, "/en/checkout", form({ product: product().productCode, buyer: "x\r\nSet-Cookie: injected=1" }));
      assert.equal(response.status, 303);
      assert.equal(response.headers.getSetCookie().length, 0);
      assert.doesNotMatch(response.headers.get("location"), /[\r\n]/);
      assert.match(response.headers.get("location"), /%0D%0A/i);
    });

    test("an unknown product code in the form is a client error", { todo: "executeCheckoutFlowAsync throws and the server answers 500 with the raw message (apps/noos-web/src/server.ts)" }, async () => {
      const response = await request(selling.baseUrl, "/en/checkout", form({ product: "P99" }));
      assert.ok(response.status >= 400 && response.status < 500, `status ${response.status}`);
    });

    test("GET on the checkout POST target never creates an order", async () => {
      const response = await request(selling.baseUrl, `/en/checkout?product=${product().productCode}`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("location"), null);
    });

    describe("against a fake commerce API", () => {
      let api;
      let apiBehavior;
      let wired;
      let required;

      before(async () => {
        apiBehavior = (req, res) => {
          if (req.method === "POST" && req.url === "/checkout/sessions") {
            return sendJson(res, 200, {
              checkoutSessionId: "cs_fake_e2e_1",
              fulfillmentStatus: "pending",
              licenseType: "Individual",
              productCode: "P03",
              redirectUrl: "https://example.invalid/pay"
            });
          }
          if (req.method === "POST" && req.url === "/webhooks/stripe/checkout-session-completed") {
            return sendJson(res, 200, { received: true });
          }
          return sendJson(res, 404, { error: "not found" });
        };
        api = await startFakeServer((req, res) => apiBehavior(req, res));
        const env = { ...networkGuardEnv(), SELLING_ENABLED: "true", NOOS_COMMERCE_API_BASE: api.baseUrl };
        wired = await startService({ name: "noos-api", entry: ENTRY, portEnv: "NOOS_WEB_PORT", hostEnv: null, env });
        required = await startService({
          name: "noos-api-required",
          entry: ENTRY,
          portEnv: "NOOS_WEB_PORT",
          hostEnv: null,
          env: { ...env, NOOS_COMMERCE_REQUIRE_API: "1" }
        });
      });
      after(async () => {
        await Promise.all([wired?.stop(), required?.stop()]);
        await api?.close();
      });

      test("health reports the API source mode", async () => {
        assert.equal((await request(wired.baseUrl, "/health")).json.commerceSourceMode, "api-optional");
        assert.equal((await request(required.baseUrl, "/health")).json.commerceSourceMode, "api-required");
      });

      test("a purchase opens a checkout session and reports completion to the commerce API", async () => {
        const calls = api.requests.length;
        const chosen = product();
        const response = await request(wired.baseUrl, "/en/checkout", form({ product: chosen.productCode, email: "api.buyer@example.com" }));
        assert.equal(response.status, 303, response.text.slice(0, 200));
        const order = new URL(response.headers.get("location"), "http://noos.local").searchParams.get("order");
        assert.match(order, /^ord_[a-z0-9]+$/);
        assert.doesNotMatch(order, /^ord_local_/);

        const made = api.requests.slice(calls).filter((entry) => entry.method === "POST");
        const session = made.find((entry) => entry.url === "/checkout/sessions");
        const webhook = made.find((entry) => entry.url === "/webhooks/stripe/checkout-session-completed");
        assert.ok(session, "no checkout session request reached the commerce API");
        assert.equal(session.json.productCode, chosen.productCode);
        assert.equal(session.json.entitlementCode, chosen.entitlementCode);
        assert.equal(session.json.buyerEmail, "api.buyer@example.com");
        assert.equal(session.json.sourceSurface, "product-detail");
        assert.ok(webhook, "completion webhook was not reported");
        assert.equal(webhook.json.checkoutSessionId, "cs_fake_e2e_1");
        assert.equal(webhook.json.orderId, order);
        assert.equal(webhook.json.eventType, "checkout.session.completed");
        assert.equal(webhook.json.buyerEmail, "api.buyer@example.com");
        assert.doesNotMatch(wired.logs(), /E2E_NETWORK_GUARD_BLOCKED/);
      });

      test("optional API mode falls back to a local order when the API fails", async () => {
        const previous = apiBehavior;
        apiBehavior = (_req, res) => sendJson(res, 500, { error: "boom" });
        try {
          const response = await request(wired.baseUrl, "/en/checkout", form({ product: product().productCode }));
          assert.equal(response.status, 303, response.text.slice(0, 200));
          assert.match(response.headers.get("location"), /order=ord_local_/);
        } finally {
          apiBehavior = previous;
        }
      });

      test("required API mode surfaces a failing API as a server error without leaking internals", async () => {
        const previous = apiBehavior;
        apiBehavior = (_req, res) => sendJson(res, 500, { error: "boom" });
        try {
          const response = await request(required.baseUrl, "/en/checkout", form({ product: product().productCode }));
          assert.ok(response.status >= 500, `status ${response.status}`);
          assert.doesNotMatch(response.text, STACK_TRACE);
          assert.equal(response.headers.get("location"), null);
          assert.ok(required.isRunning());
        } finally {
          apiBehavior = previous;
        }
      });
    });
  });
});
