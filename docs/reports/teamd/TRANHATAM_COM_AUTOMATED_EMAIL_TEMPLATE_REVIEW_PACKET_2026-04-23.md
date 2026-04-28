# TRANHATAM.COM Automated Email Template Review Packet

Date: 2026-04-23
Scope: `tranhatam.com`
Status: `REPO_TEST_PASS, AWAITING_FOUNDER_EMAIL_REVIEW`

## Quy tắc khóa

- Không claim `payment email live` nếu chưa có flow thanh toán thật hoặc sandbox thật.
- Không dùng `noreply@tranhatam.com` cho email thanh toán hoặc email cần phản hồi.
- Sender phải đi qua mail lane thật và phải có `message_id`, provider proof, D1/canonical row và inbox proof trước khi đóng gate live.

## Sender policy

| Flow | Sender | Reply-To |
| --- | --- | --- |
| Biên nhận / hướng dẫn thanh toán | `pay@tranhatam.com` | `support@tranhatam.com` |
| Billing / failed / refund / invoice / adjustment | `billing@tranhatam.com` | `support@tranhatam.com` |
| Contact / support / join / docs guidance | `support@tranhatam.com` | `support@tranhatam.com` |
| `noreply@tranhatam.com` | Reserved only, không dùng cho email cần phản hồi | N/A |

## Bộ mẫu đã khóa trong runtime registry

| Template ID | Mục đích | Sender |
| --- | --- | --- |
| `payment_receipt` | Biên nhận thanh toán đã xác nhận | `pay@tranhatam.com` |
| `checkout_status_update` | Cập nhật trạng thái checkout đang chờ | `billing@tranhatam.com` |
| `payment_failed_notice` | Thông báo thanh toán chưa hoàn tất | `billing@tranhatam.com` |
| `refund_notice` | Hoàn tiền / điều chỉnh đã xử lý | `billing@tranhatam.com` |
| `checkout_pending` | Checkout đang chờ xác nhận provider | `billing@tranhatam.com` |
| `manual_payment_instruction` | Hướng dẫn thanh toán chính thức | `pay@tranhatam.com` |
| `payment_failed` | Thanh toán thất bại / provider từ chối | `billing@tranhatam.com` |
| `payment_expired` | Link thanh toán hết hạn | `billing@tranhatam.com` |
| `adjustment_notice` | Điều chỉnh thanh toán | `billing@tranhatam.com` |
| `invoice_available` | Hóa đơn / bản ghi thanh toán sẵn sàng | `billing@tranhatam.com` |
| `contact_request_received` | Tự động trả lời form liên hệ | `support@tranhatam.com` |
| `support_request_received` | Tự động xác nhận yêu cầu hỗ trợ | `support@tranhatam.com` |
| `join_request_received` | Tự động xác nhận yêu cầu tham gia / đăng ký | `support@tranhatam.com` |
| `docs_access_guidance` | Gửi tài liệu hướng dẫn và bước tiếp theo | `support@tranhatam.com` |

## Link và biến bắt buộc

- `{{docs_url}}`: mặc định render từ `siteUrl + /docs`, ví dụ `https://tranhatam.com/docs`.
- `{{support_url}}`: mặc định `mailto:support@tranhatam.com` nếu runtime không truyền URL riêng.
- `{{checkout_url}}`, `{{receipt_url}}`, `{{invoice_url}}`, `{{billing_url}}`: do flow thanh toán truyền vào.
- `{{request_id}}`: dùng cho contact, support, join và docs guidance.

## Test đã chạy

- `pnpm test:pay` -> PASS `52/52`
- `pnpm typecheck:pay` -> PASS

## Bước duyệt tiếp theo

Nếu cần inbox proof trước commit cho `tranhatam.com`, gửi một email review thật từ `support@tranhatam.com` tới `tranhatam@gmail.com`, BCC `tranhatam66@gmail.com`, tương tự packet OMDALAT.
