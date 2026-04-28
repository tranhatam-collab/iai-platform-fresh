# TEAM_ADMIN_WEB_DEPLOY_SEQUENCE_2026-04-19
- Team: Team Admin / Team 1 Program Root
- Date: 2026-04-19
- Timezone: Asia/Ho_Chi_Minh
- Scope: `web.iai.one`
- Status: PREPARED_NOT_EXECUTED

## 1) Mục tiêu

Khóa sẵn trình tự triển khai cho `web.iai.one` để khi blocker cuối của `pay.iai.one` được gỡ thì có thể bắt đầu deploy ngay, không phải dừng lại để bàn tiếp.

## 2) Điều kiện bắt buộc trước khi deploy

- `pnpm report:pay-prod-gate -- --date=2026-04-19` phải PASS
- `pnpm report:control-tower -- --date=2026-04-19` phải giữ:
  - `Release control state: READY`
  - `Release-claim state` không còn `LOCK_RETAINED`
- `pnpm report:team5-live-sync-loop` phải PASS
- `pnpm test:web` phải PASS
- `pnpm test:noos-commerce-contracts` phải PASS

## 3) Trình tự deploy đề nghị

1. Owner provider / hạ tầng thanh toán sửa sạch live config của `pay.iai.one` (merchant/channel, secret binding, dữ liệu `provider_accounts`).
2. Team 2 chụp lại proof production mới của `pay.iai.one` và rerun `report:pay-prod-gate`.
3. Team 1 rerun `report:control-tower` và xác nhận `release-claim state` đã mở.
4. Team 5 rerun:
   - `pnpm report:team5-live-sync-loop`
   - `pnpm test:web`
   - `pnpm test:noos-commerce-contracts`
5. Team 1 ký GO cuối cho nhánh deploy đã chọn:
   - web-only live
   - synchronized live
6. Team Admin / Infra owner thực thi deploy thật của `web.iai.one`.

## 4) Khoảng trống vận hành còn thiếu trong repo

Hiện tại repo chưa có:
- script `deploy:web`
- script `deploy:production:web`
- runbook hạ tầng riêng cho `web.iai.one`

Vì vậy trước thời điểm bấm deploy thật, cần chốt một trong hai:
- bổ sung lệnh deploy chính thức vào repo
- hoặc chỉ rõ runbook và owner triển khai nằm ngoài repo

## 5) Smoke sau deploy

Sau khi deploy thật, cần xác nhận lại ngay:
- route `/`
- route `/onboarding`
- shared-auth redirect
- contract-status
- health
- KPI ingest không drift
- EN/VI metadata không regress

## 6) Quyết định hiện tại

- Deploy ngay: CHƯA
- Deploy ngay khi `pay` xanh: CÓ THỂ
- Điều kiện chặn duy nhất ở mức hệ thống: `pay.iai.one` production gate + `release-claim state`
