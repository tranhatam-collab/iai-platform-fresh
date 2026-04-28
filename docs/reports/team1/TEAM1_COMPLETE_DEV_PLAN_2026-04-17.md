# TEAM1_COMPLETE_DEV_PLAN_2026-04-17
## Team 1 complete development plan after surface audit checkpoint
## Version 1.0
## Status: ACTIVE EXECUTION PLAN
## Owner: Team 1 Program Root
## Date: 2026-04-17

---

## 1. Confirmed baseline (checked in this workspace)

Team 1 verification on 2026-04-17 confirms:
- `tests/integration/root-surface.test.mjs` PASS
- `tests/integration/home-surface.test.mjs` PASS
- `tests/integration/app-surface.test.mjs` PASS
- `tests/integration/flow-surface.test.mjs` PASS
- `tests/integration/docs-surface.test.mjs` PASS
- `tests/integration/web-onboarding-contract.test.mjs` PASS
- `tests/integration/dash-app-phase0.test.mjs` PASS

Public shell reality in current ordered audit:
- `CONDITIONAL-GO`: `iai.one`, `home.iai.one`, `app.iai.one`, `flow.iai.one`, `docs.iai.one`, `web.iai.one`
- `NO-GO (public shell missing)`: `nft.iai.one`, `pay.iai.one`

Source checkpoint:
- `docs/reports/team1/IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17.md`

---

## 2. Locked execution order (must not skip)

1. `nft.iai.one`
2. `pay.iai.one`

Rule:
- Team 1 only upgrades surface status in order.
- No surface can move to `READY_FOR_TEAM1_REVIEW` without its own runtime + UI + evidence packet.

---

## 3. Phase plan

## Phase A - FLOW public shell (completed)

### Objective
Scaffold real `apps/flow` public surface (not backend-only lane), aligned with codex and mission map.

### Build scope
- create `apps/flow` package with:
  - `src/server.ts`
  - `src/render.ts`
  - `src/i18n.ts`
  - `README.md`
- bind copy and SEO from shared content registries
- expose `/` and `/health`
- wire intent handoff to `dash`, `docs`, `developer`, and runtime endpoints by contract

### Required tests
- add `tests/integration/flow-surface.test.mjs`
- keep existing backend lane tests green (current `test:flow`)
- add scripts:
  - `build:flow`
  - `typecheck:flow`
  - `test:flow-surface`

### Team 1 gate for Phase A
- public shell exists and compiles
- VI default + EN explicit rendering verified
- canonical/hreflang/JSON-LD metadata verified
- no domain-role drift in copy
- evidence packet attached for `flow.iai.one`

### Phase A checkpoint result (2026-04-17)
- `apps/flow` scaffold implemented (`README`, `server`, `render`, `i18n`, `index`, `package`, `tsconfig`)
- `tests/integration/flow-surface.test.mjs` added and PASS
- scripts wired: `build:flow`, `dev:flow`, `typecheck:flow`, `test:flow-surface`
- Team 1 audit updated: `flow.iai.one` moved to `CONDITIONAL-GO`

---

## Phase B - DOCS public shell (completed)

### Objective
Create real `apps/docs` surface for builder/docs access instead of docs-folder-only state.

### Build scope
- scaffold `apps/docs` with server/render/i18n
- map required docs routes from locked release gate docs
- enforce docs role (not product shell, not portal clone)

### Required tests
- add `tests/integration/docs-surface.test.mjs`
- add scripts: `build:docs`, `typecheck:docs`, `test:docs`

### Team 1 gate for Phase B
- routes and metadata pass
- i18n + SEO shell pass
- release evidence packet complete

### Phase B checkpoint result (2026-04-17)
- `apps/docs` scaffold implemented (`README`, `server`, `render`, `i18n`, `index`, `package`, `tsconfig`)
- `tests/integration/docs-surface.test.mjs` added and PASS
- scripts wired: `build:docs`, `dev:docs`, `typecheck:docs`, `test:docs`
- Team 1 audit updated: `docs.iai.one` moved to `CONDITIONAL-GO`

