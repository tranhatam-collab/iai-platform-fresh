# EXECUTION_BOARD_2026-04-18
## Active execution board for Team 1 / Team 2 / Team 3 / Team 4 / Team 5
## Status: ACTIVE
## Mode: IAI_DEV_EXECUTION_SYSTEM_V2_2026
## Date: 2026-04-18

---

## 0. Operating mode

Root rule:
- `docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md` = root protocol

Execution mode for `*.iai.one`:
- Lock (fast)
- Build (small)
- Verify (real)
- Expand

Shared rules:
- không build gia
- không demo progress
- không half-UI
- không test = chưa lam
- không output = chưa verify
- report phai theo 4 đóng:
  - DONE
  - IN PROGRESS
  - BLOCK
  - NEXT

Task typing:
- TYPE 1 = core system
- TYPE 2 = product layer
- TYPE 3 = content / SEO / media

---

## 1. Team scope under this board

Board nay quan ly 5 team đang active va can command ro ngay:
- Team 1 = command center / gate / deploy authority
- Team 2 = runtime / contracts / audit / auth / billing lane
- Team 3 = NOOS surface / locale / metadata / route evidence
- Team 4 = growth / ops / support / trace mapping lane
- Team 5 = `web.iai.one` / onboarding / KPI event proof lane

---

## 2. Team 1 board

- Team type:
  - TYPE 1 - CORE SYSTEM
- Current mission:
  - giữ gate, review packet, chot GO/NO-GO, không de lane mở vo ky luat

DONE:
- adopt root protocol vao repo
- mở intake/review system cho packet Phase C
- Phase C `nft` queue đang o trang thai `GO`

IN PROGRESS:
- giam sat Phase D `pay` prep-only lane duoi Team 1 gate
- đóng bo packet closure lane cho cac domain con NO-GO (`developer`, `cios`, `cdn`, `flows`)

BLOCK:
- không co blocker ky thuat cho Dash; blocker hiện tại nam o packet completeness cua lane NO-GO con lai

NEXT:
- giữ `pay` o prep-only cho toi khi co packet review-ready + rollback evidence
- tiếp tuc control loop hang ngay (`report:lane` + `report:control-tower`)
- issue command follow-up cho owner `developer/cios/cdn/flows` de nop packet dung template

Do not do:
- build thay Team 2 hoac Team 3
- GO som hon packet
- mở them huong moi khi pay release-claim gate chưa đóng

---

## 3. Team 2 board

- Team type:
  - TYPE 1 - CORE SYSTEM
- Current mission:
  - giữ runtime truth xanh, giữ Dash command lane ổn định, chuan bi `pay` duoi gate

DONE:
- ship Dash command lanes
- ship audit endpoint va audit timeline lane
- build PASS:
  - `@iai/mail-core`
  - `@iai/mail-api`
  - `@iai/dash`
- test PASS:
  - `pnpm test:flow`
  - `pnpm test:dash`
  - `pnpm report:lane`

IN PROGRESS:
- Phase D `pay` preparation under Team 1 gate

BLOCK:
- không co blocker ky thuat trong lane Dash/Pay prep neu Team 2 giữ scope lock

NEXT:
- không mở rộng scope Dash nua neu không co Team 1 ask
- giữ command/audit/runtime contracts ổn định
- chi lam `pay` foundation theo lane được mở, không nhay thanh public release

Do not do:
- sua public copy
- sua IA
- sua metadata public surface
- tu nhận release GO

---

## 4. Team 3 board

- Team type:
  - TYPE 2 - PRODUCT LAYER
- Current mission:
  - giữ NOOS route truth, locale truth, metadata truth, evidence truth

DONE:
- Team 3 packet `READY_FOR_TEAM1_REVIEW`
- metadata proof da co
- route-level EN/VI evidence da co
- Team 1 checkpoint review closed: `MONITOR_ONLY_ACCEPTED`
- verify PASS:
  - `pnpm typecheck:noos-web`
  - `pnpm test:noos-web`
  - `pnpm test:noos-commerce-contracts`
  - `NOOS_STACK_TEST=1 pnpm test:noos-stack`
  - `pnpm report:lane`

IN PROGRESS:
- giữ route/locale/metadata ổn định theo baseline shell

BLOCK:
- monitor-only dependency vao Team 2 locale/auth/session continuity cho checkout-success/library

NEXT:
- giữ lane dung boundary
- không mở scope/feature moi cho Team 3 trong checkpoint hiện tại
- chi mở delta khi Team 2 handoff continuity cho `checkout-success/library` tao ra Team 1 review note cu the
- neu Team 1 yeu cau thi patch dung review note, không mở them feature

Do not do:
- sua pricing truth
- sua license truth
- sua product truth
- fork runtime contract

---

## 5. Team 4 board

- Team type:
  - TYPE 2 - PRODUCT LAYER
- Current mission:
  - giữ ops/growth/support wording dung gate, giữ trace mapping va recovery lane ổn định

DONE:
- Team 4 NFT ops packet `READY_FOR_TEAM1_REVIEW`
- support / recovery / deny-case wording da sync
- trace mapping proof da co cho Team 1 intake review

IN PROGRESS:
- post-GO ops maintenance theo gate language cua Team 1

BLOCK:
- không co blocker engineering moi; mở rộng claim moi van bi khoa neu chưa co Team 1 gate

NEXT:
- giữ ops wording ổn định
- không quay lai pre-GO blocker language
- không mở release wording cho `pay` khi Team 1 chưa goi

Do not do:
- invent launch claims
- sua product truth
- sua runtime truth
- mở rộng scope ngoai support / recovery / ops trace lane

---

## 6. Team 5 board

- Team type:
  - TYPE 2 - PRODUCT LAYER
- Current mission:
  - giữ `web.iai.one` ổn định tren shared auth / billing / runtime truth va theo reviewer path cua Team 1

DONE:
- Team 5 da nop preview packet + bilingual QA packet
- event baseline / track endpoints da co proof
- `web` lane đang o trang thai monitor duoi Team 1 gate

IN PROGRESS:
- KPI / event proof follow-up
- reviewer path closure cho `web`

BLOCK:
- không co blocker runtime critical; release expansion beyond current gate van bi khoa theo Team 1 scope lock

NEXT:
- giữ `web` stable
- không fork auth / billing / runtime
- chi nop delta reviewer can, không mở scope moi

Do not do:
- bien preview thanh release claim moi
- duplicate role cua `home` hoac `app`
- tao contract rieng

---

## 7. Fast command to teams

### Team 1
Giữ command-center loop ổn định. Chot packet lane cho `pay` prep-only va cac domain NO-GO con lai, không mở scope ngoai gate.

### Team 2
Giữ Dash xanh. Đừng mở rộng. Chuyen suc sang `pay` foundation theo gate, không release som.

### Team 3
Giữ NOOS ổn định. Không them scope. Chi patch theo review note, không build lan man.

### Team 4
Giữ ops/growth wording dung gate hiện tại. Không dung lai blocker cu va không mở claim moi.

### Team 5
Giữ `web` ổn định tren shared contracts. Chi theo reviewer path, không mở rộng scope.

---

## 8. Final rule

Board nay la mat dieu hanh thực thi hiện tại cho 5 team.

Neu co viec moi:
- quick lock toi da 30 phut
- xep dung TYPE
- build nho
- verify that
- report theo 4 đóng

Không ai được "nghi them" ngoai board khi chưa co Team 1 doi lenh.
