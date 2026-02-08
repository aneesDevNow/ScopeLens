#!/bin/bash
# Script to verify self-hosted Supabase setup
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0"
API="https://scopelens-supabase.membercore.dev/pg/query"

run_sql() {
  local desc="$1"
  local sql="$2"
  echo -n "$desc... "
  result=$(curl -s --max-time 30 "$API" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -X POST \
    -d "{\"query\": $(echo "$sql" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}")
  if echo "$result" | grep -q '"error"'; then
    echo "ERROR: $result"
  else
    echo "$result"
  fi
}

echo "=== Verifying Self-Hosted Supabase ==="

echo -e "\n1. Checking Tables & Row Counts:"
run_sql "Table Counts" "
SELECT relname as table, n_live_tup as rows 
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
ORDER BY relname;"

echo -e "\n2. Checking Admin Profile:"
run_sql "Admin User" "SELECT id, email, role, first_name FROM public.profiles WHERE role = 'admin';"

echo -e "\n3. Checking Plans:"
run_sql "Plans" "SELECT name, slug, price_monthly FROM public.plans ORDER BY price_monthly;"

echo -e "\n4. Checking ZeroGPT Token:"
run_sql "ZeroGPT" "SELECT id, label, is_active FROM public.zerogpt_accounts;"

echo -e "\n5. Checking RLS Policies:"
run_sql "RLS Policies" "SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;"

echo -e "\n=== Verification Complete ==="
