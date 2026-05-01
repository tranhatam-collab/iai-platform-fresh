# iai.one

Minimal constitutional shell for `iai.one`.

## Purpose

This app is the constitutional root only.

It must:
- define the system role of `iai.one`
- hold the public surface map
- reinforce boundaries and trust language
- route people to the right surface without replacing them

It must not:
- become a product landing page
- become a second portal
- hide boundary language behind hype copy
- pretend runtime or commercial capability that belongs elsewhere

## Routes

- `/` -> constitutional root shell
- `/health` -> local scaffold health

## Environment

- `ROOT_PORT`
- `ROOT_HOST`
- `ROOT_PORTAL_URL`
- `ROOT_APP_URL`
- `ROOT_FLOW_URL`
- `ROOT_DOCS_URL`
- `ROOT_DEVELOPER_URL`
- `ROOT_DASH_URL`
- `ROOT_NFT_URL`
- `ROOT_WEB_URL`
- `ROOT_WEB_SURFACE_ENABLED`

`ROOT_WEB_SURFACE_ENABLED` defaults to `false`.
Only set it to `true` after Team 1 accepts DNS/deploy truth for `web.iai.one`.

## Verification

- `pnpm build:root`
- `pnpm typecheck:root`
- `pnpm test:root`
