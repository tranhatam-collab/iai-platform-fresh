# PAY IAI ONE SITE PAYMENT EMAIL RESEARCH 2026-04-22

Mục tiêu của file này là khóa nguồn nghiên cứu và hướng viết cho payment email theo từng domain trong wave Team D.  
Không dùng một bộ wording chung cho tất cả website.  
Mỗi packet email phải bám đúng:

- vai trò sản phẩm của domain
- giọng ngôn ngữ đã khóa trong repo nguồn
- bối cảnh người dùng thực sự của site
- loại hành động thanh toán hợp lý với site đó

## Rule chốt

- `tranhatam.com` giữ bộ 4 template founder-locked đã chốt trước đó.
- 16 domain còn lại trong wave Team D dùng `TEAM_D_CORE_PAYMENT_SET` gồm 4 email:
  - `payment_receipt`
  - `checkout_status_update`
  - `payment_failed_notice`
  - `refund_notice`
- `pay.iai.one`, `dash.iai.one`, `developer.iai.one` vẫn giữ full pack riêng vì đó là surface nội bộ hoặc billing-support, không phải customer-facing Team D prep domains.

## Research matrix

| Domain | Nguồn nghiên cứu chính | Chốt nội dung site | Hướng viết payment email |
|---|---|---|---|
| `tranhatam.com` | founder-locked packet đã có trong `apps/pay/src/payment-email-templates.ts` | founder site, one-time collection trước | ấm, trực tiếp, rõ ràng, không khoa trương |
| `nguyenlananh.com` | `/Users/tranhatam/Documents/Devnewproject/nguyenlananh.com/content/vi.json`, `/Users/tranhatam/Documents/Devnewproject/nguyenlananh.com/content/en.json`, `/Users/tranhatam/Documents/Devnewproject/nguyenlananh.com/docs/MEMBERSHIP_SYSTEM_MASTER.md` | hành trình hiểu mình, thực hành, deep content, member journey | dùng từ `hành trình`, `thành viên`, `đi sâu`, tránh sales tone và coaching hype |
| `omdala.com` | `/Users/tranhatam/Documents/Devnewproject/omdala.com/README.md`, `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/lib/content.ts` | nền tảng điều phối đời thực có kiểm chứng | dùng từ `activation`, `coordination plan`, `access lane`, giọng trust-first |
| `app.omdala.com` | `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/README.md` | authenticated product shell, dashboard, request flow | email thiên về `workspace`, `billing action`, `access`, không viết như public brand copy |
| `omdalat.com` | `/Users/tranhatam/Documents/Devnewproject/omdalat.com/README.md`, `/Users/tranhatam/Documents/Devnewproject/omdalat.com/apps/web/index.html`, `/Users/tranhatam/Documents/Devnewproject/omdalat.com/apps/web/app.js` | hệ sống thực địa ở Đà Lạt cho sống, làm việc, học, cộng đồng | dùng từ `tham gia`, `sống/làm/học`, tone người thật, không dùng du lịch hoặc retreat wording |
| `app.omdalat.com` | `/Users/tranhatam/Documents/Devnewproject/omdalat.com/apps/app/index.html`, `/Users/tranhatam/Documents/Devnewproject/omdalat.com/apps/app/README.md` | member + operations workspace cho Ôm Đà Lạt | email thiên về `workspace`, `member access`, `billing`, không dùng tone landing page |
| `flow.iai.one` | `/Users/tranhatam/Documents/Devnewproject/flow.iai.one/README.md`, `/Users/tranhatam/Documents/Devnewproject/flow.iai.one/index.html` | AI workflow / agents / runtime orchestration platform | builder-first, nhắc `workflows`, `agents`, `runtime`, tránh SaaS-hype |
| `life.iai.one` | `/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/life.iai.one/README.md`, `/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/life.iai.one/index.html` | hệ sống giúp hiểu mình, học đúng, tạo giá trị kiểm chứng | ấm, rõ, trấn an, dùng `lộ trình`, `quyền truy cập`, tránh hard sell |
| `vc.vetuonglai.com` | `/Users/tranhatam/Documents/Devnewproject/vetuonglai-system/content/vi.json`, `/Users/tranhatam/Documents/Devnewproject/vetuonglai-system/content/site-map.md`, `/Users/tranhatam/Documents/Devnewproject/vetuonglai-system/README.md` | lớp xác minh độc lập cho năng lực, tài sản, dự án | dùng `xác minh`, `hồ sơ`, `layer`, không dùng từ membership chung chung |
| `invest.vetuonglai.com` | `/Users/tranhatam/Documents/Devnewproject/vetuonglai-system/content/vi.json`, `/Users/tranhatam/Documents/Devnewproject/vetuonglai-system/content/en.json` | lớp đầu tư tỉnh táo, risk-first, due diligence | dùng `đầu tư`, `rủi ro`, `checklist`, tone bình tĩnh, không FOMO |
| `life.vetuonglai.com` | `/Users/tranhatam/Documents/Devnewproject/vetuonglai-system/content/vi.json`, `/Users/tranhatam/Documents/Devnewproject/vetuonglai-system/content/en.json` | lớp ổn định nhịp sống, giữ năng lượng, review tuần | dùng `nhịp sống`, `baseline`, `review`, tone dịu và có cấu trúc |
| `aiaccountingloop.com` | `/Users/tranhatam/Documents/Devnewproject/aiaccountingloop.com/site/index.html`, `/Users/tranhatam/Documents/Devnewproject/aiaccountingloop.com/site/product/index.html`, `/Users/tranhatam/Documents/Devnewproject/aiaccountingloop.com/site/trust/index.html` | accounting workspace cho bookkeeping, reconciliation, reporting, compliance | email thiên về `billing`, `workspace`, `invoice`, `record`, không viết như consumer checkout |
| `tramsaigon.com` | `/Users/tranhatam/Documents/Devnewproject/tramsaigon.com/README.md`, `/Users/tranhatam/Documents/Devnewproject/tramsaigon.com/site/membership/index.html`, `/Users/tranhatam/Documents/Devnewproject/tramsaigon.com/site/creator-program/index.html` | multilingual city platform với membership, creator value, business discovery | dùng `membership`, `creator access`, `deeper access`, giữ trust-first và plain language |
| `app.iai.one` | `/Users/tranhatam/Documents/Devnewproject/app.iai.one/README.md` | control center cho tạo, edit, preview, publish website | email thiên về `workspace`, `billing action`, `control center`, không viết kiểu consumer brand |
| `noos.iai.one` | `/Users/tranhatam/Documents/Devnewproject/noos.iai.one/README.md`, `/Users/tranhatam/Documents/Devnewproject/noos.iai.one/index.html` | Civilization OS, governance, system map, trusted coordination layer | dùng `operating layer`, `access`, `documentation lane`, giọng cấu trúc và trust-first |
| `cios.iai.one` | `/Users/tranhatam/Documents/Devnewproject/cios.iai.one/README.md`, `/Users/tranhatam/Documents/Devnewproject/cios.iai.one/site/index.html`, `/Users/tranhatam/Documents/Devnewproject/cios.iai.one/site/pricing/index.html` | enterprise intelligence product, pricing cho teams, control | formal hơn, thiên về `billing`, `plan`, `service`, `invoice` |
| `lamviec.muonnoi.org` | `/Users/tranhatam/Documents/Devnewproject/muonnoi.org/lamviec/index.html`, `/Users/tranhatam/Documents/Devnewproject/muonnoi.org/app.muonnoi.org/apps/web/index.html`, `/Users/tranhatam/Documents/Devnewproject/muonnoi.org/README.md` | operating gateway cho signals, interventions, workflows, reports | email thiên về `workspace`, `operating access`, `billing record`, không dùng consumer commerce copy |

