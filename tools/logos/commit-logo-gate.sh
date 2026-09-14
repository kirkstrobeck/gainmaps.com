#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

coauthor='Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>'
session='Claude-Session: https://claude.ai/code/session_019SmXoXk75QVumT8wb3bv2s'
trailers="$coauthor
$session"

if [[ ${1:-} == "--rewrite" ]]; then
  expected=(
    "fix(web): track share menu callbacks"
    "fix(logos): reject unprobed gainmap backgrounds"
    "feat(logos): publish audited logo set"
    "feat(logos): derive audit gate from required outcomes"
  )
  for offset in 0 1 2 3; do
    actual=$(git log -1 --format='%s' "HEAD~$offset")
    if [[ $actual != "${expected[$offset]}" ]]; then
      echo "refusing rewrite: HEAD~$offset is $actual" >&2
      exit 1
    fi
  done
  git reset --mixed HEAD~4
fi

git reset
git add \
  tools/logos/audit-required-outcomes.ts \
  tools/logos/commit-logo-gate.sh \
  tools/logos/ink-metric.ts \
  tools/logos/report-logo-gate.sh \
  tools/logos/review-final-logo-gate.sh \
  tools/logos/run-audit.ts \
  tools/logos/sources.ts
git commit -m "feat(logos): derive audit gate from required outcomes" -m "$trailers"

git add \
  apps/web/app/globals.css \
  apps/web/components/seam-compare-logo.tsx \
  apps/web/lib/logos/companies.ts \
  apps/web/lib/logos/logo-strip.ts \
  apps/web/public/logos \
  apps/web/test/app/api-logos.test.ts \
  apps/web/test/app/logo-strip.test.tsx \
  apps/web/test/app/logos-pages.test.tsx \
  apps/web/test/components/seam-compare-logo.test.tsx \
  apps/web/test/lib/require-company.test.ts \
  tools/logos/build-logos.ts \
  tools/logos/derive-logo-assets.ts
git commit -m "feat(logos): publish audited logo set" -m "$trailers"

git add tools/logos/probe-gain-all.mjs tools/logos/run-final-logo-verification.sh
git commit -m "fix(logos): reject unprobed gainmap backgrounds" -m "$trailers"

git add apps/web/components/site-nav.tsx
git commit -m "fix(web): track share menu callbacks" -m "$trailers"
