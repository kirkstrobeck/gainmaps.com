#!/usr/bin/env bash
set -euo pipefail
cd /workspace

if (( $# > 0 )); then
  for path in "$@"; do
    echo "FILE $path"
    sed -n '1,260p' "$path"
  done
  exit 0
fi

for path in \
  tools/logos/sources.ts \
  tools/logos/build-logos.ts \
  tools/logos/backfill-logo-assets.ts \
  tools/logos/ink-metric.ts \
  tools/logos/run-audit.ts \
  tools/logos/logo-svg-normalize.ts \
  apps/web/lib/logos/companies.ts; do
  echo "FILE $path"
  sed -n '1,260p' "$path"
done

echo "PACKAGE SCRIPTS"
node -e 'for (const p of ["package.json","apps/web/package.json","packages/gainmap/package.json"]) { const j=require("./"+p); console.log(p, j.scripts) }'

echo "TOOL TEST CONFIG"
rg -n "vitest|tools/logos|inkMetric|shouldKeep|site-nav" --glob '*.{ts,tsx,js,mjs,json}' .

echo "SOURCE SIZES"
find apps/web/public/logos -name logo.source.svg -printf '%s %p\n' | sort -n

echo "CURRENT COMMIT"
git rev-parse HEAD
