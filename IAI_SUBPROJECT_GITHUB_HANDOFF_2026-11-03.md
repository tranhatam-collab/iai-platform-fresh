# IAI.ONE Subproject GitHub Handoff Registry

- **Registry status:** `SOURCE_AUDIT_HANDOFF`
- **Generated:** `2026-11-03` (`Asia/Ho_Chi_Minh`)
- **Release authority:** none
- **Clone helper:** `scripts/clone-iai-handoff-repos.sh`
- **Remote-ref verification:** completed on `2026-11-03`; the full multi-repository clone script was syntax-checked but not executed end-to-end because the umbrella repositories are large

This registry identifies the GitHub sources that an independent team can clone for development and audit on another machine. It does not claim that the branches are merged, deployed, production-ready, or complete representations of every local WIP file.

| Scope | GitHub repository | Branch | Required source snapshot SHA | Handoff status |
|---|---|---|---|---|
| IAI platform, root/app/dash/developer/docs/flow/home/mail/nft/noos/pay/verify/web/trust starter | `tranhatam-collab/iai-platform-fresh` | `OMCODE/partial-cross-machine-handoff-20261103` | `ac5015ab15385ff5d61e341aed7ad42336d9a4a7` | `PARTIAL`: source-preservation commit; later branch commits only update handoff registry/receipts. 61 readable WIP files included; 24 FileProvider-blocked paths listed in manifest |
| Legacy/parallel IAI platform | `tranhatam-collab/iai.one-platform` | `OMCODE/partial-cross-machine-handoff-20261103` | `fc5e5b2b66b5e582d2725230b1409609f5d5540c` | `PARTIAL`: eight readable WIP files included; blocked `package.json` and historical local commit are documented |
| AI Agent and AI.OMDALA source | `tranhatam-collab/AI.OMDALA.COM` | `OMCODE/go-live-security-frontend-20261013` | `84a21c2091b16ecee591f983f4e1905ee84e7ae5` | Remote source candidate; staging/runtime/approval gates remain separate |
| Computer.iai.one recovery source | `tranhatam-collab/Computer-AI` | `OMCODE/partial-cross-machine-handoff-20261103` | `d63fa1cbf3f555a9c6338623f37110ce709bcf57` | `PARTIAL`: 31 readable source/config/test/report files recovered with exact blob match; check passes, tests expose three billing-email defects |
| LifeCode comprehensive upgrade plan | `tranhatam-collab/Life-Code-OS` | `codex/complete-upgrade-plan-2026-10-20` | `a0a3bd64cc20dc07c054d4979d44dafc684ee7e0` | Planning/audit candidate; inspected local checkout is older/incomplete and misses 1,115 paths from this branch, so it was not pushed over the canonical plan |
| App standalone | `tranhatam-collab/app.iai.one` | `OMCODE/partial-cross-machine-handoff-20261103` | `d4f913dc9f8918905e7059ca5d93973c43aef19c` | `PARTIAL`: recovered the only readable source difference, Mail API configuration; local Git index history remains unavailable |
| CIOS standalone | `tranhatam-collab/cios.iai.one` | `main` | `c0b350f1c04b930bd326b8ee4e19ed220c25b022` | Canonical source baseline; typecheck/build and 42/42 tests pass, including auth-remediation contract tests. Release remains HOLD because dependency scans report critical/high findings and live deployed-SHA/secret posture was not verified |
| CIOS divergent local snapshot | `tranhatam-collab/cios.iai.one` | `OMCODE/local-divergent-snapshot-20261103` | `ccb6ff22f721a6590e10289dd7f13cc8553ee4a2` | `AUDIT_ONLY`: 31 readable local files preserved under `recovery/local-readable/` with 31/31 SHA-256 readback match; local ancestry is unverified and no file is applied to runtime paths |
| Docs standalone | `tranhatam-collab/docs.iai.one` | `main` | `611b4fe028ea61a063b1de23ba432f1838a211ec` | Remote baseline available |
| Flow standalone | `tranhatam-collab/flow.iai.one` | `OMCODE/partial-cross-machine-handoff-20261103` | `b5ca0c6ed3bfbde25713429c216f2689e967ff10` | `PARTIAL`: 24 readable tracked WIP files and three meaningful untracked files included; three FileProvider-blocked tracked files remain missing |
| Home standalone | `tranhatam-collab/Home.iai.one` | `OMCODE/partial-cross-machine-handoff-20261103` | `d3e925c1f750e2fda4ab9bdf5925842c3b5d6585` | `PARTIAL`: repository was renamed on GitHub; recovered the only readable local delta (`_redirects`), while eight tracked local paths remain FileProvider-blocked |
| NFT standalone | `tranhatam-collab/nft.iai.one` | `main` | `7de03e5909b657b60a28aea67ae6bd089326d574` | Remote main is newer than the inspected local checkout |
| NOOS standalone | `tranhatam-collab/noos.iai.one` | `main` | `d7401cfc8837ea618f72d5d25b26c85b94d864e0` | Remote baseline retained; local feature checkout has unresolved merge markers, destructive docs/redirect diffs and dataless files, so it was rejected as deployable source |
| Verify standalone | `tranhatam-collab/verify.iai.one` | `OMCODE/partial-cross-machine-handoff-20261103` | `e04b80eb60160a77ddeb0891e6a0723f5bce475c` | `PARTIAL`: 11 readable local config/view/i18n files recovered exactly; 12 tracked files remain missing and typecheck reports 13 contract errors, so this is audit source rather than a release candidate |
| Trust standalone | `tranhatam-collab/trust.iai.one` | `main` | `08e0de54e24cf500212b0b284441c2100d69191f` | Remote baseline available; monorepo trust starter must be reconciled separately |

## No independent repository found

The following local directories did not resolve to an available GitHub repository under `tranhatam-collab` during the audit:

- `academy.iai.one`
- `invest.iai.one`
- `iaiacademy.iai.one`

They currently depend on source mapping inside another umbrella repository or on local-only material. They are `BLOCKED_REPO_IDENTITY`, not completed handoffs.

## Important boundaries

1. A cloneable branch is source evidence, not deployment or runtime evidence.
2. Local dirty/untracked work is not included unless explicitly identified in a handoff manifest.
3. Do not delete the source machine or iCloud material while any repo is marked partial or blocked.
4. Run secret scanning, tests, clean-build verification, provider reconciliation, and independent review before merging or deploying.
5. For ordinary rows, the required SHA is the exact branch HEAD. For the umbrella handoff branch, it is the immutable source-preservation commit and the clone helper verifies that it remains an ancestor of the documentation-only branch HEAD.
