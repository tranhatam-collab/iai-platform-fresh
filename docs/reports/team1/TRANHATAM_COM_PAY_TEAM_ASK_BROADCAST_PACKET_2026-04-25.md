# TRANHATAM_COM_PAY_TEAM_ASK_BROADCAST_PACKET_2026-04-25

- Date: `2026-04-25`
- Source ask doc: `docs/reports/team1/TRANHATAM_COM_PAY_TEAM_WEBHOOK_AND_SECRET_ASK_2026-04-25.md`
- Mode: B (agent drafts + fires Notion/GitHub once founder supplies parent page id + repo URL)
- Channels in this packet:
  1. GitHub issue body (ready)
  2. Notion bilingual page body (ready)
  3. Slack 1-line + email subject + email body (founder paste-and-send)
- Skipped: nothing — Slack/email left as paste-ready text per founder direction.

---

## 1. GitHub issue (ready to fire via `gh issue create`)

- **Repo**: `<FOUNDER FILL: e.g. iai-one/iai-platform>`
- **Title**: `[ASK] Team B Pay Runtime — Ship outbound webhook + PAYMENT_WEBHOOK_SECRET to tranhatam.com`
- **Labels**: `pay-runtime`, `outbound-webhook`, `tranhatam.com`
- **Assignee**: `<FOUNDER FILL: Team B Pay Runtime lead GitHub handle>`

### Body

```markdown
## TL;DR

`pay.iai.one` team — chỉ còn 2 việc để đóng evidence chain cho `tranhatam.com`:

1. **Ship outbound webhook implementation** theo α/α contract (locked payload + signature verified against receiver code on 2026-04-25).
2. **Cấp `PAYMENT_WEBHOOK_SECRET`** sau khi ship — kèm lệnh cập nhật runtime cho cả pay side và receiver side.

Full ask: `docs/reports/team1/TRANHATAM_COM_PAY_TEAM_WEBHOOK_AND_SECRET_ASK_2026-04-25.md`.

## Why this is the entire remaining pay-side surface

- payOS merchant + channel `tranhatam` đã `Đang hoạt động` (live-active).
- `pay.iai.one` D1 `provider_accounts` row đã insert cho tenant `ten_2e0143ae028a7a3c` (`pa_tranhatam_payos_live_20260424`, `live_mode=1`).
- Real payOS checkout URL đã verify reachable.
- Repo-side payment routing, receiver mapping, mail registry, guarded pay→mail handoff: **closed**.
- API-key path không còn là blocker cho deploy `tranhatam`.

→ 2 item dưới = toàn bộ pay-side surface còn lại để đạt closed live evidence chain.

## Item 1 — Outbound webhook (α/α contract)

**Endpoint (per tenant config, not env):**
`POST https://api.tranhatam.com/v1/payments/webhook?provider=pay_iai_one`

**Headers:**
- `x-tranhatam-timestamp: <unix_seconds>`
- `x-tranhatam-signature: <hex(HMAC_SHA256(PAYMENT_WEBHOOK_SECRET, "${ts}.${rawBodyJSON}"))>`

**Body — exactly 5 fields (locked against receiver `commerce.ts:488-518`):**

```json
{
  "provider_event_id": "<pay-side UUID, idempotency key>",
  "order_id":          "<echo of internal_order_id from checkout>",
  "amount":            9900,
  "currency":          "USD",
  "status":            "succeeded"
}
```

> ⚠️ Field name là `order_id`, **không phải `order_ref`**. Receiver lookup `orders WHERE id = ?`. Sai tên → 400 VALIDATION_ERROR.
> Không gửi `child_id`, `tenant_id`, `user_id`, `product_slug` trong body — receiver derive từ DB.

**Signature scheme** (locked against receiver `commerce.ts:83-95`):

```
timestamp = floor(Date.now() / 1000)
signing_input = `${timestamp}.${rawBodyJSON}`   # literal "." separator
signature = hex(HMAC_SHA256(PAYMENT_WEBHOOK_SECRET, signing_input))
```

