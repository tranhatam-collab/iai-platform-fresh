import assert from "node:assert/strict";
import test from "node:test";

import { renderCheckoutFromForm, renderNav, renderRoute } from "../../apps/noos-web/dist/render.js";

// These tests stay on routes that do not read the catalog fixtures (docs/noos/..., gitignored):
// the navigation shell, the not-found page and the legacy boundary redirect page.

const defaultBuyerId = "buyer_alpha001";

const payloads = [
  '" onmouseover="alert(1)',
  '"><script>alert(1)</script>',
  "' autofocus onfocus='alert(1)",
  "javascript:alert(1)//"
];

// Every <a ...> in the page may only carry the attributes the templates deliberately emit.
function assertAnchorsAreInert(html) {
  const allowed = new Set(["aria-current", "class", "href", "hreflang"]);

  for (const match of html.matchAll(/<a\s([^>]*)>/g)) {
    const attributeNames = [...match[1].matchAll(/([a-zA-Z-]+)=(?:"[^"]*"|'[^']*')/g)].map((entry) => entry[1]);
    for (const name of attributeNames) {
      assert.ok(allowed.has(name), `unexpected attribute ${name} on <a ${match[1]}>`);
    }
  }

  assert.doesNotMatch(html, /<script>alert\(1\)/);
  assert.doesNotMatch(html, /\sonmouseover=/i);
  assert.doesNotMatch(html, /\sonfocus=/i);
}

test("the library nav link URL-encodes and attribute-escapes whatever buyer id it is given", () => {
  for (const payload of payloads) {
    const html = renderNav("/products", payload, "en", "/products");

    const libraryLink = html.match(/<a href="([^"]*)">[^<]*<\/a>/g)?.find((link) => link.includes("/library"));
    assert.ok(libraryLink, "library link present");
    // encodeURIComponent leaves ' alone, so the attribute escape is what neutralises it.
    const expectedQuery = encodeURIComponent(payload).replaceAll("'", "&#39;");
    assert.ok(libraryLink.includes(`/library?buyer=${expectedQuery}`), libraryLink);
    assertAnchorsAreInert(html);
  }
});

test("a normal buyer id is still linked as-is", () => {
  const html = renderNav("/products", defaultBuyerId, "en", "/products");
  assert.ok(html.includes(`href="/library?buyer=${defaultBuyerId}"`));
});

test("a hostile ?buyer= value is dropped for the default buyer instead of reaching the page", async () => {
  for (const payload of payloads) {
    const response = await renderRoute("/en/this-route-does-not-exist", new URLSearchParams({ buyer: payload }));

    assert.equal(response.status, 404);
    assert.equal(response.contentType, "text/html; charset=utf-8");
    assertAnchorsAreInert(response.body);
    assert.ok(!response.body.includes(payload), "raw payload must not be reflected");
    assert.ok(response.body.includes(`/en/library?buyer=${defaultBuyerId}`));
  }
});

test("oversized and empty buyer ids fall back to the default buyer", async () => {
  for (const buyer of ["a".repeat(65), ""]) {
    const response = await renderRoute("/en/this-route-does-not-exist", new URLSearchParams({ buyer }));
    assert.ok(response.body.includes(`/en/library?buyer=${defaultBuyerId}`));
  }
});

test("real buyer ids keep working end to end", async () => {
  const response = await renderRoute("/vi/this-route-does-not-exist", new URLSearchParams({ buyer: "buyer_vnfield021" }));
  assert.ok(response.body.includes("/vi/library?buyer=buyer_vnfield021"));
});

test("the legacy boundary redirect page does not reflect hostile query values", async () => {
  const response = await renderRoute(
    "/en/investors",
    new URLSearchParams({ buyer: '" onmouseover="alert(1)', other: '"><script>alert(1)</script>' })
  );

  assert.equal(response.status, 308);
  assertAnchorsAreInert(response.body);
  assert.ok(!response.body.includes('"><script>'));
  assert.ok(!response.headers.location.includes('"'));
  assert.ok(!response.headers.location.includes("<"));
});

test("the checkout form handler resolves hostile buyer ids to the default buyer", async (t) => {
  let response;
  try {
    response = await renderCheckoutFromForm(
      new URLSearchParams({ buyer: '" onmouseover="alert(1)', product: "P11" }),
      "en"
    );
  } catch (error) {
    if (error?.code === "ENOENT") {
      t.skip("needs the gitignored docs/noos catalog fixtures");
      return;
    }
    throw error;
  }

  assertAnchorsAreInert(response.body ?? "");
  assert.ok(!(response.body ?? "").includes("onmouseover"));
});
