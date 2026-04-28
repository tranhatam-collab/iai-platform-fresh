# TEAM3_UI_EVIDENCE_PACKET_2026-04-17

- Domain: `noos.iai.one` (Team 3 lane scope) with baseline shell boundary references `iai/home/app/flow/docs/web`
- Owner team: Team 3 Surface/IA/Content
- Named owner: Team 3 Surface Lead
- Release date: 2026-04-17
- Commit / branch: `f1605c6` / `OMCODE/smtp-internal-first-phase1`
- Target environment: workspace verification lane
- Approver: Team 1 Program Root (release gate)
- Rollback owner: Team 3 Surface Lead
- Related release gate file: `docs/reports/team1/LANE_STATUS_SNAPSHOT_2026-04-17.md`

## 1. Scope Đã Ship
- Routes:
  - NOOS public and buyer surfaces under locale policy `en/vi`
  - route evidence for `/products`, `/documents`, `/programs`, `/licenses`, `/product/[slug]`, `/library`, `/library/product/[slug]`, `/library/updates`, `/library/licenses`, `/library/account`, `/checkout-success`, `/operations`
- Modules:
  - Team 3 evidence docs and route QA artifacts
- APIs/contracts:
  - consumed shared Team 2 runtime contracts; no local fork for locale/auth/billing wording
- Explicitly không ship:
  - pricing/license/product truth changes
  - runtime contract mutations
  - mission/role remap changes

## 2. Route Evidence
| Route | Expected | Actual | Pass/Fail | Notes |
|---|---|---|---|---|
| `/en/products`, `/vi/products` | locale-aware public catalog with metadata lock | canonical/hreflang and localized content verified | PASS | verified by `pnpm test:noos-web` |
| `/en/documents`, `/vi/programs` | IA-aligned grouped routes | grouped surfaces render with EN/VI parity | PASS | verified by `pnpm test:noos-web` |
| `/en/product/*`, `/vi/product/*` (P01..P12) | locked 12-section template, EN/VI parity, P12 handoff path | full route-level assertions pass for P0/P1 pages | PASS | includes P12 organization inquiry path |
| `/en/library*`, `/vi/library*` | buyer surfaces remain locale-aware and noindex | localized buyer pages with `noindex,nofollow` pass | PASS_WITH_NOTES | live dependency on Team 2 runtime handoff |
| `/en/checkout-success`, `/vi/checkout-success` | locale-preserving success handoff | localized success routes + noindex pass | PASS_WITH_NOTES | live dependency on Team 2 runtime handoff |
| legacy investor/fundraising routes | redirect + noindex safety | redirect status and robots tag assertions pass | PASS | boundary lock preserved |

## 3. API Và Contract Evidence
| Contract / API | Verification method | Result | Notes |
|---|---|---|---|
| NOOS commerce schema/fixtures | `pnpm test:noos-commerce-contracts` | PASS | `openapi 3.1.0`, `schemaCount 35`, `fixtureFilesValidated 12` |
| Shared runtime handoff contract (Team 2) | consume-only policy in Team 3 daily + packet + route tests | PASS_WITH_NOTES | Team 3 does not fork locale/auth/billing wording |
| Locale metadata contract (`canonical`, `hreflang`, `x-default`) | route-level integration assertions in NOOS tests | PASS | EN/VI route metadata checks pass |
| Route metadata proof packet (Team 3) | `docs/reports/team3/TEAM3_NOOS_METADATA_PROOF_2026-04-17.md` | PASS | route matrix for `title`, `description`, `canonical`, `hreflang`, `x-default`, and `noindex` |

