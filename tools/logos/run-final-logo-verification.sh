#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

mkdir -p sandbox-shots-tmp
: > sandbox-shots-tmp/verify.log
{
  echo '$ pnpm --filter gainmap test'
  pnpm --filter gainmap test
  echo '$ pnpm --filter @gainmaps/web typecheck'
  pnpm --filter @gainmaps/web typecheck
  echo '$ pnpm --filter @gainmaps/web test'
  pnpm --filter @gainmaps/web test
  echo '$ pnpm --filter @gainmaps/web lint'
  pnpm --filter @gainmaps/web lint
  echo '$ pnpm --filter @gainmaps/web build'
  pnpm --filter @gainmaps/web build
} 2>&1 | tee sandbox-shots-tmp/verify.log

node tools/logos/probe-gain-all.mjs 2>&1 | tee sandbox-shots-tmp/gain-probe-all.log

fuser -k 3000/tcp 2>/dev/null || true
setsid -f sh -c 'echo $$ > sandbox-shots-tmp/web-server.pid; exec pnpm --filter @gainmaps/web start' \
  </dev/null > sandbox-shots-tmp/web-server.log 2>&1
server_pid=$(cat sandbox-shots-tmp/web-server.pid)

for attempt in $(seq 1 60); do
  if curl --fail --silent --output /dev/null http://127.0.0.1:3000/logos; then
    break
  fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    cat sandbox-shots-tmp/web-server.log
    exit 1
  fi
  sleep 1
done
curl --fail --silent --output /dev/null http://127.0.0.1:3000/logos

node tools/check-layout.mjs 2>&1 | tee sandbox-shots-tmp/layout.log
node sandbox-shots-tmp/pw-verify.mjs 2>&1 | tee sandbox-shots-tmp/playwright.log
