# PAY_TEAM_D_TRANHATAM_COM_EMAIL_FLOW_SMOKE_2026-04-23
- Date: 2026-04-23
- Domain: `tranhatam.com`
- Template route status: `200`
- Template count: `14`
- Overall: `PASS`

## Required Template Presence
- PASS `payment_receipt`
- PASS `checkout_status_update`
- PASS `payment_failed_notice`
- PASS `refund_notice`
- PASS `contact_request_received`
- PASS `support_request_received`
- PASS `join_request_received`

## Flow Smoke Results
| template_id | route_status | message_id | sender | reply_to |
|---|---:|---|---|---|
| `payment_receipt` | `202` | `msg_smoke_tranhatam_com_01` | `pay@tranhatam.com` | `support@tranhatam.com` |
| `checkout_status_update` | `202` | `msg_smoke_tranhatam_com_02` | `billing@tranhatam.com` | `support@tranhatam.com` |
| `payment_failed_notice` | `202` | `msg_smoke_tranhatam_com_03` | `billing@tranhatam.com` | `support@tranhatam.com` |
| `refund_notice` | `202` | `msg_smoke_tranhatam_com_04` | `billing@tranhatam.com` | `support@tranhatam.com` |
| `contact_request_received` | `202` | `msg_smoke_tranhatam_com_05` | `support@tranhatam.com` | `support@tranhatam.com` |
| `support_request_received` | `202` | `msg_smoke_tranhatam_com_06` | `support@tranhatam.com` | `support@tranhatam.com` |
| `join_request_received` | `202` | `msg_smoke_tranhatam_com_07` | `support@tranhatam.com` | `support@tranhatam.com` |

## Mail API Handoff Checks
- PASS all requests hand off to /v1/send
- PASS all requests use Authorization bearer
- PASS all requests include workspace header
- PASS all smoke flows reached mail API handoff
