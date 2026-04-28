# TEAM_TEAM1_DOMAIN_AND_SERVICE_MAP_2026-04-26

- Team: Team 1
- Date: 2026-04-26

## Domain bảng

| Domain | Legal lane | Payment lane | Auth source | Data source | Shared core in use | Logic riêng ngoài core | Public wording sai? | Preview/simulated bị hiểu nhầm là production? |
|---|---|---|---|---|---|---|---|---|
| (internal control tower — không có domain public) | N/A | N/A | none | filesystem `docs/reports/team1/` | none | NO — pure governance | NO | NO |
| dash.iai.one (overlap Team 2) | TBD — chưa có legal lane locked | none (billing-support-only per IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN §5) | shared-iai-auth (dự kiến) | TBD | `@iai/dash-runtime` (TBD) | NO | NO | YES — Control Tower UI được spec hóa nhưng chưa có UI thật, có thể bị hiểu nhầm là live |

## Notes
- Team 1 không own domain public — chỉ governance cross-team.
- dash.iai.one ownership thuộc Team 2 runtime; Team 1 chỉ govern verdict authority.
- Lane checker output là internal artifact, không expose public URL.
- **GAP**: Legal lane cho dash.iai.one chưa định nghĩa rõ — escalate Q-OPEN mới.
