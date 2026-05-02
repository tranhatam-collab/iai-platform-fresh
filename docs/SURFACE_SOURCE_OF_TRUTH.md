# SURFACE SOURCE OF TRUTH

- Date: `2026-05-02`
- Authority: `docs/reports/FOUNDER_REPLY_BATCH_2026-05-02.md`
- Status: canonical mapping for which repo + runtime currently powers each `*.iai.one` surface
- Global state: `PRODUCTION_PUBLICATION_HOLD`

This document exists because live surfaces and monorepo lanes drifted apart. It records, per surface, which repo + Cloudflare project is canonical today. Anyone deploying to a surface MUST follow this map.

---

## 1. Web surfaces

| Surface | Live runtime | Canonical repo | Cloudflare project | Monorepo lane status |
|---|---|---|---|---|
| `home.iai.one` | Next.js | `tranhatam-collab/Home.iai.one` | Pages `home-iai-one` | `apps/home` = `experimental, not_live` |
| `iai.one` | Next.js | `tranhatam-collab/Home.iai.one` | Pages `home-iai-one` | `apps/root` = `experimental, not_live` |
| `docs.iai.one` | static / Pages | separate legacy repo (exact GitHub URL pending founder dashboard read; see `docs/reports/team1/artifacts/d8b/DOCS_IAI_ONE_BINDING_CAPTURE_NOTE_2026-05-02.md`) | Pages `docs-iai-one` | `apps/docs` = `experimental, not_live` |
| `developer.iai.one` | TBD | TBD | TBD | `apps/developer` = `unknown` (Team A pending) |
| `app.iai.one` | Next.js (live) | TBD (drift open per D8d) | TBD | `apps/app` = `experimental, not_live` until D8d closes |
| `flow.iai.one` | static (live) | TBD (drift open per D8c) | Pages `flow-iai-one` | `apps/flow` = `experimental, not_live` until D8c closes |
| `dash.iai.one` | static redirect | TBD (drift open per D8c) | Pages `iai-dash` | `apps/dash` = `experimental, not_live` until D8c closes |
| `web.iai.one` | not yet deployed | `iai-platform-fresh` | TBD | `apps/web` = lane lives in monorepo; no live deploy yet |

## 2. Worker / API surfaces

| Surface | Live runtime | Canonical repo | Worker / Pages | Notes |
|---|---|---|---|---|
| `pay.iai.one` | Worker JSON health | `iai-platform-fresh` `pay.iai.one/` Worker lane | Worker `pay-iai-one` | `apps/pay` Node lane is parallel, not live (intentional split per D10/D11c) |
| `api.iai.one` | Worker | `iai-platform-fresh` | Worker `iai-api*` (multi-account collision per D9) | not yet reconciled |
| `api.flow.iai.one` | Worker | `iai-platform-fresh` | Worker `iai-flow-api` | x-robots-tag drift per D11b |
| `mail.iai.one` | mail control plane | `iai-platform-fresh` | various | monitor-only |
| `cdn.iai.one` | CDN edge | TBD | TBD | Team B-CDN pending agent |
| `flows.iai.one` | automation | TBD | TBD | Team B-Flows pending agent |
| `cios.iai.one` | internal ops | TBD | TBD | Team C pending agent |

## 3. Trust surfaces

| Surface | Live runtime | Canonical repo | Notes |
|---|---|---|---|
| `trust.iai.one` | Pages | `iai-platform-fresh/trust-iai-one-starter` | only canonical trust source |
| `noos.iai.one` | commerce | `iai-platform-fresh` (Team 3) | monitor-only |
| `nft.iai.one` | NFT pair | `iai-platform-fresh` (Team 2 + Team 4) | monitor-only |

## 4. Dropped declarations

- `invoice.iai.one` — DROPPED 2026-05-02 per D-005 (`docs/reports/pay-email-agent/INVOICE_IAI_ONE_DROP_RESOLUTION_2026-05-02.md`).
- `root.iai.one` — DROPPED 2026-05-02 per D12 path B (`docs/reports/team1/TEAM1_W1A_D12_CLOSEOUT_2026-05-02.md`).

## 5. Re-activation rule

Any surface listed `experimental, not_live` may be reactivated for live deploy only when:

1. A founder decision specifically authorizes the cutover.
2. A migration plan is recorded as a wave-gated execution packet.
3. The corresponding D8x item in `TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md` §7 is updated.

## 6. Authority

This file is the canonical mapping. Any deploy targeting an `*.iai.one` surface must read this file first. If a discrepancy appears, this file is the source of truth until founder amends it.
