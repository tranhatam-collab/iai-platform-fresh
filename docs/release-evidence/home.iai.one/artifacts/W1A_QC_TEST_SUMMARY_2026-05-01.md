# W1A_QC_TEST_SUMMARY_2026-05-01

- Date: `2026-05-01`
- Surface: `home.iai.one`
- Status: `PASS_REPO_SIDE`

## Commands Run

| Command | Result |
|---|---:|
| `pnpm test:home` | PASS `5/5` |
| `pnpm test:root` | PASS `5/5` |
| `pnpm test:docs` | PASS `5/5` |
| `pnpm test:app` | PASS `4/4` |
| `pnpm --filter @iai/developer build` | PASS |
| `pnpm --filter @iai/developer typecheck` | PASS |
| `node --test tests/integration/developer-surface.test.mjs` | PASS `6/6` |
| `pnpm test:pay` | PASS `60/60` |
| `pnpm test:web` | PASS `3/3` |
| `node --check trust-iai-one-starter/scripts/trust-state-builder.mjs` | PASS |
| `node --check trust-iai-one-starter/public/site.js` | PASS |
| `node scripts/trust-state-builder.mjs` with real DNS/HTTP | PASS, `13 verified / 5 declared` |

## Home-Specific Signals

- default home HTML does not expose `https://web.iai.one`
- `/health` returns `web_surface_enabled=false`
- `/health` returns `web_url=null`
- explicit re-enable path remains test-covered
- footer exposes `https://docs.iai.one/legal/iai-flow/`
- footer exposes `Angel Edu Tam Foundation Inc`
- EN footer exposes `Legal entity: Angel Edu Tam Foundation Inc`

## Deferred Evidence

- screenshot pack: pending preview URL
- Lighthouse: pending preview URL
- production smoke: pending founder deploy approval
