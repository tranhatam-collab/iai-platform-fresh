# MAIL_IAI_ONE_SMTP_REMOTE_BACKEND_ADAPTER_CONTRACT_FINAL

IAI Mail Delivery & Automation Layer

SMTP Remote Backend Adapter Contract  
Version: 1.0 - Production Lock  
Date: 2026-04-14

## 1. Muc tieu

Tai lieu nay chot contract ma `apps/mail-smtp` se goi khi:
- `MAIL_SMTP_BACKEND_MODE=remote`

Contract nay la diem giao viec ro rang cho team `mail.iai.one` hoac team backend chung.

## 2. Base config runtime dang cho

Bien env dang duoc `mail-smtp` doc:
- `MAIL_SMTP_REMOTE_BASE_URL`
- `MAIL_SMTP_REMOTE_AUTH_PATH`
- `MAIL_SMTP_REMOTE_MAIL_FROM_PATH`
- `MAIL_SMTP_REMOTE_RECIPIENT_PATH`
- `MAIL_SMTP_REMOTE_NORMALIZE_PATH`
- `MAIL_SMTP_REMOTE_QUEUE_PATH`
- `MAIL_SMTP_REMOTE_AUDIT_PATH`
- `MAIL_SMTP_REMOTE_TIMEOUT_MS`
- `MAIL_SMTP_REMOTE_TOKEN`

Mac dinh hien tai:
- base URL: `http://localhost:8787/v1/internal/smtp/`
- auth path: `auth`
- mail-from path: `mail-from`
- recipient path: `recipient`
- normalize path: `normalize`
- queue path: `queue`
- audit path: `audit`

## 3. Header runtime se gui

`mail-smtp` gui:

```http
Content-Type: application/json
User-Agent: iai-mail-smtp/0.0.0
Authorization: Bearer <MAIL_SMTP_REMOTE_TOKEN>   # neu co
```

## 4. Response format duoc chap nhan

Runtime chap nhan 2 dang response:

### Cach 1 - Raw JSON object
Tra truc tiep object dung shape mong doi.

### Cach 2 - Standard envelope

```json
{
  "ok": true,
  "data": {}
}
```

Hoac:

```json
{
  "ok": false,
  "error": {
    "message": "Sender not allowed",
    "details": {
      "smtpCode": 550
    }
  },
  "reason": "Sender not allowed",
  "smtpCode": 550
}
```

Neu backend muon runtime map thanh SMTP reject code ro rang, can tra:
- `smtpCode`
hoac
- `error.details.smtpCode`

## 5. Endpoint contract

### `POST auth`

Request:

```json
{
  "username": "smtp-app-user",
  "password": "secret",
  "method": "LOGIN",
  "remoteAddress": "10.0.0.5",
  "clientHostname": "legacy-app.internal",
  "secure": true
}
```

Success response:

```json
{
  "credentialId": "smtpcred_123",
  "workspaceId": "ws_123",
  "principal": "smtp-app-user",
  "defaultStream": "transactional",
  "allowedStreams": ["transactional", "system"],
  "senderIdentityId": "sender_123"
}
```

### `POST mail-from`

Request:

```json
{
  "auth": {
    "credentialId": "smtpcred_123",
    "workspaceId": "ws_123",
    "principal": "smtp-app-user",
    "defaultStream": "transactional",
    "allowedStreams": ["transactional", "system"],
    "senderIdentityId": "sender_123"
  },
  "address": "no-reply@tx.iai.one",
  "secure": true,
  "clientHostname": "legacy-app.internal"
}
```

Success response:

```json
{
  "ok": true,
  "stream": "transactional",
  "senderIdentityId": "sender_123"
}
```

Reject response:

```json
{
  "ok": false,
  "reason": "Sender identity is not allowed",
  "smtpCode": 550
}
```

### `POST recipient`

Request:

```json
{
  "auth": {
    "credentialId": "smtpcred_123",
    "workspaceId": "ws_123",
    "principal": "smtp-app-user",
    "defaultStream": "transactional",
    "allowedStreams": ["transactional", "system"]
  },
  "stream": "transactional",
  "envelopeFrom": "no-reply@tx.iai.one",
  "recipient": "user@example.com",
  "recipientCount": 1
}
```

Success response:

```json
{
  "ok": true
}
```

Reject response:

```json
{
  "ok": false,
  "reason": "Recipient is suppressed",
  "smtpCode": 550
}
```

### `POST normalize`

Request:

```json
{
  "auth": {
    "credentialId": "smtpcred_123",
    "workspaceId": "ws_123",
    "principal": "smtp-app-user",
    "defaultStream": "transactional",
    "allowedStreams": ["transactional", "system"]
  },
  "stream": "transactional",
  "envelopeFrom": "no-reply@tx.iai.one",
  "recipients": ["user@example.com"],
  "smtpSessionId": "smtp_123",
  "traceId": "trace_123",
  "submittedAt": "2026-04-14T09:59:00.000Z",
  "rawMimeBase64": "<base64 RFC822 message>"
}
```

Success response:

