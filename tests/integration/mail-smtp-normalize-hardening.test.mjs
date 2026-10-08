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

function timed(run) {
  const startedAt = performance.now();
  const result = run();
  return { elapsedMs: performance.now() - startedAt, result };
}

// Takes ~4 s per address against the old uncapped regexes.
const CRAFTED_ADDRESS = `a@${"a.".repeat(40000)} b`;

test("crafted 80 KB bare address header is dropped in well under 100 ms", () => {
  assert.equal(CRAFTED_ADDRESS.length > 80000, true);

  const { elapsedMs, result } = timed(() =>
    normalize(`From: ${CRAFTED_ADDRESS}\r\nTo: ${CRAFTED_ADDRESS}`)
  );

  assert.equal(result.from, undefined);
  assert.deepEqual(result.to, []);
  assert.ok(elapsedMs < 100, `took ${elapsedMs.toFixed(1)} ms, expected well under 100 ms`);
});

test("crafted 80 KB angle-bracket value is dropped in well under 100 ms", () => {
  const { elapsedMs, result } = timed(() =>
    normalize(`To: ${"<".repeat(80000)}\r\nCc: x <${CRAFTED_ADDRESS}>`)
  );

  assert.deepEqual(result.to, []);
  assert.deepEqual(result.cc, []);
  assert.ok(elapsedMs < 100, `took ${elapsedMs.toFixed(1)} ms, expected well under 100 ms`);
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
