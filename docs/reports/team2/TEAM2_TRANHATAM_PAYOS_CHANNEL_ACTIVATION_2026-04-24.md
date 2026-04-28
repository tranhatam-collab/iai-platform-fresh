# TEAM2_TRANHATAM_PAYOS_CHANNEL_ACTIVATION_2026-04-24

- Timestamp (ICT): 2026-04-24
- Scope: Team Payments activation for `tranhatam` merchant on payOS production

## Actions Completed

1. Activated payOS channel for merchant `TRAN HA TAM` in dashboard:
   - Channel name: `tranhatam`
   - Linked bank: `ACB / 27588277`
   - Channel status: `Đang hoạt động`

2. Created a real payment link from payOS production UI (`Tạo link thanh toán`):
   - Amount: `250000 VND`
   - Generated checkout URL:
     - `https://pay.payos.vn/web/578ccd92a9d24bd296f58171d6c43263`

3. Verified checkout URL is publicly reachable:
   - `curl -I -L https://pay.payos.vn/web/578ccd92a9d24bd296f58171d6c43263`
   - Result: `HTTP 308` redirect to trailing slash, then `HTTP 200`.

4. Updated `pay.iai.one` production D1 `provider_accounts` for tenant `tranhatam`:
   - Inserted row:
     - `id`: `pa_tranhatam_payos_live_20260424`
     - `tenant_id`: `ten_2e0143ae028a7a3c`
     - `provider_code`: `payos`
     - `account_label`: `tranhatam`
     - `merchant_reference`: `my.payos.vn:c04bd0483a1311f18d570242ac110002`
     - `live_mode`: `1`
     - `status`: `active`

## Current State

- payOS merchant/channel side for `tranhatam` is now live-active.
- Real checkout URL generation from payOS production UI is confirmed.
- `provider_accounts` no longer empty for `tranhatam` in `pay.iai.one` production D1.

## Remaining Verification (single blocker to close full gate)

- Re-run canonical `pay.iai.one` runtime probe with a valid API key header to prove:
  - `checkout_url_non_null = PASS`
  - `payment_link_id_non_null = PASS`
  - `no_214 = PASS`

Suggested command (with valid key exported):

```bash
cd /Users/tranhatam/Documents/New\ project/iai-platform-worktree
TEAM2_PAY_GATE_BASE_URL="https://pay.iai.one" \
TEAM2_PAY_GATE_TENANT_CODE="tranhatam" \
TEAM2_PAY_GATE_SITE_CODE="tranhatam" \
TEAM2_PAY_GATE_API_KEY="$TEAM2_PAY_GATE_API_KEY" \
pnpm report:team2-pay-prod-probe -- --date=2026-04-24
```
