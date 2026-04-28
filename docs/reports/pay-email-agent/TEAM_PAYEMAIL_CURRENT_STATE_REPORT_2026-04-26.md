# TEAM_PAYEMAIL_CURRENT_STATE_REPORT_2026-04-26

- Team: Pay+Email Agent (merged audit covering 6 logical lanes per `IAI_ONE_PAYEMAIL_Q1_Q2_EXPANSION_BRIEF_2026-04-26.md`)
- Owner agent: AI Owner Pay+Email (Claude — Anthropic, phiên Trần Hà Tâm)
- Owner human: Founder Trần Hà Tâm
- Date: 2026-04-26 (filed 2026-04-28 within deadline window)
- Audit order ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26
- Expansion ack: IAI_ONE_PAYEMAIL_Q1_Q2_EXPANSION_BRIEF_2026-04-26 (Q1 + Q2 scope merged)

Phương án: A (4 file MERGED) — single Pay+Email agent ownership over 6 logical lanes. Each surface is labeled in §header với lane assignment.

---

## Surface 1: pay.iai.one — pay runtime

- Surface: pay.iai.one (Lane 1 Team B-pay + Lane 4 Team Pay + Lane 5 Team Platform Runtime)
- Canonical domain: `pay.iai.one`
- Primary role: product (payment runtime + control plane)
- Current state: PREVIEW (repo-side fully shipped; live HTTP returns phase_d_prep)
- Production-ready: NO (missing live proof: provider_ref, message_id, inbox proof; missing canonical TEAM2_PAY_GATE_API_KEY)
- Demo/simulated: YES (read-model defaults to demo source until shared upstream runtime is wired)
- Auth source: shared-iai-auth (resolvable via `apps/pay/src/session-context.ts` + `createSharedPayAuthSourceFromFile`)
- Payment source: own (this IS the payment runtime; consumed by other surfaces)
- Invoice source: invoice.iai.one (Pay+Email own per Q2 — but invoice.iai.one is not deployed; see Surface 9)
- Data source: D1 + KV (session context, payment evidence, payment routing assignments) — currently file-backed in dev
- Shared core dependency: `@iai/config@workspace`
- Known issues:
  - `/health` does not yet return non-null `shared_read_model` and `shared_upstream_runtime` when shared runtime is not configured → 5 of 8 Team 2 probe signals FAIL (Q1 outstanding)
  - 2 webhook secrets pending: `PAYMENT_WEBHOOK_SECRET` (prod + sandbox), `MAIL_API_WEBHOOK_SECRET`
- Security or legal risk:
  - `PAYMENT_WEBHOOK_SECRET` rotation policy not yet codified — Team B Pay Runtime own
  - `payOS-first / VND-only / one_time-only` constraint enforced at code level (no recurring) — legal lane safe
- Founder decision needed:
  - Q3 in progress: provision `TEAM2_PAY_GATE_API_KEY` canonical (founder pushing)
  - DEC-PAYEMAIL-001: receiver lock for `tramsaigon.com` (paid offers + owner truth + payment model)
- Next 7-day action:
  - Implement Q1 /health 3 fields (shared_read_model, shared_upstream_runtime, releaseGate.ready) with stub fallback when no shared runtime configured
  - Run probe locally → confirm 5 signals PASS
  - Coordinate Q3 canonical key arrival with Team 2 (Codex) for full 8/8 PASS
- Next 30-day action:
  - Wire real shared upstream runtime once canonical API key is provisioned
  - Run real or sandbox checkout flow with payOS, capture provider_ref + checkout_url (Team B + Team D action)
  - Bind 4 mailboxes (`pay@`, `billing@`, `support@`, `noreply@`) per active site

