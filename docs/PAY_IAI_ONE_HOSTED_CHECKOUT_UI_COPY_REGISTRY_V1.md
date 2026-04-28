# PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1

Version 1.0

Status: Production Copy Lock

Scope

Hosted checkout UI copy, customer-facing status text, method labels, helper text, support text, error states, receipt labels, and bilingual-ready content registry structure for pay.iai.one

Owners

Product / Design / Frontend / Payments / Support / Content

Priority

Highest

⸻

0. Core statement

Checkout copy is not decoration.
It is state communication.

If the copy is vague, too optimistic, too technical, or inconsistent, users will pay twice, panic, abandon, or distrust the system.

The hosted checkout must therefore use one calm, precise, reusable copy registry that maps tightly to internal state.

⸻

1. Purpose

This file defines:

* the tone and language rules for checkout
* copy keys for the hosted payment flow
* required Vietnamese-first wording
* English fallback wording
* copy logic for all major payment states
* method labels and instruction blocks
* support and help messages
* receipt language

This registry is meant to be stored in content files, not hard-coded across components.

⸻

2. Tone rules

The checkout language must be:

* calm
* precise
* trustworthy
* non-sales
* non-hype
* direct
* operationally clear

Avoid:

* exaggerated reassurance
* early success claims
* marketing language
* vague “please wait” copy with no context
* emotionally noisy phrases

Prefer:

* Awaiting payment
* Payment detected, verifying
* Payment confirmed
* Session expired
* Payment could not be confirmed

⸻

3. Language structure rule

Vietnamese should be the primary operational language in the initial rollout.
English should exist as a clean fallback.

Recommended storage structure:

* /content/pay_checkout.vi.json
* /content/pay_checkout.en.json

Do not hard-code literal copy in components.

⸻

4. Copy registry groups

Required groups:

* common
* checkout_header
* order_summary
* method_selector
* qr_panel
* bank_transfer_panel
* provider_redirect_panel
* status
* actions
* help
* errors
* receipt
* support
* accessibility
* analytics_labels if needed

⸻

5. Common labels

VI

* common.secure_payment: Thanh toán an toàn
* common.order_reference: Mã tham chiếu
* common.amount: Số tiền
* common.currency: Loại tiền
* common.status: Trạng thái
* common.expires_in: Hết hạn sau
* common.copy: Sao chép
* common.copied: Đã sao chép
* common.refresh: Làm mới
* common.back_to_site: Quay lại trang gốc
* common.view_receipt: Xem biên nhận
* common.need_help: Cần hỗ trợ
* common.processing: Đang xử lý
* common.not_available: Chưa khả dụng

EN

* common.secure_payment: Secure payment
* common.order_reference: Reference
* common.amount: Amount
* common.currency: Currency
* common.status: Status
* common.expires_in: Expires in
* common.copy: Copy
* common.copied: Copied
* common.refresh: Refresh
* common.back_to_site: Back to site
* common.view_receipt: View receipt
* common.need_help: Need help
* common.processing: Processing
* common.not_available: Not available

⸻

6. Checkout header copy

VI

* checkout_header.title: Thanh toán
* checkout_header.subtitle: Phiên thanh toán này được quản lý tập trung để bảo đảm trạng thái thanh toán chính xác.
* checkout_header.secure_badge: Phiên bảo mật
* checkout_header.expiring_soon: Phiên sắp hết hạn
* checkout_header.expired: Phiên đã hết hạn

EN

* checkout_header.title: Checkout
* checkout_header.subtitle: This payment session is centrally managed to keep payment status accurate.
* checkout_header.secure_badge: Secure session
* checkout_header.expiring_soon: This session is about to expire
* checkout_header.expired: This session has expired

⸻

7. Order summary copy

VI

* order_summary.title: Thông tin thanh toán
* order_summary.item_label: Nội dung
* order_summary.customer_label: Người thanh toán
* order_summary.site_label: Đơn vị khởi tạo
* order_summary.reference_label: Mã tham chiếu
* order_summary.total_label: Tổng thanh toán
* order_summary.note_exact_amount: Vui lòng thanh toán đúng số tiền hiển thị cho phiên này.

EN

* order_summary.title: Payment details
* order_summary.item_label: Item
* order_summary.customer_label: Payer
* order_summary.site_label: Originating site
* order_summary.reference_label: Reference
* order_summary.total_label: Total
* order_summary.note_exact_amount: Please pay the exact amount shown for this session.

⸻

8. Method selector copy

VI

* method_selector.title: Phương thức thanh toán
* method_selector.recommended: Đề xuất
* method_selector.bank_qr: Quét mã QR ngân hàng
* method_selector.bank_transfer: Chuyển khoản ngân hàng
* method_selector.card: Thẻ thanh toán
* method_selector.wallet: Ví thanh toán
* method_selector.provider_redirect: Thanh toán qua cổng đối tác
* method_selector.internal_balance: Số dư nội bộ
* method_selector.change_method: Chọn phương thức khác

EN

* method_selector.title: Payment method
* method_selector.recommended: Recommended
* method_selector.bank_qr: Bank QR
* method_selector.bank_transfer: Bank transfer
* method_selector.card: Card
* method_selector.wallet: Wallet
* method_selector.provider_redirect: Pay with partner gateway
* method_selector.internal_balance: Internal balance
* method_selector.change_method: Choose another method

⸻

9. QR panel copy

VI

* qr_panel.title: Quét mã để thanh toán
* qr_panel.scan_instruction: Dùng ứng dụng ngân hàng hoặc ví phù hợp để quét mã này.
* qr_panel.amount_label: Số tiền cần thanh toán
* qr_panel.reference_label: Nội dung chuyển khoản
* qr_panel.copy_reference: Sao chép nội dung
* qr_panel.copy_amount: Sao chép số tiền
* qr_panel.open_app: Mở ứng dụng thanh toán
* qr_panel.refresh_qr: Tạo lại mã mới
* qr_panel.payment_sent_soft: Tôi đã hoàn tất thanh toán
* qr_panel.payment_sent_soft_note: Chúng tôi sẽ kiểm tra và cập nhật trạng thái sau khi xác nhận.

EN

* qr_panel.title: Scan to pay
* qr_panel.scan_instruction: Use your banking or supported wallet app to scan this code.
* qr_panel.amount_label: Amount to pay
* qr_panel.reference_label: Transfer reference
* qr_panel.copy_reference: Copy reference
* qr_panel.copy_amount: Copy amount
* qr_panel.open_app: Open payment app
* qr_panel.refresh_qr: Generate a new code
* qr_panel.payment_sent_soft: I have completed payment
* qr_panel.payment_sent_soft_note: We will update the status after verification.

⸻

10. Bank transfer instruction copy

VI

* bank_transfer_panel.title: Thông tin chuyển khoản
* bank_transfer_panel.bank_name: Ngân hàng
* bank_transfer_panel.account_holder: Chủ tài khoản
* bank_transfer_panel.account_number: Số tài khoản
* bank_transfer_panel.transfer_amount: Số tiền chuyển
* bank_transfer_panel.transfer_reference: Nội dung chuyển
* bank_transfer_panel.copy_account: Sao chép số tài khoản
* bank_transfer_panel.exact_reference_note: Vui lòng nhập đúng nội dung chuyển khoản để hệ thống đối chiếu nhanh hơn.
* bank_transfer_panel.confirmation_note: Thanh toán sẽ được xác nhận sau khi hệ thống kiểm tra giao dịch.

EN

* bank_transfer_panel.title: Transfer details
* bank_transfer_panel.bank_name: Bank
* bank_transfer_panel.account_holder: Account holder
* bank_transfer_panel.account_number: Account number
* bank_transfer_panel.transfer_amount: Transfer amount
* bank_transfer_panel.transfer_reference: Transfer reference
* bank_transfer_panel.copy_account: Copy account number
* bank_transfer_panel.exact_reference_note: Please use the exact transfer reference for faster matching.
* bank_transfer_panel.confirmation_note: Payment will be confirmed after the system verifies the transaction.

⸻

11. Provider redirect panel copy

VI

