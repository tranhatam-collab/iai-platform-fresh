/**
 * Minimal in-memory stand-in for the `usage_events` D1 table.
 *
 * It mimics the one SQLite behaviour that matters here: `id` is the primary
 * key, so inserting an existing id throws a UNIQUE constraint error unless the
 * statement carries `ON CONFLICT(id) DO NOTHING`, in which case it is a no-op
 * reporting `meta.changes === 0`.
 */

export interface MockD1 {
  db: D1Database;
  /** Stored rows keyed by id; each row is the bound argument list. */
  rows: Map<string, unknown[]>;
  /** SQL text of every statement prepared. */
  statements: string[];
  /** When set, the next run() rejects with this error (then clears). */
  failNext: Error | undefined;
}

export function createMockD1(): MockD1 {
  const mock: MockD1 = {
    db: undefined as unknown as D1Database,
    rows: new Map(),
    statements: [],
    failNext: undefined,
  };

  mock.db = {
    prepare(sql: string) {
      mock.statements.push(sql);
      const ignoresDuplicates = /ON\s+CONFLICT\s*\(\s*id\s*\)\s+DO\s+NOTHING/i.test(sql);
      return {
        bind(...args: unknown[]) {
          return {
            async run() {
              if (mock.failNext) {
                const err = mock.failNext;
                mock.failNext = undefined;
                throw err;
              }
              const id = String(args[0]);
              if (mock.rows.has(id)) {
                if (!ignoresDuplicates) {
                  throw new Error(`D1_ERROR: UNIQUE constraint failed: usage_events.id`);
                }
                return { success: true, meta: { changes: 0 } };
              }
              mock.rows.set(id, args);
              return { success: true, meta: { changes: 1 } };
            },
          };
        },
      };
    },
  } as unknown as D1Database;

  return mock;
}
