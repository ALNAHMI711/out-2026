#!/usr/bin/env bash
set -u
ROOT="${1:-.}"; ISSUES=0
scan(){ local label="$1" pattern="$2"; shift 2; if grep -RInE --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' "$pattern" "$@" 2>/dev/null; then echo "❌ $label"; ISSUES=$((ISSUES+1)); else echo "✅ $label"; fi; }
echo "🔍 Static scan: $ROOT"
scan "Possible broken API template literal" '/api/[A-Za-z0-9_/-]+\?\$\{' "$ROOT/app" "$ROOT/components" "$ROOT/lib"
scan "useState callback contains side-effect API" 'useState\(\(\) *=> *\{' "$ROOT/app" "$ROOT/components"
scan "Hard-coded secret pattern" '(sk_live|sk_test|SUPABASE_SERVICE_ROLE_KEY[[:space:]]*=[[:space:]]*['"'"'"][^'"'"'"]+|password[[:space:]]*=[[:space:]]*['"'"'"][^'"'"'"]{8,})' "$ROOT/app" "$ROOT/components" "$ROOT/lib"
echo "Checking client-hook files..."
while IFS= read -r file; do
  if grep -qE 'useState|useEffect|onClick' "$file" && ! head -n 3 "$file" | grep -q "'use client'"; then echo "⚠️ Missing 'use client': $file"; ISSUES=$((ISSUES+1)); fi
done < <(find "$ROOT/components" -type f \( -name '*.jsx' -o -name '*.tsx' \) 2>/dev/null)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if (( ISSUES > 0 )); then echo "❌ $ISSUES issue(s)"; exit 1; fi
echo "✅ Static scan clean"
