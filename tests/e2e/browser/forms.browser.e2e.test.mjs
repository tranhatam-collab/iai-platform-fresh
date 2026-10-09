/**
 * Real-browser form submissions for dash and web, with fixture data only.
 *
 * `surfaces.browser.e2e.test.mjs` only loads pages (GET). This file fills in and submits real
 * forms in headless Chromium, follows the redirect or the response page, and checks that the
 * round trip raises no uncaught exception, no console error and no `securitypolicyviolation`
 * event, and that every request goes to the page's own origin.
 *
 * dash /login has no form (it offers two links), so the dash forms exercised here are the
 * publish-readiness actions of a seeded flow, which POST and answer with a same-origin redirect.
 * A page's policy is whatever the server sends: with a Content-Security-Policy header present
 * the run proves the policy admits the form submission; without one it still proves the round
 * trip is clean. The test never edits or weakens a policy.
 *
 * Needs: `pnpm build`, `npm ci` in this folder, and a matching Chromium (see the surfaces test).
 * Set E2E_BROWSER_REQUIRE=1 to fail instead of skip when no browser is available.
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { builtEntryAvailable, startMailApi, startService } from "../support/harness.mjs";

const REQUIRE = process.env.E2E_BROWSER_REQUIRE === "1";
const DASH_SESSION = { "x-dash-session": "browser-form-session" };

let chromium = null;
let browser = null;
let skipReason = null;
let mailApi = null;
let dash = null;
let web = null;

const built = ["apps/mail-api/dist/bootstrap.js", "apps/dash/dist/index.js", "apps/web/dist/index.js"].every(builtEntryAvailable);

before(async () => {
  if (REQUIRE && !built) {
    throw new Error("mail-api, dash or web is not built; run pnpm build first (E2E_BROWSER_REQUIRE=1)");
  }
  try {
    ({ chromium } = await import("playwright-core"));
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    skipReason = `no usable Chromium/playwright-core (${String(error.message).split("\n")[0]})`;
    if (REQUIRE) {
      throw error;
    }
    return;
  }
  if (!built) {
    skipReason = "mail-api, dash or web is not built";
    return;
  }
  mailApi = await startMailApi();
  [dash, web] = await Promise.all([
    startService({
      name: "dash",
      entry: "apps/dash/dist/index.js",
      portEnv: "DASH_PORT",
      hostEnv: "DASH_HOST",
      env: { DASH_FLOW_API_BASE: mailApi.baseUrl }
    }),
    startService({
      name: "web",
      entry: "apps/web/dist/index.js",
      portEnv: "WEB_PORT",
      hostEnv: "WEB_BIND_ADDRESS",
      env: { WEB_SHARED_FLOW_API_BASE: mailApi.baseUrl }
    })
  ]);
});

after(async () => {
  await Promise.all([dash?.stop(), web?.stop()]);
  await browser?.close();
  await mailApi?.stop();
});

/** A browser context that records everything a form round trip could get wrong. */
async function openContext(service, extraHeaders = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, extraHTTPHeaders: extraHeaders });
  const origin = new URL(service.baseUrl).origin;
  const record = { consoleErrors: [], external: [], pageErrors: [], requests: [], violations: [] };

  await context.exposeBinding("reportCspViolation", (_source, violation) => {
    record.violations.push(violation);
  });
  await context.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      window.reportCspViolation(`${event.violatedDirective} blocked ${event.blockedURI || "inline"}`);
    });
  });
  await context.route("**/*", (route) => {
    const target = new URL(route.request().url());
    if (target.origin === origin || target.protocol === "data:") {
      record.requests.push(`${route.request().method()} ${target.pathname}`);
      return route.continue();
    }
    record.external.push(`${route.request().method()} ${target.origin}${target.pathname}`);
    return route.abort();
  });

  const page = await context.newPage();
  page.on("console", (message) => message.type() === "error" && record.consoleErrors.push(message.text()));
  page.on("pageerror", (error) => record.pageErrors.push(error.message));
  return { context, origin, page, record };
}

