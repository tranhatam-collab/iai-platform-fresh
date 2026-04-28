# TEAM2_PAY_FULL_RERUN_SUBMISSION_TEMPLATE_2026-04-22
- Nhóm sử dụng: Team 2 Runtime and Platform Core
- Team nhận: Team 1 Program Root / Gate Authority
- Mục tiêu: mẫu nộp cố định sau mỗi vòng full rerun của `pay.iai.one`
- Trạng thái: `ACTIVE_TEMPLATE_LOCKED`

## 1) Cách dùng

Sau khi chạy xong full rerun bundle, Team 2 sao chép nguyên khối 6 mục bên dưới, điền giá trị thực tế của ca rerun, rồi nộp lại cho Team 1.

Không đổi tên 6 tiêu đề.
Không bỏ trống `TEST PROOF`.
Không claim release khi `LOCK_RETAINED` chưa được Team 1 đổi verdict.

## 2) Template nộp chuẩn 6 mục

DONE:
- `RERUN_DATE`: `<YYYY-MM-DD>`
- Bundle command đã chạy: `node scripts/team2-pay-prod-rerun-bundle.mjs --date=<YYYY-MM-DD>`
- Bundle status: `<BLOCKED_PRECHECK | PREFLIGHT_READY | COMMAND_FAILURE | RERUN_COMPLETED_GATE_FAIL | RERUN_GREEN>`
- Gate snapshot: `<PASS/FAIL>` và decision `<LOCK_RETAINED_WITH_REASON | LOCK_FLIPPED>`
- Test summary:
  - `pnpm test:pay` -> `<PASS/FAIL>`
  - `pnpm test:dash` -> `<PASS/FAIL>`

IN PROGRESS:
- Mục đang tiếp tục xử lý ngay sau vòng rerun:
  - `<ví dụ: chờ owner provider ack canonical key/header>`
  - `<ví dụ: chờ Team 1 review verdict mới>`

BLOCK:
- Blocker hiện tại:
  - `<ví dụ: auth_key_present=FAIL do thiếu TEAM2_PAY_GATE_API_KEY>`
  - `<ví dụ: health_contract_shape=legacy_or_unknown>`
- 8 tín hiệu gate hiện tại:
  - `auth_key_present`: `<PASS/FAIL>`
  - `checkout_url_non_null`: `<PASS/FAIL>`
  - `payment_link_id_non_null`: `<PASS/FAIL>`
  - `no_214`: `<PASS/FAIL>`
  - `production_gate_green`: `<PASS/FAIL>`
  - `shared_read_model_ready_for_shared_only`: `<PASS/FAIL>`
  - `shared_upstream_active_read_mode_shared_contract`: `<PASS/FAIL>`
  - `shared_upstream_release_gate_ready`: `<PASS/FAIL>`

NEXT:
1. `<hành động kế tiếp 1, có owner rõ>`
2. `<hành động kế tiếp 2, có điều kiện mở>`
3. `<hành động kế tiếp 3, có artifact đích>`

TEST PROOF:
- Bundle:
  - `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_<YYYY-MM-DD>.md`
  - `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_<YYYY-MM-DD>.json`
- Runtime probe:
  - `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_<YYYY-MM-DD>.md`
  - `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_<YYYY-MM-DD>.json`
- Shared runtime probe:
  - `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_<YYYY-MM-DD>.md`
  - `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_<YYYY-MM-DD>.json`
- Team 1 gate snapshot:
  - `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_<YYYY-MM-DD>.md`
  - `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_<YYYY-MM-DD>.json`
- Test commands:
  - `pnpm test:pay` -> `<PASS/FAIL>`
  - `pnpm test:dash` -> `<PASS/FAIL>`

COMMIT HASH:
- `<git hash>` nếu có commit cho batch rerun
- `N/A` nếu vòng này chỉ tạo artifact/report từ script, không có thay đổi code/docs cần commit

## 3) Điều kiện Team 2 được phép ghi “đề nghị Team 1 flip gate”

Chỉ được ghi đề nghị flip khi cả 8 tín hiệu trong `BLOCK` đều là `PASS` và bundle status là `RERUN_GREEN`.

Nếu còn bất kỳ tín hiệu `FAIL`, Team 2 chỉ được nộp theo trạng thái `prep-only` và nêu rõ blocker.
