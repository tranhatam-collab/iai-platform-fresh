/**
 * Real-browser contract for every *.iai.one surface that can start from its built
 * output without private fixtures. Each surface is started by the shared harness,
 * opened in headless Chromium and checked for: a 2xx page, no console errors or
 * uncaught exceptions, no requests leaving the local test server, and the basic
 * accessibility landmarks a screen reader needs (lang, title, one h1, main
 * landmark, alt text, labelled form fields).
 *
 * Needs: `pnpm build`, `npm ci` in this folder, and a Chromium that matches the
 * pinned playwright-core (PLAYWRIGHT_BROWSERS_PATH, as set in CI and the sandbox).
 * Set E2E_BROWSER_REQUIRE=1 to fail instead of skip when no browser is available.
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { SURFACES, builtEntryAvailable, docsFixturesAvailable, startMailApi, startService } from "../support/harness.mjs";

const REQUIRE = process.env.E2E_BROWSER_REQUIRE === "1";

let chromium = null;
let browser = null;
let skipReason = null;
let mailApi = null;

before(async () => {
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
  if (SURFACES.some((surface) => surface.requiresMailApi || surface.mailApiEnv)) {
    mailApi = await startMailApi();
  }
});

after(async () => {
  await browser?.close();
  await mailApi?.stop();
});

async function inspectPage(page, url) {
  return page.evaluate(() => {
    const textOf = (el) => (el.textContent ?? "").trim();
    const labelled = (el) =>
      Boolean(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.title || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest("label"));
    const fields = [...document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea")];
    return {
      lang: document.documentElement.lang,
      title: document.title.trim(),
      h1: [...document.querySelectorAll("h1")].filter((el) => textOf(el)).length,
      main: document.querySelectorAll("main, [role=main]").length,
      imagesWithoutAlt: [...document.querySelectorAll("img")].filter((el) => !el.hasAttribute("alt")).length,
      unlabelledFields: fields.filter((el) => !labelled(el)).length,
      bodyText: textOf(document.body).length
    };
  });
}

for (const surface of SURFACES) {
  describe(`browser: ${surface.name} (${surface.domain})`, () => {
    let service = null;
    let skip = false;

    before(async () => {
      if (!browser || !builtEntryAvailable(surface.entry) || (surface.requiresDocsFixtures && !docsFixturesAvailable())) {
        skip = true;
        return;
      }
      const env = surface.mailApiEnv && mailApi ? { [surface.mailApiEnv]: mailApi.baseUrl } : {};
      service = await startService({ ...surface, env });
    });

    after(async () => {
      await service?.stop();
    });

    test("renders cleanly and meets the basic accessibility landmarks", async (t) => {
      if (skip) {
        t.skip(skipReason ?? `${surface.name}: built output or private fixtures unavailable`);
        return;
      }
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      const external = [];
      page.on("console", (message) => message.type() === "error" && consoleErrors.push(message.text()));
      page.on("pageerror", (error) => pageErrors.push(error.message));
      const origin = new URL(service.baseUrl).origin;
      await context.route("**/*", (route) => {
        const target = new URL(route.request().url());
        if (target.origin === origin || target.protocol === "data:") {
          return route.continue();
        }
        external.push(`${route.request().method()} ${target.origin}${target.pathname}`);
        return route.abort();
      });

      const response = await page.goto(new URL(surface.htmlPath ?? "/", service.baseUrl).href, { waitUntil: "networkidle" });
      assert.ok(response && response.status() >= 200 && response.status() < 300, `unexpected status ${response?.status()}`);

      const facts = await inspectPage(page);
      await context.close();

      assert.deepEqual(pageErrors, [], "uncaught page exceptions");
      assert.deepEqual(consoleErrors, [], "console errors");
      assert.deepEqual(external, [], "page requested resources outside its own origin");
      assert.ok(facts.bodyText > 0, "page rendered no visible text");
      assert.ok(facts.lang, "<html lang> is missing");
      assert.ok(facts.title, "<title> is empty");
      assert.equal(facts.h1, 1, `expected exactly one non-empty <h1>, found ${facts.h1}`);
      assert.ok(facts.main >= 1, "no <main> landmark");
      assert.equal(facts.imagesWithoutAlt, 0, "images without alt attribute");
      assert.equal(facts.unlabelledFields, 0, "form fields without an accessible label");
    });
  });
}
