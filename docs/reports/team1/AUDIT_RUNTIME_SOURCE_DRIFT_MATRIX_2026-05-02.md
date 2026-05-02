# AUDIT_RUNTIME_SOURCE_DRIFT_MATRIX_2026-05-02

- Date: `2026-05-02`
- Scope: `home.iai.one`, `iai.one`, `docs.iai.one`, `flow.iai.one`, `dash.iai.one`, `app.iai.one`, `pay.iai.one`
- Status: `DRIFT_CONFIRMED_MULTI_SURFACE`
- Global state: `PRODUCTION_PUBLICATION_HOLD`

## 1. Executive summary

1. `home.iai.one` + `iai.one`: drift already confirmed earlier (`NEXT_VS_NODE_DRIFT_2026-05-02.md`) and remains unresolved.
2. `docs.iai.one`: source/runtime model drift is also confirmed (`D8b` cannot be auto-closed).
3. `flow.iai.one`, `dash.iai.one`, `app.iai.one`: live deployments are not traceable to monorepo commit graph today.
4. `pay.iai.one`: runtime is Worker lane (`pay.iai.one/`), not `apps/pay` lane; keep boundary split and avoid accidental lane mixing.

## 2. Surface matrix

| Surface | Live signature | Monorepo lane | Cloudflare evidence | Source trace vs monorepo | Drift verdict | Owner / wave gate |
|---|---|---|---|---|---|---|
| `home.iai.one` | Next.js chunks (`/_next/static/...`) | `apps/home` Node TS server | Pages project `home-iai-one` | latest source `f1da67b` missing in monorepo | drift confirmed (tech + source) | Team 5 / D8a / W1A |
| `iai.one` | Next.js chunks (`/_next/static/...`) | `apps/root` Node TS server | shares `home-iai-one` Pages lineage | tied to legacy chain, not monorepo | drift confirmed (tech + source) | Team 5 / D8a / W1A |
| `docs.iai.one` | static docs HTML (`/assets/docs.css`) | `apps/docs` Node TS server | Pages project `docs-iai-one` | latest source `ea02ab5` missing in monorepo | drift confirmed (runtime model + source) | Team A + Team 5 / D8b / W1B |
| `flow.iai.one` | static HTML shell (non-Next) | `apps/flow` Node TS server | Pages project `flow-iai-one` | latest source `58505b4` missing in monorepo | source drift confirmed | Team 5 + Runtime / D8c / W2 |
| `dash.iai.one` | HTML redirect to `/dashboard/` | `apps/dash` Node TS server | Pages project `iai-dash` (`Git Provider: No`) | latest source `ff2d6db` missing in monorepo | source drift confirmed | Team 5 / D8c + D11a / W2 |
| `app.iai.one` | Next.js chunks (`/_next/static/...`) | `apps/app` Node TS server | Pages project `app-iai-one` | latest source `c71b397` missing in monorepo | drift confirmed (tech + source) | Team Runtime + Team 5 / D8d / W4 |
| `pay.iai.one` | JSON Worker health response | `pay.iai.one/` Worker lane + `apps/pay` Node lane | Worker deployments show version `053c8cb9...` live | Worker lane active, apps lane not live source | lane split (intentional, must stay explicit) | Team Pay + Runtime / D10 + D11c / W4 |

## 3. Header/noindex quick truth

From live header probes on `2026-05-02`:

- `dash.iai.one`: no `x-robots-tag` header observed.
- `pay.iai.one`: no `x-robots-tag` header observed.
- `api.flow.iai.one`: not re-probed in this matrix file, but remains tracked by D11b from infra audit.

No change is being claimed here; this section is only a reconfirmation snapshot for planning continuity.

## 4. Artifact paths

- `docs/reports/team1/artifacts/drift-2026-05-02/app.iai.one.headers.txt`
- `docs/reports/team1/artifacts/drift-2026-05-02/app.iai.one.body.html`
- `docs/reports/team1/artifacts/drift-2026-05-02/dash.iai.one.headers.txt`
- `docs/reports/team1/artifacts/drift-2026-05-02/dash.iai.one.body.html`
- `docs/reports/team1/artifacts/drift-2026-05-02/docs.iai.one.headers.txt`
- `docs/reports/team1/artifacts/drift-2026-05-02/docs.iai.one.body.html`
- `docs/reports/team1/artifacts/drift-2026-05-02/flow.iai.one.headers.txt`
- `docs/reports/team1/artifacts/drift-2026-05-02/flow.iai.one.body.html`
- `docs/reports/team1/artifacts/drift-2026-05-02/home.iai.one.headers.txt`
- `docs/reports/team1/artifacts/drift-2026-05-02/home.iai.one.body.html`
- `docs/reports/team1/artifacts/drift-2026-05-02/iai.one.headers.txt`
- `docs/reports/team1/artifacts/drift-2026-05-02/iai.one.body.html`
- `docs/reports/team1/artifacts/drift-2026-05-02/pay.iai.one.headers.txt`
- `docs/reports/team1/artifacts/drift-2026-05-02/pay.iai.one.body.html`
- `docs/reports/team1/artifacts/drift-2026-05-02/wrangler-pages-deployments-app-iai-one-2026-05-02.json`
- `docs/reports/team1/artifacts/drift-2026-05-02/wrangler-pages-deployments-flow-iai-one-2026-05-02.json`
- `docs/reports/team1/artifacts/drift-2026-05-02/wrangler-pages-deployments-iai-dash-2026-05-02.json`
- `docs/reports/team1/artifacts/drift-2026-05-02/wrangler-worker-deployments-pay-iai-one-2026-05-02.txt`

## 5. Recommended sequence (no deploy in this step)

1. Keep `D8a` paused until founder picks `Next.js canonical` vs `Node canonical`.
2. Keep `D8b` held until founder picks docs runtime model (`Pages canonical` vs `Node canonical` vs temporary dual-source with expiry).
3. Move `D8c` and `D8d` from "unverified" to "verified open drift" in Plan V2 so W2/W4 can prepare early.
4. Keep pay lane split explicit in every packet: `pay.iai.one/` Worker live lane vs `apps/pay` repo lane.

