import { describe, it } from "node:test";
import assert from "node:assert";
import {
  QUOTA_STATE_KEY,
  handleQuotaRequest,
  type QuotaHandlerOptions,
  type QuotaStorage,
} from "../src/quota-handler.js";
import { DEFAULT_QUOTA_LIMIT, MAX_QUOTA_AMOUNT } from "../src/request-validation.js";
import { DEFAULT_QUOTA_PLAN, resolveQuotaPlan } from "../src/quota-plan.js";
import type { QuotaState } from "../src/quota-do.js";

/** Storage that, like Durable Object storage, never hands out shared references. */
function memoryStorage(
  plan: { limit?: number; windowMs?: number; now?: () => number } = {}
): QuotaStorage & { map: Map<string, unknown>; options: QuotaHandlerOptions } {
  const map = new Map<string, unknown>();
  const { now, ...tenantPlan } = plan;
  return {
    map,
    // Quota plans are server-side configuration: tests set them here, never in a request body.
    options: { plans: JSON.stringify({ default: tenantPlan }), now },
    async get<T>(key: string) {
      return map.has(key) ? (structuredClone(map.get(key)) as T) : undefined;
    },
    async put<T>(key: string, value: T) {
      map.set(key, structuredClone(value));
    },
  };
}

type Json = Record<string, unknown>;

/** `body` may be raw JSON text, to send values JSON.stringify cannot (1e999). */
async function call(
  storage: QuotaStorage,
  body: Json | string
): Promise<{ status: number; json: Json }> {
  const resp = await handleQuotaRequest(
    storage,
    new Request("http://do/quota", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    (storage as { options?: QuotaHandlerOptions }).options
  );
  return { status: resp.status, json: (await resp.json()) as Json };
}

const ids = { tenant: "iai", workspaceId: "ws_001" };

function storedState(storage: { map: Map<string, unknown> }): QuotaState | undefined {
  return storage.map.get(QUOTA_STATE_KEY) as QuotaState | undefined;
}

describe("quota handler: amount validation", () => {
  // Raw JSON fragments, so 1e999 (parsed to Infinity) and unsafe integers are covered.
  const badAmounts = [
    "-1",
    "-999999999",
    "0",
    "-0",
    "1.5",
    '"abc"',
    '"5"',
    '""',
    "null",
    "true",
    "[]",
    "{}",
    "1e999",
    "-1e999",
    "1e21",
    "9007199254740993",
    String(MAX_QUOTA_AMOUNT + 1),
  ];

  for (const action of ["increment", "check"] as const) {
    it(`${action} rejects invalid amounts with 400 and leaves used unchanged`, async () => {
      const storage = memoryStorage({ limit: 10 });
      const seeded = await call(storage, { action: "increment", ...ids, amount: 5 });
      assert.strictEqual(seeded.status, 200);

      for (const amount of badAmounts) {
        const { status, json } = await call(
          storage,
          `{"action":"${action}","tenant":"iai","workspaceId":"ws_001","amount":${amount}}`
        );
        assert.strictEqual(status, 400, `amount ${amount} should be rejected`);
        assert.strictEqual(json.error, "invalid_amount", `amount ${amount}`);
      }

      const state = storedState(storage)!;
      assert.strictEqual(state.used, 5);
      assert.strictEqual(typeof state.used, "number");
      assert.strictEqual(state.limit, 10);
    });
  }

  it("a non-numeric amount can no longer disable enforcement", async () => {
    // Regression: amount "abc" used to make used the string "0abc", after which
    // `used + amount > limit` was always false.
    const storage = memoryStorage({ limit: 2 });
    await call(storage, { action: "increment", ...ids, amount: "abc" });
    assert.strictEqual(storedState(storage), undefined);

    assert.strictEqual((await call(storage, { action: "increment", ...ids, amount: 1 })).status, 200);
    assert.strictEqual((await call(storage, { action: "increment", ...ids, amount: 1 })).status, 200);
    const over = await call(storage, { action: "increment", ...ids, amount: 1 });
    assert.strictEqual(over.status, 429);
    assert.strictEqual(over.json.error, "quota_exceeded");
  });

  it("a negative amount cannot grant quota", async () => {
    const storage = memoryStorage({ limit: 5 });
    await call(storage, { action: "increment", ...ids, amount: 3 });
    const res = await call(storage, { action: "increment", ...ids, amount: -1_000_000 });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(storedState(storage)!.used, 3);
  });

  it("defaults a missing amount to 1 and accepts the maximum amount", async () => {
    const storage = memoryStorage({ limit: MAX_QUOTA_AMOUNT });
    const first = await call(storage, { action: "increment", ...ids });
    assert.strictEqual(first.status, 200);
    assert.strictEqual(first.json.used, 1);

    const max = await call(storage, { action: "check", ...ids, amount: MAX_QUOTA_AMOUNT });
    assert.strictEqual(max.status, 200);
    assert.strictEqual(max.json.allowed, false);
  });
});

describe("quota handler: counting and limits", () => {
  it("increments up to the limit then returns 429 without changing used", async () => {
    const storage = memoryStorage({ limit: 3 });
    for (let expected = 1; expected <= 3; expected++) {
      const res = await call(storage, { action: "increment", ...ids });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.used, expected);
    }

    const over = await call(storage, { action: "increment", ...ids });
    assert.strictEqual(over.status, 429);
    assert.deepStrictEqual(over.json, { error: "quota_exceeded", used: 3, limit: 3 });
    assert.strictEqual(storedState(storage)!.used, 3);

    const check = await call(storage, { action: "check", ...ids });
    assert.deepStrictEqual(check.json, { allowed: false, remaining: 0 });
  });

  it("rejects an amount larger than the remaining quota but accepts the exact remainder", async () => {
    const storage = memoryStorage({ limit: 10 });
    await call(storage, { action: "increment", ...ids, amount: 7 });

    const tooMuch = await call(storage, { action: "increment", ...ids, amount: 4 });
    assert.strictEqual(tooMuch.status, 429);
    assert.strictEqual(storedState(storage)!.used, 7);

    const exact = await call(storage, { action: "increment", ...ids, amount: 3 });
    assert.strictEqual(exact.status, 200);
    assert.strictEqual(exact.json.used, 10);
  });

  it("check does not mutate used", async () => {
    const storage = memoryStorage({ limit: 10 });
    await call(storage, { action: "increment", ...ids, amount: 8 });

    const ok = await call(storage, { action: "check", ...ids, amount: 2 });
    assert.deepStrictEqual(ok.json, { allowed: true, remaining: 2 });
    const no = await call(storage, { action: "check", ...ids, amount: 3 });
    assert.deepStrictEqual(no.json, { allowed: false, remaining: 2 });
    assert.strictEqual(storedState(storage)!.used, 8);
  });

  it("getState returns the stored state", async () => {
    const storage = memoryStorage({ limit: 9 });
    await call(storage, { action: "increment", ...ids, amount: 2 });
    const { status, json } = await call(storage, { action: "getState", ...ids });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.tenant, "iai");
    assert.strictEqual(json.workspaceId, "ws_001");
    assert.strictEqual(json.used, 2);
    assert.strictEqual(json.limit, 9);
  });
});

