# DEVELOPER_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-21

- Domain: `developer.iai.one`
- Owner team: Team A
- Named owner: Team A DevRel Owner
- Release date: 2026-04-21
- Commit / branch: `OMCODE/smtp-internal-first-phase1@6783482`
- Target environment: `preview (Cloudflare Pages deploy)`
- Preview deployment URL: `https://376c6044.iai-developer.pages.dev`
- Preview alias URL: `https://omcode-smtp-internal-first-p.iai-developer.pages.dev`
- Approver: `PENDING_TEAM1_REVIEW`
- Rollback owner: Team A DevRel Owner
- Related release gate file: `docs/DEVELOPER_IAI_ONE_RELEASE_GATE_2026.md`
- Status: `PREVIEW_EVIDENCE_COMPLETE_READY_FOR_TEAM1_REOPEN`

## 1. Scope shipped
- Routes: `Đã có route local cho /, /health, /quickstart, /auth, /api/reference, /webhooks, /sdk, /nodes, /changelog.`
- Modules:
  - `apps/developer/src/index.ts`
  - `apps/developer/src/server.ts`
  - `apps/developer/src/i18n.ts`
  - `apps/developer/src/render.ts`
  - `tests/integration/developer-surface.test.mjs`
  - `package.json` scripts: `build:developer`, `dev:developer`, `test:developer`, `typecheck:developer`
- APIs/contracts: `Có route-level contract docs + test local + live curl proof từ preview cho auth/API/webhooks.`
- Explicitly not shipped: `Chưa có Team 1 reopen verdict cuối cho release gate.`

## 2. Route evidence
| Route | Expected | Actual | Pass/Fail | Notes |
|---|---|---|---|---|
| `/` | Render developer builder shell + metadata EN/VI | PASS local qua integration test | `PASS` | Có canonical + hreflang + JSON-LD |
| `/health` | Trả service + wiring links | PASS local qua integration test | `PASS` | `service=iai-developer`, có `api_url`, `flow_api_url` |
| `/quickstart` | Required route theo release gate | PASS local qua integration test + canonical proof | `PASS` | Route thật đã mở |
| `/auth` | Required route theo release gate | PASS local qua integration test + canonical proof | `PASS` | Route thật đã mở |
| `/api/reference` | Required route theo release gate | PASS local qua integration test + canonical proof | `PASS` | Route thật đã mở |
| `/webhooks` | Required route theo release gate | PASS local qua integration test + canonical proof | `PASS` | Route thật đã mở |
| `/sdk` | Required route theo release gate | PASS local qua integration test + canonical proof | `PASS` | Route thật đã mở |
| `/nodes` | Required route theo release gate | PASS local qua integration test + canonical proof | `PASS` | Route thật đã mở |
| `/changelog` | Required route theo release gate | PASS local qua integration test + canonical proof | `PASS` | Route thật đã mở |

## 3. API and contract evidence
| Contract / API | Verification method | Result | Notes |
|---|---|---|---|
| Developer local health contract | `node --test tests/integration/developer-surface.test.mjs` | `PASS` | Xác nhận payload health và ngôn ngữ |
| Auth/session docs alignment | Đối chiếu route `/auth` + integration test + live curl preview | `PASS_RUNTIME` | `auth-final.txt` cho chain `301 -> 200` |
| API reference alignment | Đối chiếu route `/api/reference` + integration test + live curl preview | `PASS_RUNTIME` | `api-reference-final.txt` cho chain `301 -> 200` |
| Webhook example alignment | Đối chiếu route `/webhooks` + integration test + live curl preview | `PASS_RUNTIME` | `webhooks-final.txt` cho chain `301 -> 200` |

