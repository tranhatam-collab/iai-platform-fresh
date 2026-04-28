# TEAM1_BILINGUAL_CONTENT_SOURCE_AUDIT_2026-04-21
## Status: ACTIVE
## Scope: Shared content-source compliance check for shell and lane surfaces
## Date: 2026-04-21

---

## 1. Purpose

Ghi lại trạng thái hiện tại của việc dùng shared bilingual content source theo directive:

- `docs/IAI_UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_COMMAND_2026.md`
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`

Mục tiêu của audit này là xác nhận:

- lane nào đã đọc `content/en.json` và `content/vi.json`
- lane nào còn giữ inline bilingual copy trong render
- lane nào cần ưu tiên làm sạch tiếp theo

---

## 2. Current result snapshot

### 2.1 Shared content-source loader presence

Các shell/lane sau đang load shared content JSON trong `src/i18n.ts`:

- `root`
- `home`
- `docs`
- `app`
- `flow`
- `dash`
- `web`
- `developer`
- `pay`
- `nft`

Kết quả kiểm tra ngày `2026-04-21`:

| App | `content/en.json` | `content/vi.json` | Note |
| --- | --- | --- | --- |
| `root` | present | present | shared shell |
| `home` | present | present | shared shell |
| `docs` | present | present | shared shell |
| `app` | present | present | shared shell |
| `flow` | present | present | shared shell |
| `dash` | present | present | shared shell nhưng còn inline bilingual copy lớn |
| `web` | present | present | shared shell |
| `developer` | present | present | đã kéo về shared content source trong batch này |
| `pay` | present | present | shared shell |
| `nft` | present | present | shared shell |

### 2.2 Exceptions

`noos-web` không xuất hiện trong kiểm tra loader shared theo cùng mẫu `loadDictionary("../../../content/...")`.

Điều này không tự động là lỗi.
`noos-web` đang đi theo contract locale riêng và cần được review theo lane commerce/public locale rules riêng của nó.

---

## 3. Inline bilingual render audit

Kiểm tra số lần gọi inline bilingual helper `copy(locale, ...)` trong `src/render.ts`:

| App | Inline bilingual copy count | Assessment |
| --- | --- | --- |
| `root` | `0` | clean |
| `home` | `0` | clean |
| `docs` | `0` | clean |
| `app` | `0` | clean |
| `flow` | `0` | clean |
| `dash` | `176` | high-priority cleanup target |
| `web` | `0` | clean |
| `developer` | `0` | clean after migration |
| `pay` | `0` | clean |
| `nft` | `0` | clean |
| `noos-web` | `0` | separate locale architecture, review independently |

---

## 4. Batch completed in this checkpoint

### 4.1 `developer.iai.one`

`developer.iai.one` đã được nâng từ trạng thái:

- copy tiếng Việt không dấu
- dictionary cục bộ trong app
- route copy hard-code trong render

thành trạng thái:

- tiếng Việt có dấu đầy đủ
- public copy đi qua `content/vi.json` và `content/en.json`
- `apps/developer/src/render.ts` chỉ còn render logic + route mapping
- `pnpm --filter @iai/developer build:pages` PASS
- `pnpm test:developer` PASS

Điều này làm `developer` trở thành lane đầu tiên được áp command mới tới đúng tầng content-source, không chỉ ở tầng wording.

---

## 5. Next priority

Lane cần xử lý tiếp theo nên là:

### `dash.iai.one`

Lý do:

- vẫn còn `176` inline bilingual copy call trong `apps/dash/src/render.ts`
- điều này giữ public/runtime-facing text ở render layer thay vì content source chuẩn
- nếu không gom về shared content pack, nguy cơ drift EN/VI, drift tone, và drift release copy là rất cao

---

## 6. Recommended next batch

Batch kế tiếp nên làm theo thứ tự:

1. Audit nhóm key inline đang dùng trong `apps/dash/src/render.ts`
2. Chuyển toàn bộ text public của `dash` về `content/en.json` và `content/vi.json`
3. Giữ `apps/dash/src/render.ts` chỉ còn render logic
4. Re-run `pnpm test` phù hợp cho `dash`
5. Chụp lại audit count để xác nhận inline bilingual copy về `0`

---

## 7. Final note

Audit này không tuyên bố toàn hệ đã hoàn tất command bilingual rebuild.

Nó chỉ xác nhận:

- command đã được thêm vào repo
- lane `developer` đã được áp dụng thật
- `dash` là target tiếp theo rõ ràng nhất theo bằng chứng mã nguồn hiện tại

