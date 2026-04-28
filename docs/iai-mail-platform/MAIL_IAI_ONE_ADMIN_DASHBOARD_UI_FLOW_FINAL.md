# MAIL_IAI_ONE_ADMIN_DASHBOARD_UI_FLOW_FINAL

IAI Mail Delivery & Automation Layer

Admin Dashboard UI Flow v1  
Version: 1.0 - Production Lock

## 1. Muc tieu

Dashboard tai `mail.iai.one` la noi operator va dev team:
- setup domain
- tao sender
- publish template
- xem logs
- xu ly suppression
- quan ly automation
- theo doi provider va deliverability

## 2. Vai tro nguoi dung

- `owner`
- `admin`
- `operator`
- `viewer`
- `developer`

## 3. Navigation chinh

- Overview
- Domains
- Senders
- Templates
- Messages
- Events
- Suppressions
- Provider Routes
- Automations
- Inbound
- Health
- Audit Logs

## 4. Screen flow

### 4.1 Overview

Can co:
- tong message 24h
- delivered/deferred/bounced/complained
- provider health
- domain health summary
- queue depth
- alert cards

### 4.2 Domains

Danh sach domain gom:
- verification status
- SPF/DKIM/DMARC/MX/rDNS
- default stream
- last check

Primary actions:
- Add domain
- View DNS instructions
- Trigger verify
- Open DNS health detail

### 4.3 Domain detail

Can co:
- DNS records can tao
- current health
- dkim selectors
- sender identities thuoc domain
- recent issues

### 4.4 Senders

Can co:
- email
- display name
- allowed streams
- status
- domain

Primary actions:
- Create sender
- Edit sender
- Disable sender

### 4.5 Templates

Can co:
- template key
- category
- current active version
- status
- last published by

Detail page:
- locale tabs
- subject/html/text editor
- variables panel
- preview
- test send
- publish version

### 4.6 Messages

Danh sach co filter:
- status
- stream
- provider
- sender
- recipient
- tag
- date range

Message detail:
- summary card
- recipient list
- delivery attempts
- event timeline
- raw normalized payload

### 4.7 Suppressions

Can co:
- email
- reason
- scope
- source
- created at
- expires at

Actions:
- add manual suppression
- unsuppress neu duoc phep

### 4.8 Provider Routes

Can co:
- route name
- stream
- provider
- priority
- status
- failover target
- health

Actions:
- create route
- test route
- disable route

### 4.9 Automations

Can co:
- automation key
- trigger
- status
- action count
- last run
- success/fail trend

Detail:
- action sequence
- run history
- pause/resume

### 4.10 Inbound

Can co:
- inbound mailbox/alias
- parse status
- route status
- spam/auth summary
- attachment count

### 4.11 Health

Can co:
- database
- queue
- worker
- provider connectivity
- webhook freshness
- DNS drift alerts

### 4.12 Audit Logs

Can co:
- ai thay doi gi
- tac dong den doi tuong nao
- thoi diem
- IP/user-agent neu can

## 5. Workflow quan trong

### Workflow A - Add sending domain
1. Operator vao Domains
2. Tao domain
3. Lay DNS records
4. Them record o DNS provider
5. Bam Verify
6. Neu pass -> tao sender

### Workflow B - Publish template
1. Tao template key
2. Nhap locale content
3. Preview
4. Test send
5. Publish version

### Workflow C - Debug message
1. Tim message theo recipient hoac tag
2. Xem attempt va event timeline
3. Xem bounce/complaint neu co
4. Xem provider route va DNS health neu can

### Workflow D - Tao automation
1. Chon event trigger
2. Chon template action
3. Dat delay
4. Activate
5. Theo doi run history

## 6. UI rule

- Chuc nang ops phai uu tien toc do doc va filter
- Cac canh bao deliverability phai hien ro ngay tren page lien quan
- Khong cho publish template loi variable validation
- Khong cho activate route neu config invalid

## 7. Definition of Done

Dashboard UI flow dat khi:
- operator co the setup domain tu dau den cuoi
- dev co the trace message va event
- product co the publish template va automation
- ops co the thay provider health va suppression khong can vao DB
