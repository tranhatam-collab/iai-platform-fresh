# UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT_2026-04-23
- Generated at: 2026-04-23T04:57:21.760Z
- Timezone: Asia/Ho_Chi_Minh
- Total URLs audited: 64
- Total pages flagged: 11
- Vietnamese issues open: 0
- English issues open: 0
- Metadata issues open: 0
- Alt text issues open: 0
- CTA/form/menu/footer issues open: 2

## Locked Decisions
- Tiếng Việt là nguồn chuẩn nội dung của toàn hệ.
- Tiếng Anh là lớp quốc tế thứ hai và không được phép dùng fallback dịch máy.
- Mọi public text phải đi qua shared content source hoặc registry đã khóa.
- Mỗi surface public phải có metadata song ngữ riêng theo locale đang render.
- Không được live page public khi còn hard-coded text, text placeholder hoặc text lẫn ngôn ngữ.

## Global Sources
- [x] docs/IAI_UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_COMMAND_2026.md
- [x] docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md
- [x] content/iai-language-codex.md
- [x] content/iai-ui-copy-registry.md
- [x] content/iai-ui-text-system.md
- [x] content/vi.json
- [x] content/en.json
- [x] content/seo-registry.csv

## Surface Audit
### root
- Base URL: https://iai.one
- Localized URL count: 4
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=12, btn=10, form=0, placeholder=0, footer=4
- Route: / | VI https://iai.one/ | EN https://iai.one/?lang=en
- Route: /og.svg | VI https://iai.one/og.svg | EN https://iai.one/og.svg?lang=en

### home
- Base URL: https://home.iai.one
- Localized URL count: 2
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=4, btn=8, form=0, placeholder=0, footer=4
- Route: / | VI https://home.iai.one/ | EN https://home.iai.one/?lang=en

### app
- Base URL: https://app.iai.one
- Localized URL count: 2
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=4, btn=4, form=0, placeholder=0, footer=4
- Route: / | VI https://app.iai.one/ | EN https://app.iai.one/?lang=en

### flow
- Base URL: https://flow.iai.one
- Localized URL count: 2
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=5, btn=4, form=0, placeholder=0, footer=4
- Route: / | VI https://flow.iai.one/ | EN https://flow.iai.one/?lang=en

### docs
- Base URL: https://docs.iai.one
- Localized URL count: 2
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=4, btn=6, form=0, placeholder=0, footer=4
- Route: / | VI https://docs.iai.one/ | EN https://docs.iai.one/?lang=en

### developer
- Base URL: https://developer.iai.one
- Localized URL count: 16
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=16, btn=13, form=0, placeholder=0, footer=8
- Route: / | VI https://developer.iai.one/ | EN https://developer.iai.one/?lang=en
- Route: /404 | VI https://developer.iai.one/404 | EN https://developer.iai.one/404?lang=en
- Route: /auth | VI https://developer.iai.one/auth | EN https://developer.iai.one/auth?lang=en
- Route: /changelog | VI https://developer.iai.one/changelog | EN https://developer.iai.one/changelog?lang=en
- Route: /nodes | VI https://developer.iai.one/nodes | EN https://developer.iai.one/nodes?lang=en
- Route: /quickstart | VI https://developer.iai.one/quickstart | EN https://developer.iai.one/quickstart?lang=en
- Route: /sdk | VI https://developer.iai.one/sdk | EN https://developer.iai.one/sdk?lang=en
- Route: /webhooks | VI https://developer.iai.one/webhooks | EN https://developer.iai.one/webhooks?lang=en

### nft
- Base URL: https://nft.iai.one
- Localized URL count: 2
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=4, btn=6, form=0, placeholder=0, footer=4
- Route: / | VI https://nft.iai.one/ | EN https://nft.iai.one/?lang=en

