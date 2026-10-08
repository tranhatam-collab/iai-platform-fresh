import { describe, it } from "node:test";
import assert from "node:assert";
import {
  validateUsageEvent,
  emitUsageEvent,
  emitUsageEventToD1,
  isIsoTimestamp,
  UsageEventValidationError,
  type UsageEvent,
} from "../src/usage-emission.js";
import { createMockD1 } from "./mock-d1.js";

function makeEvent(overrides: Partial<UsageEvent> = {}): UsageEvent {
  return {
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
    ...overrides,
  };
}

describe("usage-emission", () => {
  it("validates a correct event", () => {
    assert.doesNotThrow(() => validateUsageEvent(makeEvent()));
  });

  it("emits a validated event", () => {
    const event = makeEvent();
    const emitted = emitUsageEvent(event);
    assert.strictEqual(emitted.event_id, event.event_id);
  });

  it("accepts system actor as subject_id", () => {
    const event = makeEvent({ subject_id: "system" });
    assert.doesNotThrow(() => validateUsageEvent(event));
  });

  it("rejects missing required fields", () => {
    const bad = { ...makeEvent(), event_id: undefined } as unknown as UsageEvent;
    assert.throws(() => validateUsageEvent(bad), UsageEventValidationError);
  });

  it("rejects empty string fields", () => {
    const bad = makeEvent({ workspace_id: "" });
    assert.throws(() => validateUsageEvent(bad), UsageEventValidationError);
  });

  it("rejects negative usage_amount", () => {
    const bad = makeEvent({ usage_amount: -1 });
    assert.throws(() => validateUsageEvent(bad), UsageEventValidationError);
  });

  it("rejects NaN usage_amount", () => {
    const bad = makeEvent({ usage_amount: NaN });
    assert.throws(() => validateUsageEvent(bad), UsageEventValidationError);
  });

  it("rejects invalid environment", () => {
    const bad = makeEvent({ environment: "invalid" as UsageEvent["environment"] });
    assert.throws(() => validateUsageEvent(bad), UsageEventValidationError);
  });

  it("accepts zero and fractional usage_amount", () => {
    assert.doesNotThrow(() => validateUsageEvent(makeEvent({ usage_amount: 0 })));
    assert.doesNotThrow(() => validateUsageEvent(makeEvent({ usage_amount: 0.25 })));
  });

  it("rejects non-finite usage_amount (JSON 1e999 parses to Infinity)", () => {
    assert.strictEqual(JSON.parse("1e999"), Infinity);
    for (const usage_amount of [Infinity, -Infinity, JSON.parse("1e999") as number]) {
      assert.throws(
        () => validateUsageEvent(makeEvent({ usage_amount })),
        UsageEventValidationError,
        String(usage_amount)
      );
    }
  });

  it("rejects non-number usage_amount", () => {
    for (const usage_amount of ["1", null, undefined, {}] as unknown as number[]) {
      assert.throws(() => validateUsageEvent(makeEvent({ usage_amount })), UsageEventValidationError);
    }
  });

  it("accepts every known tenant and rejects unknown ones", () => {
    for (const tenant of ["iai", "dsts", "nhachung", "muonnoi", "aal"]) {
      assert.doesNotThrow(() => validateUsageEvent(makeEvent({ tenant })), tenant);
    }
    for (const tenant of ["evil", "IAI", " iai", "iai ", "constructor", "__proto__", "toString"]) {
      assert.throws(
        () => validateUsageEvent(makeEvent({ tenant })),
        /unknown tenant/,
        JSON.stringify(tenant)
      );
    }
  });

  it("does not echo the rejected tenant value in the error", () => {
    assert.throws(
      () => validateUsageEvent(makeEvent({ tenant: "<script>alert(1)</script>" })),
      (err: Error) => !err.message.includes("script")
    );
  });

  it("accepts ISO 8601 timestamps with Z, fractions and offsets", () => {
    for (const occurred_at of [
      "2026-01-31T09:30:00Z",
      "2026-01-31T09:30:00.123Z",
      "2026-01-31T09:30:00.123456789Z",
      "2026-01-31T16:30:00+07:00",
      "2026-01-31T04:30:00-05:00",
      "2024-02-29T00:00:00Z",
      new Date().toISOString(),
    ]) {
      assert.doesNotThrow(() => validateUsageEvent(makeEvent({ occurred_at })), occurred_at);
    }
  });

  it("rejects garbage and non-ISO occurred_at", () => {
    for (const occurred_at of [
      "x",
      "not-a-date",
      "1",
      "0",
      "12345",
      "Infinity",
      "NaN",
      "2026-01-31",
      "2026-01-31T09:30",
      "2026-01-31T09:30:00",
      "2026-01-31 09:30:00Z",
      "2026-01-31T09:30:00z",
      "2026-02-29T00:00:00Z",
      "2026-02-31T00:00:00Z",
      "2026-04-31T00:00:00Z",
      "2026-00-10T00:00:00Z",
      "2026-13-01T00:00:00Z",
      "2026-01-00T00:00:00Z",
      "2026-01-31T24:00:00Z",
      "2026-01-31T09:60:00Z",
      "2026-01-31T09:30:60Z",
      "2026-01-31T09:30:00+24:00",
      "2026-01-31T09:30:00+07:60",
      "Thu, 01 Jan 2026 00:00:00 GMT",
      " 2026-01-31T09:30:00Z",
      "9".repeat(40),
    ]) {
      assert.throws(
        () => validateUsageEvent(makeEvent({ occurred_at })),
        UsageEventValidationError,
        JSON.stringify(occurred_at)
      );
      assert.strictEqual(isIsoTimestamp(occurred_at), false, occurred_at);
    }
  });
});

describe("emitUsageEventToD1", () => {
  it("inserts with ON CONFLICT(id) DO NOTHING and reports whether a row was added", async () => {
    const d1 = createMockD1();
    const event = makeEvent({ event_id: "evt_idem" });

    assert.strictEqual(await emitUsageEventToD1(event, d1.db), true);
    assert.strictEqual(await emitUsageEventToD1(event, d1.db), false);
    assert.strictEqual(await emitUsageEventToD1({ ...event }, d1.db), false);

    assert.strictEqual(d1.rows.size, 1);
    assert.match(d1.statements[0]!, /ON\s+CONFLICT\s*\(\s*id\s*\)\s+DO\s+NOTHING/i);
  });

  it("uses the producer event_id as the row id, so a replay is a duplicate", async () => {
    const d1 = createMockD1();
    await emitUsageEventToD1(makeEvent({ event_id: "evt_a" }), d1.db);
    await emitUsageEventToD1(makeEvent({ event_id: "evt_b" }), d1.db);
    assert.deepStrictEqual([...d1.rows.keys()], ["evt_a", "evt_b"]);
  });

  it("propagates real D1 failures so the message can be retried", async () => {
    const d1 = createMockD1();
    d1.failNext = new Error("D1 unavailable");
    await assert.rejects(emitUsageEventToD1(makeEvent(), d1.db), /D1 unavailable/);
    assert.strictEqual(d1.rows.size, 0);
  });

  it("does not touch D1 for an invalid event", async () => {
    const d1 = createMockD1();
    await assert.rejects(
      emitUsageEventToD1(makeEvent({ tenant: "evil" }), d1.db),
      UsageEventValidationError
    );
    assert.strictEqual(d1.statements.length, 0);
  });
});
