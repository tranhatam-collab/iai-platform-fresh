# nft.iai.one

Minimal public trust shell for `nft.iai.one`.

## Purpose

This app is the public NFT trust surface only.

It must:
- expose public verification and disclosure direction
- reinforce trust boundary language for protected assets
- route people toward the right runtime and policy lanes
- keep evidence-first positioning

It must not:
- pretend secure vault lane is live without runtime proof
- bypass passkey or wallet proof requirements
- expose direct protected asset URLs
- drift into a generic product or portal shell

## Routes

- `/` -> public trust shell
- `/health` -> local scaffold health

## Environment

- `NFT_PORT`
- `NFT_HOST`
- `NFT_ROOT_URL`
- `NFT_HOME_URL`
- `NFT_APP_URL`
- `NFT_FLOW_URL`
- `NFT_DEVELOPER_URL`
- `NFT_DASH_URL`

## Verification

- `pnpm build:nft`
- `pnpm typecheck:nft`
- `pnpm test:nft`
