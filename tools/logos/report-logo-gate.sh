#!/usr/bin/env bash
set -euo pipefail
cd /workspace

report=sandbox-shots-tmp/logo-gate-final-report.log
required=sandbox-shots-tmp/required-outcomes-probe.log
derived=sandbox-shots-tmp/derive-logos.log
{
  echo "STATUS: COMPLETE when every fresh verification log below passes"
  echo "METRIC: score=sum(alpha/255*vivid)/count(alpha>0) on the normalized 128px tile"
  echo "SCORE_MIN: 0.727412; Visa 2021 to Toyota gap: 0.004590 (thin by construction)"
  echo
  echo "REQUIRED 13 ROWS"
  sed -n '/^slug\texpected/,/^YOUTUBE_HISTORICAL/p' "$required"
  echo
  grep -E '^(FINAL KEEP|DROP |REMOVED_FROM_51|ADDED )' "$derived"
  echo
  echo "COMMITS"
  git log -4 --format='%H %s'
  for name in verify layout playwright gain-probe-all; do
    path="sandbox-shots-tmp/$name.log"
    echo
    echo "$name.log ($(stat -c %y "$path" 2>/dev/null || echo MISSING))"
    tail -3 "$path" 2>/dev/null || true
  done
} > "$report"
cat "$report"
