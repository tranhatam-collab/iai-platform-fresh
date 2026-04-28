PAY_IAI_ONE_TEAM_D_DAILY_OPS_TEMPLATE_2026.md

Version 1.0

Status: Daily Operations Template Lock

Scope

Daily operating template for Team D payments activation and treasury ops across all site-intake rows in pay.iai.one

Owners

Team D / Finance Ops / Treasury / Product / Control Tower

Priority

Highest

⸻

0. Core statement

Team D should not update the activation lane through vague chat summaries.

Team D needs one daily operating template that makes it obvious:

* which rows changed today
* which rows are blocked
* which blocker belongs to whom
* which evidence was added
* which rows are ready for handoff

This file exists to keep daily activation truth structured and operational.

⸻

1. Use together with

* PAY_IAI_ONE_TEAM_D_PAYMENTS_ACTIVATION_AND_TREASURY_OPS_EXECUTION_PLAN_2026.md
* PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md
* PAY_IAI_ONE_TEAM_D_HANDOFF_TO_TEAM_B_CHECKLIST_2026.md

⸻

2. Daily update rule

On a normal daily update, Team D should update only these row-level fields unless a formal decision changes the intake truth:

* `current_status`
* `blocker`
* `next_action`
* `next_action_owner`
* `evidence_refs`
* `target_staging_date`
* `target_live_date`

Do not silently change:

* `market_type`
* `onboarding_form`
* `owner_type`
* `legal_owner`
* `collection_required`
* `payout_required`

Those changes require explicit trace.

⸻

3. Required daily template

```md
# TEAM D DAILY OPS YYYY-MM-DD

- Team: Team D Payments Activation + Treasury Ops
- Date:
- Source of truth:
  - PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md
  - PAY_IAI_ONE_TEAM_D_PAYMENTS_ACTIVATION_AND_TREASURY_OPS_EXECUTION_PLAN_2026.md
- pay lane gate state:
  - LOCK_RETAINED / LOCK_FLIPPED

## DONE:
- row(s) updated:
- evidence added:
- review completed:

## IN PROGRESS:
- active intake rows:
- active owner verification:
- active finance ops review:
- active treasury review:
- active Team B handoff prep:

## BLOCK:
- blocked row:
- blocker:
- blocker owner:
- next unblock action:

## NEXT:
1. first next action
2. second next action
3. third next action

## DAILY ROW DELTA

| intake_id | domain | current_status | blocker | next_action | next_action_owner | evidence_refs | target_staging_date | target_live_date |
|---|---|---|---|---|---|---|---|---|
| `TBD` | `TBD` | `TBD` | `TBD` | `TBD` | `TBD` | `TBD` | `TBD` | `TBD` |

## HANDOFF CANDIDATES

| intake_id | domain | team_b_handoff_ready | missing_item_before_handoff | owner |
|---|---|---|---|---|
| `TBD` | `TBD` | `yes / no` | `TBD` | `TBD` |

## RISK NOTE
- new risk:
- escalated risk:
- no new risk:

## TEST PROOF:
- validator command:
- validator result:

## COMMIT HASH:
- `TBD`
```

⸻

4. Required daily discipline

Every daily update must say explicitly:

* what changed
* what is blocked
* who owns the next move
* whether Team B handoff is actually ready

Do not write:

* almost done
* progressing well
* waiting a bit
* nearly ready

⸻

5. Validator usage

Use the Team D board validator before closing the daily update:

```bash
node scripts/pay-team-d-intake-board-check.mjs --date=YYYY-MM-DD
```

If the validator fails, the daily update must say why.

⸻

6. Final direction

This daily template should make Team D legible to everyone else.

It exists so Control Tower, Team B, Team C, and Team 1 can see exactly where activation stands without reconstructing the state from chat.

That is the correct daily ops template standard for Team D inside pay.iai.one.

⸻
