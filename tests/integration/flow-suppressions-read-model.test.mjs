import test from "node:test";
import assert from "node:assert/strict";

import { createMailSuppressionSource } from "../../packages/mail-core/dist/index.js";
import { buildSuppressionsPageFromSource } from "../../apps/mail-web/dist/index.js";

test("mail-web suppressions page summarizes active, expired, and removed records", () => {
  const source = createMailSuppressionSource();
  const page = buildSuppressionsPageFromSource(
    source,
    {
      workspaceId: "ws_mail_main"
    },
    "2026-04-14T10:30:00.000Z"
  );

  assert.equal(page.total, 5);
  assert.equal(page.activeCount, 3);
  assert.equal(page.expiredCount, 1);
  assert.equal(page.removedCount, 1);
  assert.equal(page.bySource.provider_webhook, 2);
  assert.equal(page.byReason.manual, 2);
  assert.deepEqual(
    page.items.slice(0, 3).map((item) => item.status),
    ["active", "active", "active"]
  );
});
