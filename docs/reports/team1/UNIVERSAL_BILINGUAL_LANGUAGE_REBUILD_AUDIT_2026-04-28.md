# UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT_2026-04-28
- Generated at: 2026-04-28T12:17:45.365Z
- Timezone: Asia/Ho_Chi_Minh
- Total URLs audited: 72
- Total pages flagged: 1
- Vietnamese issues open: 1
- English issues open: 1
- Metadata issues open: 5
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
- UI registry signals: nav=20, btn=10, form=0, placeholder=0, footer=12
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
- Localized URL count: 4
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=5, btn=4, form=0, placeholder=0, footer=4
- Route: / | VI https://flow.iai.one/ | EN https://flow.iai.one/?lang=en
- Route: /sitemap.xml | VI https://flow.iai.one/sitemap.xml | EN https://flow.iai.one/sitemap.xml?lang=en

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
- Localized URL count: 18
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
- Route: /sitemap.xml | VI https://developer.iai.one/sitemap.xml | EN https://developer.iai.one/sitemap.xml?lang=en
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
- Localized URL count: 14
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=1, localized=1
- UI registry signals: nav=8, btn=7, form=0, placeholder=0, footer=10
- Route: / | VI https://pay.iai.one/ | EN https://pay.iai.one/?lang=en
- Route: /internal/payment-email/send | VI https://pay.iai.one/internal/payment-email/send | EN https://pay.iai.one/internal/payment-email/send?lang=en
- Route: /internal/payment-event/callback | VI https://pay.iai.one/internal/payment-event/callback | EN https://pay.iai.one/internal/payment-event/callback?lang=en
- Route: /internal/payment-event/evidence | VI https://pay.iai.one/internal/payment-event/evidence | EN https://pay.iai.one/internal/payment-event/evidence?lang=en
- Route: /internal/payment-event/proof | VI https://pay.iai.one/internal/payment-event/proof | EN https://pay.iai.one/internal/payment-event/proof?lang=en
- Route: /internal/payment-webhook/dispatch | VI https://pay.iai.one/internal/payment-webhook/dispatch | EN https://pay.iai.one/internal/payment-webhook/dispatch?lang=en
- Route: /payment-block | VI https://pay.iai.one/payment-block | EN https://pay.iai.one/payment-block?lang=en

### dash
- Base URL: https://dash.iai.one
- Localized URL count: 16
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=1, btn=1, form=0, placeholder=0, footer=2
- Route: /actions | VI https://dash.iai.one/actions | EN https://dash.iai.one/actions?lang=en
- Route: /audit | VI https://dash.iai.one/audit | EN https://dash.iai.one/audit?lang=en
- Route: /dashboard | VI https://dash.iai.one/dashboard | EN https://dash.iai.one/dashboard?lang=en
- Route: /flows | VI https://dash.iai.one/flows | EN https://dash.iai.one/flows?lang=en
- Route: /login | VI https://dash.iai.one/login | EN https://dash.iai.one/login?lang=en
- Route: /logout | VI https://dash.iai.one/logout | EN https://dash.iai.one/logout?lang=en
- Route: /runtime | VI https://dash.iai.one/runtime | EN https://dash.iai.one/runtime?lang=en
- Route: /runtime/executions | VI https://dash.iai.one/runtime/executions | EN https://dash.iai.one/runtime/executions?lang=en

### web
- Base URL: https://web.iai.one
- Localized URL count: 8
- Issues: 0
- Content source: en=PASS, vi=PASS, seo=PASS
- Metadata head: PASS
- Alt stats: total=0, localized=0
- UI registry signals: nav=1, btn=1, form=0, placeholder=0, footer=13
- Route: / | VI https://web.iai.one/ | EN https://web.iai.one/?lang=en
- Route: /contract-status | VI https://web.iai.one/contract-status | EN https://web.iai.one/contract-status?lang=en
- Route: /onboarding | VI https://web.iai.one/onboarding | EN https://web.iai.one/onboarding?lang=en
- Route: /shared-auth | VI https://web.iai.one/shared-auth | EN https://web.iai.one/shared-auth?lang=en

### noos-web
- Base URL: https://noos.iai.one
- Localized URL count: 0
- Issues: 7
- Content source: en=FAIL, vi=FAIL, seo=FAIL
- Metadata head: FAIL (hasJsonLd, hasOgImage, hasTwitterImage)
- Alt stats: total=2, localized=2
- UI registry signals: nav=0, btn=0, form=0, placeholder=0, footer=0
- Hard-coded candidate (html-node): NOOS
- Hard-coded candidate (quoted-copy): A launch wave cannot widen if buyers are falling out before payment completes.
- Hard-coded candidate (quoted-copy): A newer version is available while the entitlement is still inside the update window, so the buyer can claim selected updates now.
- Hard-coded candidate (quoted-copy): A spike here freezes campaign expansion until the cause is understood.
- Hard-coded candidate (quoted-copy): Account view giữ buyer, route và support truth thẳng hàng.
- Hard-coded candidate (quoted-copy): Account view keeps buyer, route, and support truth aligned.
- Hard-coded candidate (quoted-copy): Any mismatch between page, checkout, and buyer state is a same-day escalation.
- Hard-coded candidate (quoted-copy): ASSET_PROXY_SCOPE_INVALID hoặc ASSET_POLICY_DENIED xuất hiện tại access-check.
- Hard-coded candidate (quoted-copy): ASSET_PROXY_SCOPE_INVALID or ASSET_POLICY_DENIED appears on access-check.
- Hard-coded candidate (quoted-copy): Bảo vệ niềm tin sau thanh toán, nhất là khi Wave 1 còn đang dưới launch gate.
- Issue: Thiếu dòng SEO registry cho surface noos-web.
- Issue: Không đọc content/vi.json từ lớp i18n.
- Issue: Không đọc content/en.json từ lớp i18n.
- Issue: Không đọc content/seo-registry.csv từ lớp i18n.
- Issue: Thiếu metadata head: hasJsonLd, hasOgImage, hasTwitterImage.
- Issue: Còn candidate hard-coded public text trong render source.
- Issue: UI copy chưa đi qua đầy đủ key hệ thống cho nav/button/footer.

## Pending Pages
- noos-web (surface-root) (7 issues)

## Final Confirmation
- Du chuan tieng Viet: NO
- Du chuan tieng Anh: NO
- Du chuan SEO: NO
- Du chuan live: NO

