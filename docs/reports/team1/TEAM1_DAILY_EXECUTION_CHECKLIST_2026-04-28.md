# TEAM1_DAILY_EXECUTION_CHECKLIST_2026-04-28
- Team: Team 1 Program Root / Control Tower / Gate Authority
- Mode: Continuous until close
- Linked plan: `docs/reports/team1/TEAM1_LONG_HORIZON_CONTINUOUS_DEV_PLAN_2026-04-28.md`
- Timezone: Asia/Ho_Chi_Minh

## 0) Daily rule

1. Moi ngay phai dong it nhat 1 item closure hoac phat sinh artifact moi.
2. Khong claim gate/live/closure neu chua du proof.
3. Moi blocker phai co owner + due time + artifact path.

## 1) Start-of-day (09:00 ICT)

- [ ] Read daily/day-1 report Team 1 + Team 2 + Team 3 + Team 4 + Team 5 + Pay+Email.
- [ ] Check latest verdict file: `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_<date>.md`.
- [ ] Check latest pay bundle status: `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_<date>.md`.
- [ ] Check invoice lane status (`invoice.iai.one`) co blocker moi hay khong.
- [ ] Check bilingual board delta: dash / noos / life.
- [ ] Update today objective list (max 3 priorities).

## 2) Pay gate checkpoint (11:00 ICT)

### 2.1 Preflight gate

- [ ] Confirm env canonical present:
  - [ ] `TEAM2_PAY_GATE_API_KEY` hoac `TEAM2_PAY_GATE_SITE_KEY`
  - [ ] `TEAM2_PAY_GATE_TENANT_CODE`
  - [ ] `TEAM2_PAY_GATE_SITE_CODE`
- [ ] Run preflight:

```bash
node scripts/team2-pay-prod-rerun-bundle.mjs --date=<RERUN_DATE> --preflight-only
```

- [ ] If `BLOCKED_PRECHECK`: stop full rerun, open blocker note ngay.

### 2.2 Full rerun gate (chi khi preflight READY)

- [ ] Run full rerun:

```bash
node scripts/team2-pay-prod-rerun-bundle.mjs --date=<RERUN_DATE>
```

- [ ] Open and verify 4 core artifacts:
  - [ ] `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_<date>.md`
  - [ ] `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_<date>.md`
  - [ ] `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_<date>.md`
  - [ ] `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_<date>.md`

- [ ] Run Team 1 review checker:

```bash
node scripts/team1-pay-full-rerun-review-check.mjs --date=<RERUN_DATE>
```

- [ ] Check 8 required signals:
  - [ ] `auth_key_present`
  - [ ] `checkout_url_non_null`
  - [ ] `payment_link_id_non_null`
  - [ ] `no_214`
  - [ ] `production_gate_green`
  - [ ] `shared_read_model_ready_for_shared_only`
  - [ ] `shared_upstream_active_read_mode_shared_contract`
  - [ ] `shared_upstream_release_gate_ready`

- [ ] Publish verdict in-day:
  - [ ] `LOCK_RETAINED_WITH_REASON`, or
  - [ ] `LOCK_FLIPPED`

## 3) Bilingual rebuild checkpoint (14:00 ICT)

### Dash lane
- [ ] Inline bilingual count status updated.
- [ ] If not zero: open exact key migration batch + owner + ETA.

### Noos lane
- [ ] Exception architecture closure note received or pending status updated.
- [ ] Proof links still valid (`noos-web` tests/metadata packet).

### Life lane
- [ ] Current phase tracked (0/1/2/3).
- [ ] Site-wide audit status updated (`BLOCKED_NO_LIVE` or PASS).
- [ ] If blocked: top 3 blockers with owners refreshed.

## 4) Control-tower sync (17:00 ICT)

- [ ] Run lane report and control-tower report (or verify latest run).
- [ ] Update Team 1 daily with done/in-progress/block/next.
- [ ] Ensure all references use same `RERUN_DATE` where required.
- [ ] Check conflicting narratives across files (if any) and add reconciliation note.
- [ ] Push escalation entry for blockers over SLA.

## 5) Optional fast rerun window (21:00 ICT)

