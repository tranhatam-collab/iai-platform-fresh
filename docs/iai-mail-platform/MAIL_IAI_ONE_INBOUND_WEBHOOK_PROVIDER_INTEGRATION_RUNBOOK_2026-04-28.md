# Path B inbound webhook — provider integration runbook

**Audience:** any third-party mail provider (Resend, Postmark,
SendGrid, Mailgun, custom self-hosted forwarder, …) that needs to
deliver inbound mail events to `mail.iai.one`.

**Status:** the receiver is `LIVE_PRODUCTION` as of
2026-04-28T11:26Z (image `iai-mail-api-pathb:c1b9b3b`, see
`MAIL_IAI_ONE_INBOUND_WEBHOOK_PATH_B_DEPLOY_COMPLETE_2026-04-28.md`).

This document is the **authoritative wire contract**. It is generated
from the source of truth in
`apps/mail-api/src/inbound-webhook.ts` (commit `c1b9b3b`); if any
provider observes drift, the code wins and this runbook is a bug.

---

## 1. Endpoint

```
POST https://mail.iai.one/_mail/v1/webhooks/inbound
```

* TLS only (HTTP redirects 301 → HTTPS via nginx).
* Loopback inside the VPS reaches port `3001` of the
  `iai-mail-api-pathb` container; never expose `127.0.0.1:3001` to
  third parties — always go through the public hostname.
* The companion read endpoint
  `GET https://mail.iai.one/_mail/v1/webhooks/inbound/evidence` is
  **operations-only** (audit / debug). Providers must not depend on
  it.

## 2. Required headers

| Header | Value |
|---|---|
| `Content-Type` | `application/json; charset=utf-8` |
| `x-mail-webhook-timestamp` | Unix seconds when the request was signed (integer, base-10, no fractional). |
| `x-mail-webhook-signature` | Lowercase hex `HMAC-SHA256(secret, "${timestamp}.${rawBody}")`. |

Header names are case-insensitive on the wire (HTTP/1.1) but must be
spelled exactly as above when computing or recomputing. The signing
order is **`timestamp` + literal `.` + `rawBody`**, with `rawBody`
being the exact bytes that go on the wire (no re-serialisation, no
trailing newline injection).

There is no `x-iai-…` prefix; that was a draft naming scheme and has
never been accepted by the production handler.

## 3. Body

* `Content-Type: application/json` is enforced; other types receive
  `MAIL_WEBHOOK_BODY_INVALID`.
* The body MUST be valid JSON.
* Maximum accepted size: **262 144 bytes (256 KiB)**. Larger payloads
  yield HTTP `413` and are not retried by the receiver.
* The handler does **not** interpret the payload schema today — it
  signs, persists evidence, and returns. A `provider_event_id` field
  at the top level is **strongly recommended**: when present it is
  surfaced in `meta.evidence_id` lookups and lets ops find a specific
  delivery without scanning timestamps.

Recommended minimal envelope:

```json
{
  "provider_event_id": "<provider's stable event id, e.g. 'evt_abc123'>",
  "received_at_provider": "2026-04-28T11:26:31Z",
  "from": "sender@example.com",
  "to": ["inbox@iai.one"],
  "subject": "...",
  "raw_email_url": "https://provider.example/raw/...",
  "summary": { "..." }
}
```

Provider-specific shapes (Postmark `From`/`MessageID`, Resend
`type`/`data`, etc.) are accepted as-is; just keep total size under
the 256 KiB cap.

## 4. Replay window

* The receiver enforces a **±300 second** drift between
  `x-mail-webhook-timestamp` and the server's wall clock.
* Outside the window: HTTP `408 MAIL_WEBHOOK_TIMESTAMP_OUT_OF_WINDOW`.
  The provider SHOULD re-sign with a fresh timestamp on the next
  retry attempt (do not blindly resend the cached signed body).

## 5. Status codes

| Code | When | Provider action |
|---|---|---|
| `202 Accepted` | Signature valid, evidence persisted. (See dedup note in §9: a retry with same `provider_event_id` + same body returns `202` + `replay: true` + the **original** `evidence_id`.) | Mark delivery success. |
| `400 Bad Request` | Body could not be read (e.g. premature stream close). | Retry with full body. |
| `401 Unauthorized` | Missing or invalid signature, or missing/invalid timestamp. | Stop retrying — verify secret + signing logic. |
| `408 Request Timeout` | Timestamp outside replay window. | Resend with fresh timestamp; do not loop. |
| `409 Conflict` | Same `provider_event_id` already recorded with a different body hash (`MAIL_WEBHOOK_EVENT_ID_CONFLICT`). | Investigate provider-side mutation; do not retry. |
| `413 Payload Too Large` | Body > 256 KiB (`MAIL_WEBHOOK_BODY_INVALID`). | Strip raw email or send pointer URL instead. |
| `503 Service Unavailable` | Receiver missing secret (mis-config). | Page the iai.one ops contact; do not retry blindly. |

