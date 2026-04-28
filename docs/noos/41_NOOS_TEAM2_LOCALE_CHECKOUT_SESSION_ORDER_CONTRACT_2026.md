# 41_NOOS_TEAM2_LOCALE_CHECKOUT_SESSION_ORDER_CONTRACT_2026

# NOOS Team 2 Locale Contract for Checkout, Session, and Order
## Version 1.0
## Status: LOCKED FOR TEAM 2 EXECUTION
## Domain: NOOS.iai.one
## Date: 2026-04-15

---

## 1. Mục tiêu

Khóa contract locale ở runtime để:
- checkout không làm mất ngôn ngữ người dùng đang dùng
- success redirect, order record, và library return path giữ đúng locale
- Team 3 và Team 4 có thể build EN/VI surface mà không phải tự vá runtime

Locale là contract runtime.
Không phải chi tiết UI.

---

## 2. Nguồn luật bắt buộc

Team 2 phải bám đồng thời:
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`
- `34_NOOS_BILINGUAL_SEO_AND_LOCALE_EXECUTION_LOCK_2026.md`
- `27_NOOS_STRIPE_CHECKOUT_AND_DIGITAL_PRODUCT_FULFILLMENT_PLAN_2026.md`
- `26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026.md`

---

## 3. Non-negotiable rules

1. Locale public mặc định là `en`.
2. Locale `vi` phải được giữ nguyên xuyên suốt từ checkout surface sang success surface.
3. Locale không được thay đổi product code, pricing, license, entitlement logic, tax logic hay upgrade logic.
4. Nếu thiếu locale hoặc locale không hợp lệ, fallback bắt buộc là `en`.
5. Team 2 không được trả người dùng từ `/vi/...` sang `/en/...` sau thanh toán trừ khi locale input không hợp lệ.

---

## 4. Canonical locale fields

### 4.1 Allowed values
- `locale`: `en | vi`
- `default_locale`: `en`
- `supported_locales`: `["en","vi"]`

### 4.2 Checkout/session/order fields

#### Checkout request or session creation input
- `locale`
- `return_path`
- `success_path`
- `cancel_path` (neu co)

#### Checkout Session metadata (locked minimum)
- `product_code`
- `license_type`
- `entitlement_code`
- `buyer_email`
- `locale`
- `return_locale`
- `success_path`

#### Order record (locked minimum)
- `order_id`
- `buyer_id`
- `product_code`
- `license_type`
- `amount_snapshot_usd`
- `checkout_session_id`
- `status`
- `purchased_at`
- `locale`
- `success_path`

#### Buyer account / profile (if present)
- `preferred_locale`

---

## 5. Runtime behavior contract

### 5.1 Checkout create

Neu buyer bat dau tu:
- `/en/checkout` -> Team 2 phai gan `locale = en`
- `/vi/checkout` -> Team 2 phai gan `locale = vi`

Team 2 khong duoc doan locale bang IP.
Locale phai di tu surface input va duoc validate.

### 5.2 Success redirect

Sau khi fulfillment xong:
- session tao tu `en` phai quay ve `/en/checkout-success`
- session tao tu `vi` phai quay ve `/vi/checkout-success`

### 5.3 Library return path

Sau success:
- button/library handoff phai quay ve locale cung he
- `vi` buyer phai vao `/vi/library`
- `en` buyer phai vao `/en/library`

### 5.4 Support / replay / recovery

Neu support replay webhook hoac re-grant entitlement:
- khong duoc lam mat `locale`
- order record va success path phai tiep tuc tra ve locale goc

---

## 6. Fallback rules

### Valid locale
- `en`
- `vi`

### Invalid / missing locale
- fallback ve `en`
- log `locale_fallback_applied = true`
- khong crash checkout flow

### Missing success path
- build tu `/${locale}/checkout-success`

### Missing library path
- build tu `/${locale}/library`

---

## 7. Webhook and idempotency notes

Webhook khong phai noi tu suy doan locale moi.
Webhook phai doc locale tu session/order truth da ton tai.

Idempotency replay phai giu nguyen:
- `locale`
- `success_path`
- `return_locale`

No duplicate fulfillment va no locale drift.

---

## 8. Integration checkpoints

### Checkpoint A - Team 3 -> Team 2
- POST tu `/en/checkout` tao session locale `en`
- POST tu `/vi/checkout` tao session locale `vi`

### Checkpoint B - Team 2 -> Team 3
- redirect sau thanh toan dung locale path
- success payload render dung locale path

### Checkpoint C - Team 2 -> Team 4
- funnel/reporting phai tach duoc `en` va `vi`
- khong tron data quoc te va Vietnam/local khi route locale khac nhau

---

## 9. Logging and observability

Moi runtime event trong chain checkout -> order -> entitlement nen co:
- `locale`
- `surface`
- `success_path`
- `buyer_id`
- `product_code`
- `checkout_session_id`

Log nay giup Team 2 va Team 4 debug locale drift ma khong phai doan tu UI.

---

## 10. Definition of done

Team 2 dat chuan khi:
- checkout tao session dung locale
- order record luu locale dung
- success redirect ve dung locale
- library return path dung locale
- webhook replay khong lam mat locale
- invalid locale fallback ve `en`
- Team 3 co the test duong `/en/...` va `/vi/...` ma khong phai tu patch runtime

---

## 11. Câu chốt

Trong NOOS, locale không phải là lớp chữ.
Locale là một phần của contract giữa checkout, order, entitlement, success, và library.
