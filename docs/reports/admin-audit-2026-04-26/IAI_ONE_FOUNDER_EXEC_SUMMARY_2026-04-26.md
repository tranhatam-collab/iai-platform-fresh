# IAI_ONE_FOUNDER_EXEC_SUMMARY_2026-04-26

- Issuing body: Team Admin (Codex)
- Date: 2026-04-26 EOD (v2 — post 5 decisions ký)
- Status: 7/12 team có data (3 ĐẠT_CHUẨN + 4 INFERRED_DRAFT); 5 chờ relay
- Cap: 1 trang founder review

---

## 1. Hệ đang thực sự ở đâu (post 5 decisions)

Toàn hệ `iai.one` (16 domain liệt kê) **vẫn 0 domain LIVE thật đủ 4 proof**. Tuy nhiên **trạng thái audit đã cải thiện đáng kể** sau founder ký 5 quyết định:

- **14/16 domain có owner** (post Q1+Q2). Còn 2 chưa: iai.one apex + cluster Q3 pending.
- **4/16 domain LOCKED legal lane** (pay, mail, dash, noos). Còn 12 TBD.
- **Pay+Email scope mở rộng** thêm Team Platform Runtime (Q1) + invoice.iai.one (Q2) — gỡ chồng vai shared runtime.
- **16 file DRAFT INFERRED** cho 4 KHÔNG_OWNER team (Q4) — master audit complete hơn.
- ~~CRITICAL GAP invoice.iai.one~~ → CLOSED Q2.

## 2. Cái gì live thật (UPDATED 2026-04-26 EOD)

- **0 domain đầy đủ 4 proof.**
- **3 domain endpoint LIVE qua Cloudflare** (verified `dig` + `curl` 2026-04-26 EOD): `dash.iai.one` HTTP/2 200, `noos.iai.one` HTTP/2 200, `cios.iai.one` (đã có deploy proof từ closure attachment 04-23). Cả 3 đạt **3/4 proof** — chỉ thiếu owner proof.
- Endpoint live (gate retained): `pay.iai.one/health` (Q3 in progress).
- Internal LIVE: Codex control tower + gate authority.

⚠️ **Lưu ý**: HTTP 200 không = production-ready. Endpoint serving content nhưng business logic / state correctness chưa verify. Cần content audit + smoke test thật.

## 3. Cái gì chỉ là demo

- dash.iai.one Control Tower UI: PREVIEW (spec only)
- web.iai.one: PREVIEW (KPI loop)
- mail.iai.one: PREVIEW (Wave 1 chưa close)

## 4. Cái gì đang sai pháp lý

- **4 domain LOCKED đúng** post Q5 (pay, mail, dash, noos).
- 12 TBD → KHÔNG XÁC ĐỊNH ĐƯỢC (giảm từ 14 trước Q5).

## 5. Cái gì đang sai payment

- Không domain dùng payment riêng (đúng policy).
- 17 intake row pay vẫn 0 row READY_FOR_LIVE (chờ Q3 effect).

## 6. Cái gì đang chặn shared core

- ~~pay.iai.one shared runtime contract: chồng vai owner~~ → **CLOSED Q1** (Pay+Email own evolution).
- 5 signal FAIL trong gate verdict vẫn còn → chờ Pay+Email expose 3 field `/health`.
- Q3 canonical key in progress → khi key về + Pay+Email expose 3 field, gate có thể flip.

## 7. 3 quyết định founder cần ký TIẾP THEO

(5 P0 đã ký. Còn 3 ưu tiên P1)

### Quyết định 1: Reply Q-OPEN-1/2/3/5 (ngắn — Q4 đã defer)
**Format**:
```
Q1: a (Team A = developer.iai.one)
Q2: a (Team D 100% Pay+Email)
Q3: theo Codex (5 apps ownership table)
Q5: b (Codex split dirty trước)
```
**Hệ quả**: định danh chính thức Team A + lock 5 apps + clear 230+ dirty file.

### Quyết định 2: Push provider canonical key (Q3 trong progress)
**Status**: Founder duty đang triển khai. Codex chờ key về để rerun probe.
**Hệ quả** (khi key về + Pay+Email expose 3 field): pay flip trong 1-2 phiên.