Note: the receiver does **not** enforce `Content-Type: application/json`
strictly — it just needs the signature to verify. The receiver attempts
to parse the body as JSON to extract `provider_event_id`, but if the
body is not valid JSON (or is JSON without an id field), the request
still returns `202` with `provider_event_id: null` — dedup is then
impossible. We recommend providers always send valid JSON with a stable
`provider_event_id` (or `id` / `providerEventId` alias) so dedup works.

All non-`202` responses still emit an `evidence_id` in
`meta.evidence_id` and persist a record with the `rejectionCode`
field set. This lets ops correlate provider-side failures with
receiver-side evidence.

Successful response shape:

```json
{
  "ok": true,
  "data": {
    "evidence_id": "evt_inbound_<uuid>",
    "provider_event_id": "<echoed from body>",
    "received_at": "2026-04-28T11:26:31.114Z"
  },
  "meta": { "request_id": "req_<uuid>" }
}
```

Failure response shape:

```json
{
  "ok": false,
  "error": {
    "code": "MAIL_WEBHOOK_SIGNATURE_INVALID",
    "message": "...",
    "details": { ... }
  },
  "meta": {
    "request_id": "req_<uuid>",
    "evidence_id": "evt_inbound_<uuid>"
  }
}
```

`error.code` is one of:

* `MAIL_API_WEBHOOK_SECRET_MISSING` *(503; receiver-side, not your fault)*
* `MAIL_WEBHOOK_TIMESTAMP_MISSING` *(401)*
* `MAIL_WEBHOOK_TIMESTAMP_INVALID` *(401)*
* `MAIL_WEBHOOK_TIMESTAMP_OUT_OF_WINDOW` *(408)*
* `MAIL_WEBHOOK_SIGNATURE_MISSING` *(401)*
* `MAIL_WEBHOOK_SIGNATURE_INVALID` *(401)*
* `MAIL_WEBHOOK_BODY_INVALID` *(401)*

## 6. Secret distribution and rotation

* The secret is a **64-byte lowercase hex string** (32 bytes of
  entropy). Current production fingerprint is
  `sha256(secret) = 20e63b37…f39ea0`.
* Distribution: out-of-band, founder → provider integrator. Never
  embed the live secret in source, tickets, or this runbook.
* Rotation: receiver reads the secret per-request from
  `process.env.MAIL_API_WEBHOOK_SECRET`. With the current container
  start mode (`--env-file`), a rotation requires a `docker restart
  iai-mail-api-pathb` (≤2 s downtime). Co-ordinate by:
  1. iai.one ops adds the new secret as **secondary** (future
     extension; not yet implemented — for now: provider-side dual-sign
     window).
  2. Provider switches signing to the new secret.
  3. iai.one ops removes the old secret on the next deploy.
* If a secret leaks: page founder; rotate within 1 h; review the
  previous 24 h of evidence with `signatureValid=true` for
  unexpected `provider_event_id`s.

## 7. Reference signing snippets

### Node.js

```js
import { createHmac } from "node:crypto";

function signInboundWebhook(secret, body) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = createHmac("sha256", secret)
    .update(`${ts}.${body}`)
    .digest("hex");
  return {
    "content-type": "application/json",
    "x-mail-webhook-timestamp": ts,
    "x-mail-webhook-signature": sig
  };
}
```

### Python

```python
import hmac, hashlib, time

def sign_inbound_webhook(secret: bytes, body: bytes) -> dict[str, str]:
    ts = str(int(time.time()))
    sig = hmac.new(secret, f"{ts}.".encode() + body, hashlib.sha256).hexdigest()
    return {
        "content-type": "application/json",
        "x-mail-webhook-timestamp": ts,
        "x-mail-webhook-signature": sig,
    }
```

### Go