### pay
- Base URL: https://pay.iai.one
- Localized URL count: 6
- Issues: 1
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=1, localized=1
- UI registry signals: nav=8, btn=7, form=0, placeholder=0, footer=8
- Route: / | VI https://pay.iai.one/ | EN https://pay.iai.one/?lang=en
- Route: /internal/payment-email/send | VI https://pay.iai.one/internal/payment-email/send | EN https://pay.iai.one/internal/payment-email/send?lang=en
- Route: /payment-block | VI https://pay.iai.one/payment-block | EN https://pay.iai.one/payment-block?lang=en
- Hard-coded candidate (quoted-copy): If funds may have moved, reconciliation must still remain open.
- Hard-coded candidate (quoted-copy): If the signal does not match, the route must flow into review or reconciliation handling.
- Hard-coded candidate (quoted-copy): Kênh chính
- Hard-coded candidate (quoted-copy): Kênh nhận tiền render từ assignment hiện hành
- Hard-coded candidate (quoted-copy): Kênh phụ
- Hard-coded candidate (quoted-copy): Khám phá audit
- Hard-coded candidate (quoted-copy): Khoản giữ chờ phê duyệt
- Hard-coded candidate (quoted-copy): Khối nhận thanh toán
- Hard-coded candidate (quoted-copy): Không xử lý xong ngoại lệ nếu chưa có ghi chú audit.
- Hard-coded candidate (quoted-copy): Không yêu cầu người thanh toán trả lại tiền lần nữa
- Issue: Còn candidate hard-coded public text trong render source.

### dash
- Base URL: https://dash.iai.one
- Localized URL count: 16
- Issues: 1
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=1, btn=1, form=0, placeholder=0, footer=4
- Route: /actions | VI https://dash.iai.one/actions | EN https://dash.iai.one/actions?lang=en
- Route: /audit | VI https://dash.iai.one/audit | EN https://dash.iai.one/audit?lang=en
- Route: /dashboard | VI https://dash.iai.one/dashboard | EN https://dash.iai.one/dashboard?lang=en
- Route: /flows | VI https://dash.iai.one/flows | EN https://dash.iai.one/flows?lang=en
- Route: /login | VI https://dash.iai.one/login | EN https://dash.iai.one/login?lang=en
- Route: /logout | VI https://dash.iai.one/logout | EN https://dash.iai.one/logout?lang=en
- Route: /runtime | VI https://dash.iai.one/runtime | EN https://dash.iai.one/runtime?lang=en
- Route: /runtime/executions | VI https://dash.iai.one/runtime/executions | EN https://dash.iai.one/runtime/executions?lang=en
- Hard-coded candidate (quoted-copy): Các đối tượng gắn trực tiếp với runtime truth.
- Hard-coded candidate (quoted-copy): Chi tiết
- Hard-coded candidate (quoted-copy): Chi tiết execution
- Hard-coded candidate (quoted-copy): Chi tiết flow
- Hard-coded candidate (quoted-copy): Chưa bắt đầu
- Hard-coded candidate (quoted-copy): Đã hoàn tất
- Hard-coded candidate (quoted-copy): Đã lưu
- Hard-coded candidate (quoted-copy): Đang chờ
- Hard-coded candidate (quoted-copy): Danh mục flow
- Hard-coded candidate (quoted-copy): Độ sẵn sàng của builder
- Issue: Còn candidate hard-coded public text trong render source.

### web
- Base URL: https://web.iai.one
- Localized URL count: 12
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=3, localized=3
- UI registry signals: nav=2, btn=4, form=0, placeholder=0, footer=4
- Route: / | VI https://web.iai.one/ | EN https://web.iai.one/?lang=en
- Route: /contract-status | VI https://web.iai.one/contract-status | EN https://web.iai.one/contract-status?lang=en
- Route: /demo | VI https://web.iai.one/demo | EN https://web.iai.one/demo?lang=en
- Route: /onboarding | VI https://web.iai.one/onboarding | EN https://web.iai.one/onboarding?lang=en
- Route: /onboarding#contracts | VI https://web.iai.one/onboarding#contracts | EN https://web.iai.one/onboarding#contracts?lang=en
- Route: /shared-auth | VI https://web.iai.one/shared-auth | EN https://web.iai.one/shared-auth?lang=en

### noos-web
- Base URL: https://noos.iai.one
- Localized URL count: 0
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=2, localized=2
- UI registry signals: nav=6, btn=1, form=0, placeholder=0, footer=4

## Pending Pages
- pay / (1 issues)
- pay /internal/payment-email/send (1 issues)
- pay /payment-block (1 issues)
- dash /actions (1 issues)
- dash /audit (1 issues)
- dash /dashboard (1 issues)
- dash /flows (1 issues)
- dash /login (1 issues)
- dash /logout (1 issues)
- dash /runtime (1 issues)
- dash /runtime/executions (1 issues)

## Final Confirmation
- Du chuan tieng Viet: YES
- Du chuan tieng Anh: YES
- Du chuan SEO: YES
- Du chuan live: NO

