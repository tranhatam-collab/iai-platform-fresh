# MAIL_IAI_ONE_SMTP_INCIDENT_RESPONSE_RUNBOOK_FINAL

IAI Mail Delivery & Automation Layer

SMTP Incident Response Runbook  
Version: 1.0 - Production Lock  
Date: 2026-04-14

## 1. Muc tieu

Runbook nay dung khi SMTP submission gap su co trong van hanh that.

Muc tieu:
- khoanh vung nhanh
- giam blast radius
- giu an toan chong open relay
- khoi phuc submit hop le som nhat

## 2. Phan loai muc do su co

### SEV-1
- co dau hieu open relay
- auth bypass TLS
- sender policy bi bypass
- queue mat message

### SEV-2
- SMTP khong auth duoc tren dien rong
- queue accept fail tren dien rong
- provider route primary va backup cung khong gui duoc

### SEV-3
- auth failure cuc bo
- provider latency tang
- reject rate tang o mot nhom app

## 3. Nguyen tac xu ly

1. uu tien khoa nguy co abuse truoc
2. khong xoa log va queue state
3. khong doi nhieu bien cung luc neu chua khoanh vung
4. moi thay doi mitigation phai ghi lai timestamp

## 4. Nhan dien nhanh theo trieu chung

### Trieu chung A - Client khong ket noi duoc
Kiem tra:
- DNS
- firewall
- process SMTP
- TLS cert

### Trieu chung B - Ket noi duoc nhung auth fail hang loat
Kiem tra:
- TLS co bat buoc khong
- credential store
- clock skew/secret rollout
- revoked flag nham

### Trieu chung C - Auth thanh cong nhung khong gui duoc
Kiem tra:
- sender policy
- domain verify state
- queue connectivity
- DB write

### Trieu chung D - Queue vao duoc nhung mail khong ra
Kiem tra:
- worker
- provider health
- route config
- webhook/backpressure

### Trieu chung E - Dau hieu open relay
Kiem tra ngay:
- anonymous test
- auth-before-TLS test
- logs cua session khong auth
- connection spike tu IP la

## 5. Lenh kiem tra co ban

### Process va cong nghe

```bash
lsof -iTCP:587 -sTCP:LISTEN
```

### TLS handshake

```bash
openssl s_client -starttls smtp -connect smtp.mail.iai.one:587 -servername smtp.mail.iai.one
```

### Auth happy path

```bash
swaks --server smtp.mail.iai.one --port 587 --tls \
  --auth LOGIN --auth-user <SMTP_USER> --auth-password '<SMTP_PASS>' \
  --from no-reply@tx.iai.one --to you@example.com \
  --header 'Subject: Incident verification' --body 'smtp incident verification'
```

### Anonymous relay test

```bash
swaks --server smtp.mail.iai.one --port 587 --tls \
  --from evil@example.com --to you@example.com \
  --header 'Subject: relay probe' --body 'must fail'
```

## 6. Playbook theo loai su co

### Case 1 - Open relay suspicion
1. nang muc SEV-1
2. tam khoa traffic moi hoac close submission service
3. disable credential cohort neu can
4. chay anonymous relay test lap tuc
5. kiem tra log va khoanh IP/credential bi loi
6. chi mo lai khi da PASS lai tat ca security smoke

### Case 2 - Auth failure spike
1. xac dinh pham vi: tat ca hay mot nhom app
2. kiem tra credential store, hash verification, revoke flags
3. kiem tra TLS requirement co vua thay doi khong
4. test 1 credential known-good
5. neu do rollout secret -> rollback credential config

### Case 3 - Queue fail
1. kiem tra DB va queue health
2. stop accept traffic moi neu queue mat kha nang ghi
3. khong tra `250` neu queue khong accept
4. khoi phuc queue truoc khi mo lai submit

### Case 4 - Provider outage
1. xac nhan route primary loi
2. chuyen uu tien sang backup route da duoc test
3. theo doi backlog va retry
4. thong bao team Runtime va Deliverability

## 7. Mitigation tam thoi duoc phep

- disable onboarding app moi
- tam giam concurrency
- tam chuyen sang backup route
- tam revoke credential nghiem ngo
- tam reject marketing neu can giai phong capacity

## 8. Mitigation khong duoc phep khi chua duyet

- mo anonymous relay tam thoi
- tat sender validation
- tat suppression check
- cho auth truoc TLS
- gui truc tiep provider tu SMTP runtime de "chua chay"

## 9. Bang chung can luu

- timestamp bat dau
- trieu chung
- severity
- logs lien quan
- ket qua test TLS/auth/relay probe
- route/provider state
- mitigation da ap dung
- thoi diem phuc hoi

## 10. Tieu chi incident duoc xem la giai quyet

- security gate pass lai
- happy path pass lai
- queue accept on dinh
- auth failure tro ve nguong binh thuong
- provider route on dinh hoac backup route on dinh
- launch owner xac nhan co the mo lai traffic binh thuong

## 11. Postmortem toi thieu

Sau moi SEV-1 hoac SEV-2, bat buoc co postmortem gom:
- nguyen nhan goc
- blast radius
- tai sao phat hien cham/nhanh
- hanh dong sua vinh vien
- test bo sung can them
