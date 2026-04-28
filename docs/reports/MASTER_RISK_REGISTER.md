# MASTER RISK REGISTER

Version 1.0

Status: Live Working File

Source of Truth: YES

Last updated: `2026-04-22`

---

## 0. Rule

- Risk chỉ được close khi có evidence file thật.
- Risk `OPEN` hoặc `BLOCKING` phải có owner và next action rõ ràng.
- Risk register này đứng trên mọi ghi chú team-local.

## 1. Master risk table

| risk_id | entry_id | risk | severity | likelihood | status | owner | current mitigation | next action | truth_source_file |
|---|---|---|---|---|---|---|---|---|---|
| `MR-001` | `domain.pay.iai.one` | `pay` gate bị mở sớm khi production gate chưa đủ proof | `critical` | `high` | `BLOCKING` | Team 1 + Team 2 | giữ `LOCK_RETAINED_WITH_REASON` | owner provider trả lời đủ và Team 2 rerun bundle mới | `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md` |
| `MR-002` | `lane.pay-production-gate` | lặp probe vô hạn khi chưa có owner ack mới gây noise nhưng không tạo truth mới | `high` | `high` | `OPEN` | Team 1 + Team 2 | Team 2 đã khóa trạng thái wait-owner-ack | chỉ rerun khi có owner ack hoặc Team 1 review note mới | `docs/reports/team2/TEAM2_EXECUTION_REPORT_2026-04-22.md` |
| `MR-003` | `lane.team5-live-sync` | Team 5 bị hiểu nhầm là đã sẵn sàng synchronized live chỉ vì KPI/readiness loop xanh | `critical` | `medium` | `BLOCKING` | Team 5 + Team 1 | Team 5 giữ `NOT_READY_FOR_SYNCHRONIZED_LIVE` | chỉ rerun sau Team 1 flip thật | `docs/reports/team5/TEAM5_LIVE_SYNC_READINESS_2026-04-22.md` |
| `MR-004` | `domain.cdn.iai.one` | packet CDN có thể bị hiểu nhầm là pass dù thiếu deploy/rule/cache/header proof | `high` | `medium` | `OPEN` | Team B Infra + Team 1 | Team 1 đã deny reopen review | nộp evidence domain-specific | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` |
| `MR-005` | `domain.flows.iai.one` | local green bị hiểu nhầm thành production-ready dù packet còn thiếu route/runtime proof production | `high` | `high` | `OPEN` | Team B Automation + Team 1 | Team 1 giữ verdict pending | refresh packet bằng proof production thật | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` |
| `MR-006` | `domain.cios.iai.one` | Team C packet kéo dài review vì 3 issue mở không đóng đồng bộ | `high` | `medium` | `OPEN` | Team C + Team 1 | owner evidence đã attach | đóng Vitest env + screenshot + strict smoke | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` |
| `MR-007` | `lane.mail-wave-1` | mail internal-first đã verify nhưng các flow app/web chưa migrate thật nên dễ bị over-claim | `high` | `high` | `OPEN` | Team SMTP + Team Web/App | tracker wave đang active | migrate Wave 1 rows bằng action thật + DB evidence | `docs/iai-mail-platform/MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md` |
| `MR-008` | `lane.mail-wave-2-auth` | auth wave có thể mở sớm khi Wave 1 chưa xanh toàn bộ | `critical` | `medium` | `OPEN` | Team Auth + Team 1 | hard gate trong tracker | giữ blocked cho đến khi Wave 1 migrated toàn bộ | `docs/iai-mail-platform/MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md` |
| `MR-009` | `lane.language-compliance` | mixed-language hoặc VI không dấu quay lại sau khi lane đã PASS | `medium` | `medium` | `MONITOR` | Team 1 + all teams | language compliance lane đang PASS | rerun same-day khi public copy đổi | `docs/reports/team1/TEAM1_LANGUAGE_COMPLIANCE_STATUS_2026-04-20.md` |
| `MR-010` | `domain.noos.iai.one` | Team 3/4 có thể drift wording khỏi upstream contract nếu patch ngoài note chính thức | `medium` | `medium` | `MONITOR` | Team 3 + Team 4 + Team 1 | lane monitor-only accepted | chỉ patch theo delta thật hoặc Team 1 note | `docs/reports/team3/REPORT_TEAM3_2026-04-22.md` |
| `MR-011` | `global.release` | team dùng packet/reopen status thay cho gate verdict gây sai authority | `critical` | `medium` | `OPEN` | Team 1 | đã có canonical precedence trong ledger | dùng master ledger + critical path làm nguồn điều hành | `docs/reports/CANONICAL_EXECUTION_LEDGER.md` |
| `MR-012` | `lane.mail-global-live` | gọi mail toàn hệ là live khi mới chỉ internal-first verified | `high` | `medium` | `OPEN` | Team SMTP + Team 1 | lane internal-first đã đóng riêng | chỉ claim global live sau đủ wave 1/2/3 | `docs/iai-mail-platform/MAIL_IAI_ONE_INTERNAL_FIRST_VERIFICATION_CLOSEOUT_2026-04-15.md` |
| `MR-013` | `domain.dash.iai.one` | dash contract drift quay lại nếu flow/api shape đổi mà không pair-rerun | `medium` | `low` | `MONITOR` | Team 2 + Team 1 | dash đang monitor-only | rerun relevant tests if flow contract changes | `docs/reports/team1/DASH_TEAM1_ACCEPTANCE_STATE_2026-04-18.md` |
| `MR-014` | `freshness.global` | stale snapshot bị dùng cho final release decision | `high` | `medium` | `OPEN` | Team 1 | ledger có `fresh_until` và `is_stale` | không dùng source stale cho final synchronized-live verdict | `docs/reports/CANONICAL_EXECUTION_LEDGER.md` |

## 2. Current priority order

1. `MR-001`
2. `MR-003`
3. `MR-002`
4. `MR-004`
5. `MR-005`
6. `MR-006`
7. `MR-007`
8. `MR-008`

## 3. Close rule

- `BLOCKING` chỉ được đổi trạng thái khi blocker entry đổi state trong ledger.
- `OPEN` chỉ được close khi next action hoàn tất và truth source file được cập nhật cùng ngày.
- `MONITOR` không được remove khỏi register nếu chưa có owner xác nhận bằng evidence.
