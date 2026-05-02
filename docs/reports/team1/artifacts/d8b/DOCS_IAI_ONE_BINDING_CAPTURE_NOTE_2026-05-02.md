DOCS_IAI_ONE_BINDING_CAPTURE_NOTE_2026-05-02

Goal: identify the GitHub repo currently bound to Cloudflare Pages project `docs-iai-one`.

CLI verification today (2026-05-02):
- `wrangler pages project list --json` returns `Git Provider: Yes` for `docs-iai-one` but does NOT include the repo URL/owner.
- `wrangler pages deployment list --project-name docs-iai-one --json` returns commit SHAs (e.g. `ea02ab5`, `790025d`, `6f673f6`, `9ee82d1`) but no repo identification.
- `git cat-file -e <sha>^{commit}` confirms these SHAs do NOT exist in the `iai-platform-fresh` monorepo.

Conclusion: the canonical repo for `docs-iai-one` cannot be captured via wrangler CLI alone. Founder must read the binding from Cloudflare Pages dashboard:

  Cloudflare Dashboard
    -> Workers & Pages
    -> docs-iai-one
    -> Settings
    -> Builds & deployments
    -> Source -> Git repository

Once captured, the URL/owner should be appended below as the canonical source.

---

CAPTURED BINDING:

(pending founder dashboard read)

---

Next step: when founder pastes the repo URL, update `docs/SURFACE_SOURCE_OF_TRUTH.md` §1 row `docs.iai.one` Canonical repo column from "TBD" to the real URL, and update `apps/docs/STATUS.md` reference.
