# IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17
## Team 1 admin audit of public surfaces in current workspace
## Scope order: `iai.one` → `home.iai.one` → `app.iai.one` → `flow.iai.one` → `docs.iai.one` → `nft.iai.one` → `web.iai.one` → `pay.iai.one`

---

## 0. Purpose

Audit implementation reality in this workspace against the locked source-of-truth package:
- `content/iai-language-codex.md`
- `content/iai-ui-text-system.md`
- `content/iai-master-domain-mission-map.md`
- `content/iai-prompt-system-standard.md`
- `content/iai-ui-copy-registry.md`
- `content/vi.json`
- `content/en.json`
- `content/seo-registry.csv`

This audit separates two different failure modes:
- surface does not exist in this repo yet
- surface exists but is not compliant with the codex

---

## 1. Repo reality snapshot

Current app inventory in this workspace is still selective, but no longer empty on the public-root side:
- `apps/README.md` now reserves `root`, `home`, `app`, `flow`, `docs`, `nft`, `pay`, `web`, `dash`, `mail-web`, `mail-api`, `mail-smtp`, `mail-inbound`, `mail-worker`, and `noos-web`
- root `package.json` now exposes build/dev/typecheck/test targets for `root`, `home`, `app`, `flow`, `docs`, `nft`, `pay`, `web`, and `dash`
- `apps/root` now exists as a constitutional shell for `iai.one`, backed by route rendering, locale handling, and integration tests
- `apps/home` now exists as a portal shell for `home.iai.one`, backed by route rendering, locale handling, and integration tests
- `apps/app` now exists as a user product shell for `app.iai.one`, backed by route rendering, locale handling, and integration tests
- `apps/flow` now exists as a living execution shell for `flow.iai.one`, backed by route rendering, locale handling, and integration tests
- `apps/docs` now exists as a documentation and boundary shell for `docs.iai.one`, backed by route rendering, locale handling, and integration tests
- `apps/nft` now exists as a public trust shell for `nft.iai.one`, backed by route rendering, locale handling, and integration tests
- `apps/pay` now exists as a phase-D prep shell for `pay.iai.one`, backed by route rendering, locale handling, and integration tests

This means Team 1 cannot honestly mark a surface as implementation-audited if the package, route shell, and build target are not present here.

---

## 2. Audit matrix

| Surface | Repo evidence | Implementation status in this workspace | Codex / UI system status | Gate |
|---|---|---|---|---|
| `iai.one` | `apps/root` exists with routes, shared i18n, and tests | present | constitutional shell aligned in current repo | CONDITIONAL-GO |
| `home.iai.one` | `apps/home` exists with routes, shared i18n, and tests | present | portal shell aligned in current repo | CONDITIONAL-GO |
| `app.iai.one` | `apps/app` exists with routes, shared i18n, and tests | present | user product shell aligned in current repo | CONDITIONAL-GO |
| `flow.iai.one` | `apps/flow` exists with routes, shared i18n, and tests | present | execution shell aligned in current repo | CONDITIONAL-GO |
| `docs.iai.one` | `apps/docs` exists with routes, shared i18n, and tests | present | documentation shell aligned in current repo | CONDITIONAL-GO |
| `nft.iai.one` | `apps/nft` exists with routes, shared i18n, and tests | present | public trust shell present; secure lane still blocked by Team 2 runtime proof | CONDITIONAL-GO (public shell) / NO-GO (secure lane) |
| `web.iai.one` | `apps/web` exists with routes, shared i18n, and tests | present | codex-aligned shell in current repo | CONDITIONAL-GO |
| `pay.iai.one` | `apps/pay` exists with routes, shared i18n, and tests | present | phase-D prep shell present; release sequencing remains locked behind secure NFT gate | CONDITIONAL-GO (prep shell) |

---

## 3. Surface-by-surface audit

### 3.1 `iai.one`

