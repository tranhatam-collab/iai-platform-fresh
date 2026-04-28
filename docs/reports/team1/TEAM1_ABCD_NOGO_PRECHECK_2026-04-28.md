# TEAM1_ABCD_NOGO_PRECHECK_2026-04-28
- Generated at: 2026-04-28T06:39:53.152Z
- Timezone: Asia/Ho_Chi_Minh
- Overall: FAIL

## Packet checks
- Team A / developer.iai.one: FAIL
  - path: docs/release-evidence/developer.iai.one/DEVELOPER_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md
  - file present: PASS
  - TODO count: 0
  - commit ref: PASS (INFERRED_PENDING_OWNER_COMMIT_REF)
  - target environment: PASS (INFERRED_PENDING_OWNER_TARGET_ENV)
  - owner sign-off: FAIL (PENDING)
  - final status: FAIL (BLOCKED_PENDING_OWNER_EVIDENCE)
- Team B / cdn.iai.one: FAIL
  - path: docs/release-evidence/cdn.iai.one/CDN_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md
  - file present: PASS
  - TODO count: 0
  - commit ref: PASS (INFERRED_PENDING_OWNER_COMMIT_REF)
  - target environment: PASS (INFERRED_PENDING_OWNER_TARGET_ENV)
  - owner sign-off: FAIL (PENDING)
  - final status: FAIL (BLOCKED_PENDING_OWNER_EVIDENCE)
- Team B / flows.iai.one: FAIL
  - path: docs/release-evidence/flows.iai.one/FLOWS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md
  - file present: PASS
  - TODO count: 0
  - commit ref: PASS (INFERRED_PENDING_OWNER_COMMIT_REF)
  - target environment: PASS (INFERRED_PENDING_OWNER_TARGET_ENV)
  - owner sign-off: FAIL (PENDING)
  - final status: FAIL (BLOCKED_PENDING_OWNER_EVIDENCE)
- Team C / cios.iai.one: FAIL
  - path: docs/release-evidence/cios.iai.one/CIOS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md
  - file present: PASS
  - TODO count: 0
  - commit ref: PASS (INFERRED_PENDING_OWNER_COMMIT_REF)
  - target environment: PASS (INFERRED_PENDING_OWNER_TARGET_ENV)
  - owner sign-off: FAIL (PENDING)
  - final status: FAIL (BLOCKED_PENDING_OWNER_EVIDENCE)

## Team B evidence refs
- source: docs/reports/team1/TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_2026-04-23.json
- present: PASS
- cdn refs complete: FAIL
- flows refs complete: FAIL
- missing cdn refs: deploy_log_ref, rule_snapshot_ref, cache_header_proof_ref, purge_rollback_note_ref, asset_header_proof_ref
- missing flows refs: route_map_production_ref, runtime_production_ref, screenshot_production_ref

## Team C runtime closure
- source: docs/reports/team1/TEAMC_CIOS_REVIEW_CLOSURE_STATUS_2026-04-28.json
- present: PASS
- reviewClosureReady: FAIL

## Quick rerun
- `node scripts/team1-abcd-nogo-precheck.mjs --date=YYYY-MM-DD`

