# NEXT_VS_NODE_DRIFT_2026-05-02

- Date: `2026-05-02`
- Scope: `iai.one` + `home.iai.one` live runtime vs monorepo `apps/root` + `apps/home`
- Status: `DRIFT_CONFIRMED`

## 1. What was verified

1. Monorepo `apps/home` and `apps/root` are Node TypeScript servers (`node:http`, `createServer`, `server.listen`), not Next.js apps.
2. Neither `apps/home` nor `apps/root` contains Pages/Wrangler deploy config for a Next.js pipeline.
3. Live HTML for both `https://home.iai.one` and `https://iai.one` includes `/_next/static/...` assets and Next.js runtime chunks.
4. Cloudflare Pages `home-iai-one` deployment source chain is tied to legacy commit lineage (not monorepo `iai-platform-fresh`).

Conclusion: this is not a simple "switch Pages source" task. It is a two-codebase technology drift.

---

## 2. Decision options

### A) Pause D8a and publish drift audit (recommended)
- Do not force infrastructure change while architecture mismatch is unresolved.
- Keep W1A preview deploy blocked by D8a.
- Use this packet as mandatory decision gate.

### B) Import Next.js source into monorepo
- Create/bring in `root-next` + `home-next` code path into monorepo.
- Larger migration, multi-day scope, boundary expansion.

### C) Replace live Next.js with monorepo Node servers
- Fastest infra unification path.
- Highest UX regression risk without founder pre-approval.

### D) Accept multi-source permanently
- Operationally convenient short term.
- Weakens source-of-truth discipline and increases long-term drift risk.

---

## 3. Recommendation

Recommend **A now**.

Reason:
1. Safest under current production hold.
2. Preserves audit integrity.
3. Prevents accidental runtime replacement before founder architecture decision.

---

## 4. Required founder decision after A

Pick one architecture target:
1. **Next.js canonical**: migrate canonical source to monorepo (or formally keep separate with strict contract + ownership + release process).
2. **Node server canonical**: plan controlled cutover from live Next.js to monorepo Node servers with preview UX sign-off.

No D8a closeout should be marked `DONE` before this decision is explicit.

---

## 5. Evidence pointers

- Monorepo server runtime:
  - `apps/home/src/server.ts`
  - `apps/home/src/index.ts`
  - `apps/root/src/server.ts`
  - `apps/root/src/index.ts`
- Live Next.js signatures captured in session:
  - `/private/tmp/home-live-2026-05-02.html`
  - `/private/tmp/root-live-2026-05-02.html`
- D8a packet:
  - `docs/reports/team1/TEAM1_W1A_D8A_EXECUTION_PACKET_2026-05-02.md`
