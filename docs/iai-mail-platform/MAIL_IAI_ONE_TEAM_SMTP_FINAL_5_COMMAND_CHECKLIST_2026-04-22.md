# MAIL_IAI_ONE_TEAM_SMTP_FINAL_5_COMMAND_CHECKLIST_2026-04-22

Status: FINAL PUBLIC HOSTNAME PROOF CHECKLIST

Date: 2026-04-22

Owner: Team SMTP

Muc tieu:

- chot phan con lai cho `api.mail.iai.one`, `smtp.mail.iai.one`, `inbound.mail.iai.one`
- prove dung TLS/SAN/vhost theo hostname canonical moi
- fail nhanh neu cert van chi cover `mail.iai.one`

Luu y:

- repo nay khong khoa stack ingress cu the theo `nginx`, `caddy`, `traefik` hay `certbot`
- vi vay phan cap hoac renew cert va reload service phai dung dung tool van hanh that tren VPS
- sau khi Team SMTP cap cert hoac reload vhost xong, chay dung 5 lenh duoi day
- neu can command pack mau theo stack, xem them:
  - `docs/iai-mail-platform/MAIL_IAI_ONE_TEAM_SMTP_STACK_COMMANDS_2026-04-22.md`

## 5 lenh cuoi

```bash
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh api-health
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh api-dependencies
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh api-cert
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh smtp-cert
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh inbound-cert
```

## PASS khi

1. `api-health` tra ve JSON health hop le qua `https://api.mail.iai.one/v1/health`
2. `api-dependencies` tra ve JSON dependencies hop le qua `https://api.mail.iai.one/v1/health/dependencies`
3. `api-cert` cho thay SAN co `DNS:api.mail.iai.one`
4. `smtp-cert` cho thay SAN co `DNS:smtp.mail.iai.one`
5. `inbound-cert` cho thay SAN co `DNS:inbound.mail.iai.one`

## FAIL hien tai ma script se bat ra

O trang thai packet ngay `2026-04-22`, cac lenh tren van expected fail neu Team SMTP chua chot cert/vhost, vi:

- `api.mail.iai.one` van bi TLS hostname mismatch
- `smtp.mail.iai.one` van tra certificate cua `mail.iai.one`
- `inbound.mail.iai.one` cung van chua co proof cert theo hostname rieng

## Ket luan

Neu ca 5 lenh deu pass, blocker public hostname cho Team SMTP duoc xem la da close o lop:

- DNS
- TLS
- SAN
- vhost
- public API health
