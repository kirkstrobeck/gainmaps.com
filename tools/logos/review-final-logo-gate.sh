#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

git reset
git add \
  apps/web/app/globals.css \
  apps/web/components/seam-compare-logo.tsx \
  apps/web/components/site-nav.tsx \
  apps/web/lib/logos/companies.ts \
  apps/web/lib/logos/logo-strip.ts \
  apps/web/public/logos \
  apps/web/test/app/api-logos.test.ts \
  apps/web/test/app/logo-strip.test.tsx \
  apps/web/test/app/logos-pages.test.tsx \
  apps/web/test/components/seam-compare-logo.test.tsx \
  apps/web/test/lib/require-company.test.ts \
  tools/logos/audit-required-outcomes.ts \
  tools/logos/build-logos.ts \
  tools/logos/commit-logo-gate.sh \
  tools/logos/derive-logo-assets.ts \
  tools/logos/ink-metric.ts \
  tools/logos/probe-gain-all.mjs \
  tools/logos/report-logo-gate.sh \
  tools/logos/review-final-logo-gate.sh \
  tools/logos/run-audit.ts \
  tools/logos/run-final-logo-verification.sh \
  tools/logos/sources.ts

{
  echo "FINAL STAGED DIFF CHECK (source files; fetched SVG bytes excluded)"
  git diff --cached --check -- . ':(exclude)apps/web/public/logos/**'
  echo "PASS"
  echo
  echo "FINAL STAGED DIFF STAT"
  git diff --cached --stat
  echo
  echo "FINAL STAGED PATHS"
  git diff --cached --name-status
} > sandbox-shots-tmp/review-final.log

cat sandbox-shots-tmp/review-final.log
git reset
