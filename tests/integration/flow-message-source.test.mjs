import test from "node:test";
import assert from "node:assert/strict";

import { createMailMessageSource } from "../../packages/mail-core/dist/index.js";

test("mail message source exposes SMTP detail and timeline from shared artifacts", () => {
  const source = createMailMessageSource();
  const detail = source.getMessageDetail("msg_smtp_demo_001", "ws_mail_main");

  assert.ok(detail);
  assert.equal(detail.status, "provider_accepted");
  assert.equal(detail.lastEvent?.eventType, "provider_accepted");
  assert.equal(detail.deliveryAttempts[0]?.status, "accepted");
  assert.equal(detail.normalizedPayload.source, "smtp");
  assert.equal(detail.message.providerRoute, "transactional_primary");

  const events = source.listMessageEvents("msg_smtp_demo_001", "ws_mail_main");
  assert.equal(events.length, 2);
  assert.equal(events[0]?.eventType, "queued");
  assert.equal(events[1]?.eventType, "provider_accepted");
});
