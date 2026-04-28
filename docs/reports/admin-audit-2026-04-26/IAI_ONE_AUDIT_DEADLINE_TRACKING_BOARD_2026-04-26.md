# IAI_ONE_AUDIT_DEADLINE_TRACKING_BOARD_2026-04-26

- Issuing body: Team Admin (Codex)
- Order reference: `IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26.md`
- Deadline: **2026-04-28 23:59 ICT** (48 giờ từ ban hành)
- Update cadence: Team Admin update bảng này mỗi khi có team nộp / quá hạn / fail review
- Status enum: `CHƯA_NHẬN` | `ĐÃ_NHẬN_CHƯA_NỘP` | `NỘP_THIẾU` | `CẦN_SỬA` | `ĐẠT_CHUẨN` | `INFERRED_DRAFT` (Q4 mode)
- **Update v2 (2026-04-26 EOD)**: Founder ký 5 quyết định (Q1+Q2+Q3+Q4+Q5) — xem `IAI_ONE_FOUNDER_DECISION_QUEUE_2026-04-26.md`. KHÔNG_OWNER status thay bằng INFERRED_DRAFT khi Codex pre-fill (Q4 active).

---

## 1. Tracking matrix 12 team

| Team | Owner agent | Owner human | Order received | Submitted at | Status | Files received | Blocker cần founder | Priority | Risk |
|---|---|---|---|---|---|---|---|---|---|
| Team 1 (Program Root) | Codex | Codex auto | 2026-04-26 | 2026-04-26 EOD | **ĐẠT_CHUẨN** (commit `a17158c`) | 4/4 | none | P0 | LOW (self-cover) |
| Team 2 (Runtime Platform) | Codex | Codex auto | 2026-04-26 | 2026-04-26 EOD | **ĐẠT_CHUẨN** (commit `a17158c`) | 4/4 | canonical API key (Q3 founder pushing) | P0 | HIGH (block pay flip) |
| Team 3 (NOOS Commerce) | Codex | Codex auto | 2026-04-26 | 2026-04-26 EOD | **ĐẠT_CHUẨN** (commit `a17158c`) | 4/4 | none | P1 | LOW (monitor-only) |
| Team 4 (Growth Ops) | T4+5 agent | repo-side agent | 2026-04-26 (relay pending) | _pending_ | CHƯA_NHẬN | 0/4 | none | P1 | LOW |
| Team 5 (Web KPI) | T4+5 agent | repo-side agent | 2026-04-26 (relay pending) | _pending_ | CHƯA_NHẬN | 0/4 | pay flip (P0-04) | P0 | MEDIUM |
| Team A (Developer) | TBD (Q-OPEN-4 deferred) | _unassigned_ | 2026-04-26 (Q4 mode) | _Codex pre-fill in commit 2_ | INFERRED_DRAFT | 0→4/4 | Q-OPEN-4 reassess 04-30 | P0 | CRITICAL |
| Team B (CDN) | TBD (Q4 mode) | _unassigned_ | 2026-04-26 (Q4 mode) | _Codex pre-fill in commit 2_ | INFERRED_DRAFT | 0→4/4 | 5 owner evidence | P0 | CRITICAL |
| Team B (Flows) | TBD (Q4 mode) | _unassigned_ | 2026-04-26 (Q4 mode) | _Codex pre-fill in commit 2_ | INFERRED_DRAFT | 0→4/4 | 3 owner evidence | P0 | CRITICAL |
| Team B (Pay infra) | Pay+Email | Claude session | 2026-04-26 (relay pending) | _pending_ | CHƯA_NHẬN | 0/4 | PAYMENT_WEBHOOK_SECRET (Item 2) | P0 | HIGH |
| Team C (CIOS) | TBD (Q4 mode) | _unassigned_ | 2026-04-26 (Q4 mode) | _Codex pre-fill in commit 2_ | INFERRED_DRAFT | 0→4/4 | JWT secret rotate | P1 | MEDIUM |
| Team D (Payment Activation) | Pay+Email | Claude session | 2026-04-26 (relay pending) | _pending_ | CHƯA_NHẬN | 0/4 | merchant onboard | P0 | HIGH |
| Team Email + SMTP | Pay+Email | Claude session | 2026-04-26 (relay pending) | _pending_ | CHƯA_NHẬN | 0/4 | mailbox/alias mailcow + inbox proof | P0 | HIGH |
| Team Pay | Pay+Email | Claude session | 2026-04-26 (relay pending) | _pending_ | CHƯA_NHẬN | 0/4 | Q3 canonical API key in progress | P0 | HIGH |
| **Team Platform Runtime (NEW per Q1)** | **Pay+Email** | Claude session | 2026-04-26 EOD | _pending_ | CHƯA_NHẬN | 0/4 | shared runtime contract evolution | **P0** | HIGH (5 signal FAIL) |
| **invoice.iai.one (NEW per Q2)** | **Pay+Email** | Claude session | 2026-04-26 EOD | _pending_ | CHƯA_NHẬN | 0/4 | confirm domain state + audit | P1 | MEDIUM |

