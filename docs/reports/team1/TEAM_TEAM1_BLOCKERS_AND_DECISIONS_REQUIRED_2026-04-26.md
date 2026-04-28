# TEAM_TEAM1_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26

- Team: Team 1
- Date: 2026-04-26

---

## Blocker

### BLK-TEAM1-001
- Description: 4 team KHÔNG_OWNER (Team A, Team B-CDN, Team B-Flows, Team C) không thể nộp audit
- Owner: Founder (Q-OPEN-4 reply)
- Blocking since: 2026-04-26 (lệnh audit ban hành)
- Severity: P0
- Proof of blocker: `docs/reports/admin-audit-2026-04-26/IAI_ONE_AUDIT_DEADLINE_TRACKING_BOARD_2026-04-26.md` §1
- Estimated unblock effort: founder reply 1 dòng (Q-OPEN-4: a/b/c/defer) + Codex re-assign owner
- Affects: Team A, Team B (CDN+Flows), Team C audit deliverable

### BLK-TEAM1-002
- Description: invoice.iai.one không có agent owner trong boundary plan v1.0.1
- Owner: Founder (cần confirm domain này có tồn tại trong roadmap chưa)
- Blocking since: 2026-04-26 (audit lệnh phát hiện)
- Severity: P0
- Proof of blocker: `IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26.md` không nhắc invoice.iai.one
- Estimated unblock effort: founder confirm domain status + assign owner
- Affects: invoice.iai.one audit + control plane completeness

### BLK-TEAM1-003
- Description: Plan v1.0.1 vẫn DRAFT (4 open questions chưa reply)
- Owner: Founder (Q-OPEN-1, 2, 3, 5 reply)
- Blocking since: 2026-04-26 (publish plan)
- Severity: P1
- Proof of blocker: `docs/IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26.md` §6
- Estimated unblock effort: founder reply 4 dòng theo format §6 file `TEAM1_FOUNDER_5_OPEN_QUESTIONS_REMINDER_2026-04-26.md`
- Affects: toàn bộ agent boundary stability

### BLK-TEAM1-004
- Description: Cross-agent communication phải qua founder relay (không có direct channel giữa các Claude session)
- Owner: Founder (relay duty) hoặc Codex (workaround qua commit message)
- Blocking since: ongoing
- Severity: P2
- Proof of blocker: Pay+Email session nhận lệnh audit chỉ khi founder copy-paste
- Estimated unblock effort: 0 (workaround sẵn — commit message + founder ack)
- Affects: tốc độ audit relay (delay 1-2 phiên)

---

## Founder decision required

### DEC-TEAM1-001
- Question: Reply Q-OPEN-1 (Team A definition)
- Context: A+B+C agent ownership cluster cần định danh Team A trước khi spawn agent
- Recommendation from team: (a) Team A = developer.iai.one
- Default if no decision by 2026-04-28: Codex tạm assume (a) trong audit master file, đánh dấu UNCONFIRMED
- Affects: audit cho developer.iai.one

### DEC-TEAM1-002
- Question: Reply Q-OPEN-2 (Team D split)
- Context: Team D portion với Pay+Email vs A+B+C+D
- Recommendation: (a) Team D 100% trong Pay+Email
- Default: Codex tạm assume (a)
- Affects: audit cho Team D activation lane

### DEC-TEAM1-003
- Question: Reply Q-OPEN-3 (apps ownership: app/home/root/docs/nft)
- Context: 5 app chưa có agent claim
- Recommendation: theo bảng Codex (app/home/root → T4+5; docs → A+B+C; nft → Codex)
- Default: Codex tạm assume per recommendation
- Affects: audit cho 5 app surface

### DEC-TEAM1-004
- Question: Reply Q-OPEN-4 (A+B+C+D agent assignment)
- Context: 4 team KHÔNG_OWNER block audit
- Recommendation: DEFERRED → push 4 owner email trước (template `ea70c54`), reassess 04-30
- Default: Codex tạm wear-2-hats cho A+B+C+D (chất lượng audit giảm do thiếu deploy access)
- Affects: 4 team audit deliverable

### DEC-TEAM1-005
- Question: Reply Q-OPEN-5 (230+ dirty file strategy)
- Context: 466+ untracked file pre-existing trước khi 4 agent vào việc thật
- Recommendation: (b) Codex tách dirty theo lane trước, sau đó 4 agent commit
- Default: Codex bắt đầu pre-work tự classify
- Affects: git tree cleanliness, future commit operations

### DEC-TEAM1-006
- Question: invoice.iai.one — domain này có tồn tại trong roadmap chưa? Nếu có, owner agent là ai?
- Context: founder đưa vào lệnh audit nhưng không agent claim, không spec file tìm thấy
- Recommendation: nếu chưa có → defer khỏi audit batch này; nếu có → assign Pay+Email (vì invoice cluster với pay)
- Default: Codex ghi vào audit master "domain chưa có owner" + escalate
- Affects: control plane completeness

### DEC-TEAM1-007
- Question: Founder có chấp nhận Codex tự fill DRAFT 4-file cho 4 team KHÔNG_OWNER với data có thể quan sát từ repo (không chính thức authority của các team đó), đánh dấu rõ "INFERRED BY ADMIN, AWAITING TEAM CONFIRM"?
- Context: nếu KHÔNG → 4 team KHÔNG_OWNER giữ trống → audit master file thiếu nghiêm trọng
- Recommendation: YES với caveat đánh dấu rõ
- Default: Codex tự fill DRAFT (sau khi founder confirm)
- Affects: audit completeness vs accuracy trade-off
