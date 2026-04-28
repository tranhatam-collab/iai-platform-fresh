# TRANHATAM_COM_NON_TEAMD_GAP_AND_RESPONSIBILITY_MATRIX_2026-04-24

- Date: `2026-04-24`
- Scope: `tranhatam.com`
- Exclusion: Team D activation and treasury tasks are intentionally excluded
- Purpose: explain why the remaining gaps still exist, assign the correct non-Team-D owner, and lock what Codex can and cannot complete directly from this repo

## 1. Short answer

`tranhatam.com` still lacks these proofs because the work completed so far is mostly:

- repo-side payment routing
- receiver mapping
- mail template registry
- guarded pay-to-mail handoff route
- payOS channel activation evidence
- team coordination and reporting

That is not the same as a closed live chain.

The missing items are concentrated in four different layers:

1. `pay.iai.one` production runtime and probe truth
2. live callback or webhook or reconciliation evidence
3. live mail delivery evidence
4. `tranhatam.com` domain-specific fulfillment or access runtime evidence

## 1A. Concrete repo-side observations

Two concrete observations from the current central repo matter here:

1. `apps/pay/src/server.ts` currently exposes the guarded internal mail handoff route and the payment routing API, but there is no accepted provider webhook or callback ingress route in that server surface today.
2. `apps/pay` currently returns `message_id` and `provider_reference` from the internal mail handoff route, but the central repo does not yet show a real persistence path in `apps/pay` that writes those values into a canonical payment evidence row.

These two facts mean at least part of the remaining gap is not just “missing proof”.

Part of it is still a repo-side implementation boundary.

## 2. Item-by-item truth

| missing item | why it is still missing | primary non-Team-D owner | Codex repo-side responsibility | can Codex close it alone from this repo? |
|---|---|---|---|---|
| pay.iai.one checkout/session proof thật | payOS merchant activation exists, but the canonical `pay.iai.one` production probe has not yet produced accepted non-null checkout/session proof under the gated runtime path | Team 2 + Team 1 | keep probe contract, report tooling, and pay runtime contract aligned; fix repo-side issues if the probe path is wrong in code | no |
| signed webhook/callback proof | current accepted state still lacks a live provider-signed callback or webhook packet mapped into the canonical payment evidence chain, and `apps/pay` does not currently expose an accepted provider callback ingress surface in the server route map | Team B Pay Runtime + Team 2 + Team 1 | complete repo-side callback or evidence surfaces if missing, and make the persistence or evidence path testable | partially |
| email `messageId` and inbox proof | repo now has the outbound adapter and guarded internal send route, but no accepted live send has been closed with the same `message_id`, DB/log evidence, and inbox proof; also the central repo does not yet show a real `apps/pay` persistence path for the returned `message_id` | Team Email SMTP + Team B + Team 1 | maintain the mail handoff contract, returned `message_id` handling, and repo-side tests or docs | partially |
| payment creates book entitlement live | no accepted live chain currently proves payment success creates `tranhatam.com` book entitlement or book-access grant | `tranhatam.com` product/runtime owner + Team B if pay callback is upstream | define or wire the upstream payment completion contract only if that logic lives in this repo; otherwise document the dependency honestly | no |
| production-domain reader/access/storage proof | this central repo does not contain accepted production evidence for the `tranhatam.com` reader, access control, or storage surfaces | `tranhatam.com` domain/runtime owner | record upstream dependency and avoid fake completion claims in central docs | no |
| practice/assessment/unlock runtime proof | same problem: there is no accepted production packet proving practice, assessment, or unlock runtime behavior for `tranhatam.com` | `tranhatam.com` domain/runtime owner | document exact upstream dependency and only wire pay-side callback expectations if applicable | no |
| watermark/audit event proof | there is no accepted production evidence tying a live `tranhatam.com` payment to watermark creation or audit event creation | `tranhatam.com` runtime owner + Team B if payment emits upstream audit signal | add or tighten repo-side audit contract only if pay is supposed to emit it; otherwise leave it upstream | partially |
| NFT/VC proof binding | NFT and VC lanes exist elsewhere in the ecosystem, but there is no accepted `tranhatam.com` binding packet proving this domain depends on them in live mode | NFT or VC lane owner + Team 1 | keep this blocked unless a concrete binding spec exists | no |
| founder beta/release approval | founder sign-off is a governance artifact, not a code artifact | Founder + Team 1 | prepare the evidence packet boundary correctly and stop overclaims | no |

## 3. What is actually my responsibility now

Inside this repo, my direct responsibility is limited to the non-Team-D repo-side layer:

1. keep `pay.iai.one` runtime contracts honest
2. close missing repo-side contract gaps that block live evidence
3. keep tests and evidence tooling aligned with the true boundary
4. stop any overclaim in docs or board state

That means I own the following classes of work here:

- pay runtime request and response contracts
- guarded internal mail handoff contract
- repo-side callback or reconciliation evidence contract if it belongs to `apps/pay`
- persistence or canonical evidence contract if it belongs to `apps/pay`
- tests, validators, and report notes for the above

## 4. What is not honestly closable by me alone

I cannot honestly self-close these from this repo alone:

- live checkout/session proof on production
- signed provider webhook proof
- inbox proof
- `tranhatam.com` reader/access/storage live proof
- practice/assessment/unlock live proof
- founder beta/release approval

These require either:

- production secrets
- live domain deployment
- live inbox evidence
- a separate domain repo/runtime
- founder sign-off

## 5. Current evidence basis

This matrix is based on the accepted state reflected in:

- `docs/reports/team1/TEAM_ADMIN_POST_TEAMD_REPORT_ACTIONS_2026-04-23.md`
- `docs/reports/teamd/TRANHATAM_COM_P0_PAYMENT_ACTIVATION_PACKET_2026-04-23.md`
- `docs/reports/team2/TEAM2_TRANHATAM_PAYOS_CHANNEL_ACTIVATION_2026-04-24.md`
- `docs/PROJECT_EXECUTION_BOARD.md`
- `apps/pay/src/server.ts`
- `apps/pay/src/payment-email-outbound-adapter.ts`
- `tests/integration/pay-surface.test.mjs`

## 6. Immediate non-Team-D execution order

The correct order now is:

1. Team 2 proves canonical checkout/session path on production
2. Team B proves real payment event or callback path and canonical persistence
3. Team Email SMTP proves accepted send with `message_id` plus DB/log plus inbox
4. `tranhatam.com` domain/runtime owner proves entitlement or reader or unlock behavior
5. Team 1 issues the next gate verdict
6. founder approval happens only after the evidence packet is complete

## 7. Codex next batch

The next repo-side batch I can take without depending on Team D is:

1. inspect whether `apps/pay` is still missing a real callback or webhook evidence surface
2. inspect whether canonical persistence for provider ref plus `message_id` is still only documented and not yet wired
3. tighten tests or reports so missing upstream evidence cannot be misread as repo completion

Until those three checks are done, the honest status is:

`payment routing and mail handoff scaffolding exist, but the live proof chain is still incomplete outside Team D as well.`
