# WEB_IAI_ONE_PREVIEW_RELEASE_EVIDENCE_PACKET_2026-04-17

- Domain: `web.iai.one`
- Nhóm sở hữu: Team 5 (sản phẩm tăng trưởng web)
- Owner chính: Team 5 Web Lead
- Ngày phát hành: 2026-04-17
- Commit / branch: `f1605c6` / `OMCODE/smtp-internal-first-phase1`
- Môi trường mục tiêu: preview + lane kiểm thử tích hợp cục bộ
- Người phê duyệt: Team 1 Program Root (đang chờ review)
- Owner rollback: Team 5 Web Lead
- Tài liệu gate liên quan:
  - `docs/WEB_IAI_ONE_KPI_BASELINE_AND_RELEASE_GATES_2026.md`
  - `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md`
  - `docs/runtime/TEAM2_RUNTIME_RELEASE_EVIDENCE_PACKET_2026-04-17.md`

## 1. Phạm vi đã triển khai

- Routes:
  - `/`
  - `/onboarding`
  - `/shared-auth`
  - `/contract-status`
  - `/events`
  - `/events/baseline`
  - `/events/track`
  - `/health`
- Module:
  - `apps/web/src/server.ts`: shared contract consumer cho route/auth/locale/wording handoff
  - `apps/web/src/event-log.ts`: P0 baseline event registry + JSONL sink tùy chọn
  - `apps/web/src/render.ts`: localized rendering + shared wording contract binding
  - `apps/web/src/i18n.ts`: locale contract normalize + canonical/hreflang metadata helpers
- API/contract:
  - `GET /v1/flow/web-onboarding-contract` (Team 2 shared onboarding contract)
  - Team 2 shared query/filter contract cho flow APIs (`status`, `severity`, `overdue_only`, `workspace_id`)
  - shared auth redirect contract (`lang`, `origin`, `role`, `intent`, `next`, `campaign`, `variant`, `user_or_anonymous_id`)
  - optional experiment passthrough (`experiment_id`, `assignment_reason`) không tạo local contract fork
- Chủ động không triển khai:
  - local auth system
  - local billing system
  - domain mission/brand meaning override
  - pay/nft execution lane

## 2. Route evidence

| Route | Kỳ vọng | Kết quả thực tế | PASS/FAIL | Evidence |
|---|---|---|---|---|
| `/` | Landing đọc shared contract và giữ metadata hợp lệ | Integration test xác nhận `<html lang="en">`, canonical, hreflang, JSON-LD | PASS | `tests/integration/web-onboarding-contract.test.mjs` |
| `/onboarding` | Form đọc shared auth/billing targets từ Team 2 payload | Integration test xác nhận contract target URLs + EN render | PASS | same test |
| `/onboarding?lang=en` | Explicit EN render | Integration test xác nhận EN route ổn định | PASS | same test |
| `POST /onboarding` (`lang=vi`) | Render summary tiếng Việt + contract status + shared handoff | Integration test xác nhận VI summary copy + blocked status | PASS | same test |
| `/shared-auth?role=builder&intent=leads` | 303 redirect sang shared auth với locale + handoff query | Integration test xác nhận redirect URL có `lang=en`, `origin`, `intent`, `next` | PASS | same test |
| `/shared-auth?role=Operator&intent=lead` | Alias handoff vẫn map đúng canonical role/intent | Integration test xác nhận redirect URL có `role=operator`, `intent=leads` | PASS | same test |
| `GET /events/baseline` | Query được baseline event registry cho gate check | Integration test xác nhận total 12 events và final 100% coverage | PASS | same test |
| `POST /events/track` | Ingest được shared-surface events không fork auth/billing | Integration test post đủ missing events và đạt baseline 100% | PASS | same test |
| `/contract-status` | Expose đầy đủ contract, locale, wording, readiness từ shared payload | Integration test xác nhận `auth_mode`, locale fields, wording fields, readiness state | PASS | same test |
| `/health` | Health + shared contract mode + locale fields | Integration test xác nhận `auth_mode`, `default_locale`, `fallback_locale`, `supported_locales` | PASS | same test |

## 3. API và contract evidence

| Contract / API | Cách xác minh | Kết quả | Ghi chú |
|---|---|---|---|
| Team 2 onboarding contract path | `tests/integration/web-onboarding-contract.test.mjs` | PASS | `web` đọc `/v1/flow/web-onboarding-contract` qua injected fetch |
| Workspace identity trên contract calls | cùng integration test (`contractRequests` assertion) | PASS | mọi call giữ `x-workspace-id=ws_flow_main` |
| Team 2 locale fields trong payload | `tests/integration/flow-api-source-of-truth.test.mjs` + web integration | PASS | `defaultLocale`, `fallbackLocale`, `supportedLocales` consume end-to-end |
| Team 2 shared wording keys | cùng nhóm test | PASS | wording keys contract-driven; key lạ fallback canonical; không fork wording local |
| Team 2 filter/query naming contract | `tests/integration/web-flow-filter-contract.test.mjs` | PASS | giữ đúng key naming, không camelCase drift |

