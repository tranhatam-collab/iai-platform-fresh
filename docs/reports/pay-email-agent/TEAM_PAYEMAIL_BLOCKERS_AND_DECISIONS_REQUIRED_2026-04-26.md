# TEAM_PAYEMAIL_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26

- Team: Pay+Email Agent (merged audit covering 6 logical lanes)
- Owner agent: AI Owner Pay+Email (Claude — Anthropic, phiên Trần Hà Tâm)
- Date: 2026-04-26 (filed 2026-04-28 within deadline)
- Audit order ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26
- Expansion ack: IAI_ONE_PAYEMAIL_Q1_Q2_EXPANSION_BRIEF_2026-04-26

---

## Blocker

### BLK-PAYEMAIL-001 — Q1 /health 3 fields not implemented
- Description: `apps/pay/src/server.ts` `/health` returns `shared_read_model: null` and `shared_upstream_runtime: null` when shared runtime is not configured (default mode in production). The Team 2 probe `scripts/team2-pay-shared-runtime-probe.mjs` reads these as falsy → 5 of 8 probe signals FAIL: `health_contract_exposes_shared_read_model`, `health_contract_exposes_shared_upstream_runtime`, `shared_read_model_ready_for_shared_only`, `shared_upstream_active_read_mode_shared_contract`, `shared_upstream_release_gate_ready`.
- Owner: AI Owner Pay+Email (this agent)
- Blocking since: 2026-04-26 (Q1 SIGNED)
- Severity: P0 (blocks Team 2 pay verdict shared-runtime portion)
- Proof of blocker: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-26.md` shows 5 unmet signals; probe code at `scripts/team2-pay-shared-runtime-probe.mjs:75-108` extracts shape; current code at `apps/pay/src/server.ts:737-738` returns null when `resolveSharedReadModelStatus()` / `resolveSharedUpstreamRuntimeStatus()` returns null.
- Estimated unblock effort: 30 minutes (add stub fallback in /health handler) + 15 minutes (run probe locally + verify 5 signals PASS)
- Affects: pay.iai.one runtime, Team 2 verdict, 8/8 probe signal goal post-Q3 canonical key

### BLK-PAYEMAIL-002 — invoice.iai.one declared but not implemented
- Description: `invoice.iai.one` is declared canonical in `trust-iai-one-starter/scripts/trust-state-builder.mjs:40` with `owner_team: "pay-email"`, status `declared`. Cross-team reports (Team 2, Team 3, Team 5, Team C) cite it as the canonical Invoice source. Reality: no DNS, no HTTP, no repo, no deploy. AI Owner Pay+Email cannot build it without founder scope decision.
- Owner: founder Trần Hà Tâm (decision required)
- Blocking since: 2026-04-26 (Q2 SIGNED — ownership transferred to Pay+Email)
- Severity: P1 (does not block live tranhatam.com or pay.iai.one core, but blocks audit honesty for cross-team references)
- Proof of blocker:
  - `dig +short invoice.iai.one A` → empty
  - `dig +short invoice.iai.one CNAME` → empty
  - `curl -sIL https://invoice.iai.one --max-time 10` → empty
  - `ls apps/invoice/` → does not exist
  - `grep -rn invoice.iai.one --include='*.ts'` → only declarations, no implementation
- Estimated unblock effort: depends on founder decision (build = ~3 weeks; drop = ~2 hours of doc + trust-state cleanup)
- Affects: 4 cross-team reports, trust-state declared_canonical inventory, future pay → invoice handoff contract

### BLK-PAYEMAIL-003 — tranhatam.com live evidence ladder pending
- Description: tranhatam.com repo-side is CLOSED (per `TRANHATAM_COM_PAY_EMAIL_REPO_CLOSEOUT_2026-04-27.md`); live-side has 5 external blockers: (1) `PAYMENT_WEBHOOK_SECRET` (prod + sandbox), (2) `MAIL_API_WEBHOOK_SECRET`, (3) provider payment proof (provider_ref + checkout_url), (4) message_id proof, (5) inbox proof + mailbox binding.
- Owner: Team B Pay Runtime + Team D Payments Activation + Team Email + Team SMTP + founder
- Blocking since: 2026-04-22 (per `TRANHATAM_COM_LIVE_SYNC_BLOCKERS_2026-04-26.md`)
- Severity: P1
- Proof of blocker: closeout doc above
- Estimated unblock effort: ~3-5 days when team coordinates (real action + capture)
- Affects: tranhatam.com SITE-INTAKE-100 row → READY_FOR_LIVE flip

