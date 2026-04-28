import test from "node:test";
import assert from "node:assert/strict";

import { createMailDomainDnsHealthSource } from "../../packages/mail-core/dist/index.js";
import { buildDomainDnsHealthViewFromSource } from "../../apps/mail-web/dist/index.js";

test("mail-web domain DNS health view flags blocking records from shared contract", () => {
  const source = createMailDomainDnsHealthSource();
  const page = buildDomainDnsHealthViewFromSource(
    source,
    "dom_updates_main_001",
    "ws_mail_main",
    "2026-04-14T10:30:00.000Z"
  );

  assert.ok(page);
  assert.equal(page.summary.domain, "updates.iai.one");
  assert.equal(page.summary.readiness, "blocked");
  assert.equal(page.summary.failureCount, 1);
  assert.equal(page.summary.warningCount, 2);
  assert.equal(page.summary.canSendMarketingVolume, false);
  assert.ok(page.issues.includes("dmarc:fail"));
});
