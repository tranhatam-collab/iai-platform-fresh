import { describe, it } from "node:test";
import assert from "node:assert";
import worker, { type Env } from "../src/worker.js";
import type { DurableObjectId } from "@cloudflare/workers-types";

function mockNamespace(): DurableObjectNamespace {
  const col = new Map<string, { used: number }>();
  const ns: any = {
    idFromName(name: string): DurableObjectId {
      return { toString: () => name, equals: () => false } as DurableObjectId;
    },
    get(id: DurableObjectId): any {
      const key = id.toString();
      return {
        async fetch(request: Request): Promise<Response> {
          const body = (await request.json()) as {
            action: "check" | "increment";
            tenant: string;
            workspaceId: string;
            amount?: number;
            limit?: number;
          };
          const limit = body.limit ?? 100;
          const amount = body.amount ?? 1;
          if (!col.has(key)) col.set(key, { used: 0 });
          const state = col.get(key)!;

          if (body.action === "increment") {
            if (state.used + amount > limit) {
              return Response.json({ error: "quota_exceeded" }, { status: 429 });
            }
            state.used += amount;
          }

          return Response.json({
            tenant: body.tenant,
            workspaceId: body.workspaceId,
            used: state.used,
            limit,
            remaining: limit - state.used,
            allowed: state.used + amount <= limit,
          });
        },
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
  return ns as unknown as DurableObjectNamespace;
}

function makeEnv(): Env {
  return {
    QUOTA_DO: mockNamespace(),
    USAGE_LEDGER_DB: undefined,
    USAGE_EVENTS_QUEUE: undefined,
  };
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
