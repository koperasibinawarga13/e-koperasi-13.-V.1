#!/usr/bin/env bash
set -euo pipefail

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick 'convert' not found. Install it first: sudo apt install imagemagick"
  exit 1
fi

SRC="$1"
OUT_DIR="public/icons"

if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
  echo "Usage: $0 path/to/source.png"
  exit 2
fi

mkdir -p "$OUT_DIR"

# helper to create square PNG with transparent background and centered content
make_icon(){
  size="$1"
  dest="$OUT_DIR/icon-${size}x${size}.png"
  convert "$SRC" -resize ${size}x${size} -background none -gravity center -extent ${size}x${size} "$dest"
  echo "Created $dest"
}

make_icon 72
make_icon 96
make_icon 128
make_icon 144
make_icon 152
make_icon 192
make_icon 384
make_icon 512

echo "All icons generated in $OUT_DIR"
