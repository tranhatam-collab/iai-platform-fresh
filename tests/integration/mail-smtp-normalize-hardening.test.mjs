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

/**
 * Time `run` the way a benchmark should: one warm-up call, then several measured calls, and report the
 * fastest. The question these tests ask is "can this code finish in under the limit", and the fastest of
 * several runs answers it without the noise of a loaded machine (a single slow run says nothing about the
 * code). The limit itself is not loosened. `result` is the value of the last call.
 */
function fastest(run, { runs = 5, clock = "cpu" } = {}) {
  // "cpu" (the default) counts the CPU time this process used instead of elapsed time. Elapsed time grows when
  // other work shares the cores, and the longer a run lasts the more of it is lost that way; CPU time measures
  // the work the code does, which is what the limits below are about. "wall" is the plain elapsed time.
  const now =
    clock === "cpu"
      ? () => {
          const usage = process.cpuUsage();
          return (usage.user + usage.system) / 1000;
        }
      : () => performance.now();
  const warmUpStartedAt = now();
  let result = run(); // warm-up
  const warmUpMs = now() - warmUpStartedAt;
  if (warmUpMs > 1000) {
    // Ten times the limit even once warmed up is not load noise; report it at once instead of repeating a slow parse.
    return { elapsedMs: warmUpMs, result };
  }

  let best = Infinity;
  for (let index = 0; index < runs; index += 1) {
    const startedAt = now();
    result = run();
    best = Math.min(best, now() - startedAt);
  }
  return { elapsedMs: best, result };
}

// Takes ~4 s per address against the old uncapped regexes.
const CRAFTED_ADDRESS = `a@${"a.".repeat(40000)} b`;

test("crafted 80 KB bare address header is dropped in well under 100 ms", () => {
  assert.equal(CRAFTED_ADDRESS.length > 80000, true);

  const { elapsedMs, result } = fastest(() =>
    normalize(`From: ${CRAFTED_ADDRESS}\r\nTo: ${CRAFTED_ADDRESS}`)
  );

  assert.equal(result.from, undefined);
  assert.deepEqual(result.to, []);
  assert.ok(elapsedMs < 100, `took ${elapsedMs.toFixed(1)} ms, expected well under 100 ms`);
});

test("crafted 80 KB angle-bracket value is dropped in well under 100 ms", () => {
  const { elapsedMs, result } = fastest(() =>
    normalize(`To: ${"<".repeat(80000)}\r\nCc: x <${CRAFTED_ADDRESS}>`)
  );

  assert.deepEqual(result.to, []);
  assert.deepEqual(result.cc, []);
  assert.ok(elapsedMs < 100, `took ${elapsedMs.toFixed(1)} ms, expected well under 100 ms`);
});

test("parsing time grows about linearly with the size of a crafted header, whatever the machine", () => {
  // Independent of machine speed: four times the input must not cost anywhere near sixteen times the time, which
  // is what a quadratic parse would do. Linear is about 4x; the bound leaves room for noise and allocation.
  const craftedOfSize = (repeats) => `a@${"a.".repeat(repeats)} b`;
  const timeFor = (repeats) => {
    const address = craftedOfSize(repeats);
    return fastest(() => normalize(`From: ${address}\r\nTo: ${address}\r\nCc: x <${address}>`), { runs: 7 }).elapsedMs;
  };

  const small = timeFor(20000);
  const large = timeFor(80000);
  const ratio = large / Math.max(small, 1); // a floor of 1 ms keeps a near-instant small case from inflating the ratio
  assert.ok(ratio < 8, `4x the input took ${ratio.toFixed(1)}x the time (${small.toFixed(2)} ms -> ${large.toFixed(2)} ms)`);
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
