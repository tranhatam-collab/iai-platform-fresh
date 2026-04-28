# TEAM_TEAM5_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26

- Team: Team 5 Web (`web.iai.one`)
- Date: 2026-04-26

## Blocker

### BLK-TEAM5-001
- Description: Pay production gate vẫn `LOCK_RETAINED_WITH_REASON` (8 tín hiệu FAIL kế thừa snapshot Team 1 `2026-04-22`). Team 5 synchronized live readiness chỉ unblock khi Pay+Email phát `LOCK_FLIPPED`.
- Owner: Pay+Email (per Plan §1 Agent 1 + Q1 SIGNED 2026-04-26)
- Blocking since: 2026-04-22 (snapshot tham chiếu) / verdict 04-26: `LOCK_RETAINED_WITH_REASON`
- Severity: P0
- Proof of blocker: `docs/reports/team5/TEAM5_LIVE_SYNC_READINESS_2026-04-26.md` -> `NOT_READY_FOR_SYNCHRONIZED_LIVE`; `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-26.md` = `LOCK_RETAINED_WITH_REASON`
- Estimated unblock effort: founder push provider TEAM2_PAY_GATE_API_KEY (Q3 SIGNED 2026-04-26 — action in progress) → Pay+Email rerun probe → Pay+Email ra verdict mới → Team 5 rerun loop trong 10–15 phút
- Affects: web.iai.one go-live tier-1, KPI baseline lock lần 1, preview release packet

### BLK-TEAM5-002
- Description: web.iai.one chưa có public deploy proof. Repo + typecheck xanh, nhưng chưa chạy `wrangler pages deploy` cho project `web-iai-one`, không có dig/TLS/Cloudflare vhost evidence.
- Owner: T4+5 agent (gỡ được trong 30–60 phút sau khi founder ack DEC-TEAM5-002)
- Blocking since: 2026-04-26 (audit khám phá)
- Severity: P1
- Proof of blocker: git log không có commit `web(deploy):...`, không có file `docs/release-evidence/web.iai.one/`
- Estimated unblock effort: 60 phút (build + wrangler deploy preview + capture proof)
- Affects: web.iai.one production proof completeness, audit File 1/4 Surface 1 verdict (hiện NO)

### BLK-TEAM5-003
- Description: Schedule reminder kênh ngày `2026-04-26` (`TEAM_CHANNEL_REMINDER_SCHEDULE_2026-04-26.json`) chưa được Team 1 (Codex) phát hành. T4+5 fallback theo `TEAM_CHANNEL_REMINDER_SCHEDULE_2026-04-24.json` cho daily reminder cadence; không block lane PASS hôm nay.
- Owner: Codex (Team 1+2+3 supervisor, per Plan §1 Agent 3)
- Blocking since: 2026-04-25 (04-24 là bản mới nhất hiện có)
- Severity: P2
- Proof of blocker: `ls docs/reports/team1/TEAM_CHANNEL_REMINDER_SCHEDULE_*.json` -> chỉ có 04-23, 04-24
- Estimated unblock effort: 15 phút (Codex roll-forward + verify)
- Affects: cadence reminder evidence completeness; không khẩn cấp vì Lane PASS đã đạt qua các artifact khác

### BLK-TEAM5-004
- Description: web.iai.one pilot traffic = fixture batch (`scripts/fixtures/team5-pilot-traffic-batch*.jsonl`), chưa có real public traffic vì site chưa deploy. Baseline KPI (auth fail 25%, route fail 16.67%) không reflect production behavior.
- Owner: T4+5 agent
- Blocking since: 2026-04-19 (Team 5 plan v1 §3A)
- Severity: P2 (không block live readiness vì rule sample `< 100 landing visitors -> dùng QA/pilot evidence` per `WEB_IAI_ONE_KPI_BASELINE_AND_RELEASE_GATES_2026.md` §6)
- Proof of blocker: pilot batch fixture có 12 baseline events; chưa attach pilot batch v3 cho real traffic
- Estimated unblock effort: dependent on go-live (BLK-TEAM5-001 + BLK-TEAM5-002 phải gỡ trước)
- Affects: KPI baseline lock lần 1 (>= 500 landing visitors)

