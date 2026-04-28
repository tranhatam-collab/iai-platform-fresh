# OMDALAT.COM Final Pre-Live Test Report

Date: 2026-04-23
Scope: `omdalat.com`
Current verdict: `NO-GO_FOR_FULL_PAYMENT_LIVE, READY_FOR_NEXT_RUNTIME_BINDING_STEP`

## What is green

- Mailcow domain `omdalat.com`: confirmed.
- Real mailbox identities represented: `support@omdalat.com`, `noreply@omdalat.com`, `hello@omdalat.com`, `app@omdalat.com`.
- Payment sender aliases represented:
  - `pay@omdalat.com` -> `support@omdalat.com`
  - `billing@omdalat.com` -> `support@omdalat.com`
- Inbound route proof: represented in the Team Email SMTP mailbox proof packet.
- Outbound review email from `support@omdalat.com`: accepted by SendGrid relay.
- Postfix queue after review send: empty.
- DNS public truth checked:
  - MX: `10 mail.iai.one.`
  - SPF TXT: `v=spf1 mx a:mail.iai.one ~all`
  - DMARC TXT: `v=DMARC1; p=quarantine; adkim=s; aspf=s; pct=100`
  - SendGrid CNAMEs:
    - `em563.omdalat.com -> u97614395.wl146.sendgrid.net`
    - `s1._domainkey.omdalat.com -> s1.domainkey.u97614395.wl146.sendgrid.net`
    - `s2._domainkey.omdalat.com -> s2.domainkey.u97614395.wl146.sendgrid.net`

## Repo tests run

- `pnpm test:pay` -> PASS `52/52`
- `pnpm typecheck:pay` -> PASS
- `node --test tests/integration/pay-team-d-intake-board.test.mjs` -> PASS `6/6`
- `node scripts/pay-team-d-intake-board-check.mjs --date=2026-04-23 --no-write` -> PASS
- `node scripts/pay-team-d-omdalat-evidence-check.mjs --date=2026-04-23` -> PASS, but live claim remains blocked by missing runtime/payment proof.

## Review email proof

- Sender: `support@omdalat.com`
- To: `tranhatam@gmail.com`
- BCC: `tranhatam66@gmail.com`
- Message-ID: `<omdalat-template-review-1776926010@omdalat.com>`
- Mailcow queue ID: `1189367923`
- Relay: `smtp.sendgrid.net:587`
- Provider queue ID: `W3IYekImR-CjXx52QwGiRw`
- Delivery handoff status: `250 Ok` for both recipients.
- Gmail connector search in this session: not found yet. Founder inbox proof is still required.

## Remaining blockers before full live claim

- Founder inbox proof for the review email.
- Runtime bindings:
  - `MAIL_API_BASE_URL`
  - `MAIL_API_KEY`
  - `MAIL_API_WORKSPACE_ID`
  - `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
- `/v1/send` live proof from pay runtime into mail lane.
- Real or sandbox payment action with provider/session reference.
- Mail `message_id` tied to the same payment action.
- D1/canonical row tied to the same payment action.
- External inbox proof for payment email.
- Pay gate still locked as `LOCK_RETAINED_WITH_REASON`.

## Final position

`omdalat.com` is ready for the next runtime binding step, but not ready to be announced as payment live. The current safe action is to bind runtime secrets, run one controlled payment/email flow, capture all evidence, then reopen the live gate.