### Production proof
- repo proof: HEAD `d21e77d`; surface code at `apps/pay/src/server.ts`, `apps/pay/src/payment-routing.ts`, `apps/pay/src/payment-event-evidence-store.ts`, `apps/pay/src/payment-webhook-outbound-sender.ts`, `apps/pay/src/payment-email-outbound-adapter.ts`; 59/59 PASS in `tests/integration/pay-surface.test.mjs`
- domain proof: `pay.iai.one` resolvable; `/health` returns 200 with shape `{ ok: true, data: { service: "iai-pay", status: "phase_d_prep", ... } }`
- deploy proof: phase_d_prep deploy referenced in `docs/release-evidence/pay.iai.one/PAY_IAI_ONE_PHASE_D_PREP_RELEASE_EVIDENCE_PACKET_2026-04-18.md`
- owner proof: AI Owner Pay+Email (this audit), founder Trần Hà Tâm has signed §9 of `PAY_IAI_ONE_DEV_LEGAL_FOUNDATION_LOCK_2026-04-27.md`
- (live-side claim NO until: provider_ref + message_id + inbox proof + canonical API key all green)

---

## Surface 2: tranhatam.com — primary founder pay surface

- Surface: tranhatam.com (Lane 2 Team D Payments Activation)
- Canonical domain: `tranhatam.com`
- Primary role: product (founder personal pay + email surface)
- Current state: PREVIEW (repo-side CLOSED; live-side STILL_BLOCKED)
- Production-ready: NO (5 external blockers per `TRANHATAM_COM_PAY_EMAIL_REPO_CLOSEOUT_2026-04-27.md`)
- Demo/simulated: NO (real receiver assignment locked, only awaiting live action)
- Auth source: shared-iai-auth (per pay.iai.one)
- Payment source: pay.iai.one
- Invoice source: invoice.iai.one (per Q2 — not deployed)
- Data source: D1 (via pay.iai.one)
- Shared core dependency: `@iai/config@workspace`
- Known issues: see live-blockers list in closeout
- Security or legal risk: founder personal lane (individual owner); ID-country VND/USD policy enforced
- Founder decision needed: none (5 P0 already signed 2026-04-26)
- Next 7-day action: founder + Team B run sandbox checkout + capture provider_ref
- Next 30-day action: live action evidence ladder closure → `READY_FOR_LIVE`

### Production proof
- repo proof: `apps/pay/src/payment-routing.ts` (recv_vnd_personal_tranhatam_acb primary, recv_vnd_personal_tranhatam_vcb fallback, recv_usd_personal_tranhatam_paypal); commit `02df6b4` (id_country) + `2326795` (expired-shell line) + `b69292a` + `6cb0705` (webhook sender)
- domain proof: `tranhatam.com` resolvable
- deploy proof: PENDING — live wiring not yet bound (`MAIL_API_BASE_URL` etc. not in runtime)
- owner proof: founder Trần Hà Tâm direct ownership
- (Production-ready: NO — pending: secrets, provider proof, message_id proof, inbox proof, mailbox binding + live runtime wiring)

---

## Surface 3: tramsaigon.com — VN public launch surface

- Surface: tramsaigon.com (Lane 2 Team D Payments Activation)
- Canonical domain: `tramsaigon.com`
- Primary role: product (multilingual city platform — membership, creator value, business discovery)
- Current state: PREVIEW (repo-side packet locked; promoted FORM_IN_PROGRESS 2026-04-28)
- Production-ready: NO (founder receiver lock outstanding)
- Demo/simulated: NO (slot-only — no demo data injected)
- Auth source: shared-iai-auth (planned)
- Payment source: pay.iai.one
- Invoice source: invoice.iai.one (per Q2 — not deployed)
- Data source: D1 (via pay.iai.one when wired)
- Shared core dependency: `@iai/config@workspace`
- Known issues:
  - `allowedLocales: ["en", "vi", "ko", "zh", "ja", "fr", "es"]` declares 7 locales but only EN/VI have content
