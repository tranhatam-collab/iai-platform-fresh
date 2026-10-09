#!/usr/bin/env bash
# Run the full lane (every suite with the private fixtures REQUIRED) on a machine that already has them,
# and print a receipt. It mirrors .github/workflows/full-lane.yml so a local run and a CI run of the same
# SHAs are comparable.
#
#   scripts/full-lane-local.sh --ref <40-hex commit of this repo> \
#       --docs-pack <dir> --docs-pack-sha <40-hex> \
#       --cios <dir> --cios-sha <40-hex> \
#       [--docs-pack-subdir <relative dir inside the docs pack>] [--receipt <file outside this repo>]
#
# - The commit under test is cloned into a throw-away directory; your working tree is never touched.
#   The commit must already exist in this clone (git fetch first).
# - The docs pack and CIOS directories must be git checkouts at EXACTLY the given SHAs with a clean tree;
#   anything else is refused, so the receipt always names what was really tested.
# - Fixtures are copied into the throw-away clone (docs pack -> docs/, CIOS -> a sibling "cios.iai.one"),
#   REQUIRE_DOCS_FIXTURES=1 is set so a missing fixture fails instead of skipping, and no Cloudflare,
#   PayOS or mail credentials are used (the Workers suite runs wrangler dev --local).
# - Test output can quote fixture content. Full logs stay in the throw-away directory (deleted on exit);
#   only counts and failing test names are printed.
# - The receipt is JSON on stdout (and --receipt FILE). It is evidence, not source: do not commit it.
set -euo pipefail

usage() { sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }
die() { echo "full-lane-local: $*" >&2; exit 1; }

ref="" docs="" docs_sha="" cios="" cios_sha="" subdir="." receipt=""
while [ $# -gt 0 ]; do
  case "$1" in
    --ref) ref="${2:-}"; shift 2 ;;
    --docs-pack) docs="${2:-}"; shift 2 ;;
    --docs-pack-sha) docs_sha="${2:-}"; shift 2 ;;
    --cios) cios="${2:-}"; shift 2 ;;
    --cios-sha) cios_sha="${2:-}"; shift 2 ;;
    --docs-pack-subdir) subdir="${2:-}"; shift 2 ;;
    --receipt) receipt="${2:-}"; shift 2 ;;
    -h | --help) usage ;;
    *) die "unknown argument: $1" ;;
  esac
done

[ -n "$ref" ] && [ -n "$docs" ] && [ -n "$docs_sha" ] && [ -n "$cios" ] && [ -n "$cios_sha" ] || usage
for pair in "ref:$ref" "docs-pack-sha:$docs_sha" "cios-sha:$cios_sha"; do
  printf '%s' "${pair#*:}" | grep -Eq '^[0-9a-f]{40}$' || die "--${pair%%:*} must be a full 40-character commit SHA, not a branch or tag"
done
case "$subdir" in /* | *..*) die "--docs-pack-subdir must be a relative path without '..'" ;; esac

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
git -C "$repo_root" cat-file -e "$ref^{commit}" 2>/dev/null || die "commit $ref is not in this clone; run git fetch first"

check_pinned() { # label dir sha
  [ -d "$2/.git" ] || [ -f "$2/.git" ] || die "$1: $2 is not a git checkout"
  [ "$(git -C "$2" rev-parse HEAD)" = "$3" ] || die "$1: $2 is at $(git -C "$2" rev-parse --short HEAD), not the pinned $3"
  [ -z "$(git -C "$2" status --porcelain)" ] || die "$1: $2 has uncommitted changes; the receipt would not describe what was tested"
}
check_pinned "docs pack" "$docs" "$docs_sha"
check_pinned "CIOS" "$cios" "$cios_sha"
[ -d "$docs/$subdir" ] || die "docs pack has no folder '$subdir'"

if [ -n "$receipt" ]; then
  case "$(cd "$(dirname "$receipt")" 2>/dev/null && pwd)/" in
    "$repo_root"/*) die "--receipt must be outside this repository (receipts are evidence, not source)" ;;
  esac
fi

work="$(mktemp -d "${TMPDIR:-/tmp}/full-lane.XXXXXX")"
trap 'rm -rf "${work:?}"' EXIT
clone="$work/iai-platform-fresh"
git clone --quiet --no-hardlinks "$repo_root" "$clone"
git -C "$clone" checkout --quiet --detach "$ref"
[ "$(git -C "$clone" rev-parse HEAD)" = "$ref" ] || die "checked out commit does not match the requested ref"

mkdir -p "$clone/docs"
cp -R "$docs/$subdir/." "$clone/docs/"
rm -rf "$clone/docs/.git"
cp -R "$cios" "$work/cios.iai.one"
rm -rf "$work/cios.iai.one/.git"
for required in \
  docs/README.md \
  docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md \
  docs/noos/NOOS_COMMERCE_FIXTURES_v0.1/catalog/product_definitions_all_v1.json; do
  [ -e "$clone/$required" ] || die "required fixture is missing after copy: $required"
done
[ -e "$work/cios.iai.one/package.json" ] || die "required fixture is missing after copy: cios.iai.one/package.json"

cd "$clone"
export REQUIRE_DOCS_FIXTURES=1
pnpm install --frozen-lockfile >"$work/install.log" 2>&1 || die "pnpm install failed (see logs only on this machine; they are deleted on exit)"

declare -a names=(quality_gate unit_integration node_e2e workers_e2e)
declare -a cmds=("pnpm quality:gate" "pnpm test" "pnpm test:e2e" "pnpm test:e2e:workers")
overall=0
results=""
for i in "${!names[@]}"; do
  name="${names[$i]}"
  log="$work/$name.log"
  status=0
  bash -c "${cmds[$i]}" >"$log" 2>&1 || status=$?
  [ "$status" -eq 0 ] || overall=1
  count() { { grep -E "^# $1 " "$log" || true; } | awk '{s+=$3} END{print s+0}'; }
  echo "== ${cmds[$i]}: exit $status | tests $(count tests) pass $(count pass) fail $(count fail) skipped $(count skipped) todo $(count todo)" >&2
  grep -E '^\s*not ok ' "$log" | head -50 >&2 || true
  results="$results${results:+,}\"$name\":{\"exit\":$status,\"tests\":$(count tests),\"pass\":$(count pass),\"fail\":$(count fail),\"skipped\":$(count skipped),\"todo\":$(count todo)}"
done

json="{\"tested_commit\":\"$ref\",\"docs_pack_sha\":\"$docs_sha\",\"cios_sha\":\"$cios_sha\",\"require_docs_fixtures\":1,\"node\":\"$(node -v)\",\"at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"result\":\"$([ $overall -eq 0 ] && echo pass || echo fail)\",\"suites\":{$results}}"
echo "$json"
if [ -n "$receipt" ]; then printf '%s\n' "$json" >"$receipt"; fi
exit $overall
