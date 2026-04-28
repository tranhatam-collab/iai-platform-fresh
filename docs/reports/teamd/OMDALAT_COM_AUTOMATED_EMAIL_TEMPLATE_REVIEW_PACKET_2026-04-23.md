# OMDALAT.COM Automated Email Template Review Packet

Date: 2026-04-23
Scope: `omdalat.com`
Status: `REPO_TEST_PASS, RELAY_ACCEPTED, FOUNDER_DIRECTED_REPO_COMMIT_READY, EXTERNAL_INBOX_PROOF_PENDING`

## Quy tắc khóa

- Có thể commit repo-side sau khi founder đã yêu cầu kiểm tra toàn bộ, sửa phần lệch và commit.
- Email duyệt phải gửi từ mailbox hệ thống `@omdalat.com`, không dùng mailbox cá nhân.
- Người nhận chính: `tranhatam@gmail.com`.
- BCC kiểm tra: `tranhatam66@gmail.com`.
- Không bật claim `PAYMENT_LIVE` cho tới khi có mã tham chiếu cổng thanh toán, mail `message_id`, D1/canonical row và inbox proof.

## Sender policy

| Flow | Sender | Reply-To |
| --- | --- | --- |
| Biên nhận / hướng dẫn thanh toán | `pay@omdalat.com` | `support@omdalat.com` |
| Billing / failed / refund / invoice / adjustment | `billing@omdalat.com` | `support@omdalat.com` |
| Contact / support / join / docs guidance | `support@omdalat.com` | `support@omdalat.com` |
| `noreply@omdalat.com` | Reserved only, không dùng cho email thanh toán hoặc tương tác có phản hồi | N/A |

## Bộ mẫu đã khóa trong runtime registry

| Template ID | Mục đích | Sender |
| --- | --- | --- |
| `payment_receipt` | Biên nhận thanh toán đã xác nhận | `pay@omdalat.com` |
| `checkout_status_update` | Cập nhật trạng thái checkout đang chờ | `billing@omdalat.com` |
| `payment_failed_notice` | Thông báo thanh toán chưa hoàn tất | `billing@omdalat.com` |
| `refund_notice` | Hoàn tiền / điều chỉnh đã xử lý | `billing@omdalat.com` |
| `checkout_pending` | Checkout đang chờ xác nhận từ cổng thanh toán | `billing@omdalat.com` |
| `manual_payment_instruction` | Hướng dẫn thanh toán chính thức | `pay@omdalat.com` |
| `payment_failed` | Thanh toán thất bại / cổng thanh toán từ chối | `billing@omdalat.com` |
| `payment_expired` | Link thanh toán hết hạn | `billing@omdalat.com` |
| `adjustment_notice` | Điều chỉnh thanh toán | `billing@omdalat.com` |
| `invoice_available` | Hóa đơn / bản ghi thanh toán sẵn sàng | `billing@omdalat.com` |
| `contact_request_received` | Tự động trả lời form liên hệ | `support@omdalat.com` |
| `support_request_received` | Tự động xác nhận yêu cầu hỗ trợ | `support@omdalat.com` |
| `join_request_received` | Tự động xác nhận yêu cầu tham gia | `support@omdalat.com` |
| `docs_access_guidance` | Gửi tài liệu hướng dẫn và bước tiếp theo | `support@omdalat.com` |

## Link và biến bắt buộc

- `{{docs_url}}`: mặc định render từ `siteUrl + /docs`, ví dụ `https://omdalat.com/docs`.
- `{{support_url}}`: mặc định `mailto:support@omdalat.com` nếu runtime không truyền URL riêng.
- `{{checkout_url}}`, `{{receipt_url}}`, `{{invoice_url}}`, `{{billing_url}}`: do flow thanh toán truyền vào.
- `{{request_id}}`: dùng cho contact, support, join và docs guidance.

## Test đã chạy

- `pnpm test:pay` -> PASS `52/52`
- `pnpm typecheck:pay` -> PASS

## Email duyệt đã gửi

- Sender: `support@omdalat.com`
- To: `tranhatam@gmail.com`
- BCC: `tranhatam66@gmail.com`
- Message-ID: `<omdalat-template-review-1776926010@omdalat.com>`
- Mailcow queue ID: `1189367923`
- Relay: `smtp.sendgrid.net:587`
- Relay TLS: `TLSv1.3`
- Provider queue ID: `W3IYekImR-CjXx52QwGiRw`
- Relay status for `tranhatam@gmail.com`: `250 Ok`
- Relay status for `tranhatam66@gmail.com`: `250 Ok`
- Postfix queue after send: empty
- Gmail connector search from current session: not found yet, so external inbox proof remains pending.

## Bước duyệt tiếp theo

Repo-side có thể commit theo yêu cầu mới nhất của founder. Claim `PAYMENT_LIVE` vẫn chờ founder inbox proof và bằng chứng runtime đầy đủ.