- Security or legal risk: pending owner truth (company vs individual)
- Founder decision needed: paid offers + owner truth + payment model + receiver assignment (DEC-PAYEMAIL-001)
- Next 7-day action: founder lock 4 decisions above
- Next 30-day action: post-lock — proceed to live evidence ladder

### Production proof
- repo proof: HEAD `d21e77d`; site activation registry entry `apps/pay/src/site-activation-registry.ts:380-399`; Team D email profile `apps/pay/src/team-d-payment-email-profiles.ts:1117-1202`; receivers slot `docs/PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md:434-447`
- domain proof: `tramsaigon.com` resolvable on Cloudflare worker custom domain
- deploy proof: NO — pre-launch
- owner proof: NO — owner truth pending
- (Production-ready: NO)

---

## Surface 4: 17 prepared domains (intake board)

- Surface: aggregated prepared-domain intake board (Lane 2 Team D Payments Activation)
- Canonical domain: 17 domains under `apps/pay/src/site-activation-registry.ts`
- Primary role: product (payment-active site preparation)
- Current state: mixed
  - 2 ACTIVE_NOW (tranhatam.com VND, vc.vetuonglai.com VND+USD)
  - 11 FORM_IN_PROGRESS (incl. tramsaigon.com promoted 2026-04-28)
  - 2 FORM_SELECTION_REQUIRED (life.iai.one, app.iai.one)
  - 2 BLOCKED (cios.iai.one, lamviec.muonnoi.org)
- Production-ready: 0 of 17 (no domain has full live proof yet)
- Demo/simulated: NO (real registry, just pending decisions)
- Auth source: shared-iai-auth (when wired)
- Payment source: pay.iai.one
- Invoice source: invoice.iai.one (per Q2 — not deployed)
- Data source: D1 (when wired)
- Shared core dependency: `@iai/config@workspace`
- Known issues: each row has its own blockers — see intake board doc
- Security or legal risk: VN_FORM vs INTERNATIONAL form binding enforced; no domain auto-active without founder lock
- Founder decision needed: 8 of 17 still need decisions (DEC-PAYEMAIL-001..008)
- Next 7-day action: founder ack DEC-PAYEMAIL-001 (tramsaigon) priority
- Next 30-day action: walk through P1 backlog

### Production proof
- repo proof: HEAD `d21e77d`; `apps/pay/src/site-activation-registry.ts` 480+ lines covering 17 entries
- domain proof: each domain dig probe individually — partial coverage
- deploy proof: per-domain — most pre-launch
- owner proof: 2 confirmed (tranhatam.com individual, vc.vetuonglai.com Thanh Tam Phat)
- (Production-ready: NO en bloc)

---

## Surface 5: mail.iai.one — mail runtime + mail-api

- Surface: mail.iai.one + apps/mail-api (Lane 3 Team Email + Lane 3 Team SMTP)
- Canonical domain: `mail.iai.one`
- Primary role: control plane (mail submission API + provider abstraction + queue)
- Current state: LIVE (per `docs/iai-mail-platform/MAIL_IAI_ONE_LIVE_SMOKE_VERDICT_2026-04-23.md`, public send cutover 2026-04-22)
- Production-ready: PARTIAL YES (live for public submission; Wave 2 + Wave 3 not yet evidence-locked)
- Demo/simulated: NO (real provider routes via mailcow + outbound relay)
- Auth source: own (token-based mail-api auth)
- Payment source: none
- Invoice source: none
- Data source: D1 (messages, message_events, delivery_attempts), KV (suppressions)
- Shared core dependency: `@iai/mail-core@workspace`, `@iai/config@workspace`
- Known issues: Wave 2 auth content artifacts (magic_link_login, reset_password, email_verification, security_notice) NOT yet built — Team Auth dev-open per tracker; deferred from this batch
- Security or legal risk: SMTP submission internal-first per `MAIL_IAI_ONE_INTERNAL_FIRST_VERIFICATION_CLOSEOUT_2026-04-15.md`
- Founder decision needed: none active
- Next 7-day action: build Wave 2 auth content artifact `packages/mail-core/src/wave2-auth-content.ts` (4 flows)
- Next 30-day action: complete Wave 1 + Wave 3 evidence ladder (provider_ref + message_id + DB 3-table + inbox proof)

