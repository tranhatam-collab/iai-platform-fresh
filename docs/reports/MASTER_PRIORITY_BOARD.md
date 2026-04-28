# MASTER PRIORITY BOARD

Version 1.0

Status: Live Working File

Last updated: `2026-04-22`

---

## 0. Rule

- Board này không thay ledger.
- Board này trả lời đúng 3 câu:
  - bây giờ phải làm gì trước
  - ai làm
  - xong thế nào mới được chuyển việc kế tiếp

## 1. P0 - Đường găng số 1

| priority_id | priority | item | entry_id | primary_owner | authority_team | current_state | blocked_by | next_action | exit_condition | truth_source_file |
|---|---|---|---|---|---|---|---|---|---|---|
| `P0-01` | `P0` | Đóng owner follow-up cho `pay` | `lane.pay-production-gate` | Team 1 + Provider Owner | Team 1 | `GATE_LOCKED` | owner provider chưa trả lời đủ | lấy đủ 3 xác nhận live + evidence kèm | owner ack complete | `docs/reports/team1/TEAM1_OWNER_PROVIDER_FOLLOWUP_2026-04-22.md` |
| `P0-02` | `P0` | Tạo probe artifact ngày mới cho `pay` | `lane.pay-production-gate` | Team 2 | Team 1 | `GATE_LOCKED` | `P0-01` | rerun production probe ra `.md` + `.json` ngày mới | `team2_runtime_probe_present = PASS` | `docs/reports/team2/TEAM2_EXECUTION_REPORT_2026-04-22.md` |
| `P0-03` | `P0` | Rerun full pay gate bundle | `lane.pay-production-gate` | Team 2 | Team 1 | `GATE_LOCKED` | `P0-01`, `P0-02` | rerun probe + `pay-prod-gate` + `test:pay` + `test:dash` | 4 tín hiệu classic cùng `PASS` | `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md` |
| `P0-04` | `P0` | Team 1 flip hoặc giữ lock bằng verdict mới | `domain.pay.iai.one` | Team 1 | Team 1 | `GATE_LOCKED` | `P0-03` | phát hành verdict mới `LOCK_FLIPPED` hoặc `LOCK_RETAINED_WITH_REASON` | Team 1 verdict mới cùng ngày | `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md` |
| `P0-05` | `P0` | Team 5 rerun synchronized-live readiness | `lane.team5-live-sync` | Team 5 | Team 1 | `REVIEW_BLOCKED` | `P0-04` | rerun readiness + final packet trên snapshot mới | `SYNC_LIVE_ELIGIBLE` hoặc blocked with reason | `docs/reports/team5/TEAM5_LIVE_SYNC_READINESS_2026-04-22.md` |

## 2. P1 - Gate completeness theo domain

| priority_id | priority | item | entry_id | primary_owner | authority_team | current_state | blocked_by | next_action | exit_condition | truth_source_file |
|---|---|---|---|---|---|---|---|---|---|---|
| `P1-01` | `P1` | Chốt review slot cho `developer.iai.one` | `domain.developer.iai.one` | Team A + Team 1 | Team 1 | `REVIEW_READY` | Team 1 review queue | review packet và chỉ yêu cầu delta nếu thật sự cần | Team 1 review closure | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` |
| `P1-02` | `P1` | Nộp deploy/rule/cache proof cho `cdn.iai.one` | `domain.cdn.iai.one` | Team B Infra | Team 1 | `REVIEW_BLOCKED` | thiếu owner evidence | nộp deploy log + rule snapshot + cache/header proof + rollback note | packet đủ domain-specific evidence | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` |
| `P1-03` | `P1` | Nộp route/runtime proof production cho `flows.iai.one` | `domain.flows.iai.one` | Team B Automation | Team 1 | `PRODUCTION_EVIDENCE_PENDING` | thiếu proof production | refresh packet bằng route/runtime proof thật | Team 1 có thể close reopen review | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` |
| `P1-04` | `P1` | Đóng 3 issue mở của `cios.iai.one` | `domain.cios.iai.one` | Team C | Team 1 | `REVIEW_BLOCKED` | env + screenshot + smoke chưa xong | fix env, capture screenshot, rerun strict smoke | packet đủ điều kiện close review | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` |

