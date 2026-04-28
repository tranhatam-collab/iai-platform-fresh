# Về Tương Lai Team 1 Handoff

Status date: 2026-04-16
Phase priority: `pay.iai.one` first
Deferred in this phase: `PayPal`

## Current contract target

Team 1 should integrate against:

```txt
POST https://pay.iai.one/api/v1/checkout/session
```

Headers:

```txt
content-type: application/json
x-api-key: required
x-idempotency-key: required
```

Request:

```json
{
  "intent": "annual-access",
  "candidate_email": "candidate@example.com",
  "entry": "homepage",
  "source": "hero",
  "lang": "vi",
  "return_url": "https://vetuonglai.com/thank-you",
  "cancel_url": "https://vetuonglai.com/membership",
  "metadata": {
    "slug": "ve-tuong-lai-2026",
    "ref": "spring-launch"
  }
}
```

Specialist pack example:

```json
{
  "intent": "specialist-pack",
  "pack": "g1",
  "candidate_email": "candidate@example.com",
  "entry": "homepage",
  "source": "specialist-grid",
  "lang": "vi",
  "return_url": "https://vetuonglai.com/thank-you",
  "cancel_url": "https://vetuonglai.com/membership",
  "metadata": {
    "slug": "goi-chuyen-gia-g1",
    "ref": "specialist-drop"
  }
}
```

Success response shape:

```json
{
  "ok": true,
  "checkout_url": "https://pay.payos.vn/web/...",
  "session_id": "pi_xxx",
  "provider_ref": "plink_xxx",
  "expires_at": null,
  "status": "ready"
}
```

Error response shape:

```json
{
  "ok": false,
  "code": "PAYOS_ENV_MISSING",
  "message": "payOS credentials are missing.",
  "checkout_url": null,
  "session_id": "pi_xxx",
  "provider_ref": null,
  "expires_at": null,
  "status": "PAYOS_ENV_MISSING"
}
```

## Product mapping

External Team 1 mapping:

- `annual-access` -> `plan_code`
- `g1..g9` -> `pack_code`
- currency: `VND` first, `USD` later if an international provider is added

Current `pay.iai.one` runtime also needs an internal product catalog:

```txt
VETUONGLAI_PRODUCT_CATALOG_JSON
```

Expected structure:

```json
{
  "annual-access": {
    "plan_code": "annual_access_2026",
    "amount": 1200000,
    "currency": "VND",
    "description": "Annual access 2026"
  },
  "specialist-pack": {
    "g1": {
      "pack_code": "g1_2026",
      "amount": 350000,
      "currency": "VND",
      "description": "Specialist pack g1"
    }
  }
}
```

Without this catalog, checkout must fail with `CATALOG_NOT_READY` or `PACK_NOT_READY`.

## Member webhook contract

Target member runtime:

```txt
POST https://member.vetuonglai.com/api/access/webhooks/pay/iai-one
```

Headers:

```txt
x-pay-signature: required
x-pay-timestamp: required
content-type: application/json
```

Signature contract:

```txt
hex(hmac_sha256(PAY_IAI_ONE_WEBHOOK_SECRET, x-pay-timestamp + "." + raw_body))
```

Required event types:

- `subscription.activated`
- `subscription.renewed`
- `subscription.past_due`
- `subscription.cancelled`
- `order.captured`
- `order.refunded`

Required payload fields:

```json
{
  "event_id": "evt_xxx",
  "event_type": "subscription.activated",
  "occurred_at": "2026-04-16T10:15:00Z",
  "candidate_email": "candidate@example.com",
  "subscription_id": "sub_xxx",
  "order_id": null,
  "amount": 1200000,
  "currency": "VND",
  "status": "active",
  "intent": "annual-access",
  "pack": null,
  "metadata": {
    "entry": "homepage",
    "source": "hero",
    "slug": "ve-tuong-lai-2026",
    "ref": "spring-launch"
  }
}
```

## Team 1 env handoff

- `PAY_IAI_ONE_BASE_URL=https://pay.iai.one`
- `PAY_IAI_ONE_API_KEY`
- `PAY_IAI_ONE_WEBHOOK_SECRET`
- `PAY_IAI_ONE_ANNUAL_PLAN_CODE`
- `PAY_IAI_ONE_PACK_CODE_MAP_JSON`
- `PAY_IAI_ONE_TIMEOUT_MS`

## UAT handoff bundle

Sandbox credentials:

- payOS sandbox account: pending runtime setup
- payOS sandbox credentials: pending runtime setup

Six sample webhook payload files to hand off:

1. `subscription-activated.json`
2. `subscription-renewed.json`
3. `subscription-past-due.json`
4. `subscription-cancelled.json`
5. `order-captured.json`
6. `order-refunded.json`

Replay command template:

```bash
PAY_TS=$(date +%s)
PAY_SIG=$(printf '%s.%s' "$PAY_TS" "$(cat subscription-activated.json)" | openssl dgst -sha256 -hmac "$PAY_IAI_ONE_WEBHOOK_SECRET" -hex | sed 's/^.* //')
curl -X POST 'https://member.vetuonglai.com/api/access/webhooks/pay/iai-one' \
  -H 'content-type: application/json' \
  -H "x-pay-timestamp: $PAY_TS" \
  -H "x-pay-signature: $PAY_SIG" \
  --data @subscription-activated.json
```

