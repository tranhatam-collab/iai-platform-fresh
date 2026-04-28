# CIOS_IAI_ONE_RUNTIME_CONTRACT_PROOF_2026-04-21

- Evidence refresh date: `2026-04-22`
- Owner lane: `Team C`
- Source workspace: `../cios.iai.one`
- Source git ref: `main@159552a`
- Source workspace state: `dirty worktree snapshot with tracked modifications and untracked planning docs`

## 1. Route Truth

| Route | Repo artifact | Proof summary |
|---|---|---|
| `https://cios.iai.one/` | `../cios.iai.one/site/index.html` | Root landing shell exists with title `CIOS - Customer Intelligence Operating System`, bilingual toggle, live preview section, and CTA links to `/pricing/`, `/contact/`, and `/app/`. |
| `https://cios.iai.one/cios/` | `../cios.iai.one/site/cios/index.html` | CIOS hub route exists with CTA links to `/cios/app/`, `/cios/demo/`, `/cios/pricing/`, `/cios/metrics/`, and `/cios/omdala/`. |
| `https://cios.iai.one/cios/app/` | `../cios.iai.one/site/cios/app/index.html` | Interactive app demo shell exists with plan selector, overview cards, workflow actions, compliance panel, and search experience. |
| `https://cios.iai.one/cios/pricing/` | `../cios.iai.one/site/cios/pricing/index.html` | Pricing ladder exists for `Free`, `Starter`, `Pro`, `Team`, `Business`, `Scale`, `Enterprise`, and `Constitutional`. |
| `https://cios.iai.one/cios/demo/` | `../cios.iai.one/site/cios/demo/index.html` | Plan demo index exists and links to tier-specific demo routes. |

## 2. Runtime Contract Truth

| Contract / capability | Source artifact | Proof summary |
|---|---|---|
| App bootstrap + registered route families | `../cios.iai.one/src/app/create-app.ts` | Fastify app registers `/health`, realtime stream, and v1 route groups for auth, members, CRM, compliance, discovery, flow, CEE, review, and meta. |
| Health envelope | `../cios.iai.one/src/interfaces/http/routes/health.routes.ts` and `../cios.iai.one/tests/health.test.ts` | Source and test spec define `GET /health` returning `200`, `ok: true`, `service: customer-intelligence-os-api`, and request-id envelope fields. |
| Release metadata + policy surface | `../cios.iai.one/src/interfaces/http/routes/v1/meta.routes.ts` and `../cios.iai.one/tests/v1-meta.test.ts` | Source and test spec define `GET /v1/meta`, version headers, and `GET /v1/compliance/policies` with expected extension points and policy links. |
| Flow dispatch / callback contract | `../cios.iai.one/src/interfaces/http/routes/v1/flow.routes.ts` and `../cios.iai.one/tests/phase1-integration.test.ts` | Source and test spec define permission denial, missing/invalid callback signature, and accepted signed callback success path. |
| Discovery governance hardening | `../cios.iai.one/tests/tenant-isolation-discovery.test.ts` | Test spec defines `/v1/discovery/sources` and `/v1/discovery/crawl-governance`, asserting hardened governance state fields. |
| Realtime stream + reconnect fallback | `../cios.iai.one/tests/sse-reconnect.test.ts` | Test spec defines auth/permission on `/realtime/stream` and ordered replay via `/realtime/events/since/:eventId`. |

## 3. Executed Verification

| Command | Result | Notes |
|---|---|---|
| `npm test` from `../cios.iai.one` | `PASS` | Rerun `2026-04-22` after clean install (`npm ci`), result: `6 files`, `22 tests` passed. |
| `node --test tests/integration/cios-release-evidence.test.mjs` from `iai-platform-worktree` | `PASS` | Confirms the Team C packet still points at present sibling route shells, runtime contracts, runbook, and rollback notes. |
| `npm run smoke:workers:strict` from `../cios.iai.one` | `PASS` | Executed `2026-04-22` on deployed worker path using real `WORKERS_API_URL` and synced worker `JWT_SECRET`; flow dispatch/callback/audit assertions passed in strict mode. |

## 4. Rollback Truth

| Evidence | Source artifact | Summary |
|---|---|---|
| Deploy + smoke runbook | `../cios.iai.one/docs/DEPLOY_AND_SMOKE_RUNBOOK.md` | Documents ordered release sequence: migrate, deploy, smoke strict, then go/no-go. Includes rollback steps for Workers and Pages. |
| Migration rollback notes | `../cios.iai.one/migrations/ROLLBACK_NOTES.md` | Defines forward-compatible rollback strategy: rollback app/workers/pages first, preserve expanded schema, and never drop tables during a hot incident without backup and owner approval. |

## 5. Evidence Limits

- Fresh screenshot pack (5 PNG) has been generated in `docs/release-evidence/cios.iai.one/artifacts/screenshots/`.
- Strict smoke is no longer environment-bound at evidence level; Team C has executed and captured deployed strict run on `2026-04-22`.
- Residual operational caution: JWT secret was rotated/synced in review-closure rollout, so auth error rate should be monitored during token refresh window.
