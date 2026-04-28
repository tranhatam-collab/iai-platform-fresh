PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md

Version 1.0

Status: Working Master Registry

Scope: All receiving accounts for pay.iai.one and mapped web domains

Owner: Founder / Payments Team

Use: Source of truth for receiver selection on all websites

⸻

0. PURPOSE

Tài liệu này tồn tại để:

* gom toàn bộ tài khoản nhận tiền vào một registry duy nhất
* cho phép team dev gắn đúng tài khoản nhận cho từng web
* làm source of truth cho pay.iai.one
* tách rõ:
  * VND local channels
  * USD international channels
  * personal receivers
  * company receivers
  * future domain-specific assignment

⸻

1. ROOT RULE

Không web nào được tự hard-code tài khoản nhận tiền trong UI hoặc source code.

Mọi website phải lấy receiver từ registry này hoặc từ config map sinh ra từ registry này.

Use this file together with:

* PAY_IAI_ONE_RECEIVER_ROUTING_AND_RENDER_RULES_2026.md
* PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md

⸻

2. CURRENT ACTIVE ASSIGNMENT (ĐÃ CHỐT)

tranhatam.com

VND

* nhận qua tài khoản cá nhân Trần Hà Tâm
* ưu tiên:
  1. ACB personal QR / account
  2. Vietcombank personal account

USD

* nhận qua PayPal
* PayPal email:

tranhatam@gmail.com

omdalat.com

VND

* nhận qua công ty Công ty TNHH SX - TM - DV Thai Lam
* ưu tiên:
  1. ACB company QR / account (`recv_vnd_thailam_acb`)

vetuonglai.com payment surfaces (vc/invest/life)

VND

* nhận qua công ty Công ty TNHH ĐTTM Thanh Tam Phat
* áp dụng cho:
  1. `vc.vetuonglai.com`
  2. `invest.vetuonglai.com`
  3. `life.vetuonglai.com`
* receiver:
  * `recv_vnd_thanhtamphat_acb`

Angel Edu Tam Foundation Inc

USD United States

* receiver đã ghi nhận:
  * `recv_usd_angeledutam_foundation_relay_thread`
* trạng thái:
  * `HOLD_NOT_ASSIGNED`
* ghi chú:
  * đây là tài khoản nhận USD chính thức tại Hoa Kỳ qua Relay / Thread Bank
  * chưa gán cho website nào cho tới khi Founder chỉ định domain cụ thể
  * không được render công khai nếu chưa có domain assignment

⸻

3. RECEIVER STATUS LEGEND

* ACTIVE_CONFIRMED = đã đủ rõ để đưa vào registry dùng nội bộ/dev
* NEEDS_QR_SCAN_CONFIRMATION = nhìn ảnh thấy thông tin nhưng chưa scan lại QR payload
* NEEDS_LEGAL_NAME_CONFIRMATION = tên pháp lý trên ảnh bị cắt, cần xác minh lại trước khi live
* HOLD_NOT_ASSIGNED = giữ trong registry nhưng chưa gán cho web nào

⸻

4. MASTER RECEIVER REGISTRY

⸻

RECEIVER 001

receiver_id: recv_vnd_personal_tranhatam_acb
status: ACTIVE_CONFIRMED
currency: VND
channel_type: bank_qr
entity_type: personal
display_name: Trần Hà Tâm
legal_name: TRAN HA TAM
bank_name: ACB
account_number: 27588277
branch: Chưa thấy rõ trên ảnh
swift_code: Chưa thấy rõ trên ảnh
country: VN
source_note: Ảnh QR ACB cá nhân
default_for_domains:

* tranhatam.com

⸻

RECEIVER 002

receiver_id: recv_vnd_personal_tranhatam_vcb
status: ACTIVE_CONFIRMED
currency: VND
channel_type: bank_qr
entity_type: personal
display_name: Trần Hà Tâm
legal_name: TRAN HA TAM
bank_name: Vietcombank
account_number: 0231000091212
branch: Trụ sở CN Đắk Lắk
swift_code: Chưa thấy rõ trên ảnh
country: VN
source_note: Ảnh QR Vietcombank cá nhân
default_for_domains:

* tranhatam.com as fallback VND

⸻

RECEIVER 003

receiver_id: recv_usd_personal_tranhatam_paypal
status: ACTIVE_CONFIRMED
currency: USD
channel_type: paypal_email
entity_type: personal
display_name: Trần Hà Tâm
paypal_email: tranhatam@gmail.com
country: US/International
source_note: Founder instruction
default_for_domains:

* tranhatam.com

⸻

RECEIVER 004

