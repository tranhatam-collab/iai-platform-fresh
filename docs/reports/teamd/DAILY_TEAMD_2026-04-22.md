# TEAM D DAILY OPS 2026-04-22

- Team: Team D Payments Activation + Treasury Ops
- Date: 2026-04-22
- Source of truth:
  - PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md
  - PAY_IAI_ONE_TEAM_D_PAYMENTS_ACTIVATION_AND_TREASURY_OPS_EXECUTION_PLAN_2026.md
- pay lane gate state:
  - LOCK_RETAINED

## DONE:
- row(s) updated:
  - `SITE-INTAKE-100` through `SITE-INTAKE-116` were refreshed to reflect the current repo-backed packet truth.
  - `SITE-INTAKE-101`, `SITE-INTAKE-102`, `SITE-INTAKE-103`, `SITE-INTAKE-104`, `SITE-INTAKE-105`, `SITE-INTAKE-108`, `SITE-INTAKE-109`, `SITE-INTAKE-110`, and `SITE-INTAKE-111` now move honestly to `FORM_IN_PROGRESS`.
- evidence added:
  - per-site Team D payment email packet research is now locked in `docs/PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md`
  - runtime packet truth is exposed through `apps/pay/src/team-d-payment-email-profiles.ts`
  - updated Team D board validator artifacts were regenerated for `2026-04-22`
- review completed:
  - pay runtime typecheck passed
  - pay runtime integration tests passed
  - Team D board integration tests passed
  - Team D board validator passed

## IN PROGRESS:
- active intake rows:
  - `tranhatam.com`
  - `nguyenlananh.com`
  - `omdala.com`
  - `app.omdala.com`
  - `omdalat.com`
  - `app.omdalat.com`
  - `vc.vetuonglai.com`
  - `invest.vetuonglai.com`
  - `life.vetuonglai.com`
  - `aiaccountingloop.com`
- active owner verification:
  - legal owner truth remains open for the current `P0/P1` wave except `tranhatam.com`
- active finance ops review:
  - `invest.vetuonglai.com` needs product + finance + risk alignment before technical mapping
- active treasury review:
  - `aiaccountingloop.com` still needs collection-only vs collection+payout truth
- active Team B handoff prep:
  - `tranhatam.com` remains prep-only until mailbox, inbound routing, mail runtime, checkout proof, and inbox evidence are complete
  - all other deferred-assignment rows remain prep-only until founder instruction plus business truth are present

## BLOCK:
- blocked row:
  - `SITE-INTAKE-100` / `tranhatam.com`
- blocker:
  - mail hostname blocker is closed, but mailbox binding truth, inbound routing truth, outbound adapter integration, and payment-email evidence are still missing
- blocker owner:
  - Team D + Team Email + Team SMTP + Team B
- next unblock action:
  - bind mailbox or alias truth, finish outbound adapter path, wire live surface to `/api/payment-routing`, then capture provider ref + SMTP `messageId` + D1 row + inbox proof

## NEXT:
1. Close external mail-lane truth for `tranhatam.com`: mailbox or alias binding, inbound routing, SMTP or `MAIL_API`, and first evidence-backed send.
2. Finish business-truth packet locking for the current `P0/P1` deferred sites that are already `FORM_IN_PROGRESS`.
3. Keep all deferred-assignment rows out of `TEAM_B_MAPPING_PENDING` until the blocker is truly technical only.

## DAILY ROW DELTA

