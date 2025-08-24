#!/usr/bin/env bash
# build_release.sh - Build mcpack files for release (no local sync)
set -euo pipefail

OUTPUT_DIR="${OUTPUT_DIR:-releases}"
PACK_DIR="${1:-}"

if [[ -z "${PACK_DIR}" ]]; then
  echo "Usage: $0 <addon_directory>"
  exit 1
fi

if [[ ! -d "${PACK_DIR}" ]]; then
  echo "PACK_DIR not found: ${PACK_DIR}"
  exit 1
fi

if [[ ! -f "${PACK_DIR}/manifest.json" ]]; then
  echo "manifest.json not found: ${PACK_DIR}/manifest.json"
  exit 1
fi

# Get pack name from manifest or use folder name
if command -v jq >/dev/null 2>&1; then
  PACK_NAME="$(jq -r '.header.name // empty' "${PACK_DIR}/manifest.json")"
  [[ -z "${PACK_NAME}" || "${PACK_NAME}" == "null" ]] && PACK_NAME="$(basename "${PACK_DIR}")"
else
  PACK_NAME="$(basename "${PACK_DIR}")"
fi

mkdir -p "${OUTPUT_DIR}"

# Create .mcpack (zip file)
MC_PACK="${OUTPUT_DIR}/${PACK_NAME}.mcpack"
tmp_zip="$(mktemp -u).zip"

(
  cd "${PACK_DIR}"
  zip -qr "${tmp_zip}" .
)

mv "${tmp_zip}" "${MC_PACK}"
echo "✅ .mcpack created: ${MC_PACK}"