## 4. UI evidence
| Screen / route | Screenshot path | State covered | Notes |
|---|---|---|---|
| Developer landing shell (`/`) | `docs/release-evidence/developer.iai.one/artifacts/screenshots/root.png` | `PREVIEW_RENDERED` | Capture từ preview deploy |
| `/quickstart` | `docs/release-evidence/developer.iai.one/artifacts/screenshots/quickstart.png` | `PREVIEW_RENDERED` | Capture từ preview deploy |
| `/auth` | `docs/release-evidence/developer.iai.one/artifacts/screenshots/auth.png` | `PREVIEW_RENDERED` | Capture từ preview deploy |
| `/api/reference` | `docs/release-evidence/developer.iai.one/artifacts/screenshots/api-reference.png` | `PREVIEW_RENDERED` | Capture từ preview deploy |
| `/webhooks` | `docs/release-evidence/developer.iai.one/artifacts/screenshots/webhooks.png` | `PREVIEW_RENDERED` | Capture từ preview deploy |
| `/sdk` | `docs/release-evidence/developer.iai.one/artifacts/screenshots/sdk.png` | `PREVIEW_RENDERED` | Capture từ preview deploy |
| `/nodes` | `docs/release-evidence/developer.iai.one/artifacts/screenshots/nodes.png` | `PREVIEW_RENDERED` | Capture từ preview deploy |
| `/changelog` | `docs/release-evidence/developer.iai.one/artifacts/screenshots/changelog.png` | `PREVIEW_RENDERED` | Capture từ preview deploy |

## 5. curl / smoke evidence
| Test | Command / method | Result | Request / execution id | Notes |
|---|---|---|---|---|
| Build developer lane | `pnpm build:developer` | `PASS` | `local-dev-2026-04-21-build` | Build thành công |
| Integration test | `pnpm test:developer` | `PASS` | `local-dev-2026-04-21-test` | 5 test pass, 0 fail |
| Typecheck developer lane | `pnpm typecheck:developer` | `PASS` | `local-dev-2026-04-21-typecheck` | Không có TS error |
| Local route proof artifact | `pnpm proof:developer-local` | `PASS` | `local-dev-2026-04-21-proof` | Artifact: `docs/release-evidence/developer.iai.one/artifacts/DEVELOPER_IAI_ONE_LOCAL_ROUTE_PROOF_2026-04-21.md` + `.json` |
| Preview deploy | `pnpm --filter @iai/developer deploy:preview` | `PASS` | `preview-deploy-2026-04-21` | URL: `https://376c6044.iai-developer.pages.dev` |
| Live curl proof `/health` | `curl -i -sS https://376c6044.iai-developer.pages.dev/health` | `PASS` | `preview-curl-health-2026-04-21` | Artifact: `artifacts/curl/health.txt` |
| Live curl proof `/auth` | `curl -i -sS -L https://376c6044.iai-developer.pages.dev/auth` | `PASS` | `preview-curl-auth-2026-04-21` | Artifact: `artifacts/curl/auth-final.txt` |
| Live curl proof `/api/reference` | `curl -i -sS -L https://376c6044.iai-developer.pages.dev/api/reference` | `PASS` | `preview-curl-api-reference-2026-04-21` | Artifact: `artifacts/curl/api-reference-final.txt` |
| Live curl proof `/webhooks` | `curl -i -sS -L https://376c6044.iai-developer.pages.dev/webhooks` | `PASS` | `preview-curl-webhooks-2026-04-21` | Artifact: `artifacts/curl/webhooks-final.txt` |

## 6. Edge cases covered
- Non-GET request trả `405 METHOD_NOT_ALLOWED` theo logic server.
- Route không tồn tại trả `404` rõ ràng.
- Hỗ trợ locale explicit `?lang=en` và default `vi`.

## 7. Rollback note
- Rollback path: `NO_RELEASE_NO_ROLLBACK (chưa có deploy release candidate)`
- Rollback owner: Team A DevRel Owner
- Rollback risk: `Medium` (rủi ro chính là mở release claim khi thiếu route bắt buộc theo gate)

## 8. Known issues
| Issue | Impact | Workaround | Owner | Status |
|---|---|---|---|---|
| Team 1 reopen verdict chưa được ghi nhận trong packet này | Chưa thể đóng release gate cuối cùng | Gửi packet + artifact cho Team 1 để lấy verdict `PASS/GO` | Team 1 Program Root | `OPEN` |

## 9. Final sign-off
- Owner sign-off: `OWNER_RUNTIME_EVIDENCE_ATTACHED_2026-04-21`
- Team 1 review: `PENDING_TEAM1_GATE_REVIEW`
- Final status: `READY_FOR_TEAM1_REOPEN_VERDICT`
