# Recovery 2026-04-28

Repo trước (`iai-platform-worktree/`) bị object-DB corruption (signal 10 / SIGBUS khi pack-objects).
Symptoms + diagnosis: xem `team1/REPO_HEALTH_WARNING_2026-04-28.md`.

## Snapshot này
- Khởi tạo lại git repo từ working tree HEAD `86089cd957…` của repo cũ
- Chỉ chứa Team 1 scope (mail-api, packages mail-core, tests, docs, scripts, runtime, trust-iai-one-starter, pay.iai.one, infra, ops, content, db)
- 9 commits gần nhất (session 2026-04-28) lưu lại dưới dạng patch để audit:
  - 0001 mail-api inbound webhook Path B HMAC handler
  - 0002 mail-core wave2 auth templates
  - 0003 docs Path B DEPLOYED status flip
  - 0004 mail-api Path B post-deploy hardening
  - 0005 mail-api Path B in-package bootstrap entrypoint
  - 0006 mail-api Path B graceful shutdown + image c1b9b3b swap
  - 0007 docs Path B provider integration runbook
  - 0008 ops pay-gate + trust-state refresh log
  - 0009 ops repo-health corruption symptoms + recovery plan

## Mất
- 115 commits cũ hơn của repo trước (không có backup remote, không thể recover từ corrupt object-DB)
- Domain dirs ngoài Team 1 scope: app.iai.one, cios.iai.one*, flow.iai.one*, home.iai.one, life.iai.one, nft.iai.one, noos.iai.one, docs.iai.one, Life-Code-OS (các dir này có nested .git riêng hoặc thuộc team khác, copy sau khi cần)

## Repo cũ
- Đã rename: `iai-platform-worktree.corrupt-archive-20260428/`
- KHÔNG xoá; founder có thể inspect sau
