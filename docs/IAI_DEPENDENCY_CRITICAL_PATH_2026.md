# IAI_DEPENDENCY_CRITICAL_PATH_2026
## Critical cross-team dependency order for `*.iai.one`
## Version 1.2
## Status: ACTIVE CHECKPOINT TRACKING
## Scope: Team 1 / Team 2 / Team 3 / Team 4 / Team 5
## Date: 2026-04-18

---

## 1. Muc tieu

File nay tra loi rat thang:
- ai dang chan ai
- viec nao phai xong truoc viec nao
- team nao khong duoc release neu dependency truoc chua xanh

Day la critical path that, khong phai backlog tong hop.

---

## 2. Current release truth

Planning/doc P0 da gan nhu dong.
Critical path hien tai la:
- runtime truth
- locale truth
- route QA truth
- release evidence truth

Neu 4 lop nay chua xanh, release domain van phai NO-GO.

### 2026-04-18 checkpoint delta

- CLOSED:
  - Team 3 route-level evidence packet attached for Team 1/Team 2 consumption.
  - Team 5 preview packet + bilingual route QA packet attached and reviewed by Team 1.
  - Team 1 reviewer decision for `web.iai.one` preview reopen.
  - Team 2 secure NFT runtime/security packet moved to `READY_FOR_TEAM1_REVIEW`.
  - Team 4 trace mapping closure (`wrong asset opening request` + `deny mismatch`) completed.
  - Team 1 combined pair-gate verdict for secure `nft.iai.one` moved to `GO`.
  - Team 1 acceptance state for `dash.iai.one` locked at `ACCEPTED_GO`.
- OPEN:
  - `developer.iai.one`, `cios.iai.one`, `cdn.iai.one`, `flows.iai.one` still waiting domain-specific evidence packets.
  - `pay.iai.one` packet is `READY_FOR_TEAM1_REVIEW` in prep lane, but release-claim gate remains locked.

---

## 3. Dependency chain overview

### Chain A - Team 2 -> Team 3 -> Team 4 -> Team 1

1. Team 2 khoa auth / locale / checkout / entitlement / webhook truth
2. Team 3 dua NOOS surfaces vao route QA EN/VI that
3. Team 4 moi duoc mo launch copy va funnel wave
4. Team 1 moi co the review gate reopen

### Chain B - Team 2 -> Team 5 -> Team 1

1. Team 2 khoa shared auth / billing / onboarding contract
2. Team 5 dua `web.iai.one` vao preview packet + SEO/locale evidence
3. Team 1 review mission + release gate
4. Current state (2026-04-17): preview reopen approved, dependency moved to monitor-only contract stability

### Chain C - Team 2 -> Team 1 / Team A

1. Team 2 khoa contract docs va runtime truth
2. Team 1 / Team A moi build `developer.iai.one` that ma khong drift

### Chain D - Team 2 -> Dash lane -> Team 1

1. Team 2 scaffold va build `dash.iai.one` theo backlog
2. Team 2 attach runtime evidence packet
3. Team 1 moi review `dash.iai.one` gate reopen
4. Current state (2026-04-18): Team 1 verdict = `ACCEPTED_GO`, chain moved to monitor-only contract stability

### Chain E - Team 2 -> Team 4 -> Team 1 for `nft.iai.one`

1. Team 2 khoa passkey / step-up / wallet proof / protected asset delivery / partner sync security truth
2. Team 4 khoa VC asset opening policy, recovery path, support path, va partner ops handoff voi `vc.vetuonglai.com`
3. Team 1 moi review `nft.iai.one` gate va cho GO/NO-GO
4. Packet file paths dung cho lane nay:
   - `docs/runtime/TEAM2_NFT_LIVE_EVIDENCE_PACKET_2026.md`
   - `docs/reports/team4/TEAM4_NFT_PARTNER_OPS_EVIDENCE_PACKET_2026.md`
   - `docs/NFT_IAI_ONE_TEAM2_TEAM4_EVIDENCE_PACKET_EXECUTION_2026.md`
5. Current state (2026-04-18):
   - Team 2 packet: `READY_FOR_TEAM1_REVIEW`
   - Team 4 packet: `READY_FOR_TEAM1_REVIEW`
   - Combined Team 1 verdict: `GO` for secure lane

