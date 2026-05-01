# TEAM1_PAY_GATE_REMAINING_WORK_PLAN_2026-05-01
- Owner lane: Team 1 / cross-team coordination
- Check date: 2026-05-01
- Scope: pay production gate only

## Locked truth
- Key/auth lane was treated as technically cleared by manual rerun evidence outside the repo worktree.
- If the canonical one-shot probe returns `API_KEY_REQUIRED`, `API_KEY_INVALID`, or `API_KEY_SCOPE_MISMATCH`, key/auth reopens under Team Runtime/Auth for the canonical tenant/site contract.
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

## Current state after the canonical one-shot probe
1. Team Runtime
- Worker deploy and `/health` shared contract are now live on production.
- Schema migrations for the ledger/reconciliation tables have been applied on D1 production.
- Result: the old `/health` blocker is closed.

2. Team Runtime/Auth
- The canonical one-shot probe returned `403 API_KEY_INVALID` for `vetuonglai / vetuonglai-member`.
- Required outcome:
  - the canonical gate key must hash-match the production `service_api_keys` row for `vetuonglai / vetuonglai-member`
  - the one-shot probe must stop returning `API_KEY_INVALID`, `API_KEY_REQUIRED`, or `API_KEY_SCOPE_MISMATCH`
  - `checkout_status_201 = PASS`

3. Team Pay
- This lane is blocked behind Team Runtime/Auth.
- Open Team Pay only after the canonical one-shot probe clears auth and reaches the provider/business path.
- Then Team Pay owns:
  - resolve live PayOS business `214`
  - verify the production rerun after the shorter description cap is deployed
  - `checkout_url` non-null
  - `payment_link_id` non-null
  - `no_214 = PASS`

## Team Runtime/Auth reopening rule
- Canonical one-shot probe must not return `API_KEY_REQUIRED`, `API_KEY_INVALID`, or `API_KEY_SCOPE_MISMATCH`.
- If it does, stop in Team Runtime/Auth before opening Team Pay or Team 2 again.

## Team 2 rerun rule
- Do not touch key/auth again.
- Do not rotate the gate key again.
- Rerun only after Team Runtime/Auth confirms the canonical key binding is live and Team Pay confirms the provider/business path is live if that lane is still needed.

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
- If the canonical one-shot probe returns `401/403` with `API_KEY_REQUIRED`, `API_KEY_INVALID`, or `API_KEY_SCOPE_MISMATCH`, stop in Team Runtime/Auth.
- If `/health` still misses `data.shared_read_model` or `data.shared_upstream_runtime`, stop in Team Runtime.
- Do not reopen key/auth investigations inside this batch.
