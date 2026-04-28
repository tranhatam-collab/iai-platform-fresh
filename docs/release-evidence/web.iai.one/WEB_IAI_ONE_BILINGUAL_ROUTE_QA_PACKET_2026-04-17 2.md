# WEB_IAI_ONE_BILINGUAL_ROUTE_QA_PACKET_2026-04-17

## 1. Mục Tiêu

Cung cấp bằng chứng ở cấp route cho EN/VI, canonical, hreflang, x-default và handoff để Team 1 review gate của `web.iai.one`.

Packet này tuân theo:
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`
- `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md` (hành động bắt buộc của Team 5)

## 2. Ma Trận QA Theo Route

| Route | Public indexable | Kỳ vọng locale behavior | Kỳ vọng metadata | Kết quả | Evidence |
|---|---|---|---|---|---|
| `/` | yes | mặc định EN + có VI qua `lang=vi` | canonical, hreflang `en/vi`, x-default, JSON-LD | PASS | `tests/integration/web-onboarding-contract.test.mjs` |
| `/onboarding` | yes | mặc định EN + explicit EN route + VI summary route trong form flow | canonical, hreflang `en/vi`, x-default, JSON-LD | PASS | cùng test |
| `/shared-auth` | no (redirect route) | giữ locale trong redirect query (`lang`) | noindex/redirect-only behavior | PASS | cùng test (`303` + query assertion) |
| `/contract-status` | no (contract JSON route) | expose locale contract field để parity với consumer | không phải SEO route | PASS | cùng test (`locale` + `wording` payload) |
| `/health` | no (service JSON route) | expose locale contract health field | không phải SEO route | PASS | cùng test (`default_locale`, `fallback_locale`, `supported_locales`) |

## 3. Bằng Chứng Metadata

| Check | Kỳ vọng | Kết quả | Evidence |
|---|---|---|---|
| Canonical cho `/` | `https://web.iai.one/` | PASS | regex assertion trong `tests/integration/web-onboarding-contract.test.mjs` |
| Hreflang link | có `en`, `vi`, `x-default` | PASS | cùng test |
| Structured data | public route có JSON-LD | PASS | cùng test (`application/ld+json`) |
| HTML lang mặc định | `en` cho public render mặc định | PASS | cùng test (`<html lang="en">`) |
| Chất lượng VI render | summary page hiển thị tiếng Việt trong submit flow `lang=vi` | PASS | cùng test (`Trạng thái contract cần kiểm tra`, `Đang chặn`) |

## 4. Ghi Chú Dependency Contract (Team 2)

Hành vi bilingual và handoff của `web.iai.one` phụ thuộc vào độ ổn định của shared contract Team 2:

- `GET /v1/flow/web-onboarding-contract`
  - `defaultLocale`
  - `fallbackLocale`
  - `supportedLocales`
  - `wording.auth.*`
  - `wording.billing.*`
  - `routeTargets.*`
- Shared query/filter naming contract cho flow API (`status`, `severity`, `overdue_only`, `workspace_id`)

Trạng thái dependency:
- Team 2 contract confirmation window cho Team 5 đã CLOSED (control tower record 2026-04-15).
- Dependency còn lại là xác nhận reviewer/gate owner của Team 1, trong khi Team 2 contract lane vẫn ở monitor-only.

## 5. Command Xác Minh

| Command | Mục đích | Kết quả |
|---|---|---|
| `pnpm test:web` | smoke web onboarding + contract + redirect | PASS |
| `pnpm test:flow` | kiểm tra onboarding contract Team 2 + shared runtime contract | PASS |
| `pnpm test:noos-commerce-contracts` | guard drift cho entitlement fixture/schema | PASS |
| `pnpm report:lane` | kiểm tra Team 1 lane protocol snapshot health | PASS |

## 6. QA Theo Ranh Giới Vai Trò

| Boundary | Kỳ vọng | Kết quả | Evidence |
|---|---|---|---|
| web vs home | web không trùng vai trò portal | PASS | phạm vi route `apps/web` (`/`, `/onboarding`, contract handoff) |
| web vs app | web chỉ route vào shared surface, không thay thế product surface | PASS | onboarding plan + shared-auth redirect assertion |
| auth/billing ownership | không có local auth/billing wording hoặc runtime authority fork | PASS | Team 2 wording contract được consume trong web runtime |

## 7. Ghi Chú Rollback

- Rollback path:
  - revert Team 5 web locale/wording contract-consumer delta.
  - chạy lại `pnpm test:web` và metadata assertion.
- Rollback owner: Team 5 Web Lead.
- Rollback risk: medium (nếu revert sai có thể tái xuất hiện EN/VI drift hoặc handoff drift).

## 8. Trạng Thái QA

- Team 5 QA owner sign-off: `Y`
- Team 1 reviewer status: `PENDING`
- Packet status: `READY_FOR_TEAM1_REVIEW`
