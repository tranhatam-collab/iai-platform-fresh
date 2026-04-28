# WEB_IAI_ONE_PREVIEW_RELEASE_EVIDENCE_PACKET_2026-04-17

- Domain: `web.iai.one`
- Owner team: Team 5 (web growth product)
- Named owner: Team 5 Web Lead
- Release date: 2026-04-17
- Commit / branch: `f1605c6` / `OMCODE/smtp-internal-first-phase1`
- Target environment: preview + local integration test lane
- Approver: Team 1 Program Root (pending review)
- Rollback owner: Team 5 Web Lead
- Related release gate file:
  - `docs/WEB_IAI_ONE_KPI_BASELINE_AND_RELEASE_GATES_2026.md`
  - `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md`
  - `docs/runtime/TEAM2_RUNTIME_RELEASE_EVIDENCE_PACKET_2026-04-17.md`

## 1. Phạm Vi Đã Triển Khai

- Route:
  - `/`
  - `/onboarding`
  - `/shared-auth`
  - `/contract-status`
  - `/events`
  - `/events/baseline`
  - `/events/track`
  - `/health`
- Module:
  - `apps/web/src/server.ts`: shared contract consumer cho route/auth/locale/wording handoff.
  - `apps/web/src/event-log.ts`: P0 baseline event registry + JSONL sink tùy chọn.
  - `apps/web/src/render.ts`: localized rendering + binding với shared wording contract.
  - `apps/web/src/i18n.ts`: normalize locale contract + helper canonical/hreflang metadata.
- API/contract:
  - `GET /v1/flow/web-onboarding-contract` (shared onboarding contract của Team 2).
  - Shared query/filter contract cho flow API qua mapper (`status`, `severity`, `overdue_only`, `workspace_id`).
  - Shared auth redirect contract (`lang`, `origin`, `role`, `intent`, `next`, `campaign`, `variant`, `user_or_anonymous_id`).
  - Optional experiment passthrough (`experiment_id`, `assignment_reason`) không tạo local contract fork.
- Explicitly not shipped:
  - local auth system.
  - local billing system.
  - override mission/brand meaning.
  - lane thực thi pay/nft.

## 2. Bằng Chứng Route

| Route | Kỳ vọng | Thực tế | Pass/Fail | Evidence |
|---|---|---|---|---|
| `/` | growth landing đọc shared contract và giữ metadata hợp lệ | integration test xác nhận `<html lang="en">`, canonical, hreflang và JSON-LD | PASS | `tests/integration/web-onboarding-contract.test.mjs` |
| `/onboarding` | onboarding form đọc shared auth/billing target từ Team 2 payload | integration test xác nhận target URL và EN render | PASS | cùng test |
| `/onboarding?lang=en` | render EN tường minh | integration test xác nhận EN route ổn định | PASS | cùng test |
| `POST /onboarding` (`lang=vi`) | render summary tiếng Việt với contract status + shared handoff | integration test xác nhận VI summary copy + blocked status | PASS | cùng test |
| `/shared-auth?role=builder&intent=leads` | 303 redirect sang shared auth, giữ locale + handoff query | integration test xác nhận URL có `lang=en`, `origin`, `intent`, `next` | PASS | cùng test |
| `GET /events/baseline` | baseline event registry query được cho gate check | integration test xác nhận 12 event và đường phủ 100% | PASS | cùng test |
| `POST /events/track` | ingest được shared-surface event mà không tạo local auth/billing fork | integration test post đủ event thiếu và đạt baseline coverage 100% | PASS | cùng test |
| `/contract-status` | expose contract, locale, wording, readiness từ shared payload | integration test xác nhận `auth_mode`, locale field, wording field, readiness state | PASS | cùng test |
| `/health` | health + shared contract mode + locale field | integration test xác nhận `auth_mode`, `default_locale`, `fallback_locale`, `supported_locales` | PASS | cùng test |

## 3. Bằng Chứng API Và Contract

