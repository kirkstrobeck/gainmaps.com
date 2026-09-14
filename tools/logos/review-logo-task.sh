#!/usr/bin/env bash
set -euo pipefail
cd /workspace
log=sandbox-shots-tmp/excluded-logos.log

echo "REQUIRED OUTCOMES"
awk -F '\t' '$1 == "slug" { data = 1; next } data && $1 ~ /^(coca-cola|cisco|oracle|tesla|visa|google|mcdonalds|netflix|ikea|spotify|toyota|microsoft|youtube)$/ {print}' "$log"

echo "DECISION COUNTS"
awk -F '\t' '$1 == "slug" { data = 1; next } data { count[$16]++ } END {for (key in count) print key, count[key]}' "$log" | sort

echo "CANDIDATE DROP LIST"
awk -F '\t' '$1 == "slug" { data = 1; next } data && $16 == "DROP" {print $1}' "$log" | paste -sd, -

echo "FAILURE ROWS"
awk -F '\t' '$1 == "slug" { data = 1; next } data && ($16 == "FETCH-FAIL" || $16 == "ERROR") {print}' "$log"

echo "REFETCHED SOURCE SIZES"
for slug in toyota spotify ikea qualcomm mastercard; do
  path="apps/web/public/logos/$slug/logo.source.svg"
  if [[ -f "$path" ]]; then wc -c "$path"; fi
done

echo "CACHE COUNT"
find sandbox-shots-tmp/raw-logo-sources -type f -name '*.svg' | wc -l

echo "CODE LINE COUNTS"
wc -l tools/logos/{ink-metric,pixel-stats,svg-source,run-audit,logo-pipeline,build-logos,backfill-logo-assets}.ts

echo "GIT STATUS"
git status --short
echo "DIFF STAT"
git diff --stat
echo "FORBIDDEN ELSE IN NEW FILES"
rg -n '\belse\b' tools/logos/{ink-metric,pixel-stats,svg-source,run-audit}.ts || true
