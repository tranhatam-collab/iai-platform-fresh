# TEAM2_DEFINITION_OF_DONE_2026
## Short definition of done for Team 2 Runtime and Platform Core
## Định nghĩa hoàn tất ngắn gọn cho Team 2 Runtime and Platform Core
## Version 2.1
## Status: LOCKED
## Date: 2026-04-18

---

## Vai trò của team

Team 2 = chủ sở hữu `runtime`, `contracts`, `auth`, `billing`, `audit` và `platform truth`

---

## Được xem là hoàn tất khi

- runtime chain ổn định end-to-end
- contract docs đã khóa và có evidence
- `auth`, `locale`, `webhook`, `fulfillment` truth rõ ràng
- các team tiêu thụ tích hợp được mà không làm gãy contract
- packet domain liên quan ở trạng thái `READY_FOR_TEAM1_REVIEW` hoặc đã qua gate

---

## Chưa được xem là hoàn tất khi

- contract đã thay đổi nhưng chưa log
- runtime pass nhưng Team 3 hoặc Team 5 vẫn không tích hợp được
- chuỗi `checkout / entitlement / library` chưa truy vết được
- Dash lane chưa có runtime truth thật
- packet release chưa đủ theo nguyên tắc `evidence-first`

---

## Team 2 không được claim xong khi

- API changelog chưa cập nhật
- webhook matrix chưa cập nhật
- `auth/session behavior` chưa có proof
- packet còn thiếu rollback note
- domain surface vẫn còn phải đoán runtime truth

---

## Bằng chứng tối thiểu

- API changelog
- webhook matrix
- error codebook
- locale contract
- fulfillment runbook
- tests, smoke checks và release packet

---

## Người phê duyệt

- Team 2 Runtime Lead
- Team 1 release gate
