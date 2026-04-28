# PAY_IAI_ONE_AI_OWNER_INTAKE_REVIEW_2026-04-26

Version: 1.0

Status: AI Owner closeout — pay activation intake audit pass

Date: 2026-04-26

AI Owner: Claude (Anthropic) — phiên Trần Hà Tâm

Scope: Closeout cho vòng audit `2026-04-26` mà AI Owner thực hiện trên `PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`. Đi kèm Section 2A vừa được lock trên intake board (commit `85bb135`).

Liên quan:

- `IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md` (kế hoạch tổng AI Owner)
- `PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md` (intake board live)
- `PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md` (receiver truth)
- `PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md` (contract pay → mail)
- `PAY_IAI_ONE_TEAM_ASK_REGISTRY_2026.md` (mục lục ask đang mở)

⸻

## 1. Vòng audit này đã đi qua những gì

AI Owner đã quét:

- 17 dòng intake `SITE-INTAKE-100` đến `SITE-INTAKE-116` trong section 10 của intake board
- 2 dòng trong queue `BLOCKED` ở section 13
- Receiver registry (VND rail + USD rail) so với row mapping
- Trạng thái gate `pay.iai.one` (vẫn `LOCK_RETAINED`)
- Trạng thái `READY_FOR_STAGING` queue (rỗng) và `READY_FOR_LIVE` queue (rỗng)
- Repo-side surface: `apps/pay/src/payment-routing.ts`, `apps/pay/src/site-activation-registry.ts`, `apps/pay/src/payment-email-templates.ts`, `apps/pay/src/team-d-payment-email-profiles.ts`, `apps/pay/src/payment-email-outbound-adapter.ts`, outbound webhook sender (commit `b69292a` + `6cb0705`)
- Test surface `tests/integration/pay-surface.test.mjs`

Khẳng định ngày `2026-04-26`:

- Không có dòng nào ở `READY_FOR_LIVE` hay `READY_FOR_STAGING`.
- 5 dòng có receiver assignment active (founder-locked): `tranhatam.com`, `omdalat.com`, `vc.vetuonglai.com`, `invest.vetuonglai.com`, `life.vetuonglai.com`.
- 12 dòng còn lại đang ở chuẩn bị/đợi quyết định.
- 0/17 dòng có `provider_ref` thật.
- 0/17 dòng có `message_id` payment thật.
- 0/17 dòng có inbox proof payment thật.
- 0/17 dòng có D1 evidence row.

Theo evidence rule (intake board section 9 + AI Owner plan §4), không dòng nào đủ điều kiện để chuyển sang `READY_FOR_LIVE`.

⸻

## 2. Receiver registry mapping đã có trong repo nhưng chưa đủ đóng gate

Receiver active registered:

- `recv_vnd_thailam_acb` — VND rail, gắn `omdalat.com`
- `recv_vnd_thanhtamphat_acb` — VND rail, gắn `vc.vetuonglai.com`, `invest.vetuonglai.com`, `life.vetuonglai.com`
- `recv_usd_angeledutam_foundation_relay_thread` — USD rail, gắn `vc.vetuonglai.com`, `invest.vetuonglai.com`, `life.vetuonglai.com`

Đối với `tranhatam.com`:

- VND rail đã chuẩn bị nhưng phần dual-rail (VND + USD PayPal) còn cần policy `id_country` enforce trong checkout path để bind đúng rail.

Đối với 12 dòng còn lại:

- Chưa có receiver assignment active. Theo Section 9A "Deferred payment assignment rule" (nếu đã land trên intake board WIP), trạng thái `DEFERRED_UNTIL_FOUNDER_INSTRUCTION` là valid waiting state, không phải reject.

⸻

## 3. Cái gì AI Owner đã làm trong phiên này

- Lock kế hoạch tổng AI Owner: `IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md` (commit `62f8f6f`).
- Cross-link plan từ `docs/README.md`, `docs/iai-mail-platform/README.md`, `docs/PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md`, `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS_2026-04-22.md`, `PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`.
- Thêm Section 2A AI Owner snapshot vào intake board (commit `85bb135`).
- Đếm chính xác trạng thái 17 dòng theo từng status bucket.
- Đối chiếu repo-side surface với từng dòng intake.

AI Owner KHÔNG làm trong phiên này:

