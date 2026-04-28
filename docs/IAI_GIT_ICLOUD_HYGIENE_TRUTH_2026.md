# IAI_GIT_ICLOUD_HYGIENE_TRUTH_2026

# IAI Git and iCloud Hygiene Truth
## Version 1.0
## Status: LOCKED - SOURCE CONTROL HYGIENE
## Scope: All active repos and worktrees
## Date: 2026-04-14

---

## 1. Purpose

This file defines non-negotiable source-control hygiene to prevent:
- corrupted git object stores
- iCloud sync conflicts in active repos
- release drift from dirty working trees

---

## 2. Core rules

### 2.1 Repo location rule
- Active repos must not run from iCloud-synced folders.
- If a repo is in an iCloud path, migrate to a non-synced workspace.

### 2.2 Worktree hygiene rule
- no production deploy from unknown dirty state
- must run `git status` and attach snapshot before deploy
- no hidden untracked release artifacts

### 2.3 Object integrity rule
- run integrity check on incident suspicion:
  - `git fsck --full`
- on corruption detection, stop release and restore from healthy remote state

---

## 3. Mandatory pre-release git checklist

Before release:
1. `git status --short` reviewed
2. branch and target release noted
3. commit hash pinned in release note
4. no unresolved conflict markers
5. no accidental large binaries in commit

---

## 4. Forbidden actions

- force push directly to protected production branches
- release from detached HEAD without documented hash
- manual file copy deployment outside tracked pipeline
- keeping critical repo only in local unsynced machine without remote backup

---

## 5. Incident handling for git/object issues

When git object or index issue occurs:
1. freeze production deploy
2. capture logs and failing command output
3. verify remote branch health
4. recover using safe path (fresh clone/worktree)
5. publish incident note in team weekly report

### 5.1 Active incident note (P0-GIT-2026-04-14)
- Symptom observed:
  - broken worktree pointer to `.../Documents/New project/...` path
  - `short read while indexing ...` on repository status scan
- Immediate action completed:
  - pointer normalization applied for `flow.iai.one.clean.latest/.git` to current workspace root
  - local Git repository restored for `iai-platform-worktree` so `git status` and `git diff` no longer resolve against the parent folder
- Mandatory recovery path:
  1. stop release from affected repo/worktree
  2. archive current dirty state if needed (`git diff`, untracked backup)
  3. fresh clone or fresh worktree from healthy remote
  4. run `git fsck --full` and `git status` in new clone
  5. only resume release when both commands are clean

---

## 6. Team responsibilities

- Team 1: enforce release hygiene gates
- Team 2: maintain runtime repo integrity for deploy-critical services
- Team 3/4/5: no release without clean-truth confirmation

---

## 7. Definition of done

Hygiene is considered in control when:
- zero releases from unverified dirty states
- zero unresolved iCloud-sync conflicts on active repos
- zero unresolved git object corruption during release windows
