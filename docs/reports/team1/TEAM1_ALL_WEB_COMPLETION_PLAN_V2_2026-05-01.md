# TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01

- Date: `2026-05-01`
- Timezone: `Asia/Ho_Chi_Minh`
- Status: `ACTIVE_UNDER_PRODUCTION_PUBLICATION_HOLD`
- Working repo: `/Users/tranhatam/Documents/Devnewproject/iai-platform-fresh`
- Parent directive: `TEAM1_ALL_WEB_EXECUTION_AND_QC_DIRECTIVE_2026-05-01`

## 0. What changed in v2

This plan replaces the broad Wave 1 and clarifies the remaining public-truth cleanup:

1. `Batch 1.1` is now mandatory before any Wave 1 evidence packet is considered review-ready.
2. Wave 1 is split into:
   - `W1A` -> `iai.one` + `home.iai.one`
   - `W1B` -> `docs.iai.one`
3. Wave 4 wording is narrowed:
   - do not reopen merchant/auth/checkout runtime work
   - boundary hardening, noindex, legal, docs-link, and technical-surface truth work are still allowed
4. `api.iai.one` is downgraded from implied deploy target to `policy/docs lane` until a real runtime source-of-truth exists.
5. Default QC is no longer `Lighthouse everywhere`.
   - public shells/content surfaces use Lighthouse
   - technical/internal surfaces use boundary/noindex/legal proof instead
6. `app.iai.one` is explicitly placed under the technical/internal gate matrix (Wave 4) to remove the public-shell vs technical-surface ambiguity in the original plan.
7. Section 7 lists known deferred items with their closing wave so nothing leaks as silent debt.
8. Section 8 defines a uniform evidence packet spec so every wave produces review-ready output in the same shape.

## 1. Hard lock

- Do not reopen `key/auth/pay runtime` while payOS business verification remains external.
- Do not deploy `web.iai.one` before DNS, deploy, and owner proof exist.
- Do not publicize `cdn.iai.one` or `flows.iai.one` before accepted owner evidence production.
- Do not claim `public-live complete` or `SEO complete` while `PRODUCTION_PUBLICATION_HOLD` is active.
- Do not deploy any wave before founder review of its QC packet.

## 2. Batch 1.1 — public-truth cleanup now

### Scope

- keep `root`, `home`, and `pay` from advertising `web.iai.one` unless an explicit enable flag is turned on
- hide `web_url` from `/health` when the matching web-surface flag is off
- downgrade `web.iai.one` self-claim copy from public-live wording to release-hold wording
- mark unresolved declared domains in trust-state as `hold`, not `public`
- keep `cdn.iai.one`, `flows.iai.one`, and unresolved `web.iai.one` outside public-ready trust presentation

### Exit criteria

1. `root`, `home`, and `pay` default HTML do not expose `web.iai.one`
2. `root`, `home`, and `pay` `/health` return `web_surface_enabled=false` and `web_url=null`
3. `web.iai.one` copy and SEO registry no longer read like an already-live public surface
4. trust-state official domains move unresolved declared domains out of public-ready visibility
5. repo-side QC is green for `root`, `home`, `pay`, `web`, and trust-state generation

## 3. Wave sequence

### W1A — `iai.one` + `home.iai.one`

Focus:
- truthful shell copy
- public navigation correctness
- sitemap canonical correctness
- bilingual correctness

Primary gates:
- `pnpm typecheck:root`
- `pnpm typecheck:home`
- `pnpm test:root`
- `pnpm test:home`
- manual smoke for `/` and `/health`
- screenshot pack for VI/EN shell routes
- evidence packet for `iai.one` and `home.iai.one`

### W1B — `docs.iai.one`

Focus:
- docs truth and canonical shell completeness
- legal/footer consistency
- sitemap and indexability verification

Primary gates:
- existing docs package tests/build
- docs smoke routes
- sitemap/indexability check
- legal/footer verification
- evidence packet for `docs.iai.one`

### W2 — `flow.iai.one` + `developer.iai.one` + `dash.iai.one`

Focus:
- sitemap/indexability proof
- bilingual/meta closure
- legal/footer consistency

