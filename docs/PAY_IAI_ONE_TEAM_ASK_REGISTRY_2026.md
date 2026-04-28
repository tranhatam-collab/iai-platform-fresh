# PAY_IAI_ONE_TEAM_ASK_REGISTRY_2026

Version: 1.0

Status: Live registry — open ask index for the pay.iai.one + mail.iai.one lanes

Date opened: 2026-04-26

AI Owner: Claude (Anthropic) — phiên Trần Hà Tâm

Scope: Mục lục mọi yêu cầu (ask) đang mở mà các team gửi cho AI Owner trên 2 lane `mail.iai.one` (Team Email + Team SMTP) và `pay.iai.one` (Team B + Team D + Team Pay). File này là chỗ duy nhất để biết AI Owner đang nợ gì, đang ưu tiên gì, và cái gì đã đóng.

Liên quan:

- `IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md` (kế hoạch tổng + format ask + folder evidence)

⸻

## 0. Cách dùng registry này

### 0.1 Cách team mở ask mới

Một trong hai folder, theo lane:

- `docs/iai-mail-platform/asks/<YYYY-MM-DD>-<team>-<topic>.md` — cho lane mail / SMTP
- `docs/pay-team-asks/<YYYY-MM-DD>-<team>-<topic>.md` — cho lane pay

Ask phải dùng đúng format trong AI Owner plan §6.2:

```
# Ask: <one-line topic>
From: <team>
Date: <YYYY-MM-DD>
Lane: mail | pay | both
Priority: P0 | P1 | P2
Blocked-on-AI: yes | no
Body:
<đoạn ngắn mô tả: muốn AI Owner làm gì, đầu vào ở đâu, expected output là gì, deadline>
Inputs:
- <list các file / commit / link evidence nếu có>
Acceptance:
- <điều kiện rõ ràng để ask được đóng>
```

Sau khi tạo file ask, team mở 1 PR vào repo có description chứa block `@ai-owner` và link tới file ask.

### 0.2 Cách AI Owner xử lý

Mỗi vòng phiên, AI Owner sẽ:

1. Quét cả 2 folder để tìm ask mới.
2. Cập nhật registry này với 1 dòng mới ở section 1 (Open) hoặc section 2 (Triage) tuỳ priority + readiness.
3. Mở 1 commit/PR xử lý.
4. Khi hoàn tất, đánh dấu ask `Closed by <commit-hash>` trong file ask gốc và move dòng tương ứng từ section 1 sang section 3 (Closed).

### 0.3 Trạng thái cho phép trong registry

- `OPEN` — ask đã được nhận diện, chưa bắt đầu.
- `IN_PROGRESS` — AI Owner đang làm.
- `BLOCKED_ON_TEAM` — AI Owner cần thêm input từ team trước khi tiếp tục.
- `BLOCKED_ON_FOUNDER` — chờ Founder quyết.
- `CLOSED` — đã có commit đóng ask.
- `CANCELLED` — team rút lại hoặc đã không còn cần.

⸻

## 1. Open asks

### 1.1 Lane mail / SMTP

Hiện tại không có ask mở từ Team Email / Team SMTP nào trong folder `docs/iai-mail-platform/asks/`.

Khoảng trống có chủ đích — Team Email + SMTP có thể bắt đầu thả ask vào khi cần AI Owner xử lý phần repo-side cho mailbox binding, alias config, sender policy hoặc Wave 1 / Wave 2 / Wave 3 evidence verification.

| ask_id | file | from_team | priority | blocked_on_ai | open_since | status | summary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _none_ | — | — | — | — | — | — | — |

### 1.2 Lane pay