describe("quota handler: limit source", () => {
  it("uses the default plan limit when the server configures none", async () => {
    const storage = memoryStorage();
    storage.options = {};
    const { json } = await call(storage, { action: "getState", ...ids });
    assert.strictEqual(json.limit, DEFAULT_QUOTA_LIMIT);
  });

  it("ignores a limit sent by the caller, on creation and afterwards", async () => {
    const storage = memoryStorage({ limit: 5 });
    const created = await call(storage, { action: "getState", ...ids, limit: 1_000_000 });
    assert.strictEqual(created.json.limit, 5);

    for (const limit of [1_000_000, 0, -1, "abc", null]) {
      const res = await call(storage, { action: "increment", ...ids, amount: 6, limit });
      assert.strictEqual(res.status, 429, `limit ${String(limit)}`);
    }
    assert.strictEqual(storedState(storage)!.limit, 5);
    assert.strictEqual(storedState(storage)!.used, 0);
  });

  it("applies a changed server-side plan to an existing quota without losing usage", async () => {
    const storage = memoryStorage({ limit: 10 });
    await call(storage, { action: "increment", ...ids, amount: 4 });
    storage.options = { plans: JSON.stringify({ default: { limit: 6 } }) };
    const { json } = await call(storage, { action: "getState", ...ids });
    assert.strictEqual(json.limit, 6);
    assert.strictEqual(json.used, 4);
  });

  it("resolves plans per tenant with a default fallback and ignores malformed config", () => {
    const plans = JSON.stringify({ default: { limit: 7 }, dsts: { limit: 20, windowMs: 1000 } });
    assert.deepStrictEqual(resolveQuotaPlan("iai", plans), { limit: 7, windowMs: DEFAULT_QUOTA_PLAN.windowMs });
    assert.deepStrictEqual(resolveQuotaPlan("dsts", plans), { limit: 20, windowMs: 1000 });
    for (const bad of [undefined, "", "not json", "[]", "null", '{"default":{"limit":-1,"windowMs":"x"}}']) {
      assert.deepStrictEqual(resolveQuotaPlan("iai", bad), { ...DEFAULT_QUOTA_PLAN }, String(bad));
    }
    assert.deepStrictEqual(resolveQuotaPlan("__proto__", plans), resolveQuotaPlan("iai", plans));
  });
});

