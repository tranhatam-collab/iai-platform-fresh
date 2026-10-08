/**
 * noos-web surface test
 * Verifies the built renderRoute export. (apps/noos-web/dist/server.js binds a
 * port on import, so the running server is covered by tests/e2e instead.)
 */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("noos-web surface", () => {
  it("exports renderRoute", async () => {
    const mod = await import("../../apps/noos-web/dist/index.js");
    assert.equal(typeof mod.renderRoute, "function", "renderRoute exported");
  });
});
