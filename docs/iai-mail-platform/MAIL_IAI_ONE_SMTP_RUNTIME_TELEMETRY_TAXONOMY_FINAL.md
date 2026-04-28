# MAIL_IAI_ONE_SMTP_RUNTIME_TELEMETRY_TAXONOMY_FINAL

IAI Mail Delivery & Automation Layer

SMTP Runtime Telemetry Taxonomy  
Version: 1.0 - Production Lock  
Date: 2026-04-14

## 1. Muc tieu

Tai lieu nay khoa:
- ten event log cua `apps/mail-smtp`
- ten metric chuan cho runtime SMTP

Muc tieu:
- runbook, dashboard, alerting va code dung cung mot taxonomy

## 2. Log events

Runtime dang dung cac event sau:
- `smtp.auth.succeeded`
- `smtp.auth.rejected`
- `smtp.mail_from.accepted`
- `smtp.mail_from.rejected`
- `smtp.recipient.accepted`
- `smtp.recipient.rejected`
- `smtp.message.queued`
- `smtp.message.rejected`
- `smtp.health.started`
- `smtp.health.stopped`
- `smtp.runtime.started`
- `smtp.runtime.startup_failed`
- `smtp.runtime.unhandled_error`
- `smtp.runtime.shutdown_failed`
- `smtp.runtime.shutdown_succeeded`

Format log:
- JSON line
- co `timestamp`
- co `level`
- co `event`
- co `component`
- co `mode`
- co `hostname`
- co `port`

## 3. Metric names

Metric names khoa:
- `smtp.session.active`
- `smtp.auth.success_total`
- `smtp.auth.failure_total`
- `smtp.mail_from.accepted_total`
- `smtp.recipient.accepted_total`
- `smtp.message.queued_total`
- `smtp.reject.total`
- `smtp.health.dependencies_ok`

## 4. Mapping voi runbook

### Go-live
- theo doi `smtp.auth.success_total`
- theo doi `smtp.auth.failure_total`
- theo doi `smtp.message.queued_total`
- theo doi `smtp.reject.total`

### Incident
- spike `smtp.auth.failure_total`
- spike `smtp.reject.total`
- khong tang `smtp.message.queued_total`

### Smoke
- phai thay `smtp.auth.succeeded`
- phai thay `smtp.mail_from.accepted`
- phai thay `smtp.recipient.accepted`
- phai thay `smtp.message.queued`

## 5. Quy tac dat ten

- log event dung dot-separated, hien tai bat dau bang `smtp.`
- metric dung suffix `_total` cho counter
- khong dat ten theo provider cu the o lop SMTP runtime
- khong dat ten chua thong tin secret
