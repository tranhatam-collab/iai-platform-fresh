#!/bin/sh
# docker-entrypoint.sh — fix volume ownership before dropping to node user.
#
# When the host bind-mount /var/lib/iai-mail-api is owned by root:root
# (typical fresh deploy), the in-container `node` user (uid 1000) cannot
# write the evidence NDJSON, causing FileEvidenceSink#recordEvidence to
# throw EACCES on every inbound POST.
#
# This entrypoint runs as root, chowns the persistence dir to node:node,
# then exec's the application as node via `su-exec`.
#
# Side effect: the container ENTRYPOINT runs as root briefly, but the
# main process drops to uid 1000 immediately. Net security posture is
# the same as if the deploy operator had pre-chowned the host dir, just
# self-healing.
set -e

EVIDENCE_DIR="${PATH_B_EVIDENCE_DIR:-/var/lib/iai-mail-api}"

if [ -d "$EVIDENCE_DIR" ]; then
  chown -R node:node "$EVIDENCE_DIR" 2>/dev/null || \
    echo "{\"level\":\"warn\",\"msg\":\"chown_evidence_dir_failed\",\"path\":\"$EVIDENCE_DIR\"}"
fi

# su-exec is in node:22-alpine via the apk add below. Drop to node user.
exec su-exec node:node "$@"