## Wording lock theo nhóm

### Nhóm hành trình / member / access

Áp dụng cho:

- `nguyenlananh.com`
- `omdalat.com`
- `life.iai.one`
- `vc.vetuonglai.com`
- `invest.vetuonglai.com`
- `life.vetuonglai.com`
- `tramsaigon.com`
- `noos.iai.one`

Ưu tiên:

- `quyền truy cập`
- `hành trình`
- `lộ trình`
- `lớp`
- `tham gia`

Tránh:

- hype conversion copy
- urgency giả
- marketing adjectives rỗng

### Nhóm workspace / billing / account

Áp dụng cho:

- `app.omdala.com`
- `app.omdalat.com`
- `flow.iai.one`
- `aiaccountingloop.com`
- `app.iai.one`
- `lamviec.muonnoi.org`

Ưu tiên:

- `workspace`
- `billing action`
- `invoice`
- `billing record`
- `access lane`

Tránh:

- viết như consumer storefront
- dùng từ `đơn hàng` nếu ngữ cảnh thực là invoice / workspace billing

### Nhóm enterprise / formal

Áp dụng cho:

- `cios.iai.one`

Ưu tiên:

- `plan`
- `service`
- `billing`
- `invoice`
- `adjustment`

Tránh:

- member wording
- lifestyle wording
- soft emotional language

## Output runtime đã khóa

Runtime hiện lấy packet email theo domain từ:

- [team-d-payment-email-profiles.ts](/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/apps/pay/src/team-d-payment-email-profiles.ts)
- [payment-email-templates.ts](/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/apps/pay/src/payment-email-templates.ts)

Route dùng để kiểm tra:

- `GET /api/payment-email-templates?domain=<domain>`

Definition of done cho lớp này:

- domain có packet riêng
- subject / preview / body không dùng wording generic trái vai
- sender policy giữ `pay`, `billing`, `support`
- `noreply` không được dùng làm payment sender
- template set trả về ổn định cho toàn bộ Team D wave
