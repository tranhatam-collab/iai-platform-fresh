# 38_NOOS_TEAM4_SUPPORT_SLA_AND_INCIDENT_PLAYBOOK_2026

# NOOS Team 4 Support SLA and Incident Playbook
## Version 1.0
## Status: ACTIVE FOR TEAM 4 EXECUTION
## Domain: NOOS.iai.one

---

## 1. Muc tieu

Dat mot support motion on dinh cho buyer operations ma khong pha lock files, khong phat minh policy moi ngoai pricing/license/update truth da khoa.

File nay dong bo cho 3 queue Team 4:
- purchase-access
- license-upgrade
- refund-dispute

---

## 2. Owner, scope, va guardrails

- Owner: Team 4 Ops Lead
- Backup owner: Team 4 Growth Lead
- Scope: support sau thanh toan, missing access, upgrade-credit support, refund/dispute triage, update communication

Khong thuoc scope:
- sua product code, route, tier, gia, hoac license truth
- sua runtime entitlement logic ma khong thong qua Team 2

Guardrails:
- authority-led, concise, high-trust
- khong hua ngoai policy da khoa
- moi manual fix phai co audit log

---

## 3. Locked SLA contract

Theo Team 4 operations contract:
- first response SLA: 24h
- resolution SLA: 72h
- queues: purchase-access, license-upgrade, refund-dispute

Internal severity path:

| Severity | Example | First internal action | Buyer update cadence | Escalation |
| --- | --- | --- | --- | --- |
| P0 | da thu tien nhung khong co access tren nhieu buyer hoac pricing mismatch tren live checkout | <= 1h | moi 4h den khi co containment | Team 2 + Team 3 + Team 1 |
| P1 | mot buyer missing access, upgrade credit khong ap dung, refund case nhay cam | <= 4h | moi 24h | Team 2 hoac Team 4 owner |
| P2 | hoi dap license, update window, invoice copy, library navigation | <= 24h | moi 48h neu chua close | Team 4 owner |

Luu y:
- buyer-facing SLA van giu 24h / 72h
- severity chi de Team 4 uu tien noi bo

---

## 4. Ticket intake minimum

Moi ticket phai co:
- buyer_email
- order id hoac checkout session id
- product_code
- license_type neu co
- symptom
- screenshot neu co
- first seen time

Neu thieu order id:
- tim theo buyer_email + timestamp
- khong hua grant lai access truoc khi doi soat

---

## 5. Queue playbooks

### A. purchase-access

Use khi:
- payment thanh cong nhung library chua mo
- confirmation email den cham
- download link khong hien

Checks:
1. doi soat `checkout.session.completed`
2. kiem tra order record va session idempotency
3. kiem tra entitlement grant
4. kiem tra library state
5. kiem tra mail confirmation state neu can

Resolution:
- neu webhook da thanh cong nhung UI chua cap nhat -> escalate Team 2
- neu entitlement grant thieu -> Team 2 replay webhook hoac re-grant co audit log
- neu page/library render sai trang thai -> Team 3 fix surface render

Exit condition:
- buyer vao duoc library dung product/license
- ticket co note root cause

### B. license-upgrade

Use khi:
- buyer muon nang cap theo mapped ladder
- credit khong ap dung du trong cua so hop le
- co nham lan giua Individual / Team / Org path

Checks:
1. xac nhan prior purchase nam tren mapped path
2. xac nhan purchase date con trong cua so credit theo file `25`
3. tinh credit amount theo policy khoa
4. doi soat checkout adjustment / ledger

Resolution:
- neu hop le -> Team 2 ap dung credit va ghi ledger
- neu khong hop le -> Team 4 tra loi ro ly do, dan sang next valid step
- neu can doi wording tren page/success/library -> Team 3 fix surface copy theo lock

Exit condition:
- upgrade credit dung policy
- original entitlement history duoc giu

### C. refund-dispute

Use khi:
- buyer yeu cau refund
- Stripe charge dispute xuat hien
- buyer claim misrepresentation ve price/license/update rights

Checks:
1. xac minh product, license, va update window da render dung chua
2. xac minh delivery/access da duoc grant hay chua
3. tap hop timeline email, checkout, library, va support
4. danh gia co pricing mismatch hay fulfillment failure khong

Resolution:
- neu do Team 4/2/3 loi he thong -> uu tien buyer-safe resolution
- neu dispute can them bang chung -> chuan bi evidence pack trong 24h
- neu ticket co dau hieu lock drift -> escalate Team 1 cung ngay

Exit condition:
- case da duoc close hoac chuyen sang formal dispute owner
- root cause duoc gan vao weekly review

---

## 6. Incident runbooks bat buoc

### Runbook 1: launch-day monitoring
- theo doi checkout completion, failed fulfillment, pricing mismatch theo 2h block
- neu co 1 red KPI lien quan den money hoac access -> mo incident channel ngay

### Runbook 2: failed purchase / missing access
- gom du signal buyer + order id
- doi soat webhook, order, entitlement, library
- replay an toan neu Team 2 xac nhan idempotency
- thong bao buyer sau khi access duoc khoi phuc

### Runbook 3: license upgrade support
- xac nhan mapped path
- xac nhan cua so credit
- ap dung credit qua Team 2
- cap nhat ticket voi amount, path, va next entitlement

### Runbook 4: updates announcement
- thong diep phai noi ro update scope, buyer nao duoc nhan, va cach truy cap
- khong duoc dung update announcement de tao urgency ban hang

---

## 7. Escalation map

- Team 2:
  - checkout failure
  - webhook delay
  - duplicate hoac missing entitlement
  - upgrade-credit ledger issue

- Team 3:
  - CTA/page/success/library render sai price, license, hoac update note
  - broken route, noindex, hoac NOOS boundary drift anh huong buyer journey

- Team 1:
  - can thay doi wording co the anh huong lock truth
  - incident lien quan deploy authority, ownership, hoac mission-map conflict

---

## 8. Buyer communication rules

Phai co:
- acknowledgement ro rang
- timeline cu the
- mot owner chiu trach nhiem
- no-hype, no-defensive tone

Khong duoc:
- hua refund/credit ngoai policy da khoa
- do loi mo ho cho team khac
- delay update qua 24h khi ticket chua giai quyet

---

## 9. Backlog and dependencies

### P0
- chuan hoa ticket form voi order/session fields bat buoc
- tao incident tag cho pricing mismatch, missing access, upgrade-credit
- dong bo support macros voi Team 2 va Team 3

### P1
- dashboard SLA by queue
- weekly root-cause review tren refund/dispute clusters
- update announcement template theo tier va license

Dependencies:
- Team 2 runtime logs va replay capability
- Team 3 page/success/library render fixes
- Team 1 review neu support macro dung toi wording lock

---

## 10. Definition of done

Done khi:
- buyer-facing SLA 24h / 72h duoc van hanh on dinh
- 3 queue chinh co checklists va escalation ro rang
- 4 runbooks bat buoc da duoc dinh nghia
- moi manual fix co audit log va owner
- Team 4 co the xu ly incident ma khong sua lock files