Findings:
- `apps/root/README.md` defines `iai.one` as the constitutional shell only, not a product landing page or second portal.
- `apps/root/src/server.ts` exposes a real public shell at `/` plus `/health`.
- `apps/root/src/i18n.ts` binds shared dictionaries and the `iai.one` row from `content/seo-registry.csv`.
- `apps/root/src/render.ts` keeps root inside the constitutional role: system map, boundary language, and directional routing into other surfaces.
- `tests/integration/root-surface.test.mjs` verifies VI-first rendering, explicit English rendering, canonical/hreflang/JSON-LD output, and explicit 404 behavior.

Strengths:
- Root now exists as code, not just governance documents.
- The shell defines meaning and boundaries without collapsing into portal, product, or control language.
- Shared content files now contain explicit `surface.*` bindings for root and adjacent surfaces, which removes a quiet fallback class from the baseline.

Verification evidence:
- `pnpm build:root` PASS
- `pnpm typecheck:root` PASS
- `pnpm test:root` PASS

Decision:
- `iai.one` is now implementation-auditable in this workspace.
- Gate is `CONDITIONAL-GO`: the constitutional shell is present and codex-aligned, while broader portal/product separation still depends on continued role-discipline across adjacent surfaces.

---

### 3.2 `home.iai.one`

Findings:
- `apps/home/README.md` defines `home.iai.one` as the portal only, not a second root or product clone.
- `apps/home/src/server.ts` exposes a real public shell at `/` plus `/health`.
- `apps/home/src/i18n.ts` binds shared dictionaries and the `home.iai.one` row from `content/seo-registry.csv`.
- `apps/home/src/render.ts` routes by intent into the right surfaces while keeping portal boundaries explicit.
- `tests/integration/home-surface.test.mjs` verifies VI-first rendering, explicit English rendering, canonical/hreflang/JSON-LD output, and explicit 404 behavior.

Strengths:
- Portal now exists as code instead of only as a role inside the mission map.
- The shell clearly separates itself from `iai.one` root and from the product surfaces.
- `root + home + app + web + dash` now form a consistent shared-language baseline for future public scaffolds in this repo.

Verification evidence:
- `pnpm build:home` PASS
- `pnpm typecheck:home` PASS
- `pnpm test:home` PASS

Decision:
- `home.iai.one` is now implementation-auditable in this workspace.
- Gate is `CONDITIONAL-GO`: the portal shell is present and codex-aligned, while the product surfaces it routes toward are still partially missing in this repo.

---

### 3.3 `app.iai.one`

Findings:
- `apps/app/README.md` defines `app.iai.one` as the user product surface only, not a second root, docs mirror, or deep control plane.
- `apps/app/src/server.ts` exposes a real public shell at `/` plus `/health`.
- `apps/app/src/i18n.ts` binds shared dictionaries and the `app.iai.one` row from `content/seo-registry.csv`.
- `apps/app/src/render.ts` keeps the surface inside user-product language: community, lessons, verification, and user operations, with explicit handoffs toward `nft`, `flow`, `docs`, and `dash`.
- `tests/integration/app-surface.test.mjs` verifies VI-first rendering, explicit English rendering, canonical/hreflang/JSON-LD output, adjacent-surface handoffs, and explicit 404 behavior.

Strengths:
- `app.iai.one` now exists as code instead of remaining an implied handoff target from `web` or `dash`.
- The shell keeps user-product lanes centered and does not drift into constitutional, portal, docs, or admin language.
- Shared content files now carry dedicated `app.*` UI copy and SEO bindings, which closes another missing public-surface gap in the codex rollout.

Verification evidence:
- `pnpm build:app` PASS
- `pnpm typecheck:app` PASS
- `pnpm test:app` PASS

Decision:
- `app.iai.one` is now implementation-auditable in this workspace.
- Gate is `CONDITIONAL-GO`: the user product shell is present and codex-aligned, while deeper member journeys and future product routes still belong to later scope.

---

### 3.4 `flow.iai.one`

Findings:
- `apps/flow/README.md` defines `flow.iai.one` as the living execution shell only, not a docs mirror, portal clone, or fake dashboard.
- `apps/flow/src/server.ts` exposes a real public shell at `/` plus `/health`.
- `apps/flow/src/i18n.ts` binds shared dictionaries and the `flow.iai.one` row from `content/seo-registry.csv`.
- `apps/flow/src/render.ts` keeps the surface in execution language with explicit handoffs to `dash`, `docs`, `developer`, and `app`.
- `tests/integration/flow-surface.test.mjs` verifies VI-first rendering, explicit English rendering, canonical/hreflang/JSON-LD output, and explicit 404 behavior.