`rawBodyJSON` phải là exact bytes pay gửi. Re-serialize giữa sign và send → signature không khớp.

**Provider routing** (locked against `commerce.ts:18-24`):
- Preferred: `?provider=pay_iai_one` query param.
- Fallback: `body.provider = "pay_iai_one"`.
- Pay phải dùng query-param form cho `tranhatam`.

**Replay window:** ±300s. Fresh timestamp mỗi attempt.
**Idempotency:** reuse `provider_event_id` across retries của cùng logical event.
**Order:** send chỉ sau khi pay-side persistence terminal state ở `apps/pay/src/payment-event-evidence-store.ts` thành công.
**Retry:** exponential backoff trên non-2xx (429/5xx); cap + dead-letter sau N attempts (lock N trong α/α registry).

### Definition of done

- [ ] Outbound sender code merged vào `apps/pay/src`, gọi sau evidence-store persistence.
- [ ] Tests xanh CI: signed send, signature regression, retry-on-5xx, retry-on-429, no-retry-on-4xx, timestamp staleness rejection.
- [ ] α/α contract version recorded trong code comment hoặc registry doc.
- [ ] Dry-run signed-send proof (against local mock receiver) captured ở `docs/reports/teamb/`.
- [ ] **Không** secret value commit vào repo. `PAYMENT_WEBHOOK_SECRET` đọc từ runtime env. Per-tenant URL trong tenant config.

## Item 2 — Issue `PAYMENT_WEBHOOK_SECRET` after ship

**Order of operations (mandatory):** secret là **shared** giữa pay (signs) và receiver (verifies). Generate **một lần** bởi Team B sau khi Item 1 merged + dry-run xanh. Issue sớm hơn → dangling secret. Issue muộn hơn → block consumer entitlement grants.

**Delivery packet (out-of-band, KHÔNG vào repo):**

1. `secret_id` — opaque identifier
2. `secret_value` — high-entropy, ≥32 bytes pre-encoding
3. `algorithm` — `HMAC-SHA256` (locked)
4. `tenant_scope` — bao gồm `tranhatam` (`ten_2e0143ae028a7a3c`)
5. `environment` — `production`
6. `issued_at` / `expires_at`
7. `rotation_runbook_ref`
8. `issued_by` — Team B operator name
9. `delivered_to` — cả `pay.iai.one` ops AND `tranhatam.com` ops; Team B confirm cả 2 received.

**Runtime cutover sequence:**

```text
1. Pay side:      wrangler secret put PAYMENT_WEBHOOK_SECRET (pay.iai.one prod)
2. Receiver side: wrangler secret put PAYMENT_WEBHOOK_SECRET (api.tranhatam.com prod)
3. End-to-end smoke: 1 real checkout → terminal success → pay POSTs signed webhook → receiver 2xx first attempt.
4. Capture evidence (pay-side + receiver-side rows).
5. Publish joint PAYMENT_WEBHOOK_LIVE_VERDICT_<DATE>.md (cả 2 side sign off).
```

## Receiver side state (tranhatam.com — already ready)

- Branch: `feature/runtime-null-body-hardening-2026-04-24` @ `16659cb`
- Prod: `https://api.tranhatam.com` (Version `993fa5e7`, deployed 2026-04-25)
- `POST /v1/payments/webhook?provider=pay_iai_one` live, hiện trả 503 vì `PAYMENT_WEBHOOK_SECRET` slot rỗng.
- Sẽ accept ngay first signed POST sau secret-put.
- Outstanding work receiver side = **0**.

## Session report shape (Team B, sau mỗi session)

```text
# SESSION REPORT
- Team: Team B Pay Runtime
- Date: 2026-04-2x
- Lane: outbound webhook (α/α) + PAYMENT_WEBHOOK_SECRET (tranhatam)
- Objective:

## Done
-

## Verification
- command/result

## Blockers
- blocker / blocker_owner

## Next action
-

## Current state
- PLANNED / IN_PROGRESS / BLOCKED / REVIEW_READY / EVIDENCE_PENDING / DONE
```

