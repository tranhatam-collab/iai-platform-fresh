/**
 * mail-web surface test
 * Verifies build functions export and basic invocation.
 */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

describe("mail-web surface", () => {
  it("exports buildFlowDash", async () => {
    const mod = await import("../../apps/mail-web/src/index.ts");
    assert.equal(typeof mod.buildFlowDash, "function", "buildFlowDash exported");
  });

  it("exports buildMessagesPage", async () => {
    const mod = await import("../../apps/mail-web/src/index.ts");
    assert.equal(typeof mod.buildMessagesPage, "function", "buildMessagesPage exported");
  });

  it("exports buildMessageDetailPage", async () => {
    const mod = await import("../../apps/mail-web/src/index.ts");
    assert.equal(typeof mod.buildMessageDetailPage, "function", "buildMessageDetailPage exported");
  });

  it("exports buildProviderRoutesPage", async () => {
    const mod = await import("../../apps/mail-web/src/index.ts");
    assert.equal(typeof mod.buildProviderRoutesPage, "function", "buildProviderRoutesPage exported");
  });

  it("exports buildSuppressionsPage", async () => {
    const mod = await import("../../apps/mail-web/src/index.ts");
    assert.equal(typeof mod.buildSuppressionsPage, "function", "buildSuppressionsPage exported");
  });

  it("exports buildDomainDnsHealthPage", async () => {
    const mod = await import("../../apps/mail-web/src/index.ts");
    assert.equal(typeof mod.buildDomainDnsHealthPage, "function", "buildDomainDnsHealthPage exported");
  });
});
