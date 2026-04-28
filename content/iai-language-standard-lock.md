# IAI LANGUAGE STANDARD LOCK
## Khóa chuẩn ngôn ngữ toàn hệ `*.iai.one`
## Version 1.0 (Locked)
## Status: ACTIVE
## Date: 2026-04-18

---

## 0. Purpose

This file locks the mandatory language standard for the entire `*.iai.one` system.

File này khóa chuẩn ngôn ngữ bắt buộc cho toàn bộ hệ `*.iai.one`.

It applies to:
- public copy
- product UI
- developer docs
- operational docs
- release packets
- reports
- team handoff files
- AI-generated writing
- AI-assisted code when text is user-facing

Tài liệu này không phải gợi ý.
Đây là chuẩn bắt buộc để review, gate và release.

---

## 1. Authority order

Language authority follows this order:

1. `content/iai-language-standard-lock.md`
2. `content/iai-language-codex.md`
3. `content/iai-ui-text-system.md`
4. `content/iai-ui-copy-registry.md`
5. `content/vi.json`
6. `content/en.json`

Nếu có mâu thuẫn:
- file này giữ quyền khóa chuẩn vận hành
- `iai-language-codex.md` giữ quyền khóa tư tưởng và vai trò bề mặt
- `iai-ui-text-system.md` giữ quyền khóa ngôn ngữ giao diện
- `iai-ui-copy-registry.md` giữ quyền khóa các family UI dùng chung

---

## 2. Absolute language rules

### 2.1 Vietnamese is mandatory and fully accented

Tiếng Việt là ngôn ngữ chính của hệ.

Bắt buộc:
- luôn có dấu đầy đủ
- đúng ngữ pháp
- đúng nghĩa
- đúng vai trò domain
- bình tĩnh, chính xác, không quảng cáo

Không được:
- viết tiếng Việt không dấu
- viết kiểu chat rút gọn
- dùng khẩu ngữ cẩu thả
- dùng câu mơ hồ để “lướt qua cho xong”

Hard rule:
- một file có tiếng Việt không dấu thì file đó chưa đạt chuẩn review

### 2.2 English must be precise and internationally correct

English is the secondary language of the system.

English must be:
- precise
- role-aware
- globally readable
- technically correct
- non-promotional

English must not be:
- literal word-for-word translation from Vietnamese
- startup cliché language
- vague marketing language
- exaggerated category language

### 2.3 Bilingual rule

Không trộn tiếng Việt và tiếng Anh trên cùng một dòng, trừ khi:
- đó là code identifier
- đó là API path
- đó là field name
- đó là technical term cần giữ nguyên

Định dạng đúng:

Đoạn tiếng Việt

English paragraph below

---

## 3. Scope of enforcement

Chuẩn này áp dụng cho toàn bộ các lớp sau:

### 3.1 Public surfaces

- `iai.one`
- `home.iai.one`
- `app.iai.one`
- `flow.iai.one`
- `docs.iai.one`
- `developer.iai.one`
- `dash.iai.one`
- `nft.iai.one`
- `web.iai.one`
- `pay.iai.one`
- `noos.iai.one`

### 3.2 Operational and release surfaces

- execution boards
- team command packs
- daily reports
- weekly reports
- release gates
- evidence packets
- rollback notes
- critical-path files
- environment and secrets truth files
- definition of done files

### 3.3 Product and code surfaces

- UI strings
- empty states
- error messages
- badges
- helper text
- onboarding copy
- SEO metadata
- user-facing code comments when applicable

---

## 4. Locked Vietnamese rules

Mọi tiếng Việt của hệ phải:
- có dấu đầy đủ
- ưu tiên câu rõ nghĩa hơn câu hoa mỹ
- dùng thuật ngữ nhất quán với codex
- đúng sắc thái của từng bề mặt

Mục tiêu kỹ thuật:
- câu dài khoảng 10 đến 22 từ khi có thể
- đoạn văn từ 2 đến 4 câu
- button và label từ 2 đến 4 từ khi có thể

