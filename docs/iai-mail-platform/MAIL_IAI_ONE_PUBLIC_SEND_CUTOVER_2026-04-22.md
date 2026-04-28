# MAIL_IAI_ONE_PUBLIC_SEND_CUTOVER_2026-04-22

Status: READY FOR VPS EXECUTION

Date: 2026-04-22

Owner: Team Email SMTP

## 0. Muc tieu

Mo public `POST /v1/send` tren:

- `https://api.mail.iai.one/v1/send`

Nhung KHONG mo them scope khac trong cung dot nay:

- khong mo full read surface public
- khong doi DNS
- khong doi cert
- khong doi `smtp.mail.iai.one`
- khong doi `inbound.mail.iai.one`

## 1. Runtime truth da xac minh

### 1.1 Public state hien tai

Da xac minh truc tiep:

- `GET https://api.mail.iai.one/v1/health` -> `200`
- `GET https://api.mail.iai.one/v1/health/dependencies` -> `200`
- `POST https://api.mail.iai.one/v1/send` hien tra:
  - `404`
  - `error.code = ROUTE_NOT_READY`
  - `message = This public hostname currently exposes health endpoints only.`

Ket luan:

- blocker hien tai khong nam o `mail-api` route implementation
- blocker nam o public ingress / vhost dang chi allow health surface

### 1.2 Backend truth trong repo

`mail-api` da co `POST /v1/send` that tai:

- `apps/mail-api/src/smtp-internal.ts`

Route nay yeu cau:

- `Authorization: Bearer <MAIL_API_KEY>`
- `X-Workspace-Id: <workspace_id>`
- HTTP method `POST`

Proof tu stack repo:

- `mail-api` nghe host local `127.0.0.1:8787`
- `mail-smtp` health nghe host local `127.0.0.1:9091`
- compose file: `ops/mail-internal-first/docker-compose.prod.yml`

### 1.3 Mailcow truth da biet

Packet hien hanh da ghi ro:

- VPS stack that la `mailcow + nginx-mailcow + acme-mailcow`
- da noi `iai-mail-smtp-shadow` vao `mailcowdockerized_mailcow-network`
- da them vhost cong khai `api.mail.iai.one`

Repo KHONG co bang chung rang `mail-api` da duoc noi vao `mailcowdockerized_mailcow-network`.

Dieu nay rat quan trong, vi:

- health public hien tai co the dang di qua upstream `mail-smtp`
- nhung `POST /v1/send` can den `mail-api:8787`

## 2. Cach mo dung scope

Dot cutover nay chi mo duy nhat:

- `POST /v1/send`

Khuyen nghi wiring:

1. noi `iai-mail-api-internal` vao `mailcowdockerized_mailcow-network`
2. gan alias on dinh, vi du:
   - `iai-mail-api-shadow`
3. cap nhat vhost `api.mail.iai.one` de proxy rieng `POST /v1/send` vao:
   - `http://iai-mail-api-shadow:8787/v1/send`
4. giu nguyen health routes neu team muon giu current public proof

## 3. Command pack mau cho VPS

Lenh nay la cho stack da xac minh `mailcow + nginx-mailcow`.

### 3.1 Kiem tra container va network

```bash
docker ps --format '{{.Names}}' | grep -E 'iai-mail-api-internal|nginx-mailcow|postfix-mailcow'
docker network ls --format '{{.Name}}' | grep mailcowdockerized_mailcow-network
```

### 3.2 Noi `mail-api` vao mailcow network

Neu chua noi:

```bash
docker network connect --alias iai-mail-api-shadow mailcowdockerized_mailcow-network iai-mail-api-internal
```

Neu container da noi san thi lenh co the fail voi `already exists`; khi do bo qua va tiep tuc.

### 3.3 Sua vhost `api.mail.iai.one`

Them block rieng cho `POST /v1/send` vao file:

- `data/conf/nginx/iai-public-hostnames.conf`

Snippet toi thieu:

```nginx
location = /v1/send {
  limit_except POST { return 405; }
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto https;
  proxy_pass http://iai-mail-api-shadow:8787/v1/send;
}
```

Luu y:

- khong duoc proxy `/v1/send` vao health upstream `9091`
- neu vhost hien tai dang return `ROUTE_NOT_READY` cho moi path khac ngoai health, can bo allowlist nay cho rieng `/v1/send`
- neu team dung alias khac thay vi `iai-mail-api-shadow`, doi `proxy_pass` cho dung alias do

### 3.4 Reload ingress

```bash
docker exec nginx-mailcow nginx -t
docker restart nginx-mailcow
```

Neu config cua team can `docker compose up -d nginx-mailcow` thay vi `docker restart`, dung cach van hanh that cua may.

## 4. Smoke proof ngay sau cutover

Sau khi reload, chay script repo-side:

```bash
MAIL_API_KEY='<redacted>' \
MAIL_WORKSPACE_ID='ws_pay_tranhatam' \
MAIL_TO='real-inbox@example.com' \
bash ops/mail-internal-first/scripts/public-mail-api-send-smoke.sh
```

PASS khi response tra:

- HTTP `202`
- `ok = true`
- co `data.message_id`

## 5. Evidence bat buoc ngay sau khi mo

Sau khi lay duoc `message_id`, phai doi chieu them:

1. `messages`
2. `message_events`
3. `delivery_attempts`
4. inbox proof that

Khong duoc claim cutover xong chi vi `POST /v1/send` da ra `202`.

## 6. Definition of done cho dot nay

Dot `public /v1/send` chi duoc claim da mo khi:

1. `POST https://api.mail.iai.one/v1/send` khong con tra `ROUTE_NOT_READY`
2. request dung `MAIL_API_KEY` + `X-Workspace-Id` tra `202`
3. co `message_id` that
4. DB evidence du 3 bang theo cung `message_id`
5. khong lam vo:
   - `GET /v1/health`
   - `GET /v1/health/dependencies`

## 7. Thong diep ngan de gui team

```text
Public /v1/send cutover duoc mo trong dot rieng nay. Public ingress cua api.mail.iai.one phai bo gate ROUTE_NOT_READY cho POST /v1/send va proxy route nay vao mail-api:8787 thay vi health upstream. Sau khi reload nginx-mailcow, bat buoc chay smoke bang MAIL_API_KEY + X-Workspace-Id va chi claim xong khi co 202 + message_id + DB evidence 3 bang.
```
