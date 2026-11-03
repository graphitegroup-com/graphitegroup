#!/usr/bin/env bash
# One small read so Supabase's free plan counts the project as active. Free
# projects pause after 7 days without activity and have to be restored by hand.
# Uses the publishable key, which is safe to expose; row-level security returns
# no rows to it, and that's fine: the query itself is the activity.
set -euo pipefail

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_PUBLISHABLE_KEY:-}" ]; then
  echo "::notice::SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY isn't set yet, so there's nothing to keep awake."
  exit 0
fi

# The body goes to a temp file, not /dev/null: curl empties its output file
# before each retry, and /dev/null can't be emptied, so retries would fail.
body=$(mktemp)
trap 'rm -f "$body"' EXIT
code=$(curl -sS -o "$body" -w '%{http_code}' --retry 3 --retry-delay 10 \
  -H "apikey: ${SUPABASE_PUBLISHABLE_KEY}" \
  "${SUPABASE_URL%/}/rest/v1/settings?select=key&limit=1") || true
if [ -z "$code" ] || [ "$code" = "000" ]; then code="no answer"; fi

if [ "$code" != "200" ]; then
  if [ "$code" = "no answer" ]; then what="Supabase didn't answer"; else what="Supabase answered HTTP ${code}"; fi
  echo "::error::${what}. If the project is paused, restore it from the Supabase dashboard; otherwise check SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY."
  exit 1
fi
echo "Supabase answered 200. The project stays active."
