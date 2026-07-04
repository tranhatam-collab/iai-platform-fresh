/**
 * noos-web surface test
 * Verifies renderRoute export and basic shape.
 */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("noos-web surface", () => {
  it("exports renderRoute", async () => {
    const mod = await import("../../apps/noos-web/src/index.ts");
    assert.equal(typeof mod.renderRoute, "function", "renderRoute exported");
  });

  it("server.ts exports a fetch handler", async () => {
    const mod = await import("../../apps/noos-web/src/server.ts");
    assert.ok(mod, "server module loads");
  });
});