---

## 4. Team-by-team blockers (current)

### Team 1

Blocked on:
- packet closure for `developer.iai.one`, `cios.iai.one`, `cdn.iai.one`, `flows.iai.one`
- Phase D `pay.iai.one` release-claim review-ready closure (prep lane da mo, release claim van khoa)

Can deliver:
- release authority
- decision/risk updates
- gate review

### Team 2

Blocked on:
- khong bi block ky thuat trong lane hien tai; bi lock gate cho `pay` release claim toi khi Team 1 close packet review

Can deliver:
- API changelog
- webhook matrix
- locale contract
- fulfillment runbook
- error codebook
- Dash implementation build sequence
- `nft.iai.one` auth/proof/protected-delivery contract and evidence

### Team 3

Blocked by Team 2 on:
- locale return path truth
- entitlement/library status truth
- checkout success contract truth

Can deliver:
- EN/VI route QA
- NOOS product/library surfaces
- domain correction discipline

### Team 4

Blocked by Team 3 on:
- route readiness
- NOOS public surface readiness

Blocked by Team 2 on:
- checkout / fulfillment truth
- update / entitlement truth

Can deliver:
- bilingual growth copy
- launch operations
- support / upgrade handling
- VC partner ops and NFT recovery/opening policy evidence

### Team 5

Blocked by Team 2 on:
- monitor-only runtime continuity after Team 1 preview reopen decision

Can deliver:
- onboarding/growth surface
- experiment registry
- bilingual SEO log
- post-preview instrumentation and growth iteration

---

## 5. Domain-level critical paths

### `developer.iai.one`

Blocked until:
- Team 2 auth/session/API/webhook truth is stable
- Team 1 / Team A build pages from locked platform spec
- release evidence packet is attached

### `dash.iai.one`

Current state:
- Team 1 acceptance state da khoa `ACCEPTED_GO` (2026-04-18)

Monitor-only dependencies:
- Team 2 contract continuity (dash/api.flow)
- Team 1 rerun gate loop khi co contract-breaking delta

### `noos.iai.one`

Blocked until:
- Team 2 locale + entitlement truth ready
- Team 3 route QA ready
- Team 4 launch ops align with actual surface

### `web.iai.one`

Blocked until:
- none for preview reopen gate (approved at Team 1 checkpoint 2026-04-17)

Monitor-only dependencies:
- Team 2 shared auth/billing/runtime contract continuity
- Team 5 instrumentation follow-up after preview reopen

### `nft.iai.one`

Current state:
- secure lane da duoc Team 1 pair-gate mark `GO` (2026-04-18)

Monitor-only dependencies:
- Team 2 + Team 4 packet delta phai duoc pair-review lai truoc khi thay doi gate language
- Team 1 rerun `report:nft-phasec` + `report:control-tower` trong 30 phut sau moi packet update

---

## 6. Hard stop rules

- Team 4 khong duoc mo launch wave moi neu Team 3 QA log chua xanh du P0.
- Team 5 khong duoc release public onboarding surface neu shared auth/billing contract chua khoa.
- Team 1 khong duoc reopen gate cho `dash.iai.one` neu evidence packet thieu auth/runtime/rollback proof.
- Team 1 / Team A khong duoc ship `developer.iai.one` neu Team 2 contracts chua du de viet builder docs dung.
- Khong team nao duoc release `nft.iai.one` neu protected assets con truy cap duoc bang raw URL hoac neu vault-class action chua co step-up auth.

---

## 7. Immediate next order

1. Domain owners for `developer.iai.one`, `cios.iai.one`, `cdn.iai.one`, and `flows.iai.one` attach release packet + rollback/test evidence.
2. Team 2 + Team 1 close Phase D `pay.iai.one` review-ready packet evaluation for release-claim decision.
3. Team 1 maintain daily command loop and rerun `report:control-tower` after every packet delta.
4. Team 2 keep `dash` stable and Team 5 keep `web` stable under monitor-only dependency model.
5. Team 1 keep release authority lock until evidence packet checklist is fully closed.

---

## 8. Definition of done

File nay dat gia tri khi:
- moi team thay ro minh dang chan ai hoac bi ai chan
- khong con tranh cai "sao chua release duoc"
- Team 1 gate review dua tren mot critical path ro rang
