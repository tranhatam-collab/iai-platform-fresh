# TRANHATAM_COM_PAYMENT_EVENT_CALLBACK_AND_MAIL_PROOF_2026-04-24

- Domain: `tranhatam.com`
- Scope: Team B + Team Email SMTP callback/payment-event path, `message_id`, canonical persistence, DB/log/inbox proof
- Verdict: `PASS_FOR_CALLBACK_MAIL_PROOF_CHAIN`
- Live-ready verdict: `NO`
- Gate dependency outside this packet: `TEAM1_PAY_PROD_GATE_STATUS_2026-04-24.md` remains `LOCK_RETAINED_WITH_REASON`

## 1. What Was Closed

The following chain is now closed on one real message:

1. pay internal handoff accepted a real mail action through `POST /internal/payment-email/send`
2. the same handoff persisted a canonical row
3. callback evidence was attached on the same canonical row through `POST /internal/payment-event/callback`
4. DB/log/inbox refs were attached on the same canonical row through `POST /internal/payment-event/proof`

## 2. Canonical Payment Row

- `canonical_row_ref`: `canon_tranhatam_com_provider_tranhatam_live_20260424_01`
- `order_id`: `order_tranhatam_live_20260424_01`
- `payment_session_id`: `ps_tranhatam_live_20260424_01`
- `provider_reference`: `provider_tranhatam_live_20260424_01`
- `provider_event_id`: `evt_tranhatam_live_20260424_01`
- `callback_status`: `callback_confirmed`
- `payment_status`: `paid`
- `provider_status`: `confirmed`

## 3. Mail Action

- `message_id`: `<dccda44b-235a-d9c8-0d14-f4d49cb02d23@tranhatam.com>`
- `workspace_id`: `ws_pay_tranhatam`
- `from`: `pay@tranhatam.com`
- `reply_to`: `support@tranhatam.com`
- `to`: `support@tranhatam.com`
- `template_id`: `payment_receipt`
- `provider_route`: `smtp://postfix-mailcow:25`
- `mail_status`: `provider_accepted`

## 4. DB Proof

The live public mail API service on VPS was patched so the real send path now persists and can read back:

- `messages`
- `message_events`
- `delivery_attempts`

Evidence captured for the same `message_id`:

- `messages` detail row:
  - `status = provider_accepted`
  - `message_idempotency_key = pay-tranhatam.com-order_tranhatam_live_20260424_01-payment_receipt`
  - `provider_response = 250 2.0.0 Ok: queued as 3ACD2677CD`
- `message_events` rows:
  - `queued`
  - `provider_accepted`
- `delivery_attempts` row:
  - `status = provider_accepted`
  - `queue_id = 3ACD2677CD`
  - `provider_response_code = 250`

Important constraint:

- public `api.mail.iai.one` still exposes `POST /v1/send`, but readback routes `/v1/messages*` are not exposed through the public hostname yet
- DB readback for this packet was captured internally on VPS from `iai-mail-api`

## 5. Log Proof

Postfix queue trail for `3ACD2677CD`:

- client: `iai-mail-api.mailcowdockerized_mailcow-network[172.22.1.14]`
- from: `pay@tranhatam.com`
- to: `support@tranhatam.com`
- queue active: yes
- LMTP result: `dsn=2.0.0`, `status=sent`
- final mailbox save:
  - `250 2.0.0 <support@tranhatam.com> MKDoKOpM62kBOwIA9ACncw Saved`

## 6. Inbox Proof

Internal inbox proof was captured from Dovecot:

- mailbox: `support@tranhatam.com`
- lookup: `header Message-Id '<dccda44b-235a-d9c8-0d14-f4d49cb02d23@tranhatam.com>'`
- result token: `2875c63795d3e869840b0000f400a773 2`

## 7. Mailbox Truth Snapshot

Mailcow MySQL confirms active local mailbox truth for:

- `pay@tranhatam.com`
- `billing@tranhatam.com`
- `support@tranhatam.com`
- `noreply@tranhatam.com`

Mailcow alias table confirms all four currently resolve to themselves and stay active.

## 8. What This Packet Does Not Claim

This packet does not claim:

- Team 1 pay gate is open
- `tranhatam.com` is `READY_FOR_LIVE`
- public `GET /v1/messages*` is open on `api.mail.iai.one`
- deployed production pay worker bindings were already rotated for this exact run
- Outlook proof exists
- all mailbox-specific inbox proofs are complete for `pay@`, `billing@`, and `noreply@`

## 9. Bottom Line

For `tranhatam.com`, the requested Team B + Team Email SMTP proof chain is now real on one live message:

- callback/payment-event path: pass
- `message_id`: pass
- canonical persistence: pass
- DB proof: pass
- log proof: pass
- inbox proof: pass

The remaining blockers are now outside this proof chain: Team 1 production gate, any remaining production runtime binding rollout, optional public readback exposure, and any broader site-activation claims.
