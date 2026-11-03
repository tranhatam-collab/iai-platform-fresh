import assert from "node:assert/strict";
import test from "node:test";

import { createAppRequestHandler } from "../../apps/app/dist/server.js";
import { createDashRequestHandler } from "../../apps/dash/dist/server.js";
import { createDeveloperRequestHandler } from "../../apps/developer/dist/server.js";
import { createDocsRequestHandler } from "../../apps/docs/dist/server.js";
import { createFlowRequestHandler } from "../../apps/flow/dist/server.js";
import { createHomeRequestHandler } from "../../apps/home/dist/server.js";
import { createNftRequestHandler } from "../../apps/nft/dist/server.js";
import { createPayRequestHandler } from "../../apps/pay/dist/server.js";
import { createRootRequestHandler } from "../../apps/root/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const handlers = [
  ["root", createRootRequestHandler()],
  ["home", createHomeRequestHandler()],
  ["app", createAppRequestHandler()],
  ["flow", createFlowRequestHandler()],
  ["docs", createDocsRequestHandler()],
  ["developer", createDeveloperRequestHandler()],
  ["nft", createNftRequestHandler()],
  ["dash", createDashRequestHandler()],
  ["pay", createPayRequestHandler()]
];

for (const [name, handler] of handlers) {
  test(`${name} rejects malformed request URLs without crashing`, async () => {
    const response = await dispatchToHandler(handler, { url: "//" });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.match(JSON.stringify(payload), /INVALID_REQUEST_URL/);
  });
}
