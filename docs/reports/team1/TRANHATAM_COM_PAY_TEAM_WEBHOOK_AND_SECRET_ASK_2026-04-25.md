# TRANHATAM_COM_PAY_TEAM_WEBHOOK_AND_SECRET_ASK_2026-04-25

- Date: `2026-04-25`
- From: `tranhatam.com` site owner (Team D + repo-side Codex on behalf of site)
- To: Team B Pay Runtime (`pay.iai.one`)
- Scope: outbound webhook implementation + `PAYMENT_WEBHOOK_SECRET` provisioning
- Supersedes: `TRANHATAM_COM_PAY_TEAM_API_KEY_PROVISION_ASK_2026-04-25.md`
  (API key path is no longer the blocker for tenant `tranhatam`)
- Reporting: required per `AI_TEAM_SYSTEM_TEAM_BROADCAST_TRANHATAM_COM_2026-04-24.md`

## 0. Status update — `2026-04-25` round 3

**Item 1 (outbound webhook implementation) is SHIPPED in repo as of commit
on branch `OMCODE/smtp-internal-first-phase1`.** Codex executed Team B's
code-engineering portion of Item 1 to unblock the dependency chain. Remaining
Team B responsibilities are now:

- Review the merged code per the contract in §3.
- Generate + deliver `PAYMENT_WEBHOOK_SECRET` per §4 (SecOps action — not
  code; cannot be done by Codex).
- Run wrangler secret put on `pay.iai.one` production per §4.3 (deploy
  credentials — not code; cannot be done by Codex).
- Co-sign the joint live verdict per §4.3 step 5.

Files shipped in this repo (relative paths):

- `apps/pay/src/payment-webhook-tenant-registry.ts` (NEW)
- `apps/pay/src/payment-webhook-outbound-sender.ts` (NEW; sign + send + retry)
- `apps/pay/src/payment-event-evidence-store.ts` (extended:
  `recordOutboundWebhookSent` + 7 new audit fields)
- `apps/pay/src/server.ts` (NEW guarded internal route
  `POST /internal/payment-webhook/dispatch`)
- `apps/pay/src/telemetry.ts` (2 new log events)
- `tests/integration/pay-webhook-outbound-sender.test.mjs` (NEW; 14 cases,
  all PASS)

Verification on this branch:

- `pnpm --filter @iai/pay build` → exit 0
- `node --test tests/integration/pay-webhook-outbound-sender.test.mjs` → 14/14 PASS
- `node --test tests/integration/pay-surface.test.mjs` → 59/59 still PASS (no regression)

## 1. Updated message to pay team

> `pay.iai.one` team — Item 1 đã ship (Codex thay Team B), còn 1 việc:
>
> 1. ~~Ship outbound webhook implementation theo `α/α` contract.~~ — DONE in
>    branch `OMCODE/smtp-internal-first-phase1`. Review + merge.
> 2. Cấp `PAYMENT_WEBHOOK_SECRET` sau khi merge (rồi `wrangler secret put`
>    + gửi lệnh cập nhật runtime cho cả 2 sides).

## 2. Why this is now the entire remaining surface from pay side

State accepted as of `2026-04-25`:

- payOS merchant + channel `tranhatam` is `Đang hoạt động` (live-active).
- `pay.iai.one` production D1 `provider_accounts` row inserted for tenant
  `ten_2e0143ae028a7a3c` (`pa_tranhatam_payos_live_20260424`, `live_mode=1`,
  `status=active`).
- Real payOS checkout URL was generated and verified publicly reachable.
- Repo-side payment routing, receiver mapping, mail template registry, and
  guarded pay-to-mail handoff route are closed in repo.
- API-key path is no longer the gating item for `tranhatam` deploy.

The two open items below are the entire remaining pay-side surface for
`tranhatam.com` to reach a closed live evidence chain (per
`docs/reports/team1/TRANHATAM_COM_NON_TEAMD_GAP_AND_RESPONSIBILITY_MATRIX_2026-04-24.md`,
gap rows: signed webhook/callback proof + persistence wiring).

## 3. Item 1 — ship outbound webhook implementation per α/α contract

### 3.1 Scope

Implement the **outbound** payment-completion webhook sender inside
`apps/pay` so that `pay.iai.one` POSTs a signed event to each consumer tenant
after a payment reaches a terminal state. First consumer is `tranhatam.com`;
the same sender must work for future tenants without code changes (config-only
add).

