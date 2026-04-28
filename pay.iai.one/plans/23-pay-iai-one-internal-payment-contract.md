# pay.iai.one internal payment contract

Status: active
Owner: pay.iai.one
Contract version: 2026-04-15

## Why this exists

`pay.iai.one` is live, but downstream teams should not keep guessing the contract from `health` output or provider-specific implementation details.

This file defines the internal contract that consumer sites can rely on today.

## Live truth today

Live now:

- `GET /health`
- `GET /v1/providers`
- `POST /internal/checkout-session`
- `GET /v1/payments/:internal_order_id`
- `GET /docs`
- `GET /openapi.json`

Not live yet:

- downstream webhook delivery from `pay.iai.one` to consumer sites
- subscription lifecycle orchestration
- public provider-agnostic recurring billing
- monthly USD contract for `lamviecmuonnoi.com`

## Current live constraints

- provider: `payos` only
- currency: `VND` only
- billing cycle: `one_time` only
- `x-idempotency-key` required
- `x-site-key` required

This is a real limitation of the current live system, not a documentation shortcut.

## Checkout request

Endpoint:

```txt
POST /internal/checkout-session
```

Headers:

```txt
content-type: application/json
x-idempotency-key: required
x-site-key: required
```

Body:

```json
{
  "tenant_code": "lamviecmuonnoi",
  "site_code": "lamviecmuonnoi",
  "internal_order_id": "ord_20260415_001",
  "provider": "payos",
  "plan_code": "starter",
  "amount": 3000,
  "currency": "VND",
  "billing_cycle": "one_time",
  "success_url": "https://lamviecmuonnoi.com/checkout/success",
  "cancel_url": "https://lamviecmuonnoi.com/pricing",
  "callback_url": "https://api.lamviecmuonnoi.com/payments/webhook/iai-pay",
  "user_id": "user_123",
  "email": "user@example.com",
  "full_name": "Nguyen Lan Anh",
  "locale": "vi",
  "ref_code": "abc123",
  "metadata": {
    "source": "lamviecmuonnoi-web"
  }
}
```

## Checkout response

Success:

```json
{
  "ok": true,
  "success": true,
  "contract_version": "2026-04-15",
  "provider": "payos",
  "payment_session_id": "pi_xxx",
  "internal_order_id": "ord_20260415_001",
  "checkout_url": "https://pay.payos.vn/web/...",
  "expires_at": null,
  "amount": 3000,
  "currency": "VND",
  "status": "PENDING",
  "provider_order_id": "1234567890123",
  "provider_payment_id": "plink_xxx",
  "persistence": {
    "payment_intent_id": "pi_xxx",
    "internal_order_id": "ord_20260415_001",
    "tenant_code": "lamviecmuonnoi",
    "site_code": "lamviecmuonnoi"
  }
}
```

Provider not ready:

```json
{
  "ok": false,
  "success": false,
  "contract_version": "2026-04-15",
  "provider": "payos",
  "payment_session_id": "pi_xxx",
  "internal_order_id": "ord_20260415_001",
  "checkout_url": null,
  "expires_at": null,
  "amount": 3000,
  "currency": "VND",
  "status": "PAYOS_ENV_MISSING",
  "provider_order_id": null,
  "provider_payment_id": null,
  "persistence": {
    "payment_intent_id": "pi_xxx",
    "internal_order_id": "ord_20260415_001",
    "tenant_code": "lamviecmuonnoi",
    "site_code": "lamviecmuonnoi"
  },
  "code": "PAYOS_ENV_MISSING",
  "message": "payOS credentials are missing."
}
```

## Payment lookup

Endpoint:

```txt
GET /v1/payments/:internal_order_id
```

Purpose:

- inspect persistence
- inspect attempts
- inspect provider events
- support evidence gathering before downstream webhook contract is live

## Internal auth

`x-site-key` is now mandatory on `POST /internal/checkout-session`.

- the raw key is never stored in D1
- `pay.iai.one` stores only `sha256` of the key in `service_api_keys.key_hash`
- the key must belong to the exact `tenant_code` and `site_code`
- the key must include scope `internal:checkout-session:create`

## Event contract status

These event names are reserved and should be treated as planned only:

- `payment.succeeded`
- `payment.failed`
- `subscription.activated`
- `subscription.cancelled`
- `subscription.expired`
- `refund.created`

Do not integrate against these as live outbound webhooks yet.

## lamviecmuonnoi.com impact

`lamviecmuonnoi.com` currently runs a real Stripe subscription flow. That means a direct swap to `pay.iai.one` is not a one-line endpoint change.

Before touching `lamviecmuonnoi.com`, one of these must happen:

1. `pay.iai.one` gains a recurring billing contract that matches the product requirements.
2. `lamviecmuonnoi.com` temporarily accepts one-time VND checkout through `pay.iai.one`.

Until then, only adapter-preparation work is safe.
