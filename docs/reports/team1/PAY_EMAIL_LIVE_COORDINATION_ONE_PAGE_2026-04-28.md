# PAY_EMAIL_LIVE_COORDINATION_ONE_PAGE_2026-04-28

- Date: 2026-04-28
- Timezone: Asia/Ho_Chi_Minh
- Owner: Team 1 Program Root
- Scope: `pay.iai.one` + `mail.iai.one` coordination after P9 Path B deploy
- Verdict: `CONTINUE_CONTROLLED_EXECUTION`

## 1. Executive Decision

Do not pause the whole lane. Pause only broad live-close claims until founder/team review confirms the remaining gates.

Operational state:

| Lane | Current truth | Decision |
|---|---|---|
| Path B inbound webhook P9 | `LIVE_PRODUCTION`, image `iai-mail-api-pathb:fb91d1b`, dedup proof done | Treat as closed for P9 scope |
| Email public send | `POST https://api.mail.iai.one/v1/send` open and returning `202` with `message_id` | Treat public send ingress blocker as closed |
| Email full lane | Not live-close yet | Continue proof collection |
| Pay production gate | `LOCK_RETAINED_WITH_REASON` | Keep gate locked |

## 2. Done

| Area | Evidence | Status |
|---|---|---|
| Pay repo-side | `pnpm typecheck:pay`, `pnpm test:pay`, checker/integration batch | PASS |
| Email repo-side | build/typecheck + integration batch | PASS |
| Path B runtime | `MAIL_IAI_ONE_INBOUND_WEBHOOK_PATH_B_DEPLOY_COMPLETE_2026-04-28.md` | LIVE |
| Path B dedup | D1 fresh event, D2 replay, D3 conflict | PASS |
| Public send ingress | `MAIL_IAI_ONE_PUBLIC_SEND_LIVE_VERDICT_2026-04-24.md` | OPEN |
| Tranhatam payment mail proof chain | `TRANHATAM_COM_PAYMENT_EVENT_CALLBACK_AND_MAIL_PROOF_2026-04-24.md` | PARTIAL PROOF EXISTS |

## 3. Still Missing

### Pay

| Blocker | Owner | Required action today |
|---|---|---|
| `TEAM2_PAY_GATE_API_KEY` not live in production runtime | Founder / Team 2 | Export canonical key into production runtime; rerun Team 2 probe |
| `401 API_KEY_REQUIRED` in Team 2 runtime probe | Team 2 | Rerun after key is present |
| `checkout_url_non_null`, `payment_link_id_non_null`, `no_214`, `production_gate_green` fail | Team 2 + Team 1 | Team 2 proves runtime; Team 1 flips only after all signals pass |
| Production `/health` says `legacy_or_unknown` | Team Deploy / Team 2 | Expose `shared_read_model` and `shared_upstream_runtime` |

### Email

| Blocker | Owner | Required action today |
|---|---|---|
| Mailbox/alias truth for all required senders | Team Email SMTP | Produce authoritative mailbox + alias map |
| Inbound routing truth toàn cục | Team Email SMTP | Prove reply/bounce/complaint/support/billing routes |
| Gmail/Outlook/internal inbox proof | Team Email SMTP | Send real flow proofs and attach message IDs |
| Wave 1 tracker not closed by flow | Team Email SMTP + app owners | Close flow-by-flow only with action + `message_id` + DB/log/inbox evidence |
| BCC requested but not safe yet | Team Email SMTP | Keep `BCC=OFF` until proof gates pass |

## 4. What Not To Touch

| Item | Reason |
|---|---|
| Repo-side pay implementation | Current batch is green: `91/91` + typecheck |
| Repo-side email implementation | Current batch is green: `60/60` + build/typecheck |
| Path B P9 container | Live production proof already passed |
| Public `/v1/send` ingress | Already opened; next work is proof, not reopening ingress |
| BCC global setting | Must remain OFF until Gmail/Outlook/internal proof passes |

## 5. Today Command Packet

Team 2 / Pay runtime:

```bash
pnpm report:team2-pay-prod-probe
pnpm report:pay-prod-gate -- --date=2026-04-28
```

Team Email SMTP:

```bash
pnpm mail:smoke:e2e
pnpm test -- --runInBand tests/integration/flow-mail-api-send.test.mjs
```

Team 1 / Gate authority:

```bash
pnpm typecheck:pay
pnpm test:pay
pnpm report:pay-prod-gate -- --date=2026-04-28
```

## 6. Founder Review Scope

Founder review should focus on four concrete approvals:

1. Approve P9 Path B deploy state as closed for inbound dedup scope.
2. Push Team 2 to put canonical API key into production runtime.
3. Confirm mailbox/alias/inbound proof list required before email live-close.
4. Keep `BCC=OFF` until proof packet includes Gmail + Outlook + internal inbox evidence.

## 7. Source References

- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-28.md`
- `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-28.md`
- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.md`
- `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.md`
- `docs/iai-mail-platform/MAIL_IAI_ONE_PUBLIC_SEND_LIVE_VERDICT_2026-04-24.md`
- `docs/iai-mail-platform/MAIL_IAI_ONE_INBOUND_WEBHOOK_PATH_B_DEPLOY_COMPLETE_2026-04-28.md`
- `docs/reports/teamd/TRANHATAM_COM_PAYMENT_EVENT_CALLBACK_AND_MAIL_PROOF_2026-04-24.md`

END