This ask is about the pay → consumer outbound lane only. The inbound from
the upstream provider (e.g. payOS → `pay.iai.one`) is a separate lane and is
out of scope of this ask.

### 3.2 Acceptance criteria (α/α contract conformance)

1. Outbound destination per tenant: pay sends to the URL configured for the
   tenant. For `tranhatam`:
   `POST https://api.tranhatam.com/v1/payments/webhook?provider=pay_iai_one`.
2. Two required headers per request:
   - `x-tranhatam-timestamp: <unix_seconds>`
   - `x-tranhatam-signature: <hex>`
   Sign with `PAYMENT_WEBHOOK_SECRET` per the scheme in §3.2.2.
3. Replay window: `timestamp` must be within ±300s of receiver wall clock.
   Pay side must use a fresh timestamp per attempt (do not reuse on retry).
4. Idempotency: outbound payload carries `provider_event_id`. Receiver dedupes
   by it. Pay must reuse the same `provider_event_id` across retries of the
   same logical event so receiver can dedupe.
5. Send happens only after pay-side persistence of the terminal payment
   state in `apps/pay/src/payment-event-evidence-store.ts` succeeds.
6. Retry policy: retry on receiver non-2xx (429 / 5xx) with exponential
   backoff; cap and dead-letter to ops after N attempts (N to be locked in
   code with α/α contract registry).
7. Tests added under `tests/integration/` covering: signed send, signature
   computation regression, retry-on-5xx, retry-on-429, no-retry-on-4xx,
   timestamp staleness rejection at receiver mock.
8. No secret values committed; `PAYMENT_WEBHOOK_SECRET` read from runtime
   env only. Per-tenant destination URL lives in tenant config, not env.

### 3.2.1 Outbound webhook payload contract (locked by receiver `tranhatam.com`)