Strengths:
- `flow.iai.one` now exists as code in this repo, not only as backend/read-model mention.
- The shell keeps execution boundaries explicit and avoids drifting into docs/app/control role confusion.
- Shared content + SEO registry bindings are active in the new flow shell.

Verification evidence:
- `pnpm build:flow` PASS
- `pnpm typecheck:flow` PASS
- `pnpm test:flow-surface` PASS

Decision:
- `flow.iai.one` is now implementation-auditable in this workspace.
- Gate is `CONDITIONAL-GO`: the public execution shell is present and codex-aligned, while deeper runtime lanes and future feature routes remain later scope.

---

### 3.5 `docs.iai.one`

Findings:
- `apps/docs/README.md` defines `docs.iai.one` as documentation + boundary shell only, not a product clone, portal mirror, or control app.
- `apps/docs/src/server.ts` exposes a real public shell at `/` plus `/health`.
- `apps/docs/src/i18n.ts` binds shared dictionaries and the `docs.iai.one` row from `content/seo-registry.csv`.
- `apps/docs/src/render.ts` keeps docs in boundary language with explicit handoffs to `root`, `home`, `app`, `flow`, `developer`, and `dash`.
- `tests/integration/docs-surface.test.mjs` verifies VI-first rendering, explicit English rendering, canonical/hreflang/JSON-LD output, and explicit 404 behavior.

Strengths:
- `docs.iai.one` now exists as a real app surface in this workspace, not docs-folder-only state.
- The shell keeps documentation role boundaries explicit and avoids product/control drift.
- Shared content and SEO registry bindings are active in the docs surface.

Verification evidence:
- `pnpm build:docs` PASS
- `pnpm typecheck:docs` PASS
- `pnpm test:docs` PASS

Decision:
- `docs.iai.one` is now implementation-auditable in this workspace.
- Gate is `CONDITIONAL-GO`: the public docs shell is present and codex-aligned, while deeper documentation IA expansion remains later scope.

---

### 3.6 `nft.iai.one`

Findings:
- `apps/nft/README.md` defines `nft.iai.one` as the public trust surface and keeps protected asset execution behind gated runtime proof.
- `apps/nft/src/server.ts` exposes a real shell at `/` and contract state at `/health`.
- `apps/nft/src/i18n.ts` binds shared dictionaries and the `nft.iai.one` row from `content/seo-registry.csv`.
- `apps/nft/src/render.ts` keeps language explicit around step-up, wallet proof, protected delivery, and partner sync boundaries.
- `tests/integration/nft-surface.test.mjs` verifies shell metadata, locale rendering, trust messaging, and explicit 404 behavior.

Decision:
- `nft.iai.one` is implementation-auditable in this workspace at public trust-shell level.
- Gate is `CONDITIONAL-GO` for the public shell.
- Secure 2-layer protected lane remains `NO-GO` until Team 2 + Team 4 pair packet review reaches Team 1 gate conditions.

---

### 3.7 `web.iai.one`

Repo evidence:
- `apps/web/README.md` correctly defines `web.iai.one` as a growth/onboarding surface only.
- `apps/web/src/server.ts` exposes `/`, `/onboarding`, `/contract-status`, `/events`, `/shared-auth`, and `/health`.
- `tests/integration/web-onboarding-contract.test.mjs` verifies contract handoff behavior.

Strengths:
- Role alignment is directionally correct: it routes into shared auth, shared billing, `app`, `flow`, and `dash` rather than redefining the platform.
- Contract-driven handoff is real, not fake.
- Shared dictionaries now drive nav, CTA, helper text, footer text, and route-level copy via `apps/web/src/i18n.ts`.
- The shell now defaults to Vietnamese and supports explicit English via `?lang=en`, which aligns the surface with the locked bilingual rule.
- SEO shell is now bound to `content/seo-registry.csv`, including description, canonical, hreflang, and JSON-LD output.
- Temporary visual placeholders that conflicted with the codex were removed from the public shell.

