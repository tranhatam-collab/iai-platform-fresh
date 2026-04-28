# TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28
- Nhóm: Team 2 Runtime and Platform Core
- Generated at: 2026-04-28T11:51:49.021Z
- Timezone: Asia/Ho_Chi_Minh
- Target: `https://pay.iai.one/health`

## Kết quả health/runtime shared check
- HTTP status health: `200`
- Health contract shape: `legacy_or_unknown`
- shared_read_model present: `FAIL`
- shared_upstream_runtime present: `FAIL`
- shared_read_model.rolloutReadyForSharedOnly: `FAIL`
- shared_upstream_runtime.activeReadMode = shared_contract: `FAIL`
- shared_upstream_runtime.releaseGate.ready: `FAIL`
- shared_upstream_runtime.releaseGate.reasons: `none`

## Tín hiệu máy đọc
- `health_endpoint_ok`: `PASS`
- `health_contract_exposes_shared_read_model`: `FAIL`
- `health_contract_exposes_shared_upstream_runtime`: `FAIL`
- `shared_read_model_ready_for_shared_only`: `FAIL`
- `shared_upstream_active_read_mode_shared_contract`: `FAIL`
- `shared_upstream_release_gate_ready`: `FAIL`

## Unmet signals
- health_contract_exposes_shared_read_model
- health_contract_exposes_shared_upstream_runtime
- shared_read_model_ready_for_shared_only
- shared_upstream_active_read_mode_shared_contract
- shared_upstream_release_gate_ready

## Nguồn JSON
- docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.json