## 4. UI Evidence
| Screen / route | Screenshot path | State covered | Notes |
|---|---|---|---|
| `root` shell (`/`) | `docs/reports/team1/IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17.md` | default VI + explicit EN + boundary shell | visual evidence tracked in Team 1 audit packet |
| `home` shell (`/`) | `docs/reports/team1/IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17.md` | default VI + explicit EN + portal boundary | visual evidence tracked in Team 1 audit packet |
| `app` shell (`/`) | `docs/reports/team1/IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17.md` | default VI + explicit EN + product boundary | visual evidence tracked in Team 1 audit packet |
| `flow` shell (`/`) | `docs/reports/team1/IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17.md` | default VI + explicit EN + execution boundary | visual evidence tracked in Team 1 audit packet |
| `docs` shell (`/`) | `docs/reports/team1/IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17.md` | default VI + explicit EN + docs boundary | visual evidence tracked in Team 1 audit packet |
| `web` onboarding (`/`, `/onboarding`) | `docs/reports/team1/IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17.md` | default VI + explicit EN + shared auth handoff | visual evidence tracked in Team 1 audit packet |
| NOOS public + buyer routes | `tests/integration/noos-commerce-surface.test.mjs` + Team 3 QA log | EN/VI parity, metadata, buyer noindex states | route render evidence attached via integration assertions |
| NOOS route-level metadata proof | `docs/reports/team3/TEAM3_NOOS_METADATA_PROOF_2026-04-17.md` | metadata matrix by locale + route class | contract-ready proof for Team 1 lane review |

## 5. Curl / Smoke Evidence
| Test | Command / method | Result | Request / execution id | Notes |
|---|---|---|---|---|
| NOOS type safety gate | `pnpm typecheck:noos-web` | PASS | local execution `2026-04-17` | no TypeScript drift in Team 3 NOOS surface |
| baseline shell gate | `pnpm test:root` | PASS | local execution `2026-04-17` | role boundary + locale + metadata checks |
| baseline shell gate | `pnpm test:home` | PASS | local execution `2026-04-17` | portal boundary + locale + metadata checks |
| baseline shell gate | `pnpm test:app` | PASS | local execution `2026-04-17` | product boundary + locale + metadata checks |
| baseline shell gate | `pnpm test:flow-surface` | PASS | local execution `2026-04-17` | execution boundary + locale + metadata checks |
| baseline shell gate | `pnpm test:docs` | PASS | local execution `2026-04-17` | docs boundary + locale + metadata checks |
| shared onboarding contract | `pnpm test:web` | PASS | local execution `2026-04-17` | shared auth/billing/runtime contract route checks |
| NOOS route/metadata gate | `pnpm test:noos-web` | PASS (`13/13`) | local execution `2026-04-17` | EN/VI parity + boundary safety + metadata checks |
| NOOS schema contract gate | `pnpm test:noos-commerce-contracts` | PASS | local execution `2026-04-17` | fixtures and schema integrity checks |
| NOOS mock stack gate | `NOOS_STACK_TEST=1 pnpm test:noos-stack` | PASS (`1/1`) | local execution `2026-04-17` | checkout -> success -> library handoff and legacy boundary redirect |
| lane gate | `pnpm report:lane` | PASS | snapshot `2026-04-17` | mission map + daily reports + NOOS boundary checks pass |

## 6. Edge Cases Covered
- legacy NOOS investor/fundraising routes remain redirected with noindex safety
- buyer-private routes stay `noindex,nofollow` while preserving locale-aware rendering
- locale-specific rendering validated in EN/VI for P0/P1 NOOS product and buyer surfaces

## 7. Rollback Note
- Rollback path:
  - revert Team 3 checkpoint docs (`daily`, `ui evidence packet`, NOOS QA/checklist updates) and rerun `pnpm report:lane`
- Rollback owner:
  - Team 3 Surface Lead
- Rollback risk:
  - low runtime risk (docs/evidence updates only)
  - medium governance risk if packet references are removed without replacement evidence

## 8. Known Issues
| Issue | Impact | Workaround | Owner | Status |
|---|---|---|---|---|
| buyer routes depend on Team 2 live locale/auth/session continuity | checkout-success/library locale handoff can drift if Team 2 runtime changes uncoordinated | keep `PASS_WITH_NOTES` policy and rerun route-level evidence after Team 2 contract updates | Team 2 Runtime Lead + Team 3 Surface Lead | OPEN |

## 9. Final Sign-Off
- Owner sign-off:
  - Team 3 packet completed with mandatory route list, screenshot proof references, locale proof, known issues, and rollback note
- Team 1 review:
  - lane automation gate is PASS on `2026-04-17`; Team 3 completion closure attached in `TEAM3_COMPLETE_DEV_PLAN_2026-04-17.md`
- Final status:
  - READY
