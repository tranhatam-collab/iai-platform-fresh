# MAIL_IAI_ONE_SMTP_SUBMISSION_SPEC_FINAL

IAI Mail Delivery & Automation Layer

SMTP Submission Specification v1  
Version: 1.0 - Production Lock

## 1. Muc tieu

SMTP submission ton tai de:
- phuc vu app cu, scanner, ERP, system khong goi REST API duoc
- cung cap mot diem gui mail hop le cho noi bo
- dua moi mail vao cung message orchestrator va cung policy engine

SMTP submission khong phai duong bypass API policy.

## 2. Hostname va cong

- Hostname chuan: `smtp.mail.iai.one`
- Port chuan: `587` voi STARTTLS
- Port tuy chon: `465` SMTPS neu can legacy support
- Khong dung port `25` cho client submission

## 3. Auth model

### v1 bat buoc
- SMTP AUTH `LOGIN` va `PLAIN`
- Chi cho phep sau khi da nang cap TLS

### Credential model

Moi credential phai map duoc toi:
- `workspace_id`
- `sender_identity` hoac sender profile
- stream allowlist
- rate limit policy

Credential khuyen nghi:
- username = SMTP principal
- password = generated secret
- khong dung mat khau mailbox that cho SMTP app auth

## 4. TLS policy

- Bat buoc STARTTLS tren `587`
- Tu choi auth neu chua TLS
- Yeu cau TLS >= 1.2
- Log version va cipher cho audit

## 5. HELO/EHLO va envelope

SMTP server phai:
- chap nhan `EHLO`
- ho tro `SIZE`
- ho tro `AUTH`
- ho tro `STARTTLS`

Envelope sender:
- duoc validate theo sender identity va domain policy
- khong cho phep from domain khong verify

## 6. Mapping tu SMTP sang core message

Moi phien SMTP submission phai duoc normalize thanh core send request:
- `MAIL FROM` -> envelope sender
- `From:` header -> sender identity user-facing
- `To`, `Cc`, `Bcc` -> recipients
- `Subject`
- `text/html` body
- attachment
- custom headers

Sau khi normalize, message phai di qua:
1. authz
2. sender policy
3. suppression check
4. provider route selection
5. queue

## 7. Stream mapping

### Cach 1 - map theo credential

Moi SMTP credential gan san mot stream:
- `transactional`
- `system`
- `marketing`
- `alerts`

### Cach 2 - map theo header co kiem soat

Cho phep `X-IAI-Stream` neu credential co quyen nhieu stream.

Neu khong co header:
- dung stream mac dinh cua credential

Neu header khong hop le:
- tu choi submit

## 8. Chinh sach chong open relay

Bat buoc:
- AUTH truoc khi submit
- chi cho phep sender identity hop le
- khong relay anonymous
- khong chap nhan `MAIL FROM` ngoai allowlist cua workspace
- log tat ca attempt bi tu choi

## 9. Gioi han v1

- max recipients/message: 100 mac dinh
- max message size: 20MB mac dinh
- marketing stream co the thap hon theo policy
- co rate limit theo workspace, credential va stream

## 10. Header policy

### Bat buoc bo sung boi he thong
- `Message-Id`
- `Date`
- `X-IAI-Workspace`
- `X-IAI-Stream`
- `X-IAI-Message-Id`

### Marketing bat buoc
- `List-Unsubscribe`
- `List-Unsubscribe-Post: List-Unsubscribe=One-Click`

### Headers khong cho phep client ghi de
- DKIM related internals
- internal routing headers
- provider-specific override headers neu khong duoc cho phep

## 11. DSN va bounce handling

SMTP submission khong tu xu ly bounce tai edge client.

He thong phai:
- tao return-path rieng theo stream
- map bounce ve `message_id` va recipient
- cap nhat `bounces`, `message_events`, `suppressions`

## 12. Logging va audit

Can log:
- auth success/failure
- TLS usage
- envelope sender
- recipient count
- stream
- queue accept/reject
- rejection reason

Khong log:
- raw password
- attachment binary
- noi dung nhay cam neu chinh sach cam

## 13. Error mapping

### SMTP reject phai co ly do ro
- auth sai
- sender identity khong hop le
- domain chua verify
- stream khong duoc phep
- recipient vuot policy
- message vuot size
- recipient dang bi suppress

### Mapping noi bo
- reject truoc queue -> khong tao message
- accept vao queue -> tra `250` va sinh `message_id`

## 14. Fallback va HA

Neu SMTP service mat ket noi provider:
- van chap nhan submit neu queue va runtime con khoe
- tu choi neu policy engine hoac queue khong san sang

SMTP service khong duoc tu noi voi provider truc tiep theo cach bypass worker layer.

## 15. Definition of Done

SMTP submission dat khi:
- app cu co the gui qua `smtp.mail.iai.one:587`
- moi mail deu di qua common orchestration
- khong co open relay
- stream duoc map ro rang
- logs va audit du dung cho van hanh
