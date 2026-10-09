/**
 * Versioned SQLite migrations for mail-api: schema_migrations bookkeeping,
 * idempotent startup, adoption of a database created before migrations existed,
 * checksum protection, and indexes that keep the service's queries off full
 * table scans.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test, { mock } from "node:test";

import { createFlowApiRequestHandler } from "../../apps/mail-api/dist/server.js";
import { createSmtpInternalBackend } from "../../apps/mail-api/dist/smtp-internal.js";
import { MIGRATIONS, MigrationChecksumError, applyMigrations, migrationChecksum } from "../../apps/mail-api/dist/migrations.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const API_KEY = "mail-api-key-for-tests";
const WORKSPACE = "ws_migrations";
const SEED = {
  blockedRecipient: "blocked@example.com",
  defaultSender: "ops@migrations.example",
  password: "smtp-secret",
  primaryDomain: "migrations.example",
  username: "user-migrations",
  workspaceId: WORKSPACE
};

function tempDb() {
  const dbPath = `/tmp/iai-mail-api-migrations-${randomUUID()}.sqlite`;
  const cleanup = () => {
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(`${dbPath}${suffix}`, { force: true });
    }
  };
  return { cleanup, dbPath, url: `sqlite:${dbPath}` };
}

function openBackend(url) {
  return createSmtpInternalBackend({ apiKey: API_KEY, databaseUrl: url, seed: SEED });
}

function withDb(dbPath, fn) {
  const db = new DatabaseSync(dbPath);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

const rowsOf = (db, sql, ...params) => db.prepare(sql).all(...params);
const normalize = (rows) => rows.map((row) => ({ ...row }));

test("migrations are recorded once, in order, with the checksum of their SQL", () => {
  const { cleanup, dbPath, url } = tempDb();
  try {
    openBackend(url).close();
    withDb(dbPath, (db) => {
      const recorded = normalize(rowsOf(db, "SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version;"));
      assert.deepEqual(
        recorded.map((row) => [row.version, row.name, row.checksum]),
        MIGRATIONS.map((migration) => [migration.version, migration.name, migrationChecksum(migration.sql)])
      );
      assert.ok(recorded.every((row) => !Number.isNaN(Date.parse(row.applied_at))));
    });
  } finally {
    cleanup();
  }
});

test("shipped migrations are immutable: their checksums are pinned", () => {
  // If this fails, a migration that may already be applied somewhere was edited.
  // Add a new migration instead of changing an existing one.
  assert.deepEqual(
    MIGRATIONS.map((migration) => [migration.version, migration.name, migrationChecksum(migration.sql)]),
    [
      [1, "baseline", "9093cc4ad281ade360380076c9ec053586681b5404783178c318415bb8937523"],
      [2, "indexes", "01f965e4000eccfaf23224d1ed68dd405d4de4e3c5f2d2b68207e1a920936949"],
      [3, "queue_retry", "820fa0fb24b9d97438059594fa7cad59a5835840e131722b26a26dbecf2b8b87"]
    ]
  );
});

test("starting twice leaves schema, bookkeeping and data unchanged", async () => {
  const { cleanup, dbPath, url } = tempDb();
  try {
    const first = openBackend(url);
    const handler = createFlowApiRequestHandler({ smtpInternalBackend: first });
    const sent = await dispatchToHandler(handler, {
      body: JSON.stringify({
        from: { email: "ops@migrations.example" },
        message_idempotency_key: "idem-twice",
        stream: "transactional",
        text: "hello",
        to: [{ email: "customer@example.com" }]
      }),
      headers: { authorization: `Bearer ${API_KEY}`, "x-workspace-id": WORKSPACE },
      method: "POST",
      url: "/v1/send"
    });
    assert.equal(sent.status, 202);
    first.close();

    const snapshot = () =>
      withDb(dbPath, (db) => ({
        master: normalize(rowsOf(db, "SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY type, name;")),
        messages: normalize(rowsOf(db, "SELECT id, workspace_id, status FROM messages ORDER BY id;")),
        migrations: normalize(rowsOf(db, "SELECT * FROM schema_migrations ORDER BY version;")),
        suppressions: normalize(rowsOf(db, "SELECT id, email FROM suppressions ORDER BY id;"))
      }));
    const before = snapshot();
    assert.equal(before.messages.length, 1);

    openBackend(url).close();
    assert.deepEqual(snapshot(), before);

    // applyMigrations on its own is a no-op the second time too.
    withDb(dbPath, (db) => {
      assert.deepEqual(applyMigrations(db), { applied: [], unknownVersions: [] });
    });
    assert.deepEqual(snapshot(), before);
  } finally {
    cleanup();
  }
});

test("a database created before migrations existed is adopted and keeps its data", async () => {
  const { cleanup, dbPath, url } = tempDb();
  try {
    // The pre-migration schema is the baseline DDL, with no schema_migrations table.
    withDb(dbPath, (db) => {
      db.exec(MIGRATIONS[0].sql);
      const now = new Date().toISOString();
      db.prepare(
        "INSERT INTO suppressions (id, workspace_id, email, stream, reason, active, created_at) VALUES ('sup_old', ?, 'old@example.com', NULL, 'manual', 1, ?);"
      ).run(WORKSPACE, now);
      db.prepare(
        "INSERT INTO audit_logs (id, workspace_id, action, actor_type, created_at) VALUES ('aud_old', ?, 'legacy.action', 'system', ?);"
      ).run(WORKSPACE, now);
      assert.equal(rowsOf(db, "SELECT name FROM sqlite_master WHERE name = 'schema_migrations';").length, 0);
    });

    const backend = openBackend(url);
    try {
      const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
      const listed = await dispatchToHandler(handler, {
        headers: { authorization: `Bearer ${API_KEY}`, "x-workspace-id": WORKSPACE },
        method: "GET",
        url: "/v1/suppressions?email=old@example.com"
      });
      assert.equal((await listed.json()).data.total, 1, "pre-existing row is still served");
    } finally {
      backend.close();
    }

    withDb(dbPath, (db) => {
      assert.equal(rowsOf(db, "SELECT version FROM schema_migrations ORDER BY version;").length, MIGRATIONS.length);
      assert.equal(rowsOf(db, "SELECT id FROM audit_logs WHERE id = 'aud_old';").length, 1);
      assert.equal(rowsOf(db, "SELECT id FROM suppressions WHERE id = 'sup_old';").length, 1);
      const indexNames = rowsOf(db, "SELECT name FROM sqlite_master WHERE type = 'index';").map((row) => row.name);
      for (const name of ["idx_messages_workspace_created", "idx_suppressions_workspace_email", "idx_smtp_queue_jobs_status_created"]) {
        assert.ok(indexNames.includes(name), `${name} created on the adopted database`);
      }
    });
  } finally {
    cleanup();
  }
});

test("re-running the original DDL against a migrated database does not fail or change data", () => {
  const { cleanup, dbPath, url } = tempDb();
  try {
    openBackend(url).close();
    withDb(dbPath, (db) => {
      const before = normalize(rowsOf(db, "SELECT type, name, sql FROM sqlite_master ORDER BY type, name;"));
      assert.doesNotThrow(() => db.exec(MIGRATIONS[0].sql));
      assert.doesNotThrow(() => db.exec(MIGRATIONS[1].sql));
      assert.deepEqual(normalize(rowsOf(db, "SELECT type, name, sql FROM sqlite_master ORDER BY type, name;")), before);
    });
  } finally {
    cleanup();
  }
});

test("a modified checksum refuses to start, and nothing else changes", () => {
  const { cleanup, dbPath, url } = tempDb();
  try {
    openBackend(url).close();
    withDb(dbPath, (db) => {
      db.prepare("UPDATE schema_migrations SET checksum = 'tampered' WHERE version = 1;").run();
    });

    assert.throws(() => openBackend(url), /checksum mismatch/u);
    assert.throws(() => withDb(dbPath, (db) => applyMigrations(db)), MigrationChecksumError);

    withDb(dbPath, (db) => {
      // The failed attempt rolled back: the stored value is untouched and no version was added.
      assert.equal(rowsOf(db, "SELECT checksum FROM schema_migrations WHERE version = 1;")[0].checksum, "tampered");
      assert.equal(rowsOf(db, "SELECT version FROM schema_migrations;").length, MIGRATIONS.length);
    });
  } finally {
    cleanup();
  }
});

test("a version this build does not know only produces a warning", () => {
  const { cleanup, dbPath, url } = tempDb();
  const warn = mock.method(console, "warn", () => {});
  try {
    openBackend(url).close();
    withDb(dbPath, (db) => {
      db.prepare("INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (99, 'from_the_future', 'x', ?);").run(
        new Date().toISOString()
      );
    });

    const backend = openBackend(url); // does not throw
    backend.close();
    assert.ok(
      warn.mock.calls.some((call) => /99/u.test(String(call.arguments[0]))),
      "the unknown version is mentioned in a warning"
    );
    withDb(dbPath, (db) => {
      assert.equal(rowsOf(db, "SELECT version FROM schema_migrations WHERE version = 99;").length, 1, "it is left alone");
    });
  } finally {
    warn.mock.restore();
    cleanup();
  }
});

test("a failing migration rolls back completely and is not recorded", () => {
  const db = new DatabaseSync(":memory:");
  try {
    const broken = [
      { name: "ok", sql: "CREATE TABLE t_ok (id TEXT PRIMARY KEY);", version: 1 },
      { name: "broken", sql: "CREATE TABLE t_half (id TEXT PRIMARY KEY); CREATE INDEX nope ON missing_table (x);", version: 2 }
    ];
    assert.throws(() => applyMigrations(db, broken));
    assert.equal(rowsOf(db, "SELECT name FROM sqlite_master WHERE name IN ('t_ok', 't_half', 'schema_migrations');").length, 0);
  } finally {
    db.close();
  }
});

// --- indexes: no full table scans on the hot tables ---------------------------

const HOT_TABLES = ["messages", "smtp_queue_jobs", "suppressions", "message_events", "delivery_attempts"];

async function exercise(handler, headers) {
  const get = (url) => dispatchToHandler(handler, { headers, method: "GET", url });
  const send = (overrides) =>
    dispatchToHandler(handler, {
      body: JSON.stringify({
        from: { email: "ops@migrations.example" },
        message_idempotency_key: `idem-${randomUUID()}`,
        stream: "transactional",
        subject: "explain",
        text: "hello",
        to: [{ email: "customer@example.com" }],
        ...overrides
      }),
      headers,
      method: "POST",
      url: "/v1/send"
    });

  const sent = await send({});
  assert.equal(sent.status, 202);
  const messageId = (await sent.json()).data.message_id;
  await send({ to: [{ email: "blocked@example.com" }] }); // send-time suppression check
  await send({ stream: "marketing" }); // route selection for a stream without a route

  await get("/v1/messages");
  await get("/v1/messages?stream=transactional&page=1&page_size=10");
  await get("/v1/messages?to=customer@example.com"); // detail-derived filter (scan path)
  await get(`/v1/messages/${messageId}`);
  await get(`/v1/messages/${messageId}/events`);
  await get("/v1/suppressions");
  await get("/v1/suppressions?email=blocked@example.com&active_only=true");
  await dispatchToHandler(handler, { method: "GET", url: "/health" });
  await dispatchToHandler(handler, { method: "GET", url: "/ready" });
  await dispatchToHandler(handler, { method: "GET", url: "/v1/health/dependencies" });
}

test("the service's own queries use indexes: EXPLAIN QUERY PLAN shows no SCAN of the main tables", async () => {
  const { cleanup, dbPath, url } = tempDb();
  const recorded = new Set();
  const originalPrepare = DatabaseSync.prototype.prepare;
  DatabaseSync.prototype.prepare = function patchedPrepare(sql, ...rest) {
    recorded.add(String(sql));
    return originalPrepare.call(this, sql, ...rest);
  };

  try {
    const backend = openBackend(url);
    try {
      const handler = createFlowApiRequestHandler({ smtpInternalBackend: backend });
      await exercise(handler, { authorization: `Bearer ${API_KEY}`, "x-workspace-id": WORKSPACE });
    } finally {
      backend.close();
    }
  } finally {
    DatabaseSync.prototype.prepare = originalPrepare;
  }

  try {
    const statements = [...recorded].map((sql) => sql.trim().replace(/;\s*$/u, "")).filter((sql) => /^(SELECT|UPDATE|DELETE)\b/iu.test(sql));
    assert.ok(statements.length >= 15, `expected to record the service's queries, got ${statements.length}`);
    assert.ok(statements.some((sql) => /FROM messages/u.test(sql) && /ORDER BY created_at DESC/u.test(sql)), "list query recorded");
    assert.ok(statements.some((sql) => /FROM suppressions/u.test(sql)), "suppression queries recorded");
    assert.ok(statements.some((sql) => /FROM smtp_queue_jobs/u.test(sql)), "queue queries recorded");

    withDb(dbPath, (db) => {
      const scans = [];
      for (const sql of statements) {
        const plan = rowsOf(db, `EXPLAIN QUERY PLAN ${sql}`);
        for (const step of plan) {
          const detail = String(step.detail);
          for (const table of HOT_TABLES) {
            // "SCAN messages" is a full scan; "SCAN j" style aliases are checked through the table name in SEARCH/SCAN text.
            if (new RegExp(`^SCAN (${table}|[a-z]+ AS ${table})\\b`, "u").test(detail) || new RegExp(`^SCAN ${table}$`, "u").test(detail)) {
              scans.push(`${detail}  <-  ${sql.replace(/\s+/gu, " ").slice(0, 160)}`);
            }
          }
        }
      }
      assert.deepEqual(scans, [], `full table scans found:\n${scans.join("\n")}`);
    });
  } finally {
    cleanup();
  }
});

test("the expected indexes exist and the list query uses the workspace/created_at index", () => {
  const { cleanup, dbPath, url } = tempDb();
  try {
    openBackend(url).close();
    withDb(dbPath, (db) => {
      const names = rowsOf(db, "SELECT name FROM sqlite_master WHERE type = 'index';").map((row) => row.name);
      for (const name of [
        "idx_messages_workspace_created",
        "idx_smtp_queue_jobs_status_created",
        "idx_smtp_queue_jobs_message_created",
        "idx_message_events_message_occurred",
        "idx_delivery_attempts_message_started",
        "idx_suppressions_workspace_email",
        "idx_suppressions_workspace_created",
        "idx_provider_routes_stream_active"
      ]) {
        assert.ok(names.includes(name), name);
      }

      const plan = rowsOf(
        db,
        "EXPLAIN QUERY PLAN SELECT id FROM messages WHERE EXISTS (SELECT 1 FROM smtp_queue_jobs j WHERE j.message_id = messages.id) AND workspace_id = ? ORDER BY created_at DESC, id ASC LIMIT ? OFFSET ?"
      ).map((step) => String(step.detail));
      assert.ok(plan.some((detail) => /USING (COVERING )?INDEX idx_messages_workspace_created/u.test(detail)), plan.join("\n"));
      assert.ok(!plan.some((detail) => /USE TEMP B-TREE FOR ORDER BY/u.test(detail)), "ordered by the index, no sort step");
    });
  } finally {
    cleanup();
  }
});
