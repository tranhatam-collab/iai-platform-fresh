# TRANHATAM_COM_PAY_TEAM_ASK_BROADCAST_ITEM_1_CLOSED_UPDATE_2026-04-26

Version: 1.0

Date: 2026-04-26

Author: AI Owner Pay+Email (Claude) — Agent 1 per `IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26.md`

Scope: Status delta on the `2026-04-25` Team B Pay Runtime broadcast packet for `tranhatam.com`.

Cross-link target (read first): `docs/reports/team1/TRANHATAM_COM_PAY_TEAM_ASK_BROADCAST_PACKET_2026-04-25.md`

⸻

## Why this file is separate from the broadcast packet

Per boundary plan rule 4 ("Cross-team coord doc — chỉ Codex viết"), the broadcast packet under `docs/reports/team1/` is in Codex / Team 1 territory. AI Owner Pay+Email lands the status delta as its own file under `docs/reports/pay-email-agent/` so:

- the broadcast packet stays unmodified by an out-of-scope agent
- the status delta has its own commit history under the agent that authored it
- Codex can fold this update into the broadcast packet at the next Codex pass without merge conflict

⸻

## Item 1 — Outbound webhook (α/α contract): CLOSED

| Sub-step | Status | Closing commit | Note |
| --- | --- | --- | --- |
| Sender implementation per α/α locked payload | CLOSED | `b69292a` | `pay(webhook): ship outbound payment-completion webhook sender to consumer tenants` |
| Auto-dispatch wiring on `/internal/payment-event/callback` terminal success | CLOSED | `6cb0705` | `pay(webhook): auto-dispatch outbound webhook from /internal/payment-event/callback on terminal success` |
| `idCountry` vs `country` type drift on `apps/pay/src/server.ts:517,692` (side-effect from `96e7b2a`) that broke `pnpm test:pay` at compile | CLOSED | `02df6b4` | `pay(routing): enforce ID-country currency policy on resolvePaymentRouting` — added `idCountry?: string \| null` to `PaymentRoutingQuery` |
| Late-signal note on expired checkout shell required by pay-surface integration test | CLOSED | `2326795` | `pay(render): lock late-signal note on expired checkout shell` |

Result: Item 1 surface — sender, dispatcher, type contract, and the lone integration assertion that Item 1 work surfaced — is no longer a blocker for `tranhatam.com` evidence chain.

⸻

## Item 2 — `PAYMENT_WEBHOOK_SECRET`: STILL OPEN

Order rule unchanged from the broadcast packet:

- Team B Pay Runtime generates `PAYMENT_WEBHOOK_SECRET` AFTER Item 1 merged + dry-run xanh.
- Item 1 is now merged on branch `OMCODE/smtp-internal-first-phase1`.
- Dry-run xanh is conditional on the remaining `pnpm test:pay` content gaps being closed (see next section).
- Secret generation can proceed once those pass; no need to re-validate Item 1 itself.

⸻

## Remaining `pnpm test:pay` failures (NOT a re-open of Item 1)

After commits `02df6b4` (idCountry type) and `2326795` (expired-shell note), `pnpm test:pay` build compiles but 9 integration tests still fail. These are content-gap regressions, not Item 1 protocol regressions:

1. `pay exposes centralized receiver registry for assigned and hold receivers`
2. `pay resolves vc.vetuonglai.com to the Thanh Tam Phat VND receiver assignment`
3. `pay enforces USD for non-Vietnam ID on vetuonglai surfaces`
4. `pay exposes machine-readable Team D site activation registry for all intake sites`
5. `pay marks prepared Team D domains as form-in-progress once the packet is locked`
6. `pay renders blocked payment block state for unassigned domains`
7. `pay supports explicit vietnamese rendering`
8. `pay checkout shell exposes hosted checkout structure without false success claims`
9. `pay checkout status shell supports explicit vietnamese awaiting-confirmation guidance`

Tracked as `ask-pay-001` in `docs/PAY_IAI_ONE_TEAM_ASK_REGISTRY_2026.md` (Pay+Email AI Owner self-opened, P1, OPEN). AI Owner will batch atomic commits per failure cluster.

These do NOT block Item 2 secret generation if Team B chooses to gate dry-run only on Item 1 protocol assertions. AI Owner recommends closing them first so dry-run xanh covers full pay-surface.

⸻

## Recommended next moves for Codex / Team 1

- Fold this status block into the next refresh of the broadcast packet (Item 1 column → CLOSED with commit refs above).
- Update any downstream cross-team coord doc that quotes Item 1 as OPEN.
- Decide with Team B whether dry-run xanh requires `ask-pay-001` to clear before secret issuance, or whether secret can issue against the protocol-only subset.

⸻

## Change log

- 2026-04-26 v1.0 — first lock; Item 1 status delta filed by AI Owner Pay+Email per founder directive.
