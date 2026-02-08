#!/bin/bash
# Script to create missing tables and data on self-hosted Supabase
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0"
API="https://scopelens-supabase.membercore.dev/pg/query"

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

echo "=== Creating Missing Tables ==="

# 1. Tables
run_sql "profiles" "CREATE TABLE IF NOT EXISTS public.profiles (id uuid NOT NULL PRIMARY KEY, email text NOT NULL, first_name text, last_name text, institution text, role text DEFAULT 'user' CHECK (role IN ('user', 'reseller', 'admin')), avatar_url text, two_factor_enabled boolean DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), report_logo text);"

run_sql "plans" "CREATE TABLE IF NOT EXISTS public.plans (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE, price_monthly numeric(10,2) DEFAULT 0 NOT NULL, price_yearly numeric(10,2), scans_per_month integer DEFAULT 5 NOT NULL, features jsonb DEFAULT '[]'::jsonb, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), reseller_price_monthly numeric(10,2), reseller_price_yearly numeric(10,2), reseller_discount_percent integer DEFAULT 20);"

run_sql "subscriptions" "CREATE TABLE IF NOT EXISTS public.subscriptions (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid NOT NULL, plan_id uuid NOT NULL, status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')), current_period_start timestamptz DEFAULT now(), current_period_end timestamptz, scans_used integer DEFAULT 0, stripe_subscription_id text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());"

# 2. Enable RLS
echo ""
echo "=== Enabling RLS ==="
for tbl in profiles plans subscriptions; do
  run_sql "RLS on $tbl" "ALTER TABLE public.$tbl ENABLE ROW LEVEL SECURITY;"
done

# 3. RLS Policies
echo ""
echo "=== Creating RLS Policies ==="
run_sql "profiles read own" "CREATE POLICY \"Users can read own profile\" ON public.profiles FOR SELECT USING (auth.uid() = id);"
run_sql "profiles update own" "CREATE POLICY \"Users can update own profile\" ON public.profiles FOR UPDATE USING (auth.uid() = id);"
run_sql "profiles service insert" "CREATE POLICY \"Service role can manage profiles\" ON public.profiles FOR ALL USING (auth.role() = 'service_role');"
run_sql "plans read all" "CREATE POLICY \"Anyone can read plans\" ON public.plans FOR SELECT USING (true);"
run_sql "plans admin manage" "CREATE POLICY \"Service role can manage plans\" ON public.plans FOR ALL USING (auth.role() = 'service_role');"
run_sql "subscriptions read own" "CREATE POLICY \"Users can read own subs\" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);"
run_sql "subscriptions service" "CREATE POLICY \"Service role can manage subs\" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');"

# 4. Seed Seed Plans
echo ""
echo "=== Seeding Plans ==="
run_sql "Free plan" "INSERT INTO public.plans (name, slug, price_monthly, price_yearly, scans_per_month, features, reseller_price_monthly, reseller_price_yearly, reseller_discount_percent) VALUES ('Free', 'free', 0, 0, 1, '{\"PDF & DOCX support\": true, \"1 AI scan per month\": true, \"Standard report summary\": true, \"Basic plagiarism detection\": true}', 0, 0, 20) ON CONFLICT (name) DO NOTHING;"

run_sql "Starter plan" "INSERT INTO public.plans (name, slug, price_monthly, price_yearly, scans_per_month, features, reseller_price_monthly, reseller_price_yearly, reseller_discount_percent) VALUES ('Starter', 'starter', 12, 114, 15, '{\"Email support\": true, \"15 AI scans per month\": true, \"Detailed originality reports\": true, \"Advanced plagiarism detection\": true, \"Multi-format support (PDF, DOCX, TXT)\": true}', 8.40, 79.80, 30) ON CONFLICT (name) DO NOTHING;"

run_sql "Professional plan" "INSERT INTO public.plans (name, slug, price_monthly, price_yearly, scans_per_month, features, reseller_price_monthly, reseller_price_yearly, reseller_discount_percent) VALUES ('Professional', 'professional', 17, 161, 25, '{\"25 AI scans per month\": true, \"Deep content analysis\": true, \"Priority email support\": true, \"Export detailed PDF reports\": true, \"Sentence-level AI highlighting\": true}', 11.90, 112.70, 30) ON CONFLICT (name) DO NOTHING;"

run_sql "Institution plan" "INSERT INTO public.plans (name, slug, price_monthly, price_yearly, scans_per_month, features, reseller_price_monthly, reseller_price_yearly, reseller_discount_percent) VALUES ('Institution', 'institution', 59, 559, 100, '{\"100 AI scans per month\": true, \"Dedicated account manager\": true, \"Bulk upload & batch processing\": true, \"Full content integrity analysis\": true}', 41.30, 391.30, 30) ON CONFLICT (name) DO NOTHING;"

# 5. Create admin user (Retry)
echo ""
echo "=== Creating Admin User (Retry) ==="
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.SyUoeSlLj1rzQKPfOA1UjZQa2qnNx67Uc0xjjjP0m2E"
AUTH_API="https://scopelens-supabase.membercore.dev/auth/v1"

# Create admin user via admin API
admin_result=$(curl -s "$AUTH_API/admin/users" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "email": "technicalanees@gmail.com",
    "password": "Admin1234!",
    "email_confirm": true,
    "user_metadata": {"first_name": "Admin"}
  }')

admin_id=$(echo "$admin_result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
echo "  Admin user created: $admin_id"

# Set admin role in profiles
if [ -n "$admin_id" ] && [ "$admin_id" != "" ]; then
  # Wait for profile to be created by trigger
  echo "  Waiting for profile creation via trigger..."
  sleep 3
  
  # Update role
  role_result=$(run_sql "Set admin role" "UPDATE public.profiles SET role = 'admin', first_name = 'Admin' WHERE id = '$admin_id';")
  
  # If update failed (e.g. trigger didn't fire), insert manually
  if [[ ! "$role_result" == "OK" ]] || [[ "$role_result" == *"UPDATE 0"* ]]; then
     run_sql "Insert admin profile manually" "INSERT INTO public.profiles (id, email, first_name, role) VALUES ('$admin_id', 'technicalanees@gmail.com', 'Admin', 'admin') ON CONFLICT (id) DO UPDATE SET role='admin';"
  fi
fi

echo ""
echo "=== Verifying ==="
run_sql "Count profiles" "SELECT count(*) FROM public.profiles;"
run_sql "Count plans" "SELECT count(*) FROM public.plans;"

echo ""
echo "=== DONE ==="