## Evidence basis

- `docs/reports/team1/TRANHATAM_COM_NON_TEAMD_GAP_AND_RESPONSIBILITY_MATRIX_2026-04-24.md`
- `docs/reports/team2/TEAM2_TRANHATAM_PAYOS_CHANNEL_ACTIVATION_2026-04-24.md`
- `docs/runtime/TEAM2_WEBHOOK_EVENT_MATRIX_2026.md`
- `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md` (`SITE-INTAKE-100`)
- `apps/pay/src/server.ts`, `apps/pay/src/payment-event-evidence-store.ts`
- Receiver-side (verified 2026-04-25 by receiver agent):
  - `workers/api/src/routes/commerce.ts:18-24` (resolveProvider)
  - `workers/api/src/routes/commerce.ts:83-95` (signature verify)
  - `workers/api/src/routes/commerce.ts:488-518` (webhook handler body read)
```

---

## 2. Notion bilingual page (ready to create via `notion-create-pages`)

- **Parent page id**: `<FOUNDER FILL: Notion parent page UUID>`
- **Title**: `[ASK 2026-04-25] Team B Pay Runtime — Outbound webhook + PAYMENT_WEBHOOK_SECRET (tranhatam.com)`

### Body (Notion markdown blocks)

```markdown
# Tóm tắt / Summary

| 🇻🇳 Tiếng Việt | 🇬🇧 English |
|---|---|
| Team B Pay Runtime cần ship 2 việc để đóng evidence chain cho `tranhatam.com`: (1) outbound webhook theo α/α contract đã lock; (2) cấp `PAYMENT_WEBHOOK_SECRET` sau khi ship + lệnh cập nhật runtime cho cả 2 side. | Team B Pay Runtime to ship 2 items to close the live evidence chain for `tranhatam.com`: (1) outbound webhook per locked α/α contract; (2) provision `PAYMENT_WEBHOOK_SECRET` after ship + runtime cutover commands for both sides. |

# Trạng thái / State

- payOS merchant + channel `tranhatam` = `Đang hoạt động` / live-active
- `pay.iai.one` D1 `provider_accounts` row inserted (`pa_tranhatam_payos_live_20260424`, `live_mode=1`)
- Real payOS checkout URL verified reachable
- API-key path **no longer the blocker** for `tranhatam` deploy
- Receiver side (`api.tranhatam.com`) outstanding work = **0**, currently 503 vì secret slot rỗng

# Item 1 — Outbound webhook (α/α contract)

**Endpoint:** `POST https://api.tranhatam.com/v1/payments/webhook?provider=pay_iai_one`

**Headers:** `x-tranhatam-timestamp`, `x-tranhatam-signature`

**Body — 5 fields exactly:** `provider_event_id`, `order_id` (NOT `order_ref`), `amount`, `currency`, `status`

**Signature:** `hex(HMAC_SHA256(PAYMENT_WEBHOOK_SECRET, "${ts}.${rawBodyJSON}"))` — literal `.` separator, exact body bytes.

**Replay window:** ±300s. **Idempotency:** stable `provider_event_id` across retries. **Send order:** only after pay-side persistence succeeds.

# Item 2 — Provision PAYMENT_WEBHOOK_SECRET

**Order:** AFTER Item 1 merged + dry-run xanh (not before, not after).

**Delivery packet:** 9 fields out-of-band (xem ask doc §4.2).

**Cutover:** `wrangler secret put` cả 2 side → 1 real smoke checkout → joint verdict doc.

# Tham chiếu / References

- Full ask doc: `docs/reports/team1/TRANHATAM_COM_PAY_TEAM_WEBHOOK_AND_SECRET_ASK_2026-04-25.md`
- GitHub issue: `<FOUNDER FILL after issue created>`
- Receiver-side code anchors:
  - `workers/api/src/routes/commerce.ts:18-24` — provider routing
  - `workers/api/src/routes/commerce.ts:83-95` — signature verify
  - `workers/api/src/routes/commerce.ts:488-518` — webhook body schema
