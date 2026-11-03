# IAI.ONE Subproject GitHub Handoff Registry

- **Registry status:** `SOURCE_AUDIT_HANDOFF`
- **Generated:** `2026-11-03` (`Asia/Ho_Chi_Minh`)
- **Release authority:** none
- **Clone helper:** `scripts/clone-iai-handoff-repos.sh`
- **Remote-ref verification:** completed on `2026-11-03`; the full multi-repository clone script was syntax-checked but not executed end-to-end because the umbrella repositories are large

This registry identifies the GitHub sources that an independent team can clone for development and audit on another machine. It does not claim that the branches are merged, deployed, production-ready, or complete representations of every local WIP file.

| Scope | GitHub repository | Branch | Exact SHA | Handoff status |
|---|---|---|---|---|
| IAI platform, root/app/dash/developer/docs/flow/home/mail/nft/noos/pay/verify/web/trust starter | `tranhatam-collab/iai-platform-fresh` | `OMCODE/partial-cross-machine-handoff-20261103` | `ac5015ab15385ff5d61e341aed7ad42336d9a4a7` | `PARTIAL`: 61 readable WIP files included; 24 FileProvider-blocked paths listed in manifest |
| Legacy/parallel IAI platform | `tranhatam-collab/iai.one-platform` | `OMCODE/partial-cross-machine-handoff-20261103` | `fc5e5b2b66b5e582d2725230b1409609f5d5540c` | `PARTIAL`: eight readable WIP files included; blocked `package.json` and historical local commit are documented |
| AI Agent and AI.OMDALA source | `tranhatam-collab/AI.OMDALA.COM` | `OMCODE/go-live-security-frontend-20261013` | `84a21c2091b16ecee591f983f4e1905ee84e7ae5` | Remote source candidate; staging/runtime/approval gates remain separate |
| Computer.iai.one recovery source | `tranhatam-collab/Computer-AI` | `wip/rescue-20261027-main` | `1558cc9df3e7b8470432cd8d26753bb35331c20b` | Matches local committed HEAD; local missing index/untracked state is not included |
| LifeCode comprehensive upgrade plan | `tranhatam-collab/Life-Code-OS` | `codex/complete-upgrade-plan-2026-10-20` | `a0a3bd64cc20dc07c054d4979d44dafc684ee7e0` | Planning/audit candidate; production source and local phase WIP require separate reconciliation |
| App standalone | `tranhatam-collab/app.iai.one` | `main` | `c71b39756eabaa7364bc5f8dd69cd492cdd218d6` | Remote baseline; local index is missing |
| CIOS standalone | `tranhatam-collab/cios.iai.one` | `main` | `c0b350f1c04b930bd326b8ee4e19ed220c25b022` | Source available; release remains security HOLD pending auth remediation evidence |
| Docs standalone | `tranhatam-collab/docs.iai.one` | `main` | `611b4fe028ea61a063b1de23ba432f1838a211ec` | Remote baseline available |
| Flow standalone | `tranhatam-collab/flow.iai.one` | `main` | `fbd3c36ec88bd2b5aeb8e9b3cb64c9f7da24ccb2` | Remote baseline available; local untracked files are not included |
| Home standalone | `tranhatam-collab/home.iai.one` | `main` | `9e46cf8af5c9d6b3cb457ec081ee8556968ccc4b` | Remote baseline available; local untracked files are not included |
| NFT standalone | `tranhatam-collab/nft.iai.one` | `main` | `7de03e5909b657b60a28aea67ae6bd089326d574` | Remote main is newer than the inspected local checkout |
| NOOS standalone | `tranhatam-collab/noos.iai.one` | `main` | `d7401cfc8837ea618f72d5d25b26c85b94d864e0` | Remote baseline; local origin points to a corrupt archive and local WIP is unresolved |
| Verify standalone | `tranhatam-collab/verify.iai.one` | `main` | `67adbe1b552051bccfa6f557d4add4ad16e08ba0` | Remote baseline; local untracked files are not included |
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
5. Exact SHAs in this file must be rechecked if any branch is updated.
