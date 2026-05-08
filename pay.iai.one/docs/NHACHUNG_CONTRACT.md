# Nha Chung pay.iai.one Contract

Status: catalog locked, live checkout blocked until subscription rail is provisioned.

The canonical machine-readable contract is `config/nhachung-catalog.json`. It locks the four SKU codes required by `nhachung.org/docs/api/API_CONTRACTS_V1.md`:

| SKU | Tier | Monthly USD cents | Annual USD cents |
|---|---|---:|---:|
| `nc_starter` | `starter` | 500 | 5000 |
| `nc_builder` | `builder` | 1900 | 19000 |
| `nc_pro` | `pro` | 4900 | 49000 |
| `nc_master` | `master` | 9900 | 99000 |

Annual pricing is locked as ten monthly payments, matching the Nhà Chung master plan.

## Runtime Boundary

The current pay.iai.one internal runtime is payOS-first, VND-only, and one-time checkout only. Nhà Chung's catalog is USD subscription-oriented, so this contract is intentionally not exposed as a live checkout route yet.

Do not route live Nhà Chung subscription payments until one of these is true:

- Phase 2 Stripe subscription rail is provisioned and webhook verified.
- A domestic VND subscription or equivalent one-time membership policy is approved by founder/legal.

## Webhook Destination

Downstream fulfillment remains the Nhà Chung app contract:

- URL: `https://app.nhachung.org/api/payment-webhook`
- Signature: `X-Signature`
- Timestamp: `X-Timestamp`
- Idempotency: `X-Idempotency-Key`
- Secret key name: `PAY_NHACHUNG_HMAC`

The app-side ops blocker remains the Worker secret needed for verification on its side.

## Gate

Run:

```bash
npm run check:nhachung-catalog
```

The gate verifies the four SKUs, annual pricing, no public financial-promise flag, webhook event names, and webhook signature headers.
