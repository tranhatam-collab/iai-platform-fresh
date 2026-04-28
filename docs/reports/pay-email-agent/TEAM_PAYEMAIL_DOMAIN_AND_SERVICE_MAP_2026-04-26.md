# TEAM_PAYEMAIL_DOMAIN_AND_SERVICE_MAP_2026-04-26

- Team: Pay+Email Agent (merged audit covering 6 logical lanes)
- Owner agent: AI Owner Pay+Email (Claude — Anthropic, phiên Trần Hà Tâm)
- Date: 2026-04-26 (filed 2026-04-28 within deadline)
- Audit order ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26
- Expansion ack: IAI_ONE_PAYEMAIL_Q1_Q2_EXPANSION_BRIEF_2026-04-26

---

## Domain bảng (8 mục)

| Domain | Legal lane | Payment lane | Auth source | Data source | Shared core in use | Logic riêng ngoài core | Public wording sai? | Preview/simulated bị hiểu nhầm là production? |
|---|---|---|---|---|---|---|---|---|
| `pay.iai.one` | IAI.ONE pay legal foundation lock 2026-04-27 (founder Trần Hà Tâm) | own (this IS the runtime) | shared-iai-auth | D1 + KV (file-backed in dev) | `@iai/config`, `@iai/mail-core` | YES — payment routing, receiver registry, payment surface registry, site activation registry, payment email templates, pay-mail outbound adapter, payment-event evidence store, payment webhook outbound sender, render shells | NO — `/health` returns `phase_d_prep`, no false LIVE claim | YES (low risk) — read-model defaults to demo source until shared upstream runtime wired; mitigated by `selection_mode` field exposed in `/health` |
| `mail.iai.one` | mail.iai.one provider abstraction (Mailcow + relay) | none | own (mail-api token) | D1 (messages, message_events, delivery_attempts), KV (suppressions) | `@iai/mail-core`, `@iai/config` | YES — provider abstraction, queue, suppressions, DNS health, Wave 1 intake, Wave 2 internal alerts, public submission decision gate | NO — public-send cutover doc explicit | NO |
| `smtp.mail.iai.one` (internal) | internal SMTP submission lane | none | own (SMTP cred) | D1 (delivery_attempts) | `@iai/mail-core` | YES — SMTP submission spec, cred rotation runbook, smoke runbook | N/A (internal lane) | NO |
| `tranhatam.com` | founder personal individual (Vietnam, VN-issued ID, payment via ACB primary + VCB fallback + PayPal USD) | pay.iai.one | shared-iai-auth (planned wiring) | D1 (via pay.iai.one) | `@iai/config` | NO — uses Pay+Email centralized routing via `recv_vnd_personal_tranhatam_acb` etc. | NO | NO — site exists; awaiting live evidence ladder |
| `tramsaigon.com` | TBD (founder needs to lock company vs individual) | pay.iai.one | shared-iai-auth (planned) | D1 (via pay.iai.one) when wired | `@iai/config` | NO — uses Team D core 4-template email registry + sender package | YES — `allowedLocales` declares 7 locales but only EN/VI have content (degrades to default) | NO — `currentBoardStatus: FORM_IN_PROGRESS`, `paymentAssignmentState: DEFERRED_UNTIL_FOUNDER_INSTRUCTION` |
| `vc.vetuonglai.com` | Công ty TNHH ĐTTM Thanh Tâm Phát (VND) + Angel Edu Tam Foundation Inc via Relay/Thread (USD) | pay.iai.one | shared-iai-auth (planned) | D1 (via pay.iai.one) when wired | `@iai/config` | NO | NO | NO — `paymentAssignmentState: ACTIVE_NOW` for VND but live evidence not yet captured |
| 14 other prepared domains (omdala.com, omdalat.com, app.omdala.com, app.omdalat.com, flow.iai.one, life.iai.one, invest.vetuonglai.com, life.vetuonglai.com, aiaccountingloop.com, app.iai.one, noos.iai.one, cios.iai.one, lamviec.muonnoi.org, nguyenlananh.com) | mixed (Thanh Tâm Phát for Về Tương Lai cluster; international for AAL; TBD for others) | pay.iai.one | mixed | D1 (via pay.iai.one) when wired | `@iai/config` | NO — single shared registry | mixed (omdalat 14 templates vs others 4 — research locked, no false claim) | NO — all status reflected in intake board |
| `invoice.iai.one` (Q2) | declared as billing/invoice control plane in trust-state — NO legal lane defined yet | logical: output of payment success | unknown (not implemented) | unknown | none | NO (no implementation) | YES — DECLARED in trust-state with `canonical: true` but DNS does not resolve and no repo exists; cross-team reports cite it as Pay+Email-owned canonical surface | YES (HIGH risk) — declared as canonical but does not exist; team reports may falsely assume invoice is implemented |
| `pay.iai.one/health` (Q1 sub-surface) | inherits from pay.iai.one | own | shared-iai-auth (when wired) | demo/null until upstream runtime wired | `@iai/config` | YES — shared_read_model + shared_upstream_runtime contract surface | NO — explicit `read_model.fallback_mode` and `selection_mode` fields | YES (probe-visible) — 5 of 8 Team 2 probe signals FAIL because shared_* fields are null when shared runtime unconfigured |

