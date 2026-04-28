# WEB_IAI_ONE_BILINGUAL_ROUTE_QA_PACKET_2026-04-17

## 1. Mục tiêu

Cung cấp evidence route-level EN/VI, canonical, hreflang, x-default và handoff cho Team 1 gate review của `web.iai.one`.

Packet này tuân theo:
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`
- `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md` (Team 5 mandatory actions)

## 2. Ma trận QA route

| Route | Public indexable | Kỳ vọng hành vi locale | Kỳ vọng metadata | Kết quả | Evidence |
|---|---|---|---|---|---|
| `/` | yes | default EN + VI qua `lang=vi` | canonical, hreflang `en/vi`, x-default, JSON-LD | PASS | `tests/integration/web-onboarding-contract.test.mjs` |
| `/onboarding` | yes | default EN + explicit EN route + VI summary route trong form flow | canonical, hreflang `en/vi`, x-default, JSON-LD | PASS | same test |
| `/shared-auth` | no (redirect route) | locale giữ trong redirect query (`lang`) | noindex/redirect-only behavior | PASS | same test (`303` + query assertions) |
| `/shared-auth?role=Operator&intent=lead` | no (redirect route) | alias role/intent map về canonical (`operator`, `leads`) | noindex/redirect-only behavior | PASS | same test (`303` + alias query assertions) |
| `/contract-status` | no (contract JSON route) | locale contract fields expose cho consumer parity | not SEO route | PASS | same test (`locale` + `wording` payload) |
| `/health` | no (service JSON route) | locale contract health fields expose | not SEO route | PASS | same test (`default_locale`, `fallback_locale`, `supported_locales`) |

## 3. Proof metadata

| Hạng mục kiểm tra | Kỳ vọng | Kết quả | Evidence |
|---|---|---|---|
| Canonical cho `/` | `https://web.iai.one/` | PASS | regex assertion trong `tests/integration/web-onboarding-contract.test.mjs` |
| hreflang links | có `en`, `vi`, `x-default` | PASS | cùng test |
| Structured data | JSON-LD emit cho public routes | PASS | cùng test (`application/ld+json`) |
| HTML lang default | `en` cho default public renders | PASS | cùng test (`<html lang="en">`) |
| VI render quality | summary page render tiếng Việt trong flow submit `lang=vi` | PASS | cùng test (`Trạng thái contract cần kiểm tra`, `Đang chặn`) |

## 4. Ghi chú dependency contract (Team 2)

`web.iai.one` bilingual và handoff behavior phụ thuộc Team 2 shared contract stability:

- `GET /v1/flow/web-onboarding-contract`
  - `defaultLocale`
  - `fallbackLocale`
  - `supportedLocales`
  - `wording.auth.*`
  - `wording.billing.*`
  - `routeTargets.*`
- shared query/filter naming contract cho flow APIs (`status`, `severity`, `overdue_only`, `workspace_id`)

Trạng thái dependency:
- Team 2 contract confirmation window cho Team 5 đã CLOSED (control tower record 2026-04-15).
- Dependency còn lại là Team 1 reviewer/gate owner confirmation, trong khi Team 2 contract lane ở monitor-only.
- Trạng thái live-sync hiện hành: `NOT_READY_FOR_SYNCHRONIZED_LIVE` (theo checker Team 5 đọc `CONTROL_TOWER_AUTOMATION_STATUS_2026-04-19.json`).

## 5. Lệnh smoke và xác minh

| Lệnh | Mục đích | Kết quả |
|---|---|---|
| `pnpm test:web` | web onboarding + contract + redirect smoke | PASS |
| `pnpm test:flow` | Team 2 onboarding contract + shared runtime contract checks | PASS |
| `pnpm test:noos-commerce-contracts` | fixture/schema entitlement drift guard | PASS |
| `pnpm smoke:team5-web-kpi:pilot:v2` | pilot KPI smoke với fixture v2 cho handoff proof | PASS (`Coverage: 100%`) |
| `pnpm report:team5-web-kpi -- --date=2026-04-19` | snapshot KPI sau pilot v2 | PASS (auth lỗi `25%`, route lỗi `16.67%`) |
| `pnpm report:team5-web-kpi-delta -- --date=2026-04-19 --compare-date=2026-04-18` | note cải thiện KPI theo ngày cho reviewer | PASS (auth `-25%`, route `-16.66%`) |
| `pnpm report:team5-web-kpi-bundle -- --date=2026-04-19 --compare-date=2026-04-18` | bundle snapshot + delta + gate note cho reviewer | PASS |
| `pnpm report:team5-gate-flow` | flow chuẩn hóa nộp gate cho Team 5 | PASS |
| `pnpm report:team5-live-sync-readiness -- --date=2026-04-19` | khóa trạng thái synchronized-live theo control-tower | PASS (`NOT_READY_FOR_SYNCHRONIZED_LIVE`) |
| `pnpm report:team5-live-sync-packet -- --date=2026-04-19 --compare-date=2026-04-18` | packet live-sync cuối cho reviewer/Admin | PASS |
| `pnpm report:lane` | Team 1 lane protocol snapshot health | PASS |

## 6. QA boundary vai trò

| Boundary | Kỳ vọng | Kết quả | Evidence |
|---|---|---|---|
| web vs home | web không trùng vai trò portal | PASS | `apps/web` route scope (`/`, `/onboarding`, contract handoff) |
| web vs app | web route vào shared surfaces, không thay product surface | PASS | onboarding plan + shared-auth redirect assertions |
| auth/billing ownership | không có local auth/billing wording hoặc runtime authority fork | PASS | Team 2 wording contract consume trong web runtime |

## 7. Ghi chú rollback

- Rollback path:
  - revert Team 5 web locale/wording contract-consumer deltas
  - rerun `pnpm test:web` và metadata assertions
- Owner rollback: Team 5 Web Lead
- Rollback risk: medium (có thể tái phát EN/VI hoặc handoff drift nếu revert sai)

## 8. Trạng thái QA

- Team 5 QA owner sign-off: `Y`
- Team 1 reviewer status: `PENDING`
- Packet status: `READY_FOR_TEAM1_REVIEW`
