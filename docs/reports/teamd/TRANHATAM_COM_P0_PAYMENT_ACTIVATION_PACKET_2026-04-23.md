# TRANHATAM_COM_P0_PAYMENT_ACTIVATION_PACKET_2026-04-23

- Team: Team D Payments Activation + Treasury Ops
- Date: 2026-04-23
- Domain: `tranhatam.com`
- Intake row: `SITE-INTAKE-100`
- Priority: `P0`
- Current status: `FORM_IN_PROGRESS`
- Live claim: `FORBIDDEN_UNTIL_EVIDENCE_COMPLETE_AND_PAY_GATE_UNLOCKED`

## 1. Directive

Team D must complete `tranhatam.com` first before any other payment activation row moves forward.

No Team D row may move to `READY_FOR_LIVE` while the `pay.iai.one` production gate remains locked.

## 1A. International payment lane lock

Runtime mapping for `tranhatam.com` is currently dual-rail:

- VN lane (VND):
  - `recv_vnd_personal_tranhatam_acb` (primary)
  - `recv_vnd_personal_tranhatam_vcb` (fallback)
- international lane (USD):
  - `recv_usd_personal_tranhatam_paypal` (PayPal)

Policy requirement for checkout input:

- if `id_country=VN` -> enforce `VND`
- if `id_country` is non-VN -> enforce `USD`

This lock is repo/runtime-level only. It is not a live-payment proof claim.

## 2. Mailbox and alias truth required

All four identities must be bound and documented:

| address | purpose | payment sender allowed | current_status | required_evidence |
|---|---|---:|---|---|
| `pay@tranhatam.com` | payment receipt sender | yes | `PENDING` | mailbox or alias binding proof + inbox proof |
| `billing@tranhatam.com` | billing, failed-payment, refund sender | yes | `PENDING` | mailbox or alias binding proof + inbox proof |
| `support@tranhatam.com` | reply-to and support owner | reply-to only | `PENDING` | mailbox or alias binding proof + inbox proof |
| `noreply@tranhatam.com` | reserved system identity | no | `PENDING` | mailbox or alias binding proof, never payment sender |

Sender policy:

- `payment_receipt` must use `pay@tranhatam.com`
- `checkout_status_update`, `payment_failed_notice`, and `refund_notice` must use `billing@tranhatam.com`
- reply-to must always be `support@tranhatam.com`
- `noreply@tranhatam.com` must not be used for payment email

## 3. Inbound routing truth required

Team D + Team Email must confirm:

- `pay@tranhatam.com` inbound route
- `billing@tranhatam.com` inbound route
- `support@tranhatam.com` inbound route
- `noreply@tranhatam.com` inbound route or reserved-route policy
- Gmail inbox proof
- Outlook inbox proof if available
- internal inbox proof if used by operations

## 4. Runtime binding required

The pay runtime must have:

| key | type | owner | current_status | note |
|---|---|---|---|---|
| `MAIL_API_BASE_URL` | runtime var | Team Email + Team B | `PENDING` | expected default: `https://api.mail.iai.one/v1` |
| `MAIL_API_KEY` | secret | Team Email | `PENDING` | secure channel only |
| `MAIL_API_WORKSPACE_ID` | runtime var or secret | Team Email | `PENDING` | workspace that is allowed to send for `tranhatam.com` |
| `PAY_EMAIL_ADAPTER_INTERNAL_KEY` | secret | Team B | `PENDING` | guard key for `POST /internal/payment-email/send` |

The guarded pay route is:

```text
POST /internal/payment-email/send
header: x-pay-email-adapter-key: <PAY_EMAIL_ADAPTER_INTERNAL_KEY>
```

Secure terminal skeleton for Team B/Ops after values are received through secure channel:

```bash
cd /Users/tranhatam/Documents/Devnewproject/iai-platform-worktree
bash -lc '
set -euo pipefail

read -rp "PAY_WORKER_NAME [iai-pay]: " PAY_WORKER_NAME
PAY_WORKER_NAME="${PAY_WORKER_NAME:-iai-pay}"

read -rp "MAIL_API_BASE_URL [https://api.mail.iai.one/v1]: " MAIL_API_BASE_URL
MAIL_API_BASE_URL="${MAIL_API_BASE_URL:-https://api.mail.iai.one/v1}"

read -rsp "MAIL_API_KEY: " MAIL_API_KEY; echo
read -rsp "MAIL_API_WORKSPACE_ID: " MAIL_API_WORKSPACE_ID; echo
read -rsp "PAY_EMAIL_ADAPTER_INTERNAL_KEY: " PAY_EMAIL_ADAPTER_INTERNAL_KEY; echo

printf "%s" "$MAIL_API_BASE_URL" | wrangler secret put MAIL_API_BASE_URL --name "$PAY_WORKER_NAME"
printf "%s" "$MAIL_API_KEY" | wrangler secret put MAIL_API_KEY --name "$PAY_WORKER_NAME"
printf "%s" "$MAIL_API_WORKSPACE_ID" | wrangler secret put MAIL_API_WORKSPACE_ID --name "$PAY_WORKER_NAME"
printf "%s" "$PAY_EMAIL_ADAPTER_INTERNAL_KEY" | wrangler secret put PAY_EMAIL_ADAPTER_INTERNAL_KEY --name "$PAY_WORKER_NAME"

unset MAIL_API_BASE_URL MAIL_API_KEY MAIL_API_WORKSPACE_ID PAY_EMAIL_ADAPTER_INTERNAL_KEY
echo "Done: pay runtime mail adapter bindings updated on ${PAY_WORKER_NAME}."
'
```

Note:

- `MAIL_API_KEY` must come from Team Email through secure channel.
- `PAY_EMAIL_ADAPTER_INTERNAL_KEY` must be generated and controlled by Team B/Ops.
- If the production worker name differs from `iai-pay`, replace `PAY_WORKER_NAME` before running.

## 5. Payment proof required

One real checkout or one true sandbox checkout must produce:

- provider reference
- checkout or payment session reference
- mail `messageId`
- D1 or canonical evidence row
- inbox proof

Accepted proof set:

| proof_item | current_status |
|---|---|
| provider ref | `PENDING` |
| checkout/payment session ref | `PENDING` |
| mail messageId | `PENDING` |
| D1/canonical row | `PENDING` |
| inbox proof | `PENDING` |

## 6. Gate rule

`tranhatam.com` cannot be claimed as payment live if any of the following is true:

- `pay.iai.one` gate is `LOCK_RETAINED`
- mailbox or alias proof is missing
- inbound routing proof is missing
- `MAIL_API_KEY` is missing
- `MAIL_API_WORKSPACE_ID` is missing
- `PAY_EMAIL_ADAPTER_INTERNAL_KEY` is missing
- no real or true sandbox payment action exists
- no provider reference exists
- no mail `messageId` exists
- no D1 or canonical evidence row exists
- no inbox proof exists

## 7. Machine-readable evidence file

The current evidence packet is tracked at:

- `docs/reports/teamd/TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_2026-04-23.json`

Checker command:

```bash
node scripts/pay-team-d-tranhatam-evidence-check.mjs --date=2026-04-23
```

## 8. Team message

Team D must complete `tranhatam.com` first.

Current state:

- repo-side routing: ready
- repo-side templates: ready
- repo-side pay-to-mail adapter: ready
- guarded pay handoff route: ready
- mailbox/alias proof: pending
- inbound proof: pending
- runtime `MAIL_API` binding: pending
- real/sandbox payment proof: pending
- D1/canonical evidence: pending
- inbox proof: pending
- `READY_FOR_LIVE`: forbidden while gate remains locked
