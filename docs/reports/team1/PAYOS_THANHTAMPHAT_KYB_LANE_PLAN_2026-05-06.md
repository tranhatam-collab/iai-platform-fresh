# PAYOS_THANHTAMPHAT_KYB_LANE_PLAN_2026-05-06

- Owner lane: Team 1 coordination -> founder action -> payOS provider
- Date: 2026-05-06
- Status: `LANE_OPEN`
- Purpose: open a parallel payOS business merchant for CTY TNHH ĐTTM THANH
  TAM PHAT so aiaccountingloop.com (and possibly the vetuonglai sub-sites
  already routed to recv_vnd_thanhtamphat_acb) can move from manual
  VietQR reconciliation to auto-callback paid orders.

## Why this lane is needed

- Production worker pay.iai.one currently holds ONE active payOS merchant
  binding: `CTY TNHH TAM VESEY ASSOCIATES UK` (ACB 12381288). Used by
  tranhatam.com and proven on 2026-05-06 with a real 5,000 VND paid order.
- aiaccountingloop.com receiver is `recv_vnd_thanhtamphat_acb` (ACB
  369999996) — a different legal entity (Thanh Tam Phat). payOS does not
  accept routing one merchant's payment to another merchant's account.
- For aiaccountingloop to use the auto-callback pipeline, payOS must
  register Thanh Tam Phat as its OWN merchant with its OWN credentials.

## Pre-conditions on founder side

Founder must have or obtain for Thanh Tam Phat:

1. ĐKKD (business registration certificate) of CTY TNHH ĐTTM THANH TAM PHAT.
2. Tax ID (mã số thuế) of THANH TAM PHAT.
3. CCCD of legal representative on the ĐKKD.
4. Confirmation that ACB account 369999996 belongs to THANH TAM PHAT.
5. ACB account statement or bank confirmation letter for that account.
6. A payOS account in the name of THANH TAM PHAT (separate from the existing
   TAM VESEY ASSOCIATES UK account). May require a new email if payOS
   enforces email-per-merchant.

## payOS submission steps

1. Founder logs in to https://my.payos.vn/ as the owner of Thanh Tam Phat.
2. Settings → Profile → switch to Doanh nghiệp.
3. Submit the 6 KYB documents above.
4. Wait 1-3 business days for payOS verification.
5. Once approved:
   - Set up a payment channel pointing to ACB 369999996.
   - On the integration page, copy the LIVE Client ID, API Key, Checksum Key.
   - These are NEW credentials, distinct from the TAM VESEY ones.

## Codebase changes required to support a second merchant

The current pay.iai.one Worker reads ONE set of payOS env secrets. To
support two merchants we need:

1. Move from global `PAYOS_CLIENT_ID/PAYOS_API_KEY/PAYOS_CHECKSUM_KEY`
   to a per-tenant or per-receiver set, e.g.
   `PAYOS_CLIENT_ID__TAMVESEY`, `PAYOS_CLIENT_ID__THANHTAMPHAT`, ...
2. `pay.iai.one/src/lib/payos.ts` looks up the secret triple by
   tenant_code -> receiver_id -> merchant alias.
3. The receiver registry in `apps/pay/src/payment-routing.ts` already
   binds receivers to domains. Add a `payosMerchantAlias` field on each
   receiver that points to the env-secret prefix.
4. Add a feature flag (e.g. `PAY_PAYOS_MULTI_MERCHANT_ENABLED=true`) to
   make the rollout safe.

This is roughly 1-2 days of dev once the credentials are in hand.

## Production rollout sequence (after KYB + dev)

1. Bind the new credential triple to env=production via wrangler secret put.
2. Deploy worker with the multi-merchant lookup.
3. Flip aiaccountingloop tenant to use the Thanh Tam Phat alias.
4. Set merchant_sites.active = 1 for site_aal_2026_05_06.
5. Run a 5,000 VND paid order test (founder pays from personal ACB into
   Thanh Tam Phat ACB 369999996 via the payOS-issued QR).
6. Confirm payment_intent.paid + provider_event_id + ledger double-entry.
7. Issue activation evidence artifact for aiaccountingloop similar to
   TRANHATAM_COM_PRODUCTION_PAID_PROOF_2026-05-06.md.

## Until this lane closes

- aiaccountingloop.com is on **static VietQR + manual reconciliation**.
- See `docs/reports/team1/aiaccountingloop/README.md` for the static QR.
- Public checkout is disabled at auth layer (merchant_sites.active = 0).

## Stop rules

- Do NOT route aiaccountingloop checkout through the existing TAM VESEY
  payOS merchant. Money would land in the wrong company.
- Do NOT flip merchant_sites.active = 1 for aiaccountingloop until the
  Thanh Tam Phat payOS lane is wired AND the env secret is in place.
- Do NOT publish the static VietQR on aiaccountingloop.com public surface
  until founder confirms the legal entity / invoice template.
