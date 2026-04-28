import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..", "..");

async function waitForHealth(url, label) {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function spawnProcess(command, args, options) {
  const child = spawn(command, args, {
    cwd: workspaceRoot,
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });
  return {
    child,
    getStderr: () => stderr
  };
}

async function stopProcess(proc) {
  if (!proc || proc.killed) return;
  proc.kill("SIGTERM");
  await new Promise((resolve) => {
    proc.once("exit", resolve);
    setTimeout(() => {
      if (!proc.killed) proc.kill("SIGKILL");
      resolve();
    }, 3000);
  });
}

test("mock-backed NOOS stack completes checkout and enforces boundary redirects", async (t) => {
  if (process.env.NOOS_STACK_TEST !== "1") {
    t.skip("Requires local socket binding; run with NOOS_STACK_TEST=1");
    return;
  }

  const mockPort = 4313;
  const webPort = 4322;
  const mockBase = `http://127.0.0.1:${mockPort}`;
  const webBase = `http://127.0.0.1:${webPort}`;

  const mock = spawnProcess(process.execPath, [path.join(workspaceRoot, "scripts/noos-commerce-mock-server.mjs"), `--port=${mockPort}`]);
  const web = spawnProcess(process.execPath, [path.join(workspaceRoot, "apps/noos-web/dist/server.js")], {
    env: {
      ...process.env,
      NOOS_WEB_PORT: String(webPort),
      NOOS_COMMERCE_API_BASE: mockBase,
      NOOS_COMMERCE_REQUIRE_API: "1"
    }
  });

  t.after(async () => {
    await stopProcess(web.child);
    await stopProcess(mock.child);
  });

  await waitForHealth(`${mockBase}/health`, `mock server: ${mock.getStderr()}`);
  await waitForHealth(`${webBase}/health`, `web server: ${web.getStderr()}`);

  const webHealth = await fetch(`${webBase}/health`).then((response) => response.json());
  assert.equal(webHealth.commerceSourceMode, "api-required");

  const boundaryResponse = await fetch(`${webBase}/docs/investment-programs/`, {
    redirect: "manual"
  });
  assert.equal(boundaryResponse.status, 308);
  assert.equal(boundaryResponse.headers.get("location"), "/en/documents");
  assert.equal(boundaryResponse.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(boundaryResponse.headers.get("x-noos-commerce-source"), "api-required");

  const checkoutResponse = await fetch(`${webBase}/en/checkout`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      buyer: "buyer_stack001",
      product: "P11",
      email: "stack001@example.com",
      license: "Individual"
    }),
    redirect: "manual"
  });

  assert.equal(checkoutResponse.status, 303);
  const location = checkoutResponse.headers.get("location");
  assert.ok(location);
  assert.match(location, /\/en\/checkout-success/);

  const successResponse = await fetch(`${webBase}${location}`);
  const successHtml = await successResponse.text();
  assert.equal(successResponse.status, 200);
  assert.match(successHtml, /Future Civilization Technology Master Pack/);
  assert.match(successHtml, /Order ord_/);

  const successUrl = new URL(location, webBase);
  const orderId = successUrl.searchParams.get("order");
  assert.ok(orderId);

  const orderResponse = await fetch(`${mockBase}/orders/${orderId}`);
  const order = await orderResponse.json();
  assert.equal(orderResponse.status, 200);
  assert.equal(order.buyerId, "buyer_stack001");
  assert.equal(order.productCode, "P11");
  assert.equal(order.entitlementIds.length, 1);

  const entitlementId = order.entitlementIds[0];
  const entitlementResponse = await fetch(`${mockBase}/entitlements/${entitlementId}`);
  const entitlement = await entitlementResponse.json();
  assert.equal(entitlementResponse.status, 200);
  assert.equal(entitlement.accessStatus, "active");
  assert.equal(entitlement.entitlementCode, "ENT_MASTER");

  const libraryResponse = await fetch(`${webBase}/en/library?buyer=buyer_stack001`);
  const libraryHtml = await libraryResponse.text();
  assert.equal(libraryResponse.status, 200);
  assert.match(libraryHtml, /Future Civilization Technology Master Pack/);

  const updatesResponse = await fetch(`${webBase}/en/library/updates?buyer=buyer_vnfield021`);
  const updatesHtml = await updatesResponse.text();
  assert.equal(updatesResponse.status, 200);
  assert.match(updatesHtml, /Vietnam Sovereign Resilience Profile Pack/);
  assert.match(updatesHtml, /update available/i);

  const replayResponse = await fetch(`${mockBase}/webhooks/stripe/checkout-session-completed`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      eventType: "checkout.session.completed",
      checkoutSessionId: order.checkoutSessionId,
      productCode: "P11",
      licenseType: "Individual",
      entitlementCode: "ENT_MASTER",
      buyerEmail: "stack001@example.com",
      orderId,
      fulfillmentKey: order.checkoutSessionId,
      idempotencyPassed: true,
      entitlementActions: [
        {
          action: "grant_parent_entitlement",
          entitlementCode: "ENT_MASTER"
        }
      ],
      confirmationEmailQueued: true,
      loggedAt: new Date().toISOString()
    })
  });
  const replayBody = await replayResponse.json();
  assert.equal(replayResponse.status, 200);
  assert.equal(replayResponse.headers.get("x-noos-idempotent-replay"), "true");
  assert.equal(replayBody.orderCreated, false);
  assert.deepEqual(replayBody.entitlementsGranted, []);

  const libraryApiResponse = await fetch(`${mockBase}/library/buyer_stack001`);
  const libraryApi = await libraryApiResponse.json();
  assert.equal(libraryApiResponse.status, 200);
  assert.equal(libraryApi.items.length, 1);
  assert.equal(libraryApi.items[0].productCode, "P11");

  const operationsResponse = await fetch(`${webBase}/en/operations`);
  const operationsHtml = await operationsResponse.text();
  assert.equal(operationsResponse.status, 200);
  assert.match(operationsHtml, /support-response-sla/);

  const inquiryResponse = await fetch(`${webBase}/en/organization-inquiry?buyer=buyer_team014&from=P12`);
  const inquiryHtml = await inquiryResponse.text();
  assert.equal(inquiryResponse.status, 200);
  assert.match(inquiryHtml, /Organization and strategic rollout starts from a controlled handoff/);
});
