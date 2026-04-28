# TEAM1_PAY_REPO_SIDE_AUDIT_SECTION_7_2026-04-26
- Team: Team 1 Program Root / Control Tower
- Date: 2026-04-26
- Source mandate: `docs/reports/team1/TRANHATAM_COM_NON_TEAMD_GAP_AND_RESPONSIBILITY_MATRIX_2026-04-24.md` Section 7
- Scope: 3 repo-side audit Codex (Team 1+2+3) đóng được mà không cần upstream owner ack

---

## ADDENDUM — Cập nhật sau khi AI Owner Email+Pay land 2 commit (post-publish)

Audit này được publish trước khi 2 commit từ AI Owner Email+Pay land vào branch:

- `b69292a pay(webhook): ship outbound payment-completion webhook sender to consumer tenants` (Item 1 of Team B Pay Runtime ask)
- `6cb0705 pay(webhook): auto-dispatch outbound webhook from /internal/payment-event/callback on terminal success`

### Tác động lên 3 finding

**Section 7.1 — direction split clarified**:
- **Outbound (pay.iai.one → consumer tenant như tranhatam.com)**: TRƯỚC: tests-only ✅. SAU 2 commit trên: **PRODUCTION-grade ✅** — `payment-webhook-tenant-registry.ts` + `payment-webhook-outbound-sender.ts` shipped, signature scheme `tranhatam_hmac_sha256_v1`, retry 408/429/5xx, auto-wired vào `/internal/payment-event/callback`, tests 18/18 PASS.
- **Inbound (external provider như payOS/VNPay → pay.iai.one)**: KHÔNG đổi. **VẪN OPEN P1**. 2 commit trên là OUTBOUND direction, không address inbound provider webhook ingress.

**Section 7.2 — DB persistence**: KHÔNG đổi. Vẫn `Map<>` in-memory + optional file persist. **VẪN OPEN P1**. 2 commit trên không touch persistence layer.

**Section 7.3 — overclaim**: KHÔNG đổi. Nice-to-have cosmetic + lint guard, không chặn live chain.

### Tình trạng Section 7 sau update

| Section | Trước update | Sau update |
|---|---|---|
| 7.1 Outbound webhook | tests-only | **PRODUCTION-grade ✅ (b69292a + 6cb0705)** |
| 7.1 Inbound provider webhook | OPEN P1 | OPEN P1 (unchanged) |
| 7.2 Production DB persistence | OPEN P1 | OPEN P1 (unchanged) |
| 7.3 Overclaim cosmetic | MOSTLY CLEAN | MOSTLY CLEAN (unchanged) |

### Owner mới

- **Section 7.1 inbound + 7.2 persistence**: AI Owner Email+Pay đã chính thức nhận theo `docs/IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md`. Codex (Team 1+2+3 supervisor) chỉ track + escalate, không trực tiếp thi công.
- **Section 7.3**: cosmetic, để open nếu AI Owner muốn cleanup; không khẩn cấp.

---

## 7.1 — Audit `apps/pay/src/server.ts` callback/webhook ingress route

### Findings

Route map hiện có trong `apps/pay/src/server.ts`:

| Route | Line | Direction | Purpose | Status |
|---|---|---|---|---|
| `/internal/payment-event/callback` | 375 | INGRESS (internal) | Receive internal payment event callbacks (post-payment internal handoff) | EXISTS ✅ |
| `/internal/payment-event/proof` | 396 | INGRESS (internal) | Attach proof to existing payment event record | EXISTS ✅ |
| `/internal/payment-event/evidence` | 438 | EGRESS query | Query payment event evidence records by domain + provider_reference | EXISTS ✅ |
| `/internal/payment-webhook/dispatch` | 1444 | EGRESS (outbound dispatch) | Dispatch outbound webhook to consumer site | EXISTS ✅ |
| `/internal/payment-email/send` | (handleInternal*) | EGRESS | Internal mail handoff | EXISTS ✅ |

Outbound webhook sender artifacts:
- Test suite: `tests/integration/pay-webhook-outbound-sender.test.mjs` — verified outbound delivery, retry semantics, signature
- Error code mapping in server.ts lines 1642-1648: `PAYMENT_WEBHOOK_SECRET_MISSING`, `PAYMENT_WEBHOOK_NETWORK_ERROR`, `PAYMENT_WEBHOOK_DESTINATION_REJECTED`, `PAYMENT_WEBHOOK_TENANT_UNKNOWN`, `PAYMENT_WEBHOOK_UNSUPPORTED_SCHEME`

### Gap (vẫn còn thiếu)

**External provider-signed webhook ingress** — KHÔNG có route nào trong server.ts hiện chấp nhận POST từ payOS / VNPay / external provider với HMAC signature verify. Cụ thể:
- Không thấy `/v1/providers/webhooks/{provider}` hoặc `/external/payment-event/{provider}` route.
- Không thấy code path verify HMAC signature từ external provider header (X-PayOS-Signature hoặc tương đương).
- `recordPaymentEventCallback` (line 1012) được gọi từ `/internal/payment-event/callback` — đó là route INTERNAL, dùng cho internal handoff sau khi đã có upstream verify, KHÔNG phải route accepting raw provider payload.

### Repo-side action (Team 1+2 owns)

1. Thiết kế route mới `/external/providers/webhooks/payos` (hoặc tương đương cho từng provider).
2. Implement HMAC verify guard ở route head trước khi enter business logic.
3. Map provider payload → normalized event → call `recordPaymentEventCallback` với `provider_signed: true` flag (cần thêm vào `PaymentEventEvidenceCallbackInput`).
4. Add test: `tests/integration/pay-external-provider-webhook.test.mjs` (kiểm signature pass/fail, replay protection, idempotency).

