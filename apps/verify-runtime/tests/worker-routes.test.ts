import { describe, it, mock } from "node:test";
import assert from "node:assert";
import worker, { type Env } from "../src/worker.js";
import { handleQuotaRequest } from "../src/quota-handler.js";
import { MAX_QUOTA_AMOUNT } from "../src/request-validation.js";
import { createMockD1 } from "./mock-d1.js";
import type { DurableObjectId } from "@cloudflare/workers-types";

interface MockQuotaNamespace extends DurableObjectNamespace {
  /** Durable Object names the Worker addressed, in order. */
  addressed: string[];
  /** Persisted storage of each addressed Durable Object. */
  storages: Map<string, Map<string, unknown>>;
}

/**
 * Durable Object namespace backed by the real quota handler, so route tests
 * exercise the same request validation and counter logic as QuotaDurableObject
 * instead of a hand-written copy of its contract.
 */
function mockNamespace(): MockQuotaNamespace {
  const storages = new Map<string, Map<string, unknown>>();
  const addressed: string[] = [];
  const ns: any = {
    addressed,
    storages,
    idFromName(name: string): DurableObjectId {
      return { toString: () => name, equals: () => false } as DurableObjectId;
    },
    get(id: DurableObjectId): any {
      const key = id.toString();
      addressed.push(key);
      if (!storages.has(key)) storages.set(key, new Map());
      const map = storages.get(key)!;
      const storage = {
        async get<T>(k: string) {
          return map.has(k) ? (structuredClone(map.get(k)) as T) : undefined;
        },
        async put<T>(k: string, v: T) {
          map.set(k, structuredClone(v));
        },
      };
      return {
        fetch: (request: Request): Promise<Response> => handleQuotaRequest(storage, request),
      };
    },
    getByName(name: string): any {
      return this.get(this.idFromName(name));
    },
    newUniqueId(): DurableObjectId {
      return this.idFromName("u" + Math.random());
    },
    jurisdiction(): never {
      throw new Error("unsupported");
    },
    idFromString(): DurableObjectId {
      throw new Error("unsupported");
    },
  };
  return ns as MockQuotaNamespace;
}

function makeEnv(overrides: Partial<Env> = {}): Env & { QUOTA_DO: MockQuotaNamespace } {
  return {
    QUOTA_DO: mockNamespace(),
    USAGE_LEDGER_DB: undefined,
    USAGE_EVENTS_QUEUE: undefined,
    ...overrides,
  } as Env & { QUOTA_DO: MockQuotaNamespace };
}

function makeRequest(path: string, init?: RequestInit): Request {
  return new Request(new URL(path, "https://verify-runtime.iai.one"), init);
}

