PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md

Version 1.0

Status: Runtime Integration Contract Lock

Scope

Outbound adapter contract between `apps/pay` and the `mail.iai.one` delivery lane for payment email delivery

Owners

Payments / Team B / Team Email / Team SMTP / Platform / Team D

Priority

Highest

⸻

0. Core statement

`apps/pay` now exposes a locked payment email template registry for `tranhatam.com`.

That is useful, but it is not the same thing as live payment email delivery.

This file exists to lock the missing middle layer:

* how `apps/pay` must hand payment email work to the mail lane
* what fields are mandatory
* what delivery path is allowed
* what evidence is required before anyone can claim live payment email readiness

Until this adapter contract is implemented in a real outbound path, `apps/pay` should only be described as:

* registry locked
* runtime read surface available
* outbound delivery not yet proven

⸻

1. Purpose

This contract standardizes the handoff from `pay.iai.one` to the `mail.iai.one` lane so that:

* payment email does not bypass the mail platform
* sender policy remains consistent with the locked registry
* template usage stays traceable
* message idempotency remains explicit
* Team D, Team Email, Team SMTP, and Team B all use the same integration truth

⸻

2. Current repository truth

As of `2026-04-22`, the repository already contains:

* payment email template registry source:
  * `apps/pay/src/payment-email-templates.ts`
* runtime read surface:
  * `GET /api/payment-email-templates?domain=...`
* locked sender policy for `tranhatam.com`:
  * `pay@tranhatam.com`
  * `billing@tranhatam.com`
  * `support@tranhatam.com`
  * `noreply@tranhatam.com` forbidden for payment mail

As of this same checkpoint, the repository does not yet prove:

* a live outbound adapter that consumes this registry
* a bound `MAIL_API` or SMTP runtime for payment delivery
* a delivered payment email with `messageId`
* inbox proof for payment email

⸻

3. Non-negotiable boundary

`apps/pay` must not send payment email directly through a provider.

Allowed path:

`apps/pay`
→ pay outbound email adapter
→ `mail.iai.one` API
→ mail runtime/provider
→ inbox delivery

Not allowed:

* direct provider SDK from `apps/pay`
* direct SMTP session from `apps/pay`
* bypassing sender policy from the locked registry

This follows the canonical mail rule already locked in:

* `docs/iai-mail-platform/MAIL_IAI_ONE_API_SPEC_V1_FINAL.md`

⸻

4. Adapter ownership split

`apps/pay` owns:

* deciding when a payment email event should fire
* selecting the correct domain registry
* selecting the correct template id
* passing the correct payment metadata and variables
* keeping message idempotency explicit

Mail lane owns:

* sender/domain verification
* queueing and outbound delivery
* provider routing
* `messageId` creation and delivery events
* provider webhook ingestion
* inbox delivery observability

Team D owns:

* sender package truth
* mailbox/alias truth
* site activation evidence

⸻

5. Locked template ids for pay

The current payment email registry supports these template ids:

* `payment_receipt`
* `checkout_status_update`
* `payment_failed_notice`
* `refund_notice`

These ids are the canonical pay-side event vocabulary for the adapter.

⸻

6. Event-to-template mapping

Use this mapping unless a later locked decision changes it:

* successful confirmed payment
  * template id: `payment_receipt`
  * sender: `pay@tranhatam.com`
* checkout created or pending confirmation
  * template id: `checkout_status_update`
  * sender: `billing@tranhatam.com`
* payment failed, expired, or cancelled
  * template id: `payment_failed_notice`
  * sender: `billing@tranhatam.com`
* refund created or confirmed
  * template id: `refund_notice`
  * sender: `billing@tranhatam.com`

Reply-to is always:

* `support@tranhatam.com`

Never use:

* `noreply@tranhatam.com` for any payment email

⸻

7. Required adapter input from pay

Every outbound call from `apps/pay` into the mail lane must carry at minimum:

* `domain`
* `template_id`
* `locale`
* `message_idempotency_key`
* `recipient_email`
* `recipient_name` if known
* `order_id`
* `product_name`
* `amount`
* `currency`
* `support_email`
* `site_url`
* `x_site_key` or internal site identity reference
* `payment_session_id` if available
* `provider_reference` if available
* `request_id` or trace id

For checkout-pending or retryable states, also pass:

* `checkout_url`

For receipt or refund states, also pass when available:

* `invoice_url`
* `paid_at`
* `refund_amount`
* `refund_reason`

