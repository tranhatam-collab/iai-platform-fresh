# TEAM D DAILY OPS 2026-04-23

- Team: Team D Payments Activation + Treasury Ops
- Date: 2026-04-23
- Source of truth:
  - `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`
  - `docs/PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md`
  - `docs/reports/teamd/TRANHATAM_COM_PAYMENT_EMAIL_LIVE_CHECKLIST_2026-04-22.md`
  - `docs/reports/teamd/OMDALAT_COM_PAYMENT_EMAIL_LIVE_CHECKLIST_2026-04-23.md`
  - `docs/reports/teamd/OMDALAT_COM_P0_PAYMENT_ACTIVATION_PACKET_2026-04-23.md`
- pay lane gate state:
  - `LOCK_RETAINED_WITH_REASON`
- live claim state:
  - `NO_READY_FOR_LIVE_CLAIM`

## TODAY DONE

- repo-side pay-to-mail adapter is implemented:
  - `apps/pay/src/payment-email-outbound-adapter.ts`
- guarded internal handoff route is implemented:
  - `POST /internal/payment-email/send`
- route is fail-closed unless the runtime has:
  - `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
  - `MAIL_API_KEY`
  - `MAIL_API_WORKSPACE_ID`
- `tranhatam.com` board/checklist now reflects the correct state:
  - mail public hostname blocker closed
  - repo-side adapter closed
  - internal handoff route closed
  - live send evidence still missing
- `tranhatam.com` P0 execution packet and evidence checker were added:
  - `docs/reports/teamd/TRANHATAM_COM_P0_PAYMENT_ACTIVATION_PACKET_2026-04-23.md`
  - `docs/reports/teamd/TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_2026-04-23.json`
  - `scripts/pay-team-d-tranhatam-evidence-check.mjs`
- `omdalat.com` payment activation was started with Thai Lam as the locked company owner and receiver:
  - legal owner: `Công ty TNHH SX - TM - DV Thai Lam`
  - primary receiver: `recv_vnd_thailam_acb`
  - VND route assignment: `ACTIVE_NOW`
  - `app.omdalat.com` remains deferred until checkout-surface ownership is confirmed
- `vc.vetuonglai.com`, `invest.vetuonglai.com`, and `life.vetuonglai.com` are now locked as dual-rail:
  - legal owner for VND lane: `Công ty TNHH ĐTTM Thanh Tam Phat`
  - VND receiver: `recv_vnd_thanhtamphat_acb`
  - USD receiver: `recv_usd_angeledutam_foundation_relay_thread` (Relay/Thread)
  - checkout policy wired: `VN-issued ID -> VND`, `non-VN ID -> USD`
- `omdalat.com` P0 execution packet and evidence checker were added:
  - `docs/reports/teamd/OMDALAT_COM_P0_PAYMENT_ACTIVATION_PACKET_2026-04-23.md`
  - `docs/reports/teamd/OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_2026-04-23.json`
  - `docs/reports/teamd/OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_2026-04-23.md`
  - `scripts/pay-team-d-omdalat-evidence-check.mjs`
- team đã có smoke script cho payment email form/template/handoff theo domain:
  - `scripts/pay-team-d-email-flow-smoke.mjs`
  - `node scripts/pay-team-d-email-flow-smoke.mjs --domain=omdalat.com --date=2026-04-23`
  - report: `docs/reports/teamd/PAY_TEAM_D_OMDALAT_COM_EMAIL_FLOW_SMOKE_2026-04-23.md`
- receiver registry, routing resolver, activation registry, intake board, prep registry, and tests now reflect `omdalat.com` -> Thai Lam / ACB assignment.
- tests rerun:
  - `pnpm typecheck:pay` -> `PASS`
  - `pnpm test:pay` -> `PASS (57/57)`
  - `node scripts/pay-team-d-email-flow-smoke.mjs --domain=omdalat.com --date=2026-04-23` -> `PASS`
  - `node scripts/pay-team-d-email-flow-smoke.mjs --domain=tranhatam.com --date=2026-04-23` -> `PASS`
  - `node --test tests/integration/pay-team-d-intake-board.test.mjs` -> `PASS (6/6)`
  - `node scripts/pay-team-d-tranhatam-evidence-check.mjs --date=2026-04-23` -> `PASS / live claim blocked`
  - `node scripts/pay-team-d-omdalat-evidence-check.mjs --date=2026-04-23` -> `PASS / live claim blocked`
  - `node scripts/pay-team-d-intake-board-check.mjs --date=2026-04-23` -> `PASS`
  - `pnpm report:team2-pay-prod-probe -- --date=2026-04-23` -> generated, required production checkout signals still red in Team 1 gate
  - `pnpm report:team2-pay-shared-runtime-probe -- --date=2026-04-23` -> generated, required shared-runtime signals still red in Team 1 gate
  - `pnpm report:pay-prod-gate -- --date=2026-04-23` -> `FAIL / LOCK_RETAINED_WITH_REASON`

## PERCENT STATUS

| lane | current_percent | meaning |
|---|---:|---|
| `pay.iai.one repo/control/test` | `92%` | code, docs, routing, templates, adapter, and guarded internal route are green; live deployment/evidence remains outside this repo checkpoint |
| `tranhatam.com payment activation` | `68%` | founder receiver routing and email packet are locked; adapter exists; still missing runtime secrets, mailbox truth, live trigger, provider ref, messageId, D1 row, inbox proof |
| `omdalat.com payment activation` | `64%` | legal owner and Thai Lam VND receiver are locked, routing/tests are green, and evidence packet exists; still missing mailbox truth, runtime secrets, payment proof, messageId, D1 row, and inbox proof |
| `vetuonglai.com payment cluster activation` | `69%` | dual-rail assignment is locked for vc/invest/life (VND Thành Tâm Phát + USD Relay/Angel Edu Tam) and id-country policy is wired; still missing mailbox truth, runtime secrets, risk closure for invest, payment proof, messageId, D1 row, and inbox proof |
| `Team D all-site intake prep` | `79%` | all 17 rows and per-site email packets are present; `tranhatam.com`, `omdalat.com`, `vc.vetuonglai.com`, `invest.vetuonglai.com`, and `life.vetuonglai.com` now have active receiver assignments, while most remaining sites still need owner, receiver, callback, and mailbox proof |
| `production live payment gate` | `50%` | probes and gate artifacts exist, but required production and shared-runtime signals are still red, and `LOCK_RETAINED_WITH_REASON` remains |

## TIME ESTIMATE

Assuming required external truth is provided cleanly:

| scope | estimate_after_inputs_are_ready | blocking_input |
|---|---:|---|
| `tranhatam.com` sandbox/live proof loop | `2-4 hours` | mailbox aliases, MAIL_API secrets, internal route secret, live/sandbox provider action, D1 evidence path |
| `omdalat.com` sandbox/live proof loop | `2-4 hours` | mailbox aliases, MAIL_API secrets, internal route secret, live/sandbox provider action, D1 evidence path |
| first 3-5 prepared `P0/P1` sites | `1-2 working days` | legal owner truth, receiver assignment, callback URLs, mailbox ownership, finance review |
| all 17 Team D rows to staging-ready packets | `3-7 working days` | business truth and treasury data arrival speed |
| `READY_FOR_LIVE` across sites | not date-claimable yet | production pay gate must flip from `LOCK_RETAINED` and each site needs evidence |

## ACTIVE BLOCKERS

| blocker | owner | current_status | next_action |
|---|---|---|---|
| mailbox or alias truth for `pay@`, `billing@`, `support@`, `noreply@` | Team D + Team Email | `PENDING` | bind and document mailbox/alias ownership per domain |
| inbound routing truth and inbox proof | Team Email + Team SMTP | `PENDING` | prove Gmail/Outlook/internal inbox receive path for each payment sender package |
| pay runtime mail secrets | Team B + Team Email | `PENDING` | set `MAIL_API_BASE_URL`, `MAIL_API_KEY`, `MAIL_API_WORKSPACE_ID`, `PAY_EMAIL_ADAPTER_INTERNAL_KEY` |
| live payment event trigger | Team B | `PENDING` | wire checkout/webhook payment event to `POST /internal/payment-email/send` |
| provider action proof | Team B + Provider/Ops | `PENDING` | run real or true sandbox checkout and capture provider reference |
| D1 or canonical evidence row | Team B + Team 1 | `PENDING` | store provider ref, mail messageId, domain, template id, and event status |
| production gate | Team 1 + Team B | `LOCK_RETAINED` | rerun gate only after checkout URL, provider ref, no-214, shared runtime, and mail evidence are green |
| Team 1 gate verdict and snapshot for 2026-04-23 | Team 1 | `PRESENT_RED` | keep `LOCK_RETAINED_WITH_REASON` until all production and shared-runtime signals are green |
| Team 2 prod runtime probe for 2026-04-23 | Team 2 | `PRESENT_RED` | fix production checkout/runtime until Team 1 required signals turn green |
| Team 2 shared runtime probe for 2026-04-23 | Team 2 | `PRESENT_RED` | deploy shared runtime contract until Team 1 required shared signals turn green |

## ROW DELTA

| intake_id | domain | current_status | delta_today | next_action |
|---|---|---|---|---|
| `SITE-INTAKE-100` | `tranhatam.com` | `FORM_IN_PROGRESS` | repo-side adapter and guarded internal send route closed | bind runtime/mailbox/provider evidence and run sandbox/live proof |
| `SITE-INTAKE-101` | `nguyenlananh.com` | `FORM_IN_PROGRESS` | no live assignment change | lock legal owner, merchant mapping, callback URLs, mailbox ownership |
| `SITE-INTAKE-102` | `omdala.com` | `FORM_IN_PROGRESS` | no live assignment change | lock one-time VN scope, owner, sender mailbox, return/cancel/callback URLs |
| `SITE-INTAKE-103` | `app.omdala.com` | `FORM_IN_PROGRESS` | no live assignment change | confirm whether app is checkout surface or post-purchase surface |
| `SITE-INTAKE-104` | `omdalat.com` | `FORM_IN_PROGRESS` | legal owner and Thai Lam VND receiver locked; evidence packet/checker added | bind mailbox ownership, runtime mail secrets, live surface trigger, provider proof, D1 row, and inbox proof |
| `SITE-INTAKE-105` | `app.omdalat.com` | `FORM_IN_PROGRESS` | no live assignment change | confirm checkout role and callback ownership |
| `SITE-INTAKE-106` | `flow.iai.one` | `FORM_SELECTION_REQUIRED` | no live assignment change | choose VN or international rail and commercial model |
| `SITE-INTAKE-107` | `life.iai.one` | `FORM_SELECTION_REQUIRED` | no live assignment change | lock product model, owner truth, payout need, market type |
| `SITE-INTAKE-108` | `vc.vetuonglai.com` | `FORM_IN_PROGRESS` | legal owner and dual-rail receivers locked (VND Thành Tâm Phát + USD Relay/Angel Edu Tam), id-country policy wired | bind mailbox ownership, runtime mail secrets, live surface trigger, provider proof, D1 row, and inbox proof |
| `SITE-INTAKE-109` | `invest.vetuonglai.com` | `FORM_IN_PROGRESS` | legal owner and dual-rail receivers locked (VND Thành Tâm Phát + USD Relay/Angel Edu Tam), id-country policy wired | close risk lane, then bind mailbox/runtime/proof packet and capture provider evidence |
| `SITE-INTAKE-110` | `life.vetuonglai.com` | `FORM_IN_PROGRESS` | legal owner and dual-rail receivers locked (VND Thành Tâm Phát + USD Relay/Angel Edu Tam), id-country policy wired | confirm collection role for this phase, then bind mailbox/runtime/proof packet and capture provider evidence |
| `SITE-INTAKE-111` | `aiaccountingloop.com` | `FORM_IN_PROGRESS` | no live assignment change | lock international legal owner and collection/payout truth |
| `SITE-INTAKE-112` | `tramsaigon.com` | `NEW_INTAKE` | no live assignment change | lock paid offers and owner truth first |
| `SITE-INTAKE-113` | `app.iai.one` | `FORM_SELECTION_REQUIRED` | no live assignment change | confirm direct collection need |
| `SITE-INTAKE-114` | `noos.iai.one` | `FORM_SELECTION_REQUIRED` | no live assignment change | lock first commercial wave and settlement model |
| `SITE-INTAKE-115` | `cios.iai.one` | `BLOCKED` | no live assignment change | wait for product/policy closure |
| `SITE-INTAKE-116` | `lamviec.muonnoi.org` | `BLOCKED` | no live assignment change | wait for recurring/subscription compatibility decision |

## TEAM MESSAGE

Team D update 2026-04-23:

- `tranhatam.com` has repo-side receiver routing, sender package, payment templates, pay-to-mail adapter, and guarded internal handoff route ready.
- `tranhatam.com` now has a dedicated P0 evidence packet and machine checker.
- `omdalat.com` is now attached to `Công ty TNHH SX - TM - DV Thai Lam` with primary VND receiver `recv_vnd_thailam_acb`.
- `omdalat.com` routing, intake row, prep registry, P0 packet, evidence JSON, evidence status, and tests are ready.
- `app.omdalat.com` remains deferred and must not inherit this activation automatically.
- `vc.vetuonglai.com`, `invest.vetuonglai.com`, and `life.vetuonglai.com` are now locked as dual-rail: VND via `recv_vnd_thanhtamphat_acb` (Thành Tâm Phát) and USD via `recv_usd_angeledutam_foundation_relay_thread` (Angel Edu Tam Foundation Inc / Relay-Thread).
- ID-country policy is now wired in pay runtime for this cluster: `VN-issued ID -> VND`, `non-VN ID -> USD`.
- The Về Tương Lai cluster is now active at receiver-assignment level but still blocked from live claim until mailbox/runtime/provider evidence is complete.
- Do not claim `payment email live` yet.
- Remaining live proof items:
  - mailbox/alias truth
  - inbound routing truth
  - `MAIL_API_*` and `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
  - live/sandbox payment event trigger
  - provider ref
  - mail `messageId`
  - D1/canonical evidence row
  - inbox proof
