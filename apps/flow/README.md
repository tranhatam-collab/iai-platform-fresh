# flow.iai.one

Minimal living execution shell for `flow.iai.one`.

## Purpose

This app is the public execution surface only.

It must:
- expose workflow and runtime execution role clearly
- route control actions to `dash.iai.one`
- route integration and specs to docs/developer surfaces
- keep execution language aligned with runtime truth

It must not:
- become a docs mirror
- become a second app shell
- become a fake dashboard with static claims
- claim secure execution states without runtime evidence

## Routes

- `/` -> living execution shell
- `/health` -> local scaffold health

## Environment

- `FLOW_PORT`
- `FLOW_HOST`
- `FLOW_ROOT_URL`
- `FLOW_APP_URL`
- `FLOW_DASH_URL`
- `FLOW_DOCS_URL`
- `FLOW_DEVELOPER_URL`
- `FLOW_API_FLOW_URL`

## Verification

- `pnpm build:flow`
- `pnpm typecheck:flow`
- `pnpm test:flow-surface`
