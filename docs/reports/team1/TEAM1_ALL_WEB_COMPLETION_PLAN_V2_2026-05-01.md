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
9. On 2026-05-02, after the live infrastructure audit (`AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md`), six new deferred items D7–D12 were added to §7. D7 (GitHub push) is now closed in `TEAM1_W1A_D7_CLOSEOUT_2026-05-02.md`. D8 (Cloudflare Pages source reconciliation) remains deploy-blocking. D2 and D3 are marked closed in §7 referencing `TEAM1_W1A_D2_D3_CLOSEOUT_2026-05-02.md`.

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

State as of 2026-05-02: `Batch 1.1` is committed at `3048195` (`docs(web): lock Batch 1.1 and W1 evidence`). D2 and D3 are closed repo-side. Live infrastructure audit landed (`AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md`) and added D7–D12 to §7.

State refresh: §7 audit patch is already committed (`aaa0c05`) and packet commit-basis refresh is committed (`62931a9`).

Next, in order:

1. founder repo-side review of §7 (D7–D12) and `AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md`
2. close `W1A`-deploy-blocking items before any preview deploy:
   - **D7** — push `iai-platform-fresh` to GitHub `tranhatam-collab` — **closed 2026-05-02** (`TEAM1_W1A_D7_CLOSEOUT_2026-05-02.md`)
   - **D8a** — reconcile Cloudflare Pages source-of-truth for `home-iai-one` (point at monorepo `apps/home`)
   - **D12** — either configure DNS A record for `root.iai.one` (path A) or remove `root.iai.one` from `trust-state.json official_domains` and regenerate (path B)
3. once D8a + D12 are closed, request founder approval for `W1A` preview deploy
4. only after `W1A` is clean and verified live, close D8b for `docs.iai.one` and request founder approval for `W1B` preview deploy

## 7. Known deferred items

These items are intentionally deferred. They are NOT silent debt. Each entry names the wave where it must close.

| # | Item | Source audit | Owner | Closes at | Status |
|---|---|---|---|---|---|
| D1 | `web.iai.one` `noindex` / `x-robots-tag` header in `apps/web` | `AUDIT_LEGAL_NOINDEX_GAPS_2026-05-01.md` §3 | Team 5 Web | W5 (before any DNS/deploy flip) | open |
| D2 | Footer legal URL standardized to `https://docs.iai.one/legal/iai-flow/` across `root/home/docs/developer/app` | `AUDIT_LEGAL_NOINDEX_GAPS_2026-05-01.md` §2, §4 | Team A Docs / Legal owners | W1A | **closed** in `TEAM1_W1A_D2_D3_CLOSEOUT_2026-05-02.md` |
| D3 | Entity `Angel Edu Tam Foundation Inc` exposed in public footer copy where directive requires | `AUDIT_LEGAL_NOINDEX_GAPS_2026-05-01.md` §1 | Team A Docs / Legal owners | W1A | **closed** in `TEAM1_W1A_D2_D3_CLOSEOUT_2026-05-02.md` |
| D4 | `apps/pay` `payment-surface-registry.ts` lines 410/659/686 + `apps/pay/src/server.ts:261` `webUrl` config audit | `AUDIT_UNRESOLVED_DOMAIN_REFS_2026-05-01.md` MEDIUM #3, #4 | Team Pay | W4 | open |
| D5 | `apps/web/src/i18n.ts:28,149` self-reference in `web.iai.one` SEO entry | `AUDIT_UNRESOLVED_DOMAIN_REFS_2026-05-01.md` MEDIUM #2 | Team 5 Web | W5 | open |
| D6 | `content/{en,vi}.json` key `web.landing.footer` rendered only inside `apps/web` (verified) — re-verify gating when Wave 5 enables web | `AUDIT_UNRESOLVED_DOMAIN_REFS_2026-05-01.md` MEDIUM #5 | Team 5 Web | W5 | open |
| D7 | Repo `iai-platform-fresh` has no GitHub remote and is not pushed to `tranhatam-collab`. Local-only state cannot survive disk loss and cannot drive CI deploy. | `AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` §C | Founder / Team 1 Control Tower | **before W1A preview deploy** | **closed** in `TEAM1_W1A_D7_CLOSEOUT_2026-05-02.md` |
| D8 | Cloudflare Pages source-of-truth reconciliation, split by wave (each sub-scope is independently deploy-blocking for its wave): D8a `home-iai-one` Pages currently linked to old repo `Home.iai.one` (last push 2026-03-28) — must point at monorepo `apps/home` — **W1A**. D8b `docs-iai-one` Pages source currently unverified — must point at monorepo `apps/docs` — **W1B**. D8c `flow-iai-one` Pages and `iai-dash` Pages source must be confirmed against monorepo `apps/flow` / `apps/dash` — **W2**. D8d `app-iai-one` Pages source must be confirmed against monorepo `apps/app` — **W4**. | `AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` §B1 | Founder / Team 5 Web | D8a → W1A, D8b → W1B, D8c → W2, D8d → W4 (each gates its own wave deploy) | open |
| D9 | Workers `iai-api`, `iai-api-production`, `iai-api-preview`, `iai-flow-api` exist with the same name in BOTH Cloudflare account `Tranhatam` (chính, modified 2026-04-10) and account `Tranhatam66` (cũ, modified 2026-04). Same name across accounts creates deploy-targeting risk. | `AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` §B3, §B4 | Team Runtime / API owners | W4 | open |
| D10 | Worker `pay-iai-one` was modified at 2026-05-01 10:28 UTC in account `Tranhatam`, but local repo `iai-platform-fresh` was not pushed and has HEAD `3048195` from 2026-05-02 00:51 +07. The deployed worker source is unverified. | `AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` §B2, §D | Team Pay | W4 | open |
| D11 | Production response on `dash.iai.one`, `pay.iai.one`, `api.flow.iai.one` does NOT carry `x-robots-tag: noindex, nofollow` header even though repo code sets it. Live worker version is older than repo. Split by wave: D11a `dash.iai.one` redeploy → **W2**. D11b `api.flow.iai.one` redeploy → **W2** (paired with `flow.iai.one`). D11c `pay.iai.one` redeploy → **W4**. | `AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` §A, §E | Team 5 Web (D11a) / Team Runtime (D11b) / Team Pay (D11c) | D11a → W2, D11b → W2, D11c → W4 | open |
| D12 | `root.iai.one` is declared in `trust-state.json official_domains` but has no DNS A record. **W1A-blocking.** Founder must pick exactly one of two paths and execute before W1A preview deploy: (path A) configure a DNS A record for `root.iai.one` and attach it to a Cloudflare Pages or Worker target consistent with the monorepo; or (path B) remove the entry from `trust-state.json official_domains`, regenerate trust-state, and update `content/site-map.md` accordingly. Mixed/partial state is not acceptable. | `AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` §A | Founder / Team 1 | W1A (deploy-blocking, path A or path B) | open |

