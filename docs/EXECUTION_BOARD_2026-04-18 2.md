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
- khong build gia
- khong demo progress
- khong half-UI
- khong test = chua lam
- khong output = chua verify
- report phai theo 4 dong:
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

Board nay quan ly 5 team dang active va can command ro ngay:
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
  - giu gate, review packet, chot GO/NO-GO, khong de lane mo vo ky luat

DONE:
- adopt root protocol vao repo
- mo intake/review system cho packet Phase C
- Phase C `nft` queue dang o trang thai `GO`

IN PROGRESS:
- giam sat Phase D `pay` prep-only lane duoi Team 1 gate
- dong bo packet closure lane cho cac domain con NO-GO (`developer`, `cios`, `cdn`, `flows`)

BLOCK:
- khong co blocker ky thuat cho Dash; blocker hien tai nam o packet completeness cua lane NO-GO con lai

NEXT:
- giu `pay` o prep-only cho toi khi co packet review-ready + rollback evidence
- tiep tuc control loop hang ngay (`report:lane` + `report:control-tower`)
- issue command follow-up cho owner `developer/cios/cdn/flows` de nop packet dung template

Do not do:
- build thay Team 2 hoac Team 3
- GO som hon packet
- mo them huong moi khi pay release-claim gate chua dong

---

## 3. Team 2 board

- Team type:
  - TYPE 1 - CORE SYSTEM
- Current mission:
  - giu runtime truth xanh, giu Dash command lane on dinh, chuan bi `pay` duoi gate

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
- khong co blocker ky thuat trong lane Dash/Pay prep neu Team 2 giu scope lock

NEXT:
- khong mo rong scope Dash nua neu khong co Team 1 ask
- giu command/audit/runtime contracts on dinh
- chi lam `pay` foundation theo lane duoc mo, khong nhay thanh public release

Do not do:
- sua public copy
- sua IA
- sua metadata public surface
- tu nhan release GO

---

## 4. Team 3 board

- Team type:
  - TYPE 2 - PRODUCT LAYER
- Current mission:
  - giu NOOS route truth, locale truth, metadata truth, evidence truth

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
- giu route/locale/metadata on dinh theo baseline shell

BLOCK:
- monitor-only dependency vao Team 2 locale/auth/session continuity cho checkout-success/library

NEXT:
- giu lane dung boundary
- khong mo scope/feature moi cho Team 3 trong checkpoint hien tai
- chi mo delta khi Team 2 handoff continuity cho `checkout-success/library` tao ra Team 1 review note cu the
- neu Team 1 yeu cau thi patch dung review note, khong mo them feature

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
  - giu ops/growth/support wording dung gate, giu trace mapping va recovery lane on dinh

DONE:
- Team 4 NFT ops packet `READY_FOR_TEAM1_REVIEW`
- support / recovery / deny-case wording da sync
- trace mapping proof da co cho Team 1 intake review

IN PROGRESS:
- post-GO ops maintenance theo gate language cua Team 1

BLOCK:
- khong co blocker engineering moi; mo rong claim moi van bi khoa neu chua co Team 1 gate

NEXT:
- giu ops wording on dinh
- khong quay lai pre-GO blocker language
- khong mo release wording cho `pay` khi Team 1 chua goi

Do not do:
- invent launch claims
- sua product truth
- sua runtime truth
- mo rong scope ngoai support / recovery / ops trace lane

---

## 6. Team 5 board

- Team type:
  - TYPE 2 - PRODUCT LAYER
- Current mission:
  - giu `web.iai.one` on dinh tren shared auth / billing / runtime truth va theo reviewer path cua Team 1

DONE:
- Team 5 da nop preview packet + bilingual QA packet
- event baseline / track endpoints da co proof
- `web` lane dang o trang thai monitor duoi Team 1 gate

IN PROGRESS:
- KPI / event proof follow-up
- reviewer path closure cho `web`

BLOCK:
- khong co blocker runtime critical; release expansion beyond current gate van bi khoa theo Team 1 scope lock

NEXT:
- giu `web` stable
- khong fork auth / billing / runtime
- chi nop delta reviewer can, khong mo scope moi

Do not do:
- bien preview thanh release claim moi
- duplicate role cua `home` hoac `app`
- tao contract rieng

---

## 7. Fast command to teams

### Team 1
Giu command-center loop on dinh. Chot packet lane cho `pay` prep-only va cac domain NO-GO con lai, khong mo scope ngoai gate.

### Team 2
Giu Dash xanh. Dung mo rong. Chuyen suc sang `pay` foundation theo gate, khong release som.

### Team 3
Giu NOOS on dinh. Khong them scope. Chi patch theo review note, khong build lan man.

### Team 4
Giu ops/growth wording dung gate hien tai. Khong dung lai blocker cu va khong mo claim moi.

### Team 5
Giu `web` on dinh tren shared contracts. Chi theo reviewer path, khong mo rong scope.

---

## 8. Final rule

Board nay la mat dieu hanh thuc thi hien tai cho 5 team.

Neu co viec moi:
- quick lock toi da 30 phut
- xep dung TYPE
- build nho
- verify that
- report theo 4 dong

Khong ai duoc "nghi them" ngoai board khi chua co Team 1 doi lenh.
