# PAY_IAI_ONE_GATE_VERDICT_2026-04-23

- Team: Team 1 Program Root / Gate Authority
- Date: 2026-04-23
- Timezone: Asia/Ho_Chi_Minh
- Domain: `pay.iai.one`
- Verdict: `LOCK_RETAINED_WITH_REASON`
- Release claim: `NOT_FLIPPED`
- Synchronized live: `NOT_OPENED`

## 1. Team 1 decision

Team 1 accepts the Team 2 production probe files for this checkpoint as valid evidence sources:

- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-23.json`
- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-23.md`
- `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-23.json`
- `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-23.md`

The evidence is accepted, but the production gate is not accepted as green.

Team 1 keeps `LOCK_RETAINED_WITH_REASON` because the required production signals are still red:

- `auth_key_present`: `FAIL`
- `checkout_url_non_null`: `FAIL`
- `payment_link_id_non_null`: `FAIL`
- `no_214`: `FAIL`
- `production_gate_green`: `FAIL`
- `shared_read_model_ready_for_shared_only`: `FAIL`
- `shared_upstream_active_read_mode_shared_contract`: `FAIL`
- `shared_upstream_release_gate_ready`: `FAIL`

## 2. Why `401 API_KEY_REQUIRED` remains active

The latest production checkout probe reached the deployed internal checkout contract, but the request did not include the canonical production auth header.

Observed evidence:

- Target: `https://pay.iai.one/internal/checkout-session`
- Key header: `none`
- Key provided: `FAIL`
- HTTP status checkout: `401`
- Checkout code: `API_KEY_REQUIRED`
- Required header: `x-api-key`
- Legacy compatibility note: `x-site-key` is still accepted, but Team 1 treats `x-api-key` as the canonical header for the next rerun.

Conclusion:

- The current blocker is not a reason to flip the release claim.
- The next valid rerun must provide the canonical internal checkout auth key.
- Team 2 must not rerun blindly until the owner/provider or live infrastructure owner confirms the production key/header binding path.

## 3. Shared runtime health contract status

The latest shared runtime probe still shows the production health surface is not exposing the required shared runtime contract.

Required but not green:

- `shared_read_model.rolloutReadyForSharedOnly`
- `shared_upstream_runtime.activeReadMode = shared_contract`
- `shared_upstream_runtime.releaseGate.ready`

Team 1 classifies this as a production deploy/config contract gap until the deployed `/health` response exposes the shared runtime fields and the probe turns green. This cannot be treated as a clean live state by `pay.iai.one`, Team 5, or any synchronized-live lane.

## 4. Exact rerun condition

Team 1 authorizes the next Team 2 rerun only after all items below are confirmed:

1. Canonical production auth header is locked as `x-api-key`.
2. Canonical production key source is bound for the Team 2 probe runner.
3. Production checkout request returns no `401 API_KEY_REQUIRED`.
4. Production checkout response contains non-null `checkout_url`.
5. Production checkout response contains non-null `payment_link_id`.
6. Provider response does not contain `214`.
7. Production `/health` exposes `shared_read_model`.
8. Production `/health` exposes `shared_upstream_runtime`.
9. Shared runtime release gate returns ready.

After these conditions are true, Team 2 must rerun:

- `pnpm report:team2-pay-prod-probe -- --date=2026-04-23`
- `pnpm report:team2-pay-shared-runtime-probe -- --date=2026-04-23`
- `pnpm report:pay-prod-gate -- --date=2026-04-23`
- `pnpm test:pay`
- `pnpm test:dash`

Only after the rerun generates green evidence may Team 1 consider `LOCK_FLIPPED`.

## 5. Dependency log update

- Owner/provider or live infrastructure owner: must confirm production key/header binding and payOS merchant/channel live truth.
- Team 2: waits for canonical env/key confirmation, then reruns the full bundle.
- Team 1: keeps release claim locked until all production signals pass.
- Team 5: remains rerun-ready, but cannot claim synchronized live before Team 1 flips the lock.
- Team D and Team Email SMTP: continue payment email live proof work, but cannot claim live-close while pay production gate remains locked.

## 6. Final state for this checkpoint

`repo/test evidence may improve, but production checkout and shared runtime gate are not green. LOCK_RETAINED_WITH_REASON remains the only valid Team 1 verdict for 2026-04-23.`
