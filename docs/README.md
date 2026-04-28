# Document Packs

## AI Owner plan (cross-lane, read first)

- [IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md](./IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md) — phạm vi AI Owner đảm nhiệm cho 2 lane `mail.iai.one` + `pay.iai.one`, cùng cách team khác gửi ask / evidence vào repo

## pay.iai.one

### Required first read

- [PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md](./PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md)
- [PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md](./PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md)

### Core build pack

- [PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026.md](./PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026.md)
- [PAY_IAI_ONE_TEAM_DEV_STARTER_MAP_2026.md](./PAY_IAI_ONE_TEAM_DEV_STARTER_MAP_2026.md)

### Docs usage protocol

- [PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md](./PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md)

### Repo docs integration checklist

- [PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026.md](./PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026.md)

### Current accelerated execution overlay

- [PAY_IAI_ONE_THREE_TEAM_EXECUTION_PLAN_2026.md](./PAY_IAI_ONE_THREE_TEAM_EXECUTION_PLAN_2026.md)

### Governance pack

- [PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md](./PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md)
- [PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md](./PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md)
- [PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md](./PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md)

### Execution and risk pack

- [PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md](./PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md)
- [PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md](./PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md)

### Activation and onboarding pack

- [PAY_IAI_ONE_TEAM_D_PAYMENTS_ACTIVATION_AND_TREASURY_OPS_EXECUTION_PLAN_2026.md](./PAY_IAI_ONE_TEAM_D_PAYMENTS_ACTIVATION_AND_TREASURY_OPS_EXECUTION_PLAN_2026.md)
- [PAY_IAI_ONE_TEAM_D_DAILY_OPS_TEMPLATE_2026.md](./PAY_IAI_ONE_TEAM_D_DAILY_OPS_TEMPLATE_2026.md)
- [PAY_IAI_ONE_TEAM_D_HANDOFF_TO_TEAM_B_CHECKLIST_2026.md](./PAY_IAI_ONE_TEAM_D_HANDOFF_TO_TEAM_B_CHECKLIST_2026.md)
- [PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md](./PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md)
- [PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md](./PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md)
- [PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md](./PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md)
- [PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md](./PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md)
- [PAY_IAI_ONE_RECEIVER_ROUTING_AND_RENDER_RULES_2026.md](./PAY_IAI_ONE_RECEIVER_ROUTING_AND_RENDER_RULES_2026.md)
- [PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md](./PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md)
- [PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md](./PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md)

### Pending locked dependencies

- `PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md`
- `PAY_IAI_ONE_API_SPEC_FULL_V1.md`

Notes for the `pay.iai.one` lane:

- [PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md](./PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md) là final navigation shell cho toàn bộ docs pack của lane `pay.iai.one`.
- [PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md](./PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md) vẫn là actual highest lane entry point cho execution order và governance direction.
- [PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md](./PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md) là operating protocol cho cách người và AI phải dùng docs pack này.
- [PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026.md](./PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026.md) là checklist repo-facing để xác nhận pack đã được nối đúng vào hệ điều hướng docs.
- Khi cần chụp dated repo integration snapshot cho lane này, dùng `pnpm report:pay-docs-integration -- --date=YYYY-MM-DD`.
- [PAY_IAI_ONE_THREE_TEAM_EXECUTION_PLAN_2026.md](./PAY_IAI_ONE_THREE_TEAM_EXECUTION_PLAN_2026.md) là execution overlay để nén delivery thành 3 team cộng control tower, không thay thế master index hay starter map.
- Activation and onboarding pack là lớp vận hành để Team D onboard website, legal owner, collection account, và payout account theo form chuẩn VN hoặc quốc tế.
- [PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md](./PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md) là account truth cho receiver.
- [PAY_IAI_ONE_RECEIVER_ROUTING_AND_RENDER_RULES_2026.md](./PAY_IAI_ONE_RECEIVER_ROUTING_AND_RENDER_RULES_2026.md) là logic truth cho chọn receiver, fallback, và render block thanh toán.
- [PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md](./PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md) là starter build reference cho `receivers.json`, `domain-payment-map.json`, `render-rules.json`, và naming rule của asset QR.
- [PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md](./PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md) là bridge contract giữa `apps/pay` và mail lane cho outbound payment email.
- Team D daily ops và Team D handoff checklist là lớp kỷ luật hằng ngày để Team D cập nhật row và chỉ handoff sang Team B khi packet đã đủ.
- Đây là governance pack chuyên biệt cho lane `pay.iai.one`.
- Governance pack này chạy song song với template và protocol hệ thống tổng, không thay thế chúng.
- Execution board và risk register là lớp vận hành hằng ngày của governance pack này.
- `PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md` và `PAY_IAI_ONE_API_SPEC_FULL_V1.md` là locked dependencies chưa materialize trong vòng này.
- Team và AI agents không được tự ý viết nội dung thay thế cho hai dependency này nếu chưa có lock riêng.

## Other document packs in this workspace

- `IAI_MASTER_DOMAIN_MISSION_MAP.md` (system-wide mission and boundary lock for *.iai.one)
- `CLOUDFLARE_DOMAIN_PROJECT_ACCOUNT_OWNER_MATRIX_2026.md` (domain -> project -> account -> owner infra truth)
- `IAI_DEPLOY_FREEZE_AND_RELEASE_AUTHORITY_2026.md` (deploy freeze tiers and release approver rules)
- `IAI_GIT_ICLOUD_HYGIENE_TRUTH_2026.md` (source-control hygiene and iCloud conflict prevention)
- `IAI_CROSS_TEAM_EXECUTION_MODEL_2026.md` (team model, ownership, sync cadence, and release gates)
- `IAI_TEAM1_PROGRAM_ROOT_EXECUTION_PLAN_2026.md` (Team 1 execution ownership and SLA)
- `IAI_TEAM2_RUNTIME_PLATFORM_EXECUTION_PLAN_2026.md` (Team 2 runtime/platform plan)
- `IAI_TEAM1_LIVE_TRACKING_BOARD_2026.md` (daily cross-team tracking board for Team 1)
- `IAI_TEAM_DELIVERY_AND_FILE_GAP_MATRIX_2026.md` (file-by-file gap list by team)
- `IAI_AUTOMATED_REPORTING_PROTOCOL_2026.md` (daily/weekly reporting protocol for all teams)
- `IAI_UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_COMMAND_2026.md` (mandatory bilingual language, SEO, and UI text rebuild command before any redeveloping surface can go live)
- `PAY_IAI_ONE_WALLET_AND_SETTLEMENT_PHASE_PLAN_2026.md` (locked phased plan for `pay.iai.one`)
- `WEB_IAI_ONE_NEW_TEAM_EXECUTION_PLAN_2026.md` (execution lock for new web.iai.one team)
- `reports/` (daily/weekly team reports for tracking and auto-reporting)
- `runtime/` (Team 2 runtime contract, webhook, and incident documents)
- `iai-mail-platform/`
- `noos-platform/`
- `noos/` (Team 1 lock pack for product pages, pricing/license, buyer library, and product definitions)
