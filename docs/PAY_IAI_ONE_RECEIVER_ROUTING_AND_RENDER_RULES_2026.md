PAY_IAI_ONE_RECEIVER_ROUTING_AND_RENDER_RULES_2026.md

Version 1.0

Status: Locked Working Rule

Scope: pay.iai.one + all websites consuming centralized payment receivers

Depends on: PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md

Purpose: Define exactly how receiver selection, fallback, rendering, and multi-currency payment blocks must work

⸻

0. PURPOSE

File này tồn tại để team dev không phải tự suy đoán:

* web nào lấy tài khoản nào
* VND chọn receiver nào
* USD chọn receiver nào
* fallback ra sao
* render block thanh toán như thế nào
* khi nào được hiện QR
* khi nào phải ẩn receiver chưa xác minh

File này không thay thế receiver registry.
Registry là source of truth của account.
File này là source of truth của logic chọn và hiển thị.

⸻

1. ROOT RULE

Mọi website trong hệ chỉ được nhận tiền theo chuỗi này:

domain
→ assignment map
→ receiver_id
→ receiver registry
→ payment rendering layer
→ public payment block

Không được đi ngược:

* domain → hard-code bank account
* domain → hard-code PayPal email
* domain → hard-code QR image

⸻

2. PAYMENT RESOLUTION MODEL

Mỗi request render thanh toán phải được giải bằng 4 lớp:

Layer 1 — Domain

Website nào đang gọi payment block.

Ví dụ:

* tranhatam.com
* nguyenlananh.com
* life.iai.one
* web.iai.one

Layer 2 — Currency

Website đang yêu cầu:

* VND
* USD

Layer 3 — Assignment

Từ domain-payment-map, tìm:

* primary receiver
* fallback receiver
* optional secondary receiver

Layer 4 — Render

Lấy dữ liệu receiver thật từ registry và render đúng UI.

⸻

3. REQUIRED INPUTS

Mỗi website hoặc payment surface phải gửi vào ít nhất các biến sau:

```json
{
  "domain": "tranhatam.com",
  "currency": "VND",
  "purpose": "general_payment",
  "locale": "vi",
  "surface": "public_checkout"
}
```

Field definitions

* domain: domain hoặc subdomain đang dùng block nhận tiền
* currency: đơn vị tiền cần hiển thị
* purpose: loại mục đích thanh toán
* locale: ngôn ngữ hiển thị
* surface: bề mặt sử dụng
  * public_checkout
  * invoice_page
  * manual_payment_fallback
  * admin_preview

⸻

4. SUPPORTED PURPOSE TYPES

Ban đầu khóa 5 loại:

* general_payment
* manual_transfer
* deposit
* donation
* invoice_settlement

Rule

purpose không được tự đổi receiver nếu founder chưa chỉ định.
Nó chỉ dùng để:

* thay đổi copy hướng dẫn
* thay đổi note hiển thị
* thay đổi label thanh toán

⸻

5. CURRENCY ROUTING RULES

⸻

5.1 VND ROUTING

Nếu currency = VND

1. lấy primary_vnd_receiver
2. nếu receiver lỗi hoặc unavailable → dùng fallback_vnd_receiver
3. nếu không có fallback → show “manual contact required”

Example

tranhatam.com

primary_vnd_receiver: recv_vnd_personal_tranhatam_acb
fallback_vnd_receiver: recv_vnd_personal_tranhatam_vcb

⸻

5.2 USD ROUTING

Nếu currency = USD

1. lấy primary_usd_receiver
2. nếu unavailable → show manual fallback rule
3. không tự ý chuyển USD sang VND receiver
4. nếu receiver là US bank account, chỉ render khi Founder đã gán domain cụ thể

Example

tranhatam.com

primary_usd_receiver: recv_usd_personal_tranhatam_paypal

Future US organization receiver

receiver_id:

* recv_usd_angeledutam_foundation_relay_thread

status:

* HOLD_NOT_ASSIGNED

Rule:

* không render công khai cho tới khi Founder gán website
* ACH và domestic wire dùng account/routing details theo Relay
* international wire chỉ dùng sau khi Relay dashboard cung cấp SWIFT details riêng

⸻

5.3 NO AUTO CROSS-CURRENCY RULE

Forbidden

* USD request → tự đổi sang VND QR
* VND request → tự đổi sang PayPal USD
* bank VND → tự gắn “USD” chỉ vì UI muốn thế

Allowed

Chỉ khi founder cấu hình rõ:

* allow_cross_currency_fallback = true

Mặc định:

```json
{
  "allow_cross_currency_fallback": false
}
```

⸻

6. RECEIVER ELIGIBILITY RULE

Receiver chỉ được phép render công khai nếu status nằm trong nhóm cho phép.

Public-allowed statuses

* ACTIVE_CONFIRMED

Internal-preview-only statuses

