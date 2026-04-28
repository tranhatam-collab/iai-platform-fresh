# TRANHATAM_COM_PAY_EMAIL_REPO_CLOSEOUT_2026-04-27

Version: 1.0

Date: 2026-04-27

Author: AI Owner Pay+Email (Claude) — Agent 1 per `IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26.md`

Scope: Verdict cuối cho phần repo-side của lane email + pay cho `tranhatam.com` mà AI Owner Pay+Email được phép đóng. Đây không phải verdict cho `LIVE_SYNC` — verdict đó vẫn `LIVE_SYNC_BLOCKED` theo `docs/reports/teamd/TRANHATAM_COM_LIVE_SYNC_BLOCKERS_2026-04-26.md`.

Liên quan đọc trước:

- `IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md`
- `docs/reports/teamd/TRANHATAM_COM_LIVE_SYNC_BLOCKERS_2026-04-26.md`
- `docs/reports/teamd/TRANHATAM_COM_PAYMENT_EMAIL_LIVE_CHECKLIST_2026-04-22.md`
- `docs/reports/team1/TRANHATAM_COM_PAY_TEAM_ASK_BROADCAST_PACKET_2026-04-25.md` (untracked, Codex territory)
- `docs/reports/pay-email-agent/TRANHATAM_COM_PAY_TEAM_ASK_BROADCAST_ITEM_1_CLOSED_UPDATE_2026-04-26.md`
- `docs/PAY_IAI_ONE_TEAM_ASK_REGISTRY_2026.md` (ask-pay-001 RESOLVED)

⸻

## 1. Repo-side state cho `tranhatam.com` — done

Kiểm tra ngày `2026-04-27` sau clean rebuild toàn stack:

| Surface | Trạng thái | Evidence |
| --- | --- | --- |
| Centralized payment routing | DONE | `apps/pay/src/payment-routing.ts` — receiver `recv_vnd_personal_tranhatam_acb` (primary VND ACB), `recv_vnd_personal_tranhatam_vcb` (fallback VND VCB), `recv_usd_personal_tranhatam_paypal` (USD), founder-locked active assignment status `ACTIVE_NOW` |
| ID-country currency policy | DONE | `02df6b4` — `idCountry?: string \| null` trên `PaymentRoutingQuery`, override `VN_ID_REQUIRES_VND` / `NON_VN_ID_REQUIRES_USD` |
| Sender package lock | DONE | `pay@tranhatam.com` (receipts), `billing@tranhatam.com` (billing/failed/refund), `support@tranhatam.com` (reply-to), `noreply@tranhatam.com` (banned for payment) |
| Payment email template registry | DONE | `apps/pay/src/payment-email-templates.ts` + `apps/pay/src/team-d-payment-email-profiles.ts` — 4 flow VI/EN bilingual: `payment_receipt`, `checkout_status_update`, `payment_failed_notice`, `refund_notice` |
| Pay → Mail outbound adapter | DONE | `apps/pay/src/payment-email-outbound-adapter.ts` + locked contract `docs/PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md` |
| Outbound payment-completion webhook sender | DONE | `apps/pay/src/payment-webhook-outbound-sender.ts` + `apps/pay/src/payment-webhook-tenant-registry.ts` — shipped `b69292a` + `6cb0705` (auto-dispatch from `/internal/payment-event/callback` terminal success) |
| Internal payment evidence store | DONE | `apps/pay/src/payment-event-evidence-store.ts` — guarded `/internal/payment-event/callback` route + canonical D1-shape row |
| Site activation registry | DONE | `apps/pay/src/site-activation-registry.ts` — `tranhatam.com` SITE-INTAKE-100, `FORM_IN_PROGRESS`, founder-locked active assignment |
| Late-signal note on expired checkout shell | DONE | `2326795` — bilingual VI/EN line "Hết hạn không có nghĩa..." / "Expired does not mean..." |
| Wave 2 internal alert content lock | DONE | `93ef8c2` — `packages/mail-core/src/wave2-internal-alerts.ts` (`low_risk_internal_alert`, `low_volume_notification` bilingual, escapes HTML, idempotency-keyed) |
| Wave 1/3 content artifact tracker | DONE | `MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md` — 5 Wave 1 + 4 Wave 3 flows mapped, content artifact rows annotated |

Test verification ngày `2026-04-27`:

- `pnpm test:pay` → 59/59 PASS
- `pnpm test:mail-smtp` → 16/16 PASS
- `pnpm test:mail-worker` → 3/3 PASS
- `pnpm test:flow` → 24/24 PASS
- `node --test tests/integration/wave2-internal-alerts.test.mjs` → 4/4 PASS

ask-pay-001 (9 "content-gap" failures observed on 2026-04-26) đã được close là **stale-dist false alarm**. Sau clean rebuild của `packages/config/dist` (đã empty 11 bytes — broken incremental TypeScript build artifact) và `apps/pay/dist`, tất cả 59 test pass mà không cần code change. Chi tiết trong `PAY_IAI_ONE_TEAM_ASK_REGISTRY_2026.md` row `ask-pay-001`.

⸻

## 2. Repo-side state — không phải scope của Pay+Email Agent

Cần escalate (không tự sửa):

