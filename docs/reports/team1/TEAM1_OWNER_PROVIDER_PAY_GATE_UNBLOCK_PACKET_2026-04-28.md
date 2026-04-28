# TEAM1_OWNER_PROVIDER_PAY_GATE_UNBLOCK_PACKET_2026-04-28
- Team: Team 1 Program Root / Gate Authority
- Date: 2026-04-28
- Timezone: Asia/Ho_Chi_Minh
- Scope: `pay.iai.one` production gate unblock for Team 2 rerun
- Current state: `LOCK_RETAINED_WITH_REASON`

## 1) Why this packet exists

Team 2 artifacts are now present, but production gate is still blocked by runtime/env conditions (not missing files).

Open fail signals from `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-28.json`:

- `auth_key_present`
- `checkout_url_non_null`
- `payment_link_id_non_null`
- `no_214`
- `production_gate_green`
- `shared_read_model_ready_for_shared_only`
- `shared_upstream_active_read_mode_shared_contract`
- `shared_upstream_release_gate_ready`

## 2) Exact env values owner must provide/confirm

### 2.1 Required for internal checkout probe

At least one auth key must be present for probe:

1. Preferred: `TEAM2_PAY_GATE_API_KEY` -> sent as header `x-api-key`
2. Legacy fallback: `TEAM2_PAY_GATE_SITE_KEY` -> sent as header `x-site-key`

Supported aliases in script (same semantic key, lower priority):

- `PAY_IAI_ONE_GATE_API_KEY`
- `TNO_PAY_GATE_API_KEY`
- `PAY_IAI_ONE_GATE_SITE_KEY`
- `TNO_PAY_GATE_SITE_KEY`

Current runtime probe evidence says key is missing:

- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json` -> `auth.keyProvided=false`
- Checkout returned `401` with code `API_KEY_REQUIRED`

### 2.2 Required canonical route identity (lock these values)

Set and keep stable for rerun window:

- `TEAM2_PAY_GATE_TENANT_CODE=vetuonglai`
- `TEAM2_PAY_GATE_SITE_CODE=vetuonglai-member`
- `TEAM2_PAY_GATE_PROVIDER=payos`

Notes:

- Script default values are placeholders and can produce non-canonical reruns.
- Team 1 gate review expects explicit canonical tenant/site/provider for this rerun.

## 3) Exact `/health` contract fields required

Endpoint: `GET https://pay.iai.one/health`

Gate expects these fields to exist under `data`:

- `data.shared_read_model`
- `data.shared_upstream_runtime`

And expects these values:

- `data.shared_read_model.rolloutReadyForSharedOnly = true`
- `data.shared_upstream_runtime.activeReadMode = "shared_contract"`
- `data.shared_upstream_runtime.releaseGate.ready = true`

Optional but recommended:

- `data.shared_upstream_runtime.releaseGate.reasons` as array (empty when ready)

Current evidence shows legacy shape (missing shared fields):

- `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.json` -> `health_contract_shape=legacy_or_unknown`

## 4) Owner response template (fill and return)

```text
Owner ack time (ICT): <YYYY-MM-DD HH:mm>
Owner name: <name>

Auth key contract:
- Canonical header: x-api-key
- TEAM2_PAY_GATE_API_KEY provisioned: YES/NO
- TEAM2_PAY_GATE_SITE_KEY provisioned (legacy fallback): YES/NO

Canonical rerun identity:
- TEAM2_PAY_GATE_TENANT_CODE=vetuonglai : YES/NO
- TEAM2_PAY_GATE_SITE_CODE=vetuonglai-member : YES/NO
- TEAM2_PAY_GATE_PROVIDER=payos : YES/NO

Production /health shared contract:
- data.shared_read_model present: YES/NO
- data.shared_read_model.rolloutReadyForSharedOnly=true: YES/NO
- data.shared_upstream_runtime present: YES/NO
- data.shared_upstream_runtime.activeReadMode=shared_contract: YES/NO
- data.shared_upstream_runtime.releaseGate.ready=true: YES/NO

Evidence refs (required):
- secret_binding_ref: <link or artifact path>
- health_payload_ref: <link or artifact path>
- deploy_or_release_ref: <link or artifact path>
```

## 5) Rerun commands after owner confirms

```bash
node scripts/team2-pay-prod-runtime-probe.mjs --date=2026-04-28
node scripts/team2-pay-shared-runtime-probe.mjs --date=2026-04-28
node scripts/team2-pay-prod-rerun-bundle.mjs --date=2026-04-28
pnpm report:pay-prod-gate
node scripts/team1-pay-full-rerun-review-check.mjs
node scripts/team1-all-teams-completion-status-check.mjs
```

## 6) Exit criteria for flip review

Gate can move to flip review only when all are true:

1. Team 2 runtime probe reports `auth_key_present=PASS` and checkout success payload contains non-null `checkout_url` and `payment_link_id`.
2. Team 2 shared runtime probe reports shared contract fields present with values required above.
3. Team 2 rerun bundle is no longer `BLOCKED_PRECHECK`.
4. Team 1 gate status overall becomes `PASS` with decision `LOCK_FLIPPED`.

## 7) Source artifacts

- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json`
- `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.json`
- `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-28.json`
- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-28.json`
- `docs/reports/team1/TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_2026-04-28.md`
