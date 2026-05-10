# EXT-PAY-04 — tramsaigon.com execution checklist

- Date: 2026-05-10
- Lane: `EXT-PAY-04`
- Domain: `tramsaigon.com`
- Owner: `Team Pay / Team 2 / Ops`

## 1) Runtime and secrets proof (Ops + Team 2)

Required outputs:
- `ops-runtime-proof.json`
  - `secrets_bound = true`
  - `webhook_signature_verified = true`
  - `merchant_live_verified = true`
  - non-empty refs:
    - `secrets_matrix_ref`
    - `runtime_env_ref`
    - `merchant_ref`
    - `merchant_channel_ref`
    - `webhook_signature_ref`

Suggested verification commands:
- `wrangler secret list --config pay.iai.one/wrangler.jsonc --env production`
- `wrangler secret list --config pay.iai.one/wrangler.jsonc --env staging`
- `curl -sS https://pay.iai.one/health`

## 2) Provider E2E checkout proof (Team Pay)

Required outputs:
- `provider-response.json` with non-pending values:
  - `provider_ref`
  - `payment_link_id`
  - `checkout_url`
  - `amount`
  - `currency`
  - `status`
  - `created_at_utc`
  - `tenant_code`
  - `site_code`

Also required file:
- `checkout-screenshot.png`

## 3) D1/canonical row proof (Team Pay + Team 2)

Required output:
- `d1-readback.json` with non-pending values:
  - `order_id_or_payment_session_id`
  - `d1_or_canonical_row_ref`
  - `status`
  - `created_at_utc`

## 4) Mail proof (Team Email + Ops)

Required output:
- `mail-readback.json` with all templates present and delivered/sent:
  - `payment_receipt`
  - `checkout_status_update`
  - `payment_failed_notice`
  - `refund_notice`

Required files:
- `inbox-proof-pay@tramsaigon.com.eml`
- `inbox-proof-customer-gmail.png`

Optional allowlist readback:
- `mail-allowlist-readback.json`

## 5) Run checkers and close packet

Run in repo root:

```bash
pnpm report:tramsaigon-evidence -- --date=2026-05-10
pnpm report:ext-pay-04:tramsaigon -- --date=2026-05-10
pnpm report:tramsaigon-ext-mail-01 -- --date=2026-05-10
pnpm report:tramsaigon-pay-closeout -- --date=2026-05-10
```

Close condition:
- `TEAM1_TRAMSAIGON_PAY_CLOSEOUT_2026-05-10.json` has:
  - `"status": "READY_FOR_SYNCHRONIZED_LIVE"`
  - `"readyForSynchronizedLive": true`