Hard rules — two distinct gates:

1. **Repo-side packet review gate.** Founder may review and accept a wave's evidence packet repo-side as long as the packet is file-shape complete per §8 and lists the deferred items it touches. Items in `closes at` that are still `open` do not block repo-side review; they DO block the deploy approval gate below. This gate produces only a written "founder review approved (repo-side)" line in the packet README — it does not authorize any infrastructure change.

2. **Preview / production deploy approval gate.** No preview or production deploy of a wave may be triggered while ANY `closes at` item for that wave remains `open`. This is what actually controls live infrastructure. Specifically:
   - **W1A preview deploy is blocked** until D8a (`home-iai-one` Pages source reconciled to monorepo) and D12 (`root.iai.one` DNS decision: path A or path B) are closed. D7 (GitHub remote + push) was closed on 2026-05-02; see `TEAM1_W1A_D7_CLOSEOUT_2026-05-02.md`.
   - **W1B preview deploy is blocked** until D8 sub-scope for `docs-iai-one` Pages source is closed and the `docs.iai.one` packet is brought up to §8 file-shape.
   - **W2 preview deploy** for `dash.iai.one` and `flow.iai.one` / `api.flow.iai.one` is blocked until D11 sub-scope (W2) is closed.
   - **W4 preview deploy** for `pay.iai.one` and `app.iai.one` is blocked until D4, D9, D10, and D11 sub-scope (W4) are closed.

The two gates are deliberately separated so repo work and founder review can continue in parallel with the slower infrastructure reconciliation work.

Current closeout note:

- D2 and D3 are closed repo-side in `TEAM1_W1A_D2_D3_CLOSEOUT_2026-05-02.md`.
- D7 through D12 were added on 2026-05-02 from the live infrastructure audit; see `AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md`.
- D7 was closed on 2026-05-02; see `TEAM1_W1A_D7_CLOSEOUT_2026-05-02.md`. Repo `iai-platform-fresh` is now pushed to `git@github.com:tranhatam-collab/iai-platform-fresh.git` (`main` synced).
- W1A packet signing may proceed to founder repo-side review; W1A preview deploy is gated on D8a and D12.

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
