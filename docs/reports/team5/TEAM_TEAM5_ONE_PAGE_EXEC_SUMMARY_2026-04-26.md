# TEAM_TEAM5_ONE_PAGE_EXEC_SUMMARY_2026-04-26

- Team: Team 5 Web (`web.iai.one`) — KPI / Live Sync
- Date: 2026-04-26

## 1. Team scope
`web.iai.one` growth surface (acquisition → onboarding → handoff `app/flow/dash`) + Team 5 KPI/live-sync evidence loop. Consume shared auth/billing/runtime contract của Pay+Email + Codex; KHÔNG own pay verdict.

## 2. Surface đang quản
- web.iai.one (DEV — typecheck PASS, no deploy proof)
- KPI instrumentation pipeline (LIVE internal — daily loop)
- experiment registry + SEO execution log (LIVE internal — spec lock)

## 3. Live thật (production-ready với proof)
- KPI instrumentation pipeline: `pnpm report:team5-live-sync-loop` PASS 04-26; artifacts `WEB_KPI_*_2026-04-26.{json,md}` + `TEAM5_LIVE_SYNC_*_2026-04-26.{json,md}`
- experiment registry + SEO log spec: `pnpm review:team5-language` PASS 20 files
- (0 surface public live thật trong scope Team 5 — web.iai.one chưa có domain/deploy/owner proof)

## 4. Demo / simulated / preview
- web.iai.one: HTML render bilingual + KPI events fire + shared-auth handoff dry-run (DEV state, KHÔNG public)

## 5. Broken / blocked / deprecated
- web.iai.one synchronized live readiness: BLOCKED bởi pay gate (BLK-TEAM5-001, P0, owner Pay+Email)
- web.iai.one production proof completeness: BLOCKED chờ deploy (BLK-TEAM5-002, P1, T4+5 self-unblock 60 phút sau DEC-TEAM5-002 ack)

## 6. Top 3 blocker
1. BLK-TEAM5-001: Pay gate `LOCK_RETAINED_WITH_REASON` 8 signal FAIL → Team 5 `NOT_READY_FOR_SYNCHRONIZED_LIVE` (P0, Pay+Email duty)
2. BLK-TEAM5-002: web.iai.one chưa có deploy proof, audit File 1/4 verdict NO (P1, T4+5 self-unblock)
3. BLK-TEAM5-003: schedule reminder kênh 04-26 chưa publish, fallback 04-24 (P2, Codex duty, không khẩn cấp)

## 7. Top 3 founder decision needed
1. DEC-TEAM5-001: life.iai.one ownership routing — T4 / T5 / agent riêng / khác?
2. DEC-TEAM5-002: web.iai.one có cần preview deploy ngay (kể cả khi pay gate chưa flip) để đóng audit proof không?
3. DEC-TEAM5-003: Team 5 có publish PREVIEW_RELEASE_PACKET cho Team 1 review **trước** pay flip làm pre-validation không?