Closed P0 findings in this repo:
- Public UI strings are no longer hard-coded in the render layer; `apps/web/src/render.ts` reads from shared content sources through `apps/web/src/i18n.ts`.
- The surface no longer ships as English-only; locale is resolved in `apps/web/src/server.ts` and rendered per request.
- Navigation, CTA, helper copy, and footer copy are now tied back to the locked content files.
- The route shell now emits the required metadata layer for `web.iai.one`.

Verification evidence:
- `pnpm --filter @iai/web build` PASS
- `pnpm --filter @iai/web typecheck` PASS
- `pnpm test:web` PASS

Decision:
- `web.iai.one` is the growth/onboarding surface in this ordered audit with a real app implementation in this workspace.
- Codex, i18n, and SEO P0 gaps are now closed in this repo.
- Gate is `CONDITIONAL-GO`: the surface is compliant as a routing and contract shell, while broader product expansion still belongs to later scope.

---

### 3.8 `pay.iai.one`

Findings:
- `apps/pay/README.md` defines `pay.iai.one` as a phase-D prep shell with governance and ledger boundaries.
- `apps/pay/src/server.ts` exposes a real shell at `/` and a prep contract at `/health` including locale contract and `phase_d_prep` state.
- `apps/pay/src/i18n.ts` binds shared dictionaries and the `pay.iai.one` row from `content/seo-registry.csv`.
- `apps/pay/src/render.ts` keeps payment, wallet, settlement, and adjacent-surface boundaries explicit without runtime-claim drift.
- `tests/integration/pay-surface.test.mjs` verifies locale contract, canonical/hreflang/JSON-LD metadata, EN-first fallback behavior, and explicit 404 behavior.

Decision:
- `pay.iai.one` is implementation-auditable in this workspace as a phase-D prep shell.
- Gate is `CONDITIONAL-GO` for prep shell visibility, while executable payout release remains sequence-locked behind secure NFT gate reopen.

---

## 4. Direct evidence references

### App inventory and build reality
- `apps/README.md`
- `package.json`

### `iai.one`
- `apps/root/README.md`
- `apps/root/src/i18n.ts`
- `apps/root/src/server.ts`
- `apps/root/src/render.ts`
- `tests/integration/root-surface.test.mjs`

### `home.iai.one`
- `apps/home/README.md`
- `apps/home/src/i18n.ts`
- `apps/home/src/server.ts`
- `apps/home/src/render.ts`
- `tests/integration/home-surface.test.mjs`

### `app.iai.one`
- `apps/app/README.md`
- `apps/app/src/i18n.ts`
- `apps/app/src/server.ts`
- `apps/app/src/render.ts`
- `tests/integration/app-surface.test.mjs`

### `flow.iai.one`
- `apps/flow/README.md`
- `apps/flow/src/i18n.ts`
- `apps/flow/src/server.ts`
- `apps/flow/src/render.ts`
- `tests/integration/flow-surface.test.mjs`

### `docs.iai.one`
- `apps/docs/README.md`
- `apps/docs/src/i18n.ts`
- `apps/docs/src/server.ts`
- `apps/docs/src/render.ts`
- `tests/integration/docs-surface.test.mjs`

### `nft.iai.one`
- `apps/nft/README.md`
- `apps/nft/src/i18n.ts`
- `apps/nft/src/server.ts`
- `apps/nft/src/render.ts`
- `tests/integration/nft-surface.test.mjs`

### `web.iai.one`
- `apps/web/README.md`
- `apps/web/src/i18n.ts`
- `apps/web/src/server.ts`
- `apps/web/src/render.ts`
- `tests/integration/web-onboarding-contract.test.mjs`

### `pay.iai.one`
- `apps/pay/README.md`
- `apps/pay/src/i18n.ts`
- `apps/pay/src/server.ts`
- `apps/pay/src/render.ts`
- `tests/integration/pay-surface.test.mjs`

