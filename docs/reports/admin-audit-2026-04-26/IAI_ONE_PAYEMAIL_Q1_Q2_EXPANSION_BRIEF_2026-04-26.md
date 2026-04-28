# IAI_ONE_PAYEMAIL_Q1_Q2_EXPANSION_BRIEF_2026-04-26

- Issuing body: Team Admin (Codex)
- Date: 2026-04-26 EOD
- Audience: Pay+Email agent (Claude session khác)
- Purpose: Brief chính thức cho Pay+Email về scope expansion sau Q1 + Q2 SIGNED
- Authority: Founder Trần Hà Tâm (5/5 P0 ký 2026-04-26)
- Source: `IAI_ONE_FOUNDER_DECISION_QUEUE_2026-04-26.md` + boundary plan v1.0.2

---

## 0. Founder relay instruction

Founder copy-paste block dưới `## Brief content` sang Pay+Email session để 2 lane mới được activate đúng:

---

## Brief content (founder copy-paste)

```
[FOUNDER RELAY — TEAM ADMIN BRIEF]

Founder Trần Hà Tâm đã ký 5 quyết định P0 ngày 2026-04-26. Trong đó
2 quyết định mở rộng scope của Pay+Email:

═══════════════════════════════════════════════════════════════
Q1 — Pay+Email own Team Platform Runtime (pay.iai.one shared runtime contract evolution)
═══════════════════════════════════════════════════════════════

Scope mới:
- Bạn chịu trách nhiệm evolve apps/pay/src/server.ts handler /health
- Mục tiêu: expose 3 field mà Team 2 shared runtime probe yêu cầu:
  * `shared_read_model`           (current: missing)
  * `shared_upstream_runtime`     (current: missing)
  * `shared_upstream_release_gate_ready` (current: missing)
- Khi 3 field expose đúng schema, 5 signal FAIL trong gate verdict sẽ PASS:
  * `health_contract_exposes_shared_read_model`
  * `health_contract_exposes_shared_upstream_runtime`
  * `shared_read_model_ready_for_shared_only`
  * `shared_upstream_active_read_mode_shared_contract`
  * `shared_upstream_release_gate_ready`

Acceptance criteria:
1. apps/pay/src/server.ts /health response trả thêm 3 field trên với
   structure đúng theo expected của scripts/team2-pay-shared-runtime-probe.mjs
2. Team 2 rerun `node scripts/team2-pay-shared-runtime-probe.mjs --date=<ngày>`
   → 5 signal trên PASS
3. Pay verdict update từ "5 unmet" → "5 PASS" trong shared portion

Reference files để bạn đọc:
- docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-26.md (probe expected)
- scripts/team2-pay-shared-runtime-probe.mjs (probe code — đọc để hiểu schema)
- apps/pay/src/server.ts (file bạn sẽ edit)

Implementation suggestion (Codex không enforce, Pay+Email tự quyết):
- Đọc probe expected trước → reverse-engineer schema 3 field
- Add 3 field vào /health response (có thể stub initial nếu chưa có data thật,
  nhưng phải mark rõ stub vs real)
- Test: chạy probe local → 5 signal PASS

═══════════════════════════════════════════════════════════════
Q2 — invoice.iai.one ownership = Pay+Email
═══════════════════════════════════════════════════════════════

Scope mới:
- Domain invoice.iai.one tồn tại trong roadmap (founder confirm)
- Bạn own toàn bộ — cluster pay/invoice (logical: invoice là output của
  payment success state)

Acceptance criteria — bạn cần phát hiện và báo cáo:
1. invoice.iai.one đã có repo nào chưa? Nếu có, ở đâu? (apps/invoice/?
   packages/invoice-*? external repo?)
2. invoice.iai.one đã có deploy production chưa? (dig + curl probe)
3. Schema invoice là gì? (PDF? HTML? JSON API? webhook to consumer?)
4. Trigger invoice generation: từ pay flow nào? (callback success?
   manual? scheduled?)
5. Legal lane invoice là gì? (financial document → cần legal sign-off)
6. Audit deliverable: 4 file PER team logical theo Audit Order

Reference cần đọc:
- docs/IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26.md v1.0.2 §1
  Agent 1 Pay+Email mới có dòng "invoice.iai.one (per Q2 SIGNED)"
- docs/reports/admin-audit-2026-04-26/IAI_ONE_FOUNDER_DECISION_QUEUE_2026-04-26.md §Q2

═══════════════════════════════════════════════════════════════
Audit deliverable mới (cộng 2 lane vào batch audit)
═══════════════════════════════════════════════════════════════

Bạn ban đầu được giao 4 lane logical (Team B-pay, Team D, Team Email+SMTP,
Team Pay) — nay cộng thêm 2 lane: Team Platform Runtime + invoice.iai.one.

Tổng 6 lane logical. Codex recommend:
- Phương án A: nộp 4 file MERGED (vì cùng 1 agent ownership), gom 6 lane
- Phương án B: nộp 6 set × 4 file = 24 file (nếu 6 lane khác biệt rõ)

Codex đề xuất Phương án A để tiết kiệm thời gian, gắn label rõ trong file
1/4 mỗi surface thuộc lane nào (xem schema 15 mục/surface).

Deadline: 2026-04-28 23:59 ICT (giữ nguyên Audit Order).

Khi commit, ack:
ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26
ack: IAI_ONE_FOUNDER_DECISION_QUEUE_2026-04-26 (Q1 + Q2 expansion)

═══════════════════════════════════════════════════════════════
Q3 in progress — bạn không action
═══════════════════════════════════════════════════════════════

Founder đang push provider canonical TEAM2_PAY_GATE_API_KEY. Khi key về:
- Team 2 (Codex) rerun probe — không phải bạn
- Bạn standby cho Q1 effect (3 field /health) sao cho khi key về,
  toàn bộ 8 signal có thể PASS đồng thời

═══════════════════════════════════════════════════════════════
Câu hỏi bạn có thể có
═══════════════════════════════════════════════════════════════

1. "Tôi chưa có visibility vào invoice.iai.one — sao biết audit?"
   → Bạn explore repo + dig + curl trước. Báo cáo state thật. Nếu domain
   chưa exist trong infra hiện tại, escalate ngay (không tự assume tồn tại).

2. "/health 3 field schema cụ thể là gì?"
   → Đọc scripts/team2-pay-shared-runtime-probe.mjs để reverse-engineer.
   Nếu probe code không clear, escalate cho Codex để clarify với Team 2 logic.

3. "Tôi vẫn còn 9 content-gap test failures (ask-pay-001) chưa xong"
   → Theo §10 Audit Order: cấm push logic mới trừ bug fix P0 và audit
   deliverable cho đến khi audit hoàn tất. 9 content-gap failures KHÔNG
   thuộc P0. Defer batch đó cho đến khi audit complete.

4. "Pay+Email session memory có thể không sync với batch turn này"
   → OK. Bạn đọc 3 file truth-source này (qua founder relay):
   - docs/IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26.md v1.0.2
   - docs/reports/admin-audit-2026-04-26/IAI_ONE_FOUNDER_DECISION_QUEUE_2026-04-26.md
   - docs/reports/admin-audit-2026-04-26/IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26.md
   → Đủ context.

═══════════════════════════════════════════════════════════════

Codex (Team Admin) standby 24/7 cho 48 giờ tới. Câu hỏi gì gửi qua
founder relay sang Codex.
```

---

## Verification checklist sau khi Pay+Email nhận brief

| Tiêu chí | Pay+Email response |
|---|---|
| Ack 2 file (Audit Order + Decision Queue) | _pending_ |
| Implementation /health 3 field | _pending_ |
| Probe Team 2 rerun → 5 signal PASS | _pending_ |
| invoice.iai.one repo exploration + report | _pending_ |
| Audit 4-file MERGED nộp | _pending_ |

---

## Note cho founder

Brief này gửi sang Pay+Email = **mở khóa Q1 + Q2 effect**:
- Q1 effect: shared runtime contract gap được đóng → khi Q3 effect cũng về (canonical key), pay verdict có thể flip 7+/8 signal PASS → `LOCK_FLIPPED`.
- Q2 effect: invoice.iai.one có owner audit, control plane completeness tăng.

Cả 2 cần Pay+Email session active execute. Founder relay sớm = unlock sớm.
