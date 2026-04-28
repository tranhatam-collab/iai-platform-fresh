import test from "node:test";
import assert from "node:assert/strict";

import { createMailProviderRouteSource } from "../../packages/mail-core/dist/index.js";
import { buildProviderRoutesPageFromSource } from "../../apps/mail-web/dist/index.js";

test("mail-web provider routes page summarizes route health and provider counts", () => {
  const source = createMailProviderRouteSource();
  const page = buildProviderRoutesPageFromSource(
    source,
    {
      workspaceId: "ws_mail_main"
    },
    "2026-04-14T10:20:00.000Z"
  );

  assert.equal(page.total, 3);
  assert.equal(page.byProvider.sendgrid, 1);
  assert.equal(page.byProvider.ses, 1);
  assert.equal(page.byHealth.degraded, 1);
  assert.equal(page.degradedCount, 1);
  assert.deepEqual(
    page.items.map((item) => item.routeId),
    ["transactional_primary", "transactional_backup", "marketing_primary"]
  );
});
