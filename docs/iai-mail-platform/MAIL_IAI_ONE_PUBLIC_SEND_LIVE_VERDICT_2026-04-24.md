# MAIL_IAI_ONE_PUBLIC_SEND_LIVE_VERDICT_2026-04-24

Status: PUBLIC SEND OPEN, LIVE-CLOSE STILL BLOCKED

Date: 2026-04-24

Owner: Team Email SMTP

## 0. Verdict

`https://api.mail.iai.one/v1/send` is no longer health-only.

Public truth verified directly on 2026-04-24:

- `GET https://api.mail.iai.one/v1/health` -> `200`
- `POST https://api.mail.iai.one/v1/send` with valid `Authorization`, `X-Workspace-Id`, `X-Request-Id` -> `202`
- `GET https://api.mail.iai.one/v1/send` -> `405`
- `OPTIONS https://api.mail.iai.one/v1/send` -> `204`

This closes the narrow public ingress blocker for `POST /v1/send`.

This does NOT close the broader mail lane evidence gate.

## 1. Implementation Truth

Public ingress on `api.mail.iai.one` now exposes a dedicated location for:

- `POST /v1/send`

That location proxies to:

- `http://iai-mail-api:3000/v1/send`

The live `iai-mail-api` service now accepts the canonical public route and returns:

- HTTP `202`
- `ok = true`
- `data.message_id`
- `data.provider_route`
- `data.status = accepted`

All other non-health routes on `api.mail.iai.one` remain blocked by default.

## 2. Public Smoke Evidence

Public accepted proof:

- request id: `public-send-cutover-20260424-public`
- workspace id: `ws_public_send_cutover`
- sender: `pay@mail.iai.one`
- recipient: `support@omdalat.com`
- message id: `<934960d7-0687-1194-6919-69dc2238abd5@mail.iai.one>`
- provider route: `smtp://postfix-mailcow:25`
- HTTP status: `202`

Operational delivery proof for the same public smoke:

- Postfix queue id: `60ED16769D`
- Postfix result: `status=sent`
- Dovecot readback matched the same `Message-Id` in `support@omdalat.com`

## 3. Honest Gates Still Open

This cutover only proves that public ingress can now accept `POST /v1/send`.

It does not by itself prove:

- canonical sender package truth for payment lane
- Wave 1 or Wave 2 closeout
- Gmail / Outlook / internal inbox proof for the required live flows
- `messages`, `message_events`, `delivery_attempts` three-table evidence for the same public message
- permission to turn `BCC` back on
- permission to claim full Team Email SMTP live-close

Important honesty note:

- the public smoke above used `pay@mail.iai.one`
- this is enough to prove public ingress is open
- this is not the final canonical sender proof for payment lane if the lane still requires `pay@iai.one` or `billing@iai.one`

## 4. Short Team Message

```text
Public /v1/send is now open on api.mail.iai.one. Health endpoints still pass, POST /v1/send now returns 202 with message_id, and the public ingress blocker is closed. This does not close the broader mail lane: BCC stays OFF, canonical sender proof still applies, and no team should claim full live-close without message_id + DB/log evidence + inbox proof under the existing proof rules.
```
