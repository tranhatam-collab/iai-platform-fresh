# MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15
## Status: ACTIVE TRACKER
## Date: 2026-04-15

## 2026-04-22 dev-open decision

- `mail.iai.one` da thay the `RESEND_API_KEY` lam provider gate chuan.
- Tat ca Wave 1 / Wave 2 / Wave 3 duoc phep bat dau dev, wiring, contract sync va runtime sync ngay bay gio.
- Thu tu wave chi con ap dung cho viec claim `migrated`, claim `live`, va mo public gate; khong con ap dung cho viec bat dau implementation.

## Rule

Mot flow chi duoc danh dau `migrated` khi co du:
- `action_that = yes`
- `messageId` that
- `messages_ok = yes`
- `message_events_ok = yes`
- `delivery_attempts_ok = yes`

Neu thieu bat ky muc nao:
- khong close flow
- khong claim wave live la xanh
- khong mo public submission gate

Rule bo sung cho Team Auth (Wave 2):
- bat buoc check du VI/EN content + subject + sender + `reply-to` + link that + link TTL
- bat buoc co 2 lane test that: Gmail va Outlook
- moi lane (Gmail/Outlook) phai co action that + `messageId` rieng + DB evidence du 3 bang
- bat buoc pass prereq gate script truoc khi claim `migrated` hoac `live`:
  - `node ops/mail-internal-first/scripts/check-team-auth-prereqs.mjs --file ops/mail-internal-first/runtime-state/team-auth-wave2-prereqs.json`

## Status values

- `pending`
- `in_progress`
- `migrated`
- `rolled_back`
- `blocked`

## Tracker (Master)

| flow_name | wave | owner | source_app | trigger | sender | action_that | message_id | messages_ok | message_events_ok | delivery_attempts_ok | observation_status | rollback_ready | status | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| support_form_submission | 1 | Team App/API | `app.iai.one` | support form submit | `support@iai.one` | no |  | no | no | no | pending | yes | pending |  |
| contact_form_submission | 1 | Team Web | `iai.one` / `home.iai.one` | contact form submit | `hello@iai.one` | no |  | no | no | no | pending | yes | pending |  |
| life_contact_briefing_request | 1 | Team Web | `life.iai.one` | contact briefing request | `contact@iai.one` | no |  | no | no | no | pending | yes | pending | tracker row added on 2026-04-22 to match master checklist |
| low_risk_internal_alert | 1 | Team Ops | `api.iai.one` | internal alert emit | `alerts@iai.one` | no |  | no | no | no | pending | yes | pending | bilingual content artifact locked 2026-04-26 in `packages/mail-core/src/wave2-internal-alerts.ts`; evidence still pending |
| low_volume_notification | 1 | Team App/API | `app.iai.one` | low-volume notification | `notifications@iai.one` | no |  | no | no | no | pending | yes | pending | bilingual content artifact locked 2026-04-26 in `packages/mail-core/src/wave2-internal-alerts.ts`; evidence still pending |
| magic_link_login | 2 | Team Auth | `app.iai.one` | login request | `noreply@iai.one` | no |  | no | no | no | pending | yes | pending | dev_open_mail_iai_one_live_claim_requires_wave1_and_auth_evidence |
| reset_password | 2 | Team Auth | `app.iai.one` | password reset request | `security@iai.one` | no |  | no | no | no | pending | yes | pending | dev_open_mail_iai_one_live_claim_requires_wave1_and_auth_evidence |
| email_verification | 2 | Team Auth | `app.iai.one` | verify email request | `noreply@iai.one` | no |  | no | no | no | pending | yes | pending | dev_open_mail_iai_one_live_claim_requires_wave1_and_auth_evidence |
| security_notice | 2 | Team Auth | `app.iai.one` | suspicious activity / device notice | `security@iai.one` | no |  | no | no | no | pending | yes | pending | dev_open_mail_iai_one_live_claim_requires_wave1_and_auth_evidence |
| payment_receipt | 3 | Team Payments | `pay.iai.one` / `api.iai.one` | checkout completed | `pay@iai.one` | no |  | no | no | no | pending | yes | pending |  |
| checkout_status_update | 3 | Team Payments | `pay.iai.one` / `api.iai.one` | checkout pending/failed/success | `pay@iai.one` | no |  | no | no | no | pending | yes | pending |  |
| renewal_or_failure_notice | 3 | Team Payments | `pay.iai.one` | subscription renewal / failure | `billing@iai.one` | no |  | no | no | no | pending | yes | pending |  |
| workflow_automation_email | 3 | Team Flow | `flow.iai.one` / `api.flow.iai.one` | workflow email step | `automation@iai.one` | no |  | no | no | no | pending | yes | pending |  |
| checkout_success_handoff_notice | 3 | Team NOOS | `noos.iai.one` | checkout success/library handoff | `noreply@iai.one` | no |  | no | no | no | pending | yes | pending | localize VI/EN |

