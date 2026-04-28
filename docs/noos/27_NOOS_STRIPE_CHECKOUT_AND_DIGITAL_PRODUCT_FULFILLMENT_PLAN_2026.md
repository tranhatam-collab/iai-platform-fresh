# 27_NOOS_STRIPE_CHECKOUT_AND_DIGITAL_PRODUCT_FULFILLMENT_PLAN_2026

# NOOS STRIPE CHECKOUT AND DIGITAL PRODUCT FULFILLMENT PLAN
## Version 1.0
## Status: LOCKED FOR DEV, PRODUCT, OPERATIONS
## Domain: NOOS.iai.one

---

## 1. Muc tieu

Khoa implementation checkout + fulfillment cho digital products theo huong:
- ra nhanh o V1
- mo rong duoc o V2/V3
- khong vo entitlement truth
- khong vo pricing/license truth

Phu thuoc bat buoc:
- `22_NOOS_DIRECT_DOCUMENT_PRODUCTS_AND_PROGRAM_PACKAGING_MASTER_PLAN_2026.md`
- `25_NOOS_PRICING_LADDER_AND_LICENSE_MODEL_2026.md`
- `26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026.md`
- `28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`

---

## 2. Checkout strategy by phase

### Phase 1 (go-live fast)
- Stripe Checkout Sessions hoac Payment Links
- one-time digital product payment
- webhook grant entitlement
- redirect `/checkout-success`

### Phase 2 (catalog growth)
- full Checkout Session per product/bundle
- promotion of mapped upgrade credits
- metadata-rich line items for entitlement mapping

### Phase 3 (team/institutional)
- quote/inquiry flow for org/strategic
- team-license fulfillment paths
- optional invoicing layer

---

## 3. Stripe object model (minimum)

- Product (Stripe) maps to NOOS `product_code`
- Price (Stripe) maps to locked price tier
- Checkout Session carries:
  - `product_code`
  - `license_type`
  - `entitlement_code`
  - `buyer_email`
  - `upgrade_path` (optional)

---

## 4. Webhook contract (locked)

### Required events
- `checkout.session.completed`
- `payment_intent.succeeded` (if used by flow)
- `checkout.session.expired` (optional handling)
- `charge.refunded` (license/access policy dependent)

### On `checkout.session.completed`
1. Validate signature
2. Idempotency check by session id
3. Create order record
4. Create/link buyer account
5. Grant entitlement(s)
6. Send confirmation email
7. Log fulfillment event

---

## 5. Fulfillment mapping

Checkout metadata -> runtime:
- `product_code` -> product table
- `license_type` -> license_record
- `entitlement_code` -> entitlement table
- `price_id` -> order line truth

For bundle purchase (e.g. P11):
- grant parent entitlement (`ENT_MASTER`)
- optionally grant child access projections (read-only links) without duplicating pricing truth

---

## 6. Success and failure UX

### Success page `/checkout-success`
Must show:
- product bought
- license summary
- open library button
- optional immediate download
- update window note

### Failure/retry states
- payment canceled
- webhook delayed
- already fulfilled
- support fallback route

---

## 7. Idempotency and safety

Must-have:
- unique fulfillment key = checkout session id
- no duplicate entitlement grants
- immutable order amount snapshot
- webhook retry-safe handler

---

## 8. Tax/legal display contract

Checkout and product pages must expose:
- digital product terms
- license terms
- tax note by jurisdiction

---

## 9. Upgrade-credit execution

When buyer upgrades on mapped path:
- verify prior eligible purchase window
- compute credit amount by policy in `25`
- apply as checkout adjustment
- write upgrade ledger record
- preserve original entitlement history

---

## 10. Operational runbook minimum

- replay webhook safely
- manually re-grant entitlement with audit log
- investigate missing library access
- handle charge dispute states
- license upgrade support script

---

## 11. Environment and secrets

Required secrets:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLISHABLE_KEY`

Optional:
- `STRIPE_CONNECT_WEBHOOK_SECRET` (future)

Never hardcode keys in client bundles.

---

## 12. Definition of done

Done when:
- buyer pays and gets library access in one flow
- entitlement grant is idempotent
- price/license/entitlement mapping is consistent
- support can resolve fulfillment failures with logs
- upgrade-credit path works for mapped ladder