describe("worker routes", () => {
  it("GET /health returns ok without tenant headers", async () => {
    const req = makeRequest("/health");
    const resp = await (worker as any).fetch(req, makeEnv(), {} as any);
    assert.strictEqual(resp.status, 200);
    const json = (await resp.json()) as { status: string };
    assert.strictEqual(json.status, "ok");
  });

  it("GET /health includes tenant when headers present", async () => {
    const req = makeRequest("/health", { headers: { "x-iai-tenant": "iai" } });
    const resp = await (worker as any).fetch(req, makeEnv(), {} as any);
    assert.strictEqual(resp.status, 200);
    const json = (await resp.json()) as { status: string; tenant?: string };
    assert.strictEqual(json.status, "ok");
    assert.strictEqual(json.tenant, "iai");
  });

  it("POST /quota/check with matching tenant succeeds", async () => {
    const req = makeRequest("/quota/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-iai-tenant": "iai" },
      body: JSON.stringify({ tenant: "iai", workspaceId: "ws_a", limit: 10 }),
    });
    const resp = await (worker as any).fetch(req, makeEnv(), {} as any);
    assert.strictEqual(resp.status, 200);
    const json = (await resp.json()) as { allowed: boolean; remaining: number };
    assert.strictEqual(json.allowed, true);
    assert.strictEqual(json.remaining, 10);
  });

  it("POST /quota/check rejects tenant mismatch", async () => {
    const req = makeRequest("/quota/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-iai-tenant": "iai" },
      body: JSON.stringify({ tenant: "other", workspaceId: "ws_a" }),
    });
    const resp = await (worker as any).fetch(req, makeEnv(), {} as any);
    assert.strictEqual(resp.status, 403);
    const json = (await resp.json()) as { error: string };
    assert.strictEqual(json.error, "tenant_mismatch");
  });

  it("POST /quota/increment with matching tenant succeeds", async () => {
    const req = makeRequest("/quota/increment", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-iai-tenant": "iai" },
      body: JSON.stringify({ tenant: "iai", workspaceId: "ws_b", limit: 3 }),
    });
    const env = makeEnv();
    const resp = await (worker as any).fetch(req, env, {} as any);
    assert.strictEqual(resp.status, 200);
    const json = (await resp.json()) as { used: number };
    assert.strictEqual(json.used, 1);
  });

  it("POST /quota/increment rejects tenant spoof", async () => {
    const req = makeRequest("/quota/increment", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-iai-tenant": "dsts" },
      body: JSON.stringify({ tenant: "iai", workspaceId: "ws_c" }),
    });
    const resp = await (worker as any).fetch(req, makeEnv(), {} as any);
    assert.strictEqual(resp.status, 403);
    const json = (await resp.json()) as { error: string };
    assert.strictEqual(json.error, "tenant_mismatch");
  });

  it("POST /usage/emit with valid event returns validate-only", async () => {
    const event = {
      event_id: "evt_001",
      tenant: "iai",
      workspace_id: "ws_001",
      subject_id: "user_001",
      domain_surface: "flow.iai.one",
      event_type: "chat_run",
      usage_unit: "run_count",
      usage_amount: 1,
      source_object_id: "flow_001",
      occurred_at: new Date().toISOString(),
      environment: "development",
    };
    const req = makeRequest("/usage/emit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    const resp = await (worker as any).fetch(req, makeEnv(), {} as any);
    assert.strictEqual(resp.status, 200);
    const json = (await resp.json()) as { ok: boolean; channel: string };
    assert.strictEqual(json.ok, true);
    assert.strictEqual(json.channel, "validate-only");
  });

  it("POST /usage/emit rejects missing tenant field", async () => {
    const event = {
      event_id: "evt_002",
      workspace_id: "ws_001",
      subject_id: "user_001",
      domain_surface: "flow.iai.one",
      event_type: "chat_run",
      usage_unit: "run_count",
      usage_amount: 1,
      source_object_id: "flow_001",
      occurred_at: new Date().toISOString(),
      environment: "development",
      // missing tenant
    };
    const req = makeRequest("/usage/emit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    const resp = await (worker as any).fetch(req, makeEnv(), {} as any);
    assert.strictEqual(resp.status, 400);
  });
});

type Json = Record<string, any>;

/** POST a JSON body (or raw JSON text, to send values like 1e999) to the Worker. */
async function post(
  env: Env,
  path: string,
  body: unknown,
  headers: Record<string, string> = { "x-iai-tenant": "iai" }
): Promise<{ status: number; json: Json }> {
  const req = makeRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const resp = await (worker as any).fetch(req, env, {} as any);
  return { status: resp.status, json: (await resp.json()) as Json };
}

function makeUsageEvent(overrides: Json = {}): Json {
  return {
    event_id: "evt_100",
    tenant: "iai",
    workspace_id: "ws_001",
    subject_id: "user_001",
    domain_surface: "flow.iai.one",
    event_type: "chat_run",
    usage_unit: "run_count",
    usage_amount: 1,
    source_object_id: "flow_001",
    occurred_at: "2026-01-31T09:30:00.000Z",
    environment: "development",
    ...overrides,
  };
}