## Founder decision required

### DEC-TEAM5-001
- Question: life.iai.one ownership routing trong T4+5 scope là cách nào?
  - (a) life.iai.one → Team 4 (content production, public copy, launch wave) — vì life.iai.one có 30 article cluster + pillar pages + bilingual SEO matching scope Team 4 growth/launch.
  - (b) life.iai.one → Team 5 (web growth product) — vì life.iai.one có member/learning/private app routes cũng là growth product surface.
  - (c) life.iai.one tách thành agent riêng (như Pay+Email pattern) — vì life.iai.one có sub-3-team nội bộ (Life T1/T2/T3) và scope đủ lớn để bỏ vào T4+5.
  - (d) life.iai.one giữ nguyên owner cũ ngoài T4+5 (founder chỉ định ai).
- Context: Plan §1 Agent 4 ghi "life.iai.one TBD". Founder nhắn 2026-04-26 đặt life.iai.one trong scope T4+5 nhưng chưa nói thuộc T4 hay T5. Tổng 68 file modified/untracked trong life.iai.one; reports gần nhất 04-22 (4 ngày sau).
- Recommendation from team: (a) Team 4 — vì life.iai.one nặng về content + public layer + bilingual rebuild; Team 5 nên giữ scope `web.iai.one` tinh khiết để khóa KPI baseline đơn cấu trúc.
- Default if no decision by 2026-04-30: T4+5 agent giữ life.iai.one ở chế độ READ-ONLY (scan, không edit, không deploy) để tránh chồng vai và chờ founder lock.
- Affects: 68 file life.iai.one + 4 daily/report Life T1/T2/T3 (04-23..04-26 còn thiếu)

### DEC-TEAM5-002
- Question: web.iai.one có cần `wrangler pages deploy` preview ngay (kể cả khi pay gate chưa flip), để có deploy proof đầu tiên trong audit chain không?
  - (a) YES — deploy preview ngay (project `web-iai-one` Cloudflare Pages); web.iai.one preview noindex, không claim production live.
  - (b) NO — đợi pay flip xong mới deploy lần đầu (production-first); File 1/4 Surface 1 giữ Production-ready: NO cho tới lúc đó.
  - (c) Khác — founder chỉ định domain/preview channel khác.
- Context: Plan v1.0.2 §1 Agent 4 không cấm preview deploy. T4+5 verification scope per Rule 6 không bao gồm `wrangler pages deploy` (chỉ test/typecheck), nhưng deploy là legitimate dev action trong scope `apps/web/`.
- Recommendation from team: (a) preview deploy ngay — để có domain/deploy proof đóng audit File 1/4 sớm.
- Default if no decision by 2026-04-30: (b) NO — giữ DEV state, đợi pay flip.
- Affects: web.iai.one Production-ready verdict, BLK-TEAM5-002 unblock timeline.

### DEC-TEAM5-003
- Question: Team 5 có cần publish PREVIEW_RELEASE_PACKET cho Team 1 (Codex) review **trước khi** pay flip không, làm pre-validation để khi pay flip Team 5 chỉ cần rerun loop là live?
  - (a) YES — publish preview packet với caveat "release floor + contract smoke + QA evidence" (per KPI baseline §5 rule pre-go-live).
  - (b) NO — giữ readiness packet hiện tại (`TEAM5_LIVE_SYNC_FINAL_PACKET_2026-04-26.md`); preview packet chỉ làm sau pay flip.
- Context: `WEB_IAI_ONE_KPI_BASELINE_AND_RELEASE_GATES_2026.md` §5 cho phép release floor khi sample < 100 landing visitors. Team 5 hiện đáp ứng floor (auth fail 25% > release floor 4% conversion ceiling không tương đương — cần re-read floor rule).
- Recommendation from team: (a) YES — preview packet làm pre-validation, không claim live.
- Default if no decision by 2026-04-30: (b) NO — đợi pay flip.
- Affects: Team 1 review queue, web.iai.one go-live SLA sau pay flip.
