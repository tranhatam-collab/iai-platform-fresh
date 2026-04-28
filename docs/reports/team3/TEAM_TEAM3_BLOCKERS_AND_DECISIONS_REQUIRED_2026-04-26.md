# TEAM_TEAM3_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26

- Team: Team 3
- Date: 2026-04-26

---

## Blocker

### BLK-TEAM3-001
- Description: noos.iai.one chưa có production deploy proof (chưa verify domain + wrangler deploy)
- Owner: Team 3 (Codex)
- Blocking since: 2026-04-26 (audit phát hiện)
- Severity: P1
- Proof of blocker: chưa có `dig noos.iai.one` output trong audit
- Estimated unblock effort: ~30 phút (verify domain + check vhost)
- Affects: noos.iai.one production-ready claim

### BLK-TEAM3-002
- Description: `/checkout-success`, `/library` route chờ delta upstream từ Team 2 shared runtime
- Owner: Team 2 (gắn với BLK-TEAM2-002)
- Blocking since: 2026-04-22
- Severity: P1
- Proof of blocker: comment trong `DAILY_TEAM3_2026-04-26.md`
- Estimated unblock effort: depend Team 2 expose 3 field
- Affects: 2 route NOOS

---

## Founder decision required

### DEC-TEAM3-001
- Question: noos.iai.one legal lane là gì?
- Context: hiện chưa có file pháp lý lock cho noos
- Recommendation: assign Codex viết draft "commerce surface, e-commerce metadata, payment qua pay.iai.one"
- Default if no decision by 2026-04-28: ghi "TBD" trong audit master
- Affects: noos.iai.one audit completeness

### DEC-TEAM3-002
- Question: NFT scope (apps/nft + nft.iai.one) có thực sự thuộc Codex không?
- Context: Q-OPEN-3 recommendation Codex own NFT, chưa founder confirm
- Recommendation: (a) Codex own
- Default: Codex tạm assume own
- Affects: NFT audit owner
