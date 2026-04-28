# TRAMSAIGON_COM_PAY_EMAIL_REPO_CLOSEOUT_2026-04-28

Version: 1.0

Date: 2026-04-28

Author: AI Owner Pay+Email (Claude) — Agent 1 per `IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26.md`

Scope: Verdict cuối cho phần repo-side mà AI Owner Pay+Email được phép đóng cho lane email + pay của `tramsaigon.com`. Đây không phải verdict cho `LIVE_SYNC` — verdict đó vẫn block trên founder receiver lock.

---

## 1. Repo-side state cho `tramsaigon.com` — done

Kiểm tra ngày `2026-04-28` sau pay-surface 59/59 PASS:

| Surface | Trạng thái | Evidence |
| --- | --- | --- |
| Sender package lock | DONE | `apps/pay/src/site-activation-registry.ts:380-399` — `pay@tramsaigon.com` (receipts), `billing@tramsaigon.com` (billing/failed/refund), `support@tramsaigon.com` (reply-to), `noreply@tramsaigon.com` (banned for payment) — bound qua `createSenderPackage("tramsaigon.com")` |
| Onboarding form binding | DONE | `onboardingForm: VN_FORM` — `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` |
| Required evidence template | DONE | `requiredEvidence: [...requiredEvidence]` — chuẩn shared evidence rules |
| Required links template | DONE | `createDefaultRequiredLinks("tramsaigon.com")` — site, terms, privacy, refund policy slots |
| Site activation registry row | DONE | `SITE-INTAKE-112`, `siteCode: "TRAMSAIGON"`, `marketType: "VN"`, `priority: "P2"`, `defaultLocale: "vi"`, `surfaceHint: "VN public launch surface"` |
| Board status promotion | DONE | 2026-04-28 — promoted `currentBoardStatus` từ `NEW_INTAKE` → `FORM_IN_PROGRESS` (form đã bound, sender package fixed, email registry locked) |
| Team D core payment email set | DONE | `apps/pay/src/team-d-payment-email-profiles.ts:1117-1202` — 4 flow VI/EN bilingual: `payment_receipt`, `checkout_status_update`, `payment_failed_notice`, `refund_notice`; `paymentPack: "TEAM_D_CORE_4"`, `surfaceClass: "TEAM_D_PREP_SITE"`, `toneMode: "COMMERCE_GROWTH_TRUST_FIRST"` |
| Email template registry exposure | DONE | `getPaymentEmailTemplateRegistry("tramsaigon.com")` returns 4-template registry status `LOCKED_READY_FOR_RUNTIME_BINDING`; verified bằng `pay exposes the Team D core payment email set for every prepared domain` test |
| Receivers slot lock | DONE (slot only) | `docs/PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md:434-447` — `assignment_status: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION"`, VND/USD primary/fallback `null` slots reserved |
| Test verification | DONE | `pnpm test:pay` → 59/59 PASS — ngày 2026-04-28 |

---

## 2. Repo-side state — không phải scope của Pay+Email Agent

Cần escalate (không tự sửa):

| Surface | Owner agent | Trạng thái | Note |
| --- | --- | --- | --- |
| `tramsaigon.com` payment routing receiver assignment | Founder Trần Hà Tâm | OPEN | VND primary/fallback và USD primary đều `null`; cần founder lock receiver thật trước khi `paymentAssignmentState` được phép flip sang `ACTIVE_NOW` |
| `tramsaigon.com` paid offers lock | Product + Founder | OPEN | Membership tier, creator pack pricing, billing model (one-time vs recurring vs hybrid) chưa lock |
| `tramsaigon.com` owner truth | Founder | OPEN | `company_or_individual_TBD` — chưa quyết định pháp nhân thu (cá nhân hay công ty) |
| `tramsaigon.com` 7-locale rollout (`["en", "vi", "ko", "zh", "ja", "fr", "es"]`) | Content team / Founder | OPEN — defer | Profile declares 7 locales nhưng chỉ 2 (`en`, `vi`) có copy. Runtime sẽ fallback về `defaultLocale: "en"` cho các locale chưa có. AI Owner KHÔNG tự dịch 5 locale còn lại — yêu cầu founder/content team commit hoặc giảm `allowedLocales` về `["en", "vi"]` cho đến khi có content thật |

---

## 3. Founder/external action vẫn còn block — không phải repo-side

### 3.1 Missing founder decisions (P1)

- `tramsaigon.com` paid offers — membership tier / creator pack pricing
- `tramsaigon.com` owner truth — company hay individual
- `tramsaigon.com` payment model — one-time, recurring, hybrid

### 3.2 Missing receiver assignment (P1)

