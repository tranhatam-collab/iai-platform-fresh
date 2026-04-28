import test from "node:test";
import assert from "node:assert/strict";

import { buildWave2InternalAlertPayload } from "../../packages/mail-core/dist/index.js";

const baseInput = {
  alertId: "alt_w2_0001",
  contextLines: ["queue=transactional_primary", "depth=42"],
  message: "Queue depth crossed the warning band but stayed under critical.",
  recordedAt: "2026-04-26T10:15:00.000Z",
  scope: "runtime",
  severity: "warning",
  sourceRef: "queue_main",
  title: "Queue depth above warning"
};

const baseConfig = {
  credentialId: "cred_alerts_internal",
  fromMailbox: { email: "alerts@iai.one", name: "IAI Alerts" },
  recipients: [{ email: "ops@iai.one", name: "IAI Ops" }],
  workspaceId: "ws_iai_internal"
};

test("buildWave2InternalAlertPayload locks bilingual content for low_risk_internal_alert", () => {
  const payload = buildWave2InternalAlertPayload("low_risk_internal_alert", "vi", baseInput, baseConfig);

  assert.equal(payload.workspaceId, baseConfig.workspaceId);
  assert.equal(payload.envelopeFrom, baseConfig.fromMailbox.email);
  assert.equal(payload.from?.email, baseConfig.fromMailbox.email);
  assert.equal(payload.headerFrom, "IAI Alerts <alerts@iai.one>");
  assert.equal(payload.recipients.length, 1);
  assert.equal(payload.recipients[0], "ops@iai.one");
  assert.equal(payload.stream, "transactional");
  assert.equal(payload.source, "api");
  assert.equal(payload.headers["x-iai-alert-id"], baseInput.alertId);
  assert.equal(payload.headers["x-iai-alert-severity"], baseInput.severity);
  assert.equal(payload.headers["x-iai-flow-kind"], "low_risk_internal_alert");

  assert.match(payload.subject ?? "", /Cảnh báo: Queue depth above warning/);
  assert.match(payload.subject ?? "", /Alert: Queue depth above warning/);

  assert.match(payload.text ?? "", /Cảnh báo nội bộ rủi ro thấp/);
  assert.match(payload.text ?? "", /Low-risk internal alert/);
  assert.match(payload.text ?? "", /Phạm vi \/ Scope: runtime/);
  assert.match(payload.text ?? "", /Mã cảnh báo \/ Alert ID: alt_w2_0001/);
  assert.match(payload.text ?? "", /queue=transactional_primary/);

  assert.match(payload.html ?? "", /Cảnh báo nội bộ rủi ro thấp/);
  assert.match(payload.html ?? "", /Low-risk internal alert/);
  assert.match(payload.html ?? "", /<!doctype html>/);
});

test("buildWave2InternalAlertPayload locks bilingual content for low_volume_notification with EN-first locale", () => {
  const payload = buildWave2InternalAlertPayload(
    "low_volume_notification",
    "en",
    {
      ...baseInput,
      alertId: "alt_w2_0002",
      message: "Weekly digest ready for ops review.",
      severity: "info",
      title: "Weekly ops digest"
    },
    {
      ...baseConfig,
      fromMailbox: { email: "notifications@iai.one", name: "IAI Notifications" },
      recipients: [
        { email: "ops@iai.one", name: "IAI Ops" },
        { email: "platform@iai.one" }
      ]
    }
  );

  assert.equal(payload.from?.email, "notifications@iai.one");
  assert.equal(payload.recipients.length, 2);
  assert.equal(payload.headers["x-iai-flow-kind"], "low_volume_notification");
  assert.equal(payload.headers["x-iai-alert-severity"], "info");

  assert.match(payload.subject ?? "", /Notice: Weekly ops digest/);
  assert.match(payload.subject ?? "", /Thông báo: Weekly ops digest/);

  assert.match(payload.text ?? "", /Thông báo nội bộ khối lượng thấp/);
  assert.match(payload.text ?? "", /Low-volume internal notification/);
  assert.match(payload.text ?? "", /Mức độ \/ Severity: info/);
});

test("buildWave2InternalAlertPayload escapes HTML and rejects empty recipients", () => {
  const payload = buildWave2InternalAlertPayload(
    "low_risk_internal_alert",
    "vi",
    {
      ...baseInput,
      message: 'Spike <script>alert("xss")</script> detected',
      title: "Suspicious payload <fragment>"
    },
    baseConfig
  );

  assert.ok(!payload.html?.includes("<script>"));
  assert.match(payload.html ?? "", /&lt;script&gt;/);
  assert.match(payload.html ?? "", /&lt;fragment&gt;/);

  assert.throws(() => {
    buildWave2InternalAlertPayload("low_risk_internal_alert", "vi", baseInput, {
      ...baseConfig,
      recipients: []
    });
  }, /at least one recipient/);

  assert.throws(() => {
    buildWave2InternalAlertPayload(
      "low_risk_internal_alert",
      "vi",
      { ...baseInput, alertId: "  " },
      baseConfig
    );
  }, /alertId/);
});

test("buildWave2InternalAlertPayload uses idempotency key tying alertId + kind", () => {
  const first = buildWave2InternalAlertPayload(
    "low_risk_internal_alert",
    "vi",
    baseInput,
    baseConfig
  );
  const second = buildWave2InternalAlertPayload(
    "low_volume_notification",
    "vi",
    baseInput,
    baseConfig
  );

  assert.equal(first.messageIdempotencyKey, `${baseInput.alertId}:low_risk_internal_alert`);
  assert.equal(second.messageIdempotencyKey, `${baseInput.alertId}:low_volume_notification`);
  assert.notEqual(first.messageId, second.messageId);
  assert.notEqual(first.traceId, second.traceId);
});
