# LEGAL_AND_PAYMENT_STRATEGY_MASTER_ADVISORY_2026.md

**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Founder Review Draft  
**Scope:** Tư vấn chiến lược pháp lý và thanh toán cho toàn bộ hệ sinh thái domain, subdomain, product surfaces và revenue engines

---

## 1. Kết luận điều hành

Sau khi rà lại toàn bộ cấu trúc hệ, hướng đúng nhất không phải là tiếp tục mở thêm domain hay thêm cổng thanh toán rời rạc.  
Hướng đúng là:

1. Tách lane pháp lý thật sạch  
2. Tách lane tiền thật sạch  
3. Dồn mọi logic checkout, invoice, entitlement và verify vào shared core  
4. Chỉ cho phép 3 engine doanh thu đi vào shared core trước:
   - `flow.iai.one`
   - `aiaccountingloop.com`
   - `vc.vetuonglai.com` + `proof.tranhatam.com`

Toàn bộ các surface còn lại phải đóng vai trò:
- trust
- distribution
- pilot network
- real-world evidence
- founder/media funnel
- legal/public-benefit support

---

## 2. Phán quyết pháp lý cấp hệ thống

### 2.1. Không được trộn commercial SaaS với foundation/public-benefit

Từ thời điểm này, phải coi đây là nguyên tắc bắt buộc.

Các surface thương mại như:
- Flow
- AIAccountingLoop
- VC enterprise/API
- software subscriptions
- commercial implementation
- enterprise contracts
- paid creator/member tools

không được:
- public gắn dưới foundation wording
- dùng donation lane
- dùng merchant profile của donation
- dùng cùng disclosure với public-benefit support
- tạo cảm giác là người dùng đang “đóng góp” nhưng thực chất là “mua phần mềm/dịch vụ”

### 2.2. Foundation/public-benefit chỉ làm đúng vai trò

Các surface foundation/public-benefit chỉ được dùng cho:
- donation
- scholarship
- public-benefit support
- community support đúng mục đích
- grant narratives
- philanthropic communications

Foundation/public-benefit surface không được trở thành “vỏ công khai” cho một business SaaS đang bán enterprise.

### 2.3. Việt Nam lane phải được đối xử như một lane riêng

Các dòng tiền:
- VND
- VietQR
- hóa đơn điện tử
- local services
- stay/work/learn/place-based fees
- application/deposit/booking tại Việt Nam

phải đi qua một lane Việt Nam riêng, có:
- thực thể phù hợp
- logic đối soát riêng
- hóa đơn/biên nhận phù hợp
- payment methods phù hợp với khách Việt

### 2.4. Investment không bao giờ là checkout công khai

Nếu sau này có `invest.iai.one`, nó phải là:
- gated legal portal
- application + review
- disclosures riêng
- eligibility gating
- manual/legal approval path

Không được đặt cạnh nút mua ngay.  
Không được trộn với subscription.  
Không được trộn với donation.

---

## 3. 4 lane pháp lý bắt buộc

### Lane A — Global Commercial

**Mục đích:**  
- SaaS toàn cầu
- subscriptions
- enterprise invoices
- API billing
- commercial implementation
- recurring B2B revenue

**Ví dụ domain/surface:**
- `flow.iai.one`
- `aiaccountingloop.com`
- `vc.vetuonglai.com` enterprise
- các product/API global khác

**Yêu cầu:**
- operating commercial entity phù hợp
- merchant onboarding phù hợp
- contracts/invoices đúng lane thương mại
- không dính foundation wording

### Lane B — Donation / Public Benefit

**Mục đích:**  
- donation
- scholarship support
- public benefit
- support for non-commercial programs

**Ví dụ domain/surface:**
- foundation sites
- donate surfaces
- public-benefit campaigns

**Yêu cầu:**
- tách merchant riêng
- tách terms/disclosures riêng
- không đổi lấy lợi ích thương mại
- không share checkout với SaaS

### Lane C — Vietnam Commercial

**Mục đích:**  
- local services
- VND payments
- VietQR
- local membership
- deposits/reservations
- local invoices/records nếu áp dụng

**Ví dụ domain/surface:**
- `omdalat.com`
- `nhachung.org`
- `tramsaigon.com`
- Vietnam lane của founder/expert/education sites
- local lane của AIAccountingLoop nếu có

**Yêu cầu:**
- entity/lane hợp lệ tại Việt Nam
- VietQR / bank transfer / VND logic
- invoice/receipt logic phù hợp

### Lane D — Investment / Capital Gate

**Mục đích:**  
- không public checkout
- chỉ làm legal review, gated capital workflow

**Yêu cầu:**
- review trước
- disclosures riêng
- legal gating riêng
- không dùng trong giai đoạn hiện tại nếu chưa khóa xong 3 lane còn lại

---

## 4. Kiến trúc thanh toán tối ưu nhất

### 4.1. Payment Operating System

Toàn hệ phải đi theo mô hình:

**All sites → `pay.iai.one` → lane selection → provider / invoice / review flow**

