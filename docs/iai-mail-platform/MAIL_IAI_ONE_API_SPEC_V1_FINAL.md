# MAIL_IAI_ONE_API_SPEC_V1_FINAL

IAI Mail Delivery & Automation Layer

API Specification v1  
Version: 1.0 - Production Lock  
Base scope: `api.mail.iai.one`

## 1. Muc tieu

API nay la cong duy nhat de tat ca he thong trong `*.iai.one`:
- gui email
- dung template
- xem status va event
- quan ly domain va sender
- xu ly suppression
- ingest webhook tu provider
- ingest event tu he thong noi bo

Moi app phai goi API nay, khong goi provider truc tiep, khong gui SMTP truc tiep.

## 2. Base URLs

- Production: `https://api.mail.iai.one/v1`
- Staging: `https://api-staging.mail.iai.one/v1`
- Local: `http://localhost:8787/v1`

## 3. Authentication

### API Key

Dung cho server-to-server:

```http
Authorization: Bearer <MAIL_API_KEY>
```

### JWT

Dung cho dashboard/admin:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Required headers

```http
Content-Type: application/json
X-Workspace-Id: <workspace_id>
X-Request-Id: <optional trace or idempotency key>
```

## 4. Response envelope

### Success

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "request_id": "req_123",
    "timestamp": "2026-04-14T11:30:00Z"
  }
}
```

### Error

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid recipient email",
    "details": {
      "field": "to[0]"
    }
  },
  "meta": {
    "request_id": "req_123",
    "timestamp": "2026-04-14T11:30:00Z"
  }
}
```

## 5. Error codes

- `UNAUTHORIZED`
- `FORBIDDEN`
- `WORKSPACE_NOT_FOUND`
- `DOMAIN_NOT_VERIFIED`
- `SENDER_NOT_ALLOWED`
- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `TEMPLATE_NOT_FOUND`
- `TEMPLATE_RENDER_ERROR`
- `MESSAGE_NOT_FOUND`
- `DELIVERY_FAILED`
- `PROVIDER_UNAVAILABLE`
- `SUPPRESSED_RECIPIENT`
- `IDEMPOTENCY_CONFLICT`
- `INVALID_STREAM`
- `INVALID_ATTACHMENT`
- `WEBHOOK_SIGNATURE_INVALID`
- `INBOUND_PARSE_ERROR`
- `INTERNAL_ERROR`

## 6. Core identity model

### Workspace
Moi tenant logic la mot workspace.

### Domain
Vi du:
- `tx.iai.one`
- `sys.iai.one`
- `news.iai.one`

### Sender identity
Vi du:
- `no-reply@tx.iai.one`
- `system@sys.iai.one`
- `news@news.iai.one`

### Stream v1
- `transactional`
- `system`
- `marketing`
- `alerts`

## 7. Send APIs

### `POST /send`

Gui email moi.

```json
{
  "message_idempotency_key": "signup-user-123-20260414",
  "stream": "transactional",
  "from": {
    "email": "no-reply@tx.iai.one",
    "name": "IAI"
  },
  "reply_to": {
    "email": "support@iai.one",
    "name": "IAI Support"
  },
  "to": [
    {
      "email": "user@example.com",
      "name": "Nguyen Van A"
    }
  ],
  "cc": [],
  "bcc": [],
  "subject": "Welcome to IAI",
  "html": "<p>Hello {{name}}</p>",
  "text": "Hello {{name}}",
  "tags": ["welcome", "signup"],
  "metadata": {
    "user_id": "123",
    "source_app": "flow.iai.one"
  },
  "headers": {
    "X-Custom-Source": "flow"
  },
  "attachments": [
    {
      "filename": "guide.pdf",
      "content_type": "application/pdf",
      "content_base64": "JVBERi0xLjQKJ..."
    }
  ]
}
```

Rules:
- Bat buoc `stream`
- `from.email` phai thuoc domain da verify
- It nhat mot recipient trong `to`
- Phai co `html` hoac `text`
- Marketing stream bat buoc unsubscribe policy

Response:

```json
{
  "ok": true,
  "data": {
    "message_id": "msg_01HSX123ABC",
    "status": "queued",
    "stream": "transactional",
    "provider_route": "transactional_primary",
    "accepted_recipients": 1,
    "suppressed_recipients": 0
  },
  "meta": {
    "request_id": "req_01HSXREQ123",
    "timestamp": "2026-04-14T11:30:00Z"
  }
}
```

### `POST /send-template`

```json
{
  "message_idempotency_key": "invoice-456-20260414",
  "stream": "system",
  "template_id": "tpl_invoice_paid_v1",
  "template_version": 3,
  "locale": "vi",
  "from": {
    "email": "billing@sys.iai.one",
    "name": "IAI Billing"
  },
  "to": [
    {
      "email": "customer@example.com",
      "name": "Tran Ha Tam"
    }
  ],
  "variables": {
    "customer_name": "Tran Ha Tam",
    "invoice_number": "INV-456",
    "amount": "99 USD"
  },
  "metadata": {
    "invoice_id": "456"
  },
  "tags": ["invoice", "billing"]
}
```

### `POST /send-bulk`

Dung cho queue-based bulk send.

```json
{
  "campaign_id": "cmp_20260414_newsletter_01",
  "stream": "marketing",
  "template_id": "tpl_newsletter_april",
  "locale": "vi",
  "from": {
    "email": "news@news.iai.one",
    "name": "IAI News"
  },
  "recipients": [
    {
      "email": "user1@example.com",
      "name": "User 1",
      "variables": {
        "first_name": "User 1"
      }
    }
  ],
  "global_variables": {
    "issue_title": "April Update"
  },
  "metadata": {
    "segment": "all-active-users"
  },
  "tags": ["newsletter", "april"]
}
```

