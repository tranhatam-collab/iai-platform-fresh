#!/usr/bin/env bash
set -u

ROOT="/Users/tranhatam/Documents/New project/iai-platform-worktree"
DATE="2026-05-13"

for arg in "$@"; do
  case "$arg" in
    --date=*) DATE="${arg#--date=}" ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

REPORT_DIR="$ROOT/docs/reports/team1"
STAMP="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$REPORT_DIR/EMAIL_CLOSEOUT_RERUN_${DATE}_${STAMP}.log"
SUMMARY_FILE="$REPORT_DIR/EMAIL_CLOSEOUT_RERUN_SUMMARY_${DATE}_${STAMP}.md"

mkdir -p "$REPORT_DIR"
cd "$ROOT" || exit 1

cat > "$SUMMARY_FILE" <<EOF
# Email Closeout Rerun Summary — $DATE

- Generated at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Root: \`$ROOT\`
- Log: \`$LOG_FILE\`

| Step | Result | Command |
|---|---:|---|
EOF

failures=0

run_step() {
  local label="$1"
  shift
  local step_log="$REPORT_DIR/.EMAIL_CLOSEOUT_STEP_${DATE}_${STAMP}.log"

  printf '\n===== %s =====\n' "$label" | tee -a "$LOG_FILE"
  printf 'Command: %s\n' "$*" | tee -a "$LOG_FILE"

  : > "$step_log"
  "$@" 2>&1 | tee "$step_log" | tee -a "$LOG_FILE"
  local status=${PIPESTATUS[0]}
  local verdict_status="$status"
  local verdict_reason="exit=$status"

  if grep -Eq "(Wave 1 closeout ready: FAIL|EXT-MAIL-01 ready: FAIL|Status: BLOCKED|BLOCKED_|Activation evidence complete: FAIL|Ready: FAIL|ready: FAIL|closeout ready: FAIL|Overall checker pass: FAIL)" "$step_log"; then
    verdict_status=1
    verdict_reason="report_blocked"
  fi

  if [ "$verdict_status" -eq 0 ]; then
    printf '| %s | PASS | `%s` |\n' "$label" "$*" >> "$SUMMARY_FILE"
  else
    printf '| %s | FAIL (%s) | `%s` |\n' "$label" "$verdict_reason" "$*" >> "$SUMMARY_FILE"
    failures=$((failures + 1))
  fi

  rm -f "$step_log"
}

run_step "Wave 1 SMTP evidence" \
  pnpm report:team-email-smtp-evidence -- --date="$DATE"

run_step "Tramsaigon EXT-MAIL-01" \
  pnpm report:tramsaigon-ext-mail-01 -- --date="$DATE"

run_step "Tramsaigon EXT-PAY-04" \
  pnpm report:ext-pay-04:tramsaigon -- --date="$DATE"

run_step "Tramsaigon pay closeout" \
  pnpm report:tramsaigon-pay-closeout -- --date="$DATE"

run_step "Tranhatam Team D evidence" \
  node scripts/pay-team-d-tranhatam-evidence-check.mjs --date="$DATE"

run_step "All teams completion status" \
  node scripts/team1-all-teams-completion-status-check.mjs --date="$DATE"

cat >> "$SUMMARY_FILE" <<EOF

## Final Result

- Failed steps: \`$failures\`
- Completion report should be read from the last \`team1-all-teams-completion-status-check\` output and generated artifact.

EOF

printf '\nSummary: %s\n' "$SUMMARY_FILE"
printf 'Log: %s\n' "$LOG_FILE"

if [ "$failures" -eq 0 ]; then
  printf 'EMAIL_CLOSEOUT_RERUN_PASS\n'
  exit 0
fi

printf 'EMAIL_CLOSEOUT_RERUN_HAS_BLOCKERS failures=%s\n' "$failures"
exit 1