## 4. UI evidence

| Screen / route | Evidence path | Trạng thái | Ghi chú |
|---|---|---|---|
| `web` landing + onboarding shell | `docs/reports/team1/IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17.md` | PASS | Team 1 audit packet là visual reference lane này |
| onboarding summary + shared-auth handoff | `tests/integration/web-onboarding-contract.test.mjs` | PASS | Integration assertions dùng làm UI proof traceable |

## 5. Smoke / xác minh evidence

| Test | Command | Kết quả | Ghi chú |
|---|---|---|---|
| web integration smoke | `pnpm test:web` | PASS (3/3) | bao gồm onboarding + contract calls |
| flow contract source-of-truth smoke | `pnpm test:flow` | PASS (21/21) | bao gồm Team 2 onboarding contract assertions |
| NOOS contract drift guard | `pnpm test:noos-commerce-contracts` | PASS | fixture/schema entitlement guard xanh |
| Team 1 lane protocol check | `pnpm report:lane` | PASS | tạo `LANE_STATUS_SNAPSHOT_2026-04-17` |
| Team 5 pilot KPI smoke v2 | `pnpm smoke:team5-web-kpi:pilot:v2` | PASS | ingest `22` event, baseline `100%` |
| Team 5 KPI snapshot | `pnpm report:team5-web-kpi -- --date=2026-04-19` | PASS | `failedAuthHandoffRatePercent=25`, `brokenRouteHandoffRatePercent=16.67` |
| Team 5 KPI delta note | `pnpm report:team5-web-kpi-delta -- --date=2026-04-19 --compare-date=2026-04-18` | PASS | auth `-25%`, route `-16.66%`, có file delta `.md/.json` để reviewer trace |
| Team 5 KPI bundle | `pnpm report:team5-web-kpi-bundle -- --date=2026-04-19 --compare-date=2026-04-18` | PASS | gom snapshot + delta + gate note vào 1 file nộp reviewer |
| Team 5 gate flow | `pnpm report:team5-gate-flow` | PASS | chuẩn hóa trình tự `snapshot -> delta -> bundle -> packet` cho mỗi checkpoint |
| Team 5 live-sync readiness | `pnpm report:team5-live-sync-readiness -- --date=2026-04-19` | PASS | kết quả `NOT_READY_FOR_SYNCHRONIZED_LIVE` theo control-tower |
| Team 5 live-sync final packet | `pnpm report:team5-live-sync-packet -- --date=2026-04-19 --compare-date=2026-04-18` | PASS | tạo packet cuối có đủ `DONE/IN PROGRESS/BLOCK/NEXT/TEST PROOF/COMMIT HASH` |

## 6. Tình huống biên đã cover

- shared-auth trả về localized `VALIDATION_ERROR` khi thiếu handoff params
- invalid onboarding role/intent và shared-auth params emit rõ `web_route_handoff_failed` / `web_auth_handoff_failed`
- Team 2 workspace guard cho contract routes được verify
- locale handoff verify cho default EN và VI summary render path (`lang=vi`)
- contract readiness blockers được giữ visible (`sharedContractState=blocked`)

## 7. Ghi chú rollback

- Rollback path:
  - revert Team 5 contract-consumer deltas trong:
    - `apps/web/src/server.ts`
    - `apps/web/src/render.ts`
    - `apps/web/src/i18n.ts`
    - `tests/integration/web-onboarding-contract.test.mjs`
    - `tests/integration/flow-api-source-of-truth.test.mjs`
  - rerun `pnpm test:web`, `pnpm test:flow`, `pnpm test:noos-commerce-contracts`
- Owner rollback: Team 5 Web Lead
- Rollback risk: medium (có thể mở lại route/metadata/contract drift)

## 8. Vấn đề đã biết

| Vấn đề | Tác động | Cách xử lý tạm thời | Owner | Trạng thái |
|---|---|---|---|---|
| Team 1 reviewer path còn pending final gate confirmation | packet chưa thể mark `READY` hoàn toàn | giữ trạng thái review-pending, không tạo release request mới trước Team 1 confirmation | Team 1 Program Root + Team 5 Web Lead | OPEN |
| Pilot KPI baselines còn pending live traffic | release đang dựa trên smoke + contract evidence | đã có delta giảm lỗi handoff (auth: `50 -> 25`, route: `33.33 -> 16.67`), tiếp tục thay fixture bằng pilot traffic thật | Team 5 + Team 4 | OPEN |
| Synchronized live chưa mở | chưa được phép chuyển live đồng bộ dù governance loop `READY` | 4 owner sign-off NO-GO đã đóng; còn chờ pay production gate pass + release-claim thoát `LOCK_RETAINED` | Team 1 + Team 2 + Team 5 | OPEN |

## 9. Ký xác nhận cuối

- Owner sign-off: `Y` (packet có đủ route/metadata/contract/rollback evidence)
- Team 1 review: `PENDING_REVIEWER_CONFIRMATION`
- Final status: `READY_FOR_TEAM1_REVIEW`
