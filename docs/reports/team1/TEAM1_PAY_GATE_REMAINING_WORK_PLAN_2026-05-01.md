# TEAM1_PAY_GATE_REMAINING_WORK_PLAN_2026-05-01
- Owner lane: Team 1 / cross-team coordination
- Check date: 2026-05-01
- Scope: pay production gate only

## Locked truth
- Canonical gate key/auth is now closed again for the current batch.
- The canonical one-shot probe no longer fails with `API_KEY_INVALID`, `API_KEY_REQUIRED`, or `API_KEY_SCOPE_MISMATCH`.
- Team Runtime has already closed the `/health` shared-contract lane and the D1 schema lane on production.
- Repo-side machine artifacts still need a fresh rerun bundle after Team Pay clears the provider/business truth.
- Commit `30e661e` adds the shared-runtime health contract stub in `pay.iai.one/src/lib/health.ts`.
- Commit `885fbd1` closes the canonical probe target drift and the 9-character payOS description cap mitigation.

## Repo-side correction closed in this batch
- `scripts/team2-pay-prod-runtime-probe.mjs` now defaults to the canonical gate target:
  - `tenant_code = vetuonglai`
  - `site_code = vetuonglai-member`
  - `callback_url = https://member.vetuonglai.com/api/access/webhooks/pay/iai-one`
- payOS live descriptions are capped to 9 characters in the Worker lane so the checkout payload no longer exceeds the strictest documented live rail limit.
- Purpose: remove a plausible code-side contributor to provider `214` before the next production rerun.
- Purpose: prevent future drift where narrative reports say canonical target while machine artifacts still probe a legacy target.

## Current state after the latest canonical one-shot probe
1. Team Runtime
- Worker deploy and `/health` shared contract are live on production.
- D1 production has the ledger/reconciliation schema required by the live health contract.
- Result: the old `/health` blocker is closed.

2. Team Runtime/Auth
- Canonical auth now passes for the current gate key.
- Keep the reopening rule only as a guardrail if a later one-shot falls back to `401/403` auth errors.

3. Team Pay
- Team Pay is the active blocker owner now.
- The canonical one-shot probe reached the provider/business path and stopped on payOS truth:
  - `checkout_status = 502`
  - `checkout_code = 214`
  - `checkout_message = Cổng thanh toán không tồn tại hoặc đã tạm dừng, vui lòng chọn cổng khác`
  - `checkout_url = null`
  - `payment_link_id = null`
- Working assumption from founder context:
  - the current payOS setup may still be personal-only and not have the business gateway/channel active for the organization yet
  - if that assumption is true, `214` is expected provider truth, not a code defect
- Required outcome:
  - verify merchant is active on the payOS dashboard
  - verify payment channels are enabled
  - verify package/quota is valid
  - verify whether the current merchant account is personal-only vs. business/enterprise-capable
  - verify the configured merchant matches `PAYOS_CLIENT_ID` bound in production
  - rerun until `checkout_status_201 = PASS`
  - `checkout_url` non-null
  - `payment_link_id` non-null
  - `no_214 = PASS`

## Team Runtime/Auth reopening rule
- If a later canonical one-shot probe returns `API_KEY_REQUIRED`, `API_KEY_INVALID`, or `API_KEY_SCOPE_MISMATCH`, auth reopens under Team Runtime/Auth immediately.

## Team 2 rerun rule
- Do not touch key/auth again unless the reopening rule is triggered.
- Do not rotate the gate key again inside this batch.
- Rerun only after Team Pay confirms the provider/business path is live.

## Exact rerun bundle after Team Pay confirmation
```bash
cd "/Users/tranhatam/Documents/Devnewproject/iai-platform-fresh"
node scripts/team2-pay-prod-runtime-probe.mjs --date=2026-05-01
node scripts/team2-pay-shared-runtime-probe.mjs --date=2026-05-01
pnpm report:pay-prod-gate -- --date=2026-05-01
node scripts/team1-pay-full-rerun-review-check.mjs --date=2026-05-01
```

## Stop rules
- If the canonical one-shot probe returns `401/403` with `API_KEY_REQUIRED`, `API_KEY_INVALID`, or `API_KEY_SCOPE_MISMATCH`, stop in Team Runtime/Auth.
- If `checkout_status = 502` with provider/business `214`, stop in Team Pay.
- If `checkout_url` or `payment_link_id` is still null after auth passes, stop in Team Pay.
- If `/health` misses `data.shared_read_model` or `data.shared_upstream_runtime`, stop in Team Runtime.
