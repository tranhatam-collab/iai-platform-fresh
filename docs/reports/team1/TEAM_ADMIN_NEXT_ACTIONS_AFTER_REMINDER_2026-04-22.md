# TEAM_ADMIN_NEXT_ACTIONS_AFTER_REMINDER_2026-04-22
- Team: Team 1 Program Root / Gate Authority
- Date: 2026-04-22
- Control loop: `READY / PASS`
- Release-claim: `LOCK_RETAINED`

## 1) Điểm chốt hiện tại

- Blocker release thật vẫn là `pay.iai.one` production gate.
- Machine-check hiện fail ở lớp production checkout và shared signal set.
- Probe mới nhất (`TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22`) đã có source, nhưng trả `401 API_KEY_REQUIRED` do thiếu `x-api-key` trong contract gọi probe.
- Preflight bundle Team 2 (`TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-22`) đang `BLOCKED_PRECHECK` vì thiếu key và tenant/site code explicit.
- Team 1 đã phát hành follow-up owner provider và giữ verdict `LOCK_RETAINED_WITH_REASON`.
- Team A đã được Team 1 ra verdict `REOPEN_REVIEW_APPROVED`.
- Team B `flows`: test surface đã PASS trong workspace, nhưng vẫn thiếu route/runtime proof production domain-specific.
- Team B `cdn` và Team C `cios` vẫn còn các mục evidence mở theo packet.

## 2) Việc phải làm ngay theo thứ tự authority

1. Owner provider phản hồi đủ 3 xác nhận + evidence live, đồng thời chốt key contract dùng cho probe (`x-api-key`/legacy key).
2. Team 2 vượt precheck theo directive Team 1, rồi rerun probe/gate/test và nộp evidence mới có key hợp lệ.
3. Team 1 chạy review checker theo `RERUN_DATE`:
   - `pnpm report:team1-pay-rerun-review -- --date=<RERUN_DATE>`
   - chỉ cân nhắc flip nếu status = `READY_FOR_TEAM1_FLIP_REVIEW`
4. Team 1 ra verdict lock:
   - `LOCK_FLIPPED`
   - hoặc `LOCK_RETAINED_WITH_REASON`.
5. Team 5 chỉ rerun readiness/live-sync sau khi Team 1 flip gate thật.

## 3) Trạng thái Team 1 ra trong vòng này

- Follow-up owner provider:
  - `docs/reports/team1/TEAM1_OWNER_PROVIDER_FOLLOWUP_2026-04-22.md`
- Packet điều tra owner provider:
  - `docs/reports/team1/TEAM1_PROVIDER_LIVE_OWNER_INVESTIGATION_PACKET_2026-04-22.md`
- Directive precheck cho Team 2:
  - `docs/reports/team1/TEAM1_TEAM2_PAY_RERUN_PRECHECK_DIRECTIVE_2026-04-22.md`
- Review checker full rerun theo `RERUN_DATE`:
  - `docs/reports/team1/TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_2026-04-22.md`
- Pay gate verdict:
  - `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md`
- Domain reopen verdicts:
  - `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md`
- Control-tower session:
  - `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-22.md`