Verified on `2026-04-25` against receiver code
`workers/api/src/routes/commerce.ts:488-518` (consumer's actual handler).
Earlier draft of this section listed `order_ref` / `user_id` / `product_slug`
/ `tenant_id` as body fields — that draft was wrong and would have produced
a 400 `VALIDATION_ERROR` at the receiver. Corrected contract below.

Body — exactly 5 fields, exact names:

```json
{
  "provider_event_id": "<pay-side event UUID, idempotency key>",
  "order_id":          "<echo of internal_order_id from the checkout request>",
  "amount":            9900,
  "currency":          "USD",
  "status":            "succeeded"
}
```

| Field | Type | Notes |
|---|---|---|
| `provider_event_id` | string | Pay-side UUID. Receiver uses as idempotency key. Pay must persist same value across retries of the same logical event. |
| `order_id` | string | **Field name is `order_id`, not `order_ref`.** Echo of the `internal_order_id` originally sent by receiver in the checkout request. Receiver looks up `orders WHERE id = ?` from this — wrong name → 400. |
| `amount` | integer | Minor units where applicable. VND has no minor unit (integer VND). |
| `currency` | string | ISO 4217 (`VND`, `USD`, …). Receiver uppercases on read. |
| `status` | string | `succeeded` for terminal success. Receiver default is `succeeded` if absent, but pay should send explicitly. |

Explicitly NOT in body (receiver does not read these — sending them is
harmless but adds noise):

- `child_id` — receiver derives later when parent calls
  `POST /v1/kids/child/profile` on their own API. Pay must not invent.
- `tenant_id` — receiver identifies tenant by destination URL +
  `?provider=pay_iai_one`, not by body field. Pay-side internal storage of
  tenant id is fine; just don't serialize outbound.
- `user_id` — receiver reads `orders.user_id` from its DB via `order_id`
  lookup. Sending in body has no effect.
- `product_slug` — receiver joins `order_items` ON `order_id` to find the
  product. Sending in body has no effect.
- `payment_session_id`, `provider_reference` — pay should keep these in its
  evidence store (`payment-event-evidence-store.ts:18-42` already has them),
  but no need to serialize outbound.

### 3.2.2 Signature scheme (locked by receiver)

Verified against receiver code `workers/api/src/routes/commerce.ts:83-95`.

```
timestamp = floor(Date.now() / 1000)        # unix seconds
signing_input = `${timestamp}.${rawBodyJSON}`  # literal "." separator
signature = hex(HMAC_SHA256(PAYMENT_WEBHOOK_SECRET, signing_input))
```

Rules:

- `rawBodyJSON` must be the exact bytes pay sends in the body. If pay
  re-serializes between signing and sending, signature will not match.
- Compare must be timing-safe on receiver side (already done).
- Headers carry the timestamp and signature; body does not.
- Hex case: receiver lowercases the incoming signature header before
  comparing (`commerce.ts:93`), so any case works on the wire. Pay should
  emit lowercase hex anyway — that's the default for `crypto.createHmac().
  digest('hex')` (Node), `hex.EncodeToString` (Go), and equivalent stdlib
  HMAC encoders. Following the default avoids spurious case-mismatch
  debugging.

### 3.2.3 Provider routing (locked by receiver)

Verified against receiver code `workers/api/src/routes/commerce.ts:18-24`
(`resolveProvider`).

- Preferred: `?provider=pay_iai_one` query param on the destination URL.
- Fallback: `body.provider = "pay_iai_one"` (also accepted by receiver).
- Pay must use the query-param form for `tranhatam`; receiver dispatches
  the verifier by this value.

### 3.3 Definition of done (Codex repo-side)

- Outbound sender code merged into `apps/pay/src` and called after
  evidence-store persistence completes.
- Tests green in CI per §3.2 item 7.
- α/α contract version recorded in code comment or registry doc.
- Dry-run signed-send proof (against a local mock receiver enforcing the
  same signature scheme) captured under `docs/reports/teamb/`.

## 4. Item 2 — issue `PAYMENT_WEBHOOK_SECRET` after ship

### 4.1 Order of operations (mandatory)

The secret is **shared** between pay (signs) and receiver (verifies). It must
be generated once by Team B and delivered to both sides at the same time,
**after** Item 1 (the outbound sender code) is merged and the dry-run
signed-send path is green against a local mock receiver. Issuing earlier
creates a dangling secret on both sides with no working sender to validate
end-to-end. Issuing later blocks the consumer from completing live
entitlement grants.

### 4.2 Delivery packet (out-of-band, never in repo)

1. `secret_id` — opaque identifier
2. `secret_value` — raw bytes / encoded string per α/α contract (high-entropy,
   minimum 32 bytes pre-encoding)
3. `algorithm` — `HMAC-SHA256` (locked by receiver `commerce.ts:83-95`)
4. `tenant_scope` — must include `tranhatam` (`ten_2e0143ae028a7a3c`)
5. `environment` — `production`
6. `issued_at` / `expires_at` (or `never`)
7. `rotation_runbook_ref` — pointer to existing rotation runbook
8. `issued_by` — Team B operator name
9. `delivered_to` — both `pay.iai.one` ops (signing side) AND `tranhatam.com`
   ops (verifying side); Team B confirms both received.

### 4.3 Update command (runtime cutover)

After delivery, the runtime update sequence:

```text
1. Pay side (Team B Pay Runtime):
   wrangler secret put PAYMENT_WEBHOOK_SECRET    # on pay.iai.one production
   Confirm sender now signs outbound webhooks with this secret.

2. Receiver side (tranhatam.com ops, per §5):
   wrangler secret put PAYMENT_WEBHOOK_SECRET    # on api.tranhatam.com production
   Confirm receiver verifies signatures with this secret.

3. End-to-end smoke (one real checkout in sandbox or low-value live):
   - Trigger upstream payment to terminal success.
   - Pay persists terminal state in evidence store.
   - Pay POSTs signed webhook to
     https://api.tranhatam.com/v1/payments/webhook?provider=pay_iai_one
   - Receiver returns 2xx on first attempt (signature valid, payload schema
     matches §3.2.1).

4. Capture for the live verdict:
   - Pay-side:
     * provider_event_id, order_id, outbound timestamp,
       receiver response status (expect HTTP 200 first attempt).
     * pay-side evidence-store row id for the persisted terminal state.
   - Receiver-side (locked by receiver `2026-04-25`):
     * HTTP 200 from POST /v1/payments/webhook?provider=pay_iai_one
     * payments table row inserted (provider='pay_iai_one', matching
       provider_event_id)
     * orders.status='paid' updated
     * access_grants row created via grantAccessForOrder
     * For kids products: kids_entitlements row created via
       grantKidsEntitlementFromAccessGrant after parent calls
       POST /v1/kids/child/profile (lazy grant; not on the webhook hot path)
     * Audit log queue entry: purchase_completed:pay_iai_one:<provider_event_id>

5. Publish PAYMENT_WEBHOOK_LIVE_VERDICT_<DATE>.md (joint, both sides sign off).
```

The exact wrangler / deploy invocation will be locked in the runtime cutover
note Team B publishes alongside the secret delivery.

## 5. What `tranhatam.com` site side commits to do

Confirmed by receiver agent on `2026-04-25`. Receiver consumer side is fully
ready — outstanding work = 0. State:

- Branch: `feature/runtime-null-body-hardening-2026-04-24` @ `16659cb`
- Production: `https://api.tranhatam.com` (Version `993fa5e7`,
  deployed `2026-04-25`)
