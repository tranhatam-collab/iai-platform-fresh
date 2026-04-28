# MAIL_IAI_ONE_TEAM_SMTP_STACK_COMMANDS_2026-04-22

Status: SAMPLE VPS COMMAND PACK FOR FINAL TLS/VHOST CLOSEOUT

Date: 2026-04-22

Owner: Team SMTP

Muc tieu:

- cap cert co SAN cho:
  - `mail.iai.one`
  - `api.mail.iai.one`
  - `smtp.mail.iai.one`
  - `inbound.mail.iai.one`
- reload dung ingress stack
- cap nhat cert cho `mail-smtp`
- rerun 5 proof check de close blocker public hostname

Gioi han:

- day la command pack mau
- chon dung 1 stack dang su dung that tren VPS
- neu ten service, duong dan, hoac process manager khac, doi lai cho dung may van hanh

## 0. Common prep

Chay truoc cho ca 3 stack:

```bash
cd /path/to/ops/mail-internal-first
set -a
. ./.env.production
set +a
export CERT_NAME=iai-mail-public
export CERT_DIR="/etc/letsencrypt/live/${CERT_NAME}"
```

## 1. Stack A: nginx + certbot

Gia dinh:

- nginx dang nghe `80/443`
- `mail-api` dang nghe local tai `127.0.0.1:8787`
- Team chap nhan brief downtime de renew cert bang `standalone`

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone --preferred-challenges http \
  --cert-name "${CERT_NAME}" \
  -d mail.iai.one \
  -d api.mail.iai.one \
  -d smtp.mail.iai.one \
  -d inbound.mail.iai.one
sudo tee /etc/nginx/sites-available/iai-mail-public.conf >/dev/null <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name api.mail.iai.one inbound.mail.iai.one;
  return 301 https://\$host\$request_uri;
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name api.mail.iai.one;
  ssl_certificate ${CERT_DIR}/fullchain.pem;
  ssl_certificate_key ${CERT_DIR}/privkey.pem;
  location / {
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_pass http://127.0.0.1:8787;
  }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name inbound.mail.iai.one;
  ssl_certificate ${CERT_DIR}/fullchain.pem;
  ssl_certificate_key ${CERT_DIR}/privkey.pem;
  return 204;
}
EOF
sudo ln -snf /etc/nginx/sites-available/iai-mail-public.conf /etc/nginx/sites-enabled/iai-mail-public.conf
sudo ln -snf "${CERT_DIR}/fullchain.pem" "${MAIL_TLS_CERTS_PATH}/cert.pem"
sudo ln -snf "${CERT_DIR}/privkey.pem" "${MAIL_TLS_CERTS_PATH}/key.pem"
sudo nginx -t
sudo systemctl start nginx
sudo systemctl reload nginx
docker compose --env-file .env.production -f docker-compose.prod.yml restart mail-smtp
```

## 2. Stack B: caddy

Gia dinh:

- caddy la ingress `80/443`
- Team van dung mot SAN bundle tu Let's Encrypt de share cho ca HTTPS va SMTP STARTTLS
- `mail-api` dang nghe local tai `127.0.0.1:8787`

```bash
sudo systemctl stop caddy
sudo certbot certonly --standalone --preferred-challenges http \
  --cert-name "${CERT_NAME}" \
  -d mail.iai.one \
  -d api.mail.iai.one \
  -d smtp.mail.iai.one \
  -d inbound.mail.iai.one
sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
api.mail.iai.one {
  tls ${CERT_DIR}/fullchain.pem ${CERT_DIR}/privkey.pem
  reverse_proxy 127.0.0.1:8787
}

inbound.mail.iai.one {
  tls ${CERT_DIR}/fullchain.pem ${CERT_DIR}/privkey.pem
  respond 204
}
EOF
sudo ln -snf "${CERT_DIR}/fullchain.pem" "${MAIL_TLS_CERTS_PATH}/cert.pem"
sudo ln -snf "${CERT_DIR}/privkey.pem" "${MAIL_TLS_CERTS_PATH}/key.pem"
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl start caddy
sudo systemctl reload caddy
docker compose --env-file .env.production -f docker-compose.prod.yml restart mail-smtp
```

## 3. Stack C: traefik

Gia dinh:

- traefik da bat file provider tai `/etc/traefik/dynamic`
- Team van dung mot SAN bundle tu Let's Encrypt de share cho ca HTTPS va SMTP STARTTLS
- `mail-api` dang nghe local tai `127.0.0.1:8787`

```bash
sudo systemctl stop traefik
sudo certbot certonly --standalone --preferred-challenges http \
  --cert-name "${CERT_NAME}" \
  -d mail.iai.one \
  -d api.mail.iai.one \
  -d smtp.mail.iai.one \
  -d inbound.mail.iai.one
sudo tee /etc/traefik/dynamic/iai-mail-public.yml >/dev/null <<EOF
http:
  routers:
    iai-mail-api:
      rule: "Host(\`api.mail.iai.one\`)"
      service: iai-mail-api
      entryPoints:
        - websecure
      tls: {}
    iai-mail-inbound:
      rule: "Host(\`inbound.mail.iai.one\`)"
      service: iai-mail-api
      entryPoints:
        - websecure
      tls: {}
  services:
    iai-mail-api:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:8787"
tls:
  certificates:
    - certFile: "${CERT_DIR}/fullchain.pem"
      keyFile: "${CERT_DIR}/privkey.pem"
EOF
sudo ln -snf "${CERT_DIR}/fullchain.pem" "${MAIL_TLS_CERTS_PATH}/cert.pem"
sudo ln -snf "${CERT_DIR}/privkey.pem" "${MAIL_TLS_CERTS_PATH}/key.pem"
sudo systemctl start traefik
sudo systemctl reload traefik
docker compose --env-file .env.production -f docker-compose.prod.yml restart mail-smtp
```

Neu traefik dang chay bang Docker thay vi systemd, doi 2 lenh `systemctl` thanh lenh restart container tuong ung.

## 4. Proof ngay sau khi reload

Bat buoc chay ngay:

```bash
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh api-health
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh api-dependencies
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh api-cert
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh smtp-cert
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh inbound-cert
```

## 5. PASS definition

Chi duoc claim close blocker public hostname khi:

- `api-health` pass
- `api-dependencies` pass
- cert SAN co `api.mail.iai.one`
- cert SAN co `smtp.mail.iai.one`
- cert SAN co `inbound.mail.iai.one`
- `mail-smtp` da reload va tra STARTTLS dung hostname moi
