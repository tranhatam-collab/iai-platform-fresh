import test from "node:test";
import assert from "node:assert/strict";

import { createMailMessageSource } from "../../packages/mail-core/dist/index.js";
import { buildMessagesPageFromSource } from "../../apps/mail-web/dist/index.js";

test("mail-web messages page builds summary counts from shared message list contract", () => {
  const source = createMailMessageSource();
  const page = buildMessagesPageFromSource(
    source,
    {
      statuses: ["provider_accepted"],
      stream: "transactional",
      workspaceId: "ws_mail_main"
    },
    "2026-04-14T10:10:00.000Z"
  );

  assert.equal(page.total, 1);
  assert.equal(page.items[0]?.messageId, "msg_smtp_demo_001");
  assert.equal(page.byStatus.provider_accepted, 1);
  assert.equal(page.byStream.transactional, 1);
});
