#!/usr/bin/env bash
set -euo pipefail

echo "RUN pnpm -C packages/gainmap test"
pnpm -C packages/gainmap test
echo "RUN pnpm -C apps/web typecheck"
pnpm -C apps/web typecheck
echo "RUN pnpm -C apps/web test"
pnpm -C apps/web test
echo "RUN pnpm -C apps/web lint"
pnpm -C apps/web lint
echo "RUN NODE_ENV=production pnpm -C apps/web build"
NODE_ENV=production pnpm -C apps/web build
echo "VERIFY ALL PASS $(date -u +%Y-%m-%dT%H:%M:%SZ)"
