# TEAM_TEAM5_CURRENT_STATE_REPORT_2026-04-26

- Team: Team 5 Web (`web.iai.one`) — KPI / Live Sync
- Owner agent: T4+5 agent (per plan boundary v1.0.2 §1 Agent 4)
- Owner human: Team 5 Web Lead (TBD — repo-side agent currently maintains)
- Date: 2026-04-26
- Audit order ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26

---

## Surface 1: web.iai.one

- Surface: web.iai.one onboarding + landing growth surface
- Canonical domain: web.iai.one
- Primary role: product (acquisition → onboarding → handoff `app/flow/dash`)
- Current state: DEV
- Production-ready: NO
- Demo/simulated: YES (đã có HTML render bilingual + KPI events + shared-auth handoff dry-run, nhưng chưa có deploy proof public)
- Auth source: shared-iai-auth (consume `WEB_SHARED_AUTH_URL` default `https://app.iai.one/auth/start`)
- Payment source: pay.iai.one (commerce intent route handoff `WEB_SHARED_BILLING_URL` default `https://dash.iai.one/billing`; pay verdict do Pay+Email own)
- Invoice source: invoice.iai.one (per Q2 SIGNED 2026-04-26 — Pay+Email own; T4+5 chỉ link)
- Data source: in-process event recorder (`apps/web/src/event-log.ts`) + optional `WEB_EVENT_SINK_PATH` persist; baseline events forwarded vào shared funnel truth (`docs/WEB_IAI_ONE_KPI_BASELINE_AND_RELEASE_GATES_2026.md` §4)
- Shared core dependency: `@iai/web` (apps/web), `@iai/mail-core`, `@iai/mail-api` (build dep), Node std (`node:http`, `node:crypto`), TypeScript
- Known issues:
  - chưa có public deploy proof (`wrangler pages deploy` chưa chạy cho web.iai.one)
  - chưa có pilot traffic thật để khóa baseline thật (auth fail rate hiện 25%, route fail rate 16.67% từ smoke fixture batch)
  - 6 untracked dirs `apps/{app,developer,docs,flow,home,root}/` không thuộc T4+5 scope (escalate đã ghi trong DAILY)
- Security or legal risk: KHÔNG có public surface live → chưa expose risk; khi go-live phải tuân lock §IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD
- Founder decision needed: DEC-TEAM5-001 (life.iai.one ownership routing trong T4+5 hay tách), DEC-TEAM5-002 (web.iai.one go-live timeline sau pay flip)
- Next 7-day action:
  - khóa pilot traffic batch v3 (pnpm smoke:team5-web-kpi:pilot:v2 -> v3) khi có signal traffic thật
  - chạy `wrangler pages deploy apps/web` (dry-run) để có deploy proof skeleton
  - rerun `pnpm report:team5-live-sync-loop` mỗi ngày tới khi pay flip
- Next 30-day action:
  - go-live web.iai.one tier-1 sau khi pay gate `LOCK_FLIPPED`
  - khóa baseline KPI lần 1 (>= 500 landing visitors + >= 50 auth completes)
  - publish PREVIEW_RELEASE_PACKET cho Team 1 review

### Production proof
- repo proof: HEAD `b69292a` (`pay(webhook): ship outbound payment-completion webhook sender to consumer tenants`); apps/web typecheck PASS (`pnpm typecheck:web` -> exit 0); language review PASS 20 files (`pnpm review:team5-language`)
- domain proof: chưa có (`dig web.iai.one` chưa chạy, không có Cloudflare vhost screenshot)
- deploy proof: chưa có (`wrangler pages deploy` chưa chạy cho project `web-iai-one`)
- owner proof: chưa có (Team 5 Web Lead human owner chưa định danh)
- Production-ready verdict: **NO** (thiếu 3/4 proof)

---

## Surface 2: KPI instrumentation pipeline

- Surface: Team 5 KPI snapshot/delta/bundle/readiness/final-packet daily loop
- Canonical domain: internal (repo-side scripts + reports)
- Primary role: internal/operate (control plane evidence)
- Current state: LIVE (internal — chạy daily PASS)
- Production-ready: YES
- Demo/simulated: NO
- Auth source: none (internal CLI)
- Payment source: none
- Invoice source: none
- Data source: `apps/web/src/event-log.ts` event recorder + scripts/fixtures/team5-pilot-traffic-batch*.jsonl
- Shared core dependency: Node std, scripts trong `scripts/team5-*.mjs`
- Known issues: pilot traffic = fixture batch (chưa có real public traffic vì web.iai.one chưa deploy)
- Security or legal risk: NONE (internal)
- Founder decision needed: NONE
- Next 7-day action: rerun loop ngày 04-27..05-03 mỗi ngày
- Next 30-day action: chuyển sang real traffic source khi web.iai.one go-live

### Production proof
- repo proof: `pnpm report:team5-live-sync-loop` -> PASS 04-26; artifacts `docs/reports/team5/WEB_KPI_*_2026-04-26.{json,md}`, `docs/reports/team5/TEAM5_LIVE_SYNC_*_2026-04-26.{json,md}`
- domain proof: N/A (internal)
- deploy proof: N/A (internal CLI, không deploy)
- owner proof: T4+5 agent (repo-side, đã ack §SCOPE_BOUNDARY_ACK_team5_2026-04-26.md)
- Production-ready verdict: **YES** (internal artifact chain xanh, cadence daily đang chạy)

---

## Surface 3: Experiment registry + SEO execution log

- Surface: `docs/WEB_IAI_ONE_EXPERIMENT_REGISTRY_2026.md`, `docs/WEB_IAI_ONE_BILINGUAL_SEO_EXECUTION_LOG_2026.md`
- Canonical domain: internal doc surface
- Primary role: internal/operate
- Current state: LIVE (internal — locked spec, chưa có pilot experiment thật chạy)
- Production-ready: YES (làm spec contract đã đủ)
- Demo/simulated: experiment row hiện ở mức placeholder, chưa có A/B thật chạy public traffic
- Auth source: none
- Payment source: none
- Invoice source: none
- Data source: doc-only
- Shared core dependency: language codex (`content/iai-language-codex.md` — untracked, scope cross-team)
- Known issues: experiment registry chưa attach experiment thật cho web.iai.one (vì chưa go-live)
- Security or legal risk: NONE
- Founder decision needed: NONE
- Next 7-day action: giữ status; rerun review:team5-language hàng ngày
- Next 30-day action: thêm experiment row đầu tiên khi web.iai.one go-live + có ≥100 landing visitors

### Production proof
- repo proof: `pnpm review:team5-language` -> PASS 20 files (covers experiment registry doc)
- domain proof: N/A
- deploy proof: N/A
- owner proof: T4+5 agent
- Production-ready verdict: **YES** (spec lock đầy đủ cho hiện trạng pre-launch)
