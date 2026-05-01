# HOME_IAI_ONE_W1A_PRE_DEPLOY_EVIDENCE_PACKET_2026-05-01

- Date: `2026-05-01`
- Surface: `home.iai.one`
- Wave: `W1A`
- Status: `PRE_DEPLOY_REVIEW_READY_DEPLOY_BLOCKED_D8A`
- Global state: `PRODUCTION_PUBLICATION_HOLD`
- Working repo: `/Users/tranhatam/Documents/Devnewproject/iai-platform-fresh`
- Current commit basis: `62931a9` (`docs(team1): refresh commit basis to aaa0c05 in W1A/W1B packets`, 2026-05-02). Previous bases were `aaa0c05`, `97ee825`, and `3048195`.
- Related plan: `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md`

## 1. Purpose

Prepare `home.iai.one` for founder review before preview/prod deploy.

This packet covers repo-side truth cleanup only:

- keep `home.iai.one` as a truthful portal
- hide `web.iai.one` from default public navigation
- expose `/health` truth with `web_surface_enabled=false` and `web_url=null`
- expose standardized legal footer link and legal entity required by D2/D3
- preserve bilingual routing and canonical metadata

## 2. Scope

In scope:

- `apps/home/src/server.ts`
- `apps/home/src/render.ts`
- `apps/home/README.md`
- `tests/integration/home-surface.test.mjs`
- `content/en.json`
- `content/vi.json`
- `content/iai-ui-text-system.md`
- `content/site-map.md`
- `docs/reports/team1/TEAM1_ALL_WEB_EXECUTION_AND_QC_DIRECTIVE_2026-05-01.md`
- `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md`
- `docs/reports/team1/TEAM1_W1A_D2_D3_CLOSEOUT_2026-05-02.md`

Out of scope:

- production deploy
- DNS changes
- `web.iai.one` enablement
- payOS merchant verification
- Team Pay/payOS provider lane

## 3. Route Evidence

| Route | Expected behavior | Auth required | Repo-side status | Evidence |
|---|---|---:|---|---|
| `/` | renders portal shell in VI/EN, no default `web.iai.one` link | no | PASS | `pnpm test:home` |
| `/health` | returns `service=iai-home`, `web_surface_enabled=false`, `web_url=null` | no | PASS | `pnpm test:home` |
| `/missing` | returns explicit 404 shell | no | PASS | `pnpm test:home` |

## 4. QC Evidence

| Check | Result | Notes |
|---|---:|---|
| `pnpm typecheck:home` | PASS | Included in `pnpm test:home` build step |
| `pnpm test:home` | PASS `5/5` | Portal shell, health, EN/VI, explicit re-enable flag, 404 |
| `pnpm --filter @iai/developer build` | PASS | D2/D3 cross-surface footer proof touched developer content |
| `node --test tests/integration/developer-surface.test.mjs` | PASS `6/6` | Developer landing + required route shell legal/entity assertions |
| `pnpm test:docs` | PASS `5/5` | D2/D3 cross-surface footer proof touched docs |
| `pnpm test:app` | PASS `4/4` | D2/D3 cross-surface footer proof touched app |
| Public navigation truth | PASS | Default home HTML does not expose `https://web.iai.one` |
| Health truth | PASS | `web_surface_enabled=false`, `web_url=null` |
| D2 legal URL | PASS | Home footer exposes `https://docs.iai.one/legal/iai-flow/` |
| D3 legal entity | PASS | Home footer exposes `Angel Edu Tam Foundation Inc` |
| Sitemap/site-map truth | PASS repo-side | `web.iai.one` held at release-hold; `cdn/flows` held |
| Screenshot pack | PENDING_PREVIEW | To run after founder approves preview deploy |
| Lighthouse | PENDING_PREVIEW | Applies to public shell after preview URL exists |
| Live monitoring | NOT_STARTED | Production deploy not approved yet |

## 5. Risk Notes

Risk class: `low`.

Reason:

- change is a portal truth cleanup, not a runtime expansion
- public links are reduced, not expanded
- explicit re-enable path remains available via `HOME_WEB_SURFACE_ENABLED=true`

Residual risks:

- screenshot and Lighthouse evidence still need preview/prod URLs
- final production claim remains blocked by founder review and deploy approval

## 6. Plan V2 Required Files

Plan V2 packet spec files are present under `docs/release-evidence/home.iai.one/`:

- `README.md`
- `qc-results.md`
- `noindex-proof.md`
- `canonical-hreflang-proof.md`
- `legal-footer-proof.md`
- `sitemap-proof.md`
- `domain-proof.md`
- `deferred.md`
- `screenshots/README.md`

## 7. Founder Review Ask

Review this packet for repo-side approval only.

Do not treat this as production approval.

Next step after approval:

1. close D8a (Pages source reconciliation). D12 (`root.iai.one` DNS/trust-state decision) was closed via path B on 2026-05-02 (`TEAM1_W1A_D12_CLOSEOUT_2026-05-02.md`).
2. generate preview deploy for `home.iai.one`
3. attach screenshot and Lighthouse evidence
4. request production approval