### Verdict
- Internal callback/webhook surfaces: **CLOSED** ✅
- Outbound webhook sender: **CLOSED** ✅
- **External provider-signed webhook ingress**: **OPEN** — repo-side gap thực, không phải upstream issue.

---

## 7.2 — Audit persistence path cho `provider_reference` + `message_id`

### Findings

`apps/pay/src/payment-event-evidence-store.ts`:
- Storage primitive: `new Map<string, PaymentEventEvidenceRecord>()` (line 144) — IN-MEMORY
- Index: 4 secondary Map cho lookup by message_id, order_id, payment_session_id, provider_reference (lines 145-148)
- File persistence: optional via `paymentEventEvidenceStoreFilePath` (line 247-249, parser line 471)
- Methods: `recordPaymentEmailAccepted`, `recordPaymentEventCallback`, `recordOutboundWebhookSent`, `attachProof`, `getRecord`, `listRecords`

### Gap (vẫn còn thiếu)

Persistence thật cho `provider_reference` + `mail_message_id`:
- ❌ Không có **D1 binding** (Cloudflare D1 / SQLite) — không thấy `env.DB`, `prepare()`, `execute()` trong store
- ❌ Không có **production database write path** — chỉ file-based optional
- ⚠️ File path nếu được cung cấp sẽ lưu JSON snapshot của Map — KHÔNG phải canonical payment evidence row trong shared production DB
- ⚠️ Hậu quả: mỗi instance của pay.iai.one worker sẽ có Map riêng → split-brain trong production multi-region/multi-instance

### Repo-side action (Team 1+2 owns)

1. Quyết định canonical persistence backend (D1 vs Postgres vs Durable Objects).
2. Thiết kế schema: bảng `payment_event_evidence` với key `(domain, canonical_row_ref)` + index trên `provider_reference`, `mail_message_id`, `order_id`, `payment_session_id`.
3. Replace `Map<>` storage với DB store, giữ in-memory store cho test fixture mode.
4. Add migration: `migrations/<n>_payment_event_evidence.sql`.
5. Add integration test: `tests/integration/pay-evidence-persistence.test.mjs` — verify cross-instance read works.

### Verdict
- In-memory + file evidence store: **EXISTS** ✅ (test/dev mode)
- **Production canonical DB persistence**: **OPEN** — repo-side gap, không phụ thuộc upstream owner ack.

---

## 7.3 — Audit tests/reports về upstream overclaim

### Findings

Quét `tests/integration/pay-*.test.mjs` + `apps/pay/src/render.ts` cho các pattern claim "live", "production-ready", "completed":

**Tests properly guarding overclaim**:
- `tests/integration/pay-team-d-intake-board.test.mjs:103`: explicit assertion that `tranhatam.com payment email live must not be claimed until all five external steps above are complete`
- Line 152: `assert.equal(validation.liveClaimBlocked, true)` — block claim
- Line 195: same for `omdalat.com`

**Render copy properly hedged**:
- `apps/pay/src/render.ts:586`: `"Prep shell only. No money mutation, payout execution, or live ledger truth runs in this route."` — explicit prep-only guard
- Line 1499: `"The 'I have completed payment' button is only a soft signal and must not mark a payment as confirmed."` — explicit soft-signal disclaimer
- Line 1926: `"The receipt route must not imply that payout or treasury settlement has completed."` — explicit no-overclaim

**Tests confirm outbound webhook semantics**:
- `tests/integration/pay-webhook-outbound-sender.test.mjs`: tests delivery success, signature verification, retry — all in test fixtures (mock destination), KHÔNG claim live production delivery

### Gap (potential)

Phát hiện trong tests:
- Một số test xác nhận "delivered: true" nhưng đó là test mode (mock destination) — không phải claim cho production delivery
- `apps/pay/src/render.ts:133`: `"Hosted checkout route with trust bar, method selector, and live status area."` — chữ "live status area" hơi mơ hồ (có thể bị đọc nhầm là live production), nên đổi thành `"runtime status area"` để tránh ambiguity

### Repo-side action (Team 1+2 owns)

1. Thay từ "live status area" thành "runtime status area" tại render.ts:133 (cosmetic, hạ rủi ro misread).
2. Add lint check / grep guard trong CI để tự động flag pattern `live` claims trong copy/test khi không có guard rõ ràng.
3. Document trong `docs/PROJECT_PROTOCOL_ACTIVATION.md` quy tắc: "live" / "production-ready" / "completed" trong test/copy phải có disclaimer kèm theo.

### Verdict
- Tests: **CLEAN** ✅ (block live overclaim explicitly)
- Render copy: **MOSTLY CLEAN** ✅ (1 cosmetic ambiguity, không phải overclaim thực)
- **Lint guard automation**: **OPEN** — nice-to-have, không khẩn cấp.

---

## Tổng kết Section 7

| Section | Repo-side gap thực | Severity | Action owner |
|---|---|---|---|
| 7.1 External provider webhook ingress | OPEN | P1 — chặn live chain với external provider | Team 1+2 (Codex) |
| 7.2 Production DB persistence | OPEN | P1 — chặn multi-instance correctness | Team 1+2 (Codex) |
| 7.3 Tests/reports overclaim | MOSTLY CLEAN, 1 cosmetic + 1 nice-to-have | P3 | Team 1 (Codex) |

**Conclusion**: 2/3 section là OPEN gap thực sự cần repo-side implementation work, KHÔNG phải upstream owner ack. Section 7.3 gần đóng, chỉ cần 1 thay copy + 1 lint rule.
