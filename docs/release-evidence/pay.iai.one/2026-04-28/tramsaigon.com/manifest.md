# tramsaigon.com — Live activation evidence manifest

- Date: 2026-04-28
- Status: **PENDING_OWNER_EVIDENCE**
- Scope: live proof for `tramsaigon.com` payment + email lane (SITE-INTAKE-112)
- Pair packet: `docs/reports/pay-email-agent/TRAMSAIGON_COM_PAY_EMAIL_REPO_CLOSEOUT_2026-04-28.md`
- Escalation packet: `docs/reports/team1/TEAM_NOVA_OPS_TRAMSAIGON_ESCALATION_PACKET_2026-04-28.md`

## Folder skeleton

| File | Purpose | Owner | Status |
|---|---|---|---|
| `manifest.md` | Evidence manifest (this file): provider_ref, message_id, amount, currency, timestamp | AI Owner Pay+Email + founder | **PENDING** |
| `checkout-screenshot.png` | payOS checkout screenshot or real-action proof | Team Pay + Team B | **PENDING** |
| `provider-response.json` | payOS API response (sanitized, no secret) | Team Pay | **PENDING** |
| `d1-readback.json` | pay D1 row export (orders, payments, refunds — sanitized) | Team Pay (D1) | **PENDING** |
| `mail-readback.json` | mail D1 readback (messages + message_events + delivery_attempts) | Team Email + SMTP | **PENDING** |
| `inbox-proof-pay@tramsaigon.com.eml` | raw header + body for sender mailbox | Team Email + SMTP | **PENDING** |
| `inbox-proof-customer-gmail.png` | Gmail recipient inbox screenshot | Team Email + customer recipient | **PENDING** |

(Optional: `inbox-proof-customer-outlook.png` — Outlook recipient inbox screenshot.)

## Required evidence fields (manifest skeleton)

When evidence lands, fill these fields here:

```yaml
provider:
  name: payos
  environment: <sandbox|production>
  provider_ref: <PAYOS_PROVIDER_REF>
  payment_link_id: <PAYOS_PAYMENT_LINK_ID>
  checkout_url: <PAYOS_CHECKOUT_URL>
  amount: <int>
  currency: VND
  timestamp_utc: <ISO8601>
  status: <PAID|FAILED|REFUNDED|...>

mail:
  workspace_id: <iai-one|...>
  templates_sent:
    - template: payment_receipt
      message_id: <RFC822_MSG_ID>
      smtp_response_code: <250|...>
      delivery_attempts: <int>
      final_state: <delivered|bounced|...>
    - template: checkout_status_update
      message_id: ...
    - template: payment_failed_notice
      message_id: ...
    - template: refund_notice
      message_id: ...

mailboxes_bound:
  pay@tramsaigon.com: <true|false>
  billing@tramsaigon.com: <true|false>
  support@tramsaigon.com: <true|false>
  noreply@tramsaigon.com: <true|false>  # bound but BANNED for payment

receivers_locked:
  vnd_primary: <bank_code|null>
  vnd_fallback: <bank_code|null>
  usd_primary: <paypal_business_id|null>

founder_decisions:
  paid_offers_locked: <true|false>
  owner_truth: <company|individual|null>
  payment_model: <one_time|recurring|hybrid|null>
```

## Verification rule

When this manifest + 6 evidence files all complete, AI Owner Pay+Email re-runs:

```bash
# 1. Verify pay D1 readback matches provider_ref
node scripts/pay-team-d-tranhatam-evidence-check.mjs --site=tramsaigon.com --date=2026-04-28
# (note: existing checker is for tranhatam; tramsaigon equivalent will land when first evidence is ready)

# 2. Verify mail readback matches message_id chain
# (D1 readback script TBD - will be authored when first real evidence lands)

# 3. Promote intake board row SITE-INTAKE-112: FORM_IN_PROGRESS -> READY_FOR_LIVE
# (manual edit `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md` line 300)
```

## Close condition

Row SITE-INTAKE-112 flips to `READY_FOR_LIVE` when:

1. All 4 founder decisions locked (paid offers, owner truth, payment model, receivers).
2. payOS sandbox checkout completed → `provider-response.json` + `checkout-screenshot.png` landed.
3. 4 templates sent → `mail-readback.json` shows `delivered` state for all.
4. At least 1 Gmail inbox proof captured.
5. 4 mailboxes (`pay@`, `billing@`, `support@`, `noreply@`) bound on mailcow.

Until then row stays `FORM_IN_PROGRESS`.

---

**Folder pre-staged 2026-04-28T16:25Z by TNO** to reduce friction when owners deliver evidence — drop files into this folder, no need to create new structure.
