#!/usr/bin/env bash
# Gainmaps by Kirk Strobeck – https://gainmaps.com
#
# Verifies every apps/web/public/logos/<slug>/ directory referenced by
# COMPANIES has the full expected file set (SVG + 4 gainmap widths + alias +
# 4 SDR widths + alias). Prints one line per directory and a final tally.
#
# Run from the repo root: bash tools/logos/verify-logo-assets.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

ROOT="apps/web/public/logos"
FILES=(logo.svg logo-gainmap-128.jpg logo-gainmap-256.jpg logo-gainmap-512.jpg logo-gainmap-1024.jpg logo-gainmap.jpg logo-sdr-128.jpg logo-sdr-256.jpg logo-sdr-512.jpg logo-sdr-1024.jpg logo-sdr.jpg)

total=0
complete=0
for dir in "$ROOT"/*/; do
  slug=$(basename "$dir")
  total=$((total + 1))
  missing=()
  for f in "${FILES[@]}"; do
    [ -f "$dir$f" ] || missing+=("$f")
  done
  if [ ${#missing[@]} -eq 0 ]; then
    complete=$((complete + 1))
    echo "OK    $slug"
  else
    echo "MISS  $slug  missing: ${missing[*]}"
  fi
done

echo ""
echo "$complete / $total directories complete"