| Contract / API | Cách xác minh | Kết quả | Ghi chú |
|---|---|---|---|
| Team 2 onboarding contract path | `tests/integration/web-onboarding-contract.test.mjs` | PASS | `web` đọc `/v1/flow/web-onboarding-contract` qua injected fetch |
| Workspace identity trên contract call | cùng integration test (`contractRequests` assertion) | PASS | mọi call giữ `x-workspace-id=ws_flow_main` |
| Team 2 locale field trong payload | `tests/integration/flow-api-source-of-truth.test.mjs` + web integration | PASS | `defaultLocale`, `fallbackLocale`, `supportedLocales` consume end-to-end |
| Team 2 shared wording key | cùng test | PASS | wording key chạy theo contract, không tạo local auth/billing wording fork |
| Team 2 filter/query naming contract | `tests/integration/web-flow-filter-contract.test.mjs` | PASS | giữ đúng key, không drift camelCase |

## 4. Bằng Chứng UI

| Màn hình / route | Nguồn chứng cứ | Trạng thái bao phủ | Ghi chú |
|---|---|---|---|
| `web` landing + onboarding shell | `docs/reports/team1/IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17.md` | bằng chứng public shell alignment + route boundary | Team 1 audit packet là nguồn tham chiếu hình ảnh |
| onboarding summary + shared-auth handoff | `tests/integration/web-onboarding-contract.test.mjs` | localized summary render + handoff routing | packet dùng integration assertion làm UI proof có thể truy vết |

## 5. Bằng Chứng Smoke/Command

| Test | Command | Kết quả | Ghi chú |
|---|---|---|---|
| web integration smoke | `pnpm test:web` | PASS (`3/3`) | bao gồm onboarding + contract call |
| flow contract source-of-truth smoke | `pnpm test:flow` | PASS (`21/21`) | bao gồm assert onboarding contract của Team 2 |
| NOOS contract drift guard | `pnpm test:noos-commerce-contracts` | PASS | guard entitlement fixture/schema |
| Team 1 lane protocol check | `pnpm report:lane` | PASS | tạo `LANE_STATUS_SNAPSHOT_2026-04-17` |

## 6. Edge Case Đã Bao Phủ

- `/shared-auth` trả `VALIDATION_ERROR` theo locale khi thiếu handoff parameter bắt buộc.
- invalid role/intent và invalid shared-auth parameter phát `web_route_handoff_failed` / `web_auth_handoff_failed` để theo dõi guardrail.
- workspace guard của Team 2 cho contract route đã được xác minh trong flow integration test.
- hành vi locale handoff đã được xác minh cho default EN và VI summary route (`lang=vi`).
- contract readiness blocker vẫn hiển thị tường minh (`sharedContractState=blocked`).

## 7. Ghi Chú Rollback

- Rollback path:
  - revert Team 5 contract-consumer delta tại:
    - `apps/web/src/server.ts`
    - `apps/web/src/render.ts`
    - `apps/web/src/i18n.ts`
    - `tests/integration/web-onboarding-contract.test.mjs`
    - `tests/integration/flow-api-source-of-truth.test.mjs`
  - chạy lại `pnpm test:web`, `pnpm test:flow`, `pnpm test:noos-commerce-contracts`.
- Rollback owner: Team 5 Web Lead.
- Rollback risk: medium (route/metadata/contract drift có thể mở lại blocker của Team 1 gate).

## 8. Vấn Đề Đang Mở

| Issue | Tác động | Cách xử lý tạm thời | Owner | Trạng thái |
|---|---|---|---|---|
| Team 1 reviewer path chưa chốt xác nhận cuối | packet chưa được đánh dấu `READY` hoàn toàn | giữ trạng thái review-pending và chưa mở release request mới | Team 1 Program Root + Team 5 Web Lead | OPEN |
| Pilot KPI baseline chưa có live traffic batch | release đang dựa vào smoke + contract evidence, chưa dùng traffic KPI floor | chạy KPI snapshot hằng ngày từ `/events` + Team 4 governance review khi pilot traffic vào | Team 5 + Team 4 | OPEN |

## 9. Ký Xác Nhận Cuối

- Owner sign-off: `Y` (packet có đủ route/metadata/contract/rollback evidence).
- Team 1 review: `PENDING_REVIEWER_CONFIRMATION`.
- Final status: `READY_FOR_TEAM1_REVIEW`.
