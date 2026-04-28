# TEAM1_LONG_HORIZON_CONTINUOUS_DEV_PLAN_2026-04-28
- Team: Team 1 Program Root / Control Tower / Gate Authority
- Date: 2026-04-28
- Timezone: Asia/Ho_Chi_Minh
- Status: ACTIVE_EXECUTION_UNTIL_CLOSE

## 1) Muc tieu tong

Hoan tat toan bo chuoi dev va release readiness cho cac lane dang mo, theo nguyen tac:

1. khong claim live khi proof chua du;
2. khong flip gate khi signal chua xanh;
3. giai quyet blocker theo critical path, khong nhay viec ngau nhien;
4. giu dung boundary team ownership, Team 1 la gate/review/coordinator.

## 2) Exit state (dinh nghia hoan tat)

Chuong trinh duoc coi la close khi dat dong thoi:

1. `pay.iai.one` gate duoc flip hop le (`LOCK_FLIPPED`) tren artifact ngay moi nhat.
2. Chuoi invoice -> payment evidence -> gate verdict dong bo cung `RERUN_DATE`.
3. Universal bilingual rebuild dong toan he theo lane-specific closure:
   - `dash.iai.one` inline bilingual = 0;
   - `noos.iai.one` exception architecture closure signed;
   - `life.iai.one` site-wide audit khong con `BLOCKED_NO_LIVE`.
4. Team 1 co the phat final integrated close packet co traceable proof cho cac lane P0/P1.

## 3) Critical path (khong duoc dao thu tu)

### CP-1: Invoice dependency

1. Pay+Email fix `invoice.iai.one` Internal Error.
2. Team 1 xac nhan invoice lane khong con blocker cho tax-evidence chain.
3. Moi cho phep sang merchant onboarding va rerun authority bundle.

### CP-2: Pay gate authority chain

1. Founder/owner cap canonical secret binding production.
2. Team 2 dat du env preflight (`API_KEY/SITE_KEY`, `TENANT_CODE`, `SITE_CODE`).
3. Team 2 chay full rerun bundle dung playbook.
4. Team 1 chay full-rerun review checker.
5. Team 1 phat verdict moi (`LOCK_RETAINED_WITH_REASON` hoac `LOCK_FLIPPED`).

### CP-3: Bilingual whole-system close

1. Dash cleanup content-source truoc (giam inline count ve 0).
2. Noos exception review closure packet.
3. Life site-wide rebuild 4 phase den khi audit PASS.

## 4) Workstreams lien tuc (run song song)

## WS-A: Payment and gate stream (P0)

Owner chinh: Team 2 + Pay+Email
Gate/review: Team 1

Milestones:
1. M0 - Canonical env lock confirmed.
2. M1 - Preflight `PREFLIGHT_READY`.
3. M2 - Full rerun complete + 8 required gate signals PASS.
4. M3 - Team 1 verdict update.

Dau ra bat buoc moi chu ky:
- `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_<date>.md`
- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_<date>.md`
- `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_<date>.md`
- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_<date>.md`
- `docs/reports/team1/TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_<date>.md`
- `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_<date>.md`

## WS-B: Legal-foundation verify-first stream (P0)

Owner chinh: Pay+Email + Founder
Review/governance: Team 1

Checklist close:
1. DE good standing proof.
2. Merchant profile cleanup (MLM wording khong con tren be mat underwriter-facing).
3. PayPal Business active theo EIN dung.
4. Shared runtime fields expose theo contract gate.

## WS-C: Bilingual rebuild stream (P1)

Owner chinh:
- dash: Team 2
- noos: Team 3 + Team 4
- life: life lane owners
Review: Team 1

Milestones:
1. Dash cleanup complete (`inline_count = 0`).
2. Noos exception closure signed.
3. Life Phase 0/1/2/3 complete, site-wide audit PASS.
4. Team 1 publish whole-system bilingual closure note.

## WS-D: Control-tower reporting stream (P1)

Owner: Team 1

Nhiem vu lap lai:
1. Daily status + blocker delta.
2. Gate verdict consistency check.
3. Lane status checker rerun khi co artifact moi.
4. Escalation entry neu blocker qua SLA.

## 5) Ke hoach thoi gian lien tuc (rolling plan 14 ngay)

Ngay 1-2:
1. khoa lai canonical env + secret ack path;
2. buoc Team 2 dat `PREFLIGHT_READY`;
3. verify invoice blocker state.

Ngay 3-5:
1. chay full rerun pay bundle theo playbook;
2. Team 1 review checker + ra verdict;
3. neu gate chua xanh: tao exact unmet-signal action list cho vong tiep theo trong 24h.

Ngay 6-10:
1. dong dash cleanup;
2. nop noos exception closure;
3. mo life rebuild phase 0->2 (inventory + source-of-truth + rewrite core pages).

Ngay 11-14:
1. life phase 3 QA/SEO + site-wide audit rerun;
2. Team 1 tong hop integrated readiness;
3. ra final close packet neu tat ca gate/lane dat.

Rolling rule:
- Neu khong dat milestone ngay du kien, khong doi deadline co hoc; phai xuat "reason + corrective owner + new ETA" trong cung ngay.

## 6) Lich van hanh trong ngay (lien tuc den khi close)

Moc gio ICT:
1. 09:00 - overnight artifact sync + blocker triage.
2. 11:00 - pay gate checkpoint (preflight/probe/verdict delta).
3. 14:00 - cross-team dependency sync.
4. 17:00 - daily publish + next-day lock.
5. 21:00 - optional fast rerun window neu owner secret/env vua duoc cap.

SLA:
- blocker triage <= 4h
- conflict decision <= 24h
- gate decision same-day khi item "ready-for-review"

## 7) Decision matrix (de chay khong dung)

1. Neu preflight `BLOCKED_PRECHECK` -> dung full rerun, quay lai env/owner.
2. Neu bundle `COMMAND_FAILURE` -> sua command/runtime truoc, khong xin flip.
3. Neu bundle `RERUN_COMPLETED_GATE_FAIL` -> fix unmet signals theo uu tien auth -> checkout -> shared-runtime.
4. Neu bundle `RERUN_GREEN` -> Team 1 review authority va ra verdict.

## 8) Risk register active

1. Owner secret ack tre -> gate lock dai.
2. Shared runtime contract chua expose field -> khong du 3 signal shared.
3. Invoice lane tai phat loi -> chan merchant onboarding.
4. Life rebuild scope phong to -> cham whole-system close.

Giam thieu:
1. tach backlog theo signal-level task;
2. moi blocker co 1 owner + 1 due time + 1 artifact path;
3. escalate ngay trong 30 phut khi blocker moi co risk cross-lane.

## 9) Command pack chuan (tham chieu van hanh)

Preflight:
```bash
node scripts/team2-pay-prod-rerun-bundle.mjs --date=<RERUN_DATE> --preflight-only
```

Full rerun:
```bash
node scripts/team2-pay-prod-rerun-bundle.mjs --date=<RERUN_DATE>
```

Team 1 review checker:
```bash
node scripts/team1-pay-full-rerun-review-check.mjs --date=<RERUN_DATE>
```

Lane/control snapshots:
```bash
pnpm report:lane -- --date=<RERUN_DATE>
pnpm report:control-tower -- --date=<RERUN_DATE>
```

## 10) Governance guardrails

1. Khong thay doi authority chain: Team 2/Pay+Email khong tu claim flip gate.
2. Khong dung test pass cuc bo de thay gate truth.
3. Khong open synchronized live truoc verdict Team 1.
4. Khong claim global bilingual closure neu life/noos/dash chua close lane-specific.

## 11) Immediate next actions (bat dau ngay)

1. Team 2: dat preflight pay lane len `PREFLIGHT_READY` voi env canonical.
2. Pay+Email: xac nhan invoice fix state + shared runtime expose plan.
3. Team 1: chay review bundle ngay khi co artifact moi, cap nhat verdict trong ngay.
4. Team 2: mo dash cleanup batch (inline bilingual -> content source).
5. Team 3+4: nop noos exception closure note.
6. life owners: kick-off Phase 0 inventory + freeze scope.

## 12) Final operating direction

Plan nay la "continuous-until-close" mode:

- khong dung theo kieu mot dot roi dung;
- moi ngay phai co artifact moi hoac closure moi;
- Team 1 giu role dieu phoi va gate authority den khi tat ca exit criteria dong.