#### `pay.iai.one`
Vai trò:
- payment control plane
- checkout orchestration
- lane router
- provider selector
- canonical payment session creator

#### `invoice.iai.one`
Vai trò:
- invoice plane
- quote
- invoice state
- collections
- webhook audit
- entitlement callback
- enterprise payment lifecycle

#### Không site nào được:
- tự nhúng logic provider chính
- tự giữ webhook riêng nếu không có founder directive
- tự định nghĩa lane riêng
- tự quyết invoice behavior khác core

### 4.2. Các phương thức thanh toán nên dùng

#### Global Commercial lane
- Stripe làm primary
- PayPal Business làm fallback
- invoice lane cho enterprise

#### Vietnam Commercial lane
- VietQR/NAPAS làm primary
- bank transfer hỗ trợ đối soát
- PayPal/Stripe chỉ là phụ theo trường hợp phù hợp

#### Donation lane
- donation flow riêng
- merchant profile riêng
- copy riêng
- receipt/disclosure riêng

#### Investment lane
- gated only
- không checkout công khai

---

## 5. Quy tắc thanh toán bắt buộc

1. Không mở quyền theo redirect success  
   Chỉ mở quyền sau webhook/payment confirmation.

2. Không share merchant profile giữa commercial và donation  
   Tuyệt đối tách.

3. Không share legal copy giữa commercial, donation và investment  
   Mỗi lane có disclosure riêng.

4. Không site nào tự tạo pricing logic độc lập  
   Tất cả pricing phải đi qua catalog chung.

5. Không tự triển khai payment mới nếu chưa có founder directive  
   Mọi change payment là controlled change.

---

## 6. Shared Core bắt buộc phải có

### 6.1. Identity Core
Một graph người dùng chung:
- login authority
- consent
- org roles
- product access
- team roles

### 6.2. Payment Core
Một nơi tạo checkout, invoice, deposit, donation và invest review flow.

### 6.3. Invoice Core
Một nơi quản lý:
- quote
- invoice
- due state
- paid state
- reminder state
- collection notes
- webhook events

### 6.4. Trust / Verify Core
Một nơi chuẩn hóa:
- issuer
- subject
- proof record
- VC record
- NFT/provenance record
- verify state
- disclosure state
- revoke/expire/status

### 6.5. Legal / Disclosure Core
Một nơi chuẩn hóa:
- terms version
- privacy version
- legal lane by domain
- entity owner by surface
- donation/commercial boundary
- investment restrictions
- public disclosure policy

### 6.6. Domain Governance Registry
Một nơi giữ:
- domain owner team
- subdomain owner team
- allowed integrations
- allowed payment methods
- allowed data role
- release approver
- emergency contact
- founder escalation path

---

## 7. 3 engine doanh thu bắt buộc onboard trước

### 7.1. Flow
Flow chỉ được scale sau khi:
- auth vào identity core
- payment vào payment core
- pricing đi qua catalog chung
- runtime truth tách khỏi preview/demo
- logs và evidence nối về shared core

### 7.2. AIAccountingLoop
AIAccountingLoop phải làm 4 việc ngay:
1. bỏ mọi public mapping sai giữa commercial SaaS và foundation
2. nối payment/invoice vào core
3. chuẩn hóa country pack activation
4. khóa enterprise/commercial lane thật rõ

### 7.3. VC + Proof
VC/Proof là trust stack bán được đầu tiên.

Phải làm:
- issuer registry chung
- verify schema chung
- payment → entitlement → issuance flow chung
- enterprise issuance lane rõ
- bridge sang provenance/NFT chỉ ở lớp sau

---

## 8. Vai trò của OMDALA + OMDALAT + Nhà Chung

Cụm này không phải revenue engine chính giai đoạn đầu.  
Cụm này là evidence network.

Phải dùng để tạo:
- verified commitments
- verified participation
- verified activities
- verified outcomes
- case studies có proof
- real-world signals cho Flow + VC + Proof

### OMDALA
- coordination evidence
- trust actions
- commitments
- verified outcome paths

### OMDALAT
- stay/work/learn event records
- local participation records
- local proof of engagement

### Nhà Chung
- member graph
- role graph
- contribution graph
- verified participation and access graph

---

## 9. Có nên nâng `trust.iai.one` ngay không?

Có. Nhưng chỉ theo đúng vai.

`trust.iai.one` phải trở thành Operational Trust Surface chính thức của toàn hệ.  
Không phải constitutional root.  
Không phải home portal.  
Không phải app.  
Không phải dev portal.  
Không phải verify product chính.  
Không phải proof tool.  
Không phải NFT gateway.

### 9.1. Vai trò chuẩn của `trust.iai.one`

#### Tầng 1 — Official Trust Directory
Công bố:
- domain chính thức
- subdomain chính thức
- team phụ trách
- legal lane áp dụng
- official channels
- official support/report/security channels
- kênh nào không bao giờ dùng
- founder verification methods
- org verification methods
- issuer verification methods

#### Tầng 2 — Trust Page Builder + Publisher
Giữ builder hiện có, nhưng đặt thành module trong trust surface:
- create trust pages
- export static HTML
- publish privacy-first
- official links
- verification methods
- security/report methods

