# DOCS_IAI_ONE_W1B_PRE_DEPLOY_EVIDENCE_PACKET_2026-05-01

- Date: `2026-05-01`
- Surface: `docs.iai.one`
- Wave: `W1B`
- Status: `PRE_DEPLOY_REVIEW_READY_DEPLOY_BLOCKED_D8B_HELD`
- Global state: `PRODUCTION_PUBLICATION_HOLD`
- Working repo: `/Users/tranhatam/Documents/Devnewproject/iai-platform-fresh`
- Current commit basis: `62931a9` (`docs(team1): refresh commit basis to aaa0c05 in W1A/W1B packets`, 2026-05-02). Previous bases were `aaa0c05`, `97ee825`, and `3048195`.
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
| Legal/footer review | PASS repo-side | Footer legal URL + entity proof is tracked in `legal-footer-proof.md`; preview visuals still pending |
| Screenshot pack | PENDING_PREVIEW | To run after founder approves preview deploy |
| Lighthouse | PENDING_PREVIEW | Applies after preview URL exists |
| Live monitoring | NOT_STARTED | Production deploy not approved yet |
| D8b source-of-truth gate | BLOCKED_HELD | `docs-iai-one` Pages source drift is confirmed; execution is held pending founder runtime-model decision (`TEAM1_W1B_D8B_EXECUTION_PACKET_2026-05-02.md`) |

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

Deploy block:

- W1B preview deploy remains blocked until D8b is closed per plan §7.
