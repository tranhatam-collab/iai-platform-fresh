# IAI_TEAM1_ADMIN_COMMAND_CENTER_AND_DEPLOY_AUTHORITY_2026
## Team 1 admin command center, review authority, and deploy authority
## Version 1.0
## Status: LOCKED FOR TEAM 1 / ALL DELIVERY TEAMS
## Scope: *.iai.one
## Date: 2026-04-15

---

## 1. Why this file exists

Tu thoi diem nay, Team 1 khong duoc van hanh nhu mot team planning chung chung.
Team 1 phai la:
- admin command center cua toan he
- noi theo doi trang thai thuc cua tat ca teams
- noi review GO/NO-GO cho moi lane release
- noi giu deploy authority cuoi cung khi gate da xanh
- noi giu conflict, blocker, access, account, va rollback law

Neu vai tro nay khong duoc khoa ro:
- cac team se tiep tuc build nhung khong co mot nguon phe duyet duy nhat
- release se xanh tung phan nhung do vo toan he
- deploy authority se bi phan tan
- account, secrets, va env ownership se tro nen nguy hiem

File nay la ban giao chinh thuc de Team 1 vao vai tro admin command ngay.

---

## 2. Absolute role of Team 1

Team 1 la:
- constitutional root operator
- admin command center
- cross-team audit owner
- release review authority
- final deploy authority
- post-deploy observation owner
- escalation owner for blockers and access issues

Team 1 khong phai la:
- team code thay Team 2
- team content thay Team 3
- team funnel thay Team 4
- team growth build thay Team 5

Hard rule:
- Team 1 co the hotfix trong emergency lane neu can, nhung khong duoc bien thanh delivery team thay cac team khac theo cach thuong xuyen.

---

## 3. Core mission Team 1 phai giu

Team 1 phai dam bao dong thoi 6 viec:

1. Giu dung root mission va domain boundaries
2. Theo doi trang thai that cua moi team va moi subdomain
3. Kiem duyet moi release packet truoc khi deploy
4. Chot GO/NO-GO dua tren evidence that, khong dua tren cam giac
5. Deploy khi va chi khi gate xanh
6. Theo doi sau deploy va kich hoat rollback neu can

Neu Team 1 bo sot 1 trong 6 viec tren, admin function bi xem la chua dat.

---

## 4. Team 1 operating lanes

### Lane A - Governance truth
Team 1 giu:
- mission map
- assignment matrix
- dependency critical path
- release gates
- definition of done
- evidence packet standard

### Lane B - System audit
Team 1 kiem tra:
- route status
- runtime evidence
- locale/SEO compliance
- boundary compliance
- auth/billing/proof contract compliance

### Lane C - Review and approval
Team 1 review:
- branch or commit evidence
- changed routes
- test evidence
- rollback note
- env or binding delta
- known issues

### Lane D - Deploy authority
Team 1 co quyen:
- cho deploy
- tam dung deploy
- yeu cau freeze
- yeu cau rollback
- mo lai gate khi evidence da du

### Lane E - Post-deploy watch
Team 1 phai:
- chot health check
- doi chieu route/API sau deploy
- ghi log release result
- dong go-live chi khi post-deploy evidence on

### Lane F - Access and account control
Team 1 phai theo doi:
- Cloudflare account/project/domain ownership
- Vercel/Pages/Workers deploy authority
- GitHub merge authority
- Stripe or billing admin touchpoints
- production access grants and revoke notes

Bat ky access team hay account-owner lane nao cung nam duoi Team 1 governance.

---

## 5. What every team must send to Team 1

Khong team nao duoc noi "da xong" bang chat tay.
Moi team phai nop mot handoff packet toi thieu gom:

- team owner
- scope vua thay doi
- routes vua thay doi
- APIs/contracts lien quan
- exact files changed
- commit or working tree scope
- test commands da chay
- ket qua pass/fail
- screenshot or UI proof neu la surface
- curl or API proof neu la backend
- rollback note
- known issues
- dependency touched
- release ask: preview only / prod candidate / hotfix

