# TEAM1_PAY_MULTI_PROVIDER_RESILIENCE_OPTIONS_2026-04-20
- Team: Team 1 Program Root / Gate Authority
- Trạng thái: `PROPOSAL_WAITING_APPROVAL`
- Mục tiêu: giảm phụ thuộc một cổng thanh toán duy nhất cho `pay.iai.one`

---

## 1. Bối cảnh

Sự cố production hiện tại (`payOS code=214`) cho thấy rủi ro tập trung provider là có thật.  
Mục tiêu của tài liệu này là đưa ra các phương án linh hoạt để bạn duyệt trước khi Team 1 mở implementation lane.

---

## 2. Ba phương án kiến trúc

### Phương án A (khuyến nghị): Active-Passive hai provider
- Kiến trúc:
  - Provider chính: payOS
  - Provider dự phòng: một cổng thứ hai (ví dụ Stripe Checkout hoặc cổng nội địa dự phòng theo quyết định business)
- Cách hoạt động:
  - mặc định đi provider chính;
  - khi health-check fail hoặc nhận mã lỗi thuộc danh sách chặn (như `214`), chuyển sang provider dự phòng.
- Ưu điểm:
  - triển khai nhanh hơn active-active;
  - giảm downtime do lỗi một phía provider.
- Nhược điểm:
  - cần chuẩn hóa mapping trạng thái giữa hai provider.
- ETA sơ bộ: `3–5 ngày làm việc` sau khi duyệt.

### Phương án B: Active-Active smart routing
- Kiến trúc:
  - nhiều provider chạy song song;
  - router chọn provider theo `currency`, `geo`, tỉ lệ lỗi, chi phí giao dịch.
- Ưu điểm:
  - độ bền cao nhất;
  - tối ưu hiệu năng và chi phí theo tuyến thanh toán.
- Nhược điểm:
  - độ phức tạp vận hành và reconciliation cao hơn.
- ETA sơ bộ: `2–3 tuần`.

### Phương án C: Break-glass fallback (manual-assisted rail)
- Kiến trúc:
  - giữ provider chính hiện tại;
  - mở luồng fallback vận hành tạm thời (QR/chuyển khoản có đối soát bắt buộc) khi gateway lỗi.
- Ưu điểm:
  - triển khai nhanh nhất;
  - giữ khả năng thu tiền khi gateway có sự cố.
- Nhược điểm:
  - cần vận hành thủ công nhiều hơn;
  - trải nghiệm người dùng không tốt bằng checkout link tự động.
- ETA sơ bộ: `1–2 ngày`.

---

## 3. Đề xuất của Team 1

Đề xuất triển khai theo thứ tự:
1. Chọn **Phương án C** làm lớp an toàn ngắn hạn.
2. Song song build **Phương án A** làm baseline chính thức.
3. Chỉ nâng lên **Phương án B** khi volume và yêu cầu tối ưu chi phí vượt ngưỡng.

---

## 4. Điều kiện mở implementation lane

Team 1 chỉ mở implementation lane khi bạn duyệt:
- provider dự phòng ưu tiên;
- ngưỡng failover (lỗi nào kích hoạt chuyển tuyến);
- nguyên tắc release theo domain (`prep-only`, canary, full rollout).

Trong khi chờ duyệt:
- không thay đổi release-claim hiện tại;
- vẫn giữ `LOCK_RETAINED` cho `pay.iai.one`.
