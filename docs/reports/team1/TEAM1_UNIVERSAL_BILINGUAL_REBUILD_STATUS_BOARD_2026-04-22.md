# TEAM1_UNIVERSAL_BILINGUAL_REBUILD_STATUS_BOARD_2026-04-22
## Status: ACTIVE
## Scope: Whole-system universal bilingual rebuild truth for active `*.iai.one` website surfaces
## Date: 2026-04-22
## Source command: `docs/IAI_UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_COMMAND_2026.md`

---

## 0. Core clarification

`docs/reports/team1/TEAM1_LANGUAGE_COMPLIANCE_STATUS_2026-04-22.md` đang `PASS`.

Điều đó chỉ xác nhận:

- Team 1 scope docs/reports đang sạch ngôn ngữ theo checker hiện tại
- multilingual readiness files bắt buộc đã hiện diện

Điều đó không xác nhận:

- mọi website public đã hoàn tất universal bilingual rebuild
- mọi lane đã qua content-source migration thật
- mọi page đã đạt chuẩn SEO song ngữ production
- mọi kiến trúc locale ngoại lệ đã được review closure

Vì vậy canonical kết luận của toàn hệ cho command này hiện là:

- `ACTIVE`
- `NOT_GLOBALLY_CLOSED`

---

## 1. Status vocabulary used in this board

- `TEAM1_SCOPE_PASS_ONLY`
  - pass ở lớp Team 1 docs/governance scope, không phải website-wide closure
- `APPLIED_TRUE`
  - lane đã áp command tới đúng tầng content source và render clean trong evidence hiện tại
- `CONTENT_SOURCE_CLEAN_MONITOR`
  - audit hiện tại cho thấy shared content source sạch ở lớp shell/render, nhưng board này không tự nâng thành full site-wide rebuild closure
- `PARTIAL_CLEANUP_REQUIRED`
  - có shared content source nhưng còn public copy nằm trong render/runtime layer
- `BLOCKED_NO_LIVE`
  - audit chỉ ra lỗi song ngữ/SEO/public text ở mức chưa được phép live
- `EXCEPTION_ARCHITECTURE_REVIEW_REQUIRED`
  - lane dùng contract locale riêng, phải review closure theo kiến trúc riêng thay vì được gộp pass tự động

---

## 2. Current whole-system board

| Surface / lane | Owner | Current status | Why this is the status now | Evidence | Next action | Next owner |
| --- | --- | --- | --- | --- | --- | --- |
| `Team 1 language-compliance checker scope` | Team 1 | `TEAM1_SCOPE_PASS_ONLY` | Checker hiện tại chỉ kiểm tra Team 1 docs/reports scope và readiness files, không crawl toàn bộ website surfaces. | `docs/reports/team1/TEAM1_LANGUAGE_COMPLIANCE_STATUS_2026-04-22.md` | giữ pass này ở đúng nghĩa hẹp; không dùng nó để claim whole-system bilingual closure | Team 1 |
| `developer.iai.one` | Team A + Team 1 | `APPLIED_TRUE` | Đã kéo public copy về `content/en.json` và `content/vi.json`, render clean, và được audit xác nhận là lane đầu tiên áp command thật tới tầng content source. | `docs/reports/team1/TEAM1_BILINGUAL_CONTENT_SOURCE_AUDIT_2026-04-21.md` | giữ monitor, không để public copy quay lại render layer | Team A |
| `shared shell group: root / home / docs / app / flow / web / pay / nft` | Team 1 + lane owners | `CONTENT_SOURCE_CLEAN_MONITOR` | Audit hiện tại cho thấy loader shared content có mặt và inline bilingual copy count đang là `0` ở lớp shell/render theo check này. Board này không tự tuyên bố từng site đã qua full route-level universal rebuild audit. | `docs/reports/team1/TEAM1_BILINGUAL_CONTENT_SOURCE_AUDIT_2026-04-21.md` | giữ content source sạch, không hard-code public text trở lại, chỉ claim full closure khi có site-level audit nếu cần | Team 1 + lane owners |
| `dash.iai.one` | Team 2 + Team 1 | `PARTIAL_CLEANUP_REQUIRED` | Có shared content source nhưng còn `176` inline bilingual copy calls trong `apps/dash/src/render.ts`, nên public/runtime-facing text vẫn chưa sạch khỏi render layer. | `docs/reports/team1/TEAM1_BILINGUAL_CONTENT_SOURCE_AUDIT_2026-04-21.md` | chuyển toàn bộ text public còn lại của `dash` về `content/en.json` và `content/vi.json`, rồi re-run audit count về `0` | Team 2 |
| `noos-web / noos.iai.one public locale lane` | Team 3 + Team 4 + Team 1 | `EXCEPTION_ARCHITECTURE_REVIEW_REQUIRED` | `noos-web` không đi theo cùng loader shared content pattern trong audit này; đây không tự động là lỗi nhưng cũng chưa được phép gộp pass tự động với shared-shell group. | `docs/reports/team1/TEAM1_BILINGUAL_CONTENT_SOURCE_AUDIT_2026-04-21.md`, `docs/noos/34_NOOS_BILINGUAL_SEO_AND_LOCALE_EXECUTION_LOCK_2026.md` | chạy review closure riêng cho locale architecture của NOOS và khóa rõ equivalent proof | Team 3 + Team 4 + Team 1 |
| `life.iai.one` | Team 1 + life lane owners | `BLOCKED_NO_LIVE` | Audit site-wide xác nhận còn `41` page cần rebuild song ngữ, `133` English errors đang mở, `1` metadata/SEO issue đang mở, và `991` candidate hard-coded public strings ngoài content source. | `life.iai.one/reports/team1/UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT_2026-04-21.md` | giữ no-live, rebuild đúng content-source/locale/SEO path cho đến khi audit site-wide đổi khỏi blocked | life lane owners + Team 1 |

