# IAI Mail Delivery & Automation Layer

Standalone project workspace for the mail platform handoff pack and initial repo skeleton.

## Structure
- `docs/iai-mail-platform/`: production-lock specifications for the dev team
- `docs/noos/`: NOOS Team 1 commerce lock pack for product, pricing, licensing, and buyer library
- `docs/noos-platform/`: NOOS architecture direction and contract pack
- `apps/`: application surfaces (`mail-web`, `mail-api`, `mail-smtp`, `mail-inbound`, `mail-worker`)
- `packages/`: shared domain logic, provider adapters, and utilities
- `infra/`: scripts and infra assets
- `db/`: migrations and data bootstrap
- `tests/`: integration and e2e suites

## Current note
`mail.iai.one` is already being developed elsewhere. This workspace defines the standalone architecture and execution pack that can absorb or integrate that existing work without blocking runtime delivery.

## Default Test Gate
- `pnpm test` is the default CI gate (see `.github/workflows/ci.yml`, Node 22).
- Current default gate includes:
  - `pnpm test:mail-smtp`, `pnpm test:mail-api`, `pnpm test:mail-web`, `pnpm test:mail-worker`
  - `pnpm test:flow`, `pnpm test:dash`, `pnpm test:web`, `pnpm test:docs`, `pnpm test:developer`
  - `pnpm test:root`, `pnpm test:home`, `pnpm test:app`, `pnpm test:nft`, `pnpm test:pay`, `pnpm test:pay-ops`
  - `pnpm test:hardening` (malformed-request and input-limit regression suites for the Node surfaces)
  - `pnpm test:verify-runtime`, `pnpm test:noos-web`, `pnpm test:noos-commerce-contracts`
- Keep lane-specific commands for focused debugging, but do not remove them from the default gate.
- `pnpm test:e2e` builds everything and runs the process-level end-to-end suites in `tests/e2e/`
  (every `*.iai.one` surface is started as a real process and driven over HTTP).

## Private docs pack
`docs/**` is intentionally not tracked on GitHub. Suites that read it (noos commerce fixtures, pay docs
integration, Team D intake board, cios sibling checkout) **skip with a visible reason** when it is absent.
Set `REQUIRE_DOCS_FIXTURES=1` where the pack is present to turn a missing fixture into a failure.