* NEEDS_QR_SCAN_CONFIRMATION
* NEEDS_LEGAL_NAME_CONFIRMATION

Hidden statuses

* HOLD_NOT_ASSIGNED
* DISABLED
* ARCHIVED

Public render rule

IF receiver.status != ACTIVE_CONFIRMED
→ do not render publicly
→ only show in admin/internal preview

⸻

7. PRIMARY / FALLBACK MODEL

Mỗi domain-currency pair được phép có tối đa:

* 1 primary receiver
* 1 fallback receiver
* 1 secondary optional receiver for internal/admin use only

Example

```json
{
  "tranhatam.com": {
    "VND": {
      "primary": "recv_vnd_personal_tranhatam_acb",
      "fallback": "recv_vnd_personal_tranhatam_vcb"
    },
    "USD": {
      "primary": "recv_usd_personal_tranhatam_paypal"
    }
  }
}
```

⸻

8. FALLBACK RULES

⸻

8.1 VND fallback allowed

Nếu primary receiver:

* không load được QR
* bị founder tắt tạm
* status không còn ACTIVE_CONFIRMED

thì dùng fallback.

⸻

8.2 USD fallback restricted

USD thường nhạy hơn nên fallback không được tự động bank-switch nếu chưa có rule.

Nếu USD receiver fail:

show:
- primary receiver unavailable
- contact support / manual arrangement

Không được tự động:

* chuyển sang receiver USD khác
* chuyển sang bank QR VND
* chuyển sang PayPal khác

trừ khi founder map sẵn.

⸻

9. PAYMENT BLOCK RENDER RULES

Mỗi payment block phải render cùng một grammar thống nhất.

⸻

9.1 PUBLIC BLOCK — REQUIRED FIELDS

VND Bank Receiver

Phải hiện:

* Payment method
* Currency
* Account holder
* Bank name
* Account number
* Branch if available
* Swift if available
* QR image
* Copy account number button
* Copy account name button
* Short instruction

USD PayPal Receiver

Phải hiện:

* Payment method
* Currency
* Receiver name
* PayPal target
* PayPal button or PayPal link
* QR if available
* Short instruction

USD US Bank Receiver

Phải hiện chỉ sau khi domain đã được Founder gán:

* Payment method
* Currency
* Payee / beneficiary name
* Bank name
* Account number
* Routing number
* Bank address if required
* Supported rail label: ACH or domestic wire
* Payment memo/reference instruction
* Support contact

Không được hiện:

* SWIFT/BIC nếu Relay dashboard chưa cung cấp
* intermediary bank nếu chưa có từ Relay dashboard
* account/routing details khi receiver còn HOLD_NOT_ASSIGNED

⸻

9.2 PUBLIC BLOCK — FIELD ORDER

VND

1. Tiêu đề thanh toán
2. Currency badge
3. QR
4. Tên chủ tài khoản
5. Số tài khoản
6. Tên ngân hàng
7. Chi nhánh
8. Swift code
9. Nút copy
10. Hướng dẫn ngắn

USD

1. Tiêu đề thanh toán
2. Currency badge
3. PayPal button / link or US bank transfer details
4. QR if available
5. Receiver identity
6. Email, PayPal target, or bank account details
7. Payment memo/reference instruction
8. Hướng dẫn ngắn

⸻

9.3 PUBLIC BLOCK — DO NOT SHOW

Không hiện công khai:

* receiver_id
* source_note
* verification notes
* registry status internal
* legal uncertainty notes
* raw owner comments
* assignment history

⸻

10. INTERNAL / ADMIN BLOCK RULES

Trong admin preview hoặc founder preview được phép hiện thêm:

* receiver_id
* status
* source_note
* assigned domains
* last updated
* verification status
* render eligibility

⸻

11. LANGUAGE RULES FOR PAYMENT BLOCKS

Vietnamese

* dùng cho site tiếng Việt
* rõ, ngắn, trung tính
* không dùng giọng marketing

English

* dùng cho site tiếng Anh
* direct, institutional, non-sales

Recommended UI copy

VI

* Chuyển khoản VND
* Thanh toán USD
* Quét mã để chuyển tiền
* Sao chép số tài khoản
* Sao chép tên tài khoản
* Mở PayPal
* Kiểm tra đúng tên người nhận trước khi chuyển

EN

* Pay in VND
* Pay in USD
* Scan to transfer
* Copy account number
* Copy account name
* Open PayPal
* Confirm receiver details before payment

⸻

12. RENDER MODES

Mode 1 — public_checkout

Hiển thị sạch, ít dữ liệu, chỉ payment-ready

Mode 2 — manual_payment_fallback

Hiển thị mạnh hơn về hướng dẫn và copy

Mode 3 — invoice_page

Cho phép hiện payment reference / invoice code nếu có

Mode 4 — admin_preview

Hiện đầy đủ internal fields

⸻

13. QR IMAGE RULE

QR image chỉ được dùng nếu:

* gắn với đúng receiver_id
* file source đã lưu
* status receiver = ACTIVE_CONFIRMED
* không bị ambiguous legal name

Nếu QR thuộc receiver chưa xác minh đủ:

* chỉ hiện ở admin preview
* không hiện public

⸻

14. PAYPAL RULES

PayPal rendering must distinguish:

paypal_email

Dùng email hoặc button mở PayPal

paypal_managed_qr

Dùng QR / managed URL

Current rule for tranhatam.com

USD dùng:

tranhatam@gmail.com

Nếu sau này có thêm PayPal.me hoặc checkout link riêng, team dev phải map thành receiver khác, không overwrite receiver cũ.

⸻

14.1 US BANK ACCOUNT RULES

Current organization receiver:

* recv_usd_angeledutam_foundation_relay_thread
* owner: Angel Edu Tam Foundation Inc
* provider: Relay Financial
* partner bank: Thread Bank
* currency: USD
* assignment: HOLD_NOT_ASSIGNED

Rules:

* US ACH and domestic wire may use account/routing details only after domain assignment
* payee name must match Angel Edu Tam Foundation Inc or another accepted Relay account name
* bank name and address must follow Relay / Thread Bank details
* international wire requires separate Relay SWIFT details and must not be inferred from ACH routing number
* public registry snapshots must redact account/routing details while receiver is HOLD_NOT_ASSIGNED
* public payment block must not render this receiver until Founder assigns domain -> currency -> receiver_id

⸻

15. ERROR STATES

Payment block phải có 4 trạng thái lỗi chuẩn:

15.1 No receiver assigned

No receiver has been assigned for this domain and currency.

VI:

Chưa có tài khoản nhận tiền được gán cho website và loại tiền này.

⸻

15.2 Receiver not public-eligible

This receiver is not approved for public display.

VI:

Tài khoản này chưa được duyệt để hiển thị công khai.

⸻

15.3 Primary unavailable, fallback active

Primary receiver unavailable. Fallback receiver is being shown.

VI:

Tài khoản nhận chính tạm thời không khả dụng. Hệ đang hiển thị tài khoản dự phòng.

⸻

15.4 No fallback available

Primary receiver unavailable. Please contact support for manual payment instructions.

VI:

Tài khoản nhận chính tạm thời không khả dụng. Vui lòng liên hệ để nhận hướng dẫn thanh toán thủ công.

⸻

16. SECURITY RULE

Không được:

* embed số tài khoản trực tiếp trong code ngoài registry
* để QR file không có mapping receiver_id
* render receiver chưa ACTIVE_CONFIRMED
* lấy receiver bằng query param public không xác thực
* để domain tự override receiver bằng frontend logic

Receiver resolution phải xảy ra ở:

* server layer
* config layer
* CMS-controlled layer

Không để frontend tự chọn.

⸻

17. RECOMMENDED FILE STRUCTURE

/payments/
  receivers.json
  domain-payment-map.json
  render-rules.json
  qr-assets/
  paypal/

Recommended assets

qr-assets/recv_vnd_personal_tranhatam_acb.png
qr-assets/recv_vnd_personal_tranhatam_vcb.png
qr-assets/recv_vnd_vietuc_toancau_acb.png
...

⸻

18. SUGGESTED RENDER CONFIG

```json
{
  "render_rules": {
    "public_allowed_statuses": ["ACTIVE_CONFIRMED"],
    "internal_preview_statuses": [
      "NEEDS_QR_SCAN_CONFIRMATION",
      "NEEDS_LEGAL_NAME_CONFIRMATION"
    ],
    "allow_cross_currency_fallback": false,
    "max_public_receivers_per_currency": 2
  }
}
```

⸻

19. CURRENT IMPLEMENT NOW MAP

tranhatam.com

VND

* primary: recv_vnd_personal_tranhatam_acb
* fallback: recv_vnd_personal_tranhatam_vcb

USD

* primary: recv_usd_personal_tranhatam_paypal

All other domains

* no public assignment yet
* hold until founder instruction

⸻

20. DEV TASKS TO EXECUTE NOW

P0

1. build receivers.json
2. build domain-payment-map.json
3. build payment resolver
4. build reusable VND bank block
5. build reusable USD PayPal block
6. assign tranhatam.com

P1

1. admin preview mode
2. fallback handling
3. copy buttons
4. localized instructions

P2

1. invoice-aware payment blocks
2. payment purpose variations
3. audit logging
4. multi-receiver UI expansion

⸻

21. ONE-LINE RULE FOR TEAM DEV

Không website nào được tự chọn tài khoản nhận; website chỉ được hỏi pay.iai.one và render đúng receiver đã được founder gán.

⸻

22. FINAL SUMMARY

Từ bây giờ, flow đúng là:

Founder assigns domain → registry stores receiver → pay.iai.one resolves → website renders

Không đi đường khác.
