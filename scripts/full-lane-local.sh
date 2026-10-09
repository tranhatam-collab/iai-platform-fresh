#!/usr/bin/env bash
# Run the full lane (every suite with the private fixtures REQUIRED) on a machine that already has them,
# and print a receipt. It mirrors .github/workflows/full-lane.yml so a local run and a CI run of the same
# SHAs are comparable.
#
#   scripts/full-lane-local.sh --ref <40-hex commit of this repo> \
#       --docs-pack <dir> --docs-pack-sha <40-hex> \
#       --cios <dir> --cios-sha <40-hex> \
#       [--allowlist <json file outside this repo>] \
#       [--docs-pack-subdir <relative dir inside the docs pack>] [--receipt <file outside this repo>]
#
#   scripts/full-lane-local.sh --diagnostic --ref <40-hex commit>
#       Runs WITHOUT fixtures and compares the totals with the known baseline of that commit (below).
#
# - The commit under test is cloned into a throw-away directory; your working tree is never touched.
#   The commit must already exist in this clone (git fetch first).
# - Full mode: the docs pack and CIOS directories must be git checkouts at EXACTLY the given SHAs with a clean
#   tree. Fixtures are copied into the throw-away clone and REQUIRE_DOCS_FIXTURES=1 is set.
# - The lane is RED when: any suite exits non-zero; fail or cancelled is above 0; a skipped or todo test is not
#   named in the allowlist (with no allowlist, every skip and todo is a violation); a plain "SKIP ..." line is
#   printed by a check script; or a required suite (unit, node e2e, workers e2e) ran 0 tests.
# - The allowlist is a JSON file kept OUTSIDE the repository: {"skip":["exact test title",...],"todo":[...]}.
#   This script and the repository contain no test names.
# - The tested commit (including dependency install scripts) runs under env -i with only PATH, TMPDIR, LANG,
#   LC_ALL, REQUIRE_DOCS_FIXTURES, the proxy/CA settings (HTTP(S)_PROXY, NO_PROXY, SSL_CERT_FILE,
#   NODE_EXTRA_CA_CERTS; only if set) and a throw-away HOME inside the work directory, so tokens and dotfiles
#   of your shell are not passed on. This is NOT a sandbox: network and filesystem access are unchanged.
# - No Cloudflare, PayOS or mail credentials are used (the Workers suite runs wrangler dev --local).
# - Test output can quote fixture content. Full logs stay in the throw-away directory (deleted on exit); only
#   counts and the names of failing or violating tests are printed.
# - The receipt is JSON on stdout (and --receipt FILE). It is evidence, not source: do not commit it.
set -euo pipefail

usage() { sed -n '2,31p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }
die() { echo "full-lane-local: $*" >&2; exit 1; }

ref="" docs="" docs_sha="" cios="" cios_sha="" subdir="." receipt="" allowlist="" diagnostic=0
while [ $# -gt 0 ]; do
  case "$1" in
    --ref) ref="${2:-}"; shift 2 ;;
    --docs-pack) docs="${2:-}"; shift 2 ;;
    --docs-pack-sha) docs_sha="${2:-}"; shift 2 ;;
    --cios) cios="${2:-}"; shift 2 ;;
    --cios-sha) cios_sha="${2:-}"; shift 2 ;;
    --docs-pack-subdir) subdir="${2:-}"; shift 2 ;;
    --receipt) receipt="${2:-}"; shift 2 ;;
    --allowlist) allowlist="${2:-}"; shift 2 ;;
    --diagnostic) diagnostic=1; shift ;;
    -h | --help) usage ;;
    *) die "unknown argument: $1" ;;
  esac
done

[ -n "$ref" ] || usage
printf '%s' "$ref" | grep -Eq '^[0-9a-f]{40}$' || die "--ref must be a full 40-character commit SHA, not a branch or tag"
if [ "$diagnostic" -eq 1 ]; then
  [ -z "$docs$docs_sha$cios$cios_sha$allowlist" ] || die "--diagnostic runs without fixtures; do not pass --docs-pack, --cios or --allowlist"
