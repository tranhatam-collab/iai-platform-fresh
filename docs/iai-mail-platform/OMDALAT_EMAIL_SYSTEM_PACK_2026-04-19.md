# OMDALAT - Gói email hệ thống 2026-04-19

Mục tiêu của gói này là chốt nhanh bộ mailbox, sender, trigger và mẫu email song ngữ cho `omdalat.com` và `ap.omdalat.com` để Team Web, Team App và Team SMTP dùng ngay sau khi domain live.

## Mailbox vận hành cần có

- `hello@omdalat.com`: tiếp nhận liên hệ công khai, câu hỏi tổng quát, đối ngoại cơ bản.
- `support@omdalat.com`: tiếp nhận hỗ trợ tài khoản, lỗi truy cập, lỗi form, lỗi app.
- `join@omdalat.com`: tiếp nhận đơn tham gia hệ, onboarding, hồ sơ quan tâm.
- `partnerships@omdalat.com`: tiếp nhận đề nghị hợp tác, media, cộng tác.
- `trust@omdalat.com`: tiếp nhận báo cáo trust, safety, moderation, khiếu nại.
- `noreply@omdalat.com`: sender hệ thống cho magic link, xác minh email, thông báo trạng thái.

## Alias nên gom lúc đầu

- `app@omdalat.com` -> `support@omdalat.com`
- `hosts@omdalat.com` -> `join@omdalat.com`
- `experts@omdalat.com` -> `join@omdalat.com`
- `communities@omdalat.com` -> `join@omdalat.com`
- `events@omdalat.com` -> `join@omdalat.com`
- `requests@omdalat.com` -> `support@omdalat.com`
- `places@omdalat.com` -> `support@omdalat.com`

## Quy tắc sender

- `noreply@omdalat.com`: chỉ dùng cho email hệ thống, không nhận trả lời người dùng.
- `hello@omdalat.com`: dùng cho contact form và auto-reply chung.
- `support@omdalat.com`: dùng cho support form, ticket và follow-up vận hành.
- `join@omdalat.com`: dùng cho flow tham gia hệ, onboarding và review hồ sơ.
- `partnerships@omdalat.com`: dùng cho flow hợp tác.
- `trust@omdalat.com`: dùng cho trust, moderation và incident notice.

## Trigger matrix

### 1. Liên hệ công khai

- Trigger: người dùng gửi form liên hệ trên `omdalat.com`.
- Email đi nội bộ:
  - From: `hello@omdalat.com`
  - To: `hello@omdalat.com`
  - CC: `support@omdalat.com`
- Auto-reply cho người gửi:
  - From: `hello@omdalat.com`
  - To: email người gửi

### 2. Đăng ký tham gia hệ

- Trigger: người dùng gửi form tham gia, quan tâm chương trình, hoặc leave-intent trên site.
- Email đi nội bộ:
  - From: `join@omdalat.com`
  - To: `join@omdalat.com`
  - CC: `support@omdalat.com`
- Auto-reply:
  - From: `join@omdalat.com`
  - To: email người gửi

### 3. Hỗ trợ tài khoản / app

- Trigger: người dùng gửi support form ở `ap.omdalat.com`.
- Email đi nội bộ:
  - From: `support@omdalat.com`
  - To: `support@omdalat.com`
- Auto-reply:
  - From: `support@omdalat.com`
  - To: email người gửi

### 4. Magic link đăng nhập

- Trigger: người dùng yêu cầu đăng nhập bằng email trên `ap.omdalat.com`.
- Email đi ra:
  - From: `noreply@omdalat.com`
  - To: email người dùng

### 5. Xác minh email

- Trigger: người dùng cần xác nhận email trước khi mở quyền.
- Email đi ra:
  - From: `noreply@omdalat.com`
  - To: email người dùng

### 6. Hợp tác / media

- Trigger: người dùng gửi form partnership hoặc press inquiry.
- Email đi nội bộ:
  - From: `partnerships@omdalat.com`
  - To: `partnerships@omdalat.com`
  - CC: `hello@omdalat.com`
- Auto-reply:
  - From: `partnerships@omdalat.com`
  - To: email người gửi

### 7. Trust / safety / moderation

- Trigger: báo cáo vi phạm, khiếu nại, vấn đề trust.
- Email đi nội bộ:
  - From: `trust@omdalat.com`
  - To: `trust@omdalat.com`
  - CC: `support@omdalat.com`
- Auto-reply:
  - From: `trust@omdalat.com`
  - To: email người gửi

## Bộ mẫu email song ngữ

### A. Contact auto-reply

- Trigger: gửi form liên hệ công khai.
- From: `hello@omdalat.com`
- Subject VI: `OMDALAT đã nhận liên hệ của bạn`
- Subject EN: `OMDALAT received your message`
- Preview VI: `Cảm ơn bạn đã liên hệ. Đội ngũ sẽ phản hồi trong thời gian sớm nhất.`
- Preview EN: `Thank you for reaching out. Our team will reply as soon as possible.`
- Biến dữ liệu:
  - `{{name}}`
  - `{{submitted_at}}`
  - `{{topic}}`
  - `{{reply_window}}`

Nội dung VI:

> Chào `{{name}}`,  
> OMDALAT đã nhận liên hệ của bạn vào `{{submitted_at}}`.  
> Đội ngũ đang xem xét nội dung về `{{topic}}` và sẽ phản hồi trong `{{reply_window}}`.  
> Nếu bạn cần bổ sung thông tin, chỉ cần trả lời email này.

Nội dung EN:

> Hello `{{name}}`,  
> OMDALAT received your message on `{{submitted_at}}`.  
> Our team is reviewing your request about `{{topic}}` and will reply within `{{reply_window}}`.  
> If you want to add more context, simply reply to this email.

### B. Contact internal operator alert

- Trigger: gửi form liên hệ công khai.
- From: `hello@omdalat.com`
- To: `hello@omdalat.com`
- Subject VI: `[OMDALAT] Liên hệ mới từ {{name}}`
- Subject EN: `[OMDALAT] New contact from {{name}}`
- Biến dữ liệu:
  - `{{name}}`
  - `{{email}}`
  - `{{topic}}`
  - `{{message}}`
  - `{{source_url}}`

### C. Join auto-reply

- Trigger: gửi form tham gia hệ.
- From: `join@omdalat.com`
- Subject VI: `OMDALAT đã nhận yêu cầu tham gia của bạn`
- Subject EN: `OMDALAT received your join request`
- Preview VI: `Hồ sơ của bạn đã vào hàng đợi review ban đầu.`
- Preview EN: `Your request is now in the initial review queue.`
- Biến dữ liệu:
  - `{{name}}`
  - `{{submitted_at}}`
  - `{{pathway}}`
  - `{{next_step}}`

### D. Support auto-reply

- Trigger: gửi support form trong app.
- From: `support@omdalat.com`
- Subject VI: `OMDALAT đã nhận yêu cầu hỗ trợ của bạn`
- Subject EN: `OMDALAT received your support request`
- Biến dữ liệu:
  - `{{name}}`
  - `{{ticket_id}}`
  - `{{submitted_at}}`
  - `{{category}}`

### E. Magic link login

- Trigger: yêu cầu đăng nhập bằng email.
- From: `noreply@omdalat.com`
- Subject VI: `Đăng nhập vào OMDALAT`
- Subject EN: `Sign in to OMDALAT`
- Preview VI: `Nhấn vào nút để đăng nhập an toàn. Liên kết sẽ hết hạn sau {{expires_in}}.`
- Preview EN: `Use the button below to sign in securely. This link expires in {{expires_in}}.`
- Biến dữ liệu:
  - `{{name}}`
  - `{{magic_link}}`
  - `{{expires_in}}`
  - `{{requested_at}}`
  - `{{request_ip}}`

Nội dung VI:

> Chào `{{name}}`,  
> Bạn vừa yêu cầu đăng nhập vào OMDALAT lúc `{{requested_at}}`.  
> Nhấn vào nút dưới đây để đăng nhập an toàn: `{{magic_link}}`  
> Liên kết này sẽ hết hạn sau `{{expires_in}}`.  
> Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này.

Nội dung EN:

> Hello `{{name}}`,  
> You requested to sign in to OMDALAT at `{{requested_at}}`.  
> Use this secure link to continue: `{{magic_link}}`  
> This link expires in `{{expires_in}}`.  
> If this was not you, you can safely ignore this email.

### F. Email verification

- Trigger: xác minh email trước khi mở quyền.
- From: `noreply@omdalat.com`
- Subject VI: `Xác nhận email của bạn trên OMDALAT`
- Subject EN: `Confirm your email for OMDALAT`
- Biến dữ liệu:
  - `{{name}}`
  - `{{verification_link}}`
  - `{{expires_in}}`

### G. Partnership auto-reply

- Trigger: gửi form hợp tác.
- From: `partnerships@omdalat.com`
- Subject VI: `OMDALAT đã nhận đề nghị hợp tác của bạn`
- Subject EN: `OMDALAT received your partnership request`
- Biến dữ liệu:
  - `{{name}}`
  - `{{organization}}`
  - `{{focus_area}}`
  - `{{reply_window}}`

### H. Trust report auto-reply

- Trigger: gửi báo cáo trust/safety.
- From: `trust@omdalat.com`
- Subject VI: `OMDALAT đã nhận báo cáo của bạn`
- Subject EN: `OMDALAT received your report`
- Biến dữ liệu:
  - `{{name}}`
  - `{{report_id}}`
  - `{{submitted_at}}`
  - `{{severity}}`

### I. Welcome approved member

- Trigger: hồ sơ được chấp nhận hoặc người dùng được mở quyền.
- From: `join@omdalat.com`
- Subject VI: `Chào mừng bạn vào OMDALAT`
- Subject EN: `Welcome to OMDALAT`
- Biến dữ liệu:
  - `{{name}}`
  - `{{role}}`
  - `{{dashboard_url}}`
  - `{{getting_started_url}}`

## Yêu cầu kỹ thuật để team dùng ngay

- Mọi email transactional phải đi qua `api.mail.iai.one/v1` hoặc internal SMTP đã khóa.
- Header kỹ thuật tối thiểu:
  - `x-iai-source-surface`
  - `x-iai-flow-kind`
  - `x-iai-locale`
  - `x-iai-tenant=omdalat`
- Bản auto-reply và bản operator alert phải dùng cùng `trace_id`.
- Với form công khai, luôn gửi 2 email:
  - 1 email nội bộ cho operator
  - 1 email xác nhận cho người gửi

## Gate để coi email OMDALAT sẵn sàng

- `omdalat.com` live đúng domain mới.
- `ap.omdalat.com` live đúng app domain mới.
- `hello@`, `support@`, `join@`, `partnerships@`, `trust@`, `noreply@` đã tồn tại thật.
- Contact flow gửi được 1 email nội bộ + 1 auto-reply thật.
- Support flow gửi được 1 email nội bộ + 1 auto-reply thật.
- Magic link gửi thật, có subject và nội dung song ngữ rõ ràng.
- Tất cả sender đi qua DKIM/SPF/DMARC pass trên domain `omdalat.com`.