```bash
PAY_TS=$(date +%s)
PAY_SIG=$(printf '%s.%s' "$PAY_TS" "$(cat subscription-renewed.json)" | openssl dgst -sha256 -hmac "$PAY_IAI_ONE_WEBHOOK_SECRET" -hex | sed 's/^.* //')
curl -X POST 'https://member.vetuonglai.com/api/access/webhooks/pay/iai-one' \
  -H 'content-type: application/json' \
  -H "x-pay-timestamp: $PAY_TS" \
  -H "x-pay-signature: $PAY_SIG" \
  --data @subscription-renewed.json
```

```bash
PAY_TS=$(date +%s)
PAY_SIG=$(printf '%s.%s' "$PAY_TS" "$(cat subscription-past-due.json)" | openssl dgst -sha256 -hmac "$PAY_IAI_ONE_WEBHOOK_SECRET" -hex | sed 's/^.* //')
curl -X POST 'https://member.vetuonglai.com/api/access/webhooks/pay/iai-one' \
  -H 'content-type: application/json' \
  -H "x-pay-timestamp: $PAY_TS" \
  -H "x-pay-signature: $PAY_SIG" \
  --data @subscription-past-due.json
```

```bash
PAY_TS=$(date +%s)
PAY_SIG=$(printf '%s.%s' "$PAY_TS" "$(cat subscription-cancelled.json)" | openssl dgst -sha256 -hmac "$PAY_IAI_ONE_WEBHOOK_SECRET" -hex | sed 's/^.* //')
curl -X POST 'https://member.vetuonglai.com/api/access/webhooks/pay/iai-one' \
  -H 'content-type: application/json' \
  -H "x-pay-timestamp: $PAY_TS" \
  -H "x-pay-signature: $PAY_SIG" \
  --data @subscription-cancelled.json
```

```bash
PAY_TS=$(date +%s)
PAY_SIG=$(printf '%s.%s' "$PAY_TS" "$(cat order-captured.json)" | openssl dgst -sha256 -hmac "$PAY_IAI_ONE_WEBHOOK_SECRET" -hex | sed 's/^.* //')
curl -X POST 'https://member.vetuonglai.com/api/access/webhooks/pay/iai-one' \
  -H 'content-type: application/json' \
  -H "x-pay-timestamp: $PAY_TS" \
  -H "x-pay-signature: $PAY_SIG" \
  --data @order-captured.json
```

```bash
PAY_TS=$(date +%s)
PAY_SIG=$(printf '%s.%s' "$PAY_TS" "$(cat order-refunded.json)" | openssl dgst -sha256 -hmac "$PAY_IAI_ONE_WEBHOOK_SECRET" -hex | sed 's/^.* //')
curl -X POST 'https://member.vetuonglai.com/api/access/webhooks/pay/iai-one' \
  -H 'content-type: application/json' \
  -H "x-pay-timestamp: $PAY_TS" \
  -H "x-pay-signature: $PAY_SIG" \
  --data @order-refunded.json
```

## Error table

| Code | Meaning |
| --- | --- |
| `API_KEY_REQUIRED` | missing `x-api-key` |
| `API_KEY_INVALID` | invalid or revoked key |
| `API_KEY_SCOPE_MISMATCH` | key lacks checkout scope |
| `IDEMPOTENCY_KEY_REQUIRED` | missing `x-idempotency-key` |
| `IDEMPOTENCY_CONFLICT` | same idempotency key with different payload |
| `CHECKOUT_REQUEST_INVALID` | missing required request fields |
| `INTENT_INVALID` | unsupported intent |
| `PACK_REQUIRED` | `specialist-pack` without valid `g1..g9` |
| `EMAIL_INVALID` | bad candidate email |
| `CATALOG_NOT_READY` | runtime catalog missing on `pay.iai.one` |
| `PACK_NOT_READY` | pack exists in brief but not configured in runtime catalog |
| `CURRENCY_NOT_READY` | non-VND catalog entry in VN-first phase |
| `PAYOS_ENV_MISSING` | payOS runtime secrets missing |
| `PAYOS_PAYLOAD_INVALID` | downstream payOS payload invalid |
| `PROVIDER_NOT_READY` | provider lane not live in this phase |

## Retry and duplicate policy

Webhook retry target:

- retry on `429`, any `5xx`, or network timeout
- backoff target: `30s`, `2m`, `10m`, `1h`, `6h`
- retry horizon target: `24h`

Duplicate policy:

- `event_id` is the idempotency key for inbound Team 1 processing
- same `event_id` must be safe to replay many times
- duplicate delivery should return `200` once already applied

## Current runtime truth

Live now:

- `POST /api/v1/checkout/session` contract surface on `pay.iai.one`
- `x-api-key` auth compatibility with legacy `x-site-key`
- payOS-first execution path

Not live yet:

- payOS runtime secrets
- `PAY_IAI_ONE_WEBHOOK_SECRET` runtime secret on `pay.iai.one`
- `VETUONGLAI_PRODUCT_CATALOG_JSON`
- real UAT payload files generated from live events

Do not mark this lane done until:

1. annual-access checkout returns a real `checkout_url`
2. at least one specialist pack checkout returns a real `checkout_url`
3. Team 1 validates all 6 webhook event types
4. entitlement mapping is proven for `annual_active`, `pack_owner`, revoke on `refund/cancel/past_due`
