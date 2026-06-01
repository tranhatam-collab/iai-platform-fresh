import { describe, it } from "node:test";
import assert from "node:assert";
import {
  resolveTenant,
  KNOWN_TENANTS,
  TenantResolutionError,
  type TenantResolutionResult,
} from "../src/tenant-resolver.js";

describe("tenant-resolver", () => {
  it("resolves by x-iai-tenant header", () => {
    const req = new Request("http://example.com/", {
      headers: { "x-iai-tenant": "iai" },
    });
    const result: TenantResolutionResult = resolveTenant(req);
    assert.strictEqual(result.tenant, "iai");
    assert.strictEqual(result.resolvedBy, "header");
  });

  it("resolves by host subdomain", () => {
    const req = new Request("http://iai.example.com/path");
    const result = resolveTenant(req);
    assert.strictEqual(result.tenant, "iai");
    assert.strictEqual(result.resolvedBy, "host");
  });

  it("resolves by path prefix /t/{tenant}", () => {
    const req = new Request("http://example.com/t/dsts/action");
    const result = resolveTenant(req);
    assert.strictEqual(result.tenant, "dsts");
    assert.strictEqual(result.resolvedBy, "path");
  });

  it("rejects unknown tenant with TenantResolutionError", () => {
    const req = new Request("http://unknown.example.com/", {
      headers: { "x-iai-tenant": "unknown" },
    });
    assert.throws(() => resolveTenant(req), TenantResolutionError);
  });

  it("rejects when no resolution source matches", () => {
    const req = new Request("http://example.com/");
    assert.throws(() => resolveTenant(req), TenantResolutionError);
  });

  it("allows all known tenants from locked matrix", () => {
    for (const tenant of KNOWN_TENANTS) {
      const req = new Request("http://example.com/", {
        headers: { "x-iai-tenant": tenant },
      });
      const result = resolveTenant(req);
      assert.strictEqual(result.tenant, tenant);
    }
  });
});
