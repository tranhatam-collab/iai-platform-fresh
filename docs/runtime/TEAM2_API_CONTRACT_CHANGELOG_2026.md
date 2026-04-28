# TEAM2_API_CONTRACT_CHANGELOG_2026
## Team 2 API Contract Changelog
## Version 1.0
## Status: ACTIVE SOURCE OF TRUTH
## Owner: Team 2 Runtime and Platform Core
## Date: 2026-04-17

---

## 1. Muc tieu

Giu mot changelog ro cho cac contract runtime/API ma Team 3, Team 4, Team 5 va Team 1 dang phu thuoc.

Khong cho:
- thay doi contract im lang
- surface teams tu doan request/response shape
- locale/auth/billing drift giua cac lanes

---

## 2. Rules

- Moi thay doi contract co impact cross-team phai co 1 row moi.
- Neu breaking change: bat buoc co migration note.
- Neu chi la clarification: van phai log neu no anh huong Team 3/4/5 handoff.

---

## 3. Changelog

| Change ID | Date | Scope | Change | Consumers | Breaking | Status |
|---|---|---|---|---|---|---|
| `CT-001` | 2026-04-14 | shared web onboarding | khoa `x-workspace-id` cho shared onboarding contract requests | Team 5, Team 1 | No | Active |
| `CT-002` | 2026-04-14 | flow source-of-truth | khoa timestamp stability cho test/read model de tranh drift theo wall-clock | Team 2, Team 1 | No | Active |
| `CT-003` | 2026-04-14 | locale contracts | khoa `locale`, `default_locale`, `supported_locales`, `fallback_locale` cho public-facing flows | Team 2, Team 3, Team 4, Team 5 | No | Active |
| `CT-004` | 2026-04-14 | NOOS checkout return path | khoa success/library return path theo locale `en/vi` | Team 2, Team 3, Team 4 | No | Active |
| `CT-005` | 2026-04-15 | Flow / Dash direction | runtime/API contracts phai support `dash.iai.one` nhu runtime app/control plane that, khong phai dashboard mock | Team 2, Team 1 | No | Active |
| `CT-006` | 2026-04-15 | NFT security runtime | khoa `passkey step-up -> wallet proof -> policy -> protected asset proxy -> audit -> partner sync` cho `nft.iai.one` | Team 2, Team 1, Team 4 | No | Active |
| `CT-007` | 2026-04-17 | runtime surface stability | lock evidence-first test baseline cho `root/home/app/flow/docs/web` de consumer teams khong bi drift khi tiep nhan handoff | Team 1, Team 2, Team 3, Team 5 | No | Active |
| `CT-008` | 2026-04-17 | phase prep contracts | mo lane prep Phase C (`nft`) + Phase D (`pay`) voi quy tac "khong claim ready neu packet evidence chua traceable" | Team 1, Team 2, Team 4 | No | Active |
| `CT-009` | 2026-04-17 | language addendum alignment | Team 2 locale/runtime packets phai kem language checklist theo addendum checkpoint 2026-04-17 (NOOS lock section 12) | Team 2, Team 3, Team 4, Team 5 | No | Active |
| `CT-010` | 2026-04-17 | pay phase D prep shell | them `@iai/pay` runtime scaffold + locale contract (`default=en`, `supported=[en,vi]`, invalid fallback=`en`) + deny-method guard (`405`) de Team 1 co packet review traceable truoc khi mo payout lane | Team 1, Team 2, Team 4, Team Pay | No | Active |

---

## 4. Current canonical contract groups

### Auth and session
- session validate
- logout
- workspace resolution
- role resolution

### Runtime truth
- flow list/detail
- execution list/detail
- step detail
- queue health
- approvals / proofs / alerts

### Commerce / fulfillment
- checkout session
- order creation
- entitlement grant
- library status
- update window state

### NFT secure asset runtime
- security session state
- step-up challenge/verify
- wallet proof challenge/verify
- access-check
- proxy token issuance
- protected asset download
- partner sync receiver

### Locale / routing
- locale fields
- fallback behavior
- success return path
- library return path

---

## 5. Change review rule

Team 2 truoc khi merge contract impact phai tra loi:
1. Team nao bi anh huong?
2. Co can migration note khong?
3. Co can test integration cap nhat khong?
4. Co can cap nhat `developer.iai.one` hoac public docs khong?
