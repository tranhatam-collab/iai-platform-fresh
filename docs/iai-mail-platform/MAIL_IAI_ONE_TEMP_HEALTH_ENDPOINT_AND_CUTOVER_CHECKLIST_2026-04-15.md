# MAIL_IAI_ONE_TEMP_HEALTH_ENDPOINT_AND_CUTOVER_CHECKLIST_2026-04-15
## Status: LOCKED FOR TEAM B + TEAM 3 OPS
## Date: 2026-04-15

---

## 1) Muc tieu

Tai lieu nay khoa 2 viec:
- giu endpoint health tam de team co diem check uptime ngay
- checklist cutover production cho `mail-smtp` theo lane internal-first:
  deploy private -> switch auto-send -> smoke -> verify DB -> observe -> decision gate

---

## 2) Health Endpoint Tam (Dang Live)

- Worker name: `iai-mail-smtp-deploy-probe`
- Account: `62d57eaa548617aeecac766e5a1cb98e`
- Deployment ID: `d3e658a6-e708-46d6-8f5b-f23cd49fa2b9`
- URL: `https://iai-mail-smtp-deploy-probe.anhhatam.workers.dev`
- Version ID: `d6eeddfe-78f8-4b25-9bf6-57dcea24a530`
- Evidence lock timestamp: `01:04 ICT, 2026-04-15`
- Muc dich: health proof tam thoi cho lane deploy Cloudflare

Luu y:
- Endpoint nay KHONG thay the `mail-smtp` production.
- Endpoint nay chi dung de giam sat deploy path va HTTP reachability.

---

## 3) Decision Lock (Internal-First)

Quyet dinh chinh thuc:
- KHONG cut public submission `587/465` ngay.
- Giu Mailcow cho inbound/webmail/IMAP va public submission nhu hien tai.
- Dua `mail-smtp` live noi bo tren VPS truoc.
- Chuyen luong gui tu dong cua app/API sang `mail-smtp` noi bo.
- Chi xem xet thay public submission sau khi da on dinh va co du evidence.

---

## 4) Blocking Fact Can Nho

- `mail-smtp` la SMTP daemon can TCP `465/587`, khong phai Worker HTTP thuần.
- Cutover `mail.iai.one`/`smtp.mail.iai.one` can zone + DNS authority dung account/host.
- Neu chua co host production cho SMTP daemon, khong du dieu kien go-live that.

---

## 5) Checklist Internal-First Cutover (Bam Chay)

Ops pack copy-run:
- `ops/mail-internal-first/docker-compose.prod.yml`
- `ops/mail-internal-first/.env.production.example`
- `ops/mail-internal-first/RUNBOOK_SMOKE_AND_ROLLBACK.md`

### Gate 0: Pre-flight authority
- [ ] Xac nhan Mailcow public submission (`587/465`) GIU NGUYEN, khong thay doi.
- [ ] Xac nhan host production co private network path cho `mail-smtp` noi bo.
- [ ] Xac nhan release approver theo `IAI_DEPLOY_FREEZE_AND_RELEASE_AUTHORITY_2026`.

### Gate 1: Deploy mail-smtp private/internal (remote mode)
- [ ] Deploy/restart service voi env:
  - `MAIL_SMTP_BACKEND_MODE=remote`
  - `MAIL_SMTP_REMOTE_BASE_URL=<api.flow internal url>`
  - `MAIL_SMTP_REMOTE_TOKEN=<service token>`
  - `MAIL_SMTP_REMOTE_AUTH_PATH=auth`
  - `MAIL_SMTP_REMOTE_MAIL_FROM_PATH=mail-from`
  - `MAIL_SMTP_REMOTE_RECIPIENT_PATH=recipient`
  - `MAIL_SMTP_REMOTE_NORMALIZE_PATH=normalize`
  - `MAIL_SMTP_REMOTE_QUEUE_PATH=queue`
  - `MAIL_SMTP_REMOTE_AUDIT_PATH=audit`
- [ ] Health process local:
  - `/health` cua service la `200`
  - log khong co auth/backend timeout loop

### Gate 2: Chuyen auto-send sang SMTP noi bo
- [ ] Chuyen app/API auto-send route sang endpoint SMTP noi bo (private).
- [ ] Khong mo port public moi, khong doi public submission Mailcow.
- [ ] Xac nhan traffic gui tu dong da vao `mail-smtp` noi bo.

### Gate 3: Smoke SMTP that (bat buoc co messageId)
- [ ] Chay smoke:
  - `pnpm --filter @iai/mail-smtp smoke`
  - hoac `swaks` toi endpoint SMTP noi bo
- [ ] Lay ra `messageId` tu ket qua smoke va luu vao ticket release.

### Gate 4: Verify DB theo messageId
- [ ] `messages`: co ban ghi dung workspace/stream/status
- [ ] `message_events`: co timeline event hop le
- [ ] `delivery_attempts`: co attempt + route/provider status
- [ ] Doi chieu timestamp giua SMTP log va DB event.

### Gate 5: Cua so quan sat on dinh
- [ ] Giu on dinh theo cua so quan sat da chot (Ops/Team B).
- [ ] Neu co su co, rollback ve route truoc va ghi postmortem ngan.
- [ ] Neu on dinh, mo decision gate: co lay public submission khoi Mailcow hay tiep tuc giu nguyen.

### Gate 6: Close + rollback readiness
- [ ] Ghi lai bang chung (command output + log + messageId + query result).
- [ ] Cap nhat daily report Team 3 + Team B.
- [ ] Chuan bi rollback:
  - route DNS rollback value
  - service restart to previous config
  - disable new traffic if severe failure

---

## 6) Evidence Pack Bat Buoc Sau Cutover

Can nop day du 6 muc:
- `deploy timestamp`
- `smtp smoke command + output`
- `messageId`
- `messages row snapshot`
- `message_events row snapshot`
- `delivery_attempts row snapshot`

Khong co `messageId` + DB evidence thi KHONG duoc danh dau go-live.

---

## 7) Team Message (Gui Ngay)

```
Team B + Team 3 Ops:
Temporary health endpoint is live at
https://iai-mail-smtp-deploy-probe.anhhatam.workers.dev
(version d6eeddfe-78f8-4b25-9bf6-57dcea24a530).

This is only a deploy-path health proof, not SMTP production.
Do not cut public submission 587/465 now. Keep Mailcow public submission as-is.
To complete real go-live, execute internal-first checklist in:
docs/iai-mail-platform/MAIL_IAI_ONE_TEMP_HEALTH_ENDPOINT_AND_CUTOVER_CHECKLIST_2026-04-15.md

Release can only be marked done after deploy(private remote mode) -> auto-send switch -> SMTP smoke with messageId -> DB verification
(messages, message_events, delivery_attempts).
```

---

## 8) Done Definition

Lane duoc xem la done khi:
- Mailcow public submission van giu nguyen trong giai doan nay
- `mail-smtp` noi bo da nhan traffic auto-send that
- smoke that thanh cong va co `messageId`
- DB verify du 3 bang
- co evidence pack day du
- report Team 1/3/B da cap nhat
