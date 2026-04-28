# REPORT_TEAM5_2026-04-22

DONE:
- Đã đối chiếu directive liên team mới ngày `2026-04-22`: Team 5 giữ monitor-only, không mở code-level mới trước khi Team 1 flip lock thật.
- Đã hoàn thiện gói tính năng “mẫu web demo + đăng ký tạo web” trên `web.iai.one`:
  - landing có thư viện mẫu web với CTA xem demo thật và chọn mẫu,
  - thêm route `GET /demo` để xem mẫu theo `template + package`,
  - onboarding nhận đầy đủ brief tạo web (mẫu, gói, tên dự án, mô hình kinh doanh, email, số trang, mốc go-live),
  - handoff shared auth giữ nguyên contract và đính kèm metadata web build (`web_template`, `web_package`, ...).
- Đã giữ đúng chuẩn Team 5:
  - không fork locale/auth/billing/runtime truth,
  - không biến preview thành release claim,
  - chỉ theo reviewer path Team 1.
- Đã xử lý drift kỹ thuật trong script gate-flow Team 5:
  - delta/bundle tự rơi về snapshot trước gần nhất khi thiếu ngày liền kề,
  - final packet đồng bộ `compareDate` theo bundle hiện hành.
- Đã vá `team5-web-kpi-smoke` để luôn persist event JSONL sau smoke, giúp KPI report đọc đúng dữ liệu pilot.
- Đã rerun đầy đủ test + report Team 5 ngày `2026-04-22`.

IN PROGRESS:
- Giữ `web.iai.one` monitor-only ổn định trong pilot traffic thật.
- Duy trì readiness loop xanh theo checkpoint để sẵn sàng rerun ngay khi liên team gỡ blocker pay.

BLOCK:
- Trạng thái hiện tại: `NOT_READY_FOR_SYNCHRONIZED_LIVE`.
- Điều kiện chưa đạt:
  - `payProductionGateDone = FAIL` (8 tín hiệu chưa đạt ở snapshot Team 1 ngày `2026-04-22`)
    - `auth_key_present`
    - `checkout_url_non_null`
    - `payment_link_id_non_null`
    - `no_214`
    - `production_gate_green`
    - `shared_read_model_ready_for_shared_only`
    - `shared_upstream_active_read_mode_shared_contract`
    - `shared_upstream_release_gate_ready`
  - `releaseClaimUnlocked = FAIL` (`LOCK_RETAINED`)
- Nút chặn external:
  - chờ owner provider/live phản hồi packet điều tra Team 1,
  - chờ Team 2 rerun sau khi có xác nhận sửa live,
  - chờ Team 1 ra verdict gate cuối.

NEXT:
- Team 5 giữ vòng chuẩn nộp gate: `snapshot -> delta -> bundle -> packet`.
- Khi có trigger hợp lệ từ Team 1/Team 2:
  1. Team 2 rerun probe/gate/test sau fix provider live.
  2. Team 1 ra verdict `LOCK_FLIPPED` hoặc `LOCK_RETAINED_WITH_REASON`.
  3. Team 5 rerun readiness + final packet (`10–15 phút`) và nộp lại cho gate owner.

TEST PROOF:
- `pnpm test:web` -> PASS (3/3)
- `pnpm test:noos-commerce-contracts` -> PASS
- `pnpm smoke:team5-web-kpi:pilot:v2` -> PASS (ingest `22`, baseline coverage `100%`)
- `pnpm report:team5-gate-flow` -> PASS
- `pnpm report:team5-live-sync-readiness` -> PASS
- `pnpm report:team5-live-sync-packet` -> PASS

COMMIT HASH:
- `3fbd058`

Phụ thuộc cần Team 2:
- Không có blocker code-level mới phía Team 5.
- Team 5 phụ thuộc Team 2 ở 1 điểm duy nhất: rerun production pay gate sau khi owner provider/live xác nhận fix xong.

Release readiness theo gate Team 1:
- Team 5 đang `READY_FOR_TEAM1_REVIEW` ở lớp packet/evidence.
- Chưa đủ điều kiện synchronized live cho tới khi đồng thời đạt 3 điều kiện:
  - 4 owner sign-off giữ `PASS`,
  - pay production gate `PASS`,
  - release-claim thoát `LOCK_RETAINED`.