→ **Status hiện tại**: 12 team total. 5 team có owner agent (sẽ thực thi được). **4 team KHÔNG_OWNER** (Team A, Team B-CDN, Team B-Flows, Team C) → BLOCK audit theo lệnh founder; cần Q-OPEN-4 quyết NGAY hoặc Codex tạm wear-2-hats.

---

## 2. Surface KHÔNG có team owner — escalate ngay

| Surface | Domain | Suspect role | Owner candidate | Action |
|---|---|---|---|---|
| iai.one | iai.one (apex) | root | TBD — chưa có team chuyên trách | **Q-OPEN-3 founder confirm** |
| home.iai.one | home.iai.one | root/portal | T4+5 (Codex Q3 recommend) | Q3 reply |
| app.iai.one | app.iai.one | product | T4+5 (Codex Q3 recommend) | Q3 reply |
| flow.iai.one | flow.iai.one | product | A+B+C agent §1 boundary plan | Q-OPEN-1+4 |
| docs.iai.one | docs.iai.one | developer/docs | A+B+C (Codex Q3 recommend) | Q3 reply |
| api.flow.iai.one | api.flow.iai.one | developer/docs | A+B+C (đoán) | Q3 + ack |
| **invoice.iai.one** | **invoice.iai.one** | **control plane** | **GAP — không trong boundary plan v1.0.1** | **CRITICAL P0 — escalate founder** |
| nft.iai.one | nft.iai.one | product | Codex (Q3 recommend) | Q3 reply |

→ **invoice.iai.one** là khoảng trống nghiêm trọng. Founder đưa vào lệnh §9 nhưng không agent nào claim ownership.

---

## 3. Escalation queue

### EQ-001 (P0): Q-OPEN-1 + Q-OPEN-3 + Q-OPEN-4 phải reply trong 24 giờ
- Lý do: 4 team KHÔNG_OWNER không thể nộp audit nếu không có agent thực thi.
- Owner: Founder.
- Default if no decision by 2026-04-27 23:59: Codex tạm wear-2-hats cho 4 team này (giảm chất lượng audit do thiếu deploy access).

### EQ-002 (P0): invoice.iai.one không owner
- Lý do: Founder yêu cầu audit invoice.iai.one nhưng không agent nào claim. Có thể lane này chưa tồn tại → cần founder confirm tạo mới hay đã có ở repo nào ngoài worktree này.
- Owner: Founder.
- Default: ghi vào audit master file `IAI_ONE_CURRENT_STATE_MASTER_AUDIT_2026-04-26.md` ở mục "Domain chưa có owner rõ" (yêu cầu §7.3 founder).

### EQ-003 (P1): Pay+Email session relay
- Lý do: Pay+Email là Claude session khác. Codex không có cơ chế trực tiếp gửi commit notification — phải dựa founder relay.
- Owner: Founder relay.
- Default: ghi note trong commit message, founder copy-paste sang session Pay+Email.

### EQ-004 (P1): T4+5 agent relay
- Tương tự EQ-003 cho T4+5 agent.
- Default: founder relay.

---

## 4. Snapshot timeline

| Timestamp | Event |
|---|---|
| 2026-04-26 EOD (turn này) | Audit Order ban hành + Tracking board v1 publish |
| 2026-04-26 EOD | Codex tự fill DRAFT 4 file cho T1+T2+T3 (data đã có) |
| 2026-04-27 morning | Founder relay Audit Order sang Pay+Email + T4+5 sessions |
| 2026-04-27 EOD | Pay+Email + T4+5 nộp 4 file mỗi team |
| 2026-04-27 EOD | Founder reply Q-OPEN-1/3/4 → A+B+C agent có owner hoặc Codex wear-2-hats |
| 2026-04-28 23:59 ICT | **HARD DEADLINE** — toàn bộ 12 team nộp đủ |
| 2026-04-29 morning | Codex publish Master Audit + Founder Exec Summary |

---

## 5. Update log

- 2026-04-26 EOD: v1 publish (Codex Team Admin) — 12 team status, 4 team KHÔNG_OWNER, invoice.iai.one gap, 4 escalation queue.
