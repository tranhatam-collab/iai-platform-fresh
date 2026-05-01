# TEAM1_PAY_GATE_REMAINING_WORK_PLAN_2026-05-01
- Owner lane: Team 1 / cross-team coordination
- Check date: 2026-05-01
- Scope: pay production gate only

## Locked truth
- Key/auth lane is treated as technically cleared by manual rerun evidence outside the repo worktree.
- Repo-side machine artifacts still need a fresh rerun bundle to reflect that cleared auth state.
- Commit `30e661e` already adds the shared-runtime health contract stub in `pay.iai.one/src/lib/health.ts`.
- Commit `83d3f39` adds Team 2 narrative reports, but does not regenerate the machine-readable probe and gate artifacts.

## Repo-side correction closed in this batch
- `scripts/team2-pay-prod-runtime-probe.mjs` now defaults to the canonical gate target:
  - `tenant_code = vetuonglai`
  - `site_code = vetuonglai-member`
  - `callback_url = https://member.vetuonglai.com/api/access/webhooks/pay/iai-one`
- payOS live descriptions are now capped to 9 characters in the Worker lane so the checkout payload no longer exceeds the strictest documented live rail limit.
- Purpose: remove a plausible code-side contributor to provider `214` before the next production rerun.
- Purpose: prevent future drift where narrative reports say canonical target while machine artifacts still probe a legacy target.

## Current blockers that still own the gate
1. Team Pay
- Resolve live PayOS business `214`.
- Required outcome:
  - verify the production rerun after the shorter description cap is deployed
  - `checkout_url` non-null
  - `payment_link_id` non-null
  - `no_214 = PASS`

2. Team Runtime
- Deploy the Worker lane that includes commit `30e661e`.
- Required outcome:
  - `/health` exposes `data.shared_read_model`
  - `/health` exposes `data.shared_upstream_runtime`
  - `shared_read_model_ready_for_shared_only = PASS`
  - `shared_upstream_active_read_mode_shared_contract = PASS`
  - `shared_upstream_release_gate_ready = PASS`

## Team 2 rerun rule
- Do not touch key/auth again.
- Do not rotate the gate key again.
- Rerun only after both upstream owners confirm their fixes are live in production.

## Exact rerun bundle after upstream confirmation
```bash
cd "/Users/tranhatam/Documents/Devnewproject/iai-platform-fresh"
node scripts/team2-pay-prod-runtime-probe.mjs --date=2026-05-01
node scripts/team2-pay-shared-runtime-probe.mjs --date=2026-05-01
pnpm report:pay-prod-gate -- --date=2026-05-01
node scripts/team1-pay-full-rerun-review-check.mjs --date=2026-05-01
```

## Stop rules
- If `checkout_url` or `payment_link_id` is still null, stop in Team Pay.
- If `/health` still misses `data.shared_read_model` or `data.shared_upstream_runtime`, stop in Team Runtime.
- Do not reopen key/auth investigations inside this batch.
