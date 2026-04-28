# IAI_ONE_AUDIT_TEMPLATE_4_FILE_PER_TEAM_2026-04-26

- Issuing body: Team Admin (Codex)
- Order reference: `IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26.md`
- Purpose: Template chuẩn để mọi team copy-paste, fill in, submit
- Replace `<TEAM_NAME>` bằng `TEAM1`, `TEAM2`, `TEAMA`, `PAY_EMAIL`, etc.

---

## File 1/4 — TEAM_<TEAM_NAME>_CURRENT_STATE_REPORT_2026-04-26.md

```markdown
# TEAM_<TEAM_NAME>_CURRENT_STATE_REPORT_2026-04-26

- Team: <full name>
- Owner agent: <agent identity>
- Owner human: <if applicable>
- Date: 2026-04-26
- Audit order ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26

---

## Surface 1: <surface-key>

- Surface: <name>
- Canonical domain: <fqdn>
- Primary role: <root | portal | product | developer/docs | control plane | internal/operate>
- Current state: <DEV | PREVIEW | DEMO | LIVE | BROKEN | DEPRECATED>
- Production-ready: <YES (kèm proof) | NO>
- Demo/simulated: <YES | NO>
- Auth source: <none | shared-iai-auth | own | third-party | unknown>
- Payment source: <none | pay.iai.one | own | third-party | unknown>
- Invoice source: <none | invoice.iai.one | own | third-party | unknown>
- Data source: <D1 | KV | R2 | external API | own | unknown>
- Shared core dependency: <list packages used: @iai/* + version>
- Known issues: <list, ngắn>
- Security or legal risk: <list>
- Founder decision needed: <list, ngắn — chi tiết sang file 3/4>
- Next 7-day action: <list>
- Next 30-day action: <list>

### Production proof
- repo proof: <commit hash + file path liên quan>
- domain proof: <`dig <fqdn>` output / TLS chain / Cloudflare vhost screenshot>
- deploy proof: <`wrangler deploy` log / build output / route smoke output>
- owner proof: <ack message từ human owner — nếu external>
- (Nếu thiếu bất kỳ proof nào → Production-ready: NO, không được claim YES)

---

## Surface 2: <surface-key>
... (lặp lại schema cho mỗi surface)
```

---

## File 2/4 — TEAM_<TEAM_NAME>_DOMAIN_AND_SERVICE_MAP_2026-04-26.md

```markdown
# TEAM_<TEAM_NAME>_DOMAIN_AND_SERVICE_MAP_2026-04-26

- Team: <full name>
- Date: 2026-04-26

## Domain bảng (8 mục)

| Domain | Legal lane | Payment lane | Auth source | Data source | Shared core in use | Logic riêng ngoài core | Public wording sai? | Preview/simulated bị hiểu nhầm là production? |
|---|---|---|---|---|---|---|---|---|
| <fqdn1> | <ID legal lane / chưa có> | <pay.iai.one / own / none> | <shared-iai-auth / own / none> | <D1/KV/R2/...> | <@iai/...> | <YES + chi tiết / NO> | <YES + ví dụ / NO> | <YES + chi tiết / NO> |
| <fqdn2> | ... | ... | ... | ... | ... | ... | ... | ... |

## Notes
- <Bất kỳ ghi chú nào về cross-domain dependency>
- <Cảnh báo nếu thấy chồng vai vai trò>
```

---

## File 3/4 — TEAM_<TEAM_NAME>_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md

```markdown
# TEAM_<TEAM_NAME>_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26

- Team: <full name>
- Date: 2026-04-26

## Blocker

### BLK-<TEAM>-001
- Description: <chi tiết>
- Owner: <team / agent / founder>
- Blocking since: <YYYY-MM-DD>
- Severity: <P0 | P1 | P2>
- Proof of blocker: <log / screenshot / command output / file path>
- Estimated unblock effort: <phút/giờ/ngày>
- Affects: <surface list>

### BLK-<TEAM>-002
... (lặp lại)

## Founder decision required

### DEC-<TEAM>-001
- Question: <câu hỏi cụ thể YES/NO hoặc multiple choice>
- Context: <bối cảnh ngắn>
- Recommendation from team: <nếu có>
- Default if no decision by <YYYY-MM-DD>: <fallback hành động>
- Affects: <surface list>

### DEC-<TEAM>-002
... (lặp lại)
```

---

## File 4/4 — TEAM_<TEAM_NAME>_ONE_PAGE_EXEC_SUMMARY_2026-04-26.md

```markdown
# TEAM_<TEAM_NAME>_ONE_PAGE_EXEC_SUMMARY_2026-04-26

- Team: <full name>
- Date: 2026-04-26
- Cap: ~50 dòng

## 1. Team scope
<1 dòng tả scope: lane chính, domain chính>

## 2. Surface đang quản
- <surface 1> (<state>)
- <surface 2> (<state>)
- ...

## 3. Live thật (production-ready với proof)
- <surface X>: <1 câu mô tả + proof reference>
- ...
(Nếu không có: ghi "0 surface live thật")

## 4. Demo / simulated / preview
- <surface Y>: <1 câu>
- ...

## 5. Broken / blocked / deprecated
- <surface Z>: <1 câu + blocker ID nếu có>
- ...

## 6. Top 3 blocker
1. <BLK-...>: <1 câu>
2. <BLK-...>: <1 câu>
3. <BLK-...>: <1 câu>

## 7. Top 3 founder decision needed
1. <DEC-...>: <1 câu>
2. <DEC-...>: <1 câu>
3. <DEC-...>: <1 câu>
```

---

## Quy tắc fill template

1. **Không bỏ trống mục** — nếu thật sự không applicable, ghi `N/A` + 1 câu giải thích vì sao.
2. **Không dùng cụm cấm**: "đang làm", "gần xong", "sắp live", "tạm ổn" — phải state cụ thể.
3. **Production-ready: YES** cần đủ 4 proof (repo + domain + deploy + owner). Thiếu bất kỳ proof nào → ghi NO.
4. **Surface chồng vai** (vd vừa product vừa control plane) → ghi vào §13 + §14 founder decision needed.
5. **Khi có doubt** → mặc định ghi state thấp hơn (vd PREVIEW thay vì LIVE) + escalate.

---

## Submission checklist

- [ ] File 1: 15 mục/surface đầy đủ
- [ ] File 2: 8 cột/domain đầy đủ
- [ ] File 3: blocker có severity + proof + estimate
- [ ] File 4: 7 phần ngắn, ≤50 dòng
- [ ] Ack commit message: `ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26`
- [ ] Notify Team Admin trong commit body hoặc relay channel
