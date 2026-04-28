# IAI_ONE_FOUNDER_DECISION_QUEUE_2026-04-26

- Issuing body: Team Admin (Codex)
- Date: 2026-04-26
- Status: **5/5 P0 SIGNED** by Founder Trần Hà Tâm
- Effective: từ commit này
- Source: founder reply 2026-04-26 turn current
- Reference: §7 file `IAI_ONE_FULL_AUDIT_AND_PRIORITY_EXECUTION_PACKAGE_2026-04-26.md` (Desktop synthesis)

---

## 5 quyết định ký

### Q1 — Team Platform Runtime owner
**Verdict**: Pay+Email own Team Platform Runtime cho `pay.iai.one` shared runtime contract evolution.

**Tác động immediate**:
- Pay+Email scope mở rộng: thêm trách nhiệm evolve `apps/pay/src/server.ts /health` để expose 3 field còn thiếu (`shared_read_model`, `shared_upstream_runtime`, `shared_upstream_release_gate_ready`).
- BLK-TEAM2-002 (shared runtime contract) chuyển owner từ "TBD" → "Pay+Email".
- Boundary plan v1.0.1 → v1.0.2 với expansion này.
- 5/8 signal shared FAIL trong gate verdict có owner cụ thể.

### Q2 — invoice.iai.one ownership
**Verdict**: `invoice.iai.one` tồn tại trong roadmap; owner = Pay+Email.

**Tác động immediate**:
- Boundary plan v1.0.2 thêm `invoice.iai.one` vào Agent 1 Pay+Email scope (cluster pay/invoice).
- Master Audit Domain Registry: invoice.iai.one status `CRITICAL GAP` → `UNCONFIRMED → Pay+Email assigned`.
- Pay+Email relay message bổ sung trách nhiệm audit invoice.iai.one.

### Q3 — Push provider canonical key
**Verdict**: Founder push ngay provider owner export canonical `TEAM2_PAY_GATE_API_KEY`.

**Tác động immediate**:
- BLK-TEAM2-001 escalated to "founder action in progress".
- Khi key về (~15 phút sau provider trả lời), Team 2 rerun probe → 4/8 signal auth/checkout PASS → pay verdict cân nhắc `LOCK_FLIPPED`.
- Đây là quyết định MỞ KHÓA NHANH NHẤT cho payment lane.

**Codex action**: standby, không tự execute (founder duty).

### Q4 — 4 team KHÔNG_OWNER pre-fill mode
**Verdict**: Cho phép Codex pre-fill DRAFT cho 4 team KHÔNG_OWNER (Team A, Team B-CDN, Team B-Flows, Team C). **Bắt buộc** gắn nhãn `INFERRED BY ADMIN, AWAITING TEAM CONFIRM` trong mọi file.

**Tác động immediate**:
- Codex tạo 16 file DRAFT (4 team × 4 file) với data quan sát từ repo.
- Mọi production-ready claim trong DRAFT bắt buộc NO (vì Codex không có team owner verification).
- Khi Q-OPEN-4 reply hoặc Codex wear-2-hats được approve, team thực thực sẽ correct/replace DRAFT.
- Master audit master complete hơn cho founder review.

### Q5 — Legal lane lock tạm
**Verdict**:
- `dash.iai.one` = **billing-support-only, operator-facing**, không xử lý tiền customer-facing
- `noos.iai.one` = **commerce surface**, payment qua `pay.iai.one`

**Tác động immediate**:
- Master Audit §5 Legal Lane Matrix: 2 domain lock (TBD → SIGNED).
- TEAM_TEAM2_DOMAIN_AND_SERVICE_MAP: dash legal lane = billing-support-only.
- TEAM_TEAM3_DOMAIN_AND_SERVICE_MAP: noos legal lane = commerce surface.
- DEC-TEAM2-001 + DEC-TEAM3-001 closed.
- **Lưu ý**: 6 domain TBD legal lane còn lại (web, app, home, flow, nft, docs) vẫn cần lock — phase tiếp.

---

## Trạng thái post-decisions

| Item | Pre-decisions | Post-decisions |
|---|---|---|
| Boundary plan version | v1.0.1 DRAFT | v1.0.2 LOCKED (4/5 Q resolved; Q-OPEN-4 deferred) |
| Pay+Email scope | apps/pay + apps/mail-* + Team B(pay) + D + Email + SMTP + Pay | + **Team Platform Runtime** + **invoice.iai.one** |
| 4 team KHÔNG_OWNER | block audit | unblock — Codex pre-fill DRAFT mode active |
| Pay verdict 04-26 | LOCK_RETAINED_WITH_REASON | unchanged (chờ Q3 effect) |
| Legal lane locked | 2 (pay, mail) | 4 (pay, mail, dash, noos) |
| invoice.iai.one | GAP | Pay+Email |

---

## Codex execution plan post-decisions (this turn + next 2 commits)

### Commit 1 (this commit)
- Founder Decision Queue file (this file)
- Boundary plan v1.0.1 → v1.0.2 (Q1 + Q2 expansion)
- Tracking board update (Pay+Email scope, KHÔNG_OWNER status, Q4 mode active)
- Team 2/Team 3 audit files: legal lane lock (Q5)

### Commit 2
- Pre-fill 16 file DRAFT cho 4 team KHÔNG_OWNER với nhãn INFERRED (Q4)

### Commit 3
- Master Audit refresh: 7 bảng cập nhật với 5 decisions
- Founder Exec Summary refresh
- Refresh 2 zip Desktop

### Standby (Codex không action)
- Q3: founder push provider — chờ canonical key về
- Pay+Email session: thực thi Q1 + Q2 expansion (cần founder relay)
