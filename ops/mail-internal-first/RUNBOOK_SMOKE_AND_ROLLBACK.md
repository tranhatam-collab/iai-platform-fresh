# Internal-First Ops Runbook

Muc tieu:
- dung `mail-api` + `mail-smtp` private tren VPS
- khong dong vao public `25/465/587`
- lay `messageId` that
- verify DB du `messages`, `message_events`, `delivery_attempts`
- gate Team Auth Wave 2 bang Gmail + Outlook test that

## 1. Preflight 60 giay

Chuan bi file env:

```bash
cd /path/to/ops/mail-internal-first
cp .env.production.example .env.production
openssl rand -hex 32
```

Gan cung 1 gia tri moi vao:
- `MAIL_SMTP_REMOTE_TOKEN` trong `.env.production`
- runtime `mail-api`
- runtime `mail-smtp`

Tao thu muc data tren host:

```bash
mkdir -p /opt/iai-runtime/mail-api /opt/iai-runtime/mail-smtp
set -a
. ./.env.production
set +a
```

Xac nhan 3 duong dan nay ton tai:

```bash
test -f "$MAIL_REPO_ROOT/apps/mail-api/dist/index.js"
test -f "$MAIL_REPO_ROOT/apps/mail-smtp/dist/index.js"
test -f "$MAIL_TLS_CERTS_PATH/cert.pem" && test -f "$MAIL_TLS_CERTS_PATH/key.pem"
```

## 2. Boot stack

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Health phai xanh:

```bash
curl -fsS http://127.0.0.1:8787/health && echo
curl -fsS http://127.0.0.1:9091/health && echo
curl -fsS http://127.0.0.1:9091/health/dependencies && echo
```

## 3. Smoke SMTP that (stack sanity)

```bash
cat >/tmp/mail_smtp_smoke.py <<'PY'
import os
import smtplib
import ssl
from email.message import EmailMessage

msg = EmailMessage()
msg["From"] = os.environ["SMTP_FROM"]
msg["To"] = os.environ["SMTP_TO"]
msg["Subject"] = "IAI internal-first SMTP smoke"
msg["X-IAI-Stream"] = "transactional"
msg.set_content("internal-first smtp smoke")

smtp = smtplib.SMTP(os.environ.get("SMTP_HOST", "127.0.0.1"), int(os.environ.get("SMTP_PORT", "1587")), timeout=20)
smtp.set_debuglevel(1)
smtp.ehlo()
smtp.starttls(context=ssl._create_unverified_context())
smtp.ehlo()
print("LOGIN=%r" % (smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"]),))
print("MAIL=%r" % (smtp.mail(os.environ["SMTP_FROM"]),))
print("RCPT=%r" % (smtp.rcpt(os.environ["SMTP_TO"]),))
print("DATA=%r" % (smtp.data(msg.as_string()),))
print("QUIT=%r" % (smtp.quit(),))
PY

SMTP_HOST=127.0.0.1 \
SMTP_PORT="${MAIL_SMTP_PRIVATE_PORT}" \
SMTP_USER="${SMTP_SMOKE_USER}" \
SMTP_PASS="${SMTP_SMOKE_PASS}" \
SMTP_FROM="${SMTP_SMOKE_FROM}" \
SMTP_TO="${SMTP_SMOKE_TO}" \
python3 /tmp/mail_smtp_smoke.py | tee /tmp/mail_smtp_smoke.out

MSG_ID="$(grep -o 'msg_[0-9a-f-]\+' /tmp/mail_smtp_smoke.out | tail -1)"
printf 'MSG_ID=%s\n' "$MSG_ID"
test -n "$MSG_ID"
```

## 4. Verify DB theo messageId

```bash
cat >/tmp/verify_flow_db.mjs <<'JS'
import { DatabaseSync } from "node:sqlite";
const id = process.argv[2];
const db = new DatabaseSync("/data/iai-mail-flow.sqlite");
const count = (sql) => db.prepare(sql).get(id).count;
const status = db.prepare("SELECT status FROM messages WHERE id = ?").get(id)?.status ?? null;
console.log(JSON.stringify({
  msgId: id,
  messages: count("SELECT COUNT(*) AS count FROM messages WHERE id = ?"),
  message_events: count("SELECT COUNT(*) AS count FROM message_events WHERE message_id = ?"),
  delivery_attempts: count("SELECT COUNT(*) AS count FROM delivery_attempts WHERE message_id = ?"),
  message_status: status
}));
db.close();
JS

docker cp /tmp/verify_flow_db.mjs iai-mail-api-internal:/tmp/verify_flow_db.mjs
docker exec iai-mail-api-internal node /tmp/verify_flow_db.mjs "$MSG_ID"
```