## 3. P1 - Mail lane

| priority_id | priority | item | entry_id | primary_owner | authority_team | current_state | blocked_by | next_action | exit_condition | truth_source_file |
|---|---|---|---|---|---|---|---|---|---|---|
| `P1-05` | `P1` | Ổn định `mail-system` runtime sau internal-first | `lane.mail-system` | Team SMTP | Team 1 | `PRODUCTION_EVIDENCE_PENDING` | deliverability/inbound/runtime completeness chưa đủ | hoàn tất outbound/inbound/provider health và evidence thật | mail runtime đủ làm nền cho Wave 1 | `docs/iai-mail-platform/MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md` |
| `P1-06` | `P1` | Migrate Wave 1 mail flows | `lane.mail-wave-1` | Team Web + Team App/API + Codex | Team 1 | `IN_BUILD` | `lane.mail-system`, tracker rows chưa xanh | migrate từng flow bằng action thật + DB evidence | tất cả row Wave 1 = migrated | `docs/iai-mail-platform/MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md` |
| `P1-07` | `P1` | Chuẩn bị Wave 2 Auth, chưa mở sớm | `lane.mail-wave-2-auth` | Team Auth | Team 1 | `PLANNED` | `lane.mail-wave-1` | chỉ chuẩn bị content/logic, chưa claim start | Wave 1 fully green | `docs/iai-mail-platform/MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md` |

## 4. P2 - Monitor-only lanes

| priority_id | priority | item | entry_id | primary_owner | authority_team | current_state | blocked_by | next_action | exit_condition | truth_source_file |
|---|---|---|---|---|---|---|---|---|---|---|
| `P2-01` | `P2` | Giữ NOOS monitor-only accepted | `domain.noos.iai.one` | Team 3 + Team 4 | Team 1 | `APPROVED_MONITOR_ONLY` | none | chỉ patch khi có Team 1 note hoặc Team 2 delta | no drift | `docs/reports/team3/REPORT_TEAM3_2026-04-22.md` |
| `P2-02` | `P2` | Giữ Dash monitor-only | `domain.dash.iai.one` | Team 2 | Team 1 | `APPROVED_MONITOR_ONLY` | none | chỉ rerun khi flow/api contract đổi | no drift | `docs/reports/team1/DASH_TEAM1_ACCEPTANCE_STATE_2026-04-18.md` |
| `P2-03` | `P2` | Giữ Web KPI/readiness loop xanh | `domain.web.iai.one` | Team 5 | Team 1 | `APPROVED_MONITOR_ONLY` | `lane.pay-production-gate` | giữ packet xanh, chờ trigger thật | ready to rerun same day | `docs/reports/team5/REPORT_TEAM5_2026-04-22.md` |
| `P2-04` | `P2` | Giữ NFT post-GO pair-monitor | `domain.nft.iai.one` | Team 2 + Team 4 | Team 1 | `APPROVED_MONITOR_ONLY` | none | chỉ pair-rerun nếu packet delta | no drift | `docs/reports/team1/NFT_PHASE_C_GATE_STATUS_2026-04-22.md` |

## 5. Start order cho team dev

1. Team 1 + Provider Owner làm `P0-01`
2. Team 2 chuẩn bị sẵn `P0-02` và `P0-03`, nhưng chỉ chạy sau owner ack
3. Team 1 giữ slot sẵn cho `P0-04`
4. Team 5 chờ trigger cho `P0-05`
5. Trong lúc chờ, Team B và Team C làm `P1-02`, `P1-03`, `P1-04`
6. Team Web/App + SMTP làm `P1-06`
7. Team 3/4/5 còn lại chỉ giữ `P2`, không mở scope mới

## 6. Câu chốt

Nếu team cần biết “bây giờ build cái gì”:
- nhìn P0 trước
- nếu không thuộc P0 owner chain, làm P1
- nếu cũng không thuộc P1, chỉ giữ monitor-only theo P2