---

## Notes

### Cross-domain dependency

- All 17 prepared domains depend on `pay.iai.one` runtime for centralized payment routing, receiver registry, payment email registry, site activation registry, and webhook callback `/internal/payment-event/callback`.
- All Wave 1 / Wave 2 / Wave 3 mail flows depend on `mail.iai.one` mail-api submission contract.
- `invoice.iai.one` (Q2) is logically downstream of `pay.iai.one` payment success state — implementation NOT done.
- Team 2 shared runtime probe (`scripts/team2-pay-shared-runtime-probe.mjs`) depends on `pay.iai.one/health` exposing `shared_read_model` and `shared_upstream_runtime` per Q1 contract.

### Cảnh báo chồng vai

- **`invoice.iai.one` chồng vai with pay.iai.one expectation**: 4 cross-team reports (Team 2, Team 3, Team 5, Team C) cite invoice.iai.one as the invoice source, but it is not implemented. This is a declared-vs-actual gap — flagged in Surface 9 of the current state report and in DEC-PAYEMAIL-INVOICE-001.
- **`pay.iai.one` covers two roles**: (a) product (payment runtime serving customers) and (b) control plane (shared runtime contract for Team 2 + receiver registry for Team D + email template registry for Team Email). This is intentional and locked, but documented here.
- **`mail.iai.one` covers three roles**: (a) public submission API (LIVE), (b) internal-first SMTP submission lane (LIVE), (c) admin dashboard (PREVIEW). All three are correctly scoped under same domain.

### Public wording risk register

- `tramsaigon.com` `allowedLocales: ["en", "vi", "ko", "zh", "ja", "fr", "es"]` — public surface may receive locale `ko/zh/ja/fr/es` that fall back to default `en` silently. Risk: low (graceful degradation). Mitigation: closeout doc explicit.
- `invoice.iai.one` declared as "invoice control plane" but does not exist. Risk: HIGH for cross-team confidence. Mitigation: founder decision DEC-PAYEMAIL-INVOICE-001 to either build or drop declaration.

### Production-ready honesty roll-up

| Lane | Surfaces | Production-ready count |
|---|---|---|
| Lane 1 Team B-pay | pay.iai.one runtime + outbound adapters + webhook sender | 0 of 3 (live secrets + provider proof outstanding) |
| Lane 2 Team D Payments Activation | 17 prepared domains | 0 of 17 (live evidence ladder not yet closed for any single domain) |
| Lane 3 Team Email + SMTP | mail.iai.one + smtp + worker + web/inbound | 3 of 4 (mail-api LIVE, smtp LIVE, worker LIVE; admin UI PREVIEW) |
| Lane 4 Team Pay | covered by Lane 1 | 0 of 0 (logical alias) |
| Lane 5 Team Platform Runtime (Q1) | /health shared runtime contract | 0 of 1 (Q1 implementation pending) |
| Lane 6 invoice.iai.one (Q2) | invoice.iai.one | 0 of 1 (does not exist) |
| **Total** | **22 surfaces** | **3 production-ready (mail.iai.one + smtp + worker)** |
