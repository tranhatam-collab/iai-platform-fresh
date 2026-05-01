# pay.iai.one

Phase D prep scaffold for `pay.iai.one`.

## Purpose

This app is the payment and settlement preparation surface.

It must:
- keep auth/session/audit/ledger assumptions explicit before payout automation opens
- keep EN-first with VI as first-class locale in the runtime shell
- route operators and builders toward shared core surfaces instead of forking contracts
- keep evidence-first status with clear phase boundaries

It must not:
- claim auto payout release
- bypass shared auth or runtime approval boundaries
- expose fake ledger state as production truth
- drift from the locale and language lock pack

## Routes

- `/` -> payment phase prep shell
- `/health` -> local scaffold health
- `/payment-block?domain=...&country=...&currency=...&amount=...` -> rendered payment receiver block
- `/api/receiver-registry` -> centralized receiver registry snapshot
- `/api/payment-routing?domain=...&country=...&currency=...&amount=...` -> receiver resolution contract
- `/checkout/{payment_session_id}` -> hosted checkout shell
- `/checkout/{payment_session_id}/status` -> awaiting-confirmation shell
- `/checkout/{payment_session_id}/expired` -> expired-session shell
- `/receipt/{payment_or_receipt_id}` -> receipt shell
- `/payment/{payment_session_id}/help` -> support/help shell
- `/ops/review` -> manual-review queue shell
- `/ops/review/{item_id}` -> manual-review detail shell
- `/ops/payments` -> payments monitor shell
- `/ops/payments/{item_id}` -> payment-work-item detail shell
- `/ops/payouts` -> payout queue shell
- `/ops/reconciliation` -> reconciliation queue shell
- `/ops/reconciliation/{item_id}` -> reconciliation-work-item detail shell
- `/ops/audit` -> audit explorer shell

All non-root routes are shell-only in this checkpoint:

- no payout execution claim
- no live ledger truth claim
- no fake balance truth
- no bypass of Team 1 gate or shared runtime contracts

The new receiver routes are repo-side routing surfaces only:

- they resolve founder-approved receiver assignments
- they do not flip production gate authority
- they do not replace Team Email responsibility for domain mail routing
- they keep unassigned domains explicitly blocked instead of guessing a receiver

Shell routes now read through `src/read-model.ts`, with the default server chain wired as `shared_contract/shared_stub -> demo_contract fallback`, so checkout, receipt, help, and ops surfaces share one contract during prep work.

The default demo contract is for IA, copy, and verification only. It is not a substitute for shared session truth, confirmed payment truth, treasury evidence, or reconciliation runtime.

For shared wiring prep, `src/shared-read-model.ts` now defines:

- the shell binding contract consumed by `apps/pay`
- the locked core-truth file schema `iai.pay.shared-read-model.v1`
- the mapping layer from shared session/receipt/ops records into pay shell records
- permission-aware detail filtering for operator detail routes when shared data is present

Shared rollout is meant to start in `shared_fallback_demo` mode and only move to `shared_only` once the shared bindings expose complete route refs, sessions, receipts, ops snapshots, and ops detail coverage.

Checkout and receipt shells also expose explicit read-model state variants for:

- confirmed
- failed
- cancelled
- session_not_found
- receipt_not_found

## Environment

- `PAY_PORT`
- `PAY_HOST`
- `PAY_ROOT_URL`
- `PAY_HOME_URL`
- `PAY_APP_URL`
- `PAY_FLOW_URL`
- `PAY_DOCS_URL`
- `PAY_DASH_URL`
- `PAY_WEB_URL`
- `PAY_WEB_SURFACE_ENABLED`
- `PAY_READ_MODEL_MODE`
- `PAY_SHARED_READ_MODEL_FILE`
- `PAY_SHARED_READ_MODEL_URL`
- `PAY_SHARED_AUTH_SOURCE_FILE`
- `PAY_SHARED_AUTH_SOURCE_URL`
- `PAY_SHARED_SESSION_SOURCE_FILE`
- `PAY_SHARED_SESSION_SOURCE_URL`
- `PAY_SHARED_RECONCILIATION_SOURCE_FILE`
- `PAY_SHARED_RECONCILIATION_SOURCE_URL`
- `PAY_SHARED_REFRESH_TTL_MS`
- `PAY_SHARED_MAX_DATA_AGE_MS`
- `PAY_SHARED_UPSTREAM_HEADER_NAME`
- `PAY_SHARED_UPSTREAM_HEADER_VALUE`

