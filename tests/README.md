# Tests

- `integration/` — fast in-process and handler-level suites, run by `pnpm test`.
- `e2e/` — process-level end-to-end suites. Each `*.iai.one` surface is started from its built output as a
  real child process on an ephemeral port and driven over HTTP/raw sockets. Run with `pnpm test:e2e`.
  - `support/harness.mjs` — `startService`, `startMailApi`, `request`, `rawRequest`, the `SURFACES` table.
  - `surfaces.e2e.test.mjs` — one contract applied to every surface; add a row to `SURFACES` for a new one.
- `support/` — shared helpers (`docs-fixtures.mjs` skips suites that need the private, gitignored docs pack).