- [ ] Re-open only if owner just delivered canonical key/secret/runtime deploy.
- [ ] Re-run preflight before any full bundle.
- [ ] If no material delta, skip rerun and carry to next day with reason.

## 6) End-of-day publish package

- [ ] Team 1 daily report published.
- [ ] Gate verdict file published/updated.
- [ ] Blocker register updated with owner + due time.
- [ ] Next-day top 3 priorities locked.

## 6A) Execution update (2026-04-28)

- [x] `pnpm report:lane -- --date=2026-04-28` ran, lane snapshot generated (`Overall: PASS`).
- [x] `pnpm report:control-tower -- --date=2026-04-28` ran; control tower generated (`READY/PASS`) with sub-check failures in language/nogo/pay.
- [x] `node scripts/team2-pay-prod-rerun-bundle.mjs --date=2026-04-28 --preflight-only` ran.
- [x] Preflight rerun with canonical tenant/site env ran:
  - `TEAM2_PAY_GATE_TENANT_CODE=vetuonglai`
  - `TEAM2_PAY_GATE_SITE_CODE=vetuonglai-member`
  - `TEAM2_PAY_GATE_PROVIDER=payos`
- [x] Preflight result: `tenant_code_explicit=PASS`, `site_code_explicit=PASS`, `auth_key_present=FAIL`.
- [x] `node scripts/team1-pay-full-rerun-review-check.mjs --date=2026-04-28` ran.
- [x] Review status: `REVIEW_BLOCKED_MISSING_ARTIFACTS` (runtime/shared probe artifacts missing because preflight is still blocked).
- [x] Team 1 language remediation completed by normalizing Vietnamese text in checker scope files.
- [x] `pnpm report:team1-language -- --date=2026-04-28` reran and passed (`Violations=0`).
- [x] `pnpm report:control-tower -- --date=2026-04-28` reran after remediation; remaining red sub-checks: `nogo-packets`, `pay-prod-gate`.
- [x] `pnpm report:team5-live-sync-loop -- --date=2026-04-28` reran; readiness remains `NOT_READY_FOR_SYNCHRONIZED_LIVE`.
- [x] TNO continuous execution rhythm file published: `docs/reports/team1/TEAM_NOVA_OPS_CONTINUOUS_EXECUTION_RHYTHM_2026-04-28.md`.
- [x] Pay preflight rerun with canonical tenant/site repeated: still `BLOCKED_PRECHECK` (`auth_key_present=FAIL`, tenant/site=PASS).
- [x] Team 1 pay full rerun review rerun: `REVIEW_BLOCKED_MISSING_ARTIFACTS`.
- [x] Team C closure rerun: still FAIL (same 4 unmet checks).
- [x] Team 5 readiness rerun: still `NOT_READY_FOR_SYNCHRONIZED_LIVE`.
- [x] TNO escalation packet publish (loop 14:00 ICT): `docs/reports/team1/TEAM_NOVA_OPS_ESCALATION_PACKET_2026-04-28.md`.
- [x] Daily report updated: `docs/reports/team1/DAILY_TEAM1_2026-04-28.md`.

## 7) Escalation template (copy/paste)

```text
ESCALATION - <date time ICT>

Lane: <pay gate / invoice / dash / noos / life / other>
Blocker: <one-line problem>
Impact: <what cannot proceed>
Owner: <team/person>
Due time: <timestamp ICT>
Required artifact: <path>
Current status: <open/in_progress/closed>
```

## 8) Daily scorecard (fill manually)

- Date:
- Pay gate status: `BLOCKED_PRECHECK` | `RERUN_COMPLETED_GATE_FAIL` | `RERUN_GREEN`
- Team 1 verdict: `LOCK_RETAINED_WITH_REASON` | `LOCK_FLIPPED`
- Invoice dependency: `BLOCKED` | `IN_PROGRESS` | `CLEAR`
- Dash lane: `OPEN` | `IN_PROGRESS` | `CLOSED`
- Noos lane: `OPEN` | `IN_PROGRESS` | `CLOSED`
- Life lane: `BLOCKED_NO_LIVE` | `IN_PROGRESS` | `CLOSED`
- Closures completed today:
- New blockers today:
- Top 3 priorities tomorrow:
