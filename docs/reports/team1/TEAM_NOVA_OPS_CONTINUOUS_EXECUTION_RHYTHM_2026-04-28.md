# TEAM_NOVA_OPS_CONTINUOUS_EXECUTION_RHYTHM_2026-04-28
- Team execution alias: TEAM_NOVA_OPS (TNO)
- Parent authority: Team 1 Program Root / Gate Authority
- Date: 2026-04-28
- Mode: CONTINUOUS_UNTIL_CLOSE

## 1) Mission lock

TEAM_NOVA_OPS vận hành theo nhịp liên tục để:

1. giữ lane/control-tower luôn có snapshot mới;
2. cập nhật block state liên team mỗi vòng;
3. ưu tiên kéo closure cho pay gate và NO-GO owner sign-off;
4. báo cáo ngắn, rõ, có path chứng cứ cho founder.

## 2) Continuous loop (fixed cadence)

### 09:00 ICT - Baseline sync
- Rerun lane snapshot.
- Verify daily coverage Team 1-5.
- Verify gate verdict hiện hành.

### 11:00 ICT - Pay gate loop
- Check preflight state Team 2.
- Nếu đủ điều kiện thì chạy full rerun + Team 1 review checker.
- Nếu chưa đủ thì publish unmet signals và owner ask list.

### 14:00 ICT - Remaining teams closure loop
- Re-evaluate NO-GO packets (developer/cios/cdn/flows).
- Re-evaluate Team C closure and Team B evidence refs.
- Re-evaluate Team 5 synchronized-live readiness.

### 17:00 ICT - Cross-team report publish
- Update Team 1 daily.
- Update TEAM_NOVA_OPS board.
- Publish blocker table với owner + next artifact expected.

### 21:00 ICT - Optional rerun window
- Chỉ mở nếu có delta thật (key/secret/runtime deploy/owner sign-off mới).

## 3) Mandatory command pack per loop

```bash
pnpm report:lane -- --date=<DATE>
pnpm report:control-tower -- --date=<DATE>
pnpm report:nogo-packets -- --date=<DATE>
pnpm report:team5-live-sync-loop -- --date=<DATE>
node scripts/team1-pay-full-rerun-review-check.mjs --date=<DATE>
```

Pay preflight (khi có env):

```bash
node scripts/team2-pay-prod-rerun-bundle.mjs --date=<DATE> --preflight-only
```

## 4) Today execution status (2026-04-28 round)

- Lane snapshot: PASS.
- Control tower: READY/PASS.
- Team 1 language: PASS.
- NO-GO packets: FAIL, nhưng TODO debt đã giảm về 0; còn owner/final-status blockers.
- Pay gate: FAIL (`LOCK_RETAINED_WITH_REASON`, missing runtime/shared artifacts and auth key chain).
- Team 5 live sync: `NOT_READY_FOR_SYNCHRONIZED_LIVE` (blocked by NO-GO owner sign-off + pay gate).

### Round delta update (14:00 ICT loop)

- Escalation packet đã publish: `docs/reports/team1/TEAM_NOVA_OPS_ESCALATION_PACKET_2026-04-28.md` (4 owner: Pay+Email, Team A, Team B, Team C).
- Pay loop tiếp tục `BLOCKED_PRECHECK` do `auth_key_present=FAIL`; review tiếp tục `REVIEW_BLOCKED_PRECHECK`.
- NO-GO packets: 4/4 vẫn FAIL ở `owner sign-off` + `final status` (TODO=0, refs INFERRED PASS).
- Team C closure: 4 unmet checks không đổi.
- Team 5 readiness: vẫn `NOT_READY_FOR_SYNCHRONIZED_LIVE`.
- TNO standby chờ owner evidence; chỉ rerun khi có delta thật theo cadence cố định.

### Round delta update (latest rerun)

- Pay preflight rerun với tenant/site canonical vẫn `BLOCKED_PRECHECK`:
  - `tenant_code_explicit=PASS`
  - `site_code_explicit=PASS`
  - `auth_key_present=FAIL`
- Team 1 pay full rerun review vẫn `REVIEW_BLOCKED_MISSING_ARTIFACTS`.
- Team C CIOS closure rerun vẫn FAIL ở 4 unmet checks (`ciosWorkspacePresent`, `workspaceEvidenceGuardPass`, `upstreamVitestPass`, `strictSmokePass`).
- Team 5 live-sync readiness rerun giữ nguyên `NOT_READY_FOR_SYNCHRONIZED_LIVE`.

## 5) Blocker board (live)

| Blocker | Owner lane | Current state | Next expected artifact |
|---|---|---|---|
| Canonical pay auth key missing | Founder/Pay+Email | OPEN | Team2 preflight `auth_key_present=PASS` |
| Team2 runtime/shared probe artifacts missing (2026-04-28) | Team 2 / Pay+Email | OPEN | `TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.*` + shared probe |
| NO-GO owner sign-off (4 domains) | Team A/B/C owners + founder | OPEN | owner sign-off + final status non-blocked in all 4 packets |
| Team C closure (workspace/smoke) | Team C owner | OPEN | `TEAMC_CIOS_REVIEW_CLOSURE_STATUS_<date>` with `Review closure ready: PASS` |
| Team B CDN/Flows prod refs | Team B owner | OPEN | updated evidence refs in CDN/Flows packets |
| Team 5 release proof closure | Team 5 owner + founder DEC-TEAM5-002 | OPEN | deploy proof + owner proof + 4/4 release evidence |

## 6) Reporting contract to founder

Mỗi vòng báo cáo phải có đúng 3 phần:

1. `Đã làm` (commands + files generated),
2. `Còn block` (owner + lý do),
3. `Bước kế tiếp ngay` (không quá 5 dòng, có artifact path).

## 7) Close condition for TEAM_NOVA_OPS loop

TNO loop chỉ dừng khi đồng thời đạt:

1. Pay gate đủ điều kiện Team 1 review flip;
2. NO-GO 4 domains chuyển PASS;
3. Team 5 synchronized-live readiness đạt READY;
4. Daily/control-tower không còn blocker mở ở release-critical lanes.
