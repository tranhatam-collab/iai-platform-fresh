# TEAM1_UNIVERSAL_BILINGUAL_REBUILD_EXECUTION_DIRECTIVE_2026-04-22
## Status: ACTIVE EXECUTION LOCK
## Scope: `dash.iai.one`, `noos.iai.one`, `life.iai.one`
## Date: 2026-04-22

---

## 0. Purpose

File này biến universal bilingual rebuild từ policy thành execution plan có owner, evidence, và thời gian hoàn tất ước lượng.

Mục tiêu của vòng này không phải lặp lại command.
Mục tiêu là khóa:

- lane nào phải làm gì tiếp theo
- ai chịu trách nhiệm chính
- bằng chứng nào mới đủ để đóng lane
- mốc thời gian nào là hợp lý theo evidence hiện tại

---

## 1. Governing files

- `docs/IAI_UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_COMMAND_2026.md`
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`
- `docs/reports/team1/TEAM1_UNIVERSAL_BILINGUAL_REBUILD_STATUS_BOARD_2026-04-22.md`
- `docs/reports/team1/TEAM1_BILINGUAL_CONTENT_SOURCE_AUDIT_2026-04-21.md`
- `life.iai.one/reports/team1/UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT_2026-04-21.md`
- `docs/noos/34_NOOS_BILINGUAL_SEO_AND_LOCALE_EXECUTION_LOCK_2026.md`
- `docs/reports/team3/TEAM3_NOOS_METADATA_PROOF_2026-04-17.md`

---

## 2. Hard truth as of 2026-04-22

1. Team 1 language checker đang `PASS`, nhưng đó chỉ là pass ở scope Team 1 docs/governance.
2. `developer.iai.one` đã là lane mẫu áp chuẩn thật tới tầng content source.
3. `dash.iai.one` chưa được xem là hoàn tất vì còn `176` inline bilingual copy calls trong render.
4. `noos.iai.one` không fail theo metadata/locale proof hiện tại, nhưng vẫn là exception architecture và cần review closure riêng để được gộp vào whole-system closure.
5. `life.iai.one` đang là blocker lớn nhất của whole-system closure vì site-wide audit vẫn `BLOCKED`.

---

## 3. Work package A — `dash.iai.one`

### 3.1 Current truth

- Shared content source đã hiện diện.
- Inline bilingual render audit còn `176` calls trong `apps/dash/src/render.ts`.
- Vì vậy lane này vẫn là `PARTIAL_CLEANUP_REQUIRED`.

### 3.2 Owner

- Primary owner: Team 2
- Review owner: Team 1

### 3.3 Required outputs

1. Audit nhóm key inline đang dùng trong `apps/dash/src/render.ts`
2. Chuyển toàn bộ public copy còn lại về `content/en.json` và `content/vi.json`
3. Giữ `render.ts` chỉ còn render logic + key wiring
4. Re-run test phù hợp cho `dash`
5. Re-run bilingual content-source audit và kéo inline count về `0`

### 3.4 Acceptance criteria

- inline bilingual copy count = `0`
- public strings không còn hard-code ở render layer
- EN/VI cùng đi qua shared content source
- không tạo drift metadata/copy so với current release truth

### 3.5 Time estimate

- Build + migration: `6-10` giờ tập trung
- QA + audit rerun: `2-4` giờ
- Total realistic window: `1` ngày làm việc

### 3.6 Target date

- Target technical closure: `2026-04-23`
- Nếu còn phát sinh drift key/content structure: trễ nhất `2026-04-24`

---

## 4. Work package B — `noos.iai.one`

### 4.1 Current truth

- Route-level metadata proof đang `PASS`
- Locale-prefixed canonical behavior đã có proof
- EN/VI metadata behavior đã có proof
- Lane này vẫn chưa được gộp pass toàn hệ vì đi theo locale architecture riêng

### 4.2 Owner

- Primary owner: Team 3
- Secondary owner: Team 4
- Review owner: Team 1

### 4.3 Required outputs

1. Chốt một review note closure nói rõ NOOS là exception architecture hợp lệ, không phải missing implementation
2. Xác nhận lại 4 lớp:
   - route locale
   - canonical/hreflang
   - language switcher
   - locale-safe metadata/indexing behavior
3. Xác nhận không có mixed-language public render regression sau proof hiện tại
4. Gắn NOOS vào board toàn hệ với trạng thái đã close exception review

### 4.4 Acceptance criteria

- Team 1 ký review closure cho exception architecture
- không còn ambiguity giữa `shared-shell audit` và `NOOS locale architecture`
- evidence current vẫn xanh:
  - `pnpm test:noos-web`
  - `pnpm test:noos-commerce-contracts`
  - metadata proof packet

### 4.5 Time estimate

- Review + closure packet: `3-5` giờ
- Nếu cần rerun proof nhẹ: thêm `2-3` giờ
- Total realistic window: `0.5-1` ngày làm việc

### 4.6 Target date

- Target closure: `2026-04-23`

---

## 5. Work package C — `life.iai.one`

### 5.1 Current truth

Site-wide audit hiện ghi nhận:

- `41` page cần rebuild song ngữ
- `133` English errors đang mở
- `1` metadata/SEO issue đang mở
- `991` candidate hard-coded public strings ngoài content source
- global blockers:
  - `single-locale-render-shell`
  - English locale chưa `public_ready`
  - public strings còn nằm ngoài content source

### 5.2 Owner

- Primary owner: life lane owners
- Governance/review owner: Team 1
- Content/editorial support: content/editor lane của dự án `life.iai.one`
- QA/SEO support: QA + SEO owners của `life.iai.one`

### 5.3 Required outputs

#### Phase 0 — Freeze and inventory

1. Khóa lại route inventory public cần rebuild
2. Chia nhóm:
   - core pages
   - pillar pages
   - article pages
   - trust/legal pages
3. Khóa source-of-truth cho content source, locale registry, và SEO registry

#### Phase 1 — Source-of-truth rebuild

1. Đẩy public text về content source chuẩn
2. Gỡ pattern `single-locale-render-shell`
3. Bật English locale đúng `public_ready` chỉ khi đủ điều kiện thật

#### Phase 2 — Content rewrite

1. Viết lại tiếng Việt nếu còn lệch codex
2. Viết lại tiếng Anh theo chuẩn American English, không dịch máy
3. Tách metadata/alt/schema copy theo locale

#### Phase 3 — QA and SEO verification

1. AI pass
2. human/editor pass
3. SEO pass
4. QA pass
5. rerun site-wide audit

### 5.4 Acceptance criteria

- audit site-wide không còn `BLOCKED`
- English public render không còn trùng tiếng Việt ở các page P0
- content source trở thành nguồn chữ public chính
- locale registry phản ánh đúng readiness
- founder có thể spot-check ngẫu nhiên mà không còn mixed-language hoặc machine-translated English

### 5.5 Time estimate

- Phase 0: `0.5` ngày
- Phase 1: `1-2` ngày
- Phase 2: `2-3` ngày
- Phase 3: `1-2` ngày

### 5.6 Target date

- Earliest possible closure nếu chạy tập trung song song: `2026-04-29`
- Realistic closure window: `2026-04-30` đến `2026-05-01`

### 5.7 Why this lane is longer

`life.iai.one` không còn là cleanup nhỏ.

Đây là site-wide rebuild thực sự với:

- nhiều route public
- nhiều text candidates ngoài content source
- English quality gap lớn
- requirement bắt buộc phải qua đủ 4 pass trước khi được bỏ chặn live

---

## 6. Whole-system estimated completion time

Whole-system universal bilingual rebuild chỉ được xem là close khi:

1. `dash.iai.one` hoàn tất cleanup về shared content source
2. `noos.iai.one` có review closure cho exception architecture
3. `life.iai.one` đóng được site-wide blocked audit

### Current outlook

- `dash.iai.one`: `2026-04-23` realistic
- `noos.iai.one`: `2026-04-23` realistic
- `life.iai.one`: earliest `2026-04-29`, realistic `2026-04-30` đến `2026-05-01`

### Canonical estimate

Nếu không mở scope mới và các owner chạy liên tục, whole-system universal bilingual rebuild có thể đóng sớm nhất vào:

- `2026-04-29` (best case)

Mốc thực tế an toàn hơn là:

- `2026-04-30` đến `2026-05-01`

---

## 7. Immediate next actions by team

### Team 2

- mở batch `dash` cleanup ngay
- không claim xong khi inline count chưa về `0`

### Team 3 + Team 4

- nộp exception-architecture closure note cho NOOS
- giữ proof hiện tại xanh và không fork locale contract

### life lane owners

- mở site-wide rebuild batch theo 4 phase ở trên
- không gọi đây là “chỉnh copy”
- coi đây là rebuild production content/SEO system

### Team 1

- review và ký closure theo từng lane
- không dùng `TEAM1_LANGUAGE_COMPLIANCE_STATUS` để thay cho lane-specific closure

---

## 8. Final direction

Đến ngày `2026-04-22`, blocker lớn nhất của whole-system bilingual closure không còn là việc thiếu policy.

Blocker là execution gap giữa:

- lane đã áp thật
- lane cleanup kỹ thuật chưa xong
- lane architecture ngoại lệ chưa được review closure
- lane site-wide rebuild còn quá lớn

Mốc cần nhớ:

- `dash` và `noos` có thể đóng rất nhanh nếu owner tập trung
- `life` là lane quyết định ngày đóng toàn hệ
