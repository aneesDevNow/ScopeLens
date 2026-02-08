#!/bin/bash
# Improved script to create test reseller user
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0"
API="https://scopelens-supabase.membercore.dev/pg/query"
AUTH_API="https://scopelens-supabase.membercore.dev/auth/v1"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.SyUoeSlLj1rzQKPfOA1UjZQa2qnNx67Uc0xjjjP0m2E"

run_sql() {
  local desc="$1"
  local sql="$2"
  echo -n "  $desc... "
  result=$(curl -s --max-time 30 "$API" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -X POST \
    -d "{\"query\": $(echo "$sql" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}")
  if echo "$result" | grep -q '"error"'; then
    echo "ERROR: $result"
  else
    echo "OK"
  fi
}

echo "=== Creating Reseller User ==="

# 1. Create user via admin API (idempotent - will return existing user if email exists, check response)
# Need to delete user first if exists to ensure password matches, or just assume it matches if exists.
# Let's delete it first to be clean.
echo "  Deleting existing user (if any)..."
# List user to get ID
list_result=$(curl -s "$AUTH_API/admin/users" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $SERVICE_KEY")
user_id=$(echo "$list_result" | grep -o '"id":"[^"]*","aud":"authenticated","role":"authenticated","email":"resellertest@scope.lens"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$user_id" ]; then
  echo "  Deleting user $user_id..."
  curl -s -X DELETE "$AUTH_API/admin/users/$user_id" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY"
fi

echo "  Creating user..."
reseller_result=$(curl -s "$AUTH_API/admin/users" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "email": "resellertest@scope.lens",
    "password": "Reseller1234!",
    "email_confirm": true,
    "user_metadata": {"first_name": "ResellerTest"}
  }')

reseller_id=$(echo "$reseller_result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
echo "  Reseller user created: $reseller_id"

if [ -n "$reseller_id" ] && [ "$reseller_id" != "" ]; then
  # Wait for profile trigger
  sleep 3
  
  # Ensure profile exists and has role
  echo "  Ensuring profile..."
  # Try update
  update_result=$(run_sql "Set reseller role" "UPDATE public.profiles SET role = 'reseller' WHERE id = '$reseller_id';")
  
  if [[ ! "$update_result" == "OK" ]] || [[ "$update_result" == *"UPDATE 0"* ]]; then
     echo "  Profile missing, inserting manually..."
     run_sql "Insert reseller profile" "INSERT INTO public.profiles (id, email, first_name, role) VALUES ('$reseller_id', 'resellertest@scope.lens', 'ResellerTest', 'reseller') ON CONFLICT (id) DO UPDATE SET role='reseller';"
  fi

  # Double check
  check_result=$(curl -s --max-time 15 "$API" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" -H "Content-Type: application/json" -X POST -d '{"query": "SELECT role FROM public.profiles WHERE id = '"'"$reseller_id"'"';"}' )
  echo "  Verification Result: $check_result"
fi

echo "=== Reseller User Ready ==="
