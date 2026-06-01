import { describe, it } from "node:test";
import assert from "node:assert";
import { QuotaDO, QuotaExceededError, type QuotaState } from "../src/quota-do.js";

function makeQuota(overrides: Partial<QuotaState> = {}): QuotaDO {
  return new QuotaDO({
    tenant: "iai",
    workspaceId: "ws_001",
    unit: "run_count",
    used: 0,
    limit: 100,
    windowStart: Date.now(),
    ...overrides,
  });
}

describe("quota-do", () => {
  it("allows increment within limit", () => {
    const quota = makeQuota();
    const result = quota.increment(10);
    assert.strictEqual(result.used, 10);
  });

  it("rejects increment that would exceed limit", () => {
    const quota = makeQuota({ used: 95 });
    assert.throws(() => quota.increment(10), QuotaExceededError);
  });

  it("check returns allowed true when within limit", () => {
    const quota = makeQuota({ used: 50 });
    const check = quota.check(30);
    assert.strictEqual(check.allowed, true);
    assert.strictEqual(check.remaining, 50);
  });

  it("check returns allowed false when over limit", () => {
    const quota = makeQuota({ used: 90 });
    const check = quota.check(20);
    assert.strictEqual(check.allowed, false);
    assert.strictEqual(check.remaining, 10);
  });

  it("check returns allowed false at exact limit with zero remaining", () => {
    const quota = makeQuota({ used: 100 });
    const check = quota.check(1);
    assert.strictEqual(check.allowed, false);
    assert.strictEqual(check.remaining, 0);
  });

  it("getState returns immutable copy", () => {
    const quota = makeQuota({ used: 42 });
    const state = quota.getState();
    assert.strictEqual(state.used, 42);
    // Mutating returned object should not affect internal state
    (state as QuotaState).used = 999;
    assert.strictEqual(quota.getState().used, 42);
  });
});
