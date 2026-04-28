# TEAM1_TEAM2_PAY_RERUN_PRECHECK_DIRECTIVE_2026-04-22
- Team phát hành: Team 1 Program Root / Gate Authority
- Team nhận: Team 2 Runtime and Platform Core
- Ngày: 2026-04-22
- Mục tiêu: khóa precheck trước rerun production gate của `pay.iai.one`
- Trạng thái: `ACTIVE_BLOCKED_PRECHECK`
- Full playbook đi kèm: `docs/reports/team1/TEAM1_TEAM2_PAY_FULL_RERUN_PLAYBOOK_2026-04-22.md`

## 1) Kết quả precheck mới nhất

- Artifact:
  - `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-22.md`
- Status: `BLOCKED_PRECHECK`
- Các mục đang thiếu:
  - `TEAM2_PAY_GATE_API_KEY` hoặc `TEAM2_PAY_GATE_SITE_KEY`
  - `TEAM2_PAY_GATE_TENANT_CODE`
  - `TEAM2_PAY_GATE_SITE_CODE`

## 2) Team 2 chỉ được rerun full bundle khi đủ precheck

Biến bắt buộc:
1. `TEAM2_PAY_GATE_API_KEY` (khuyến nghị) hoặc `TEAM2_PAY_GATE_SITE_KEY` (legacy tương thích)
2. `TEAM2_PAY_GATE_TENANT_CODE`
3. `TEAM2_PAY_GATE_SITE_CODE`

Lệnh preflight xác nhận:
- `node scripts/team2-pay-prod-rerun-bundle.mjs --date=2026-04-22 --preflight-only`

Điều kiện vượt preflight:
- `auth_key_present = PASS`
- `tenant_code_explicit = PASS`
- `site_code_explicit = PASS`

## 3) Chuỗi rerun bắt buộc sau khi precheck đạt

1. `node scripts/team2-pay-prod-rerun-bundle.mjs --date=2026-04-22`
2. Kiểm tra lại:
   - `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.md`
   - `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-22.md`
   - `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md`
3. Team 2 nộp daily/report ngắn theo chuẩn 6 mục.
   - Mẫu nộp chuẩn: `docs/reports/team2/TEAM2_PAY_FULL_RERUN_SUBMISSION_TEMPLATE_2026-04-22.md`

## 4) Điều kiện Team 1 xem xét flip gate

Team 1 chỉ xem xét `LOCK_FLIPPED` nếu toàn bộ tín hiệu bắt buộc đều `PASS`, gồm:
- `auth_key_present`
- `checkout_url_non_null`
- `payment_link_id_non_null`
- `no_214`
- `production_gate_green`
- `shared_read_model_ready_for_shared_only`
- `shared_upstream_active_read_mode_shared_contract`
- `shared_upstream_release_gate_ready`

## 5) Rule an toàn điều hành

- Không rerun mù khi chưa đủ precheck.
- Không claim lane xanh khi còn bất kỳ tín hiệu `FAIL`.
- Không mở synchronized live khi Team 1 chưa flip gate.
