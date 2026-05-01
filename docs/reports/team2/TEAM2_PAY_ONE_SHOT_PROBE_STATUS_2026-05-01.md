# TEAM2_PAY_ONE_SHOT_PROBE_STATUS_2026-05-01
- Owner lane: Team 2 observation / Team 1 coordination
- Probe type: canonical post-deploy one-shot
- Date: 2026-05-01

## Summary
- `/health` passed the shared-runtime contract.
- `/internal/checkout-session` did not reach the provider/business path.
- The request stopped at the canonical auth contract with `403 API_KEY_INVALID`.

## Extracted result
- `health_status = 200`
- `checkout_status = 403`
- `checkout_code = API_KEY_INVALID`
- `checkout_message = The supplied API key is invalid for this tenant/site contract.`
- `checkout_url = null`
- `payment_link_id = null`
- `provider_codes_numeric = []`
- `stop_owner = Team Runtime/Auth`

## Signal matrix
- `health_status_ok = PASS`
- `shared_read_model_present = PASS`
- `shared_upstream_runtime_present = PASS`
- `auth_contract_pass = FAIL`
- `checkout_status_201 = FAIL`
- `checkout_url_non_null = FAIL`
- `payment_link_id_non_null = FAIL`
- `no_214 = PASS`

## Operational meaning
- Team Runtime old `/health` blocker is closed.
- Team Pay is not yet the active blocker owner because the canonical checkout request still fails before provider/business execution.
- Team 2 must remain `prep-only` until Team Runtime/Auth fixes the canonical key binding.

## Required next action
1. Team Runtime/Auth fixes the production key binding for `vetuonglai / vetuonglai-member`.
2. Rerun the same one-shot probe.
3. Only if the one-shot reaches `checkout_status = 201` do we open Team Pay for any remaining `214` or null-link issues.
