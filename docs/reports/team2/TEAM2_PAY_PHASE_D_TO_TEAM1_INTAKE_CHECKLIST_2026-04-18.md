# TEAM2_PAY_PHASE_D_TO_TEAM1_INTAKE_CHECKLIST_2026-04-18
- Nhóm: Team 2 Runtime and Platform Core
- Bên nhận: Team 1 Program Root
- Phạm vi: intake packet `pay.iai.one` cho Phase D prep-only
- Ngày: 2026-04-18
- Trạng thái: `READY_FOR_TEAM1_INTAKE`

## 1. Packet đang được review

- Đường dẫn packet:
  - `docs/release-evidence/pay.iai.one/PAY_IAI_ONE_PHASE_D_PREP_RELEASE_EVIDENCE_PACKET_2026-04-18.md`
  - `docs/release-evidence/pay.iai.one/PAY_IAI_ONE_PHASE_D_TEAM1_REVIEW_DELTA_2026-04-18.md`
- Mục tiêu packet:
  - prep-only dưới Team 1 gate
  - tường minh không claim release

## 2. Danh mục kiểm tra intake của Team 1 (fast pass)

| Hạng mục kiểm tra | Bắt buộc | Hiện trạng |
|---|---|---|
| Scope khai báo prep-only (không có payout release claim) | Y | PASS |
| Team 1 gate lock contract trong `/health` (`owner/phase/state/release_claim`) | Y | PASS |
| Prep control không cho index (`x-robots-tag` + `meta robots`) | Y | PASS |
| Locale contract (`default=en`, `fallback=en`, `supported=[en,vi]`) | Y | PASS |
| Deny guard cho prep route khi non-GET (`405`) | Y | PASS |
| Pay integration tests đạt (`pnpm test:pay`) | Y | PASS (`6/6`) |
| Dash vẫn xanh (`pnpm test:dash`) | Y | PASS (`11/11`) |
| Có phần rollback trong packet | Y | PASS |
| Có phần verdict của Team 1 trong packet delta | Y | PASS |

## 3. Kết quả rerun verify gần nhất (Team 2)

| Lệnh | Kết quả |
|---|---|
| `pnpm test:pay` | PASS (`6/6`) |
| `pnpm test:dash` | PASS (`11/11`) |
| `pnpm report:control-tower` | PASS (`READY`) |

## 4. Xác nhận của Team 2

- Team 2 xác nhận block acceptance của `dash.iai.one` đã đóng (`ACCEPTED_GO` bởi Team 1).
- Team 2 xác nhận `pay.iai.one` vẫn prep-only và release claim tiếp tục bị khóa cho đến khi Team 1 duyệt.

## 5. Việc còn lại

- Team 1: review intake và chốt verdict.
- Team 2: chỉ hành động khi có revision request; nếu không thì giữ nguyên prep lock.

## 6. Ô quyết định của Team 1

- Intake reviewer:
- Intake date:
- Verdict: `ACCEPTED` / `ACCEPTED_WITH_NOTES` / `NEEDS_REVISION`
- Notes:
