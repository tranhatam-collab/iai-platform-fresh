# TEAM_ADMIN_STRICT_EXECUTION_DIRECTIVE_2026-04-18
## Chỉ thị vận hành nghiêm ngặt của Team Admin cho toàn bộ team
## Status: ACTIVE
## Date: 2026-04-18

---

## 1. Mục tiêu

Từ thời điểm này, toàn bộ hệ phải làm việc ở chế độ nghiêm túc tuyệt đối.

Điều này áp dụng cho:
- Team Admin
- Team 1
- Team 2
- Team 3
- Team 4
- Team 5

Không có ngoại lệ cho:
- file nội bộ
- packet tạm
- note ngắn
- report nhanh
- handoff miệng rồi ghi lại sau

---

## 2. Quy tắc tuyệt đối

Từ bây giờ:
- không suy đoán rồi gọi là đã xác minh
- không claim `done` nếu chưa có evidence
- không claim `ready` nếu chưa qua gate
- không né blocker bằng cách đổi wording
- không dùng tài liệu cẩu thả để ép review
- không dùng tiếng Việt không dấu
- không dùng tiếng Anh sai nghĩa kỹ thuật

Hard rule:
- thiếu bằng chứng -> chưa xong
- thiếu rollback -> chưa qua gate
- thiếu owner rõ ràng -> chưa được review
- ngôn ngữ sai chuẩn -> trả lại để sửa trước

---

## 3. Quy tắc của Team Admin

Team Admin, bao gồm cả mình, phải giữ:
- review theo evidence trước, không theo cảm giác
- gate theo chuẩn đã khóa, không gate theo thiện chí
- ghi rõ `PASS / CONDITIONAL / FAIL / BLOCKED`
- gọi tên đúng owner của blocker
- không bỏ qua packet lỗi vì “gần xong”
- không để claim release đi trước shipping truth

Team Admin không được:
- nới chuẩn cho bất kỳ team nào
- dùng từ mơ hồ để tránh kết luận
- cho đi tiếp nếu packet chưa đủ bộ
- chấp nhận tài liệu sai dấu, sai nghĩa hoặc sai role language

---

## 4. Lệnh cho từng team

### Team 1

Team 1 phải:
- giữ quyền `GO / NO-GO / BLOCKED`
- fail ngay packet thiếu `rollback`, `environment truth`, `owner signoff`
- fail ngay packet có tiếng Việt không dấu hoặc tiếng Anh sai technical meaning
- không cho `pay.iai.one` đi khỏi `prep-only` nếu chưa đủ packet review-ready

### Team 2

Team 2 phải:
- nộp packet theo chuẩn `evidence-first`
- ghi rõ `target environment`, `binding groups`, `secret groups`, `rollback path`
- không mở `release claim` nếu runtime truth chưa khóa
- không gửi Team 1 mô tả kỹ thuật cẩu thả hoặc thiếu nghĩa

### Team 3

Team 3 phải:
- giữ `monitor-only mode` đúng phạm vi
- không mở scope mới khi chưa có Team 1 note
- nộp `route QA`, `metadata`, `locale evidence` đúng chuẩn song ngữ
- không tự sửa runtime truth hoặc tách contract khỏi Team 2

### Team 4

Team 4 phải:
- chỉ làm `support / recovery / trace mapping / growth ops` trong phạm vi truth đã khóa
- không mở claim mới nếu upstream truth chưa đổi
- không dùng wording lách gate
- nộp ops evidence đúng chuẩn, rõ owner, rõ rollback communication

### Team 5

Team 5 phải:
- giữ `web.iai.one` trong monitor-only nếu Team 1 chưa mở lane mới
- bám shared `auth / billing / runtime truth`
- không tự định nghĩa billing wording hoặc release wording
- nộp KPI, event proof, SEO proof theo evidence current

---

## 5. Mức review nghiêm ngặt

### PASS

Chỉ dùng khi:
- scope rõ
- evidence đủ
- rollback đủ
- language đúng chuẩn
- gate đúng domain

### CONDITIONAL

Chỉ dùng khi:
- lõi đã đạt
- còn thiếu hạng mục nhỏ, có owner rõ, có hạn xử lý rõ

### FAIL

Dùng khi:
- packet sai chuẩn
- bằng chứng không khớp claim
- thiếu phần bắt buộc nhưng team vẫn claim hoàn tất

### BLOCKED

Dùng khi:
- bị upstream truth chặn
- thiếu packet canonical
- thiếu release gate
- thiếu rollback
- thiếu environment truth

---

## 6. Auto-fail conditions

Tự động trả lại review nếu có một trong các lỗi sau:
- tiếng Việt không dấu
- tiếng Anh sai nghĩa kỹ thuật
- file không ghi owner
- file không ghi status
- file không ghi date
- packet không có rollback note
- packet không có release gate reference
- claim `done` nhưng không có proof
- claim `ready` nhưng không có Team 1 signoff

---

## 7. Thông điệp gửi từng team

### Team 1

`Team Admin directive: từ thời điểm này Team 1 review ở chế độ nghiêm ngặt tuyệt đối. Packet thiếu evidence, rollback, environment truth hoặc sai chuẩn ngôn ngữ phải fail ngay. Không cho lane nào đi tiếp chỉ vì “gần xong”.`

### Team 2

`Team Admin directive: Team 2 chỉ được nộp packet theo chuẩn evidence-first. Mọi claim về runtime, auth, billing, pay phải có bằng chứng current, rollback rõ, environment rõ. Tài liệu sai dấu, sai nghĩa hoặc thiếu owner sẽ bị trả lại ngay.`

### Team 3

`Team Admin directive: Team 3 giữ monitor-only đúng phạm vi. Không mở scope mới, không fork contract, không tự sửa runtime truth. Mọi route QA, locale, metadata note phải viết chuẩn tiếng Việt có dấu và song ngữ đúng nghĩa.`

### Team 4

`Team Admin directive: Team 4 chỉ vận hành trong phạm vi support, recovery, trace mapping và growth ops đã được khóa. Không mở claim mới, không lách gate bằng wording. Mọi packet ops phải có evidence, owner và rollback communication rõ ràng.`

### Team 5

`Team Admin directive: Team 5 giữ web trong monitor-only cho tới khi Team 1 mở lane mới. Không tự viết lại billing, auth, runtime truth. KPI, event proof và SEO proof phải current, có thể kiểm tra và nộp theo packet chuẩn.`

---

## 8. Câu chốt

Từ bây giờ:
- làm nghiêm túc tuyệt đối
- review nghiêm túc tuyệt đối
- báo cáo nghiêm túc tuyệt đối
- không có vùng xám cho file cẩu thả
- không có đường tắt qua gate