#### Tầng 3 — Trust Operations
Thêm:
- official issuer registry
- official product registry
- trust policies
- abuse / impersonation report
- disclosure center
- verify bridge sang VC/Proof/NFT
- public trust status for trust-critical surfaces

### 9.2. `trust.iai.one` không được làm gì

Không được:
- thay `iai.one` làm constitutional root
- thay `home.iai.one` làm portal router
- thay `app.iai.one` làm app surface
- thay `developer.iai.one` làm dev portal
- thay `vc.vetuonglai.com` làm verify product
- thay `proof.tranhatam.com` làm proof tool
- trở thành siêu cổng nhồi mọi thứ

### 9.3. MVP 1 bắt buộc cho `trust.iai.one`

Phải có đúng 7 mục:
1. Official Domains
2. Official Teams
3. Official Channels
4. Verification Methods
5. `/go/*` Short Links
6. Report & Impersonation
7. Trust Page Builder

### MVP 2 sau đó
- issuer registry
- product registry
- trust status board
- founder trust profile
- org trust profiles
- machine-readable trust manifest
- bridge sang VC/Proof/NFT

---

## 10. Chiến lược thực thi 4 sprint

### Sprint 1 — 7 ngày
**Mục tiêu:** đóng băng hỗn loạn

Phải làm:
- freeze domain logic mới
- freeze payment integrations riêng
- freeze auth flows riêng
- freeze public pricing ngoài 3 engine
- lập domain map
- lập legal lane map
- lập data role map
- lập status map
- lập routing map

**Deliverable:**
- inventory sống
- routing map sống
- change-control map sống

### Sprint 2 — 14 ngày
**Mục tiêu:** dựng shared core

Phải dựng:
- identity core
- payment core
- invoice core
- trust core
- legal core
- domain governance registry

**Deliverable:**
- services chạy được
- interfaces rõ
- owner rõ
- release path rõ

### Sprint 3 — 21 ngày
**Mục tiêu:** onboard 3 engine doanh thu

Phải onboard:
- Flow
- AIAccountingLoop
- VC/Proof

**Deliverable:**
- 3 engine dùng shared core
- pricing/payment hợp nhất
- legal posture đúng
- verify/payment/invoice lanes rõ

### Sprint 4 — 30 ngày
**Mục tiêu:** biến OMDALA + OMDALAT + Nhà Chung thành evidence network

Phải xong:
- verified commitments
- verified actions
- verified outcomes
- member/activity graph
- case-study-ready evidence

**Deliverable:**
- cụm real-world bắt đầu tạo proof cho toàn hệ

---

## 11. Điều kiện mới được làm brand toàn cầu

Chỉ được chuyển sang global brand phase khi đủ:
1. legal map đã khóa
2. payment map đã khóa
3. `pay.iai.one` chạy ổn
4. `invoice.iai.one` chạy ổn
5. 3 engine đã onboard shared core
6. `trust.iai.one` MVP 1 live đúng vai
7. commercial và foundation đã tách wording công khai

Nếu chưa đủ 7 điều kiện này, không được chuyển trọng tâm sang global branding.

---

## 12. Chỉ đạo vận hành cấp founder

Từ bây giờ:
- không mở thêm domain logic mới
- không mở thêm pricing lane mới
- không tự ý thêm payment provider
- không tự ý công bố legal wording mới
- không được dùng foundation để bọc SaaS thương mại
- không được biến `trust.iai.one` thành super-site
- không làm brand toàn cầu trước khi xong 4 sprint

---

## 13. Founder Directive gợi ý để ban hành ngay

“Từ bây giờ, mọi nguồn lực dev ưu tiên số 1 cho shared core, legal separation, payment/invoice stabilization, và onboarding 3 engine doanh thu: Flow, AIAccountingLoop, VC/Proof. Không mở thêm domain logic mới trước khi trust core và control plane sống ổn. `trust.iai.one` được nâng ngay thành Operational Trust Surface chính thức của toàn hệ, triển khai MVP 1 với 7 mục, nhưng không được chồng vai với `iai.one`, `home.iai.one`, `app.iai.one`, `developer.iai.one`, `flow.iai.one`, `vc.vetuonglai.com`, `proof.tranhatam.com` hay `nft.iai.one`. Global brand phase chỉ bắt đầu sau khi hoàn tất 4 sprint và đạt đủ điều kiện chuyển pha.”

---

## 14. Kết luận cuối cùng

Hệ của anh có cửa rất lớn nếu làm đúng một nguyên tắc:

**Portfolio rộng, lane ít, core rất chặt.**

Không phải mở thêm nhiều site.  
Không phải thêm nhiều cổng thanh toán.  
Không phải đẩy brand toàn cầu ngay.

Việc đúng là:
- khóa pháp lý
- khóa lane tiền
- khóa shared core
- khóa 3 revenue engines
- nâng `trust.iai.one` đúng vai
- biến OMDALA/OMDALAT/Nhà Chung thành real-world evidence network
- rồi mới scale brand toàn cầu
