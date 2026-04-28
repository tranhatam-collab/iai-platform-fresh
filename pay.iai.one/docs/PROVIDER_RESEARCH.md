# Domestic Provider Research

## Recommendation

For the fastest and safest domestic launch, build `pay.iai.one` as a provider-agnostic orchestration layer and connect providers in this order:

1. `payOS`
2. `MoMo`
3. `ZaloPay`
4. `VNPay`

This gives the ecosystem broad domestic coverage without locking every site to one provider-specific integration.

## Why This Order

### payOS

- good launch candidate for payment links, return URL, cancel URL, and webhook-driven status handling
- useful for bank transfer and VietQR-first domestic checkout
- fits a central orchestration layer well

Official docs:

- https://payos.vn/docs/du-lieu-tra-ve/return-url
- https://payos.vn/docs/downloads/

Expected credentials:

- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`

### MoMo

- mature API surface for payment creation, idempotency, refund, and subscription flows
- covers wallet-driven checkout and broader local method expansion

Official docs:

- https://developers.momo.vn/v3/docs/payment/api/result-handling/resultcode/
- https://developers.momo.vn/v3/docs/payment/api/payment-api/refund/
- https://developers.momo.vn/v3/docs/payment/api/wallet/subscription/

Expected credentials:

- `MOMO_PARTNER_CODE`
- `MOMO_ACCESS_KEY`
- `MOMO_SECRET_KEY`

### ZaloPay

- useful local wallet brand
- callback plus order-query model is good for reconciliation
- refund and query support make it workable inside a central gateway

Official docs:

- https://docs.zalopay.vn/docs/specs/order-query/
- https://docs.zalopay.vn/downloads/api/ZaloPay-APIs-Integration-Document.pdf

Expected credentials:

- `ZALOPAY_APP_ID`
- `ZALOPAY_KEY1`
- `ZALOPAY_KEY2`

### VNPay

- wide merchant familiarity and strong local banking and QR coverage
- useful for ATM, internet banking, and QR rails
- return URL and IPN handling need careful verification logic

Official docs:

- https://sandbox.vnpayment.vn/apis/docs/bang-ma-loi/
- https://sandbox.vnpayment.vn/apis/docs/open/opencart2/

Expected credentials:

- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`

## Architectural Decision

Do not make each site talk directly to each provider.

Instead:

1. Every IAI site calls `pay.iai.one`.
2. `pay.iai.one` chooses the provider and creates the hosted checkout.
3. Provider callbacks hit `pay.iai.one`.
4. `pay.iai.one` normalizes status and emits one internal event model for the whole ecosystem.

## Later International Additions

- `PayPal`
- `Stripe`

These should be phase 2 after domestic launch and domestic reconciliation are stable.
