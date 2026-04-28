# TEAM1_OWNER_PING_PAY_GATE_UNBLOCK_2026-04-28
- Date: 2026-04-28 (ICT)
- Audience: Owner provider / Owner ha tang pay.iai.one
- Status: `LOCK_RETAINED_WITH_REASON` (Team 1 gate)
- Source packet: `docs/reports/team1/TEAM1_OWNER_PROVIDER_PAY_GATE_UNBLOCK_PACKET_2026-04-28.md`

## Owner ping (chat-ready, 5 dong)

```
Pay production gate van LOCK. Can owner xac nhan 2 nhom de Team 2 rerun mo flip:
1) Cap key probe noi bo: bind TEAM2_PAY_GATE_API_KEY (header x-api-key) cho pay.iai.one.
2) Deploy /health phien ban moi: phai co data.shared_read_model va data.shared_upstream_runtime
   (rolloutReadyForSharedOnly=true, activeReadMode=shared_contract, releaseGate.ready=true).
Khoa canonical: TEAM2_PAY_GATE_TENANT_CODE=vetuonglai, TEAM2_PAY_GATE_SITE_CODE=vetuonglai-member, PROVIDER=payos.
Tra loi theo template trong packet o tren. Owner ack xong, Team 2 rerun ngay.
```

## Email/short-form ping

```
Subject: [Pay gate unblock] need owner ack on probe key + /health shared contract

Pay production gate hien LOCK. Khong phai loi code, la 2 dieu kien runtime:
- TEAM2_PAY_GATE_API_KEY chua bind -> probe noi bo nhan 401 API_KEY_REQUIRED.
- pay.iai.one /health van shape cu (thieu shared_read_model va shared_upstream_runtime).
  Code da co contract day du, can deploy ban moi.

De rerun, vui long xac nhan:
- Auth: x-api-key TEAM2_PAY_GATE_API_KEY (canonical) hoac x-site-key TEAM2_PAY_GATE_SITE_KEY (legacy).
- /health: data.shared_read_model.rolloutReadyForSharedOnly=true,
  data.shared_upstream_runtime.activeReadMode=shared_contract,
  data.shared_upstream_runtime.releaseGate.ready=true.
- Canonical: tenant=vetuonglai, site=vetuonglai-member, provider=payos.

Sau khi owner ack, Team 2 chay:
  node scripts/team1-pay-gate-loop.mjs
```

## Tham chieu

- `docs/reports/team1/TEAM1_OWNER_PROVIDER_PAY_GATE_UNBLOCK_PACKET_2026-04-28.md`
- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json`
- `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.json`
- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-28.json`

## Refresh log

| Lan re-run | Gio (UTC) | runtime_probe_checkout_status | shared_health_contract_shape | bundle_status | Ket luan |
|---|---|---|---|---|---|
| Lan 1 (sang) | 2026-04-28T~02:00Z | 401 | legacy_or_unknown | BLOCKED_PRECHECK | Phat hanh packet goc + ping |
| Lan 2 (chieu) | 2026-04-28T11:51Z | 401 | legacy_or_unknown | BLOCKED_PRECHECK | Khong thay doi -> owner chua ack/deploy |
| Lan 3 (toi) | 2026-04-28T15:07Z | 401 | legacy_or_unknown | BLOCKED_PRECHECK | Sau ~3-13 gio, ket qua nhu cu — escalate founder |

Ba lan re-run cach nhau (lan 1 -> 2 ~10 gio, lan 2 -> 3 ~3 gio) van cho
ket qua byte-identical: `auth_key_present=false`, `production_gate_green=false`,
`shared_*` tat ca van fail. Day la _bang chung khoa_ rang khoi
khong phai van de transient hay timing — chinh xac la chua co owner
action (cap key + deploy lai pay shared `/health` contract).

## Escalation founder (2026-04-28 toi)

Sau 3 lan re-run trong cung ngay khong co thay doi, dieu kien khoa
khong the tu giai bang code. Founder can quyet:

1. **Push owner cap key**: TEAM2_PAY_GATE_API_KEY phai bind cho probe noi bo
   lay trang thai checkout (header `x-api-key`).
2. **Push owner deploy pay shared `/health`**: contract `data.shared_read_model`
   + `data.shared_upstream_runtime` da co san trong code; can owner deploy
   phien ban moi cho `pay.iai.one` (tranh regression voi prod traffic 18 domain).

Khong co 2 dieu nay, gate van LOCK. Code Team 1 + Team 2 da san sang
re-run trong vong vai phut sau khi 2 dieu kien runtime duoc owner cap nhan.

Hanh dong tiep theo (trong khi cho owner):
- Mai sang re-run them 1 lan -> neu van khong doi, founder push lan 2.
- Khong tu y tao API key thay vi owner.
- Khong tu y deploy pay shared contract — co the gay regression cho prod traffic.
