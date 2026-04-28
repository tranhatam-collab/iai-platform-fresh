# IAI_LANGUAGE_GLOSSARY_CANONICAL_2026
- Owner: Team 1 Program Root
- Status: ACTIVE
- Purpose: canonical glossary cho vận hành đa ngôn ngữ

## 1. Quy tắc dùng glossary

- Không đổi nghĩa các technical literals đã khóa.
- Bản dịch phải giữ đúng blast radius, ownership, gate intent.
- Nếu chưa có mục trong glossary, phải bổ sung trước khi dùng rộng.

## 2. Canonical terms

| Concept | English canonical | Vietnamese canonical | Notes |
|---|---|---|---|
| Cổng quyết định phát hành | release gate | cổng phát hành | Dùng trong review GO/NO-GO |
| Yêu cầu mở phát hành | release claim | yêu cầu mở phát hành | Không đồng nghĩa với “đã phát hành” |
| Bằng chứng gói phát hành | evidence packet | gói bằng chứng | Luôn đi kèm test + rollback |
| Ghi chú hoàn tác | rollback note | ghi chú hoàn tác | Bắt buộc trong packet |
| Danh sách phụ thuộc | dependency log | nhật ký phụ thuộc | Theo dõi trạng thái OPEN/CLOSED |
| Leo thang khẩn cấp | escalation | leo thang | Dùng với mã ESC-Hx |
| Sẵn sàng review Team 1 | READY_FOR_TEAM1_REVIEW | READY_FOR_TEAM1_REVIEW | Literal kỹ thuật, không dịch |
| Chặn | BLOCKED | BLOCKED | Literal kỹ thuật, không dịch |
| Giám sát ổn định | monitor-only | giám sát ổn định | Không mở scope mới |
| Chuẩn bị lane Phase D | prep-only | chỉ chuẩn bị | Không được claim release |
| Kiểm tra làn | lane check | kiểm tra làn | Tương ứng `pnpm report:lane` |
| Trạng thái kiểm soát | control tower status | trạng thái control tower | Tương ứng `pnpm report:control-tower` |
| Đạt | PASS | PASS | Literal kỹ thuật |
| Không đạt | FAIL | FAIL | Literal kỹ thuật |
| Cho phép mở cổng | GO | GO | Literal kỹ thuật |
| Không cho phép mở cổng | NO-GO | NO-GO | Literal kỹ thuật |

## 3. Mẫu mở rộng ngôn ngữ mới

Khi mở thêm ngôn ngữ `xx-XX`, dùng mẫu:

| Concept | English canonical | Vietnamese canonical | `xx-XX` canonical | Reviewer owner | Status |
|---|---|---|---|---|---|
| Ví dụ | release gate | cổng phát hành | `<dịch chuẩn>` | `<owner>` | DRAFT |

## 4. Thuật ngữ không được dịch

- `READY_FOR_TEAM1_REVIEW`
- `BLOCKED`
- `PASS`
- `FAIL`
- `GO`
- `NO-GO`
- `monitor-only`
- `prep-only`

## 5. Versioning

- Mọi thay đổi glossary phải có:
  - ngày cập nhật,
  - owner cập nhật,
  - lý do thay đổi,
  - tác động tới lane nào.
