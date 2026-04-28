# TEAM2_PAY_PHASE_D_PREP_EVIDENCE_PACKET_2026-04-17
## Team 2 runtime prep evidence packet for `pay.iai.one`
## Version 1.0
## Status: READY_FOR_TEAM1_REVIEW
## Scope: Phase D prep only (no production payout claim)
## Owner: Team 2 Runtime and Platform Core
## Date: 2026-04-17

---

## 1. Packet status

- Current status: `READY_FOR_TEAM1_REVIEW`
- Review scope:
  - scaffold runtime shell for `pay.iai.one`
  - locale contract lock and fallback behavior
  - deny guard for non-GET prep routes
- Explicitly out of scope in this packet:
  - executable payout connectors
  - live settlement batches
  - crypto rails

---

## 2. Route and module evidence

- Routes shipped:
  - `/`
  - `/health`
  - explicit 404 for unknown routes
- Runtime module paths:
  - `apps/pay/src/server.ts`
  - `apps/pay/src/i18n.ts`
  - `apps/pay/src/render.ts`
  - `apps/pay/src/index.ts`
- Test path:
  - `tests/integration/pay-surface.test.mjs`

---

## 3. Contract evidence

### Locale contract (`/health`)
- service: `iai-pay`
- status: `phase_d_prep`
- Team 1 gate lock contract:
  - `owner = team1_program_root`
  - `phase = phase_d_prep`
  - `state = locked`
  - `release_claim = false`
- locale contract response:
  - `default_locale = en`
  - `fallback_locale = en`
  - `supported_locales = ["en","vi"]`

### Language addendum (2026-04-17) checklist
- EN default behavior: PASS
- VI explicit behavior (`?lang=vi`): PASS
- invalid locale fallback -> EN: PASS
- no silent locale drift between HTML and `content-language`: PASS

---

## 4. Pass cases

| Case | Evidence | Result |
|---|---|---|
| Health contract exposes phase D prep and locale fields | `pnpm test:pay` -> `pay health route exposes phase D prep contract and locale lock` | PASS |
| Default route renders EN-first shell | `pnpm test:pay` -> `pay landing page keeps EN-first metadata and phase messaging` | PASS |
| Vietnamese route renders first-class VI copy | `pnpm test:pay` -> `pay supports explicit vietnamese rendering` | PASS |
| Invalid locale falls back to EN | `pnpm test:pay` -> `pay falls back to english for invalid locale input` | PASS |
| Missing route remains explicit | `pnpm test:pay` -> `pay keeps missing routes explicit` | PASS |
| All prep responses remain non-indexable under Team 1 gate | `pnpm test:pay` -> header/meta noindex checks on `/`, `/health`, `404`, `405` | PASS |

---

## 5. Deny case

| Case | Evidence | Result |
|---|---|---|
| Non-GET request to prep shell route is rejected | `pnpm test:pay` -> `pay denies non-GET methods on prep shell routes` (`405`, `METHOD_NOT_ALLOWED`) | PASS |

---

## 6. Runtime lane evidence

- `pnpm test:pay` -> PASS
- `pnpm test` -> PASS (aggregate lane still green with `test:pay` integrated)
- `pnpm report:lane` -> PASS (`Overall: PASS`, snapshot date `2026-04-17`)

---

## 7. Rollback note

- Rollback owner: Team 2 Runtime Lead
- Rollback path:
  1. revert `apps/pay/*`, `tests/integration/pay-surface.test.mjs`, and script wiring in `package.json`
  2. rerun `pnpm test` and `pnpm report:lane`
  3. confirm lane snapshot returns `PASS`
- Blast radius if rollback triggered:
  - only Phase D prep shell and its contract/test wiring
  - no impact to production payout because payout was not opened in this packet

---

## 8. Team 3 / Team 5 coordination note

- Team 3:
  - consume `default=en`, `supported=[en,vi]`, `fallback=en` as fixed inputs for any pay-facing UI/route wiring.
- Team 5:
  - keep web handoff text and route assumptions aligned to pay prep status (`phase_d_prep`), not payout-ready language.
