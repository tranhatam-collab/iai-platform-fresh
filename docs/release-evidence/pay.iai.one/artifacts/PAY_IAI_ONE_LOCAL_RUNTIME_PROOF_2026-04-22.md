# Pay Local Runtime Proof 2026-04-22

- Generated at: `2026-04-22T06:01:49.843Z`
- Timezone: `Asia/Ho_Chi_Minh`
- Pay base URL: `http://127.0.0.1:57834`
- Upstream mock base URL: `http://127.0.0.1:57833`

## Summary
- `apps/pay` runs locally in `shared_only` mode with fresh upstream shared data.
- `/health` exposes `shared_read_model` and `shared_upstream_runtime`.
- checkout and ops detail routes render successfully against shared runtime data.

| Route | Status | Content-Language | Key fields | Marker |
|---|---:|---|---|---|
| `/health` | `200` | `en` | `service=iai-pay; shared_read_model.source=upstream_runtime; rolloutReadyForSharedOnly=true; activeReadMode=shared_contract; releaseGateReady=true` | `-` |
| `/checkout/ps_pay_local_shared_001` | `200` | `en` | `view=default-view` | `Confirmed checkout shell \| IAI Pay — Payment and Settlement Layer                                     {"@context":"https://schema.org","@type":"FinancialProduct","description":"Pay` |
| `/ops/reconciliation/recon%3Apay_local_shared_001` | `200` | `en` | `view=default-view` | `Reconciliation detail \| IAI Pay — Payment and Settlement Layer                                     {"@context":"https://schema.org","@type":"FinancialProduct","description":"Paymen` |
| `/ops/reconciliation/recon%3Apay_local_shared_001` | `200` | `en` | `view=support-view` | `Reconciliation detail \| IAI Pay — Payment and Settlement Layer                                     {"@context":"https://schema.org","@type":"FinancialProduct","description":"Paymen` |

