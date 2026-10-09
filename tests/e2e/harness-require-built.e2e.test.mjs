/**
 * skipUnlessBuilt decides whether a suite whose build is missing is skipped or fails.
 * Run: node --test tests/e2e/harness-require-built.e2e.test.mjs
 */
import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { skipUnlessBuilt } from "./support/harness.mjs";

const original = process.env.E2E_REQUIRE_BUILT;

afterEach(() => {
  if (original === undefined) {
    delete process.env.E2E_REQUIRE_BUILT;
  } else {
    process.env.E2E_REQUIRE_BUILT = original;
  }
});

describe("skipUnlessBuilt", () => {
  test("runs the suite when what it needs is built, whatever the switch says", () => {
    for (const value of [undefined, "0", "1"]) {
      if (value === undefined) {
        delete process.env.E2E_REQUIRE_BUILT;
      } else {
        process.env.E2E_REQUIRE_BUILT = value;
      }
      assert.equal(skipUnlessBuilt(true, "x not built"), false);
    }
  });

  test("skips with the message when the build is missing and the switch is off", () => {
    delete process.env.E2E_REQUIRE_BUILT;
    assert.equal(skipUnlessBuilt(false, "x not built"), "x not built");
    process.env.E2E_REQUIRE_BUILT = "0";
    assert.equal(skipUnlessBuilt(false, "x not built"), "x not built");
  });

  test("does not skip when the build is missing and E2E_REQUIRE_BUILT=1, so the suite fails", () => {
    process.env.E2E_REQUIRE_BUILT = "1";
    assert.equal(skipUnlessBuilt(false, "x not built"), false);
  });
});
