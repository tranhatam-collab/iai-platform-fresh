# TEAM2_RUNTIME_RELEASE_EVIDENCE_PACKET_2026-04-17
## Team 2 runtime/contracts release packet for root/home/app/flow/docs/web
## Version 1.0
## Status: IN_PROGRESS
## Owner: Team 2 Runtime and Platform Core
## Date: 2026-04-17

---

## Metadata

- Domain group: `root.iai.one`, `home.iai.one`, `app.iai.one`, `flow.iai.one`, `docs.iai.one`, `web.iai.one`
- Owner team: Team 2 Runtime and Platform Core
- Named owner: Team 2 Runtime Lead
- Release date: 2026-04-17
- Branch: `main`
- Target environment: local runtime/test lane
- Approver: Team 1 Program Root (pending)
- Rollback owner: Team 2 Runtime Lead
- Related gate files:
  - `docs/IAI_TEAM2_RUNTIME_PLATFORM_EXECUTION_PLAN_2026.md`
  - `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

---

## 1. Scope shipped

- Routes:
  - root: `/`, `/health`
  - home: `/`, `/health`
  - app: `/`, `/health`
  - flow: `/`, `/health`
  - docs: `/`, `/health`
  - web: `/`, `/onboarding`, `/contract-status`, `/events`, `/shared-auth`, `/health`
- Modules:
  - shared locale resolution + metadata for root/home/app/flow/docs/web
  - `api.flow` source-of-truth and domain read-model endpoints
  - dash runtime summary integration over `api.flow`
- APIs/contracts:
  - `/v1/flow/source-of-truth`
  - `/v1/flow/approvals`
  - `/v1/flow/billing`
  - `/v1/flow/proofs`
  - `/v1/flow/alerts`
  - `/v1/flow/web-onboarding-contract`
- Explicitly not shipped:
  - Phase C secure NFT runtime production closeout
  - Phase D pay wallet/settlement executable surface

---

## 2. Route evidence

| Route group | Expected behavior | Actual behavior | Pass/Fail | Notes |
|---|---|---|---|---|
| root/home/app surfaces | locale-aware shells + canonical metadata + explicit not-found behavior | integration tests assert VI default + EN explicit + 404 behavior | PASS | see `test:root`, `test:home`, `test:app` |
| flow surface | execution shell + canonical metadata + locale-safe render | integration tests assert route + metadata + EN/VI behavior | PASS | `test:flow` includes `flow-surface` |
| docs surface | documentation boundary shell + locale-safe render | integration tests assert route + metadata + EN/VI behavior | PASS | `test:docs` |
| web surface | onboarding contract shell tied to shared runtime contracts | integration tests assert shared contract targets and filter contract names | PASS | `test:web` |

---

## 3. API and contract evidence

| Contract / API | Verification method | Result | Notes |
|---|---|---|---|
| `/v1/flow/source-of-truth` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | summary values and workspace guard asserted |
| `/v1/flow/alerts` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | critical alert filtering asserted |
| `/v1/flow/approvals` validation | invalid query test in `flow-api-source-of-truth` | PASS | returns `VALIDATION_ERROR` envelope |
| workspace contract guard | `flow-api-source-of-truth` + dash integration tests | PASS | missing workspace returns error; dash forwards workspace id |
| web onboarding shared contract | `tests/integration/web-onboarding-contract.test.mjs` | PASS | shared auth/billing targets and filter names stay locked |
| NOOS locale contract | `scripts/noos-commerce-contract-check.mjs` | PASS | locale lock markers remain enforced |

---

## 4. UI evidence

| Screen / route | Evidence path | State covered | Notes |
|---|---|---|---|
| root/home/app/flow/docs shells | integration tests (`tests/integration/*-surface.test.mjs`) | VI default, EN explicit, canonical/hreflang, 404 | evidence-first in code test lane |
| web onboarding shell | `tests/integration/web-onboarding-contract.test.mjs` | contract-safe route and filter wiring | shared contract path protected |
| dash shell adjacency | `tests/integration/dash-app-phase0.test.mjs` | auth guard, runtime summary, workspace propagation | used as runtime consumer proof |

---

## 5. Test and smoke evidence

| Test | Command | Result | Notes |
|---|---|---|---|
| root shell | `pnpm test:root` | PASS | route + locale + metadata |
| home shell | `pnpm test:home` | PASS | route + locale + metadata |
| app shell | `pnpm test:app` | PASS | route + locale + metadata |
| flow contracts and surface | `pnpm test:flow` | PASS | includes flow API + flow surface checks |
| docs shell | `pnpm test:docs` | PASS | docs surface contract checks |
| pay phase D prep shell | `pnpm test:pay` | PASS | EN-default + VI explicit + invalid locale fallback + deny non-GET |
| web shell | `pnpm test:web` | PASS | shared contract + filter locks |
| dash runtime consumer | `pnpm test:dash` | PASS | workspace/auth/runtime chain |
| full runtime lane | `pnpm test` | PASS | aggregate lane green |

---

## 6. Edge cases covered

- missing workspace identity on contract routes returns guard error
- invalid enum filters return structured validation error
- unauthenticated dash session redirects to localized login route
- explicit English locale rendering still preserves route and metadata contract
- locale lock fallback remains `en` by Team 2 language contract and NOOS contract checks

---

## 7. Phase C and Phase D prep status

### Phase C (`nft`) prep
- packet path active: `docs/runtime/TEAM2_NFT_LIVE_EVIDENCE_PACKET_2026.md`
- status now: still non-ready for Team 1 secure production review
- guardrail: do not claim `READY_FOR_TEAM1_REVIEW` until full pass/deny/audit/raw-url evidence chain is complete

### Phase D (`pay`) prep
- planning truth active: `docs/PAY_IAI_ONE_WALLET_AND_SETTLEMENT_PHASE_PLAN_2026.md`
- Team 2 prep lock: shared auth/session/audit/ledger assumptions must be traceable before app surface claim
- packet path active: `docs/runtime/TEAM2_PAY_PHASE_D_PREP_EVIDENCE_PACKET_2026-04-17.md`
- current packet status: `READY_FOR_TEAM1_REVIEW` (prep scope only, no production payout claim)

---

## 8. Rollback note

- Rollback path:
  - revert changed runtime contract docs and script deltas in one changeset
  - rerun `pnpm test` and `pnpm report:lane` to confirm baseline restore
- Rollback owner:
  - Team 2 Runtime Lead
- Rollback risk:
  - medium (contract/documentation drift could block Team 1 review if not reverted cleanly)

---

## 9. Known issues

| Issue | Impact | Workaround | Owner | Status |
|---|---|---|---|---|
| Team 2 NFT packet not yet complete for secure runtime lane | cannot reopen secure NFT production gate | continue packet closure track and keep status non-ready | Team 2 | OPEN |
| Lane report checkpoint 2026-04-17 required mission literals and daily files | blocker da duoc Team 1 close, lane snapshot chuyen PASS | maintain daily discipline and keep mission-map compatibility literals stable | Team 1 + all teams | RESOLVED |

---

## 10. Final sign-off

- Team 2 owner sign-off: `Y` (runtime contract evidence attached)
- Team 1 review: `REVIEWED_2026-04-17` (runtime lane evidence accepted; secure NFT reopen claim not requested in this packet)
- Final status: `IN_PROGRESS`
