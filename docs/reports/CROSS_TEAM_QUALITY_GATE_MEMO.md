# CROSS-TEAM QUALITY GATE MEMO

- Date: `2026-05-02`
- Scope: All Teams (Team 1-5, Team A-D, Pay+Email Agent)
- Type: `MANDATORY_POLICY`

---

📢 **THÔNG BÁO TOÀN HỆ THỐNG: BẮT BUỘC ÁP DỤNG "UNIVERSAL QUALITY GATE" (PRE-COMMIT)**

Để chấm dứt tình trạng rớt SEO, hỏng giao diện, hoặc sai chuẩn đa ngôn ngữ ra Production, hệ thống chính thức áp dụng tiêu chuẩn **"Universal Quality Gate"** cho toàn bộ các Web Surface.

Bắt đầu từ hôm nay, yêu cầu **tất cả các repo/lane** phải thiết lập hệ thống tự động kiểm duyệt (Automated QA Pipeline) dưới dạng **Git Pre-commit Hook** (sử dụng `husky` hoặc công cụ tương đương).

**🚀 4 Tiêu chuẩn "God Mode" bắt buộc phải PASS 100% trước khi được phép Commit/Merge:**
1. **Lint/Semantic:** Quét sạch lỗi JS/TS/CSS cơ bản (`eslint`, `prettier`).
2. **HTML Strict:** Không được thiếu `alt` ảnh, ID không trùng lặp, chuẩn `doctype`, thẻ đóng/mở (`htmlhint`).
3. **SEO & Hreflang:** Quét toàn bộ thẻ Meta, cấu trúc Heading (`H1` -> `H3`), `canonical`, `hreflang` và Open Graph (`seo-cli` hoặc `unlighthouse`).
4. **Accessibility (a11y) & Language:** Đạt chuẩn WCAG 2.1 (`pa11y-ci`) và CẤM tuyệt đối việc dùng text cứng (hardcoded text), phải dùng biến đa ngôn ngữ chuẩn.

**⚡ Hành động yêu cầu đối với tất cả Tech Leads:**
- Tích hợp ngay chuỗi lệnh quét tổng thể vào bước `pre-commit` trong `package.json`.
- **Quy tắc:** Bất cứ commit nào có chứa 1 lỗi HTML/SEO/A11y, script sẽ tự động văng lỗi và **BLOCK commit đó**.
- **Không test bằng mắt, không có ngoại lệ.**

Bất cứ dự án/lane nào không có rào chắn tự động này sẽ bị ĐÁNH TRƯỢT ngay tại vòng *Repo-side Review* và không được cấp phép Deploy.
