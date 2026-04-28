# CONTROL_TOWER_AUTOMATION_STATUS_2026-04-20
- Generated at: 2026-04-20T07:49:49.428Z
- Timezone: Asia/Ho_Chi_Minh
- Release control state: READY
- Overall control readiness: PASS
- Release-claim state: LOCK_RETAINED
- Release-claim eligibility: FAIL

## Lane Protocol
- Status: PASS
- Mission map: PASS
- Daily reports (combined): PASS
- Daily reports presence: PASS
- Daily reports format: PASS
- Daily format fail teams: none
- Cross-team reports (combined): PASS
- Cross-team reports presence: PASS
- Cross-team reports format: PASS
- Cross-team report fail teams: none
- Ownership unresolved rows: 0

## Language Compliance
- Status: PASS
- Team 1 scope language: PASS
- Multilingual readiness: PASS
- Violations: 0

## NFT Phase C Pair Gate
- Status: PASS
- Verdict: GO
- Team 2 packet status: READY_FOR_TEAM1_REVIEW
- Team 4 packet status: READY_FOR_TEAM1_REVIEW
- Team 2 checklist gaps (MISSING/FAIL): 0/0
- Team 2 raw URL closure: PASS
- Team 4 ops trace mapping: PASS

## NO-GO Packet Tracker
- Snapshot available: PASS
- Status: PASS
- TODO cleared across packets: PASS
- Pending owner sign-off domains: none
- Blocking domains: none

## Pay Production Gate
- Snapshot available: PASS
- Status: FAIL
- Unmet signals: checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green

## Action Items
- Pay production gate chưa đạt: checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green.

## Runbook
- `pnpm report:control-tower`

