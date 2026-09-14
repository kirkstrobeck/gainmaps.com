#!/usr/bin/env bash
set -euo pipefail

repo_dir=/workspace
log_dir="$repo_dir/sandbox-shots-tmp"
mkdir -p "$log_dir"

cd "$repo_dir"
{
  echo "BEFORE"
  git status --short
} > "$log_dir/reset-status.log"

git status --short | awk '{
  status=substr($0,1,2)
  path=substr($0,4)
  if (path != "core" && path !~ /^sandbox-shots-tmp\//) {
    print status "\t" path
  }
}' > "$log_dir/reset-restored-paths.log"

git checkout -- .
git clean -fd apps/web/public/logos

{
  echo "AFTER"
  git status --short
} >> "$log_dir/reset-status.log"

cat "$log_dir/reset-status.log"