Format packet phai bam:
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

---

## 6. Hard review gates Team 1 phai ap dung

Team 1 khong duoc approve neu thieu bat ky gate nao sau day:

### Gate 1 - Mission and boundary
- co vi pham `IAI_MASTER_DOMAIN_MISSION_MAP.md` khong
- co domain drift khong
- co route nao dang giong sang vai tro domain khac khong

### Gate 2 - Locale and SEO
- EN/VI co dung contract khong
- canonical/hreflang/x-default co dung khong
- tieng Viet co dau co dung o surface can dung khong
- route noindex/redirect co dung voi route legacy khong
- `content/iai-language-codex.md` va `content/iai-ui-text-system.md` co duoc tuan thu khong
- `content/iai-prompt-system-standard.md` va `content/iai-ui-copy-registry.md` co duoc tuan thu khong
- CTA/badge/footer/public labels co dung registry khong
- public strings co bi hard-code lech `content/vi.json` / `content/en.json` khong

### Gate 3 - Contract and runtime truth
- auth/session contract co pass khong
- billing/checkout/entitlement contract co pass khong
- runtime truth co that khong
- khong co fake state mac dinh khong

### Gate 4 - Evidence truth
- test evidence co that khong
- screenshot/API proof co that khong
- rollback note co that khong
- owner va on-call co ro khong

### Gate 5 - Access and env truth
- env/bindings/secrets thay doi da duoc ghi nhan chua
- deploy target co dung account/project/domain khong
- access owner co ro rang khong

Thieu 1 gate:
- status = NO-GO

---

## 7. Deploy authority rules

### Final rule
Khong co deploy "vi thay co ve on".
Chi deploy khi Team 1 da danh dau GO.

### Team deploy model
- Team 2, 3, 4, 5 co the chuan bi release candidate
- Team 1 la noi chot deploy authority cuoi cung
- Team 1 co quyen yeu cau preview truoc khi cho production

### Team 1 phai xac nhan truoc deploy
- release packet da du
- gate da xanh
- rollback da san
- owner on-call da ro
- production target da ro

### Team 1 phai xac nhan sau deploy
- health endpoint on
- main route on
- critical contract on
- khong co regression ro rang
- lane report duoc cap nhat

### Emergency hotfix rule
Emergency hotfix chi duoc di nhanh hon, khong duoc bo gate.
Toi thieu van phai co:
- scope rat hep
- test bang chung toi thieu
- rollback note
- Team 1 explicit GO

---

## 8. Team 1 daily operating protocol

### Start of day
Team 1 cap nhat:
- root protocol compliance check
- live tracking board
- blocker list
- risks open
- release candidates dang cho

### Midday review
Team 1 host:
- cross-team blocker sync
- dependency review
- account/access escalation neu co

### Pre-deploy review
Team 1 doi chieu:
- gate packet
- env/bindings delta
- target deploy
- rollback readiness

### End of day
Team 1 ghi:
- daily status
- release decisions
- blocker carry-over
- risk changes

---

## 9. Files Team 1 phai duy tri lien tuc

