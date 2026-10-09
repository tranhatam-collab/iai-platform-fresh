import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

// /health is liveness; /ready answers 503 when the commerce documents every page is built from
// cannot be read. The docs root is injected, so this runs without the private docs pack.
// Needs `pnpm --filter @iai/noos-web build`.

const { createNoosWebServer } = await import("../../apps/noos-web/dist/http-server.js");

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

function get(port, path) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port, path }, (response) => {
        let text = "";
        response.on("data", (chunk) => (text += chunk));
        response.on("end", () => resolve({ status: response.statusCode, text }));
      })
      .on("error", reject);
  });
}

async function withServer(docsRoot, run) {
  const server = createNoosWebServer({ docsRoot });
  const port = await listen(server);
  try {
    await run(port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("/ready is 200 when the catalog and pricing documents are readable", async () => {
  const root = mkdtempSync(join(tmpdir(), "noos-ready-"));
  try {
    mkdirSync(join(root, "NOOS_COMMERCE_FIXTURES_v0.1", "catalog"), { recursive: true });
    writeFileSync(join(root, "NOOS_COMMERCE_FIXTURES_v0.1", "catalog", "product_definitions_all_v1.json"), "{}");
    writeFileSync(join(root, "NOOS_COMMERCE_SCHEMA_PACK_v0.1.json"), "{}");
    await withServer(root, async (port) => {
      const ready = await get(port, "/ready");
      assert.equal(ready.status, 200);
      assert.equal(JSON.parse(ready.text).status, "ready");
      assert.equal((await get(port, "/health")).status, 200);
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test("/ready is 503 when the documents are missing or unparsable, and /health stays 200", async () => {
  const root = mkdtempSync(join(tmpdir(), "noos-ready-"));
  try {
    await withServer(root, async (port) => {
      const missing = await get(port, "/ready");
      assert.equal(missing.status, 503);
      assert.equal(JSON.parse(missing.text).status, "not_ready");
      assert.doesNotMatch(missing.text, /noos-ready-|ENOENT/u, "the response carries no path or error text");
      assert.equal((await get(port, "/health")).status, 200);
    });

    mkdirSync(join(root, "NOOS_COMMERCE_FIXTURES_v0.1", "catalog"), { recursive: true });
    writeFileSync(join(root, "NOOS_COMMERCE_FIXTURES_v0.1", "catalog", "product_definitions_all_v1.json"), "{not json");
    writeFileSync(join(root, "NOOS_COMMERCE_SCHEMA_PACK_v0.1.json"), "{}");
    await withServer(root, async (port) => {
      assert.equal((await get(port, "/ready")).status, 503);
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});
