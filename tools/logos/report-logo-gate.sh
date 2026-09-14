#!/usr/bin/env bash
set -euo pipefail
cd /workspace

report=sandbox-shots-tmp/logo-gate-final-report.log
{
  echo "STATUS: STOPPED — required gate infeasible; STEPS 3–6 unperformed"
  echo "METRIC: score=sum(alpha/255*vivid)/count(alpha>0) on normalized 128px shipped tile"
  echo "PROVISIONAL BEST CUT: 0.707314 (Tesla 0.683965 / McDonald's 0.730662; measurable rows only)"
  echo "FINAL KEEP COUNT: unchanged shipped count 51"
  echo "FULL DROP LIST: unavailable; no production gate or asset derivation"
  echo "SHIPPED 51 STATUS CHANGES: none (derivation stopped)"
  echo "COMMIT: $(git rev-parse HEAD)"
  echo ""
  echo "REQUIRED 13 ROWS (slug score meanAlpha solidFraction inkPx source file decision/error)"
  cat sandbox-shots-tmp/required-outcomes-probe.log
  echo ""
  echo "NORMALIZED INK DIAGNOSTIC"
  cat sandbox-shots-tmp/normalized-ink-diagnostic.log
  echo ""
  echo "VISA RESOLUTION"
  cat sandbox-shots-tmp/visa-resolver.log
  for name in verify layout playwright gain-probe-all; do
    path="sandbox-shots-tmp/$name.log"
    echo ""
    echo "$name.log: STALE/NOT RERUN (STEP 6 unperformed)"
    if [[ ! -f "$path" ]]; then
      echo "MISSING"
      continue
    fi
    tail -3 "$path"
  done
} > "$report"
cat "$report"