receiver_id: recv_vnd_vietuc_toancau_acb
status: ACTIVE_CONFIRMED
currency: VND
channel_type: bank_qr
entity_type: company
display_name: Công ty Cổ phần Đầu tư Việt Úc Toàn Cầu
legal_name_visible: CTY CO PHAN DAU TU VIET UC TOAN CAU
bank_name: Ngân hàng TMCP Á Châu (ACB)
account_number: 20153108
branch: ACB - PGD Kỳ Đồng
swift_code: ASCBVNVX
country: VN
source_note: Ảnh QR VietQR ACB
default_for_domains:

* chưa gán
  assignment_status: HOLD_NOT_ASSIGNED

⸻

RECEIVER 005

receiver_id: recv_vnd_tamvesey_uk_acb
status: ACTIVE_CONFIRMED
currency: VND
channel_type: bank_qr
entity_type: company
display_name: Công ty TNHH Tam Vesey Associates UK
legal_name_visible: CTY TNHH TAM VESEY ASSOCIATES UK
bank_name: Ngân hàng TMCP Á Châu (ACB)
account_number: 12381288
branch: ACB - PGD Kỳ Đồng
swift_code: ASCBVNVX
country: VN
source_note: Ảnh QR VietQR ACB
default_for_domains:

* vc.vetuonglai.com
* invest.vetuonglai.com
* life.vetuonglai.com
  assignment_status: ACTIVE_DOMAIN_DEFAULT

⸻

RECEIVER 006

receiver_id: recv_vnd_hanhtrinh_company_acb
status: NEEDS_LEGAL_NAME_CONFIRMATION
currency: VND
channel_type: bank_qr
entity_type: company
display_name_visible: Công ty CP ĐT Giáo Dục và Du Lịch Hành Trình Ka...
legal_name_visible: CTY CP DT GIAO DUC VA DU LICH HANH TRINH KA...
bank_name: Ngân hàng TMCP Á Châu (ACB)
account_number: 30051378
branch: ACB - PGD Cống Quỳnh
swift_code: ASCBVNVX
country: VN
source_note: Tên pháp lý bị cắt trên ảnh, cần xác minh lại trước khi gán
default_for_domains:

* omdalat.com
  assignment_status: ACTIVE_DOMAIN_DEFAULT

⸻

RECEIVER 007

receiver_id: recv_usd_thanhtamphat_acb
status: ACTIVE_CONFIRMED
currency: USD
channel_type: bank_qr
entity_type: company
display_name: Công ty TNHH ĐTTM Thanh Tam Phat
legal_name_visible: CTY TNHH DTTM THANH TAM PHAT
bank_name: Ngân hàng TMCP Á Châu (ACB)
account_number: 3699636
branch: ACB - CN TP. Hồ Chí Minh
swift_code: ASCBVNVX
country: VN
source_note: Ảnh QR ghi USD
default_for_domains:

* chưa gán
  assignment_status: HOLD_NOT_ASSIGNED

⸻

RECEIVER 008

receiver_id: recv_vnd_thanhtamphat_acb
status: ACTIVE_CONFIRMED
currency: VND
channel_type: bank_qr
entity_type: company
display_name: Công ty TNHH ĐTTM Thanh Tam Phat
legal_name_visible: CTY TNHH DTTM THANH TAM PHAT
bank_name: Ngân hàng TMCP Á Châu (ACB)
account_number: 369999996
branch: ACB - CN TP. Hồ Chí Minh
swift_code: ASCBVNVX
country: VN
source_note: Ảnh QR ghi VND
default_for_domains:

* chưa gán
  assignment_status: HOLD_NOT_ASSIGNED

⸻

RECEIVER 009

receiver_id: recv_vnd_thailam_acb
status: ACTIVE_CONFIRMED
currency: VND
channel_type: bank_qr
entity_type: company
display_name: Công ty TNHH SX - TM - DV Thai Lam
legal_name_visible: CONG TY TNHH SX - TM - DV THAI LAM
bank_name: Ngân hàng TMCP Á Châu (ACB)
account_number: 43545878
branch: ACB - CN Lâm Đồng
swift_code: ASCBVNVX
country: VN
source_note: Ảnh QR VietQR ACB
default_for_domains:

* chưa gán
  assignment_status: HOLD_NOT_ASSIGNED

⸻

RECEIVER 010

receiver_id: recv_vnd_vietcan_acb
status: ACTIVE_CONFIRMED
currency: VND
channel_type: bank_qr
entity_type: company
display_name: Công ty Cổ phần Giải Trí Ngôi Sao Việt Can
legal_name_visible: CTY CO PHAN GIAI TRI NGOI SAO VIET CAN
bank_name: Ngân hàng TMCP Á Châu (ACB)
account_number: 12381278
branch: ACB - PGD Cống Quỳnh
swift_code: ASCBVNVX
country: VN
source_note: Ảnh QR VietQR ACB
default_for_domains:

* chưa gán
  assignment_status: HOLD_NOT_ASSIGNED

