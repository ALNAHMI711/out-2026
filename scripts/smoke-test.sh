#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://localhost:3000}"
COOKIE_JAR="${TMPDIR:-/tmp}/out-smoke-cookies.txt"
PASS=0; FAIL=0; SKIP=0
trap 'rm -f "$COOKIE_JAR"' EXIT
pass(){ echo "✅ $1"; PASS=$((PASS+1)); }
fail(){ echo "❌ $1"; FAIL=$((FAIL+1)); }
skip(){ echo "⏭️  $1"; SKIP=$((SKIP+1)); }
status(){ curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$@"; }
check(){ local n="$1" e="$2" a="$3"; [[ "$a" == "$e" ]] && pass "$n (HTTP $a)" || fail "$n (expected $e, got $a)"; }

echo "━━━ OUT 2026 Smoke Test: $BASE_URL ━━━"
check "Homepage" 200 "$(status "$BASE_URL/")"
check "Shop" 200 "$(status "$BASE_URL/shop")"
check "Products API" 200 "$(status "$BASE_URL/api/products?limit=5")"
if curl -fsS --max-time 15 "$BASE_URL/api/products?limit=5" | grep -q '"products"'; then pass "Products JSON structure"; else fail "Products JSON structure"; fi

check "Stats protected" 401 "$(status "$BASE_URL/api/stats")"
check "Orders GET protected" 401 "$(status "$BASE_URL/api/orders")"
check "POD status protected" 401 "$(status "$BASE_URL/api/pod/status")"
GEN_STATUS="$(status -X POST "$BASE_URL/api/designs/generate" -H 'Content-Type: application/json' --data '{}')"
[[ "$GEN_STATUS" == 401 || "$GEN_STATUS" == 400 ]] && pass "Design generation blocked/validated without auth (HTTP $GEN_STATUS)" || fail "Design generation protection (HTTP $GEN_STATUS)"

if [[ -z "${OUT_TEST_PASSWORD:-}" ]]; then skip "Authenticated API tests (set OUT_TEST_PASSWORD)"; else
  LOGIN="$(curl -fsS --max-time 15 -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" -H 'Content-Type: application/json' --data "$(printf '{"password":"%s"}' "$OUT_TEST_PASSWORD")" || true)"
  if grep -q '"success":true' <<<"$LOGIN"; then
    pass "Login"
    check "Stats with auth" 200 "$(curl -sS -b "$COOKIE_JAR" -o /dev/null -w '%{http_code}' --max-time 15 "$BASE_URL/api/stats")"
    check "POD status with auth" 200 "$(curl -sS -b "$COOKIE_JAR" -o /dev/null -w '%{http_code}' --max-time 15 "$BASE_URL/api/pod/status")"
    check "Orders GET with auth" 200 "$(curl -sS -b "$COOKIE_JAR" -o /dev/null -w '%{http_code}' --max-time 15 "$BASE_URL/api/orders")"
  else fail "Login"; fi
fi

EMPTY_ORDER="$(curl -sS --max-time 15 -X POST "$BASE_URL/api/orders" -H 'Content-Type: application/json' --data '{}' || true)"
grep -q '"error"' <<<"$EMPTY_ORDER" && pass "Invalid order rejected" || fail "Invalid order accepted"

HEADERS="$(curl -sSI --max-time 15 "$BASE_URL/")"
if grep -qiE 'x-frame-options|x-content-type-options|content-security-policy' <<<"$HEADERS"; then pass "Security headers present"; else skip "Security headers not detected"; fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Passed: $PASS | Failed: $FAIL | Skipped: $SKIP"
(( FAIL == 0 ))
