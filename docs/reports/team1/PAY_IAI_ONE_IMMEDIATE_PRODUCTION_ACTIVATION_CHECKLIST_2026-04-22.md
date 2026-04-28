# PAY_IAI_ONE_IMMEDIATE_PRODUCTION_ACTIVATION_CHECKLIST_2026-04-22
- Team: Team 1 / Team 2 / production owner
- Date: 2026-04-22
- Purpose: immediate external activation checklist after repo-side readiness is complete
- Scope: production env, deploy, rerun, gate flip

## 1. Hard rule

Repository-side `pay.iai.one` is ready.

This checklist is only for the remaining production actions that cannot be closed by repo edits alone.

## 2. Required production env truth

Owner must confirm and bind the canonical values for:

- `TEAM2_PAY_GATE_API_KEY` or `TEAM2_PAY_GATE_SITE_KEY`
- `TEAM2_PAY_GATE_TENANT_CODE`
- `TEAM2_PAY_GATE_SITE_CODE`

Owner must also confirm live provider truth:

- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`
- canonical `provider_accounts` record

## 3. Required deploy truth

Deploy the current `apps/pay` runtime so production `/health` exposes:

- `data.shared_read_model`
- `data.shared_upstream_runtime`

The deploy is not acceptable if production health still reports:

- `legacy_or_unknown`

## 4. Immediate verification sequence

Run in this order:

1. `pnpm report:team2-pay-prod-probe -- --date=2026-04-22`
2. `node scripts/team2-pay-shared-runtime-probe.mjs --date=2026-04-22`
3. `pnpm report:pay-prod-gate -- --date=2026-04-22`
4. `pnpm test:pay`
5. `pnpm test:dash`

## 5. Minimum pass conditions

The rerun is only considered green when all of these are `PASS`:

- `auth_key_present`
- `checkout_url_non_null`
- `payment_link_id_non_null`
- `no_214`
- `production_gate_green`
- `shared_read_model_ready_for_shared_only`
- `shared_upstream_active_read_mode_shared_contract`
- `shared_upstream_release_gate_ready`

## 6. After rerun

Team 1 must immediately review:

- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.md`
- `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-22.md`
- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md`

Then Team 1 issues exactly one verdict:

- `LOCK_FLIPPED`
or
- `LOCK_RETAINED_WITH_REASON`

## 7. Final note

If the rerun still returns `401 API_KEY_REQUIRED` or production `/health` still lacks shared runtime fields, stop.

That means the remaining blocker is still external production truth, not missing repo implementation.