describe("worker routes: quota input validation", () => {
  it("rejects invalid amounts with 400, never reaches the DO, and leaves used unchanged", async () => {
    const env = makeEnv();
    const seeded = await post(env, "/quota/increment", {
      tenant: "iai",
      workspaceId: "ws_v",
      amount: 2,
      limit: 10,
    });
    assert.strictEqual(seeded.json.used, 2);
    const addressedBefore = env.QUOTA_DO.addressed.length;

    const bad = [
      "-5",
      "0",
      "1.5",
      '"abc"',
      '"5"',
      "null",
      "1e999",
      String(MAX_QUOTA_AMOUNT + 1),
      "9007199254740993",
    ];
    for (const amount of bad) {
      const raw = `{"tenant":"iai","workspaceId":"ws_v","amount":${amount}}`;
      for (const path of ["/quota/increment", "/quota/check"]) {
        const { status, json } = await post(env, path, raw);
        assert.strictEqual(status, 400, `${path} amount ${amount}`);
        assert.strictEqual(json.error, "invalid_amount", `${path} amount ${amount}`);
      }
    }
    assert.strictEqual(env.QUOTA_DO.addressed.length, addressedBefore);

    const check = await post(env, "/quota/check", { tenant: "iai", workspaceId: "ws_v" });
    assert.deepStrictEqual(check.json, { allowed: true, remaining: 8 });
    const stored = env.QUOTA_DO.storages.get("iai:ws_v")!.get("quota_state") as { used: number };
    assert.strictEqual(stored.used, 2);
  });

  it("rejects invalid limits with 400", async () => {
    const env = makeEnv();
    for (const limit of ["0", "-1", '"abc"', "1.5", "1e999", "null"]) {
      const { status, json } = await post(
        env,
        "/quota/increment",
        `{"tenant":"iai","workspaceId":"ws_l","limit":${limit}}`
      );
      assert.strictEqual(status, 400, `limit ${limit}`);
      assert.strictEqual(json.error, "invalid_limit", `limit ${limit}`);
    }
    assert.strictEqual(env.QUOTA_DO.addressed.length, 0);
  });

  it("increments up to the limit then returns 429", async () => {
    const env = makeEnv();
    const body = { tenant: "iai", workspaceId: "ws_cap", limit: 3 };
    for (let used = 1; used <= 3; used++) {
      const res = await post(env, "/quota/increment", body);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.json.used, used);
    }
    const over = await post(env, "/quota/increment", body);
    assert.strictEqual(over.status, 429);
    assert.strictEqual(over.json.error, "quota_exceeded");
    assert.strictEqual(over.json.used, 3);

    const check = await post(env, "/quota/check", { tenant: "iai", workspaceId: "ws_cap" });
    assert.deepStrictEqual(check.json, { allowed: false, remaining: 0 });
  });

  it("rejects a missing or blank workspaceId instead of using a shared bucket", async () => {
    const env = makeEnv();
    for (const path of ["/quota/increment", "/quota/check"]) {
      for (const body of [
        { tenant: "iai" },
        { tenant: "iai", workspaceId: null },
        { tenant: "iai", workspaceId: "" },
        { tenant: "iai", workspaceId: "  " },
        { tenant: "iai", workspaceId: 7 },
      ]) {
        const { status, json } = await post(env, path, body);
        assert.strictEqual(status, 400, `${path} ${JSON.stringify(body)}`);
        assert.strictEqual(json.error, "invalid_workspace_id");
      }
    }
    assert.deepStrictEqual(env.QUOTA_DO.addressed, []);
  });

  it("rejects a missing or non-string tenant with 400", async () => {
    const env = makeEnv();
    for (const body of [
      { workspaceId: "ws_t" },
      { tenant: "", workspaceId: "ws_t" },
      { tenant: 1, workspaceId: "ws_t" },
    ]) {
      const { status, json } = await post(env, "/quota/increment", body);
      assert.strictEqual(status, 400);
      assert.strictEqual(json.error, "invalid_tenant");
    }
    assert.deepStrictEqual(env.QUOTA_DO.addressed, []);
  });

  it("rejects malformed JSON and non-object bodies with 400", async () => {
    const env = makeEnv();
    assert.strictEqual((await post(env, "/quota/increment", "{oops")).json.error, "invalid_json");
    assert.strictEqual((await post(env, "/quota/increment", "[]")).json.error, "invalid_body");
    assert.strictEqual((await post(env, "/quota/check", "null")).status, 400);
  });
});

describe("worker routes: /usage/emit validation", () => {
  it("rejects a tenant that is not a known tenant", async () => {
    const d1 = createMockD1();
    const env = makeEnv({ USAGE_LEDGER_DB: d1.db });
    for (const tenant of ["evil", "IAI", "iai ", "__proto__", "iai:ws"]) {
      const { status, json } = await post(env, "/usage/emit", makeUsageEvent({ tenant }), {});
      assert.strictEqual(status, 400, `tenant ${JSON.stringify(tenant)}`);
      assert.match(json.error, /unknown tenant/);
    }
    assert.strictEqual(d1.rows.size, 0);
  });

  it("accepts every known tenant", async () => {
    for (const tenant of ["iai", "dsts", "nhachung", "muonnoi", "aal"]) {
      const { status } = await post(makeEnv(), "/usage/emit", makeUsageEvent({ tenant }), {});
      assert.strictEqual(status, 200, tenant);
    }
  });

  it("rejects Infinity and other non-finite usage_amount", async () => {
    const d1 = createMockD1();
    const env = makeEnv({ USAGE_LEDGER_DB: d1.db });
    const template = JSON.stringify(makeUsageEvent({ usage_amount: 0 }));
    for (const amount of ["1e999", "-1e999"]) {
      const raw = template.replace('"usage_amount":0', `"usage_amount":${amount}`);
      assert.ok(raw.includes(amount), "test setup: amount substituted");
      const { status } = await post(env, "/usage/emit", raw, {});
      assert.strictEqual(status, 400, amount);
    }
    for (const usage_amount of [null, "1", -1]) {
      const { status } = await post(env, "/usage/emit", makeUsageEvent({ usage_amount }), {});
      assert.strictEqual(status, 400, String(usage_amount));
    }
    assert.strictEqual(d1.rows.size, 0);
  });

  it("rejects garbage occurred_at values", async () => {
    const d1 = createMockD1();
    const env = makeEnv({ USAGE_LEDGER_DB: d1.db });
    const garbage = [
      "x",
      "not-a-date",
      "1",
      "0",
      "2026-01-31",
      "2026-01-31T09:30:00",
      "2026-02-31T09:30:00Z",
      "2026-13-01T09:30:00Z",
      "2026-01-31T25:00:00Z",
      "2026-01-31 09:30:00Z",
      "Infinity",
      "NaN",
      "9".repeat(40),
    ];
    for (const occurred_at of garbage) {
      const { status, json } = await post(env, "/usage/emit", makeUsageEvent({ occurred_at }), {});
      assert.strictEqual(status, 400, `occurred_at ${occurred_at}`);
      assert.match(json.error, /occurred_at/);
    }
    assert.strictEqual(d1.rows.size, 0);
  });

  it("rejects malformed JSON with 400", async () => {
    const { status, json } = await post(makeEnv(), "/usage/emit", "{oops", {});
    assert.strictEqual(status, 400);
    assert.strictEqual(json.error, "invalid_json");
  });

  it("stores a replayed usage event once", async () => {
    const d1 = createMockD1();
    const env = makeEnv({ USAGE_LEDGER_DB: d1.db });
    const event = makeUsageEvent({ event_id: "evt_replay" });

    for (let i = 0; i < 3; i++) {
      const { status, json } = await post(env, "/usage/emit", event, {});
      assert.strictEqual(status, 200);
      assert.deepStrictEqual(json, { ok: true, channel: "d1" });
    }
    assert.strictEqual(d1.rows.size, 1);
    assert.ok(d1.rows.has("evt_replay"));
  });

  it("sends validated events to the queue when bound", async () => {
    const sent: unknown[] = [];
    const queue = { send: async (message: unknown) => void sent.push(message) } as unknown as Queue;
    const env = makeEnv({ USAGE_EVENTS_QUEUE: queue });

    const ok = await post(env, "/usage/emit", makeUsageEvent(), {});
    assert.deepStrictEqual(ok.json, { ok: true, channel: "queue" });
    assert.strictEqual(sent.length, 1);

    const rejected = await post(env, "/usage/emit", makeUsageEvent({ tenant: "evil" }), {});
    assert.strictEqual(rejected.status, 400);
    assert.strictEqual(sent.length, 1);
  });
});

