import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const integrationDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(integrationDir, "..", "..");
const ciosRoot = path.resolve(workspaceRoot, "..", "cios.iai.one");

function readCiosFile(relativePath) {
  return readFileSync(path.join(ciosRoot, relativePath), "utf8");
}

test("cios sibling workspace exposes release-critical route shells", () => {
  assert.equal(existsSync(ciosRoot), true, "expected sibling cios.iai.one workspace");

  const rootHtml = readCiosFile("site/index.html");
  const hubHtml = readCiosFile("site/cios/index.html");
  const appHtml = readCiosFile("site/cios/app/index.html");
  const pricingHtml = readCiosFile("site/cios/pricing/index.html");
  const demoHtml = readCiosFile("site/cios/demo/index.html");

  assert.match(rootHtml, /CIOS - Customer Intelligence Operating System/);
  assert.match(rootHtml, /What should you do today\?/);
  assert.match(hubHtml, /CIOS Hub/);
  assert.match(hubHtml, /Open app mode/);
  assert.match(appHtml, /CIOS Demo App Mode/);
  assert.match(appHtml, /Use CIOS directly in your browser/);
  assert.match(pricingHtml, /CIOS Category Pricing/);
  assert.match(pricingHtml, /The operating system for customer intelligence/);
  assert.match(demoHtml, /CIOS Plan Demos/);
  assert.match(demoHtml, /Each tier has a live, app-like simulation/);
});

test("cios sibling workspace exposes runtime contract and rollback proof", () => {
  const packageJson = JSON.parse(readCiosFile("package.json"));
  const appFactory = readCiosFile("src/app/create-app.ts");
  const metaTest = readCiosFile("tests/v1-meta.test.ts");
  const phaseOneTest = readCiosFile("tests/phase1-integration.test.ts");
  const tenantIsolationTest = readCiosFile("tests/tenant-isolation-discovery.test.ts");
  const sseReconnectTest = readCiosFile("tests/sse-reconnect.test.ts");
  const runbook = readCiosFile("docs/DEPLOY_AND_SMOKE_RUNBOOK.md");
  const rollbackNotes = readCiosFile("migrations/ROLLBACK_NOTES.md");

  assert.equal(packageJson.name, "cios.iai.one");
  assert.match(packageJson.version, /^\d+\.\d+\.\d+$/);
  assert.ok(packageJson.scripts.test);
  assert.ok(packageJson.scripts["smoke:workers:strict"]);
  assert.ok(packageJson.scripts["deploy:pages"]);

  assert.match(appFactory, /registerRealtimeStreamRoute/);
  assert.match(appFactory, /registerV1MetaRoutes/);
  assert.match(appFactory, /registerV1FlowRoutes/);

  assert.match(metaTest, /GET \/v1\/meta/);
  assert.match(metaTest, /\/v1\/compliance\/policies/);

  assert.match(phaseOneTest, /\/v1\/flow\/dispatch/);
  assert.match(phaseOneTest, /\/v1\/flow\/callback/);
  assert.match(phaseOneTest, /AUTH_FORBIDDEN/);

  assert.match(tenantIsolationTest, /\/v1\/discovery\/sources/);
  assert.match(tenantIsolationTest, /\/v1\/discovery\/crawl-governance/);

  assert.match(sseReconnectTest, /\/realtime\/stream/);
  assert.match(sseReconnectTest, /\/realtime\/events\/since\//);

  assert.match(runbook, /npm run smoke:workers:strict/);
  assert.match(runbook, /Go \/ No-Go gate/);

  assert.match(rollbackNotes, /rollback workers\/pages\/backend version/i);
  assert.match(rollbackNotes, /khong xoa bang/i);
});
