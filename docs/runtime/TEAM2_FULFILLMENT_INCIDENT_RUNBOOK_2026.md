# TEAM2_FULFILLMENT_INCIDENT_RUNBOOK_2026
## Team 2 Fulfillment Incident Runbook
## Version 1.0
## Status: ACTIVE RUNBOOK
## Owner: Team 2 Runtime and Platform Core
## Date: 2026-04-15

---

## 1. Scope

Runbook nay ap dung cho chain:

checkout -> order -> entitlement -> library access -> protected delivery

---

## 2. Severity model

### SEV-1
- payment da thanh cong nhung buyer khong nhan duoc access
- incident anh huong nhieu order

### SEV-2
- access cham
- 1 phan buyer bi block nhung co workaround

### SEV-3
- metadata mismatch
- locale return path sai
- copy/status sai nhung access van ton tai

---

## 3. Initial triage

Trong 15 phut dau phai xac dinh:
- `checkout_session_id`
- `order_id`
- `buyer_id`
- `product_code`
- `locale`
- `message/error code` neu co

Phai kiem tra:
- order da tao chua
- entitlement da grant chua
- library state co doc duoc khong
- protected asset co deny sai khong

---

## 4. Immediate actions

### Neu thanh toan thanh cong nhung chua co order
- log `ORDER_CREATE_FAILED`
- dung retry co kiem soat
- neu retry khong xong -> escalate SEV-1

### Neu co order nhung chua co entitlement
- log `ENTITLEMENT_GRANT_FAILED`
- retry grant job
- khong gui buyer sang empty library ma khong co guidance

### Neu entitlement co nhung UI/library sai
- force refetch library state
- kiem tra Team 3 route/locale handoff
- classify tam la SEV-2/3 tuy impact

### Neu asset deny sai
- verify entitlement access_status
- verify update window
- verify protected URL mapping

---

## 5. Evidence pack bat buoc

Truoc khi close incident phai co:
- request / event ids lien quan
- snapshot order state
- snapshot entitlement state
- buyer-facing state sau fix
- root cause
- rollback / prevention note

---

## 6. Cross-team notifications

- Team 3: neu buyer-facing library/success surface bi sai
- Team 4: neu can buyer communication hoac support handling
- Team 1: neu incident co nguy co impact release gate

---

## 7. Definition of recovery

Incident chi duoc close khi:
- buyer access da dung
- root cause duoc log
- error code da classify
- consumer teams da nhan handoff neu co UI/growth impact