* provider_redirect_panel.title: Thanh toán qua cổng đối tác
* provider_redirect_panel.note: Bạn sẽ được chuyển tới cổng thanh toán đối tác để hoàn tất giao dịch.
* provider_redirect_panel.primary_action: Tiếp tục thanh toán
* provider_redirect_panel.return_note: Sau khi hoàn tất, vui lòng quay lại phiên này để kiểm tra trạng thái xác nhận.

EN

* provider_redirect_panel.title: Pay with partner gateway
* provider_redirect_panel.note: You will be redirected to a partner payment gateway to complete the payment.
* provider_redirect_panel.primary_action: Continue to payment
* provider_redirect_panel.return_note: After payment, return to this session to check confirmation status.

⸻

12. Status copy

This is the most important group.

VI

* status.created.title: Phiên đã được tạo
* status.created.body: Bạn có thể chọn phương thức thanh toán để tiếp tục.
* status.awaiting_payment.title: Đang chờ thanh toán
* status.awaiting_payment.body: Phiên này đang chờ giao dịch từ bạn.
* status.awaiting_confirmation.title: Đang chờ xác nhận
* status.awaiting_confirmation.body: Hệ thống đang kiểm tra giao dịch với đối tác thanh toán hoặc bộ phận vận hành. Bạn chưa cần thanh toán lại.
* status.paid_pending_internal_confirmation.title: Đã ghi nhận tín hiệu thanh toán
* status.paid_pending_internal_confirmation.body: Chúng tôi đã ghi nhận tín hiệu ban đầu và đang xác minh để tránh nhầm lẫn hoặc ghi nhận trùng.
* status.confirmed.title: Thanh toán đã được xác nhận
* status.confirmed.body: Phiên thanh toán này đã được xác nhận thành công.
* status.failed.title: Thanh toán chưa thành công
* status.failed.body: Hệ thống chưa xác nhận được giao dịch cho phiên này.
* status.expired.title: Phiên đã hết hạn
* status.expired.body: Phiên thanh toán này không còn hiệu lực. Bạn có thể tạo lại phiên mới nếu cần.
* status.cancelled.title: Phiên đã được hủy
* status.cancelled.body: Phiên thanh toán này đã được hủy và không còn được xử lý tiếp.

EN

* status.created.title: Session created
* status.created.body: You can choose a payment method to continue.
* status.awaiting_payment.title: Awaiting payment
* status.awaiting_payment.body: This session is waiting for your payment.
* status.awaiting_confirmation.title: Awaiting confirmation
* status.awaiting_confirmation.body: The system is verifying the transaction with the payment partner or operations team. You do not need to pay again.
* status.paid_pending_internal_confirmation.title: Payment signal detected
* status.paid_pending_internal_confirmation.body: An initial payment signal was detected and is being verified to avoid mismatch or duplicate confirmation.
* status.confirmed.title: Payment confirmed
* status.confirmed.body: This payment session has been confirmed successfully.
* status.failed.title: Payment not confirmed
* status.failed.body: The system could not confirm the transaction for this session.
* status.expired.title: Session expired
* status.expired.body: This payment session is no longer active. You can create a new one if needed.
* status.cancelled.title: Session cancelled
* status.cancelled.body: This payment session was cancelled and will not continue.

⸻

13. Actions copy

VI

* actions.retry: Thử lại
* actions.create_new_session: Tạo phiên mới
* actions.refresh_status: Cập nhật trạng thái
* actions.return_to_site: Quay lại trang gốc
* actions.view_receipt: Xem biên nhận
* actions.choose_other_method: Chọn phương thức khác
* actions.contact_support: Liên hệ hỗ trợ

EN

* actions.retry: Retry
* actions.create_new_session: Create a new session
* actions.refresh_status: Refresh status
* actions.return_to_site: Return to site
* actions.view_receipt: View receipt
* actions.choose_other_method: Choose another method
* actions.contact_support: Contact support

⸻

14. Help copy

VI

