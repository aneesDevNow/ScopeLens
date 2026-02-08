#!/bin/bash
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0"
API="https://scopelens-supabase.membercore.dev/pg/query"

result=$(curl -s --max-time 15 "$API" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Content-Type: application/json" -X POST -d '{"query": "SELECT id, email, role FROM public.profiles WHERE role = '"'"'reseller'"'"';"}' )
if echo "$result" | grep -q "resellertest@scope.lens"; then
  echo "User exists: $result"
else
  echo "User does NOT exist or has wrong role: $result"
fi
