# TEAM1_DECISION_LOG_2026
- Team: Team 1 Program Root
- Owner: Team 1 Program Root
- Scope: *.iai.one
- Status: ACTIVE

## 2026-04-14
- Decision: Van hanh he theo model 5 team delivery.
- Why: can bang giua toc do va kha nang đóng bo.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5

- Decision: `iai.one` giữ constitutional root, `home.iai.one` giữ portal, `app/flow/dash/api` giữ core product truth.
- Why: ngan drift domain-role va giam lap domain.
- Impacted teams: all

- Decision: `noos.iai.one` phai bo role investor/fundraising va quay ve NOOS boundary da khoa.
- Why: tranh gay nut brand architecture.
- Impacted teams: Team 1, Team 3, Team 4

- Decision: EN-first / VI first-class la locale policy bắt buộc cho toan he.
- Why: khoa SEO, locale, canonical, hreflang va long-term expansion.
- Impacted teams: all

## 2026-04-15
- Decision: `flow.iai.one` được khoa lai theo huong living orchestration system.
- Why: ngan product drift ve workflow tool.
- Impacted teams: Team 2, Team 1

- Decision: `dash.iai.one` được khoa lai thanh living control system + runtime app surface.
- Why: không de Dash roi ve chart dashboard hoac UI shell mong.
- Impacted teams: Team 2, Team 1

- Decision: `developer.iai.one` được khoa thanh builder/integration portal, không phai docs mirror.
- Why: builder cần một cua vao hop đóng/SDK/auth/webhooks khac voi docs concepts.
- Impacted teams: Team 1, Team 2

- Decision: Team file-gap P0 được chuyen tu "team tu viet sau" sang "control tower tao va khoa nen trước".
- Why: giam thoi gian cho moi team tu dung file van hanh tu dau.
- Impacted teams: all

- Decision: release gate hiện tại uu tien runtime evidence thay vi tiếp tuc tao them domain ideas moi.
- Why: he da du file goc, gio can service truth.
- Impacted teams: all

- Decision: Team 2 contract confirmation window cho Team 5 được xem la da close sau khi locale contract lock + onboarding contract tests deu xanh.
- Why: bo chan lane Team 5 nhung van giữ gate theo release packet that.
- Impacted teams: Team 2, Team 5, Team 1

- Decision: Team 3 route/stack readiness evidence được chap nhận cho lane ky thuat NOOS; Team 4 launch expansion van giữ hold cho toi khi wave board cập nhật state.
- Why: tach ro technical readiness va launch readiness de tranh mở wave qua som.
- Impacted teams: Team 3, Team 4, Team 1

- Decision: Team 1 giữ partial open-gate theo domain evidence scope trong checkpoint 2026-04-15.
- Why: co domain da du test/runtime proof, nhung nhiều domain van thiếu release packet + rollback note.
- Impacted teams: all

- Decision: `nft.iai.one` chi được xem la public gateway da live; secure 2-layer protected-asset lane van NO-GO cho toi khi Team 2 + Team 4 nop du evidence packet.
- Why: current live response cho thay public registry shell, nhung gate passkey/WebAuthn, wallet proof, protected delivery, audit, va signed partner sync chưa co packet that cho Team 1 review.
- Impacted teams: Team 1, Team 2, Team 4, Ops

## 2026-04-17
- Decision: Team 1 hoàn tất Phase B va chuyen `docs.iai.one` sang `CONDITIONAL-GO` trong ordered audit checkpoint 2026-04-17.
- Why: `apps/docs` shell + `test:docs` + Team 1 audit update da du evidence de implementation-audit trong workspace hiện tại.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5

- Decision: Team 1 khoa baseline shell Phase B thanh 6 surface `CONDITIONAL-GO`: `iai.one`, `home.iai.one`, `app.iai.one`, `flow.iai.one`, `docs.iai.one`, `web.iai.one`.
- Why: ordered audit 2026-04-17 va fresh verify `pnpm test:flow-surface` + `pnpm test:docs` da xác nhận repo truth phu hop voi shell checkpoint moi.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5

- Decision: Thu tu execution tiếp theo được khoa cung thanh `nft.iai.one` trước, `pay.iai.one` sau.
- Why: không de lane thanh toan mở som hon lane public trust va secure asset gate.
- Impacted teams: Team 1, Team 2, Team 4, Team 5

- Decision: Team 1 ban hanh `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md` lam lenh van hanh hiện tại cho ca 5 team.
- Why: cần một lenh giao việc duy nhat, dung repo reality, dung audit truth, va dung locale policy cho NOOS.
- Impacted teams: all

- Decision: Team 1 giữ `NO-GO` cho secure NFT lane sau readiness sync 2026-04-17.
- Why: Team 2 packet van `BLOCKED` va chưa dap ung full runtime evidence chain theo `docs/NFT_IAI_ONE_TEAM2_TEAM4_EVIDENCE_PACKET_EXECUTION_2026.md`; Team 4 packet da `READY_FOR_TEAM1_REVIEW` nhung không du de mở gate mot minh.
- Impacted teams: Team 1, Team 2, Team 4, Ops

