# TRANHATAM_COM_PAYMENT_EMAIL_LIVE_CHECKLIST_2026-04-22
- Team: Team D + Team Email + Team SMTP + Team B
- Date: 2026-04-22
- Scope: external activation gate for `tranhatam.com` payment email readiness
- Status: `EXTERNAL_STEPS_PENDING`

## 1. Locked sender package

The payment sender identities for `tranhatam.com` are locked as:

- `pay@tranhatam.com`
- `billing@tranhatam.com`
- `support@tranhatam.com`
- `noreply@tranhatam.com`

## 2. Locked sender policy

- payment receipt uses `pay@tranhatam.com`
- billing, failed-payment, and refund mail uses `billing@tranhatam.com`
- reply-to always uses `support@tranhatam.com`
- `noreply@tranhatam.com` must not be used for payment mail

## 3. External steps required before live claim

All of the following five steps are mandatory:

1. bind mailbox or alias truth for:
   - `pay@tranhatam.com`
   - `billing@tranhatam.com`
   - `support@tranhatam.com`
   - `noreply@tranhatam.com`
2. set runtime SMTP or `MAIL_API` for the payment sender path
3. connect the live `tranhatam.com` payment surface to `/api/payment-routing`
4. run one real checkout flow or one true sandbox flow
5. capture and store evidence:
   - provider reference
   - SMTP `messageId`
   - D1 row
   - inbox proof

## 4. Hard rule

`tranhatam.com payment email live` must not be claimed until all five external steps above are complete.

Repo-side sender package lock is useful, but it is not sufficient evidence of live payment email readiness.

## 5. Current truth

What is already complete inside the repo:

- centralized payment routing for `tranhatam.com`
- receiver registry assignment for VND and USD fallback
- Team D intake row for `tranhatam.com`
- sender package policy locked in docs
- read-only payment email template registry exposed via `/api/payment-email-templates`
- pay-to-mail outbound bridge contract locked in:
  - `docs/PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md`

What is still outside the repo:

- mailbox or alias binding
- SMTP or `MAIL_API` runtime binding
- live site surface wiring
- action-backed payment evidence
- outbound delivery-path wiring that actually consumes the locked template registry to send mail

## 6. Evidence destination

When the external steps complete, update:

- `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`
- `docs/reports/team1/PAY_IAI_ONE_TEST_AND_PAYMENT_INTAKE_STATUS_2026-04-22.md`
- `docs/PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md` if adapter payload or ownership changes
- this checklist with concrete evidence references
