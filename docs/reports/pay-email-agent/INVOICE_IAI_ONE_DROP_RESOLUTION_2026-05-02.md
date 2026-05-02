# INVOICE_IAI_ONE_DROP_RESOLUTION_2026-05-02

- Date: `2026-05-02`
- Item: `invoice.iai.one` declared canonical → DROP
- Source decision: `docs/reports/FOUNDER_REPLY_BATCH_2026-05-02.md` D-005 = `DROP`
- Origin blocker: `docs/reports/pay-email-agent/TEAM_PAYEMAIL_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md` `BLK-PAYEMAIL-002` + `DEC-PAYEMAIL-INVOICE-001`
- Status: `DROP_RESOLUTION_REPO_SIDE_READY`

---

## 1. Founder decision

- `invoice.iai.one` is dropped from declared canonical inventory.
- Pay+Email lane will not build it. Reactivation requires a fresh founder decision plus legal lane signoff (per `PAY_IAI_ONE_DEV_LEGAL_FOUNDATION_LOCK_2026-04-27.md` step 2).

---

## 2. Truth check — trust-state already clean

Verification on `2026-05-02`:

- `grep -in "invoice" trust-iai-one-starter/scripts/trust-state-builder.mjs` → no match.
- `grep "invoice.iai.one" trust-iai-one-starter/src/data/trust-state.json` → no match.
- `grep "invoice.iai.one" trust-iai-one-starter/public/data/trust-state.json` → no match.

Trust-state JSON does not currently declare `invoice.iai.one`. The `BLK-PAYEMAIL-002` claim that it was declared canonical may have been based on an earlier state that was already cleaned. No trust-state edit is required as part of this resolution.

---

## 3. Cross-team report patch list (D-005 follow-up)

Files that still reference `invoice.iai.one` as canonical and need a brief patch note ("dropped 2026-05-02 per FOUNDER_REPLY_BATCH"):

- `docs/reports/team2/TEAM_TEAM2_CURRENT_STATE_REPORT_2026-04-26.md`
- `docs/reports/team3/TEAM_TEAM3_CURRENT_STATE_REPORT_2026-04-26.md`
- `docs/reports/team5/TEAM_TEAM5_CURRENT_STATE_REPORT_2026-04-26.md`
- `docs/reports/teamc/TEAM_TEAMC_CURRENT_STATE_REPORT_2026-04-26.md`
- `docs/reports/pay-email-agent/TEAM_PAYEMAIL_DOMAIN_AND_SERVICE_MAP_2026-04-26.md`
- `docs/reports/pay-email-agent/TEAM_PAYEMAIL_CURRENT_STATE_REPORT_2026-04-26.md`
- `docs/reports/pay-email-agent/AUDIT_ORDER_ACK_2026-04-26.md`
- `docs/reports/pay-email-agent/TEAM_PAYEMAIL_ONE_PAGE_EXEC_SUMMARY_2026-04-26.md`
- `docs/reports/team4/DAILY_TEAM4_2026-04-28.md`
- `docs/reports/team4/TEAM_TEAM4_CURRENT_STATE_REPORT_2026-04-26.md`
- `docs/reports/teamb-flows/TEAM_TEAMB-FLOWS_CURRENT_STATE_REPORT_2026-04-26.md`

These patches are non-urgent. Each report's NEXT review cycle should add the patch note. Do NOT mass-rewrite history.

---

## 4. Future re-activation gate

If founder reverses course in the future, `invoice.iai.one` may be reintroduced only when ALL are true:

1. Pay lane has at least one fully active live domain with verified evidence ladder (provider proof, message_id proof, inbox proof).
2. Legal lane signoff per `PAY_IAI_ONE_DEV_LEGAL_FOUNDATION_LOCK_2026-04-27.md` step 2 is complete (DE Good Standing + MLM clean).
3. New founder decision specifically authorizing the build.

---

## 5. Authority

This resolution closes `BLK-PAYEMAIL-002` and `DEC-PAYEMAIL-INVOICE-001` per founder reply 2026-05-02.