| ask_id | file | from_team | priority | blocked_on_ai | open_since | status | summary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ask-pay-001` | self-opened (AI Owner) | AI Owner Pay+Email | P1 | yes | 2026-04-26 | RESOLVED 2026-04-27 — stale-dist false alarm; clean rebuild + `pnpm test:pay` returns 59/59 PASS | The 9 "content-gap" failures observed on 2026-04-26 were stale `apps/pay/dist/` artifacts (last build before `02df6b4` ID-country fix and before `30eb251` i18n backfill). After clean rebuild on 2026-04-27 (`rm -rf packages/config/dist apps/pay/dist && pnpm test:pay`), all assertions pass — receiver registry, vc.vetuonglai VND assignment, non-VN ID → USD enforcement, Team D site activation registry, prepared-domain form-in-progress, blocked payment block, vi-locale rendering, checkout shell, checkout status vi-awaiting-confirmation. No code change needed. Closed without a separate fix commit. Also closed `packages/config/dist/env.d.ts` empty (11 bytes) build-corruption symptom by clean rebuild at the same time. |

Lưu ý: Team có thể đã mở `pay-team-ask` với tên khác trong các vòng trước. Khi gặp file dạng `*pay-team-ask*` ngoài folder chuẩn, AI Owner sẽ:

- ack file ngoài folder
- gắn pointer trong section 4 (Legacy ask references) bên dưới
- yêu cầu chuyển sang folder chuẩn cho vòng kế tiếp

⸻

## 2. Triage backlog

Ask đã ack nhưng AI Owner chưa quyết định ưu tiên cho vòng phiên kế tiếp. Đặt ở đây để Founder xem và bấm ưu tiên nếu cần.

| ask_id | file | from_team | priority | blocked_on_ai | open_since | status | summary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _none_ | — | — | — | — | — | — | — |

⸻

## 3. Closed asks

| ask_id | file | from_team | closed_at | closed_by_commit | summary |
| --- | --- | --- | --- | --- | --- |
| _none_ | — | — | — | — | — |

⸻

## 4. Legacy ask references

File ngoài folder chuẩn nhưng có nội dung là ask. AI Owner ghi lại để không sót, kèm yêu cầu di trú format.

| file_path | seen_on | suggested_canonical_path | note |
| --- | --- | --- | --- |
| `docs/pay-team-ask/*` (các packet `2026-04-2*` đã được commit `9d9650d`, `c62211a`) | 2026-04-25 và 2026-04-26 | `docs/pay-team-asks/<YYYY-MM-DD>-<team>-<topic>.md` | đã được supersede bằng locked payload contract; coi như đã closed; format mới chỉ áp dụng cho ask sau ngày 2026-04-26 |

⸻

## 5. SLA và cadence AI Owner cam kết

- ack ask trong vòng 1 phiên kế tiếp kể từ khi file land trong folder chuẩn
- với `Priority: P0` + `Blocked-on-AI: yes`: bắt đầu xử lý ngay phiên ack
- với `P1`: bắt đầu phiên kế tiếp
- với `P2`: chen vào lịch tuần
- mỗi ask đóng có commit hash gắn vào file ask gốc

AI Owner không lùi bước SLA tự ý. Nếu phải pause, sẽ ghi vào registry status `BLOCKED_ON_TEAM` hoặc `BLOCKED_ON_FOUNDER` kèm lý do.

⸻

## 6. Cái gì registry này KHÔNG là

- Không phải nơi viết ask. Ask phải nằm trong file riêng theo §0.1.
- Không phải nơi log mọi commit AI Owner — đó là git log.
- Không phải nơi chứa nội dung evidence — đó là folder `docs/iai-mail-platform/evidence/...` hoặc `docs/release-evidence/pay.iai.one/...` theo AI Owner plan §2.4 / §3.4.
- Không phải nơi quyết định status row intake board hoặc tracker — đó là bảng tương ứng.

Registry này là một thanh điều phối: ai nợ ai cái gì, ưu tiên thế nào, đã đóng chưa.

⸻

## 7. Change log

- 2026-04-26 v1.0 — registry được lock lần đầu, mở 2 lane mail + pay, hiện chưa có ask nào.
