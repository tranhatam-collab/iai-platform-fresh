# PAY_IAI_ONE_WALLET_AND_SETTLEMENT_PHASE_PLAN_2026
## Phased plan for `pay.iai.one`
## Version 1.0
## Status: LOCKED FOR TEAM 1 / TEAM PAY / TEAM 2 / OPS
## Scope: `pay.iai.one`
## Date: 2026-04-16

---

## 1. Why this file exists

`pay.iai.one` không được mô tả mơ hồ như:
- một trang checkout nhỏ
- một billing page phụ
- một "ý tưởng ví" chưa rõ role

Nó phải được khóa ngay từ đầu thành:
- secure payment intake surface
- wallet and balance surface
- payout and settlement control surface
- finance operations surface có audit, approval, và rollback rõ ràng

File này tồn tại để Team dev và AI có thể build đồng hành theo từng giai đoạn mà không tự đoán.

---

## 2. Absolute role of `pay.iai.one`

`pay.iai.one` là:
- payment intake surface
- wallet account surface
- balance / ledger / payout control surface
- finance operations and settlement surface

`pay.iai.one` không phải:
- một promise "ngân hàng số đầy đủ" trước khi hạ tầng và compliance sẵn sàng
- một shadow system đi riêng khỏi shared auth/proof/audit contracts
- một page nhận tiền thủ công không có ledger và approval truth
- một crypto gateway mở từng phần mà không có custody/security gate riêng

Hard rule:
- giai đoạn đầu cho phép `VND` và `USD`
- nhận tiền qua thẻ, cổng thanh toán, email, số tài khoản, QR cá nhân/doanh nghiệp có ghi nhận rõ ràng
- payout tự động qua API chỉ được mở sau khi có admin verification, audit, và release gate riêng
- crypto intake/payout là phase sau, không được xem là default V1

---

## 3. Product outcome by stage

### Phase 0 - Governance and security truth
Mục tiêu:
- khóa vai trò domain
- khóa auth, audit, approval, và rollback rules
- khóa ledger truth
- khóa currency model V1

Bắt buộc:
- shared identity + session
- step-up auth cho finance-sensitive actions
- admin approval flow
- immutable ledger or append-only event truth
- payment/payout status model
- receipt and evidence model
- incident and rollback model

Chưa mở:
- auto payout
- crypto
- public self-serve global wallet marketing

### Phase 1 - Assisted payment intake (`VND`, `USD`)
Mục tiêu:
- mở luồng nhận tiền thực tế an toàn
- cho phép user mở account/pay record
- có admin confirmation lane

Cho phép:
- payment instructions via email
- personal/business bank account rails
- QR transfer rails
- card/gateway links nếu đã có provider thật
- manual or operator-assisted verification
- payment status tracking
- payment receipt

Bắt buộc:
- account creation
- payment intent record
- transfer proof upload/reference
- admin review queue
- verified / pending / failed / rejected statuses
- audit for every finance action

### Phase 2 - Wallet account and ledger truth
Mục tiêu:
- không chỉ nhận tiền, mà có wallet account thật

Mở thêm:
- user wallet summary
- balances by currency
- pending / held / cleared states
- transaction history
- invoice / receipt archive
- operator reconciliation views

Bắt buộc:
- double-entry or equivalent auditable ledger model
- balance derivation không được tính từ UI only
- reconciliation process
- dispute / mismatch handling

### Phase 3 - Controlled payout and settlement APIs
Mục tiêu:
- payout có thể được xử lý nhanh hơn, nhưng vẫn dưới gate admin

Mở thêm:
- payout request objects
- payout approval queue
- payout API connectors
- settlement batch logs
- payout receipts

Hard rule:
- payout API chỉ được chạy sau admin verification
- high-risk payout can dual approval nếu cần
- không có blind auto-release

### Phase 4 - Multi-user finance operations platform
Mục tiêu:
- nhiều người dùng mở account, thanh toán, theo dõi lịch sử và vận hành như một wallet/payment surface thật

Mở thêm:
- role-based accounts
- organization accounts
- finance notifications
- statement exports
- support and dispute workflows
- limits / holds / fraud flags

### Phase 5 - Cross-border and crypto expansion
Mục tiêu:
- mở rộng quốc gia và tài sản số sau khi finance core ổn định

Chỉ mở khi:
- fiat phases ổn định
- security gate riêng cho crypto/custody
- provider/custody model đã khóa
- legal/compliance review đã rõ ràng
- address allowlist / chain support / irreversible-action safeguards đã có

Không được mở crypto sớm hơn chỉ vì "có sẵn ý tưởng ví".

---

