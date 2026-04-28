# TEAM_TEAM5_DOMAIN_AND_SERVICE_MAP_2026-04-26

- Team: Team 5 Web (`web.iai.one`)
- Date: 2026-04-26

## Domain bảng

| Domain | Legal lane | Payment lane | Auth source | Data source | Shared core in use | Logic riêng ngoài core | Public wording sai? | Preview/simulated bị hiểu nhầm là production? |
|---|---|---|---|---|---|---|---|---|
| web.iai.one | TBD (chưa khóa legal lane riêng — assumed kế thừa shared `*.iai.one`) | pay.iai.one (Pay+Email own; T4+5 chỉ link tới shared billing url) | shared-iai-auth (consume `WEB_SHARED_AUTH_URL`) | in-process event recorder + optional persist; consume flow API contract `/v1/flow/web-onboarding-contract` | `@iai/web` (apps/web), Node std | NO — chỉ orchestrate role/intent/template/package selection + tracking + handoff | TBD — cần audit `apps/web/src/render.ts` cho copy chuẩn EN/VI; `pnpm review:team5-language` -> PASS 20 files | YES — `apps/web` typecheck PASS + KPI events fire, dễ tưởng đã LIVE; thực tế chưa có deploy proof |

## Notes

- web.iai.one **không own** auth/billing/runtime contract — consume shared contract Team 2 (sau Q1 SIGNED 2026-04-26 thì shared runtime contract evolution = Pay+Email own; T4+5 = consumer).
- web.iai.one **không own** pay verdict — pay gate authority = Pay+Email. Team 5 chỉ rerun `report:team5-live-sync-loop` để theo dõi readiness; không phát hành verdict.
- Cross-domain dependency: route handoff `web.iai.one` -> `app.iai.one` / `flow.iai.one` / `dash.iai.one` (3 product surface ngoài T4+5 scope).
  - `app.iai.one` (apps/app/) — TBD per Plan §6 Q-OPEN-3.
  - `flow.iai.one` (apps/flow/) — A+B+C+D scope per Plan §1 Agent 2.
  - `dash.iai.one` (apps/dash/) — Codex scope per Plan §1 Agent 3 (legal lane = billing-support-only operator-facing per Q5 SIGNED).
- Cảnh báo chồng vai: web.iai.one growth surface KHÔNG được duplicate `home.iai.one` hoặc `app.iai.one` (per `WEB_IAI_ONE_NEW_TEAM_EXECUTION_PLAN_2026.md` §2). Hiện trạng `apps/web/src/render.ts` chỉ render landing/onboarding/demo/summary nên chưa xâm phạm boundary, nhưng cần audit copy lần nữa khi go-live.
- life.iai.one extension (per founder 2026-04-26 expansion): TBD per Plan §1 Agent 4 ("life.iai.one có content production, có thể giao Team 4 hoặc tách riêng"). T4+5 đang giữ scope discovery read-only cho life.iai.one, chưa edit. Xem DEC-TEAM5-001 ở file BLOCKERS.
