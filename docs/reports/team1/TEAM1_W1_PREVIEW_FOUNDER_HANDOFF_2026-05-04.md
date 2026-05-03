# TEAM1_W1_PREVIEW_FOUNDER_HANDOFF_2026-05-04

- Date: `2026-05-04`
- Timezone: `Asia/Ho_Chi_Minh`
- Repo HEAD: `6070880`
- Status: `FOUNDER_ACTION_REQUIRED`
- Global state: `PRODUCTION_PUBLICATION_HOLD`

This handoff converts the current W1A/W1B state into a minimal founder action checklist. No code change is requested in this packet. The purpose is to get preview URLs back into Team 1 so QC can resume immediately.

---

## 1. Current truth

- `W1A` is repo-side ready for preview deploy.
- `W1B` is repo-side ready for preview deploy.
- Sequence still matters:
  1. run `W1A` preview first
  2. let Team 1 verify W1A preview
  3. then run `W1B` preview

Canonical sources:

- `home.iai.one` + `iai.one` -> legacy Next.js repo `tranhatam-collab/Home.iai.one`, Cloudflare Pages project `home-iai-one`
- `docs.iai.one` -> canonical Pages project `docs-iai-one`; exact bound GitHub repo URL still needs founder dashboard read

Authority refs:

- `docs/reports/team1/TEAM1_W1A_D8A_CLOSEOUT_PATH_B1_2026-05-02.md`
- `docs/reports/team1/TEAM1_W1B_D8B_CLOSEOUT_PATH_P1_2026-05-02.md`
- `docs/SURFACE_SOURCE_OF_TRUTH.md`

---

## 2. Founder action now — W1A preview deploy

Target:

- Cloudflare Pages project: `home-iai-one`

Action:

1. Open Cloudflare Dashboard -> Workers & Pages -> `home-iai-one`
2. Trigger a **preview deploy** for the canonical repo path currently bound to this Pages project
3. Wait until deployment status is green
4. Copy the preview URL
5. Paste the result back to Team 1

Paste-back format:

```text
W1A preview URL: <url>
W1A deploy status: green / failed
W1A dashboard deployment id: <id-if-visible>
W1A deployed commit SHA: <sha-if-visible>
```

What Team 1 will do immediately after URL arrives:

1. capture screenshot pack for `iai.one` + `home.iai.one`
2. run Lighthouse
3. capture `/health` and domain-response proof
4. update W1A evidence packet for founder approval

---

## 3. Founder action after W1A verify — W1B preview deploy

Do this only after Team 1 says W1A preview is clean.

Target:

- Cloudflare Pages project: `docs-iai-one`

Action:

1. Open Cloudflare Dashboard -> Workers & Pages -> `docs-iai-one`
2. Trigger a **preview deploy**
3. Open Settings -> Builds & deployments -> Source
4. Copy the exact bound GitHub repo URL/owner for `docs-iai-one`
5. Paste both preview URL and repo binding back to Team 1

Paste-back format:

```text
W1B preview URL: <url>
W1B deploy status: green / failed
W1B dashboard deployment id: <id-if-visible>
W1B deployed commit SHA: <sha-if-visible>
docs-iai-one bound repo URL: <github-url>
```

What Team 1 will do immediately after URL arrives:

1. capture screenshot pack for `docs.iai.one`
2. run Lighthouse
3. capture `/health` plus sitemap/robots proof
4. update `docs/SURFACE_SOURCE_OF_TRUTH.md` with the exact repo URL
5. close W1B preview packet

---

## 4. Parallel founder replies still pending

These are not required to start W1A preview, but they still block other lanes:

### D-004 — 4 team agent names

Paste-back format:

```text
D-004:
A = <name>
B-CDN = <name>
B-Flows = <name>
C = <name>
```

### D-008 — `tramsaigon.com` receivers

Paste-back format:

```text
D-008: wait / reuse / company-new
```

### D-009 — Slack/Notion connector

Paste-back format:

```text
D-009: defer / credentials
```

### payOS push

Founder-side action remains open per:

- `docs/reports/team2/TEAM2_PAYOS_BUSINESS_VERIFICATION_PUSH_2026-05-02.md`

---

## 5. Fastest route

If founder only does one thing now, do this:

1. trigger `home-iai-one` preview
2. paste preview URL back

That is the shortest path to resume execution inside Team 1.
