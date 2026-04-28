# IAI_ONE_CURRENT_STATE_MASTER_AUDIT_2026-04-26

- Issuing body: Team Admin (Codex)
- Order reference: `IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26.md`
- Date: 2026-04-26 EOD (v2 — post 5 decisions ký)
- Status: **PARTIAL → IMPROVED** — 7/12 team có data (3 ĐẠT_CHUẨN Codex + 4 INFERRED_DRAFT). Pay+Email + T4+5 chờ relay.
- Will be promoted to v1 FINAL khi đủ 12 team nộp + Codex synthesize.
- Founder decisions ký: 5/5 P0 (Q1+Q2+Q3+Q4+Q5) — xem `IAI_ONE_FOUNDER_DECISION_QUEUE_2026-04-26.md`

---

## 0. Trạng thái audit (v2)

| Bảng | Status | Note |
|---|---|---|
| 1. Domain Registry | IMPROVED | 16 domain liệt kê, ownership 14/16 sau Q1+Q2 (chỉ còn iai.one root + một vài app TBD) |
| 2. Surface Role Map | IMPROVED | T1-T3 + 4 INFERRED + Pay+Email scope expand |
| 3. Live/Preview/Broken Matrix | IMPROVED | Cộng thêm cios, developer, cdn, flows từ INFERRED data |
| 4. Shared Core Dependency Matrix | PARTIAL | TBD vẫn nhiều |
| 5. Legal Lane Matrix | LOCKED 4/16 | dash + noos LOCKED per Q5 (cộng pay + mail = 4) |
| 6. Payment Lane Matrix | STABLE | invoice.iai.one assigned Pay+Email per Q2 |
| 7. Founder Decision Queue | **5/5 P0 SIGNED** + 4 P1/P2 còn mở | xem `IAI_ONE_FOUNDER_DECISION_QUEUE_2026-04-26.md` |

---

## 1. Domain Registry (post 5 decisions)

| Domain | Owner team | Owner agent | Status | Notes |
|---|---|---|---|---|
| iai.one (apex) | TBD | TBD | UNCONFIRMED | root, không agent claim |
| home.iai.one | T4+5 (Codex Q3 recommend) | T4+5 agent | UNCONFIRMED | Q3 reply pending |
| dash.iai.one | Team 2 | Codex | DEV (legal LOCKED Q5) | billing-support-only operator-facing |
| noos.iai.one | Team 3 | Codex | DEV (legal LOCKED Q5) | commerce surface, payment via pay.iai.one |
| nft.iai.one | Codex (Q3 recommend) | Codex | UNCONFIRMED | Q3 reply pending |
| flow.iai.one | TBD (Q3 reply pending) | TBD | UNCONFIRMED | product |
| app.iai.one | T4+5 (Codex Q3 recommend) | T4+5 agent | UNCONFIRMED | Q3 reply pending |
| developer.iai.one | Team A (INFERRED Q4) | TBD agent | INFERRED_DRAFT | REOPEN approved |
| docs.iai.one | A+B+C (Codex Q3 recommend) | TBD | UNCONFIRMED | Q3 reply pending |
| api.flow.iai.one | A+B+C (Codex inferred) | TBD | UNCONFIRMED | tentatively Team A |
| cios.iai.one | Team C (INFERRED Q4) | TBD agent | INFERRED_DRAFT — closure 8/8 PASS, 3/4 proof OK | closest to live |
| pay.iai.one | Pay+Email | Claude session | DEV | gate LOCK_RETAINED, Q3 in progress |
| **invoice.iai.one** | **Pay+Email (Q2 SIGNED)** | **Claude session** | **CONFIRMED EXIST, AUDIT PENDING** | Q2 closed CRITICAL GAP |
| mail.iai.one | Pay+Email | Claude session | DEV | Wave 1 pending |
| cdn.iai.one | Team B-CDN (INFERRED Q4) | TBD | INFERRED_DRAFT — 5 evidence MISSING | block release |
| flows.iai.one | Team B-Flows (INFERRED Q4) | TBD | INFERRED_DRAFT — 3 evidence MISSING | block release |
| web.iai.one | Team 5 | T4+5 agent | DEV | monitor-only |

→ **Owner coverage**: 14/16 domain có owner (post Q1+Q2). 2 chưa có: `iai.one` apex (root) + một số app cluster Q3 chưa lock. ~~4 GAP~~ → còn 2 GAP.

---

## 2. Surface Role Map (compact)

