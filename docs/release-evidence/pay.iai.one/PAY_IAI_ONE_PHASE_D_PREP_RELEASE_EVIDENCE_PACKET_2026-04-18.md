# PAY_IAI_ONE_PHASE_D_PREP_RELEASE_EVIDENCE_PACKET_2026-04-18
## Evidence packet release cho `pay.iai.one` (lane prep Phase D)
## Phiên bản: 1.2
## Trạng thái: `REVIEW_DELTA_SUBMITTED`
## Phạm vi: prep-only, không claim release
## Ngày: 2026-04-18

---

## Thông tin định danh

- Domain: `pay.iai.one`
- Đội phụ trách: Team 2 Runtime and Platform Core
- Chủ trách nhiệm: Team 2 Runtime Lead
- Ngày phát hành packet: 2026-04-18
- Commit/nhánh nền: `cc5a33e` trên `OMCODE/smtp-internal-first-phase1`
- Môi trường mục tiêu: lane xác minh local/runtime
- Bên duyệt gate: Team 1 Program Root
- Chủ rollback: Team 2 Runtime Lead
- Tài liệu gate/spec liên quan:
  - `docs/PAY_IAI_ONE_WALLET_AND_SETTLEMENT_PHASE_PLAN_2026.md`
  - `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-18.md`
  - `docs/reports/team1/TEAM1_PACKET_REQUEST_BATCH_2026-04-18.md`
  - `docs/reports/team1/TEAM1_REMAINING_GATE_PACKET_CHECKLIST_2026-04-18.md`

---

## 1) Phạm vi đã ship

- Tuyến route:
  - `GET /`
  - `GET /health`
  - `404` tường minh cho route không tồn tại
- Module liên quan:
  - `apps/pay/src/server.ts`
  - `apps/pay/src/render.ts`
  - `apps/pay/src/i18n.ts`
  - `apps/pay/src/index.ts`
- API/hợp đồng runtime:
  - health contract có `status=phase_d_prep`
  - Team 1 gate lock contract:
    - `owner=team1_program_root`
    - `phase=phase_d_prep`
    - `state=locked`
    - `release_claim=false`
  - locale contract:
    - `default_locale=en`
    - `fallback_locale=en`
    - `supported_locales=["en","vi"]`
  - prep control không cho index:
    - header `x-robots-tag: noindex, nofollow`
    - HTML meta `robots=noindex,nofollow`
- Nội dung chưa ship (ngoài phạm vi):
  - payout execution connectors
  - settlement batch runtime
  - crypto rails
  - mọi release claim công khai

---

## 2) Bằng chứng route

| Route | Hành vi kỳ vọng | Hành vi thực tế | Kết quả | Ghi chú |
|---|---|---|---|---|
| `/` | prep shell EN-first, hỗ trợ VI, thông điệp prep-only | render EN mặc định, render VI khi chỉ định locale | PASS | `tests/integration/pay-surface.test.mjs` |
| `/health` | trả hợp đồng prep + locale + Team 1 gate lock | trả `status=phase_d_prep`, locale contract, gate contract | PASS | cùng file test |
| `/missing` | trả `404` tường minh | phản hồi `404` với thông điệp not-found rõ ràng | PASS | cùng file test |

---

## 3) Bằng chứng API và hợp đồng

| Hợp đồng/API | Cách xác minh | Kết quả | Ghi chú |
|---|---|---|---|
| prep status contract (`phase_d_prep`) | `pnpm test:pay` | PASS | giữ trạng thái prep-only |
| Team 1 gate lock contract (`owner/phase/state/release_claim`) | `pnpm test:pay` | PASS | cưỡng chế không claim release |
| locale contract (`default/fallback/supported`) | `pnpm test:pay` | PASS | EN mặc định, VI first-class |
| fallback locale khi input không hợp lệ | `pnpm test:pay` | PASS | fallback về EN |
| prep control không index (header/meta) | `pnpm test:pay` | PASS | noindex áp dụng cho `/`, `/health`, `404`, `405` |
| method deny contract | `pnpm test:pay` | PASS | non-GET trả `405/METHOD_NOT_ALLOWED` |

---

## 4) Bằng chứng UI