### BLK-PAYEMAIL-004 — tramsaigon.com founder lock pending
- Description: tramsaigon.com `paymentAssignmentState: DEFERRED_UNTIL_FOUNDER_INSTRUCTION`. Repo-side now FORM_IN_PROGRESS (sender package + 4-template Team D email + VN onboarding form bound). Live activation needs founder lock on: (a) paid offers (membership/creator pack pricing), (b) owner truth (company vs individual), (c) payment model (one-time/recurring/hybrid), (d) VND/USD receiver assignment.
- Owner: founder Trần Hà Tâm
- Blocking since: 2026-04-22 (intake creation)
- Severity: P2 (P2 in board; not a blocker for pay.iai.one core)
- Proof of blocker: `apps/pay/src/site-activation-registry.ts:380-399`; `docs/PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md:434-447`
- Estimated unblock effort: 1-2 hours of founder decision + receiver lock
- Affects: tramsaigon.com SITE-INTAKE-112 row → ACTIVE_NOW transition

### BLK-PAYEMAIL-005 — Wave 2 auth content artifact not built
- Description: Per `docs/iai-mail-platform/MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md` lines 49-52, Wave 2 auth flows (`magic_link_login`, `reset_password`, `email_verification`, `security_notice`) are dev-open ("duoc bat dau dev Wave 2 ngay") but no content artifact exists in `packages/mail-core/src/`. Wave 1 (3 user submission + 2 internal alerts) is built; Wave 2 auth is the next gap.
- Owner: AI Owner Pay+Email (mail-core scope) + Team Auth (trigger wiring)
- Blocking since: 2026-04-15 (tracker open)
- Severity: P2 (not blocking pay or core mail; blocks Wave 2 auth migration)
- Proof of blocker: tracker rows + absence of `packages/mail-core/src/wave2-auth-content.ts`
- Estimated unblock effort: ~4-6 hours (4 templates × bilingual VI/EN HTML + tests, mirroring `wave2-internal-alerts.ts` pattern)
- Affects: Wave 2 auth migration, Team Auth dev velocity

### BLK-PAYEMAIL-006 — `packages/config` empty dist incremental build risk
- Description: `packages/config/dist/env.d.ts` previously was empty (11 bytes, just `export {};`) due to broken TypeScript composite incremental build artifact, possibly triggered by iCloud sync. Causes downstream build failures in `mail-smtp`. Resolved 2026-04-27 by clean rebuild but root cause not yet codified.
- Owner: infra / Codex (cross-cutting)
- Blocking since: 2026-04-26 (observed once)
- Severity: P2 (transient; blocks new PRs if reoccurs)
- Proof of blocker: see `PAY_IAI_ONE_TEAM_ASK_REGISTRY_2026.md` row `ask-pay-001` — RESOLVED as stale-dist false alarm
- Estimated unblock effort: ~1-2 hours (Codex add `dist/.tsbuildinfo` to .gitignore + auto-clean dist before build)
- Affects: pay-surface tests, mail-smtp build

---

## Founder decision required

### DEC-PAYEMAIL-001 — tramsaigon.com receiver lock
- Question: Lock paid offers + owner truth + payment model + receivers cho `tramsaigon.com`. 4 sub-questions: (a) paid offers (membership tier price, creator pack price, billing model)?, (b) owner truth (cá nhân hay công ty)?, (c) payment model (one-time only, recurring, hybrid)?, (d) VND/USD receiver assignment (ACB/VCB/PayPal/...)?
- Context: SITE-INTAKE-112 đã promote FORM_IN_PROGRESS 2026-04-28; repo-side đầy đủ; chỉ chờ founder lock 4 quyết định để tiến hành live evidence ladder.
- Recommendation from team: Reuse pattern of tranhatam.com (individual + ACB primary VND + PayPal USD) nếu founder dùng chung pháp nhân; HOẶC propose company structure nếu tramsaigon target volume cao hơn personal.
- Default if no decision by 2026-05-15: tramsaigon stays in `FORM_IN_PROGRESS` indefinitely; not blocking other lanes.
- Affects: tramsaigon.com surface, SITE-INTAKE-112 row, downstream live ladder

