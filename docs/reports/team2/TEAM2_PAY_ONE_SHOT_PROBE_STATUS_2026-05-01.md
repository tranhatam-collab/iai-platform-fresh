# TEAM2_PAY_ONE_SHOT_PROBE_STATUS_2026-05-01
- Owner lane: Team 2 observation / Team 1 coordination
- Probe type: canonical post-deploy one-shot
- Date: 2026-05-01

## Summary
- `/health` passed the shared-runtime contract.
- Canonical auth passed for the current gate key.
- `/internal/checkout-session` reached the provider/business path and stopped at payOS truth `214`.

## Extracted result
- `health_status = 200`
- `checkout_status = 502`
- `checkout_code = 214`
- `checkout_message = Cổng thanh toán không tồn tại hoặc đã tạm dừng, vui lòng chọn cổng khác`
- `checkout_url = null`
- `payment_link_id = null`
- `provider_codes_numeric = [214, 5900614422343]`
- `stop_owner = Team Pay`

## Signal matrix
- `health_status_ok = PASS`
- `shared_read_model_present = PASS`
- `shared_upstream_runtime_present = PASS`
- `auth_contract_pass = PASS`
- `checkout_status_201 = FAIL`
- `checkout_url_non_null = FAIL`
- `payment_link_id_non_null = FAIL`
- `no_214 = FAIL`

## Operational meaning
- Team Runtime old `/health` blocker is closed.
- Team Runtime/Auth is closed for the current key binding.
- Team Pay is now the active blocker owner because the canonical checkout request reached provider/business execution and failed with payOS `214`.
- Team 2 must remain `prep-only` until Team Pay clears the provider truth.

## Required next action
1. Team Pay verifies merchant/channel/package truth on the payOS dashboard.
2. Rerun the same one-shot probe.
3. Only if the one-shot reaches `checkout_status = 201` with non-null `checkout_url` and `payment_link_id` do we open the Team 2 rerun bundle.