- Current estimate after all external inputs are ready: `2-4 hours` for the `tranhatam.com` proof loop.
- Current estimate after all external inputs are ready: `2-4 hours` for the `omdalat.com` proof loop.
- Current all-site payment readiness: `79% intake prep`, `50% live gate`.
- Fresh Team 1 gate artifact for 2026-04-23 remains `FAIL / LOCK_RETAINED_WITH_REASON`.
- Team 2 production and shared-runtime probe artifacts are present but still red in Team 1 gate evaluation.

## TEST PROOF

- `pnpm typecheck:pay` -> `PASS`
- `pnpm test:pay` -> `PASS (55/55)`
- `node --test tests/integration/pay-team-d-intake-board.test.mjs` -> `PASS (6/6)`
- `node scripts/pay-team-d-tranhatam-evidence-check.mjs --date=2026-04-23` -> `PASS / live claim blocked / activation evidence incomplete`
- `node scripts/pay-team-d-omdalat-evidence-check.mjs --date=2026-04-23` -> `PASS / live claim blocked / activation evidence incomplete`
- `node scripts/pay-team-d-intake-board-check.mjs --date=2026-04-23` -> `PASS`
- `pnpm report:team2-pay-prod-probe -- --date=2026-04-23` -> `GENERATED / required production checkout signals remain red`
- `pnpm report:team2-pay-shared-runtime-probe -- --date=2026-04-23` -> `GENERATED / required shared-runtime signals remain red`
- `pnpm report:pay-prod-gate -- --date=2026-04-23` -> `FAIL / LOCK_RETAINED_WITH_REASON`

## COMMIT HASH

- `WORKTREE_UNCOMMITTED`