Gate pass khi JSON cuoi cung co:
- `messages >= 1`
- `message_events >= 2`
- `delivery_attempts >= 1`
- `message_status = "provider_accepted"`

## 5. Team Auth Wave 2 verification (real Gmail + Outlook)

### 5.1 Wave gate check

Truoc khi chay Team Auth, phai xac nhan trong tracker:
- tat ca dong Wave 1 = `migrated`
- 4 dong Team Auth Wave 2 dang `blocked_until_wave1_green` hoac `in_progress`

Neu Wave 1 chua xanh thi dung lai, KHONG mo Wave 2.

Co the check tu dong:

```bash
node ops/mail-internal-first/scripts/check-wave-gate.mjs --open-wave 2
```

### 5.1b Team Auth prereq sanity (truoc khi trigger flow)

Dung template:

```bash
cp ops/mail-internal-first/templates/team-auth-wave2-prereqs.example.json \
  ops/mail-internal-first/runtime-state/team-auth-wave2-prereqs.json
```

Validate payload:

```bash
node ops/mail-internal-first/scripts/check-team-auth-prereqs.mjs \
  --file ops/mail-internal-first/runtime-state/team-auth-wave2-prereqs.json
```

Chi tiep tuc neu ket qua tra ve `ok: true`.

Gate bo sung truoc Wave 2 (bat buoc):

1) Tao file input that tu template:

```bash
cp ops/mail-internal-first/templates/team-auth-wave2-prereqs.example.json \
  ops/mail-internal-first/runtime-state/team-auth-wave2-prereqs.json
```

2) Dien du 3 nhom thong tin:
- credential/inbox that cho Gmail + Outlook
- quyen trigger action auth that tu app/VPS (khong local-only)
- TTL policy chot cho 4 flow auth

3) Validate bang script:

```bash
node ops/mail-internal-first/scripts/check-team-auth-prereqs.mjs \
  --file ops/mail-internal-first/runtime-state/team-auth-wave2-prereqs.json
```

Chi khi check nay `ok: true` moi duoc tiep tuc Wave 2.

### 5.2 Chuan bi recipient test that

```bash
export TEAM_AUTH_GMAIL_TO="your-real-test@gmail.com"
export TEAM_AUTH_OUTLOOK_TO="your-real-test@outlook.com"
```

### 5.3 Trigger 4 flow auth tu app/API that

Voi moi flow sau:
- `magic_link_login`
- `reset_password`
- `email_verification`
- `security_notice`

Bat buoc chay toi thieu 2 action that:
- Action A: send toi Gmail (khuyen nghi locale VI)
- Action B: send toi Outlook (khuyen nghi locale EN)

Neu can stricter QA, chay them de cover du VI+EN tren ca 2 inbox.

### 5.4 Lay messageId cho moi action

Uu tien lay `messageId` tu response/telemetry cua app.
Fallback tu log SMTP:

```bash
docker logs iai-mail-smtp-internal --since 10m 2>&1 | rg -o 'msg_[0-9a-f-]+' | tail -20
```

Luu rieng:
- `gmail_message_id`
- `outlook_message_id`

### 5.5 Verify DB cho tung messageId

```bash
docker exec iai-mail-api-internal node /tmp/verify_flow_db.mjs "$GMAIL_MESSAGE_ID"
docker exec iai-mail-api-internal node /tmp/verify_flow_db.mjs "$OUTLOOK_MESSAGE_ID"
```

Pass khi ca 2 JSON deu co:
- `messages >= 1`
- `message_events >= 2`
- `delivery_attempts >= 1`

### 5.6 Kiem tra noi dung email (bat buoc)

Cho moi flow Team Auth, danh dau trong tracker:
- `vi_content_ok`
- `en_content_ok`
- `subject_ok`
- `sender_ok`
- `reply_to_ok`
- `link_live_ok`
- `link_ttl_ok`

Huong dan check nhanh:
- mo mail that trong Gmail/Outlook, doi chieu subject/sender/reply-to
- click link that, xac nhan domain dung va route dung flow
- doi chieu TTL voi policy auth hien hanh (ghi ro so phut)

## 6. Rollback 30 giay

Neu smoke fail hoac app/API can quay dau:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

Sau do:
- tra app/API ve sender path truoc do
- restart caller services
- giu nguyen Mailcow public submission nhu cu

## 7. Evidence pack nop lai

Can nop day du:
- output `docker compose ... ps`
- `health` va `health/dependencies`
- smoke `MSG_ID=...`
- JSON verify DB 3 bang

Bo sung bat buoc cho Team Auth Wave 2:
- moi flow co `gmail_message_id` + `outlook_message_id`
- moi messageId co JSON DB evidence du 3 bang
- evidence check VI/EN + subject/sender/reply-to + link live + link TTL
- update xong Master tracker + Team Auth matrix
