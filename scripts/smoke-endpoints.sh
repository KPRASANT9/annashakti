#!/usr/bin/env bash
# Smoke Annashakti pages + APIs after Next.js is actually deployed.
# Usage: ./scripts/smoke-endpoints.sh https://annashakti.vercel.app
set -euo pipefail

BASE="${1:-http://127.0.0.1:3000}"
BASE="${BASE%/}"
fail=0

check() {
  local path="$1" expect_code="$2" expect_substr="${3:-}"
  local url="$BASE$path"
  local tmp code body
  tmp="$(mktemp)"
  code="$(curl -sS -o "$tmp" -w '%{http_code}' "$url" || echo 000)"
  body="$(head -c 400 "$tmp" | tr '\n' ' ')"
  rm -f "$tmp"
  if [[ "$code" != "$expect_code" ]]; then
    echo "FAIL $path → HTTP $code (want $expect_code) $body"
    fail=1
    return
  fi
  if [[ -n "$expect_substr" ]] && ! grep -q "$expect_substr" <<<"$body"; then
    echo "FAIL $path → missing '$expect_substr' in: $body"
    fail=1
    return
  fi
  echo "OK   $path → $code"
}

echo "Smoke against $BASE"
echo "--- pages ---"
check "/" 200 "Annashakti"
check "/lab" 200
check "/loop" 200
check "/thali" 200
check "/whoop" 200
check "/science" 200

echo "--- apis ---"
check "/api/whoop/status" 200 '"ok":true'
check "/api/synthesize?demo=1" 200 '"ok":true'
check "/api/compose?demo=1&frontier=0&seed=42" 200 '"ok":true'
check "/api/loop" 200 '"ok":true'

# cybernetics only after PR #2 is on this deployment
code="$(curl -sS -o /tmp/cyber_smoke.json -w '%{http_code}' "$BASE/api/cybernetics" || echo 000)"
if [[ "$code" == "200" ]]; then
  if grep -q '"ok":true' /tmp/cyber_smoke.json; then
    echo "OK   /api/cybernetics → 200 suite present"
  else
    echo "FAIL /api/cybernetics → 200 but not ok"
    fail=1
  fi
elif [[ "$code" == "404" ]]; then
  echo "SKIP /api/cybernetics → 404 (merge PR #2 for this host)"
else
  echo "FAIL /api/cybernetics → $code"
  fail=1
fi

# static source must NOT be public once Next is the builder
src_code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/app/layout.tsx" || echo 000)"
if [[ "$src_code" == "200" ]]; then
  echo "FAIL /app/layout.tsx is public — still a static git publish"
  fail=1
else
  echo "OK   /app/layout.tsx not served ($src_code)"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "SMOKE FAILED"
  exit 1
fi
echo "SMOKE PASSED"
