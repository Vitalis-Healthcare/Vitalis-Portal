#!/usr/bin/env bash
# build-cashflow-snapshot.sh
# Generates cashflow-snapshot.md — every cashflow-relevant file in the
# repo concatenated into one markdown document that can be uploaded to
# a new Claude conversation. This saves enormous budget by eliminating
# round-trips where Claude asks the user to cat / grep files.
#
# Usage:
#   cd ~/Documents/Vitalis-Portal
#   bash build-cashflow-snapshot.sh
#
# Output: cashflow-snapshot.md in the current directory.

set -euo pipefail

REPO="$HOME/Documents/Vitalis-Portal"
OUT="$REPO/cashflow-snapshot.md"
cd "$REPO"

# Files to include. Add/remove as the module grows.
FILES=(
  # Dashboard
  "app/(dashboard)/cashflow/page.tsx"
  "app/(dashboard)/cashflow/CashflowDashboard.tsx"
  "app/(dashboard)/cashflow/layout.tsx"
  "app/(dashboard)/cashflow/editorial-theme.ts"
  "app/(dashboard)/cashflow/category-groups.ts"

  # Forecast (The outlook)
  "app/(dashboard)/cashflow/forecast/page.tsx"

  # Transactions (The daybook)
  "app/(dashboard)/cashflow/transactions/page.tsx"
  "app/(dashboard)/cashflow/transactions/TransactionsClient.tsx"

  # Rules (Standing orders)
  "app/(dashboard)/cashflow/rules/page.tsx"
  "app/(dashboard)/cashflow/rules/RulesClient.tsx"

  # Settings (The almanac)
  "app/(dashboard)/cashflow/settings/page.tsx"
  "app/(dashboard)/cashflow/settings/CategoriesManager.tsx"

  # API routes
  "app/api/cashflow/dashboard/route.ts"
  "app/api/cashflow/forecast/route.ts"
  "app/api/cashflow/forecast/[id]/route.ts"
  "app/api/cashflow/categories/route.ts"
  "app/api/cashflow/actuals/route.ts"
  "app/api/cashflow/transactions/route.ts"
  "app/api/cashflow/rules/route.ts"

  # Shared lib
  "lib/cashflow/editorial-theme.ts"
  "lib/cashflow/auth.ts"
  "lib/supabase/service.ts"

  # Sidebar (for nav link patching)
  "components/layout/Sidebar.tsx"

  # Package
  "package.json"
)

echo "# Vitalis Portal — Cashflow Module Snapshot" > "$OUT"
echo "" >> "$OUT"
echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')" >> "$OUT"
echo "Repo HEAD: $(git rev-parse --short HEAD) on $(git rev-parse --abbrev-ref HEAD)" >> "$OUT"
echo "" >> "$OUT"
echo "This is a concatenation of every cashflow-relevant source file." >> "$OUT"
echo "Upload alongside the handover doc to give the next Claude session" >> "$OUT"
echo "complete codebase context without round-tripping file contents." >> "$OUT"
echo "" >> "$OUT"
echo "---" >> "$OUT"
echo "" >> "$OUT"

INCLUDED=0
MISSING=0

# Also dump the cashflow-related supabase schema (if we have it)
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "## \`$f\`" >> "$OUT"
    echo "" >> "$OUT"
    # Detect language for fenced code block
    case "$f" in
      *.ts|*.tsx) LANG=typescript ;;
      *.js|*.jsx) LANG=javascript ;;
      *.json) LANG=json ;;
      *.sql) LANG=sql ;;
      *.md) LANG=markdown ;;
      *) LANG= ;;
    esac
    echo "\`\`\`$LANG" >> "$OUT"
    cat "$f" >> "$OUT"
    echo "" >> "$OUT"
    echo "\`\`\`" >> "$OUT"
    echo "" >> "$OUT"
    INCLUDED=$((INCLUDED + 1))
  else
    echo "## \`$f\` — NOT FOUND" >> "$OUT"
    echo "" >> "$OUT"
    echo "_(File listed in snapshot manifest but not present in repo — may not exist yet.)_" >> "$OUT"
    echo "" >> "$OUT"
    MISSING=$((MISSING + 1))
  fi
done

# Append the cf_* schema description from Supabase if we have a schema dump
SCHEMA_HINT="$REPO/docs/cf-schema.sql"
if [ -f "$SCHEMA_HINT" ]; then
  echo "## \`docs/cf-schema.sql\`" >> "$OUT"
  echo "" >> "$OUT"
  echo "\`\`\`sql" >> "$OUT"
  cat "$SCHEMA_HINT" >> "$OUT"
  echo "" >> "$OUT"
  echo "\`\`\`" >> "$OUT"
else
  echo "## Schema reference" >> "$OUT"
  echo "" >> "$OUT"
  echo "No \`docs/cf-schema.sql\` in repo. Key tables referenced in code:" >> "$OUT"
  echo "" >> "$OUT"
  echo "- \`cf_settings\` — opening_cash, opening_date, week_start_dow" >> "$OUT"
  echo "- \`cf_categories\` — id, name, kind, type ('receipt'|'expense')" >> "$OUT"
  echo "- \`cf_bank_accounts\` — id, short_code (BOA-9113, BOA-8277, MT-3394, MT-6501, LEGACY), name, institution, account_number_last4, opening_balance, opening_date, is_active, sort_order" >> "$OUT"
  echo "- \`cf_transactions\` — id, txn_date, amount, description, category_id, deleted_at, created_at (legacy table, still live for daybook)" >> "$OUT"
  echo "- \`cf_forecast_items\` — id, category_id, bank_account_id (nullable), rule_id (nullable), forecast_date, amount, label, status ('planned'|'matched'|'missed'|'cancelled'), matched_actual_id (FK), created_at" >> "$OUT"
  echo "- \`cf_actual_items\` — id, category_id, bank_account_id (NOT NULL), actual_date, amount, description, reference, source ('manual'|'matched'|'imported'|'backfill'|'transfer'), matched_forecast_id (FK), import_batch_id, created_at" >> "$OUT"
  echo "- \`cf_weekly_actuals\` — week_ending, bank_account_id (composite PK), actual_cash (Friday bank balance anchor)" >> "$OUT"
  echo "- \`cf_recurring_rules\` — rule definitions for standing orders; rule save is currently broken, fix planned for v0.5.4" >> "$OUT"
  echo "" >> "$OUT"
fi

echo "---" >> "$OUT"
echo "" >> "$OUT"
echo "_Snapshot complete: $INCLUDED files included, $MISSING missing._" >> "$OUT"

SIZE=$(wc -c < "$OUT" | tr -d ' ')
LINES=$(wc -l < "$OUT" | tr -d ' ')

echo ""
echo "=============================================="
echo "  cashflow-snapshot.md generated"
echo "  Location: $OUT"
echo "  Size: $SIZE bytes, $LINES lines"
echo "  Files included: $INCLUDED / missing: $MISSING"
echo "=============================================="
echo ""
echo "Upload this file to the next Claude conversation along with the"
echo "handover markdown. It gives Claude full cashflow codebase context"
echo "without round-tripping cat/grep commands."