### DEC-PAYEMAIL-INVOICE-001 — invoice.iai.one build vs drop
- Question: invoice.iai.one đã DECLARED canonical trong trust-state với owner = pay-email, nhưng không tồn tại (no DNS, no repo, no deploy). Founder chọn: (a) BUILD invoice.iai.one full implementation (estimated 2-3 weeks), HOẶC (b) DROP declaration trong trust-state + cross-team reports (estimated 2 hours)?
- Context: 4 cross-team reports (Team 2, Team 3, Team 5, Team C) cite invoice.iai.one as Pay+Email-owned canonical Invoice source. Mỗi report ghi "Invoice source: invoice.iai.one (Pay+Email own per Q2)". Reality: surface không tồn tại. Audit honesty needs resolution.
- Recommendation from team: DROP cho đến khi pay lane stable (live action verified với tranhatam.com + receivers across multiple domains). BUILD chỉ khi pay lane stable + có legal lane signoff (invoice = financial document → cần cleanup-and-deploy thông qua DE Good Standing + MLM clean per `PAY_IAI_ONE_DEV_LEGAL_FOUNDATION_LOCK_2026-04-27.md` step 2).
- Default if no decision by 2026-05-05: AI Owner Pay+Email files follow-up task `PAY_IAI_ONE_FOLLOWUP_INVOICE_IAI_ONE_DECLARATION_RESOLUTION_2026-04-28.md` queued (status: `queued, awaiting founder approval to execute`) similar to aiaccountingloop pattern.
- Affects: trust-state canonical inventory, 4 cross-team reports honesty, future pay → invoice handoff contract

### DEC-PAYEMAIL-002 — tranhatam.com sandbox vs production first live action
- Question: tranhatam.com first live evidence ladder: chạy sandbox checkout via payOS first hay production checkout với small amount (e.g., 1,000 VND test)?
- Context: Per `TRANHATAM_COM_LIVE_SYNC_BLOCKERS_2026-04-26.md` 3.2, both options acceptable. Sandbox = no real money; production = real evidence trail (can refund).
- Recommendation from team: Sandbox first (validates contract); follow-up production small amount (validates HMAC + actual provider callback).
- Default if no decision by 2026-05-05: sandbox-first; AI Owner Pay+Email coordinates with Team B + Team D.
- Affects: tranhatam.com live evidence ladder timing

### DEC-PAYEMAIL-003 — Wave 2 auth content artifact ownership
- Question: Wave 2 auth content artifact (`magic_link_login`, `reset_password`, `email_verification`, `security_notice` bilingual VI/EN templates) — ai own implementation: (a) AI Owner Pay+Email build trong `packages/mail-core/`, HOẶC (b) Team Auth own + Pay+Email review?
- Context: Wave 1 Pay+Email built (`wave1-intake.ts` + `wave2-internal-alerts.ts` for low_risk_internal_alert + low_volume_notification); Wave 2 auth tracker rows status `pending`. Per AI Owner plan §1.3, mail-core scope is Pay+Email; per tracker, "Team Auth duoc bat dau dev Wave 2 ngay".
- Recommendation from team: Pay+Email own content artifact (mirroring Wave 1 / Wave 2 internal alerts pattern), Team Auth own trigger wiring (when to call buildWave2AuthPayload). Estimated 4-6 hours for content artifact.
- Default if no decision by 2026-05-05: Pay+Email proceeds with content artifact in next batch (after audit + Q1 + Q2 effects).
- Affects: Wave 2 auth migration, Team Auth dev velocity

### DEC-PAYEMAIL-004 — packages/config dist build hardening
- Question: Codex add `dist/.tsbuildinfo` to root `.gitignore` + auto-clean dist trước khi build (e.g., turbo prebuild script)?
- Context: 2026-04-26 false-alarm: empty `packages/config/dist/env.d.ts` (11 bytes) caused mail-smtp build fail; resolved by manual clean rebuild. Risk of recurrence with iCloud sync.
- Recommendation from team: YES — small infra hardening; ~30 min Codex effort.
- Default if no decision by 2026-05-05: ad-hoc clean rebuild remains the workaround.
- Affects: build hygiene across all packages

### DEC-PAYEMAIL-005 — admin UI evidence-lock cadence
- Question: `apps/mail-web` admin UI evidence-lock — per-route smoke tests + screenshot capture vs full e2e Playwright suite?
- Context: Wave 1 + Wave 2 internal alerts content locked; admin UI is the missing piece for full mail.iai.one evidence completeness.
- Recommendation from team: Per-route smoke tests (faster, lower maintenance) for now; defer Playwright until volume justifies.
- Default if no decision by 2026-05-15: per-route smoke tests, AI Owner Pay+Email schedules in next 30-day cycle.
- Affects: mail.iai.one admin UI (surface 8) production-ready ladder
