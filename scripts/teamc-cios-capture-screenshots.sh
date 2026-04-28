#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CIOS_ROOT="${CIOS_ROOT:-$(cd "${ROOT_DIR}/.." && pwd)/cios.iai.one}"
OUTPUT_DIR="${ROOT_DIR}/docs/release-evidence/cios.iai.one/artifacts/screenshots"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "${TMP_DIR}"
}

trap cleanup EXIT

mkdir -p "${OUTPUT_DIR}"

render_preview() {
  local source_file="$1"
  local output_name="$2"

  rm -f "${TMP_DIR}"/*.png
  qlmanage -t -s 1600 -o "${TMP_DIR}" "${source_file}" >/dev/null

  local preview_file
  preview_file="${TMP_DIR}/$(basename "${source_file}").png"
  if [ ! -f "${preview_file}" ]; then
    printf 'ERROR: Preview was not generated for %s\n' "${source_file}" >&2
    exit 1
  fi

  cp "${preview_file}" "${OUTPUT_DIR}/${output_name}"
}

render_preview "${CIOS_ROOT}/site/index.html" "root.png"
render_preview "${CIOS_ROOT}/site/cios/index.html" "hub.png"
render_preview "${CIOS_ROOT}/site/cios/app/index.html" "app.png"
render_preview "${CIOS_ROOT}/site/cios/pricing/index.html" "pricing.png"
render_preview "${CIOS_ROOT}/site/cios/demo/index.html" "demo.png"

printf 'CIOS screenshot pack generated at %s\n' "${OUTPUT_DIR}"