- Decision: Team 1 mở `docs/reports/team1/NFT_PHASE_C_TEAM1_INTAKE_REVIEW_QUEUE_2026-04-17.md` lam hang doi intake/review chinh thuc cho packet Phase C tu Team 2 va Team 4.
- Why: cần một bang tiếp nhận duy nhat de Team 1 danh dau gate tung packet, giữ combined verdict co trace, va chan lane `pay.iai.one` nhay qua khi slot final van `NO-GO`.
- Impacted teams: Team 1, Team 2, Team 4, Ops

- Decision: Team 1 ghi nhận Team 2 runtime release packet moi la hop le theo rule evidence-first cho lane root/home/app/flow/docs/web, nhung van giữ trang thai packet `IN_PROGRESS`.
- Why: packet da co route/API/test/rollback evidence traceable; đóng thoi packet tu xác nhận chưa la secure NFT reopen claim.
- Impacted teams: Team 1, Team 2, Team 3, Team 5

- Decision: Team 1 duy tri mission-map compatibility literals trong `docs/IAI_MASTER_DOMAIN_MISSION_MAP.md` de lane checker không fail do drift kiem tra legacy.
- Why: lane checker hiện tại check literal compatibility tren file docs wrapper; can giữ literal do trong khi canonical truth da chuyen sang `content/`.
- Impacted teams: Team 1, all teams phu thuoc lane snapshot

## 2026-04-18
- Decision: Team 1 adopt `docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md` lam root execution protocol chinh thuc cho toan bo Team 1..5 va moi AI/Codex/automation session trong repo.
- Why: cần một protocol goc duy nhat de không con team invent workflow rieng, không claim completion som, va không day founder vao noise loop lap lai.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5, AI/Codex/automation

- Decision: `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md` được nang len v1.1 va phai được doc cung voi master protocol trước moi task moi.
- Why: directive hiện tại da khoa phase order va domain lane; can them startup checklist, daily operating rule, va AI rule de execution không lech.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5, AI/Codex/automation

- Decision: Team 1 chuyen che do van hanh sang `IAI_DEV_EXECUTION_SYSTEM_V2_2026` va mở `docs/EXECUTION_BOARD_2026-04-18.md` lam board dieu hanh thực thi cho Team 1 / Team 2 / Team 3.
- Why: protocol goc can được map lai theo he `*.iai.one` de tranh over-process; cần một board nhe, ro, execution-first de 3 team vao lam ngay ma không phai suy dien them.
- Impacted teams: Team 1, Team 2, Team 3, AI/Codex/automation

- Decision: Team 1 ban hanh `docs/TEAM_DAILY_COMMAND_PACK_2026-04-18.md` va tu nop `docs/reports/team1/DAILY_TEAM1_2026-04-18.md` de đóng lane blocker "thiếu daily same-day" theo protocol V2.
- Why: control tower 2026-04-18 đang fail do thiếu daily report; cần một command pack ngan, build-first, de Team 2..5 nop dung format ma không mở them noise.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5

- Decision: Team 1 chap thuan `web.iai.one` preview reopen dua tren packet Team 5 + ket qua `pnpm test` + `pnpm report:lane` cua checkpoint 2026-04-17.
- Why: packet da du route/locale/metadata/rollback evidence theo release gate va dependency Team 2 cho lane nay da o monitor-only mode.
- Impacted teams: Team 1, Team 2, Team 5

- Decision: Team 1 giữ `NO-GO` cho `pay.iai.one` cho toi khi secure lane `nft.iai.one` được mở lai theo pair-review Team 2 + Team 4.
- Why: Phase D bi khoa theo thu tu execution; Team 2 packet secure NFT van `BLOCKED`.
- Impacted teams: Team 1, Team 2, Team 4, Team 5

- Decision: Team 1 tiếp nhận va chot goi handoff Team 3 -> Team 1 cho lane `noos.iai.one` trong cung ngay 2026-04-17 thong qua checklist intake rieng.
- Why: cần một artifact checklist duy nhat de xác nhận packet + metadata proof + correction log da du va da nop lane dung ngay.
- Impacted teams: Team 1, Team 3, Team 4

- Decision: Team 1 hoàn tất Phase C scaffold cho `nft.iai.one` o muc public trust shell va ghi nhận test xanh cho lane nay.
- Why: `apps/nft` + `pnpm typecheck:nft` + `pnpm test:nft` da xác nhận shell implementation co the audit trong repo, trong khi secure lane van giữ `NO-GO` do Team 2 packet con `BLOCKED`.
- Impacted teams: Team 1, Team 2, Team 4, Team 5

- Decision: Team 1 hoàn tất Phase D scaffold cho `pay.iai.one` o muc prep shell va giữ lock sequencing release.
- Why: `apps/pay` + `pnpm typecheck:pay` + `pnpm test:pay` da xanh, nhung quy tac thu tu van buoc `pay` cho sau secure NFT pair-review.
- Impacted teams: Team 1, Team 2, Team 4, Team 5

