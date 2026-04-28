# IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026

# IAI Bilingual SEO and Localization Standard
## Version 1.0
## Status: LOCKED FOR ALL TEAMS (1/2/3/4/5)
## Scope: *.iai.one
## Date: 2026-04-14

---

## 1. Mục tiêu

Khóa chuẩn ngôn ngữ và SEO cho toàn hệ `*.iai.one` để:
- tiếng Việt luôn chuẩn có dấu
- tiếng Anh luôn chuẩn cho các bề mặt SEO quốc tế
- mọi domain cùng một logic locale, canonical, hreflang
- có thể mở rộng thêm ngôn ngữ mà không phá IA, SEO, hoặc brand trust

Đây là file chuẩn thực thi bắt buộc.  
Không team nào được tự diễn giải khác chuẩn này.

---

## 2. Nguyên tắc nền

1. Một hệ, nhiều ngôn ngữ, một truth.
2. Ngôn ngữ hiển thị phải đúng đối tượng tìm kiếm.
3. Tiếng Việt public phải có dấu đầy đủ, không dùng dạng bỏ dấu để thay thế nội dung chính.
4. SEO quốc tế ưu tiên tiếng Anh chuẩn, rõ nghĩa, không dịch máy thô.
5. Mọi locale phải có đường canonical/hreflang nhất quán.
6. Mở rộng ngôn ngữ mới phải dựa trên cùng contract.

---

## 3. Chính sách ngôn ngữ theo bề mặt

### 3.1. English-first surfaces (SEO quốc tế)
- Các trang định hướng quốc tế dùng tiếng Anh làm nội dung chính.
- Vẫn phải có đường song ngữ nếu page thuộc nhóm cần local cho Việt Nam.

### 3.2. Vietnamese surfaces
- Bản tiếng Việt bắt buộc dùng tiếng Việt có dấu chuẩn.
- Không xuất bản bản tiếng Việt dạng không dấu cho nội dung chính.
- Từ vựng kỹ thuật phải theo glossary lock để không loạn thuật ngữ.

### 3.3. Song ngữ bắt buộc cho các route thương mại và điều hướng
- catalog
- product pages
- license pages
- checkout success / buyer library
- onboarding portals

---

## 4. URL và locale architecture

## 4.1. Locale pattern
- `en` và `vi` là hai locale chuẩn giai đoạn hiện tại.
- Chuẩn route:
  - `/products` (default locale)
  - `/vi/products` (Vietnamese locale)
- Khi thêm locale mới: `/ja/...`, `/fr/...`, ...

## 4.2. Slug policy
- Slug giữ ổn định, ưu tiên ASCII để tránh drift kỹ thuật.
- Nội dung hiển thị (title/H1/body) mới là phần bản địa hóa.
- Không đổi slug tùy tiện theo mỗi locale nếu chưa có migration plan.

## 4.3. Locale fallback
- `requested locale` -> `domain-supported locale` -> `default locale` (`en`).
- Không trả về trang trắng hoặc 404 chỉ vì locale không tồn tại.

---

## 5. SEO technical contract (bắt buộc)

Mỗi trang public indexable phải có:
- `lang` attribute đúng locale
- `title` theo locale
- `meta description` theo locale
- `canonical` đúng locale URL
- `hreflang` đầy đủ cho `en`, `vi`, và `x-default`
- Open Graph title/description/locale theo locale hiện tại

Không được:
- canonical chéo sai locale
- thiếu hreflang cặp tương ứng
- để tiếng Việt không dấu trên trang index chính thức
- trộn ngôn ngữ trong cùng một hero/title gây mơ hồ SEO

---

## 6. Content quality contract

## 6.1. Tiếng Việt
- Dùng dấu chuẩn cho toàn bộ copy public.
- Cấm xuất bản nội dung chính kiểu không dấu.
- Cấm dùng tiếng Việt pha trộn tiếng Anh không cần thiết ở tiêu đề chính.

## 6.2. Tiếng Anh
- Ưu tiên rõ ràng, chính xác, không cường điệu marketing rẻ.
- Giữ nhất quán thuật ngữ hệ thống theo glossary lock.

## 6.3. Glossary lock
- Team 1 giữ glossary chuẩn cho các thuật ngữ trục:
  - trust
  - governance
  - entitlement
  - sovereignty
  - control plane
  - orchestration
- Team 3/4/5 không tự ý đổi nghĩa thuật ngữ đã khóa.

---

## 7. API/data contract cho localization (Team 2 bắt buộc)

Các contract public-facing nên hỗ trợ:
- `locale`
- `default_locale`
- `supported_locales`
- `fallback_locale`

Các API render/content không được:
- hardcode locale trong business logic
- trả dữ liệu mâu thuẫn giữa locale và canonical URL

---

## 8. Team responsibilities

### Team 1 (Program Root)
- sở hữu language governance
- duyệt glossary lock
- duyệt SEO/canonical/hreflang policy
- chốt release gate pass/fail cho language compliance

### Team 2 (Runtime/API)
- giữ locale fields trong contracts
- đảm bảo fallback logic ổn định
- không tạo drift locale giữa API và UI

### Team 3 (NOOS Surface)
- triển khai route song ngữ đúng chuẩn
- đảm bảo Vietnamese copy có dấu trên toàn bộ bề mặt public
- triển khai canonical/hreflang/meta đúng mỗi locale

### Team 4 (Growth/Ops)
- campaign copy theo đúng locale
- không dùng bản không dấu để chạy public SEO
- tracking KPI theo locale để tối ưu đúng thị trường

### Team 5 (web.iai.one)
- xây sản phẩm mới theo cùng contract locale từ ngày đầu
- không tạo hệ i18n riêng lệch khỏi chuẩn toàn hệ

---

## 9. Release gates mới (áp dụng cho mọi team)

Một release public chỉ pass khi:
1. Có cặp EN/VI đúng cho các route bắt buộc.
2. Vietnamese copy public có dấu đầy đủ.
3. Canonical + hreflang + x-default đúng.
4. Metadata (title/description/OG) đúng locale.
5. Không có route indexable rơi về nội dung sai ngôn ngữ.

Thiếu một mục là FAIL gate.

---

## 10. Kế hoạch thực thi nhanh

### P0 (ngay lập tức)
- Team 1 phát hành directive này vào toàn bộ team plans.
- Team 3 và Team 5 áp chuẩn locale route + canonical/hreflang trên bề mặt đang dev.
- Team 2 xác nhận locale/fallback fields trong contract chính.

### P1
- thêm QA checklist song ngữ vào release checklist mỗi team
- thêm test integration cho route locale, canonical, hreflang, metadata

### P2
- mở rộng locale thứ ba theo cùng contract mà không phá slug/canonical

---

## 11. Definition of done

Chuẩn này được xem là triển khai xong khi:
- mọi domain public trong scope có chuẩn EN/VI nhất quán
- tiếng Việt public luôn có dấu
- SEO quốc tế không bị trộn ngôn ngữ sai mục tiêu
- release gates có kiểm tra locale/canonical/hreflang bắt buộc
- hệ có thể thêm locale mới mà không phải tái cấu trúc lại từ đầu

---

## 12. Directive cuối

`*.iai.one` không được phép có “mỗi team một kiểu ngôn ngữ”.

Từ thời điểm file này hiệu lực:
- English-first cho SEO quốc tế
- Vietnamese chuẩn có dấu cho bề mặt tiếng Việt
- một contract localization cho toàn hệ
- một release gate chung cho mọi team

