# TRANHATAM_COM_PAY_TEAM_API_KEY_PROVISION_ASK_2026-04-25

> **SUPERSEDED on 2026-04-25** by
> `docs/reports/team1/TRANHATAM_COM_PAY_TEAM_WEBHOOK_AND_SECRET_ASK_2026-04-25.md`.
> The API-key path is no longer the gating item for tenant `tranhatam`.
> Remaining pay-side surface is: (1) ship outbound webhook implementation per
> α/α contract, (2) issue `PAYMENT_WEBHOOK_SECRET` after ship.
> Do not act on this file — kept only for traceability.

- Date: `2026-04-25`
- From: `tranhatam.com` site owner (Team D + repo-side Codex on behalf of site)
- To: Team B Pay Runtime (`pay.iai.one`) + Team 2 Runtime/Platform
- Scope: single-question handoff — provisioning of `PAY_IAI_ONE_API_KEY` for tenant `tranhatam`
- Reporting: required per `AI_TEAM_SYSTEM_TEAM_BROADCAST_TRANHATAM_COM_2026-04-24.md`

## 1. The single question

> Khi nào team có thể cấp `PAY_IAI_ONE_API_KEY` cho tenant `tranhatam.com`?
> Đây là blocker duy nhất để chúng tôi deploy production.
> Outbound webhook + secret chúng tôi có thể chờ vì đã có path workaround.

## 2. Why this is the only remaining blocker

State accepted as of `2026-04-25`:

- payOS merchant + channel `tranhatam` is `Đang hoạt động` (live-active) — see
  `docs/reports/team2/TEAM2_TRANHATAM_PAYOS_CHANNEL_ACTIVATION_2026-04-24.md`.
- `pay.iai.one` production D1 `provider_accounts` row inserted for tenant
  `ten_2e0143ae028a7a3c` (`pa_tranhatam_payos_live_20260424`, `live_mode=1`,
  `status=active`).
- Real payOS checkout URL was generated and verified publicly reachable
  (`HTTP 308 → 200`).
- Repo-side payment routing, receiver mapping, mail template registry, and
  guarded pay-to-mail handoff route are closed in repo.
- Outbound webhook ingress + signed callback secret are still open, but
  `tranhatam.com` site has a documented workaround path and accepts waiting
  on those items.

The remaining gate is the canonical `pay.iai.one` runtime probe documented at
`docs/reports/team2/TEAM2_TRANHATAM_PAYOS_CHANNEL_ACTIVATION_2026-04-24.md:38-54`:

```bash
TEAM2_PAY_GATE_BASE_URL="https://pay.iai.one" \
TEAM2_PAY_GATE_TENANT_CODE="tranhatam" \
TEAM2_PAY_GATE_SITE_CODE="tranhatam" \
TEAM2_PAY_GATE_API_KEY="$TEAM2_PAY_GATE_API_KEY" \
pnpm report:team2-pay-prod-probe -- --date=2026-04-24
```

This probe must produce:

- `checkout_url_non_null = PASS`
- `payment_link_id_non_null = PASS`
- `no_214 = PASS`

Without a valid `PAY_IAI_ONE_API_KEY` (the value to be exported as
`TEAM2_PAY_GATE_API_KEY`) for tenant `tranhatam`, the probe cannot run, and
production deploy of `tranhatam.com` cannot proceed.

## 3. Exact ask (acceptance criteria)

Team B Pay Runtime please return one packet containing:

1. `tenant_code` — `tranhatam`
2. `tenant_id` — `ten_2e0143ae028a7a3c` (must match existing
   `provider_accounts.tenant_id`)
3. `api_key_id` — opaque identifier for the issued key
4. `api_key_value` — the secret itself, delivered out-of-band (not in this repo)
5. `scopes` — minimum: create-payment-session, read-payment-session
6. `environment` — `production`
7. `expires_at` — ISO timestamp or `never`
8. `issued_by` — Team B operator name
9. `issued_at` — ISO timestamp
10. `rotation_runbook_ref` — pointer to existing rotation runbook

Delivery channel: same out-of-band channel used for prior production secrets
(do not commit the key into the repo, do not paste into shared chat).

## 4. What we explicitly do NOT need in this round

- Outbound webhook ingress route on `apps/pay/src/server.ts` — can wait.
- Signed callback secret — can wait.
- Persisted `provider_reference` + mail `message_id` evidence row writer in
  `apps/pay` — already tracked in
  `docs/reports/team1/TRANHATAM_COM_NON_TEAMD_GAP_AND_RESPONSIBILITY_MATRIX_2026-04-24.md`
  and not blocking deploy.

## 5. Once the key is delivered (commitment from requester side)

1. Team 2 re-runs the probe command in §2.
2. Team 2 publishes `TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-25.json` with the
   three PASS fields.
3. Team 1 issues the next gate verdict.
4. `tranhatam.com` production deploy proceeds.
5. The remaining outbound webhook + secret + persistence work continues on
   its own track and does not block this deploy.

## 6. Session report shape (Team B Pay Runtime, after this ask is closed)

```text
# SESSION REPORT
- Team: Team B Pay Runtime
- Date: 2026-04-2x
- Lane: tenant API key provisioning (tranhatam)
- Objective for this session: issue PAY_IAI_ONE_API_KEY for tenant tranhatam

## Done
- 

## Verification
- command/result

## Blockers
- blocker
- blocker_owner

## Next action
- 

## Current state
- one of: PLANNED / IN_PROGRESS / BLOCKED / REVIEW_READY / EVIDENCE_PENDING / DONE
```

## 7. Evidence basis for this ask

- `docs/reports/team2/TEAM2_TRANHATAM_PAYOS_CHANNEL_ACTIVATION_2026-04-24.md`
- `docs/reports/team1/TRANHATAM_COM_NON_TEAMD_GAP_AND_RESPONSIBILITY_MATRIX_2026-04-24.md`
- `docs/reports/team1/AI_TEAM_SYSTEM_TEAM_BROADCAST_TRANHATAM_COM_2026-04-24.md`
- `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md` (row
  `SITE-INTAKE-100`)
