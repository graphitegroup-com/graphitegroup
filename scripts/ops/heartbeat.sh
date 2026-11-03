#!/usr/bin/env bash
# GitHub switches off scheduled workflows in a public repo after 60 days with
# no commits, which would silently stop the keep-awake and backup jobs over a
# summer. When the repo has been quiet for HEARTBEAT_AFTER_DAYS (default 50),
# record a one-line heartbeat commit. Commits pushed with the workflow's own
# token don't trigger other workflows, so this never redeploys the site.
set -euo pipefail

after="${HEARTBEAT_AFTER_DAYS:-50}"
last=$(git log -1 --format=%ct)
quiet=$(( ( $(date +%s) - last ) / 86400 ))

if [ "$quiet" -lt "$after" ]; then
  echo "Last commit was ${quiet} days ago; no heartbeat needed."
  exit 0
fi

mkdir -p .github
date -u +%Y-%m-%dT%H:%M:%SZ > .github/heartbeat
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add .github/heartbeat
git commit -q -m "Heartbeat after ${quiet} quiet days, so scheduled jobs stay on [skip ci]"
git push -q
echo "Recorded a heartbeat after ${quiet} quiet days."
