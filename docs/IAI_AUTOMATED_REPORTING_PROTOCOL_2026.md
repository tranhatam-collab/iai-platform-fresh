# IAI_AUTOMATED_REPORTING_PROTOCOL_2026

# IAI Automated Reporting Protocol
## Version 1.0
## Status: LOCKED FOR ALL TEAMS
## Scope: *.iai.one
## Date: 2026-04-14

---

## 1. Muc tieu

Khoa co che bao cao tu dong theo nhiep co dinh de Team 1 theo doi dong bo:
- tien do
- blockers
- dependencies
- release readiness

---

## 2. Reporting cadence (bat buoc)

### Daily (every team)
- Deadline: 17:00 ICT
- File: `docs/reports/<team-code>/DAILY_<team-code>_YYYY-MM-DD.md`

### Weekly (every team)
- Deadline: Friday 16:00 ICT
- File: `docs/reports/<team-code>/WEEKLY_<team-code>_YYYY_WW.md`

### Weekly integrated (Team 1)
- Deadline: Friday 19:00 ICT
- File: `docs/reports/team1/WEEKLY_TEAM1_INTEGRATED_YYYY_WW.md`

---

## 3. Team code mapping

- Team 1 -> `team1`
- Team 2 -> `team2`
- Team 3 -> `team3`
- Team 4 -> `team4`
- Team 5 -> `team5`

---

## 4. Daily report schema (all teams)

Moi daily file bat buoc co:
1. Date
2. Team and owner
3. Yesterday completed
4. Today plan
5. Blockers
6. Dependencies needed
7. Risk level (GREEN/YELLOW/RED)
8. Release-impact flag (Y/N)

---

## 5. Weekly report schema (all teams)

Moi weekly file bat buoc co:
1. Week number
2. Goals committed vs delivered
3. KPI snapshot
4. Major blockers and resolutions
5. Carry-over items
6. Next-week plan
7. Requested decisions from Team 1

---

## 6. Team 1 auto-tracking workflow

Team 1 thuc hien hang ngay:
1. Read all team daily files
2. Update `IAI_TEAM1_LIVE_TRACKING_BOARD_2026.md`
3. Tag cross-team blockers
4. Escalate overdue dependencies > 24h
5. Run lane snapshot checker:
   - `pnpm report:lane`
   - output:
     - `docs/reports/team1/LANE_STATUS_SNAPSHOT_YYYY-MM-DD.json`
     - `docs/reports/team1/LANE_STATUS_SNAPSHOT_YYYY-MM-DD.md`

Team 1 thuc hien hang tuan:
1. Read all weekly files
2. Publish integrated weekly report
3. Run release-gate pass/fail review

---

## 7. Compliance rules

- Team nao khong nop report dung han -> status auto YELLOW.
- 2 lan tre lien tiep -> status auto RED + escalation.
- Team 1 ghi ro non-compliance vao weekly integrated report.

---

## 8. Definition of done

Protocol nay dat khi:
- tat ca team nop daily/weekly dung schema
- Team 1 co integrated report deu dan
- blocker cycle time duoc rut ngan
- release readiness minh bach theo thoi gian thuc
