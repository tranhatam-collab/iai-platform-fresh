# TEAM_TEAM3_DOMAIN_AND_SERVICE_MAP_2026-04-26

- Team: Team 3
- Date: 2026-04-26
- Update v2 (2026-04-26 EOD): Q5 SIGNED by founder

## Domain bảng

| Domain | Legal lane | Payment lane | Auth source | Data source | Shared core in use | Logic riêng ngoài core | Public wording sai? | Preview/simulated bị hiểu nhầm là production? |
|---|---|---|---|---|---|---|---|---|
| noos.iai.one | **commerce surface, payment qua pay.iai.one** (Q5 SIGNED 2026-04-26) | pay.iai.one (cross-team via Pay+Email) | shared-iai-auth (assumed, unverified) | NOOS metadata fixtures (`apps/noos-web/fixtures/`) | `@iai/noos-commerce-contracts`, `@iai/noos-shared-runtime` | NO — Team 3 chỉ enforce contract | TBD — cần audit `apps/noos-web/src/render.ts` | TBD — cần verify deploy proof |

## Notes
- Team 3 monitor-only accepted (per `MASTER_PRIORITY_BOARD.md` P2-01).
- Cross-team dependency: chờ Pay+Email expose shared runtime 3 field (Q1 SIGNED — Pay+Email own evolution) cho `/checkout-success`, `/library`.
- Cross-team dependency: chờ Pay+Email open pay.iai.one cho NOOS payment flow (Q3 — canonical key in progress).
- **Q5 SIGNED 2026-04-26**: noos.iai.one legal lane = commerce surface, payment qua pay.iai.one → DEC-TEAM3-001 CLOSED.
- ~~GAP: Legal lane cho noos.iai.one chưa định nghĩa rõ~~ → CLOSED by Q5.
