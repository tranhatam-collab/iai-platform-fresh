# MASTER DECISION LOG

Version 1.0

Status: Live Working File

Last updated: `2026-04-22`

---

## 0. Rule

- Chỉ log các quyết định đổi authority, release state, execution order, hoặc domain direction.
- Decision log này là lớp tóm tắt canonical từ các quyết định Team 1 đã ban hành.
- Nếu cần chi tiết đầy đủ theo ngày, mở `docs/reports/team1/TEAM1_DECISION_LOG_2026.md`.

## 1. Master decision table

| decision_id | date | decision | status | impacted entries | why | truth_source_file |
|---|---|---|---|---|---|---|
| `MD-001` | `2026-04-14` | Khóa mô hình delivery `5 team` cho toàn hệ | `LOCKED` | `global.execution` | cân bằng tốc độ và đồng bộ | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` |
| `MD-002` | `2026-04-14` | Khóa locale policy `EN-first / VI first-class` | `LOCKED` | `lane.language-compliance` | giữ SEO/canonical/hreflang và quality ngôn ngữ | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` |
| `MD-003` | `2026-04-15` | Khóa `flow.iai.one` là living orchestration system | `LOCKED` | `domain.flow.iai.one`, `domain.flows.iai.one` | ngăn flow drift thành tool rời rạc | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` |
| `MD-004` | `2026-04-15` | Khóa `dash.iai.one` là living control system | `LOCKED` | `domain.dash.iai.one` | ngăn dash drift thành chart-only dashboard | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` |
| `MD-005` | `2026-04-15` | Khóa `developer.iai.one` là builder/integration portal, không phải docs mirror | `LOCKED` | `domain.developer.iai.one` | builder cần entry riêng cho contracts/auth/webhooks | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` |
| `MD-006` | `2026-04-17` | Khóa thứ tự execution: `nft` trước, `pay` sau | `LOCKED` | `domain.nft.iai.one`, `domain.pay.iai.one` | không cho lane thanh toán mở trước secure trust lane | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` |
| `MD-007` | `2026-04-17` | Công nhận 6 shell `iai/home/app/flow/docs/web` ở mức `conditional-go` | `LOCKED` | `domain.iai.one`, `domain.home.iai.one`, `domain.app.iai.one`, `domain.flow.iai.one`, `domain.docs.iai.one`, `domain.web.iai.one` | ordered audit + shell tests đạt | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` |
| `MD-008` | `2026-04-17` | Chuyển secure `nft.iai.one` Phase C sang `GO` | `LOCKED` | `domain.nft.iai.one` | pair-review Team 2 + Team 4 pass | `docs/reports/team1/NFT_PHASE_C_GATE_STATUS_2026-04-22.md` |
| `MD-009` | `2026-04-18` | Chấp thuận `web.iai.one` preview reopen dưới Team 1 reviewer authority | `LOCKED` | `domain.web.iai.one` | shared contract đủ cho preview reopen, nhưng chưa đồng nghĩa synchronized live | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` |
| `MD-010` | `2026-04-18` | Chấp thuận `dash.iai.one` ở trạng thái `ACCEPTED_GO` | `LOCKED` | `domain.dash.iai.one` | checklist release gate của dash đạt | `docs/reports/team1/DASH_TEAM1_ACCEPTANCE_STATE_2026-04-18.md` |
| `MD-011` | `2026-04-18` | Mở `pay.iai.one` Phase D prep-only, giữ khóa release claim | `LOCKED` | `domain.pay.iai.one`, `lane.pay-production-gate` | cho phép foundation work nhưng không cho claim production | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` |
| `MD-012` | `2026-04-19` | Khóa điều kiện pass production cho `pay`: cần attempt mới, có `checkout_url`, có `payment_link_id`, không còn `214` | `LOCKED` | `lane.pay-production-gate` | chặn optimistic wording, buộc gate theo production evidence | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` |
| `MD-013` | `2026-04-19` | Hoàn tất owner sign-off 4 domain NO-GO nhưng không đồng nghĩa `GO` | `LOCKED` | `lane.no-go-owner-signoff`, `domain.developer.iai.one`, `domain.cios.iai.one`, `domain.cdn.iai.one`, `domain.flows.iai.one` | tách owner accountability khỏi release approval | `docs/reports/team1/TEAM1_NO_GO_PACKET_STATUS_2026-04-21.md` |
| `MD-014` | `2026-04-22` | Team 1 giữ `pay` ở `LOCK_RETAINED_WITH_REASON` | `ACTIVE` | `domain.pay.iai.one`, `lane.pay-production-gate`, `lane.team5-live-sync` | production gate chưa pass và automation gate còn fail thêm | `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md` |
| `MD-015` | `2026-04-22` | Team 1 ra verdict reopen theo domain: `developer approved`, `cdn denied`, `flows pending`, `cios review pending` | `ACTIVE` | `domain.developer.iai.one`, `domain.cdn.iai.one`, `domain.flows.iai.one`, `domain.cios.iai.one` | tách rõ review closure từng domain | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` |
| `MD-016` | `2026-04-15` | Close `mail internal-first verification` nhưng không coi là `mail global live` | `LOCKED` | `domain.mail.iai.one`, `lane.mail-internal-first`, `lane.mail-global-live` | internal-first verification chỉ đóng lane nội bộ | `docs/iai-mail-platform/MAIL_IAI_ONE_INTERNAL_FIRST_VERIFICATION_CLOSEOUT_2026-04-15.md` |
| `MD-017` | `2026-04-19` | Mail wave progression bị khóa theo thứ tự `Wave 1 -> Wave 2 Auth -> Wave 3 Pay/Flow -> Global Live` | `LOCKED` | `lane.mail-wave-1`, `lane.mail-wave-2-auth`, `lane.mail-wave-3-pay-flow`, `lane.mail-global-live` | tránh mở auth/pay mail sớm khi tracker wave trước chưa xanh | `docs/iai-mail-platform/MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md` |

## 2. Active decision summary

- `pay` vẫn là gate authority chain số 1.
- `web` có thể monitor-only nhưng chưa được synchronized live.
- `developer` được review reopen, chưa được claim `GO`.
- `cdn`, `flows`, `cios` phải đóng evidence gap theo domain.
- `mail` có lane riêng, không được gộp chung vào synchronized live readiness.
