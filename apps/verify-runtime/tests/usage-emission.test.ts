import { describe, it } from "node:test";
import assert from "node:assert";
import {
  validateUsageEvent,
  emitUsageEvent,
  UsageEventValidationError,
  type UsageEvent,
} from "../src/usage-emission.js";

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
});