```json
{
  "workspaceId": "ws_123",
  "credentialId": "smtpcred_123",
  "senderIdentityId": "sender_123",
  "messageId": "msg_123",
  "messageIdempotencyKey": "trace_123",
  "traceId": "trace_123",
  "smtpSessionId": "smtp_123",
  "submittedAt": "2026-04-14T09:59:00.000Z",
  "source": "smtp",
  "stream": "transactional",
  "envelopeFrom": "no-reply@tx.iai.one",
  "from": {
    "email": "no-reply@tx.iai.one",
    "name": "IAI"
  },
  "replyTo": {
    "email": "support@iai.one"
  },
  "to": [
    {
      "email": "user@example.com",
      "name": "Nguyen Van A"
    }
  ],
  "cc": [],
  "bcc": [],
  "headerFrom": "no-reply@tx.iai.one",
  "headerMessageId": "<legacy-123@tx.iai.one>",
  "headers": {
    "subject": "Hello"
  },
  "recipients": ["user@example.com"],
  "subject": "Hello",
  "text": "Hello",
  "html": "<p>Hello</p>",
  "attachments": [
    {
      "filename": "guide.pdf",
      "contentType": "application/pdf",
      "sizeBytes": 1024,
      "inline": false,
      "partId": "1.2"
    }
  ],
  "rawMimeBase64": "<base64 RFC822 message>"
}
```

Rule:
- backend co the tra `rawMimeBase64` hoac bo qua; neu bo qua runtime se giu `rawMime` goc
- backend co the tra partial normalized payload trong giai doan transition; runtime se backfill phan parse MIME local neu field moi chua co

### `POST queue`

Request:

```json
{
  "workspaceId": "ws_123",
  "credentialId": "smtpcred_123",
  "senderIdentityId": "sender_123",
  "messageId": "msg_123",
  "messageIdempotencyKey": "trace_123",
  "traceId": "trace_123",
  "smtpSessionId": "smtp_123",
  "submittedAt": "2026-04-14T09:59:00.000Z",
  "source": "smtp",
  "stream": "transactional",
  "envelopeFrom": "no-reply@tx.iai.one",
  "from": {
    "email": "no-reply@tx.iai.one",
    "name": "IAI"
  },
  "replyTo": {
    "email": "support@iai.one"
  },
  "to": [
    {
      "email": "user@example.com",
      "name": "Nguyen Van A"
    }
  ],
  "cc": [],
  "bcc": [],
  "headerFrom": "no-reply@tx.iai.one",
  "headerMessageId": "<legacy-123@tx.iai.one>",
  "headers": {
    "subject": "Hello"
  },
  "recipients": ["user@example.com"],
  "subject": "Hello",
  "text": "Hello",
  "html": "<p>Hello</p>",
  "attachments": [
    {
      "filename": "guide.pdf",
      "contentType": "application/pdf",
      "sizeBytes": 1024,
      "inline": false,
      "partId": "1.2"
    }
  ],
  "rawMimeBase64": "<base64 RFC822 message>"
}
```

Success response:

```json
{
  "messageEventId": "evt_123",
  "messageId": "msg_123",
  "traceId": "trace_123",
  "smtpSessionId": "smtp_123",
  "queuedAt": "2026-04-14T10:00:00.000Z",
  "providerRoute": "transactional_primary"
}
```

Rule:
- repo nay da co shared worker/timeline contract trong `packages/mail-core/src/mail-queue.ts`
- backend `mail.iai.one` nen map persistence `messages` va `message_events` tu chinh payload/response nay

### `POST audit`

Request:

```json
{
  "actorIdentifier": "smtp-app-user",
  "actorType": "smtp-credential",
  "action": "smtp.auth.success",
  "targetType": "smtp_credential",
  "targetId": "smtpcred_123",
  "workspaceId": "ws_123",
  "metadata": {
    "remoteAddress": "10.0.0.5",
    "secure": true
  }
}
```

Success response co the la:

```json
{
  "accepted": true
}
```

Hoac `204 No Content`.

## 6. Health contract

`mail-smtp` goi:
- `MAIL_API_DEPENDENCIES_HEALTH_URL`

Mong doi:

```json
{
  "ok": true,
  "mode": "remote",
  "checks": [
    {
      "name": "credential_store",
      "ok": true,
      "detail": "reachable"
    }
  ]
}
```

## 7. Viec team `mail.iai.one` can giao de remote mode chay that

- [ ] implement `auth`
- [ ] implement `mail-from`
- [ ] implement `recipient`
- [ ] implement `normalize`
- [ ] implement `queue`
- [ ] implement `audit`
- [ ] implement `dependencies health`
- [ ] cap token S2S neu can
- [ ] xac nhan reject reason va `smtpCode` dung taxonomy chung

## 8. Quyet dinh chot

- Team SMTP RELAY mail se tiep tuc phat trien runtime quanh contract nay.
- Team `mail.iai.one` chi can lam dung contract nay de `MAIL_SMTP_BACKEND_MODE=remote` bat len.
- Khong doi runtime SMTP bang cach chen logic UI/control-plane truc tiep vao app nay.

## 9. Trang thai handoff hien tai

Tai thoi diem chot contract nay:
- runtime SMTP da khoa contract remote
- build/test co the dat trong moi truong hien tai
- phan con lai can giao cho team `mail.iai.one` la implementation that cua cac endpoint va read/write backend chung

## 10. Gioi han sandbox can ghi ro

Moi truong hien tai khong the mo listener that tren port local vi sandbox chan `listen()` voi loi `EPERM`.

Do do:
- trang thai hien tai dung o muc build/test pass va contract lock
- buoc operational tiep theo phai duoc thuc hien tren may chay that sau khi team `mail.iai.one` giao xong cac endpoint trong file nay