* help.title: Hỗ trợ thanh toán
* help.already_paid_question: Tôi đã thanh toán nhưng chưa thấy xác nhận
* help.already_paid_answer: Vui lòng đợi hệ thống xác minh. Nếu trạng thái không thay đổi sau một khoảng thời gian hợp lý, hãy liên hệ hỗ trợ và cung cấp mã tham chiếu.
* help.wrong_amount_question: Tôi đã chuyển sai số tiền
* help.wrong_amount_answer: Giao dịch có thể cần kiểm tra thủ công. Vui lòng liên hệ hỗ trợ và cung cấp thông tin giao dịch của bạn.
* help.expired_question: Phiên hết hạn khi tôi đang thanh toán
* help.expired_answer: Nếu bạn đã hoàn tất chuyển khoản, hệ thống vẫn có thể cần đối chiếu thủ công. Không nên thanh toán lại ngay nếu bạn chưa chắc giao dịch trước đó thất bại.
* help.returned_question: Tôi đã quay lại từ cổng thanh toán nhưng chưa thấy thành công
* help.returned_answer: Trạng thái thành công chỉ được hiển thị sau khi hệ thống xác nhận nội bộ. Bạn có thể làm mới trạng thái hoặc chờ thêm một lúc.

EN

* help.title: Payment help
* help.already_paid_question: I already paid but do not see confirmation
* help.already_paid_answer: Please allow time for verification. If the status does not update after a reasonable period, contact support and provide the reference.
* help.wrong_amount_question: I sent the wrong amount
* help.wrong_amount_answer: This may require manual review. Please contact support and provide your transaction details.
* help.expired_question: The session expired while I was paying
* help.expired_answer: If you already completed the transfer, the system may still need manual matching. Do not pay again immediately unless you are sure the previous attempt failed.
* help.returned_question: I returned from the payment gateway but do not see success
* help.returned_answer: Success is shown only after internal confirmation. You can refresh the status or wait a bit longer.

⸻

15. Error copy

VI

* errors.session_not_found.title: Không tìm thấy phiên thanh toán
* errors.session_not_found.body: Phiên này không tồn tại hoặc không còn khả dụng.
* errors.qr_unavailable.title: Chưa tạo được mã thanh toán
* errors.qr_unavailable.body: Hệ thống chưa thể tạo mã cho phiên này. Vui lòng thử lại hoặc chọn phương thức khác.
* errors.provider_unavailable.title: Cổng thanh toán tạm thời chưa khả dụng
* errors.provider_unavailable.body: Vui lòng thử lại sau hoặc chuyển sang phương thức khác nếu có.
* errors.polling_failed.title: Không thể cập nhật trạng thái ngay lúc này
* errors.polling_failed.body: Bạn có thể làm mới lại sau ít phút. Giao dịch trước đó vẫn có thể đang được xác minh.
* errors.generic.title: Có sự cố xảy ra
* errors.generic.body: Hệ thống chưa thể hoàn tất thao tác này vào lúc này.

EN

* errors.session_not_found.title: Payment session not found
* errors.session_not_found.body: This session does not exist or is no longer available.
* errors.qr_unavailable.title: Payment code not available
* errors.qr_unavailable.body: The system could not generate a code for this session. Please try again or choose another method.
* errors.provider_unavailable.title: Payment gateway temporarily unavailable
* errors.provider_unavailable.body: Please try again later or choose another method if available.
* errors.polling_failed.title: Unable to refresh status right now
* errors.polling_failed.body: You can try again shortly. Your earlier transaction may still be under verification.
* errors.generic.title: Something went wrong
* errors.generic.body: The system could not complete this action at the moment.

⸻

16. Receipt copy

VI

* receipt.title: Biên nhận thanh toán
* receipt.confirmed_badge: Đã xác nhận
* receipt.payment_reference: Mã thanh toán
* receipt.date_time: Thời gian
* receipt.origin_site: Đơn vị khởi tạo
* receipt.payment_method: Phương thức thanh toán
* receipt.amount: Số tiền
* receipt.customer: Người thanh toán
* receipt.download: Tải biên nhận
* receipt.return_to_site: Quay lại trang gốc

EN

* receipt.title: Payment receipt
* receipt.confirmed_badge: Confirmed
* receipt.payment_reference: Payment reference
* receipt.date_time: Date and time
* receipt.origin_site: Originating site
* receipt.payment_method: Payment method
* receipt.amount: Amount
* receipt.customer: Payer
* receipt.download: Download receipt
* receipt.return_to_site: Return to site

