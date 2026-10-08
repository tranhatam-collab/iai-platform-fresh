# Tests

- `integration/` — fast in-process and handler-level suites, run by `pnpm test`.
- `e2e/` — process-level end-to-end suites. Each `*.iai.one` surface is started from its built output as a
  real child process on an ephemeral port and driven over HTTP/raw sockets. Run with `pnpm test:e2e`.
  - `support/harness.mjs` — `startService`, `startMailApi`, `request`, `rawRequest`, the `SURFACES` table.
  - `surfaces.e2e.test.mjs` — one contract applied to every surface; add a row to `SURFACES` for a new one.
- `support/` — shared helpers (`docs-fixtures.mjs` skips suites that need the private, gitignored docs pack).

## Full lane (private fixtures, pinned)

The default lane (`ci.yml`) runs on a clean clone, so suites that need the private docs pack or the CIOS
sibling checkout report a visible skip. The `Full lane` workflow (`full-lane.yml`) runs everything with both
present and `REQUIRE_DOCS_FIXTURES=1`, so a missing fixture is a failure rather than a skip.

- It is started manually (give the commit to test in `ref`), on pushes to `main`, and nightly. It is not
  triggered by `pull_request`, so secrets never reach fork code.
- Pins live in repository settings, not in the repo: variables `DOCS_PACK_REPO`, `DOCS_PACK_SHA`, `CIOS_REPO`,
  `CIOS_SHA` (full 40-character commit ids) and secret `DOCS_PACK_TOKEN` (read-only). Optional variable
  `DOCS_PACK_SUBDIR` names the folder inside the docs pack repository that holds the docs tree.
- The job uses the `full-lane` environment: store `DOCS_PACK_TOKEN` as a secret of that environment, limit the
  environment to the `main` branch and, if you want, require a reviewer, so a workflow edited on another branch
  cannot read the token. Remember that a manual run with `ref` set to a pull request head executes that code next
  to the fixtures, so only run it on heads you have read.
- Until the variables and the secret exist, every push to `main` and the nightly run fail at the preflight step on
  purpose.
- Logs are public, so the workflow prints only counts and failing test names; reproduce a failure locally with
  the same pinned commits and `REQUIRE_DOCS_FIXTURES=1 pnpm test`.
