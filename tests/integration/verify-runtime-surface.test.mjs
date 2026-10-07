/**
 * verify-runtime surface test
 *
 * Smoke-tests the runtime entry points without Cloudflare bindings.
 * Imports the built output (apps/verify-runtime/dist), like the other
 * integration tests, so run `pnpm --filter @iai/verify-runtime build` first.
 * The TypeScript sources cannot be imported directly: Node's strip-only mode
 * rejects constructs such as parameter properties.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { register } from "node:module";
import { before, describe, it } from "node:test";

const appRoot = new URL("../../apps/verify-runtime/", import.meta.url);
const dist = (file) => new URL(`dist/src/${file}`, appRoot);

// dist/src/index.js and dist/src/durable-object.js import `cloudflare:workers`,
// a module that only exists inside the Workers runtime. Resolve it to a tiny
// stand-in with the same constructor shape so Node can load the real entry
// points. The hook is self-contained (a data: URL) and scoped to this test
// process.
const durableObjectStub =
  "export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }";
register(
  `data:text/javascript,${encodeURIComponent(`
    export async function resolve(specifier, context, nextResolve) {
      if (specifier === "cloudflare:workers") {
        return {
          url: "data:text/javascript,${encodeURIComponent(durableObjectStub)}",
          shortCircuit: true
        };
      }
      return nextResolve(specifier, context);
    }
  `)}`
);

const tenantHeaders = { "x-iai-tenant": "iai" };

function memoryDurableObjectState() {
  const map = new Map();
  return {
    map,
    storage: {
      async get(key) {
        return map.has(key) ? structuredClone(map.get(key)) : undefined;
      },
      async put(key, value) {
        map.set(key, structuredClone(value));
      }
    }
  };
}

function quotaRequest(body) {
  return new Request("http://do/quota", { method: "POST", body: JSON.stringify(body) });
}

describe("verify-runtime surface", () => {
  before(() => {
    assert.ok(
      existsSync(dist("index.js")),
      "apps/verify-runtime/dist is missing: run `pnpm --filter @iai/verify-runtime build` first"
    );
  });

  it("package main/exports point at the built entry point", () => {
    const pkg = JSON.parse(readFileSync(new URL("package.json", appRoot), "utf8"));
    assert.equal(pkg.main, "./dist/src/index.js");
    assert.equal(pkg.exports["."].default, pkg.main);
    assert.ok(existsSync(new URL(pkg.main, appRoot)), "main entry exists after build");
    assert.ok(existsSync(new URL(pkg.exports["."].types, appRoot)), "type declarations exist after build");
  });

  it("index exports the worker, Durable Object and helpers", async () => {
    const mod = await import(dist("index.js").href);
    assert.equal(typeof mod.default.fetch, "function");
    assert.equal(typeof mod.default.queue, "function");
    assert.equal(mod.worker, mod.default);
    assert.equal(typeof mod.QuotaDurableObject, "function");
    assert.equal(typeof mod.QuotaDO, "function");
    assert.equal(typeof mod.resolveTenant, "function");
    assert.equal(typeof mod.validateUsageEvent, "function");
    assert.deepEqual([...mod.KNOWN_TENANTS], ["iai", "dsts", "nhachung", "muonnoi", "aal"]);
  });

  it("worker.js serves /health and rejects unknown routes", async () => {
    const { worker } = await import(dist("worker.js").href);
    const health = await worker.fetch(new Request("https://verify-runtime.iai.one/health"), {}, {});
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok", service: "verify-runtime" });

    const missing = await worker.fetch(new Request("https://verify-runtime.iai.one/nope"), {}, {});
    assert.equal(missing.status, 404);
  });

  it("worker.js rejects an invalid quota amount before touching the Durable Object", async () => {
    const { worker } = await import(dist("worker.js").href);
    const env = {
      QUOTA_DO: {
        idFromName() {
          throw new Error("Durable Object must not be addressed for an invalid request");
        }
      }
    };
    const res = await worker.fetch(
      new Request("https://verify-runtime.iai.one/quota/increment", {
        method: "POST",
        headers: tenantHeaders,
        body: JSON.stringify({ tenant: "iai", workspaceId: "ws_1", amount: -5 })
      }),
      env,
      {}
    );
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "invalid_amount");
  });

  it("quota-do.js enforces its limit", async () => {
    const { QuotaDO, QuotaExceededError } = await import(dist("quota-do.js").href);
    const quota = new QuotaDO({
      tenant: "iai",
      workspaceId: "ws_1",
      unit: "run_count",
      used: 0,
      limit: 2,
      windowStart: 0
    });
    assert.equal(quota.increment(2).used, 2);
    assert.throws(() => quota.increment(1), QuotaExceededError);
  });

  it("tenant-resolver.js resolves known tenants and rejects unknown ones", async () => {
    const { resolveTenant, isKnownTenant, TenantResolutionError } = await import(
      dist("tenant-resolver.js").href
    );
    const resolved = resolveTenant(new Request("https://x.example/health", { headers: tenantHeaders }));
    assert.deepEqual(resolved, { tenant: "iai", resolvedBy: "header" });
    assert.equal(isKnownTenant("aal"), true);
    assert.equal(isKnownTenant("evil"), false);
    assert.throws(
      () =>
        resolveTenant(new Request("https://x.example/health", { headers: { "x-iai-tenant": "evil" } })),
      TenantResolutionError
    );
  });

  it("durable-object.js exports a Durable Object that validates and counts", async () => {
    const { QuotaDurableObject } = await import(dist("durable-object.js").href);
    const state = memoryDurableObjectState();
    // The limit is server-side configuration (QUOTA_PLANS), never part of the request.
    const quota = new QuotaDurableObject({ storage: state.storage }, { QUOTA_PLANS: JSON.stringify({ default: { limit: 3 } }) });

    const base = { tenant: "iai", workspaceId: "ws_1" };
    const first = await quota.fetch(quotaRequest({ action: "increment", ...base, amount: 2, limit: 1_000_000 }));
    assert.equal(first.status, 200);
    assert.equal((await first.json()).used, 2);

    const negative = await quota.fetch(quotaRequest({ action: "increment", ...base, amount: -1 }));
    assert.equal(negative.status, 400);
    const text = await quota.fetch(quotaRequest({ action: "increment", ...base, amount: "abc" }));
    assert.equal(text.status, 400);
    assert.equal(state.map.get("quota_state").used, 2);

    const over = await quota.fetch(quotaRequest({ action: "increment", ...base, amount: 2 }));
    assert.equal(over.status, 429);
    assert.equal(state.map.get("quota_state").used, 2);
  });

  it("usage-emission.js validates events strictly", async () => {
    const { validateUsageEvent, emitUsageEvent, UsageEventValidationError } = await import(
      dist("usage-emission.js").href
    );
    const event = {
      event_id: "evt_surface_1",
      tenant: "iai",
      workspace_id: "ws_1",
      subject_id: "user_1",
      domain_surface: "flow.iai.one",
      event_type: "chat_run",
      usage_unit: "run_count",
      usage_amount: 1,
      source_object_id: "flow_1",
      occurred_at: "2026-01-31T09:30:00Z",
      environment: "development"
    };
    assert.equal(emitUsageEvent(event).event_id, "evt_surface_1");
    for (const bad of [
      { ...event, tenant: "evil" },
      { ...event, usage_amount: Infinity },
      { ...event, occurred_at: "not-a-date" }
    ]) {
      assert.throws(() => validateUsageEvent(bad), UsageEventValidationError);
    }
  });
});
