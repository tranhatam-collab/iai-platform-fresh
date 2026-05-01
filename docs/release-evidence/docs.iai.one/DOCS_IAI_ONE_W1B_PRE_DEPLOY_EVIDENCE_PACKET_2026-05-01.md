# DOCS_IAI_ONE_W1B_PRE_DEPLOY_EVIDENCE_PACKET_2026-05-01

- Date: `2026-05-01`
- Surface: `docs.iai.one`
- Wave: `W1B`
- Status: `PRE_DEPLOY_REVIEW_READY`
- Global state: `PRODUCTION_PUBLICATION_HOLD`
- Working repo: `/Users/tranhatam/Documents/Devnewproject/iai-platform-fresh`
- Current commit basis: `97ee825`
- Related plan: `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md`

## 1. Purpose

Prepare `docs.iai.one` for founder review before preview/prod deploy.

This packet covers repo-side documentation shell readiness:

- verify docs shell route behavior
- verify `/health` scaffold truth
- preserve bilingual docs copy
- preserve canonical metadata and social metadata
- keep docs as standards/boundary surface, not a product or control-plane clone

## 2. Scope

In scope:

- `apps/docs/src/server.ts`
- `apps/docs/src/render.ts`
- `apps/docs/src/i18n.ts`
- `apps/docs/README.md`
- `tests/integration/docs-surface.test.mjs`
- `tests/integration/docs-*.test.mjs`
- `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md`

Out of scope:

- production deploy
- DNS changes
- live docs crawl
- Lighthouse until preview URL exists
- payOS merchant verification

## 3. Route Evidence

| Route | Expected behavior | Auth required | Repo-side status | Evidence |
|---|---|---:|---|---|
| `/` | renders docs boundary shell in VI/EN with canonical metadata | no | PASS | `pnpm test:docs` |
| `/health` | returns `service=iai-docs`, `status=ok`, and linked surface URLs | no | PASS | `pnpm test:docs` |
| `/missing` | returns explicit 404 shell | no | PASS | `pnpm test:docs` |

## 4. QC Evidence

| Check | Result | Notes |
|---|---:|---|
| `pnpm typecheck:docs` | PASS | `@iai/docs` TypeScript no-emit |
| `pnpm test:docs` | PASS `5/5` | Includes build, docs routes, and pay-docs integration checker no-write mode |
| Canonical metadata | PASS repo-side | `https://docs.iai.one/` asserted in integration test |
| Bilingual docs shell | PASS repo-side | VI default and EN explicit rendering asserted |
| Legal/footer review | PENDING_PREVIEW | Needs preview/manual proof before production |
| Screenshot pack | PENDING_PREVIEW | To run after founder approves preview deploy |
| Lighthouse | PENDING_PREVIEW | Applies after preview URL exists |
| Live monitoring | NOT_STARTED | Production deploy not approved yet |

## 5. Risk Notes

Risk class: `low`.

Reason:

- W1B is documentation shell verification
- no runtime, auth, payment, or provider behavior is changed
- docs remains a standards/boundary surface

Residual risks:

- legal/footer visual proof still needs preview URL
- screenshot and Lighthouse evidence still need preview/prod URLs
- final production claim remains blocked by founder review and deploy approval

## 6. Founder Review Ask

Review this packet for repo-side approval only.

Do not treat this as production approval.

Next step after approval:

1. include W1B in the same review batch or hold it behind W1A
2. generate preview deploy for `docs.iai.one`
3. attach screenshot and Lighthouse evidence
4. request production approval
