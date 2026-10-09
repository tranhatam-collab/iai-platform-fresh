/**
 * startAll must not leave services running when one of them fails to start.
 * Run: node --test tests/e2e/harness-start-all.e2e.test.mjs
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { builtEntryAvailable, skipUnlessBuilt, startAll, startService } from "./support/harness.mjs";

const FLOW = "apps/flow/dist/index.js";

describe("startAll", { skip: skipUnlessBuilt(builtEntryAvailable(FLOW), `${FLOW} not built`) }, () => {
  const flow = () => startService({ name: "flow", entry: FLOW, portEnv: "FLOW_PORT", hostEnv: "FLOW_HOST" });

  test("returns the services in the order of the starters", async () => {
    const services = await startAll([flow, flow]);
    try {
      assert.equal(services.length, 2);
      assert.ok(services.every((service) => service.isRunning()));
      assert.notEqual(services[0].port, services[1].port);
    } finally {
      await Promise.all(services.map((service) => service.stop()));
    }
  });

  test("stops the services that did start when another one fails, and reports that failure", async () => {
    const started = [];
    const recorded = async () => {
      const service = await flow();
      started.push(service);
      return service;
    };
    try {
      await assert.rejects(
        () => startAll([recorded, () => startService({ name: "missing", entry: "apps/does-not-exist/dist/index.js", portEnv: "PORT" }), recorded]),
        /apps\/does-not-exist\/dist\/index\.js is missing/u
      );
      assert.equal(started.length, 2, "the other two starters ran to completion");
      assert.deepEqual(
        started.map((service) => service.isRunning()),
        [false, false],
        "no service is left running"
      );
    } finally {
      // If the cleanup regresses, do not leave the processes behind: fail the assertion above, not the run.
      await Promise.all(started.map((service) => service.stop()));
    }
  });
});