⸻

RECEIVER 011

receiver_id: recv_paypal_angeledutam_foundation
status: NEEDS_QR_SCAN_CONFIRMATION
currency: USD
channel_type: paypal_managed_qr
entity_type: organization
display_name: Angel Edu Tam Foundation Inc
paypal_username: @AngelEduTamFoundationInc
paypal_me_base: https://paypal.me/AngelEduTamFoundationInc
paypal_qr_resolved_url: https://www.paypal.com/qrcodes/managed/58701733-ae17-418e-bcf9-a31418519f3a?utm_source=old_merchant_lp
country: US
source_note: Đã scan QR trước đó, cần xác nhận màn hình nhận tiền / owner trước khi gán live
default_for_domains:

* chưa gán
  assignment_status: HOLD_NOT_ASSIGNED

⸻

RECEIVER 012

receiver_id: recv_usd_angeledutam_foundation_relay_thread
status: ACTIVE_CONFIRMED
currency: USD
channel_type: us_bank_account
entity_type: organization
display_name: Angel Edu Tam Foundation Inc
legal_name: Angel Edu Tam Foundation Inc
bank_provider: Relay Financial
bank_name: Thread Bank
account_number: 200001161269
routing_number: 064209588
bank_address: 210 E Main St, Rogersville, TN 37857
country: US
source_note: Founder-provided Relay account details from app.relayfi.com screenshots, cross-checked against Relay documentation for account/routing sharing and Thread Bank address.
supported_receiving_rails:

* US ACH
* US domestic wire
* US check deposit details if Relay account supports it
* international USD wire only after Relay SWIFT details are separately activated and copied from Relay dashboard

relay_rules:

* payee name must match Angel Edu Tam Foundation Inc or another name accepted in Relay
* bank name is Thread Bank if payer asks for bank name
* bank address is Thread Bank partner-bank address above if payer asks
* do not infer SWIFT/BIC from ACH routing number
* do not use this receiver for non-USD international wire details until Relay dashboard provides the exact SWIFT receiving details

default_for_domains:

* chưa gán
  assignment_status: HOLD_NOT_ASSIGNED

public_render_status: INTERNAL_ONLY_UNTIL_FOUNDER_ASSIGNMENT

⸻

5. DUPLICATE / NORMALIZATION NOTES

Duplicate found

Ảnh tài khoản:

* CTY CO PHAN DAU TU VIET UC TOAN CAU
* account 20153108

xuất hiện lặp lại.

Registry chỉ giữ một receiver duy nhất:

* recv_vnd_vietuc_toancau_acb

⸻

6. CURRENT DOMAIN ASSIGNMENT MAP

ACTIVE NOW

tranhatam.com

primary_vnd_receiver: recv_vnd_personal_tranhatam_acb
fallback_vnd_receiver: recv_vnd_personal_tranhatam_vcb
primary_usd_receiver: recv_usd_personal_tranhatam_paypal

All other domains

status: NOT_ASSIGNED_YET
rule: wait for founder instruction

⸻

7. DEV IMPLEMENTATION RULE

7.1 No hard-coded account details

Team dev không được hard-code:

* số tài khoản
* tên chủ tài khoản
* QR image URL
* PayPal email
* PayPal link

trực tiếp trong page/component.

Tất cả phải đi qua:

* receiver registry
* domain assignment map
* payment routing layer của pay.iai.one

⸻

7.2 Receiver resolution flow

website/domain
→ assignment map
→ receiver_id
→ payment channel config
→ render payment block

⸻

7.3 Required output per receiver

Mỗi receiver khi render phải có đủ:

* receiver title
* currency
* payment method type
* account holder name
* bank name
* account number
* branch if available
* swift if available
* QR image if available
* copy account button
* verified status
* source note (internal only)

⸻

8. RECOMMENDED DATA STRUCTURE FOR DEV

8.1 receivers.json

```json
{
  "receivers": [
    {
      "receiver_id": "recv_vnd_personal_tranhatam_acb",
      "status": "ACTIVE_CONFIRMED",
      "currency": "VND",
      "channel_type": "bank_qr",
      "entity_type": "personal",
      "display_name": "Trần Hà Tâm",
      "legal_name": "TRAN HA TAM",
      "bank_name": "ACB",
      "account_number": "27588277",
      "branch": null,
      "swift_code": null,
      "country": "VN"
    },
    {
      "receiver_id": "recv_usd_personal_tranhatam_paypal",
      "status": "ACTIVE_CONFIRMED",
      "currency": "USD",
      "channel_type": "paypal_email",
      "entity_type": "personal",
      "display_name": "Trần Hà Tâm",
      "paypal_email": "tranhatam@gmail.com",
      "country": "US"
    }
  ]
}
```

⸻