Không dùng:
- từ cấm trong codex
- câu thiếu chủ ngữ hoặc thiếu nghĩa
- mô tả mập mờ về trạng thái release
- cụm từ nửa Việt nửa Anh không có lý do kỹ thuật

---

## 5. Locked English rules

Mọi tiếng Anh của hệ phải:
- đúng thuật ngữ
- đúng ngữ cảnh
- đúng vai trò bề mặt
- ngắn, rõ, có thể kiểm tra được

Ưu tiên:
- noun-based phrasing
- short declarative sentences
- architectural clarity
- operational clarity

Không dùng:
- hype language
- emotional persuasion
- category inflation
- weak translation from Vietnamese

Ví dụ đúng:
- `living execution surface`
- `living control system`
- `public trust layer`
- `payment and settlement layer`
- `release evidence packet`
- `environment truth`

---

## 6. Team rules

### Team 1

Team 1 phải fail review nếu:
- packet còn tiếng Việt không dấu
- tiếng Anh sai nghĩa kỹ thuật
- ngôn ngữ của file mâu thuẫn với vai trò domain

### Team 2

Team 2 phải dùng:
- tiếng Việt có dấu trong packet, runbook, matrix, changelog gửi nội bộ
- tiếng Anh chính xác trong API terms, runtime terms, auth terms

Không được gửi Team 1 các mô tả kỹ thuật viết tắt cẩu thả.

### Team 3

Team 3 phải giữ:
- UI text đúng codex
- metadata song ngữ đúng nghĩa
- không trộn ngôn ngữ sai dòng

### Team 4

Team 4 phải giữ:
- support và growth wording đúng trust tone
- không dùng tiếng Việt không dấu trong ops report
- không dùng tiếng Anh kiểu marketing

### Team 5

Team 5 phải giữ:
- onboarding copy đúng codex
- SEO song ngữ chuẩn
- không tự bẻ ngôn ngữ billing, auth, runtime khỏi shared truth

---

## 7. Dev rules

Không hard-code text ngoài registry nếu text thuộc:
- nav
- button
- badge
- error
- helper text
- footer
- form labels

UI strings phải bind từ:
- `content/vi.json`
- `content/en.json`

Nếu là docs hoặc release docs:
- phải bám `iai-language-codex`
- phải bám file khóa ngôn ngữ này

---

## 8. QA rejection checklist

Reject ngay nếu:
- thiếu dấu tiếng Việt
- câu tiếng Việt sai nghĩa
- tiếng Anh không tự nhiên hoặc sai technical meaning
- trộn hai ngôn ngữ sai dòng
- dùng từ cấm
- dùng ngôn ngữ sai vai trò domain
- file giao việc hoặc report viết cẩu thả

---

## 9. Correction protocol

Khi phát hiện file sai chuẩn ngôn ngữ:

1. sửa ngôn ngữ trước
2. mới được review nội dung
3. nếu file thuộc release lane, packet mặc định bị giữ

Hard rule:
- không có ngoại lệ cho file “chỉ là nội bộ”
- tài liệu nội bộ cũng phải đủ chuẩn để team khác đọc đúng và hành động đúng

---

## 10. Sendable admin directive

Team Admin directive:

`Từ thời điểm này, toàn bộ file giao việc, báo cáo, evidence packet, release gate, release note, UI text và metadata trong hệ *.iai.one phải dùng tiếng Việt có dấu đầy đủ; tiếng Anh phải chính xác, đúng nghĩa kỹ thuật và đúng vai trò domain. File nào sai dấu, sai nghĩa hoặc sai chuẩn song ngữ thì chưa đạt chuẩn review và chưa được đi tiếp qua gate.`

---

## 11. Final rule

Nếu một câu không làm rõ nghĩa, hãy viết lại.

Nếu một đoạn tiếng Việt không có dấu đầy đủ, hãy sửa trước khi nộp.

Nếu tiếng Anh không đủ chính xác để dùng ở mức quốc tế, hãy sửa trước khi publish.

Ngôn ngữ không chỉ để đọc.
Ngôn ngữ là một phần của system truth.
