# MAIL_IAI_ONE_TEAM_EMAIL_SMTP_PROOF_RULE_BROADCAST_2026-04-22

Trạng thái: ACTIVE OPERATIONAL BROADCAST

Ngày: 2026-04-22

Áp dụng cho: Team Email SMTP

Source of truth mới cho proof rule của lane mail là commit `5e30e89`.

Từ bây giờ:

- Chỉ sender hệ thống thật trên `iai.one` qua `mailcow/mail-api` mới được tính là proof.
- Founder/personal mailbox không được dùng để claim `migrated`, `live`, hay mở bất kỳ gate vận hành nào.
- `BCC` toàn hệ tiếp tục giữ `OFF` cho tới khi có packet hợp lệ gồm đầy đủ:
  - `message_id`
  - `log/queue` hoặc DB evidence map đúng cùng message
  - inbox proof ở cả `tranhatam66@gmail.com` và `tranhatam@gmail.com`

Thứ tự thực hiện bắt buộc:

1. Đóng outbound relay proof thật bằng sender hệ thống.
2. Chốt mailbox/alias truth và inbound routing truth.
3. Lấy Gmail/Outlook/internal inbox proof.
4. Chỉ sau đó mới close từng flow và cập nhật migration waves.

Điều bị cấm:

- Không dùng founder/personal mailbox làm sender proof.
- Không bật `BCC` toàn hệ trước khi đủ packet proof hợp lệ.
- Không claim `migrated` hoặc `live` nếu thiếu `message_id`, evidence map đúng cùng message, hoặc thiếu inbox proof.

Thông điệp ngắn để copy cho team:

```text
Team Email SMTP,

Commit 5e30e89 là source of truth mới cho proof rule của lane mail.

Từ bây giờ:
- Chỉ sender hệ thống thật trên iai.one qua mailcow/mail-api mới được tính là proof.
- Founder/personal mailbox không được dùng để claim migrated, live, hay mở bất kỳ gate vận hành nào.
- BCC toàn hệ tiếp tục giữ OFF cho tới khi có packet hợp lệ gồm đầy đủ:
  - message_id
  - log/queue hoặc DB evidence map đúng cùng message
  - inbox proof ở cả tranhatam66@gmail.com và tranhatam@gmail.com

Thứ tự thực hiện bắt buộc:
1. Đóng outbound relay proof thật bằng sender hệ thống.
2. Chốt mailbox/alias truth và inbound routing truth.
3. Lấy Gmail/Outlook/internal inbox proof.
4. Chỉ sau đó mới close từng flow và cập nhật migration waves.
```