describe("quota handler: usage window", () => {
  const DAY = 24 * 60 * 60 * 1000;

  it("resets used and starts a new window once the window has elapsed", async () => {
    let clock = 1_000_000;
    const storage = memoryStorage({ limit: 3, windowMs: DAY, now: () => clock });
    for (let i = 0; i < 3; i++) assert.strictEqual((await call(storage, { action: "increment", ...ids })).status, 200);
    assert.strictEqual((await call(storage, { action: "increment", ...ids })).status, 429);

    clock += DAY - 1;
    assert.strictEqual((await call(storage, { action: "increment", ...ids })).status, 429, "still inside the window");

    clock += 1;
    const next = await call(storage, { action: "increment", ...ids });
    assert.strictEqual(next.status, 200);
    assert.strictEqual(next.json.used, 1);
    assert.strictEqual(next.json.windowStart, clock);
    assert.strictEqual(storedState(storage)!.windowStart, clock);
  });

  it("check and getState also see the fresh window", async () => {
    let clock = 5_000;
    const storage = memoryStorage({ limit: 2, windowMs: DAY, now: () => clock });
    await call(storage, { action: "increment", ...ids, amount: 2 });
    assert.deepStrictEqual((await call(storage, { action: "check", ...ids })).json, { allowed: false, remaining: 0 });

    clock += 3 * DAY;
    assert.deepStrictEqual((await call(storage, { action: "check", ...ids })).json, { allowed: true, remaining: 2 });
    assert.strictEqual((await call(storage, { action: "getState", ...ids })).json.used, 0);
  });

  it("does not reset when the clock moves backwards", async () => {
    let clock = 10 * DAY;
    const storage = memoryStorage({ limit: 1, windowMs: DAY, now: () => clock });
    await call(storage, { action: "increment", ...ids });
    clock -= 5 * DAY;
    assert.strictEqual((await call(storage, { action: "increment", ...ids })).status, 429);
  });
});

describe("quota handler: request shape", () => {
  const badIdentifiers: Array<[string, unknown]> = [
    ["missing", undefined],
    ["null", null],
    ["number", 42],
    ["empty", ""],
    ["whitespace", "   "],
    ["too long", "x".repeat(129)],
  ];

  for (const [label, value] of badIdentifiers) {
    it(`rejects ${label} workspaceId`, async () => {
      const storage = memoryStorage();
      const { status, json } = await call(storage, {
        action: "increment",
        tenant: "iai",
        ...(value === undefined ? {} : { workspaceId: value }),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(json.error, "invalid_workspace_id");
      assert.strictEqual(storedState(storage), undefined);
    });

    it(`rejects ${label} tenant`, async () => {
      const storage = memoryStorage();
      const { status, json } = await call(storage, {
        action: "increment",
        workspaceId: "ws_001",
        ...(value === undefined ? {} : { tenant: value }),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(json.error, "invalid_tenant");
      assert.strictEqual(storedState(storage), undefined);
    });
  }

  it("rejects malformed JSON, non-object bodies and unknown actions", async () => {
    const storage = memoryStorage();
    assert.strictEqual((await call(storage, "{not json")).json.error, "invalid_json");
    assert.strictEqual((await call(storage, "[1,2]")).json.error, "invalid_body");
    assert.strictEqual((await call(storage, "null")).json.error, "invalid_body");
    const unknown = await call(storage, { action: "reset", ...ids });
    assert.strictEqual(unknown.status, 400);
    assert.strictEqual(unknown.json.error, "unknown_action");
    assert.strictEqual((await call(storage, { ...ids })).json.error, "unknown_action");
    assert.strictEqual(storedState(storage), undefined);
  });
});
