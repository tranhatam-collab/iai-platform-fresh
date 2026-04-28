# PHASE2_EXECUTION_GATE_2026-04-23

- Date: 2026-04-23
- Scope baseline: Phase 2 starts only after `omdalat.com` + `app.omdalat.com` live stability holds.
- Rule: do not claim payment live without full proof.
- Current gate: `LOCK_RETAINED_WITH_REASON`

## 1. Phase 2 cluster status

| cluster | status | owner | required close signal |
|---|---|---|---|
| Payment Production Activation | `IN_PROGRESS` | Team 1 + Team 2 + Team D + Payments/Ops | live checkout proof for `tranhatam.com` and `omdalat.com` + `/v1/send` accepted + provider ref + messageId + D1/canonical row + 2 Gmail inbox proof + pay gate unlock |
| Apps/Docs Legacy Cleanup | `PENDING` | Team 1 + Docs owner | archive/rewrite legacy `apps/docs`, no active `OMDALA` legacy public surface |
| Content + CMS + SEO Expansion | `PENDING` | Team 3 + Content owner | 30 public posts with VI/EN + metadata + canonical + hreflang + alt + publish gate |
| Member System Depth | `PENDING` | Team 2 + Product | role-based resource access + dashboard v2 + persistent review queue |
| Operations + Trust Layer | `PENDING` | Team 4 + Team 5 | evidence-based trust pages + moderation records + weekly/monthly ops reports |
| Ap Dalat Separate Scope | `PENDING` | Team 1 + Product | separate scope checklist (`repo/host/content/SEO/cross-link`) before build |

## 2. Payment live smoke command

```bash
npm run payment:smoke:live
```

Output path:

- `reports/payment-smoke/<domain>_payment_smoke_<date>.json`
- `reports/payment-smoke/<domain>_payment_smoke_<date>.md`

## 3. Required env for payment smoke

- `MAIL_API_BASE_URL`
- `MAIL_API_KEY`
- `MAIL_API_WORKSPACE_ID`
- `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
- `PAYMENT_SMOKE_CHECKOUT_ENDPOINT`
- `PAYMENT_SMOKE_CHECKOUT_PAYLOAD_JSON`
- `PAYMENT_SMOKE_D1_ROW_REF`
- `PAYMENT_SMOKE_INBOX_PROOF_GMAIL_1`
- `PAYMENT_SMOKE_INBOX_PROOF_GMAIL_2`

Optional:

- `PAYMENT_SMOKE_PROVIDER_REF`
- `PAYMENT_SMOKE_SESSION_REF`
- `PAYMENT_SMOKE_MESSAGE_ID`

## 3A. Latest smoke artifacts (2026-04-23)

- `reports/payment-smoke/tranhatam_com_payment_smoke_2026-04-23.md` -> `FAIL / PHASE_2_NOT_IN_SCOPE`
- `reports/payment-smoke/omdalat_com_payment_smoke_2026-04-23.md` -> `FAIL / PHASE_2_NOT_IN_SCOPE`

Both are expected red until external runtime + provider + inbox evidence are complete.

## 4. Definition of done (locked)

Phase 2 is complete only when:

1. Payment live proof is green (not repo-only smoke).
2. `apps/docs` legacy is archived or rewritten to new canonical standard.
3. 30 public posts are publishable with VI/EN + SEO metadata + ALT gate.
4. Member area runs real role-based resources/dashboard/handbook and persistent queue.
5. Trust layer is evidence-first (not slogan-first).
6. No active public/app legacy `OMDALA` artifact remains.
7. Team 1 publishes a final Phase 2 evidence packet.

## 5. Current verdict

`PHASE_2_NOT_IN_SCOPE` for live-claim transition until all required signals above are green.
