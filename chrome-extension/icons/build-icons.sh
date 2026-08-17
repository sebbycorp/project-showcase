#!/usr/bin/env bash
# Regenerate the toolbar PNGs from toolbar-icon.svg.
#   brew install librsvg   # provides rsvg-convert
set -euo pipefail
cd "$(dirname "$0")"
for size in 16 32 48; do
  rsvg-convert --width="$size" --height="$size" \
    --output="icon${size}.png" toolbar-icon.svg
  echo "wrote icon${size}.png (${size}x${size})"
done
