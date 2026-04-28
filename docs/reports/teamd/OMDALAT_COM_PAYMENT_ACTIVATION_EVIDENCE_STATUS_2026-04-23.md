# OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_2026-04-23
- Generated at: 2026-04-23T06:06:15.659Z
- Timezone: Asia/Ho_Chi_Minh
- Evidence source: `docs/reports/teamd/OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_2026-04-23.json`
- Gate source: `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-23.md`
- Pay gate state: `LOCK_RETAINED_WITH_REASON`
- Evidence status: `EXTERNAL_STEPS_PENDING`
- Activation evidence complete: FAIL
- Live claim blocked: PASS
- Overall checker pass: PASS

## Checks
- PASS `evidence_json_object` — Evidence is a JSON object.
- PASS `domain_locked_to_omdalat` — Evidence domain must be omdalat.com.
- PASS `intake_row_locked` — Evidence must refer to SITE-INTAKE-104.
- PASS `legal_owner_locked_to_thai_lam` — Legal owner must be locked to Công ty TNHH SX - TM - DV Thai Lam.
- PASS `receiver_locked_to_thai_lam_acb` — Receiver assignment must be ACTIVE_NOW with recv_vnd_thailam_acb.
- PASS `required_mailboxes_present` — All required omdalat.com mailbox identities are represented.
- PASS `sender_policy_locked` — Sender policy must use pay@, billing@, support@, and forbid noreply as payment sender.
- PASS `runtime_bindings_represented` — All required runtime bindings are represented.
- PASS `payment_proof_fields_represented` — Provider ref, checkout/session ref, messageId, D1/canonical row, and inbox proof fields must be represented.
- PASS `no_ready_for_live_while_gate_locked_or_evidence_missing` — Evidence does not claim live readiness before gate and evidence are complete.

## Completion Breakdown
- mailbox evidence complete: PASS
- runtime evidence complete: FAIL
- payment proof complete: FAIL
- pay gate locked: PASS