`PAY_READ_MODEL_MODE` supports:

- `shared_fallback_demo` -> use shared bindings first, then fall back to demo contract
- `demo_only` -> bypass shared bindings and use demo contract only
- `shared_only` -> use shared bindings without demo fallback

`PAY_WEB_SURFACE_ENABLED` defaults to `false`.
Keep this disabled until `web.iai.one` has DNS, deploy, and owner proof accepted by Team 1.

`PAY_SHARED_READ_MODEL_FILE` points to a JSON file that follows `iai.pay.shared-read-model.v1`. The adapter in `src/shared-read-model.ts` loads this file, validates the schema version, maps core truth records into pay shell records, and exposes rollout status through `/health`.

If the prebuilt shared read-model file is not present, the server can compose the same shell truth from lane producers:

- `PAY_SHARED_SESSION_SOURCE_FILE` -> JSON file in `iai.pay.session-lane.v1`
- `PAY_SHARED_RECONCILIATION_SOURCE_FILE` -> JSON file in `iai.pay.reconciliation-lane.v1`

When these lane files are present, `src/shared-read-model-producer.ts` assembles them into the locked `iai.pay.shared-read-model.v1` shape before the pay shell consumes them. `/health` reports this as `shared_read_model.source = "lane_sources"`.

`PAY_SHARED_AUTH_SOURCE_FILE` points to a JSON file in `iai.auth.shared-session.v1`. This source is used to resolve operator roles from real auth/session identity when explicit pay-role claims are not already present in the request.

For runtime deploy, local files are no longer the only option. The server can consume upstream shared producers directly:

- `PAY_SHARED_READ_MODEL_URL` -> prebuilt upstream payload in `iai.pay.shared-read-model.v1`
- `PAY_SHARED_SESSION_SOURCE_URL` -> upstream session-lane payload in `iai.pay.session-lane.v1`
- `PAY_SHARED_RECONCILIATION_SOURCE_URL` -> upstream reconciliation-lane payload in `iai.pay.reconciliation-lane.v1`
- `PAY_SHARED_AUTH_SOURCE_URL` -> upstream auth payload in `iai.auth.shared-session.v1`

When runtime URLs are configured, the server refreshes them through `src/shared-upstream-runtime.ts`, exposes `shared_read_model.source = "upstream_runtime"`, and reports freshness / release-gate state through `/health.data.shared_upstream_runtime`.

Optional upstream auth headers for deploy probes or private runtime endpoints:

- `PAY_SHARED_UPSTREAM_HEADER_NAME`
- `PAY_SHARED_UPSTREAM_HEADER_VALUE`

Upstream freshness control:

- `PAY_SHARED_REFRESH_TTL_MS` -> how often pay refreshes upstream shared payloads
- `PAY_SHARED_MAX_DATA_AGE_MS` -> maximum accepted upstream payload age before the shared runtime is marked stale

Operator detail routes no longer rely on the dev-only `viewer_role` query/header shim. Permission-aware filtering now resolves from real request/session context when the shared source is active:

- auth middleware claims header: `x-iai-auth-claims`
- shared session header: `x-iai-shared-session`
- legacy compatible header: `x-iai-session-claims`
- auth/session cookies: `iai_auth_claims`, `iai_shared_session`, `iai_session_claims`
- optional explicit role claims: `x-iai-role-claims` or `iai_role_claims`
- fallback identity fields: `x-subject-id`, `x-workspace-id`, `x-iai-session`, `iai_subject_id`, `iai_workspace`, `iai_session`
- fallback auth lookup: subject/workspace membership from `PAY_SHARED_AUTH_SOURCE_FILE` or `PAY_SHARED_AUTH_SOURCE_URL`

Safe rollout behavior:

- default mode stays `shared_fallback_demo`
- `/health` exposes `shared_read_model.capabilities`, record counts, source, and `rolloutReadyForSharedOnly`
- `/health` also exposes `shared_upstream_runtime.activeReadMode`, per-source freshness, telemetry timestamps, and `releaseGate.ready/reasons` when upstream runtime URLs are configured
- ops queue detail falls back to role-safe detail items when the viewer lacks full access
- `shared_only` fails fast at startup when the resolved shared status is incomplete and `rolloutReadyForSharedOnly=false`
- `shared_only` also returns `503 PAY_SHARED_ONLY_GATE_BLOCKED` when upstream shared payloads are stale, missing freshness markers, or not yet release-gated

## Verification

- `pnpm build:pay`
- `pnpm typecheck:pay`
- `pnpm test:pay`
