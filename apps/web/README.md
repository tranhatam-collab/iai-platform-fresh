# web.iai.one

Minimal Team 5 onboarding surface for `web.iai.one` while public release remains on hold.

## Purpose

This app is a planned growth/onboarding surface only.

It must:
- route new users clearly
- read shared Team 2 contracts before handoff
- redirect into shared auth
- hand off to shared `app`, `flow`, or `dash` routes
- stay under release hold until DNS, deploy, and owner proof are accepted

It must not:
- create local auth
- create local billing rails
- redefine IAI mission or brand meaning
- claim `web.iai.one` is public-live before Team 1 and founder flip publication hold

## Routes

- `/` -> landing and Team 5 boundary framing
- `/onboarding` -> newcomer route selection
- `/feedback` -> bilingual feedback form; `POST` records `web_feedback_submitted` and shows the "Feedback submitted" confirmation
- `/build` -> AI website builder (flag-gated by `WEB_AI_BUILDER_ENABLED`); `POST` calls `aiagent.iai.one` to draft a site
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
- `WEB_AI_BUILDER_ENABLED` (default `false`; gate for `/build`)
- `WEB_AIAGENT_API_BASE` (default `https://api.aiagent.iai.one`)
- `WEB_AIAGENT_MODE` (`free-demo` | `byok`; default `free-demo`)
- `WEB_AIAGENT_API_KEY` (only used when `WEB_AIAGENT_MODE=byok`; never commit a real key)

## Verification

- `pnpm test:web`
- `node scripts/web-dev-stack.mjs`

## Release state

`web.iai.one` remains under `PRODUCTION_PUBLICATION_HOLD` until Wave 5.
Repo-side work may continue, but public-live claims must wait for DNS proof, deploy proof, and owner sign-off.
