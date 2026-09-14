#!/usr/bin/env bash
set -euo pipefail
cd /workspace
mkdir -p sandbox-shots-tmp
pnpm --filter @gainmaps/web typecheck 2>&1 | tee sandbox-shots-tmp/gate-typecheck.log
npx tsx tools/logos/probe-required-outcomes.ts > sandbox-shots-tmp/required-outcomes-probe.log
bash tools/logos/review-logo-task.sh > sandbox-shots-tmp/review.log