- Production VND primary (ACB / VCB / VPBank / khác)
- Production VND fallback
- USD lane: có cần PayPal Business cho creator program không (per `PAY_IAI_ONE_DEV_LEGAL_FOUNDATION_LOCK_2026-04-27.md` step 3 — USD lane queued for verified domains)

### 3.3 Missing live proof (P2 — sau khi block trên close)

- `PROVIDER_PAYMENT_PROOF_MISSING` — Team B + Team D phải chạy 1 sandbox or real checkout flow trên `tramsaigon.com` qua payOS, capture provider_ref + checkout_url
- `MESSAGE_ID_PROOF_MISSING` — Team Email + SMTP phải gửi 4 template VI/EN qua mail.iai.one, return real message_id, persist vào D1 row
- `INBOX_PROOF_MISSING` — Team Email + SMTP phải capture raw header + screenshot inbox của ít nhất 1 Gmail recipient + 1 Outlook recipient sau action thật
- `MAILBOX_BINDING_MISSING` — `pay@tramsaigon.com`, `billing@tramsaigon.com`, `support@tramsaigon.com`, `noreply@tramsaigon.com` phải được tạo thật trên mailcow + sender identity bind

### 3.4 Live surface wiring (P2)

- `tramsaigon.com` web surface phải nối live event trigger → `https://pay.iai.one/internal/payment-event/callback` với `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
- `MAIL_API_BASE_URL` + `MAIL_API_KEY` + `MAIL_API_WORKSPACE_ID` + `PAY_EMAIL_ADAPTER_INTERNAL_KEY` set trong runtime của `tramsaigon.com`

---

## 4. Folder evidence — chuẩn bị sẵn cho founder/teams

Khi mỗi external blocker close, evidence land vào:

```
docs/release-evidence/pay.iai.one/2026-MM-DD/tramsaigon.com/
  manifest.md                          ← provider_ref, message_id, amount, currency, timestamp
  checkout-screenshot.png              ← payOS screenshot or real-action proof
  provider-response.json               ← payOS API response (sanitized, no secret)
  d1-readback.json                     ← pay D1 row export
  mail-readback.json                   ← messages + message_events + delivery_attempts
  inbox-proof-pay@tramsaigon.com.eml   ← raw header + body
  inbox-proof-customer-gmail.png       ← screenshot Gmail inbox
  inbox-proof-customer-outlook.png     ← screenshot Outlook inbox (optional)
```

AI Owner Pay+Email sẽ verify từng file theo evidence rule và update `PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md` row `SITE-INTAKE-112` tới `READY_FOR_LIVE` khi đủ.

---

## 5. Verdict

**Repo-side cho `tramsaigon.com` email + pay: CLOSED.**

Không còn item nào AI Owner Pay+Email có thể đóng trong repo cho `tramsaigon.com` mà không cần input từ founder hoặc content team. Tất cả surface đã ship, test xanh (`pnpm test:pay` 59/59), contract khóa, sender policy lock, email template registry sẵn sàng nhận live action.

Promotion 2026-04-28: `currentBoardStatus` `NEW_INTAKE` → `FORM_IN_PROGRESS` ghi nhận form đã bound + repo-side packet ready.

**Live-side cho `tramsaigon.com`: STILL BLOCKED.**

3 nhóm action ngoài repo (founder decisions on offers/owner/model, receiver assignment, live proof) thuộc Founder + Team B Pay Runtime + Team D Payments Activation + Team Email + Team SMTP. AI Owner sẽ flip row khi evidence đủ, không tự bấm.

---

## 6. Cross-agent visibility

Closeout này được public dưới `docs/reports/pay-email-agent/` để Codex / Team 1 / Team B / Team D / Team Email + SMTP đều thấy mà không phải dò git log. Khi founder lock receiver, có thể fold reference vào DAILY_TEAM1 hoặc broadcast packet next pass.

Closeout này pair với `TRANHATAM_COM_PAY_EMAIL_REPO_CLOSEOUT_2026-04-27.md` — cùng pattern, cùng evidence rule. Khác biệt:
- `tranhatam.com` đã có receiver lock (ACB primary, VCB fallback, PayPal USD) — chỉ thiếu live proof
- `tramsaigon.com` chưa có receiver lock — đang chờ founder decisions trước khi mới đến giai đoạn live proof

---

## 7. Change log

- 2026-04-28 v1.0 — closeout đầu tiên cho repo-side `tramsaigon.com` email + pay; promotion `NEW_INTAKE` → `FORM_IN_PROGRESS`; verify 4 lane test suite all pass; ghi nhận founder receiver lock + paid offers + owner truth còn block.
