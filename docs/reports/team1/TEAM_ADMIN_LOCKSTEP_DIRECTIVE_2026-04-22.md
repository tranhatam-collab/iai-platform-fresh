# TEAM_ADMIN_LOCKSTEP_DIRECTIVE_2026-04-22
- Team: Team 1 Program Root / Gate Authority
- Date: 2026-04-22
- Source: Team B escalation and cross-team lockstep directive
- Intent: freeze scope, force correct authority order, avoid false live claims

## 1) Critical path (must follow in order)

1. Team 1 closes canonical owner/provider truth for `pay.iai.one`.
2. Team 2 reruns exact production activation bundle only after step 1.
3. Team 1 issues exactly one gate verdict:
   - `LOCK_FLIPPED`
   - or `LOCK_RETAINED_WITH_REASON`
4. Team 5 reruns readiness/final packet only after `LOCK_FLIPPED`.

## 2) Team-by-team directive

### Team 1 (Program Root / pay gate authority)
- Must close:
  - owner/provider ack
  - canonical key/header
  - merchant/channel live truth
  - secret binding
  - `provider_accounts` truth
- Must issue one final verdict after Team 2 rerun:
  - `LOCK_FLIPPED`
  - or `LOCK_RETAINED_WITH_REASON`
- Reference:
  - `docs/reports/team1/PAY_IAI_ONE_IMMEDIATE_PRODUCTION_ACTIVATION_CHECKLIST_2026-04-22.md`

### Team 2 (Runtime execution)
- Do not rerun blind.
- Rerun only after Team 1 canonical env lock.
- Required rerun bundle:
  1. production probe
  2. shared-runtime probe
  3. pay gate report
  4. `pnpm test:pay`
  5. `pnpm test:dash`
- Must submit new artifacts for Team 1 verdict.
- Reference:
  - `docs/reports/team1/PAY_IAI_ONE_IMMEDIATE_PRODUCTION_ACTIVATION_CHECKLIST_2026-04-22.md`

### Team 5 (Live-sync lane)
- No new code-level work now.
- Must wait until Team 1 flips lock.
- Must not claim synchronized live before lock flip.

### Team Email SMTP (unified lane)
- Public hostname blocker is closed, but lane is not live-closed.
- Must close remaining clusters:
  - mailbox/alias truth
  - inbound routing truth
  - Gmail proof
  - Outlook proof
  - internal inbox proof
- Must close Wave 1 with real action:
  - `message_id`
  - DB/log evidence
  - inbox proof
- Must keep `BCC` OFF.
- Must not open `/v1/send` public in this phase.
- Reference:
  - `docs/iai-mail-platform/MAIL_IAI_ONE_UNIFIED_TEAM_EMAIL_SMTP_24H_MISSION_2026-04-22.md`

### Team C language/bilingual
- Current universal audit conclusion remains:
  - `Du chuan live: NO`
- Must clean bilingual hard-coded copy and metadata drift, prioritizing:
  - `pay`
  - `dash`
  - `noos-web` (highest risk)
- Do not claim system-wide clean live before closure.
- Reference:
  - `docs/reports/team1/UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT_2026-04-22.md`

### Team A (developer.iai.one)
- Current state: `REOPEN_REVIEW_APPROVED`
- Today action: wait for Team 1 final review slot.
- No new scope.

### Team B CDN (cdn.iai.one)
- Must submit domain-specific:
  - deploy evidence
  - rule evidence
  - cache/header proof
  - rollback evidence
- No docs-pack overclaim.
- Machine-tracked status:
  - `docs/reports/team1/TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS_2026-04-23.md`
  - Current: CDN production evidence incomplete and still blocked.

### Team B Flows (flows.iai.one)
- Must submit production route/runtime proof.
- Blocker is production evidence, not new feature work.
- Do not reopen scope.
- Machine-tracked status:
  - `docs/reports/team1/TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS_2026-04-23.md`
  - Current: local TS5083 closure is recorded, but production route/runtime evidence is still missing.

### Team C cios.iai.one
- Canonical state remains review pending until new packet is attached.
- If fix batch is done, must commit/attach refreshed packet for Team 1 closure.
- If not attached, status does not change.

### Team D
- Board is honest/clean but not a live team yet.
- Must close:
  - sender/mailbox package for `tranhatam.com`
  - live routing to `/api/payment-routing`
  - one real/sandbox-real transaction with:
    - `provider_ref`
    - SMTP `messageId`
    - D1 evidence
    - inbox proof
- P0 remaining sites stay in intake/legal/finance review and cannot claim `READY_FOR_LIVE` while pay gate is locked.
- New Team D artifacts (2026-04-23):
  - `docs/reports/teamd/TRANHATAM_COM_P0_PAYMENT_ACTIVATION_PACKET_2026-04-23.md`
  - `docs/reports/teamd/TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_2026-04-23.json`
  - `docs/reports/teamd/TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_2026-04-23.md`
  - `scripts/pay-team-d-tranhatam-evidence-check.mjs`
- Current Team D machine state:
  - `EXTERNAL_STEPS_PENDING`
  - live claim correctly blocked while pay gate is retained and evidence is incomplete

## 3) Claim policy lock

- No team may claim synchronized live while `pay` lock is retained.
- No domain may claim reopen/live-ready from docs-only packets.
- No lane may claim done without runtime evidence tied to concrete ids (`message_id`, `provider_ref`, request ids, DB rows, inbox proof).

## 4) Operating note

This directive is authoritative for today and supersedes ad-hoc progress interpretation that conflicts with gate authority order.
