#!/usr/bin/env bash
set -euo pipefail

node tools/check-layout.mjs > sandbox-shots-tmp/layout.log 2>&1
echo "LAYOUT ALL PASS" >> sandbox-shots-tmp/layout.log
node sandbox-shots-tmp/pw-verify.mjs > sandbox-shots-tmp/playwright.log 2>&1
node tools/logos/probe-gain-all.mjs > sandbox-shots-tmp/gain-probe-all.log 2>&1
echo "GAIN PROBE ALL PASS" >> sandbox-shots-tmp/gain-probe-all.log
node tools/is-agentic/local-audit.mjs > sandbox-shots-tmp/is-agentic-after.log 2>&1
echo "IS AGENTIC ALL PASS" >> sandbox-shots-tmp/is-agentic-after.log
