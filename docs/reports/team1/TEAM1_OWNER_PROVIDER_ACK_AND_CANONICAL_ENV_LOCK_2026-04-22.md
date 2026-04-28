# TEAM1_OWNER_PROVIDER_ACK_AND_CANONICAL_ENV_LOCK_2026-04-22
- Team: Team 1 Program Root / Gate Authority
- Date: 2026-04-22
- Timezone: Asia/Ho_Chi_Minh
- Scope: `pay.iai.one` production gate authority
- Checkpoint: rerun window sau lệnh `NEXT`

## 1) Kết quả chốt owner/provider ack

Trạng thái chốt hiện tại: `PARTIAL_LOCKED_WAITING_OWNER_SECRET_ACK`

- Merchant/channel live của `member.vetuonglai.com`:
  - chưa có owner ack mới ở checkpoint này.
- Secret binding production (`PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`):
  - chưa có bằng chứng owner mới xác nhận đầy đủ cho ca rerun hiện tại.
- `provider_accounts` canonical:
  - chưa có owner kết luận canonical record cuối cùng và thao tác vô hiệu hóa record không canonical.

Kết luận Team 1:
- lớp owner/provider ack **chưa đủ để mở flip review**.

## 2) Kết quả khóa env canonical cho Team 2

Team 1 đã khóa lại phần env canonical xác định được trong repo/evidence:

- `TEAM2_PAY_GATE_TENANT_CODE=vetuonglai` (LOCKED)
- `TEAM2_PAY_GATE_SITE_CODE=vetuonglai-member` (LOCKED)
- `TEAM2_PAY_GATE_PROVIDER=payos` (LOCKED)

Key/header canonical cho probe nội bộ:

- Header chuẩn: `x-api-key`
- Biến dùng cho rerun: `TEAM2_PAY_GATE_API_KEY` (ưu tiên) hoặc `TEAM2_PAY_GATE_SITE_KEY` (legacy)
- Trạng thái: `PENDING_OWNER_SECRET_ACK` (chưa có key thật để mở full rerun hợp lệ)

## 3) Team 2 full bundle run theo checklist

Lệnh đã chạy:

- `TEAM2_PAY_GATE_TENANT_CODE=vetuonglai TEAM2_PAY_GATE_SITE_CODE=vetuonglai-member TEAM2_PAY_GATE_PROVIDER=payos pnpm report:team2-pay-rerun-bundle -- --date=2026-04-22`

Kết quả:

- `Status: BLOCKED_PRECHECK`
- Preflight:
  - `tenant_code_explicit`: `PASS`
  - `site_code_explicit`: `PASS`
  - `auth_key_present`: `FAIL` (thiếu `TEAM2_PAY_GATE_API_KEY` hoặc `TEAM2_PAY_GATE_SITE_KEY`)

Artifact:

- `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-22.md`

## 4) Team 1 review checker theo RERUN_DATE mới

Lệnh đã chạy:

- `pnpm report:team1-pay-rerun-review -- --date=2026-04-22`

Kết quả:

- `Status: REVIEW_BLOCKED_PRECHECK`
- Chưa đạt `READY_FOR_TEAM1_FLIP_REVIEW`

Artifact:

- `docs/reports/team1/TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_2026-04-22.md`

## 5) Verdict lock đơn nhất sau vòng này

- Verdict Team 1: `LOCK_RETAINED_WITH_REASON`

Lý do giữ lock:

1. Owner/provider ack chưa đủ lớp secret binding và canonical provider account.
2. Team 2 full bundle chưa qua precheck do thiếu auth key canonical.
3. Review checker chưa lên `READY_FOR_TEAM1_FLIP_REVIEW`.

## 6) Điều kiện mở vòng kế tiếp

1. Owner provider xác nhận đủ 4 nhóm:
   - merchant/channel live,
   - 3 secret payOS bind production,
   - canonical `provider_accounts`,
   - key/header canonical cho internal checkout probe.
2. Team 2 rerun lại full bundle với key canonical.
3. Team 1 chỉ cân nhắc flip khi checker lên `READY_FOR_TEAM1_FLIP_REVIEW`.
