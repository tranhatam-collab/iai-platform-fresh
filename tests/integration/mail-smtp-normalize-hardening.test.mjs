import assert from "node:assert/strict";
import test from "node:test";

import { buildNormalizedMessage } from "../../apps/mail-smtp/dist/normalize-message.js";

function normalize(rawHeaders) {
  const rawMime = Buffer.from(`${rawHeaders}\r\nSubject: hardening\r\n\r\nhello`, "utf8");
  return buildNormalizedMessage({
    auth: {
      allowedStreams: ["transactional"],
      credentialId: "smtpcred_123",
      defaultStream: "transactional",
      principal: "smtp-user",
      workspaceId: "ws_123"
    },
    envelopeFrom: "no-reply@tx.iai.one",
    rawMime,
    recipients: ["user@example.com"],
    stream: "transactional"
  });
}

const cpuMs = () => {
  const usage = process.cpuUsage();
  return (usage.user + usage.system) / 1000;
};

/**
 * Time `run`: one warm-up call, then `runs` measured calls. It reports three things, and each assertion below
 * says which one it relies on:
 *   - `elapsedMs`: the smallest CPU time (user + system, this process) of a measured call. It shows that the code
 *     CAN finish within a CPU budget; CPU time is the work the code does and does not grow when other work
 *     shares the cores.
 *   - `maxWallMs`: the largest real (wall-clock) time of a measured call. A loaded machine inflates it, so it is
 *     only compared with a ceiling far above the CPU budget: no measured call took a second of real time.
 *   - `result`: the value of the last call.
 * A warm-up that alone takes over a second (CPU or real time) is not noise: it is reported at once, with the
 * warm-up's wall time as `maxWallMs`, instead of repeating a slow parse.
 */
function fastest(run, { runs = 5 } = {}) {
  const warmUpWallStart = performance.now();
  const warmUpCpuStart = cpuMs();
  let result = run(); // warm-up
  const warmUpWallMs = performance.now() - warmUpWallStart;
  const warmUpCpuMs = cpuMs() - warmUpCpuStart;
  if (warmUpCpuMs > 1000 || warmUpWallMs > 1000) {
    return { elapsedMs: warmUpCpuMs, maxWallMs: warmUpWallMs, result };
  }

  let bestCpuMs = Infinity;
  let maxWallMs = 0;
  for (let index = 0; index < runs; index += 1) {
    const wallStart = performance.now();
    const cpuStart = cpuMs();
    result = run();
    bestCpuMs = Math.min(bestCpuMs, cpuMs() - cpuStart);
    maxWallMs = Math.max(maxWallMs, performance.now() - wallStart);
  }
  return { elapsedMs: bestCpuMs, maxWallMs, result };
}

// Takes ~4 s per address against the old uncapped regexes.
const CRAFTED_ADDRESS = `a@${"a.".repeat(40000)} b`;

test("crafted 80 KB bare address header is dropped: CPU min-of-5 under 100 ms, no call over 1 s of real time", () => {
  assert.equal(CRAFTED_ADDRESS.length > 80000, true);

  const { elapsedMs, maxWallMs, result } = fastest(() =>
    normalize(`From: ${CRAFTED_ADDRESS}\r\nTo: ${CRAFTED_ADDRESS}`)
  );

  assert.equal(result.from, undefined);
  assert.deepEqual(result.to, []);
  assert.ok(elapsedMs < 100, `fastest CPU time ${elapsedMs.toFixed(1)} ms, expected under 100 ms`);
  assert.ok(maxWallMs < 1000, `slowest real time ${maxWallMs.toFixed(1)} ms, expected under 1000 ms`);
});

test("crafted 80 KB angle-bracket value is dropped: CPU min-of-5 under 100 ms, no call over 1 s of real time", () => {
  const { elapsedMs, maxWallMs, result } = fastest(() =>
    normalize(`To: ${"<".repeat(80000)}\r\nCc: x <${CRAFTED_ADDRESS}>`)
  );

  assert.deepEqual(result.to, []);
  assert.deepEqual(result.cc, []);
  assert.ok(elapsedMs < 100, `fastest CPU time ${elapsedMs.toFixed(1)} ms, expected under 100 ms`);
  assert.ok(maxWallMs < 1000, `slowest real time ${maxWallMs.toFixed(1)} ms, expected under 1000 ms`);
});