## Team Auth Wave 2 verification matrix (bat buoc)

| flow_name | vi_content_ok | en_content_ok | subject_ok | sender_ok | reply_to_ok | link_live_ok | link_ttl_ok | gmail_action_that | gmail_message_id | gmail_messages_ok | gmail_message_events_ok | gmail_delivery_attempts_ok | outlook_action_that | outlook_message_id | outlook_messages_ok | outlook_message_events_ok | outlook_delivery_attempts_ok | status | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| magic_link_login | no | no | no | no | no | no | no | no |  | no | no | no | no |  | no | no | no | pending | dev_open_claim_requires_auth_evidence |
| reset_password | no | no | no | no | no | no | no | no |  | no | no | no | no |  | no | no | no | pending | dev_open_claim_requires_auth_evidence |
| email_verification | no | no | no | no | no | no | no | no |  | no | no | no | no |  | no | no | no | pending | dev_open_claim_requires_auth_evidence |
| security_notice | no | no | no | no | no | no | no | no |  | no | no | no | no |  | no | no | no | pending | dev_open_claim_requires_auth_evidence |

Quy uoc:
- `gmail_message_id` va `outlook_message_id` phai khac nhau (2 action that rieng)
- `status` trong matrix chi duoc set `migrated` khi tat ca cot check = `yes`

## Execution rule per wave

### Wave 1
- duoc dev ngay
- duoc claim green khi tat ca dong Wave 1 trong Master tracker = `migrated`

### Wave 2
- duoc dev ngay sau khi provider lane da chot sang `mail.iai.one`
- khong duoc claim green neu Wave 1 chua co evidence live that
- 4 dong Team Auth trong Master tracker = `migrated`
- 4 dong Team Auth trong verification matrix = `migrated`

### Wave 3
- duoc dev ngay song song voi Wave 1 / Wave 2
- khong duoc claim green neu thieu packet live theo contract cua tung flow
- tat ca dong Wave 3 = `migrated`

## Team message

```text
Tracker is now active.

Do not report a flow as migrated without filling:
- one real app action
- one real messageId
- messages_ok = yes
- message_events_ok = yes
- delivery_attempts_ok = yes

Team Auth Wave 2 dev-open rule:
- Wave 2 duoc phep bat dau dev va wiring ngay.
- For each auth flow, verify VI+EN content, subject, sender, reply-to, live link, and link TTL.
- Run real tests on Gmail and Outlook (not local inbox only).
- Capture messageId + DB evidence (messages/message_events/delivery_attempts) for each Gmail and Outlook action.

Live progression remains evidence-locked:
- Wave 2 khong duoc claim migrated/live cho rollout neu Wave 1 chua co evidence that.
- Wave 3 khong duoc claim migrated/live neu thieu provider_ref/message_id/DB evidence/inbox proof.
```

## Team Auth message (VN copy-ready)

```text
Team Auth duoc bat dau dev Wave 2 ngay voi mail.iai.one.
Voi tung flow magic_link_login, reset_password, email_verification, security_notice,
chi duoc bao xong khi co action that, messageId that, va DB evidence du 3 bang.
Thieu 1 muc thi khong close flow, khong claim migrated/live.
```