⸻

17. Support copy

VI

* support.contact_title: Liên hệ hỗ trợ
* support.reference_instruction: Khi liên hệ hỗ trợ, vui lòng cung cấp mã tham chiếu để được kiểm tra nhanh hơn.
* support.safe_note: Không chia sẻ thông tin bí mật hoặc mã xác thực của bạn cho bất kỳ ai.

EN

* support.contact_title: Contact support
* support.reference_instruction: When contacting support, please provide the reference for faster review.
* support.safe_note: Do not share sensitive secrets or verification codes with anyone.

⸻

18. Accessibility copy

VI

* accessibility.qr_alt: Mã QR thanh toán cho phiên hiện tại
* accessibility.copy_reference_label: Sao chép mã tham chiếu
* accessibility.copy_amount_label: Sao chép số tiền
* accessibility.session_countdown_label: Thời gian còn lại của phiên

EN

* accessibility.qr_alt: Payment QR code for the current session
* accessibility.copy_reference_label: Copy payment reference
* accessibility.copy_amount_label: Copy payment amount
* accessibility.session_countdown_label: Remaining session time

⸻

19. Component mapping guidance

Each frontend component should consume keys from registry, not raw text.

Recommended components:

* CheckoutHeader
* OrderSummaryCard
* MethodSelector
* QrPaymentPanel
* BankTransferPanel
* RedirectPaymentPanel
* StatusCard
* HelpAccordion
* ReceiptSummary
* SupportCard

⸻

20. Conditional copy rules

Rule 1

If status is awaiting_confirmation, never show “payment successful”.

Rule 2

If session is expired but late payment still possible by reconciliation, use copy that does not force immediate repay.

Rule 3

If provider redirect returns but internal state not yet confirmed, show confirmation-pending language.

Rule 4

If multiple methods available, keep one recommended label but do not pressure.

Rule 5

Support and help language must always mention reference, not internal IDs hidden from users unless explicitly intended.

⸻

21. Example JSON structure

pay_checkout.vi.json

{
  "common": {
    "secure_payment": "Thanh toán an toàn",
    "order_reference": "Mã tham chiếu"
  },
  "checkout_header": {
    "title": "Thanh toán",
    "subtitle": "Phiên thanh toán này được quản lý tập trung để bảo đảm trạng thái thanh toán chính xác."
  },
  "status": {
    "awaiting_confirmation": {
      "title": "Đang chờ xác nhận",
      "body": "Hệ thống đang kiểm tra giao dịch với đối tác thanh toán hoặc bộ phận vận hành. Bạn chưa cần thanh toán lại."
    }
  }
}

pay_checkout.en.json

{
  "common": {
    "secure_payment": "Secure payment",
    "order_reference": "Reference"
  },
  "checkout_header": {
    "title": "Checkout",
    "subtitle": "This payment session is centrally managed to keep payment status accurate."
  },
  "status": {
    "awaiting_confirmation": {
      "title": "Awaiting confirmation",
      "body": "The system is verifying the transaction with the payment partner or operations team. You do not need to pay again."
    }
  }
}

⸻

22. Copy QA checklist

Before release, verify:

1. no component hard-codes payment status text
2. no early success copy appears before confirmed state
3. expired state copy does not force unsafe duplicate payment
4. help text exists for wrong amount and delayed confirmation
5. bilingual keys match structurally
6. receipt language is consistent with status logic
7. support instructions mention reference
8. QR copy clearly shows amount and transfer reference
9. error copy does not expose internal implementation details
10. tone remains calm and precise throughout

⸻

23. Minimum acceptance criteria

The copy registry is not ready until:

* all hosted checkout states are covered
* all action buttons have registered copy keys
* all method panels have registered copy keys
* help and support states are covered
* receipt page is covered
* accessibility labels are covered
* VI and EN structures are aligned
* no misleading success language exists before internal confirmation

⸻

24. Final direction

The hosted checkout copy registry is the language spine of payment trust.

It must describe exactly what the system knows, no more and no less.

That is how the interface stays calm, honest, and operationally safe for users.