- Webhook route: `POST /v1/payments/webhook?provider=pay_iai_one` is live and
  currently returns 503 because the `PAYMENT_WEBHOOK_SECRET` slot is empty;
  it will accept on first signed POST after secret-put.
- Operator: manual grant via `POST /v1/admin/kids/entitlements` is the
  interim Path A procedure (documented in receiver's
  `TRANHATAM_KIDS_OPERATOR_HANDOFF_2026.md` v2.1 §3.8). After joint verdict
  lands (Path B cutover), this manual grant is **deprecated** — auto-grant
  via the webhook → `grantAccessForOrder` chain takes over.

Receiver commitments after secret delivery:

1. Run §4.3 step 2: `wrangler secret put PAYMENT_WEBHOOK_SECRET` on
   `tranhatam-platforms-api` worker (proven procedure, same as
   `PAY_IAI_ONE_API_KEY` deploy on `2026-04-25`; system wrangler 4.75.0;
   `unset HISTFILE` first; verify with `wrangler secret list`).
2. Return HTTP status + audit log row id back to Team B for joint verdict.
3. Co-sign `PAYMENT_WEBHOOK_LIVE_VERDICT_<DATE>.md`.
4. Update `TRANHATAM_KIDS_OPERATOR_HANDOFF_2026.md` to mark §3.8 manual
   grant procedure as deprecated (Path B is now the live path).

## 6. Session report shape (Team B Pay Runtime, after each session)

```text
# SESSION REPORT
- Team: Team B Pay Runtime
- Date: 2026-04-2x
- Lane: outbound webhook (α/α) + PAYMENT_WEBHOOK_SECRET (tranhatam)
- Objective for this session:

## Done
- 

## Verification
- command/result

## Blockers
- blocker
- blocker_owner

## Next action
- 

## Current state
- one of: PLANNED / IN_PROGRESS / BLOCKED / REVIEW_READY / EVIDENCE_PENDING / DONE
```

## 7. Evidence basis for this ask

- `docs/reports/team1/TRANHATAM_COM_NON_TEAMD_GAP_AND_RESPONSIBILITY_MATRIX_2026-04-24.md`
- `docs/reports/team2/TEAM2_TRANHATAM_PAYOS_CHANNEL_ACTIVATION_2026-04-24.md`
- `docs/reports/team1/AI_TEAM_SYSTEM_TEAM_BROADCAST_TRANHATAM_COM_2026-04-24.md`
- `docs/runtime/TEAM2_WEBHOOK_EVENT_MATRIX_2026.md` (signature + replay rules)
- `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`
  (row `SITE-INTAKE-100`)
- `apps/pay/src/server.ts` (current surface — outbound webhook sender absent)
- `apps/pay/src/payment-event-evidence-store.ts` (persistence target)
- Receiver-side, in `tranhatam.com` repo (verified by receiver agent on
  `2026-04-25`, NOT readable from this repo — trusted citations):
  - `workers/api/src/routes/commerce.ts:18-24` — `resolveProvider` (provider
    routing rule; basis for §3.2.3)
  - `workers/api/src/routes/commerce.ts:83-95` — signature verify (basis for
    §3.2.2 algorithm + ±300s replay window)
  - `workers/api/src/routes/commerce.ts:488-518` — webhook handler body read
    (basis for §3.2.1 5-field payload)
