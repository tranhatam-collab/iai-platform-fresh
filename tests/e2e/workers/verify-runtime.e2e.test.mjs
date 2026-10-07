/**
 * Process-level E2E for the verify-runtime Worker (tenant resolution, Durable Object quota,
 * D1 usage ledger, usage-events queue) under `wrangler dev --local`.
 *
 * The committed wrangler.toml carries placeholder D1/queue ids, so each boot uses a derived,
 * local-only copy of it (see support/wrangler.mjs); the original file is never touched.
 * Three variants cover the three /usage/emit channels: queue (full config), d1 (queue binding
 * removed) and validate-only (no queue, no database).
 *
 * Needs: `npm ci` in tests/e2e/workers (Node >= 22). Skips with a reason when wrangler/workerd
 * cannot run; set E2E_WORKERS_REQUIRE=1 to make that a failure instead.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { request } from "../support/harness.mjs";
import { requestWithHost } from "./support/http.mjs";
import { startWorker, workerRuntimeSkipReason } from "./support/wrangler.mjs";

const skip = workerRuntimeSkipReason();
const KNOWN_TENANTS = ["iai", "dsts", "nhachung", "muonnoi", "aal"];

const boot = (name, transform, { migrate = true, persistDir } = {}) =>
  startWorker({ name, dir: "apps/verify-runtime", config: "wrangler.toml", transform, persistDir, migrations: migrate ? { database: "USAGE_LEDGER_DB" } : undefined, readyPath: "/health" });

let sequence = 0;
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${(sequence += 1)}`;

const usageEvent = (overrides = {}) => ({
  event_id: uid("evt"),
  tenant: "iai",
  workspace_id: "ws-usage",
  subject_id: "user-1",
  domain_surface: "chat",
  event_type: "chat_run",
  usage_unit: "run_count",
  usage_amount: 1,
  source_object_id: "obj-1",
  occurred_at: "2026-02-03T04:05:06.000Z",
  environment: "development",
  ...overrides
});

describe("verify-runtime Worker", { skip }, () => {
  let full; // DO + D1 + queue
  let d1Only; // DO + D1
  let bare; // DO only
  let restartPersist;

  before(async () => {
    restartPersist = mkdtempSync(path.join(tmpdir(), "iai-e2e-verify-restart-"));
    [full, d1Only, bare] = await Promise.all([
      boot("verify-full"),
      boot("verify-d1", (cfg) => {
        delete cfg.queues;
      }),
      boot(
        "verify-bare",
        (cfg) => {
          delete cfg.queues;
          delete cfg.d1_databases;
        },
        { migrate: false }
      )
    ]);
  }, { timeout: 150_000 });
  after(async () => {
    await Promise.all([full?.stop(), d1Only?.stop(), bare?.stop()]);
    rmSync(restartPersist, { recursive: true, force: true });
  });

  const post = (worker, route, body, headers = {}) =>
    request(worker.baseUrl, route, { method: "POST", headers: { "content-type": "application/json", "x-iai-tenant": "iai", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
  const quota = (route, body, headers) => post(full, `/quota/${route}`, body, headers);
  const ledgerRows = (worker, where = "1 = 1") => worker.d1.query(`SELECT * FROM usage_events WHERE ${where} ORDER BY id`);

  describe("tenant resolution", () => {
    test("GET /health works without any tenant hint and reports no tenant", async () => {
      const response = await request(full.baseUrl, "/health");
      assert.equal(response.status, 200);
      assert.deepEqual(response.json, { status: "ok", service: "verify-runtime" });
    });

    test("x-iai-tenant resolves a known tenant (trimmed, case-insensitive)", async () => {
      const response = await request(full.baseUrl, "/health", { headers: { "x-iai-tenant": "  DSTS " } });
      assert.deepEqual({ tenant: response.json.tenant, resolvedBy: response.json.resolvedBy }, { tenant: "dsts", resolvedBy: "header" });
    });

    for (const tenant of KNOWN_TENANTS) {
      test(`Host ${tenant}.verify-runtime.iai.one resolves tenant ${tenant} by host`, async () => {
        const response = await requestWithHost(full.baseUrl, `${tenant}.verify-runtime.iai.one`, "/health");
        assert.equal(response.status, 200);
        assert.deepEqual({ tenant: response.json.tenant, resolvedBy: response.json.resolvedBy }, { tenant, resolvedBy: "host" });
      });
    }

    test("the header takes precedence over the host", async () => {
      const response = await requestWithHost(full.baseUrl, "nhachung.verify-runtime.iai.one", "/health", { headers: { "x-iai-tenant": "iai" } });
      assert.deepEqual({ tenant: response.json.tenant, resolvedBy: response.json.resolvedBy }, { tenant: "iai", resolvedBy: "header" });
    });

    test("unknown tenants are never resolved: /health stays up, quota routes answer 403 (no default tenant)", async () => {
      const unknownHost = await requestWithHost(full.baseUrl, "stranger.verify-runtime.iai.one", "/health");
      assert.equal(unknownHost.status, 200);
      assert.equal(unknownHost.json.tenant, undefined);

      const body = { tenant: "stranger", workspaceId: "ws-x", limit: 5 };
      const viaHeader = await quota("check", body, { "x-iai-tenant": "stranger" });
      assert.equal(viaHeader.status, 403);
      assert.match(viaHeader.json.error, /Tenant resolution failed/);

      const noHint = await request(full.baseUrl, "/quota/increment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      assert.equal(noHint.status, 403);
      assert.match(noHint.json.error, /Tenant resolution failed/);
    });

    test("a request whose body.tenant differs from the resolved tenant is refused with tenant_mismatch (403)", async () => {
      for (const route of ["check", "increment"]) {
        for (const bodyTenant of ["dsts", "stranger"]) {
          const response = await quota(route, { tenant: bodyTenant, workspaceId: "ws-mismatch", limit: 5 }, { "x-iai-tenant": "iai" });
          assert.equal(response.status, 403, `${route} body.tenant=${bodyTenant}`);
          assert.equal(response.json.error, "tenant_mismatch");
          assert.equal(response.json.resolved, "iai");
        }
        // a body without a tenant is invalid input (400), not a mismatch
        const missing = await quota(route, { workspaceId: "ws-mismatch", limit: 5 }, { "x-iai-tenant": "iai" });
        assert.equal(missing.status, 400, `${route} without body.tenant`);
      }
      // nothing was counted for the refused requests
      const check = await quota("check", { tenant: "iai", workspaceId: "ws-mismatch", limit: 5 });
      assert.deepEqual(check.json, { allowed: true, remaining: 5 });
    });

    test("host-resolved tenants are enforced the same way", async () => {
      const response = await requestWithHost(full.baseUrl, "aal.verify-runtime.iai.one", "/quota/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenant: "iai", workspaceId: "ws-host", limit: 5 })
      });
      assert.equal(response.status, 403);
      assert.equal(response.json.error, "tenant_mismatch");
      assert.equal(response.json.resolved, "aal");
    });
  });

  describe("quota (Durable Object)", () => {
    test("check reports remaining quota and never consumes it", async () => {
      const workspaceId = uid("ws-check");
      const first = await quota("check", { tenant: "iai", workspaceId, amount: 1, limit: 5 });
      assert.equal(first.status, 200);
      assert.deepEqual(first.json, { allowed: true, remaining: 5 });
      const again = await quota("check", { tenant: "iai", workspaceId, amount: 1, limit: 5 });
      assert.deepEqual(again.json, { allowed: true, remaining: 5 });
      const tooMuch = await quota("check", { tenant: "iai", workspaceId, amount: 6, limit: 5 });
      assert.deepEqual(tooMuch.json, { allowed: false, remaining: 5 });
    });

    test("increment counts up to the limit, then answers 429 quota_exceeded without changing the count", async () => {
      const workspaceId = uid("ws-inc");
      const state = (response) => ({ used: response.json.used, limit: response.json.limit });
      assert.deepEqual(state(await quota("increment", { tenant: "iai", workspaceId, amount: 1, limit: 3 })), { used: 1, limit: 3 });
      const second = await quota("increment", { tenant: "iai", workspaceId, amount: 2, limit: 3 });
      assert.equal(second.status, 200);
      assert.deepEqual(state(second), { used: 3, limit: 3 });
      assert.equal(second.json.tenant, "iai");
      assert.equal(second.json.workspaceId, workspaceId);

      const over = await quota("increment", { tenant: "iai", workspaceId, amount: 1, limit: 3 });
      assert.equal(over.status, 429);
      assert.deepEqual(over.json, { error: "quota_exceeded", used: 3, limit: 3 });
      assert.deepEqual((await quota("check", { tenant: "iai", workspaceId, amount: 1, limit: 3 })).json, { allowed: false, remaining: 0 });
    });

    test("amount defaults to 1 and the boundary is inclusive (exactly the remaining quota is allowed)", async () => {
      const workspaceId = uid("ws-boundary");
      assert.equal((await quota("increment", { tenant: "iai", workspaceId, limit: 4 })).json.used, 1);
      assert.equal((await quota("increment", { tenant: "iai", workspaceId, amount: 3, limit: 4 })).status, 200);
      assert.equal((await quota("increment", { tenant: "iai", workspaceId, amount: 1, limit: 4 })).status, 429);
    });

    test("quota is kept per tenant and per workspace", async () => {
      const workspaceId = uid("ws-shared-name");
      await quota("increment", { tenant: "iai", workspaceId, amount: 2, limit: 2 }, { "x-iai-tenant": "iai" });
      const otherTenant = await quota("increment", { tenant: "dsts", workspaceId, amount: 2, limit: 2 }, { "x-iai-tenant": "dsts" });
      assert.equal(otherTenant.status, 200, "same workspace id under another tenant has its own counter");
      const otherWorkspace = await quota("increment", { tenant: "iai", workspaceId: `${workspaceId}-b`, amount: 2, limit: 2 });
      assert.equal(otherWorkspace.status, 200);
      assert.equal((await quota("increment", { tenant: "iai", workspaceId, amount: 1, limit: 2 })).status, 429, "the original counter is still exhausted");
    });

    test("stress: 20 parallel increments against a limit of N succeed exactly N times, the rest get 429", async () => {
      for (const limit of [7, 1, 20]) {
        const workspaceId = uid(`ws-stress-${limit}`);
        const responses = await Promise.all(Array.from({ length: 20 }, () => quota("increment", { tenant: "iai", workspaceId, amount: 1, limit })));
        const tally = responses.reduce((acc, response) => ({ ...acc, [response.status]: (acc[response.status] ?? 0) + 1 }), {});
        assert.deepEqual(tally, limit === 20 ? { 200: 20 } : { 200: limit, 429: 20 - limit }, `limit ${limit}`);
        const usedValues = responses.filter((response) => response.status === 200).map((response) => response.json.used).sort((a, b) => a - b);
        assert.deepEqual(usedValues, Array.from({ length: limit }, (_, index) => index + 1), "each success saw a distinct counter value");
        assert.equal((await quota("check", { tenant: "iai", workspaceId, limit })).json.remaining, 0, "quota fully consumed");
      }
    });

    test("stress with mixed amounts never overshoots the limit", async () => {
      const workspaceId = uid("ws-mixed");
      const responses = await Promise.all(Array.from({ length: 10 }, () => quota("increment", { tenant: "iai", workspaceId, amount: 3, limit: 10 })));
      assert.equal(responses.filter((response) => response.status === 200).length, 3, "3 x 3 = 9 fits, a fourth would overshoot");
      assert.deepEqual((await quota("check", { tenant: "iai", workspaceId, amount: 1, limit: 10 })).json, { allowed: true, remaining: 1 });
    });

    test("quota state survives a runtime restart (Durable Object storage is persisted)", async () => {
      const workspaceId = uid("ws-restart");
      const first = await boot("verify-restart-1", undefined, { persistDir: restartPersist });
      try {
        const response = await post(first, "/quota/increment", { tenant: "iai", workspaceId, amount: 4, limit: 5 });
        assert.equal(response.json.used, 4);
      } finally {
        await first.stop();
      }
      const second = await boot("verify-restart-2", undefined, { persistDir: restartPersist, migrate: false });
      try {
        assert.deepEqual((await post(second, "/quota/check", { tenant: "iai", workspaceId, amount: 1, limit: 5 })).json, { allowed: true, remaining: 1 });
        assert.equal((await post(second, "/quota/increment", { tenant: "iai", workspaceId, amount: 2, limit: 5 })).status, 429);
      } finally {
        await second.stop();
      }
    });

    test("malformed JSON is a client error (400), not an internal error", async () => {
      for (const route of ["check", "increment"]) {
        const response = await quota(route, "{not json");
        assert.equal(response.status, 400, `${route} -> ${response.status}`);
      }
    });

    test("a request without workspaceId is rejected instead of sharing one default counter", async () => {
      const response = await quota("increment", { tenant: "iai", limit: 3 });
      assert.equal(response.status, 400, `${response.status} ${response.text}`);
    });
  });

  describe("POST /usage/emit validation", () => {
    const emit = (body) => post(bare, "/usage/emit", body);
    const rejects = async (label, event) => {
      const response = await emit(event);
      assert.equal(response.status, 400, `${label}: ${response.status} ${response.text}`);
      assert.match(response.json.error, /UsageEvent validation failed/, label);
    };

    test("a complete event is accepted (validate-only when no sink is bound)", async () => {
      const response = await emit(usageEvent());
      assert.equal(response.status, 200, response.text);
      assert.deepEqual(response.json, { ok: true, channel: "validate-only" });
    });

    test("an event for a different tenant than the request resolves to is refused (403 tenant_mismatch)", async () => {
      const response = await post(bare, "/usage/emit", usageEvent({ tenant: "dsts" }), { "x-iai-tenant": "iai" });
      assert.equal(response.status, 403, response.text);
      assert.equal(response.json.error, "tenant_mismatch");
      assert.equal(response.json.resolved, "iai");
    });

    test("missing or empty required fields are rejected with 400", async () => {
      for (const field of ["event_id", "tenant", "workspace_id", "subject_id", "domain_surface", "event_type", "usage_unit", "source_object_id", "occurred_at", "environment", "usage_amount"]) {
        const event = usageEvent();
        delete event[field];
        await rejects(`missing ${field}`, event);
      }
      for (const field of ["event_id", "tenant", "workspace_id", "subject_id", "domain_surface", "event_type", "usage_unit", "source_object_id", "occurred_at"]) {
        await rejects(`empty ${field}`, usageEvent({ [field]: "" }));
      }
    });

    test("non-numeric, negative and missing usage_amount values are rejected", async () => {
      await rejects("string amount", usageEvent({ usage_amount: "5" }));
      await rejects("null amount", usageEvent({ usage_amount: null }));
      await rejects("negative amount", usageEvent({ usage_amount: -1 }));
      await rejects("object amount", usageEvent({ usage_amount: { value: 1 } }));
      await rejects("boolean amount", usageEvent({ usage_amount: true }));
      assert.equal((await emit(usageEvent({ usage_amount: 0 }))).status, 200, "zero is a valid amount");
      assert.equal((await emit(usageEvent({ usage_amount: 2.5 }))).status, 200, "fractional units are valid (REAL column)");
    });

    test("unknown environments are rejected, known ones accepted", async () => {
      await rejects("unknown environment", usageEvent({ environment: "qa" }));
      for (const environment of ["development", "staging", "production", "sandbox"]) {
        assert.equal((await emit(usageEvent({ environment }))).status, 200, environment);
      }
    });

    test("non-object payloads are rejected with 400", async () => {
      for (const payload of ["null", "[]", '"text"', "42"]) {
        const response = await emit(payload);
        assert.equal(response.status, 400, `${payload} -> ${response.status} ${response.text}`);
      }
    });

    test("an event for a tenant outside the known tenant matrix is rejected", async () => {
      const response = await emit(usageEvent({ tenant: "not-in-the-matrix" }));
      assert.ok(response.status >= 400 && response.status < 500, `${response.status} ${response.text}`);
    });

    test("occurred_at must be an ISO-8601 timestamp", async () => {
      const response = await emit(usageEvent({ occurred_at: "yesterday-ish" }));
      assert.equal(response.status, 400, `${response.status} ${response.text}`);
    });

    test("an out-of-range number (1e999 parses to Infinity) is rejected", async () => {
      const response = await emit(JSON.stringify(usageEvent()).replace('"usage_amount":1', '"usage_amount":1e999'));
      assert.equal(response.status, 400, `${response.status} ${response.text}`);
    });

    test("malformed JSON is a client error (400)", async () => {
      const response = await emit("{not json");
      assert.equal(response.status, 400, `${response.status} ${response.text}`);
    });
  });

  describe("usage ledger sinks", () => {
    test("without a queue binding the event is inserted into D1 synchronously (channel d1)", async () => {
      const event = usageEvent({ usage_amount: 2.5, subject_id: "system" });
      const response = await post(d1Only, "/usage/emit", event);
      assert.deepEqual(response.json, { ok: true, channel: "d1" });
      const [row] = await ledgerRows(d1Only, `id = '${event.event_id}'`);
      assert.ok(row, "row inserted before the response returned");
      assert.deepEqual(
        { id: row.id, tenant: row.tenant, workspace_id: row.workspace_id, actor_id: row.actor_id, domain_surface: row.domain_surface, event_type: row.event_type, usage_amount: row.usage_amount, usage_unit: row.usage_unit, source_object_id: row.source_object_id, environment: row.environment, occurred_at: row.occurred_at },
        { id: event.event_id, tenant: "iai", workspace_id: "ws-usage", actor_id: "system", domain_surface: "chat", event_type: "chat_run", usage_amount: 2.5, usage_unit: "run_count", source_object_id: "obj-1", environment: "development", occurred_at: event.occurred_at }
      );
      assert.ok(Math.abs(row.received_at - Date.now()) < 60_000, "received_at is server time in ms");
    });

    test("invalid events never reach D1", async () => {
      const before = (await d1Only.d1.query("SELECT COUNT(*) AS c FROM usage_events"))[0].c;
      const response = await post(d1Only, "/usage/emit", usageEvent({ usage_amount: -1 }));
      assert.equal(response.status, 400);
      assert.equal((await d1Only.d1.query("SELECT COUNT(*) AS c FROM usage_events"))[0].c, before);
    });

    test("emitting the same event_id twice is idempotent instead of failing", async () => {
      const event = usageEvent();
      assert.equal((await post(d1Only, "/usage/emit", event)).status, 200);
      const second = await post(d1Only, "/usage/emit", event);
      assert.ok(second.status < 400 || second.status === 409, `${second.status} ${second.text}`);
      assert.equal((await ledgerRows(d1Only, `id = '${event.event_id}'`)).length, 1);
    });

    test("with the queue bound, /usage/emit enqueues and the consumer writes each event to D1 exactly once", { timeout: 60_000 }, async () => {
      const events = [usageEvent(), usageEvent({ usage_amount: 3 }), usageEvent({ tenant: "dsts", workspace_id: "ws-other" })];
      for (const event of events) {
        const response = await post(full, "/usage/emit", event, { "x-iai-tenant": event.tenant });
        assert.equal(response.status, 200, response.text);
        assert.deepEqual(response.json, { ok: true, channel: "queue" });
      }
      const ids = events.map((event) => `'${event.event_id}'`).join(",");
      const rows = await full.d1.waitFor(`SELECT id, tenant, usage_amount FROM usage_events WHERE id IN (${ids}) ORDER BY id`, (found) => found.length >= events.length, { timeoutMs: 30_000 });
      assert.equal(rows.length, events.length, "all queued events were consumed (batch window is 5s)");
      assert.deepEqual(rows.map((row) => row.id).sort(), events.map((event) => event.event_id).sort());
      assert.equal(new Set(rows.map((row) => row.id)).size, rows.length, "no duplicates");
    });

    test("a redelivered event is stored once and does not take unrelated events in the same batch down with it", { timeout: 60_000 }, async () => {
      const duplicate = usageEvent();
      const later = usageEvent({ usage_amount: 5 });
      for (const event of [duplicate, duplicate, later]) assert.equal((await post(full, "/usage/emit", event)).status, 200);
      const ids = `'${duplicate.event_id}','${later.event_id}'`;
      const rows = await full.d1.waitFor(`SELECT id FROM usage_events WHERE id IN (${ids})`, (found) => found.length >= 2, { timeoutMs: 20_000 });
      assert.deepEqual(rows.map((row) => row.id).sort(), [duplicate.event_id, later.event_id].sort());
    });
  });

  describe("routing", () => {
    test("unknown paths and wrong methods answer 404", async () => {
      assert.equal((await request(full.baseUrl, "/nope")).status, 404);
      assert.equal((await request(full.baseUrl, "/quota/check", { headers: { "x-iai-tenant": "iai" } })).status, 404, "GET on a POST route");
      assert.equal((await request(full.baseUrl, "/usage/emit")).status, 404);
    });
  });
});