- Decision: Team 1 re-run regression shell baseline sau khi mở rộng `nft/pay` va giữ ket qua xanh.
- Why: `pnpm test:root`, `pnpm test:home`, `pnpm test:app`, `pnpm test:flow-surface`, `pnpm test:docs`, `pnpm test:web`, `pnpm test:dash` deu pass trong checkpoint hiện tại.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5

- Decision: Team 1 enforce protocol-adoption checks directly inside `report:lane` automation from 2026-04-18.
- Why: decision lock o 2026-04-18 phai được technical-enforced, không chi ghi nhận bang text.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5, AI/Codex/automation

- Decision: Team 1 close Phase C pair-review va mark secure `nft.iai.one` lane = `GO`.
- Why: Team 2 + Team 4 packets deu `READY_FOR_TEAM1_REVIEW` va `report:nft-phasec` da tra `PASS/GO`.
- Impacted teams: Team 1, Team 2, Team 4, Team 5

- Decision: Team 1 unlock Phase D preparation lane cho `pay.iai.one` nhung giữ lock release claim.
- Why: thu tu phase da hop le sau khi Phase C chuyen `GO`, nhung pay van can review-ready packet + rollback evidence trước release.
- Impacted teams: Team 1, Team 2, Team 4, Team 5

- Decision: Team 1 chap thuan acceptance state `ACCEPTED_GO` cho `dash.iai.one` va cập nhật domain gate sang `GO`.
- Why: packet release dash da du, `pnpm test:dash` va `pnpm test:flow` deu xanh, rollback note ton tai; Team 1 da khoa artifact `DASH_TEAM1_ACCEPTANCE_STATE_2026-04-18.md`.
- Impacted teams: Team 1, Team 2, Team 5

- Decision: Team 1 da tiếp nhận Team 2 report commit `213d2b5` va đóng blocker "Dash final acceptance pending".
- Why: Team 2 da nop daily/report dung format V2 short; Team 1 da verify `pnpm test:pay` (`6/6`) va xác nhận acceptance note Dash da khoa.
- Impacted teams: Team 1, Team 2

- Decision: Team 1 cập nhật lai execution board + command pack de bo stale blocker wording sau khi Dash da `ACCEPTED_GO`.
- Why: nhiều lane van dung wording "Dash pending review" du da đóng gate; can giữ command language dung state de tranh sai escalations.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5

- Decision: Team 1 tiếp nhận Team 5 daily/weekly 2026-04-18 va chuan hoa lai blocker phan loai thanh monitor-only.
- Why: Team 1 verify lai `pnpm test:web` va `pnpm test:noos-commerce-contracts` deu PASS; preview lane `web.iai.one` da được approve tu checkpoint 2026-04-17.
- Impacted teams: Team 1, Team 5

- Decision: Team 1 mở checklist nop packet cuoi lane cho `developer`, `cios`, `cdn`, `flows`, va Phase D `pay`.
- Why: cần một checklist duy nhat de gom nhom tất cả gate con lai, tranh missing evidence va giữ due 2026-04-20 EOD ro rang.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5

- Decision: Team 1 phat hanh packet request batch co owner va deadline cho domain con lai.
- Why: cần một lenh nop packet theo owner matrix de Team A/B/C/Team 2 không lech scope va Team 1 co the review đóng loat.
- Impacted teams: Team 1, Team 2, Team A, Team B, Team C

- Decision: Team 1 tao san packet stub cho `developer`, `cios`, `cdn`, `flows` de cat setup-time cho owner lane.
- Why: owner co the dien evidence truc tiếp tren dung path naming rule, giam mot vong cho "tao file" va day nhanh deadline 2026-04-20.
- Impacted teams: Team 1, Team A, Team B, Team C

- Decision: Team 1 đóng vong review Team 3 trong checkpoint hiện tại va mark lane `MONITOR_ONLY_ACCEPTED`.
- Why: Team 1 verify lai `pnpm test:noos-web` (`14/14`), `pnpm report:lane`, `pnpm report:control-tower` deu PASS; không phat hien loi moi.
- Impacted teams: Team 1, Team 3, Team 2

- Decision: Team 1 tiếp nhận Team 3 short daily/report checkpoint 2026-04-18 va giữ lane monitor-stable.
- Why: Team 3 nop dung format V2 short; Team 1 xác nhận không co delta bắt buộc mở scope moi.
- Impacted teams: Team 1, Team 3

- Decision: `docs/EXECUTION_BOARD_2026-04-18.md` được mở rộng thanh board dieu hanh cho Team 1 / Team 2 / Team 3 / Team 4 / Team 5 duoi vai tro Team Admin.
- Why: role giam sat hiện tại da bao phu toan bo 5 team; cần một board duy nhat de authority va fast command không bi chia doi giua board chinh va command pack.
- Impacted teams: Team 1, Team 2, Team 3, Team 4, Team 5, Team Admin
