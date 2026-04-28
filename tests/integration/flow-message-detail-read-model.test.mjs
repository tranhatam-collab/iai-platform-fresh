import test from "node:test";
import assert from "node:assert/strict";

import { createMailMessageSource } from "../../packages/mail-core/dist/index.js";
import { buildMessageDetailViewFromSource } from "../../apps/mail-web/dist/index.js";

test("mail-web message detail page exposes summary, recipients, attempts, and timeline", () => {
  const source = createMailMessageSource();
  const page = buildMessageDetailViewFromSource(
    source,
    "msg_smtp_demo_001",
    "ws_mail_main",
    "2026-04-14T10:10:00.000Z"
  );

  assert.ok(page);
  assert.equal(page.summary.messageId, "msg_smtp_demo_001");
  assert.equal(page.summary.status, "provider_accepted");
  assert.equal(page.summary.providerRoute, "transactional_primary");
  assert.equal(page.recipients.primaryRecipient?.email, "user@example.com");
  assert.equal(page.sender.replyTo?.email, "support@iai.one");
  assert.equal(page.trace.deliveryAttempts[0]?.status, "accepted");
  assert.equal(page.trace.timeline.length, 2);
  assert.equal(page.trace.timeline[0]?.eventType, "queued");
  assert.equal(page.trace.timeline[1]?.eventType, "provider_accepted");
  assert.equal(page.content.attachmentCount, 1);
});
