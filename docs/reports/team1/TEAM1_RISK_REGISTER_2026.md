# TEAM1_RISK_REGISTER_2026
- Team: Team 1 Program Root
- Owner: Team 1 Program Root
- Scope: *.iai.one
- Status: ACTIVE

| Risk ID | Domain / Lane | Risk | Impact | Likelihood | Owner | Current mitigation | Status |
|---|---|---|---|---|---|---|---|
| `R-001` | `dash.iai.one` | contract drift co the quay lai neu Team 2 thay doi dash/api.flow shape ma không rerun Team 1 gate | cao | thap | Team 2 + Team 1 | Dash da `ACCEPTED_GO`; giữ monitor-only va rerun `test:dash` + `report:control-tower` khi co contract delta | MONITOR |
| `R-002` | `developer.iai.one` | Developer portal chưa co release evidence du da co platform spec | cao | trung binh | Team A / Team 1 | da khoa platform spec; can build IA, quickstart, auth/API/webhook pages va release packet | OPEN |
| `R-003` | Team 2 runtime | contract consumer drift co the quay lai neu Team 3 UI hooks confirmation chưa khoa ro | cao | trung binh | Team 2 + Team 3 | changelog + webhook matrix + locale contract da khoa; theo doi them bang UI hooks confirmation note | MONITOR |
| `R-004` | NOOS bilingual release | EN/VI parity co the drift giua Team 3 surface va Team 4 launch copy neu wave readiness board chưa cập nhật | cao | trung binh | Team 3 + Team 4 | route/stack tests xanh; tiếp tuc buoc Team 4 update wave board + bilingual copy matrix | OPEN |
| `R-005` | `web.iai.one` | nguy co runtime contract drift hau preview reopen neu Team 2 contract thay doi ma Team 5 không cập nhật kip | cao | thap | Team 5 + Team 2 + Team 1 | Team 1 da approve preview reopen; giữ monitor-only mode va rerun lane/tests neu Team 2 contract thay doi | MONITOR |
| `R-006` | Release discipline | co the xuat hien deploy du file docs nhung thiếu rollback/test evidence | rat cao | trung binh | Team 1 | giữ deploy freeze authority + service-specific gate reopen policy | OPEN |
| `R-007` | Domain language drift | VI không dau hoac mixed-language surface lam fail SEO trust | cao | trung binh | All teams, Team 1 final | global bilingual standard + per-team locale files | OPEN |
| `R-008` | NOOS boundary | route investor/fundraising legacy bi tai xuat hien | cao | thap | Team 3 + Team 1 | correction log + test + noindex/redirect policy | MONITOR |
| `R-009` | `nft.iai.one` secure lane | sau khi da GO, co nguy co drift runtime/protection neu packet doi ma không pair-review lai | cao | thap | Team 2 + Team 4 + Team 1 | secure lane da GO; giữ monitor-only, rerun `report:nft-phasec` + `report:control-tower` khi packet Team 2/4 co delta | MONITOR |
| `R-010` | `pay.iai.one` | release claim bi mở som khi Phase D packet chưa du rollback + contract evidence | rat cao | trung binh | Team 2 + Team 1 | giữ `prep-only`, `release_claim=false`, va lock gate den khi Team 1 mark review-ready | OPEN |
| `R-011` | Remaining NO-GO domains (`developer`,`cios`,`cdn`,`flows`) | cham nop packet se tri hoan full gate completeness | cao | cao | Domain owners + Team 1 | Team 1 da mở checklist closure theo domain + due `2026-04-20 EOD` | OPEN |

## Current priority order
1. `R-010`
2. `R-011`
3. `R-006`
4. `R-004`
5. `R-001` (monitor-only)

## Close rule
- Risk chi được close khi co evidence file + test/release packet lien quan.