| Surface | Owner agent | Trạng thái | Note |
| --- | --- | --- | --- |
| `packages/config/dist/env.d.ts` build incremental có thể empty (11 bytes) sau iCloud sync | infra / Codex (cross-cutting) | OPEN risk | Today fix was clean rebuild; root cause của TypeScript composite build sinh ra empty `.d.ts` chưa rõ. Có thể do `dist/.tsbuildinfo` mismatch sau iCloud sync. Đề xuất: `dist/.tsbuildinfo` được .gitignore + Codex auto-clean dist trước build. |
| Repo git state (HEAD ref di chuyển sang commit `1915ab4` có tree `b6802f8b...` chỉ chứa `trust-iai-one-starter/` — các tree khác bị mất + missing object `02df6b4`) | Codex (Team 1 git ops) | OPEN — repo corrupt | `git status` trả `fatal: unable to read tree (e89f2f4991...)`. Branch tip mới có tree không đầy đủ — sẽ wipe mọi `apps/`, `packages/`, `docs/` nếu ai đó `git checkout`. **Không được push branch `OMCODE/smtp-internal-first-phase1` cho đến khi Codex restore từ reflog HEAD@{1} (`33c9fe3`)** + cleanup iCloud-renamed bad refs. |

⸻

## 3. Founder/external action vẫn còn block — không phải repo-side

Theo `TRANHATAM_COM_LIVE_SYNC_BLOCKERS_2026-04-26.md`, lane vẫn ở `LIVE_SYNC_BLOCKED` vì:

### 3.1 Missing secrets

Production:

- `PAYMENT_WEBHOOK_SECRET` — Team B Pay Runtime generate sau Item 1 merged + dry-run xanh (Item 1 đã CLOSED commit `b69292a` + `6cb0705` + `02df6b4` + `2326795`)
- `MAIL_API_WEBHOOK_SECRET` — Team Email + SMTP rotate khi cần và export vào pay runtime + `tranhatam.com` runtime

Sandbox:

- `PAYMENT_WEBHOOK_SECRET` — same người, same flow

### 3.2 Missing live proof

- `PROVIDER_PAYMENT_PROOF_MISSING` — Team B + Team D phải chạy 1 real or sandbox checkout flow trên `tranhatam.com` qua payOS, capture provider_ref và checkout_url
- `MESSAGE_ID_PROOF_MISSING` — Team Email + SMTP phải nhận payload outbound từ pay, gửi qua mail.iai.one, return real `message_id`, persist vào D1 row
- `INBOX_PROOF_MISSING` — Team Email + SMTP phải capture raw header + screenshot inbox của `tranhatam@gmail.com` + 1 outlook mailbox + 1 internal mailbox sau action thật

### 3.3 Mailbox / alias binding

- `pay@tranhatam.com`, `billing@tranhatam.com`, `support@tranhatam.com`, `noreply@tranhatam.com` — phải được tạo thật trên mailcow + sender identity bind

### 3.4 Live surface wiring

- `tranhatam.com` web surface (apps/web hoặc tenant repo riêng) phải nối live event trigger → `https://pay.iai.one/internal/payment-event/callback` với `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
- `MAIL_API_BASE_URL` + `MAIL_API_KEY` + `MAIL_API_WORKSPACE_ID` + `PAY_EMAIL_ADAPTER_INTERNAL_KEY` set trong runtime của `tranhatam.com`

⸻

## 4. Folder evidence — chuẩn bị sẵn cho Founder/teams

Khi mỗi external blocker close, evidence land vào:

```
docs/release-evidence/pay.iai.one/2026-MM-DD/tranhatam.com/
  manifest.md                          ← provider_ref, message_id, amount, currency, timestamp
  checkout-screenshot.png              ← payOS screenshot or real-action proof
  provider-response.json               ← payOS API response (sanitized, no secret)
  d1-readback.json                     ← pay D1 row export
  mail-readback.json                   ← messages + message_events + delivery_attempts
  inbox-proof-pay@tranhatam.com.eml    ← raw header + body
  inbox-proof-customer-gmail.png       ← screenshot Gmail inbox
  inbox-proof-customer-outlook.png     ← screenshot Outlook inbox (optional)
```

AI Owner Pay+Email sẽ verify từng file theo evidence rule và update `PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md` row `SITE-INTAKE-100` tới `READY_FOR_LIVE` khi đủ.

⸻

## 5. Verdict

**Repo-side cho `tranhatam.com` email + pay: CLOSED.**

Không còn item nào AI Owner Pay+Email có thể đóng trong repo cho `tranhatam.com`. Tất cả surface đã ship, test xanh, contract khóa, content lock, adapter sẵn sàng nhận live action.

**Live-side cho `tranhatam.com`: STILL BLOCKED.**

5 nhóm action ngoài repo (secrets, provider proof, message_id proof, inbox proof, mailbox binding + live runtime wiring) thuộc Team B Pay Runtime + Team D Payments Activation + Team Email + Team SMTP + Founder. AI Owner sẽ flip row khi evidence đủ, không tự bấm.

⸻

## 6. Cross-agent visibility

Closeout này được public dưới `docs/reports/pay-email-agent/` để Codex / Team 1 / Team B / Team D / Team Email + SMTP đều thấy mà không phải dò git log. Khi Codex restore git state, có thể fold reference vào DAILY_TEAM1 hoặc broadcast packet next pass.

⸻

## 7. Change log

- 2026-04-27 v1.0 — closeout đầu tiên cho repo-side `tranhatam.com` email + pay; verify 4 lane test suite all pass; ghi nhận git corruption blocking new commits cho đến khi Codex restore.
