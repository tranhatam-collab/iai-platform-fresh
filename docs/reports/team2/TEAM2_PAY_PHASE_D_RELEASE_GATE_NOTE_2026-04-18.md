# TEAM2_PAY_PHASE_D_RELEASE_GATE_NOTE_2026-04-18
- Nhóm: Team 2 Runtime and Platform Core
- Domain: `pay.iai.one`
- Pha: `phase_d_prep`
- Ngày cập nhật: 2026-04-18
- Trạng thái gate hiện tại: `LOCK_RETAINED` (prep-only)

## 1) Quy tắc gate đang hiệu lực

- Team 2 chỉ được vận hành lane prep, không được claim release.
- Mọi thay đổi phải giữ `release_claim=false` trong `/health`.
- Team 2 không mở rộng scope Dash trong lane này.
- Team 2 chỉ ship delta nhỏ, có kiểm thử thật và có rollback note.

## 2) Điều kiện để Team 1 xem xét flip gate

| Điều kiện | Trạng thái |
|---|---|
| Packet prep Phase D đã nộp | PASS |
| Review delta theo checklist Team 1 đã nộp | PASS |
| `pnpm test:pay` xanh | PASS (`6/6`) |
| `pnpm test:dash` xanh | PASS (`11/11`) |
| Phần rollback tồn tại và rõ ràng | PASS |

## 3) Quyết định đang chờ

- Bên quyết định: Team 1 Program Root
- Quyết định cần chốt: `LOCK_RETAINED` hoặc `LOCK_FLIPPED`
- Trước khi Team 1 chốt verdict: Team 2 tiếp tục giữ prep-only và không claim release.
