#!/bin/bash
set -euo pipefail

ORG="${GITHUB_ORG:-tranhatam-collab}"
TARGET_ROOT="${1:-iai-one-handoff-2026-11-03}"

mkdir -p "$TARGET_ROOT"

clone_exact() {
  local repo="$1"
  local branch="$2"
  local expected_sha="$3"
  local directory="$4"

  if [[ -e "$TARGET_ROOT/$directory" ]]; then
    echo "[handoff] ERROR: target already exists: $TARGET_ROOT/$directory" >&2
    return 1
  fi

  git clone --branch "$branch" --single-branch "git@github.com:${ORG}/${repo}.git" "$TARGET_ROOT/$directory"
  local actual_sha
  actual_sha="$(git -C "$TARGET_ROOT/$directory" rev-parse HEAD)"
  if [[ "$actual_sha" != "$expected_sha" ]]; then
    echo "[handoff] ERROR: $repo expected $expected_sha but cloned $actual_sha" >&2
    return 1
  fi
  test -z "$(git -C "$TARGET_ROOT/$directory" status --porcelain)"
  echo "[handoff] PASS: $repo $branch $actual_sha"
}

clone_exact "iai-platform-fresh" "OMCODE/partial-cross-machine-handoff-20261103" "ac5015ab15385ff5d61e341aed7ad42336d9a4a7" "iai-platform-fresh"
clone_exact "iai.one-platform" "OMCODE/partial-cross-machine-handoff-20261103" "fc5e5b2b66b5e582d2725230b1409609f5d5540c" "iai.one-platform"
clone_exact "AI.OMDALA.COM" "OMCODE/go-live-security-frontend-20261013" "84a21c2091b16ecee591f983f4e1905ee84e7ae5" "AI.OMDALA.COM"
clone_exact "Computer-AI" "wip/rescue-20261027-main" "1558cc9df3e7b8470432cd8d26753bb35331c20b" "Computer.iai.one"
clone_exact "Life-Code-OS" "codex/complete-upgrade-plan-2026-10-20" "a0a3bd64cc20dc07c054d4979d44dafc684ee7e0" "Life-Code-OS"
clone_exact "app.iai.one" "main" "c71b39756eabaa7364bc5f8dd69cd492cdd218d6" "app.iai.one"
clone_exact "cios.iai.one" "main" "c0b350f1c04b930bd326b8ee4e19ed220c25b022" "cios.iai.one"
clone_exact "docs.iai.one" "main" "611b4fe028ea61a063b1de23ba432f1838a211ec" "docs.iai.one"
clone_exact "flow.iai.one" "main" "fbd3c36ec88bd2b5aeb8e9b3cb64c9f7da24ccb2" "flow.iai.one"
clone_exact "home.iai.one" "main" "9e46cf8af5c9d6b3cb457ec081ee8556968ccc4b" "home.iai.one"
clone_exact "nft.iai.one" "main" "7de03e5909b657b60a28aea67ae6bd089326d574" "nft.iai.one"
clone_exact "noos.iai.one" "main" "d7401cfc8837ea618f72d5d25b26c85b94d864e0" "noos.iai.one"
clone_exact "verify.iai.one" "main" "67adbe1b552051bccfa6f557d4add4ad16e08ba0" "verify.iai.one"
clone_exact "trust.iai.one" "main" "08e0de54e24cf500212b0b284441c2100d69191f" "trust.iai.one"

echo "[handoff] Source clone set complete. Read each repository handoff and run its own validation before development or deployment."