Primary gates:
- `pnpm test:flow-surface`
- developer build + surface smoke
- `pnpm test:dash`
- bilingual route audit
- noindex/robots/sitemap proof where applicable

### W3 — `cios.iai.one` + `nft.iai.one` + `noos.iai.one`

Focus:
- closure of existing repo-side evidence gaps
- content and route polish without touching pay runtime

Primary gates:
- CIOS closure checks available in repo
- `pnpm test:nft`
- `pnpm test:noos-web`
- fixture/library/catalog truth checks

### W4 — `mail.iai.one` + `pay/api` boundary hardening + `app.iai.one`

Focus:
- technical/internal boundary policy
- noindex/legal/docs-link proof
- app surface migrations and E2E readiness

Important wording:
- do **not** reopen merchant/auth/checkout runtime work
- do **allow** repo-side boundary hardening for pay/mail/dash/app surfaces

`api.iai.one` status:
- not a deploy target in this repo today
- treat as `policy/docs lane` only until a real runtime source-of-truth exists

Primary gates:
- boundary response review
- noindex header proof
- robots/sitemap disabled-or-internal proof
- legal/docs-link proof
- app migrations/test evidence

### W5 — `web.iai.one` + `life.iai.one`

Focus:
- public route enable only after DNS/deploy truth exists
- founder-approved public activation

Primary gates:
- repo proof
- domain proof
- deploy proof
- owner sign-off
- only then can `*_WEB_SURFACE_ENABLED=true` be flipped in upstream shells

### W6 — `cdn.iai.one` + `flows.iai.one`

Focus:
- either real production proof
- or signed deferred packet to Phase 2

Primary gates:
- if built: full per-surface release packet
- if deferred: owner-signed justification packet

## 4. Gate matrix by surface type

### Public shell / content surfaces

Use:
- build
- typecheck
- route tests
- manual smoke
- screenshot pack
- bilingual diff
- sitemap canonical check
- legal/footer verification
- Lighthouse where meaningful

Applies to:
- `iai.one`
- `home.iai.one`
- `docs.iai.one`
- `flow.iai.one`
- `developer.iai.one`
- `nft.iai.one`
- `life.iai.one`
- `web.iai.one` once Wave 5 opens

Note: `app.iai.one` is intentionally NOT in this list. Although it carries a public shell, in Wave 4 it is treated as an authenticated/technical surface and gated by the Technical / internal matrix below. Lighthouse is not required for `app.iai.one` until founder explicitly reclassifies it as a public marketing surface.

### Technical / internal / operator surfaces

Use:
- build
- typecheck
- route tests
- boundary response proof
- noindex proof
- robots/sitemap proof
- legal/docs-link proof
- security-boundary note

Do not require Lighthouse by default.

Applies to:
- `dash.iai.one`
- `mail.iai.one`
- `pay.iai.one`
- `app.iai.one`
- `api.flow.iai.one`
- `api.iai.one` policy/docs lane

## 5. Team execution map

- `Team 1 Control Tower`
  - keeps the hold state
  - validates evidence packets
  - controls wave unlock and deploy sequence

- `Team 5 Web / Home / Root`
  - owns truthful public shell behavior
  - must keep `web.iai.one` hidden until Wave 5 approval

- `Team A Docs / Developer`
  - owns `docs.iai.one`, `developer.iai.one`, and related docs/legal consistency

- `Team B CDN / Flows`
  - must either produce production proof or stay in hold/deferred state

- `Team Runtime / API owners`
  - own technical-surface boundary policy
  - do not reopen pay merchant/auth runtime lane

## 6. Immediate next actions

1. finish `Batch 1.1`
2. rerun focused QC:
   - `root`
   - `home`
   - `pay`
   - `web`
   - trust-state generation
3. generate `W1A` evidence packet inputs
4. only after `W1A` is clean, open `W1B` packet for `docs.iai.one`

## 7. Known deferred items

These items are intentionally deferred. They are NOT silent debt. Each entry names the wave where it must close.

