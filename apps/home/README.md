# home.iai.one

Minimal portal shell for `home.iai.one`.

## Purpose

This app is the system portal only.

It must:
- route people by intent
- separate surfaces clearly
- help new users enter the right layer
- stay aligned with the constitutional root

It must not:
- become a second root
- become a product clone
- redefine the ecosystem
- fake runtime or trust capability that belongs elsewhere

## Routes

- `/` -> portal shell
- `/health` -> local scaffold health

## Environment

- `HOME_PORT`
- `HOME_HOST`
- `HOME_ROOT_URL`
- `HOME_APP_URL`
- `HOME_FLOW_URL`
- `HOME_DOCS_URL`
- `HOME_DEVELOPER_URL`
- `HOME_DASH_URL`
- `HOME_NFT_URL`
- `HOME_WEB_URL`
- `HOME_WEB_SURFACE_ENABLED`

`HOME_WEB_SURFACE_ENABLED` defaults to `false`.
Only set it to `true` after Team 1 accepts DNS/deploy truth for `web.iai.one`.

## Verification

- `pnpm build:home`
- `pnpm typecheck:home`
- `pnpm test:home`
