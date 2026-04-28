# 34_NOOS_BILINGUAL_SEO_AND_LOCALE_EXECUTION_LOCK_2026

# NOOS Bilingual SEO and Locale Execution Lock
## Version 1.0
## Status: LOCKED FOR ALL NOOS TEAMS
## Domain: NOOS.iai.one
## Date: 2026-04-14

---

## 1. Mục tiêu

NOOS phải hỗ trợ song ngữ ngay từ đầu theo chuẩn:
- tiếng Anh là ngôn ngữ hiển thị mặc định cho public international surface
- tiếng Việt là locale hạng nhất, dùng tiếng Việt chuẩn có dấu
- kiến trúc locale phải mở rộng được cho các ngôn ngữ khác sau này mà không phá route, SEO, hay contract

NOOS không dùng kiểu "một trang trộn hai ngôn ngữ".
Mỗi locale là một surface hoàn chỉnh, có metadata, canonical và hreflang riêng.

---

## 2. Quy tắc cứng

### 2.1 English-first
- locale mặc định cho public NOOS là `en`
- canonical public mặc định đi về route tiếng Anh
- các trang SEO quốc tế phải được viết và tối ưu bằng tiếng Anh trước

### 2.2 Vietnamese is first-class
- tiếng Việt không phải bản phụ hay bản dịch tạm
- route tiếng Việt phải có nội dung tiếng Việt chuẩn có dấu
- `html lang`, title, description, OG, CTA, library states, support copy phải đồng bộ theo locale

### 2.3 Locale architecture
- dùng locale prefix trong URL:
  - `/en/...`
  - `/vi/...`
  - tương lai: `/ja/...`, `/fr/...`, `/de/...`
- không dùng query param kiểu `?lang=vi` làm kiến trúc chính
- không nhét cả tiếng Anh và tiếng Việt lên cùng một URL public để "tiện"

### 2.4 Stable slugs
- slug URL giữ dạng ASCII ổn định để dễ chia sẻ và không tạo drift route
- nội dung hiển thị bên trong trang mới dùng tiếng Việt có dấu
- không dịch slug tùy hứng giữa các locale khi chưa có lock riêng

### 2.5 SEO lock
- mỗi locale có canonical tự trỏ về đúng locale của nó
- mỗi page public phải có `hreflang` cho các locale đang tồn tại
- `x-default` trỏ về tiếng Anh
- sitemap chỉ chứa route hợp lệ của NOOS theo từng locale
- route legacy investor/fundraising tiếp tục bị redirect + `noindex,nofollow` và không vào sitemap

---

## 3. Route policy

### 3.1 Public NOOS routes
- `/en/products`
- `/en/documents`
- `/en/programs`
- `/en/licenses`
- `/en/operations`
- `/en/organization-inquiry`
- `/en/product/[slug]`

- `/vi/products`
- `/vi/documents`
- `/vi/programs`
- `/vi/licenses`
- `/vi/operations`
- `/vi/organization-inquiry`
- `/vi/product/[slug]`

### 3.2 Buyer/library routes
- `/en/library`
- `/en/library/product/[slug]`
- `/en/library/updates`
- `/en/library/licenses`
- `/en/library/account`
- `/en/checkout`
- `/en/checkout-success`

- `/vi/library`
- `/vi/library/product/[slug]`
- `/vi/library/updates`
- `/vi/library/licenses`
- `/vi/library/account`
- `/vi/checkout`
- `/vi/checkout-success`

### 3.3 Root behavior
- public users có thể đi vào route không prefix trong giai đoạn chuyển tiếp
- nhưng canonical phải đi về `/en/...`
- mọi link nội bộ public phải đẩy người dùng sang route có locale prefix

---

## 4. Content policy

### 4.1 English pages
- ưu tiên cho international SEO
- văn phong authority, structured, non-marketing
- không nhét câu tiếng Việt vào giữa page tiếng Anh

### 4.2 Vietnamese pages
- dùng tiếng Việt chuẩn có dấu
- không dùng bản dịch thô, không nửa Anh nửa Việt
- CTA, legal copy, support states, library states phải được Việt hóa có kiểm soát

### 4.3 Product truth
- product code, price, tier, license model, entitlement logic không đổi theo locale
- chỉ thay đổi lớp ngôn ngữ hiển thị
- không được tạo "product mới theo ngôn ngữ"

---

## 5. Metadata and indexing

Mỗi page public phải có:
- `title`
- `meta description`
- `canonical`
- `hreflang`
- `og:title`
- `og:description`
- `og:locale`

Buyer-private surfaces:
- vẫn locale-aware
- nhưng tiếp tục `noindex` theo policy hiện hành nếu là private/account-like path

---

## 6. Technical requirements

### 6.1 Encoding
- tất cả page và data feed phải dùng UTF-8
- tiếng Việt có dấu phải render đúng trên HTML, JSON, feed, email, log-safe payload

### 6.2 Locale switching
- luôn có language switcher rõ ràng bằng link
- English hiển thị trước
- Vietnamese là lựa chọn trực tiếp
- các locale mới sau này phải cắm theo cùng một registry, không hardcode rải rác

### 6.3 Contracts
- Team 2 phải giữ locale đi cùng checkout/session/order nếu surface cần trả buyer về đúng ngôn ngữ
- Team 3 phải render route + metadata + switcher + canonical + hreflang đúng lock này
- Team 4 phải tách SEO/reporting/funnel theo locale, không trộn số liệu một cách mù

---

## 7. Team responsibilities

### Team 1
- giữ locale registry và SEO rules ở mức lock
- chặn drift giữa route, metadata, và mission map

### Team 2
- locale-aware checkout redirect
- locale-safe webhook/order handoff
- locale-safe receipt, success, entitlement, library return path

### Team 3
- build toàn bộ route `/en/...` và `/vi/...`
- render đúng tiếng Việt có dấu trên locale `vi`
- giữ English-first internal linking và language switcher
- khóa canonical/hreflang/sitemap/robots theo locale

### Team 4
- international campaigns đi vào English pages
- Vietnam/local campaigns đi vào Vietnamese pages
- không chạy mixed-language landing/public pages
- báo cáo KPI tách theo locale nếu có khác biệt về funnel

---

## 8. Go / No-Go checklist

- English có phải locale public mặc định không?
- Vietnamese có route riêng và tiếng Việt có dấu đầy đủ không?
- page public có canonical đúng locale không?
- hreflang đủ cho `en` và `vi` chưa?
- `x-default` có trỏ về English chưa?
- sitemap có route locale hợp lệ và không chứa legacy investor/fundraising không?
- language switcher có dùng link thật không?
- product/price/license truth có giữ nguyên giữa các locale không?

---

## 9. Definition of done

Xem như đạt chuẩn khi:
- NOOS public surface chạy English-first rõ ràng
- Vietnamese surface đầy đủ, có dấu, không bị xem như bản phụ
- route architecture mở rộng được cho nhiều locale khác
- SEO signals (`canonical`, `hreflang`, sitemap, robots) không drift
- Team 2/3/4 cùng dùng một policy locale duy nhất

---

## 10. Câu chốt cho toàn team

NOOS không làm song ngữ kiểu chắp vá.
NOOS làm locale như một phần của kiến trúc sản phẩm, SEO và trust ngay từ đầu.
