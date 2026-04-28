# MAIL_IAI_ONE_AUTOMATION_AND_TEMPLATE_ENGINE_FINAL

IAI Mail Delivery & Automation Layer

Automation and Template Engine Specification v1  
Version: 1.0 - Production Lock

## 1. Muc tieu

Engine nay phuc vu:
- event-driven email
- template versioning
- da ngon ngu
- delayed follow-up
- workflow email tu dong cho toan he `*.iai.one`

## 2. Template model

Template co 2 lop:
- logical template: `template_key`
- materialized version: `template_version`

Moi version bat buoc co:
- `subject`
- `html`
- `text`
- `locale`
- `allowed_streams`

## 3. Rules cho template

- Khong sua de ghi de version da publish.
- Moi thay doi tao version moi.
- Chi co mot active version logic trong moi template.
- Support locale fallback: `requested -> workspace default -> en`

## 4. Variable model

Variables duoc chia:
- recipient variables
- global variables
- metadata

Bat buoc:
- validate variable thieu truoc khi queue
- preview phai hien field thieu
- khong cho render am tham template loi

## 5. Rendering engine

V1 khuyen nghi:
- Mustache-compatible render
- Logic trong template giu toi thieu
- Khong bo business logic phuc tap vao template

Pre-render pipeline:
1. Chon version
2. Resolve locale
3. Merge variables
4. Validate required variables
5. Render subject/html/text
6. Kiem tra marketing policy neu can

## 6. Automation model

Automation co:
- `automation_key`
- `name`
- `trigger`
- `actions`
- `status`

Trang thai:
- `draft`
- `active`
- `paused`
- `archived`

## 7. Trigger types v1

- event-based (`user.signup.completed`)
- inbound-based (`mail.inbound.received`)
- scheduled follow-up (delay tu action)

## 8. Action types v1

- `send_template`
- `wait`
- `call_webhook`
- `add_suppression`
- `tag_contact` hoac metadata update noi bo

Action quan trong nhat ngay dau la `send_template`.

## 9. Delay va scheduling

Moi action co `delay_seconds`.

Vi du:
- welcome ngay lap tuc
- follow-up sau 2 ngay
- renewal reminder sau 7 ngay

Delay execution do `mail-worker` hoac scheduler service xu ly.

## 10. Idempotency

`events/ingest` phai idempotent theo `event_id`.

Moi automation run phai ghi:
- event nao kick off
- action nao da chay
- action nao da fail
- ly do

## 11. Audit va observability

Can xem duoc:
- template dang active
- ai publish version nao
- event nao tao run nao
- email nao duoc gui boi automation nao
- ty le fail theo action

## 12. Governance

- Template marketing phai co unsubscribe footer/header
- Template transactional khong duoc chen content marketing
- Tu dong hoa khong duoc vuot sender policy
- Moi action gui mail van phai di qua cung suppression va routing engine

## 13. Sample flows

### Signup welcome
1. `user.signup.completed`
2. Gui `tpl_welcome`
3. Sau 2 ngay gui `tpl_followup_day_2`

### Invoice paid
1. `billing.invoice.paid`
2. Gui `tpl_invoice_paid`

### Inbound support
1. `mail.inbound.received`
2. Tao ticket
3. Gui auto-acknowledgement

## 14. Definition of Done

Automation/template engine dat khi:
- tao duoc template versioning
- render duoc multi-locale
- ingest duoc event noi bo
- queue duoc action gui template theo delay
- trace duoc tu event den message