| # | Item | Source audit | Owner | Closes at |
|---|---|---|---|---|
| D1 | `web.iai.one` `noindex` / `x-robots-tag` header in `apps/web` | `AUDIT_LEGAL_NOINDEX_GAPS_2026-05-01.md` §3 | Team 5 Web | W5 (before any DNS/deploy flip) |
| D2 | Footer legal URL standardized to `https://docs.iai.one/legal/iai-flow/` across `root/home/docs/developer/app` | `AUDIT_LEGAL_NOINDEX_GAPS_2026-05-01.md` §2, §4 | Team A Docs / Legal owners | W1A (must land before W1A evidence packet is signed) |
| D3 | Entity `Angel Edu Tam Foundation Inc` exposed in public footer copy where directive requires | `AUDIT_LEGAL_NOINDEX_GAPS_2026-05-01.md` §1 | Team A Docs / Legal owners | W1A |
| D4 | `apps/pay` `payment-surface-registry.ts` lines 410/659/686 + `apps/pay/src/server.ts:261` `webUrl` config audit | `AUDIT_UNRESOLVED_DOMAIN_REFS_2026-05-01.md` MEDIUM #3, #4 | Team Pay | W4 |
| D5 | `apps/web/src/i18n.ts:28,149` self-reference in `web.iai.one` SEO entry | `AUDIT_UNRESOLVED_DOMAIN_REFS_2026-05-01.md` MEDIUM #2 | Team 5 Web | W5 |
| D6 | `content/{en,vi}.json` key `web.landing.footer` rendered only inside `apps/web` (verified) — re-verify gating when Wave 5 enables web | `AUDIT_UNRESOLVED_DOMAIN_REFS_2026-05-01.md` MEDIUM #5 | Team 5 Web | W5 |

Hard rule: no wave's evidence packet may be signed if any of its `closes at` items remains open.

Current closeout note:

- D2 and D3 are closed repo-side in `TEAM1_W1A_D2_D3_CLOSEOUT_2026-05-02.md`.
- W1A packet signing may proceed to founder repo-side review after packet file-shape verification.

## 8. Evidence packet spec

Every wave produces one packet per surface, stored under `docs/release-evidence/<surface>/`.

### Required files per surface

```
docs/release-evidence/<surface>/
  README.md                       # surface name, wave, status, sign-off line
  qc-results.md                   # all pnpm test / typecheck / build outputs (paste, not summarize)
  noindex-proof.md                # for technical surfaces; "n/a public" for public shells
  canonical-hreflang-proof.md     # for public shells; "n/a internal" for technical
  legal-footer-proof.md           # link to docs/legal/iai-flow/ + entity name visible
  sitemap-proof.md                # entry present (public) or correctly absent (hold)
  domain-proof.md                 # DNS dig + curl HEAD output, or "deferred-to-Wn" with reason
  screenshots/                    # VI shell, EN shell, /health response
  deferred.md                     # any item from §7 that touches this surface
```

### Sign-off line (in README.md)

```
Wave: W1A | W1B | W2 | W3 | W4 | W5 | W6
Surface: <full domain>
QC green: yes/no
Deferred items addressed: D1, D2, ...
Founder review status: pending | approved | rejected
Founder sign-off date: YYYY-MM-DD
```

### Public shell vs technical surface differences

- Public shell packets MUST include `canonical-hreflang-proof.md`, `screenshots/`, `sitemap-proof.md` populated.
- Technical surface packets MUST include `noindex-proof.md` with raw `curl -I` header showing `x-robots-tag: noindex, nofollow`.
- Both MUST include `qc-results.md` with full raw output.

Packets that miss any required file are not review-ready and cannot be deployed.

## 9. Success condition for this turn

This turn is successful when:

- `Batch 1.1` is implemented repo-side
- the plan split `W1A/W1B` is documented
- Wave 4 wording is corrected
- `api.iai.one` is downgraded to policy/docs lane in planning
- technical/internal surfaces are no longer forced through default Lighthouse gates
- `app.iai.one` consistency between Wave 4 and the Gate matrix is fixed (§4)
- known deferred items are listed with explicit closing waves (§7)
- evidence packet spec is defined (§8) so every wave produces a uniform review-ready packet
