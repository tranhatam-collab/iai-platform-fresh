# MAIL_IAI_ONE_OUTBOUND_RELAY_LIVE_CUTOVER_2026-04-22

Status: READY FOR RUNTIME SECRET INJECTION AND VPS EXECUTION

Date: 2026-04-22

Owner: Team Email SMTP

## 0. Muc tieu

Dong blocker cuoi cua lane Email SMTP:

- outbound relay that tu `mail.iai.one`

Target bat buoc:

- cau hinh Postfix/Mailcow voi `RELAYHOST`
- gui test that toi:
  - `tranhatam66@gmail.com`
  - `tranhatam@gmail.com`
- chi bat BCC he thong sau khi 2 inbox proof da co that

Rule bo sung bat buoc:

- founder/personal mail KHONG duoc tinh la proof
- chi tinh mail duoc phat tu sender he thong that nhu:
  - `pay@iai.one`
  - `contact@iai.one`
  - `support@iai.one`
  - `billing@iai.one`
  - `noreply@iai.one`

## 1. Tinh hinh that hien tai

Nhung phan da xong:

- public hostname cho `api.mail.iai.one`, `smtp.mail.iai.one`, `inbound.mail.iai.one`
- TLS / SAN / vhost / health proof
- mailbox / alias loi tren `mail.iai.one` theo packet cua team

Blocker cuoi:

- outbound relay that ra ngoai

### 1.1 VPS proof da verify truc tiep ngay 2026-04-22

Da verify truc tiep tren VPS `89.167.116.167`:

- `postconf relayhost` = rong
- `postconf sender_dependent_relayhost_maps` = rong
- `sasl_passwd` cua postfix relay = khong ton tai
- direct outbound den Gmail da fail o ca:
  - IPv4 `173.194.221.27:25`
  - IPv6 `2404:6800:4008:c01::1b:25`
- Postfix log da ghi `status=deferred` voi `Connection timed out`
- grep redacted tren `/opt`, `/etc`, `/root`, `/home` khong tim thay secret provider theo cac key:
  - `SENDGRID_API_KEY`
  - `AWS_SES_SMTP_USER`
  - `AWS_SES_SMTP_PASS`
  - `RELAYHOST`

Ket luan tu proof nay:

- VPS da san sang o lop Mailcow/Postfix
- outbound Internet direct hien KHONG dung duoc cho Gmail
- phan con thieu dung nghia chi con la provider relay credential that

## 2. Dieu bat buoc phai noi that

Repo nay KHONG chua secret that cho:

- `RELAYHOST`
- `RELAYHOST_PORT`
- `RELAYHOST_USER`
- `RELAYHOST_PASS`
- `RELAYHOST_TLS_LEVEL`

Nen trong phien repo-side nay:

- co the chot script va packet van hanh
- KHONG duoc bịa gia tri secret
- KHONG duoc claim da close outbound relay neu chua inject secret that tren VPS va gui thu den Gmail that

## 3. Goc ky thuat cua blocker

Can noi ro de khong overclaim:

- `mail-worker` trong repo van moi o muc provider adapter stub
- `mail-api` local queue processing van co path `provider_accepted` noi bo
- vi vay relay live hom nay phai duoc dong o lop `mailcow/postfix outbound relay`

Noi cach khac:

- relay live hom nay la gate van hanh tren VPS
- khong phai la bang chung rang provider adapter cua `mail-worker` da hoan tat

## 4. Input secret bat buoc

Team Email SMTP phai inject day du:

- `RELAYHOST`
- `RELAYHOST_PORT`
- `RELAYHOST_USER`
- `RELAYHOST_PASS`
- `RELAYHOST_TLS_LEVEL`

Gia tri hop le thuong gap:

- `RELAYHOST_PORT=587`
- `RELAYHOST_TLS_LEVEL=encrypt`

Nhung host/user/pass that thi chi duoc lay tu provider live cua team.

## 5. Script da bo sung trong repo

### 5.1 Cau hinh relay cho Mailcow/Postfix

```bash
bash ops/mail-internal-first/scripts/configure-mailcow-outbound-relay.sh enable
```

Script nay:

- ghi block quan ly vao `data/conf/postfix/extra.cf`
- tao `sasl_passwd`
- chay `postmap`
- restart `postfix-mailcow`

Mode co san:

- `enable`
- `status`
- `disable`

### 5.2 Gui smoke that qua relay

```bash
MAILCOW_DIR=/opt/mailcow-dockerized \
SMOKE_FROM=pay@iai.one \
SMOKE_REPLY_TO=support@iai.one \
SMOKE_RECIPIENTS=tranhatam66@gmail.com,tranhatam@gmail.com \
bash ops/mail-internal-first/scripts/mailcow-live-relay-smoke.sh
```

Script nay:

- kiem tra `relayhost` da co trong `postfix-mailcow`
- submit mail that bang `sendmail` ben trong container `postfix-mailcow`
- ep envelope sender dung `SMOKE_FROM`
- in ra `SUBMITTED recipient=... message_id=...`
- dump `postqueue -p`
- dump log postfix gan nhat

## 6. Thu tu chay nhanh nhat

1. inject secret that `RELAYHOST*`
2. chay:

```bash
bash ops/mail-internal-first/scripts/configure-mailcow-outbound-relay.sh enable
```

3. verify status:

```bash
bash ops/mail-internal-first/scripts/configure-mailcow-outbound-relay.sh status
```

4. gui smoke that:

```bash
MAILCOW_DIR=/opt/mailcow-dockerized \
SMOKE_RECIPIENTS=tranhatam66@gmail.com,tranhatam@gmail.com \
bash ops/mail-internal-first/scripts/mailcow-live-relay-smoke.sh
```

5. doi chieu inbox that tren ca 2 Gmail
6. chi sau do moi bat BCC he thong

## 7. Evidence bat buoc

Phai nop du:

1. output `status` cua relay config
2. output `SUBMITTED recipient=... message_id=...`
3. `postqueue -p`
4. log postfix gan thoi diem gui
5. inbox proof that cua:
   - `tranhatam66@gmail.com`
   - `tranhatam@gmail.com`
6. sender phai la sender he thong that tren `mail.iai.one`, khong phai founder/personal mailbox
7. `Message-ID` phai xuat hien trong:
   - email da phat
   - log/queue evidence
   - inbox proof

Khong duoc claim xong neu chi co:

- queue accept
- log postfix
- hoac proof mot inbox duy nhat
- hoac mail duoc phat tu founder/personal mailbox

## 8. Gate BCC he thong

BCC he thong van phai GIU TAT cho toi khi:

1. ca hai Gmail inbox deu nhan duoc mail that
2. sender la sender he thong that tren `mail.iai.one`
3. reply-to dung policy
4. queue khong bi pending/flood bat thuong
5. auth/relay khong co reject bat ngo

Neu bat BCC truoc khi co 2 inbox proof, lane nay van xem la chua close.

## 9. Message ngan gui team

```text
Blocker cuoi cua Team Email SMTP chi con outbound relay that. Repo da co san script configure relay cho Mailcow/Postfix va script gui smoke that toi 2 Gmail target. Founder/personal mail khong duoc tinh la proof. Team phai inject RELAYHOST, RELAYHOST_PORT, RELAYHOST_USER, RELAYHOST_PASS, RELAYHOST_TLS_LEVEL tren VPS, gui mail that tu sender he thong nhu pay@iai.one/contact@iai.one, lay du Message-ID + log/queue evidence + inbox proof tai ca tranhatam66@gmail.com va tranhatam@gmail.com, roi moi duoc bat BCC he thong.
```
