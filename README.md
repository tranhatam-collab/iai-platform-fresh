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
- `pnpm test` is the default CI gate.
- Current default gate includes:
  - `pnpm test:mail-smtp`
  - `pnpm test:flow`
  - `pnpm test:web`
  - `pnpm test:mail-worker`
  - `pnpm test:noos-commerce-contracts`
- Keep lane-specific commands for focused debugging, but do not remove them from the default gate.