| Surface | Domain | Role | Owner | State |
|---|---|---|---|---|
| Control Tower | (internal) | internal/operate | Codex | LIVE |
| Gate Authority | (internal) | internal/operate | Codex | LIVE |
| dash.iai.one | dash.iai.one | product | Codex | DEV (legal LOCKED) |
| noos.iai.one | noos.iai.one | product | Codex | DEV (legal LOCKED) |
| pay.iai.one | pay.iai.one | control plane | Pay+Email | DEV (gate retained) |
| pay.iai.one shared runtime | pay.iai.one | control plane | **Pay+Email (Q1 SIGNED)** | BROKEN — 5 signal FAIL |
| invoice.iai.one | invoice.iai.one | control plane | **Pay+Email (Q2 SIGNED)** | CONFIRMED, AUDIT PENDING |
| mail.iai.one | mail.iai.one | control plane | Pay+Email | DEV (Wave 1 pending) |
| web.iai.one | web.iai.one | product | T4+5 agent | DEV (monitor-only) |
| developer.iai.one | developer.iai.one | dev/docs | INFERRED Team A | DEV (REOPEN approved) |
| cdn.iai.one | cdn.iai.one | control plane | INFERRED Team B-CDN | BROKEN (5 evidence MISSING) |
| flows.iai.one | flows.iai.one | control plane | INFERRED Team B-Flows | DEV (3 evidence MISSING) |
| cios.iai.one | cios.iai.one | internal/operate | INFERRED Team C | DEV (closure 8/8 PASS, JWT placeholder) |

---

## 3. Live/Preview/Broken Matrix (improved)

| Domain | LIVE | PREVIEW | DEMO | BROKEN | Note |
|---|---|---|---|---|---|
| dash.iai.one | **endpoint LIVE** | UI spec | — | — | HTTP/2 200 Cloudflare verified 04-26 EOD; 3/4 proof OK; legal LOCKED |
| noos.iai.one | **endpoint LIVE** | — | — | — | HTTP/2 200 Cloudflare verified 04-26 EOD; 3/4 proof OK; legal LOCKED |
| pay.iai.one | endpoint /health | — | — | gate FAIL 8/8, shared runtime broken | Q1 chuyển owner Pay+Email → in progress |
| invoice.iai.one | — | — | — | unknown — chưa audit | Q2 owner = Pay+Email, audit pending |
| mail.iai.one | — | — | — | Wave 1 incomplete | Mailbox/alias pending |
| web.iai.one | — | KPI loop | — | sync live blocked | Monitor-only |
| developer.iai.one | — | — | — | — | REOPEN approved, chưa deploy |
| cdn.iai.one | — | — | — | 5 evidence MISSING | block |
| flows.iai.one | — | — | — | 3 evidence MISSING | test PASS |
| cios.iai.one | — | — | — | JWT placeholder | closure 8/8 PASS, 3/4 proof OK |

→ **0 domain LIVE thật** (unchanged). Closest tới production-ready: **cios.iai.one** (3/4 proof OK), **noos.iai.one** (test PASS + legal LOCKED + contract verified).

---

## 4. Shared Core Dependency Matrix

| Surface | Shared package | Status |
|---|---|---|
| dash.iai.one | `@iai/dash-runtime`, `@iai/dash-shared` (TBD) | unverified |
| noos.iai.one | `@iai/noos-commerce-contracts`, `@iai/noos-shared-runtime` | verified PASS |
| pay.iai.one | `@iai/pay-shared-runtime` (TBD) | shared runtime BROKEN — Q1 Pay+Email own evolution |
| mail.iai.one | `@iai/mail-core`, `@iai/mail-api`, `@iai/mail-smtp`, `@iai/mail-worker` | locked |
| invoice.iai.one | TBD | chưa audit |
| (others) | TBD | _pending team submission_ |

---

## 5. Legal Lane Matrix (4/16 LOCKED)

| Domain | Legal lane | Locked? |
|---|---|---|
| pay.iai.one | payment processing (VND/USD) | YES (per AI Owner plan) |
| mail.iai.one | email service | YES |
| **dash.iai.one** | **billing-support-only, operator-facing** | **YES (Q5 SIGNED)** |
| **noos.iai.one** | **commerce surface, payment qua pay.iai.one** | **YES (Q5 SIGNED)** |
| invoice.iai.one | TBD (likely "invoice service / billing") | NO — Pay+Email audit pending |
| web.iai.one | TBD | NO |
| (others) | TBD | NO |

→ ~~Phần lớn TBD~~ → **4/16 LOCKED**. 12 còn lại pending (incl. invoice + 6 domain Q3 pending).

---

## 6. Payment Lane Matrix (stable)

| Domain | Payment source | Notes |
|---|---|---|
| pay.iai.one | own (gateway) | payOS-first, Q3 canonical key in progress |
| invoice.iai.one | TBD | Pay+Email audit pending — likely cluster với pay |
| dash.iai.one | none | billing-support-only confirmed Q5 |
| noos.iai.one | pay.iai.one | confirmed Q5 |
| developer.iai.one | none | billing-support-only |
| cios.iai.one | TBD (likely none — internal) | INFERRED |
| (others) | unchanged from v1 | |

---

## 7. Founder Decision Queue (post 5 decisions ký)

### ✅ SIGNED (5/5 P0)
1. ~~Q1 Team Platform Runtime owner~~ → **Pay+Email**
2. ~~Q2 invoice.iai.one ownership~~ → **Pay+Email**
3. Q3 push provider canonical key → **action in progress (founder)**
4. ~~Q4 4 team KHÔNG_OWNER pre-fill~~ → **Codex 16 file DRAFT shipped**
5. ~~Q5 dash + noos legal lane~~ → **LOCKED**