### Production proof
- repo proof: HEAD `d21e77d`; `apps/mail-api/src/server.ts`, `apps/mail-api/src/smtp-internal.ts`; `packages/mail-core/src/{mail-messages,mail-queue,provider-routes,suppressions,wave1-intake,wave2-internal-alerts,domain-dns-health}.ts`
- domain proof: `mail.iai.one` LIVE per public-send cutover doc
- deploy proof: `MAIL_IAI_ONE_PUBLIC_SEND_LIVE_VERDICT_2026-04-24.md`
- owner proof: AI Owner Pay+Email (this audit)
- 16/16 PASS in `pnpm test:mail-smtp`, 3/3 PASS in `pnpm test:mail-worker`

---

## Surface 6: SMTP submission internal lane

- Surface: apps/mail-smtp + smtp.mail.iai.one (Lane 3 Team SMTP)
- Canonical domain: `smtp.mail.iai.one` (internal)
- Primary role: internal/operate (SMTP submission for app/api flows before mail-api)
- Current state: LIVE (per `MAIL_IAI_ONE_INTERNAL_FIRST_VERIFICATION_CLOSEOUT_2026-04-15.md`)
- Production-ready: YES (internal lane only — proof in closeout)
- Demo/simulated: NO
- Auth source: own (SMTP cred rotation per `MAIL_IAI_ONE_SMTP_CREDENTIAL_ROTATION_RUNBOOK_FINAL.md`)
- Payment source: none
- Invoice source: none
- Data source: D1 (delivery_attempts) + remote SMTP relay
- Shared core dependency: `@iai/mail-core@workspace`
- Known issues: none currently open
- Security or legal risk: SMTP cred secret hygiene — runbook locked
- Founder decision needed: none
- Next 7-day action: monitor cred rotation cadence
- Next 30-day action: per SMTP runbook

### Production proof
- repo proof: HEAD `d21e77d`; `apps/mail-smtp/src/...`
- domain proof: smtp endpoint reachable (internal-only)
- deploy proof: `MAIL_IAI_ONE_INTERNAL_FIRST_VERIFICATION_CLOSEOUT_2026-04-15.md`
- owner proof: AI Owner Pay+Email

---

## Surface 7: mail-worker — outbound delivery worker

- Surface: apps/mail-worker (Lane 3 Team Email)
- Canonical domain: N/A (Cloudflare Worker, no public route — worker-internal queue dispatcher)
- Primary role: internal/operate (consumes mail queue → ships via provider routes)
- Current state: LIVE
- Production-ready: YES (3/3 PASS in `pnpm test:mail-worker`)
- Demo/simulated: NO
- Auth source: own (worker secrets)
- Payment source: none
- Invoice source: none
- Data source: D1
- Shared core dependency: `@iai/mail-core@workspace`
- Known issues: none open
- Security or legal risk: provider abstraction per `MAIL_IAI_ONE_PROVIDER_ABSTRACTION_SPEC_FINAL.md`
- Founder decision needed: none
- Next 7-day action: maintenance
- Next 30-day action: maintenance

### Production proof
- repo proof: HEAD `d21e77d`; `apps/mail-worker/src/...`
- domain proof: worker active (no public domain)
- deploy proof: wrangler deploy log
- owner proof: AI Owner Pay+Email

---

## Surface 8: mail-web + mail-inbound + admin dashboard