8.2 domain-payment-map.json

```json
{
  "tranhatam.com": {
    "primary_vnd_receiver": "recv_vnd_personal_tranhatam_acb",
    "fallback_vnd_receiver": "recv_vnd_personal_tranhatam_vcb",
    "primary_usd_receiver": "recv_usd_personal_tranhatam_paypal"
  }
}
```

⸻

9. RENDER RULE FOR pay.iai.one

If website asks for VND

* render assigned VND receiver
* if multiple VND receivers exist, show primary first, fallback second

If website asks for USD

* render assigned USD receiver
* if PayPal is assigned, show PayPal first
* if USD bank receiver is later assigned, show based on founder rule

⸻

10. UI RULE

For every payment block, show:

Public visible

* Payment method
* Currency
* Account holder
* Bank / Provider
* Account number or PayPal target
* QR
* Copy button
* Short instruction

Internal only

* receiver_id
* status
* source_note
* verification state
* update timestamp

⸻

11. REQUIRED VERIFICATION BEFORE PUBLIC LIVE

Những receiver sau chưa nên public full-scale nếu chưa xác nhận thêm:

Needs verification

* recv_vnd_hanhtrinh_company_acb
  * tên pháp lý đang bị cắt
* recv_paypal_angeledutam_foundation
  * cần xác nhận màn hình owner/receiver thực tế

⸻

12. FOUNDER CONTROL RULE

Mọi domain mới muốn nhận tiền phải được gán bằng:

domain
→ currency
→ receiver_id
→ priority order

Không được để team dev tự chọn receiver theo suy đoán.

⸻

13. CURRENT OPERATIONAL INSTRUCTION FOR TEAM DEV

Implement now

1. tạo receiver registry
2. tạo domain assignment map
3. build pay.iai.one receiver resolver
4. build reusable payment block component
5. gán tranhatam.com theo map đã chốt
6. giữ các receiver còn lại ở trạng thái hold_not_assigned

⸻

14. ONE-LINE SUMMARY FOR TEAM

Tất cả web trong hệ phải nhận tiền qua receiver registry tập trung; hiện chỉ tranhatam.com đã được chốt map chính thức.

⸻

15. FOUNDER NOTES

Already assigned now

* tranhatam.com
  * VND → Trần Hà Tâm cá nhân
  * USD → PayPal tranhatam@gmail.com

To assign later

* các domain khác sẽ được founder chỉ định sau

⸻

16. TRANSACTION NOTIFICATION RULE

Tất cả các giao dịch biến động trên web phải thông báo về đúng 3 email theo từng domain.

Chuẩn tối thiểu:

* pay@domain
* billing@domain
* support@domain

Rule vận hành:

* Team Email chịu trách nhiệm send/receive routing
* Team dev phải expose notification targets từ payment routing layer
* Team dev không được hard-code logic mail trực tiếp theo từng page
* mỗi domain phải có đúng triplet notification riêng
* nếu Cloudflare mail binding chưa khóa xong, trạng thái phải ghi rõ là pending external email-team binding

`noreply@domain` là sender/supporting identity nếu cần, nhưng không thay thế triplet notification bắt buộc ở trên.

⸻

17. DYNAMIC VND QR RULE

Đối với receiver `bank_qr` bằng VND, team dev phải hỗ trợ tạo QR động theo:

* domain
* amount
* package_code hoặc reference
* assigned receiver

Không được dùng cùng một QR tĩnh cho mọi gói khác nhau nếu web cần amount-specific checkout.

Chuẩn repo-side hiện hành:

* tạo quick link VietQR theo receiver đã gán
* nhúng `amount`
* nhúng `addInfo` ngắn, sạch, không chứa ký tự rác
* trả lại cả account info để copy thủ công nếu QR fail

Nếu receiver chưa có founder-approved assignment cho domain đó, không được tự generate QR live.

⸻

18. PAY API CONTRACT FOR TEAM DEV

Repo-side `pay` phải có tối thiểu:

* receiver registry snapshot API
* payment routing resolver API
* domain + country + currency + amount input
* output trả về:
  * resolved currency
  * primary receiver
  * fallback receiver nếu có
  * quick link QR nếu hỗ trợ
  * transaction notification triplet
  * assignment status

Nếu domain chưa được founder gán receiver:

* API phải trả `NOT_ASSIGNED_YET`
* không tự suy đoán receiver

⸻

19. FINAL DIRECTION

Registry này là lớp điều phối nhận tiền tập trung cho toàn hệ.

Từ thời điểm này:

* domain nào chưa có assignment thì chưa được live payment receiver
* domain nào đã có assignment thì phải đi qua pay.iai.one routing layer
* mọi thay đổi receiver phải cập nhật ở registry này trước

Đó là chuẩn receiver master registry đúng cho pay.iai.one.
