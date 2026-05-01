# PAY_IAI_ONE_GATE_VERDICT_2026-05-01

- Date: 2026-05-01
- Timezone: Asia/Ho_Chi_Minh
- Authority: Team 1 Program Root / Gate Authority
- Verdict: **LOCK_RETAINED_WITH_REASON**

## Verdict

`pay.iai.one` production gate tiếp tục bị giữ cho ngày `2026-05-01`.

## Why the lock remains

- Runtime `/health` shared contract: `PASS`
- Canonical auth for current gate key: `PASS`
- payOS provider/business path: `FAIL`
  - `checkout_status = 502`
  - `checkout_code = 214`
  - `checkout_url = null`
  - `payment_link_id = null`

## Active blocker owner

- `Team Pay / payOS merchant owner`

## Unlock condition

Chỉ mở Team 2 rerun bundle chính thức sau khi one-shot canonical trả:
1. `checkout_status = 201`
2. `checkout_url` non-null
3. `payment_link_id` non-null
4. `no_214 = PASS`

## References

- `docs/reports/team1/TEAM1_PAY_FINAL_ACTIVE_OWNER_STATUS_2026-05-01.md`
- `docs/reports/team1/TEAM1_PAY_PROVIDER_214_HANDOFF_2026-05-01.md`
- `docs/reports/team2/TEAM2_PAY_ONE_SHOT_PROBE_STATUS_2026-05-01.md`
