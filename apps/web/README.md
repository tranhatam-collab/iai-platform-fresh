# web.iai.one

Minimal Team 5 onboarding surface for `web.iai.one`.

## Purpose

This app is a growth/onboarding surface only.

It must:
- route new users clearly
- read shared Team 2 contracts before handoff
- redirect into shared auth
- hand off to shared `app`, `flow`, or `dash` routes

It must not:
- create local auth
- create local billing rails
- redefine IAI mission or brand meaning

## Routes

- `/` -> landing and Team 5 boundary framing
- `/onboarding` -> newcomer route selection
- `/contract-status` -> shared Team 2 contract health snapshot
- `/events` -> in-memory onboarding event probe for local smoke/testing
- `/shared-auth` -> 303 redirect into shared auth
- `/health` -> local health status

## Environment

- `WEB_PORT`
- `WEB_BIND_ADDRESS`
- `WEB_SHARED_FLOW_API_BASE`
- `WEB_SHARED_AUTH_URL`
- `WEB_SHARED_BILLING_URL`
- `WEB_SHARED_APP_URL`
- `WEB_SHARED_FLOW_URL`
- `WEB_SHARED_DASH_URL`
- `WEB_CONTRACT_WORKSPACE_ID`

## Verification

- `pnpm test:web`
- `node scripts/web-dev-stack.mjs`
