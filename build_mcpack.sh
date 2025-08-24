#!/usr/bin/env bash
# build_mcpack.sh
# Script to package Bedrock addon into .mcpack from WSL and deploy to behavior_packs for development
set -euo pipefail

# ────────────────────────────
# Configuration (modify as needed)
# ────────────────────────────
PACK_DIR="${1:-MyBP}"           # Addon folder (containing manifest.json)
OUTPUT_DIR="${OUTPUT_DIR:-$HOME/builds}"  # .mcpack output destination
AUTO_IMPORT="${AUTO_IMPORT:-false}"   # Set to true to automatically import .mcpack (launch)
RSYNC_DELETE="${RSYNC_DELETE:-true}"  # true: delete sync for safe overwrite
ZIP_NAME_OVERRIDE="${ZIP_NAME_OVERRIDE:-}" # Manual filename override if needed

# Windows username (auto-detected. If failed, manually pass WINUSER env var)
WINUSER="${WINUSER:-$(powershell.exe -NoProfile -Command '$env:USERNAME' 2>/dev/null | tr -d '\r' || true)}"
if [[ -z "${WINUSER}" ]]; then
  echo "Could not retrieve Windows username. Please specify WINUSER environment variable."
  echo "Example: WINUSER=yourname ./build_mcpack.sh"
  exit 1
fi

# Bedrock (UWP) behavior_packs directory - auto-detect Minecraft package
MINECRAFT_PACKAGE_DIR="/mnt/c/Users/${WINUSER}/AppData/Local/Packages"
MINECRAFT_DIR=""
if [[ -d "${MINECRAFT_PACKAGE_DIR}" ]]; then
  # Look for any Microsoft.MinecraftUWP package
  MINECRAFT_DIR=$(find "${MINECRAFT_PACKAGE_DIR}" -maxdepth 1 -name "Microsoft.MinecraftUWP_*" -type d | head -n 1)
fi

if [[ -n "${MINECRAFT_DIR}" ]]; then
  BP_DIR="${MINECRAFT_DIR}/LocalState/games/com.mojang/development_behavior_packs"
else
  # Fallback to common package ID
  BP_DIR="/mnt/c/Users/${WINUSER}/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs"
fi

# ────────────────────────────
# Prerequisites check
# ────────────────────────────
if [[ ! -d "${PACK_DIR}" ]]; then
  echo "PACK_DIR not found: ${PACK_DIR}"
  exit 1
fi
if [[ ! -f "${PACK_DIR}/manifest.json" ]]; then
  echo "manifest.json not found: ${PACK_DIR}/manifest.json"
  exit 1
fi

# Use manifest.header.name as pack name if jq is available (otherwise use folder name)
if command -v jq >/dev/null 2>&1; then
  PACK_NAME="$(jq -r '.header.name // empty' "${PACK_DIR}/manifest.json")"
  [[ -z "${PACK_NAME}" || "${PACK_NAME}" == "null" ]] && PACK_NAME="$(basename "${PACK_DIR}")"
else
  PACK_NAME="$(basename "${PACK_DIR}")"
fi

mkdir -p "${OUTPUT_DIR}"

# Output filename
if [[ -n "${ZIP_NAME_OVERRIDE}" ]]; then
  MC_PACK="${OUTPUT_DIR}/${ZIP_NAME_OVERRIDE%.mcpack}.mcpack"
else
  MC_PACK="${OUTPUT_DIR}/${PACK_NAME}.mcpack"
fi

# ────────────────────────────
# 1) Create .mcpack (zip)
#    - Contents are files under PACK_DIR (top level should contain manifest.json)
# ────────────────────────────
tmp_zip="$(mktemp -u).zip"
(
  cd "${PACK_DIR}"
  # If zip is missing: sudo apt-get install -y zip
  zip -qr "${tmp_zip}" .
)
mv "${tmp_zip}" "${MC_PACK}"

echo "✅ .mcpack created: ${MC_PACK}"

# ────────────────────────────
# 2) Sync to behavior_packs for development (immediate testing)
# ────────────────────────────
if [[ ! -d "${BP_DIR}" ]]; then
  echo "⚠️ Bedrock behavior_packs directory not found:"
  echo "   ${BP_DIR}"
  echo "   Start Minecraft (UWP) once and create a world to generate this directory."
else
  DEST_DIR="${BP_DIR}/${PACK_NAME}"
  if command -v rsync >/dev/null 2>&1; then
    # rsync synchronization (fast & differential)
    if [[ "${RSYNC_DELETE}" == "true" ]]; then
      rsync -a --delete "${PACK_DIR}/" "${DEST_DIR}/"
    else
      rsync -a "${PACK_DIR}/" "${DEST_DIR}/"
    fi
  else
    # If rsync is not available, use cp -r
    rm -rf "${DEST_DIR}"
    mkdir -p "${DEST_DIR}"
    cp -r "${PACK_DIR}/." "${DEST_DIR}/"
  fi
  echo "🧪 Sync completed: ${DEST_DIR}"
  echo "   → Enable '${PACK_NAME}' in world settings under 'Behavior Packs' for testing."
fi

# ────────────────────────────
# 3) Optional: Auto-import .mcpack (launch Minecraft)
#    - Enabled with AUTO_IMPORT=true
# ────────────────────────────
if [[ "${AUTO_IMPORT}" == "true" ]]; then
  # Call Windows from WSL to launch .mcpack
  powershell.exe -NoProfile -Command "Start-Process -FilePath \"$(wslpath -w "${MC_PACK}")\"" >/dev/null 2>&1 || true
  echo "🚀 Launched .mcpack (Minecraft will start and import the pack)"
fi

echo "🎉 Complete"
