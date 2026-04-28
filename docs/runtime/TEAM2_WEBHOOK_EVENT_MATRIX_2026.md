# TEAM2_WEBHOOK_EVENT_MATRIX_2026
## Team 2 Webhook Event Matrix
## Version 1.0
## Status: LOCKED FOR TEAM 2 / TEAM 3 / TEAM 4 / TEAM 5
## Owner: Team 2 Runtime and Platform Core
## Date: 2026-04-15

---

## 1. Muc tieu

Khoa event matrix cho cac async hooks ma surface teams can biet de build UI, ops va recovery logic dung huong.

---

## 2. Rules

- Moi event phai co idempotency key ro.
- Consumer nao khong xu ly duplicate thi khong duoc claim ready.
- Retry policy phai duoc biet truoc, khong duoc doan.

---

## 3. Current canonical events

| Event name | Producer | Consumer | Purpose | Minimum payload | Idempotency key | Retry class |
|---|---|---|---|---|---|---|
| `checkout.session.completed` | Team 2 checkout backend | Team 2 fulfillment, Team 4 ops | bat dau order/fulfillment chain | `checkout_session_id`, `buyer_id`, `product_code`, `locale` | `checkout_session_id` | retryable |
| `order.created` | Team 2 order service | Team 2 entitlement, Team 3 success UI, Team 4 ops | xac nhan order row da tao | `order_id`, `buyer_id`, `product_code`, `license_type`, `locale` | `order_id` | retryable |
| `entitlement.granted` | Team 2 fulfillment | Team 3 library UI, Team 4 ops | mo buyer access | `entitlement_id`, `buyer_id`, `product_code`, `access_status`, `update_window_end` | `entitlement_id` | retryable |
| `entitlement.updated` | Team 2 entitlement service | Team 3 library UI, Team 4 ops | cap nhat upgrade/expired_updates_only state | `entitlement_id`, `product_code`, `license_type`, `access_status` | `entitlement_id` | retryable |
| `product.version.released` | Team 2 / operations content pipeline | Team 3 library updates, Team 4 buyer comms | thong bao version moi | `product_code`, `version`, `released_at`, `version_type` | `product_code:version` | retryable |
| `fulfillment.failed` | Team 2 fulfillment | Team 4 support ops, Team 1 escalation | khoi dong incident path | `order_id`, `buyer_id`, `product_code`, `error_code`, `attempt_count` | `order_id:error_code` | high-priority retryable |
| `approval.waiting` | Team 2 runtime | Team Dash surfaces | surface human approval queue | `approval_id`, `workspace_id`, `flow_id`, `execution_id`, `sla_due_at` | `approval_id` | retryable |
| `execution.failed` | Team 2 runtime | Team Dash surfaces, Team 1 review | surface failed runtime state | `execution_id`, `workspace_id`, `flow_id`, `error_code`, `failed_at` | `execution_id` | retryable |
| `nft.partner.asset.synced` | `vc.vetuonglai.com` signed sender -> Team 2 receiver | Team 2 NFT runtime, Team 4 ops, Team 1 review | dong bo metadata/policy input cho NFT lane | `partner_event_id`, `partner_program_id`, `asset_id`, `source_timestamp` | `partner_event_id` | retryable with signature guard |
| `nft.asset.access.denied` | Team 2 NFT runtime | Team 4 ops, Team 1 review | surface denied protected asset attempts | `asset_access_event_id`, `subject_id`, `asset_id`, `reason_code`, `created_at` | `asset_access_event_id` | no blind retry |

---

## 4. Delivery expectations

- Webhook receivers phai tra 2xx chi khi da nhan va ghi du event.
- Xu ly business logic sau do neu can.
- Khong duoc thuc hien side effect nhay cam truoc khi idempotency check.

---

## 5. Security expectations

- signature verification bat buoc neu event di qua public receiver
- event timestamp phai duoc kiem tra
- stale replay phai co guard
- raw payload va normalized payload phai co audit reference neu event la sensitive

---

## 6. Team handoff notes

- Team 3 dung matrix nay de build success/library/update states.
- Team 4 dung matrix nay de build support/playbook/escalation.
- Team 5 khong duoc tu tao webhook names rieng khi dong vao shared contracts.