- Surface: apps/mail-web + apps/mail-inbound (Lane 3 Team Email)
- Canonical domain: `mail.iai.one/admin` (admin UI), inbound MX records on mail subdomains
- Primary role: control plane (admin dashboard) + internal/operate (inbound MTA)
- Current state: PREVIEW for admin UI; LIVE for inbound routing
- Production-ready: PARTIAL — inbound routing YES (per outbound relay live cutover); admin UI not yet evidence-locked
- Demo/simulated: NO
- Auth source: own (admin token)
- Payment source: none
- Invoice source: none
- Data source: D1
- Shared core dependency: `@iai/mail-core@workspace`
- Known issues: admin UI may have stale broken trees per repo-recovery report (Codex T1)
- Security or legal risk: admin token rotation cadence
- Founder decision needed: none
- Next 7-day action: confirm admin UI tree health post-recovery
- Next 30-day action: admin UI evidence-lock

### Production proof
- repo proof: HEAD `d21e77d`; `apps/mail-web/src/...`, `apps/mail-inbound/src/...`
- domain proof: MX records live for mail subdomain
- deploy proof: `MAIL_IAI_ONE_OUTBOUND_RELAY_LIVE_CUTOVER_2026-04-22.md`
- owner proof: AI Owner Pay+Email

---

## Surface 9: invoice.iai.one (Q2 expansion — DECLARED only)

- Surface: invoice.iai.one (Lane 6 invoice — Q2 SIGNED 2026-04-26)
- Canonical domain: `invoice.iai.one`
- Primary role: control plane (declared as "invoice control plane" in trust-state)
- Current state: BROKEN (declared but not implemented; see findings below)
- Production-ready: NO
- Demo/simulated: NO (does not exist anywhere)
- Auth source: unknown (not implemented)
- Payment source: pay.iai.one (logical: invoice = output of payment success state)
- Invoice source: own (would be itself if it existed)
- Data source: unknown
- Shared core dependency: none yet
- Known issues:
  - **No DNS resolution**: `dig +short invoice.iai.one` returns empty (no A, no CNAME)
  - **No HTTP**: `curl -sIL https://invoice.iai.one --max-time 10` returns nothing (DNS fails before TCP)
  - **No repo**: no `apps/invoice/`, no `packages/invoice-*`, no external repo directory in workspace
  - **DECLARED in trust-state**: `trust-iai-one-starter/scripts/trust-state-builder.mjs:40` lists it as `canonical: true, owner_team: "pay-email"`, status `declared`
  - **Cross-team references**: Team 2, Team 3, Team 5, Team C reports all cite `Invoice source: invoice.iai.one (Pay+Email own per Q2)` — but the surface does not exist
- Security or legal risk:
  - Cross-team mismatch: declaring invoice.iai.one as Pay+Email-owned canonical surface but it has zero implementation creates false expectations
  - Legal: financial document path unsigned (invoice = legal document; needs legal lane sign-off)
- Founder decision needed: DEC-PAYEMAIL-INVOICE-001 — drop invoice.iai.one from canonical declaration UNTIL implemented, OR commit to build timeline (build-from-scratch effort)
- Next 7-day action: founder decision; if BUILD: scope + design doc; if DROP: update trust-state + cross-team reports
- Next 30-day action: dependent on decision

### Production proof
- repo proof: NO (no implementation exists)
- domain proof: NO (`dig` returns empty; no DNS)
- deploy proof: NO (no Cloudflare worker, no service)
- owner proof: declaration only — `trust-iai-one-starter` lists `pay-email` as owner_team
- (Production-ready: NO; surface is DECLARED but does not exist)

### Discovery commands run 2026-04-28
```
dig +short invoice.iai.one A         → (empty)
dig +short invoice.iai.one CNAME     → (empty)
curl -sIL https://invoice.iai.one    → (empty, DNS fails)
ls apps/invoice/                     → directory does not exist
ls packages/invoice-*                → no matches
grep -rn invoice.iai.one --include='*.ts' --include='*.json' → only trust-state-builder + cross-team docs
```

---

## Surface 10: pay shared upstream runtime contract (Q1 expansion — implementation pending)

