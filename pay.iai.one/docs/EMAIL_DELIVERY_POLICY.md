# Payment Email Delivery Policy

This project is preparing payment mail delivery for internal SMTP, but payment mail is **not migrated yet**.

## In Scope

These flows must move to internal SMTP:

- `payment_receipt`
- `checkout_status_update`
- `renewal_or_failure_notice`

## Sender Policy

Allowed senders:

- `pay@iai.one`
- `billing@iai.one`

Not allowed for these payment flows:

- auth sender
- general sender
- shared system sender with unrelated product traffic

## Migration Gate

Do not report migration done unless every flow has:

1. real payment or real sandbox payment action with provider-side logs
2. SMTP `messageId`
3. D1 evidence row
4. inbox proof from a real test inbox

Do not report migration done when:

- payment provider is still `not ready`
- email only reached `queued`
- the proof is only a console log

## Evidence Minimum

Every successful real test must preserve:

- provider payment reference
- payment intent id
- email flow code
- sender email
- recipient email
- SMTP `messageId`
- SMTP accept response or transport trace
- inbox screenshot or equivalent inbox confirmation

## Runtime Secrets Needed

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE_TRANSPORT`
- `SMTP_AUTH_MODE`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_HELO_DOMAIN`
- `EMAIL_FROM_PAY`
- `EMAIL_FROM_BILLING`
- `EMAIL_REPLY_TO_SUPPORT`

`RESEND_API_KEY` may still exist for non-payment system mail, but it should not be used for the three payment flows above.
