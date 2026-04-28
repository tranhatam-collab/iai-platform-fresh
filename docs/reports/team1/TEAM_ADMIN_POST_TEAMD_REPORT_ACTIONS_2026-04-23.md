# TEAM_ADMIN_POST_TEAMD_REPORT_ACTIONS_2026-04-23

- Team: Team 1 Program Root / Codex Coordination
- Date: 2026-04-23
- Source report: `docs/reports/teamd/DAILY_TEAMD_2026-04-23.md`
- Purpose: kiểm tra báo cáo Team D, nhắc hoàn tất, và cập nhật việc tiếp theo cho các team liên quan sau khi pay-to-mail adapter đã có trong repo

## 1. Verification result

Team D report is accepted with one important boundary:

- repo-side adapter and guarded internal route are now real
- Team D intake board is still clean
- payment email live is not complete
- production payment gate is still locked
- Team 1 manual gate note for `2026-04-23` is still missing

Verified locally:

- `pnpm typecheck:pay` -> `PASS`
- `pnpm test:pay` -> `PASS (49/49)`
- `node --test tests/integration/pay-team-d-intake-board.test.mjs` -> `PASS (4/4)`
- `node scripts/pay-team-d-intake-board-check.mjs --date=2026-04-23 --no-write` -> `PASS`
- `pnpm report:pay-prod-gate -- --date=2026-04-23` -> `FAIL / LOCK_RETAINED_WITH_REASON`

## 2. Current production blockers

The current blockers are not missing local test coverage.

The active blockers are:

- `PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-23.md` or `PAY_IAI_ONE_GATE_VERDICT_2026-04-23.md` is missing
- production checkout probe still returns `401 API_KEY_REQUIRED`
- `checkout_url` is still `null`
- `payment_link_id` is still `null`
- production gate is not green
- production `/health` still has `legacy_or_unknown` shape
- production `/health` does not expose `shared_read_model`
- production `/health` does not expose `shared_upstream_runtime`
- payment email live proof is still missing `messageId`, D1/canonical evidence row, and inbox proof

## 3. Reminder to Team D

Team D must not claim `READY_FOR_LIVE` for any row while pay gate remains locked.

Team D must complete the following for `tranhatam.com` first:

1. bind mailbox or alias truth for:
   - `pay@tranhatam.com`
   - `billing@tranhatam.com`
   - `support@tranhatam.com`
   - `noreply@tranhatam.com`
2. confirm inbound routing truth for:
   - replies
   - support
   - billing
   - bounce
   - complaint
3. confirm runtime secret ownership path for:
   - `MAIL_API_BASE_URL`
   - `MAIL_API_KEY`
   - `MAIL_API_WORKSPACE_ID`
   - `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
4. coordinate one real or true sandbox payment action
5. capture provider reference
6. capture mail `messageId`
7. capture D1 or canonical evidence row
8. capture inbox proof
9. keep `noreply@tranhatam.com` excluded from payment sending

Team D must keep all other rows honest:

- P0/P1 rows can remain `FORM_IN_PROGRESS` only if legal owner, receiver assignment, callback URLs, mailbox ownership, and finance review are still incomplete
- rows with unknown market type must stay `FORM_SELECTION_REQUIRED`
- blocked rows must not be pushed into technical mapping
- `life.iai.one` must not be advanced through Team D if it is being split to a separate team lane

## 4. Task update for Team 1

Team 1 must produce one of these files for `2026-04-23`:

- `docs/reports/team1/PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-23.md`
- `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-23.md`

The note must state:

- whether Team 1 accepts the Team 2 probes
- why `401 API_KEY_REQUIRED` is still present
- whether the missing shared runtime health contract is a deploy issue or config issue
- whether `LOCK_RETAINED_WITH_REASON` remains active
- the exact condition for the next rerun

Team 1 must not flip the gate until all required signals are green.

## 5. Task update for Team 2

Team 2 must not rerun blindly.

Team 2 must first fix:

- canonical production key/header binding
- production internal checkout auth contract
- deployed `/health` shape for shared runtime
- production deploy carrying `shared_read_model`
- production deploy carrying `shared_upstream_runtime`

After that, Team 2 must rerun:

- `pnpm report:team2-pay-prod-probe -- --date=2026-04-23`
- `pnpm report:team2-pay-shared-runtime-probe -- --date=2026-04-23`
- `pnpm report:pay-prod-gate -- --date=2026-04-23`
- `pnpm test:pay`

The rerun is only useful if:

- `auth_key_present = PASS`
- `checkout_url_non_null = PASS`
- `payment_link_id_non_null = PASS`
- `production_gate_green = PASS`
- `shared_read_model_ready_for_shared_only = PASS`
- `shared_upstream_active_read_mode_shared_contract = PASS`
- `shared_upstream_release_gate_ready = PASS`

## 6. Task update for Team B / Pay runtime

Team B owns the next runtime integration step.

Team B must wire the actual payment event source to:

- `POST /internal/payment-email/send`

Required behavior:

- use `x-pay-email-adapter-key`
- send the locked payment template id
- send source domain
- send order id
- send provider reference
- send message idempotency key
- persist the returned mail `message_id`
- write the provider reference and mail `message_id` into the canonical evidence row

Team B must not claim payment email live until provider ref, mail `messageId`, D1/canonical row, and inbox proof all exist.

## 7. Task update for Team Email SMTP

Team Email SMTP must complete the live mail side.

Required outputs:

- mailbox or alias truth
- sender binding
- workspace binding
- `MAIL_API_KEY` handoff path
- inbound route truth
- Gmail proof
- Outlook proof
- internal inbox proof
- proof that `/v1/send` returns accepted response with `message_id`
- DB/log evidence mapped to the same `message_id`

`BCC` remains `OFF`.

Founder or personal mailboxes are not valid proof senders.

## 8. Task update for Team 5

Team 5 must stay ready but must not claim synchronized live.

Team 5 only reruns synchronized-live readiness after:

- Team 1 produces a new gate verdict
- pay gate flips
- production gate signals are green

## 9. Acceptance criteria for the next checkpoint

The next checkpoint is acceptable only when:

1. Team 1 gate note for `2026-04-23` exists
2. Team 2 production checkout probe no longer returns `401 API_KEY_REQUIRED`
3. production `/health` exposes `shared_read_model`
4. production `/health` exposes `shared_upstream_runtime`
5. `tranhatam.com` mailbox and sender truth is locked
6. payment event trigger calls `POST /internal/payment-email/send`
7. one true sandbox or live payment has provider ref
8. mail API returns `message_id`
9. D1 or canonical evidence row stores the provider ref and `message_id`
10. inbox proof exists

Until all ten conditions are true, the only correct state is:

`repo/test green, activation packet improving, production gate locked, no live claim`.
