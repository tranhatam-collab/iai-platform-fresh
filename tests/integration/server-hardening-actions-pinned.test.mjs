import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

// Every third-party GitHub Action in .github/workflows is referenced by a full 40-character
// commit SHA with a version comment, so a moved tag cannot change what CI runs.
// A workflow may stay unpinned only if it is named in EXCEPTIONS with a reason. The list may
// only shrink: each exception must still contain an unpinned reference, so a fixed workflow has
// to be removed from the list in the same change.

const workflowsDir = new URL("../../.github/workflows/", import.meta.url);

const EXCEPTIONS = new Map([
  ["ai-release.yml", "the release workflow is handled by a separate tracked change"],
  ["continuous-pay-audit.yml", "the workflow is changed by a separate open pull request"]
]);

const USES = /^\s*(?:-\s*)?uses:\s*(\S+)(?:\s+#\s*(.*))?$/u;
const PINNED = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/u;
const VERSION_COMMENT = /^v\d+(?:\.\d+){0,2}\b/u;

function usesIn(file) {
  const text = readFileSync(new URL(file, workflowsDir), "utf8");
  return text
    .split("\n")
    .map((line, index) => ({ line: index + 1, match: USES.exec(line) }))
    .filter(({ match }) => match && !match[1].startsWith("./"))
    .map(({ line, match }) => ({ comment: match[2] ?? "", line, ref: match[1] }));
}

const files = readdirSync(workflowsDir).filter((name) => /\.ya?ml$/u.test(name));

test("workflow files exist and the exceptions name real files", () => {
  assert.ok(files.length > 0);
  for (const name of EXCEPTIONS.keys()) {
    assert.ok(files.includes(name), `${name} is listed as an exception but does not exist`);
  }
});

for (const file of files.filter((name) => !EXCEPTIONS.has(name))) {
  test(`${file}: every action is pinned to a full commit SHA with a version comment`, () => {
    const uses = usesIn(file);
    assert.ok(uses.length > 0, "no action references found");
    for (const { comment, line, ref } of uses) {
      assert.match(ref, PINNED, `${file}:${line} ${ref} is not pinned to a 40-character SHA`);
      assert.match(comment, VERSION_COMMENT, `${file}:${line} ${ref} has no version comment`);
    }
  });
}

for (const [file, reason] of EXCEPTIONS) {
  test(`${file}: exception is still needed (${reason})`, () => {
    const unpinned = usesIn(file).filter(({ ref }) => !PINNED.test(ref));
    assert.ok(unpinned.length > 0, `${file} is fully pinned: remove it from EXCEPTIONS`);
  });
}

test("the same action is pinned to the same commit everywhere", () => {
  const shas = new Map();
  for (const file of files.filter((name) => !EXCEPTIONS.has(name))) {
    for (const { ref } of usesIn(file)) {
      const [action, sha] = ref.split("@");
      assert.equal(shas.get(action) ?? sha, sha, `${action} is pinned to two different commits`);
      shas.set(action, sha);
    }
  }
});
