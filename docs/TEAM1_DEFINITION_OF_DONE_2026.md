# TEAM1_DEFINITION_OF_DONE_2026
## Short definition of done for Team 1 Program Root
## Định nghĩa hoàn tất ngắn gọn cho Team 1 Program Root
## Version 2.1
## Status: LOCKED
## Date: 2026-04-18

---

## Vai trò của team

Team 1 = `command center` / `gate authority` / `deploy authority` / người giữ quyết định liên team

---

## Được xem là hoàn tất khi

- bộ governance files đã khóa và đồng bộ
- dependency truth đã rõ: ai chặn ai, artifact nào còn thiếu
- release gate có kết quả rõ ràng: `PASS`, `CONDITIONAL`, hoặc `FAIL`
- risk log và decision log được cập nhật đúng checkpoint
- deploy authority và rollback authority được ghi rõ
- có post-gate note hoặc post-deploy observation

---

## Chưa được xem là hoàn tất khi

- vai trò các team còn chồng chéo
- release gate còn mơ hồ
- dependency bị treo nhưng chưa có quyết định
- domain owner đã nộp packet nhưng Team 1 chưa phân loại kết quả
- deploy authority bị phân tán hoặc chưa có người chốt `GO / NO-GO`

---

## Team 1 không được claim xong khi

- chưa có packet cho domain đang review
- chưa có rollback note
- chưa chạy lại `lane` hoặc `control-tower` sau packet delta quan trọng
- chưa gọi tên rõ owner của blocker

---

## Bằng chứng tối thiểu

- live tracking board
- dependency critical path
- risk register
- decision log
- gate decision evidence
- deploy decision và post-deploy note

---

## Người phê duyệt

- Founder
- Team 1 Program Root