```go
import (
  "crypto/hmac"
  "crypto/sha256"
  "encoding/hex"
  "fmt"
  "time"
)

func SignInboundWebhook(secret, body []byte) map[string]string {
  ts := fmt.Sprintf("%d", time.Now().Unix())
  m := hmac.New(sha256.New, secret)
  m.Write([]byte(ts + "."))
  m.Write(body)
  return map[string]string{
    "content-type":              "application/json",
    "x-mail-webhook-timestamp":  ts,
    "x-mail-webhook-signature":  hex.EncodeToString(m.Sum(nil)),
  }
}
```

### curl one-liner (bash, OpenSSL ≥ 1.1)

```bash
SECRET='REDACTED'
BODY='{"provider_event_id":"evt_provider_abc","subject":"hello"}'
TS=$(date +%s)
# `openssl dgst -sha256 -hmac` output format varies by version. Strip
# any prefix like "(stdin)= " and any trailing fields, leaving just the
# lowercase hex digest.
SIG=$(printf '%s.%s' "$TS" "$BODY" \
  | openssl dgst -sha256 -hmac "$SECRET" \
  | sed -E 's/^[^=]*= *//; s/[[:space:]].*$//')
curl -i -X POST https://mail.iai.one/_mail/v1/webhooks/inbound \
  -H 'content-type: application/json' \
  -H "x-mail-webhook-timestamp: $TS" \
  -H "x-mail-webhook-signature: $SIG" \
  --data "$BODY"
```

If you need this snippet to be portable, prefer the Node.js or Python
form above — `openssl dgst`'s formatting has bitten more than one
integration.

## 8. Dry-run / self-test for a new provider

Before flipping production traffic over, the integrator should run
this matrix and capture the responses:

| # | Scenario | Expected status |
|---|---|---|
| 1 | Body w/o `x-mail-webhook-*` headers | `401` |
| 2 | Valid signature, fresh ts | `202`, `provider_event_id` echoed |
| 3 | Same body, ts = now − 1000 s | `408` |
| 4 | Same body, signature flipped one nibble | `401` |
| 5 | Body of 300 KiB | `413` |
| 6 | Content-Type: `text/plain` but body is JSON | `202` (content-type is not enforced; verify via response `evidence_id`) |

The corresponding ops-side check: each of the above persists an
evidence row queryable via
`GET /_mail/v1/webhooks/inbound/evidence?provider_event_id=…` (or
`?limit=N` for the global list). Cross-check the `rejectionCode`
field matches the scenario.

A working canonical example matrix from the production smoke run is
recorded in
`MAIL_IAI_ONE_INBOUND_WEBHOOK_PATH_B_DEPLOY_COMPLETE_2026-04-28.md`
under "Public smoke matrix re-run after swap".

## 9. Operational expectations on the iai.one side

* Persistence: every accepted webhook is appended as one NDJSON line
  to `/var/lib/iai-mail-api/inbound-evidence.ndjson` on the VPS host.
  This file survives container swaps (P6 swap on 2026-04-28 verified
  continuity across image upgrade).
* No outbound notification is emitted yet — Path B only persists
  evidence and answers GET queries. Downstream wiring (alerting,
  routing, automated reply) is a future workstream and out of scope
  here.
* Deduplication (P9, shipped 2026-04-28 evening): if the provider
  retries a delivery with the same `provider_event_id`:
  * **Same body** (signature-valid, identical SHA-256 over body) →
    handler returns `202` with the **original** `evidence_id` and
    `replay: true` + `replay_of: <original_evidence_id>`. No new
    evidence row is appended.
  * **Different body** (same id, mutated payload) → handler returns
    `409 MAIL_WEBHOOK_EVENT_ID_CONFLICT` with
    `details.existing_evidence_id`. A rejection row IS appended for
    auditability.
  * **No `provider_event_id`** in body → dedup is impossible; every
    request gets a fresh `evidence_id`. Provider should always send
    a stable id.
* No back-pressure: the handler is synchronous against the file
  sink. At the current 256 KiB cap and NDJSON write-once semantics,
  expected throughput is ≥ 200 req/s on the production VPS, well
  above realistic provider load. If a provider needs > 50 req/s
  sustained, file an issue first.

## 10. Contacts and escalation

* Primary: founder (out-of-band channel).
* Mail-platform repo: `apps/mail-api/src/inbound-webhook.ts`,
  `apps/mail-api/src/bootstrap.ts`,
  `tests/integration/mail-api-inbound-webhook.test.mjs`.
* On a 5xx storm: rollback path is documented in the deploy log
  addendum 2026-04-28T11:26Z (revert to image
  `iai-mail-api-pathb:6f8c02c`).
