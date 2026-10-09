/**
 * startService picks a port by binding port 0 and closing it, so another process can take the
 * port before the child binds. These tests hold a port with a throwaway server and check that
 * an early EADDRINUSE exit is retried on a new port (bounded), and that nothing else is retried.
 *
 * Run: node --test tests/e2e/harness-port-retry.e2e.test.mjs
 */
import assert from "node:assert/strict";
import net from "node:net";
import { describe, test } from "node:test";

import { PORT_IN_USE_RETRIES, getFreePort, startService } from "./support/harness.mjs";

const FIXTURE = {
  name: "fixture",
  entry: "tests/e2e/support/fixtures/listen-service.mjs",
  portEnv: "PORT",
  hostEnv: "FIXTURE_HOST"
};

/**
 * Holds a port on 127.0.0.1 until close() is called. The harness's readiness probe may connect to
 * the held port (it cannot know another process owns it) and the holder never answers, so close()
 * destroys any open connection instead of waiting for it.
 */
async function holdPort() {
  const server = net.createServer();
  const sockets = new Set();
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    port: server.address().port,
    close: () =>
      new Promise((resolve) => {
        server.close(resolve);
        for (const socket of sockets) {
          socket.destroy();
        }
      })
  };
}

function portPicker(ports) {
  const picked = [];
  const getPort = async () => {
    const port = typeof ports === "function" ? await ports(picked.length) : ports[picked.length];
    picked.push(port);
    return port;
  };
  return { getPort, picked };
}

describe("startService port retry", () => {
  test("a port taken before the child binds is retried on a new port and the service starts", async () => {
    const held = await holdPort();
    const free = await getFreePort();
    const { getPort, picked } = portPicker([held.port, free]);
    let service;
    try {
      service = await startService({ ...FIXTURE, getPort });
      assert.deepEqual(picked, [held.port, free], "the second attempt must use the new port");
      assert.equal(service.port, free);
      const response = await fetch(`${service.baseUrl}/health`);
      assert.equal(response.status, 200);
    } finally {
      await service?.stop();
      await held.close();
    }
  });

  test("the retry is bounded: a port that stays taken fails after the first try plus the retries", async () => {
    const held = await holdPort();
    const { getPort, picked } = portPicker(() => held.port);
    try {
      await assert.rejects(
        () => startService({ ...FIXTURE, getPort }),
        (error) => /EADDRINUSE/u.test(error.message) && /\[fixture\]/u.test(error.message)
      );
      assert.equal(picked.length, PORT_IN_USE_RETRIES + 1);
    } finally {
      await held.close();
    }
  });

  test("another early exit is not retried and keeps failing the start", async () => {
    const { getPort, picked } = portPicker(async () => getFreePort());
    await assert.rejects(
      () => startService({ ...FIXTURE, env: { FIXTURE_EXIT_CODE: "3" }, getPort }),
      (error) => /process exited early with code 3/u.test(error.message) && /exiting early on request/u.test(error.message)
    );
    assert.equal(picked.length, 1, "a failure that is not EADDRINUSE must not be retried");
  });

  test("a readiness timeout is not retried and the timeout is not multiplied", async () => {
    // The child stays alive but never listens, so only the readiness timeout can end the wait.
    const { getPort, picked } = portPicker(async () => getFreePort());
    const started = Date.now();
    await assert.rejects(
      () => startService({ ...FIXTURE, env: { FIXTURE_NO_LISTEN: "1" }, readyTimeoutMs: 1500, getPort }),
      (error) => /not ready within 1500ms/u.test(error.message)
    );
    assert.equal(picked.length, 1);
    assert.ok(Date.now() - started < 6000, "the readiness timeout must apply once");
  });
});
