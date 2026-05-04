# TEAM2_UNIVERSAL_QUALITY_GATE_ADOPTION_2026-05-04
- Nhóm: Team 2 Runtime and Platform Core
- Ngày: 2026-05-04
- Chính sách nguồn: `docs/reports/CROSS_TEAM_QUALITY_GATE_MEMO.md` (commit `cf90d66`)
- Trạng thái: `ADOPTED_UNDER_REPO_WIDE_UNIVERSAL_GATE`

## DONE
- Đã nối Team 2 vào pre-commit gate repo-wide bằng native git hook (`.githooks/pre-commit`).
- Pre-commit mặc định hiện chạy `pnpm quality:gate`; Team 2 scripts bên dưới là lane-specific deeper gate cho `pay` + `dash`.
- Đã nối gate vào `package.json` với chuỗi lệnh bắt buộc:
  - `pnpm quality:team2:static`
  - `pnpm quality:team2:semantic`
  - `pnpm quality:team2:surface`
- Đã thêm script kiểm tra tĩnh cho `pay` + `dash`:
  - `scripts/team2-quality-static-check.mjs`

## UNIVERSAL GATE COVERAGE (TEAM 2)
1. Lint/Semantic:
   - `pnpm typecheck:pay`
   - `pnpm typecheck:dash`
2. HTML Strict:
   - kiểm tra `<!doctype html>`
   - kiểm tra binding `html lang` theo metadata
   - kiểm tra alt text cho `img` ở `pay`
3. SEO & Hreflang:
   - kiểm tra canonical
   - kiểm tra `hreflang` `vi`, `en`, `x-default`
   - kiểm tra i18n đọc `content/seo-registry.csv`
4. Accessibility & Language:
   - kiểm tra nguồn `content/en.json` + `content/vi.json`
   - kiểm tra mật độ gọi `t(locale, ...)` trên `pay` + `dash` (chặn drift hardcoded ở lớp render)

## BLOCK RULE
- Nếu bất kỳ check nào FAIL, pre-commit phải FAIL và block commit.

## EXECUTION COMMANDS
```bash
pnpm quality:gate
pnpm quality:team2:gate
pnpm precommit
```

## VERIFICATION
- `pnpm quality:gate` -> PASS trong batch áp dụng Universal Quality Gate.
- `pay` + `dash` đều được Universal Quality Gate kiểm qua typecheck và source-level HTML/SEO/a11y/language checks.
- `pnpm quality:team2:gate` -> PASS.
- Team 2 deep lane proof:
  - `quality:team2:static` -> PASS, `failing_checks=0`
  - `test:pay` -> PASS, `60/60`
  - `test:dash` -> PASS, `11/11`

## NEXT
1. Chạy `pnpm quality:team2:gate` trước mỗi batch Team 2.
2. Giữ lane `pay` ở `prep-only` cho tới khi Team Pay gỡ blocker provider `214`.
3. Sau khi Team Pay báo xanh, Team 2 mới mở rerun bundle production gate.

## COMMIT HASH
- Batch commit áp dụng Universal Quality Gate repo-wide.
