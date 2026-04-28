# TEAM1_FOUNDER_5_OPEN_QUESTIONS_REMINDER_2026-04-26

- Team: Team 1 Program Root / Control Tower (Codex supervisor)
- Date: 2026-04-26
- Audience: Founder Trần Hà Tâm
- Purpose: Nhắc 5 open questions trong boundary plan v1.0.1 cần founder quyết, kèm Codex recommendation từng câu
- Source: `docs/IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26.md` §6 + commit `c71dac2`
- Trạng thái: Plan v1.0.1 vẫn DRAFT — sẽ promote v1.1 LOCKED khi founder trả lời

---

## 0. Tóm tắt cho founder (1 màn hình)

| # | Câu hỏi | Codex recommendation | Mức urgency |
|---|---|---|---|
| Q-OPEN-1 | Team A = developer.iai.one? | (a) Team A = developer.iai.one | P2 — không block |
| Q-OPEN-2 | Team D có tách portion với A+B+C+D không? | (a) Team D 100% trong Pay+Email | P1 — block boundary clarity |
| Q-OPEN-3 | apps/app, apps/home, apps/root, apps/docs, apps/nft → agent nào? | xem §3 — recommend cụ thể từng app | P1 — block file ownership |
| Q-OPEN-4 | A+B+C+D agent là ai? | **DEFERRED** — push 4 owner trước (`ea70c54`), reassess 04-30 | P0 đã có path |
| Q-OPEN-5 | 230+ dirty file pre-existing strategy? | (b) Codex (supervisor) tách dirty theo lane trước | P1 — block sạch git |

→ Founder trả lời 5 câu (1-2 chữ mỗi câu) → Codex promote plan v1.1 LOCKED + cập nhật scope cho mọi agent.

---

## 1. Q-OPEN-1: Team A là gì cụ thể?

### Câu hỏi gốc (boundary plan §6)
> Hiện tôi đoán Team A = developer.iai.one. Nhưng có thể Team A = Admin / Auditor / khác.
> - (a) Team A = developer.iai.one (Developer Platform team)
> - (b) Team A = ??? (founder chỉ định)

### Codex recommendation: **(a)**

### Lý do
- `IAI_TEAM_ACTIVE_ASSIGNMENT_MATRIX_2026-04-15.md` không có row "Team A" riêng — chỉ có 5 team đánh số (T1-T5) + Team B/C/D bằng chữ.
- Theo convention "team A/B/C/D = chữ cái lane" và `developer.iai.one` đã có verdict `REOPEN_REVIEW_APPROVED` từ Team A, → Team A = Developer Platform team là cách đoán hợp lý nhất.
- Nếu founder muốn Team A = Admin/Auditor (chức năng khác), hiện không thấy artifact nào support.

### Tác động khi founder trả lời
- (a) → boundary plan §1 Agent 2 lane Team A confirmed = developer.iai.one. Lane checker từ 2026-04-27 sẽ assert Team A daily/report file existence.
- (b) → founder cần định nghĩa Team A scope, owner, lane.

→ **Founder reply gọn**: "Q1: a" hoặc "Q1: <định nghĩa khác>"

---

## 2. Q-OPEN-2: Team D có tách portion với A+B+C+D không?

### Câu hỏi gốc
> Pay+Email canonical plan claim toàn bộ Team D. Nếu vậy A+B+C+D KHÔNG có Team D portion.
> - (a) Team D 100% trong Pay+Email — A+B+C+D agent chỉ có A+B+C
> - (b) Team D có portion với A+B+C+D (vd onboarding form / owner intake) — cần nói rõ portion nào

### Codex recommendation: **(a)**

### Lý do
- `IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md` §3 (locked v1.0) Pay+Email claim nguyên chuỗi: Team B (pay infra) + Team D (payment activation) + Team Pay.
- Team D output chính (intake row, receiver registry, onboarding form, partner activation) đều liên quan trực tiếp đến payment lane.
- Nếu tách portion với A+B+C+D, sẽ tạo 2 daily Team D song song → coordination overhead, conflict cao.
- Pay+Email đã viết Team D dailies/packets 04-22/04-23 cho 3 partner (tranhatam, omdalat, vetuonglai).

### Tác động khi founder trả lời
- (a) → A+B+C+D agent thực ra chỉ là "A+B+C" agent (Team D ngoài scope). Renaming nội bộ.
- (b) → cần định nghĩa portion split (vd: "onboarding form thuộc Team A, payment activation thuộc Pay+Email").

→ **Founder reply gọn**: "Q2: a" hoặc "Q2: b — split: ..."

---

## 3. Q-OPEN-3: Apps không trong 4 agent scope

### Câu hỏi gốc
> - `apps/app/` (app.iai.one) — TBD
> - `apps/home/` (home.iai.one) — TBD
> - `apps/root/` (root.iai.one) — TBD
> - `apps/docs/` (docs.iai.one) — TBD (đề xuất A+B+C+D = Team A)
> - `apps/nft/` (nft.iai.one) — TBD (đề xuất Codex)

### Codex recommendation (per app)

| App | Domain | Recommend agent | Lý do |
|---|---|---|---|
| `apps/app/` | app.iai.one | **T4+5 agent** | App là consumer-facing, gần web.iai.one (T5 scope) |
| `apps/home/` | home.iai.one | **T4+5 agent** | Home = landing, gần web.iai.one |
| `apps/root/` | root.iai.one | **T4+5 agent** | Root = top-level, gần web |
| `apps/docs/` | docs.iai.one | **A+B+C agent** | Docs portal = developer-related, gần Team A |
| `apps/nft/` | nft.iai.one | **Codex (T1+2+3)** | NFT specs đã do Codex viết (7 file `docs/NFT_*_2026.md`); cross-cutting verifiable system |

