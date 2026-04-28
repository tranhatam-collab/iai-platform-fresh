# PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1

Version 1.0

Status: Production UX Lock

Scope

Hosted checkout flow, payment session rendering, QR experience, payment status UX, retry patterns, source-site handoff, and customer-facing payment interaction for pay.iai.one

Owners

Product / Design / Frontend / Payments / Platform / Growth / Support

Priority

Highest

⸻

0. Core statement

pay.iai.one must own one internal hosted payment experience for the whole ecosystem.

Even when providers offer their own hosted pages, the ecosystem needs one consistent payment layer that:

* looks trustworthy
* explains clearly
* handles QR and multi-method payment logic
* reflects real internal state
* supports retries and recovery
* protects against false success assumptions

The checkout must feel calm, clear, and controlled.

⸻

1. Purpose

This file defines the minimum UX and flow rules for:

* hosted checkout page
* QR payment experience
* method selection
* payment status confirmation
* expiration behavior
* retry behavior
* receipt transition
* source-site success handoff

⸻

2. Design principles

2.1 Trust over decoration

The page must quickly answer:

* what is being paid for
* how much
* in which currency
* which site originated the request
* what happens next

2.2 One session, one truth

The UI must always reflect one central session state.

2.3 QR is stateful, not cosmetic

QR must be tied to session, amount, expiration, and reference.

2.4 Do not promise success early

User return from provider or bank app is not enough.
The UI must say payment is awaiting confirmation until internal truth is confirmed.

2.5 Keep the payer calm

The flow should reduce confusion in case of delay, retry, or pending verification.

⸻

3. Canonical route family

Required routes:

* /checkout/{payment_session_id}
* /checkout/{payment_session_id}/status
* /checkout/{payment_session_id}/expired
* /receipt/{payment_or_receipt_id}
* /payment/{payment_session_id}/help

The main hosted experience begins at:

https://pay.iai.one/checkout/{payment_session_id}

⸻

4. Checkout page goals

The hosted checkout page must support:

* payment method selection
* QR display
* deep links where relevant
* bank instructions
* card/provider redirect button
* wallet or internal balance option in later phases
* session countdown
* state polling
* pending confirmation communication
* help and fallback instructions

⸻

5. Required page sections

5.1 Top trust bar

Must show:

* originating site or service name
* order or payment reference
* secure payment indicator
* session expiration indicator

5.2 Order summary

Must show:

* product or purpose title
* optional short description
* amount
* currency
* customer identity summary if available
* order reference

5.3 Method selector

Available methods may include:

* QR bank transfer
* direct payment link
* card checkout
* provider wallet
* manual bank transfer instructions
* future internal balance

5.4 Active payment panel

Displays method-specific content.

5.5 Live status area

Must show:

* awaiting payment
* payment detected
* awaiting confirmation
* payment confirmed
* failed
* expired

5.6 Help and support section

Must show what user should do if:

* app closed
* bank transfer delayed
* wrong amount sent
* QR expired
* provider return failed

⸻

6. Core states of checkout UI

The checkout UI must visually support these states:

* created
* active
* awaiting_payment
* awaiting_confirmation
* paid_pending_internal_confirmation
* confirmed
* failed
* expired
* cancelled

The UI wording must map to internal truth, not provider optimism.

⸻

7. Method selection model

The method selector must:

* show only methods available for session currency and site
* clearly indicate recommended method
* allow switch between methods when policy allows
* preserve same session truth
* update instructions panel without losing order context

Do not force every site to build custom method UI.

⸻

8. QR payment flow

For QR-capable methods, the active payment panel must show:

* QR image
* exact amount
* currency
* payment reference
* receiving account or masked summary if needed
* countdown until expiration
* refresh button if renewal policy allows
* copy reference button
* copy amount button
* open banking app if deeplink exists

If the user reports having already paid, provide:

* “I have completed payment” button only as soft signal
* not a final success action

That button should move UI to awaiting_confirmation, not confirmed.

⸻

9. Bank transfer instruction block

For manual or semi-manual rail flows, show:

* bank name
* account holder
* masked account number
* transfer amount
* transfer reference
* note: exact reference required
* note: do not send wrong amount if strict matching applies
* note: payment will be confirmed after verification

This block must be easy to copy.

⸻

10. Card or provider redirect flow

For redirect-based methods:

* show one primary action button
* explain that user will return after payment
* after return, session must re-check internal state
* do not instantly mark success from querystring alone

Return states:

* awaiting_confirmation
* confirmed
* failed
* expired

⸻

11. Awaiting confirmation state

This is one of the most important UX states.

It must explain:

* payment signal has been received or user has returned
* system is verifying payment with provider or treasury
* access will be granted only after confirmation
* user does not need to pay again unless told otherwise
* status will update automatically

Must offer:

* status refresh
* return later link
* support link
* order reference copy

⸻

12. Confirmed state

When internal confirmation is complete, show:

* payment confirmed
* amount and currency
* confirmed timestamp
* receipt link
* next step
* return to originating site button if provided

Possible next-step text:

* access unlocked
* membership activated
* order recorded
* onboarding will begin
* receipt available

⸻

13. Expired state

If session expires before confirmation:

Show:

* session expired
* no payment detected within allowed time
* create new payment session option if allowed
* support note if user already paid close to expiry

