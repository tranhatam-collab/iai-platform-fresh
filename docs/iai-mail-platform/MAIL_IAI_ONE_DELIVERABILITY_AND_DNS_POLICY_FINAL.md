# MAIL_IAI_ONE_DELIVERABILITY_AND_DNS_POLICY_FINAL

IAI Mail Delivery & Automation Layer

Deliverability and DNS Policy v1  
Version: 1.0 - Production Lock

## 1. Muc tieu

Deliverability la lop bat buoc, khong phai phan "trang tri DNS".

Muc tieu:
- dat authentication hop le
- tach stream de giu reputation
- giam spam/bounce/complaint
- cho phep rollout an toan voi Gmail, Outlook, Yahoo

## 2. Domain strategy khoa ngay tu dau

- `mail.iai.one`: control plane
- `smtp.mail.iai.one`: submission
- `inbound.mail.iai.one`: inbound worker
- `tx.iai.one`: transactional
- `sys.iai.one`: system notifications
- `news.iai.one` hoac `mkt.iai.one`: marketing
- `alerts.iai.one`: alerts
- `bounces.iai.one`: return-path
- `dmarc.iai.one`: report ingestion

## 3. DNS bat buoc

### SPF

Moi stream sending domain phai co SPF hop le, vi du:

```txt
v=spf1 include:_spf.mail.iai.one ~all
```

Hoac include provider cu the:
- SendGrid
- SES
- relay khac

### DKIM

- Moi sending domain phai co it nhat mot selector active
- Key size khuyen nghi `2048`
- Ky outgoing mail bat buoc

### DMARC

Bat buoc co DMARC record. Giai doan dau co the:

```txt
v=DMARC1; p=none; rua=mailto:dmarc@iai.one
```

Sau khi on dinh:
- nang len `quarantine`
- ve sau co the `reject` cho stream da truong thanh

### MX

- Domain nhan mail phai co MX ro rang
- Domain chi gui co the khong can MX, nhung khuyen nghi van co record hop ly cho ops

### rDNS

- Bat buoc kiem tra PTR/rDNS cho self-hosted outbound
- IP khong co rDNS hop le thi khong cho di volume lon

## 4. Stream separation policy

Bat buoc:
- Khong gui marketing cung stream/IP voi password reset
- `transactional`, `system`, `marketing`, `alerts` phai co route va policy rieng
- Sender identity phai gan dung stream

## 5. Return-path va bounce

- Return-path phai dung domain/subdomain co chu dich, vi du `bounces.iai.one`
- Bounce phai map ve message va recipient
- Hard bounce -> suppress ngay
- Soft bounce -> ghi nhan, retry theo policy

## 6. Complaint policy

- Complaint phai tao suppression ngay
- Complaint spike la signal giam health score provider route
- Marketing stream phai co unsubscribe de giam complaint

## 7. Unsubscribe policy

Marketing bat buoc:
- header `List-Unsubscribe`
- `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- link unsubscribe trong body
- luu `unsubscribes` theo workspace + stream/list

## 8. Warmup policy

Warmup la phan van hanh bat buoc cho self-hosted hoac route moi.

Quy tac:
- bat dau volume nho
- uu tien recipient chat luong cao
- tang dan theo ngay
- theo doi bounce/complaint/open rate
- khong bat route moi lam primary neu chua qua warmup

## 9. Recipient-domain throttling

Phai co rule rieng cho:
- Gmail
- Outlook/Hotmail
- Yahoo
- Corporate MX

Muc dich:
- tranh burst qua nhanh
- giam timeout/deferred
- giam bi block tam thoi

## 10. DNS health model

Moi domain phai co dashboard:
- `spf`: pass/warn/fail
- `dkim`: pass/warn/fail
- `dmarc`: pass/warn/fail
- `mx`: pass/warn/fail
- `rdns`: pass/warn/fail
- `overall_status`

Neu `spf`, `dkim`, `dmarc` chua dat:
- khong cho marketing volume lon
- canh bao operator

## 11. Day 1 rollout recommendation

De gui that nhanh nhat:
- route primary: `SendGrid` hoac `SES`
- route backup: provider con lai
- self-hosted chi dung cho test hoac warmup co giam sat

Ly do:
- direct-to-MX tu VPS thuong gap block, timeout, spam
- relay co reputation san tot hon cho launch

## 12. Monitoring can co

- bounce rate theo stream
- complaint rate theo stream
- deferred theo recipient domain
- DNS drift
- DKIM signing health
- webhook freshness
- provider latency

## 13. Chinh sach enforcement

1. Domain chua verify khong duoc gui volume lon.
2. Stream marketing khong duoc dung sender transactional.
3. Hard bounce va complaint phai suppress.
4. Marketing bat buoc unsubscribe.
5. DNS health fail thi UI va API phai canh bao.

## 14. Definition of Done

Deliverability policy dat khi:
- team co domain plan ro rang
- SPF/DKIM/DMARC/rDNS duoc coi la gate bat buoc
- stream separation thanh rule he thong
- bounce/complaint/unsubscribe duoc enforce o runtime
- rollout day 1 co provider route an toan cho gui that