| intake_id | domain | current_status | blocker | next_action | next_action_owner | evidence_refs | target_staging_date | target_live_date |
|---|---|---|---|---|---|---|---|---|
| `SITE-INTAKE-100` | `tranhatam.com` | `FORM_IN_PROGRESS` | `mailbox/inbound/send-live evidence missing` | `bind mailboxes + outbound adapter + live surface + proof` | `Team D + Team Email + Team SMTP + Team B` | `mail checklist + routing + template registry + research doc` | `TBD` | `TBD` |
| `SITE-INTAKE-101` | `nguyenlananh.com` | `FORM_IN_PROGRESS` | `legal owner + collection rail + callback truth missing` | `lock legal owner, merchant mapping, callback URLs, mailbox ownership` | `Team D + Product + Team B` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-102` | `omdala.com` | `FORM_IN_PROGRESS` | `collection model + legal owner + callback truth missing` | `confirm one-time VN scope and sender/callback packet` | `Team D + Product + Team B` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-103` | `app.omdala.com` | `FORM_IN_PROGRESS` | `app collection role + legal owner truth missing` | `confirm whether app is direct collection surface` | `Team D + Product + Team B` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-104` | `omdalat.com` | `FORM_IN_PROGRESS` | `owner truth + collection model + callback truth missing` | `lock owner, mailbox ownership, one-time catalog scope, callback URLs` | `Team D + Product + Team B` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-105` | `app.omdalat.com` | `FORM_IN_PROGRESS` | `app checkout role + mailbox/callback truth missing` | `confirm whether app initiates checkout or is post-purchase only` | `Team D + Product + Team B` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-106` | `flow.iai.one` | `FORM_SELECTION_REQUIRED` | `market type + commercial model not locked` | `choose market and rail before onboarding form` | `Team D + Product + Team B` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-107` | `life.iai.one` | `FORM_SELECTION_REQUIRED` | `commercial model + owner + payout need unresolved` | `lock model, owner truth, payout need, market type` | `Team D + Product + Team C` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-108` | `vc.vetuonglai.com` | `FORM_IN_PROGRESS` | `exact paid product + owner + callback endpoint missing` | `confirm paid product, owner, mailbox ownership, callback endpoint` | `Team D + Product + Team B` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-109` | `invest.vetuonglai.com` | `FORM_IN_PROGRESS` | `commercial offer + legal owner + risk review missing` | `run product + finance + risk alignment` | `Team D + Team C + Product` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-110` | `life.vetuonglai.com` | `FORM_IN_PROGRESS` | `collection role + owner truth unresolved` | `confirm direct collection vs support-only surface` | `Team D + Product + Team B` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-111` | `aiaccountingloop.com` | `FORM_IN_PROGRESS` | `legal owner + collection/payout truth + callback evidence missing` | `run international onboarding intake and treasury truth lock` | `Team D + Product + Treasury` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-112` | `tramsaigon.com` | `NEW_INTAKE` | `paid offers + owner truth + payment model not finalized` | `open full intake row and lock paid offers first` | `Team D + Product` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-113` | `app.iai.one` | `FORM_SELECTION_REQUIRED` | `commercial role and collection need not explicit` | `confirm whether app.iai.one collects directly` | `Team D + Product + Team B` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-114` | `noos.iai.one` | `FORM_SELECTION_REQUIRED` | `owner truth + settlement model not locked` | `lock first commercial wave and payment model` | `Team D + Product + Team B` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-115` | `cios.iai.one` | `BLOCKED` | `product review and business scope closed` | `wait for product/policy closure` | `Team C + Product + Team D` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |
| `SITE-INTAKE-116` | `lamviec.muonnoi.org` | `BLOCKED` | `current requirements may exceed one_time VND contract` | `wait for recurring/subscription compatibility decision` | `Team 1 + Team B + Product` | `research doc + Team D profile + pay-surface test` | `TBD` | `TBD` |

## HANDOFF CANDIDATES

| intake_id | domain | team_b_handoff_ready | missing_item_before_handoff | owner |
|---|---|---|---|---|
| `SITE-INTAKE-100` | `tranhatam.com` | `no` | `mailbox truth, inbound routing, outbound send evidence, checkout proof` | `Team D + Team Email + Team SMTP + Team B` |
| `SITE-INTAKE-101` | `nguyenlananh.com` | `no` | `legal owner truth and callback packet` | `Team D + Product + Team B` |
| `SITE-INTAKE-102` | `omdala.com` | `no` | `legal owner truth and collection model` | `Team D + Product + Team B` |
| `SITE-INTAKE-108` | `vc.vetuonglai.com` | `no` | `exact paid product and callback endpoint` | `Team D + Product + Team B` |
| `SITE-INTAKE-111` | `aiaccountingloop.com` | `no` | `legal owner, collection/payout truth, treasury packet` | `Team D + Product + Treasury` |

## RISK NOTE
- new risk:
  - mail hostname closure may be misread as full payment email live readiness, but send-live proof is still absent
- escalated risk:
  - `LOCK_RETAINED` remains the hard stop for any `READY_FOR_LIVE` claim
- no new risk:
  - deferred payment assignment remains intentional and is not a failure state by itself

## TEST PROOF:
- validator command:
  - `node scripts/pay-team-d-intake-board-check.mjs --date=2026-04-22`
- validator result:
  - `PASS`
- pay runtime:
  - `pnpm typecheck:pay` -> `PASS`
  - `pnpm test:pay` -> `PASS (43/43)`
- Team D board integration:
  - `node --test tests/integration/pay-team-d-intake-board.test.mjs` -> `PASS (4/4)`

## COMMIT HASH:
- `WORKTREE_UNCOMMITTED`
