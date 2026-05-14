#!/usr/bin/env bash
set -u

ROOT="/Users/tranhatam/Documents/New project/iai-platform-worktree"
DATE_ARG="$(date +%F)"
INTERVAL_SEC=600
MAX_RUNS=0

for arg in "$@"; do
  case "$arg" in
    --date=*) DATE_ARG="${arg#--date=}" ;;
    --interval=*) INTERVAL_SEC="${arg#--interval=}" ;;
    --max-runs=*) MAX_RUNS="${arg#--max-runs=}" ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

if ! [[ "$INTERVAL_SEC" =~ ^[0-9]+$ ]] || [ "$INTERVAL_SEC" -lt 10 ]; then
  echo "Invalid --interval. Use seconds >= 10." >&2
  exit 2
fi

if ! [[ "$MAX_RUNS" =~ ^[0-9]+$ ]]; then
  echo "Invalid --max-runs. Use 0 (unlimited) or a positive integer." >&2
  exit 2
fi

cd "$ROOT" || exit 1

RUN=0
while true; do
  RUN=$((RUN + 1))
  NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  printf "\n===== EMAIL CLOSEOUT AUTOLOOP RUN %s @ %s =====\n" "$RUN" "$NOW"

  bash scripts/email-closeout-rerun-bundle.sh --date="$DATE_ARG"
  STATUS=$?

  if [ "$STATUS" -eq 0 ]; then
    echo "AUTOLOOP_DONE: closeout bundle PASS."
    exit 0
  fi

  if [ "$MAX_RUNS" -gt 0 ] && [ "$RUN" -ge "$MAX_RUNS" ]; then
    echo "AUTOLOOP_STOP: reached --max-runs=$MAX_RUNS with blockers still present."
    exit 1
  fi

  echo "AUTOLOOP_WAIT: blockers still present, sleeping ${INTERVAL_SEC}s."
  sleep "$INTERVAL_SEC"
done