⸻

8. Adapter behavior inside pay

The adapter must do these steps in order:

1. resolve the correct registry by `domain`
2. reject if no registry exists
3. reject if the requested `template_id` does not exist in that registry
4. resolve sender and reply-to from the registry, not from caller guesswork
5. render subject and body from the locked localized copy
6. choose the correct locale branch
7. hand off one normalized payload to the mail lane
8. record handoff result for payment evidence tracking

If any of those steps fail, the adapter must not silently downgrade to a different sender or fallback template.

⸻

9. Mail lane handoff contract

The preferred initial integration path is:

* `POST /send`
* base spec:
  * `docs/iai-mail-platform/MAIL_IAI_ONE_API_SPEC_V1_FINAL.md`

Why this is the correct first path:

* `apps/pay` already owns locked subject and text content in its registry
* no additional mail-template registration step is required before first live integration
* sender policy can stay fully controlled by the pay registry

Required mail API headers:

* `Authorization: Bearer <MAIL_API_KEY>`
* `Content-Type: application/json`
* `X-Workspace-Id: <workspace_id>`
* `X-Request-Id: <request_id or idempotency key>`

Recommended stream:

* `transactional`

⸻

10. Normalized payload shape from pay to mail

The pay adapter should hand off a payload equivalent to:

```json
{
  "message_idempotency_key": "pay-tranhatam-order-123-payment_receipt",
  "stream": "transactional",
  "from": {
    "email": "pay@tranhatam.com",
    "name": "Tranhatam.com"
  },
  "reply_to": {
    "email": "support@tranhatam.com",
    "name": "Tranhatam.com Support"
  },
  "to": [
    {
      "email": "customer@example.com",
      "name": "Nguyen Van A"
    }
  ],
  "subject": "Tranhatam.com | Payment receipt #{{order_id}}",
  "text": "Rendered localized text body",
  "tags": ["pay", "payment_receipt", "tranhatam.com"],
  "metadata": {
    "source_app": "pay.iai.one",
    "source_domain": "tranhatam.com",
    "template_id": "payment_receipt",
    "order_id": "order_123",
    "payment_session_id": "ps_123",
    "provider_reference": "prov_123",
    "x_site_key": "site_tranhatam"
  }
}
```

This example is illustrative of the required contract shape.
Field values should remain aligned to the locked mail API spec and the pay registry.

⸻

11. Required response captured back into pay evidence

At minimum, the adapter integration must capture back:

* `message_id`
* `status`
* `provider_route` if returned
* request or trace id
* timestamp of enqueue or acceptance

The site must not claim payment email live readiness without:

* one action-backed payment event
* one returned `message_id`
* one inbox proof
* one D1 or canonical payment evidence row

⸻

12. Failure rules

The adapter must fail closed if:

* registry is missing
* sender is not allowed by the locked policy
* locale cannot be resolved safely
* required variables are missing
* `MAIL_API_KEY` is missing
* `X-Workspace-Id` is missing

Do not silently:

* swap sender identities
* downgrade to `noreply`
* skip idempotency
* call a different provider directly

⸻

13. Live readiness rule

`tranhatam.com` payment email may only be called live-ready when all of the following are true:

1. mailbox or alias binding is complete
2. outbound adapter consumes the locked registry
3. mail lane receives the normalized payload successfully
4. one real or true sandbox payment event triggers one real outbound email
5. evidence exists for:
   * provider reference
   * `message_id`
   * D1 or canonical payment record
   * inbox proof

If any one of these is missing, the correct status remains:

* `FORM_IN_PROGRESS`
* or `EXTERNAL_STEPS_PENDING`

depending on the governing board/checklist.

⸻

14. Required cross-references

Use this contract together with:

* `docs/reports/teamd/TRANHATAM_COM_PAYMENT_EMAIL_LIVE_CHECKLIST_2026-04-22.md`
* `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`
* `docs/reports/team1/PAY_IAI_ONE_TEST_AND_PAYMENT_INTAKE_STATUS_2026-04-22.md`
* `docs/iai-mail-platform/MAIL_IAI_ONE_API_SPEC_V1_FINAL.md`

⸻

15. Final direction

`apps/pay` already knows what payment email should say for `tranhatam.com`.

What it still needs for live truth is not more copy, but a disciplined outbound bridge into the mail lane.

This file locks that bridge so the next integration step can be executed cleanly, with no ambiguity about:

* sender policy
* template selection
* payload shape
* evidence threshold