## 4. V1 currency and rail model

### V1 currencies
- `VND`
- `USD`

### V1 intake rails
- card payment nếu provider đã ổn
- payment links / gateway rails nếu provider đã ổn
- email-coordinated transfer
- personal bank account transfer
- business bank account transfer
- QR code transfer

### V1 payout rule
- không auto payout public
- chỉ payout qua API sau admin verification
- mỗi payout phải có request -> review -> approve -> execute -> reconcile

---

## 5. Non-negotiable security rules

- shared auth model của IAI
- step-up auth cho:
  - payout approval
  - bank/account changes
  - API payout execution
  - admin overrides
- finance actions phải có audit trail
- không direct DB mutation cho balances
- ledger truth phải là source of truth
- receipts và approvals phải trace được
- secrets/provider keys không được xuất hiện ở public frontend
- rollback phải có owner, blast radius, và communication note
- public payment UI phải dùng:
  - `content/iai-language-codex.md`
  - `content/iai-ui-text-system.md`
  - `content/iai-master-domain-mission-map.md`
  - `content/vi.json`
  - `content/en.json`
  - `content/iai-prompt-system-standard.md`
  - `content/iai-ui-copy-registry.md`
- không được hard-code CTA, status, error tone, hay support wording ngoài package chung

---

## 6. Core objects that must exist

- `payment_account`
- `wallet_account`
- `currency_balance`
- `payment_intent`
- `payment_instruction`
- `payment_receipt`
- `ledger_entry`
- `settlement_batch`
- `payout_request`
- `payout_approval`
- `payout_execution`
- `finance_audit_event`
- `provider_webhook_event`

---

## 7. Minimal route model

### Public / user routes
- `/`
- `/login`
- `/wallet`
- `/wallet/balances`
- `/payments`
- `/payments/:paymentId`
- `/payments/new`
- `/receipts`
- `/payouts`
- `/payouts/:payoutId`
- `/settings/payment-methods`
- `/settings/security`

### Admin / operator routes
- `/ops/review`
- `/ops/payments`
- `/ops/payouts`
- `/ops/reconciliation`
- `/ops/audit`

---

## 8. Phase-by-phase build order for dev + AI

### Step A - Architecture truth
- lock domain role
- lock data model
- lock approval model
- lock statuses
- lock security rules

### Step B - Intake truth
- build payment intents
- build payment instruction rendering
- build proof/reference upload
- build admin review queue
- build receipt generation

### Step C - Wallet truth
- build balances
- build ledger entries
- build transaction history
- build statements

### Step D - Payout truth
- build payout request flow
- build admin approval flow
- build provider execution abstraction
- build reconciliation and rollback handling

### Step E - Expansion truth
- multi-user / organization accounts
- limits / holds / alerts
- cross-border rails
- crypto lane only after separate gate

---

## 9. Required evidence before each phase opens

### Before Phase 1
- auth/session works
- admin review works
- payment intent + receipt model works
- audit works

### Before Phase 2
- ledger truth works
- balances are derived correctly
- reconciliation works

### Before Phase 3
- payout approvals work
- rollback note exists
- provider execution logs work
- deny/failure paths are tested

### Before Phase 4
- organization/account roles work
- support/dispute ops work
- rate limits and abuse controls work

### Before Phase 5
- separate crypto security plan exists
- custody and chain model exist
- irreversible-action safeguards exist

---

## 10. Hard stop rules

- không mở auto payout nếu admin verification chưa có thật
- không mở multi-currency marketing nếu ledger chưa support đúng
- không mở crypto nếu fiat core chưa ổn định
- không để user thấy "balance" nếu không truy vết được ledger truth
- không để finance support xử lý bằng tay ngoài audit path

---

## 11. Team split

### Team Pay / Team 2 runtime lane
- auth/session
- ledger
- provider abstraction
- payout execution
- webhooks
- audit

### Team 1
- governance
- deploy/release gate
- risk and decision control

### Ops / Finance support
- review queue
- reconciliation
- payout approval
- incident handling

---

## 12. Definition of done for this plan

File này đạt giá trị khi:
- team dev thấy rõ build order
- AI không đề xuất build nhảy cóc phase
- `pay.iai.one` được hiểu là một secure finance surface, không phải billing page nhỏ
- security được đặt trước feature expansion

---

## 13. Final directive

`pay.iai.one` phải được xây dựng như:
- secure payment and wallet operations surface

Không được xây dựng như:
- một hộp form checkout + vài bảng thống kê

Và không được hứa:
- global crypto/fiat wallet đầy đủ

trước khi các phase và security gates ở trên đã xanh thật.
