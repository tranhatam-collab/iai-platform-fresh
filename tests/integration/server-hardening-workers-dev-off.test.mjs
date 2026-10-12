/**
 * Workers that are reached through their own routes keep the default
 * *.workers.dev address and per-version preview URLs switched off in their
 * wrangler configuration, so a deploy never reopens them.
 *
 * Covers verify-runtime and trust-iai-one-starter. The config files are read as
 * text; the top-level keys (before the first table header) must switch both off,
 * and neither key may be set to true anywhere in the file (an environment table
 * would otherwise override the top level). Every wrangler config in the
 * repository must be either checked here or listed in EXCLUDED with a reason, so a
 * new Worker cannot slip past this test unnoticed.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONFIGS = ["apps/verify-runtime/wrangler.toml", "trust-iai-one-starter/wrangler.toml"];
// Configs that are not covered by this check, and why.
const EXCLUDED = {
  "apps/developer/wrangler.jsonc": "JSON config of another Worker; not part of this change",
  "pay.iai.one/wrangler.jsonc": "belongs to the pay.iai.one work, which is handled separately"
};
const SKIPPED_DIRECTORIES = new Set([".git", ".wrangler", "dist", "node_modules"]);

export function findWranglerConfigs(directory, prefix = "") {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        found.push(...findWranglerConfigs(path.join(directory, entry.name), `${prefix}${entry.name}/`));
      }
    } else if (/^wrangler\.(toml|jsonc?)$/u.test(entry.name)) {
      found.push(`${prefix}${entry.name}`);
    }
  }
  return found.sort();
}

export function setsEnabledAnywhere(toml) {
  return toml
    .split("\n")
    .map((line) => line.replace(/\s#.*$/u, "").trim())
    .filter((line) => /^(workers_dev|preview_urls)\s*=\s*true\b/u.test(line));
}

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

  test(`${relativePath} does not turn either setting on in any table`, () => {
    assert.deepEqual(setsEnabledAnywhere(readFileSync(path.join(root, relativePath), "utf8")), []);
  });
}

test("every wrangler config in the repository is checked here or excluded with a reason", () => {
  const known = new Set([...CONFIGS, ...Object.keys(EXCLUDED)]);
  assert.deepEqual(findWranglerConfigs(root).filter((file) => !known.has(file)), []);
  for (const file of Object.keys(EXCLUDED)) {
    assert.ok(findWranglerConfigs(root).includes(file), `${file} is excluded but does not exist`);
  }
});

test("the readers see a true setting in an environment table and find configs by name", () => {
  const sample = ['workers_dev = false', "[env.staging]", "workers_dev = true # staging", "[env.other]", "preview_urls = false"].join("\n");
  assert.deepEqual(setsEnabledAnywhere(sample), ["workers_dev = true"]);
});

test("the reader only counts top-level keys and ignores comments", () => {
  const sample = ['name = "x"', "# workers_dev = true", "workers_dev = false # off", "[vars]", "preview_urls = true"].join("\n");
  assert.deepEqual(topLevelValues(sample), { name: '"x"', workers_dev: "false" });
});