---

## Phase C - NFT public shell + protection lane handoff

### Objective
Scaffold `apps/nft` trust surface and bind it to Team 2 + Team 4 packet workflow.

### Build scope
- scaffold `apps/nft` public trust shell
- wire step-up, wallet proof, and protected-access language states
- implement noindex/protected behavior where required by policy

### Required evidence dependencies
- Team 2 packet: `docs/runtime/TEAM2_NFT_LIVE_EVIDENCE_PACKET_2026.md`
- Team 4 packet: `docs/reports/team4/TEAM4_NFT_PARTNER_OPS_EVIDENCE_PACKET_2026.md`
- both must be `READY_FOR_TEAM1_REVIEW` with traceable evidence

### Required tests
- add `tests/integration/nft-surface.test.mjs`
- include deny-state render checks and partner-sync failure messaging checks

### Team 1 gate for Phase C
- packet completeness from Team 2 + Team 4
- UI shell matches protection policy language
- rollback path verified

### Phase C checkpoint result (2026-04-17)
- `apps/nft` scaffold implemented (`README`, `server`, `render`, `i18n`, `index`, `package`, `tsconfig`)
- `tests/integration/nft-surface.test.mjs` added and PASS
- scripts wired: `build:nft`, `dev:nft`, `typecheck:nft`, `test:nft`
- Team 1 readiness sync result: public trust shell implemented; secure lane remains `NO-GO` because Team 2 packet is still `BLOCKED`

---

## Phase D - PAY public shell

### Objective
Scaffold `apps/pay` for payment methods/invoice/settlement shell.

### Build scope
- create pay shell with role boundaries (no wallet custody drift)
- align with auth/session and billing contracts
- bind content + SEO registry entries

### Required tests
- add `tests/integration/pay-surface.test.mjs`
- add scripts: `build:pay`, `typecheck:pay`, `test:pay`

### Team 1 gate for Phase D
- pay shell exists and is contract-safe
- no overlap with app/web/docs roles
- release evidence packet complete

### Phase D checkpoint result (2026-04-17)
- `apps/pay` scaffold implemented (`README`, `server`, `render`, `i18n`, `index`, `package`, `tsconfig`)
- `tests/integration/pay-surface.test.mjs` added and PASS
- scripts wired: `build:pay`, `dev:pay`, `typecheck:pay`, `test:pay`
- Team 1 sequencing result: pay prep shell implemented; executable release remains locked behind secure NFT pair-review gate

---

## 4. Cross-team ownership and handoff

- Team 1: gate owner, evidence auditor, GO/NO-GO authority
- Team 2: runtime contracts + secure action truth
- Team 3: surface IA/content implementation support for NOOS-adjacent lanes
- Team 4: operations, incident, and support wording for growth and NFT partner lane
- Team 5: web onboarding contract alignment and handoff integrity

Every phase must include:
- changed files list
- test command outputs
- screenshots (surface proof)
- API/curl proof for protected actions where relevant
- rollback note

---

## 5. Daily execution rhythm (Team 1)

- 09:00 ICT: verify previous-day phase outputs and blockers
- 14:00 ICT: dependency sync (Team 2/3/4/5)
- 17:00 ICT: publish Team 1 daily + gate status delta

Escalation rule:
- any critical dependency blocker > 24h => explicit Team 1 escalation entry

---

## 6. Exit criteria for this plan

Plan is complete when:
- all ordered surfaces (`iai`, `home`, `app`, `flow`, `docs`, `nft`, `web`, `pay`) are implementation-auditable in this repo
- each surface has green build/typecheck/test + evidence packet
- Team 1 can issue per-surface GO/NO-GO with traceable proof while maintaining green status on already-implemented shells (`root`, `home`, `app`, `flow`, `docs`, `web`)