### `dash.iai.one` adjacent evidence
Dash is not inside the ordered audit list for this pass, but it is relevant because `web.iai.one` routes into it.
Current local evidence:
- `apps/dash/README.md`
- `apps/dash/src/i18n.ts`
- `apps/dash/src/server.ts`
- `apps/dash/src/render.ts`
- `tests/integration/dash-app-phase0.test.mjs`

This adjacent evidence confirms a shared pattern in the workspace:
- real scaffold exists
- runtime truth is respected
- language system binding is now present in `apps/dash/src/i18n.ts`
- route rendering now respects shared dictionaries, locale-aware redirects, and SEO shell metadata while staying `noindex`
- integration evidence has been upgraded to check Vietnamese default rendering and explicit English rendering
- `pnpm test:dash` now passes with route-level locale and runtime assertions

---

## 5. Final decision

From this workspace alone:
- implementation-present surfaces in the ordered audit set: all 8 (`iai.one`, `home.iai.one`, `app.iai.one`, `flow.iai.one`, `docs.iai.one`, `nft.iai.one`, `web.iai.one`, `pay.iai.one`)
- shell-level conditional gate posture:
  - `CONDITIONAL-GO`: `iai.one`, `home.iai.one`, `app.iai.one`, `flow.iai.one`, `docs.iai.one`, `web.iai.one`, `nft.iai.one` public trust shell, `pay.iai.one` prep shell
  - `NO-GO`: secure NFT lane (`step-up + wallet proof + protected delivery + partner signed sync`) until Team 2 packet moves from `BLOCKED`
  - sequence hold: `pay.iai.one` executable release remains blocked until secure NFT lane passes Team 1 pair-review gate

Team 1 should therefore treat this audit as:
- a real compliance audit for `iai.one`, now upgraded from “missing” to “implemented scaffold”
- a real compliance audit for `home.iai.one`, now upgraded from “missing” to “implemented scaffold”
- a real compliance audit for `app.iai.one`, now upgraded from “missing” to “implemented user-product scaffold”
- a real compliance audit for `flow.iai.one`, now upgraded from backend-partial to implemented public execution scaffold
- a real compliance audit for `docs.iai.one`, now upgraded from docs-folder-only state to implemented public docs scaffold
- a real compliance audit for `nft.iai.one` public trust shell, while keeping secure lane NO-GO under Team 1 gate rule
- a real compliance audit for `web.iai.one`, now updated to reflect closed codex P0 gaps
- a real compliance audit for `pay.iai.one` prep shell, with explicit sequencing hold before any payout release claim

---

## 6. Required next actions

### P0
1. Keep `apps/root` inside the constitutional role and reject any drift toward portal or product language.
2. Keep `apps/home` inside the portal role and reject any drift toward a second root or product clone.
3. Keep `apps/app` inside the user product role and reject any drift toward root, docs, or deep admin language.
4. Keep `apps/web` on shared content sources and reject any regression back to hard-coded public strings.
5. Keep `apps/nft` public shell aligned with trust wording while secure lane remains strictly evidence-gated.
6. Keep `apps/pay` in phase-D prep posture and reject any payout-finality claim before Team 1 sequencing release.
7. Keep `apps/dash` on the same shared-language shell pattern, then use `root` + `home` + `app` + `web` + `dash` as the baseline for future public surfaces that enter this repo.
8. Preserve metadata binding to `content/seo-registry.csv` as the required pattern for every new surface.

### P0.5
1. Team 2 must close the consolidated Team 1 follow-up list in `docs/reports/team1/NFT_TEAM1_READINESS_SYNC_2026-04-17.md` and move packet status to `READY_FOR_TEAM1_REVIEW`.
2. Team 4 should close remaining trace-row ambiguity requested by Team 1 intake, then keep packet at `READY_FOR_TEAM1_REVIEW`.
3. Team 1 runs pair-review only after both packet preconditions are met in locked status words.

### P1
1. Run secure NFT pair-review and update final `GO/NO-GO` decision with rollback owner + blast radius.
2. If secure NFT passes gate, move to `pay` release authority review in locked order.

---

## 7. One-sentence conclusion

In the current workspace, all eight ordered surfaces now have real shell implementations, while Team 1 still keeps secure NFT lane `NO-GO` and keeps `pay` release sequence-locked until the pair-review evidence gate passes.
