# OMDALAT_COM_TEAM_EMAIL_SMTP_MAILBOX_INBOUND_PROOF_2026-04-23

Trạng thái: MAILBOX_ALIAS_AND_INBOUND_ROUTE_CONFIRMED, NOT PAYMENT_LIVE

Ngày: 2026-04-23

Domain: `omdalat.com`

Owner lane: `Team Email SMTP`

Related Team D packet:

- `docs/reports/teamd/OMDALAT_COM_P0_PAYMENT_ACTIVATION_PACKET_2026-04-23.md`
- `docs/reports/teamd/OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_2026-04-23.json`

## 1. DNS mail baseline

Read-only DNS checks:

- `MX omdalat.com = 10 mail.iai.one.`
- `TXT omdalat.com` includes `v=spf1 mx a:mail.iai.one ~all`
- `_dmarc.omdalat.com` returns `v=DMARC1; p=quarantine; adkim=s; aspf=s; pct=100`
- `mail._domainkey.omdalat.com` did not return a TXT record during this check

Conclusion:

- inbound MX is routed to `mail.iai.one`
- SPF/DMARC baseline exists
- canonical outbound DKIM/domain-auth for payment sender still needs a separate proof before payment live claim

## 2. Mailcow mailbox and alias truth

Verified on VPS `89.167.116.167` under `mailcow-dockerized`.

Existing active mailbox truth:

| address | type | active | route |
|---|---|---:|---|
| `hello@omdalat.com` | mailbox | 1 | self |
| `app@omdalat.com` | mailbox | 1 | self |
| `support@omdalat.com` | mailbox | 1 | self |
| `noreply@omdalat.com` | mailbox | 1 | self |

Team Email SMTP added the missing payment sender aliases:

| address | type | goto | active | sender_allowed |
|---|---|---|---:|---:|
| `pay@omdalat.com` | alias | `support@omdalat.com` | 1 | 1 |
| `billing@omdalat.com` | alias | `support@omdalat.com` | 1 | 1 |

Operational meaning:

- `pay@omdalat.com` is now an inbound alias to the support owner inbox
- `billing@omdalat.com` is now an inbound alias to the support owner inbox
- `support@omdalat.com` remains the reply-to/support owner mailbox
- `noreply@omdalat.com` remains a real mailbox and must not be used as payment sender

## 3. Inbound route proof

Route proof message:

- `message_id = <omdalat-mailbox-route-proof-1776924190-19599@mail.iai.one>`

Submitted recipients:

- `pay@omdalat.com`
- `billing@omdalat.com`
- `support@omdalat.com`
- `noreply@omdalat.com`

Postfix/LMTP route proof:

- `orig_to=<pay@omdalat.com>` delivered to `<support@omdalat.com>` with `status=sent`
- `orig_to=<billing@omdalat.com>` delivered to `<support@omdalat.com>` with `status=sent`
- `to=<support@omdalat.com>` delivered with `status=sent`
- `to=<noreply@omdalat.com>` delivered with `status=sent`

Dovecot mailbox proof:

- `doveadm search -u support@omdalat.com HEADER Message-ID <omdalat-mailbox-route-proof-1776924190-19599@mail.iai.one>` returned a match
- `doveadm search -u noreply@omdalat.com HEADER Message-ID <omdalat-mailbox-route-proof-1776924190-19599@mail.iai.one>` returned a match

## 4. What this closes

This closes the Team Email SMTP repo/live evidence for:

- `pay@omdalat.com` mailbox or alias binding
- `billing@omdalat.com` mailbox or alias binding
- `support@omdalat.com` mailbox binding
- `noreply@omdalat.com` mailbox binding
- inbound route proof for the required payment sender package

## 5. What remains open

This does NOT close payment live.

Still required:

- canonical outbound DKIM/domain-auth proof for `omdalat.com`
- `MAIL_API_BASE_URL` runtime binding on the pay worker
- `MAIL_API_KEY` secure binding
- `MAIL_API_WORKSPACE_ID` binding allowed to send for `omdalat.com`
- `PAY_EMAIL_ADAPTER_INTERNAL_KEY` binding
- `/v1/send` accepted proof for `pay@omdalat.com` or `billing@omdalat.com`
- provider ref from a real or true sandbox payment action
- mail `messageId`
- D1/canonical evidence row
- external inbox proof for payment mail
- pay gate unlock from `LOCK_RETAINED_WITH_REASON`

`BCC` remains `OFF` until the full proof packet is complete.