### ⏳ Còn mở (Q-OPEN-1, 2, 3, Q-OPEN-4 deferred — P1/P2)
- Q-OPEN-1 Team A definition (recommend `developer.iai.one`)
- Q-OPEN-2 Team D split (recommend Pay+Email own toàn bộ)
- Q-OPEN-3 5 apps ownership (recommend table per Codex)
- Q-OPEN-4 A+B+C+D agent — DEFERRED to 2026-04-30 reassess
- Q-OPEN-5 230+ dirty file strategy (recommend Codex split first)
- DEC-MASTER-007 Legal lane lock cho 6 domain còn TBD (web/app/home/flow/nft/docs)
- DEC-MASTER-009 dash Control Tower UI implement vs defer Q3

---

## 8. 10 câu trả lời (post 5 decisions)

### 8.1 Domain nào đang production thật?
**0 domain đủ 4 proof** — nhưng **3 domain đạt 3/4 proof** (post 2026-04-26 EOD dig probe):
- `dash.iai.one` — repo PASS + domain PASS (CF A records) + deploy PASS (HTTP/2 200) — chỉ thiếu owner proof
- `noos.iai.one` — repo PASS + domain PASS + deploy PASS — chỉ thiếu owner proof
- `cios.iai.one` — repo PASS + domain PASS + deploy PASS — chỉ thiếu owner proof
→ 3 surface này serving thật qua Cloudflare; HTTP 200 nhưng correctness của content/business logic chưa verify.

### 8.2 Domain nào chỉ là narrative, preview, demo?
- dash.iai.one Control Tower UI: PREVIEW (chỉ spec)
- web.iai.one: PREVIEW (KPI loop only)
- mail.iai.one: PREVIEW (Wave 1 chưa close)

### 8.3 Domain nào chưa có owner rõ?
~~12 domain~~ → **2 domain** (post Q1+Q2):
- iai.one (apex) — root, chưa có team chuyên trách
- home/app/flow/docs/api.flow/nft (Q3 reply pending — tentative)
- ~~invoice.iai.one~~ → CLOSED Q2

### 8.4 Domain nào đang gắn sai pháp lý?
- 4/16 LOCKED đúng (pay, mail, dash, noos).
- 12/16 TBD → KHÔNG XÁC ĐỊNH ĐƯỢC.

### 8.5 Domain nào dùng payment riêng?
- pay.iai.one own (đúng — gateway).
- KHÔNG có domain khác dùng payment riêng.

### 8.6 Domain nào dùng auth riêng?
KHÔNG XÁC ĐỊNH ĐƯỢC — auth source phần lớn "shared-iai-auth (assumed, unverified)".

### 8.7 Domain nào không đi qua shared core?
KHÔNG XÁC ĐỊNH ĐƯỢC đầy đủ — verified shared core: noos.iai.one, mail.iai.one.

### 8.8 Domain nào chồng vai?
- ~~pay.iai.one shared runtime: chồng vai~~ → CLOSED Q1 (Pay+Email own toàn bộ).
- dash.iai.one rendering: clean post boundary v1.0.2.

### 8.9 Blocker nào cần founder quyết NGAY?
**Reduced từ 5 → 2** post 5 decisions ký:
1. Q3 canonical key — founder action in progress
2. DEC-MASTER-007 6 domain TBD legal lane (P1, không khẩn)

### 8.10 Cụm nào trong 3 engine doanh thu sẵn sàng onboard trước?
- **noos.iai.one** (legal LOCKED Q5, contract PASS, sẵn nhất sau Q3 effect)
- **pay.iai.one** (gateway, sẵn khi canonical key về)
- **mail.iai.one** (sẵn khi Wave 1 inbox proof)

→ **Codex recommend** (unchanged): **noos.iai.one** ưu tiên (lowest external dep sau Q3).

---

## 9. Còn thiếu trong v2 (PARTIAL → IMPROVED)

| Item | Trạng thái |
|---|---|
| 4-file Pay+Email | _pending relay_ |
| 4-file T4+5 | _pending relay_ |
| Pay+Email expand audit cho Team Platform Runtime + invoice.iai.one (Q1+Q2) | _pending Pay+Email_ |
| Domain proof (`dig`) cho 16 domain | _Codex tự gỡ batch tiếp_ |
| Deploy proof cho 16 domain | external owner duty |
| Legal lane lock cho 6 domain TBD còn lại | _founder approve sau khi Q-OPEN-3 reply_ |

→ Master audit v1 FINAL ship khi: Pay+Email + T4+5 commit 4-file + 4 owner ship evidence (cdn/flows/developer + cios JWT rotate).

---

## 10. Update log

- 2026-04-26 EOD v1 PARTIAL: publish (commit `a17158c`)
- 2026-04-26 EOD v2 IMPROVED: post 5 decisions ký (commit `f0f85d6` + `695d5fa` + this commit)
