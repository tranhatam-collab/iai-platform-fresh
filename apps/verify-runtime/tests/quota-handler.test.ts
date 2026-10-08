import { describe, it } from "node:test";
import assert from "node:assert";
import {
  QUOTA_STATE_KEY,
  handleQuotaRequest,
  type QuotaStorage,
} from "../src/quota-handler.js";
import {
  DEFAULT_QUOTA_LIMIT,
  MAX_QUOTA_AMOUNT,
  MAX_QUOTA_LIMIT,
} from "../src/request-validation.js";
import type { QuotaState } from "../src/quota-do.js";

/** Storage that, like Durable Object storage, never hands out shared references. */
function memoryStorage(): QuotaStorage & { map: Map<string, unknown> } {
  const map = new Map<string, unknown>();
  return {
    map,
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
    })
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
      const storage = memoryStorage();
      const seeded = await call(storage, { action: "increment", ...ids, amount: 5, limit: 10 });
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
    const storage = memoryStorage();
    await call(storage, { action: "increment", ...ids, amount: "abc", limit: 2 });
    assert.strictEqual(storedState(storage), undefined);

    assert.strictEqual((await call(storage, { action: "increment", ...ids, amount: 1, limit: 2 })).status, 200);
    assert.strictEqual((await call(storage, { action: "increment", ...ids, amount: 1 })).status, 200);
    const over = await call(storage, { action: "increment", ...ids, amount: 1 });
    assert.strictEqual(over.status, 429);
    assert.strictEqual(over.json.error, "quota_exceeded");
  });

  it("a negative amount cannot grant quota", async () => {
    const storage = memoryStorage();
    await call(storage, { action: "increment", ...ids, amount: 3, limit: 5 });
    const res = await call(storage, { action: "increment", ...ids, amount: -1_000_000 });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(storedState(storage)!.used, 3);
  });

  it("defaults a missing amount to 1 and accepts the maximum amount", async () => {
    const storage = memoryStorage();
    const first = await call(storage, { action: "increment", ...ids, limit: MAX_QUOTA_AMOUNT });
    assert.strictEqual(first.status, 200);
    assert.strictEqual(first.json.used, 1);

    const max = await call(storage, { action: "check", ...ids, amount: MAX_QUOTA_AMOUNT });
    assert.strictEqual(max.status, 200);
    assert.strictEqual(max.json.allowed, false);
  });
});

describe("quota handler: counting and limits", () => {
  it("increments up to the limit then returns 429 without changing used", async () => {
    const storage = memoryStorage();
    for (let expected = 1; expected <= 3; expected++) {
      const res = await call(storage, { action: "increment", ...ids, limit: 3 });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.used, expected);
    }

    const over = await call(storage, { action: "increment", ...ids, limit: 3 });
    assert.strictEqual(over.status, 429);
    assert.deepStrictEqual(over.json, { error: "quota_exceeded", used: 3, limit: 3 });
    assert.strictEqual(storedState(storage)!.used, 3);

    const check = await call(storage, { action: "check", ...ids });
    assert.deepStrictEqual(check.json, { allowed: false, remaining: 0 });
  });

  it("rejects an amount larger than the remaining quota but accepts the exact remainder", async () => {
    const storage = memoryStorage();
    await call(storage, { action: "increment", ...ids, amount: 7, limit: 10 });

    const tooMuch = await call(storage, { action: "increment", ...ids, amount: 4 });
    assert.strictEqual(tooMuch.status, 429);
    assert.strictEqual(storedState(storage)!.used, 7);

    const exact = await call(storage, { action: "increment", ...ids, amount: 3 });
    assert.strictEqual(exact.status, 200);
    assert.strictEqual(exact.json.used, 10);
  });

  it("check does not mutate used", async () => {
    const storage = memoryStorage();
    await call(storage, { action: "increment", ...ids, amount: 8, limit: 10 });

    const ok = await call(storage, { action: "check", ...ids, amount: 2 });
    assert.deepStrictEqual(ok.json, { allowed: true, remaining: 2 });
    const no = await call(storage, { action: "check", ...ids, amount: 3 });
    assert.deepStrictEqual(no.json, { allowed: false, remaining: 2 });
    assert.strictEqual(storedState(storage)!.used, 8);
  });

  it("getState returns the stored state", async () => {
    const storage = memoryStorage();
    await call(storage, { action: "increment", ...ids, amount: 2, limit: 9 });
    const { status, json } = await call(storage, { action: "getState", ...ids });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.tenant, "iai");
    assert.strictEqual(json.workspaceId, "ws_001");
    assert.strictEqual(json.used, 2);
    assert.strictEqual(json.limit, 9);
  });
});

describe("quota handler: limit validation", () => {
  const badLimits = [
    "0",
    "-1",
    "1.5",
    '"abc"',
    '"100"',
    "null",
    "true",
    "1e999",
    "-1e999",
    String(MAX_QUOTA_LIMIT + 1),
  ];

  it("rejects invalid limits with 400 and does not create a quota", async () => {
    const storage = memoryStorage();
    for (const limit of badLimits) {
      const { status, json } = await call(
        storage,
        `{"action":"getState","tenant":"iai","workspaceId":"ws_001","limit":${limit}}`
      );
      assert.strictEqual(status, 400, `limit ${limit} should be rejected`);
      assert.strictEqual(json.error, "invalid_limit", `limit ${limit}`);
    }
    assert.strictEqual(storedState(storage), undefined);
  });

  it("still rejects an invalid limit once the quota exists", async () => {
    const storage = memoryStorage();
    await call(storage, { action: "getState", ...ids, limit: 5 });
    const res = await call(storage, { action: "increment", ...ids, limit: -5 });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(storedState(storage)!.limit, 5);
  });

  it("uses the default limit when none is supplied", async () => {
    const storage = memoryStorage();
    const { json } = await call(storage, { action: "getState", ...ids });
    assert.strictEqual(json.limit, DEFAULT_QUOTA_LIMIT);
  });

  it("accepts the maximum limit", async () => {
    const storage = memoryStorage();
    const { status, json } = await call(storage, { action: "getState", ...ids, limit: MAX_QUOTA_LIMIT });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.limit, MAX_QUOTA_LIMIT);
  });

  it("fixes the limit at creation: a later caller cannot raise it", async () => {
    const storage = memoryStorage();
    await call(storage, { action: "getState", ...ids, limit: 5 });
    const later = await call(storage, { action: "increment", ...ids, amount: 6, limit: 1_000_000 });
    assert.strictEqual(later.status, 429);
    assert.strictEqual(storedState(storage)!.limit, 5);
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