- Surface: pay.iai.one /health shared runtime contract fields (Lane 5 Team Platform Runtime — Q1 SIGNED)
- Canonical domain: `pay.iai.one/health` (subset of Surface 1)
- Primary role: control plane (contract surface for Team 2 shared runtime probe)
- Current state: BROKEN (5 of 8 probe signals FAIL because `shared_read_model` and `shared_upstream_runtime` are null when shared runtime not configured)
- Production-ready: NO
- Demo/simulated: NO
- Auth source: shared-iai-auth (when shared upstream runtime wired)
- Payment source: pay.iai.one
- Invoice source: none
- Data source: D1 + KV (when shared upstream runtime wired) + upstream runtime fetch
- Shared core dependency: `@iai/config@workspace`
- Known issues:
  - 5 unmet signals: `health_contract_exposes_shared_read_model`, `health_contract_exposes_shared_upstream_runtime`, `shared_read_model_ready_for_shared_only`, `shared_upstream_active_read_mode_shared_contract`, `shared_upstream_release_gate_ready`
- Security or legal risk: contract drift could mislead Team 2 about shared rollout readiness
- Founder decision needed: none (Q1 SIGNED)
- Next 7-day action: implement stub fallback in `apps/pay/src/server.ts` /health handler (Q1 effect — currently in progress)
- Next 30-day action: wire real shared upstream runtime when canonical TEAM2_PAY_GATE_API_KEY is provisioned (Q3)

### Production proof
- repo proof: HEAD `d21e77d`; `apps/pay/src/server.ts:709-786` (existing /health that returns null shared_*); `apps/pay/src/shared-read-model.ts:135-153` (status type); `apps/pay/src/shared-upstream-runtime.ts:50-72` (status type); `scripts/team2-pay-shared-runtime-probe.mjs` (probe expected schema)
- domain proof: `pay.iai.one/health` HTTP 200 (but shared_* null)
- deploy proof: PENDING (Q1 implementation not yet committed)
- owner proof: AI Owner Pay+Email (this audit + Q1 SIGNED)
- (Production-ready: NO until Q1 + Q3 both effect + 5 signals PASS)

---

## Surface 11: pay-email outbound contract + webhook sender

- Surface: payment-email-outbound-adapter + payment-webhook-outbound-sender (Lane 1 Team B-pay)
- Canonical domain: cross-cutting (used by pay.iai.one; called from external surfaces)
- Primary role: product (pay → mail handoff + pay → tenant webhook handoff)
- Current state: LIVE (repo-side; awaiting live secrets)
- Production-ready: NO (`PAYMENT_WEBHOOK_SECRET` + `MAIL_API_WEBHOOK_SECRET` not yet rotated to prod runtime)
- Demo/simulated: NO
- Auth source: shared-iai-auth + token (for downstream)
- Payment source: pay.iai.one (this is part of pay)
- Invoice source: none
- Data source: D1 (payment_events evidence row)
- Shared core dependency: `@iai/mail-core` (mail queue submit), `@iai/config`
- Known issues:
  - Two webhook secrets pending rotation (Team B Pay Runtime + Team Email)
- Security or legal risk: HMAC signature scheme locked per `PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md`
- Founder decision needed: none active
- Next 7-day action: founder coordinate with Team B + Team Email for secret rotation
- Next 30-day action: end-to-end live action via tranhatam.com

### Production proof
- repo proof: HEAD `d21e77d`; `apps/pay/src/payment-email-outbound-adapter.ts`, `apps/pay/src/payment-webhook-outbound-sender.ts`, `apps/pay/src/payment-webhook-tenant-registry.ts`; commits `b69292a`, `6cb0705`, `02df6b4`
- domain proof: pay.iai.one resolvable; `/internal/payment-event/callback` route guarded
- deploy proof: phase_d_prep
- owner proof: AI Owner Pay+Email