- Receiver state: branch `feature/runtime-null-body-hardening-2026-04-24` @ `16659cb`, prod `Version 993fa5e7`

# Kỳ vọng báo cáo / Reporting expected

Team B publish session report sau mỗi session theo template trong ask doc §6 — vào `docs/reports/teamb/`.
```

---

## 3. Slack 1-line + email (founder paste & send)

### Slack (1 line, paste vào kênh #pay-runtime hoặc DM Team B lead)

```
[ASK 2026-04-25] Team B Pay Runtime — chỉ còn 2 việc để đóng tranhatam.com: (1) ship outbound webhook (α/α contract đã lock, payload 5 fields, HMAC-SHA256) (2) cấp PAYMENT_WEBHOOK_SECRET sau khi ship. Full ask: docs/reports/team1/TRANHATAM_COM_PAY_TEAM_WEBHOOK_AND_SECRET_ASK_2026-04-25.md · GitHub issue: <FOUNDER FILL>. Receiver side đã ready (api.tranhatam.com 503 vì secret slot rỗng). Cần SESSION REPORT sau mỗi session vào docs/reports/teamb/.
```

### Email subject

```
[ASK 2026-04-25] Team B Pay Runtime — Ship outbound webhook + PAYMENT_WEBHOOK_SECRET (tranhatam.com)
```

### Email body (~200 từ)

```
Chào Team B Pay Runtime,

Tenant `tranhatam` đã sạch về phía pay ngoại trừ 2 lane sau, đó cũng
là toàn bộ pay-side surface còn lại để đóng evidence chain live:

1. SHIP OUTBOUND WEBHOOK theo α/α contract đã lock (verified vs receiver
   code 2026-04-25):
   - POST https://api.tranhatam.com/v1/payments/webhook?provider=pay_iai_one
   - Body 5 fields: provider_event_id, order_id, amount, currency, status
     (KHÔNG order_ref, KHÔNG child_id/tenant_id/user_id/product_slug)
   - Signature: hex(HMAC_SHA256(secret, "${ts}.${rawBodyJSON}"))
   - Headers: x-tranhatam-timestamp, x-tranhatam-signature
   - Replay ±300s, fresh ts mỗi retry, stable provider_event_id
   - Send sau khi pay-side persistence terminal state thành công

2. CẤP PAYMENT_WEBHOOK_SECRET sau khi (1) merged + dry-run xanh:
   - Out-of-band, không bao giờ commit vào repo
   - Delivery packet 9 fields (ask doc §4.2)
   - wrangler secret put cả pay side và receiver side
   - 1 real smoke checkout → joint verdict doc

Receiver (tranhatam.com) outstanding = 0; route đang trả 503 vì secret slot
rỗng và sẽ accept ngay first signed POST.

Full ask + acceptance criteria + evidence basis:
docs/reports/team1/TRANHATAM_COM_PAY_TEAM_WEBHOOK_AND_SECRET_ASK_2026-04-25.md

GitHub issue: <FOUNDER FILL after issue created>

Mong Team B publish SESSION REPORT theo template ask doc §6 vào
docs/reports/teamb/ sau mỗi session.

Cảm ơn,
tranhatam.com site owner (Team D + repo-side Codex)
```

---

## 4. Fire sequence (sau khi founder fill 2 placeholder)

1. Founder cung cấp:
   - Notion parent page id (UUID)
   - GitHub repo URL + Team B lead handle (assignee)
2. Agent (em) chạy:
   - `gh issue create -R <repo> --title "..." --label pay-runtime,outbound-webhook,tranhatam.com --assignee <handle> --body-file <issue body từ §1>`
   - `notion-create-pages` với parent page id + title + body từ §2
3. Agent dán URL của issue + Notion page back vào file này (replace `<FOUNDER FILL after issue created>` placeholder).
4. Founder copy Slack/email block từ §3 (đã có URL issue) → paste vào Slack + mail client.
5. Founder kick off CronCreate / loop / scheduled task để track Team B response cadence (out of scope packet này).
