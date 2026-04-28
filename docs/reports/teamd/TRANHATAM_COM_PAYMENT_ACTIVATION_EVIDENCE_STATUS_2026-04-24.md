# TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_2026-04-24
- Generated at: 2026-04-28T11:43:48.191Z
- Timezone: Asia/Ho_Chi_Minh
- Evidence source: `docs/reports/teamd/TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_2026-04-24.json`
- Gate source: `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-24.md`
- Pay gate state: `LOCK_RETAINED_WITH_REASON`
- Evidence status: `PROOF_CHAIN_COMPLETE_GATE_LOCKED`
- Activation evidence complete: FAIL
- Live claim blocked: PASS
- Overall checker pass: PASS

## Checks
- PASS `evidence_json_object` — Evidence is a JSON object.
- PASS `domain_locked_to_tranhatam` — Domain is locked to tranhatam.com.
- PASS `intake_row_locked` — Intake row is SITE-INTAKE-100.
- PASS `required_mailboxes_present` — All required tranhatam.com mailbox identities are represented.
- PASS `sender_policy_locked` — Sender policy must keep receipts on pay@, billing/refund/failure on billing@, reply-to on support@, and forbid noreply as payment sender.
- PASS `international_gateway_locked` — International gateway lock must keep tranhatam.com dual-rail mapping and id_country currency policy.
- PASS `runtime_bindings_represented` — All required runtime bindings are represented.
- PASS `payment_proof_fields_represented` — All required payment proof fields are represented.
- PASS `no_ready_for_live_while_gate_locked_or_evidence_missing` — Evidence does not claim live readiness before gate and evidence are complete.

## Completion Breakdown
- mailbox evidence complete: FAIL
- runtime evidence complete: FAIL
- payment proof complete: PASS
- pay gate locked: PASS