## 8. Message APIs

### `GET /messages/{message_id}`
- Tra ve chi tiet message, provider route, status, last event.

### `GET /messages/{message_id}/events`
- Tra ve timeline chuan hoa: `queued`, `provider_accepted`, `delivered`, `bounced`...

### `GET /messages`

Ho tro query:
- `status`
- `stream`
- `tag`
- `to`
- `from`
- `created_from`
- `created_to`
- `page`
- `page_size`

## 9. Template APIs

- `POST /templates`
- `GET /templates`
- `GET /templates/{template_id}`
- `PUT /templates/{template_id}`
- `POST /templates/{template_id}/publish`

Template bat buoc:
- co `template_key` on dinh
- co version
- co locale map
- co stream allowlist

## 10. Domain APIs

- `POST /domains`
- `GET /domains`
- `GET /domains/{domain_id}`
- `POST /domains/{domain_id}/verify`
- `GET /domains/{domain_id}/dns-health`

`dns-health` phai tra ve toi thieu:
- `spf`
- `dkim`
- `dmarc`
- `mx`
- `rdns`
- `overall_status`

## 11. Sender APIs

- `POST /senders`
- `GET /senders`
- `PUT /senders/{sender_id}`
- `DELETE /senders/{sender_id}`

Sender phai map voi `domain_id` va `allowed_streams`.

## 12. Suppression, bounce, complaint

- `GET /suppressions`
- `POST /suppressions`
- `DELETE /suppressions/{suppression_id}`
- `GET /bounces`
- `GET /complaints`

Quy tac:
- Hard bounce va complaint phai tao suppression tu dong.
- Marketing unsubscribe phai duoc kiem tra truoc khi queue.

## 13. Provider webhook ingest

### `POST /providers/webhooks/{provider}`

Provider v1:
- `ses`
- `sendgrid`
- `smtp`
- `selfhosted`

Payload provider phai duoc normalize thanh event chung:

```json
{
  "event_type": "bounced",
  "provider": "ses",
  "provider_message_id": "000123abc",
  "message_id": "msg_01HSX123ABC",
  "recipient": "user@example.com",
  "bounce_type": "hard",
  "reason": "Mailbox does not exist",
  "timestamp": "2026-04-14T11:55:00Z"
}
```

## 14. Automation APIs

- `POST /automations`
- `GET /automations`
- `GET /automations/{automation_id}`
- `PUT /automations/{automation_id}`
- `POST /automations/{automation_id}/pause`
- `POST /automations/{automation_id}/resume`

## 15. Event ingest API

### `POST /events/ingest`

Dung cho app noi bo ban event vao mail automation layer.

```json
{
  "event_name": "user.signup.completed",
  "event_id": "evt_signup_123",
  "occurred_at": "2026-04-14T12:00:00Z",
  "subject": {
    "type": "user",
    "id": "123"
  },
  "data": {
    "email": "user@example.com",
    "name": "Tran Ha Tam",
    "locale": "vi"
  },
  "metadata": {
    "source_app": "flow.iai.one"
  }
}
```

## 16. Inbound APIs

- `POST /inbound/parse`
- `GET /inbound/messages`
- `GET /inbound/messages/{inbound_message_id}`
- `POST /inbound/routes`

## 17. Provider routing APIs

- `GET /provider-routes`
- `POST /provider-routes`
- `PUT /provider-routes/{route_id}`
- `POST /provider-routes/{route_id}/test`

Route record phai co:
- `stream`
- `priority`
- `provider`
- `config_ref`
- `failover_to`
- `status`

## 18. Health APIs

- `GET /health`
- `GET /health/dependencies`

## 19. Rate limit policy

- Send APIs: `60 requests/min/workspace` mac dinh
- Bulk send: queue-based, khong tra sync full result
- Webhooks: signed payload bat buoc, retry duoc phep

## 20. Idempotency

Bat buoc cho:
- `/send`
- `/send-template`
- `/send-bulk`
- `/events/ingest`

Nguon uu tien:
- `message_idempotency_key`
- hoac `X-Request-Id`

Neu key trung:
- tra lai ket qua cu
- khong tao delivery moi

## 21. Security rules

- Signed webhooks bat buoc
- Workspace isolation bat buoc
- Domain authorization bat buoc
- Attachment scan hook bat buoc o storage layer hoac async processor

## 22. Normalized statuses

### Message status
- `queued`
- `processing`
- `provider_accepted`
- `delivered`
- `deferred`
- `bounced`
- `complained`
- `suppressed`
- `failed`
- `cancelled`

### Event types
- `queued`
- `rendered`
- `provider_selected`
- `provider_accepted`
- `sent`
- `delivered`
- `deferred`
- `opened`
- `clicked`
- `bounced`
- `complained`
- `suppressed`
- `unsubscribed`
- `failed`

## 23. MVP endpoints bat buoc

- `POST /send`
- `POST /send-template`
- `GET /messages/{message_id}`
- `GET /messages/{message_id}/events`
- `POST /providers/webhooks/{provider}`
- `POST /events/ingest`
- `GET /health`
- `GET /domains/{domain_id}/dns-health`
- `POST /provider-routes`
- `GET /provider-routes`

## 24. Definition of Done

API v1 dat khi:
- gui duoc email don
- gui duoc email theo template
- co status va event timeline
- co webhook ingest cap nhat delivery/bounce
- co event ingest kich hoat automation
- co domain health
- co provider routing co ban
- co auth, workspace isolation va idempotency