function assertCleanRoundTrip(record, label) {
  assert.deepEqual(record.violations, [], `${label}: content security policy violations`);
  assert.deepEqual(record.pageErrors, [], `${label}: uncaught page exceptions`);
  assert.deepEqual(record.consoleErrors, [], `${label}: console errors`);
  assert.deepEqual(record.external, [], `${label}: requests left the page's own origin`);
}

describe("browser forms: dash and web", () => {
  test("dash: submitting a publish-readiness action form redirects within the origin and renders its result", async (t) => {
    if (skipReason || !dash) {
      t.skip(skipReason ?? "dash is not available");
      return;
    }
    const { context, origin, page, record } = await openContext(dash, DASH_SESSION);
    try {
      await page.goto(new URL("/flows/flow_lead_intake/publish?lang=en", dash.baseUrl).href, { waitUntil: "networkidle" });
      const forms = page.locator("form.action-form");
      assert.ok((await forms.count()) >= 1, "the publish page offers no action form");
      const actionPath = new URL(await forms.first().getAttribute("action"), dash.baseUrl).pathname;
      assert.match(actionPath, /^\/flows\/flow_lead_intake\/publish\//u);

      const [response] = await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle" }),
        forms.first().locator("button[type=submit]").click()
      ]);
      assert.ok(response, "no navigation followed the form submission");
      assert.equal(new URL(page.url()).origin, origin, "the redirect left the page's origin");
      assert.equal(new URL(page.url()).pathname, "/flows/flow_lead_intake/publish");
      assert.match(new URL(page.url()).search, /action=publish\./u, "the redirect carries no action result");
      assert.ok(record.requests.some((request) => request === `POST ${actionPath}`), "the form was not posted to its action");
      assert.ok((await page.locator("main").count()) >= 1);
      assertCleanRoundTrip(record, "dash publish action");
    } finally {
      await context.close();
    }
  });

  test("web: submitting the feedback form shows the confirmation", async (t) => {
    if (skipReason || !web) {
      t.skip(skipReason ?? "web is not available");
      return;
    }
    const { context, origin, page, record } = await openContext(web);
    try {
      await page.goto(new URL("/feedback?lang=en", web.baseUrl).href, { waitUntil: "networkidle" });
      await page.locator("input[name=category][value=idea]").check();
      await page.locator("textarea[name=message]").fill("Fixture feedback from the browser suite.");
      await page.locator("input[name=email]").fill("browser-suite@example.test");
      await page.locator("select[name=rating]").selectOption("4");

      const [response] = await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle" }),
        page.locator("form button[type=submit]").click()
      ]);
      assert.ok(response && response.status() >= 200 && response.status() < 300, `unexpected status ${response?.status()}`);
      assert.equal(new URL(page.url()).origin, origin);
      assert.ok(record.requests.some((request) => request === "POST /feedback"), "the feedback form was not posted");
      assert.equal(await page.locator("form[action$='/feedback']").count(), 0, "the form is still shown after a valid submission");
      assert.ok((await page.locator("h1").count()) >= 1);
      assertCleanRoundTrip(record, "web feedback");
    } finally {
      await context.close();
    }
  });

  test("web: submitting the onboarding form shows the route summary", async (t) => {
    if (skipReason || !web) {
      t.skip(skipReason ?? "web is not available");
      return;
    }
    const { context, origin, page, record } = await openContext(web);
    try {
      await page.goto(new URL("/onboarding?lang=en", web.baseUrl).href, { waitUntil: "networkidle" });
      await page.locator("input[name=role][value=builder]").check();
      await page.locator("input[name=intent][value=leads]").check();

      const [response] = await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle" }),
        page.locator("form button[type=submit]").click()
      ]);
      assert.ok(response && response.status() >= 200 && response.status() < 300, `unexpected status ${response?.status()}`);
      assert.equal(new URL(page.url()).origin, origin);
      assert.ok(record.requests.some((request) => request === "POST /onboarding"), "the onboarding form was not posted");
      assert.ok((await page.locator("h1").count()) >= 1);
      assertCleanRoundTrip(record, "web onboarding");
    } finally {
      await context.close();
    }
  });
});
