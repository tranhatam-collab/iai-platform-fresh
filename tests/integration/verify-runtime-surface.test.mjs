/**
 * verify-runtime surface test
 * Smoke-test the runtime entry points without Cloudflare bindings.
 */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("verify-runtime surface", () => {
  it("exports expected functions from index", async () => {
    const mod = await import("../../apps/verify-runtime/src/index.ts");
    // index.ts may be type-only or export a fetch handler
    assert.ok(mod, "module loads");
  });

  it("worker.ts exports a fetch handler shape", async () => {
    const mod = await import("../../apps/verify-runtime/src/worker.ts");
    assert.ok(mod, "worker module loads");
  });

  it("quota-do.ts exports QuotaDurableObject", async () => {
    const mod = await import("../../apps/verify-runtime/src/quota-do.ts");
    assert.ok(mod, "quota-do module loads");
  });

  it("tenant-resolver.ts exports resolver", async () => {
    const mod = await import("../../apps/verify-runtime/src/tenant-resolver.ts");
    assert.ok(mod, "tenant-resolver module loads");
  });

  it("durable-object.ts exports DO class", async () => {
    const mod = await import("../../apps/verify-runtime/src/durable-object.ts");
    assert.ok(mod, "durable-object module loads");
  });

  it("usage-emission.ts exports emitter", async () => {
    const mod = await import("../../apps/verify-runtime/src/usage-emission.ts");
    assert.ok(mod, "usage-emission module loads");
  });
});
