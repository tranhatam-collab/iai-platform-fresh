# OMDALAT_COM_PHASE2_PAYMENT_PREDEPLOY_REPORT_2026-04-23

- Team: Team D Payments Activation + Treasury Ops
- Date: 2026-04-23
- Scope: `omdalat.com` Phase 2 payment readiness
- Verdict: `REPO_AND_CHECKER_READY__LIVE_PAYMENT_NOT_CLAIMABLE`

## 1. Current lock state

1. Legal owner lock: `Công ty TNHH SX - TM - DV Thai Lam`.
2. Active receiver lock: `recv_vnd_thailam_acb`.
3. Runtime/ops rule lock:
   - no `READY_FOR_LIVE` while pay gate is `LOCK_RETAINED_WITH_REASON`
   - no payment live claim without provider/mail/D1/inbox aligned proof

## 2. Smoke artifact for Phase 2

Command executed:

```bash
npm run payment:smoke:live -- --domain=omdalat.com --date=2026-04-23 --dry-run --allow-red
```

Generated:

- `reports/payment-smoke/omdalat_com_payment_smoke_2026-04-23.json`
- `reports/payment-smoke/omdalat_com_payment_smoke_2026-04-23.md`

Result:

- `Overall: FAIL`
- `Phase 2 payment state: PHASE_2_NOT_IN_SCOPE`
- cause: missing runtime bindings + missing real checkout/mail evidence

## 3. Evidence checker state

Command executed:

```bash
node scripts/pay-team-d-omdalat-evidence-check.mjs --date=2026-04-23
```

Current result:

- checker `PASS` (guardrails are correct)
- activation evidence complete: `FAIL`
- live claim blocked: `PASS`
- mailbox evidence complete: `PASS`
- runtime evidence complete: `FAIL`
- payment proof complete: `FAIL`

## 4. Remaining blockers to close for Phase 2 payment

1. Runtime binding truth on pay worker:
   - `MAIL_API_BASE_URL`
   - `MAIL_API_KEY`
   - `MAIL_API_WORKSPACE_ID`
   - `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
2. Real checkout/sandbox provider flow:
   - `provider_ref`
   - `checkout_or_payment_session_ref`
   - non-empty `checkout_url` if lane requires hosted checkout
3. Mail handoff acceptance:
   - `/v1/send` accepted
   - non-empty `messageId`
4. Evidence alignment in one same flow:
   - provider ref
   - session ref
   - messageId
   - D1/canonical row
   - inbox proof (2 Gmail)
5. Team 1 gate unlock:
   - `LOCK_RETAINED_WITH_REASON` must be flipped only after all required signals are green

## 5. Phase 2-safe statement

`omdalat.com` is ready at repo/checker level for Phase 2 progression, but payment live remains blocked until runtime + provider + evidence truth is completed end-to-end.
