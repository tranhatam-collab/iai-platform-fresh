# TEAM_TEAM4_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26

- Team: Team 4 Growth Revenue Operations
- Date: 2026-04-26

## Blocker

### BLK-TEAM4-001
- Description: Pay production gate vẫn `LOCK_RETAINED_WITH_REASON` (verdict 04-26). Team 4 launch wave kick-off chờ pay flip vì rule "Team 4 không claim release lane `nft/pay` trước khi Team 1 reopen gate" (per `IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md` §2.2).
- Owner: Pay+Email (per Plan §1 Agent 1 + Q1 SIGNED 2026-04-26)
- Blocking since: 2026-04-22 (snapshot tham chiếu) / verdict 04-26: `LOCK_RETAINED_WITH_REASON`
- Severity: P0
- Proof of blocker: `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-26.md` = `LOCK_RETAINED_WITH_REASON`; `docs/reports/team4/REPORT_TEAM4_2026-04-26.md` (status `REVIEW_READY_MONITOR_ONLY`)
- Estimated unblock effort: founder push provider TEAM2_PAY_GATE_API_KEY (Q3 SIGNED — action in progress) → Pay+Email rerun → ra verdict mới
- Affects: launch wave kick-off, NOOS Team 4 sub-stream Wave 1, partner ops kick-off

### BLK-TEAM4-002
- Description: life.iai.one daily/report cho Life T1/T2/T3 cadence đứt **4 ngày** (gần nhất 04-22; 04-23/04-24/04-25/04-26 thiếu).
- Owner: T4+5 agent (sau khi DEC-TEAM4-001 đặt life.iai.one trong scope T4+5)
- Blocking since: 2026-04-23
- Severity: P1 (không block IAI Lane 04-26 vì life.iai.one có report folder riêng `life.iai.one/reports/` không nằm trong `team1-lane-status-check.mjs`)
- Proof of blocker: `ls life.iai.one/reports/team1/` -> latest `2026-04-22`; tương tự team2 + team3
- Estimated unblock effort: depend on DEC-TEAM4-001 outcome
- Affects: life.iai.one evidence chain completeness, sub-3-team governance

### BLK-TEAM4-003
- Description: External transport `CONNECTOR_PENDING` — chưa có Slack/Teams delivery thật cho reminder cadence. Team 4 chỉ chạy repo-side script (`team-channel-reminder-check.mjs`); broadcast packet hôm qua (`TRANHATAM_COM_PAY_TEAM_ASK_BROADCAST_PACKET_2026-04-25.md`) cũng chờ founder fill Notion + GitHub URL.
- Owner: founder (cần cung cấp connector credentials hoặc URL targets)
- Blocking since: 2026-04-22 (theo Team 4 daily 04-23 ghi `CONNECTOR_PENDING`)
- Severity: P2
- Proof of blocker: Team 4 daily 04-23 + 04-26 ghi `external transport vẫn CONNECTOR_PENDING`; broadcast packet chờ founder Q3
- Estimated unblock effort: founder duty (cấp Notion parent page + GitHub repo URL)
- Affects: external visibility cho cross-team reminders, broadcast packet fire

## Founder decision required

### DEC-TEAM4-001 (CRITICAL — block edit life.iai.one)
- Question: life.iai.one ownership routing trong T4+5 scope là cách nào?
  - (a) life.iai.one → Team 4 — vì life.iai.one nặng content production + public layer + bilingual rebuild + launch wave (matching Team 4 scope).
  - (b) life.iai.one → Team 5 — vì life.iai.one có member/learning/private app routes cũng là growth product surface.
  - (c) life.iai.one tách thành agent riêng (như Pay+Email pattern) — vì life.iai.one có sub-3-team nội bộ và scope đủ lớn để bỏ vào T4+5.
  - (d) life.iai.one giữ nguyên owner cũ ngoài T4+5 (founder chỉ định).
