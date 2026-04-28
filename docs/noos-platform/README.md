# NOOS Platform Project Pack

Status: PRODUCTION LOCK

Tai lieu nay khoa huong trien khai ky thuat cho `NOOS` nhu lop kien truc va control layer cua toan he IAI.

Tai lieu chinh:
- `NOOS_DEV_DIRECTION_MASTER_2026.md`
- `../noos/README.md` (commerce lock pack for Team 1, Team 2, Team 3, Team 4 handoff)
- `NOOS_SCHEMA_PACK_v0.3.json`

Production locks:
- `NOOS` la architecture/control layer.
- `Flow` la execution layer.
- `App` la human-facing operator layer.
- Execution khong duoc bypass `Flow`.
- Moi command nhay cam phai co approval + rollback + evidence.
- NOOS phai local-first, DTN-ready, PQC-native, va degraded-mode-native.
- `Vietnam profile` va `Mars latency lab` la route hang nhat.
- Commerce cua NOOS phai bam lock pack trong `docs/noos/` (khong tach nhanh rieng).
