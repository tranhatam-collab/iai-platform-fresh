# CONTROL_TOWER_AUTOMATION_STATUS_2026-04-17
- Generated at: 2026-04-17T16:29:31.731Z
- Timezone: Asia/Ho_Chi_Minh
- Release control state: HOLD
- Overall control readiness: FAIL

## Lane Protocol
- Status: PASS
- Mission map: PASS
- Daily reports: PASS
- Ownership unresolved rows: 0

## NFT Phase C Pair Gate
- Status: FAIL
- Verdict: NO-GO
- Team 2 packet status: BLOCKED
- Team 4 packet status: READY_FOR_TEAM1_REVIEW
- Team 2 checklist gaps (MISSING/FAIL): 7/1
- Team 2 raw URL closure: FAIL
- Team 4 ops trace mapping: PASS

## Action Items
- Team 2: move packet status to `READY_FOR_TEAM1_REVIEW` only after full proof chain closure.
- Team 2: close checklist gaps (MISSING=7, FAIL=1).
- Team 2: close raw protected URL exposure check to `PASS`.

## Runbook
- `pnpm report:control-tower`