- Context: Plan §1 Agent 4 ghi "life.iai.one TBD". Founder nhắn 2026-04-26 đặt life.iai.one trong scope T4+5 nhưng chưa nói thuộc T4 hay T5. 68 file modified/untracked trong life.iai.one; reports gần nhất 04-22 (4 ngày sau).
- Recommendation from team: **(a) Team 4** — vì life.iai.one nặng về content + public layer + bilingual rebuild; Team 5 nên giữ scope `web.iai.one` tinh khiết để khóa KPI baseline đơn cấu trúc.
- Default if no decision by 2026-04-30: T4+5 agent giữ life.iai.one ở chế độ READ-ONLY (scan, không edit, không deploy) để tránh chồng vai và chờ founder lock.
- Affects: 68 file life.iai.one + 4 daily/report Life T1/T2/T3 thiếu, life.iai.one production proof completeness, Life Tier 4 private core legal risk audit timeline

### DEC-TEAM4-002
- Question: Khi pay flip, ai authorize Team 4 kick off launch wave 1 (NOOS commerce + Team 4 ops portion)?
  - (a) Codex (Team 1 control tower) phát verdict `LAUNCH_WAVE_1_GO` sau khi Pay+Email flip + tất cả gate xanh.
  - (b) Pay+Email phát verdict combined `LOCK_FLIPPED + LAUNCH_WAVE_1_GO` (vì pay gate authority đã chuyển Pay+Email per Plan §1).
  - (c) Founder ack thẳng (pre-empt 2 agent trên).
- Context: Plan §1 Agent 1 nói Pay+Email own pay gate authority. Plan §1 Agent 3 Codex giữ Team 1 governance NHƯNG KHÔNG bao gồm pay gate authority. Launch wave kick-off đụng cả 2 lane.
- Recommendation from team: (a) Codex phát verdict launch wave (vì Team 1 supervisor multi-agent coordination); Pay+Email chỉ phát pay gate verdict.
- Default if no decision by 2026-04-30: T4+5 đợi Codex phát launch verdict.
- Affects: launch wave SLA, Team 4 evidence packet completeness

### DEC-TEAM4-003
- Question: Team 4 có cần publish daily/report cho window 04-24/04-25 không (backfill quiet days)?
- Context: Founder 2026-04-26 trong session này đã reply "Skip backfill 04-24/04-25 (per recommendation)". DEC này chỉ xác nhận cho audit chain.
- Recommendation from team: SKIP — đã match với founder reply.
- Default if no decision by 2026-04-30: SKIP confirmed.
- Affects: evidence chain completeness window 04-24..04-26

### DEC-TEAM4-004
- Question: External transport (Slack/Teams) cho reminder cadence + broadcast packet — founder cấp credentials ngay hay defer?
  - (a) Cấp ngay (Notion parent page + GitHub repo URL + Slack workspace key) → T4+5 fire broadcast packet (Item 1 đã closed bởi commit `b69292a`; chỉ còn ack Item 2 status).
  - (b) Defer 1 tuần — đợi pay flip xong, broadcast cùng launch wave 1.
  - (c) Khác.
- Context: Q3 từ session 2026-04-25 vẫn pending. Plan §3 cuối nói "Notion/GitHub URL → unblock T4+5 broadcast packet". BLK-TEAM4-003 mô tả cùng thứ.
- Recommendation from team: (a) cấp ngay — broadcast packet đã chờ 1 ngày + Item 1 đã closed nên packet cần update + fire để Pay+Email visibility cho Team B Pay Runtime cho Item 2.
- Default if no decision by 2026-04-30: BLK-TEAM4-003 stay open; broadcast packet stay paused.
- Affects: Pay+Email Item 2 (`PAYMENT_WEBHOOK_SECRET`) Team B visibility, cross-team coordination external surface

### DEC-TEAM4-005
- Question: 6 untracked dirs trong `apps/{app,developer,docs,flow,home,root}/` (per Plan §6 Q-OPEN-3) — T4+5 có **read-only** quyền đọc để audit không (chỉ cite reference)?
- Context: Plan §1 Agent 3 Codex đề xuất apps/nft → Codex; apps/docs → A+B+C+D. apps/{app,home,root,flow,developer} ownership chưa lock. T4+5 không own bất kỳ dir nào trong số này nhưng KPI handoff (web.iai.one → app/flow/dash) reference cấu trúc của apps/app + apps/flow + apps/dash.
- Recommendation from team: (a) YES read-only — để audit reference; KHÔNG edit kể cả khi phát hiện bug (escalate per Rule 2).
- Default if no decision by 2026-04-30: T4+5 không read các dir đó; reference qua public domain only.
- Affects: web.iai.one route handoff audit completeness
