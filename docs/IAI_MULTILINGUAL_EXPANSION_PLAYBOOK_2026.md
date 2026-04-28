# IAI_MULTILINGUAL_EXPANSION_PLAYBOOK_2026
- Owner: Team 1 Program Root / Control Tower
- Status: ACTIVE
- Scope: chuẩn mở rộng đa ngôn ngữ cho file giao việc, báo cáo, evidence packet, release gate, release note

## 1. Mục tiêu

Thiết lập một quy trình đa ngôn ngữ có thể mở rộng mà vẫn giữ:
- tính đúng nghĩa kỹ thuật,
- nhất quán thuật ngữ với codex,
- khả năng kiểm định tự động trước gate review.

## 2. Vai trò ngôn ngữ

- Tiếng Việt (`vi-VN`):
  - Ngôn ngữ điều hành chính cho command/report/gate trong workspace hiện tại.
  - Bắt buộc có dấu đầy đủ.
- Tiếng Anh (`en-US`):
  - Ngôn ngữ kỹ thuật chuẩn cho tên hệ thống, giao thức, trạng thái, key runtime, API contracts.
  - Không dịch các literal kỹ thuật đã khóa (ví dụ: `READY_FOR_TEAM1_REVIEW`, `PASS/READY`, `release claim`).
- Ngôn ngữ mở rộng (ví dụ: `ja-JP`, `ko-KR`, `fr-FR`, `de-DE`):
  - Chỉ mở khi có glossary + reviewer owner + checklist chất lượng tương ứng.

## 3. Quy tắc bắt buộc theo loại tài liệu

- File giao việc:
  - Câu lệnh rõ vai trò team, rõ điều kiện PASS/FAIL.
  - Không dùng mơ hồ kiểu “làm nhanh”, “gần xong”.
- Báo cáo:
  - Giữ format ngắn (`DONE / IN PROGRESS / BLOCK / NEXT`) hoặc format đã khóa trong lane.
  - Bắt buộc nêu evidence path khi claim “DONE”.
- Evidence packet:
  - Bắt buộc có packet body + test proof + rollback note + owner accountability.
  - Nếu thiếu một mục thì không đủ điều kiện gate review.
- Release gate / release note:
  - Chỉ dùng trạng thái kỹ thuật chuẩn (GO/NO-GO, PASS/FAIL, READY/BLOCKED).
  - Không dùng marketing wording để thay cho trạng thái kỹ thuật.

## 4. Quy trình mở thêm ngôn ngữ

1. Tạo glossary cho ngôn ngữ mới từ canonical glossary.
2. Chỉ định owner reviewer cho ngôn ngữ mới.
3. Tạo checklist chất lượng ngôn ngữ cho ngôn ngữ mới.
4. Chạy kiểm tra tự động + review thủ công trước khi merge.
5. Chỉ mở gate khi ngôn ngữ mới đạt chuẩn kỹ thuật và ngữ nghĩa.

## 5. Checklist chất lượng ngôn ngữ

- Đúng dấu và đúng chính tả.
- Đúng nghĩa kỹ thuật theo bối cảnh domain.
- Đúng vai trò ngôn ngữ (không trộn sai lớp giữa operational text và technical literals).
- Không thay đổi nghĩa của các trạng thái/literal đã khóa.
- Không làm mất traceability của owner/evidence/gate verdict.

## 6. Cơ chế kiểm tra tự động

- Command bắt buộc cho Team 1:
  - `pnpm report:team1-language`
- Kết quả snapshot:
  - `docs/reports/team1/TEAM1_LANGUAGE_COMPLIANCE_STATUS_<date>.json`
  - `docs/reports/team1/TEAM1_LANGUAGE_COMPLIANCE_STATUS_<date>.md`

## 7. Cơ chế fail-fast

- Bất kỳ tài liệu nào vi phạm chuẩn ngôn ngữ:
  - trạng thái = `REVIEW_FAIL_LANGUAGE`
  - không được dùng làm bằng chứng mở gate.

## 8. Tài liệu liên quan

- `docs/IAI_LANGUAGE_GLOSSARY_CANONICAL_2026.md`
- `docs/reports/team1/TEAM1_LANGUAGE_COMPLIANCE_REVIEW_2026-04-18.md`
- `docs/reports/team1/TEAM1_MULTILINGUAL_EXPANSION_READINESS_2026-04-19.md`
