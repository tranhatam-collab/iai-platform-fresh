# W1B_QC_TEST_SUMMARY_2026-05-01

- Date: `2026-05-01`
- Surface: `docs.iai.one`
- Status: `PASS_REPO_SIDE`

## Commands Run

| Command | Result |
|---|---:|
| `pnpm typecheck:docs` | PASS |
| `pnpm test:docs` | PASS `5/5` |

## Docs-Specific Signals

- `/health` exposes `service=iai-docs`
- `/` renders default VI docs shell
- `/?lang=en` renders explicit EN docs shell
- canonical metadata for `https://docs.iai.one/` is asserted
- missing routes return explicit docs 404
- pay-docs integration checker passes in no-write mode

## Deferred Evidence

- screenshot pack: pending preview URL
- Lighthouse: pending preview URL
- production smoke: pending founder deploy approval
