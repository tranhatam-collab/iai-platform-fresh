/**
 * Versioned SQLite migrations for mail-api.
 *
 * Each migration is applied once, in order, inside a single `BEGIN IMMEDIATE`
 * transaction, and recorded in `schema_migrations` with a checksum of its SQL.
 * Applied migrations are immutable: if the stored checksum of a known version no
 * longer matches the SQL in this file, startup is refused instead of guessing.
 * A database that carries a version this build does not know (a newer release
 * ran against it) only produces a warning.
 *
 * 0001 is exactly the DDL the service created before migrations existed, so a
 * database from that time is adopted as is (every statement is IF NOT EXISTS and
 * no data is touched). Later migrations only add indexes or tables.
 */

import { createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

export interface Migration {
  name: string;
  sql: string;
  version: number;
}

const BASELINE_SQL = `
CREATE TABLE IF NOT EXISTS smtp_credentials (
  credential_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  principal TEXT NOT NULL,
  default_stream TEXT NOT NULL,
  allowed_streams_json TEXT NOT NULL,
  sender_identity_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(workspace_id, domain)
);

CREATE TABLE IF NOT EXISTS sender_identities (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  domain_id TEXT,
  email TEXT NOT NULL,
  allowed_streams_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  UNIQUE(workspace_id, email)
);

CREATE TABLE IF NOT EXISTS suppressions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  email TEXT NOT NULL,
  stream TEXT,
  reason TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_routes (
  route_id TEXT PRIMARY KEY,
  workspace_id TEXT,
  stream TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  message_idempotency_key TEXT NOT NULL,
  stream TEXT NOT NULL,
  sender_identity_id TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  reply_to_email TEXT,
  reply_to_name TEXT,
  subject TEXT,
  html_body TEXT,
  text_body TEXT,
  status TEXT NOT NULL,
  provider_route_id TEXT,
  metadata_json TEXT,
  tags_json TEXT,
  headers_json TEXT,
  queued_at TEXT,
  sent_at TEXT,
  last_event_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS message_events (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  provider_message_id TEXT,
  provider_type TEXT,
  source TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS delivery_attempts (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL,
  provider_route_id TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  provider_message_id TEXT,
  provider_response_code TEXT,
  provider_response_message TEXT,
  error_class TEXT,
  raw_response_json TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  next_retry_at TEXT,
  trace_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS smtp_queue_jobs (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_identifier TEXT,
  target_type TEXT,
  target_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_workspace_idempotency
ON messages (workspace_id, message_idempotency_key);
`;

/**
 * Indexes for the queries the service runs:
 * - messages: list/count by workspace (and stream) ordered by creation time;
 * - smtp_queue_jobs: queue depth and next-job lookups by status, projection and
 *   existence lookups by message;
 * - message_events / delivery_attempts: timeline and attempt lookups by message;
 * - suppressions: send-time check and list by workspace and recipient, list by time;
 * - provider_routes: route selection by stream.
 */
const INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_messages_workspace_created
ON messages (workspace_id, created_at, id);

CREATE INDEX IF NOT EXISTS idx_smtp_queue_jobs_status_created
ON smtp_queue_jobs (status, created_at);

CREATE INDEX IF NOT EXISTS idx_smtp_queue_jobs_message_created
ON smtp_queue_jobs (message_id, created_at);

CREATE INDEX IF NOT EXISTS idx_message_events_message_occurred
ON message_events (message_id, occurred_at, created_at);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_message_started
ON delivery_attempts (message_id, started_at, created_at);

CREATE INDEX IF NOT EXISTS idx_suppressions_workspace_email
ON suppressions (workspace_id, lower(email));

CREATE INDEX IF NOT EXISTS idx_suppressions_workspace_created
ON suppressions (workspace_id, created_at, id);

CREATE INDEX IF NOT EXISTS idx_provider_routes_stream_active
ON provider_routes (stream, active, priority, route_id);
`;

export const MIGRATIONS: readonly Migration[] = [
  { name: "baseline", sql: BASELINE_SQL, version: 1 },
  { name: "indexes", sql: INDEXES_SQL, version: 2 }
];

export class MigrationChecksumError extends Error {
  constructor(
    public readonly version: number,
    public readonly name: string
  ) {
    super(
      `SQLite migration ${String(version).padStart(4, "0")}_${name} was applied with different SQL than this build ships (checksum mismatch); refusing to start.`
    );
    this.name = "MigrationChecksumError";
  }
}

export function migrationChecksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

export interface MigrationResult {
  applied: number[];
  unknownVersions: number[];
}

/**
 * Bring `db` up to date. Safe to call on every start and from several processes
 * at once: the transaction takes the write lock up front (the connection's
 * busy_timeout applies while waiting), so one process applies a migration and the
 * others then see it recorded.
 */
export function applyMigrations(
  db: DatabaseSync,
  migrations: readonly Migration[] = MIGRATIONS,
  options: { onWarning?: (message: string) => void } = {}
): MigrationResult {
  const onWarning = options.onWarning ?? ((message: string) => console.warn(`[mail-api] ${message}`));
  const applied: number[] = [];
  const unknownVersions: number[] = [];

  db.exec("BEGIN IMMEDIATE;");
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        checksum TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    const recorded = new Map(
      (
        db.prepare("SELECT version, name, checksum FROM schema_migrations ORDER BY version;").all() as Array<{
          checksum: string;
          name: string;
          version: number;
        }>
      ).map((row) => [Number(row.version), row])
    );
    const known = new Set(migrations.map((migration) => migration.version));

    for (const version of recorded.keys()) {
      if (!known.has(version)) {
        unknownVersions.push(version);
      }
    }

    for (const migration of [...migrations].sort((left, right) => left.version - right.version)) {
      const row = recorded.get(migration.version);
      const checksum = migrationChecksum(migration.sql);

      if (row) {
        if (row.checksum !== checksum) {
          throw new MigrationChecksumError(migration.version, migration.name);
        }
        continue;
      }

      db.exec(migration.sql);
      db.prepare("INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?);").run(
        migration.version,
        migration.name,
        checksum,
        new Date().toISOString()
      );
      applied.push(migration.version);
    }

    db.exec("COMMIT;");
  } catch (error) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // The transaction may already be closed by the failing statement.
    }
    throw error;
  }

  if (unknownVersions.length > 0) {
    onWarning(
      `database has migration version(s) ${unknownVersions.join(", ")} that this build does not know; continuing (a newer release may have run against it)`
    );
  }

  return { applied, unknownVersions };
}
