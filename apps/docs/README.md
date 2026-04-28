# docs.iai.one

Minimal architecture and boundary shell for `docs.iai.one`.

## Purpose

This app is the documentation and standards surface only.

It must:
- hold architecture, standards, and boundary truth
- route builders toward developer and runtime references
- keep terminology aligned with the locked codex
- provide evidence-first documentation handoff

It must not:
- become a second product surface
- become a portal clone
- fake runtime state as if it were control plane
- drift into commercial landing copy

## Routes

- `/` -> docs shell
- `/health` -> local scaffold health

## Environment

- `DOCS_PORT`
- `DOCS_HOST`
- `DOCS_ROOT_URL`
- `DOCS_HOME_URL`
- `DOCS_APP_URL`
- `DOCS_FLOW_URL`
- `DOCS_DEVELOPER_URL`
- `DOCS_DASH_URL`

## Verification

- `pnpm build:docs`
- `pnpm typecheck:docs`
- `pnpm test:docs`
