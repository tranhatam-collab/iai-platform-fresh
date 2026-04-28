# developer.iai.one

Minimal builder shell for `developer.iai.one`.

## Purpose

This app is the developer integration surface only.

It must:
- expose quickstart, auth, API, and webhook builder pathways
- hand builders to docs, flow, and control surfaces with clear boundaries
- keep implementation language evidence-first
- stay aligned with locked system roles

It must not:
- become a second docs mirror
- become a runtime control plane
- replace app user journeys
- claim release truth without evidence

## Routes

- `/` -> developer builder shell
- `/health` -> local scaffold health

## Environment

- `DEVELOPER_PORT`
- `DEVELOPER_HOST`
- `DEVELOPER_ROOT_URL`
- `DEVELOPER_HOME_URL`
- `DEVELOPER_DOCS_URL`
- `DEVELOPER_APP_URL`
- `DEVELOPER_FLOW_URL`
- `DEVELOPER_DASH_URL`
- `DEVELOPER_API_URL`
- `DEVELOPER_FLOW_API_URL`

## Verification

- `pnpm --filter @iai/developer build`
- `pnpm --filter @iai/developer typecheck`
- `node --test tests/integration/developer-surface.test.mjs`

## Deploy scaffold (minimal)

- Static export for Pages:
  - `pnpm --filter @iai/developer build:pages`
- Preview deploy:
  - `pnpm --filter @iai/developer deploy:preview`
- Production deploy:
  - `pnpm --filter @iai/developer deploy:prod`

Files added for this scaffold:
- `wrangler.jsonc`
- `scripts/build-static.mjs`
- `functions/health.js`
