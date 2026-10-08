import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { resolveQuotaPlan } from "../src/quota-plan.js";
import { USAGE_QUEUE_MAX_RETRIES } from "../src/worker.js";

// dist/tests/queue-config.test.js -> apps/verify-runtime/wrangler.toml
const wrangler = readFileSync(new URL("../../wrangler.toml", import.meta.url), "utf8");

function section(header: string): string {
  const start = wrangler.indexOf(header);
  assert.notStrictEqual(start, -1, `${header} present in wrangler.toml`);
  const rest = wrangler.slice(start + header.length);
  const next = rest.search(/^\[/m);
  return next === -1 ? rest : rest.slice(0, next);
}

describe("wrangler.toml queue and quota configuration", () => {
  const consumer = section("[[queues.consumers]]");

  it("the usage queue consumer has a dead letter queue distinct from the main queue", () => {
    const dlq = /^dead_letter_queue\s*=\s*"([^"]+)"/m.exec(consumer)?.[1];
    const queue = /^queue\s*=\s*"([^"]+)"/m.exec(consumer)?.[1];
    assert.ok(dlq, "dead_letter_queue is configured");
    assert.notStrictEqual(dlq, queue);
  });

  it("max_retries matches the limit the worker documents", () => {
    const retries = Number(/^max_retries\s*=\s*(\d+)/m.exec(consumer)?.[1]);
    assert.strictEqual(retries, USAGE_QUEUE_MAX_RETRIES);
  });

  it("QUOTA_PLANS is valid JSON with a default plan the worker accepts", () => {
    const raw = /^QUOTA_PLANS\s*=\s*'([^']*)'/m.exec(section("[vars]"))?.[1];
    assert.ok(raw, "QUOTA_PLANS var present");
    const parsed = JSON.parse(raw) as { default?: { limit?: number; windowMs?: number } };
    const plan = resolveQuotaPlan("iai", raw);
    assert.strictEqual(plan.limit, parsed.default?.limit);
    assert.strictEqual(plan.windowMs, parsed.default?.windowMs);
  });
});
