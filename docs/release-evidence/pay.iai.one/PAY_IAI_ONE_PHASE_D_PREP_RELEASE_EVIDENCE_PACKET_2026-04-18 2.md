# PAY_IAI_ONE_PHASE_D_PREP_RELEASE_EVIDENCE_PACKET_2026-04-18
## Release evidence packet for `pay.iai.one` (Phase D prep lane)
## Version 1.1
## Status: REVIEW_DELTA_SUBMITTED
## Scope: prep-only, no release claim
## Date: 2026-04-18

---

## Metadata

- Domain: `pay.iai.one`
- Owner team: Team 2 Runtime and Platform Core
- Named owner: Team 2 Runtime Lead
- Release date: 2026-04-18
- Commit / branch: `cc5a33e` on `OMCODE/smtp-internal-first-phase1`
- Target environment: local/runtime verification lane
- Approver: Team 1 Program Root
- Rollback owner: Team 2 Runtime Lead
- Related gate/spec files:
  - `docs/PAY_IAI_ONE_WALLET_AND_SETTLEMENT_PHASE_PLAN_2026.md`
  - `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-18.md`
  - `docs/reports/team1/TEAM1_PACKET_REQUEST_BATCH_2026-04-18.md`
  - `docs/reports/team1/TEAM1_REMAINING_GATE_PACKET_CHECKLIST_2026-04-18.md`

---

## 1. Scope shipped

- Routes:
  - `GET /`
  - `GET /health`
  - explicit `404` for unknown routes
- Modules:
  - `apps/pay/src/server.ts`
  - `apps/pay/src/render.ts`
  - `apps/pay/src/i18n.ts`
  - `apps/pay/src/index.ts`
- APIs/contracts:
  - health contract includes `status=phase_d_prep`
  - Team 1 gate lock contract:
    - `owner=team1_program_root`
    - `phase=phase_d_prep`
    - `state=locked`
    - `release_claim=false`
  - locale contract:
    - `default_locale=en`
    - `fallback_locale=en`
    - `supported_locales=["en","vi"]`
  - non-indexable prep control:
    - header `x-robots-tag: noindex, nofollow`
    - html meta `robots=noindex,nofollow`
- Explicitly not shipped:
  - payout execution connectors
  - settlement batch runtime
  - crypto rails
  - any public release claim

---

## 2. Route evidence

| Route | Expected behavior | Actual behavior | Pass / Fail | Notes |
|---|---|---|---|---|
| `/` | EN-first prep shell with VI support, prep-only message | rendered EN by default and VI by explicit locale | PASS | `tests/integration/pay-surface.test.mjs` |
| `/health` | expose prep + locale + Team 1 gate lock contract | returns `status=phase_d_prep`, locale contract, gate contract | PASS | same test file |
| `/missing` | explicit 404 route | 404 response with explicit not-found copy | PASS | same test file |

---

## 3. API and contract evidence

| Contract / API | Verification method | Result | Notes |
|---|---|---|---|
| prep status contract (`phase_d_prep`) | `pnpm test:pay` | PASS | locked prep-only state |
| Team 1 gate lock contract (`owner/phase/state/release_claim`) | `pnpm test:pay` | PASS | enforces no release claim |
| locale contract (`default/fallback/supported`) | `pnpm test:pay` | PASS | EN default, VI first-class |
| locale fallback for invalid input | `pnpm test:pay` | PASS | invalid locale falls back to EN |
| non-indexable prep control (header/meta) | `pnpm test:pay` | PASS | noindex on `/`, `/health`, `404`, `405` |
| method deny contract | `pnpm test:pay` | PASS | non-GET returns `405/METHOD_NOT_ALLOWED` |

---

## 4. UI evidence

| Screen / route | Evidence path | State covered | Notes |
|---|---|---|---|
| `/` EN render | `tests/integration/pay-surface.test.mjs` | EN-first shell + canonical/hreflang + robots meta | test-evidence-first |
| `/` VI render (`?lang=vi`) | `tests/integration/pay-surface.test.mjs` | VI first-class copy | test-evidence-first |
| `/missing` | `tests/integration/pay-surface.test.mjs` | explicit 404 path | test-evidence-first |

---

## 5. Smoke / gate checks

| Command | Result | Notes |
|---|---|---|
| `pnpm test:pay` | PASS (`6/6`) | pay prep lane contract checks |
| `pnpm test:dash` | PASS (`11/11`) | Dash remains green, no scope expansion |
| `pnpm report:control-tower` | PASS (`READY`) | lane PASS + nft-phasec PASS/GO + control READY |

---

## 6. Edge cases

- invalid locale input falls back to EN
- non-GET request denied with explicit `METHOD_NOT_ALLOWED`
- unknown route returns explicit 404
- prep shell remains non-indexable (`header` + `meta`)
- release claim remains locked by Team 1 gate contract

---

## 7. Rollback note

- Rollback path:
  - revert:
    - `apps/pay/src/server.ts`
    - `apps/pay/src/render.ts`
    - `tests/integration/pay-surface.test.mjs`
  - rerun:
    - `pnpm test:pay`
    - `pnpm test:dash`
    - `pnpm report:control-tower`
- Rollback owner:
  - Team 2 Runtime Lead
- Rollback risk:
  - low; blast radius limited to prep contract + noindex behavior for `pay`

---

## 8. Known issues

| Issue | Impact | Workaround | Owner | Status |
|---|---|---|---|---|
| release claim lock is still active by Team 1 gate | `pay.iai.one` cannot be declared releasable yet | keep prep-only operation and wait for Team 1 release-claim approval | Team 1 + Team 2 | OPEN |

---

## 9. Team 1 review delta (required by Team 1 packet batch)

### 9.1 Release-claim gate proof

| Required proof | Source | Current state | Evidence |
|---|---|---|---|
| Team 1 gate lock contract exists | `/health` contract in `apps/pay/src/server.ts` | PASS | `owner=team1_program_root`, `phase=phase_d_prep`, `state=locked`, `release_claim=false` |
| Release claim cannot be considered open | `tests/integration/pay-surface.test.mjs` + `pnpm test:pay` | PASS | health payload asserts `release_claim=false` |
| Prep lane remains non-indexable | `apps/pay/src/server.ts`, `apps/pay/src/render.ts`, `pnpm test:pay` | PASS | `x-robots-tag: noindex, nofollow` + `<meta name=\"robots\" content=\"noindex, nofollow\" />` |

### 9.2 Rollback proof pointer

- rollback section exists and is complete in this packet:
  - `## 7. Rollback note`
- rollback rerun commands already defined:
  - `pnpm test:pay`
  - `pnpm test:dash`
  - `pnpm report:control-tower`

### 9.3 Team 1 verdict section (for gate flip decision)

- Team 1 reviewer:
- Team 1 review date:
- Verdict: `ACCEPTED` / `ACCEPTED_WITH_NOTES` / `NEEDS_REVISION` / `REJECTED`
- Release-claim gate decision: `LOCK_RETAINED` / `LOCK_FLIPPED`
- Notes:

---

## 10. Final sign-off

- Team 2 owner sign-off: `Y`
- Team 1 review result: `PENDING`
- Final packet status: `REVIEW_DELTA_SUBMITTED` (prep-only, release claim still locked)
