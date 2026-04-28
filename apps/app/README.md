# app.iai.one

Minimal user product shell for `app.iai.one`.

## Purpose

This app is the user product surface only.

It must:
- hold community-facing journeys
- hold lessons and user-facing onboarding
- route verification into the trust layer when needed
- keep user operations separate from deeper control surfaces

It must not:
- become the system root
- become a docs mirror
- become deep enterprise admin
- fake runtime/control capability that belongs elsewhere

## Routes

- `/` -> user product shell
- `/health` -> local scaffold health

## Environment

- `APP_PORT`
- `APP_HOST`
- `APP_ROOT_URL`
- `APP_HOME_URL`
- `APP_FLOW_URL`
- `APP_DOCS_URL`
- `APP_DEVELOPER_URL`
- `APP_DASH_URL`
- `APP_NFT_URL`

## Verification

- `pnpm build:app`
- `pnpm typecheck:app`
- `pnpm test:app`