### Quyết định 3: Lock legal lane cho 6 domain TBD còn lại
- web.iai.one, app.iai.one, home.iai.one, flow.iai.one, nft.iai.one, docs.iai.one
- Default Codex recommend: theo cluster role (product/dev-docs/root)
- Founder approve hoặc override per domain.

---

## 8. Việc Team Admin đã làm hôm nay

- Phát hành Audit Order + tracking + template (commit `3afd2cf`)
- Tự fill 4-file cho T1+T2+T3 (commit `a17158c`)
- Master Audit v1 PARTIAL + Exec Summary
- Lock 5 founder decisions Q1-Q5 (commit `f0f85d6`)
- Pre-fill 16 file DRAFT INFERRED cho 4 KHÔNG_OWNER team (commit `695d5fa`)
- Refresh Master Audit v2 IMPROVED + Exec Summary này (commit hiện tại)

## 9. Việc còn phải làm

- Refresh 2 zip Desktop với artifact mới
- Founder relay 2 message audit sang Pay+Email + T4+5 (file `IAI_ONE_AUDIT_RELAY_MESSAGES_PAYEMAIL_T45_2026-04-26.md`)
- Pay+Email session: nộp 4-file + audit Team Platform Runtime + invoice.iai.one
- T4+5 session: nộp 8-file
- 4 owner ship evidence (developer/cdn/flows/cios)
- Q3 effect: canonical key về → Team 2 rerun probe

## 10. Báo cáo trung thực: Team nào đang thế nào? (post 5 decisions)

| Team | Báo cáo trung thực? | Sai vai? | Lệch legal? | Lệch payment? | Chặn shared core? | Founder can thiệp? |
|---|---|---|---|---|---|---|
| Team 1 (Codex) | YES (self-audit) | NO | N/A | N/A | NO | NO |
| Team 2 (Codex) | YES (self-audit) | NO | LOCKED Q5 | NO | ~~YES~~ → NO (Q1 transferred to Pay+Email) | NO (Q3 in progress) |
| Team 3 (Codex) | YES (self-audit) | NO | LOCKED Q5 | NO | NO | NO |
| Team 4-5 (T4+5) | _pending relay_ | _pending_ | _pending_ | _pending_ | _pending_ | _founder relay_ |
| Team A (INFERRED) | DRAFT only | TBD | TBD | TBD | TBD | _Q-OPEN-4 reassess 04-30_ |
| Team B-CDN (INFERRED) | DRAFT only | TBD | TBD | TBD | TBD | _founder push owner email_ |
| Team B-Flows (INFERRED) | DRAFT only | TBD | TBD | TBD | TBD | _founder push owner email_ |
| Team B (Pay) | _pending relay_ | _pending_ | _pending_ | _pending_ | _pending_ | YES — PAYMENT_WEBHOOK_SECRET |
| Team C (INFERRED) | DRAFT only | TBD | TBD | TBD | TBD | YES — JWT secret rotate |
| Team D | _pending relay_ | _pending_ | _pending_ | _pending_ | _pending_ | YES — merchant onboard |
| Team Email/SMTP | _pending relay_ | _pending_ | _pending_ | _pending_ | _pending_ | YES — mailbox/alias |
| Team Pay | _pending relay_ | _pending_ | _pending_ | _pending_ | _pending_ | _Q3 in progress_ |
| Team Platform Runtime (NEW Q1) | _Pay+Email pending_ | NO | N/A | N/A | YES (5 signal FAIL) | _Pay+Email duty_ |
| invoice.iai.one (NEW Q2) | _Pay+Email pending_ | _pending_ | TBD | TBD | _pending_ | _Pay+Email audit_ |

**Tóm**: 3/14 team đã nộp trung thực (Codex). 4/14 INFERRED (Q4 mode, chờ team thật). 7/14 _pending_ relay. **Founder cần can thiệp 5 team với 5 quyết định khác nhau** (giảm từ 8 → 5 sau ký Q1-Q5).
