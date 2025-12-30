#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="Tauri CLI Scheduler"

cd "$ROOT_DIR"

npm run build
npm run tauri -- build --bundles app

APP_PATH="$ROOT_DIR/src-tauri/target/release/bundle/macos/${APP_NAME}.app"
if [[ ! -d "$APP_PATH" ]]; then
  echo "App bundle not found: $APP_PATH" >&2
  exit 1
fi

VERSION=$(node -p "require('./src-tauri/tauri.conf.json').version")
ARCH=$(uname -m)
case "$ARCH" in
  arm64) ARCH_SUFFIX="aarch64";;
  x86_64) ARCH_SUFFIX="x64";;
  *) ARCH_SUFFIX="$ARCH";;
esac

DMG_DIR="$ROOT_DIR/src-tauri/target/release/bundle/dmg"
DMG_PATH="$DMG_DIR/${APP_NAME}_${VERSION}_${ARCH_SUFFIX}.dmg"

mkdir -p "$DMG_DIR"
rm -f "$DMG_PATH"

VOLICON="$ROOT_DIR/src-tauri/icons/app-icon-macos.icns"
CREATE_DMG="$ROOT_DIR/scripts/create-dmg/bundle_dmg.sh"

"$CREATE_DMG" \
  --volname "$APP_NAME" \
  --icon "${APP_NAME}.app" 180 170 \
  --app-drop-link 480 170 \
  --window-size 660 400 \
  --hide-extension "${APP_NAME}.app" \
  --volicon "$VOLICON" \
  "$DMG_PATH" \
  "$APP_PATH"
