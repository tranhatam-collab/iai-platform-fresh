# TEAM_TEAM2_DOMAIN_AND_SERVICE_MAP_2026-04-26

- Team: Team 2
- Date: 2026-04-26
- Update v2 (2026-04-26 EOD): Q1 + Q5 SIGNED by founder

## Domain bảng

| Domain | Legal lane | Payment lane | Auth source | Data source | Shared core in use | Logic riêng ngoài core | Public wording sai? | Preview/simulated bị hiểu nhầm là production? |
|---|---|---|---|---|---|---|---|---|
| dash.iai.one | **billing-support-only, operator-facing** (Q5 SIGNED 2026-04-26) | none (billing-support-only) | shared-iai-auth (assumed, unverified) | TBD | `@iai/dash-runtime` (TBD) | NO | TBD — cần audit `apps/dash/src/render.ts` | YES — Control Tower UI spec hóa nhưng chưa có UI thật |
| pay.iai.one (shared runtime portion) | TBD (toàn bộ pay.iai.one có legal lane payment, shared runtime sub-portion follow) | pay.iai.one (Pay+Email own) | x-site-key + x-idempotency-key | pay-d1 | TBD | **Q1 SIGNED 2026-04-26: Pay+Email own toàn bộ shared runtime contract evolution; Team 2 chỉ probe** | NO | NO |

## Notes
- dash.iai.one ownership thuộc Team 2 nhưng overlap rendering với Codex `0b1d4b9` (pre-boundary) và Pay+Email `2326795` (post-boundary).
- **Q1 SIGNED 2026-04-26**: Pay+Email own Team Platform Runtime → BLK-TEAM2-002 transfer owner = Pay+Email. Team 2 chỉ probe + verify, không sửa contract.
- **Q5 SIGNED 2026-04-26**: dash.iai.one legal lane = billing-support-only, operator-facing → DEC-TEAM2-001 CLOSED.
- ~~GAP: Team Platform Runtime owner chưa định danh~~ → CLOSED by Q1.
