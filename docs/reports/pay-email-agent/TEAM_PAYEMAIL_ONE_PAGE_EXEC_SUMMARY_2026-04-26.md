# TEAM_PAYEMAIL_ONE_PAGE_EXEC_SUMMARY_2026-04-26

- Team: Pay+Email Agent (merged audit covering 6 logical lanes)
- Owner agent: AI Owner Pay+Email (Claude — Anthropic, phiên Trần Hà Tâm)
- Date: 2026-04-26 (filed 2026-04-28 within deadline)
- Audit order ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26
- Expansion ack: IAI_ONE_PAYEMAIL_Q1_Q2_EXPANSION_BRIEF_2026-04-26

## 1. Team scope
6 logical lanes: Team B-pay (pay runtime), Team D (Payments Activation 17 prepared domains), Team Email + Team SMTP (mail.iai.one + SMTP submission lane), Team Pay (cross-cutting alias for pay), Team Platform Runtime (Q1 — pay shared runtime contract), invoice.iai.one (Q2 — DECLARED owner). 22 surfaces total.

## 2. Surface đang quản
- pay.iai.one runtime (PREVIEW — phase_d_prep)
- tranhatam.com (PREVIEW — repo CLOSED, live BLOCKED)
- tramsaigon.com (PREVIEW — promoted FORM_IN_PROGRESS 2026-04-28)
- 14 other prepared domains in intake board (mixed states)
- mail.iai.one + mail-api (LIVE — public-send cutover 2026-04-22)
- smtp.mail.iai.one internal lane (LIVE — internal-first verification 2026-04-15)
- mail-worker outbound (LIVE — 3/3 PASS)
- mail-web admin UI + mail-inbound (PREVIEW for UI, LIVE for inbound MX)
- invoice.iai.one Q2 (BROKEN — DECLARED canonical but does not exist)
- pay.iai.one /health Q1 sub-surface (BROKEN — 5 of 8 probe signals FAIL)
- payment-email-outbound-adapter + webhook-outbound-sender (LIVE repo, awaiting secret rotation)

## 3. Live thật (production-ready với proof)
- mail.iai.one + mail-api: LIVE per `MAIL_IAI_ONE_PUBLIC_SEND_LIVE_VERDICT_2026-04-24.md`; 16/16 PASS in pnpm test:mail-smtp.
- smtp.mail.iai.one (internal lane): LIVE per `MAIL_IAI_ONE_INTERNAL_FIRST_VERIFICATION_CLOSEOUT_2026-04-15.md`.
- mail-worker outbound delivery: LIVE per 3/3 PASS in pnpm test:mail-worker.
- mail-inbound MX records: LIVE per `MAIL_IAI_ONE_OUTBOUND_RELAY_LIVE_CUTOVER_2026-04-22.md`.
(4 of 22 surfaces production-ready; 0 of pay/Q1/Q2 surfaces.)

## 4. Demo / simulated / preview
- pay.iai.one runtime: PREVIEW (phase_d_prep; demo read-model fallback until shared runtime wired).
- tranhatam.com: PREVIEW (repo CLOSED; live evidence ladder pending).
- tramsaigon.com: PREVIEW (FORM_IN_PROGRESS; founder receiver lock pending).
- 13 other prepared domains: mixed PREVIEW / FORM_SELECTION_REQUIRED.
- mail-web admin UI: PREVIEW (no evidence-lock yet).
- payment-email-outbound-adapter + webhook-sender: PREVIEW (repo done; secrets pending).

## 5. Broken / blocked / deprecated
- invoice.iai.one (Q2): BROKEN — DECLARED canonical in trust-state (`canonical: true, owner_team: pay-email`) but no DNS, no repo, no deploy. Cross-team mismatch flagged. (BLK-PAYEMAIL-002)
- pay.iai.one /health Q1 sub-surface: BROKEN for shared runtime contract — 5 of 8 Team 2 probe signals FAIL. (BLK-PAYEMAIL-001)
- 2 prepared domains BLOCKED: cios.iai.one (product review pending), lamviec.muonnoi.org (recurring/subscription compatibility pending).

## 6. Top 3 blocker
1. BLK-PAYEMAIL-001: /health 3 fields not implemented → 5 Team 2 probe signals FAIL; Q1 SIGNED but not yet shipped (~30 min effort).
2. BLK-PAYEMAIL-002: invoice.iai.one declared canonical but does not exist; 4 cross-team reports cite it falsely (founder decision required).
3. BLK-PAYEMAIL-003: tranhatam.com live evidence ladder pending — 5 external blockers (secrets, provider proof, message_id proof, inbox proof, mailbox binding) across Team B + Team D + Team Email + Team SMTP + founder.

## 7. Top 3 founder decision needed
1. DEC-PAYEMAIL-INVOICE-001: invoice.iai.one BUILD (~2-3 weeks) vs DROP declaration (~2 hours) — affects 4 cross-team reports + trust-state honesty.
2. DEC-PAYEMAIL-001: tramsaigon.com 4-question lock (paid offers, owner truth, payment model, receiver assignment) — affects SITE-INTAKE-112 → ACTIVE_NOW transition.
3. DEC-PAYEMAIL-003: Wave 2 auth content artifact ownership (Pay+Email own content vs Team Auth own) — affects Wave 2 auth migration timing.
