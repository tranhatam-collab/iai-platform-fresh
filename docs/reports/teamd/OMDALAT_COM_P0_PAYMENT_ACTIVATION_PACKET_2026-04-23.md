# OMDALAT_COM_P0_PAYMENT_ACTIVATION_PACKET_2026-04-23

- Team: Team D Payments Activation + Treasury Ops
- Date: 2026-04-23
- Domain: `omdalat.com`
- Intake row: `SITE-INTAKE-104`
- Legal owner: `Công ty TNHH SX - TM - DV Thai Lam`
- Primary receiver: `recv_vnd_thailam_acb`
- Priority: `P0`
- Current status: `FORM_IN_PROGRESS`
- Live claim: `FORBIDDEN_UNTIL_EVIDENCE_COMPLETE_AND_PAY_GATE_UNLOCKED`

## 1. Directive

`omdalat.com` is now attached to the Thai Lam company receiver for the VN one-time VND launch lane.

This does not make the site live-ready yet. It only locks the legal owner and primary VND receiver truth.

`app.omdalat.com` remains deferred until Team D and Product confirm whether the app initiates checkout or only consumes post-payment state.

## 2. Legal owner and receiver truth

| field | value | status |
|---|---|---|
| legal_owner | `Công ty TNHH SX - TM - DV Thai Lam` | `LOCKED` |
| owner_type | `company` | `LOCKED` |
| collection_required | `yes` | `LOCKED` |
| payout_required | `no` | `LOCKED_FOR_CURRENT_PHASE` |
| market_type | `VN` | `LOCKED` |
| currency_scope | `VN_VND` | `LOCKED` |
| primary_receiver_id | `recv_vnd_thailam_acb` | `LOCKED` |
| bank | `Ngân hàng TMCP Á Châu (ACB)` | `LOCKED_FROM_RECEIVER_REGISTRY` |
| account_number | `43545878` | `LOCKED_FROM_RECEIVER_REGISTRY` |
| legal_name_visible | `CONG TY TNHH SX - TM - DV THAI LAM` | `LOCKED_FROM_RECEIVER_REGISTRY` |

## 3. Mailbox and alias truth required

All four identities must be bound and documented:

| address | purpose | payment sender allowed | current_status | required_evidence |
|---|---|---:|---|---|
| `pay@omdalat.com` | payment receipt sender | yes | `CONFIRMED_ALIAS` | alias routes to `support@omdalat.com`; see `docs/iai-mail-platform/OMDALAT_COM_TEAM_EMAIL_SMTP_MAILBOX_INBOUND_PROOF_2026-04-23.md` |
| `billing@omdalat.com` | billing, failed-payment, refund sender | yes | `CONFIRMED_ALIAS` | alias routes to `support@omdalat.com`; see `docs/iai-mail-platform/OMDALAT_COM_TEAM_EMAIL_SMTP_MAILBOX_INBOUND_PROOF_2026-04-23.md` |
| `support@omdalat.com` | reply-to and support owner | reply-to only | `CONFIRMED_MAILBOX` | mailbox route proof captured |
| `noreply@omdalat.com` | reserved system identity | no | `CONFIRMED_MAILBOX` | mailbox route proof captured; never payment sender |

Sender policy:

- `payment_receipt` must use `pay@omdalat.com`
- `checkout_status_update`, `payment_failed_notice`, and `refund_notice` must use `billing@omdalat.com`
- reply-to must always be `support@omdalat.com`
- `noreply@omdalat.com` must not be used for payment email

Team Email SMTP proof update:

- mailbox/alias binding and inbound route proof are now captured in `docs/iai-mail-platform/OMDALAT_COM_TEAM_EMAIL_SMTP_MAILBOX_INBOUND_PROOF_2026-04-23.md`
- this does not close outbound payment live because runtime secrets, provider action, mail `messageId`, D1/canonical row, external inbox proof, and pay gate unlock are still required

## 4. Runtime binding required

The pay runtime must have:

| key | type | owner | current_status | note |
|---|---|---|---|---|
| `MAIL_API_BASE_URL` | runtime var | Team Email + Team B | `PENDING` | expected default: `https://api.mail.iai.one/v1` |
| `MAIL_API_KEY` | secret | Team Email | `PENDING` | secure channel only |
| `MAIL_API_WORKSPACE_ID` | runtime var or secret | Team Email | `PENDING` | workspace allowed to send for `omdalat.com` |
| `PAY_EMAIL_ADAPTER_INTERNAL_KEY` | secret | Team B | `PENDING` | guard key for `POST /internal/payment-email/send` |

The guarded pay route is:

```text
POST /internal/payment-email/send
header: x-pay-email-adapter-key: <PAY_EMAIL_ADAPTER_INTERNAL_KEY>
```

Secure terminal skeleton after values are received through secure channel:

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

`omdalat.com` cannot be claimed as payment live if any of the following is true:

- `pay.iai.one` gate is `LOCK_RETAINED`
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

- `docs/reports/teamd/OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_2026-04-23.json`

Checker command:

```bash
node scripts/pay-team-d-omdalat-evidence-check.mjs --date=2026-04-23
```

## 8. Team message

Team D update:

- `omdalat.com` legal owner is locked to `Công ty TNHH SX - TM - DV Thai Lam`
- primary VND receiver is locked to `recv_vnd_thailam_acb`
- repo-side receiver routing is ready
- repo-side templates are ready
- payment live claim remains blocked until mailbox, runtime, provider, D1, and inbox proof are complete
- `app.omdalat.com` is not automatically activated by this decision