---

## 3. Why some teams still look “not applied”

Lý do thực tế hiện tại không phải vì command không tồn tại.

Lý do là:

1. `PASS` đang được nhìn thấy nhiều nhất là pass ở lớp Team 1 governance/docs scope.
2. Whole-system universal bilingual rebuild chưa có một status board riêng trước file này, nên nhiều người đọc nhầm `PASS` thành “đã xong toàn bộ”.
3. `developer.iai.one` đã làm thật và đang là lane mẫu.
4. `dash.iai.one` vẫn còn cleanup kỹ thuật chưa hoàn tất.
5. `life.iai.one` đã có site-wide audit và đang bị chặn live thật.
6. `noos-web` là kiến trúc locale ngoại lệ nên không thể gộp pass tự động từ shared-shell audit.

---

## 4. Immediate operating rules

Từ board này trở đi:

1. Không dùng `TEAM1_LANGUAGE_COMPLIANCE_STATUS_*` để kết luận mọi website đã đạt universal bilingual rebuild.
2. Chỉ lane nào có status `APPLIED_TRUE` hoặc có site-wide audit closure riêng mới được claim đã áp chuẩn thật.
3. `dash.iai.one` là target cleanup kế tiếp rõ nhất trong workspace hiện tại.
4. `life.iai.one` tiếp tục giữ `BLOCKED_NO_LIVE` cho đến khi audit site-wide được đóng.
5. `noos-web` chỉ được đóng khi có review closure tương đương cho kiến trúc locale riêng.

---

## 5. Final direction

Command universal bilingual rebuild hiện đã được khóa ở tầng policy.

Nhưng policy lock không tự động biến thành implementation closure.

Canonical truth ngày `2026-04-22` là:

- Team 1 docs/governance scope: `PASS`
- whole-system universal bilingual rebuild: `ACTIVE`
- lane mẫu đã áp thật: `developer.iai.one`
- target cleanup tiếp theo rõ nhất: `dash.iai.one`
- site đang bị chặn live rõ ràng nhất theo audit site-wide: `life.iai.one`

Execution directive và ETA chính thức cho 3 lane còn hở được khóa tại:

- `docs/reports/team1/TEAM1_UNIVERSAL_BILINGUAL_REBUILD_EXECUTION_DIRECTIVE_2026-04-22.md`
