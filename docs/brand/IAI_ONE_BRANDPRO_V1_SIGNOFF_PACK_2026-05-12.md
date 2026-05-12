# IAI Brandpro v1.0 Sign-off Pack

Date: 2026-05-12
Status: `TEAM1_GATE_REVIEW_COMPLETE`
Brandpro v1.0 ratified: `NO`
Authority: Team 1 governance / brand / release gate

## 1. Team 1 verdict

Brandpro IAI cannot be promoted from draft to `v1.0` today.

Reason:
- `home.iai.one` and `flow.iai.one` do not have merged PRs yet.
- live verification on 5 target surfaces still shows residual bare `VI/EN` labels on public pages.
- `iaifoundation.com` branch owner fix is now committed and pushed, but the public surface has not yet converged to the required full bilingual labels.

This means the correct Team 1 state is:
- `Brandpro v1.0 ratified`: `NO`
- `Master Spec 2 compliance across 5 live surfaces`: `NO`
- `Ready for re-review after deploy`: `YES`

## 2. PR status for Wave 1 surfaces

### home.iai.one
- Repository: `tranhatam-collab/home.iai.one`
- Branch: `claude/ui-lang-switch-bilingual`
- Head commit: `c08da56d02bd2c4ae45e9f02150d1e5824f80dfb`
- Base branch current remote SHA: `f1da67bc0bdcc7dc505938ee7311af5d52d3c21f`
- Compare URL: `https://github.com/tranhatam-collab/home.iai.one/compare/main...claude/ui-lang-switch-bilingual?expand=1`
- GitHub integration result: `FAILED_403_RESOURCE_NOT_ACCESSIBLE_BY_INTEGRATION`
- Merge status: `NOT_MERGED`

### flow.iai.one
- Repository: `tranhatam-collab/flow.iai.one`
- Branch: `claude/ui-lang-switch-bilingual`
- Head commit: `02f135a6061c50bbf8412ba924417b112bc48ad6`
- Base branch current remote SHA: `8251a79c11697a5c2bfffcfdde011e74db58db8a`
- Compare URL: `https://github.com/tranhatam-collab/flow.iai.one/compare/main...claude/ui-lang-switch-bilingual?expand=1`
- GitHub integration result: `FAILED_404_NOT_FOUND`
- Merge status: `NOT_MERGED`

## 3. nft + cios commit state

### nft.iai.one
- Commit hash: `826e012d3bf0485555192ff258ee128f003265e2`
- Commit message: `fix(nft): remove redundant lang-button-code span from all surfaces`
- Scope: removed redundant `lang-button-code` span from 6 NFT surfaces

### cios.iai.one
- Commit hash: `a557abe6`
- State: current `HEAD` in parent repo already contains the full bilingual toggle labels and bilingual aria-label logic for the 5 CIOS files named in the handoff.
- Team 1 note: there is no separate pending CIOS delta left to commit from the handoff scope in the parent repo at the time of this review.

## 4. iaifoundation.com branch owner confirmation

- Repository: `tranhatam-collab/iaifoundation.com`
- Branch: `brand/v2.0-intent-sovereign`
- Commit hash: `ef4ea34`
- Commit message: `ui(lang-switch): add foundation static builder with full bilingual labels`
- Push status: `PUSHED`

This confirms the branch owner lane now has the residual builder fix committed and pushed.

## 5. Release gate conclusion

Team 1 cannot sign off `Brandpro v1.0` until all 5 public surfaces verify clean on live output.

Required next action:
1. Open and merge the `home` PR from the compare URL.
2. Open and merge the `flow` PR from the compare URL.
3. Deploy or promote the latest NFT / CIOS / Foundation changes if their delivery path requires a branch push or downstream build trigger.
4. Re-run the live verification report in this folder.

## 6. Summary answers

| Question | Answer |
|---|---|
| Brandpro v1.0 ratified | `NO` |
| home PR link | `https://github.com/tranhatam-collab/home.iai.one/compare/main...claude/ui-lang-switch-bilingual?expand=1` |
| flow PR link | `https://github.com/tranhatam-collab/flow.iai.one/compare/main...claude/ui-lang-switch-bilingual?expand=1` |
| nft commit hash | `826e012d3bf0485555192ff258ee128f003265e2` |
| cios commit hash | `a557abe6` |
| iaifoundation branch owner commit | `ef4ea34` |
| Live verification report | `docs/brand/IAI_ONE_BRAND_LIVE_VERIFICATION_REPORT_5_SURFACES_2026-05-12.md` |
