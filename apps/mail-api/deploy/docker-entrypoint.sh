#!/bin/sh
# docker-entrypoint.sh — check that the persistence directory is writable, then run the command.
#
# The container runs as the unprivileged `node` user (uid 1000) and never changes ownership of a
# mounted directory. If the evidence directory is not writable by that user, every inbound POST
# would fail later with EACCES, so refuse to start instead and say what to fix.
set -e

EVIDENCE_DIR="${PATH_B_EVIDENCE_DIR:-/var/lib/iai-mail-api}"

if [ ! -d "$EVIDENCE_DIR" ] || [ ! -w "$EVIDENCE_DIR" ]; then
  echo "{\"level\":\"error\",\"msg\":\"evidence_dir_not_writable\",\"path\":\"$EVIDENCE_DIR\",\"uid\":\"$(id -u)\",\"hint\":\"make the host directory writable by uid 1000\"}" >&2
  exit 1
fi

exec "$@"