else
  [ -n "$docs" ] && [ -n "$docs_sha" ] && [ -n "$cios" ] && [ -n "$cios_sha" ] || usage
  for pair in "docs-pack-sha:$docs_sha" "cios-sha:$cios_sha"; do
    printf '%s' "${pair#*:}" | grep -Eq '^[0-9a-f]{40}$' || die "--${pair%%:*} must be a full 40-character commit SHA, not a branch or tag"
  done
  case "$subdir" in /* | *..*) die "--docs-pack-subdir must be a relative path without '..'" ;; esac
fi

repo_root="$(cd "$(dirname "$0")/.." && pwd -P)"
outside_repo() { # label path: the parent directory must exist and, with symlinks resolved, be outside the repo
  local parent
  parent="$(cd "$(dirname "$2")" 2>/dev/null && pwd -P)" || die "$1: the directory of $2 does not exist"
  case "$parent/" in
    "$repo_root"/*) die "$1 must be outside this repository" ;;
  esac
}
[ -z "$receipt" ] || outside_repo "--receipt (receipts are evidence, not source)" "$receipt"
[ -z "$receipt" ] || [ -w "$(dirname "$receipt")" ] || die "--receipt: the directory of $receipt is not writable"
if [ -n "$allowlist" ]; then
  [ -f "$allowlist" ] || die "--allowlist file not found"
  outside_repo "--allowlist (the repository must not contain test names)" "$allowlist"
  node -e 'const a=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));for(const k of ["skip","todo"])if(a[k]!==undefined&&!(Array.isArray(a[k])&&a[k].every(x=>typeof x==="string")))process.exit(1)' "$allowlist" \
    || die "--allowlist must be JSON like {\"skip\":[\"title\"],\"todo\":[\"title\"]}"
fi
git -C "$repo_root" cat-file -e "$ref^{commit}" 2>/dev/null || die "commit $ref is not in this clone; run git fetch first"

check_pinned() { # label dir sha
  [ -d "$2/.git" ] || [ -f "$2/.git" ] || die "$1: $2 is not a git checkout"
  [ "$(git -C "$2" rev-parse HEAD)" = "$3" ] || die "$1: $2 is at $(git -C "$2" rev-parse --short HEAD), not the pinned $3"
  [ -z "$(git -C "$2" status --porcelain)" ] || die "$1: $2 has uncommitted changes; the receipt would not describe what was tested"
}
if [ "$diagnostic" -eq 0 ]; then
  check_pinned "docs pack" "$docs" "$docs_sha"
  check_pinned "CIOS" "$cios" "$cios_sha"
  [ -d "$docs/$subdir" ] || die "docs pack has no folder '$subdir'"
fi

work="$(mktemp -d "${TMPDIR:-/tmp}/full-lane.XXXXXX")"
trap 'rm -rf "${work:?}"' EXIT
clone="$work/iai-platform-fresh"
git clone --quiet --no-hardlinks "$repo_root" "$clone"
git -C "$clone" checkout --quiet --detach "$ref"
[ "$(git -C "$clone" rev-parse HEAD)" = "$ref" ] || die "checked out commit does not match the requested ref"

if [ "$diagnostic" -eq 0 ]; then
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
  export REQUIRE_DOCS_FIXTURES=1
else
  unset REQUIRE_DOCS_FIXTURES
fi

# Reads one suite log and prints a JSON summary. TAP totals are summed over every "# <counter> N" line that is not
# indented (one block per node --test run); skipped/todo titles come from the "# SKIP" / "# TODO" directives.
cat >"$work/analyze.mjs" <<'NODE'
import { readFileSync } from "node:fs";
const [log, allowlistPath, mode, required, exitCode] = process.argv.slice(2);
const text = readFileSync(log, "utf8");
const sum = (name) => text.split("\n").filter((l) => l.startsWith(`# ${name} `)).reduce((n, l) => n + (Number(l.split(" ")[2]) || 0), 0);
const counts = Object.fromEntries(["tests", "pass", "fail", "cancelled", "skipped", "todo"].map((k) => [k, sum(k)]));
const names = { SKIP: [], TODO: [] };
for (const l of text.split("\n")) {
  const m = l.match(/^\s*(?:not )?ok \d+ - (.*?) # (SKIP|TODO)\b/);
  if (m) names[m[2]].push(m[1].trim());
}
const plainSkipLines = text.split("\n").filter((l) => /^SKIP\b/.test(l)).length;
const allow = allowlistPath ? JSON.parse(readFileSync(allowlistPath, "utf8")) : {};
const allowed = { SKIP: new Set(allow.skip ?? []), TODO: new Set(allow.todo ?? []) };
const violations = [];
if (Number(exitCode) !== 0) violations.push(`suite exited ${exitCode}`);
if (counts.fail > 0) violations.push(`${counts.fail} failing`);
if (counts.cancelled > 0) violations.push(`${counts.cancelled} cancelled`);
if (required === "1" && counts.tests === 0) violations.push("required suite ran 0 tests");
const unlisted = [];
if (mode === "full") {
  for (const kind of ["SKIP", "TODO"]) {
    for (const n of names[kind]) if (!allowed[kind].has(n)) unlisted.push(`${kind}: ${n}`);
  }
  if (unlisted.length) violations.push(`${unlisted.length} skip/todo not in the allowlist`);
  if (plainSkipLines > 0) violations.push(`${plainSkipLines} plain 'SKIP ...' line(s) printed by a check script`);
}
console.log(JSON.stringify({ counts, skipTitles: names.SKIP.length, todoTitles: names.TODO.length, plainSkipLines, unlisted, violations }));
NODE

cd "$clone"
mkdir -p "$work/home" "$work/tmp"
run_scrubbed() { # command words run with a minimal environment
  local -a keep=() # network settings only, so installs still work behind a proxy
  local v
  for v in HTTP_PROXY HTTPS_PROXY NO_PROXY http_proxy https_proxy no_proxy SSL_CERT_FILE NODE_EXTRA_CA_CERTS; do
    [ -z "${!v:-}" ] || keep+=("$v=${!v}")
  done
  env -i PATH="$PATH" HOME="$work/home" TMPDIR="$work/tmp" LANG="${LANG:-C.UTF-8}" LC_ALL="${LC_ALL:-C.UTF-8}" \
    ${REQUIRE_DOCS_FIXTURES:+REQUIRE_DOCS_FIXTURES="$REQUIRE_DOCS_FIXTURES"} ${keep[@]+"${keep[@]}"} "$@"
}
run_scrubbed pnpm install --frozen-lockfile >"$work/install.log" 2>&1 || die "pnpm install failed (logs stay on this machine and are deleted on exit)"

# Known totals per commit for --diagnostic (counts only, no names): "<suite> tests pass fail skipped todo plainSkip".
baseline_for() {
  case "$1" in
    472b4b564b14dca1832b576844fd25c3af9da334)
      cat <<'B'
unit_integration 453 434 0 19 0 1
node_e2e 299 290 0 1 8 0
workers_e2e 109 104 0 0 5 0
B
      ;;
  esac
}

declare -a names=(quality_gate unit_integration node_e2e workers_e2e)
declare -a cmds=("pnpm quality:gate" "pnpm test" "pnpm test:e2e" "pnpm test:e2e:workers")
declare -a required=(0 1 1 1)
mode=full; [ "$diagnostic" -eq 1 ] && mode=diagnostic
overall=0
results=""
for i in "${!names[@]}"; do
  name="${names[$i]}"
  log="$work/$name.log"
  status=0
  run_scrubbed bash -c "${cmds[$i]}" >"$log" 2>&1 || status=$?
  summary="$(node "$work/analyze.mjs" "$log" "$allowlist" "$mode" "${required[$i]}" "$status")"
  line="$(node -e '
    const s=JSON.parse(process.argv[1]);const c=s.counts;
    console.log(`tests ${c.tests} pass ${c.pass} fail ${c.fail} cancelled ${c.cancelled} skipped ${c.skipped} todo ${c.todo} plain-SKIP-lines ${s.plainSkipLines}`)' "$summary")"
  echo "== ${cmds[$i]}: exit $status | $line" >&2
  grep -E '^\s*not ok ' "$log" | grep -vE '# TODO' | head -50 >&2 || true
  node -e 'const s=JSON.parse(process.argv[1]);for(const u of s.unlisted.slice(0,50))console.error("   NOT ALLOWED  "+u);for(const v of s.violations)console.error("   RED  "+v)' "$summary"
  suite_red="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).violations.length?"1":"0")' "$summary")"
  if [ "$mode" = "diagnostic" ]; then
    expected="$(baseline_for "$ref" | awk -v n="$name" '$1==n')"
    if [ -n "$expected" ]; then
      actual="$(node -e 'const s=JSON.parse(process.argv[1]);const c=s.counts;console.log([process.argv[2],c.tests,c.pass,c.fail,c.skipped,c.todo,s.plainSkipLines].join(" "))' "$summary" "$name")"
      if [ "$actual" != "$expected" ]; then
        echo "   RED  baseline mismatch for $name: expected [$expected] got [$actual]" >&2
        suite_red=1
      fi
    fi
  fi
  [ "$suite_red" -eq 0 ] || overall=1
  results="$results${results:+,}\"$name\":{\"exit\":$status,\"red\":$suite_red,\"summary\":$summary}"
done
if [ "$mode" = "diagnostic" ] && [ -z "$(baseline_for "$ref")" ]; then
  echo "   NOTE  no recorded baseline for this commit; counts are printed but not compared" >&2
fi

json="{\"mode\":\"$mode\",\"tested_commit\":\"$ref\",\"docs_pack_sha\":\"${docs_sha:-}\",\"cios_sha\":\"${cios_sha:-}\",\"require_docs_fixtures\":$([ "$diagnostic" -eq 1 ] && echo 0 || echo 1),\"allowlist\":$([ -n "$allowlist" ] && echo true || echo false),\"node\":\"$(node -v)\",\"at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"result\":\"$([ $overall -eq 0 ] && echo pass || echo fail)\",\"suites\":{$results}}"
echo "$json"
if [ -n "$receipt" ]; then printf '%s\n' "$json" >"$receipt"; fi
exit $overall
