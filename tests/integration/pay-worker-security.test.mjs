import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import security from "../../pay.iai.one/src/lib/payment-security.ts";

const {
  authorizeOperator,
  checkoutUrlsMatchSiteOrigin,
  requiresOperatorAuthorization
} = security;

test("legacy public checkout route is retired in the worker contract", async () => {
  const source = await readFile(new URL("../../pay.iai.one/src/index.ts", import.meta.url), "utf8");
  assert.match(source, /path === "\/v1\/checkout\/sessions"/);
  assert.match(source, /code: "ROUTE_RETIRED"/);
  assert.match(source, /\b410\b/);
});

test("sensitive payment routes require operator authorization", () => {
  assert.equal(requiresOperatorAuthorization("/v1/payments/search", "GET"), true);
  assert.equal(requiresOperatorAuthorization("/v1/finance/drilldown", "GET"), true);
  assert.equal(requiresOperatorAuthorization("/v1/providers/payos/confirm-webhook", "POST"), true);
  assert.equal(requiresOperatorAuthorization("/health", "GET"), false);
});

test("operator auth fails closed and rejects missing or invalid keys", async () => {
  assert.deepEqual(await authorizeOperator(new Headers(), undefined), {
    ok: false,
    status: 503,
    code: "OPERATOR_AUTH_NOT_CONFIGURED"
  });
  assert.deepEqual(await authorizeOperator(new Headers(), "operator-test-secret"), {
    ok: false,
    status: 401,
    code: "OPERATOR_AUTH_REQUIRED"
  });
  assert.deepEqual(
    await authorizeOperator(new Headers({ "x-operator-key": "invalid" }), "operator-test-secret"),
    { ok: false, status: 403, code: "OPERATOR_AUTH_INVALID" }
  );
  assert.deepEqual(
    await authorizeOperator(new Headers({ "x-operator-key": "operator-test-secret" }), "operator-test-secret"),
    { ok: true }
  );
});

test("checkout redirects and callbacks must remain on the registered merchant origin", () => {
  assert.equal(
    checkoutUrlsMatchSiteOrigin(
      {
        success_url: "https://computer.iai.one/thank-you",
        cancel_url: "https://computer.iai.one/pricing",
        callback_url: "https://computer.iai.one/api/payment-callback"
      },
      "https://computer.iai.one"
    ),
    true
  );
  assert.equal(
    checkoutUrlsMatchSiteOrigin(
      {
        success_url: "https://computer.iai.one/thank-you",
        cancel_url: "https://attacker.example/collect"
      },
      "https://computer.iai.one"
    ),
    false
  );
});
