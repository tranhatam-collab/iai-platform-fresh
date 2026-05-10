# TEAM_EMAIL_SMTP_WAVE1_EVIDENCE_STATUS_2026-05-09
- Generated at: 2026-05-10T08:22:22.117Z
- Timezone: Asia/Ho_Chi_Minh
- Evidence source: `docs/reports/team1/TEAM_EMAIL_SMTP_WAVE1_EVIDENCE_2026-05-09.json`
- Evidence date: 2026-05-09
- Lane status label: `PARTIAL CLOSEOUT, DEV LANE OPEN, LIVE CLAIM EVIDENCE-LOCKED`
- Gap classification: `REAL_EVIDENCE_MISSING`
- Gap reason: Wave1 required evidence fields/clusters are still incomplete.
- Wave 1 closeout ready: FAIL
- Mailbox/alias truth done: FAIL
- Inbound routing truth done: FAIL
- Gmail proof done: FAIL
- Outlook proof done: FAIL
- Internal inbox proof done: FAIL
- BCC lock OFF: PASS
- Public /v1/send closed: PASS
- Wave 1 rows complete: FAIL
- Overall checker pass: FAIL

## Checks
- PASS `evidence_json_object` — Evidence is a JSON object.
- PASS `scope_locked` — Scope must be team-email-smtp-wave1.
- PASS `required_clusters_represented` — All five required clusters are represented.
- PASS `bcc_off_lock` — System BCC must remain OFF until wave1 proof closes.
- PASS `public_send_closed_lock` — Public /v1/send must remain closed (health-only is allowed).
- PASS `required_wave1_rows_represented` — All required Wave 1 flow rows are represented.
- FAIL `wave1_rows_evidence_complete` — One or more Wave 1 rows still miss action/message_id/DB-log/inbox evidence.
- PASS `no_live_overclaim` — No overclaim detected.

## Wave 1 Flow Rows
- FAIL `support_form_submission` — missing_fields: action_ref, message_id, messages_ref, message_events_ref, delivery_attempts_ref, db_or_log_ref; missing_inbox_targets: none; inbox_proof_refs: 0
- FAIL `contact_form_submission` — missing_fields: action_ref, message_id, messages_ref, message_events_ref, delivery_attempts_ref, db_or_log_ref; missing_inbox_targets: none; inbox_proof_refs: 0
- FAIL `life_contact_briefing_request` — missing_fields: action_ref, message_id, messages_ref, message_events_ref, delivery_attempts_ref, db_or_log_ref; missing_inbox_targets: none; inbox_proof_refs: 0
- FAIL `low_risk_internal_alert` — missing_fields: action_ref, message_id, messages_ref, message_events_ref, delivery_attempts_ref, db_or_log_ref; missing_inbox_targets: none; inbox_proof_refs: 0
- FAIL `low_volume_notification` — missing_fields: action_ref, message_id, messages_ref, message_events_ref, delivery_attempts_ref, db_or_log_ref; missing_inbox_targets: none; inbox_proof_refs: 0

## Runbook
- `pnpm report:team-email-smtp-evidence -- --date=YYYY-MM-DD`