- Không tự sửa nội dung row (status, blocker, next_action, evidence_refs) của bất kỳ row nào — đó là quyền của Team D.
- Không tự thêm receiver registry mới.
- Không tự deploy `apps/pay`.
- Không tự gửi action thật vào payOS hay sandbox.

⸻

## 4. Cái gì AI Owner đã từ chối làm vì vi phạm evidence rule

AI Owner sẽ từ chối nếu trong các phiên sau có yêu cầu:

- Đẩy bất kỳ row nào lên `READY_FOR_LIVE` chỉ vì repo-side đã có code, hoặc chỉ vì sandbox đã chạy được nhưng không có `message_id` thật.
- Bỏ qua bất kỳ trong 5 điều kiện evidence (provider action, checkout_url/provider_ref, SMTP messageId, D1 row, inbox proof).
- Tự đổi `LOCK_RETAINED` thành mở mà không có handover từ Founder.

Founder có thể override evidence rule, nhưng AI Owner sẽ ghi rõ override trong file riêng và không tự đặt status `LIVE`.

⸻

## 5. Cái gì các team khác cần làm tiếp để dòng đầu tiên mở `READY_FOR_LIVE`

Đường ngắn nhất là `tranhatam.com` (founder-owned, repo-side gần đủ):

### Team Pay / Team B

- Wire `id_country` policy vào checkout path:
  - VN-issued ID → VND rail
  - Non-VN ID → USD rail
- Generate 1 real `checkout_url` cho 1 sản phẩm one-time, lấy `provider_ref`.
- Persist row vào pay D1, nộp readback.

### Team D

- Bind 4 mailbox `pay@tranhatam.com`, `billing@tranhatam.com`, `support@tranhatam.com`, `noreply@tranhatam.com` (mailcow).
- Set runtime env: `MAIL_API_BASE_URL`, `MAIL_API_KEY`, `MAIL_API_WORKSPACE_ID`, `PAY_EMAIL_ADAPTER_INTERNAL_KEY`.

### Team Email + SMTP

- Nhận payload outbound từ `pay.iai.one` qua adapter contract.
- Trả lại `message_id` thật.
- Lock evidence 3 bảng `messages` / `message_events` / `delivery_attempts`.

### Folder evidence

Tất cả evidence cho `tranhatam.com` về một chỗ:

```
docs/release-evidence/pay.iai.one/2026-MM-DD/tranhatam.com/
  manifest.md
  checkout-screenshot.png
  provider-response.json (sanitized)
  d1-readback.json
  mail-readback.json
  inbox-proof-pay@tranhatam.com.eml (raw header)
  inbox-proof-customer.png
```

Khi 5 file evidence đầy đủ, AI Owner sẽ:

- update intake row 100 `current_status = READY_FOR_LIVE`
- viết closeout `PAY_IAI_ONE_TRANHATAM_COM_READY_FOR_LIVE_<YYYY-MM-DD>.md`
- không tự bấm `LIVE` — Founder bấm.

⸻

## 6. Pending team-ask snapshot

Mục lục mọi ask đang mở: `PAY_IAI_ONE_TEAM_ASK_REGISTRY_2026.md`.

Tính đến `2026-04-26`, registry này chứa khung mở; các ask cụ thể sẽ được bơm vào khi team gửi PR đặt file vào `docs/pay-team-asks/<YYYY-MM-DD>-<team>-<topic>.md` theo format AI Owner plan §6.

⸻

## 7. Acceptance criteria của closeout này

Đã đạt:

- [x] Section 2A AI Owner snapshot đã land trên intake board (commit `85bb135`)
- [x] Đếm chính xác 17 dòng theo từng status bucket
- [x] Liệt kê receiver registry mapping vs row
- [x] Liệt kê surface repo-side liên quan
- [x] Khẳng định không dòng nào đủ evidence để mở `READY_FOR_LIVE`
- [x] Mô tả đường mở dòng đầu tiên (tranhatam.com) rõ ràng
- [x] Không tự nâng status row nào

Chưa đạt — không phải scope closeout này:

- [ ] Bất kỳ row nào ở `READY_FOR_LIVE`
- [ ] Bất kỳ inbox proof payment nào
- [ ] Bất kỳ D1 evidence row nào

⸻

## 8. Change log

- 2026-04-26 v1.0 — closeout đầu tiên cho vòng audit AI Owner trên intake board pay.iai.one.
