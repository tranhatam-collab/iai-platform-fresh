# IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26

Version: 1.0.3 — PARTIALLY LOCKED (4/5 Q resolved + trust.iai.one assigned 2026-04-26 EOD; Q-OPEN-4 DEFERRED to 2026-04-30 reassess)
Status: Effective from 2026-04-26
Date: 2026-04-26
Author: Codex (Team 1+2+3 supervisor)
Purpose: Khoá scope của 4 agent đang chạy parallel để KHÔNG chồng chéo file/folder/git operation

V1.0.3 changes (founder confirm 2026-04-26 EOD):
- **trust.iai.one ASSIGNED to Codex T1+T2+T3 (Agent 3)** — Operational Trust Surface = governance/verification meta-surface, fits supervisor scope. Source code in top-level `trust-iai-one-starter/` dir (Cloudflare Pages-style), shipped Phase 1 MVP via commit `33c9fe3`. Companion code in `nft.iai.one/assets/trust-*.js` + `nft.iai.one/functions/_lib/trust-*.js`.
- Per `trust-iai-one-starter/docs/TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/TRUST_ROLE_BOUNDARY.md`: trust.iai.one is **operational trust surface** that answers "How can a human or organization verify what is official, what is proven, what is declared, and what is still unverified?" — explicit non-overlap with iai.one (root), home/app (portal/shell), developer (docs hub), nft.iai.one (proof issuance / verification product).

V1.0.2 changes (founder reply 2026-04-26 EOD):
- Q1 SIGNED: Pay+Email own Team Platform Runtime (pay.iai.one shared runtime contract evolution)
- Q2 SIGNED: invoice.iai.one tồn tại; owner = Pay+Email
- Q3 SIGNED: founder push provider TEAM2_PAY_GATE_API_KEY (action in progress)
- Q4 SIGNED: Codex pre-fill DRAFT mode active for 4 KHÔNG_OWNER teams (label: INFERRED BY ADMIN, AWAITING TEAM CONFIRM)
- Q5 SIGNED: dash.iai.one legal lane = billing-support-only operator-facing; noos.iai.one = commerce surface payment via pay.iai.one

---

## 0. Vấn đề hiện tại (overlap đã xảy ra)

Trong phiên 2026-04-26, đã có 4 lần chồng chéo cụ thể:

1. **Code apps/pay/**: commit `96e7b2a` (Codex tự sửa apps/pay/src/server.ts) gây bug `idCountry` vs `country`, được mask bởi WIP từ agent khác, rồi bị `git reset --hard` của AI Owner Email+Pay expose ra → build đỏ.
2. **Doc territory pay/mail**: Codex đã viết 4 spec file trong `docs/PAY_IAI_ONE_*` + `docs/iai-mail-platform/*`, founder phải yêu cầu xóa vì out-of-scope.
3. **Cross-link insert vào 5 file**: AI Owner Email+Pay và Codex thực hiện stash+commit workflow song song, lock git index 3+ phút.
4. **Test:pay verification**: Codex chạy `pnpm test:pay` để verify Section 7.3 cosmetic fix nhưng build đỏ vì bug từ apps/pay scope của agent khác.

Plan này đặt boundary cứng để 4 lần chồng chéo trên không tái diễn.

---

## 1. 4 agents — scope cứng

### Agent 1: **IAI.ONE Pay + Email** (AI Owner Email+Pay)

**Domain ownership:**
- `pay.iai.one` (toàn bộ runtime + activation + treasury ops + **shared runtime contract evolution per Q1 SIGNED 2026-04-26**)
- `mail.iai.one` (toàn bộ Email + SMTP)
- `invoice.iai.one` (per Q2 SIGNED 2026-04-26 — cluster pay/invoice)

**Code ownership:**
- `apps/pay/` (toàn bộ — server, render, payment-routing, payment-event-evidence, webhook sender, etc.)
- `apps/mail-api/`
- `apps/mail-smtp/`
- `apps/mail-worker/`
- `apps/mail-web/`
- `apps/mail-inbound/`
- `packages/mail-core/`

**Doc ownership:**
- `docs/PAY_IAI_ONE_*` (tất cả file prefix này)
- `docs/iai-mail-platform/` (toàn bộ thư mục)
- `docs/IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_*.md`

**Reports ownership:**
- `docs/reports/teamd/` (toàn bộ Team D activation packets)
- `docs/release-evidence/pay.iai.one/`

**Lane ownership:**
- Team Email + Team SMTP
- Team B (chỉ phần pay-infra: webhook routing, callback, payment evidence persistence)
- Team D (toàn bộ payment activation per Q-OPEN-2 reply pending — provisional)
- Team Pay
- **Team Platform Runtime** (per Q1 SIGNED 2026-04-26 — evolve `/health` to expose 3 missing fields: `shared_read_model`, `shared_upstream_runtime`, `shared_upstream_release_gate_ready`)
- **Pay gate authority** (ra verdict `LOCK_FLIPPED` / `LOCK_RETAINED` cho `pay.iai.one`)

**Source-of-truth file:** `docs/IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md`

---

### Agent 2: **IAI Team A+B+C+D** (NEW — TBD agent)

**Lane ownership:**
- Team A: **developer.iai.one** (Developer Platform / API console / contract docs)
- Team B (non-pay portion): CDN release evidence + Flows release evidence
- Team C: **cios.iai.one** (closure attachment 04-23 đã có, cần Team 1 (other agent) accept và đẩy vào release-evidence chain)
- Team D (KHÔNG có nếu Pay+Email cover toàn bộ — see open questions)

**Domain ownership:**
- `developer.iai.one`
- `cios.iai.one`
- `cdn.iai.one`
- `flows.iai.one`

**Code ownership:**
- `apps/developer/`
- `apps/flow/` (flow.iai.one — flow engine)
- `apps/docs/` (docs.iai.one — docs portal — TBD nếu founder chia khác)

**Doc ownership:**
- `docs/DEVELOPER_IAI_ONE_*`
- `docs/FLOW_*` (FLOW_ENGINE_MASTER_ARCHITECTURE.md, FLOW_IAI_ONE_RELEASE_GATE_2026.md)
- `docs/CDN_*` + `docs/FLOWS_*` (release evidence references)

**Reports ownership:**
- `docs/reports/teamb/` (nếu tách non-pay portion)
- `docs/reports/teama/` (nếu có)
- `docs/release-evidence/cdn.iai.one/`
- `docs/release-evidence/cios.iai.one/`
- `docs/release-evidence/developer.iai.one/`
- `docs/release-evidence/flows.iai.one/`

---

### Agent 3: **Fix IAI.ONE Team 1+2+3** (Codex — TÔI)

**Lane ownership:**
- Team 1: Control Tower / Gate Authority — **NHƯNG KHÔNG BAO GỒM pay gate authority** (pay verdict do Pay+Email phát hành)
- Team 2 (NON-pay portion): `dash.iai.one` stability, runtime contract maintenance ngoài pay
- Team 3: NOOS commerce metadata (toàn bộ)

**Domain ownership:**
- `dash.iai.one`
- `noos.iai.one` (commerce surfaces)
- `trust.iai.one` (Operational Trust Surface — V1.0.3 ASSIGNED 2026-04-26 EOD)
- Cross-team governance (lane checker, multilingual readiness, dev best baseline, control-tower-status)

**Code ownership:**
- `apps/dash/`
- `apps/noos-web/`
- `apps/nft/` (TBD — đề xuất giao Team 1+2+3 nếu không ai claim)
- `trust-iai-one-starter/` (top-level dir — toàn bộ Phase 1 MVP: src, docs, content, scripts, migrations, public, wrangler.toml, package.json)
- `nft.iai.one/assets/trust-ui.js`, `nft.iai.one/assets/trust-seed.js`, `nft.iai.one/functions/_lib/trust-store.js`, `nft.iai.one/functions/_lib/trust.js` (trust integration vào nft surface — Codex sở hữu vì trust là supervisor product, dù đặt trong nft tree)
- `life.iai.one/content/trust-page-registry.json`, `life.iai.one/assets/trust-architecture.svg` (trust integration vào life surface — Codex sở hữu nếu T4+5 không claim life.iai.one; nếu T4+5 claim life thì 2 file này họ ack respect Codex authoring)

**Doc ownership:**
- `docs/CANONICAL_EXECUTION_LEDGER_AND_RELEASE_STATE.md`
- `docs/IAI_TEAM1_*` + `docs/IAI_TEAM2_*` (program plan, live tracking board)
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`
- `docs/IAI_DEPENDENCY_CRITICAL_PATH_2026.md`
- `docs/IAI_MULTILINGUAL_EXPANSION_PLAYBOOK_2026.md`
- `docs/IAI_LANGUAGE_GLOSSARY_CANONICAL_2026.md`
- `docs/IAI_TEAM_DELIVERY_AND_FILE_GAP_MATRIX_2026.md`
- `docs/IAI_CROSS_TEAM_EXECUTION_MODEL_2026.md`
- `docs/EXECUTION_BOARD_*.md` (Team 1 board)
- `docs/DASH_IAI_ONE_*`
- `docs/noos/` + `docs/noos-platform/`
- `docs/NFT_*` (TBD đi cùng apps/nft/)

**Reports ownership:**
- `docs/reports/team1/` (toàn bộ)
- `docs/reports/team2/` (chỉ phần non-pay; pay probes vẫn để pay-team2 docs nếu Pay+Email muốn)
- `docs/reports/team3/`
- `docs/release-evidence/dash.iai.one/`
- `docs/release-evidence/trust.iai.one/` (TBD — sẽ tạo khi trust Phase 1 đạt acceptance criteria per `trust-iai-one-starter/docs/TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/TRUST_PHASE1_ACCEPTANCE_CRITERIA.md`)
- `trust-iai-one-starter/docs/` (trust spec docs — Phase 1 foundation files)

**Cross-team coordination:**
- Codex viết các doc có chữ "CROSS_TEAM" hoặc "COORDINATION" — đây là supervisor scope.
- Codex KHÔNG edit code trong apps/pay/, apps/mail-*, apps/developer/, apps/flow/, apps/web/.

---

### Agent 4: **IAI Team 4+5** (T4+T5 agent)

**Lane ownership:**
- Team 4: Growth Revenue Operations
- Team 5: Web KPI / Live Sync

**Domain ownership:**
- `web.iai.one`
- `life.iai.one` (TBD — life.iai.one có content production, có thể giao Team 4 hoặc tách riêng)

**Code ownership:**
- `apps/web/`
- `life.iai.one/` (top-level — TBD)

**Doc ownership:**
- `docs/WEB_IAI_ONE_*`
- `docs/TEAM4_*`

**Reports ownership:**
- `docs/reports/team4/`
- `docs/reports/team5/`
- `docs/release-evidence/web.iai.one/`

---

## 2. Boundary rules — quy tắc tránh chồng chéo

### Rule 1 — File ownership exclusivity
Mỗi file/folder chỉ thuộc đúng MỘT agent. Bảng ownership ở Section 1 là source of truth. Agent KHÔNG được edit file ngoài scope của mình, kể cả khi phát hiện bug.

### Rule 2 — Bug ngoài scope = ESCALATE, không tự sửa
Nếu agent A phát hiện bug ở file thuộc agent B, phải:
- Viết escalation note trong commit message của agent A (nếu commit liên quan)
- Hoặc tạo file `docs/reports/<my-team>/CROSS_AGENT_ESCALATION_<YYYY-MM-DD>.md`
- KHÔNG tự sửa file của agent B

Ví dụ thực tế: bug `idCountry` ở `apps/pay/src/server.ts:517,692` (commit `96e7b2a`) — Pay+Email phải fix, Codex chỉ escalate.

### Rule 3 — Git operation serialization
Khi 1 agent đang chạy `git stash`, `git reset`, `git rebase`: agent khác KHÔNG được chạy git operations song song. Cách phối hợp:
- Trước khi stash/reset/rebase: tạo file `.git-coordination-lock-<agent-name>` (đặt ở root repo, untracked)
- Khi xong: xóa file lock
- Agent khác kiểm tra file lock trước khi chạy git op tương tự

(Cách đơn giản tạm thời — tương lai có thể chuyển sang real git mutex)

### Rule 4 — Cross-team coordination doc
Chỉ Codex (Team 1+2+3 supervisor) được viết file có pattern:
- `docs/reports/team1/TEAM1_CROSS_TEAM_*.md`
- `docs/IAI_CROSS_TEAM_*.md`
- `docs/IAI_DEPENDENCY_CRITICAL_PATH_*.md`

Các agent khác có thể đọc + cite, nhưng KHÔNG edit.

### Rule 5 — Audit doc về cross-cutting topic
Nếu agent X muốn audit code/doc của agent Y, ghi audit vào `docs/reports/<my-team>/<my-team>_AUDIT_OF_<their-area>_<date>.md`. KHÔNG ghi audit trong thư mục/file của agent Y.

Ví dụ: Codex audit Section 7 về apps/pay → ghi ở `docs/reports/team1/TEAM1_PAY_REPO_SIDE_AUDIT_SECTION_7_2026-04-26.md`. Đúng chỗ.

### Rule 6 — Verification chỉ trong scope
Mỗi agent chỉ verify (test/build) trong scope của mình:
- Pay+Email: `pnpm test:pay`, `pnpm test:mail-*`, `pnpm --filter @iai/pay build`, etc.
- Codex: `pnpm test:dash`, `pnpm test:noos-*`, `pnpm test:nft`, `pnpm report:lane`, `pnpm report:control-tower`
- T4+5: `pnpm test:web`, `pnpm typecheck:web`, `pnpm review:team5-*`
- A+B+C+D: `pnpm test:developer`, `pnpm test:flow*`, `pnpm test:docs`

Nếu một command bao trùm scope của agent khác (vd `pnpm build` build all 16 packages), agent chạy phải lưu ý: lỗi ngoài scope KHÔNG phải lỗi của mình → escalate per Rule 2.

### Rule 7 — Commit message phải khai báo scope
Mỗi commit phải có prefix rõ scope:
- `pay(...)` / `mail(...)` → Pay+Email
- `team1(...)` / `team2(...)` / `team3(...)` / `dash(...)` / `noos(...)` / `nft(...)` → Codex
- `team4(...)` / `team5(...)` / `web(...)` → T4+5
- `developer(...)` / `flow(...)` / `cdn(...)` / `flows(...)` / `cios(...)` / `teamb(...)` / `teama(...)` → A+B+C+D
- `docs(...)` → owner của doc (cite agent in commit body)

---

## 3. Cross-agent dependencies

### Codex depend trên Pay+Email
- Lane checker `pnpm report:lane` cần `PAY_IAI_ONE_GATE_VERDICT_<date>.md` từ Pay+Email — lane PASS không thể nếu Pay+Email không nộp verdict
- Cross-team coord report của Codex cần update khi Pay+Email flip gate

### Codex depend trên T4+5
- Lane checker cần `DAILY_TEAM4_<date>.md` + `DAILY_TEAM5_<date>.md` từ T4+5

### T4+5 depend trên Pay+Email
- Synchronized live readiness của Team 5 chỉ unblock khi Pay+Email phát `LOCK_FLIPPED`
- Team 5 KPI loop reference `release-claim` state do Pay+Email maintain

### A+B+C+D depend trên Codex (Team 1)
- Lane checker assertions xác minh A+B+C+D evidence packets có đúng format

### Pay+Email depend trên Codex (Team 1)
- Pay verdict cần Team 1 manual note (Codex viết) trong `PAY_IAI_ONE_PROD_GATE_STATUS_<date>.md` — nhưng since pay gate authority đã chuyển sang Pay+Email, Codex KHÔNG còn phát hành verdict; Pay+Email tự viết

### Founder dependencies (không agent nào substitute được)
- Owner provider ack canonical key/header → unblock Pay+Email rerun
- 4 domain owner evidence (developer/cios/cdn/flows) → unblock A+B+C+D
- Inbox proof Gmail/Outlook → unblock Pay+Email Wave 1 close
- `PAYMENT_WEBHOOK_SECRET` generation → unblock Item 2 broadcast
- Notion/GitHub URL → unblock T4+5 broadcast packet

---

## 4. Conflict resolution protocol

### Khi 2 agent edit cùng 1 file

1. Agent đến sau check `git status` → nếu file đã M, ESCALATE qua note thay vì edit
2. Nếu cần thiết phải edit (vd cross-link insert): tạo file lock per Rule 3
3. Stash + commit workflow: agent thứ 2 đợi agent thứ 1 commit xong, pull, rồi mới mở edit

### Khi 2 agent commit message overlap scope

Codex (supervisor) review log mỗi 30 phút:
- Phát hiện overlap → mở `docs/reports/team1/TEAM1_CROSS_AGENT_CONFLICT_<YYYY-MM-DD-HHMM>.md`
- Note rõ commit hash + agent + overlap nature
- Đề xuất resolution (revert / squash / clarify)

### Khi audit cross-cutting

Audit DOC luôn nằm trong agent đang audit, KHÔNG nằm ở agent bị audit. Ví dụ Codex audit Section 7 cho Pay+Email → audit doc ở `docs/reports/team1/`, không ở `docs/PAY_IAI_ONE_*` hay `docs/iai-mail-platform/`.

---

## 5. Today's per-agent action list (2026-04-26)

### Pay+Email
- [ ] **P0 — Fix bug `idCountry` vs `country`** ở `apps/pay/src/server.ts:517,692` (introduce by `96e7b2a`, blocking pnpm test:pay)
- [ ] Wave 2 content additional flow nếu chưa hoàn tất (đã ship `93ef8c2` + `d542493`)
- [ ] Refresh intake board snapshot 04-26
- [ ] Closeout packet
- [ ] Team-ask registry consolidation
- [ ] Update `TRANHATAM_COM_PAY_TEAM_ASK_BROADCAST_PACKET_2026-04-25.md` mark Item 1 closed

### A+B+C+D (TBD agent — chờ founder assign agent thực tế)
- [ ] Catch-up evidence packets cho 4 domain BLOCKED (developer/cios/cdn/flows) hoặc escalate cho founder để chase owner
- [ ] Confirm CIOS closure 04-23 đã được Team 1 accept vào release-evidence chain
- [ ] Tạo daily/report 04-26 cho Team A và Team B (non-pay) nếu lane checker yêu cầu

### Codex (Team 1+2+3 supervisor) — TÔI
- [x] Catch-up T1+T2+T3 dailies window 04-23 → 04-26 — DONE (commit `f6fd622`)
- [x] Section 7 audit + addendum — DONE (`6a0f969`)
- [x] Section 7.3 cosmetic fix `apps/pay/src/render.ts` — DONE (`0b1d4b9`)
- [x] Cross-team coordination report 04-26 — DONE (in `f6fd622`)
- [x] **THIS PLAN FILE** — DONE (in this commit)
- [ ] Standby: Team 2 ready-to-rerun khi owner provider ack về (5 lệnh chuẩn)
- [ ] Standby: Update lane checker khi T4+5 commit 4 file 04-26

### T4+5 agent
- [ ] Đợi founder confirm Q1 → commit 4 file 04-26 (DAILY/REPORT T4+T5) + KPI artifacts
- [ ] (skip per recommendation) Backfill 04-24/04-25 dailies — không khẩn cấp
- [ ] Update broadcast packet sau khi founder confirm Q3

---

## 6. Open questions cần founder confirm

### Q-OPEN-1: Team A là gì cụ thể?
Hiện tôi đoán Team A = developer.iai.one. Nhưng có thể Team A = Admin / Auditor / khác. **Founder confirm:**
- (a) Team A = developer.iai.one (Developer Platform team)
- (b) Team A = ??? (founder chỉ định)

### Q-OPEN-2: Team D có chia portion với A+B+C+D không?
Pay+Email canonical plan claim toàn bộ Team D. Nếu vậy A+B+C+D KHÔNG có Team D portion. **Founder confirm:**
- (a) Team D 100% trong Pay+Email — A+B+C+D agent chỉ có A+B+C
- (b) Team D có portion với A+B+C+D (vd onboarding form / owner intake) — cần nói rõ portion nào

### Q-OPEN-3: Apps không trong 4 agent scope (apps/app, apps/home, apps/root, apps/docs, apps/nft)
- `apps/app/` (app.iai.one) — TBD
- `apps/home/` (home.iai.one) — TBD
- `apps/root/` (root.iai.one) — TBD
- `apps/docs/` (docs.iai.one) — TBD (đề xuất A+B+C+D = Team A vì developer-related)
- `apps/nft/` (nft.iai.one) — TBD (đề xuất Codex vì cross-cutting verifiable system)

**Founder assign:**
- App / Home / Root → agent nào?
- Docs portal → A+B+C+D hay Codex?
- NFT → Codex (đề xuất) hay agent khác?

### Q-OPEN-4: A+B+C+D agent là ai?
Hiện chưa có agent thực tế cho A+B+C+D. **Founder confirm:**
- (a) Spawn AI agent thứ 4 cho A+B+C+D
- (b) Founder + delegated team thực tế làm A+B+C+D (không có AI agent)
- (c) Codex tạm cover A+B+C+D đến khi có agent dedicated
- (d) Khác

### Q-OPEN-5: Pre-existing 230 dirty file ở session start
Trong git status hiện có ~466 untracked + dirty file. Phần lớn là:
- `apps/app/`, `apps/developer/`, `apps/docs/`, `apps/flow/`, `apps/home/`, `apps/root/` — untracked tree
- `content/iai-*.md` — untracked
- `docs/...` — untracked (40+ file)

Trước khi 4 agent vào việc thật, **founder confirm**:
- (a) Để 4 agent tự gộp dirty theo scope của mình
- (b) Codex (supervisor) làm P1 tách dirty theo lane trước, sau đó 4 agent vào sạch
- (c) Khác

---

## 7. Effective date + change log

- 2026-04-26: V1.0 DRAFT publish; áp dụng từ commit này
- 2026-04-26: V1.0.1 add §9 Supervisor reporting & next-step approval protocol
- 2026-04-26 EOD: V1.0.2 PARTIALLY LOCKED — founder reply Q1+Q2+Q3+Q4+Q5 (Q-OPEN-4 deferred); Pay+Email scope expand to Team Platform Runtime + invoice.iai.one; legal lane lock dash + noos
- Future updates: ghi ở section này khi founder approve change

---

## 8. Acknowledgement

Khi mỗi agent đọc file này, ack bằng cách thêm 1 dòng vào commit message tiếp theo:

```
ack: IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26 v1.0
```

Hoặc tạo file `docs/reports/<my-team>/SCOPE_BOUNDARY_ACK_<my-team>_2026-04-26.md` với 1 dòng:

```
Agent <name> acknowledges scope boundary plan v1.0 dated 2026-04-26.
```

---

## 9. Supervisor reporting & next-step approval protocol (mandatory)

Áp dụng cho **mọi agent** khi báo cáo cho founder Trần Hà Tâm. Ưu tiên cao nhất cho Codex (Team 1+2+3 supervisor) vì là người tổng hợp.

### 9.1 Mỗi báo cáo phải kết thúc bằng "Đề xuất bước tiếp theo"

Cuối mọi report / status update / message gửi founder, agent phải có 1 block `## Đề xuất bước tiếp theo` chứa:

- **Hành động cụ thể** (1 hoặc nhiều option, đánh số) — kèm file path + lệnh chính xác.
- **Lý do** (1 câu) — vì sao đây là việc đáng làm tiếp.
- **Scope ai làm** — nói rõ agent nào phải thực thi (hoặc founder duty).
- **Kỳ vọng kết quả** — output sẽ là gì sau khi xong.
- **Thời gian ước tính** — phút/giờ/ngày.

### 9.2 Founder approval contract

- Nếu founder reply chỉ với từ "ok" (hoặc "OK", "Ok", "đồng ý", "duyệt") → agent thực thi đúng option đầu tiên trong đề xuất, không hỏi lại.
- Nếu founder muốn chọn option khác → reply số option (ví dụ "ok 2") → agent thực thi option đó.
- Nếu founder reply ý khác (chỉ thị mới, câu hỏi, từ chối) → agent KHÔNG thực thi đề xuất, theo chỉ thị mới.
- Nếu founder im lặng → agent giữ standby, KHÔNG tự thực thi đề xuất.

### 9.3 Format chuẩn

```
## Đề xuất bước tiếp theo

**Option 1 (default — nhấn "ok" để chạy):** <action ngắn>
- File / lệnh: <path or command>
- Lý do: <1 câu>
- Scope: <agent / founder duty>
- Kỳ vọng: <output>
- Thời gian: <ước tính>

**Option 2 (nhấn "ok 2"):** <action thay thế>
...

**Hoặc chỉ thị tự do**: founder gõ task khác.
```

### 9.4 Khi không còn việc đáng đề xuất

Agent vẫn phải có block `## Đề xuất bước tiếp theo` với nội dung:

```
**Standby**: Không có proactive task trong scope. Chờ trigger:
- <list trigger cụ thể>
```

KHÔNG được bỏ trống block này — nếu thiếu, founder sẽ không biết agent đang chờ gì.

### 9.5 Lý do (why this rule)

Founder không cần đoán "AI đang nghĩ gì" hoặc "có nên cho AI làm tiếp không". Mỗi báo cáo end-state đều có call-to-action rõ ràng → founder chỉ cần nhấn "ok" hoặc đưa chỉ thị mới. Loại bỏ ambiguity, tăng tốc decision loop.