describe("worker queue consumer", () => {
  function makeBatch(bodies: unknown[]) {
    const acked: number[] = [];
    const retried: number[] = [];
    const messages = bodies.map((body, i) => ({
      id: `m${i}`,
      body,
      ack: () => void acked.push(i),
      retry: () => void retried.push(i),
    }));
    return {
      batch: { queue: "verify-usage-events", messages } as unknown as MessageBatch,
      acked,
      retried,
    };
  }

  async function consume(batch: MessageBatch, env: Env): Promise<void> {
    // Silence the consumer's expected warn/error logging.
    const warn = mock.method(console, "warn", () => {});
    const error = mock.method(console, "error", () => {});
    try {
      await (worker as any).queue(batch, env, {} as any);
    } finally {
      warn.mock.restore();
      error.mock.restore();
    }
  }

  it("inserts a redelivered event once and acks every delivery", async () => {
    const d1 = createMockD1();
    const env = makeEnv({ USAGE_LEDGER_DB: d1.db });
    const event = makeUsageEvent({ event_id: "evt_dup" });
    const { batch, acked, retried } = makeBatch([
      event,
      event,
      makeUsageEvent({ event_id: "evt_other" }),
    ]);

    await consume(batch, env);

    assert.strictEqual(d1.rows.size, 2);
    assert.deepStrictEqual(acked, [0, 1, 2]);
    assert.deepStrictEqual(retried, []);

    // A later redelivery of the same batch is also a no-op.
    const again = makeBatch([event]);
    await consume(again.batch, env);
    assert.strictEqual(d1.rows.size, 2);
    assert.deepStrictEqual(again.acked, [0]);
  });

  it("drops an invalid message without blocking the messages after it", async () => {
    const d1 = createMockD1();
    const env = makeEnv({ USAGE_LEDGER_DB: d1.db });
    const { batch, acked, retried } = makeBatch([
      makeUsageEvent({ event_id: "evt_a" }),
      makeUsageEvent({ event_id: "evt_poison", tenant: "evil" }),
      makeUsageEvent({ event_id: "evt_b", usage_amount: Infinity }),
      "not-an-object",
      makeUsageEvent({ event_id: "evt_c" }),
    ]);

    await consume(batch, env);

    assert.deepStrictEqual([...d1.rows.keys()].sort(), ["evt_a", "evt_c"]);
    assert.deepStrictEqual(acked, [0, 1, 2, 3, 4]);
    assert.deepStrictEqual(retried, []);
  });

  it("retries only the message whose D1 write failed", async () => {
    const d1 = createMockD1();
    const env = makeEnv({ USAGE_LEDGER_DB: d1.db });
    d1.failNext = new Error("D1 temporarily unavailable");
    const { batch, acked, retried } = makeBatch([
      makeUsageEvent({ event_id: "evt_x" }),
      makeUsageEvent({ event_id: "evt_y" }),
    ]);

    await consume(batch, env);

    assert.deepStrictEqual(retried, [0]);
    assert.deepStrictEqual(acked, [1]);
    assert.deepStrictEqual([...d1.rows.keys()], ["evt_y"]);
  });
});