- `docs/IAI_MASTER_DOMAIN_MISSION_MAP.md`
- `docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md`
- `docs/IAI_TEAM1_PROGRAM_ROOT_EXECUTION_PLAN_2026.md`
- `docs/IAI_TEAM1_ADMIN_COMMAND_CENTER_AND_DEPLOY_AUTHORITY_2026.md`
- `docs/IAI_TEAM_ACTIVE_ASSIGNMENT_MATRIX_2026-04-15.md`
- `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md`
- `docs/IAI_CROSS_TEAM_EXECUTION_MODEL_2026.md`
- `docs/IAI_DEPENDENCY_CRITICAL_PATH_2026.md`
- `docs/IAI_ENV_BINDINGS_AND_SECRETS_SOURCE_OF_TRUTH_2026.md`
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`
- `docs/FLOW_IAI_ONE_RELEASE_GATE_2026.md`
- `docs/DEVELOPER_IAI_ONE_RELEASE_GATE_2026.md`
- `docs/DASH_IAI_ONE_RELEASE_GATE_2026.md`
- `docs/NFT_IAI_ONE_AND_VC_VETUONGLAI_COM_TWO_LAYER_ASSET_PROTECTION_MASTER_PLAN_2026.md`
- `docs/NFT_IAI_ONE_RELEASE_GATE_2026.md`
- `docs/TEAM1_DEFINITION_OF_DONE_2026.md`
- `docs/reports/team1/TEAM1_RISK_REGISTER_2026.md`
- `docs/reports/team1/TEAM1_DECISION_LOG_2026.md`
- `docs/reports/team1/NFT_PHASE_C_TEAM1_INTAKE_REVIEW_QUEUE_2026-04-17.md`
- `docs/reports/team1/WEEKLY_TEAM1_INTEGRATED_2026_W16.md`

---

## 10. Team 1 authority over access and accounts

Bat dau tu file nay, Team 1 cung phai quan tri lane access/account.

### Team 1 phai biet ro
- domain nao nam o account nao
- project nao deploy vao domain nao
- ai la owner cua Cloudflare / Vercel / GitHub / Stripe / SMTP production
- secret nao doi lane nao quan tri
- ai co quyen deploy prod

### Khong duoc
- paste secrets vao chat
- deploy vao account mo ho
- doi binding/env ma khong cap nhat source-of-truth
- cap access ma khong co owner record

### Moi thay doi access phai co
- ly do
- owner approve
- target system
- pham vi quyen
- thoi diem cap/revoke neu la tam thoi

---

## 11. Immediate execution order for Team 1 from now

1. Giữ live tracking board la nguon su that moi ngay.
2. Kiem tra team nao dang lam viec ma chua obey `docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md`.
3. Yeu cau moi team nop evidence packet theo template chung.
4. Ghi moi packet vao intake/review queue truoc khi Team 1 cham gate.
5. Review lane theo thu tu dependency critical path, khong review ngau nhien.
6. Chot GO/NO-GO ro rang cho tung lane, tung domain.
7. Deploy khi gate xanh, ghi lai release decision ngay sau deploy.
8. Theo doi post-deploy, neu do thi rollback ngay theo note da nop.
9. Duy tri risk register, decision log, va weekly integrated report lien tuc.
10. Ban hanh va cap nhat file directive active cho cac team khi checkpoint reality thay doi.

---

## 12. Immediate handoff packet for Team 1 dev work

Neu giao ngay cho Team 1 dev/admin lane, handoff phai noi ro:

- Team 1 khong phai build thay cac team khac
- Team 1 build:
  - review flows
  - release gate records
  - deploy checklist
  - system audit routines
  - observation and rollback routines
- Team 1 duoc phep:
  - chot NO-GO
  - yeu cau them evidence
  - tam dung release
  - yeu cau access clarification
- Team 1 phai ban hanh:
  - daily status
  - gate decisions
  - weekly integrated summary

---

## 13. Definition of done

Team 1 chi duoc xem la dung vai tro moi khi:
- moi team deu biet phai nop gi cho Team 1
- Team 1 co gate GO/NO-GO ro rang
- Team 1 co the audit lai moi domain dang chay
- Team 1 co deploy authority ro rang
- Team 1 theo doi duoc post-deploy health
- lane access/account da nam trong governance cua Team 1
- khong con release nao "tu chay" ma khong qua Team 1

---

## 14. Final directive

Tu bay gio:
- Team 1 = admin command center
- Team 1 = final review authority
- Team 1 = final deploy authority
- Team 1 = post-deploy control tower

Moi team khac duoc phep build nhanh hon.
Nhung khong team nao duoc tu dong dong release neu Team 1 chua cho GO.