If late payment later arrives, internal system must still handle via reconciliation; UI should avoid misleading finality.

⸻

14. Failed state

If provider or method fails:

Show:

* payment could not be completed
* no confirmed charge recorded yet unless otherwise known
* retry options
* choose different method option if allowed
* support guidance if uncertain

⸻

15. Cancelled state

If session intentionally cancelled:

Show:

* payment cancelled
* no access granted
* return to site button
* retry or reopen order if allowed

⸻

16. Multi-method retry pattern

If one method fails or times out, user should be able to:

* retry same method
* switch to another method
* request new session if current session expired
* keep order context intact

Do not create confusing duplicated orders unless product policy requires it.

⸻

17. Session countdown behavior

Every session page should show remaining validity where relevant.

Rules:

* visible countdown for QR or expiring links
* warning when near expiration
* graceful state change after expiry
* no silent expiration while user is staring at page

⸻

18. Polling and real-time updates

Recommended V1 approach:

* periodic polling for session status
* optional real-time enhancement later

Status polling must support:

* active
* awaiting_confirmation
* confirmed
* failed
* expired

When status changes to confirmed, UI should transition smoothly and stop unnecessary polling.

⸻

19. Source-site return strategy

The checkout must support:

* success_url
* cancel_url
* status_url or internal polling contract
* post-confirmation redirect CTA

But final entitlement must depend on internal confirmation, not raw redirect.

Recommended behavior:

* after confirmed → show confirmation view → then allow return to source site
* source site may also poll or receive callback independently

⸻

20. Receipt page requirements

Receipt page should show:

* receipt id
* payment reference
* date and time
* amount
* currency
* originating site
* customer summary if safe
* payment method summary
* confirmed status
* downloadable or shareable receipt option later

Do not expose sensitive payout or treasury internals on customer receipt.

⸻

21. Mobile-first requirements

Because QR and wallet rails are mobile-heavy, checkout must be mobile-first.

Required mobile behavior:

* QR visible and properly sized
* copy buttons reachable
* deeplink button obvious
* long references wrap cleanly
* countdown visible
* status state readable without scrolling too much
* return from banking app handled safely

⸻

22. Desktop behavior

Desktop should support:

* QR scan from mobile
* side-by-side order summary and QR/instructions
* visible status area
* easy copy of reference and amount
* receipt transition without reload confusion

⸻

23. Accessibility and clarity

Must support:

* high-contrast readable status
* clear text hierarchy
* no ambiguous success color before confirmation
* button states obvious
* keyboard support where relevant
* alt text or descriptive labels for QR and copy actions
* language clarity in Vietnamese first, English second where applicable

⸻

24. Required copy intent

The checkout language must feel:

* calm
* precise
* trustworthy
* non-hype
* non-sales
* action-clear

Avoid vague phrases like:

* payment successful immediately after redirect
* your access is guaranteed before confirmation
* please wait without context

Prefer clear state language such as:

* awaiting payment
* payment detected, verifying
* payment confirmed
* session expired
* payment could not be confirmed

⸻

25. Suggested page layout

Desktop

Left:

* order summary
* site identity
* trust cues

Right:

* method selector
* QR or active method panel
* live status
* support/help

Mobile

Top:

* amount + site
    Middle:
* method selector
* QR or active method content
    Below:
* status area
* reference copy block
* help

⸻

26. Error-handling UX

The checkout must handle:

* QR generation failed
* provider redirect unavailable
* polling failed temporarily
* session data stale
* callback delayed
* order metadata missing but session valid

User-facing response must never expose sensitive internals, but should offer stable next step.

⸻

27. Help surface

At minimum include:

* what to do if payment already sent
* what to do if amount sent was wrong
* what to do if app returned but access not yet active
* what to do if session expired during transfer
* how to contact support with payment reference

⸻

28. Required analytics events

The checkout UI should emit analytics for:

* checkout_loaded
* method_selected
* qr_viewed
* copy_reference_clicked
* copy_amount_clicked
* deeplink_opened
* provider_redirect_started
* returned_from_provider
* awaiting_confirmation_seen
* confirmed_seen
* retry_selected
* help_opened

Do not let analytics become the source of truth.
They are product signals only.

⸻

29. Minimum acceptance criteria

The hosted checkout is not ready until:

1. one internal session URL renders correctly
2. user can clearly see order summary and amount
3. dynamic QR tied to session can be displayed
4. polling updates state from awaiting_payment to awaiting_confirmation to confirmed
5. return from provider does not falsely mark success
6. expired session state is handled clearly
7. confirmed state leads to receipt and return path
8. mobile layout works cleanly for QR flow
9. support/help guidance exists
10. UI language remains calm and unambiguous

⸻

30. Future expansion hooks

The checkout should be ready to later support:

* saved payout or payment identities where allowed
* internal wallet balance payment
* multi-currency display
* FX quote display
* installment or staged payment
* digital asset payment rail
* region-specific method ordering
* loyalty or entitlement preview

These are future layers, not V1 blockers.

⸻

31. Final direction

The hosted checkout is where ecosystem payment trust becomes visible.

It must not behave like a random provider redirect helper.
It must behave like one controlled payment surface owned by the ecosystem.

One session.
One order context.
One clear amount.
One truthful state model.
One calm experience.

That is the correct foundation for pay.iai.one.