/**
 * Growth of the parse time with the size of the input: the smaller and the larger crafted header are measured in
 * turns (small, large, small, large, ...) after a warm-up of both, so a change in machine load hits both alike,
 * and the smallest CPU time of each is compared. A single large call over 1 s (CPU or real time) is reported
 * at once as `tooSlow`.
 */
function measureGrowth(smallRepeats, largeRepeats, rounds) {
  const parse = (repeats) => {
    const address = `a@${"a.".repeat(repeats)} b`;
    return () => normalize(`From: ${address}\r\nTo: ${address}\r\nCc: x <${address}>`);
  };
  const runSmall = parse(smallRepeats);
  const runLarge = parse(largeRepeats);
  runSmall();
  runLarge();

  let bestSmall = Infinity;
  let bestLarge = Infinity;
  for (let round = 0; round < rounds; round += 1) {
    const smallStart = cpuMs();
    runSmall();
    bestSmall = Math.min(bestSmall, cpuMs() - smallStart);

    const wallStart = performance.now();
    const largeStart = cpuMs();
    runLarge();
    const largeCpu = cpuMs() - largeStart;
    const largeWall = performance.now() - wallStart;
    if (largeCpu > 1000 || largeWall > 1000) {
      return { large: Math.max(largeCpu, largeWall), ratio: Infinity, small: bestSmall, tooSlow: true };
    }
    bestLarge = Math.min(bestLarge, largeCpu);
  }
  // A floor of 1 ms keeps a near-instant small case from inflating the ratio.
  return { large: bestLarge, ratio: bestLarge / Math.max(bestSmall, 1), small: bestSmall, tooSlow: false };
}

test("parse time growth is not quadratic: 4x the input costs under 8x the CPU time", () => {
  // Machine-independent: a linear parse costs about 4x (a little more with allocation), a quadratic one about 16x
  // every time. A burst of load can still skew one measurement, so up to three attempts are made and the test
  // fails only if every attempt is at or above the bound; the bound itself is not loosened.
  const attempts = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const growth = measureGrowth(20000, 80000, 7);
    attempts.push(growth);
    assert.equal(
      growth.tooSlow,
      false,
      `a single call on the large input took ${growth.large.toFixed(0)} ms, over 1000 ms (attempt ${attempt})`
    );
    if (growth.ratio < 8) {
      return;
    }
  }

  assert.fail(
    `4x the input took 8x or more the CPU time in all 3 attempts: ${attempts
      .map((a) => `${a.ratio.toFixed(1)}x (${a.small.toFixed(2)} ms -> ${a.large.toFixed(2)} ms)`)
      .join("; ")}`
  );
});

test("one oversize mailbox does not hide the valid ones around it", () => {
  const result = normalize(
    `To: first@example.com, ${CRAFTED_ADDRESS}, "Last One" <last@example.com>`
  );

  assert.deepEqual(
    result.to.map((entry) => entry.email),
    ["first@example.com", "last@example.com"]
  );
  assert.equal(result.to[1].name, "Last One");
});

test("address length cap is 254 characters for a bare address", () => {
  const addressOfLength = (length) => `${"a".repeat(length - "@example.com".length)}@example.com`;

  assert.equal(normalize(`From: ${addressOfLength(254)}`).from?.email, addressOfLength(254));
  assert.equal(normalize(`From: ${addressOfLength(255)}`).from, undefined);
});

test("ordinary addresses still normalize", () => {
  const result = normalize(
    'From: "IAI Mail" <No-Reply@TX.iai.one>\r\nTo: User <user@example.com>, other@example.com\r\nReply-To: support@iai.one'
  );

  assert.deepEqual(result.from, { email: "no-reply@tx.iai.one", name: "IAI Mail" });
  assert.deepEqual(
    result.to.map((entry) => entry.email),
    ["user@example.com", "other@example.com"]
  );
  assert.equal(result.replyTo?.email, "support@iai.one");
});
