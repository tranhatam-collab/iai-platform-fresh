PAY_IAI_ONE_TEAM_D_HANDOFF_TO_TEAM_B_CHECKLIST_2026.md

Version 1.0

Status: Handoff Checklist Lock

Scope

Checklist for when Team D may hand a site from payments activation and treasury ops into Team B technical mapping and runtime readiness work

Owners

Team D / Team B / Finance Ops / Treasury / Control Tower

Priority

Highest

⸻

0. Core statement

Team D should not hand sites to Team B just because a conversation feels complete.

The handoff must be explicit, evidence-backed, and narrow:

* Team D finishes activation intake and review
* Team B receives a clean mapping task
* no one debates later whether the onboarding packet was actually complete

This checklist exists to make that handoff clean.

⸻

1. Use when

Use this checklist before any row is moved to:

* `TEAM_B_MAPPING_PENDING`

⸻

2. Hard rule

Do not hand off to Team B unless:

* the blocker is no longer an ops blocker
* the next real work item is technical mapping, provider-side config, callback mapping, or runtime readiness

If the blocker is still:

* missing owner truth
* missing collection truth
* missing payout truth
* missing evidence of account control
* missing finance ops review
* missing treasury review

then the row must stay in Team D.

⸻

3. Mandatory checklist

```md
# TEAM D -> TEAM B HANDOFF CHECKLIST

- intake_id:
- site_code:
- domain:
- market_type:
- onboarding_form:
- assigned_owner:

## A. Intake truth
- legal owner truth complete: yes / no
- site truth complete: yes / no
- collection truth complete: yes / no
- payout truth complete if applicable: yes / no / not_applicable
- activation routing truth complete: yes / no
- sender package complete: yes / no

## B. Evidence
- account control evidence attached: yes / no
- provider reference or collection rail reference attached: yes / no
- callback and checkout routing references attached: yes / no
- evidence_refs field updated in board: yes / no

## C. Review
- finance ops review complete: yes / no
- treasury review complete if applicable: yes / no / not_applicable
- security review complete if required: yes / no / not_required

## D. Handoff readiness
- remaining blocker is technical only: yes / no
- next action belongs to Team B: yes / no
- row may move to TEAM_B_MAPPING_PENDING: yes / no

## E. Team B request
- requested technical mapping:
- requested provider-side config:
- requested callback mapping:
- requested runtime readiness check:
- special notes:
```

⸻

4. Minimum packet Team B should receive

At minimum, Team B should receive:

* intake ID
* site code
* domain
* selected onboarding form
* market type
* legal owner truth
* collection truth
* payout truth if applicable
* activation routing truth
* sender package
* evidence references
* unresolved technical-only blocker
* exact next action expected from Team B

⸻

5. What Team D must not pass downstream

Do not hand off:

* rows with missing legal owner truth
* rows with missing bank or provider control evidence
* rows with missing finance ops review
* rows with missing treasury review when payouts are enabled
* rows whose blocker is still product policy, commercial model, or risk review

⸻

6. Definition of handoff-ready

A row is handoff-ready only when:

* Team D work is operationally complete for the current scope
* the packet is clean enough that Team B can start technical work immediately
* Team B is not being asked to discover missing business truth on behalf of Team D

⸻

7. Final direction

This checklist exists so Team B receives clean, technical tasks instead of mixed ops, legal, and treasury ambiguity.

That is the correct Team D to Team B handoff standard for pay.iai.one.

⸻