| Màn hình/route | Đường dẫn bằng chứng | Trạng thái bao phủ | Ghi chú |
|---|---|---|---|
| `/` EN render | `tests/integration/pay-surface.test.mjs` | shell EN-first + canonical/hreflang + robots meta | theo hướng test-evidence-first |
| `/` VI render (`?lang=vi`) | `tests/integration/pay-surface.test.mjs` | nội dung VI first-class | theo hướng test-evidence-first |
| `/missing` | `tests/integration/pay-surface.test.mjs` | tuyến `404` tường minh | theo hướng test-evidence-first |

---

## 5) Smoke và gate checks

| Lệnh | Kết quả | Ghi chú |
|---|---|---|
| `pnpm test:pay` | PASS (`6/6`) | kiểm tra hợp đồng lane prep của pay |
| `pnpm test:dash` | PASS (`11/11`) | Dash vẫn xanh, không mở rộng scope |
| `pnpm report:control-tower` | PASS (`READY`) | lane PASS + nft-phasec PASS/GO + control READY |

---

## 6) Trường hợp biên đã kiểm tra

- input locale không hợp lệ sẽ fallback về EN
- request non-GET bị từ chối với `METHOD_NOT_ALLOWED`
- route không tồn tại trả `404` rõ ràng
- prep shell luôn không cho index (`header` + `meta`)
- release claim tiếp tục bị khóa bởi Team 1 gate contract

---

## 7) Ghi chú rollback

- Đường rollback:
  - revert các file:
    - `apps/pay/src/server.ts`
    - `apps/pay/src/render.ts`
    - `tests/integration/pay-surface.test.mjs`
  - chạy lại:
    - `pnpm test:pay`
    - `pnpm test:dash`
    - `pnpm report:control-tower`
- Chủ rollback:
  - Team 2 Runtime Lead
- Mức rủi ro rollback:
  - thấp; blast radius giới hạn trong prep contract + noindex behavior của `pay`

---

## 8) Vấn đề đã biết

| Vấn đề | Tác động | Cách xử lý tạm | Chủ sở hữu | Trạng thái |
|---|---|---|---|---|
| release claim lock vẫn bị giữ bởi Team 1 gate | `pay.iai.one` chưa thể tuyên bố releasable | duy trì prep-only và chờ Team 1 phê duyệt release-claim | Team 1 + Team 2 | OPEN |

---

## 9) Review delta theo yêu cầu Team 1

### 9.1 Bằng chứng gate cho release claim

| Bằng chứng bắt buộc | Nguồn | Trạng thái | Chi tiết |
|---|---|---|---|
| Có Team 1 gate lock contract | `/health` contract trong `apps/pay/src/server.ts` | PASS | `owner=team1_program_root`, `phase=phase_d_prep`, `state=locked`, `release_claim=false` |
| Chưa thể mở release claim | `tests/integration/pay-surface.test.mjs` + `pnpm test:pay` | PASS | payload health xác nhận `release_claim=false` |
| Lane prep vẫn không cho index | `apps/pay/src/server.ts`, `apps/pay/src/render.ts`, `pnpm test:pay` | PASS | `x-robots-tag: noindex, nofollow` + `<meta name="robots" content="noindex, nofollow" />` |

### 9.2 Điểm tham chiếu rollback

- Phần rollback đầy đủ nằm tại:
  - `## 7) Ghi chú rollback`
- Lệnh rerun rollback đã chốt:
  - `pnpm test:pay`
  - `pnpm test:dash`
  - `pnpm report:control-tower`

### 9.3 Ô verdict của Team 1 (để quyết định flip gate)

- Team 1 reviewer:
- Ngày review:
- Verdict: `ACCEPTED` / `ACCEPTED_WITH_NOTES` / `NEEDS_REVISION` / `REJECTED`
- Quyết định release-claim gate: `LOCK_RETAINED` / `LOCK_FLIPPED`
- Notes:

---

## 10) Ký xác nhận cuối

- Team 2 owner sign-off: `Y`
- Team 1 review result: `PENDING`
- Trạng thái packet cuối: `REVIEW_DELTA_SUBMITTED` (prep-only, release claim vẫn khóa)