### Lý do tổng quan
- Mỗi app cần ownership rõ để phân split 230+ dirty file (Q-OPEN-5).
- T4+5 agent đã hoạt động lành mạnh (commit DAILY+REPORT 04-26 đầy đủ) → có capacity cho 3 app consumer-facing.
- A+B+C agent cover developer.iai.one + cios.iai.one + cdn.iai.one + flows.iai.one + docs.iai.one (cùng cluster developer/infra).
- NFT thuộc Codex vì specs đã viết, contracts deploy, verifiable asset cross-cuts dash/noos (Codex scope).

### Tác động
- 5 app × file ownership exclusive → boundary plan §1 Section "Code ownership" mở rộng.
- Lane checker từ 04-27 assert app-specific daily nếu cần.

→ **Founder reply gọn**: "Q3: theo Codex" hoặc "Q3: <override>: app→X, home→Y, ..."

---

## 4. Q-OPEN-4: A+B+C+D agent là ai? — DEFERRED

### Câu hỏi gốc
> - (a) Spawn AI agent thứ 4 cho A+B+C+D
> - (b) Founder + delegated team thực tế làm A+B+C+D
> - (c) Codex tạm cover A+B+C+D đến khi có agent dedicated
> - (d) Khác

### Codex recommendation: **DEFERRED**

### Lý do
- Phân tích supervisor (đã viết trong [TEAM1_FOUNDER_4_OWNER_PUSH_EMAIL_TEMPLATES_2026-04-26.md §6](docs/reports/team1/TEAM1_FOUNDER_4_OWNER_PUSH_EMAIL_TEMPLATES_2026-04-26.md)): 4 domain BLOCKED không vì thiếu agent, mà vì thiếu external evidence.
- Founder gửi 4 email push owner (commit `ea70c54`) → 3-4 ngày sau evidence về → 4 domain unblock.
- Reassess Q-OPEN-4 vào **2026-04-30**:
  - Nếu 4 domain xanh → Codex coordination đủ, không cần spawn agent
  - Nếu vẫn BLOCKED → spawn agent (a) hoặc Codex wear-2-hats (c)

### Tác động khi founder trả lời
- "DEFERRED" → không action ngay. Codex tự reassess sau 04-30.
- Founder vẫn có thể override nếu muốn quyết sớm.

→ **Founder reply gọn**: "Q4: defer" hoặc "Q4: a/b/c"

---

## 5. Q-OPEN-5: Pre-existing 230+ dirty file strategy

### Câu hỏi gốc
> Trong git status hiện có ~466 untracked + dirty file. Phần lớn là:
> - apps/app/, apps/developer/, apps/docs/, apps/flow/, apps/home/, apps/root/ — untracked tree
> - content/iai-*.md — untracked
> - docs/... — untracked (40+ file)
>
> - (a) Để 4 agent tự gộp dirty theo scope của mình
> - (b) Codex (supervisor) làm P1 tách dirty theo lane trước, sau đó 4 agent vào sạch
> - (c) Khác

### Codex recommendation: **(b)** — Codex tách trước, sau đó 4 agent commit theo lane

### Lý do
- Để 4 agent tự gộp (option a) sẽ gây: (1) commit chồng chéo, (2) commit message ambiguous, (3) git operation conflict (Rule 3 boundary plan).
- Codex (supervisor) tách trước = single source of authority, không có race condition.
- Workflow đề xuất:
  1. Codex chạy `git status -s | sort` + classify file theo §3 ownership matrix
  2. Codex viết file `docs/reports/team1/TEAM1_DIRTY_FILE_OWNERSHIP_SPLIT_2026-04-XX.md` (mapping file → agent)
  3. Mỗi agent đọc mapping → tự `git add` + commit phần của mình
  4. Codex verify: `git status` sạch sau khi 4 agent commit
- Ước tính: ~1-2 giờ Codex + 30 phút mỗi agent commit.

### Tác động
- (a) → tự nguyện, không structure → rủi ro rebase hell.
- (b) → có structure, ~2-3 giờ tổng → git tree sạch trong 1 ngày.
- (c) → founder đề xuất chiến lược khác.

→ **Founder reply gọn**: "Q5: a" / "Q5: b" / "Q5: <khác>"

---

## 6. Format reply gọn (founder copy-paste lại)

```
Q1: <a | b | tự định nghĩa>
Q2: <a | b — chi tiết>
Q3: <theo Codex | override: app→X, home→Y, ...>
Q4: <defer | a | b | c>
Q5: <a | b | c — chi tiết>
```

→ Codex sẽ promote plan v1.1 LOCKED trong vòng 30 phút sau khi nhận reply.

---

## 7. Lý do cần promote v1.1 LOCKED sớm

- Plan v1.0.1 đang DRAFT → mọi agent có thể "interpret tự do" → rủi ro overlap (4 lần đã xảy ra trong phiên 04-26 — xem §0 boundary plan).
- Pay+Email đã ack ngầm v1.0 (commit theo scope mới: `30eb251`, `02df6b4`, `6cb0705`) → đang chấp nhận DRAFT.
- T4+5 agent ack ngầm v1.0 (commit DAILY+REPORT 04-26 đúng scope mình).
- Nhưng A+B+C agent chưa định danh → bất kỳ agent thứ 4 nào spawn cần plan LOCKED để onboard nhanh.

→ Founder reply 5 câu = unlock plan v1.1 LOCKED = unlock A+B+C agent onboarding khi cần.
