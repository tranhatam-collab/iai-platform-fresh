# PAY_TEAM_D_OMDALAT_COM_EMAIL_FLOW_SMOKE_2026-04-23
- Date: 2026-04-23
- Domain: `omdalat.com`
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
| `payment_receipt` | `202` | `msg_smoke_omdalat_com_01` | `pay@omdalat.com` | `support@omdalat.com` |
| `checkout_status_update` | `202` | `msg_smoke_omdalat_com_02` | `billing@omdalat.com` | `support@omdalat.com` |
| `payment_failed_notice` | `202` | `msg_smoke_omdalat_com_03` | `billing@omdalat.com` | `support@omdalat.com` |
| `refund_notice` | `202` | `msg_smoke_omdalat_com_04` | `billing@omdalat.com` | `support@omdalat.com` |
| `contact_request_received` | `202` | `msg_smoke_omdalat_com_05` | `support@omdalat.com` | `support@omdalat.com` |
| `support_request_received` | `202` | `msg_smoke_omdalat_com_06` | `support@omdalat.com` | `support@omdalat.com` |
| `join_request_received` | `202` | `msg_smoke_omdalat_com_07` | `support@omdalat.com` | `support@omdalat.com` |

## Mail API Handoff Checks
- PASS all requests hand off to /v1/send
- PASS all requests use Authorization bearer
- PASS all requests include workspace header
- PASS all smoke flows reached mail API handoff
