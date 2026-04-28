# IAI Mail Platform - Bộ tài liệu dự án

Bộ tài liệu này là handoff pack cho dự án độc lập `IAI Mail Delivery & Automation Layer`.

AI Owner plan (đọc trước, áp dụng cho cả 2 lane mail + pay):
- `../IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md`

Tài liệu chính:
- `MAIL_IAI_ONE_ALL_WEB_EMAIL_SYNC_AUDIT_2026-04-22.md`
- `MAIL_IAI_ONE_ONE_PAGE_HANDOFF_2026-04-22.md`
- `MAIL_IAI_ONE_TEAM_SMTP_STACK_COMMANDS_2026-04-22.md`
- `MAIL_IAI_ONE_TEAM_SMTP_FINAL_5_COMMAND_CHECKLIST_2026-04-22.md`
- `MAIL_IAI_ONE_UNIFIED_TEAM_EMAIL_SMTP_24H_MISSION_2026-04-22.md`
- `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LIVE_COMPLETION_DIRECTIVE_2026-04-22.md`
- `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_PROOF_RULE_BROADCAST_2026-04-22.md`
- `MAIL_IAI_ONE_REPLACES_RESEND_DIRECTIVE_2026-04-22.md`
- `MAIL_IAI_ONE_MASTER_ARCHITECTURE_FINAL.md`
- `MAIL_IAI_ONE_PRODUCT_REQUIREMENTS_FINAL.md`
- `MAIL_IAI_ONE_REPO_AND_MONOREPO_STRUCTURE_FINAL.md`
- `MAIL_IAI_ONE_API_SPEC_V1_FINAL.md`
- `MAIL_IAI_ONE_SMTP_SUBMISSION_SPEC_FINAL.md`
- `MAIL_IAI_ONE_DATABASE_SCHEMA_FINAL.md`
- `MAIL_IAI_ONE_PROVIDER_ABSTRACTION_SPEC_FINAL.md`
- `MAIL_IAI_ONE_DELIVERABILITY_AND_DNS_POLICY_FINAL.md`
- `MAIL_IAI_ONE_INBOUND_AND_ROUTING_ENGINE_FINAL.md`
- `MAIL_IAI_ONE_AUTOMATION_AND_TEMPLATE_ENGINE_FINAL.md`
- `MAIL_IAI_ONE_ADMIN_DASHBOARD_UI_FLOW_FINAL.md`
- `MAIL_IAI_ONE_EXECUTION_BOARD_TODAY_FINAL.md`
- `MAIL_IAI_ONE_TEAM_SMTP_RELAY_MAIL_EXECUTION_PLAN_FINAL.md`
- `MAIL_IAI_ONE_TEAM_MAIL_IAI_ONE_AND_SMTP_RELAY_COORDINATION_FINAL.md`
- `MAIL_IAI_ONE_SMTP_CONTINUOUS_DEV_PLAN_FINAL.md`
- `MAIL_IAI_ONE_SMTP_REMOTE_BACKEND_ADAPTER_CONTRACT_FINAL.md`
- `MAIL_IAI_ONE_SMTP_REMOTE_HANDOFF_NOW_FINAL.md`
- `MAIL_IAI_ONE_LIVE_SMTP_TEAM_MESSAGE_VERBATIM.md`
- `MAIL_IAI_ONE_TEMP_HEALTH_ENDPOINT_AND_CUTOVER_CHECKLIST_2026-04-15.md`
- `MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_2026-04-15.md`
- `MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md`
- `MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md`
- `OMDALAT_EMAIL_SYSTEM_PACK_2026-04-19.md`
- `MAIL_IAI_ONE_PUBLIC_SUBMISSION_DECISION_GATE_2026-04-15.md`

Runbook cho Team SMTP RELAY mail:
- `MAIL_IAI_ONE_SMTP_GO_LIVE_RUNBOOK_FINAL.md`
- `MAIL_IAI_ONE_SMTP_INCIDENT_RESPONSE_RUNBOOK_FINAL.md`
- `MAIL_IAI_ONE_SMTP_CREDENTIAL_ROTATION_RUNBOOK_FINAL.md`
- `MAIL_IAI_ONE_SMTP_SMOKE_TEST_RUNBOOK_FINAL.md`
- `MAIL_IAI_ONE_INTERNAL_FIRST_VERIFICATION_CLOSEOUT_2026-04-15.md`

Ops pack internal-first:
- `../../ops/mail-internal-first/docker-compose.prod.yml`
- `../../ops/mail-internal-first/.env.production.example`
- `../../ops/mail-internal-first/RUNBOOK_SMOKE_AND_ROLLBACK.md`
- `../../ops/mail-internal-first/scripts/check-wave-gate.mjs`
- `../../ops/mail-internal-first/scripts/check-team-auth-prereqs.mjs`
- `../../ops/mail-internal-first/templates/team-auth-wave2-prereqs.example.json`
- `../../ops/mail-internal-first/runtime-state/website-email-master-tracker-2026-04-19.json`

Quyết định chốt:
- `mail.iai.one` đang dev không bị bỏ đi.
- Runtime mới được khóa theo kiểu provider-agnostic.
- Với app/site nội bộ, `mail.iai.one` là provider email chuẩn; không đội nào được chờ `RESEND_API_KEY` để mở gate email.
- Bộ runtime secret chuẩn cho lane này là `MAIL_API_KEY`, `MAIL_API_WEBHOOK_SECRET`, `MAIL_API_BASE_URL`.
- Dev execution cho Wave 1 / Wave 2 / Wave 3 đã mở; chỉ claim `migrated/live` mới còn phụ thuộc evidence thật.
- Day 1 nên gửi thật qua `SendGrid` hoặc `SES` sau lớp abstraction.
- Mọi app trong `*.iai.one` phải gửi qua `api.mail.iai.one/v1`.
- Trong phase hiện tại, Team Email và Team SMTP được gộp thành một lane vận hành duy nhất: `Team Email SMTP`.
- Nếu mục tiêu là chốt việc còn thiếu để live, dùng `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LIVE_COMPLETION_DIRECTIVE_2026-04-22.md` làm checklist hiện hành.
- Nếu mục tiêu là copy-run nhiệm vụ 24 giờ tới cho một team duy nhất, dùng `MAIL_IAI_ONE_UNIFIED_TEAM_EMAIL_SMTP_24H_MISSION_2026-04-22.md`.
- Nếu mục tiêu là broadcast ngắn, cứng, copy-run ngay cho Team Email SMTP về proof rule và gate `BCC`, dùng `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_PROOF_RULE_BROADCAST_2026-04-22.md`.
