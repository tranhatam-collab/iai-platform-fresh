# TEAM_DAILY_COMMAND_PACK_2026-04-18
## Active command pack for Team 2 / Team 3 / Team 4 / Team 5
## Status: ACTIVE
## Issued by: Team 1 Program Root
## Mode: IAI_DEV_EXECUTION_SYSTEM_V2_2026
## Date: 2026-04-18

---

## 0. Why this file exists

Control tower lane for 2026-04-18 is now PASS, and this command pack is kept active to enforce short-format daily execution discipline for all teams.

This file exists so each team can submit daily deltas fast, in one format, without drifting scope.

Hard rule:
- do not submit long essays
- do not restate old weekly context
- do not claim new release state without evidence
- use the exact 4-line format below

Required format:
- DONE:
- IN PROGRESS:
- BLOCK:
- NEXT:

Target files to submit today:
- `docs/reports/team2/DAILY_TEAM2_2026-04-18.md`
- `docs/reports/team3/DAILY_TEAM3_2026-04-18.md`
- `docs/reports/team4/DAILY_TEAM4_2026-04-18.md`
- `docs/reports/team5/DAILY_TEAM5_2026-04-18.md`

---

## 1. Shared rule for all teams

Use V2 execution mode:
- Lock fast
- Build small
- Verify real
- Expand

If the team changed nothing today:
- still submit the file
- state the stable truth
- state the blocker or waiting condition
- state the next action

If the team changed a release-relevant lane:
- attach exact test/evidence lines
- attach rollback note if needed

---

## 2. Team 2 command

### Scope today
- `dash.iai.one` stability
- `pay` foundation prep under Team 1 gate

### Do not do
- do not expand Dash scope
- do not claim pay release
- do not rewrite public copy

### Submit this
DONE:
- Dash command/audit/runtime lane remains green
- latest packet status for Dash

IN PROGRESS:
- pay foundation prep under Team 1 gate

BLOCK:
- no blocking action item if Dash stays unchanged and tests stay green

NEXT:
- hold Dash stable
- move only in pay foundation lane allowed by Team 1

---

## 3. Team 3 command

### Scope today
- NOOS route truth
- locale truth
- metadata truth
- Team 3 lane status: `MONITOR_ONLY_ACCEPTED` in current checkpoint

### Do not do
- do not open new NOOS scope
- do not fork runtime contract
- do not change pricing/license/product truth
- do not take any new Team 3 feature assignment in this checkpoint

### Submit this
DONE:
- current stable NOOS evidence truth
- confirm tests still represent live lane truth

IN PROGRESS:
- route/locale/metadata stability under baseline shell

BLOCK:
- dependency on Team 2 locale/auth/session continuity for checkout-success/library

NEXT:
- keep lane stable
- patch only when Team 2 continuity delta for `checkout-success/library` triggers Team 1 review note

---

## 4. Team 4 command

### Scope today
- NFT post-GO ops state
- support/recovery/partner trace discipline

### Do not do
- do not keep using the old pre-GO blocker wording
- do not open pay release wording
- do not invent new launch claims

### Submit this
DONE:
- state that Team 4 ops packet remains accepted/review-ready
- state current support/recovery/trace mapping truth

IN PROGRESS:
- post-GO ops maintenance or follow-up actions

BLOCK:
- only real blocker if one still exists after NFT pair gate `GO`

NEXT:
- keep ops wording and trace mapping aligned to Team 1 gate language

---

## 5. Team 5 command

### Scope today
- `web.iai.one` gate follow-up
- KPI/event baseline continuity

### Do not do
- do not fork auth/billing/runtime contract
- do not turn preview packet into release claim

### Submit this
DONE:
- web packet set already submitted
- event baseline / bilingual QA / preview truth currently stable

IN PROGRESS:
- Team 1 gate follow-up
- KPI snapshot formatting or supporting proof

BLOCK:
- no blocking action item if shared runtime contract remains stable

NEXT:
- keep web stable
- submit only reviewer-follow-up deltas

---

## 6. Team 1 follow-up after submissions

After all 4 files exist:
- rerun `pnpm report:lane`
- rerun `pnpm report:control-tower`
- update `docs/EXECUTION_BOARD_2026-04-18.md` only if state changed

No other lane should be opened before this closure pass.

---

## 7. Sendable short messages

### Team 2

Team 2 tiếp tục đúng lane đã khóa. Áp dụng chuẩn dev V2: lock nhanh, build nhỏ, verify thật, không mở rộng scope Dash. Giữ `dash.iai.one` xanh, chỉ đi tiếp `pay` foundation prep-only dưới gate Team 1 và nộp daily/report theo format ngắn đã khóa.

### Team 3

Team 3 tiếp tục giữ NOOS ổn định theo boundary hiện tại. Áp dụng chuẩn dev V2: không mở scope mới, không fork runtime contract, chỉ giữ route/locale/metadata truth và patch theo review note nếu có. Nộp daily/report theo format ngắn đã khóa.

### Team 4

Team 4 tiếp tục lane ops/growth đúng trạng thái hậu-NFT gate. Áp dụng chuẩn dev V2: không dùng lại wording blocker cũ, không mở claim mới, chỉ giữ support/recovery/trace mapping đúng gate language của Team 1. Nộp daily/report theo format ngắn đã khóa.

### Team 5

Team 5 tiếp tục giữ `web.iai.one` ổn định trên shared contract. Áp dụng chuẩn dev V2: không tách auth/billing/runtime truth, không biến preview thành release claim, giữ KPI/event proof đồng bộ và chỉ nộp delta khi Team 1 yêu cầu. Nộp daily/report theo format ngắn đã khóa.
