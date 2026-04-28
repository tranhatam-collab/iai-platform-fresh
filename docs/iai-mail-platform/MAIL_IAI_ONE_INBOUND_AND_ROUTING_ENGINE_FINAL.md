# MAIL_IAI_ONE_INBOUND_AND_ROUTING_ENGINE_FINAL

IAI Mail Delivery & Automation Layer

Inbound and Routing Engine Specification v1  
Version: 1.0 - Production Lock

## 1. Muc tieu

Inbound engine giup IAI:
- nhan mail den
- parse va chuan hoa raw message
- route dung mailbox hoac workflow
- bien email thanh trigger cho cac he thong noi bo

## 2. Nguon inbound

V1 co the nhan tu:
- Mailcow/Postfix receiver
- SMTP receiver rieng
- webhook-based inbound provider
- email worker cho routing inbound

Quyet dinh:
- Inbound co the tan dung ha tang nhan mail hien co.
- Sau khi nhan, tat ca deu phai normalize ve mot event model chung.

## 3. Inbound pipeline

1. Receive raw message
2. Parse MIME
3. Extract envelope, headers, subject, html, text, attachments
4. Doc auth results: SPF/DKIM/DMARC neu co
5. Tinh spam score hoac nhan score tu receiver
6. Match inbound route
7. Thuc thi action
8. Ghi log/audit

## 4. Du lieu bat buoc phai trich xuat

- `message_id`
- `to`
- `from`
- `reply_to`
- `subject`
- `date`
- `text_body`
- `html_body`
- `headers`
- `attachments`
- `auth_results`
- `spam_score`
- `received_at`

## 5. Routing model

Moi inbound route co:
- `route_key`
- `priority`
- `match`
- `action`
- `status`

### Match co the dua tren
- recipient address
- recipient domain
- subject prefix
- header value
- spam/auth threshold

### Action v1
- deliver to mailbox
- forward webhook
- trigger automation
- create ticket
- create CRM event
- archive only

## 6. Sample routing rules

### Ho tro support
- `support@iai.one` -> webhook ticket system

### Automation aliases
- `billing+inbound@iai.one` -> workflow billing

### Internal ops
- `alerts@iai.one` -> archive + Slack or incident workflow

## 7. Security va hygiene

- Gioi han size inbound
- Scan attachment async
- Detect loop header
- Chan route cho spam score qua nguong neu policy can
- Luu raw payload o object storage, khong nhat thiet full blob trong DB

## 8. Threading va correlate

Neu co `In-Reply-To` hoac `References`:
- co the map ve thread noi bo
- co the map ve `message_id` outbound truoc do

Muc dich:
- support email reply workflow
- status trace hai chieu

## 9. Inbound to automation

Inbound duoc phep tao event normalize, vi du:
- `mail.inbound.received`
- `mail.inbound.reply_detected`
- `mail.inbound.attachment_received`

Event nay se duoc ingest vao engine automation.

## 10. Storage policy

Luu DB:
- normalized metadata
- attachment metadata
- route result

Luu object storage:
- raw MIME
- attachment binary

## 11. Error handling

Neu parse loi:
- tao record inbound voi `parsed_status = failed`
- luu ly do
- cho phep reprocess

Neu route loi:
- `route_status = failed`
- log action target va retry policy neu la webhook

## 12. Monitoring

- inbound count theo domain
- parse failure rate
- route failure rate
- attachment scan failure
- spam score trend
- auth fail trend

## 13. Definition of Done

Inbound engine dat khi:
- nhan duoc raw mail
- parse duoc MIME co ban
- route duoc theo rule
- trigger duoc workflow noi bo
- luu duoc trace de ops debug
