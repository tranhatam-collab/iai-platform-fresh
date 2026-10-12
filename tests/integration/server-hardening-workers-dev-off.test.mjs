/**
 * Workers that are reached through their own routes keep the default
 * *.workers.dev address and per-version preview URLs switched off in their
 * wrangler configuration, so a deploy never reopens them.
 *
 * Covers verify-runtime and trust-iai-one-starter. The config files are read as
 * text; only top-level keys (before the first table header) count.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONFIGS = ["apps/verify-runtime/wrangler.toml", "trust-iai-one-starter/wrangler.toml"];

export function topLevelValues(toml) {
  const values = {};
  for (const rawLine of toml.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("[")) {
      break;
    }
    const match = /^([A-Za-z_][\w-]*)\s*=\s*(.+?)\s*(?:#.*)?$/.exec(line);
    if (match) {
      values[match[1]] = match[2];
    }
  }
  return values;
}

for (const relativePath of CONFIGS) {
  test(`${relativePath} turns off workers.dev and preview URLs`, () => {
    const values = topLevelValues(readFileSync(path.join(root, relativePath), "utf8"));
    assert.equal(values.workers_dev, "false");
    assert.equal(values.preview_urls, "false");
  });
}

test("the reader only counts top-level keys and ignores comments", () => {
  const sample = ['name = "x"', "# workers_dev = true", "workers_dev = false # off", "[vars]", "preview_urls = true"].join("\n");
  assert.deepEqual(topLevelValues(sample), { name: '"x"', workers_dev: "false" });
});
