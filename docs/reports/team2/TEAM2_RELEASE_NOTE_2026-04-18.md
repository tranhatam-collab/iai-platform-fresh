# TEAM2_RELEASE_NOTE_2026-04-18
- Nhóm: Team 2 Runtime and Platform Core
- Ngày phát hành ghi chú: 2026-04-18
- Phạm vi: `dash.iai.one` (giữ xanh) + `pay.iai.one` (prep-only)

## 1) Tóm tắt thay đổi

- Giữ ổn định lane `dash.iai.one`, không mở rộng scope.
- Củng cố prep contract cho `pay.iai.one` dưới Team 1 gate:
  - `release_claim=false`
  - noindex header/meta cho prep surface
  - locale contract EN-first, VI first-class
- Nộp đầy đủ packet intake + review delta theo checklist Team 1.

## 2) Bằng chứng kiểm thử

| Lệnh | Kết quả |
|---|---|
| `pnpm test:pay` | PASS (`6/6`) |
| `pnpm test:dash` | PASS (`11/11`) |

## 3) Trạng thái phát hành

- `dash.iai.one`: `ACCEPTED_GO` (theo Team 1).
- `pay.iai.one`: prep-only, chưa được claim release.

## 4) Rủi ro còn lại

- Rủi ro chính không nằm ở kỹ thuật runtime mà nằm ở quyết định gate của Team 1.
- Nếu Team 1 yêu cầu revision: Team 2 sẽ ship delta nhỏ, retest đầy đủ và nộp lại ngay.
