# TEAM4_TO_TEAM1_INTAKE_CHECKLIST_2026-04-17
- Nhóm: Team 4 Growth Revenue Operations
- Ngày: 2026-04-17
- Trạng thái packet: `READY_FOR_TEAM1_REVIEW`
- Trạng thái lane: `GO` (Team 1 gate snapshot 2026-04-18: `Overall PASS`, `Final verdict GO`)

---

## 1. Proof intake của app surface

- Route operations:
  - `/en/operations`
  - `/vi/operations`
- Endpoint trace map:
  - `/en/operations/trace-map.json`
  - `/vi/operations/trace-map.json`

Team 1 kiểm tra tối thiểu các block sau trên `/operations`:
- ops truth + owner/escalation matrix
- recovery path + partner handoff
- incident matrix
- support macros (bao gồm updates announcement macro)
- rollback communication
- trace mapping cho `wrong asset opening request` + `deny mismatch`

---

## 2. Proof lệnh

- `pnpm test:noos-web`
  - kỳ vọng: PASS toàn bộ integration tests của NOOS web surface.
- `NOOS_STACK_TEST=1 pnpm test:noos-stack`
  - kỳ vọng: PASS stack flow (checkout + boundary redirects).
- `pnpm report:lane`
  - kỳ vọng: `Overall: PASS` và snapshot ngày `2026-04-19` được cập nhật.

---

## 3. Yêu cầu intake cho trace mapping

Team 1 verify trong endpoint trace map:
- có scenario `wrong asset opening request`
- có scenario `deny mismatch`
- có field bắt buộc `requested_asset_id`
- có `decisionPath` và `escalateTo` cho từng scenario

---

## 4. Ghi chú quyết định

- Team 4 đã hoàn chỉnh phần ops packet trong scope kiểm soát được của Team 4.
- Team 4 duy trì support/recovery/trace mapping theo gate language Team 1 và không mở claim mới.
