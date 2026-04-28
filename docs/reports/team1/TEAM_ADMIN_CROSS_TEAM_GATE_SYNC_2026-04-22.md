# TEAM_ADMIN_CROSS_TEAM_GATE_SYNC_2026-04-22

- Date: `2026-04-22`
- Purpose: khóa lại trạng thái điều phối liên team theo control-tower truth mới nhất
- Source of directive: Team Admin cross-team gate update (today)

## 1) Hard release blocker (canonical)

- Blocker thật vẫn là `pay.iai.one` production gate.
- Checkpoint thực thi mới nhất:
  - Team 1 đã khóa `tenant/site/provider` canonical (`vetuonglai` / `vetuonglai-member` / `payos`)
  - Team 2 full bundle vẫn `BLOCKED_PRECHECK` vì thiếu key canonical (`TEAM2_PAY_GATE_API_KEY` hoặc `TEAM2_PAY_GATE_SITE_KEY`)
- Chuỗi đóng việc bắt buộc:
  1. Team 1 chốt owner/provider ack + env canonical.
  2. Team 2 rerun đúng bundle sau khi Team 1 chốt canonical env.
  3. Team 1 ra đúng một verdict: `LOCK_FLIPPED` hoặc `LOCK_RETAINED_WITH_REASON`.
  4. Team 5 chỉ rerun readiness/final live-sync sau khi lock thật sự được flip.

## 2) Team-by-team execution lock

- Team 1 (`pay gate authority`):
  - chốt owner/provider ack cho pay
  - khóa key/header canonical, merchant/channel live, secret binding, provider_accounts truth
  - sau rerun Team 2 phải ra đúng một verdict lock
- Team 2 (`pay runtime bundle`):
  - không rerun mù
  - chỉ rerun theo `PAY_IAI_ONE_IMMEDIATE_PRODUCTION_ACTIVATION_CHECKLIST_2026-04-22.md` sau khi Team 1 chốt canonical env
  - nộp lại production probe + shared-runtime probe + gate report mới
- Team 4 (`growth/ops monitor lane`):
  - chờ Team 1 chốt canonical env/provider và verdict lock mới sau rerun hợp lệ của Team 2
  - khi có delta authority mới thì rerun full proof Team 4 và nộp lại packet/daily/report ngay
  - không mở claim synchronized live
  - không claim `live sạch toàn hệ` khi audit bilingual còn `Du chuan live: NO` ở `pay/dash/noos-web`
- Team 5 (`live-sync`):
  - chưa có code task mới
  - không claim synchronized live trước khi Team 1 flip lock
- Team Email SMTP:
  - hostname public blocker đã đóng
  - còn 5 cụm bắt buộc theo `MAIL_IAI_ONE_UNIFIED_TEAM_EMAIL_SMTP_24H_MISSION_2026-04-22.md`
  - giữ `BCC=OFF`, `/v1/send` chưa mở public
- Team C (`language/bilingual`):
  - audit hệ thống vẫn `Du chuan live: NO`
  - cần đóng nốt hard-coded bilingual copy + metadata drift ở pay/dash/noos-web
- Team A (`developer.iai.one`):
  - đang ở `REOPEN_REVIEW_APPROVED`
  - hôm nay chỉ chờ slot review cuối Team 1, không mở scope mới
- Team B CDN (`cdn.iai.one`):
  - nộp deploy/rule/cache/header/rollback evidence domain-specific
- Team B Flows (`flows.iai.one`):
  - nộp production route/runtime proof
  - blocker chính là production evidence, không mở thêm feature
- Team C (`cios.iai.one`):
  - canonical đang review pending cho tới khi có packet attach mới được Team 1 đọc
- Team D (`payment routing + mail routing lane`):
  - cần khóa sender/mailbox package + live routing `tranhatam.com`
  - nối site thật sang `/api/payment-routing`
  - lấy transaction thật/sandbox thật có `provider_ref`, `SMTP messageId`, `D1/log evidence`, inbox proof
  - chưa site nào được nâng `READY_FOR_LIVE` khi pay gate còn khóa

## 3) Team C packet attach (truth update)

Team C đã có batch packet mới, nhưng checker Team 1 hiện vẫn trả `FAIL`:

- `docs/reports/team1/TEAMC_CIOS_REVIEW_CLOSURE_STATUS_2026-04-22.md` (`Review closure ready: FAIL`)
- `docs/release-evidence/cios.iai.one/artifacts/CIOS_IAI_ONE_STRICT_SMOKE_2026-04-22.md` (artifact có sinh ra nhưng command exit `1`)
- `docs/release-evidence/cios.iai.one/CIOS_IAI_ONE_DELTA_EVIDENCE_2026-04-22.md`
- `docs/release-evidence/cios.iai.one/CIOS_IAI_ONE_REVIEW_CLOSURE_DELTA_2026-04-22.md`

Unmet checks hiện hành:

- `upstreamVitestPass`: FAIL (`TIMEOUT`)
- `strictSmokePass`: FAIL (`FAIL_EXIT_1`)

=> Canonical state của Team C vẫn là review pending cho đến khi 2 check trên xanh lại.

## 4) Immediate next queue

1. Team 1: chốt pay owner/provider ack + env canonical.
2. Team 2: rerun đúng bundle pay sau canonical env.
3. Team 1: ra verdict lock đơn nhất.
4. Team 5: chỉ rerun live-sync sau lock flip.
5. Team C: rerun upstream Vitest + strict smoke cho `cios.iai.one` tới khi checker Team 1 báo `Review closure ready: PASS`.
6. Team 1: chỉ close review Team C sau khi checker closure PASS thật.
