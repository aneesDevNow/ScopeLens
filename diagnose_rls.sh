#!/bin/bash
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0"
API="https://scopelens-supabase.membercore.dev/pg/query"

run_sql() {
  local desc="$1"
  local sql="$2"
  echo "--- $desc ---"
  curl -s --max-time 30 "$API" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -X POST \
    -d "{\"query\": $(echo "$sql" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}"
  echo -e "\n"
}

run_sql "Check Profile for ID bf3a9beb-3567-4a67-9b5b-50da4632a67d" "SELECT * FROM public.profiles WHERE id = 'bf3a9beb-3567-4a67-9b5b-50da4632a67d';"
